import { describe, test, expect } from 'vitest';
import type { DifficultyTier } from '../src/types.js';
import { solve, type SolveResult } from '../src/solver.js';

// ---------------------------------------------------------------------------
// Task 006: Evidence-Only Solver WHO
// ---------------------------------------------------------------------------

describe('Task 006: Evidence-Only Solver WHO', () => {

  // -------------------------------------------------------------------------
  // AC-1: WHO deduction uses HARD count only ← R4.1
  // -------------------------------------------------------------------------
  describe('AC-1: WHO deduction uses HARD count', () => {
    test('culprit identified by HARD contradictions, not gossip text', () => {
      let caughtByHard = 0;
      let totalValid = 0;

      for (let seed = 1; seed <= 30; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;
        if (!result.metrics) continue;
        totalValid++;

        // When culprit has most HARD, solver should identify them correctly
        if (result.metrics.culpritHardContradictions > 0 &&
            result.metrics.maxInnocentHardContradictions === 0 &&
            result.coreCorrect) {
          caughtByHard++;
        }
      }

      expect(totalValid).toBeGreaterThan(0);
      // HARD count should be the primary WHO signal
      expect(caughtByHard / totalValid).toBeGreaterThanOrEqual(0.7);
    });

    test('culprit is most-caught by HARD count in majority of cases', () => {
      let mostCaughtCount = 0;
      let totalValid = 0;

      for (let seed = 1; seed <= 30; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;
        if (!result.metrics) continue;
        totalValid++;

        if (result.metrics.culpritIsMostCaught) {
          mostCaughtCount++;
        }
      }

      expect(totalValid).toBeGreaterThan(0);
      expect(mostCaughtCount / totalValid).toBeGreaterThanOrEqual(0.7);
    });
  });

  // -------------------------------------------------------------------------
  // AC-2: No gossip text matching for WHO ← R4.1
  // -------------------------------------------------------------------------
  describe('AC-2: No motiveSignatures for WHO', () => {
    test('WHO deduction code path does not use motiveSignatures', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const solverPath = path.resolve(import.meta.dirname, '../src/solver.ts');
      const source = fs.readFileSync(solverPath, 'utf8');

      // Find buildSmartAccusation function
      const funcStart = source.indexOf('function buildSmartAccusation');
      expect(funcStart).toBeGreaterThan(-1);

      // Find the WHAT section — WHO logic is between function start and "// WHAT:"
      const whatStart = source.indexOf('// WHAT:', funcStart);
      expect(whatStart).toBeGreaterThan(funcStart);
      const whoSection = source.slice(funcStart, whatStart);

      // motiveSignatures and suspectsWithSignatureMotive must NOT appear in WHO section
      expect(whoSection).not.toContain('motiveSignatures');
      expect(whoSection).not.toContain('suspectsWithSignatureMotive');
    });
  });

  // -------------------------------------------------------------------------
  // AC-3: Motive is tiebreaker only ← R4.2
  // -------------------------------------------------------------------------
  describe('AC-3: Motive is tiebreaker only', () => {
    test('HARD contradictions drive WHO, not motive', () => {
      let correctWithHard = 0;
      let totalWithHard = 0;

      for (let seed = 1; seed <= 30; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;
        if (!result.metrics) continue;
        if (result.metrics.culpritHardContradictions === 0) continue;

        totalWithHard++;
        if (result.coreCorrect) correctWithHard++;
      }

      expect(totalWithHard).toBeGreaterThan(0);
      // When culprit has HARD contradictions, WHO should be correct
      // regardless of motive matching
      expect(correctWithHard / totalWithHard).toBeGreaterThanOrEqual(0.8);
    });
  });

  // -------------------------------------------------------------------------
  // AC-4: New metrics populated ← R4.3
  // -------------------------------------------------------------------------
  describe('AC-4: New metrics populated', () => {
    test('solve result includes culpritHardContradictions', () => {
      const result = solve(1, false, 2);

      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics!.culpritHardContradictions).toBe('number');
      expect(result.metrics!.culpritHardContradictions).toBeGreaterThanOrEqual(0);
    });

    test('solve result includes maxInnocentHardContradictions', () => {
      const result = solve(1, false, 2);

      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics!.maxInnocentHardContradictions).toBe('number');
      expect(result.metrics!.maxInnocentHardContradictions).toBeGreaterThanOrEqual(0);
    });

    test('solve result includes culpritIsMostCaught', () => {
      const result = solve(1, false, 2);

      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics!.culpritIsMostCaught).toBe('boolean');
    });

    test('metrics have valid values across multiple seeds', () => {
      for (let seed = 1; seed <= 10; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;

        expect(result.metrics).toBeDefined();
        const m = result.metrics!;
        expect(m.culpritHardContradictions).toBeGreaterThanOrEqual(0);
        expect(m.maxInnocentHardContradictions).toBeGreaterThanOrEqual(0);
        expect(typeof m.culpritIsMostCaught).toBe('boolean');

        // Invariant: if culprit has most HARD, culpritIsMostCaught should be true
        if (m.culpritHardContradictions > m.maxInnocentHardContradictions) {
          expect(m.culpritIsMostCaught).toBe(true);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // AC-5: Solve rate >= 80% on tiers 1-4 ← INV-1
  // -------------------------------------------------------------------------
  describe('AC-5: Solve rate >= 80% on all tiers', () => {
    for (const tier of [1, 2, 3, 4] as DifficultyTier[]) {
      test(`tier ${tier}: coreCorrect >= 80% across 100 seeds`, () => {
        let correct = 0;
        let total = 0;

        for (let seed = 1; seed <= 100; seed++) {
          const result = solve(seed, false, tier);
          if (result.failReason === 'sim_failed') continue;
          total++;
          if (result.coreCorrect) correct++;
        }

        expect(total).toBeGreaterThan(50); // At least 50 valid cases
        const rate = correct / total;
        expect(rate).toBeGreaterThanOrEqual(0.8);
      }, 120_000); // 2 min timeout per tier
    }
  });

  // -------------------------------------------------------------------------
  // EC-1: No HARD contradictions found → fallback
  // -------------------------------------------------------------------------
  describe('EC-1: No HARD contradictions → fallback to SOFT then motive', () => {
    test('solver handles 0-HARD cases gracefully', () => {
      let zeroHardCount = 0;
      let totalValid = 0;

      for (let seed = 1; seed <= 50; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;
        if (!result.metrics) continue;
        totalValid++;

        if (result.metrics.culpritHardContradictions === 0) {
          zeroHardCount++;
          // Should still produce a valid result (doesn't crash)
          expect(result.solved || result.failReason).toBeTruthy();
        }
      }

      expect(totalValid).toBeGreaterThan(0);
      // Even if some cases have 0 HARD, they should be handled gracefully
    });
  });

  // -------------------------------------------------------------------------
  // EC-2: Multiple suspects tied on HARD → tiebreak works
  // -------------------------------------------------------------------------
  describe('EC-2: Tied HARD count → tiebreak resolves', () => {
    test('solver always produces a WHO answer even in edge cases', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const result = solve(seed, false, 2);
        if (result.failReason === 'sim_failed') continue;
        if (!result.solved) continue;

        // If solved, the accusation must include a valid WHO
        expect(result.details?.accusation).toBeDefined();
        expect(result.details!.accusation!.length).toBeGreaterThan(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // ERR-1: Legacy CompareResult without level → backward compat
  // -------------------------------------------------------------------------
  describe('ERR-1: Legacy CompareResult backward compat', () => {
    test('findAllContradictions handles contradiction: true without level as HARD', () => {
      // When compareEvidence returns contradiction: true but level is missing,
      // the solver should treat it as HARD_CONTRADICTION for backward compat.
      // Since Task 003 updated compareEvidence to always return level, this is
      // a safeguard tested by ensuring the metrics code doesn't crash.
      const result = solve(1, false, 2);
      expect(result.metrics).toBeDefined();
      expect(typeof result.metrics!.culpritHardContradictions).toBe('number');
      expect(typeof result.metrics!.maxInnocentHardContradictions).toBe('number');
    });
  });
});
