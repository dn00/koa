import { describe, it, expect } from 'vitest';
import {
  createGameState,
  playCard,
  resolveObjection,
  autoResolveObjection,
  shouldProcessObjection,
  getVerdict,
  isGameOver,
  type TurnOutput,
  type EngineError,
  type VerdictData,
} from './engine.js';
import { ok, err, type Result, MINI_MODE, ADVANCED_MODE } from './types.js';
import { DEFAULT_CONFIG } from '../v5-rules.js';
import type { V5Puzzle, Card, GameState } from '../v5-types.js';

// Mock puzzle for testing
const createMockPuzzle = (overrides?: Partial<V5Puzzle>): V5Puzzle => ({
  slug: 'test-puzzle',
  name: 'Test Puzzle',
  scenario: 'Test scenario',
  knownFacts: ['Fact 1', 'Fact 2'],
  openingLine: 'Test opening',
  target: 60,
  cards: [
    {
      id: 'card_truth_1',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '10:00 AM',
      claim: 'Test claim 1',
      presentLine: 'Test present line 1',
      isLie: false,
    },
    {
      id: 'card_truth_2',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '11:00 AM',
      claim: 'Test claim 2',
      presentLine: 'Test present line 2',
      isLie: false,
    },
    {
      id: 'card_lie_1',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '12:00 PM',
      claim: 'Test lie claim',
      presentLine: 'Test lie present',
      isLie: true,
    },
    {
      id: 'card_truth_3',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'HALLWAY',
      time: '1:00 PM',
      claim: 'Test claim 3',
      presentLine: 'Test present line 3',
      isLie: false,
    },
    {
      id: 'card_truth_4',
      strength: 2,
      evidenceType: 'DIGITAL',
      location: 'KITCHEN',
      time: '2:00 PM',
      claim: 'Test claim 4',
      presentLine: 'Test present line 4',
      isLie: false,
    },
    {
      id: 'card_lie_2',
      strength: 4,
      evidenceType: 'PHYSICAL',
      location: 'GARAGE',
      time: '3:00 PM',
      claim: 'Test lie claim 2',
      presentLine: 'Test lie present 2',
      isLie: true,
    },
  ],
  lies: [
    { cardId: 'card_lie_1', lieType: 'direct_contradiction', reason: 'Contradicts fact 1' },
    { cardId: 'card_lie_2', lieType: 'relational', reason: 'Conflicts with card 2' },
  ],
  verdicts: {
    flawless: 'Flawless verdict',
    cleared: 'Cleared verdict',
    close: 'Close verdict',
    busted: 'Busted verdict',
  },
  koaBarks: {},
  ...overrides,
});

/**
 * Task 002: Engine Core (State & Logic)
 */
describe('Task 002: Engine Core', () => {
  // ==========================================================================
  // AC-1: createGameState
  // ==========================================================================
  describe('AC-1: createGameState', () => {
    it('should return GameState with correct initial values', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);

      expect(state.belief).toBe(DEFAULT_CONFIG.startingBelief);
      expect(state.hand).toEqual(puzzle.cards);
      expect(state.played).toEqual([]);
      expect(state.turnsPlayed).toBe(0);
      expect(state.turnResults).toEqual([]);
      expect(state.objection).toBeNull();
    });

    it('should use config starting belief', () => {
      const puzzle = createMockPuzzle();
      const customConfig = { ...DEFAULT_CONFIG, startingBelief: 75 };
      const state = createGameState(puzzle, customConfig);

      expect(state.belief).toBe(75);
    });
  });

  // ==========================================================================
  // AC-2: playCard Pure Function
  // ==========================================================================
  describe('AC-2: playCard pure function', () => {
    it('should return Result with TurnOutput on success', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state).toBeDefined();
        expect(result.value.beliefChange).toBeDefined();
        expect(result.value.wasLie).toBeDefined();
        expect(result.value.card).toBeDefined();
      }
    });

    it('should not modify original state (immutable)', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const originalBelief = state.belief;
      const originalHandLength = state.hand.length;

      playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);

      expect(state.belief).toBe(originalBelief);
      expect(state.hand.length).toBe(originalHandLength);
    });
  });

  // ==========================================================================
  // AC-3: playCard Scoring Truth
  // ==========================================================================
  describe('AC-3: playCard scoring truth', () => {
    it('should return beliefChange=+strength for truth card', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      // card_truth_1 has strength 4
      const result = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.beliefChange).toBe(4);
        expect(result.value.wasLie).toBe(false);
      }
    });
  });

  // ==========================================================================
  // AC-4: playCard Lie Scoring
  // ==========================================================================
  describe('AC-4: playCard lie scoring', () => {
    it('should return beliefChange=-(strength-1) for lie card', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      // card_lie_1 has strength 5, so -(5-1) = -4
      const result = playCard(state, 'card_lie_1', DEFAULT_CONFIG, 123);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.beliefChange).toBe(-4);
        expect(result.value.wasLie).toBe(true);
      }
    });
  });

  // ==========================================================================
  // AC-5: playCard Type Tax
  // ==========================================================================
  describe('AC-5: playCard type tax', () => {
    it('should apply -2 penalty when same evidence type played consecutively', () => {
      const puzzle = createMockPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      // Play first DIGITAL card (card_truth_1, strength 4)
      const result1 = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        state = result1.value.state;
        expect(result1.value.typeTaxApplied).toBe(false);
      }

      // Play second DIGITAL card (card_truth_4, strength 2)
      // Should apply type tax: 2 - 2 = 0
      const result2 = playCard(state, 'card_truth_4', DEFAULT_CONFIG, 456);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.typeTaxApplied).toBe(true);
        expect(result2.value.beliefChange).toBe(0); // 2 - 2 type tax = 0
      }
    });
  });

  // ==========================================================================
  // AC-6: resolveObjection
  // ==========================================================================
  describe('AC-6: resolveObjection', () => {
    it('should return +2 for standing by truth', () => {
      const puzzle = createMockPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      // Play two cards to get to objection point
      const result1 = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);
      if (result1.ok) state = result1.value.state;

      const result2 = playCard(state, 'card_truth_2', DEFAULT_CONFIG, 456);
      if (result2.ok) state = result2.value.state;

      // Last played card was truth
      const objResult = resolveObjection(state, 'stood_by', DEFAULT_CONFIG);
      expect(objResult.ok).toBe(true);
      if (objResult.ok) {
        expect(objResult.value.beliefChange).toBe(2);
      }
    });

    it('should return -4 for standing by lie', () => {
      const puzzle = createMockPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      // Play truth then lie
      const result1 = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);
      if (result1.ok) state = result1.value.state;

      const result2 = playCard(state, 'card_lie_1', DEFAULT_CONFIG, 456);
      if (result2.ok) state = result2.value.state;

      // Last played card was lie
      const objResult = resolveObjection(state, 'stood_by', DEFAULT_CONFIG);
      expect(objResult.ok).toBe(true);
      if (objResult.ok) {
        expect(objResult.value.beliefChange).toBe(-4);
      }
    });

    it('should return -2 for withdrawing', () => {
      const puzzle = createMockPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      const result1 = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);
      if (result1.ok) state = result1.value.state;

      const result2 = playCard(state, 'card_truth_2', DEFAULT_CONFIG, 456);
      if (result2.ok) state = result2.value.state;

      const objResult = resolveObjection(state, 'withdrawn', DEFAULT_CONFIG);
      expect(objResult.ok).toBe(true);
      if (objResult.ok) {
        expect(objResult.value.beliefChange).toBe(-2);
      }
    });
  });

  // ==========================================================================
  // AC-7: Auto-Resolve Objection Truth
  // ==========================================================================
  describe('AC-7: autoResolveObjection truth', () => {
    it('should return stood_by for truth card (optimal choice)', () => {
      const truthCard: Card = {
        id: 'truth',
        strength: 3,
        evidenceType: 'DIGITAL',
        location: 'OFFICE',
        time: '10:00 AM',
        claim: 'Test',
        presentLine: 'Test',
        isLie: false,
      };

      const result = autoResolveObjection(truthCard, DEFAULT_CONFIG);

      expect(result.choice).toBe('stood_by');
      expect(result.beliefChange).toBe(2);
    });
  });

  // ==========================================================================
  // AC-7b: Auto-Resolve Objection Lie
  // ==========================================================================
  describe('AC-7b: autoResolveObjection lie', () => {
    it('should return withdrawn for lie card (optimal choice)', () => {
      const lieCard: Card = {
        id: 'lie',
        strength: 5,
        evidenceType: 'DIGITAL',
        location: 'OFFICE',
        time: '10:00 AM',
        claim: 'Test',
        presentLine: 'Test',
        isLie: true,
      };

      const result = autoResolveObjection(lieCard, DEFAULT_CONFIG);

      expect(result.choice).toBe('withdrawn');
      expect(result.beliefChange).toBe(-2);
    });
  });

  // ==========================================================================
  // AC-8: getVerdict
  // ==========================================================================
  describe('AC-8: getVerdict', () => {
    it('should return FLAWLESS when belief >= target + 5', () => {
      const puzzle = createMockPuzzle({ target: 60 });
      const state: GameState = {
        belief: 65,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

      expect(verdict.tier).toBe('FLAWLESS');
    });

    it('should return CLEARED when belief >= target', () => {
      const puzzle = createMockPuzzle({ target: 60 });
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

      expect(verdict.tier).toBe('CLEARED');
    });

    it('should return CLOSE when belief >= target - 5', () => {
      const puzzle = createMockPuzzle({ target: 60 });
      const state: GameState = {
        belief: 57,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

      expect(verdict.tier).toBe('CLOSE');
    });

    it('should return BUSTED when belief < target - 5', () => {
      const puzzle = createMockPuzzle({ target: 60 });
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

      expect(verdict.tier).toBe('BUSTED');
    });
  });

  // ==========================================================================
  // EC-1: Invalid Card ID
  // ==========================================================================
  describe('EC-1: Invalid card ID', () => {
    it('should return error when card not in hand', () => {
      const puzzle = createMockPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'nonexistent_card', DEFAULT_CONFIG, 123);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CARD_NOT_IN_HAND');
      }
    });
  });

  // ==========================================================================
  // EC-2: Game Already Over
  // ==========================================================================
  describe('EC-2: Game already over', () => {
    it('should return error when turnsPlayed >= turnsPerGame', () => {
      const puzzle = createMockPuzzle();
      const state: GameState = {
        ...createGameState(puzzle, DEFAULT_CONFIG),
        turnsPlayed: 3, // Game is over
      };

      const result = playCard(state, 'card_truth_1', DEFAULT_CONFIG, 123);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('GAME_OVER');
      }
    });
  });
});
