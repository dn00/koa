/**
 * Event system and state derivation.
 * Task 009: Event System and State Derivation
 *
 * Implements event sourcing for game state - events are truth, state is derived.
 */

import type {
  RunState,
  Puzzle,
  ConcernId,
  Scrutiny,
  EvidenceCard,
  CardId,
} from '../types/index.js';
import { RunStatus, ok, err, type Result } from '../types/index.js';

// ============================================================================
// Hash Functions (AC-8, AC-9)
// ============================================================================

/**
 * Simple deterministic hash function for strings.
 * Uses djb2 algorithm - simple, fast, deterministic.
 * Integer-only math per Invariant I1.
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Recursively sort object keys for canonical JSON.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as object).sort();
  for (const key of keys) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

/**
 * Compute a deterministic hash of an object.
 * Uses canonical JSON stringification for consistency.
 */
function hashObject(obj: unknown): string {
  const canonical = JSON.stringify(sortKeys(obj));
  return djb2Hash(canonical);
}

/**
 * Compute a deterministic hash of the current game state.
 * Same state = same hash (Invariant I1).
 *
 * AC-9: State Snapshot Hash
 */
export function computeStateHash(state: RunState): string {
  const stateForHash = {
    puzzleId: state.puzzle.id,
    resistance: state.resistance,
    scrutiny: state.scrutiny,
    turnsRemaining: state.turnsRemaining,
    concernsAddressed: [...state.concernsAddressed].sort(),
    committedStoryIds: state.committedStory.map((c) => c.id).sort(),
  };
  return hashObject(stateForHash);
}

/**
 * Compute hash for an event (for hash chain).
 */
function computeEventHash(event: GameEvent, prevHash: string): string {
  const eventForHash = {
    type: event.type,
    payload: event.payload,
    prevHash,
  };
  return hashObject(eventForHash);
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Base event metadata for hash chain.
 */
interface EventMetadata {
  readonly eventHash: string;
  readonly prevEventHash: string;
}

/**
 * Payload for RUN_STARTED event.
 */
export interface RunStartedPayload {
  readonly puzzle: Puzzle;
  readonly dealtHand: readonly EvidenceCard[];
}

/**
 * Payload for CARDS_SUBMITTED event.
 */
export interface CardsSubmittedPayload {
  readonly cardIds: readonly CardId[];
  readonly cards: readonly EvidenceCard[];
  readonly damageDealt: number;
}

/**
 * Payload for CONCERN_ADDRESSED event.
 */
export interface ConcernAddressedPayload {
  readonly concernId: ConcernId;
}

/**
 * Payload for SCRUTINY_INCREASED event.
 */
export interface ScrutinyPayload {
  readonly amount: number;
}

/**
 * Payload for RUN_ENDED event.
 */
export interface RunEndedPayload {
  readonly status: typeof RunStatus.WON | typeof RunStatus.LOST;
  readonly reason?: string;
}

/**
 * Discriminated union of all game events.
 * AC-8: Each event has prev_event_hash linking to previous event.
 */
export type GameEvent = EventMetadata &
  (
    | { readonly type: 'RUN_STARTED'; readonly payload: RunStartedPayload }
    | { readonly type: 'CARDS_SUBMITTED'; readonly payload: CardsSubmittedPayload }
    | { readonly type: 'CONCERN_ADDRESSED'; readonly payload: ConcernAddressedPayload }
    | { readonly type: 'SCRUTINY_INCREASED'; readonly payload: ScrutinyPayload }
    | { readonly type: 'RUN_ENDED'; readonly payload: RunEndedPayload }
  );

/**
 * Initial hash for the first event in a chain.
 */
const GENESIS_HASH = '00000000';

// ============================================================================
// Event Constructors
// ============================================================================

/**
 * Create a RUN_STARTED event.
 * AC-8: First event uses GENESIS_HASH as prev_event_hash.
 */
export function runStarted(
  payload: RunStartedPayload,
  prevEventHash: string = GENESIS_HASH
): GameEvent {
  const baseEvent = { type: 'RUN_STARTED' as const, payload };
  const eventHash = computeEventHash(
    { ...baseEvent, eventHash: '', prevEventHash } as GameEvent,
    prevEventHash
  );
  return { ...baseEvent, eventHash, prevEventHash };
}

/**
 * Create a CARDS_SUBMITTED event.
 * AC-8: Links to previous event via hash.
 */
export function cardsSubmitted(
  payload: CardsSubmittedPayload,
  prevEventHash: string = GENESIS_HASH
): GameEvent {
  const baseEvent = { type: 'CARDS_SUBMITTED' as const, payload };
  const eventHash = computeEventHash(
    { ...baseEvent, eventHash: '', prevEventHash } as GameEvent,
    prevEventHash
  );
  return { ...baseEvent, eventHash, prevEventHash };
}

/**
 * Create a CONCERN_ADDRESSED event.
 * AC-8: Links to previous event via hash.
 */
export function concernAddressed(
  concernId: ConcernId,
  prevEventHash: string = GENESIS_HASH
): GameEvent {
  const baseEvent = {
    type: 'CONCERN_ADDRESSED' as const,
    payload: { concernId },
  };
  const eventHash = computeEventHash(
    { ...baseEvent, eventHash: '', prevEventHash } as GameEvent,
    prevEventHash
  );
  return { ...baseEvent, eventHash, prevEventHash };
}

/**
 * Create a SCRUTINY_INCREASED event.
 * AC-8: Links to previous event via hash.
 */
export function scrutinyIncreased(
  amount: number,
  prevEventHash: string = GENESIS_HASH
): GameEvent {
  const baseEvent = {
    type: 'SCRUTINY_INCREASED' as const,
    payload: { amount },
  };
  const eventHash = computeEventHash(
    { ...baseEvent, eventHash: '', prevEventHash } as GameEvent,
    prevEventHash
  );
  return { ...baseEvent, eventHash, prevEventHash };
}

/**
 * Create a RUN_ENDED event.
 * AC-8: Links to previous event via hash.
 */
export function runEnded(
  status: typeof RunStatus.WON | typeof RunStatus.LOST,
  reason?: string,
  prevEventHash: string = GENESIS_HASH
): GameEvent {
  const baseEvent = {
    type: 'RUN_ENDED' as const,
    payload: { status, reason },
  };
  const eventHash = computeEventHash(
    { ...baseEvent, eventHash: '', prevEventHash } as GameEvent,
    prevEventHash
  );
  return { ...baseEvent, eventHash, prevEventHash };
}

// ============================================================================
// State Initialization
// ============================================================================

/**
 * Initialize state from RUN_STARTED event.
 */
function initializeState(payload: RunStartedPayload): RunState {
  return {
    puzzle: payload.puzzle,
    committedStory: [],
    resistance: payload.puzzle.resistance,
    scrutiny: 0,
    turnsRemaining: payload.puzzle.turns,
    concernsAddressed: [],
  };
}

// ============================================================================
// Event Application
// ============================================================================

/**
 * Clamp scrutiny to valid range (0-5).
 */
function clampScrutiny(value: number): Scrutiny {
  if (value <= 0) return 0;
  if (value >= 5) return 5;
  return value as Scrutiny;
}

/**
 * Apply CARDS_SUBMITTED event to state.
 * AC-2: Updates resistance and commits cards.
 */
function applyCardsSubmitted(
  state: RunState,
  payload: CardsSubmittedPayload
): RunState {
  return {
    ...state,
    committedStory: [...state.committedStory, ...payload.cards],
    resistance: Math.max(0, state.resistance - payload.damageDealt),
    turnsRemaining: Math.max(0, state.turnsRemaining - 1),
  };
}

/**
 * Apply CONCERN_ADDRESSED event to state.
 * AC-3: Adds concern to addressed list.
 */
function applyConcernAddressed(
  state: RunState,
  payload: ConcernAddressedPayload
): RunState {
  // Don't add duplicates
  if (state.concernsAddressed.includes(payload.concernId)) {
    return state;
  }

  return {
    ...state,
    concernsAddressed: [...state.concernsAddressed, payload.concernId],
  };
}

/**
 * Apply SCRUTINY_INCREASED event to state.
 * AC-4: Increases scrutiny by amount.
 */
function applyScrutinyIncreased(
  state: RunState,
  payload: ScrutinyPayload
): RunState {
  return {
    ...state,
    scrutiny: clampScrutiny(state.scrutiny + payload.amount),
  };
}

/**
 * Apply a single event to state.
 * Assumes event is valid in the current state.
 */
function applyEvent(state: RunState, event: GameEvent): RunState {
  switch (event.type) {
    case 'CARDS_SUBMITTED':
      return applyCardsSubmitted(state, event.payload);
    case 'CONCERN_ADDRESSED':
      return applyConcernAddressed(state, event.payload);
    case 'SCRUTINY_INCREASED':
      return applyScrutinyIncreased(state, event.payload);
    case 'RUN_ENDED':
      // RUN_ENDED doesn't change state (status is derived)
      return state;
    case 'RUN_STARTED':
      // RUN_STARTED is only valid as first event, handled separately
      return state;
    default: {
      // Exhaustiveness check
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

// ============================================================================
// State Derivation
// ============================================================================

/**
 * Derive the current game status from state.
 * AC-5: Determines WON/LOST status.
 */
function deriveStatus(state: RunState, events: readonly GameEvent[]): RunStatus {
  // Check for explicit RUN_ENDED event
  const endEvent = events.find(
    (e): e is GameEvent & { type: 'RUN_ENDED' } => e.type === 'RUN_ENDED'
  );
  if (endEvent) {
    return endEvent.payload.status;
  }

  // Check win condition: resistance reduced to 0
  if (state.resistance <= 0) {
    return RunStatus.WON;
  }

  // Check loss conditions
  // Loss by scrutiny: scrutiny reaches 5
  if (state.scrutiny >= 5) {
    return RunStatus.LOST;
  }

  // Loss by turns: no turns remaining and resistance > 0
  if (state.turnsRemaining <= 0 && state.resistance > 0) {
    return RunStatus.LOST;
  }

  return RunStatus.IN_PROGRESS;
}

/**
 * Derive current game state from event log.
 * This is the source of truth - state is always computed, never stored.
 *
 * AC-1: RUN_STARTED event initializes state
 * AC-2: CARDS_SUBMITTED event updates state (resistance reduced, cards committed)
 * AC-3: CONCERN_ADDRESSED event tracks fulfillment
 * AC-4: SCRUTINY_INCREASED event updates scrutiny
 * AC-5: RUN_ENDED event marks completion (status = WON or LOST)
 * AC-6: deriveState(events) returns current RunState (pure function)
 * AC-7: Same events = same state (deterministic)
 * EC-1: Empty event list = error
 * ERR-1: Invalid event sequence = error (e.g., CARDS_SUBMITTED before RUN_STARTED)
 *
 * @param events - The complete event log
 * @returns Result containing RunState or error
 */
export function deriveState(events: readonly GameEvent[]): Result<RunState, Error> {
  // EC-1: Empty event list = error
  if (events.length === 0) {
    return err(new Error('Event log cannot be empty'));
  }

  // ERR-1: First event must be RUN_STARTED
  const firstEvent = events[0];
  if (firstEvent?.type !== 'RUN_STARTED') {
    return err(new Error('First event must be RUN_STARTED'));
  }

  // Initialize state from first event
  let state = initializeState(firstEvent.payload);

  // Fold remaining events into state
  for (let i = 1; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;

    // Validate event sequence
    if (event.type === 'RUN_STARTED') {
      return err(new Error('RUN_STARTED can only be the first event'));
    }

    state = applyEvent(state, event);
  }

  return ok(state);
}

/**
 * Get the derived status from events.
 * Useful when you need status without full state.
 */
export function deriveStatusFromEvents(
  events: readonly GameEvent[]
): Result<RunStatus, Error> {
  const stateResult = deriveState(events);
  if (!stateResult.ok) {
    return stateResult;
  }
  return ok(deriveStatus(stateResult.value, events));
}
