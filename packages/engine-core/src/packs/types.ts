/**
 * Pack Types - Puzzle pack system interfaces
 *
 * Defines types for the pluggable puzzle loading system that allows
 * puzzles to come from different sources (builtin, file-based, remote).
 */

import type { V5Puzzle } from '../types/v5/index.js';
import type { Result } from '../types/index.js';

/**
 * A collection of puzzles grouped as a pack.
 */
export interface PuzzlePack {
  /** Semantic version (e.g., "1.0.0") */
  readonly version: string;
  /** Unique identifier for the pack */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Array of puzzles in the pack */
  readonly puzzles: readonly V5Puzzle[];
}

/**
 * Lightweight metadata about a pack (for listing without loading full data).
 */
export interface PuzzlePackManifest {
  /** Pack identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Pack version */
  readonly version: string;
  /** Number of puzzles in pack */
  readonly puzzleCount: number;
  /** Optional content hash for cache validation */
  readonly hash?: string;
}

/**
 * Error from pack operations.
 */
export interface PackError {
  /** Error type code */
  readonly code: 'PACK_NOT_FOUND' | 'PUZZLE_NOT_FOUND' | 'LOAD_ERROR';
  /** Human-readable error message */
  readonly message: string;
}

/**
 * Validation error for pack structure.
 */
export interface ValidationError {
  /** Field that failed validation */
  readonly field: string;
  /** Description of the validation failure */
  readonly message: string;
}

/**
 * Interface for loading puzzle packs from any source.
 *
 * Implementations can load from builtin data, files, remote APIs, etc.
 */
export interface PackLoader {
  /**
   * List available packs.
   * @returns Array of pack manifests
   */
  listPacks(): PuzzlePackManifest[];

  /**
   * Load a full pack by ID.
   * @param packId - Pack identifier
   * @returns Result with PuzzlePack or PackError
   */
  loadPack(packId: string): Result<PuzzlePack, PackError>;

  /**
   * Get a specific puzzle from a pack.
   * @param packId - Pack identifier
   * @param slug - Puzzle slug
   * @returns Result with V5Puzzle or PackError
   */
  getPuzzle(packId: string, slug: string): Result<V5Puzzle, PackError>;
}
