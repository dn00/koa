/**
 * V5 Engine Types — Mode System & Extensibility
 *
 * This module defines types for the V5 engine modularization,
 * enabling Mini vs Advanced presentation modes.
 *
 * Future Extensibility: Types are designed to accommodate
 * KOA Trials features (tactic cards, counters, variable hearings)
 * without breaking changes.
 */

// Re-export existing V5 types
export * from '../v5-types.js';

// Import types we need to extend
import type { Card, GameState } from '../v5-types.js';

// ============================================================================
// Mode System Types
// ============================================================================

/**
 * Game mode determines presentation and player interaction level.
 * - mini: Simplified UI, no numeric scores, auto-resolved objection
 * - advanced: Full V5 experience with all mechanics visible
 * - trial: Future mode for KOA Trials (5 hearings, tactic cards)
 */
export type GameMode = 'mini' | 'advanced' | 'trial';

/**
 * Bark filter controls which KOA dialogue lines are shown.
 * - mini-safe: Only axis/pattern-level barks (no mechanic mentions)
 * - all: Full dialogue including score references
 */
export type BarkFilter = 'mini-safe' | 'all';

/**
 * Mode configuration controls presentation and player interaction.
 *
 * Both modes use the same underlying scoring engine - the difference
 * is presentation and whether player makes certain choices.
 */
export interface ModeConfig {
  /** The game mode */
  mode: GameMode;

  /** Show belief bar with current belief value */
  showBeliefBar: boolean;

  /** Show numeric scoring feedback (+3, -2, etc.) */
  showNumericScoring: boolean;

  /** Whether player chooses stand/withdraw on objection. False = auto-resolve */
  playerChoosesObjection: boolean;

  /** Show type tax rule explanation when triggered */
  showTypeTaxRule: boolean;

  /** Which barks to show */
  barkFilter: BarkFilter;
}

// ============================================================================
// Mode Presets
// ============================================================================

/**
 * Mini mode preset: Simplified presentation, no player objection choice.
 *
 * Mini constraints:
 * - Per-turn feedback: Axis/pattern-level barks only (no truth/lie, no numbers)
 * - Objection: Auto-resolved by engine (KOA optimal choice), scoring still applies
 * - System check bark shown after T2, but no player stand/withdraw prompt
 * - Barks filtered to mini-safe subset
 * - Truth/lie revealed only at verdict
 */
export const MINI_MODE: ModeConfig = {
  mode: 'mini',
  showBeliefBar: false,
  showNumericScoring: false,
  playerChoosesObjection: false,
  showTypeTaxRule: false,
  barkFilter: 'mini-safe',
};

/**
 * Advanced mode preset: Full V5 experience with all mechanics visible.
 */
export const ADVANCED_MODE: ModeConfig = {
  mode: 'advanced',
  showBeliefBar: true,
  showNumericScoring: true,
  playerChoosesObjection: true,
  showTypeTaxRule: true,
  barkFilter: 'all',
};

// ============================================================================
// Result Type (Functional Error Handling)
// ============================================================================

/**
 * Result type for functional error handling.
 * Adopted from engine-core for consistency across the codebase.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Create a successful Result.
 * @param value The success value
 * @returns Result<T, never> with ok=true
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Create a failed Result.
 * @param error The error value
 * @returns Result<never, E> with ok=false
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ============================================================================
// Turn Input (Extensible)
// ============================================================================

/**
 * Input for a single turn.
 * Extensible to accommodate future tactic card system.
 */
export interface TurnInput {
  /** Evidence card to play (required) */
  cardId: string;

  /** Tactic card to play (future: KOA Trials) */
  tacticId?: string;
}

// ============================================================================
// Extended Game State (Future-Ready)
// ============================================================================

/**
 * Extended GameState with optional fields for future features.
 * Current games only use base GameState fields; future KOA Trials
 * will populate the optional fields.
 */
export interface ExtendedGameState extends GameState {
  /** Which hearing in a multi-hearing trial (future: 1-5 or 1-7) */
  hearingNumber?: number;

  /** Player's tactic deck (future: Signal/Control/Protect cards) */
  tacticDeck?: Card[];

  /** Active KOA counters (future: Channel Reliance, Rehearsed, etc.) */
  koaCounters?: string[];
}
