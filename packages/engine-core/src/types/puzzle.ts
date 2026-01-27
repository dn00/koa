/**
 * Puzzle type representing a game scenario.
 */

import type { PuzzleId, CardId } from './ids.js';
import type { Concern } from './concern.js';
import type { CounterEvidence } from './counter.js';

/**
 * AC-7: A puzzle scenario that defines the game challenge.
 * - id: Unique identifier
 * - targetName: Name of the person being verified (e.g., "Alex")
 * - resistance: Initial resistance value to overcome
 * - concerns: KOA's concerns that must be addressed
 * - counters: Counter-evidence KOA may deploy
 * - dealtHand: CardIds dealt to the player
 * - turns: Maximum number of turns allowed
 */
export interface Puzzle {
  readonly id: PuzzleId;
  readonly targetName: string;
  readonly resistance: number;
  readonly concerns: readonly Concern[];
  readonly counters: readonly CounterEvidence[];
  readonly dealtHand: readonly CardId[];
  readonly turns: number;
}
