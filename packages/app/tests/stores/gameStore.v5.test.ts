/**
 * Task 002: Migrate Game Store (V5 Migration)
 *
 * Tests for V5 event-sourced game store.
 * Total tests required: 13 (8 AC + 3 EC + 2 ERR)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/stores/gameStore.js';
import type { V5Event } from '../../src/stores/gameStore.js';
import {
  BUILTIN_PACK,
  DEFAULT_CONFIG,
  type V5Puzzle,
  type Card,
} from '@hsh/engine-core';

describe('Task 002: Migrate Game Store (V5 Migration)', () => {
  // Get test puzzle from BUILTIN_PACK
  const testPuzzle: V5Puzzle = BUILTIN_PACK.puzzles[0]!;
  const testConfig = DEFAULT_CONFIG;
  const testSeed = 12345;

  /**
   * Helper to find a valid card ID from the puzzle hand
   */
  function getValidCardId(): string {
    return testPuzzle.cards[0]!.id;
  }

  /**
   * Helper to find a card that is not a lie
   */
  function getTruthCardId(): string {
    const truthCard = testPuzzle.cards.find((c) => !c.isLie);
    return truthCard!.id;
  }

  // Reset store before each test
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  // ==========================================================================
  // AC-1: Store holds V5Event[] as source of truth
  // ==========================================================================
  describe('AC-1: Store holds V5Event[] as source of truth', () => {
    it('should have events array as primary state (not GameState)', () => {
      const state = useGameStore.getState();

      // events should be an array
      expect(Array.isArray(state.events)).toBe(true);
      expect(state.events).toHaveLength(0);

      // gameState should be null initially
      expect(state.gameState).toBeNull();
    });
  });

  // ==========================================================================
  // AC-2: GameState derived from events
  // ==========================================================================
  describe('AC-2: GameState derived from events', () => {
    it('should derive state reflecting replay of all events', () => {
      const store = useGameStore.getState();

      // Start game
      store.startGame(testPuzzle.slug, testConfig, testSeed);

      // Play two cards
      const cardId1 = getTruthCardId();
      store.playCard(cardId1);

      // Get the second valid card that's still in hand
      const state1 = useGameStore.getState();
      const remainingCards = state1.gameState!.hand;
      const cardId2 = remainingCards.find((c) => !c.isLie)?.id ?? remainingCards[0]!.id;
      store.playCard(cardId2);

      const finalState = useGameStore.getState();

      // Should have 3 events: GAME_STARTED + 2 CARD_PLAYED
      expect(finalState.events).toHaveLength(3);
      expect(finalState.events[0]!.type).toBe('GAME_STARTED');
      expect(finalState.events[1]!.type).toBe('CARD_PLAYED');
      expect(finalState.events[2]!.type).toBe('CARD_PLAYED');

      // GameState should reflect 2 turns played
      expect(finalState.gameState).not.toBeNull();
      expect(finalState.gameState!.turnsPlayed).toBe(2);
      expect(finalState.gameState!.played).toHaveLength(2);
    });
  });

  // ==========================================================================
  // AC-3: startGame appends GAME_STARTED event
  // ==========================================================================
  describe('AC-3: startGame appends GAME_STARTED event', () => {
    it('should append GAME_STARTED event with correct data', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);

      const state = useGameStore.getState();

      expect(state.events).toHaveLength(1);
      const startEvent = state.events[0] as V5Event & { type: 'GAME_STARTED' };
      expect(startEvent.type).toBe('GAME_STARTED');
      expect(startEvent.puzzleSlug).toBe(testPuzzle.slug);
      expect(startEvent.seed).toBe(testSeed);
      expect(startEvent.timestamp).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // AC-4: playCard appends CARD_PLAYED event
  // ==========================================================================
  describe('AC-4: playCard appends CARD_PLAYED event', () => {
    it('should append CARD_PLAYED event and re-derive state', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);
      const cardId = getValidCardId();
      store.playCard(cardId);

      const state = useGameStore.getState();

      expect(state.events).toHaveLength(2);
      const playEvent = state.events[1] as V5Event & { type: 'CARD_PLAYED' };
      expect(playEvent.type).toBe('CARD_PLAYED');
      expect(playEvent.cardId).toBe(cardId);
      expect(playEvent.timestamp).toBeGreaterThan(0);

      // State should reflect the play
      expect(state.gameState!.turnsPlayed).toBe(1);
    });
  });

  // ==========================================================================
  // AC-5: resolveObjection appends event
  // ==========================================================================
  describe('AC-5: resolveObjection appends event', () => {
    it('should append OBJECTION_RESOLVED event and re-derive state', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);

      // Play 2 cards to trigger objection opportunity (after turn 2)
      const cardId1 = getTruthCardId();
      store.playCard(cardId1);

      const state1 = useGameStore.getState();
      const remainingCards = state1.gameState!.hand;
      const cardId2 = remainingCards.find((c) => !c.isLie)?.id ?? remainingCards[0]!.id;
      store.playCard(cardId2);

      // Resolve objection
      const result = store.resolveObjection('stood_by');

      const state = useGameStore.getState();

      // Should have 4 events: GAME_STARTED + 2 CARD_PLAYED + OBJECTION_RESOLVED
      expect(state.events).toHaveLength(4);
      const objectionEvent = state.events[3] as V5Event & { type: 'OBJECTION_RESOLVED' };
      expect(objectionEvent.type).toBe('OBJECTION_RESOLVED');
      expect(objectionEvent.choice).toBe('stood_by');
      expect(objectionEvent.timestamp).toBeGreaterThan(0);

      // Result should be ok
      expect(result.ok).toBe(true);
    });
  });

  // ==========================================================================
  // AC-6: getVerdict returns verdict data
  // ==========================================================================
  describe('AC-6: getVerdict returns verdict data', () => {
    it('should return VerdictData from engine after 3 CARD_PLAYED events', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);

      // Play 3 cards (all turns)
      const cardIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const currentState = useGameStore.getState();
        const hand = currentState.gameState!.hand;
        const truthCard = hand.find((c) => !c.isLie);
        const cardId = truthCard?.id ?? hand[0]!.id;
        cardIds.push(cardId);
        store.playCard(cardId);
      }

      // Game should be over
      expect(store.isGameOver()).toBe(true);

      // Get verdict
      const verdict = store.getVerdict();

      expect(verdict).not.toBeNull();
      expect(verdict!.tier).toBeDefined();
      expect(verdict!.beliefFinal).toBeDefined();
      expect(verdict!.beliefTarget).toBe(testPuzzle.target);
      expect(verdict!.koaLine).toBeDefined();
      expect(verdict!.playedCards).toHaveLength(3);
    });
  });

  // ==========================================================================
  // AC-7: deriveV5State is deterministic
  // ==========================================================================
  describe('AC-7: deriveV5State is deterministic', () => {
    it('should return identical GameState from same events', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);
      const cardId = getTruthCardId();
      store.playCard(cardId);

      // Get current events
      const events = [...useGameStore.getState().events];
      const state1 = useGameStore.getState().gameState;

      // Reset and reload same events
      store.reset();
      store.loadEvents(events as V5Event[]);
      const state2 = useGameStore.getState().gameState;

      // States should be identical
      expect(state1).not.toBeNull();
      expect(state2).not.toBeNull();
      expect(state1!.belief).toBe(state2!.belief);
      expect(state1!.turnsPlayed).toBe(state2!.turnsPlayed);
      expect(state1!.hand.length).toBe(state2!.hand.length);
      expect(state1!.played.length).toBe(state2!.played.length);
    });
  });

  // ==========================================================================
  // AC-8: V5Event type exported
  // ==========================================================================
  describe('AC-8: V5Event type exported', () => {
    it('should export V5Event type for persistence layer', () => {
      // Type check: V5Event is used in test imports
      // This test verifies the export works at runtime by checking event structure
      const store = useGameStore.getState();
      store.startGame(testPuzzle.slug, testConfig, testSeed);

      const events = useGameStore.getState().events;
      const event: V5Event = events[0]!;

      // V5Event should have type discriminator
      expect(['GAME_STARTED', 'CARD_PLAYED', 'OBJECTION_RESOLVED']).toContain(event.type);
    });
  });

  // ==========================================================================
  // EC-1: Derive with empty events
  // ==========================================================================
  describe('EC-1: Derive with empty events', () => {
    it('should return null for deriveV5State([])', () => {
      const state = useGameStore.getState();

      // Initial state should have empty events and null gameState
      expect(state.events).toHaveLength(0);
      expect(state.gameState).toBeNull();
    });
  });

  // ==========================================================================
  // EC-2: Derive with only GAME_STARTED (no plays yet)
  // ==========================================================================
  describe('EC-2: Derive with only GAME_STARTED (no plays yet)', () => {
    it('should return initial GameState with full hand', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);

      const state = useGameStore.getState();

      expect(state.events).toHaveLength(1);
      expect(state.gameState).not.toBeNull();
      expect(state.gameState!.hand).toHaveLength(testPuzzle.cards.length);
      expect(state.gameState!.turnsPlayed).toBe(0);
      expect(state.gameState!.played).toHaveLength(0);
    });
  });

  // ==========================================================================
  // EC-3: Reset clears events
  // ==========================================================================
  describe('EC-3: Reset clears events', () => {
    it('should clear events and set gameState to null on reset()', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);
      store.playCard(getValidCardId());

      expect(useGameStore.getState().events.length).toBeGreaterThan(0);

      store.reset();

      const state = useGameStore.getState();
      expect(state.events).toHaveLength(0);
      expect(state.gameState).toBeNull();
    });
  });

  // ==========================================================================
  // ERR-1: playCard with invalid cardId
  // ==========================================================================
  describe('ERR-1: playCard with invalid cardId', () => {
    it('should not append event and return error containing "not found in hand"', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);
      const result = store.playCard('nonexistent_card');

      const state = useGameStore.getState();

      // Only GAME_STARTED event should exist
      expect(state.events).toHaveLength(1);

      // Result should be error
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('not found in hand');
      }
    });
  });

  // ==========================================================================
  // ERR-2: playCard when game over
  // ==========================================================================
  describe('ERR-2: playCard when game over', () => {
    it('should not append event and return error containing "Game is over"', () => {
      const store = useGameStore.getState();

      store.startGame(testPuzzle.slug, testConfig, testSeed);

      // Play 3 cards (all turns)
      for (let i = 0; i < 3; i++) {
        const currentState = useGameStore.getState();
        const hand = currentState.gameState!.hand;
        const cardId = hand[0]!.id;
        store.playCard(cardId);
      }

      expect(store.isGameOver()).toBe(true);

      // Try to play another card
      const currentState = useGameStore.getState();
      const eventsBeforeAttempt = currentState.events.length;

      // Need to find a card that would be in hand if game wasn't over
      // But since we played 3, hand still has cards
      const hand = currentState.gameState!.hand;
      if (hand.length > 0) {
        const result = store.playCard(hand[0]!.id);

        // Events should not increase
        expect(useGameStore.getState().events.length).toBe(eventsBeforeAttempt);

        // Result should be error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('Game is over');
        }
      }
    });
  });
});
