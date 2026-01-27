import { describe, it, expect } from 'vitest';
import {
  deriveState,
  deriveStatusFromEvents,
  runStarted,
  cardsSubmitted,
  concernAddressed,
  scrutinyIncreased,
  runEnded,
  type GameEvent,
} from '../../src/resolver/events.js';
import type { Puzzle, EvidenceCard, CardId, ConcernId, PuzzleId, CounterId } from '../../src/index.js';
import { ProofType, RunStatus, ConcernType } from '../../src/index.js';

/**
 * Task 009: Event System and State Derivation
 */
describe('Task 009: Event System and State Derivation', () => {
  // Helper to create a test puzzle
  function createPuzzle(overrides?: Partial<Puzzle>): Puzzle {
    return {
      id: 'puzzle_test' as PuzzleId,
      targetName: 'Alex',
      resistance: 10,
      concerns: [],
      counters: [],
      dealtHand: ['card_1' as CardId, 'card_2' as CardId],
      turns: 5,
      ...overrides,
    };
  }

  // Helper to create a test card
  function createCard(id: string, power: number): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power,
      proves: [ProofType.IDENTITY],
      claims: {},
    };
  }

  // ==========================================================================
  // AC-1: RUN_STARTED event initializes state
  // ==========================================================================
  describe('AC-1: RUN_STARTED event initializes state', () => {
    it('should initialize state from RUN_STARTED event', () => {
      const puzzle = createPuzzle({ resistance: 15, turns: 6 });
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [createCard('1', 3)] }),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.puzzle).toBe(puzzle);
        expect(result.value.resistance).toBe(15);
        expect(result.value.turnsRemaining).toBe(6);
        expect(result.value.scrutiny).toBe(0);
        expect(result.value.committedStory).toEqual([]);
        expect(result.value.concernsAddressed).toEqual([]);
      }
    });
  });

  // ==========================================================================
  // AC-2: CARDS_SUBMITTED event updates state
  // ==========================================================================
  describe('AC-2: CARDS_SUBMITTED event updates state', () => {
    it('should reduce resistance and commit cards', () => {
      const puzzle = createPuzzle({ resistance: 10, turns: 5 });
      const card = createCard('1', 3);
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [card] }),
        cardsSubmitted({
          cardIds: [card.id],
          cards: [card],
          damageDealt: 3,
        }),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resistance).toBe(7); // 10 - 3
        expect(result.value.committedStory).toHaveLength(1);
        expect(result.value.committedStory[0]).toBe(card);
        expect(result.value.turnsRemaining).toBe(4); // 5 - 1
      }
    });

    it('should not reduce resistance below 0', () => {
      const puzzle = createPuzzle({ resistance: 5 });
      const card = createCard('1', 10);
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [card] }),
        cardsSubmitted({
          cardIds: [card.id],
          cards: [card],
          damageDealt: 10,
        }),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.resistance).toBe(0);
      }
    });
  });

  // ==========================================================================
  // AC-3: CONCERN_ADDRESSED event tracks fulfillment
  // ==========================================================================
  describe('AC-3: CONCERN_ADDRESSED event tracks fulfillment', () => {
    it('should add concern to addressed list', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        concernAddressed('concern_identity' as ConcernId),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.concernsAddressed).toContain('concern_identity');
      }
    });

    it('should not duplicate concerns', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        concernAddressed('concern_identity' as ConcernId),
        concernAddressed('concern_identity' as ConcernId), // Duplicate
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.concernsAddressed).toHaveLength(1);
      }
    });
  });

  // ==========================================================================
  // AC-4: SCRUTINY_INCREASED event updates scrutiny
  // ==========================================================================
  describe('AC-4: SCRUTINY_INCREASED event updates scrutiny', () => {
    it('should increase scrutiny by amount', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        scrutinyIncreased(1),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.scrutiny).toBe(1);
      }
    });

    it('should accumulate multiple increases', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        scrutinyIncreased(1),
        scrutinyIncreased(2),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.scrutiny).toBe(3);
      }
    });

    it('should cap scrutiny at 5', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        scrutinyIncreased(3),
        scrutinyIncreased(3),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.scrutiny).toBe(5);
      }
    });
  });

  // ==========================================================================
  // AC-5: RUN_ENDED event marks completion
  // ==========================================================================
  describe('AC-5: RUN_ENDED event marks completion', () => {
    it('should derive WON status from RUN_ENDED', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        runEnded(RunStatus.WON),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.WON);
      }
    });

    it('should derive LOST status from RUN_ENDED', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        runEnded(RunStatus.LOST, 'Too much scrutiny'),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.LOST);
      }
    });
  });

  // ==========================================================================
  // AC-6: deriveState(events) returns current RunState
  // ==========================================================================
  describe('AC-6: deriveState returns current RunState', () => {
    it('should return a valid RunState object', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveProperty('puzzle');
        expect(result.value).toHaveProperty('committedStory');
        expect(result.value).toHaveProperty('resistance');
        expect(result.value).toHaveProperty('scrutiny');
        expect(result.value).toHaveProperty('turnsRemaining');
        expect(result.value).toHaveProperty('concernsAddressed');
      }
    });
  });

  // ==========================================================================
  // AC-7: Same events = same state (deterministic)
  // ==========================================================================
  describe('AC-7: Same events = same state (deterministic)', () => {
    it('should produce identical state for identical events', () => {
      const puzzle = createPuzzle({ resistance: 10 });
      const card = createCard('1', 3);
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [card] }),
        cardsSubmitted({
          cardIds: [card.id],
          cards: [card],
          damageDealt: 3,
        }),
        scrutinyIncreased(1),
        concernAddressed('concern_id' as ConcernId),
      ];

      const result1 = deriveState(events);
      const result2 = deriveState(events);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.resistance).toBe(result2.value.resistance);
        expect(result1.value.scrutiny).toBe(result2.value.scrutiny);
        expect(result1.value.turnsRemaining).toBe(result2.value.turnsRemaining);
        expect(result1.value.committedStory).toEqual(result2.value.committedStory);
        expect(result1.value.concernsAddressed).toEqual(result2.value.concernsAddressed);
      }
    });
  });

  // ==========================================================================
  // EC-1: Empty event list = error
  // ==========================================================================
  describe('EC-1: Empty event list = error', () => {
    it('should return error for empty events', () => {
      const result = deriveState([]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Event log cannot be empty');
      }
    });
  });

  // ==========================================================================
  // ERR-1: Invalid event sequence = error
  // ==========================================================================
  describe('ERR-1: Invalid event sequence = error', () => {
    it('should return error when first event is not RUN_STARTED', () => {
      const events: GameEvent[] = [
        scrutinyIncreased(1),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('First event must be RUN_STARTED');
      }
    });

    it('should return error when RUN_STARTED appears twice', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        runStarted({ puzzle, dealtHand: [] }),
      ];

      const result = deriveState(events);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('RUN_STARTED can only be the first event');
      }
    });
  });

  // ==========================================================================
  // Status derivation
  // ==========================================================================
  describe('Status Derivation', () => {
    it('should derive WON when resistance reaches 0', () => {
      const puzzle = createPuzzle({ resistance: 5 });
      const card = createCard('1', 5);
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [card] }),
        cardsSubmitted({
          cardIds: [card.id],
          cards: [card],
          damageDealt: 5,
        }),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.WON);
      }
    });

    it('should derive LOST when scrutiny reaches 5', () => {
      const puzzle = createPuzzle();
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
        scrutinyIncreased(5),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.LOST);
      }
    });

    it('should derive LOST when turns run out', () => {
      const puzzle = createPuzzle({ resistance: 10, turns: 1 });
      const card = createCard('1', 3);
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [card] }),
        cardsSubmitted({
          cardIds: [card.id],
          cards: [card],
          damageDealt: 3, // Not enough to win
        }),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.LOST);
      }
    });

    it('should derive IN_PROGRESS when game is ongoing', () => {
      const puzzle = createPuzzle({ resistance: 10, turns: 5 });
      const events: GameEvent[] = [
        runStarted({ puzzle, dealtHand: [] }),
      ];

      const result = deriveStatusFromEvents(events);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(RunStatus.IN_PROGRESS);
      }
    });
  });
});
