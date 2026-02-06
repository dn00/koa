import { describe, test, expect } from 'vitest';
import type { CrisisCommsOp, NPCId } from '../src/kernel/types.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { ARC_SYSTEM_MAP, findArcBySystem, hasExistingComms } from '../src/kernel/systems/crisis-comms.js';

function makeTestState() {
    const rng = createRng(42);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 001: CrisisCommsOp Types + Config + State', () => {
    describe('AC-1: CrisisCommsOp type has required fields', () => {
        test('CrisisCommsOp satisfies expected shape with all required fields', () => {
            const op: CrisisCommsOp = {
                id: 'comms-1',
                kind: 'ANNOUNCE',
                tick: 10,
                system: 'thermal',
                arcId: 'arc-1',
                windowEndTick: 70,
                status: 'PENDING',
                crewSnapshot: [{ id: 'roughneck' as NPCId, hp: 100 }],
                lastStepIndex: 0,
            };
            expect(op.id).toBe('comms-1');
            expect(op.kind).toBe('ANNOUNCE');
            expect(op.tick).toBe(10);
            expect(op.system).toBe('thermal');
            expect(op.arcId).toBe('arc-1');
            expect(op.windowEndTick).toBe(70);
            expect(op.status).toBe('PENDING');
            expect(op.crewSnapshot).toEqual([{ id: 'roughneck', hp: 100 }]);
            expect(op.lastStepIndex).toBe(0);
        });

        test('CrisisCommsOp supports ANNOUNCE and DOWNPLAY kinds', () => {
            const announce: CrisisCommsOp = {
                id: 'a', kind: 'ANNOUNCE', tick: 0, system: 'air', arcId: 'x',
                windowEndTick: 60, status: 'PENDING', crewSnapshot: [], lastStepIndex: 0,
            };
            const downplay: CrisisCommsOp = {
                id: 'b', kind: 'DOWNPLAY', tick: 0, system: 'air', arcId: 'x',
                windowEndTick: 60, status: 'PENDING', crewSnapshot: [], lastStepIndex: 0,
            };
            expect(announce.kind).toBe('ANNOUNCE');
            expect(downplay.kind).toBe('DOWNPLAY');
        });

        test('CrisisCommsOp supports all four statuses', () => {
            const statuses: CrisisCommsOp['status'][] = ['PENDING', 'BACKFIRED', 'VINDICATED', 'EXPIRED'];
            for (const status of statuses) {
                const op: CrisisCommsOp = {
                    id: `test-${status}`, kind: 'ANNOUNCE', tick: 0, system: 'air', arcId: 'x',
                    windowEndTick: 60, status, crewSnapshot: [], lastStepIndex: 0,
                };
                expect(op.status).toBe(status);
            }
        });
    });

    describe('AC-2: ARC_SYSTEM_MAP covers all arc kinds', () => {
        test('maps all 6 system names to arc kinds', () => {
            expect(ARC_SYSTEM_MAP['air']).toBe('air_scrubber');
            expect(ARC_SYSTEM_MAP['thermal']).toBe('fire_outbreak');
            expect(ARC_SYSTEM_MAP['radiation']).toBe('radiation_leak');
            expect(ARC_SYSTEM_MAP['power']).toBe('power_surge');
            expect(ARC_SYSTEM_MAP['stellar']).toBe('solar_flare');
            expect(ARC_SYSTEM_MAP['comms']).toBe('ghost_signal');
        });
    });

    describe('AC-3: findArcBySystem returns matching arc', () => {
        test('returns active arc matching system', () => {
            const state = makeTestState();
            state.truth.arcs.push({
                id: 'arc-air-1',
                kind: 'air_scrubber',
                stepIndex: 0,
                nextTick: 20,
                target: 'cargo',
            });
            const result = findArcBySystem(state, 'air');
            expect(result).toBeDefined();
            expect(result!.id).toBe('arc-air-1');
            expect(result!.kind).toBe('air_scrubber');
        });
    });

    describe('AC-4: hasExistingComms detects existing op', () => {
        test('returns true when PENDING CrisisCommsOp exists for arc', () => {
            const state = makeTestState();
            state.perception.crisisCommsOps.push({
                id: 'comms-1', kind: 'ANNOUNCE', tick: 5, system: 'air', arcId: 'abc',
                windowEndTick: 60, status: 'PENDING', crewSnapshot: [], lastStepIndex: 0,
            });
            expect(hasExistingComms(state, 'abc')).toBe(true);
        });

        test('returns false when no CrisisCommsOp exists for arc', () => {
            const state = makeTestState();
            expect(hasExistingComms(state, 'abc')).toBe(false);
        });

        test('returns false when CrisisCommsOp exists but not PENDING', () => {
            const state = makeTestState();
            state.perception.crisisCommsOps.push({
                id: 'comms-1', kind: 'ANNOUNCE', tick: 5, system: 'air', arcId: 'abc',
                windowEndTick: 60, status: 'VINDICATED', crewSnapshot: [], lastStepIndex: 0,
            });
            expect(hasExistingComms(state, 'abc')).toBe(false);
        });
    });

    describe('AC-5: Config params defined with defaults', () => {
        test('all 12 announce/downplay config params exist with expected defaults', () => {
            expect(CONFIG.announceStressSpike).toBe(12);
            expect(CONFIG.announceEvacTicks).toBe(15);
            expect(CONFIG.suspicionAnnounce).toBe(-3);
            expect(CONFIG.suspicionAnnounceVindicated).toBe(-1);
            expect(CONFIG.downplayStressBump).toBe(4);
            expect(CONFIG.suspicionDownplay).toBe(-2);
            expect(CONFIG.suspicionDownplayBackfire).toBe(10);
            expect(CONFIG.downplayBackfireWindow).toBe(60);
            expect(CONFIG.downplayBackfireBase).toBe(8);
            expect(CONFIG.downplayBackfireInjuryBonus).toBe(3);
            expect(CONFIG.downplayBackfireDeathBonus).toBe(8);
            expect(CONFIG.downplayBackfireCap).toBe(25);
        });
    });

    describe('AC-6: State initializes with empty crisisCommsOps', () => {
        test('createInitialState includes crisisCommsOps as empty array', () => {
            const state = makeTestState();
            expect(state.perception.crisisCommsOps).toBeDefined();
            expect(state.perception.crisisCommsOps).toEqual([]);
        });
    });

    describe('EC-1: Unknown system returns undefined', () => {
        test('findArcBySystem returns undefined for unknown system name', () => {
            const state = makeTestState();
            const result = findArcBySystem(state, 'unknown');
            expect(result).toBeUndefined();
        });
    });

    describe('EC-2: No arc for valid system returns undefined', () => {
        test('findArcBySystem returns undefined when no active arc matches', () => {
            const state = makeTestState();
            // No arcs at all
            const result = findArcBySystem(state, 'air');
            expect(result).toBeUndefined();
        });

        test('findArcBySystem returns undefined when arcs exist but not for requested system', () => {
            const state = makeTestState();
            state.truth.arcs.push({
                id: 'arc-fire-1',
                kind: 'fire_outbreak',
                stepIndex: 0,
                nextTick: 20,
                target: 'cargo',
            });
            const result = findArcBySystem(state, 'air');
            expect(result).toBeUndefined();
        });
    });
});
