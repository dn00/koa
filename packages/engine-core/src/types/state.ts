/**
 * Game state types for tracking run progress.
 */

import type { RunId, CardId, ConcernId } from './ids.js';
import type { Puzzle } from './puzzle.js';
import type { EvidenceCard } from './evidence.js';

/**
 * ERR-1: Scrutiny level constrained to 0-5 using union type.
 * Higher scrutiny makes KOA more skeptical.
 */
export type Scrutiny = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Status of a game run.
 */
export const RunStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  WON: 'WON',
  LOST: 'LOST',
} as const;

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

/**
 * AC-8: State of an active game run.
 * - puzzle: The puzzle being played
 * - committedStory: Cards committed to the story so far
 * - resistance: Current resistance level
 * - scrutiny: KOA's scrutiny level (0-5)
 * - turnsRemaining: Turns left to complete the puzzle
 * - concernsAddressed: IDs of concerns that have been addressed
 */
export interface RunState {
  readonly puzzle: Puzzle;
  readonly committedStory: readonly EvidenceCard[];
  readonly resistance: number;
  readonly scrutiny: Scrutiny;
  readonly turnsRemaining: number;
  readonly concernsAddressed: readonly ConcernId[];
}

/**
 * AC-10: A player's submission of cards for a turn.
 * Contains 1-3 CardIds.
 */
export interface Submission {
  readonly cardIds: readonly [CardId] | readonly [CardId, CardId] | readonly [CardId, CardId, CardId];
}

/**
 * Result of processing a move.
 */
export interface MoveResult {
  readonly runId: RunId;
  readonly newState: RunState;
  readonly resistanceReduced: number;
  readonly concernsAddressed: readonly ConcernId[];
  readonly status: RunStatus;
}
