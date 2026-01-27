import { describe, it, expect } from 'vitest';
import {
  checkConcernsFulfilled,
  checkSubmissionConcernsFulfilled,
} from '../../src/resolver/concerns.js';
import type { EvidenceCard, Concern, CardId, ConcernId } from '../../src/index.js';
import { ProofType, ConcernType } from '../../src/index.js';

/**
 * Task 008: Concern Fulfillment Tracking
 */
describe('Task 008: Concern Fulfillment Tracking', () => {
  // Helper to create test cards
  function createCard(
    id: string,
    proves: ProofType[],
    state?: string
  ): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power: 1,
      proves,
      claims: { state },
    };
  }

  // Helper to create test concerns
  function createConcern(
    id: string,
    requiredProof: ProofType,
    addressed = false
  ): Concern {
    return {
      id: `concern_${id}` as ConcernId,
      type: requiredProof as unknown as ConcernType, // Same values
      requiredProof,
      addressed,
    };
  }

  // ==========================================================================
  // AC-1: Card proves IDENTITY addresses IDENTITY concern
  // ==========================================================================
  describe('AC-1: Card proves IDENTITY addresses IDENTITY concern', () => {
    it('should address IDENTITY concern when card proves IDENTITY', () => {
      const card = createCard('1', [ProofType.IDENTITY]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toContain('concern_id');
    });

    it('should not address IDENTITY concern when card proves LOCATION', () => {
      const card = createCard('1', [ProofType.LOCATION]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).not.toContain('concern_id');
    });
  });

  // ==========================================================================
  // AC-2: Card can address multiple concerns
  // ==========================================================================
  describe('AC-2: Card can address multiple concerns', () => {
    it('should address multiple concerns with multiple proof types', () => {
      const card = createCard('1', [ProofType.IDENTITY, ProofType.LOCATION]);
      const concerns = [
        createConcern('id', ProofType.IDENTITY),
        createConcern('loc', ProofType.LOCATION),
      ];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toHaveLength(2);
      expect(result).toContain('concern_id');
      expect(result).toContain('concern_loc');
    });
  });

  // ==========================================================================
  // AC-3: Concern requires ALL proof types matched
  // ==========================================================================
  describe('AC-3: Concern requires requiredProof matched', () => {
    it('should only address concern when requiredProof is present', () => {
      const card = createCard('1', [ProofType.IDENTITY]);
      const concerns = [
        createConcern('alert', ProofType.ALERTNESS),
      ];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // AC-4: ALERTNESS concern checks state requirement
  // ==========================================================================
  describe('AC-4: ALERTNESS concern checks state requirement', () => {
    it('should address ALERTNESS concern when state is AWAKE', () => {
      const card = createCard('1', [ProofType.ALERTNESS], 'AWAKE');
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toContain('concern_alert');
    });

    it('should address ALERTNESS concern when state is ALERT', () => {
      const card = createCard('1', [ProofType.ALERTNESS], 'ALERT');
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toContain('concern_alert');
    });

    it('should address ALERTNESS concern when state is ACTIVE', () => {
      const card = createCard('1', [ProofType.ALERTNESS], 'ACTIVE');
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toContain('concern_alert');
    });

    it('should NOT address ALERTNESS concern when state is ASLEEP', () => {
      const card = createCard('1', [ProofType.ALERTNESS], 'ASLEEP');
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).not.toContain('concern_alert');
    });

    it('should NOT address ALERTNESS concern when state is missing', () => {
      const card = createCard('1', [ProofType.ALERTNESS], undefined);
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).not.toContain('concern_alert');
    });

    it('should handle case-insensitive state matching', () => {
      const card = createCard('1', [ProofType.ALERTNESS], 'awake');
      const concerns = [createConcern('alert', ProofType.ALERTNESS)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toContain('concern_alert');
    });
  });

  // ==========================================================================
  // AC-5: Return list of addressed concern IDs
  // ==========================================================================
  describe('AC-5: Return list of addressed concern IDs', () => {
    it('should return array of ConcernId', () => {
      const card = createCard('1', [ProofType.IDENTITY]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('concern_id');
    });

    it('should return empty array when no concerns addressed', () => {
      const card = createCard('1', [ProofType.LOCATION]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // EC-1: Card with empty proves addresses nothing
  // ==========================================================================
  describe('EC-1: Card with empty proves addresses nothing', () => {
    it('should return empty array when card has no proves', () => {
      const card = createCard('1', []);
      const concerns = [
        createConcern('id', ProofType.IDENTITY),
        createConcern('loc', ProofType.LOCATION),
      ];

      const result = checkConcernsFulfilled(card, concerns, []);
      expect(result).toEqual([]);
    });
  });

  // ==========================================================================
  // EC-2: Already-addressed concerns not re-counted
  // ==========================================================================
  describe('EC-2: Already-addressed concerns not re-counted', () => {
    it('should not include already-addressed concerns', () => {
      const card = createCard('1', [ProofType.IDENTITY, ProofType.LOCATION]);
      const concerns = [
        createConcern('id', ProofType.IDENTITY),
        createConcern('loc', ProofType.LOCATION),
      ];

      const result = checkConcernsFulfilled(card, concerns, [
        'concern_id' as ConcernId,
      ]);
      expect(result).toHaveLength(1);
      expect(result).toContain('concern_loc');
      expect(result).not.toContain('concern_id');
    });

    it('should be idempotent - same card twice only addresses once', () => {
      const card = createCard('1', [ProofType.IDENTITY]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result1 = checkConcernsFulfilled(card, concerns, []);
      const result2 = checkConcernsFulfilled(card, concerns, result1 as ConcernId[]);

      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Submission with multiple cards
  // ==========================================================================
  describe('Multiple cards in submission', () => {
    it('should aggregate concerns from multiple cards', () => {
      const card1 = createCard('1', [ProofType.IDENTITY]);
      const card2 = createCard('2', [ProofType.LOCATION]);
      const concerns = [
        createConcern('id', ProofType.IDENTITY),
        createConcern('loc', ProofType.LOCATION),
      ];

      const result = checkSubmissionConcernsFulfilled([card1, card2], concerns, []);
      expect(result).toHaveLength(2);
      expect(result).toContain('concern_id');
      expect(result).toContain('concern_loc');
    });

    it('should not duplicate concerns when multiple cards address same concern', () => {
      const card1 = createCard('1', [ProofType.IDENTITY]);
      const card2 = createCard('2', [ProofType.IDENTITY]);
      const concerns = [createConcern('id', ProofType.IDENTITY)];

      const result = checkSubmissionConcernsFulfilled([card1, card2], concerns, []);
      expect(result).toHaveLength(1);
    });
  });
});
