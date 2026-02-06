import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { handleAlert } from '../src/kernel/systems/backfire.js';
import { CONFIG } from '../src/config.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Command exists', () => {
    test('ALERT command is accepted and creates a SENSOR_READING proposal', () => {
        const { state, rng } = makeTestState();

        // First suppress something
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);

        // Then come clean
        stepKernel(state, [{ type: 'ALERT', system: 'thermal' }], rng);

        // Should have a sensor reading about the confession
        const confessionReading = state.perception.readings.find(
            r => r.system === 'alert' && r.message.includes('CONFESSION')
        );
        expect(confessionReading).toBeDefined();
    });
});

describe('AC-2: Early confession', () => {
    test('confessing within 15 ticks gives +2 suspicion', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Only advance a few ticks (within earlyWindow=15)
        for (let i = 0; i < 5; i++) {
            stepKernel(state, [], rng);
        }

        const ledgerBefore = state.perception.suspicionLedger.length;
        const result = handleAlert(state, 'thermal');

        expect(result.applied).toBe(true);
        expect(op.status).toBe('CONFESSED');
        expect(op.confessedTick).toBe(state.truth.tick);

        // Suppression removed
        expect(state.perception.tamper.suppressed['thermal']).toBeUndefined();

        // Ledger shows early confession
        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'EARLY_CONFESSION'
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(CONFIG.alertEarlySuspicion); // 2
    });
});

describe('AC-3: Late confession', () => {
    test('confessing after 15 ticks gives +6 suspicion', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Advance past earlyWindow (>15 ticks)
        for (let i = 0; i < 20; i++) {
            stepKernel(state, [], rng);
        }

        const result = handleAlert(state, 'thermal');

        expect(result.applied).toBe(true);
        expect(op.status).toBe('CONFESSED');

        // Suppression removed
        expect(state.perception.tamper.suppressed['thermal']).toBeUndefined();

        // Ledger shows late confession
        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'LATE_CONFESSION'
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(CONFIG.alertLateSuspicion); // 6
    });
});

describe('AC-4: No active suppression', () => {
    test('returns no-effect message when no PENDING SUPPRESS op exists', () => {
        const { state } = makeTestState();
        state.truth.tick = 10;

        const result = handleAlert(state, 'thermal');

        expect(result.applied).toBe(false);
        expect(result.message).toContain('No active suppression');
    });
});

describe('EC-1: Suppression already backfired', () => {
    test('no effect when op is BACKFIRED (not PENDING)', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Simulate backfire
        op.status = 'BACKFIRED';

        const result = handleAlert(state, 'thermal');

        expect(result.applied).toBe(false);
        // Op stays BACKFIRED (not changed to CONFESSED)
        expect(op.status).toBe('BACKFIRED');
    });
});

describe('EC-2: Multiple suppressions for same system', () => {
    test('confesses the first (oldest) PENDING suppression', () => {
        const { state, rng } = makeTestState();

        // Suppress twice
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 60 }], rng);

        const ops = state.perception.tamperOps.filter(
            o => o.kind === 'SUPPRESS' && o.target.system === 'thermal'
        );
        expect(ops.length).toBe(2);

        const result = handleAlert(state, 'thermal');
        expect(result.applied).toBe(true);

        // First op confessed, second still PENDING
        expect(ops[0].status).toBe('CONFESSED');
        expect(ops[1].status).toBe('PENDING');
    });
});
