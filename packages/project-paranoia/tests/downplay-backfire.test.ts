import { describe, test, expect, beforeEach } from 'vitest';
import type { KernelState, ActiveArc, CrisisCommsOp } from '../src/kernel/types.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { stepKernel } from '../src/kernel/kernel.js';

function makeTestState(): KernelState {
    const rng = createRng(42);
    const world = createWorld(rng);
    const state = createInitialState(world, 8);
    state.truth.tick = 10;
    return state;
}

function addFireArc(state: KernelState, target: PlaceId = 'cargo'): ActiveArc {
    const arc: ActiveArc = {
        id: 'arc-fire-1',
        kind: 'fire_outbreak',
        stepIndex: 1,
        nextTick: state.truth.tick + 10,
        target,
    };
    state.truth.arcs.push(arc);
    return arc;
}

function addPendingDownplay(state: KernelState, opts: {
    arcId?: string;
    system?: string;
    crewSnapshot?: Array<{ id: NPCId; hp: number }>;
    tick?: number;
}): CrisisCommsOp {
    const op: CrisisCommsOp = {
        id: `downplay-test-${state.perception.crisisCommsOps.length}`,
        kind: 'DOWNPLAY',
        tick: opts.tick ?? state.truth.tick - 5,
        system: opts.system ?? 'thermal',
        arcId: opts.arcId ?? 'arc-fire-1',
        windowEndTick: (opts.tick ?? state.truth.tick - 5) + CONFIG.downplayBackfireWindow,
        status: 'PENDING',
        crewSnapshot: opts.crewSnapshot ?? [],
        lastStepIndex: 0,
    };
    state.perception.crisisCommsOps.push(op);
    return op;
}

describe('Task 004: DOWNPLAY Backfire', () => {
    let state: KernelState;

    beforeEach(() => {
        state = makeTestState();
    });

    describe('AC-1: Backfire on crew harm in room', () => {
        test('PENDING DOWNPLAY becomes BACKFIRED when crew in hazardous crisis room loses hp', () => {
            const arc = addFireArc(state, 'cargo');
            // Make cargo hazardous (on fire)
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;

            // Place roughneck in cargo
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 100;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            // Reduce roughneck's hp to simulate harm
            state.truth.crew['roughneck'].hp = 92;

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            expect(op!.status).toBe('BACKFIRED');
        });
    });

    describe('AC-2: Severity scales with injury', () => {
        test('suspicion spike includes base + injury bonus', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 92; // injured

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const entry = state.perception.suspicionLedger.find(e => e.reason === 'DOWNPLAY_BACKFIRE');
            expect(entry).toBeDefined();
            expect(entry!.delta).toBe(CONFIG.downplayBackfireBase + CONFIG.downplayBackfireInjuryBonus);
        });
    });

    describe('AC-3: Death bonus applied', () => {
        test('suspicion spike includes base + death bonus when crew dies', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 0;
            state.truth.crew['roughneck'].alive = false;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const entry = state.perception.suspicionLedger.find(e => e.reason === 'DOWNPLAY_BACKFIRE');
            expect(entry).toBeDefined();
            expect(entry!.delta).toBe(CONFIG.downplayBackfireBase + CONFIG.downplayBackfireDeathBonus);
        });
    });

    describe('AC-4: ActiveDoubt created', () => {
        test('backfire creates ActiveDoubt with topic referencing the downplayed system', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 92;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const doubt = state.perception.activeDoubts.find(d =>
                d.topic.includes('thermal') && d.topic.includes('downplay')
            );
            expect(doubt).toBeDefined();
            expect(doubt!.severity).toBe(2);
            expect(doubt!.resolved).toBe(false);
        });
    });

    describe('AC-5: Suspicion spike in ledger', () => {
        test('backfire creates suspicion entry with reason DOWNPLAY_BACKFIRE and positive delta', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 92;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const entry = state.perception.suspicionLedger.find(e => e.reason === 'DOWNPLAY_BACKFIRE');
            expect(entry).toBeDefined();
            expect(entry!.delta).toBeGreaterThan(0);
        });
    });

    describe('AC-6: Safe resolution -> EXPIRED', () => {
        test('PENDING DOWNPLAY becomes EXPIRED when arc resolves without crew harm', () => {
            // Arc NOT in state (already resolved)
            state.truth.crew['roughneck'].place = 'dorms';
            state.truth.crew['roughneck'].hp = 100;

            addPendingDownplay(state, {
                arcId: 'arc-fire-resolved',
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            expect(op!.status).toBe('EXPIRED');
        });
    });

    describe('AC-7: Old ops cleaned up', () => {
        test('non-PENDING CrisisCommsOps older than 240 ticks are removed', () => {
            state.truth.tick = 300;
            state.perception.crisisCommsOps.push({
                id: 'old-expired', kind: 'DOWNPLAY', tick: 10, system: 'air',
                arcId: 'old-arc', windowEndTick: 70, status: 'EXPIRED',
                crewSnapshot: [], lastStepIndex: 0,
            });
            state.perception.crisisCommsOps.push({
                id: 'recent-expired', kind: 'ANNOUNCE', tick: 200, system: 'thermal',
                arcId: 'recent-arc', windowEndTick: 260, status: 'VINDICATED',
                crewSnapshot: [], lastStepIndex: 2,
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const remaining = state.perception.crisisCommsOps;
            expect(remaining.find(o => o.id === 'old-expired')).toBeUndefined();
            expect(remaining.find(o => o.id === 'recent-expired')).toBeDefined();
        });
    });

    describe('EC-1: Multiple crew, single capped backfire', () => {
        test('multiple injured crew produces single backfire capped at downplayBackfireCap', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;

            // Place multiple crew in cargo, all injured
            state.truth.crew['roughneck'].place = 'cargo';
            state.truth.crew['roughneck'].hp = 80;
            state.truth.crew['engineer'].place = 'cargo';
            state.truth.crew['engineer'].hp = 0;
            state.truth.crew['engineer'].alive = false;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [
                    { id: 'roughneck' as NPCId, hp: 100 },
                    { id: 'engineer' as NPCId, hp: 100 },
                ],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const entries = state.perception.suspicionLedger.filter(e => e.reason === 'DOWNPLAY_BACKFIRE');
            expect(entries.length).toBe(1); // single backfire event
            expect(entries[0].delta).toBeLessThanOrEqual(CONFIG.downplayBackfireCap);
        });
    });

    describe('EC-2: Crew moved out -> no backfire', () => {
        test('crew in snapshot but moved to safe room does not trigger backfire', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;

            // Roughneck was in cargo at downplay time but moved out
            state.truth.crew['roughneck'].place = 'dorms'; // safe room
            state.truth.crew['roughneck'].hp = 80; // hp decreased from other cause

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            // Should NOT be BACKFIRED — crew moved out
            expect(op!.status).not.toBe('BACKFIRED');
        });
    });

    describe('EC-3: New crew in room -> no backfire', () => {
        test('crew who entered crisis room after downplay does not trigger backfire', () => {
            const arc = addFireArc(state, 'cargo');
            state.truth.rooms['cargo'].onFire = true;
            state.truth.rooms['cargo'].temperature = 60;

            // Engineer enters cargo after downplay but was NOT in snapshot
            state.truth.crew['engineer'].place = 'cargo';
            state.truth.crew['engineer'].hp = 80;

            addPendingDownplay(state, {
                arcId: arc.id,
                system: 'thermal',
                crewSnapshot: [], // empty snapshot - no one was there at downplay time
            });

            const rng = createRng(99);
            stepKernel(state, [], rng);

            const op = state.perception.crisisCommsOps.find(o => o.kind === 'DOWNPLAY');
            expect(op).toBeDefined();
            // Should NOT be BACKFIRED — engineer wasn't in snapshot
            expect(op!.status).not.toBe('BACKFIRED');
        });
    });
});
