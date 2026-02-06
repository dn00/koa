/**
 * Doubt Engine System (Feature 005)
 *
 * Makes honest actions cost something. When MOTHER locks doors, vents rooms,
 * or orders crew around, witnesses form **named doubts** about MOTHER's intentions.
 * Doubts accumulate per-crew, impair cooperation, spread between crew,
 * and accelerate reset progression.
 */

import { CONFIG } from '../../config.js';
import type { KernelState, ActiveDoubt, DoubtSource } from '../types.js';
import type { NPCId, PlaceId } from '../../core/types.js';
import type { RNG } from '../../core/rng.js';
import { applySuspicionChange } from './beliefs.js';

/**
 * Calculate the total doubt burden for a specific crew member.
 * Burden = sum of severity of all unresolved doubts involving them.
 */
export function getCrewDoubtBurden(state: KernelState, crewId: NPCId): number {
    return state.perception.activeDoubts
        .filter((d) => !d.resolved && d.involvedCrew.includes(crewId))
        .reduce((sum, d) => sum + d.severity, 0);
}

/**
 * Calculate the average doubt burden across all living crew.
 * Returns 0 when no crew alive.
 */
export function getAverageDoubtBurden(state: KernelState): number {
    const aliveCrew = Object.values(state.truth.crew).filter((c) => c.alive);
    if (aliveCrew.length === 0) return 0;
    const total = aliveCrew.reduce((sum, c) => sum + getCrewDoubtBurden(state, c.id), 0);
    return total / aliveCrew.length;
}

// =============================================================================
// Task 002: Witness Doubt Generation
// =============================================================================

let doubtOrdinal = 0;

/**
 * Create a witness doubt when crew observes MOTHER taking honest action.
 * Returns undefined if no living crew are witnesses.
 */
export function createWitnessDoubt(
    state: KernelState,
    action: 'VENT' | 'LOCK' | 'PURGE' | 'ORDER',
    witnesses: NPCId[],
    detail?: string
): ActiveDoubt | undefined {
    // Filter to living witnesses only
    const livingWitnesses = witnesses.filter((id) => {
        const crew = state.truth.crew[id];
        return crew && crew.alive;
    });

    if (livingWitnesses.length === 0) return undefined;

    const severityMap: Record<string, 1 | 2 | 3> = {
        VENT: CONFIG.doubtWitnessVent as 1 | 2 | 3,
        LOCK: CONFIG.doubtWitnessLock as 1 | 2 | 3,
        PURGE: CONFIG.doubtWitnessPurge as 1 | 2 | 3,
        ORDER: CONFIG.doubtWitnessOrder as 1 | 2 | 3,
    };

    const topicMap: Record<string, string> = {
        VENT: `MOTHER vented ${detail ?? 'a room'}`,
        LOCK: `MOTHER locked ${detail ?? 'a door'}`,
        PURGE: 'MOTHER purged station air',
        ORDER: `MOTHER ordered ${detail ?? 'crew'}`,
    };

    const doubt: ActiveDoubt = {
        id: `doubt-witness-${state.truth.tick}-${doubtOrdinal++}`,
        topic: topicMap[action] ?? `MOTHER action witnessed`,
        createdTick: state.truth.tick,
        severity: severityMap[action] ?? 2,
        involvedCrew: [...livingWitnesses],
        resolved: false,
        source: 'witness',
    };

    return doubt;
}

/**
 * Find all crew in a room and optionally connected rooms.
 */
export function getCrewInRoom(state: KernelState, place: PlaceId, includeAdjacent = false): NPCId[] {
    const crew: NPCId[] = [];
    const places = new Set<PlaceId>([place]);

    if (includeAdjacent) {
        for (const door of state.world.doors) {
            if (door.a === place) places.add(door.b);
            if (door.b === place) places.add(door.a);
        }
    }

    for (const npc of Object.values(state.truth.crew)) {
        if (npc.alive && places.has(npc.place)) {
            crew.push(npc.id);
        }
    }

    return crew;
}

/**
 * Find all crew in rooms connected to a door.
 */
export function getCrewNearDoor(state: KernelState, doorId: string): NPCId[] {
    const door = state.world.doors.find((d) => d.id === doorId);
    if (!door) return [];

    const crew: NPCId[] = [];
    for (const npc of Object.values(state.truth.crew)) {
        if (npc.alive && (npc.place === door.a || npc.place === door.b)) {
            crew.push(npc.id);
        }
    }
    return crew;
}

// =============================================================================
// Task 004: Doubt Spread + Suspicion Drip
// =============================================================================

/**
 * Spread doubts between crew in the same room.
 * Each unresolved doubt has a chance to spread to nearby crew.
 * Only runs at designated tick intervals (doubtSpreadInterval).
 */
export function spreadDoubts(state: KernelState, rng: RNG): void {
    // Only run at spread interval
    if (state.truth.tick % CONFIG.doubtSpreadInterval !== 0) return;

    // Group crew by room
    const crewByRoom = new Map<PlaceId, NPCId[]>();
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const list = crewByRoom.get(npc.place) ?? [];
        list.push(npc.id);
        crewByRoom.set(npc.place, list);
    }

    // For each unresolved doubt, try to spread
    for (const doubt of state.perception.activeDoubts) {
        if (doubt.resolved) continue;

        // Find rooms where involved crew are present
        for (const crewId of doubt.involvedCrew) {
            const npc = state.truth.crew[crewId];
            if (!npc || !npc.alive) continue;

            const roommates = crewByRoom.get(npc.place) ?? [];
            for (const otherId of roommates) {
                if (doubt.involvedCrew.includes(otherId)) continue; // already involved
                if (!state.truth.crew[otherId]?.alive) continue;

                // Roll for spread
                if (rng.nextInt(100) < CONFIG.doubtSpreadChance) {
                    doubt.involvedCrew.push(otherId);
                    // Update source to 'spread' if not already 'backfire'
                    if (doubt.source !== 'backfire') {
                        doubt.source = 'spread';
                    }
                }
            }
        }
    }
}

/**
 * Unresolved doubts generate suspicion pressure over time.
 * Runs at designated tick intervals (doubtSuspicionDripInterval).
 */
export function drainDoubtSuspicion(state: KernelState): void {
    // Only run at drip interval
    if (state.truth.tick % CONFIG.doubtSuspicionDripInterval !== 0) return;

    // Sum unresolved doubt severities
    const totalSeverity = state.perception.activeDoubts
        .filter((d) => !d.resolved)
        .reduce((sum, d) => sum + d.severity, 0);

    if (totalSeverity === 0) return;

    // Calculate drip amount
    const rawDrip = totalSeverity * CONFIG.doubtSuspicionDripPerSeverity;
    const cappedDrip = Math.min(rawDrip, CONFIG.doubtSuspicionDripCap);

    // Add to suspicion
    applySuspicionChange(
        state,
        cappedDrip,
        'DOUBT_PRESSURE',
        `Unresolved doubts (${totalSeverity} severity) eroding trust`
    );
}

/**
 * Run doubt engine tick - called from kernel.stepKernel
 */
export function tickDoubtEngine(state: KernelState, rng: RNG): void {
    spreadDoubts(state, rng);
    drainDoubtSuspicion(state);
}
