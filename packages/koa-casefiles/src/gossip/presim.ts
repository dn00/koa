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
} from './types.js';
import { initializeAffinities, tickProximity, tickAffinityDecay } from './relationships.js';
import { tickGossipPropagation, tickGossipDecay } from './rumors.js';
import { applyHistoryToAffinities } from './history.js';
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
// Debug Helpers
// ============================================================================

/**
 * Print gossip state summary for debugging
 */
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
