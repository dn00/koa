/**
 * Refutation mechanics for evidence cards.
 * Task 007: Refutation Mechanics
 *
 * Evidence cards can refute counter-evidence, removing their penalty effect.
 * When a card's `refutes` field matches a counter's `id`, that counter is marked
 * as refuted and will no longer apply contested penalties.
 */

import type { EvidenceCard, CounterEvidence, CardId, CounterId } from '../types/index.js';

/**
 * Check if a card can refute a specific counter.
 *
 * AC-1: Detect refutation cards with matching counter IDs
 * AC-2: Return false when no match
 * EC-1: Cards without refutes field return false
 *
 * @param card - The evidence card to check
 * @param counter - The counter-evidence to check against
 * @returns True if card.refutes matches counter.id
 */
export function canRefute(card: EvidenceCard, counter: CounterEvidence): boolean {
  // EC-1: Cards without refutes field cannot refute
  if (!card.refutes) {
    return false;
  }

  // AC-1: Match card.refutes to counter.id
  return card.refutes === counter.id;
}

/**
 * Apply refutations from cards to counters.
 *
 * Processes all cards against all counters. When a card's `refutes` field
 * matches a counter's `id`, that counter is marked as refuted with the
 * card's ID stored in `refutedBy`.
 *
 * AC-3: Mark counter as refuted
 * AC-4: Refuted counters apply no penalty (used by contested.ts)
 * AC-5: Damage restoration when counter refuted
 * AC-6: Refutation persists across turns
 * AC-7: Immutable updated counters array
 * EC-2: Multiple refutations in single submission
 * EC-3: Re-refuting already-refuted counter (no-op)
 *
 * @param cards - Array of evidence cards that may refute counters
 * @param counters - Array of counter-evidence in play
 * @returns New array of counters with refuted state updated
 */
export function applyRefutations(
  cards: readonly EvidenceCard[],
  counters: readonly CounterEvidence[]
): readonly CounterEvidence[] {
  // Build a map of counterId -> refuting cardId for quick lookup
  const refutationMap = new Map<CounterId, CardId>();

  for (const card of cards) {
    if (card.refutes) {
      // First card to refute wins (don't overwrite)
      if (!refutationMap.has(card.refutes)) {
        refutationMap.set(card.refutes, card.id);
      }
    }
  }

  // AC-7: Return new array with immutable updates
  return counters.map((counter) => {
    // EC-3: Already refuted counters stay refuted (preserve original refutedBy)
    if (counter.refuted) {
      return counter;
    }

    // Check if any card refutes this counter
    const refutingCardId = refutationMap.get(counter.id);

    if (refutingCardId) {
      // AC-3: Mark as refuted with the card ID
      return {
        ...counter,
        refuted: true,
        refutedBy: refutingCardId,
      };
    }

    // No refutation, return unchanged
    return counter;
  });
}
