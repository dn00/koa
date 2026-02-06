import { describe, test, expect } from 'vitest';
import { proposeCrewEvents } from '../src/kernel/systems/crew.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState(): KernelState {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 10);
}

describe('Task 004: Quota Requires Active Mining', () => {
    describe('AC-1: Stressed miner skips yield', () => {
        test('roughneck with stress 75 produces no cargo at yield tick', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 75;
            state.truth.rooms['mines'].o2Level = 100;
            state.truth.tick = CONFIG.yieldInterval; // on yield boundary

            const proposals = proposeCrewEvents(state, rng);
            const roughneckYield = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(roughneckYield.length).toBe(0);
        });
    });

    describe('AC-2: Calm miner in mines produces cargo', () => {
        test('roughneck with stress 30 produces cargo at yield tick', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 30;
            state.truth.rooms['mines'].o2Level = 100;
            state.truth.tick = CONFIG.yieldInterval;

            const proposals = proposeCrewEvents(state, rng);
            const roughneckYield = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(roughneckYield.length).toBe(1);
            expect((roughneckYield[0].event.data as any).amount).toBe(1);
        });
    });

    describe('AC-3: Displaced miner produces nothing', () => {
        test('roughneck in medbay produces no cargo', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'medbay';
            state.truth.crew['roughneck'].stress = 0;
            state.truth.tick = CONFIG.yieldInterval;

            const proposals = proposeCrewEvents(state, rng);
            const roughneckYield = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(roughneckYield.length).toBe(0);
        });
    });

    describe('AC-4: Yield interval slowed', () => {
        test('yieldInterval is 16 (not 12)', () => {
            expect(CONFIG.yieldInterval).toBe(16);
        });

        test('2 calm miners produce expected cargo over 180 ticks', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 0;
            state.truth.crew['specialist'].place = 'mines';
            state.truth.crew['specialist'].stress = 0;
            state.truth.rooms['mines'].o2Level = 100;
            // Prevent specialist sacrifice from generating extra CARGO_YIELD
            state.truth.dayCargo = state.truth.quotaPerDay;

            let totalYields = 0;
            for (let tick = 1; tick <= 180; tick++) {
                state.truth.tick = tick;
                const proposals = proposeCrewEvents(state, rng);
                totalYields += proposals.filter(p => p.event.type === 'CARGO_YIELD').length;
            }

            // 180 / 16 = 11 yield ticks, 2 miners each → 22 total
            expect(totalYields).toBe(22);
        });
    });

    describe('EC-1: One miner dead', () => {
        test('single surviving miner produces ~half cargo', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].alive = false;
            state.truth.crew['specialist'].place = 'mines';
            state.truth.crew['specialist'].stress = 0;
            state.truth.rooms['mines'].o2Level = 100;

            let totalYields = 0;
            for (let tick = 1; tick <= 180; tick++) {
                state.truth.tick = tick;
                const proposals = proposeCrewEvents(state, rng);
                totalYields += proposals.filter(p => p.event.type === 'CARGO_YIELD').length;
            }

            // 180 / 16 = 11 yield ticks, 1 miner → 11 total
            expect(totalYields).toBe(11);
        });
    });

    describe('EC-2: Both miners stressed', () => {
        test('zero cargo when both miners stressed above threshold', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 80;
            state.truth.crew['specialist'].place = 'mines';
            state.truth.crew['specialist'].stress = 75;
            state.truth.rooms['mines'].o2Level = 100;
            // Prevent specialist sacrifice from generating extra CARGO_YIELD
            state.truth.dayCargo = state.truth.quotaPerDay;

            let totalYields = 0;
            for (let tick = 1; tick <= 180; tick++) {
                state.truth.tick = tick;
                const proposals = proposeCrewEvents(state, rng);
                totalYields += proposals.filter(p => p.event.type === 'CARGO_YIELD').length;
            }

            expect(totalYields).toBe(0);
        });
    });

    describe('EC-3: Miner recovers from stress', () => {
        test('cargo production resumes when stress drops below threshold', () => {
            const state = makeTestState();
            const rng = createRng(42);

            state.truth.crew['roughneck'].place = 'mines';
            state.truth.crew['roughneck'].stress = 75; // above threshold
            state.truth.rooms['mines'].o2Level = 100;

            // First yield tick: no cargo
            state.truth.tick = CONFIG.yieldInterval;
            let proposals = proposeCrewEvents(state, rng);
            let yields = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(yields.length).toBe(0);

            // Stress drops below threshold
            state.truth.crew['roughneck'].stress = 65;

            // Next yield tick: cargo resumes
            state.truth.tick = CONFIG.yieldInterval * 2;
            proposals = proposeCrewEvents(state, rng);
            yields = proposals.filter(
                p => p.event.type === 'CARGO_YIELD' && p.event.actor === 'roughneck'
            );
            expect(yields.length).toBe(1);
        });
    });

    describe('EC-4: Existing test expectations', () => {
        test('yieldStressThreshold is configured at 70', () => {
            expect(CONFIG.yieldStressThreshold).toBe(70);
        });
    });
});
