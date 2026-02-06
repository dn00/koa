import { describe, test, expect, beforeEach } from 'vitest';
import type { KernelState, ActiveArc, CrisisCommsOp } from '../src/kernel/types.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { proposeCommandEvents } from '../src/kernel/commands.js';
import { stepKernel } from '../src/kernel/kernel.js';

function makeTestState(): KernelState {
    const rng = createRng(42);
    const world = createWorld(rng);
    const state = createInitialState(world, 8);
    // Advance tick so we're not at tick 0
    state.truth.tick = 10;
    return state;
}

function addFireArc(state: KernelState, target: PlaceId = 'cargo'): ActiveArc {
    const arc: ActiveArc = {
        id: 'arc-fire-1',
        kind: 'fire_outbreak',
        stepIndex: 0,
        nextTick: state.truth.tick + 10,
        target,
    };
    state.truth.arcs.push(arc);
    return arc;
}

function addAirArc(state: KernelState, target: PlaceId = 'engineering'): ActiveArc {
    const arc: ActiveArc = {
        id: 'arc-air-1',
        kind: 'air_scrubber',
        stepIndex: 0,
        nextTick: state.truth.tick + 10,
        target,
    };
    state.truth.arcs.push(arc);
    return arc;
}

function placeCrewInRoom(state: KernelState, npcId: NPCId, place: PlaceId) {
    state.truth.crew[npcId].place = place;
}

describe('Task 002: ANNOUNCE Command + Vindication', () => {
    let state: KernelState;

    beforeEach(() => {
        state = makeTestState();
    });

    describe('AC-1: ANNOUNCE creates broadcast + action proposals', () => {
        test('returns proposals with COMMS_MESSAGE and SYSTEM_ACTION for active arc', () => {
            addFireArc(state);
            const proposals = proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }]);
            expect(proposals.length).toBeGreaterThanOrEqual(2);

            const commsProposal = proposals.find(p => p.event.type === 'COMMS_MESSAGE');
            expect(commsProposal).toBeDefined();
            const msg = commsProposal!.event.data?.message as any;
            expect(msg.kind).toBe('broadcast');
            expect(msg.confidence).toBe(0.95);
            expect(msg.text.toLowerCase()).toMatch(/evacuat/);

            const actionProposal = proposals.find(p =>
                p.event.type === 'SYSTEM_ACTION' &&
                (p.event.data?.action as string) === 'ANNOUNCE_CRISIS'
            );
            expect(actionProposal).toBeDefined();
        });
    });

    describe('AC-2: Crew in crisis room evacuate', () => {
        test('sets panicUntilTick and targetPlace for crew in crisis room', () => {
            const arc = addFireArc(state, 'cargo');
            placeCrewInRoom(state, 'roughneck', 'cargo');
            const rng = createRng(99);

            // Issue ANNOUNCE command through stepKernel to apply events
            const result = stepKernel(state, [{ type: 'ANNOUNCE', system: 'thermal' }], rng);

            const roughneck = result.state.truth.crew['roughneck'];
            expect(roughneck.panicUntilTick).toBeDefined();
            expect(roughneck.panicUntilTick!).toBeGreaterThanOrEqual(state.truth.tick + CONFIG.announceEvacTicks);
            // Should be targeting a safe room, not cargo
            if (roughneck.targetPlace) {
                expect(roughneck.targetPlace).not.toBe('cargo');
            }
        });
    });

    describe('AC-3: All crew get stress spike', () => {
        test('all alive crew have stress increased by announceStressSpike', () => {
            addFireArc(state);
            // Set all crew to known stress level
            for (const crew of Object.values(state.truth.crew)) {
                crew.stress = 20;
            }
            const rng = createRng(99);
            const result = stepKernel(state, [{ type: 'ANNOUNCE', system: 'thermal' }], rng);

            for (const crew of Object.values(result.state.truth.crew)) {
                if (!crew.alive) continue;
                // Stress should be at least 20 + announceStressSpike (crew mood ticks may adjust slightly)
                expect(crew.stress).toBeGreaterThanOrEqual(20 + CONFIG.announceStressSpike - 2); // allow small mood tick variance
            }
        });
    });

    describe('AC-4: Suspicion drops via ledger', () => {
        test('suspicionLedger has ANNOUNCE_CRISIS entry with negative delta', () => {
            addFireArc(state);
            const rng = createRng(99);
            stepKernel(state, [{ type: 'ANNOUNCE', system: 'thermal' }], rng);

            const entry = state.perception.suspicionLedger.find(e => e.reason === 'ANNOUNCE_CRISIS');
            expect(entry).toBeDefined();
            expect(entry!.delta).toBe(CONFIG.suspicionAnnounce);
            expect(entry!.delta).toBeLessThan(0);
        });
    });

    describe('AC-5: CrisisCommsOp created with snapshot', () => {
        test('perception.crisisCommsOps has ANNOUNCE entry with crew snapshot', () => {
            const arc = addFireArc(state, 'cargo');
            placeCrewInRoom(state, 'roughneck', 'cargo');
            state.truth.crew['roughneck'].hp = 95;

            const rng = createRng(99);
            stepKernel(state, [{ type: 'ANNOUNCE', system: 'thermal' }], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'ANNOUNCE');
            expect(op).toBeDefined();
            expect(op!.arcId).toBe('arc-fire-1');
            expect(op!.status).toBe('PENDING');
            expect(op!.system).toBe('thermal');
            const roughneckSnap = op!.crewSnapshot.find(s => s.id === 'roughneck');
            expect(roughneckSnap).toBeDefined();
            expect(roughneckSnap!.hp).toBe(95);
        });
    });

    describe('AC-6: Rejected without active arc', () => {
        test('returns empty proposals when no arc for system', () => {
            // No arcs
            const proposals = proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }]);
            expect(proposals).toEqual([]);
        });
    });

    describe('AC-7: Rejected if already communicated', () => {
        test('returns empty proposals when PENDING CrisisCommsOp exists for same arc', () => {
            addFireArc(state);
            state.perception.crisisCommsOps.push({
                id: 'comms-existing', kind: 'ANNOUNCE', tick: 5, system: 'thermal',
                arcId: 'arc-fire-1', windowEndTick: 60, status: 'PENDING',
                crewSnapshot: [], lastStepIndex: 0,
            });
            const proposals = proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }]);
            expect(proposals).toEqual([]);
        });
    });

    describe('AC-8: Vindication on arc resolve', () => {
        test('PENDING ANNOUNCE becomes VINDICATED when arc resolves with lastStepIndex >= 2', () => {
            addFireArc(state);
            state.perception.crisisCommsOps.push({
                id: 'comms-1', kind: 'ANNOUNCE', tick: 5, system: 'thermal',
                arcId: 'arc-fire-1', windowEndTick: 200, status: 'PENDING',
                crewSnapshot: [], lastStepIndex: 3,
            });
            // Remove the arc (it resolved)
            state.truth.arcs = [];

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.id === 'comms-1');
            expect(op).toBeDefined();
            expect(op!.status).toBe('VINDICATED');

            // Should have vindication suspicion drop
            const vindicationEntry = state.perception.suspicionLedger.find(e => e.reason === 'ANNOUNCE_VINDICATED');
            expect(vindicationEntry).toBeDefined();
            expect(vindicationEntry!.delta).toBe(CONFIG.suspicionAnnounceVindicated);
        });
    });

    describe('EC-1: Crew not in room still gets stress', () => {
        test('stress spike applies to crew not in crisis room', () => {
            addFireArc(state, 'cargo');
            // Place roughneck away from cargo
            placeCrewInRoom(state, 'roughneck', 'dorms');
            state.truth.crew['roughneck'].stress = 20;

            const rng = createRng(99);
            stepKernel(state, [{ type: 'ANNOUNCE', system: 'thermal' }], rng);

            // Stress should increase even though not in crisis room
            expect(state.truth.crew['roughneck'].stress).toBeGreaterThanOrEqual(20 + CONFIG.announceStressSpike - 2);
        });
    });

    describe('EC-2: Works with suppressed system', () => {
        test('ANNOUNCE works even when system alerts are suppressed', () => {
            addFireArc(state);
            state.perception.tamper.suppressed['thermal'] = 60; // suppressed

            const proposals = proposeCommandEvents(state, [{ type: 'ANNOUNCE', system: 'thermal' }]);
            expect(proposals.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('EC-3: No vindication bonus for minor crisis', () => {
        test('no vindication suspicion bonus when lastStepIndex < 2', () => {
            addFireArc(state);
            state.perception.crisisCommsOps.push({
                id: 'comms-minor', kind: 'ANNOUNCE', tick: 5, system: 'thermal',
                arcId: 'arc-fire-1', windowEndTick: 200, status: 'PENDING',
                crewSnapshot: [], lastStepIndex: 1, // minor - not severe
            });
            // Remove the arc (it resolved)
            state.truth.arcs = [];

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.id === 'comms-minor');
            expect(op).toBeDefined();
            expect(op!.status).toBe('VINDICATED');

            // Should NOT have vindication suspicion bonus
            const vindicationEntry = state.perception.suspicionLedger.find(e => e.reason === 'ANNOUNCE_VINDICATED');
            expect(vindicationEntry).toBeUndefined();
        });
    });
});
