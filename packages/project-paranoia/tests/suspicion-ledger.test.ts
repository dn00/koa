import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { applySuspicionChange } from '../src/kernel/systems/beliefs.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Ledger entries written', () => {
    test('should write ledger entry with tick, delta, reason, detail when suspicion changes', () => {
        const { state } = makeTestState();

        applySuspicionChange(state, 5, 'TEST_REASON', 'test detail');

        const ledger = state.perception.suspicionLedger;
        expect(ledger.length).toBe(1);
        expect(ledger[0].tick).toBe(0); // initial tick
        expect(ledger[0].delta).toBe(5);
        expect(ledger[0].reason).toBe('TEST_REASON');
        expect(ledger[0].detail).toBe('test detail');
    });

    test('should write ledger entry via VERIFY command through kernel', () => {
        const { state, rng } = makeTestState();

        state.truth.station.power = 50;
        state.truth.lastVerifyTick = -1000;

        const commands: Command[] = [{ type: 'VERIFY' }];
        stepKernel(state, commands, rng);

        const ledger = state.perception.suspicionLedger;
        const entry = ledger.find(e => e.reason === 'VERIFY_TRUST');
        expect(entry).toBeDefined();
        expect(entry!.tick).toBe(1);
        expect(entry!.delta).toBeLessThan(0);
        expect(entry!.detail).toBe('Cross-referenced telemetry');
    });
});

describe('AC-2: All existing calls updated', () => {
    test('should write ledger entry with detail for QUOTA_MISSED', () => {
        const { state, rng } = makeTestState();

        state.truth.dayCargo = 5;
        state.truth.quotaPerDay = 10;
        state.truth.tick = 239; // just before day end (TICKS_PER_DAY = 240)

        stepKernel(state, [], rng);

        const ledger = state.perception.suspicionLedger;
        const entry = ledger.find(e => e.reason === 'QUOTA_MISSED');
        expect(entry).toBeDefined();
        expect(entry!.delta).toBeGreaterThan(0);
        expect(entry!.detail).toContain('cargo');
    });

    test('should write ledger entry with detail for crew damage', () => {
        const { state, rng } = makeTestState();

        // Put engineer in burning room
        state.truth.crew['engineer'].place = 'engineering';
        state.truth.rooms['engineering'].onFire = true;
        state.truth.rooms['engineering'].temperature = 150;

        // Step kernel multiple times to trigger damage
        for (let i = 0; i < 10; i++) {
            stepKernel(state, [], rng);
            const entry = state.perception.suspicionLedger.find(
                e => e.reason === 'CREW_INJURED' || e.reason === 'CREW_DIED'
            );
            if (entry) {
                expect(entry.detail).toContain('engineer');
                return;
            }
        }
    });
});

describe('AC-3: Ledger capped', () => {
    test('should cap ledger at 100 entries', () => {
        const { state } = makeTestState();

        // Push 110 entries directly
        for (let i = 0; i < 110; i++) {
            applySuspicionChange(state, 1, 'TEST', `entry ${i}`);
        }

        const ledger = state.perception.suspicionLedger;
        expect(ledger.length).toBe(100);
        // Oldest entries should have been dropped
        expect(ledger[0].detail).toBe('entry 10');
        expect(ledger[99].detail).toBe('entry 109');
    });
});

describe('EC-1: Zero-delta calls', () => {
    test('should write ledger entry even when suspicion delta is zero', () => {
        const { state } = makeTestState();

        applySuspicionChange(state, 0, 'ZERO_TEST', 'nothing happened');

        const ledger = state.perception.suspicionLedger;
        expect(ledger.length).toBe(1);
        expect(ledger[0].delta).toBe(0);
        expect(ledger[0].reason).toBe('ZERO_TEST');
        expect(ledger[0].detail).toBe('nothing happened');
    });
});
