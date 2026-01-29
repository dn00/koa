/**
 * Game state store using Zustand.
 * Task 015: Zustand Stores
 *
 * TODO: V5 migration - This store needs major rewrite for V5:
 * - Remove event sourcing pattern
 * - Use GameState directly from @hsh/engine-core
 * - Use playCard, isGameOver, getVerdict from engine
 */

import { create } from 'zustand';
import type {
  Card,
  V5Puzzle,
  GameState,
  ConcernId,
  Tier,
} from '@hsh/engine-core';

// TODO: V5 migration - Remove event sourcing, use direct state management
// These MVP types/functions no longer exist in V5:
// - GameEvent (no events in V5)
// - RunState -> GameState
// - deriveState (no event sourcing)
// - Event creators: runStarted, cardsSubmitted, etc.
// - RunStatus -> Tier

/**
 * Game store interface.
 * TODO: V5 migration - Rewrite to use GameState directly instead of events
 */
interface GameStore {
  /** TODO: V5 migration - Remove events, use GameState directly */
  events: readonly unknown[];
  /** Derived run state (null if no run started) */
  runState: GameState | null;
  /** Current dealt hand (cards available to play) */
  dealtHand: readonly Card[];

  // Actions
  /** Start a new run with a puzzle and dealt hand */
  startRun(puzzle: V5Puzzle, dealtHand: Card[]): void;
  /** Append a raw event (for advanced use) */
  appendEvent(event: unknown): void;
  /** Submit cards and deal damage */
  submitCards(cards: Card[], damageDealt: number): void;
  /** Mark a concern as addressed */
  addressConcern(concernId: ConcernId): void; // TODO: V5 migration - concerns removed
  /** Increase scrutiny by amount */
  increaseScrutiny(amount: number): void; // TODO: V5 migration - scrutiny removed
  /** End the run with a status */
  endRun(status: Tier, reason?: string): void;
  /** Reset the store to initial state */
  reset(): void;
  /** Load a run from persisted events */
  loadRun(events: unknown[], dealtHand?: Card[]): void;
}

/**
 * Helper to derive state from events.
 * Returns null if derivation fails.
 * TODO: V5 migration - Remove this, use GameState directly
 */
function deriveStateOrNull(_events: readonly unknown[]): GameState | null {
  // TODO: V5 migration - deriveState no longer exists
  // Return null to indicate no valid state
  return null;
}

/**
 * Game store using Zustand.
 *
 * AC-1: Event sourcing - State derived from events
 * AC-2: Actions create events
 * AC-3: Deterministic - Same events -> same state
 * AC-4: Load from persistence - loadRun(events) restores state
 * EC-1: Reset clears all - reset() -> empty state
 *
 * TODO: V5 migration - This entire pattern needs to change.
 * V5 uses direct state manipulation via engine functions,
 * not event sourcing.
 */
export const useGameStore = create<GameStore>((set, get) => ({
  events: [],
  runState: null,
  dealtHand: [],

  startRun: (_puzzle, dealtHand) => {
    // TODO: V5 migration - Use createGameState from engine-core instead
    const event = null; // runStarted no longer exists
    const newEvents = [event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
      dealtHand,
    });
  },

  appendEvent: (event) => {
    const { events } = get();
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  submitCards: (cards, _damageDealt) => {
    const { events, dealtHand } = get();
    const cardIds = cards.map((c) => c.id);
    // TODO: V5 migration - Use playCard from engine-core instead
    const event = null; // cardsSubmitted no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    // Remove submitted cards from dealt hand
    const remainingHand = dealtHand.filter((c) => !(cardIds as readonly string[]).includes(c.id));

    set({
      events: newEvents,
      runState,
      dealtHand: remainingHand,
    });
  },

  addressConcern: (_concernId) => {
    // TODO: V5 migration - concerns removed in V5
    const { events } = get();
    const event = null; // concernAddressed no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  increaseScrutiny: (_amount) => {
    // TODO: V5 migration - scrutiny removed in V5
    const { events } = get();
    const event = null; // scrutinyIncreased no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  endRun: (_status, _reason) => {
    // TODO: V5 migration - Use isGameOver and getVerdict from engine-core
    const { events } = get();
    const event = null; // runEnded no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  reset: () => {
    set({
      events: [],
      runState: null,
      dealtHand: [],
    });
  },

  loadRun: (events, dealtHand = []) => {
    const runState = deriveStateOrNull(events);

    set({
      events,
      runState,
      dealtHand,
    });
  },
}));
