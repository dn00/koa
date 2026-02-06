import { describe, test, expect, beforeEach } from 'vitest';
import type { KernelState, ActiveArc } from '../src/kernel/types.js';
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
    state.truth.tick = 10;
    return state;
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

describe('Task 003: DOWNPLAY Command', () => {
    let state: KernelState;

    beforeEach(() => {
        state = makeTestState();
    });

    describe('AC-1: DOWNPLAY creates broadcast + action proposals', () => {
        test('returns proposals with COMMS_MESSAGE and SYSTEM_ACTION for active arc', () => {
            addAirArc(state);
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            expect(proposals.length).toBeGreaterThanOrEqual(2);

            const commsProposal = proposals.find(p => p.event.type === 'COMMS_MESSAGE');
            expect(commsProposal).toBeDefined();
            const msg = commsProposal!.event.data?.message as any;
            expect(msg.kind).toBe('broadcast');
            expect(msg.confidence).toBe(0.8);
            expect(msg.text.toLowerCase()).toMatch(/minor|monitoring/);

            const actionProposal = proposals.find(p =>
                p.event.type === 'SYSTEM_ACTION' &&
                (p.event.data?.action as string) === 'DOWNPLAY_CRISIS'
            );
            expect(actionProposal).toBeDefined();
        });
    });

    describe('AC-2: All crew get mild stress bump', () => {
        test('all alive crew have stress increased by downplayStressBump', () => {
            addAirArc(state);
            for (const crew of Object.values(state.truth.crew)) {
                crew.stress = 20;
            }
            const rng = createRng(99);
            stepKernel(state, [{ type: 'DOWNPLAY', system: 'air' }], rng);

            for (const crew of Object.values(state.truth.crew)) {
                if (!crew.alive) continue;
                // downplayStressBump is much smaller than announceStressSpike
                expect(crew.stress).toBeGreaterThanOrEqual(20 + CONFIG.downplayStressBump - 2);
            }
        });
    });

    describe('AC-3: No crew evacuation', () => {
        test('DOWNPLAY does not set panicUntilTick (unlike ANNOUNCE)', () => {
            // Use a safe room so crew AI doesn't self-evacuate from hazards
            addAirArc(state, 'dorms');
            placeCrewInRoom(state, 'roughneck', 'dorms');
            const prevPanic = state.truth.crew['roughneck'].panicUntilTick;

            // Apply DOWNPLAY directly via proposeCommandEvents + manual applyEvent
            // to isolate from crew AI tick effects
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            const actionProposal = proposals.find(p =>
                p.event.type === 'SYSTEM_ACTION' &&
                (p.event.data?.action as string) === 'DOWNPLAY_CRISIS'
            );
            expect(actionProposal).toBeDefined();

            // Apply the event via stepKernel to trigger applyEvent
            const rng = createRng(99);
            stepKernel(state, [{ type: 'DOWNPLAY', system: 'air' }], rng);

            const roughneck = state.truth.crew['roughneck'];
            // DOWNPLAY should NOT set panicUntilTick (unlike ANNOUNCE which sets it to tick + announceEvacTicks)
            // prevPanic was undefined, and DOWNPLAY should not change it
            // Note: crew AI may set panic if the room becomes hazardous, but the arc at step 0 in dorms
            // shouldn't make it hazardous
            expect(roughneck.panicUntilTick).toBe(prevPanic);
        });
    });

    describe('AC-4: Suspicion drops via ledger', () => {
        test('suspicionLedger has DOWNPLAY_CRISIS entry with negative delta', () => {
            addAirArc(state);
            const rng = createRng(99);
            stepKernel(state, [{ type: 'DOWNPLAY', system: 'air' }], rng);

            const entry = state.perception.suspicionLedger.find(e => e.reason === 'DOWNPLAY_CRISIS');
            expect(entry).toBeDefined();
            expect(entry!.delta).toBe(CONFIG.suspicionDownplay);
            expect(entry!.delta).toBeLessThan(0);
        });
    });

    describe('AC-5: CrisisCommsOp with crewSnapshot', () => {
        test('creates DOWNPLAY CrisisCommsOp with snapshot of crew in crisis room', () => {
            const arc = addAirArc(state, 'engineering');
            placeCrewInRoom(state, 'roughneck', 'engineering');
            state.truth.crew['roughneck'].hp = 100;

            const rng = createRng(99);
            stepKernel(state, [{ type: 'DOWNPLAY', system: 'air' }], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            expect(op!.arcId).toBe('arc-air-1');
            expect(op!.status).toBe('PENDING');
            expect(op!.system).toBe('air');
            const roughneckSnap = op!.crewSnapshot.find(s => s.id === 'roughneck');
            expect(roughneckSnap).toBeDefined();
            expect(roughneckSnap!.hp).toBe(100);
        });
    });

    describe('AC-6: Rejected without active arc', () => {
        test('returns empty proposals when no arc for system', () => {
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            expect(proposals).toEqual([]);
        });
    });

    describe('AC-7: Rejected if already communicated', () => {
        test('returns empty proposals when PENDING CrisisCommsOp exists for same arc', () => {
            addAirArc(state);
            state.perception.crisisCommsOps.push({
                id: 'comms-existing', kind: 'DOWNPLAY', tick: 5, system: 'air',
                arcId: 'arc-air-1', windowEndTick: 60, status: 'PENDING',
                crewSnapshot: [], lastStepIndex: 0,
            });
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            expect(proposals).toEqual([]);
        });

        test('rejected when ANNOUNCE already exists for same arc', () => {
            addAirArc(state);
            state.perception.crisisCommsOps.push({
                id: 'comms-existing', kind: 'ANNOUNCE', tick: 5, system: 'air',
                arcId: 'arc-air-1', windowEndTick: 60, status: 'PENDING',
                crewSnapshot: [], lastStepIndex: 0,
            });
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            expect(proposals).toEqual([]);
        });
    });

    describe('EC-1: Message uses calming language', () => {
        test('broadcast text contains calming words and does NOT contain alarming words', () => {
            addAirArc(state);
            const proposals = proposeCommandEvents(state, [{ type: 'DOWNPLAY', system: 'air' }]);
            const commsProposal = proposals.find(p => p.event.type === 'COMMS_MESSAGE');
            expect(commsProposal).toBeDefined();
            const msg = commsProposal!.event.data?.message as any;
            const text = msg.text.toLowerCase();
            expect(text).toMatch(/minor|monitoring/);
            expect(text).not.toMatch(/evacuate|critical/);
        });
    });

    describe('EC-2: Empty room -> empty snapshot', () => {
        test('CrisisCommsOp has empty crewSnapshot when no crew in crisis room', () => {
            addAirArc(state, 'cargo');
            // Ensure no crew is in cargo
            for (const crew of Object.values(state.truth.crew)) {
                if (crew.place === 'cargo') crew.place = 'dorms';
            }

            const rng = createRng(99);
            stepKernel(state, [{ type: 'DOWNPLAY', system: 'air' }], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            expect(op!.crewSnapshot).toEqual([]);
        });
    });
});
