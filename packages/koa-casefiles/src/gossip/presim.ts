/**
 * Pre-Simulation Runner
 * 
 * Runs N ticks of background simulation before case generation.
 * This allows relationships and gossip to evolve, creating emergent state.
 */

import type { World, PlaceId, NPCId } from '../types.js';
import type { RNG } from '../kernel/rng.js';
import type {
    GossipState,
    CaseHistory,
    CaseSummary, // Added
} from './types.js';
import { initializeAffinities, tickProximity, tickAffinityDecay } from './relationships.js';
import { tickGossipPropagation, tickGossipDecay, spawnIncidentGossip } from './rumors.js'; // Added spawnIncidentGossip
import { applyHistoryToAffinities, recordCase, createGrudge } from './history.js'; // Added recordCase, createGrudge
import { GOSSIP_CONSTANTS } from './types.js';
import { PLACES } from '../world.js';

// ============================================================================
// State Initialization
// ============================================================================

export function initGossipState(
    world: World,
    history: CaseHistory
): GossipState {
    const npcIds = world.npcs.map(n => n.id);
    const affinities = initializeAffinities(npcIds);

    const state: GossipState = {
        affinities,
        activeGossip: [],
        tick: 0,
    };

    // Apply historical grudges/alliances to starting affinities
    applyHistoryToAffinities(state, history, 0);

    return state;
}

// ============================================================================
// Adjacency Map
// ============================================================================

function buildAdjacencyMap(): Map<PlaceId, PlaceId[]> {
    const map = new Map<PlaceId, PlaceId[]>();

    for (const place of PLACES) {
        map.set(place.id, [...place.adjacent]);
    }

    return map;
}

// ============================================================================
// Pre-Simulation Runner
// ============================================================================

/**
 * Run background simulation to evolve gossip state.
 * 
 * @param world - The world to simulate
 * @param history - Past case history
 * @param seed - RNG seed for determinism
 * @param ticks - Number of ticks to simulate (default: 200)
 */
export function runPreSimulation(
    world: World,
    history: CaseHistory,
    rng: RNG,
    ticks: number = GOSSIP_CONSTANTS.PRE_SIM_TICKS
): GossipState {
    const state = initGossipState(world, history);
    const adjacencyMap = buildAdjacencyMap();
    const allNpcIds = world.npcs.map(n => n.id);

    for (let tick = 0; tick < ticks; tick++) {
        state.tick = tick;

        // Simulate NPC locations (simplified - use schedule-based)
        const npcLocations = simulateNpcLocations(world, tick, rng);

        // Apply proximity effects
        tickProximity(state, npcLocations, tick);

        // Propagate gossip
        tickGossipPropagation(
            state,
            allNpcIds,
            npcLocations,
            adjacencyMap,
            rng,
            tick
        );

        // Decay gossip and affinities
        tickGossipDecay(state, tick);
        tickAffinityDecay(state, tick);
    }

    return state;
}

/**
 * Simulate where NPCs are during a tick.
 * Uses schedule as base, with some randomness.
 */
function simulateNpcLocations(
    world: World,
    tick: number,
    rng: RNG
): Map<NPCId, PlaceId> {
    const locations = new Map<NPCId, PlaceId>();

    // Map tick to window (simplified - 30 ticks per window)
    const windowIndex = Math.floor(tick / 30) % 6;
    const windowId = `W${windowIndex + 1}`;

    for (const npc of world.npcs) {
        const scheduled = npc.schedule.find(s => s.window === windowId);

        if (scheduled) {
            locations.set(npc.id, scheduled.place);
        } else {
            // Fallback to random place
            const randomPlace = PLACES[rng.nextInt(PLACES.length)];
            locations.set(npc.id, randomPlace.id);
        }
    }

    return locations;
}


// ============================================================================
// Synthetic History Generation (Cold Start Fix)
// ============================================================================

/**
 * Generate synthetic history to pre-populate grudges and alliances.
 * This solves the "Cold Start" problem where Day 1 motives are generic.
 */
export function generateSyntheticHistory(
    world: World,
    state: GossipState,
    history: CaseHistory,
    rng: RNG,
    count: number = 30
): void {
    // Generate N fake cases in the past
    for (let i = 0; i < count; i++) {
        // Simple random selection for speed
        const culprit = rng.pick(world.npcs);
        const item = rng.pick(world.items);
        const crimeType = rng.pick(['theft', 'sabotage', 'prank', 'disappearance']);

        // Who gets accused? (Simulate incomplete evidence)
        const suspects = world.npcs.filter(n => n.id !== culprit.id);
        const accusedCount = rng.nextInt(2); // 0 or 1 wrong accusation
        const wasAccused = [culprit.id]; // Player usually catches culprit in history? Or maybe not.
        // Let's assume player catches culprit 80% of time
        const playerCorrect = rng.nextInt(100) < 80;

        if (playerCorrect) {
            // Player accused culprit (and maybe others)
            const redHerring = rng.pick(suspects);
            if (accusedCount > 0) wasAccused.push(redHerring.id);
        } else {
            // Player missed culprit, accused random innocent
            const innocent = rng.pick(suspects);
            wasAccused.push(innocent.id);
            // Culprit NOT in wasAccused if valid solution exists but player failed?
            // History tracks "Who the player accused".
            // If player was wrong, culprit got away.
            // But let's simplify: History records "truth" + "who was accused".
        }

        const summary: CaseSummary = {
            seed: i + 1000, // Synthetic seeds
            culprit: culprit.id,
            targetItem: item.id,
            crimeType,
            wasAccused,
            wasCleared: [], // Simplified
        };

        recordCase(history, summary);

        // CREATE GRUDGES/ALLIANCES
        // 1. Wrongly accused hates the culprit? Or assumes culprit framed them?
        // Actually, if player accused Innocent, Innocent might blame Player (not an NPC).
        // But if Culprit framed Innocent, Innocent blames Culprit.
        // Let's assume Innocent blames Culprit if Culprit was revealed later.

        // 2. Simplest Grudge: Culprit stole X. Owner of X hates Culprit.
        // Find "owner" of item (heuristic: room owner)
        const owner = findItemOwner(item.startPlace, world);
        if (owner && owner !== culprit.id) {
            createGrudge(history, owner, culprit.id, `stole my ${item.name}`, i + 1000, state.tick);
            // Also spawn gossip
            spawnIncidentGossip(state, owner, "was robbed", state.tick);
        }

        // 3. Innocent Accused Grudge
        // If Alice was accused but Bob did it, Alice hates Bob.
        for (const acc of wasAccused) {
            if (acc !== culprit.id) {
                createGrudge(history, acc, culprit.id, "framed me", i + 1000, state.tick);
            }
        }

        // Advance tick slightly so grudges have different timestamps
        state.tick += 100;
    }

    // After history gen, re-apply history to affinities
    applyHistoryToAffinities(state, history, state.tick);
}

function findItemOwner(placeId: PlaceId, world: World): NPCId | null {
    // Who spends most time in this place?
    // Simplified map for MVP history gen
    const manualMap: Record<PlaceId, NPCId> = {
        bedroom: 'dan', // Grandma's Urn/Pillow. Dan is early bird? Actually Bedroom is shared.
        office: 'alice',
        kitchen: 'carol', // Night owl cooking
        garage: 'eve',
        living: 'bob',
    };
    return manualMap[placeId] ?? null;
}

export function debugGossipState(state: GossipState, world: World): void {
    console.log('\n=== GOSSIP STATE ===');
    console.log(`Tick: ${state.tick}`);
    console.log(`Active gossip: ${state.activeGossip.length}`);

    console.log('\nAffinities (non-neutral):');
    for (const aff of state.affinities) {
        if (aff.value !== 50) {
            const fromName = world.npcs.find(n => n.id === aff.from)?.name ?? aff.from;
            const toName = world.npcs.find(n => n.id === aff.to)?.name ?? aff.to;
            console.log(`  ${fromName} → ${toName}: ${aff.value}`);
        }
    }

    console.log('\nGossip:');
    for (const gossip of state.activeGossip) {
        console.log(`  [${gossip.type}] ${gossip.originDescription} (intensity: ${gossip.intensity})`);
        console.log(`    Heard by: ${gossip.heardBy.join(', ')}`);
    }
}
