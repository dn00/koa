/**
 * V5 Coverage Computation
 * Determines whether played cards cover all 3 known facts
 */

import type { Card } from '../../types/v5/card.js';

/**
 * All known facts in the game.
 */
const ALL_FACTS = [1, 2, 3] as const;

/**
 * Result of coverage computation.
 * @property status - 'complete' if all facts covered, 'gap' if any missing
 * @property missingFacts - Array of fact numbers (1, 2, or 3) not covered. Empty if complete.
 */
export interface CoverageResult {
  readonly status: 'complete' | 'gap';
  readonly missingFacts: readonly number[];
}

/**
 * Computes whether the played cards cover all 3 known facts.
 * A card "touches" a fact if its factTouch field equals that fact number.
 *
 * Algorithm:
 * 1. Let covered = Set(card.factTouch for each card)
 * 2. If covered contains {1, 2, 3} => status = 'complete'
 * 3. Else => status = 'gap', missingFacts = facts not in covered set
 *
 * @param cards - Array of played cards (typically 1-3 cards)
 * @returns CoverageResult with status and missingFacts
 */
export function computeCoverage(cards: readonly Card[]): CoverageResult {
  const covered = new Set(
    cards
      .map((c) => c.factTouch)
      .filter((f): f is 1 | 2 | 3 => f !== undefined)
  );

  const missingFacts = ALL_FACTS.filter((f) => !covered.has(f));

  return {
    status: missingFacts.length === 0 ? 'complete' : 'gap',
    missingFacts,
  };
}
