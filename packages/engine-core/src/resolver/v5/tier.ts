/**
 * V5 Tier Calculation
 *
 * Pure functions for determining game outcome tier.
 *
 * V5 Classic: getTier() - Uses belief vs target threshold
 * Mini Lite: getMiniLiteTier() - Uses axis-based tiering (NOT V5 Belief math)
 */

import type { Tier, GameConfig, Card } from '../../types/v5/index.js';
import type { CoverageResult } from './coverage.js';
import type { IndependenceLevel } from './independence.js';
import type { Concern } from './concern.js';

/**
 * Determine the game outcome tier based on belief and target.
 *
 * Tiers are evaluated in order from best to worst:
 * 1. FLAWLESS - belief >= target + 5 (default)
 * 2. CLEARED - belief >= target
 * 3. CLOSE - belief >= target - 5 (default)
 * 4. BUSTED - belief < target - 5 (implicit)
 *
 * The exact thresholds are configurable via GameConfig.tiers functions.
 *
 * @param belief - Final belief score
 * @param target - Target belief threshold for the puzzle
 * @param config - Game configuration with tier threshold functions
 * @returns The tier classification: FLAWLESS, CLEARED, CLOSE, or BUSTED
 */
export function getTier(
  belief: number,
  target: number,
  config: GameConfig
): Tier {
  if (config.tiers.flawless(belief, target)) {
    return 'FLAWLESS';
  }
  if (config.tiers.cleared(belief, target)) {
    return 'CLEARED';
  }
  if (config.tiers.close(belief, target)) {
    return 'CLOSE';
  }
  return 'BUSTED';
}

// ============================================================================
// Mini Lite Tier Calculation (Task 302)
// ============================================================================

/**
 * Input for Mini Lite tiering calculation.
 * All values are pre-computed by their respective functions.
 */
export interface MiniLiteTierInput {
  /** The 3 cards played by the player */
  readonly cards: readonly Card[];

  /** Coverage state (complete or gap) */
  readonly coverage: CoverageResult;

  /** Independence state (diverse, correlated_weak, correlated_strong) */
  readonly independence: IndependenceLevel;

  /** Concern computed after T2 */
  readonly concern: Concern;

  /** Whether the T3 card matched the concern dimension (3-of-3) */
  readonly concernHit: boolean;
}

/**
 * Count truth cards in the played set.
 * Uses card.isLie to determine truth (isLie === false).
 */
function countTruths(cards: readonly Card[]): number {
  return cards.filter((card) => !card.isLie).length;
}

/**
 * Compute the outcome tier for Mini Lite mode.
 *
 * Mini Lite uses axis-based tiering, NOT V5 Belief math.
 *
 * Tiering rules (from spec section 5.2):
 *
 * Rule 0 (Fairness clamp): All 3 truths => Outcome >= CLEARED. Always.
 *
 * Rule 1 (Base failure tiers):
 * - 2 truths + 1 lie => CLOSE
 * - 1 truth + 2 lies => BUSTED
 * - 0 truths + 3 lies => BUSTED
 *
 * Rule 2 (All-truth tiers):
 * - Case A (same_system concern):
 *   - concernHit (doubled down) => CLEARED
 *   - !concernHit (diversified on T3) => FLAWLESS
 *   - Independence is display-only (no double penalty)
 *
 * - Case B (all other concerns including no_concern):
 *   - concernHit => CLEARED
 *   - correlated (weak or strong) => CLEARED
 *   - diverse + diversified => FLAWLESS
 *
 * @param input - Pre-computed axis states and cards
 * @returns Tier classification
 */
export function getMiniLiteTier(input: MiniLiteTierInput): Tier {
  const { cards, coverage, independence, concern, concernHit } = input;
  const truthCount = countTruths(cards);

  // Rule 1: Base failure tiers (not all truths)
  if (truthCount === 2) {
    return 'CLOSE';
  }
  if (truthCount <= 1) {
    return 'BUSTED';
  }

  // Rule 0 + Rule 2: All truths (truthCount === 3)
  // Fairness clamp guarantees at least CLEARED

  // Case A: same_system concern
  // Independence is display-only in this case (overlap rule - no double penalty)
  if (concern.key === 'same_system') {
    if (concernHit) {
      return 'CLEARED'; // Doubled down on same system
    }
    // Defensive: Verify coverage is complete for FLAWLESS
    if (coverage.status !== 'complete') {
      return 'CLEARED'; // Coverage gap, fairness clamp keeps at CLEARED
    }
    return 'FLAWLESS'; // Diversified on T3
  }

  // Case B: all other concerns (including no_concern)
  if (concernHit) {
    return 'CLEARED'; // Doubled down after warning
  }

  // Check independence (only matters when not same_system concern)
  const isCorrelated =
    independence === 'correlated_weak' || independence === 'correlated_strong';
  if (isCorrelated) {
    return 'CLEARED'; // Sources overlap
  }

  // Defensive: Verify coverage is complete for FLAWLESS
  // (Should always be true with 3 truths, but check to be safe)
  if (coverage.status !== 'complete') {
    return 'CLEARED'; // Coverage gap, fairness clamp keeps at CLEARED
  }

  // All conditions met for FLAWLESS: diverse sources + diversified concern + complete coverage
  return 'FLAWLESS';
}
