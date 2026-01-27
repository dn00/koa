import { describe, it, expect } from 'vitest';
import { calculateBaseDamage } from '../../src/resolver/damage.js';
import type { EvidenceCard, CardId } from '../../src/index.js';
import { ProofType } from '../../src/index.js';

/**
 * Task 003: Basic Damage Calculation
 */
describe('Task 003: Basic Damage Calculation', () => {
  // Helper to create test cards
  function createCard(id: string, power: number): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power,
      proves: [ProofType.IDENTITY],
      claims: {},
    };
  }

  // ==========================================================================
  // AC-1: Sum card power values
  // ==========================================================================
  describe('AC-1: Sum card power values', () => {
    it('should sum power values of multiple cards', () => {
      const cards = [createCard('1', 3), createCard('2', 2)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
    });

    it('should sum power values of three cards', () => {
      const cards = [createCard('1', 2), createCard('2', 3), createCard('3', 4)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(9);
      }
    });
  });

  // ==========================================================================
  // AC-2: Return total as resistance reduction
  // ==========================================================================
  describe('AC-2: Return total as resistance reduction', () => {
    it('should return a number representing resistance reduction', () => {
      const cards = [createCard('1', 5)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(typeof result.value).toBe('number');
        expect(result.value).toBe(5);
      }
    });
  });

  // ==========================================================================
  // AC-3: Handle empty submission (now returns error)
  // ==========================================================================
  describe('AC-3: Handle empty submission', () => {
    it('should return error for empty array', () => {
      const result = calculateBaseDamage([]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Submission must contain 1-3 cards');
      }
    });
  });

  // ==========================================================================
  // AC-4: Handle single card
  // ==========================================================================
  describe('AC-4: Handle single card', () => {
    it('should return power of single card', () => {
      const cards = [createCard('1', 5)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
    });

    it('should return power of single card with different value', () => {
      const cards = [createCard('1', 7)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(7);
      }
    });
  });

  // ==========================================================================
  // AC-5: Pure Function (deterministic)
  // ==========================================================================
  describe('AC-5: Pure Function', () => {
    it('should return same result for same input called multiple times', () => {
      const cards = [createCard('1', 3), createCard('2', 7)];

      const result1 = calculateBaseDamage(cards);
      const result2 = calculateBaseDamage(cards);
      const result3 = calculateBaseDamage(cards);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);

      if (result1.ok && result2.ok && result3.ok) {
        expect(result1.value).toBe(result2.value);
        expect(result2.value).toBe(result3.value);
        expect(result1.value).toBe(10);
      }
    });
  });

  // ==========================================================================
  // EC-1: Cards with power 0 contribute nothing
  // ==========================================================================
  describe('EC-1: Cards with power 0 contribute nothing', () => {
    it('should handle cards with zero power', () => {
      const cards = [createCard('1', 0), createCard('2', 3)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
    });

    it('should return 0 for all zero power cards', () => {
      const cards = [createCard('1', 0), createCard('2', 0)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0);
      }
    });
  });

  // ==========================================================================
  // EC-2: Maximum Cards (3)
  // ==========================================================================
  describe('EC-2: Maximum Cards (3)', () => {
    it('should calculate correctly for exactly 3 cards', () => {
      const cards = [createCard('1', 2), createCard('2', 3), createCard('3', 5)];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(10);
      }
    });
  });

  // ==========================================================================
  // ERR-1: Invalid Submission Size
  // ==========================================================================
  describe('ERR-1: Invalid Submission Size', () => {
    it('should return error for empty submission', () => {
      const result = calculateBaseDamage([]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Submission must contain 1-3 cards');
      }
    });

    it('should return error for more than 3 cards', () => {
      const cards = [
        createCard('1', 1),
        createCard('2', 2),
        createCard('3', 3),
        createCard('4', 4),
      ];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Submission must contain 1-3 cards');
      }
    });

    it('should return error for 5 cards', () => {
      const cards = [
        createCard('1', 1),
        createCard('2', 2),
        createCard('3', 3),
        createCard('4', 4),
        createCard('5', 5),
      ];
      const result = calculateBaseDamage(cards);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe('DamageError');
      }
    });
  });
});
