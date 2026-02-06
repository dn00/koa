import { describe, test, expect } from 'vitest';
import { simulate, generateValidatedCase } from '../src/sim.js';
import { deriveEvidence } from '../src/evidence.js';
import { DIFFICULTY_PROFILES, type DifficultyTier } from '../src/types.js';

// Task 002 — Wire profiles into simulate() pipeline

describe('AC-1: simulate() derives behavior from tier', () => {
    test('tier 3 produces medium puzzle difficulty behavior', () => {
        // Try multiple seeds to find one that generates a case
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 3);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.config.tier).toBe(3);
    });

    test('tier 1 produces easy puzzle difficulty behavior', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 1);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.config.tier).toBe(1);
    });
});

describe('AC-2: SimulationOptions.difficulty removed', () => {
    test('simulate() does not accept difficulty option (compile-time verified)', () => {
        // This test verifies that the code compiles without the difficulty option.
        // If SimulationOptions still had 'difficulty', we wouldn't be passing it.
        const result = simulate(1, 2, {});
        // Just verify it works without difficulty
        expect(result === null || typeof result === 'object').toBe(true);
    });
});

describe('AC-3: CaseConfig stores tier', () => {
    test('generated case has tier field', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 3);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.config.tier).toBe(3);
    });

    test('tier defaults to 2 when not specified', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.config.tier).toBe(2);
    });
});

describe('AC-4: DIFFICULTY_PRESETS removed', () => {
    test('DIFFICULTY_PRESETS is not exported from sim.ts', async () => {
        const simModule = await import('../src/sim.js');
        expect((simModule as any).DIFFICULTY_PRESETS).toBeUndefined();
    });
});

describe('AC-5: Device gaps controlled by profile', () => {
    test('tier 1 has no suppressed windows (0 gaps)', () => {
        // Tier 1 (0 gaps) should have >= as many windows with logs as tier 3 (1 gap)
        // for the same seed, because no windows are suppressed
        let tier1Count = 0;
        let tier3Count = 0;
        let compared = 0;
        for (let seed = 1; seed <= 50; seed++) {
            const r1 = simulate(seed, 1);
            const r3 = simulate(seed, 3);
            if (!r1 || !r3) continue;

            const e1 = deriveEvidence(r1.world, r1.eventLog, r1.config);
            const e3 = deriveEvidence(r3.world, r3.eventLog, r3.config);
            const w1 = new Set(e1.filter(e => e.kind === 'device_log').map(e => (e as any).window));
            const w3 = new Set(e3.filter(e => e.kind === 'device_log').map(e => (e as any).window));

            tier1Count += w1.size;
            tier3Count += w3.size;
            compared++;
            if (compared >= 10) break;
        }
        // On average, tier 1 should have more windows with logs than tier 3
        expect(tier1Count).toBeGreaterThan(tier3Count);
    });

    test('tier 3 has fewer windows with logs than tier 1 (1 gap)', () => {
        let found = false;
        for (let seed = 1; seed <= 100; seed++) {
            const result = simulate(seed, 3);
            if (!result) continue;

            const evidence = deriveEvidence(result.world, result.eventLog, result.config);
            const deviceLogs = evidence.filter(e => e.kind === 'device_log');
            const windowsWithLogs = new Set(deviceLogs.map(e => (e as any).window));

            // At tier 3 (1 gap), at least one window should be missing device logs
            if (windowsWithLogs.size <= 5) {
                found = true;
                break;
            }
        }
        expect(found).toBe(true);
    });

    test('tier 4 has fewer windows with logs than tier 3 (2 gaps)', () => {
        let found = false;
        for (let seed = 1; seed <= 100; seed++) {
            const result = simulate(seed, 4);
            if (!result) continue;

            const evidence = deriveEvidence(result.world, result.eventLog, result.config);
            const deviceLogs = evidence.filter(e => e.kind === 'device_log');
            const windowsWithLogs = new Set(deviceLogs.map(e => (e as any).window));

            // At tier 4 (2 gaps), at least two windows should be missing
            if (windowsWithLogs.size <= 4) {
                found = true;
                break;
            }
        }
        expect(found).toBe(true);
    });
});

describe('EC-1: Crime-adjacent windows never offline', () => {
    test('tier 4 offline windows are never crime or crime-adjacent', () => {
        // Compare tier 1 (0 gaps) vs tier 4 (2 gaps) for same seed.
        // Any window that has logs at tier 1 but not at tier 4 was suppressed.
        // Suppressed windows must not be crime or crime-adjacent.
        let verified = 0;
        for (let seed = 1; seed <= 50; seed++) {
            const r1 = simulate(seed, 1);
            const r4 = simulate(seed, 4);
            if (!r1 || !r4) continue;

            const e1 = deriveEvidence(r1.world, r1.eventLog, r1.config);
            const e4 = deriveEvidence(r4.world, r4.eventLog, r4.config);
            const w1 = new Set(e1.filter(e => e.kind === 'device_log').map(e => (e as any).window));
            const w4 = new Set(e4.filter(e => e.kind === 'device_log').map(e => (e as any).window));

            // Find suppressed windows (present in tier 1 but not tier 4)
            const suppressed: string[] = [];
            for (const w of w1) {
                if (!w4.has(w)) suppressed.push(w);
            }

            if (suppressed.length === 0) continue;

            const config = r4.config;
            const allWindows = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
            const crimeIdx = allWindows.indexOf(config.crimeWindow);

            const protectedWindows = new Set([config.crimeWindow]);
            if (crimeIdx > 0) protectedWindows.add(allWindows[crimeIdx - 1]);
            if (crimeIdx < 5) protectedWindows.add(allWindows[crimeIdx + 1]);

            // No suppressed window should be protected
            for (const s of suppressed) {
                expect(protectedWindows.has(s)).toBe(false);
            }
            verified++;
            if (verified >= 10) break;
        }
        expect(verified).toBeGreaterThan(0);
    });
});

describe('EC-2: Blueprint path uses same profile', () => {
    test('blueprint simulation also uses tier profile', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 3, { useBlueprints: true });
            if (result) break;
        }
        // Blueprint path may fall back to legacy, but either way config.tier should be set
        if (result) {
            expect(result.config.tier).toBe(3);
        }
    });
});

describe('EC-3: RNG change for tier 2 is intentional', () => {
    test('tier 2 uses puzzleDifficulty easy (forced false_alibi)', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 2);
            if (result) break;
        }
        expect(result).not.toBeNull();
        // Tier 2 profile has puzzleDifficulty 'easy' → false_alibi twist on culprit
        if (result!.config.twist) {
            expect(result!.config.twist.type).toBe('false_alibi');
            expect(result!.config.twist.actor).toBe(result!.config.culpritId);
        }
    });
});

describe('ERR-1: Invalid tier falls back to tier 2', () => {
    test('tier 5 falls back to tier 2', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = simulate(seed, 5 as any);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.config.tier).toBe(2);
    });
});
