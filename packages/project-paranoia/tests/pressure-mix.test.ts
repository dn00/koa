import { describe, test, expect } from 'vitest';
import { getPressureMix, pickChannel, type PressureChannel, type PressureMix } from '../src/kernel/systems/pressure.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';

describe('Task 001: Pressure Channel Types & Config', () => {
    describe('AC-1: getPressureMix returns low-band weights', () => {
        test('suspicion=10 returns physical=0.6, social=0.1, epistemic=0.3', () => {
            const mix = getPressureMix(10, CONFIG);
            expect(mix.physical).toBeCloseTo(0.6, 5);
            expect(mix.social).toBeCloseTo(0.1, 5);
            expect(mix.epistemic).toBeCloseTo(0.3, 5);
        });
    });

    describe('AC-2: getPressureMix returns mid-band weights', () => {
        test('suspicion=35 returns physical=0.4, social=0.3, epistemic=0.3', () => {
            const mix = getPressureMix(35, CONFIG);
            expect(mix.physical).toBeCloseTo(0.4, 5);
            expect(mix.social).toBeCloseTo(0.3, 5);
            expect(mix.epistemic).toBeCloseTo(0.3, 5);
        });
    });

    describe('AC-3: getPressureMix returns high-band weights', () => {
        test('suspicion=60 returns physical=0.2, social=0.4, epistemic=0.4', () => {
            const mix = getPressureMix(60, CONFIG);
            expect(mix.physical).toBeCloseTo(0.2, 5);
            expect(mix.social).toBeCloseTo(0.4, 5);
            expect(mix.epistemic).toBeCloseTo(0.4, 5);
        });
    });

    describe('AC-4: pickChannel distributes proportionally to weights', () => {
        test('1000 picks with {0.5, 0.3, 0.2} approximate 50/30/20 within 5%', () => {
            const mix: PressureMix = { physical: 0.5, social: 0.3, epistemic: 0.2 };
            const rng = createRng(42);
            const counts: Record<PressureChannel, number> = { physical: 0, social: 0, epistemic: 0 };
            for (let i = 0; i < 1000; i++) {
                counts[pickChannel(mix, rng)]++;
            }
            expect(counts.physical / 1000).toBeCloseTo(0.5, 1);
            expect(counts.social / 1000).toBeCloseTo(0.3, 1);
            expect(counts.epistemic / 1000).toBeCloseTo(0.2, 1);
        });
    });

    describe('EC-1: boundary suspicion uses correct band', () => {
        test('suspicion=25 returns mid-band weights (>= bandLow is mid)', () => {
            const mix = getPressureMix(25, CONFIG);
            expect(mix.physical).toBeCloseTo(0.4, 5);
            expect(mix.social).toBeCloseTo(0.3, 5);
            expect(mix.epistemic).toBeCloseTo(0.3, 5);
        });

        test('suspicion=45 returns high-band weights (>= bandHigh is high)', () => {
            const mix = getPressureMix(45, CONFIG);
            expect(mix.physical).toBeCloseTo(0.2, 5);
            expect(mix.social).toBeCloseTo(0.4, 5);
            expect(mix.epistemic).toBeCloseTo(0.4, 5);
        });
    });

    describe('EC-2: extreme suspicion values do not crash', () => {
        test('suspicion=0 returns valid low-band mix', () => {
            const mix = getPressureMix(0, CONFIG);
            expect(mix.physical).toBeCloseTo(0.6, 5);
            expect(mix.social).toBeCloseTo(0.1, 5);
            expect(mix.epistemic).toBeCloseTo(0.3, 5);
        });

        test('suspicion=100 returns valid high-band mix', () => {
            const mix = getPressureMix(100, CONFIG);
            expect(mix.physical).toBeCloseTo(0.2, 5);
            expect(mix.social).toBeCloseTo(0.4, 5);
            expect(mix.epistemic).toBeCloseTo(0.4, 5);
        });
    });
});
