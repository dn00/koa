/**
 * Branded ID types for type-safe identification.
 * Using template literal types for compile-time safety.
 */

/** Unique identifier for evidence cards */
export type CardId = `card_${string}`;

/** Unique identifier for counter-evidence */
export type CounterId = `counter_${string}`;

/** Unique identifier for puzzles */
export type PuzzleId = `puzzle_${string}`;

/** Unique identifier for concerns */
export type ConcernId = `concern_${string}`;

/** Unique identifier for game runs */
export type RunId = `run_${string}`;

/**
 * Type guard to check if a string is a valid CardId
 */
export function isCardId(value: string): value is CardId {
  return value.startsWith('card_');
}

/**
 * Type guard to check if a string is a valid CounterId
 */
export function isCounterId(value: string): value is CounterId {
  return value.startsWith('counter_');
}

/**
 * Type guard to check if a string is a valid PuzzleId
 */
export function isPuzzleId(value: string): value is PuzzleId {
  return value.startsWith('puzzle_');
}

/**
 * Type guard to check if a string is a valid ConcernId
 */
export function isConcernId(value: string): value is ConcernId {
  return value.startsWith('concern_');
}

/**
 * Type guard to check if a string is a valid RunId
 */
export function isRunId(value: string): value is RunId {
  return value.startsWith('run_');
}
