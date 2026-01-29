/**
 * Tests for Task 007: Engine Core
 *
 * Test count verification:
 * - 6 ACs + 3 ECs + 3 ERRs = 12 test blocks
 */

import { describe, it, expect } from 'vitest';
import {
  createGameState,
  playCard,
  isGameOver,
  getVerdict,
  resolveObjectionState,
  EngineError,
  TurnOutput,
  ObjectionOutput,
  VerdictData,
} from '../../../src/resolver/v5/engine.js';
import { DEFAULT_CONFIG, type GameConfig, type V5Puzzle, type Card, type GameState } from '../../../src/types/v5/index.js';

// Test fixtures
const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'test-card' as Card['id'],
  strength: 3,
  evidenceType: 'DIGITAL',
  location: 'OFFICE',
  time: '10:00 AM',
  claim: 'Test claim',
  presentLine: 'Test presentation',
  isLie: false,
  ...overrides,
});

const createTestPuzzle = (overrides: Partial<V5Puzzle> = {}): V5Puzzle => ({
  slug: 'test-puzzle',
  name: 'Test Puzzle',
  scenario: 'Test scenario',
  knownFacts: ['Fact 1', 'Fact 2'],
  openingLine: 'Opening line',
  target: 60,
  cards: [
    createTestCard({ id: 'card-1' as Card['id'], strength: 3, isLie: false }),
    createTestCard({ id: 'card-2' as Card['id'], strength: 4, isLie: false }),
    createTestCard({ id: 'card-3' as Card['id'], strength: 5, isLie: true }),
    createTestCard({ id: 'card-4' as Card['id'], strength: 3, isLie: false, evidenceType: 'PHYSICAL' }),
    createTestCard({ id: 'card-5' as Card['id'], strength: 3, isLie: false, evidenceType: 'TESTIMONY' }),
    createTestCard({ id: 'card-6' as Card['id'], strength: 2, isLie: true }),
  ],
  lies: [
    { cardId: 'card-3', lieType: 'direct_contradiction', reason: 'Contradicts known fact' },
    { cardId: 'card-6', lieType: 'relational', reason: 'Conflicts with card-1' },
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

describe('Task 007: Engine Core', () => {
  describe('AC-1: createGameState Initializes Correctly', () => {
    it('should return GameState with belief equal to config.startingBelief', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      expect(state.belief).toBe(DEFAULT_CONFIG.startingBelief);
    });

    it('should have hand containing copies of puzzle.cards', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      expect(state.hand).toHaveLength(puzzle.cards.length);
      expect(state.hand.map(c => c.id)).toEqual(puzzle.cards.map(c => c.id));
    });

    it('should have empty played, turnResults arrays and turnsPlayed=0', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      expect(state.played).toEqual([]);
      expect(state.turnResults).toEqual([]);
      expect(state.turnsPlayed).toBe(0);
    });

    it('should have objection=null', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      expect(state.objection).toBeNull();
    });

    it('should not mutate puzzle.cards (creates a copy)', () => {
      const puzzle = createTestPuzzle();
      const originalLength = puzzle.cards.length;
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      // Removing from hand should not affect puzzle.cards
      state.hand.pop();
      expect(puzzle.cards).toHaveLength(originalLength);
    });
  });

  describe('AC-2: playCard Returns New State Without Mutating Input', () => {
    it('should return new state object', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state).not.toBe(state);
      }
    });

    it('should not mutate original state belief', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const originalBelief = state.belief;

      playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(state.belief).toBe(originalBelief);
    });

    it('should not mutate original state hand array', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const originalHandLength = state.hand.length;

      playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(state.hand).toHaveLength(originalHandLength);
    });

    it('should not mutate original state played array', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const originalPlayedLength = state.played.length;

      playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(state.played).toHaveLength(originalPlayedLength);
    });
  });

  describe('AC-3: playCard Updates State Correctly', () => {
    it('should increase belief by card strength for truth card', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state.belief).toBe(DEFAULT_CONFIG.startingBelief + 3);
      }
    });

    it('should remove card from hand', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state.hand).toHaveLength(5);
        expect(result.value.state.hand.find(c => c.id === 'card-1')).toBeUndefined();
      }
    });

    it('should add card to played array', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state.played).toHaveLength(1);
        expect(result.value.state.played[0].id).toBe('card-1');
      }
    });

    it('should increment turnsPlayed', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state.turnsPlayed).toBe(1);
      }
    });

    it('should add TurnResult to turnResults', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.state.turnResults).toHaveLength(1);
        expect(result.value.state.turnResults[0].card.id).toBe('card-1');
        expect(result.value.state.turnResults[0].wasLie).toBe(false);
      }
    });
  });

  describe('AC-4: playCard Returns Error for Card Not in Hand', () => {
    it('should return error with code CARD_NOT_IN_HAND for non-existent cardId', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'non-existent', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CARD_NOT_IN_HAND');
      }
    });

    it('should include informative error message', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'non-existent', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });
  });

  describe('AC-5: isGameOver Returns True When Turns Exhausted', () => {
    it('should return true when turnsPlayed equals turnsPerGame', () => {
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      expect(isGameOver(state, DEFAULT_CONFIG)).toBe(true);
    });

    it('should return true when turnsPlayed exceeds turnsPerGame', () => {
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 5,
        objection: null,
      };

      expect(isGameOver(state, DEFAULT_CONFIG)).toBe(true);
    });

    it('should return false when turnsPlayed is less than turnsPerGame', () => {
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 2,
        objection: null,
      };

      expect(isGameOver(state, DEFAULT_CONFIG)).toBe(false);
    });
  });

  describe('AC-6: getVerdict Calculates Final Result', () => {
    it('should return correct tier based on belief vs target', () => {
      const puzzle = createTestPuzzle({ target: 50 });
      const state: GameState = {
        belief: 55, // target + 5 = FLAWLESS
        hand: [],
        played: [createTestCard({ id: 'card-1' as Card['id'], isLie: false })],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);
      expect(verdict.tier).toBe('FLAWLESS');
    });

    it('should include playedCards with wasLie flags', () => {
      const puzzle = createTestPuzzle({ target: 50 });
      const state: GameState = {
        belief: 52,
        hand: [],
        played: [
          createTestCard({ id: 'card-1' as Card['id'], isLie: false }),
          createTestCard({ id: 'card-3' as Card['id'], isLie: true }),
        ],
        turnResults: [],
        turnsPlayed: 2,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);
      expect(verdict.playedCards).toHaveLength(2);
      expect(verdict.playedCards[0].wasLie).toBe(false);
      expect(verdict.playedCards[1].wasLie).toBe(true);
    });

    it('should include beliefFinal and beliefTarget', () => {
      const puzzle = createTestPuzzle({ target: 60 });
      const state: GameState = {
        belief: 55,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);
      expect(verdict.beliefFinal).toBe(55);
      expect(verdict.beliefTarget).toBe(60);
    });

    it('should include koaLine from puzzle verdicts', () => {
      const puzzle = createTestPuzzle({ target: 50 });
      const state: GameState = {
        belief: 52, // CLEARED
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);
      expect(verdict.koaLine).toBe('Cleared verdict');
    });
  });

  describe('EC-1: playCard on first turn (no previous card for type tax)', () => {
    it('should not apply type tax on first turn', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.typeTaxApplied).toBe(false);
        // Full belief gain: strength 3
        expect(result.value.beliefChange).toBe(3);
      }
    });
  });

  describe('EC-2: playCard with type tax triggered', () => {
    it('should apply type tax when same evidenceType as previous card', () => {
      const puzzle = createTestPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      // Play first DIGITAL card
      const result1 = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);
      expect(result1.ok).toBe(true);
      if (!result1.ok) return;
      state = result1.value.state;

      // Play second DIGITAL card (card-2 is also DIGITAL)
      const result2 = playCard(state, 'card-2', DEFAULT_CONFIG, 12345);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.typeTaxApplied).toBe(true);
        // Belief change: strength 4 + typeTax penalty (-2) = 2
        expect(result2.value.beliefChange).toBe(2);
      }
    });

    it('should not apply type tax when different evidenceType', () => {
      const puzzle = createTestPuzzle();
      let state = createGameState(puzzle, DEFAULT_CONFIG);

      // Play DIGITAL card
      const result1 = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);
      expect(result1.ok).toBe(true);
      if (!result1.ok) return;
      state = result1.value.state;

      // Play PHYSICAL card (card-4)
      const result2 = playCard(state, 'card-4', DEFAULT_CONFIG, 12345);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value.typeTaxApplied).toBe(false);
      }
    });
  });

  describe('EC-3: getVerdict with no lies played', () => {
    it('should have all playedCards with wasLie=false', () => {
      const puzzle = createTestPuzzle({ target: 50 });
      const state: GameState = {
        belief: 56,
        hand: [],
        played: [
          createTestCard({ id: 'card-1' as Card['id'], isLie: false }),
          createTestCard({ id: 'card-2' as Card['id'], isLie: false }),
          createTestCard({ id: 'card-4' as Card['id'], isLie: false }),
        ],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);
      expect(verdict.playedCards.every(pc => pc.wasLie === false)).toBe(true);
    });
  });

  describe('ERR-1: playCard when game is over', () => {
    it('should return error with code GAME_OVER', () => {
      const puzzle = createTestPuzzle();
      const state: GameState = {
        belief: 50,
        hand: [createTestCard({ id: 'card-1' as Card['id'] })],
        played: [],
        turnResults: [],
        turnsPlayed: 3, // Game is over
        objection: null,
      };

      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('GAME_OVER');
      }
    });

    it('should include turns played in error message', () => {
      const puzzle = createTestPuzzle();
      const state: GameState = {
        belief: 50,
        hand: [createTestCard({ id: 'card-1' as Card['id'] })],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };

      const result = playCard(state, 'card-1', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('3');
      }
    });
  });

  describe('ERR-2: playCard with empty cardId', () => {
    it('should return error with code CARD_NOT_IN_HAND', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, '', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('CARD_NOT_IN_HAND');
      }
    });

    it('should have message indicating card not found', () => {
      const puzzle = createTestPuzzle();
      const state = createGameState(puzzle, DEFAULT_CONFIG);
      const result = playCard(state, '', DEFAULT_CONFIG, 12345);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found');
      }
    });
  });

  describe('ERR-3: resolveObjection with no card played', () => {
    it('should return error with code OBJECTION_INVALID', () => {
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [], // No cards played
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
      };

      const result = resolveObjectionState(state, 'stood_by', DEFAULT_CONFIG);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('OBJECTION_INVALID');
      }
    });

    it('should have message "No card to challenge"', () => {
      const state: GameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
      };

      const result = resolveObjectionState(state, 'stood_by', DEFAULT_CONFIG);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('No card to challenge');
      }
    });
  });
});
