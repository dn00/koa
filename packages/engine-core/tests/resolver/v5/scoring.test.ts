import { describe, it, expect } from 'vitest';
import { scoreCard, checkTypeTax } from '../../../src/resolver/v5/scoring.js';
import type { Card, CardId, GameConfig } from '../../../src/types/v5/index.js';
import { DEFAULT_CONFIG } from '../../../src/types/v5/index.js';

/**
 * Task 004: Scoring & Type Tax
 * Tests for scoreCard and checkTypeTax functions
 */
describe('Task 004: Scoring & Type Tax', () => {
  // Helper to create a test card
  function createCard(
    id: string,
    strength: number,
    evidenceType: Card['evidenceType'] = 'DIGITAL',
    isLie = false
  ): Card {
    return {
      id: `card_${id}` as CardId,
      strength,
      evidenceType,
      location: 'Test Location',
      time: '10:00 AM',
      claim: 'Test claim',
      presentLine: 'Test present line',
      isLie,
    };
  }

  // Helper to create a custom config
  function createConfig(overrides: Partial<GameConfig> = {}): GameConfig {
    return {
      ...DEFAULT_CONFIG,
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: scoreCard Returns Correct Belief Change for Truth
  // ==========================================================================
  describe('AC-1: scoreCard Returns Correct Belief Change for Truth', () => {
    it('should return beliefChange equal to strength for truth card', () => {
      const truthCard = createCard('truth', 3, 'DIGITAL', false);
      const result = scoreCard(truthCard, DEFAULT_CONFIG, false);
      expect(result).toEqual({ beliefChange: 3, wasLie: false });
    });

    it('should handle different strength values', () => {
      const card1 = createCard('t1', 1, 'DIGITAL', false);
      const card5 = createCard('t5', 5, 'DIGITAL', false);

      expect(scoreCard(card1, DEFAULT_CONFIG, false).beliefChange).toBe(1);
      expect(scoreCard(card5, DEFAULT_CONFIG, false).beliefChange).toBe(5);
    });
  });

  // ==========================================================================
  // AC-2: scoreCard Returns Correct Belief Change for Lie
  // ==========================================================================
  describe('AC-2: scoreCard Returns Correct Belief Change for Lie', () => {
    it('should return beliefChange of -(strength-1) for lie card', () => {
      const lieCard = createCard('lie', 3, 'DIGITAL', true);
      const result = scoreCard(lieCard, DEFAULT_CONFIG, false);
      // DEFAULT_CONFIG.scoring.lie(3) = -(3-1) = -2
      expect(result).toEqual({ beliefChange: -2, wasLie: true });
    });

    it('should handle strength 1 lie (no penalty)', () => {
      const lieCard = createCard('lie', 1, 'DIGITAL', true);
      const result = scoreCard(lieCard, DEFAULT_CONFIG, false);
      // DEFAULT_CONFIG.scoring.lie(1) = -(1-1) = -0 which equals 0
      // Using numeric comparison to handle -0 vs 0
      expect(result.beliefChange === 0).toBe(true);
      expect(result.beliefChange + 0).toBe(0);
      expect(result.wasLie).toBe(true);
    });

    it('should handle strength 5 lie (max penalty)', () => {
      const lieCard = createCard('lie', 5, 'DIGITAL', true);
      const result = scoreCard(lieCard, DEFAULT_CONFIG, false);
      // DEFAULT_CONFIG.scoring.lie(5) = -(5-1) = -4
      expect(result.beliefChange).toBe(-4);
    });
  });

  // ==========================================================================
  // AC-3: scoreCard Applies Type Tax Penalty
  // ==========================================================================
  describe('AC-3: scoreCard Applies Type Tax Penalty', () => {
    it('should apply type tax penalty when typeTaxActive is true', () => {
      const truthCard = createCard('truth', 3, 'DIGITAL', false);
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      const result = scoreCard(truthCard, config, true);
      // 3 (truth) + (-2) (penalty) = 1
      expect(result).toEqual({ beliefChange: 1, wasLie: false });
    });

    it('should not apply penalty when typeTaxActive is false', () => {
      const truthCard = createCard('truth', 3, 'DIGITAL', false);
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      const result = scoreCard(truthCard, config, false);
      expect(result.beliefChange).toBe(3);
    });

    it('should not apply penalty when typeTax.enabled is false', () => {
      const truthCard = createCard('truth', 3, 'DIGITAL', false);
      const config = createConfig({
        typeTax: { enabled: false, penalty: -2 },
      });
      const result = scoreCard(truthCard, config, true);
      expect(result.beliefChange).toBe(3);
    });

    it('should apply penalty to lie cards too', () => {
      const lieCard = createCard('lie', 3, 'DIGITAL', true);
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      const result = scoreCard(lieCard, config, true);
      // -2 (lie) + (-2) (penalty) = -4
      expect(result.beliefChange).toBe(-4);
    });
  });

  // ==========================================================================
  // AC-4: checkTypeTax Detects Same Type
  // ==========================================================================
  describe('AC-4: checkTypeTax Detects Same Type', () => {
    it('should return true when current and previous have same type', () => {
      const current = createCard('current', 3, 'DIGITAL');
      const previous = createCard('previous', 2, 'DIGITAL');
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      expect(checkTypeTax(current, previous, config)).toBe(true);
    });

    it('should return false when types differ', () => {
      const current = createCard('current', 3, 'DIGITAL');
      const previous = createCard('previous', 2, 'PHYSICAL');
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      expect(checkTypeTax(current, previous, config)).toBe(false);
    });

    it('should work with all evidence types', () => {
      const types: Card['evidenceType'][] = ['DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR'];
      const config = createConfig({ typeTax: { enabled: true, penalty: -2 } });

      for (const type of types) {
        const current = createCard('curr', 3, type);
        const previous = createCard('prev', 2, type);
        expect(checkTypeTax(current, previous, config)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // EC-1: checkTypeTax with no previous card
  // ==========================================================================
  describe('EC-1: checkTypeTax with no previous card', () => {
    it('should return false when previousCard is null (first turn)', () => {
      const current = createCard('first', 3, 'DIGITAL');
      const config = createConfig({
        typeTax: { enabled: true, penalty: -2 },
      });
      expect(checkTypeTax(current, null, config)).toBe(false);
    });
  });

  // ==========================================================================
  // EC-2: checkTypeTax when disabled
  // ==========================================================================
  describe('EC-2: checkTypeTax when disabled', () => {
    it('should return false even if same type when config.typeTax.enabled is false', () => {
      const current = createCard('current', 3, 'DIGITAL');
      const previous = createCard('previous', 2, 'DIGITAL');
      const config = createConfig({
        typeTax: { enabled: false, penalty: -2 },
      });
      expect(checkTypeTax(current, previous, config)).toBe(false);
    });
  });
});
