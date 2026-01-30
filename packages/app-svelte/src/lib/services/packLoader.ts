/**
 * Task 010: Pack Loader Service
 *
 * Loads V5 puzzle packs. Currently supports builtin pack only.
 * Future: custom pack loading from URLs or file system.
 */

import { BUILTIN_PACK } from '@hsh/engine-core';
import type { V5Puzzle } from '@hsh/engine-core';

/**
 * ID for the builtin V5 puzzle pack.
 */
export const BUILTIN_PACK_ID = 'builtin-v5';

/**
 * Load a puzzle pack by ID.
 *
 * AC-4: Returns array of V5Puzzle from engine-core for builtin pack.
 * ERR-1: Throws error with helpful message for unknown pack.
 *
 * @param packId - ID of the pack to load
 * @returns Promise resolving to array of V5Puzzle
 * @throws Error if pack ID is unknown
 */
export async function loadPack(packId: string): Promise<V5Puzzle[]> {
	// AC-4: Load builtin pack
	if (packId === BUILTIN_PACK_ID) {
		// Return a copy to prevent mutation
		return [...BUILTIN_PACK.puzzles];
	}

	// ERR-1: Unknown pack throws error
	throw new Error(`Unknown pack: ${packId}. Available packs: ${BUILTIN_PACK_ID}`);
}

/**
 * Get a specific puzzle from a pack by slug.
 *
 * @param packId - ID of the pack
 * @param slug - Slug of the puzzle
 * @returns Promise resolving to V5Puzzle or null if not found
 */
export async function getPuzzle(
	packId: string,
	slug: string
): Promise<V5Puzzle | null> {
	try {
		const puzzles = await loadPack(packId);
		return puzzles.find((p) => p.slug === slug) ?? null;
	} catch {
		return null;
	}
}

/**
 * List available pack IDs.
 *
 * @returns Array of available pack IDs
 */
export function listPacks(): string[] {
	return [BUILTIN_PACK_ID];
}

/**
 * Get pack metadata.
 *
 * @param packId - ID of the pack
 * @returns Pack metadata or null if not found
 */
export function getPackMetadata(packId: string): {
	id: string;
	name: string;
	puzzleCount: number;
} | null {
	if (packId === BUILTIN_PACK_ID) {
		return {
			id: BUILTIN_PACK.id,
			name: BUILTIN_PACK.name,
			puzzleCount: BUILTIN_PACK.puzzles.length
		};
	}
	return null;
}
