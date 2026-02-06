import type { ArcKind, KernelState, ActiveArc } from '../types.js';
import type { NPCId } from '../../core/types.js';
import { CONFIG } from '../../config.js';
import { applySuspicionChange } from './beliefs.js';
import { isRoomHazardous } from './crew.js';

export const ARC_SYSTEM_MAP: Record<string, ArcKind> = {
    air: 'air_scrubber',
    thermal: 'fire_outbreak',
    radiation: 'radiation_leak',
    power: 'power_surge',
    stellar: 'solar_flare',
    comms: 'ghost_signal',
};

export function findArcBySystem(state: KernelState, system: string): ActiveArc | undefined {
    const arcKind = ARC_SYSTEM_MAP[system];
    if (!arcKind) return undefined;
    return state.truth.arcs.find(a => a.kind === arcKind);
}

export function hasExistingComms(state: KernelState, arcId: string): boolean {
    return state.perception.crisisCommsOps.some(
        op => op.arcId === arcId && op.status === 'PENDING',
    );
}

export function checkAnnounceVindication(state: KernelState): void {
    for (const op of state.perception.crisisCommsOps) {
        if (op.kind !== 'ANNOUNCE' || op.status !== 'PENDING') continue;

        const arc = state.truth.arcs.find(a => a.id === op.arcId);
        if (arc) {
            // Arc still active — update lastStepIndex tracking
            op.lastStepIndex = arc.stepIndex;
        } else {
            // Arc resolved — vindicate
            op.status = 'VINDICATED';
            // Bonus suspicion drop only if crisis was severe (stepIndex >= 2)
            if (op.lastStepIndex >= 2) {
                applySuspicionChange(state, CONFIG.suspicionAnnounceVindicated, 'ANNOUNCE_VINDICATED', `${op.system} crisis was severe — announcement vindicated`);
            }
        }
    }
}

export function checkDownplayBackfire(state: KernelState): void {
    for (const op of state.perception.crisisCommsOps) {
        if (op.kind !== 'DOWNPLAY' || op.status !== 'PENDING') continue;

        const arc = state.truth.arcs.find(a => a.id === op.arcId);

        if (!arc) {
            // Arc resolved — check if anyone from snapshot was harmed
            const harmed = op.crewSnapshot.some(snap => {
                const crew = state.truth.crew[snap.id];
                return crew && crew.hp < snap.hp;
            });
            // If no harm, safe resolution
            op.status = harmed ? 'BACKFIRED' : 'EXPIRED';
            if (harmed) {
                const spike = calculateDownplaySpike(state, op);
                applySuspicionChange(state, spike, 'DOWNPLAY_BACKFIRE',
                    `Crew harmed after ${op.system} crisis was downplayed`);
                createDownplayDoubt(state, op);
            }
            continue;
        }

        // Arc still active — check for backfire conditions
        const room = state.truth.rooms[arc.target];
        if (!isRoomHazardous(room)) continue;

        // Check if any snapshot crew are still in the crisis room AND have lost hp
        const harmedInRoom = op.crewSnapshot.some(snap => {
            const crew = state.truth.crew[snap.id];
            if (!crew) return false;
            if (crew.place !== arc.target) return false;
            return crew.hp < snap.hp;
        });

        if (!harmedInRoom) continue;

        // Backfire!
        op.status = 'BACKFIRED';
        const spike = calculateDownplaySpike(state, op);
        applySuspicionChange(state, spike, 'DOWNPLAY_BACKFIRE',
            `Crew harmed in ${arc.target} after ${op.system} crisis was downplayed`);
        createDownplayDoubt(state, op);
    }
}

function calculateDownplaySpike(state: KernelState, op: import('../types.js').CrisisCommsOp): number {
    let spike = CONFIG.downplayBackfireBase;

    for (const snap of op.crewSnapshot) {
        const crew = state.truth.crew[snap.id];
        if (!crew) continue;
        if (crew.hp >= snap.hp) continue;

        if (!crew.alive) {
            spike += CONFIG.downplayBackfireDeathBonus;
        } else {
            spike += CONFIG.downplayBackfireInjuryBonus;
        }
    }

    return Math.min(spike, CONFIG.downplayBackfireCap);
}

function createDownplayDoubt(state: KernelState, op: import('../types.js').CrisisCommsOp): void {
    const involvedCrew = op.crewSnapshot
        .filter(snap => {
            const crew = state.truth.crew[snap.id];
            return crew && crew.hp < snap.hp;
        })
        .map(snap => snap.id);

    state.perception.activeDoubts.push({
        id: `doubt-${state.truth.tick}-downplay`,
        topic: `${op.system} crisis was downplayed — crew harmed`,
        createdTick: state.truth.tick,
        severity: 2,
        involvedCrew,
        relatedOpId: op.id,
        system: op.system,
        resolved: false,
    });
}

export function cleanupCrisisCommsOps(state: KernelState): void {
    const cutoff = state.truth.tick - 240;
    state.perception.crisisCommsOps = state.perception.crisisCommsOps.filter(
        op => op.status === 'PENDING' || op.tick > cutoff
    );
}
