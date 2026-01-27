/**
 * Contested penalty calculation for evidence cards.
 * Task 006: Counter-Evidence and Contested Penalty
 *
 * Counter-evidence targets specific cards. Contested cards get 50% damage penalty.
 */

import type { EvidenceCard, CounterEvidence, CardId, CounterId } from '../types/index.js';

/**
 * Result of contested check for a single card.
 */
export interface ContestResult {
  readonly cardId: CardId;
  readonly isContested: boolean;
  readonly contestedBy: readonly CounterId[];
  readonly originalPower: number;
  readonly adjustedPower: number;
}

/**
 * Check if a card is contested by any active (non-refuted) counter.
 *
 * AC-1: Counter targets via CardId[] targets field
 * AC-3: Refuted counters are inactive (no penalty)
 * EC-1: Untargeted cards are unaffected
 *
 * @param card - The evidence card to check
 * @param counters - All counter-evidence in play
 * @returns Contest result with adjusted power
 */
export function checkContested(
  card: EvidenceCard,
  counters: readonly CounterEvidence[]
): ContestResult {
  const contestingCounters: CounterId[] = [];

  for (const counter of counters) {
    // AC-3: Refuted counters don't contest
    if (counter.refuted) {
      continue;
    }

    // AC-1: Check if this card is in the counter's targets
    if (counter.targets.includes(card.id)) {
      contestingCounters.push(counter.id);
    }
  }

  const isContested = contestingCounters.length > 0;
  const adjustedPower = applyContestedPenalty(card.power, isContested);

  return {
    cardId: card.id,
    isContested,
    contestedBy: contestingCounters,
    originalPower: card.power,
    adjustedPower,
  };
}

/**
 * Calculate contested penalty for a card.
 *
 * AC-2: 50% penalty (ceil rounding)
 * EC-2: Multiple counters targeting same card = still only 50% penalty
 *
 * @param power - Original card power
 * @param isContested - Whether the card is contested
 * @returns ceil(power * 0.5) if contested, else full power
 */
export function applyContestedPenalty(power: number, isContested: boolean): number {
  if (!isContested) {
    return power;
  }

  // 50% penalty, rounded up (half power)
  return Math.ceil(power * 0.5);
}

/**
 * Process all cards against counters, return adjusted powers.
 *
 * @param cards - All cards in the submission
 * @param counters - All counter-evidence in play
 * @returns Array of contest results for each card
 */
export function processContestedCards(
  cards: readonly EvidenceCard[],
  counters: readonly CounterEvidence[]
): readonly ContestResult[] {
  return cards.map((card) => checkContested(card, counters));
}
