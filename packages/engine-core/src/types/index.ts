/**
 * Domain types for Home Smart Home
 * All types are defined with strict TypeScript, no `any` allowed.
 */

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
