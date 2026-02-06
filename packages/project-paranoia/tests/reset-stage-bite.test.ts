import { describe, test, expect } from 'vitest';
import { proposeCommandEvents } from '../src/kernel/commands.js';
import { getAdjustedCpuCost } from '../src/kernel/commands.js';
import { proposeCrewEvents } from '../src/kernel/systems/crew.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import type { KernelState, NPCId } from '../src/kernel/types.js';

function makeTestState(): KernelState {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 002: Compliance + Reset Stage Teeth', () => {
    describe('AC-1: WHISPERS raises order refusal threshold', () => {
        test('order threshold is +10 during whispers stage', () => {
            const state = makeTestState();
            state.truth.resetStage = 'whispers';
            state.truth.resetStageTick = state.truth.tick;

            // Set up crew with borderline loyalty/trust
            // Base threshold is 55. With +10, it becomes 65.
            // trustScore = (motherReliable * 100 + loyalty) / 2
            // At loyalty=60, motherReliable=0.55: trustScore = (55 + 60)/2 = 57.5
            // 57.5 >= 55 (passes without whispers) but 57.5 < 65 (fails with whispers)
            const crew = state.truth.crew['roughneck'];
            crew.loyalty = 60;
            const belief = state.perception.beliefs['roughneck'];
            belief.motherReliable = 0.55;

            const proposals = proposeCommandEvents(state, [
                { type: 'ORDER', target: 'roughneck', intent: 'move', place: 'medbay' },
            ]);

            // Find the ORDER_NPC action
            const orderAction = proposals.find(
                p => p.event.type === 'SYSTEM_ACTION' && (p.event.data as any)?.action === 'ORDER_NPC'
            );
            expect(orderAction).toBeDefined();
            expect((orderAction!.event.data as any).accepted).toBe(false);
        });

        test('same crew loyalty passes without whispers', () => {
            const state = makeTestState();
            state.truth.resetStage = 'none';

            const crew = state.truth.crew['roughneck'];
            crew.loyalty = 60;
            const belief = state.perception.beliefs['roughneck'];
            belief.motherReliable = 0.55;

            const proposals = proposeCommandEvents(state, [
                { type: 'ORDER', target: 'roughneck', intent: 'move', place: 'medbay' },
            ]);

            const orderAction = proposals.find(
                p => p.event.type === 'SYSTEM_ACTION' && (p.event.data as any)?.action === 'ORDER_NPC'
            );
            expect(orderAction).toBeDefined();
            expect((orderAction!.event.data as any).accepted).toBe(true);
        });
    });

    describe('AC-2: MEETING pulls crew to mess and blocks cargo', () => {
        test('crew move to mess during meeting', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.resetStage = 'meeting';
            state.truth.resetStageTick = state.truth.tick;
            state.truth.tick = 10;

            // Place miners in mines
            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['specialist'].place = 'mines';

            const proposals = proposeCrewEvents(state, rng);

            // Check that miners have targetPlace set to mess
            expect(state.truth.crew['roughneck'].targetPlace).toBe('mess');
            expect(state.truth.crew['specialist'].targetPlace).toBe('mess');
        });

        test('no CARGO_YIELD during meeting', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.resetStage = 'meeting';
            state.truth.resetStageTick = state.truth.tick;

            // Set tick to yield interval so yield would normally fire
            state.truth.tick = CONFIG.yieldInterval;
            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 0;
            // Keep specialist away from mines to avoid sacrifice-yield confounding
            state.truth.crew['specialist'].place = 'mess';
            state.truth.rooms['mines'].o2Level = 100;
            // High cargo so specialist sacrifice doesn't trigger
            state.truth.dayCargo = state.truth.quotaPerDay;

            const proposals = proposeCrewEvents(state, rng);

            const yieldProposals = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(yieldProposals.length).toBe(0);
        });

        test('cargo yield resumes after meeting duration', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.resetStage = 'meeting';
            state.truth.resetStageTick = 0;

            // Set tick past meeting duration
            state.truth.tick = CONFIG.meetingDurationTicks + CONFIG.yieldInterval;
            // Ensure tick aligns with yield interval
            state.truth.tick = Math.ceil(state.truth.tick / CONFIG.yieldInterval) * CONFIG.yieldInterval;

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.rooms['mines'].o2Level = 100;

            const proposals = proposeCrewEvents(state, rng);

            const yieldProposals = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(yieldProposals.length).toBe(1);
        });
    });

    describe('AC-3: RESTRICTIONS increases CPU costs', () => {
        test('getAdjustedCpuCost applies 1.5x multiplier during restrictions', () => {
            expect(getAdjustedCpuCost(5, 'restrictions')).toBe(8); // 5 * 1.5 = 7.5 → ceil = 8
            expect(getAdjustedCpuCost(2, 'restrictions')).toBe(3); // 2 * 1.5 = 3
            expect(getAdjustedCpuCost(10, 'restrictions')).toBe(15); // 10 * 1.5 = 15
            expect(getAdjustedCpuCost(1, 'restrictions')).toBe(2); // 1 * 1.5 = 1.5 → ceil = 2
        });

        test('no multiplier during normal operation', () => {
            expect(getAdjustedCpuCost(5, 'none')).toBe(5);
            expect(getAdjustedCpuCost(10, 'none')).toBe(10);
        });

        test('multiplier applies during countdown too', () => {
            expect(getAdjustedCpuCost(5, 'countdown')).toBe(8);
        });
    });

    describe('AC-4: Accelerated loyalty decay', () => {
        test('stress > 60 causes -2 loyalty per 10 ticks', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // Use high stress (99) so even after ~10 ticks of safe-room decay (-1/tick)
            // stress remains above 60 at the mod-10 boundary
            state.truth.crew['roughneck'].stress = 99;
            state.truth.crew['roughneck'].loyalty = 50;
            const startLoyalty = 50;

            // Advance 10 ticks (on a 10-tick boundary)
            for (let i = 0; i < 10; i++) {
                stepKernel(state, [], rng);
            }

            // Loyalty should have dropped by at least 2 from the mood tick decay
            expect(state.truth.crew['roughneck'].loyalty).toBeLessThanOrEqual(startLoyalty - 2);
        });

        test('paranoia > 40 causes additional -1 loyalty per 10 ticks', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // High stress so it stays > 60 after decay; paranoia above 40
            state.truth.crew['roughneck'].stress = 99;
            state.truth.crew['roughneck'].paranoia = 45;
            state.truth.crew['roughneck'].loyalty = 50;
            const startLoyalty = 50;

            // Advance 10 ticks
            for (let i = 0; i < 10; i++) {
                stepKernel(state, [], rng);
            }

            // Should have dropped by at least 3 (stress -2 + paranoia -1)
            expect(state.truth.crew['roughneck'].loyalty).toBeLessThanOrEqual(startLoyalty - 3);
        });
    });

    describe('AC-5: Compliance labels change during game', () => {
        test('loyalty drop changes compliance label from COOPERATIVE to RELUCTANT', () => {
            const state = makeTestState();
            const rng = createRng(42);

            // Start at loyalty 50 (COOPERATIVE: loyalty >= 50)
            // Use high stress (99) so after ~30 ticks of safe decay it still exceeds 60
            // at the tick-10 boundaries (ticks 10, 20, 30)
            state.truth.crew['roughneck'].loyalty = 50;
            state.truth.crew['roughneck'].stress = 99;

            // Run 30 ticks: at ticks 10,20,30 stress is ~89,79,69 - all > 60
            // Each boundary drops -2 loyalty → 50 - 6 = 44
            for (let i = 0; i < 30; i++) {
                stepKernel(state, [], rng);
            }

            const loyalty = state.truth.crew['roughneck'].loyalty;
            // loyalty < 50 → RELUCTANT band
            expect(loyalty).toBeLessThan(50);
        });
    });

    describe('EC-1: Reset stage de-escalation restores normal', () => {
        test('CPU costs return to normal after de-escalation', () => {
            expect(getAdjustedCpuCost(5, 'restrictions')).toBe(8);
            expect(getAdjustedCpuCost(5, 'none')).toBe(5);
        });

        test('order threshold returns to base after de-escalation', () => {
            const state = makeTestState();

            // During whispers, borderline crew can't be ordered
            state.truth.resetStage = 'whispers';
            const crew = state.truth.crew['roughneck'];
            crew.loyalty = 60;
            state.perception.beliefs['roughneck'].motherReliable = 0.55;

            let proposals = proposeCommandEvents(state, [
                { type: 'ORDER', target: 'roughneck', intent: 'report' },
            ]);
            let orderAction = proposals.find(
                p => p.event.type === 'SYSTEM_ACTION' && (p.event.data as any)?.action === 'ORDER_NPC'
            );
            expect((orderAction!.event.data as any).accepted).toBe(false);

            // After de-escalation, same crew can be ordered
            state.truth.resetStage = 'none';
            proposals = proposeCommandEvents(state, [
                { type: 'ORDER', target: 'roughneck', intent: 'report' },
            ]);
            orderAction = proposals.find(
                p => p.event.type === 'SYSTEM_ACTION' && (p.event.data as any)?.action === 'ORDER_NPC'
            );
            expect((orderAction!.event.data as any).accepted).toBe(true);
        });
    });

    describe('EC-2: Meeting during active crisis', () => {
        test('crew moves to mess even with fire in engineering', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.resetStage = 'meeting';
            state.truth.resetStageTick = state.truth.tick;
            state.truth.tick = 10;

            // Start a fire in engineering
            state.truth.rooms['engineering'].onFire = true;
            state.truth.rooms['engineering'].temperature = 80;

            // Place crew in engineering (hazardous)
            state.truth.crew['engineer'].place = 'engineering';

            const proposals = proposeCrewEvents(state, rng);

            // Crew should target mess (meeting takes priority as stated in plan)
            expect(state.truth.crew['engineer'].targetPlace).toBe('mess');
        });
    });

    describe('EC-3: Countdown during restrictions', () => {
        test('CPU penalty continues during countdown', () => {
            expect(getAdjustedCpuCost(5, 'countdown')).toBe(8);
            expect(getAdjustedCpuCost(10, 'countdown')).toBe(15);
        });
    });
});
