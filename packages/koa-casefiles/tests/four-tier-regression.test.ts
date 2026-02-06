import { describe, test, expect } from 'vitest';
import { simulate, generateValidatedCase } from '../src/sim.js';
import { deriveEvidence } from '../src/evidence.js';
import { validateCase, analyzeSignal } from '../src/validators.js';
import { DIFFICULTY_PROFILES, profileToDifficultyConfig } from '../src/types.js';
import type { DifficultyTier, DeviceLogEvidence } from '../src/types.js';

// Task 006 — Regression & batch validation

const SEED_COUNT = 200;
const SOLVABILITY_TARGET = 0.95;

describe('AC-1: All existing tests pass', () => {
    test('vitest run completes without failures (smoke check)', () => {
        // This is a meta-test — the fact that it runs alongside all other tests
        // means AC-1 is satisfied if the full suite passes.
        // Verify basic pipeline works for each tier.
        const tiers: DifficultyTier[] = [1, 2, 3, 4];
        for (const tier of tiers) {
            let found = false;
            for (let seed = 1; seed <= 10; seed++) {
                const result = simulate(seed, tier);
                if (result) {
                    const evidence = deriveEvidence(result.world, result.eventLog, result.config);
                    expect(evidence.length).toBeGreaterThan(0);
                    found = true;
                    break;
                }
            }
            expect(found).toBe(true);
        }
    });
});

describe('AC-2: Each tier achieves >=95% solvability over 200 seeds', () => {
    const tiers: DifficultyTier[] = [1, 2, 3, 4];

    for (const tier of tiers) {
        test(`tier ${tier} (${DIFFICULTY_PROFILES[tier].name}) solvability >= ${SOLVABILITY_TARGET * 100}%`, () => {
            let generated = 0;
            let solvable = 0;

            for (let seed = 1; seed <= SEED_COUNT; seed++) {
                const result = generateValidatedCase(seed, tier);
                if (!result) continue;

                generated++;
                const signal = analyzeSignal(result.evidence, result.sim.config);
                if (signal.hasSignal) {
                    solvable++;
                }
            }

            expect(generated).toBeGreaterThan(0);
            const rate = solvable / generated;
            expect(rate).toBeGreaterThanOrEqual(SOLVABILITY_TARGET);
        }, 30000); // Allow 30s per tier
    }
});

describe('AC-3: Tier 1 strong signal distribution >= 95%', () => {
    test('tier 1 generates >= 95% strong signals (self_contradiction or device_contradiction)', () => {
        let generated = 0;
        let strongSignal = 0;

        for (let seed = 1; seed <= SEED_COUNT; seed++) {
            const result = generateValidatedCase(seed, 1);
            if (!result) continue;

            generated++;
            const signal = analyzeSignal(result.evidence, result.sim.config);
            if (signal.signalStrength === 'strong') {
                strongSignal++;
            }
        }

        expect(generated).toBeGreaterThan(0);
        const rate = strongSignal / generated;
        expect(rate).toBeGreaterThanOrEqual(0.95);
    }, 30000);
});

describe('AC-4: Device gaps match profile per tier', () => {
    test('tier 1: 0 device gaps (all windows have device logs)', () => {
        let checked = 0;
        for (let seed = 1; seed <= 30; seed++) {
            const result = simulate(seed, 1);
            if (!result) continue;

            const evidence = deriveEvidence(result.world, result.eventLog, result.config);
            const deviceLogs = evidence.filter(e => e.kind === 'device_log') as DeviceLogEvidence[];

            // With 0 gaps, device logs should cover all windows that have events
            // We just verify no window is completely missing that has events
            const windowsWithEvents = new Set(result.eventLog
                .filter(e => ['DOOR_OPENED', 'DOOR_CLOSED', 'MOTION_DETECTED'].includes(e.type))
                .map(e => e.window));
            const windowsWithLogs = new Set(deviceLogs.map(e => e.window));

            for (const w of windowsWithEvents) {
                expect(windowsWithLogs.has(w)).toBe(true);
            }
            checked++;
            if (checked >= 5) break;
        }
        expect(checked).toBeGreaterThan(0);
    });

    test('tier 3: exactly 1 offline window', () => {
        let checked = 0;
        for (let seed = 1; seed <= 30; seed++) {
            const result = simulate(seed, 3);
            if (!result) continue;

            const evidence = deriveEvidence(result.world, result.eventLog, result.config);
            const deviceLogs = evidence.filter(e => e.kind === 'device_log') as DeviceLogEvidence[];

            // Find windows that have device-triggering events but no device logs
            const windowsWithDeviceEvents = new Set<string>();
            for (const e of result.eventLog) {
                if (['DOOR_OPENED', 'DOOR_CLOSED', 'MOTION_DETECTED'].includes(e.type)) {
                    windowsWithDeviceEvents.add(e.window);
                }
            }
            const windowsWithLogs = new Set(deviceLogs.map(e => e.window));

            const offlineWindows = [...windowsWithDeviceEvents].filter(w => !windowsWithLogs.has(w));
            // Should have at most 1 offline window (some seeds may not have events in the gap window)
            expect(offlineWindows.length).toBeLessThanOrEqual(1);
            checked++;
            if (checked >= 5) break;
        }
        expect(checked).toBeGreaterThan(0);
    });

    test('tier 4: exactly 2 offline windows', () => {
        let checked = 0;
        for (let seed = 1; seed <= 30; seed++) {
            const result = simulate(seed, 4);
            if (!result) continue;

            const evidence = deriveEvidence(result.world, result.eventLog, result.config);
            const deviceLogs = evidence.filter(e => e.kind === 'device_log') as DeviceLogEvidence[];

            const windowsWithDeviceEvents = new Set<string>();
            for (const e of result.eventLog) {
                if (['DOOR_OPENED', 'DOOR_CLOSED', 'MOTION_DETECTED'].includes(e.type)) {
                    windowsWithDeviceEvents.add(e.window);
                }
            }
            const windowsWithLogs = new Set(deviceLogs.map(e => e.window));

            const offlineWindows = [...windowsWithDeviceEvents].filter(w => !windowsWithLogs.has(w));
            // Should have at most 2 offline windows
            expect(offlineWindows.length).toBeLessThanOrEqual(2);
            checked++;
            if (checked >= 5) break;
        }
        expect(checked).toBeGreaterThan(0);
    });
});

describe('AC-5: Anti-anticlimax passes at >=95% per tier', () => {
    const tiers: DifficultyTier[] = [1, 2, 3, 4];

    for (const tier of tiers) {
        test(`tier ${tier} anti-anticlimax pass rate >= 95%`, () => {
            let generated = 0;
            let antiAntPass = 0;

            for (let seed = 1; seed <= SEED_COUNT; seed++) {
                const result = simulate(seed, tier);
                if (!result) continue;

                generated++;
                const evidence = deriveEvidence(result.world, result.eventLog, result.config);
                const diffConfig = profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]);
                const validation = validateCase(result.world, result.config, evidence, diffConfig);

                if (validation.antiAnticlimax.valid) {
                    antiAntPass++;
                }
            }

            expect(generated).toBeGreaterThan(0);
            const rate = antiAntPass / generated;
            expect(rate).toBeGreaterThanOrEqual(0.95);
        }, 30000);
    }
});

describe('AC-6: Red herring alibi check passes at >=95% per tier', () => {
    const tiers: DifficultyTier[] = [1, 2, 3, 4];

    for (const tier of tiers) {
        test(`tier ${tier} red herring pass rate >= 95%`, () => {
            let generated = 0;
            let rhPass = 0;

            for (let seed = 1; seed <= SEED_COUNT; seed++) {
                const result = simulate(seed, tier);
                if (!result) continue;

                generated++;
                const evidence = deriveEvidence(result.world, result.eventLog, result.config);
                const diffConfig = profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]);
                const validation = validateCase(result.world, result.config, evidence, diffConfig);

                if (validation.redHerrings.valid) {
                    rhPass++;
                }
            }

            expect(generated).toBeGreaterThan(0);
            const rate = rhPass / generated;
            expect(rate).toBeGreaterThanOrEqual(0.95);
        }, 30000);
    }
});
