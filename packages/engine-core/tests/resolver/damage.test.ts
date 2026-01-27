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
      expect(calculateBaseDamage(cards)).toBe(5);
    });

    it('should sum power values of three cards', () => {
      const cards = [createCard('1', 2), createCard('2', 3), createCard('3', 4)];
      expect(calculateBaseDamage(cards)).toBe(9);
    });
  });

  // ==========================================================================
  // AC-2: Return total as resistance reduction
  // ==========================================================================
  describe('AC-2: Return total as resistance reduction', () => {
    it('should return a number representing resistance reduction', () => {
      const cards = [createCard('1', 5)];
      const result = calculateBaseDamage(cards);
      expect(typeof result).toBe('number');
      expect(result).toBe(5);
    });
  });

  // ==========================================================================
  // AC-3: Handle empty submission
  // ==========================================================================
  describe('AC-3: Handle empty submission', () => {
    it('should return 0 for empty array', () => {
      expect(calculateBaseDamage([])).toBe(0);
    });
  });

  // ==========================================================================
  // AC-4: Handle single card
  // ==========================================================================
  describe('AC-4: Handle single card', () => {
    it('should return power of single card', () => {
      const cards = [createCard('1', 5)];
      expect(calculateBaseDamage(cards)).toBe(5);
    });

    it('should return power of single card with different value', () => {
      const cards = [createCard('1', 7)];
      expect(calculateBaseDamage(cards)).toBe(7);
    });
  });

  // ==========================================================================
  // EC-1: Cards with power 0 contribute nothing
  // ==========================================================================
  describe('EC-1: Cards with power 0 contribute nothing', () => {
    it('should handle cards with zero power', () => {
      const cards = [createCard('1', 0), createCard('2', 3)];
      expect(calculateBaseDamage(cards)).toBe(3);
    });

    it('should return 0 for all zero power cards', () => {
      const cards = [createCard('1', 0), createCard('2', 0)];
      expect(calculateBaseDamage(cards)).toBe(0);
    });
  });
});
