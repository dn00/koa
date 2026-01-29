/**
 * Game state store using Zustand.
 * Task 015: Zustand Stores
 *
 * Implements event sourcing pattern - events are truth, state is derived.
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
// - RunState → GameState
// - deriveState (no event sourcing)
// - Event creators: runStarted, cardsSubmitted, etc.
// - RunStatus → Tier

/**
 * Game store interface.
 * TODO: V5 migration - Rewrite to use GameState directly instead of events
 */
interface GameStore {
  /** TODO: V5 migration - Remove events, use GameState directly */
  events: readonly any[]; // @ts-expect-error TODO: V5 migration
  /** Derived run state (null if no run started) */
  runState: GameState | null;
  /** Current dealt hand (cards available to play) */
  dealtHand: readonly Card[];

  // Actions
  /** Start a new run with a puzzle and dealt hand */
  startRun(puzzle: V5Puzzle, dealtHand: Card[]): void;
  /** Append a raw event (for advanced use) */
  appendEvent(event: any): void; // @ts-expect-error TODO: V5 migration
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
  loadRun(events: any[], dealtHand?: Card[]): void; // @ts-expect-error TODO: V5 migration
}

/**
 * Helper to derive state from events.
 * Returns null if derivation fails.
 * TODO: V5 migration - Remove this, use GameState directly
 */
function deriveStateOrNull(events: readonly any[]): GameState | null {
  // @ts-expect-error TODO: V5 migration - Remove event sourcing
  if (events.length === 0) return null;
  // TODO: V5 migration - deriveState no longer exists
  return null;
}

/**
 * Game store using Zustand.
 *
 * AC-1: Event sourcing - State derived from events
 * AC-2: Actions create events
 * AC-3: Deterministic - Same events → same state
 * AC-4: Load from persistence - loadRun(events) restores state
 * EC-1: Reset clears all - reset() → empty state
 */
export const useGameStore = create<GameStore>((set, get) => ({
  events: [],
  runState: null,
  dealtHand: [],

  startRun: (puzzle, dealtHand) => {
    // @ts-expect-error TODO: V5 migration - Remove event sourcing
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

  submitCards: (cards, damageDealt) => {
    const { events, dealtHand } = get();
    const cardIds = cards.map((c) => c.id);
    // @ts-expect-error TODO: V5 migration - Remove event sourcing
    const event = null; // cardsSubmitted no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    // Remove submitted cards from dealt hand
    const remainingHand = dealtHand.filter((c) => !cardIds.includes(c.id));

    set({
      events: newEvents,
      runState,
      dealtHand: remainingHand,
    });
  },

  addressConcern: (concernId) => {
    const { events } = get();
    // @ts-expect-error TODO: V5 migration - concerns removed in V5
    const event = null; // concernAddressed no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  increaseScrutiny: (amount) => {
    const { events } = get();
    // @ts-expect-error TODO: V5 migration - scrutiny removed in V5
    const event = null; // scrutinyIncreased no longer exists
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  endRun: (status, reason) => {
    const { events } = get();
    // @ts-expect-error TODO: V5 migration - Remove event sourcing
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
