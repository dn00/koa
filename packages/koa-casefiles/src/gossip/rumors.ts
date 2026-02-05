/**
 * Gossip Propagation System
 * 
 * Gossip spawns from events, spreads through:
 * - Spatial: NPCs in adjacent places
 * - Social: NPCs with affinity > 30 with someone who heard
 * 
 * Gossip affects relationships and provides emergent motive material.
 */

import type { NPCId, PlaceId, ItemId } from '../types.js';
import type { RNG } from '../kernel/rng.js';
import type {
    Gossip,
    GossipType,
    GossipState,
} from './types.js';
import { GOSSIP_CONSTANTS } from './types.js';
import { getAffinity, changeAffinity } from './relationships.js';

// ============================================================================
// Gossip Creation
// ============================================================================

let gossipCounter = 0;

export function createGossip(
    type: GossipType,
    subjectNpc: NPCId,
    description: string,
    tick: number,
    options: {
        aboutItem?: ItemId;
        aboutPlace?: PlaceId;
        initialHearer?: NPCId;
    } = {}
): Gossip {
    gossipCounter++;

    return {
        id: `gossip_${tick}_${gossipCounter}`,
        type,
        subjectNpc,
        aboutItem: options.aboutItem,
        aboutPlace: options.aboutPlace,
        intensity: GOSSIP_CONSTANTS.INITIAL_INTENSITY,
        heardBy: options.initialHearer ? [options.initialHearer] : [],
        originTick: tick,
        originDescription: description,
    };
}

// ============================================================================
// Gossip Spawning
// ============================================================================

/**
 * Spawn gossip when someone does something notable
 */
export function spawnDeedGossip(
    state: GossipState,
    actor: NPCId,
    deed: string,
    place: PlaceId,
    witnesses: NPCId[],
    tick: number
): Gossip {
    const gossip = createGossip(
        'deed',
        actor,
        `${actor} was seen ${deed}`,
        tick,
        { aboutPlace: place }
    );

    // Witnesses hear it immediately
    gossip.heardBy = [...witnesses];

    state.activeGossip.push(gossip);
    return gossip;
}

/**
 * Spawn gossip when something happens TO someone
 */
export function spawnIncidentGossip(
    state: GossipState,
    subject: NPCId,
    incident: string,
    tick: number,
    knownBy?: NPCId[]
): Gossip {
    const gossip = createGossip(
        'incident',
        subject,
        incident,
        tick
    );

    if (knownBy) {
        gossip.heardBy = [...knownBy];
    }

    state.activeGossip.push(gossip);
    return gossip;
}

/**
 * Spawn gossip about a secret
 */
export function spawnSecretGossip(
    state: GossipState,
    about: NPCId,
    secret: string,
    discoveredBy: NPCId,
    tick: number
): Gossip {
    const gossip = createGossip(
        'secret',
        about,
        secret,
        tick,
        { initialHearer: discoveredBy }
    );

    state.activeGossip.push(gossip);
    return gossip;
}

// ============================================================================
// Gossip Propagation
// ============================================================================

/**
 * Find NPCs eligible to hear a gossip
 */
export function findEligibleListeners(
    gossip: Gossip,
    allNpcs: NPCId[],
    npcLocations: Map<NPCId, PlaceId>,
    adjacencyMap: Map<PlaceId, PlaceId[]>,
    state: GossipState
): NPCId[] {
    const eligible: NPCId[] = [];
    const alreadyHeard = new Set(gossip.heardBy);

    // Get places where gossip is known
    const knownPlaces = new Set<PlaceId>();
    for (const npcId of gossip.heardBy) {
        const place = npcLocations.get(npcId);
        if (place) knownPlaces.add(place);
    }

    // Get adjacent places
    const adjacentPlaces = new Set<PlaceId>();
    for (const place of knownPlaces) {
        const neighbors = adjacencyMap.get(place) ?? [];
        for (const neighbor of neighbors) {
            adjacentPlaces.add(neighbor);
        }
    }

    for (const npcId of allNpcs) {
        if (alreadyHeard.has(npcId)) continue;
        if (npcId === gossip.subjectNpc) continue; // Don't tell them about themselves

        const npcPlace = npcLocations.get(npcId);

        // Spatial eligibility: at adjacent place
        if (npcPlace && adjacentPlaces.has(npcPlace)) {
            eligible.push(npcId);
            continue;
        }

        // Social eligibility: has affinity with someone who heard
        for (const hearerId of gossip.heardBy) {
            const affinity = getAffinity(state.affinities, npcId, hearerId);
            if (affinity > GOSSIP_CONSTANTS.SPREAD_THRESHOLD) {
                eligible.push(npcId);
                break;
            }
        }
    }

    return eligible.sort();
}

/**
 * Tick gossip propagation - each gossip tries to spread
 */
export function tickGossipPropagation(
    state: GossipState,
    allNpcs: NPCId[],
    npcLocations: Map<NPCId, PlaceId>,
    adjacencyMap: Map<PlaceId, PlaceId[]>,
    rng: RNG,
    tick: number
): void {
    for (const gossip of state.activeGossip) {
        if (gossip.intensity < GOSSIP_CONSTANTS.SPREAD_LOSS) continue;

        const eligible = findEligibleListeners(
            gossip,
            allNpcs,
            npcLocations,
            adjacencyMap,
            state
        );

        if (eligible.length === 0) continue;

        // Pick random eligible NPC
        const targetIndex = rng.nextInt(eligible.length);
        const targetNpc = eligible[targetIndex];

        // Spread gossip
        gossip.heardBy.push(targetNpc);
        gossip.intensity -= GOSSIP_CONSTANTS.SPREAD_LOSS;

        // Apply relationship effect
        applyGossipRelationshipEffect(state, gossip, targetNpc, tick);
    }
}

/**
 * Apply relationship changes when someone hears gossip
 */
function applyGossipRelationshipEffect(
    state: GossipState,
    gossip: Gossip,
    listener: NPCId,
    tick: number
): void {
    const subject = gossip.subjectNpc;

    // Deeds and incidents about the subject affect how listener feels about subject
    switch (gossip.type) {
        case 'deed':
            // Could be good or bad - for now, deeds are suspicious = negative
            changeAffinity(
                state.affinities,
                listener,
                subject,
                -GOSSIP_CONSTANTS.NEGATIVE_GOSSIP_LOSS,
                tick
            );
            break;

        case 'incident':
            // Incidents = sympathy = positive
            changeAffinity(
                state.affinities,
                listener,
                subject,
                GOSSIP_CONSTANTS.POSITIVE_GOSSIP_GAIN,
                tick
            );
            break;

        case 'secret':
            // Secrets are juicy = negative
            changeAffinity(
                state.affinities,
                listener,
                subject,
                -GOSSIP_CONSTANTS.NEGATIVE_GOSSIP_LOSS / 2,
                tick
            );
            break;
    }
}

// ============================================================================
// Gossip Decay
// ============================================================================

/**
 * Decay and remove old gossip
 */
export function tickGossipDecay(
    state: GossipState,
    tick: number
): void {
    // Filter out dead gossip
    state.activeGossip = state.activeGossip.filter(
        g => g.intensity >= GOSSIP_CONSTANTS.DECAY_THRESHOLD
    );
}

// ============================================================================
// Gossip Queries
// ============================================================================

/**
 * Get all gossip about a specific NPC
 */
export function getGossipAbout(
    state: GossipState,
    npcId: NPCId
): Gossip[] {
    return state.activeGossip
        .filter(g => g.subjectNpc === npcId)
        .sort((a, b) => b.intensity - a.intensity); // Most intense first
}

/**
 * Get all gossip a specific NPC has heard
 */
export function getGossipKnownBy(
    state: GossipState,
    npcId: NPCId
): Gossip[] {
    return state.activeGossip
        .filter(g => g.heardBy.includes(npcId))
        .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Get the most impactful gossip (highest intensity)
 */
export function getHottestGossip(state: GossipState): Gossip | null {
    if (state.activeGossip.length === 0) return null;

    return state.activeGossip.reduce((hottest, current) =>
        current.intensity > hottest.intensity ? current : hottest
    );
}
