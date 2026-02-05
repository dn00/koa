/**
 * Gossip Ecology Types
 * 
 * Core types for emergent relationship/rumor simulation.
 */

import type { NPCId, PlaceId, WindowId, ItemId } from '../types.js';

// ============================================================================
// Dynamic Affinities
// ============================================================================

export interface Affinity {
    from: NPCId;
    to: NPCId;
    value: number;           // 0-100, starts at 50 (neutral)
    lastInteractionTick: number;
}

export const NEUTRAL_AFFINITY = 50;
export const MIN_AFFINITY = 0;
export const MAX_AFFINITY = 100;

// ============================================================================
// Gossip (Rumors)
// ============================================================================

export type GossipType =
    | 'deed'       // Someone did something notable (crime, suspicious act)
    | 'incident'   // Something happened to someone (was blamed, was victim)
    | 'secret';    // Overheard something private

export interface Gossip {
    id: string;
    type: GossipType;
    subjectNpc: NPCId;         // Who the gossip is about
    aboutItem?: ItemId;        // What item (if relevant)
    aboutPlace?: PlaceId;      // Where (if relevant)
    intensity: number;         // 0-1000, decays over time
    heardBy: NPCId[];          // Who has heard this gossip
    originTick: number;        // When it started
    originDescription: string; // "Bob took something from the kitchen"
}

// ============================================================================
// History & Grudges
// ============================================================================

export interface Grudge {
    from: NPCId;
    to: NPCId;
    reason: string;            // "Carol blamed Bob for her crime"
    intensity: number;         // 1-10
    originCaseSeed: number;    // Which case created this
    originTick: number;
}

export interface Alliance {
    npcA: NPCId;
    npcB: NPCId;
    reason: string;            // "Both blamed by Alice"
    strength: number;          // 1-10
    originCaseSeed: number;
}

export interface CaseSummary {
    seed: number;
    culprit: NPCId;
    targetItem: ItemId;
    crimeType: string;
    wasAccused: NPCId[];       // Who the player accused (right or wrong)
    wasCleared: NPCId[];       // Who was proven innocent
}

export interface CaseHistory {
    cases: CaseSummary[];      // Most recent first, max 30
    grudges: Grudge[];
    alliances: Alliance[];
}

// ============================================================================
// Gossip State (per-simulation)
// ============================================================================

export interface GossipState {
    affinities: Affinity[];
    activeGossip: Gossip[];
    tick: number;
}

// ============================================================================
// Constants
// ============================================================================

export const GOSSIP_CONSTANTS = {
    // Affinity changes
    PROXIMITY_GAIN: 2,         // +2 per window at same place
    POSITIVE_GOSSIP_GAIN: 5,   // +5 for good gossip
    NEGATIVE_GOSSIP_LOSS: 8,   // -8 for bad gossip
    DECAY_RATE: 1,             // drift toward 50 per day

    // Gossip propagation
    INITIAL_INTENSITY: 800,
    SPREAD_LOSS: 100,          // intensity lost per spread
    SPREAD_THRESHOLD: 30,      // affinity needed to hear via social ties
    DECAY_THRESHOLD: 100,      // intensity below which gossip dies

    // Pre-simulation
    PRE_SIM_TICKS: 200,        // background ticks before case
} as const;
