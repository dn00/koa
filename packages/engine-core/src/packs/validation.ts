/**
 * Pack Validation - Validate pack structure
 *
 * Implements Invariant I5 (Fail-Closed Packs):
 * Invalid packs are REJECTED, never silently degraded.
 */

import type { Result } from '../types/index.js';
import { ok, err } from '../types/index.js';
import type { PuzzlePack, ValidationError } from './types.js';

/**
 * Validate that data conforms to PuzzlePack structure.
 *
 * Performs structural validation to ensure the pack has all required fields
 * with correct types. Does not perform deep puzzle validation.
 *
 * @param data - Unknown data to validate
 * @returns Result with validated PuzzlePack or array of validation errors
 */
export function validatePack(data: unknown): Result<PuzzlePack, ValidationError[]> {
  // Check for null/undefined
  if (data === null || data === undefined) {
    return err([{ field: 'root', message: 'Pack must not be null or undefined' }]);
  }

  // Check for object type
  if (typeof data !== 'object') {
    return err([{ field: 'root', message: 'Pack must be an object' }]);
  }

  const obj = data as Record<string, unknown>;
  const errors: ValidationError[] = [];

  // Validate required fields
  if (typeof obj.id !== 'string') {
    errors.push({ field: 'id', message: 'id must be a string' });
  }

  if (typeof obj.version !== 'string') {
    errors.push({ field: 'version', message: 'version must be a string' });
  }

  if (typeof obj.name !== 'string') {
    errors.push({ field: 'name', message: 'name must be a string' });
  }

  if (!Array.isArray(obj.puzzles)) {
    errors.push({ field: 'puzzles', message: 'puzzles must be an array' });
  }

  // If any errors, return failure
  if (errors.length > 0) {
    return err(errors);
  }

  // All checks passed - return validated pack
  return ok(data as PuzzlePack);
}
