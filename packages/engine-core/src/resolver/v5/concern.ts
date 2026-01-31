/**
 * V5 Concern Computation
 * Determines KOA's suspicion focus based on played cards
 */

import type { SignalRoot } from '../../types/v5/index.js';
import type { Card } from '../../types/v5/card.js';

/**
 * Concern represents KOA's focus/suspicion after the first two cards.
 * The type uses a discriminated union so the payload can be type-checked.
 *
 * Priority order for computation (from spec section 3.3):
 * 1. signalRoot repeats -> same_system (stores which root)
 * 2. controlPath repeats -> automation_heavy | manual_heavy | remote_heavy
 * 3. claimShape repeats -> absence_heavy | attribution_heavy | integrity_heavy
 * 4. evidenceType repeats -> all_digital | all_sensor | all_testimony | all_physical
 * 5. nothing repeats -> no_concern
 */
export type Concern =
  | { readonly key: 'same_system'; readonly root: SignalRoot }
  | { readonly key: 'automation_heavy' }
  | { readonly key: 'manual_heavy' }
  | { readonly key: 'remote_heavy' }
  | { readonly key: 'absence_heavy' }
  | { readonly key: 'attribution_heavy' }
  | { readonly key: 'integrity_heavy' }
  | { readonly key: 'all_digital' }
  | { readonly key: 'all_sensor' }
  | { readonly key: 'all_testimony' }
  | { readonly key: 'all_physical' }
  | { readonly key: 'no_concern' };

/**
 * Type alias for the concern key discriminant.
 */
export type ConcernKey = Concern['key'];

/**
 * Helper to extract the concern key from a Concern object.
 * Useful for template lookups and ceiling explanations.
 */
export function getConcernKey(concern: Concern): ConcernKey {
  return concern.key;
}

/**
 * Computes the Concern from the first two played cards.
 * Uses priority order: signalRoot > controlPath > claimShape > evidenceType > no_concern
 *
 * @param card1 - First played card (T1)
 * @param card2 - Second played card (T2)
 * @returns Concern object with key and optional payload
 */
export function computeConcern(card1: Card, card2: Card): Concern {
  // Priority 1: signalRoot (must match and not be 'unknown')
  if (
    card1.signalRoot &&
    card2.signalRoot &&
    card1.signalRoot === card2.signalRoot &&
    card1.signalRoot !== 'unknown'
  ) {
    return { key: 'same_system', root: card1.signalRoot };
  }

  // Priority 2: controlPath (exclude 'unknown')
  if (
    card1.controlPath &&
    card2.controlPath &&
    card1.controlPath === card2.controlPath &&
    card1.controlPath !== 'unknown'
  ) {
    switch (card1.controlPath) {
      case 'automation':
        return { key: 'automation_heavy' };
      case 'manual':
        return { key: 'manual_heavy' };
      case 'remote':
        return { key: 'remote_heavy' };
    }
  }

  // Priority 3: claimShape (note: 'positive' has no concern)
  if (card1.claimShape && card2.claimShape && card1.claimShape === card2.claimShape) {
    switch (card1.claimShape) {
      case 'absence':
        return { key: 'absence_heavy' };
      case 'attribution':
        return { key: 'attribution_heavy' };
      case 'integrity':
        return { key: 'integrity_heavy' };
      // 'positive' falls through - no concern for it
    }
  }

  // Priority 4: evidenceType
  if (card1.evidenceType === card2.evidenceType) {
    switch (card1.evidenceType) {
      case 'DIGITAL':
        return { key: 'all_digital' };
      case 'SENSOR':
        return { key: 'all_sensor' };
      case 'TESTIMONY':
        return { key: 'all_testimony' };
      case 'PHYSICAL':
        return { key: 'all_physical' };
    }
  }

  return { key: 'no_concern' };
}

/**
 * Tests whether a card matches the given concern's dimension.
 * Used for determining concern hit (3-of-3) vs avoided (2-of-3).
 *
 * Matching logic (from spec section 3.3):
 * - same_system: card.signalRoot === concern.root
 * - automation_heavy: card.controlPath === 'automation'
 * - manual_heavy: card.controlPath === 'manual'
 * - remote_heavy: card.controlPath === 'remote'
 * - absence_heavy: card.claimShape === 'absence'
 * - attribution_heavy: card.claimShape === 'attribution'
 * - integrity_heavy: card.claimShape === 'integrity'
 * - all_digital: card.evidenceType === 'DIGITAL'
 * - all_sensor: card.evidenceType === 'SENSOR'
 * - all_testimony: card.evidenceType === 'TESTIMONY'
 * - all_physical: card.evidenceType === 'PHYSICAL'
 * - no_concern: always false
 *
 * @param card - Card to test
 * @param concern - Concern to match against
 * @returns true if card matches the concern dimension
 */
export function matchesConcern(card: Card, concern: Concern): boolean {
  switch (concern.key) {
    case 'same_system':
      return card.signalRoot === concern.root;
    case 'automation_heavy':
      return card.controlPath === 'automation';
    case 'manual_heavy':
      return card.controlPath === 'manual';
    case 'remote_heavy':
      return card.controlPath === 'remote';
    case 'absence_heavy':
      return card.claimShape === 'absence';
    case 'attribution_heavy':
      return card.claimShape === 'attribution';
    case 'integrity_heavy':
      return card.claimShape === 'integrity';
    case 'all_digital':
      return card.evidenceType === 'DIGITAL';
    case 'all_sensor':
      return card.evidenceType === 'SENSOR';
    case 'all_testimony':
      return card.evidenceType === 'TESTIMONY';
    case 'all_physical':
      return card.evidenceType === 'PHYSICAL';
    case 'no_concern':
      return false;
  }
}

/**
 * Result of evaluating whether a concern was hit or avoided.
 *
 * Semantics (from spec section 3.3):
 * - concernHit: true if ALL cards match the concern dimension (3-of-3 = "doubled down")
 * - concernAvoided: true if at least one card doesn't match (diversified)
 *
 * For no_concern: concernHit=false, concernAvoided=true (spec: "Concern is N/A")
 */
export interface ConcernResult {
  readonly concernHit: boolean;
  readonly concernAvoided: boolean;
}

/**
 * Evaluates whether the concern was hit (3-of-3) or avoided (2-of-3 diversified).
 *
 * Algorithm (from spec section 3.3):
 * - If concern.key === 'no_concern': return { concernHit: false, concernAvoided: true }
 * - Count how many cards match the concern dimension using matchesConcern
 * - concernHit = (matchCount === cards.length)
 * - concernAvoided = !concernHit
 *
 * Note: The first two cards are guaranteed to match (that's how concern was computed),
 * so matchCount is always >= 2 for non-no_concern.
 *
 * @param cards - All played cards (typically T1, T2, T3 in order)
 * @param concern - The Concern computed after T2
 * @returns ConcernResult with hit/avoided status
 */
export function evaluateConcernResult(cards: readonly Card[], concern: Concern): ConcernResult {
  // Special case: no_concern is always avoided
  if (concern.key === 'no_concern') {
    return { concernHit: false, concernAvoided: true };
  }

  // Defensive: handle fewer than expected cards
  if (cards.length === 0) {
    return { concernHit: false, concernAvoided: true };
  }

  // Check if all cards match the concern dimension
  const allMatch = cards.every((card) => matchesConcern(card, concern));

  return {
    concernHit: allMatch,
    concernAvoided: !allMatch,
  };
}
