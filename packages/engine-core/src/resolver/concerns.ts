/**
 * Concern fulfillment tracking.
 * Task 008: Concern Fulfillment Tracking
 *
 * Tracks which concerns are addressed by submitted evidence.
 */

import type { EvidenceCard, Concern, ConcernId } from '../types/index.js';

/**
 * States that satisfy ALERTNESS requirement.
 * Case-insensitive matching.
 */
const ALERT_STATES = new Set(['AWAKE', 'ALERT', 'ACTIVE']);

/**
 * Check if a card addresses a specific concern.
 *
 * @param card - The evidence card
 * @param concern - The concern to check
 * @returns true if the card addresses the concern
 */
function cardAddressesConcern(card: EvidenceCard, concern: Concern): boolean {
  // Check if card.proves includes the required proof type
  if (!card.proves.includes(concern.requiredProof)) {
    return false;
  }

  // AC-4: For ALERTNESS concerns, also check state requirement
  if (concern.requiredProof === 'ALERTNESS') {
    const cardState = card.claims.state?.toUpperCase();
    if (!cardState || !ALERT_STATES.has(cardState)) {
      return false;
    }
  }

  return true;
}

/**
 * Check which concerns a card addresses.
 *
 * AC-1: Card proves IDENTITY addresses IDENTITY concern (match on proof type)
 * AC-2: Card can address multiple concerns
 * AC-3: Concern requires ALL proof types matched (single requiredProof per concern)
 * AC-4: ALERTNESS concern checks state requirement (must be AWAKE/ALERT/ACTIVE)
 * AC-5: Return list of addressed concern IDs
 * EC-1: Card with empty proves addresses nothing
 * EC-2: Already-addressed concerns not re-counted (idempotent)
 *
 * @param card - The evidence card being submitted
 * @param concerns - All concerns in the puzzle
 * @param alreadyAddressed - IDs of concerns already addressed
 * @returns Array of newly addressed concern IDs
 */
export function checkConcernsFulfilled(
  card: EvidenceCard,
  concerns: readonly Concern[],
  alreadyAddressed: readonly ConcernId[]
): ConcernId[] {
  const newlyAddressed: ConcernId[] = [];

  // EC-1: Card with empty proves addresses nothing
  if (card.proves.length === 0) {
    return newlyAddressed;
  }

  for (const concern of concerns) {
    // EC-2: Skip already-addressed concerns
    if (alreadyAddressed.includes(concern.id)) {
      continue;
    }

    if (cardAddressesConcern(card, concern)) {
      newlyAddressed.push(concern.id);
    }
  }

  return newlyAddressed;
}

/**
 * Check which concerns are addressed by multiple cards in a submission.
 * Useful when a submission contains multiple cards.
 *
 * @param cards - The evidence cards being submitted
 * @param concerns - All concerns in the puzzle
 * @param alreadyAddressed - IDs of concerns already addressed
 * @returns Array of newly addressed concern IDs
 */
export function checkSubmissionConcernsFulfilled(
  cards: readonly EvidenceCard[],
  concerns: readonly Concern[],
  alreadyAddressed: readonly ConcernId[]
): ConcernId[] {
  const newlyAddressed = new Set<ConcernId>();

  for (const card of cards) {
    const addressed = checkConcernsFulfilled(card, concerns, [
      ...alreadyAddressed,
      ...newlyAddressed,
    ]);
    for (const id of addressed) {
      newlyAddressed.add(id);
    }
  }

  return [...newlyAddressed];
}

/**
 * Check if all concerns are addressed by the committed story.
 *
 * AC-5: Return true if ALL concerns are addressed
 * AC-6: Return false if any concern is not addressed
 *
 * @param concerns - All concerns in the puzzle
 * @param committedStory - Cards committed to the story
 * @returns true if all concerns are addressed
 */
export function allConcernsAddressed(
  concerns: readonly Concern[],
  committedStory: readonly EvidenceCard[]
): boolean {
  for (const concern of concerns) {
    // Check if concern is already marked addressed
    if (concern.addressed) {
      continue;
    }

    // Check if any committed card addresses this concern
    const isAddressed = committedStory.some((card) =>
      cardAddressesConcern(card, concern)
    );

    if (!isAddressed) {
      return false;
    }
  }

  return true;
}

/**
 * Update concern status based on newly addressed concern IDs.
 * Returns new concern array with addressed = true for matched IDs.
 * Immutable - does not modify input concerns.
 *
 * AC-7: Return concerns with addressed = true for matched IDs
 *
 * @param concerns - All concerns in the puzzle
 * @param addressedIds - IDs of newly addressed concerns
 * @returns New array of concerns with updated addressed status
 */
export function updateConcernStatus(
  concerns: readonly Concern[],
  addressedIds: readonly ConcernId[]
): Concern[] {
  return concerns.map((concern) => {
    if (concern.addressed) {
      return concern;
    }

    if (addressedIds.includes(concern.id)) {
      return { ...concern, addressed: true };
    }

    return concern;
  });
}
