/**
 * Builtin Pack & Loader
 *
 * Task 009: Builtin Pack & Loader
 * Implements: R6.4, R6.5
 *
 * Provides BUILTIN_PACK constant and createBuiltinLoader factory
 * that wraps V5 puzzles as a PuzzlePack with PackLoader interface.
 *
 * Note: Puzzle data is defined inline here. For production, this could be
 * generated from or synchronized with scripts/v5-puzzles.ts.
 */

import { ok, err, type Result } from '../types/index.js';
import type { V5Puzzle } from '../types/v5/index.js';
import type { PuzzlePack, PuzzlePackManifest, PackLoader, PackError } from './types.js';
import { PUZZLE_SPRINKLER } from './sprinkler-puzzle.js';
import { PUZZLE_WASHER } from './washer-puzzle.js';
import { PUZZLE_WINE_COOLER } from './new-puzzle.js';
import { PUZZLE_MOWER } from './mower-puzzle.js';
import { PUZZLE_NIGHT_OWL } from './night-owl-puzzle.js';
import { PUZZLE_CHEESE_HEIST } from './cheese-heist-puzzle.js';
import { PUZZLE_BIDET } from './bidet-puzzle.js';
import { PUZZLE_BEAN_BONANZA } from './bean-bonanza-puzzle.js';
import { PUZZLE_TAP_OUT } from './tap-out-puzzle.js';

/**
 * All V5 puzzles for the builtin pack.
 * Only v1 Lite puzzles with complete axis fields.
 */
const V5_PUZZLES: readonly V5Puzzle[] = [
  PUZZLE_BIDET,
  PUZZLE_BEAN_BONANZA,
  PUZZLE_TAP_OUT,
  PUZZLE_SPRINKLER,
  PUZZLE_WASHER,
  PUZZLE_WINE_COOLER,
  PUZZLE_MOWER,
  PUZZLE_NIGHT_OWL,
  PUZZLE_CHEESE_HEIST,
];

// ============================================================================
// Builtin Pack
// ============================================================================

/**
 * The builtin V5 puzzle pack.
 * Contains all core V5 puzzles for the game.
 */
export const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};

// ============================================================================
// Builtin Loader
// ============================================================================

/**
 * Create a PackLoader that serves the builtin pack.
 *
 * @returns PackLoader implementation for builtin puzzles
 */
export function createBuiltinLoader(): PackLoader {
  return {
    /**
     * List available packs (only builtin-v5)
     */
    listPacks(): PuzzlePackManifest[] {
      return [
        {
          id: BUILTIN_PACK.id,
          name: BUILTIN_PACK.name,
          version: BUILTIN_PACK.version,
          puzzleCount: BUILTIN_PACK.puzzles.length,
        },
      ];
    },

    /**
     * Load a pack by ID
     */
    loadPack(packId: string): Result<PuzzlePack, PackError> {
      if (packId === BUILTIN_PACK.id) {
        return ok(BUILTIN_PACK);
      }
      return err({
        code: 'PACK_NOT_FOUND',
        message: `Pack '${packId}' not found`,
      });
    },

    /**
     * Get a specific puzzle from a pack
     */
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
