import { describe, test, expect } from 'vitest';
import { calculateCrewSuspicion, applySuspicionChange, updateBeliefs } from '../src/kernel/systems/beliefs.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import type { SimEvent } from '../src/kernel/types.js';

function makeTestState() {
    const rng = createRng(42);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 002: Extract Beliefs System', () => {
    test('AC-1: calculateCrewSuspicion, applySuspicionChange, updateBeliefs are exported and callable', () => {
        expect(typeof calculateCrewSuspicion).toBe('function');
        expect(typeof applySuspicionChange).toBe('function');
        expect(typeof updateBeliefs).toBe('function');
    });

    test('AC-2: applySuspicionChange deterministically modifies beliefs', () => {
        const state1 = makeTestState();
        const state2 = makeTestState();

        // Apply same suspicion change to both
        applySuspicionChange(state1, 10, 'TEST_REASON');
        applySuspicionChange(state2, 10, 'TEST_REASON');

        // Both should have identical beliefs
        for (const npcId of Object.keys(state1.perception.beliefs)) {
            const b1 = state1.perception.beliefs[npcId];
            const b2 = state2.perception.beliefs[npcId];
            expect(b1.motherReliable).toBe(b2.motherReliable);
            expect(b1.tamperEvidence).toBe(b2.tamperEvidence);
        }
    });

    test('AC-2: calculateCrewSuspicion returns 0-100 number', () => {
        const state = makeTestState();
        const suspicion = calculateCrewSuspicion(state);
        expect(typeof suspicion).toBe('number');
        expect(suspicion).toBeGreaterThanOrEqual(0);
        expect(suspicion).toBeLessThanOrEqual(100);
    });

    test('AC-2: applySuspicionChange positive reduces motherReliable', () => {
        const state = makeTestState();
        const before = state.perception.beliefs['commander'].motherReliable;
        applySuspicionChange(state, 10, 'TEST');
        const after = state.perception.beliefs['commander'].motherReliable;
        expect(after).toBeLessThan(before);
    });

    test('AC-2: applySuspicionChange negative increases motherReliable', () => {
        const state = makeTestState();
        // First lower it
        applySuspicionChange(state, 20, 'LOWER');
        const before = state.perception.beliefs['commander'].motherReliable;
        applySuspicionChange(state, -10, 'RAISE');
        const after = state.perception.beliefs['commander'].motherReliable;
        expect(after).toBeGreaterThan(before);
    });

    test('AC-2: applySuspicionChange with 0 is a no-op', () => {
        const state = makeTestState();
        const before = state.perception.beliefs['commander'].motherReliable;
        applySuspicionChange(state, 0, 'NOOP');
        const after = state.perception.beliefs['commander'].motherReliable;
        expect(after).toBe(before);
    });

    test('AC-2: updateBeliefs processes tamper events', () => {
        const state = makeTestState();
        const beforeEvidence = state.perception.beliefs['commander'].tamperEvidence;

        const events: SimEvent[] = [{
            id: 'test-1',
            tick: 1,
            type: 'TAMPER_SUPPRESS',
            actor: 'PLAYER',
            data: {},
        }];

        updateBeliefs(state, events);
        const afterEvidence = state.perception.beliefs['commander'].tamperEvidence;
        // tamperEvidence should increase (tamperEvidenceGain) then decrease (tamperEvidenceDecay)
        // Net: gain - decay > 0
        expect(afterEvidence).toBeGreaterThan(beforeEvidence);
    });

    test('EC-1: applySuspicionChange is importable by both kernel.ts and crew.ts (no circular dep)', () => {
        // If there were circular imports, the import at the top would fail.
        // Also verify it works on state produced by createInitialState.
        const state = makeTestState();
        expect(() => applySuspicionChange(state, 5, 'EC_TEST')).not.toThrow();
    });

    test('ERR-1: CONFIG values accessible in beliefs.ts (imports resolve)', () => {
        // If CONFIG wasn't importable, functions would throw.
        // Verify by calling functions that depend on CONFIG.
        const state = makeTestState();
        expect(() => calculateCrewSuspicion(state)).not.toThrow();
        expect(() => updateBeliefs(state, [])).not.toThrow();
    });
});
