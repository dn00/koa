/**
 * Damage calculation for evidence submissions.
 * Task 003: Basic Damage Calculation
 */

import type { EvidenceCard } from '../types/index.js';

/**
 * Calculate total damage from submitted cards.
 * Basic version - sums power values.
 * Modifiers (contested/corroboration) added in Tasks 005/006.
 *
 * @param cards - Array of evidence cards being submitted
 * @returns Total damage as resistance reduction
 *
 * AC-1: Sum card power values
 * AC-2: Return total as resistance reduction
 * AC-3: Handle empty submission → 0
 * AC-4: Handle single card
 * EC-1: Cards with power 0 contribute nothing
 */
export function calculateBaseDamage(cards: readonly EvidenceCard[]): number {
  return cards.reduce((sum, card) => sum + card.power, 0);
}
