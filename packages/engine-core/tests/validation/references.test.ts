import { describe, it, expect } from 'vitest';
import { validateReferences, validatePuzzlePackFull } from '../../src/validation/references.js';
import type { PuzzlePackSchema } from '../../src/validation/schemas.js';
import type { CardId, CounterId, ConcernId, PuzzleId } from '../../src/index.js';
import { ProofType, ConcernType } from '../../src/index.js';

/**
 * Task 012: Pack Reference Validation
 */
describe('Task 012: Pack Reference Validation', () => {
  // Helper to create a valid minimal pack
  function createValidPack(): PuzzlePackSchema {
    return {
      version: '1.0.0',
      puzzles: [
        {
          id: 'puzzle_1' as PuzzleId,
          targetName: 'Test Target',
          resistance: 10,
          concerns: [
            {
              id: 'concern_1' as ConcernId,
              type: ConcernType.IDENTITY,
              requiredProof: ProofType.IDENTITY,
            },
          ],
          counters: [
            {
              id: 'counter_puzzle_1' as CounterId,
              targets: ['card_1' as CardId],
            },
          ],
          dealtHand: ['card_1' as CardId, 'card_2' as CardId],
          turns: 5,
        },
      ],
      cards: [
        {
          id: 'card_1' as CardId,
          power: 3,
          proves: [ProofType.IDENTITY],
          claims: { location: 'kitchen' },
        },
        {
          id: 'card_2' as CardId,
          power: 2,
          proves: [ProofType.ALERTNESS],
          claims: { state: 'AWAKE' },
          refutes: 'counter_1' as CounterId,
        },
      ],
      counters: [
        {
          id: 'counter_1' as CounterId,
          targets: ['card_1' as CardId],
          refutedBy: 'card_2' as CardId,
        },
      ],
    };
  }

  // ==========================================================================
  // AC-1: dealtHand references valid cards
  // ==========================================================================
  describe('AC-1: dealtHand CardIds must exist in cards array', () => {
    it('should pass when all dealtHand cards exist', () => {
      const pack = createValidPack();
      const result = validateReferences(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when dealtHand references non-existent card', () => {
      const pack = createValidPack();
      pack.puzzles[0]!.dealtHand = ['card_1' as CardId, 'card_missing' as CardId];
      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('dealtHand'))).toBe(true);
        expect(result.error.some((e) => e.message.includes('card_missing'))).toBe(true);
      }
    });
  });

  // ==========================================================================
  // AC-2: counter.targets must be valid CardIds
  // ==========================================================================
  describe('AC-2: counter.targets must reference valid cards', () => {
    it('should pass when counter targets exist', () => {
      const pack = createValidPack();
      const result = validateReferences(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when pack-level counter targets non-existent card', () => {
      const pack = createValidPack();
      pack.counters[0]!.targets = ['card_missing' as CardId];
      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('counters[0].targets'))).toBe(true);
      }
    });

    it('should fail when puzzle-level counter targets non-existent card', () => {
      const pack = createValidPack();
      pack.puzzles[0]!.counters[0]!.targets = ['card_missing' as CardId];
      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('puzzles[0].counters[0].targets'))).toBe(
          true
        );
      }
    });
  });

  // ==========================================================================
  // AC-3: card.refutes must be valid CounterIds
  // ==========================================================================
  describe('AC-3: card.refutes must reference valid counters', () => {
    it('should pass when card.refutes references existing counter', () => {
      const pack = createValidPack();
      const result = validateReferences(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when card.refutes references non-existent counter', () => {
      const pack = createValidPack();
      pack.cards[1]!.refutes = 'counter_missing' as CounterId;
      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('cards[1].refutes'))).toBe(true);
        expect(result.error.some((e) => e.message.includes('counter_missing'))).toBe(true);
      }
    });
  });

  // ==========================================================================
  // EC-1: Empty pack is valid
  // ==========================================================================
  describe('EC-1: Empty pack is valid', () => {
    it('should pass for pack with no puzzles or cards', () => {
      const pack: PuzzlePackSchema = {
        version: '1.0.0',
        puzzles: [],
        cards: [],
        counters: [],
      };
      const result = validateReferences(pack);
      expect(result.ok).toBe(true);
    });
  });

  // ==========================================================================
  // EC-2: Multiple errors are collected
  // ==========================================================================
  describe('EC-2: Multiple errors are collected', () => {
    it('should report all reference errors at once', () => {
      const pack = createValidPack();
      // Introduce multiple errors
      pack.puzzles[0]!.dealtHand = ['card_missing_1' as CardId, 'card_missing_2' as CardId];
      pack.cards[1]!.refutes = 'counter_missing' as CounterId;

      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Should have at least 3 errors: 2 for dealtHand + 1 for refutes
        expect(result.error.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  // ==========================================================================
  // validatePuzzlePackFull
  // ==========================================================================
  describe('validatePuzzlePackFull', () => {
    it('should validate schema first, then references', () => {
      const validPack = createValidPack();
      const result = validatePuzzlePackFull(validPack);
      expect(result.ok).toBe(true);
    });

    it('should fail on schema errors before checking references', () => {
      const invalidData = {
        version: '1.0.0',
        puzzles: 'not an array', // invalid
        cards: [],
        counters: [],
      };
      const result = validatePuzzlePackFull(invalidData);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path === 'puzzles')).toBe(true);
      }
    });

    it('should fail on reference errors after passing schema', () => {
      const pack = createValidPack();
      pack.puzzles[0]!.dealtHand = ['card_missing' as CardId];
      const result = validatePuzzlePackFull(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.message.includes('card_missing'))).toBe(true);
      }
    });
  });

  // ==========================================================================
  // EC-1: Self-Referencing ID
  // ==========================================================================
  describe('EC-1: Self-Referencing ID', () => {
    it('should allow card that refutes its own counter (valid scenario)', () => {
      // A card can refute a counter that targets it - this is intentional game design
      const pack: PuzzlePackSchema = {
        version: '1.0.0',
        puzzles: [],
        cards: [
          {
            id: 'card_1' as CardId,
            power: 3,
            proves: [ProofType.IDENTITY],
            claims: {},
            refutes: 'counter_1' as CounterId, // References counter that targets itself
          },
        ],
        counters: [
          {
            id: 'counter_1' as CounterId,
            targets: ['card_1' as CardId], // Targets the card that refutes it
            refutedBy: 'card_1' as CardId,
          },
        ],
      };
      const result = validateReferences(pack);
      expect(result.ok).toBe(true); // Self-referencing is valid in game mechanics
    });
  });

  // ==========================================================================
  // EC-2: Duplicate IDs
  // ==========================================================================
  describe('EC-2: Duplicate IDs', () => {
    it('should use last card with duplicate ID for validation (Set behavior)', () => {
      // Note: The current implementation uses Set which only keeps unique IDs
      // This test documents the behavior - duplicates silently overwrite
      const pack: PuzzlePackSchema = {
        version: '1.0.0',
        puzzles: [
          {
            id: 'puzzle_1' as PuzzleId,
            targetName: 'Test',
            resistance: 10,
            concerns: [],
            counters: [],
            dealtHand: ['card_1' as CardId], // References the ID
            turns: 5,
          },
        ],
        cards: [
          {
            id: 'card_1' as CardId, // First card_1
            power: 3,
            proves: [],
            claims: {},
          },
          {
            id: 'card_1' as CardId, // Duplicate card_1
            power: 5,
            proves: [],
            claims: {},
          },
        ],
        counters: [],
      };
      const result = validateReferences(pack);
      // Duplicate IDs don't fail reference validation (the ID exists)
      // Schema validation should catch this in a real implementation
      expect(result.ok).toBe(true);
    });
  });

  // ==========================================================================
  // ERR-1: Null Pack
  // ==========================================================================
  describe('ERR-1: Null Pack', () => {
    it('should fail validation for null input', () => {
      const result = validatePuzzlePackFull(null);
      expect(result.ok).toBe(false);
    });

    it('should fail validation for undefined input', () => {
      const result = validatePuzzlePackFull(undefined);
      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // ERR-2: Non-Object Pack
  // ==========================================================================
  describe('ERR-2: Non-Object Pack', () => {
    it('should fail validation for string input', () => {
      const result = validatePuzzlePackFull('not an object');
      expect(result.ok).toBe(false);
    });

    it('should fail validation for number input', () => {
      const result = validatePuzzlePackFull(42);
      expect(result.ok).toBe(false);
    });

    it('should fail validation for array input', () => {
      const result = validatePuzzlePackFull([1, 2, 3]);
      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================
  describe('Additional edge cases', () => {
    it('should validate counter.refutedBy references existing card', () => {
      const pack = createValidPack();
      pack.counters[0]!.refutedBy = 'card_missing' as CardId;
      const result = validateReferences(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('refutedBy'))).toBe(true);
      }
    });

    it('should allow counters defined at puzzle level to be referenced', () => {
      const pack: PuzzlePackSchema = {
        version: '1.0.0',
        puzzles: [
          {
            id: 'puzzle_1' as PuzzleId,
            targetName: 'Test',
            resistance: 10,
            concerns: [],
            counters: [
              {
                id: 'counter_puzzle_level' as CounterId,
                targets: ['card_1' as CardId],
              },
            ],
            dealtHand: ['card_1' as CardId],
            turns: 5,
          },
        ],
        cards: [
          {
            id: 'card_1' as CardId,
            power: 3,
            proves: [],
            claims: {},
            refutes: 'counter_puzzle_level' as CounterId,
          },
        ],
        counters: [],
      };
      const result = validateReferences(pack);
      expect(result.ok).toBe(true);
    });
  });
});
