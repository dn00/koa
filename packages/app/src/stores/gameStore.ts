/**
 * Game state store using Zustand.
 * Task 015: Zustand Stores
 *
 * Implements event sourcing pattern - events are truth, state is derived.
 */

import { create } from 'zustand';
import {
  deriveState,
  runStarted,
  cardsSubmitted,
  concernAddressed,
  scrutinyIncreased,
  runEnded,
  type GameEvent,
  type RunState,
  type Puzzle,
  type EvidenceCard,
  type ConcernId,
  RunStatus,
} from '@hsh/engine-core';

/**
 * Game store interface.
 */
interface GameStore {
  /** The complete event log */
  events: readonly GameEvent[];
  /** Derived run state (null if no run started) */
  runState: RunState | null;
  /** Current dealt hand (cards available to play) */
  dealtHand: readonly EvidenceCard[];

  // Actions
  /** Start a new run with a puzzle and dealt hand */
  startRun(puzzle: Puzzle, dealtHand: EvidenceCard[]): void;
  /** Append a raw event (for advanced use) */
  appendEvent(event: GameEvent): void;
  /** Submit cards and deal damage */
  submitCards(cards: EvidenceCard[], damageDealt: number): void;
  /** Mark a concern as addressed */
  addressConcern(concernId: ConcernId): void;
  /** Increase scrutiny by amount */
  increaseScrutiny(amount: number): void;
  /** End the run with a status */
  endRun(status: typeof RunStatus.WON | typeof RunStatus.LOST, reason?: string): void;
  /** Reset the store to initial state */
  reset(): void;
  /** Load a run from persisted events */
  loadRun(events: GameEvent[], dealtHand?: EvidenceCard[]): void;
}

/**
 * Helper to derive state from events.
 * Returns null if derivation fails.
 */
function deriveStateOrNull(events: readonly GameEvent[]): RunState | null {
  if (events.length === 0) return null;
  const result = deriveState(events);
  return result.ok ? result.value : null;
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
    const event = runStarted({ puzzle, dealtHand });
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
    const event = cardsSubmitted({ cardIds, cards, damageDealt });
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
    const event = concernAddressed(concernId);
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  increaseScrutiny: (amount) => {
    const { events } = get();
    const event = scrutinyIncreased(amount);
    const newEvents = [...events, event];
    const runState = deriveStateOrNull(newEvents);

    set({
      events: newEvents,
      runState,
    });
  },

  endRun: (status, reason) => {
    const { events } = get();
    const event = runEnded(status, reason);
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
