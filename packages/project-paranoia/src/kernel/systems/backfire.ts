import { CONFIG } from '../../config.js';
import type { KernelState, TamperOp, ArcKind } from '../types.js';
import type { NPCId, PlaceId } from '../../core/types.js';
import { applySuspicionChange } from './beliefs.js';
import { clamp } from '../utils.js';

// --- SUPPRESS backfire (Task 006) ---

// System → room condition that contradicts suppression
function checkRoomContradicts(state: KernelState, system: string, place: PlaceId): boolean {
    const room = state.truth.rooms[place];
    if (!room) return false;
    if (system === 'thermal' && room.onFire) return true;
    if (system === 'air' && room.o2Level < 30) return true;
    if (system === 'radiation' && room.radiation > 8) return true;
    if (system === 'power' && state.truth.station.power < 40) return true;
    return false;
}

export function checkSuppressBackfire(state: KernelState): void {
    for (const op of state.perception.tamperOps) {
        if (op.kind !== 'SUPPRESS' || op.status !== 'PENDING') continue;
        const system = op.target.system;
        if (!system) continue;

        // Check if suppression window expired naturally
        if (state.truth.tick >= op.windowEndTick) {
            op.status = 'RESOLVED';
            continue;
        }

        // Find living crew in rooms where the crisis contradicts the suppression
        const affectedCrew: NPCId[] = [];
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive) continue;
            if (checkRoomContradicts(state, system, npc.place)) {
                affectedCrew.push(npc.id);
            }
        }

        if (affectedCrew.length === 0) continue;

        // Backfire!
        op.status = 'BACKFIRED';
        op.backfireTick = state.truth.tick;
        // Deduplicate with existing crewAffected
        for (const id of affectedCrew) {
            if (!op.crewAffected.includes(id)) op.crewAffected.push(id);
        }

        // Calculate spike
        const spike = calculateSuppressSpike(state, op);
        applySuspicionChange(state, spike, 'SUPPRESS_BACKFIRE',
            `Crew witnessed ${system} crisis while alert suppressed`);

        // Create ActiveDoubt (Task 010) with enhanced narrative (Task 003)
        state.perception.activeDoubts.push({
            id: `doubt-${state.truth.tick}-suppress`,
            topic: `MOTHER concealed ${system} crisis alert`,
            createdTick: state.truth.tick,
            severity: 3, // Task 003: All backfire doubts have max severity
            involvedCrew: [...op.crewAffected],
            relatedOpId: op.id,
            system,
            resolved: false,
            source: 'backfire', // Task 003: Backfire source tracking
        });
    }
}

function calculateSuppressSpike(state: KernelState, op: TamperOp): number {
    let spike = CONFIG.suppressBackfireBase;
    spike += op.severity * CONFIG.suppressBackfireSeverityMult;

    // Check for injuries/deaths during suppression window
    // CREW_ATTACKED also counts as injury (crew-on-crew violence)
    const hasInjury = state.perception.suspicionLedger.some(
        e => e.tick >= op.tick && e.tick <= state.truth.tick
            && (e.reason === 'CREW_INJURED' || e.reason === 'CREW_ATTACKED')
    );
    const hasDeath = state.perception.suspicionLedger.some(
        e => e.tick >= op.tick && e.tick <= state.truth.tick && e.reason === 'CREW_DIED'
    );

    if (hasInjury) spike += CONFIG.suppressBackfireInjuryBonus;
    if (hasDeath) spike += CONFIG.suppressBackfireDeathBonus;

    return Math.min(spike, CONFIG.suppressBackfireCap);
}

// --- SPOOF backfire (Task 007) ---

const SYSTEM_TO_ARC_KINDS: Record<string, ArcKind[]> = {
    thermal: ['fire_outbreak'],
    air: ['air_scrubber'],
    power: ['power_surge'],
    radiation: ['radiation_leak', 'solar_flare'],
};

const SYSTEM_RESPONSE_PLACES: Record<string, PlaceId[]> = {
    thermal: ['engineering', 'reactor'] as PlaceId[],
    air: ['engineering', 'life_support'] as PlaceId[],
    power: ['engineering', 'reactor'] as PlaceId[],
    radiation: ['reactor', 'medbay'] as PlaceId[],
    comms: ['bridge', 'quarters'] as PlaceId[],
};

export function checkSpoofBackfire(state: KernelState): void {
    for (const op of state.perception.tamperOps) {
        if (op.kind !== 'SPOOF' || op.status !== 'PENDING') continue;
        const system = op.target.system;
        if (!system) continue;

        // Track crew who responded (every tick while pending, before window check)
        const responsePlaces = SYSTEM_RESPONSE_PLACES[system] ?? [];
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive || op.crewAffected.includes(npc.id)) continue;
            const isResponding = npc.targetPlace && responsePlaces.includes(npc.targetPlace);
            const arrivedAfterSpoof = responsePlaces.includes(npc.place) && op.tick < state.truth.tick;
            if (isResponding || arrivedAfterSpoof) op.crewAffected.push(npc.id);
        }

        // Only evaluate at window expiry
        if (state.truth.tick < op.windowEndTick) continue;

        // Check if a real crisis matching the spoofed system occurred
        const matchingArcKinds = SYSTEM_TO_ARC_KINDS[system] ?? [];
        const hadRealCrisis = state.truth.arcs.some(
            arc => matchingArcKinds.includes(arc.kind) && arc.stepIndex > 0
        );

        if (hadRealCrisis) {
            // Got lucky — a real crisis validated the spoof
            op.status = 'RESOLVED';
            continue;
        }

        if (op.crewAffected.length === 0) {
            // Nobody responded — no audience, no backfire
            op.status = 'RESOLVED';
            continue;
        }

        // Backfire!
        op.status = 'BACKFIRED';
        op.backfireTick = state.truth.tick;

        // Cry-wolf escalation
        const spike = calculateSpoofSpike(state);
        applySuspicionChange(state, spike, 'SPOOF_BACKFIRE',
            `False ${system} alarm exposed — crew responded to nothing`);

        // Trust impact on responders
        for (const npcId of op.crewAffected) {
            const belief = state.perception.beliefs[npcId];
            if (belief) {
                belief.motherReliable = Math.max(0, belief.motherReliable - 0.04);
            }
        }

        // Create ActiveDoubt (Task 010) with enhanced narrative (Task 003)
        state.perception.activeDoubts.push({
            id: `doubt-${state.truth.tick}-spoof`,
            topic: `MOTHER lied about ${system} emergency`,
            createdTick: state.truth.tick,
            severity: 3, // Task 003: All backfire doubts have max severity
            involvedCrew: [...op.crewAffected],
            relatedOpId: op.id,
            system,
            resolved: false,
            source: 'backfire', // Task 003: Backfire source tracking
        });
    }
}

function calculateSpoofSpike(state: KernelState): number {
    // Count previous SPOOF backfires this day (within last 240 ticks)
    const recentSpoofBackfires = state.perception.tamperOps.filter(
        o => o.kind === 'SPOOF' && o.status === 'BACKFIRED' && o.backfireTick !== undefined
            && o.backfireTick > state.truth.tick - 240
            && o.backfireTick < state.truth.tick // don't count the current one (not yet set)
    ).length;

    if (recentSpoofBackfires >= 2) return CONFIG.spoofBackfireCryWolf3;
    if (recentSpoofBackfires >= 1) return CONFIG.spoofBackfireCryWolf2;
    return CONFIG.spoofBackfireCryWolf1;
}

// --- FABRICATE backfire (Task 008) ---

function checkTargetHasAlibi(state: KernelState, target: NPCId, since: number): boolean {
    const sighting = state.perception.observation.lastCrewSighting[target];
    if (!sighting) return false;
    const seenRecently = sighting.tick > since;
    const seenWorking = sighting.place === 'mines' || sighting.place === 'engineering';
    const otherCrewPresent = Object.values(state.truth.crew).some(
        c => c.alive && c.id !== target && c.place === sighting.place
    );
    return seenRecently && seenWorking && otherCrewPresent;
}

export function checkFabricateBackfire(state: KernelState): void {
    for (const op of state.perception.tamperOps) {
        if (op.kind !== 'FABRICATE' || op.status !== 'PENDING') continue;
        const target = op.target.npc;
        if (!target) continue;

        // Target died — moot
        const targetCrew = state.truth.crew[target];
        if (!targetCrew || !targetCrew.alive) {
            op.status = 'RESOLVED';
            continue;
        }

        // Check alibi
        if (checkTargetHasAlibi(state, target, op.tick)) {
            // Backfire!
            op.status = 'BACKFIRED';
            op.backfireTick = state.truth.tick;
            if (!op.crewAffected.includes(target)) op.crewAffected.push(target);

            const spike = calculateFabricateSpike(state, op);
            applySuspicionChange(state, spike, 'FABRICATE_BACKFIRE',
                `Frame job against ${target} exposed — alibi confirmed`);

            // Create ActiveDoubt (Task 010) with enhanced narrative (Task 003)
            state.perception.activeDoubts.push({
                id: `doubt-${state.truth.tick}-fabricate`,
                topic: `MOTHER framed ${target} with false logs`,
                createdTick: state.truth.tick,
                severity: 3, // Task 003: All backfire doubts have max severity
                involvedCrew: [...op.crewAffected],
                relatedOpId: op.id,
                resolved: false,
                source: 'backfire', // Task 003: Backfire source tracking
            });

            // Target becomes extremely distrustful
            const targetBelief = state.perception.beliefs[target];
            if (targetBelief) {
                targetBelief.motherReliable = clamp(targetBelief.motherReliable - CONFIG.fabricateBackfireTrustDrop, 0, 1);
                targetBelief.tamperEvidence = clamp(targetBelief.tamperEvidence + CONFIG.fabricateBackfireEvidenceGain, 0, 100);
            }
            continue;
        }

        // Window expired without alibi — got away with it
        if (state.truth.tick >= op.windowEndTick) {
            op.status = 'RESOLVED';
        }
    }
}

function calculateFabricateSpike(state: KernelState, op: TamperOp): number {
    let spike = CONFIG.fabricateBackfireBase;
    spike += op.severity * CONFIG.fabricateBackfireSeverityMult;

    const target = op.target.npc;
    if (target) {
        const inWindow = (e: { tick: number; reason: string; detail: string }) =>
            e.tick >= op.tick && e.tick <= state.truth.tick && e.detail.includes(target);

        // Injury: target took environmental damage (suffocation, fire, radiation)
        const wasInjured = state.perception.suspicionLedger.some(
            e => inWindow(e) && e.reason === 'CREW_INJURED'
        );
        if (wasInjured) spike += CONFIG.fabricateBackfireInjuryBonus;

        // Confined: target trapped by locked door
        const wasConfined = state.perception.suspicionLedger.some(
            e => inWindow(e) && e.reason === 'TRAPPED_BY_DOOR'
        );
        if (wasConfined) spike += CONFIG.fabricateBackfireConfinedBonus;

        // Attacked: target was assaulted by another crew member (roughneck violence)
        // Uses CREW_ATTACKED reason — distinct from CREW_INJURED (environmental)
        const wasAttacked = state.perception.suspicionLedger.some(
            e => inWindow(e) && e.reason === 'CREW_ATTACKED'
        );
        if (wasAttacked) spike += CONFIG.fabricateBackfireAttackedBonus;
    }

    return Math.min(spike, CONFIG.fabricateBackfireCap);
}

// --- ALERT / Coming Clean (Task 011) ---

// --- Doubt decay (Task 010) ---

export function decayDoubts(state: KernelState): void {
    state.perception.activeDoubts = state.perception.activeDoubts.filter(
        d => d.resolved || (state.truth.tick - d.createdTick) < CONFIG.doubtDecayTicks
    );
}

// --- ALERT / Coming Clean (Task 011) ---

export function handleAlert(state: KernelState, system: string): { applied: boolean; message: string } {
    const op = state.perception.tamperOps.find(
        o => o.kind === 'SUPPRESS' && o.target.system === system && o.status === 'PENDING'
    );
    if (!op) {
        return { applied: false, message: `No active suppression for ${system}` };
    }

    const ticksSince = state.truth.tick - op.tick;
    op.status = 'CONFESSED';
    op.confessedTick = state.truth.tick;

    // Remove the suppression itself
    delete state.perception.tamper.suppressed[system];

    if (ticksSince <= CONFIG.alertEarlyWindow) {
        applySuspicionChange(state, CONFIG.alertEarlySuspicion, 'EARLY_CONFESSION',
            `Quick alert for ${system} — suppression lasted ${ticksSince} ticks`);
        return { applied: true, message: `CONFESSION ACCEPTED: Early disclosure for ${system}. Minimal penalty.` };
    } else {
        applySuspicionChange(state, CONFIG.alertLateSuspicion, 'LATE_CONFESSION',
            `Admitted hiding ${system} alert after ${ticksSince} ticks`);
        return { applied: true, message: `CONFESSION NOTED: Late disclosure for ${system}. Moderate penalty.` };
    }
}
