/**
 * Dynamic Relationship System
 * 
 * Affinities evolve based on:
 * - Proximity (same place = +2)
 * - Gossip effects (+5 positive, -8 negative)
 * - Decay (drift toward neutral when no interaction)
 */

import type { NPCId, PlaceId, NPC } from '../types.js';
import type { RNG } from '../kernel/rng.js';
import type {
    Affinity,
    GossipState,
} from './types.js';
import {
    NEUTRAL_AFFINITY,
    MIN_AFFINITY,
    MAX_AFFINITY,
    GOSSIP_CONSTANTS,
} from './types.js';

// ============================================================================
// Affinity Helpers
// ============================================================================

export function initializeAffinities(npcIds: NPCId[]): Affinity[] {
    const affinities: Affinity[] = [];

    for (const from of npcIds) {
        for (const to of npcIds) {
            if (from !== to) {
                affinities.push({
                    from,
                    to,
                    value: NEUTRAL_AFFINITY,
                    lastInteractionTick: 0,
                });
            }
        }
    }

    return affinities;
}

export function getAffinity(
    affinities: Affinity[],
    from: NPCId,
    to: NPCId
): number {
    const edge = affinities.find(a => a.from === from && a.to === to);
    return edge?.value ?? NEUTRAL_AFFINITY;
}

export function setAffinity(
    affinities: Affinity[],
    from: NPCId,
    to: NPCId,
    value: number,
    tick: number
): void {
    const clamped = Math.max(MIN_AFFINITY, Math.min(MAX_AFFINITY, Math.round(value)));
    const edge = affinities.find(a => a.from === from && a.to === to);

    if (edge) {
        edge.value = clamped;
        edge.lastInteractionTick = tick;
    }
}

export function changeAffinity(
    affinities: Affinity[],
    from: NPCId,
    to: NPCId,
    delta: number,
    tick: number
): void {
    const current = getAffinity(affinities, from, to);
    setAffinity(affinities, from, to, current + delta, tick);
    // Symmetric - also update reverse direction
    const reverse = getAffinity(affinities, to, from);
    setAffinity(affinities, to, from, reverse + delta, tick);
}

// ============================================================================
// Relationship Tick Systems
// ============================================================================

/**
 * Apply proximity bonus: NPCs at same place gain affinity
 */
export function tickProximity(
    state: GossipState,
    npcLocations: Map<NPCId, PlaceId>,
    tick: number
): void {
    // Group NPCs by place
    const byPlace = new Map<PlaceId, NPCId[]>();
    for (const [npcId, placeId] of npcLocations) {
        const list = byPlace.get(placeId) ?? [];
        list.push(npcId);
        byPlace.set(placeId, list);
    }

    // Apply proximity bonus for co-located NPCs
    for (const [_place, npcs] of byPlace) {
        if (npcs.length < 2) continue;

        for (let i = 0; i < npcs.length; i++) {
            for (let j = i + 1; j < npcs.length; j++) {
                changeAffinity(
                    state.affinities,
                    npcs[i],
                    npcs[j],
                    GOSSIP_CONSTANTS.PROXIMITY_GAIN,
                    tick
                );
            }
        }
    }
}

/**
 * Decay affinities toward neutral when no recent interaction
 */
export function tickAffinityDecay(
    state: GossipState,
    tick: number,
    decayInterval: number = 50 // Only decay every N ticks
): void {
    if (tick % decayInterval !== 0) return;

    for (const affinity of state.affinities) {
        // Skip if recently interacted
        if (tick - affinity.lastInteractionTick < decayInterval) continue;

        // Decay toward neutral
        if (affinity.value > NEUTRAL_AFFINITY) {
            affinity.value = Math.max(NEUTRAL_AFFINITY, affinity.value - GOSSIP_CONSTANTS.DECAY_RATE);
        } else if (affinity.value < NEUTRAL_AFFINITY) {
            affinity.value = Math.min(NEUTRAL_AFFINITY, affinity.value + GOSSIP_CONSTANTS.DECAY_RATE);
        }
    }
}

// ============================================================================
// Relationship Queries
// ============================================================================

/**
 * Find NPCs with high affinity toward a given NPC
 */
export function getAllies(
    affinities: Affinity[],
    npcId: NPCId,
    threshold: number = 70
): NPCId[] {
    return affinities
        .filter(a => a.to === npcId && a.value >= threshold)
        .map(a => a.from)
        .sort();
}

/**
 * Find NPCs with low affinity toward a given NPC (potential grudges)
 */
export function getEnemies(
    affinities: Affinity[],
    npcId: NPCId,
    threshold: number = 30
): NPCId[] {
    return affinities
        .filter(a => a.from === npcId && a.value <= threshold)
        .map(a => a.to)
        .sort();
}

/**
 * Get the NPC that `from` dislikes most
 */
export function getWorstEnemy(
    affinities: Affinity[],
    from: NPCId
): { to: NPCId; value: number } | null {
    const myAffinities = affinities
        .filter(a => a.from === from)
        .sort((a, b) => a.value - b.value);

    if (myAffinities.length === 0) return null;

    const worst = myAffinities[0];
    return { to: worst.to, value: worst.value };
}

/**
 * Get the NPC that `from` likes most
 */
export function getBestFriend(
    affinities: Affinity[],
    from: NPCId
): { to: NPCId; value: number } | null {
    const myAffinities = affinities
        .filter(a => a.from === from)
        .sort((a, b) => b.value - a.value);

    if (myAffinities.length === 0) return null;

    const best = myAffinities[0];
    return { to: best.to, value: best.value };
}
