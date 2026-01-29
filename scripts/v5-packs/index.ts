/**
 * V5 Puzzle Pack System
 *
 * Pluggable puzzle loading system that allows puzzles to come from
 * different sources (builtin, file-based, remote) without changing engine code.
 */

import type { V5Puzzle } from '../v5-types.js';
import type { Result } from '../v5-engine/types.js';
import { ok, err } from '../v5-engine/types.js';
import { V5_PUZZLES } from '../v5-puzzles.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A collection of puzzles grouped as a pack.
 */
export interface PuzzlePack {
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Unique identifier for the pack */
  id: string;
  /** Human-readable name */
  name: string;
  /** Array of puzzles in the pack */
  puzzles: V5Puzzle[];
}

/**
 * Lightweight metadata about a pack (for listing without loading full data).
 */
export interface PuzzlePackManifest {
  /** Pack identifier */
  packId: string;
  /** Pack version */
  version: string;
  /** Number of puzzles in pack */
  puzzleCount: number;
  /** Optional content hash for cache validation */
  hash?: string;
}

/**
 * Error from pack operations.
 */
export interface PackError {
  code: 'PACK_NOT_FOUND' | 'PUZZLE_NOT_FOUND' | 'LOAD_ERROR';
  message: string;
}

/**
 * Validation error for pack structure.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Interface for loading puzzle packs from any source.
 */
export interface PackLoader {
  /** List available packs */
  listPacks(): PuzzlePackManifest[];

  /** Load a full pack by ID */
  loadPack(packId: string): Result<PuzzlePack, PackError>;

  /** Get a specific puzzle from a pack */
  getPuzzle(packId: string, slug: string): Result<V5Puzzle, PackError>;
}

// ============================================================================
// Builtin Pack
// ============================================================================

/**
 * Builtin pack wrapping existing V5_PUZZLES.
 */
export const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};

// ============================================================================
// Pack Validation
// ============================================================================

/**
 * Validate that data conforms to PuzzlePack structure.
 *
 * @param data Unknown data to validate
 * @returns Result with validated PuzzlePack or array of validation errors
 */
export function validatePack(data: unknown): Result<PuzzlePack, ValidationError[]> {
  const errors: ValidationError[] = [];

  if (data === null || data === undefined) {
    return err([{ field: 'root', message: 'Pack must not be null or undefined' }]);
  }

  if (typeof data !== 'object') {
    return err([{ field: 'root', message: 'Pack must be an object' }]);
  }

  const obj = data as Record<string, unknown>;

  // Check required fields
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

  if (errors.length > 0) {
    return err(errors);
  }

  // All checks passed
  return ok(data as PuzzlePack);
}

// ============================================================================
// Builtin Loader
// ============================================================================

/**
 * Create a PackLoader that serves the builtin pack.
 */
export function createBuiltinLoader(): PackLoader {
  return {
    listPacks(): PuzzlePackManifest[] {
      return [
        {
          packId: BUILTIN_PACK.id,
          version: BUILTIN_PACK.version,
          puzzleCount: BUILTIN_PACK.puzzles.length,
        },
      ];
    },

    loadPack(packId: string): Result<PuzzlePack, PackError> {
      if (packId === BUILTIN_PACK.id) {
        return ok(BUILTIN_PACK);
      }
      return err({
        code: 'PACK_NOT_FOUND',
        message: `Pack '${packId}' not found`,
      });
    },

    getPuzzle(packId: string, slug: string): Result<V5Puzzle, PackError> {
      if (packId !== BUILTIN_PACK.id) {
        return err({
          code: 'PACK_NOT_FOUND',
          message: `Pack '${packId}' not found`,
        });
      }

      const puzzle = BUILTIN_PACK.puzzles.find(p => p.slug === slug);
      if (!puzzle) {
        return err({
          code: 'PUZZLE_NOT_FOUND',
          message: `Puzzle '${slug}' not found in pack '${packId}'`,
        });
      }

      return ok(puzzle);
    },
  };
}
