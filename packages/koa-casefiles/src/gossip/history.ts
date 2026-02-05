/**
 * Case History & Grudge Tracking
 * 
 * Tracks past cases to enable emergent story arcs:
 * - Who was the culprit
 * - Who got blamed (right or wrong)
 * - Resulting grudges and alliances
 */

import type { NPCId, ItemId } from '../types.js';
import type {
    CaseHistory,
    CaseSummary,
    Grudge,
    Alliance,
    GossipState,
} from './types.js';
import { changeAffinity } from './relationships.js';

// ============================================================================
// History Initialization
// ============================================================================

export function createEmptyHistory(): CaseHistory {
    return {
        cases: [],
        grudges: [],
        alliances: [],
    };
}

// ============================================================================
// Case Recording
// ============================================================================

/**
 * Record the outcome of a case (called when player finishes)
 */
export function recordCase(
    history: CaseHistory,
    summary: CaseSummary
): void {
    // Add to front (most recent first)
    history.cases.unshift(summary);

    // Keep only last 30 cases
    if (history.cases.length > 30) {
        history.cases.pop();
    }
}

// ============================================================================
// Grudge Management
// ============================================================================

/**
 * Create a grudge when someone is wrongly blamed
 */
export function createGrudge(
    history: CaseHistory,
    from: NPCId,
    to: NPCId,
    reason: string,
    caseSeed: number,
    tick: number
): Grudge {
    const grudge: Grudge = {
        from,
        to,
        reason,
        intensity: 7, // High initial intensity
        originCaseSeed: caseSeed,
        originTick: tick,
    };

    history.grudges.push(grudge);
    return grudge;
}

/**
 * Decay grudge intensity over time
 */
export function decayGrudges(history: CaseHistory): void {
    for (const grudge of history.grudges) {
        grudge.intensity = Math.max(0, grudge.intensity - 0.5);
    }

    // Remove dead grudges
    history.grudges = history.grudges.filter(g => g.intensity > 0);
}

/**
 * Get active grudges for an NPC
 */
export function getGrudgesFrom(
    history: CaseHistory,
    npcId: NPCId
): Grudge[] {
    return history.grudges
        .filter(g => g.from === npcId)
        .sort((a, b) => b.intensity - a.intensity);
}

/**
 * Get grudges against an NPC
 */
export function getGrudgesAgainst(
    history: CaseHistory,
    npcId: NPCId
): Grudge[] {
    return history.grudges
        .filter(g => g.to === npcId)
        .sort((a, b) => b.intensity - a.intensity);
}

// ============================================================================
// Alliance Management
// ============================================================================

/**
 * Create alliance when two NPCs are both blamed (but innocent)
 */
export function createAlliance(
    history: CaseHistory,
    npcA: NPCId,
    npcB: NPCId,
    reason: string,
    caseSeed: number
): Alliance {
    // Ensure deterministic ordering
    const [first, second] = [npcA, npcB].sort();

    const alliance: Alliance = {
        npcA: first,
        npcB: second,
        reason,
        strength: 5,
        originCaseSeed: caseSeed,
    };

    history.alliances.push(alliance);
    return alliance;
}

/**
 * Check if two NPCs are allied
 */
export function areAllied(
    history: CaseHistory,
    npcA: NPCId,
    npcB: NPCId
): boolean {
    const [first, second] = [npcA, npcB].sort();
    return history.alliances.some(
        a => a.npcA === first && a.npcB === second && a.strength > 0
    );
}

/**
 * Get all allies of an NPC
 */
export function getAlliesOf(
    history: CaseHistory,
    npcId: NPCId
): NPCId[] {
    const allies: NPCId[] = [];

    for (const alliance of history.alliances) {
        if (alliance.strength <= 0) continue;

        if (alliance.npcA === npcId) {
            allies.push(alliance.npcB);
        } else if (alliance.npcB === npcId) {
            allies.push(alliance.npcA);
        }
    }

    return allies.sort();
}

// ============================================================================
// History Integration with Affinities
// ============================================================================

/**
 * Apply history-based affinity changes to gossip state
 * Call this when initializing a case's gossip state from history
 */
export function applyHistoryToAffinities(
    state: GossipState,
    history: CaseHistory,
    tick: number
): void {
    // Grudges lower affinity
    for (const grudge of history.grudges) {
        const delta = -grudge.intensity * 3; // Strong grudges = big affinity hit
        changeAffinity(state.affinities, grudge.from, grudge.to, delta, tick);
    }

    // Alliances raise affinity
    for (const alliance of history.alliances) {
        const delta = alliance.strength * 4; // Strong alliances = big affinity boost
        changeAffinity(state.affinities, alliance.npcA, alliance.npcB, delta, tick);
    }
}

// ============================================================================
// History Queries
// ============================================================================

/**
 * Get how many times an NPC has been the culprit
 */
export function getCulpritCount(
    history: CaseHistory,
    npcId: NPCId
): number {
    return history.cases.filter(c => c.culprit === npcId).length;
}

/**
 * Get how many times an NPC has been wrongly accused
 */
export function getWrongAccusedCount(
    history: CaseHistory,
    npcId: NPCId
): number {
    return history.cases.filter(
        c => c.wasAccused.includes(npcId) && c.culprit !== npcId
    ).length;
}

/**
 * Find the most recently stolen item by an NPC
 */
export function getLastCrimeBy(
    history: CaseHistory,
    npcId: NPCId
): CaseSummary | null {
    return history.cases.find(c => c.culprit === npcId) ?? null;
}

/**
 * Describe a past case for narrative purposes
 */
export function narrateCaseSummary(summary: CaseSummary): string {
    const wasWronglyAccused = summary.wasAccused.filter(
        id => id !== summary.culprit
    );

    if (wasWronglyAccused.length > 0) {
        return `${summary.culprit}'s ${summary.crimeType} of the ${summary.targetItem} (${wasWronglyAccused.join(', ')} blamed wrongly)`;
    }

    return `${summary.culprit}'s ${summary.crimeType} of the ${summary.targetItem}`;
}
