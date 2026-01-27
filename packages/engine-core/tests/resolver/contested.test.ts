import { describe, it, expect } from 'vitest';
import {
  checkContested,
  applyContestedPenalty,
  processContestedCards,
} from '../../src/resolver/contested.js';
import type { EvidenceCard, CounterEvidence, CardId, CounterId } from '../../src/index.js';
import { ProofType } from '../../src/index.js';

/**
 * Task 006: Counter-Evidence and Contested Penalty
 */
describe('Task 006: Counter-Evidence and Contested Penalty', () => {
  // Helper to create test cards
  function createCard(id: string, power: number): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power,
      proves: [ProofType.IDENTITY],
      claims: {},
    };
  }

  // Helper to create counter-evidence
  function createCounter(
    id: string,
    targets: string[],
    refuted = false
  ): CounterEvidence {
    return {
      id: `counter_${id}` as CounterId,
      targets: targets.map((t) => `card_${t}` as CardId),
      refuted,
    };
  }

  // ==========================================================================
  // AC-1: Counter targets via CardId[] targets field
  // ==========================================================================
  describe('AC-1: Counter targets via CardId[] targets field', () => {
    it('should contest card when it is in counter targets', () => {
      const card = createCard('1', 10);
      const counters = [createCounter('a', ['1'])];
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(true);
      expect(result.contestedBy).toContain('counter_a');
    });

    it('should track all counters targeting a card', () => {
      const card = createCard('1', 10);
      const counters = [createCounter('a', ['1']), createCounter('b', ['1'])];
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(true);
      expect(result.contestedBy).toHaveLength(2);
      expect(result.contestedBy).toContain('counter_a');
      expect(result.contestedBy).toContain('counter_b');
    });
  });

  // ==========================================================================
  // AC-2: 50% penalty
  // ==========================================================================
  describe('AC-2: 50% penalty', () => {
    it('should apply 50% penalty (power 10 → 5)', () => {
      expect(applyContestedPenalty(10, true)).toBe(5);
    });

    it('should use ceil rounding (power 7 → 4)', () => {
      // ceil(7 * 0.5) = ceil(3.5) = 4
      expect(applyContestedPenalty(7, true)).toBe(4);
    });

    it('should use ceil rounding (power 5 → 3)', () => {
      // ceil(5 * 0.5) = ceil(2.5) = 3
      expect(applyContestedPenalty(5, true)).toBe(3);
    });

    it('should calculate adjusted power in contest result', () => {
      const card = createCard('1', 10);
      const counters = [createCounter('a', ['1'])];
      const result = checkContested(card, counters);
      expect(result.originalPower).toBe(10);
      expect(result.adjustedPower).toBe(5);
    });
  });

  // ==========================================================================
  // AC-3: Refuted counters inactive
  // ==========================================================================
  describe('AC-3: Refuted counters are inactive', () => {
    it('should not contest card when counter is refuted', () => {
      const card = createCard('1', 10);
      const counters = [createCounter('a', ['1'], true)]; // refuted
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(false);
      expect(result.contestedBy).toHaveLength(0);
    });

    it('should only count non-refuted counters', () => {
      const card = createCard('1', 10);
      const counters = [
        createCounter('a', ['1'], true), // refuted
        createCounter('b', ['1'], false), // active
      ];
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(true);
      expect(result.contestedBy).toHaveLength(1);
      expect(result.contestedBy).toContain('counter_b');
    });
  });

  // ==========================================================================
  // EC-1: Untargeted cards are unaffected
  // ==========================================================================
  describe('EC-1: Untargeted cards are unaffected', () => {
    it('should not contest card when not in targets', () => {
      const card = createCard('1', 10);
      const counters = [createCounter('a', ['2', '3'])]; // targets other cards
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(false);
      expect(result.adjustedPower).toBe(10);
    });

    it('should return full power when not contested', () => {
      expect(applyContestedPenalty(10, false)).toBe(10);
    });
  });

  // ==========================================================================
  // EC-2: Multiple counters = single penalty
  // ==========================================================================
  describe('EC-2: Multiple counters = single penalty (still 50%)', () => {
    it('should apply only 50% penalty even with multiple counters', () => {
      const card = createCard('1', 10);
      const counters = [
        createCounter('a', ['1']),
        createCounter('b', ['1']),
        createCounter('c', ['1']),
      ];
      const result = checkContested(card, counters);
      expect(result.isContested).toBe(true);
      expect(result.contestedBy).toHaveLength(3);
      // Still only 50% penalty, not 12.5%
      expect(result.adjustedPower).toBe(5);
    });
  });

  // ==========================================================================
  // processContestedCards
  // ==========================================================================
  describe('processContestedCards', () => {
    it('should process all cards against counters', () => {
      const cards = [createCard('1', 10), createCard('2', 8), createCard('3', 6)];
      const counters = [createCounter('a', ['1', '3'])];
      const results = processContestedCards(cards, counters);

      expect(results).toHaveLength(3);

      // Card 1: contested
      expect(results[0]!.cardId).toBe('card_1');
      expect(results[0]!.isContested).toBe(true);
      expect(results[0]!.adjustedPower).toBe(5);

      // Card 2: not contested
      expect(results[1]!.cardId).toBe('card_2');
      expect(results[1]!.isContested).toBe(false);
      expect(results[1]!.adjustedPower).toBe(8);

      // Card 3: contested
      expect(results[2]!.cardId).toBe('card_3');
      expect(results[2]!.isContested).toBe(true);
      expect(results[2]!.adjustedPower).toBe(3);
    });

    it('should handle empty cards array', () => {
      const results = processContestedCards([], [createCounter('a', ['1'])]);
      expect(results).toHaveLength(0);
    });

    it('should handle empty counters array', () => {
      const cards = [createCard('1', 10)];
      const results = processContestedCards(cards, []);
      expect(results).toHaveLength(1);
      expect(results[0]!.isContested).toBe(false);
      expect(results[0]!.adjustedPower).toBe(10);
    });
  });
});
