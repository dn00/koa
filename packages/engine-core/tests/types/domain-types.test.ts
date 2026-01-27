import { describe, it, expect } from 'vitest';
import {
  // Enums
  ProofType,
  ConcernType,
  KOAMood,
  ContradictionSeverity,
  RunStatus,
  // ID type guards
  isCardId,
  isCounterId,
  isPuzzleId,
  isConcernId,
  isRunId,
  // Types (imported for type checking, used in type assertions)
  type CardId,
  type CounterId,
  type PuzzleId,
  type ConcernId,
  type RunId,
  type EvidenceCard,
  type Claims,
  type CounterEvidence,
  type Concern,
  type Puzzle,
  type RunState,
  type Submission,
  type MoveResult,
  type Scrutiny,
} from '../../src/index.js';

/**
 * Task 002: Domain Types
 * Tests for all domain types defined in engine-core
 */
describe('Task 002: Domain Types', () => {
  // ==========================================================================
  // AC-1: ProofType enum has IDENTITY, ALERTNESS, INTENT, LOCATION, LIVENESS
  // ==========================================================================
  describe('AC-1: ProofType enum', () => {
    it('should have all required values', () => {
      expect(ProofType.IDENTITY).toBe('IDENTITY');
      expect(ProofType.ALERTNESS).toBe('ALERTNESS');
      expect(ProofType.INTENT).toBe('INTENT');
      expect(ProofType.LOCATION).toBe('LOCATION');
      expect(ProofType.LIVENESS).toBe('LIVENESS');
    });

    it('should have exactly 5 values', () => {
      const values = Object.values(ProofType);
      expect(values).toHaveLength(5);
    });
  });

  // ==========================================================================
  // AC-2: EvidenceCard has id, power, proves, claims, source?, refutes?
  // ==========================================================================
  describe('AC-2: EvidenceCard type', () => {
    it('should have required properties', () => {
      const card: EvidenceCard = {
        id: 'card_001' as CardId,
        power: 3,
        proves: [ProofType.IDENTITY, ProofType.LOCATION],
        claims: { location: 'living room' },
      };

      expect(card.id).toBe('card_001');
      expect(card.power).toBe(3);
      expect(card.proves).toEqual([ProofType.IDENTITY, ProofType.LOCATION]);
      expect(card.claims.location).toBe('living room');
    });

    it('should allow optional source and refutes properties', () => {
      const card: EvidenceCard = {
        id: 'card_002' as CardId,
        power: 2,
        proves: [ProofType.ALERTNESS],
        claims: { state: 'awake' },
        source: 'smart doorbell',
        refutes: 'counter_001' as CounterId,
      };

      expect(card.source).toBe('smart doorbell');
      expect(card.refutes).toBe('counter_001');
    });
  });

  // ==========================================================================
  // AC-3: Claims has location?, state?, activity?, timeRange?
  // ==========================================================================
  describe('AC-3: Claims type', () => {
    it('should allow all properties to be optional', () => {
      const emptyClaims: Claims = {};
      expect(emptyClaims).toEqual({});
    });

    it('should allow all claim types', () => {
      const fullClaims: Claims = {
        location: 'kitchen',
        state: 'cooking',
        activity: 'making dinner',
        timeRange: '18:00-19:00',
      };

      expect(fullClaims.location).toBe('kitchen');
      expect(fullClaims.state).toBe('cooking');
      expect(fullClaims.activity).toBe('making dinner');
      expect(fullClaims.timeRange).toBe('18:00-19:00');
    });
  });

  // ==========================================================================
  // AC-4: CounterEvidence has id, targets, refutedBy?, refuted
  // ==========================================================================
  describe('AC-4: CounterEvidence type', () => {
    it('should have required properties', () => {
      const counter: CounterEvidence = {
        id: 'counter_001' as CounterId,
        targets: ['card_001' as CardId, 'card_002' as CardId],
        refuted: false,
      };

      expect(counter.id).toBe('counter_001');
      expect(counter.targets).toEqual(['card_001', 'card_002']);
      expect(counter.refuted).toBe(false);
    });

    it('should allow optional refutedBy property', () => {
      const counter: CounterEvidence = {
        id: 'counter_002' as CounterId,
        targets: ['card_003' as CardId],
        refutedBy: 'card_004' as CardId,
        refuted: true,
      };

      expect(counter.refutedBy).toBe('card_004');
    });
  });

  // ==========================================================================
  // AC-5: Concern has id, type, requiredProof, addressed
  // ==========================================================================
  describe('AC-5: Concern type', () => {
    it('should have all required properties', () => {
      const concern: Concern = {
        id: 'concern_001' as ConcernId,
        type: ConcernType.IDENTITY,
        requiredProof: ProofType.IDENTITY,
        addressed: false,
      };

      expect(concern.id).toBe('concern_001');
      expect(concern.type).toBe(ConcernType.IDENTITY);
      expect(concern.requiredProof).toBe(ProofType.IDENTITY);
      expect(concern.addressed).toBe(false);
    });
  });

  // ==========================================================================
  // AC-6: ConcernType enum matches ProofType values
  // ==========================================================================
  describe('AC-6: ConcernType enum matches ProofType', () => {
    it('should have the same values as ProofType', () => {
      expect(ConcernType.IDENTITY).toBe(ProofType.IDENTITY);
      expect(ConcernType.ALERTNESS).toBe(ProofType.ALERTNESS);
      expect(ConcernType.INTENT).toBe(ProofType.INTENT);
      expect(ConcernType.LOCATION).toBe(ProofType.LOCATION);
      expect(ConcernType.LIVENESS).toBe(ProofType.LIVENESS);
    });

    it('should have the same number of values', () => {
      const proofValues = Object.values(ProofType);
      const concernValues = Object.values(ConcernType);
      expect(concernValues).toHaveLength(proofValues.length);
    });
  });

  // ==========================================================================
  // AC-7: Puzzle has id, targetName, resistance, concerns, counters, dealtHand, turns
  // ==========================================================================
  describe('AC-7: Puzzle type', () => {
    it('should have all required properties', () => {
      const concern: Concern = {
        id: 'concern_001' as ConcernId,
        type: ConcernType.IDENTITY,
        requiredProof: ProofType.IDENTITY,
        addressed: false,
      };

      const counter: CounterEvidence = {
        id: 'counter_001' as CounterId,
        targets: ['card_001' as CardId],
        refuted: false,
      };

      const puzzle: Puzzle = {
        id: 'puzzle_001' as PuzzleId,
        targetName: 'Alex',
        resistance: 10,
        concerns: [concern],
        counters: [counter],
        dealtHand: ['card_001' as CardId, 'card_002' as CardId],
        turns: 5,
      };

      expect(puzzle.id).toBe('puzzle_001');
      expect(puzzle.targetName).toBe('Alex');
      expect(puzzle.resistance).toBe(10);
      expect(puzzle.concerns).toHaveLength(1);
      expect(puzzle.counters).toHaveLength(1);
      expect(puzzle.dealtHand).toHaveLength(2);
      expect(puzzle.turns).toBe(5);
    });
  });

  // ==========================================================================
  // AC-8: RunState has puzzle, committedStory, resistance, scrutiny (0-5), turnsRemaining, concernsAddressed
  // ==========================================================================
  describe('AC-8: RunState type', () => {
    it('should have all required properties', () => {
      const puzzle: Puzzle = {
        id: 'puzzle_001' as PuzzleId,
        targetName: 'Alex',
        resistance: 10,
        concerns: [],
        counters: [],
        dealtHand: ['card_001' as CardId],
        turns: 5,
      };

      const runState: RunState = {
        puzzle,
        committedStory: [],
        resistance: 8,
        scrutiny: 2,
        turnsRemaining: 4,
        concernsAddressed: ['concern_001' as ConcernId],
      };

      expect(runState.puzzle).toBe(puzzle);
      expect(runState.committedStory).toEqual([]);
      expect(runState.resistance).toBe(8);
      expect(runState.scrutiny).toBe(2);
      expect(runState.turnsRemaining).toBe(4);
      expect(runState.concernsAddressed).toEqual(['concern_001']);
    });
  });

  // ==========================================================================
  // AC-9: KOAMood enum has NEUTRAL, CURIOUS, SUSPICIOUS, BLOCKED, GRUDGING, IMPRESSED, RESIGNED, SMUG
  // ==========================================================================
  describe('AC-9: KOAMood enum', () => {
    it('should have all required values', () => {
      expect(KOAMood.NEUTRAL).toBe('NEUTRAL');
      expect(KOAMood.CURIOUS).toBe('CURIOUS');
      expect(KOAMood.SUSPICIOUS).toBe('SUSPICIOUS');
      expect(KOAMood.BLOCKED).toBe('BLOCKED');
      expect(KOAMood.GRUDGING).toBe('GRUDGING');
      expect(KOAMood.IMPRESSED).toBe('IMPRESSED');
      expect(KOAMood.RESIGNED).toBe('RESIGNED');
      expect(KOAMood.SMUG).toBe('SMUG');
    });

    it('should have exactly 8 values', () => {
      const values = Object.values(KOAMood);
      expect(values).toHaveLength(8);
    });
  });

  // ==========================================================================
  // AC-10: Submission has cardIds (1-3 CardIds)
  // ==========================================================================
  describe('AC-10: Submission type', () => {
    it('should accept 1 card', () => {
      const submission: Submission = {
        cardIds: ['card_001' as CardId],
      };
      expect(submission.cardIds).toHaveLength(1);
    });

    it('should accept 2 cards', () => {
      const submission: Submission = {
        cardIds: ['card_001' as CardId, 'card_002' as CardId],
      };
      expect(submission.cardIds).toHaveLength(2);
    });

    it('should accept 3 cards', () => {
      const submission: Submission = {
        cardIds: ['card_001' as CardId, 'card_002' as CardId, 'card_003' as CardId],
      };
      expect(submission.cardIds).toHaveLength(3);
    });
  });

  // ==========================================================================
  // EC-1: Empty proves array is valid
  // ==========================================================================
  describe('EC-1: Empty proves array is valid', () => {
    it('should allow EvidenceCard with empty proves array', () => {
      const card: EvidenceCard = {
        id: 'card_empty' as CardId,
        power: 1,
        proves: [], // Empty is valid!
        claims: { activity: 'neutral activity' },
      };

      expect(card.proves).toEqual([]);
      expect(card.proves).toHaveLength(0);
    });
  });

  // ==========================================================================
  // ERR-1: Scrutiny constrained to 0-5 (union type)
  // ==========================================================================
  describe('ERR-1: Scrutiny constrained to 0-5', () => {
    it('should accept valid scrutiny values 0-5', () => {
      const validValues: Scrutiny[] = [0, 1, 2, 3, 4, 5];

      validValues.forEach((value) => {
        const scrutiny: Scrutiny = value;
        expect(scrutiny).toBeGreaterThanOrEqual(0);
        expect(scrutiny).toBeLessThanOrEqual(5);
      });
    });

    // Note: Invalid values (6, -1, etc.) would cause TypeScript compile errors
    // This is tested at compile time, not runtime
    it('should be a union type of 0-5 (compile-time check)', () => {
      // If this compiles, the type is correctly constrained
      const minScrutiny: Scrutiny = 0;
      const maxScrutiny: Scrutiny = 5;
      expect(minScrutiny).toBe(0);
      expect(maxScrutiny).toBe(5);
    });
  });

  // ==========================================================================
  // Additional tests for branded ID types
  // ==========================================================================
  describe('Branded ID Types', () => {
    it('should validate CardId format', () => {
      expect(isCardId('card_001')).toBe(true);
      expect(isCardId('card_')).toBe(true);
      expect(isCardId('counter_001')).toBe(false);
      expect(isCardId('invalid')).toBe(false);
    });

    it('should validate CounterId format', () => {
      expect(isCounterId('counter_001')).toBe(true);
      expect(isCounterId('card_001')).toBe(false);
    });

    it('should validate PuzzleId format', () => {
      expect(isPuzzleId('puzzle_daily_2024')).toBe(true);
      expect(isPuzzleId('card_001')).toBe(false);
    });

    it('should validate ConcernId format', () => {
      expect(isConcernId('concern_identity')).toBe(true);
      expect(isConcernId('puzzle_001')).toBe(false);
    });

    it('should validate RunId format', () => {
      expect(isRunId('run_abc123')).toBe(true);
      expect(isRunId('concern_001')).toBe(false);
    });
  });

  // ==========================================================================
  // Additional enum tests
  // ==========================================================================
  describe('ContradictionSeverity enum', () => {
    it('should have MINOR, MAJOR, CRITICAL values', () => {
      expect(ContradictionSeverity.MINOR).toBe('MINOR');
      expect(ContradictionSeverity.MAJOR).toBe('MAJOR');
      expect(ContradictionSeverity.CRITICAL).toBe('CRITICAL');
    });
  });

  describe('RunStatus enum', () => {
    it('should have IN_PROGRESS, WON, LOST values', () => {
      expect(RunStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(RunStatus.WON).toBe('WON');
      expect(RunStatus.LOST).toBe('LOST');
    });
  });

  describe('MoveResult type', () => {
    it('should have all required properties', () => {
      const puzzle: Puzzle = {
        id: 'puzzle_001' as PuzzleId,
        targetName: 'Alex',
        resistance: 10,
        concerns: [],
        counters: [],
        dealtHand: [],
        turns: 5,
      };

      const result: MoveResult = {
        runId: 'run_001' as RunId,
        newState: {
          puzzle,
          committedStory: [],
          resistance: 7,
          scrutiny: 1,
          turnsRemaining: 4,
          concernsAddressed: [],
        },
        resistanceReduced: 3,
        concernsAddressed: [],
        status: RunStatus.IN_PROGRESS,
      };

      expect(result.runId).toBe('run_001');
      expect(result.resistanceReduced).toBe(3);
      expect(result.status).toBe(RunStatus.IN_PROGRESS);
    });
  });
});
