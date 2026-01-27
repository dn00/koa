/**
 * Turn processor — orchestrates a single turn of the game.
 * Task 015: Pure function composing all resolver sub-systems.
 *
 * processTurn(state, submission, cardMap) → Result<TurnResult, TurnError>
 */

import type {
  RunState,
  Submission,
  EvidenceCard,
  CardId,
  ConcernId,
  CounterId,
  Scrutiny,
} from '../types/index.js';
import { ok, err, type Result, ContradictionSeverity } from '../types/index.js';
import { detectContradictions, type ContradictionResult } from './contradiction.js';
import { applyRefutations } from './refutation.js';
import { processContestedCards } from './contested.js';
import { checkCorroboration, calculateCorroborationBonus } from './corroboration.js';
import { applyScrutinyChange } from './scrutiny.js';
import { checkSubmissionConcernsFulfilled } from './concerns.js';

// ============================================================================
// Types
// ============================================================================

export type TurnOutcome = 'CONTINUE' | 'WIN' | 'LOSS_SCRUTINY' | 'LOSS_TURNS';

export interface DamageBreakdown {
  readonly cardPowers: readonly { readonly id: CardId; readonly original: number; readonly adjusted: number }[];
  readonly base: number;
  readonly corroborationBonus: number;
  readonly total: number;
}

export interface TurnResult {
  readonly newState: RunState;
  readonly damageDealt: number;
  readonly damageBreakdown: DamageBreakdown;
  readonly scrutinyChange: number;
  readonly concernsAddressed: readonly ConcernId[];
  readonly contradictions: readonly ContradictionResult[];
  readonly refutationsApplied: readonly CounterId[];
  readonly outcome: TurnOutcome;
}

export class TurnError extends Error {
  readonly code: TurnErrorCode;
  constructor(code: TurnErrorCode, message: string) {
    super(message);
    this.name = 'TurnError';
    this.code = code;
  }
}

export type TurnErrorCode =
  | 'INVALID_CARD_COUNT'
  | 'CARD_NOT_IN_HAND'
  | 'CARD_ALREADY_COMMITTED'
  | 'CARD_NOT_FOUND'
  | 'MAJOR_CONTRADICTION'
  | 'NO_TURNS_REMAINING';

// ============================================================================
// processTurn
// ============================================================================

/**
 * Process a single turn submission against the current game state.
 *
 * Resolution order:
 * 1. Validate submission (1-3 cards, in hand, not already committed)
 * 2. Resolve card IDs → EvidenceCard objects
 * 3. Check MAJOR contradictions (each card vs committedStory + prior submitted cards)
 * 4. Apply refutations → updated counters
 * 5. Calculate contested penalties → adjusted powers per card
 * 6. Sum adjusted powers → base damage
 * 7. Check corroboration → bonus = ceil(base × 0.25) if triggered
 * 8. Total damage = base + bonus
 * 9. Collect MINOR contradictions → scrutiny delta
 * 10. Apply scrutiny recovery: if refutation occurred this turn, delta -= 1 (min 0)
 * 11. Apply scrutiny change
 * 12. Check concern fulfillment
 * 13. Build new RunState (immutable)
 * 14. Determine outcome: WIN / LOSS_SCRUTINY / LOSS_TURNS / CONTINUE
 */
export function processTurn(
  state: RunState,
  submission: Submission,
  cardMap: ReadonlyMap<CardId, EvidenceCard>,
): Result<TurnResult, TurnError> {
  const { cardIds } = submission;

  // Step 0: Check turns remaining
  if (state.turnsRemaining <= 0) {
    return err(new TurnError('NO_TURNS_REMAINING', 'No turns remaining'));
  }

  // Step 1: Validate submission size
  if (cardIds.length < 1 || cardIds.length > 3) {
    return err(new TurnError('INVALID_CARD_COUNT', 'Submission must contain 1-3 cards'));
  }

  // Validate cards are in hand and not already committed
  const committedIds = new Set(state.committedStory.map(c => c.id));
  const handSet = new Set(state.puzzle.dealtHand);

  for (const id of cardIds) {
    if (!handSet.has(id)) {
      return err(new TurnError('CARD_NOT_IN_HAND', `Card ${id} is not in the dealt hand`));
    }
    if (committedIds.has(id)) {
      return err(new TurnError('CARD_ALREADY_COMMITTED', `Card ${id} is already committed`));
    }
  }

  // Step 2: Resolve card IDs → EvidenceCard objects
  const cards: EvidenceCard[] = [];
  for (const id of cardIds) {
    const card = cardMap.get(id);
    if (!card) {
      return err(new TurnError('CARD_NOT_FOUND', `Card ${id} not found in card map`));
    }
    cards.push(card);
  }

  // Step 3: Check MAJOR contradictions
  // Each card checked against committedStory + previously submitted cards in this turn
  const allContradictions: ContradictionResult[] = [];
  const storyForCheck = [...state.committedStory];

  for (const card of cards) {
    const contradiction = detectContradictions(card, storyForCheck);
    if (contradiction) {
      if (contradiction.severity === ContradictionSeverity.MAJOR) {
        return err(new TurnError(
          'MAJOR_CONTRADICTION',
          `MAJOR contradiction: ${contradiction.description}`,
        ));
      }
      allContradictions.push(contradiction);
    }
    // Add this card to the story context for subsequent checks
    storyForCheck.push(card);
  }

  // Step 4: Apply refutations → updated counters
  const updatedCounters = applyRefutations(cards, state.puzzle.counters);
  const refutationsApplied: CounterId[] = [];
  for (let i = 0; i < updatedCounters.length; i++) {
    const before = state.puzzle.counters[i]!;
    const after = updatedCounters[i]!;
    if (!before.refuted && after.refuted) {
      refutationsApplied.push(after.id);
    }
  }

  // Step 5: Calculate contested penalties (using updated counters)
  const contestResults = processContestedCards(cards, updatedCounters);

  // Step 6: Sum adjusted powers → base damage
  const cardPowers = contestResults.map(r => ({
    id: r.cardId,
    original: r.originalPower,
    adjusted: r.adjustedPower,
  }));
  const baseDamage = contestResults.reduce((sum, r) => sum + r.adjustedPower, 0);

  // Step 7: Check corroboration → bonus
  const corroboration = checkCorroboration(cards);
  const corroborationBonus = calculateCorroborationBonus(baseDamage, corroboration.hasCorroboration);

  // Step 8: Total damage
  const totalDamage = baseDamage + corroborationBonus;

  // Step 9: Collect MINOR contradictions → scrutiny delta
  let scrutinyDelta = 0;
  for (const c of allContradictions) {
    if (c.severity === ContradictionSeverity.MINOR) {
      scrutinyDelta += 1;
    }
  }

  // Step 10: Scrutiny recovery — if refutation this turn, delta -= 1 (min 0)
  if (refutationsApplied.length > 0 && scrutinyDelta > 0) {
    scrutinyDelta = Math.max(0, scrutinyDelta - 1);
  }

  // Step 11: Apply scrutiny change
  const scrutinyResult = applyScrutinyChange(state.scrutiny, scrutinyDelta);

  // Step 12: Check concern fulfillment
  const newConcernsAddressed = checkSubmissionConcernsFulfilled(
    cards,
    state.puzzle.concerns,
    state.concernsAddressed,
  );

  // Step 13: Build new RunState
  const newResistance = Math.max(0, state.resistance - totalDamage);
  const newTurnsRemaining = state.turnsRemaining - 1;
  const allConcernsNowAddressed = [...state.concernsAddressed, ...newConcernsAddressed];

  const updatedPuzzle = {
    ...state.puzzle,
    counters: updatedCounters,
  };

  const newState: RunState = {
    puzzle: updatedPuzzle,
    committedStory: [...state.committedStory, ...cards],
    resistance: newResistance,
    scrutiny: scrutinyResult.newScrutiny,
    turnsRemaining: newTurnsRemaining,
    concernsAddressed: allConcernsNowAddressed,
  };

  // Step 14: Determine outcome
  let outcome: TurnOutcome = 'CONTINUE';
  if (scrutinyResult.isLossCondition) {
    outcome = 'LOSS_SCRUTINY';
  } else if (newResistance <= 0) {
    outcome = 'WIN';
  } else if (newTurnsRemaining <= 0) {
    outcome = 'LOSS_TURNS';
  }

  const damageBreakdown: DamageBreakdown = {
    cardPowers,
    base: baseDamage,
    corroborationBonus,
    total: totalDamage,
  };

  return ok({
    newState,
    damageDealt: totalDamage,
    damageBreakdown,
    scrutinyChange: scrutinyDelta,
    concernsAddressed: newConcernsAddressed,
    contradictions: allContradictions,
    refutationsApplied,
    outcome,
  });
}
