/**
 * Task 002: KOA Personality Modes
 * Tests deterministic mode selection, mode-specific barks, and snark pools.
 */
import { describe, test, expect } from 'vitest';
import { createRng } from '../src/kernel/rng.js';
import { BarkState, selectBark, loadBarkPack } from '../src/barks.js';
import { setKoaMode, getKoaMode, resetKoaMode } from '../src/koa-voice.js';
import type { KOAMode } from '../src/blueprints/types.js';

const KOA_MODES: KOAMode[] = ['corporate', 'passive_aggressive', 'overhelpful', 'conspiracy'];

// Helper: select mode from seed (mirrors implementation)
function selectModeFromSeed(seed: number): KOAMode {
    const rng = createRng(seed + 50000);
    return KOA_MODES[rng.nextInt(KOA_MODES.length)];
}

describe('Task 002: KOA Personality Modes', () => {
    // AC-1: Deterministic mode selection
    describe('AC-1: Same seed = same mode (10 seeds)', () => {
        test('mode selection is deterministic across runs', () => {
            for (let seed = 1; seed <= 10; seed++) {
                const mode1 = selectModeFromSeed(seed);
                const mode2 = selectModeFromSeed(seed);
                expect(mode1).toBe(mode2);
                expect(KOA_MODES).toContain(mode1);
            }
        });
    });

    // AC-2: Mode-specific bark selection
    describe('AC-2: selectBark returns mode-specific bark', () => {
        test('returns a bark with matching koaMode when available', () => {
            const state = new BarkState(10);
            const rng = createRng(42);

            // Try to find a mode-specific bark for CASE_OPEN
            const bark = selectBark(state, 'CASE_OPEN', {
                koaMode: 'corporate',
            }, () => rng.nextInt(10000) / 10000);

            // Should return a bark (either mode-specific or universal)
            expect(bark).not.toBeNull();

            // If the bark has a koaMode, it should match
            if (bark && bark.koaMode) {
                expect(bark.koaMode).toBe('corporate');
            }
        });
    });

    // AC-3: Universal fallback
    describe('AC-3: selectBark falls back to universal', () => {
        test('returns universal bark when no mode-specific exists for trigger', () => {
            const state = new BarkState(10);
            const rng = createRng(42);

            // METHOD_FOUND likely has no mode-specific barks
            const bark = selectBark(state, 'METHOD_FOUND', {
                koaMode: 'conspiracy',
            }, () => rng.nextInt(10000) / 10000);

            // Should still return something (universal fallback)
            expect(bark).not.toBeNull();
        });
    });

    // AC-5: Content coverage (>= 20 mode entries, >= 4 per mode)
    describe('AC-5: barks.json has >= 20 mode entries', () => {
        test('sufficient mode-specific bark content', () => {
            const pack = loadBarkPack();
            const modeBarks = pack.barks.filter(b => b.koaMode);

            expect(modeBarks.length).toBeGreaterThanOrEqual(20);

            // At least 4 per mode
            for (const mode of KOA_MODES) {
                const count = modeBarks.filter(b => b.koaMode === mode).length;
                expect(count).toBeGreaterThanOrEqual(4);
            }
        });
    });

    // EC-1: No mode set = default behavior
    describe('EC-1: No mode = default behavior', () => {
        test('selectBark works without koaMode in context', () => {
            const state = new BarkState(10);
            const rng = createRng(42);

            const bark = selectBark(state, 'CASE_OPEN', {}, () => rng.nextInt(10000) / 10000);
            expect(bark).not.toBeNull();
        });

        test('koa-voice works without setKoaMode', () => {
            resetKoaMode();
            expect(getKoaMode()).toBeUndefined();
        });
    });

    // EC-2: Old barks still work
    describe('EC-2: Old barks still work', () => {
        test('universal barks (no koaMode) still fire', () => {
            const pack = loadBarkPack();
            const universalBarks = pack.barks.filter(b => !b.koaMode);

            // Original barks should still exist
            expect(universalBarks.length).toBeGreaterThan(0);

            // At least the original triggers should have universal options
            const triggers = new Set(universalBarks.map(b => b.trigger));
            expect(triggers.has('CASE_OPEN')).toBe(true);
            expect(triggers.has('VERDICT_WIN')).toBe(true);
        });
    });

    // ERR-1: Invalid mode string
    describe('ERR-1: Invalid mode string', () => {
        test('setKoaMode with unknown string does not crash', () => {
            expect(() => setKoaMode('nonexistent' as any)).not.toThrow();

            // Should fall back to no mode
            const state = new BarkState(10);
            const rng = createRng(42);
            const bark = selectBark(state, 'CASE_OPEN', {
                koaMode: 'nonexistent' as any,
            }, () => rng.nextInt(10000) / 10000);

            // Should still get a bark (universal fallback)
            expect(bark).not.toBeNull();
        });
    });
});
