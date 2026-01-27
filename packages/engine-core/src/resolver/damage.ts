/**
 * Damage calculation for evidence submissions.
 * Task 003: Basic Damage Calculation
 */

import type { EvidenceCard } from '../types/index.js';
import { ok, err, type Result } from '../types/index.js';

/**
 * Error thrown when damage calculation fails.
 */
export class DamageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DamageError';
  }
}

/**
 * Calculate total damage from submitted cards.
 * Basic version - sums power values.
 * Modifiers (contested/corroboration) added in Tasks 005/006.
 *
 * @param cards - Array of evidence cards being submitted (1-3 cards)
 * @returns Result with total damage or error
 *
 * AC-1: Sum card power values
 * AC-2: Return total as resistance reduction
 * AC-3: Handle empty submission → error
 * AC-4: Handle single card
 * AC-5: Pure function - same input = same output
 * EC-1: Cards with power 0 contribute nothing
 * EC-2: Maximum 3 cards allowed
 * ERR-1: 0 or >3 cards returns error
 */
export function calculateBaseDamage(
  cards: readonly EvidenceCard[]
): Result<number, DamageError> {
  // ERR-1: Validate submission size (must be 1-3 cards)
  if (cards.length === 0 || cards.length > 3) {
    return err(new DamageError('Submission must contain 1-3 cards'));
  }

  const total = cards.reduce((sum, card) => sum + card.power, 0);
  return ok(total);
}
