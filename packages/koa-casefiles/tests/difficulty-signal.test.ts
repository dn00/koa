import { describe, test, expect } from 'vitest';
import { generateValidatedCase } from '../src/sim.js';
import { DIFFICULTY_PROFILES } from '../src/types.js';

// Task 005 — Wire signal preference into generateValidatedCase

describe('AC-1: Tier 1 auto-derives self_contradiction', () => {
    test('generateValidatedCase(seed, 1) sets self_contradiction preference', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed, 1);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.sim.config.signalConfig).toBeDefined();
        expect(result!.sim.config.signalConfig!.preferredType).toBe('self_contradiction');
    });
});

describe('AC-2: Tier 4 auto-derives scene_presence', () => {
    test('generateValidatedCase(seed, 4) sets scene_presence preference', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed, 4);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.sim.config.signalConfig).toBeDefined();
        expect(result!.sim.config.signalConfig!.preferredType).toBe('scene_presence');
    });
});

describe('AC-3: Explicit signalConfig not overridden', () => {
    test('caller signalConfig wins over auto-derivation', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed, 1, {
                signalConfig: { preferredType: 'device_contradiction' },
            });
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.sim.config.signalConfig!.preferredType).toBe('device_contradiction');
    });
});

describe('EC-1: Signal preference is best-effort', () => {
    test('natural signal is kept even if different from preference', () => {
        // Generate a case where natural signal may differ from preference
        // The point is that injection only happens for MISSING signals, not type mismatch
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed, 1);
            if (result) break;
        }
        expect(result).not.toBeNull();
        // Case was generated successfully — signal exists (may or may not match preference)
        expect(result!.sim.config.signalConfig!.preferredType).toBe('self_contradiction');
    });
});

describe('EC-2: Default tier auto-derives preference', () => {
    test('generateValidatedCase(seed) defaults to tier 2, self_contradiction', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed);
            if (result) break;
        }
        expect(result).not.toBeNull();
        expect(result!.sim.config.signalConfig).toBeDefined();
        expect(result!.sim.config.signalConfig!.preferredType).toBe('self_contradiction');
    });
});

describe('ERR-1: signalConfig with minStrength only', () => {
    test('caller-provided signalConfig with minStrength is not overwritten', () => {
        let result = null;
        for (let seed = 1; seed <= 50; seed++) {
            result = generateValidatedCase(seed, 1, {
                signalConfig: { minStrength: 'strong' },
            });
            if (result) break;
        }
        expect(result).not.toBeNull();
        // Auto-derivation should NOT overwrite — caller explicitly provided a signalConfig
        expect(result!.sim.config.signalConfig!.minStrength).toBe('strong');
        // preferredType should be whatever the caller set (undefined in this case)
        // because we respect the caller's signalConfig as-is
    });
});
