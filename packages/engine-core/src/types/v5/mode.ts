/**
 * V5 Mode Types
 * ModeConfig interface and mode presets
 */

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
 * Both modes use the same underlying scoring engine - the difference
 * is presentation and whether player makes certain choices.
 */
export interface ModeConfig {
  /** The game mode */
  readonly mode: GameMode;

  /** Show belief bar with current belief value */
  readonly showBeliefBar: boolean;

  /** Show numeric scoring feedback (+3, -2, etc.) */
  readonly showNumericScoring: boolean;

  /** Whether player chooses stand/withdraw on objection. False = auto-resolve */
  readonly playerChoosesObjection: boolean;

  /** Show type tax rule explanation when triggered */
  readonly showTypeTaxRule: boolean;

  /** Which barks to show */
  readonly barkFilter: BarkFilter;
}

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
} as const;

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
} as const;
