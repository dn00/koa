import { describe, it, expect } from 'vitest';
import { checkCorroboration, calculateCorroborationBonus } from '../../src/resolver/corroboration.js';
import type { EvidenceCard, CardId } from '../../src/index.js';
import { ProofType } from '../../src/index.js';

/**
 * Task 005: Corroboration Bonus
 */
describe('Task 005: Corroboration Bonus', () => {
  // Helper to create test cards
  function createCard(
    id: string,
    power: number,
    claims: { location?: string; state?: string; activity?: string; timeRange?: string } = {}
  ): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power,
      proves: [ProofType.IDENTITY],
      claims,
    };
  }

  // ==========================================================================
  // AC-1: 25% bonus for same location
  // ==========================================================================
  describe('AC-1: 25% bonus for same location', () => {
    it('should detect corroboration when two cards share location', () => {
      const cards = [
        createCard('1', 4, { location: 'kitchen' }),
        createCard('2', 4, { location: 'kitchen' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toContain('location:kitchen');
    });

    it('should apply 25% bonus for corroborated submission (power 8 → 10)', () => {
      // baseDamage = 8, bonus = ceil(8 * 0.25) = 2, total = 10
      const bonus = calculateCorroborationBonus(8, true);
      expect(bonus).toBe(2);
    });
  });

  // ==========================================================================
  // AC-2: 25% bonus for same state
  // ==========================================================================
  describe('AC-2: 25% bonus for same state', () => {
    it('should detect corroboration when two cards share state', () => {
      const cards = [
        createCard('1', 4, { state: 'AWAKE' }),
        createCard('2', 4, { state: 'AWAKE' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toContain('state:AWAKE');
    });

    it('should normalize state to uppercase for comparison', () => {
      const cards = [
        createCard('1', 4, { state: 'awake' }),
        createCard('2', 4, { state: 'AWAKE' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
    });
  });

  // ==========================================================================
  // AC-3: ceil() rounding
  // ==========================================================================
  describe('AC-3: ceil() rounding', () => {
    it('should use ceil rounding for bonus (power 7 → bonus 2)', () => {
      // ceil(7 * 0.25) = ceil(1.75) = 2
      const bonus = calculateCorroborationBonus(7, true);
      expect(bonus).toBe(2);
    });

    it('should use ceil rounding for bonus (power 5 → bonus 2)', () => {
      // ceil(5 * 0.25) = ceil(1.25) = 2
      const bonus = calculateCorroborationBonus(5, true);
      expect(bonus).toBe(2);
    });

    it('should use ceil rounding for bonus (power 4 → bonus 1)', () => {
      // ceil(4 * 0.25) = ceil(1.0) = 1
      const bonus = calculateCorroborationBonus(4, true);
      expect(bonus).toBe(1);
    });
  });

  // ==========================================================================
  // EC-1: No bonus for single card
  // ==========================================================================
  describe('EC-1: No bonus for single card', () => {
    it('should not detect corroboration for single card', () => {
      const cards = [createCard('1', 4, { location: 'kitchen' })];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(false);
      expect(result.sharedClaims).toHaveLength(0);
    });

    it('should return 0 bonus when no corroboration', () => {
      const bonus = calculateCorroborationBonus(8, false);
      expect(bonus).toBe(0);
    });
  });

  // ==========================================================================
  // EC-2: No bonus for different claims
  // ==========================================================================
  describe('EC-2: No bonus for different claims', () => {
    it('should not detect corroboration for different locations', () => {
      const cards = [
        createCard('1', 4, { location: 'kitchen' }),
        createCard('2', 4, { location: 'bedroom' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(false);
    });

    it('should not detect corroboration for different states', () => {
      const cards = [
        createCard('1', 4, { state: 'AWAKE' }),
        createCard('2', 4, { state: 'ASLEEP' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(false);
    });
  });

  // ==========================================================================
  // EC-2: Three cards all match still only 25% bonus
  // ==========================================================================
  describe('EC-2: Three Cards All Match', () => {
    it('should detect corroboration when all three cards share location', () => {
      const cards = [
        createCard('1', 4, { location: 'kitchen' }),
        createCard('2', 4, { location: 'kitchen' }),
        createCard('3', 4, { location: 'kitchen' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toContain('location:kitchen');
    });

    it('should still apply only 25% bonus with 3+ matching cards (not 50%)', () => {
      // 3 cards all match should still only give 25% bonus
      // baseDamage = 12 (4+4+4), bonus = ceil(12 * 0.25) = 3
      const bonus = calculateCorroborationBonus(12, true);
      expect(bonus).toBe(3); // Not 6 (50%)
    });
  });

  // ==========================================================================
  // EC-3: Empty claims = no corroboration
  // ==========================================================================
  describe('EC-3: Empty claims = no corroboration', () => {
    it('should not detect corroboration when cards have empty claims', () => {
      const cards = [createCard('1', 4, {}), createCard('2', 4, {})];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(false);
    });

    it('should handle empty array', () => {
      const result = checkCorroboration([]);
      expect(result.hasCorroboration).toBe(false);
      expect(result.sharedClaims).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================
  describe('Additional edge cases', () => {
    it('should detect corroboration for matching activity', () => {
      const cards = [
        createCard('1', 4, { activity: 'running' }),
        createCard('2', 4, { activity: 'running' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toContain('activity:running');
    });

    it('should detect corroboration for matching timeRange', () => {
      const cards = [
        createCard('1', 4, { timeRange: '2:00am-2:05am' }),
        createCard('2', 4, { timeRange: '2:00am-2:05am' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toContain('timeRange:2:00am-2:05am');
    });

    it('should detect multiple shared claims', () => {
      const cards = [
        createCard('1', 4, { location: 'kitchen', state: 'AWAKE' }),
        createCard('2', 4, { location: 'kitchen', state: 'AWAKE' }),
      ];
      const result = checkCorroboration(cards);
      expect(result.hasCorroboration).toBe(true);
      expect(result.sharedClaims).toHaveLength(2);
    });
  });
});
