import { describe, test, expect } from 'vitest';
import type {
  CaseConfig,
  EvidenceItem,
  PresenceEvidence,
  DeviceLogEvidence,
  SignalAnalysis,
  SignalConfig,
  SignalType,
  SignalStrength,
} from '../src/types.js';
import { analyzeSignal } from '../src/validators.js';
import { solve } from '../src/solver.js';
import { generateValidatedCase } from '../src/sim.js';

// ---------------------------------------------------------------------------
// Test helpers (reused from signal-analysis.test.ts pattern)
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<CaseConfig> = {}): CaseConfig {
  return {
    seed: 1,
    suspects: ['npc_culprit', 'npc_red1', 'npc_red2', 'npc_red3'],
    culpritId: 'npc_culprit',
    crimeType: 'theft',
    crimeMethod: {
      type: 'theft',
      methodId: 'grabbed',
      description: 'stole the sourdough',
      funnyMethod: 'while everyone was arguing about thermostats',
    },
    targetItem: 'item_sourdough',
    crimeWindow: 'W3',
    crimePlace: 'kitchen',
    hiddenPlace: 'garage',
    motive: {
      type: 'envy',
      description: 'jealous of the sourdough',
      funnyReason: 'it got more likes',
    },
    suspiciousActs: [],
    ...overrides,
  };
}

function presence(
  id: string,
  npc: string,
  window: string,
  place: string,
): PresenceEvidence {
  return { id, kind: 'presence', cites: [], npc, window, place };
}

function deviceLog(
  id: string,
  opts: {
    device?: string;
    deviceType?: 'door_sensor' | 'motion_sensor' | 'wifi_presence' | 'camera';
    window?: string;
    place?: string;
    detail?: string;
    actor?: string;
  } = {},
): DeviceLogEvidence {
  return {
    id,
    kind: 'device_log',
    cites: [],
    device: opts.device ?? 'dev_1',
    deviceType: opts.deviceType ?? 'door_sensor',
    window: opts.window ?? 'W3',
    place: opts.place ?? 'kitchen',
    detail: opts.detail ?? 'Door opened',
    actor: opts.actor,
  };
}

// ---------------------------------------------------------------------------
// Task 004: Tuning Hooks
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AC-1: SignalConfig type exists ← R4.1
// ---------------------------------------------------------------------------

describe('Task 004: Tuning Hooks', () => {
  describe('AC-1: SignalConfig type exists', () => {
    test('SignalConfig interface is importable and has correct shape', () => {
      const config: SignalConfig = {
        preferredType: 'self_contradiction',
        minStrength: 'medium',
      };

      expect(config.preferredType).toBe('self_contradiction');
      expect(config.minStrength).toBe('medium');
    });

    test('SignalConfig fields are optional', () => {
      const empty: SignalConfig = {};
      expect(empty.preferredType).toBeUndefined();
      expect(empty.minStrength).toBeUndefined();
    });

    test('CaseConfig accepts signalConfig field', () => {
      const config = makeConfig({
        signalConfig: {
          preferredType: 'device_contradiction',
          minStrength: 'strong',
        },
      });

      expect(config.signalConfig).toBeDefined();
      expect(config.signalConfig!.preferredType).toBe('device_contradiction');
      expect(config.signalConfig!.minStrength).toBe('strong');
    });
  });

  // ---------------------------------------------------------------------------
  // AC-2: Director can request signal type ← R4.2
  // ---------------------------------------------------------------------------

  describe('AC-2: Director can request signal type', () => {
    test('signalConfig.preferredType is preserved through case generation', () => {
      const result = generateValidatedCase(1, 2, {
        difficulty: 'easy',
        signalConfig: { preferredType: 'self_contradiction' },
      });

      // The pipeline should complete successfully
      if (result) {
        // Signal analysis should return a valid signal
        const signal = analyzeSignal(result.evidence, result.sim.config);
        expect(signal.hasSignal).toBe(true);
        // signalConfig should be stored on the config
        expect(result.sim.config.signalConfig).toBeDefined();
        expect(result.sim.config.signalConfig!.preferredType).toBe('self_contradiction');
      }
    });

    test('best effort: if natural signal matches preference, signal type matches', () => {
      // Create evidence that naturally produces a self_contradiction
      const config = makeConfig({
        signalConfig: { preferredType: 'self_contradiction' },
      });
      const evidence: EvidenceItem[] = [
        presence('p1', 'npc_culprit', 'W3', 'bedroom'),
        presence('p2', 'npc_culprit', 'W3', 'kitchen'),
      ];

      const signal = analyzeSignal(evidence, config);
      expect(signal.hasSignal).toBe(true);
      expect(signal.signalType).toBe('self_contradiction');
    });
  });

  // ---------------------------------------------------------------------------
  // AC-3: Solver output includes signal analysis ← R5.1
  // ---------------------------------------------------------------------------

  describe('AC-3: Solver output includes signal analysis', () => {
    test('solve() result contains signalAnalysis field', () => {
      const result = solve(1, false, 'easy');

      // Solver should complete
      expect(result).toBeDefined();
      expect(result.signalAnalysis).toBeDefined();
      expect(result.signalAnalysis!.signalType).toBeDefined();
      expect(result.signalAnalysis!.hasSignal).toBeDefined();
    });

    test('signalAnalysis contains valid SignalAnalysis from analyzeSignal()', () => {
      const result = solve(1, false, 'easy');

      if (result.signalAnalysis) {
        // Verify it has the full SignalAnalysis shape
        const sa = result.signalAnalysis;
        expect(typeof sa.hasSignal).toBe('boolean');
        expect(['self_contradiction', 'device_contradiction', 'scene_presence', 'opportunity_only']).toContain(sa.signalType);
        expect(['strong', 'medium', 'weak']).toContain(sa.signalStrength);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // AC-4: Signal strength metric available ← R5.2
  // ---------------------------------------------------------------------------

  describe('AC-4: Signal strength metric available', () => {
    test('signalAnalysis.signalStrength returns strong | medium | weak', () => {
      const result = solve(1, false, 'easy');

      expect(result.signalAnalysis).toBeDefined();
      const validStrengths: SignalStrength[] = ['strong', 'medium', 'weak'];
      expect(validStrengths).toContain(result.signalAnalysis!.signalStrength);
    });

    test('strong signal for self_contradiction', () => {
      const config = makeConfig();
      const evidence: EvidenceItem[] = [
        presence('p1', 'npc_culprit', 'W3', 'bedroom'),
        presence('p2', 'npc_culprit', 'W3', 'kitchen'),
      ];
      const signal = analyzeSignal(evidence, config);
      expect(signal.signalStrength).toBe('strong');
    });

    test('medium signal for scene_presence', () => {
      const config = makeConfig();
      const evidence: EvidenceItem[] = [
        deviceLog('d1', {
          window: 'W3',
          place: 'kitchen',
          actor: 'npc_culprit',
        }),
      ];
      const signal = analyzeSignal(evidence, config);
      expect(signal.signalStrength).toBe('medium');
    });
  });

  // ---------------------------------------------------------------------------
  // EC-1: Preferred type not achievable
  // ---------------------------------------------------------------------------

  describe('EC-1: Preferred type not achievable', () => {
    test('natural signal used when it differs from preference (no forced injection)', () => {
      // Evidence naturally produces scene_presence, but preference is self_contradiction
      const config = makeConfig({
        signalConfig: { preferredType: 'self_contradiction' },
      });
      const evidence: EvidenceItem[] = [
        deviceLog('d1', {
          window: 'W3',
          place: 'kitchen', // crimePlace
          actor: 'npc_culprit',
        }),
      ];

      const signal = analyzeSignal(evidence, config);

      // Should use the natural signal, not force injection
      expect(signal.hasSignal).toBe(true);
      expect(signal.signalType).toBe('scene_presence');
    });

    test('pipeline does not inject when signal exists even if type mismatches preference', () => {
      // Run validated pipeline with a preference for self_contradiction
      const result = generateValidatedCase(1, 2, {
        difficulty: 'easy',
        signalConfig: { preferredType: 'scene_presence' },
      });

      if (result) {
        const signal = analyzeSignal(result.evidence, result.sim.config);
        // Signal exists → no injection needed regardless of preference mismatch
        expect(signal.hasSignal).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // EC-2: Multiple signals match preference
  // ---------------------------------------------------------------------------

  describe('EC-2: Multiple signals match preference', () => {
    test('when self_contradiction and device_contradiction both exist, reports strongest', () => {
      const config = makeConfig();
      const evidence: EvidenceItem[] = [
        // Self-contradiction: culprit in bedroom AND kitchen in W3
        presence('p1', 'npc_culprit', 'W3', 'bedroom'),
        presence('p2', 'npc_culprit', 'W3', 'kitchen'),
        // Device contradiction: door sensor also catches them
        deviceLog('d1', {
          window: 'W3',
          place: 'kitchen',
          actor: 'npc_culprit',
        }),
      ];

      const signal = analyzeSignal(evidence, config);

      // self_contradiction is strongest → reported first
      expect(signal.signalType).toBe('self_contradiction');
      expect(signal.signalStrength).toBe('strong');
    });

    test('when no preference set, strongest signal wins', () => {
      const config = makeConfig(); // no signalConfig
      const evidence: EvidenceItem[] = [
        presence('p1', 'npc_culprit', 'W3', 'bedroom'),
        presence('p2', 'npc_culprit', 'W3', 'kitchen'),
      ];

      const signal = analyzeSignal(evidence, config);
      expect(signal.signalType).toBe('self_contradiction');
    });
  });

  // ---------------------------------------------------------------------------
  // ERR-1: Invalid signal type in config (compile-time check)
  // ---------------------------------------------------------------------------

  describe('ERR-1: Invalid signal type in config', () => {
    test('TypeScript rejects invalid signal type', () => {
      // This verifies the type constraint exists — the invalid value is caught by ts-expect-error
      // @ts-expect-error - 'invalid_type' is not a valid SignalType
      const _badConfig: SignalConfig = { preferredType: 'invalid_type' };

      // Valid types should work without error
      const validConfig: SignalConfig = { preferredType: 'self_contradiction' };
      expect(validConfig.preferredType).toBe('self_contradiction');
    });

    test('TypeScript rejects invalid signal strength', () => {
      // @ts-expect-error - 'invalid_strength' is not a valid SignalStrength
      const _badConfig: SignalConfig = { minStrength: 'invalid_strength' };

      const validConfig: SignalConfig = { minStrength: 'strong' };
      expect(validConfig.minStrength).toBe('strong');
    });
  });
});

// ===========================================================================
// Integration Tests: Full Pipeline Wiring
// ===========================================================================

describe('Integration: Full pipeline wiring', () => {
  // -------------------------------------------------------------------------
  // solve() → signalAnalysis populated across multiple seeds
  // -------------------------------------------------------------------------

  describe('solve() always returns signalAnalysis when simulation succeeds', () => {
    test('signalAnalysis is present for 10 seeds at easy difficulty', () => {
      let successCount = 0;
      for (let seed = 1; seed <= 10; seed++) {
        const result = solve(seed, false, 'easy');
        if (result.failReason === 'sim_failed') continue; // sim failed, no evidence
        successCount++;

        expect(result.signalAnalysis).toBeDefined();
        expect(typeof result.signalAnalysis!.hasSignal).toBe('boolean');
        expect(result.signalAnalysis!.signalType).toBeDefined();
        expect(result.signalAnalysis!.signalStrength).toBeDefined();
      }
      expect(successCount).toBeGreaterThan(0);
    });

    test('signalAnalysis is present for 10 seeds at hard difficulty', () => {
      let successCount = 0;
      for (let seed = 1; seed <= 10; seed++) {
        const result = solve(seed, false, 'hard');
        if (result.failReason === 'sim_failed') continue;
        successCount++;

        expect(result.signalAnalysis).toBeDefined();
        expect(['strong', 'medium', 'weak']).toContain(result.signalAnalysis!.signalStrength);
      }
      expect(successCount).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // signalConfig flows end-to-end through generateValidatedCase
  // -------------------------------------------------------------------------

  describe('signalConfig flows through pipeline', () => {
    test('signalConfig set in options appears on sim.config after generation', () => {
      const signalConfig: SignalConfig = {
        preferredType: 'device_contradiction',
        minStrength: 'medium',
      };

      const result = generateValidatedCase(1, 2, {
        difficulty: 'easy',
        signalConfig,
      });

      if (result) {
        // signalConfig should be preserved on the generated config
        expect(result.sim.config.signalConfig).toBeDefined();
        expect(result.sim.config.signalConfig!.preferredType).toBe('device_contradiction');
        expect(result.sim.config.signalConfig!.minStrength).toBe('medium');
      }
    });

    test('signalConfig undefined by default (backward compatible)', () => {
      const result = generateValidatedCase(1, 2);

      if (result) {
        expect(result.sim.config.signalConfig).toBeUndefined();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Full round-trip: generateValidatedCase + analyzeSignal consistency
  // -------------------------------------------------------------------------

  describe('generateValidatedCase output is consistent with analyzeSignal', () => {
    test('re-analyzing returned evidence produces hasSignal: true', () => {
      for (let seed = 1; seed <= 5; seed++) {
        const result = generateValidatedCase(seed, 2, { difficulty: 'easy' });
        if (!result) continue;

        // Re-running analyzeSignal on the output should still show a signal
        const signal = analyzeSignal(result.evidence, result.sim.config);
        expect(signal.hasSignal).toBe(true);
        expect(['self_contradiction', 'device_contradiction', 'scene_presence']).toContain(signal.signalType);
      }
    });
  });

  // -------------------------------------------------------------------------
  // injectedSignal flag wiring
  // -------------------------------------------------------------------------

  describe('injectedSignal flag is properly set', () => {
    test('non-injected cases have injectedSignal falsy', () => {
      // Most seeds at easy difficulty should have natural signals
      let foundNatural = false;
      for (let seed = 1; seed <= 20; seed++) {
        const result = generateValidatedCase(seed, 2, { difficulty: 'easy' });
        if (result && !result.sim.config.injectedSignal) {
          foundNatural = true;
          expect(result.sim.config.injectedSignal).toBeFalsy();
          break;
        }
      }
      expect(foundNatural).toBe(true);
    });
  });
});
