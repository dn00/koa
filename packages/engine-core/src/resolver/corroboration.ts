/**
 * Corroboration bonus calculation for evidence submissions.
 * Task 005: Corroboration Bonus
 *
 * When 2+ cards share any claim value, the submission gets a 25% damage bonus.
 */

import type { EvidenceCard, Claims } from '../types/index.js';

/**
 * Result of corroboration check.
 */
export interface CorroborationResult {
  readonly hasCorroboration: boolean;
  readonly sharedClaims: readonly string[];
}

/**
 * Extract all non-empty claim values from a card.
 */
function getClaimValues(claims: Claims): string[] {
  const values: string[] = [];

  if (claims.location) {
    values.push(`location:${claims.location.toLowerCase()}`);
  }
  if (claims.state) {
    values.push(`state:${claims.state.toUpperCase()}`);
  }
  if (claims.activity) {
    values.push(`activity:${claims.activity.toLowerCase()}`);
  }
  if (claims.timeRange) {
    values.push(`timeRange:${claims.timeRange}`);
  }

  return values;
}

/**
 * Check if 2+ cards share any claim value.
 *
 * AC-1: 25% bonus for same location
 * AC-2: 25% bonus for same state
 * EC-1: No bonus for single card
 * EC-2: No bonus for different claims
 * EC-3: Empty claims = no corroboration
 *
 * @param cards - Cards in the submission
 * @returns Result indicating if corroboration exists and which claims are shared
 */
export function checkCorroboration(cards: readonly EvidenceCard[]): CorroborationResult {
  // EC-1: Single card or empty cannot have corroboration
  if (cards.length < 2) {
    return { hasCorroboration: false, sharedClaims: [] };
  }

  // Count occurrences of each claim value
  const valueCounts = new Map<string, number>();

  for (const card of cards) {
    const values = getClaimValues(card.claims);
    for (const value of values) {
      valueCounts.set(value, (valueCounts.get(value) ?? 0) + 1);
    }
  }

  // Find all values that appear 2+ times
  const sharedClaims: string[] = [];
  for (const [value, count] of valueCounts) {
    if (count >= 2) {
      sharedClaims.push(value);
    }
  }

  return {
    hasCorroboration: sharedClaims.length > 0,
    sharedClaims,
  };
}

/**
 * Calculate corroboration bonus.
 *
 * AC-3: ceil() rounding for bonus calculation
 *
 * @param baseDamage - Base damage before bonus
 * @param hasCorroboration - Whether cards have corroboration
 * @returns Bonus damage (ceil(baseDamage * 0.25)) if corroborated, else 0
 */
export function calculateCorroborationBonus(
  baseDamage: number,
  hasCorroboration: boolean
): number {
  if (!hasCorroboration) {
    return 0;
  }

  // 25% bonus, rounded up
  return Math.ceil(baseDamage * 0.25);
}
