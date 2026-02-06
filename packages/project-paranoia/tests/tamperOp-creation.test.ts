import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: SUPPRESS creates TamperOp', () => {
    test('should create TamperOp with correct fields when SUPPRESS command executed', () => {
        const { state, rng } = makeTestState();

        const commands: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }];
        stepKernel(state, commands, rng);

        const tamperOps = state.perception.tamperOps;
        expect(tamperOps.length).toBeGreaterThanOrEqual(1);

        const op = tamperOps.find(o => o.kind === 'SUPPRESS');
        expect(op).toBeDefined();
        expect(op!.target.system).toBe('thermal');
        expect(op!.severity).toBe(3); // thermal = high severity
        expect(op!.status).toBe('PENDING');
        expect(op!.tick).toBe(1);
        expect(op!.windowEndTick).toBe(51); // tick + duration
        expect(op!.crewAffected).toEqual([]);
    });
});

describe('AC-2: SPOOF creates TamperOp', () => {
    test('should create TamperOp with correct windowEndTick for SPOOF', () => {
        const { state, rng } = makeTestState();

        const commands: Command[] = [{ type: 'SPOOF', system: 'air' }];
        stepKernel(state, commands, rng);

        const tamperOps = state.perception.tamperOps;
        const op = tamperOps.find(o => o.kind === 'SPOOF');
        expect(op).toBeDefined();
        expect(op!.target.system).toBe('air');
        expect(op!.windowEndTick).toBe(31); // tick(1) + 30
        expect(op!.status).toBe('PENDING');
        expect(op!.severity).toBe(2); // air = medium severity
        expect(op!.crewAffected).toEqual([]);
    });
});

describe('AC-3: FABRICATE creates TamperOp', () => {
    test('should create TamperOp with target NPC for FABRICATE', () => {
        const { state, rng } = makeTestState();

        const commands: Command[] = [{ type: 'FABRICATE', target: 'engineer' }];
        stepKernel(state, commands, rng);

        const tamperOps = state.perception.tamperOps;
        const op = tamperOps.find(o => o.kind === 'FABRICATE');
        expect(op).toBeDefined();
        expect(op!.target.npc).toBe('engineer');
        expect(op!.severity).toBe(3); // fabrication = high severity
        expect(op!.status).toBe('PENDING');
        expect(op!.crewAffected).toEqual([]);
        expect(op!.windowEndTick).toBe(61); // tick(1) + 60
    });
});

describe('EC-1: Multiple tamper ops for same system', () => {
    test('should create separate TamperOps for duplicate suppressions', () => {
        const { state, rng } = makeTestState();

        // First suppress
        const commands1: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 30 }];
        stepKernel(state, commands1, rng);

        // Second suppress of same system
        const commands2: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 40 }];
        stepKernel(state, commands2, rng);

        const suppressOps = state.perception.tamperOps.filter(o => o.kind === 'SUPPRESS');
        expect(suppressOps.length).toBe(2);
        expect(suppressOps[0].target.system).toBe('thermal');
        expect(suppressOps[1].target.system).toBe('thermal');
        expect(suppressOps[0].id).not.toBe(suppressOps[1].id);
    });
});

describe('EC-2: TamperOp array cleanup', () => {
    test('should clean old resolved/backfired ops after 240 ticks', () => {
        const { state, rng } = makeTestState();

        // Create a tamper op
        const commands: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 30 }];
        stepKernel(state, commands, rng);

        // Mark as resolved and set old tick
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;
        op.status = 'RESOLVED';
        op.tick = 1;

        // Advance time past 240 tick window
        state.truth.tick = 242;

        // Step kernel to trigger cleanup
        stepKernel(state, [], rng);

        // Old resolved op should be cleaned
        const suppressOps = state.perception.tamperOps.filter(o => o.kind === 'SUPPRESS');
        expect(suppressOps.length).toBe(0);
    });

    test('should keep PENDING ops regardless of age', () => {
        const { state, rng } = makeTestState();

        // Create a tamper op with very long duration so it won't expire
        const commands: Command[] = [{ type: 'SUPPRESS', system: 'comms', duration: 500 }];
        stepKernel(state, commands, rng);

        // Keep PENDING but set old tick
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;
        op.tick = 1;
        op.status = 'PENDING';
        op.windowEndTick = 600; // won't expire at tick 243

        // Advance time past 240 tick window
        state.truth.tick = 242;

        // Step kernel to trigger cleanup
        stepKernel(state, [], rng);

        // PENDING op should NOT be cleaned
        const suppressOps = state.perception.tamperOps.filter(o => o.kind === 'SUPPRESS');
        expect(suppressOps.length).toBe(1);
    });

    test('should keep recent resolved ops within 240 tick window', () => {
        const { state, rng } = makeTestState();

        // Create a tamper op
        const commands: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 30 }];
        stepKernel(state, commands, rng);

        // Mark as resolved but recent
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;
        op.status = 'RESOLVED';
        op.tick = 100;

        // Set time to 200 (only 100 ticks old)
        state.truth.tick = 200;

        // Step kernel to trigger cleanup
        stepKernel(state, [], rng);

        // Recent resolved op should be kept
        const suppressOps = state.perception.tamperOps.filter(o => o.kind === 'SUPPRESS');
        expect(suppressOps.length).toBe(1);
    });
});
