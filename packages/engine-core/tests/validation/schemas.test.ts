import { describe, it, expect } from 'vitest';
import {
  validatePuzzlePack,
  validateVoicePack,
  type PuzzlePackSchema,
  type VoicePackSchema,
  type OutcomeKey,
} from '../../src/validation/schemas.js';

/**
 * Task 011: Pack Schemas
 */
describe('Task 011: Pack Schemas', () => {
  // Helper to create a minimal valid puzzle pack
  function createValidPuzzlePack(): PuzzlePackSchema {
    return {
      version: '1.0.0',
      puzzles: [
        {
          id: 'puzzle_test' as any,
          targetName: 'Alex',
          resistance: 10,
          concerns: [
            {
              id: 'concern_identity' as any,
              type: 'IDENTITY' as any,
              requiredProof: 'IDENTITY' as any,
            },
          ],
          counters: [
            {
              id: 'counter_1' as any,
              targets: ['card_1' as any],
            },
          ],
          dealtHand: ['card_1' as any, 'card_2' as any],
          turns: 5,
        },
      ],
      cards: [
        {
          id: 'card_1' as any,
          power: 3,
          proves: ['IDENTITY' as any],
          claims: { location: 'home' },
        },
        {
          id: 'card_2' as any,
          power: 2,
          proves: ['LOCATION' as any],
          claims: {},
        },
      ],
      counters: [
        {
          id: 'counter_1' as any,
          targets: ['card_1' as any],
        },
      ],
    };
  }

  // Helper to create a minimal valid voice pack
  function createValidVoicePack(): VoicePackSchema {
    return {
      version: '1.0.0',
      barks: {
        SUBMISSION_CLEAN: ['Well played.', 'Interesting.'],
        SUBMISSION_CONTESTED: ['Wait a moment...', 'Let me check that.'],
        CONTRADICTION_MINOR: ['That seems suspicious.'],
        CONTRADICTION_MAJOR: ['That cannot be right!'],
        CONCERN_ADDRESSED: ['I see.', 'Fair enough.'],
        REFUTATION_SUCCESS: ['Very well.'],
        WIN: ['You win this time.'],
        LOSS_SCRUTINY: ['Too many inconsistencies!'],
        LOSS_TURNS: ['Time is up!'],
      },
    };
  }

  // ==========================================================================
  // AC-1: PuzzlePack schema validates puzzles array
  // ==========================================================================
  describe('AC-1: PuzzlePack schema validates puzzles array', () => {
    it('should validate a valid puzzle pack', () => {
      const pack = createValidPuzzlePack();
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when puzzles is missing', () => {
      const pack = { version: '1.0.0', cards: [], counters: [] };
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path === 'puzzles')).toBe(true);
      }
    });

    it('should fail when puzzles is not an array', () => {
      const pack = { ...createValidPuzzlePack(), puzzles: {} };
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path === 'puzzles')).toBe(true);
      }
    });
  });

  // ==========================================================================
  // AC-2: EvidenceCard schema has all required fields
  // ==========================================================================
  describe('AC-2: EvidenceCard schema has all required fields', () => {
    it('should validate card with all required fields', () => {
      const pack = createValidPuzzlePack();
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when card id is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.cards[0] as any).id = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('cards[0].id'))).toBe(true);
      }
    });

    it('should fail when card power is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.cards[0] as any).power = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('cards[0].power'))).toBe(true);
      }
    });

    it('should fail when card proves is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.cards[0] as any).proves = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('cards[0].proves'))).toBe(true);
      }
    });

    it('should fail when card claims is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.cards[0] as any).claims = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('cards[0].claims'))).toBe(true);
      }
    });
  });

  // ==========================================================================
  // AC-3: CounterEvidence schema has targets array
  // ==========================================================================
  describe('AC-3: CounterEvidence schema has targets array', () => {
    it('should validate counter with targets array', () => {
      const pack = createValidPuzzlePack();
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when targets is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.counters[0] as any).targets = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('counters[0].targets'))).toBe(true);
      }
    });

    it('should fail when targets is not an array', () => {
      const pack = createValidPuzzlePack();
      (pack.counters[0] as any).targets = 'card_1';
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // AC-4: Concern schema has requiredProof
  // ==========================================================================
  describe('AC-4: Concern schema has requiredProof', () => {
    it('should validate concern with requiredProof', () => {
      const pack = createValidPuzzlePack();
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when requiredProof is missing', () => {
      const pack = createValidPuzzlePack();
      (pack.puzzles[0]!.concerns[0] as any).requiredProof = undefined;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path.includes('requiredProof'))).toBe(true);
      }
    });

    it('should fail when requiredProof is invalid', () => {
      const pack = createValidPuzzlePack();
      (pack.puzzles[0]!.concerns[0] as any).requiredProof = 'INVALID';
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // AC-5: VoicePack schema has barks keyed by OutcomeKey
  // ==========================================================================
  describe('AC-5: VoicePack schema has barks keyed by OutcomeKey', () => {
    it('should validate a valid voice pack', () => {
      const pack = createValidVoicePack();
      const result = validateVoicePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should fail when barks is missing', () => {
      const pack = { version: '1.0.0' };
      const result = validateVoicePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.path === 'barks')).toBe(true);
      }
    });

    it('should fail when outcome key is missing', () => {
      const pack = createValidVoicePack();
      delete (pack.barks as any).WIN;
      const result = validateVoicePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e) => e.message.includes('WIN'))).toBe(true);
      }
    });

    it('should fail when bark is not an array', () => {
      const pack = createValidVoicePack();
      (pack.barks as any).WIN = 'not an array';
      const result = validateVoicePack(pack);
      expect(result.ok).toBe(false);
    });

    it('should fail when bark array contains non-strings', () => {
      const pack = createValidVoicePack();
      (pack.barks as any).WIN = [123, 'valid'];
      const result = validateVoicePack(pack);
      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // AC-6: Schema exports TypeScript types
  // ==========================================================================
  describe('AC-6: Schema exports TypeScript types', () => {
    it('should be able to use PuzzlePackSchema type', () => {
      const pack: PuzzlePackSchema = createValidPuzzlePack();
      expect(pack.version).toBe('1.0.0');
    });

    it('should be able to use VoicePackSchema type', () => {
      const pack: VoicePackSchema = createValidVoicePack();
      expect(pack.version).toBe('1.0.0');
    });

    it('should be able to use OutcomeKey type', () => {
      const key: OutcomeKey = 'WIN';
      expect(key).toBe('WIN');
    });
  });

  // ==========================================================================
  // EC-1: Optional fields are marked optional
  // ==========================================================================
  describe('EC-1: Optional fields are marked optional', () => {
    it('should allow card without source', () => {
      const pack = createValidPuzzlePack();
      delete (pack.cards[0] as any).source;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should allow card without refutes', () => {
      const pack = createValidPuzzlePack();
      delete (pack.cards[0] as any).refutes;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should allow counter without refutedBy', () => {
      const pack = createValidPuzzlePack();
      delete (pack.counters[0] as any).refutedBy;
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(true);
    });
  });

  // ==========================================================================
  // ERR-1: Invalid pack returns validation error
  // ==========================================================================
  describe('ERR-1: Invalid pack returns validation error', () => {
    it('should return error for non-object input', () => {
      const result = validatePuzzlePack('not an object');
      expect(result.ok).toBe(false);
    });

    it('should return error for null input', () => {
      const result = validatePuzzlePack(null);
      expect(result.ok).toBe(false);
    });

    it('should return multiple errors for multiple issues', () => {
      const pack = {
        version: 123, // wrong type
        puzzles: 'not array', // wrong type
        cards: 'not array', // wrong type
        counters: 'not array', // wrong type
      };
      const result = validatePuzzlePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBeGreaterThan(1);
      }
    });
  });
});
