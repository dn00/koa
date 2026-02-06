import type { DifficultyTier } from './types.js';

/**
 * Parse a tier string into a DifficultyTier (1-4).
 * Accepts numeric, named, and legacy difficulty aliases.
 */
export function parseTier(str: string): DifficultyTier | undefined {
    const lower = str.toLowerCase();
    // Numeric (direct tier)
    if (lower === '1') return 1;
    if (lower === '2') return 2;
    if (lower === '3') return 3;
    if (lower === '4') return 4;
    // Named tiers
    if (lower === 'tutorial' || lower === 'tut') return 1;
    if (lower === 'standard' || lower === 'std') return 2;
    if (lower === 'challenging' || lower === 'chal') return 3;
    if (lower === 'expert' || lower === 'exp') return 4;
    // Legacy aliases (mapped to nearest tier)
    if (lower === 'easy' || lower === 'e') return 1;
    if (lower === 'medium' || lower === 'med' || lower === 'm') return 2;
    if (lower === 'hard' || lower === 'h') return 4; // hard → Expert (not Challenging)
    return undefined;
}
