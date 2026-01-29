/**
 * Domain types for V5 Engine
 * All types are defined with strict TypeScript, no `any` allowed.
 */

// ============================================================================
// Result Type
// ============================================================================

/**
 * Result type for operations that can fail.
 * Used throughout engine-core to avoid exceptions.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Helper to create a successful result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Helper to create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ============================================================================
// Branded ID Types (from ids.ts - still used)
// ============================================================================

export type {
  CardId,
  CounterId,
  PuzzleId,
  ConcernId,
  RunId,
} from './ids.js';

export {
  isCardId,
  isCounterId,
  isPuzzleId,
  isConcernId,
  isRunId,
} from './ids.js';

// ============================================================================
// V5 Types
// ============================================================================

export * from './v5/index.js';
