/**
 * V5 Presentation Layer — Mode-Aware Output Formatting
 *
 * Transforms engine output for display based on mode (Mini vs Advanced).
 * Mini mode hides numeric details; Advanced mode shows everything.
 *
 * All functions are pure - no side effects.
 */

import type { ModeConfig, BarkFilter } from './types.js';
import type { TurnResult, GameState, V5Puzzle, Card, Tier } from '../v5-types.js';
import { getTier } from '../v5-rules.js';
import { pickKoaLine } from '../v5-dialogue.js';
import { DEFAULT_CONFIG } from '../v5-rules.js';

// ============================================================================
// Presentation Types
// ============================================================================

/**
 * Mode-aware turn presentation.
 * Optional fields are only present if mode allows.
 */
export interface TurnPresentation {
  /** Player's narration (always present) */
  narration: string;
  /** KOA's response (always present) */
  koaResponse: string;
  /** Belief change - only in Advanced mode */
  beliefChange?: number;
  /** Current belief total - only in Advanced mode */
  beliefTotal?: number;
  /** Whether type tax was applied - only in Advanced mode */
  typeTaxApplied?: boolean;
}

/**
 * System check presentation for Mini mode.
 * Narrative only, no player options.
 */
export interface SystemCheckPresentation {
  /** Narrative bark about the challenged card */
  narrativeBark: string;
}

/**
 * Objection presentation for Advanced mode.
 * Includes player options with point values.
 */
export interface ObjectionPresentation extends SystemCheckPresentation {
  /** Whether to show stand/withdraw options */
  showOptions: true;
  /** Points for standing by (+2 or -4 depending on truth/lie) */
  standByPoints: string;
  /** Points for withdrawing (-2) */
  withdrawPoints: string;
}

/**
 * Card info for verdict display.
 */
export interface VerdictCardInfo {
  cardId: string;
  claim: string;
  wasLie: boolean;
  contradictionReason?: string;
}

/**
 * Turn summary entry for Advanced verdict.
 */
export interface TurnSummaryEntry {
  cardId: string;
  beliefChange: number;
  typeTaxApplied: boolean;
}

/**
 * Mode-aware verdict presentation.
 */
export interface VerdictPresentation {
  /** Result tier (always present) */
  tier: Tier;
  /** KOA's verdict line (always present) */
  koaLine: string;
  /** Played cards with lie marks (always present - Mini shows at verdict) */
  playedCards: VerdictCardInfo[];
  /** Final belief - only in Advanced mode */
  beliefFinal?: number;
  /** Target belief - only in Advanced mode */
  beliefTarget?: number;
  /** Turn-by-turn summary - only in Advanced mode */
  turnSummary?: TurnSummaryEntry[];
}

// ============================================================================
// Turn Formatting
// ============================================================================

/**
 * Format turn result based on mode.
 *
 * Mini mode: narration + koaResponse only
 * Advanced mode: all fields including belief numbers
 */
export function formatTurnResult(
  result: TurnResult,
  currentBelief: number,
  modeConfig: ModeConfig
): TurnPresentation {
  const base: TurnPresentation = {
    narration: result.narration,
    koaResponse: result.koaResponse,
  };

  // Advanced mode adds numeric fields
  if (modeConfig.showNumericScoring) {
    return {
      ...base,
      beliefChange: result.beliefChange,
      beliefTotal: currentBelief,
      typeTaxApplied: result.typeTaxApplied,
    };
  }

  return base;
}

// ============================================================================
// System Check / Objection Formatting
// ============================================================================

/**
 * Format system check based on mode.
 *
 * Mini mode: Returns narrative bark only (no player choice)
 * Advanced mode: Returns bark + stand/withdraw options with point values
 */
export function formatSystemCheck(
  card: Card,
  modeConfig: ModeConfig,
  seed: number
): SystemCheckPresentation | ObjectionPresentation {
  // Pick a challenge bark
  const narrativeBark = pickKoaLine(
    'OBJECTION_PROMPT',
    'coherence',
    'suspicion',
    2,
    seed,
    { location: card.location }
  );

  // Mini mode: narrative only
  if (!modeConfig.playerChoosesObjection) {
    return { narrativeBark };
  }

  // Advanced mode: include options with point values
  return {
    narrativeBark,
    showOptions: true,
    standByPoints: '+2 / -4',
    withdrawPoints: '-2',
  };
}

// ============================================================================
// Verdict Formatting
// ============================================================================

/**
 * Format final verdict based on mode.
 *
 * Mini mode: tier, koaLine, played cards with lies marked, contradiction explanations
 * Advanced mode: all above + belief numbers + turn summary
 */
export function formatVerdict(
  state: GameState,
  puzzle: V5Puzzle,
  modeConfig: ModeConfig
): VerdictPresentation {
  // Calculate tier
  const tier = getTier(state.belief, puzzle.target, DEFAULT_CONFIG);

  // Get verdict line
  const koaLine = puzzle.verdicts[tier.toLowerCase() as keyof typeof puzzle.verdicts];

  // Build played cards info (lies revealed at verdict in both modes)
  const playedCards: VerdictCardInfo[] = state.played.map(card => {
    const lieInfo = puzzle.lies.find(l => l.cardId === card.id);
    return {
      cardId: card.id,
      claim: card.claim,
      wasLie: card.isLie,
      contradictionReason: lieInfo?.reason,
    };
  });

  const base: VerdictPresentation = {
    tier,
    koaLine,
    playedCards,
  };

  // Advanced mode adds numeric fields
  if (modeConfig.showNumericScoring) {
    return {
      ...base,
      beliefFinal: state.belief,
      beliefTarget: puzzle.target,
      turnSummary: state.turnResults.map(tr => ({
        cardId: tr.card.id,
        beliefChange: tr.beliefChange,
        typeTaxApplied: tr.typeTaxApplied,
      })),
    };
  }

  return base;
}
