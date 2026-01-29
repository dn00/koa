/**
 * V5 Game Config Types
 * GameConfig interface and preset configurations
 */

/**
 * Game configuration controlling rules and scoring.
 * All fields define tunables for the V5 game engine.
 */
export interface GameConfig {
  /** Starting belief score */
  readonly startingBelief: number;

  /** Number of cards in the player's hand */
  readonly cardsInHand: number;

  /** Cards played per turn */
  readonly cardsPerTurn: number;

  /** Total turns in a game */
  readonly turnsPerGame: number;

  /** Number of lies in each puzzle */
  readonly liesPerPuzzle: number;

  /** Scoring functions */
  readonly scoring: {
    /** Calculate belief gain for playing a truth (based on strength) */
    readonly truth: (strength: number) => number;
    /** Calculate belief change for playing a lie (based on strength, typically negative) */
    readonly lie: (strength: number) => number;
  };

  /** Tier threshold functions */
  readonly tiers: {
    /** Check if belief qualifies for FLAWLESS tier */
    readonly flawless: (belief: number, target: number) => boolean;
    /** Check if belief qualifies for CLEARED tier */
    readonly cleared: (belief: number, target: number) => boolean;
    /** Check if belief qualifies for CLOSE tier */
    readonly close: (belief: number, target: number) => boolean;
  };

  /** Objection mechanic configuration */
  readonly objection: {
    /** Whether objection mechanic is enabled */
    readonly enabled: boolean;
    /** After which turn (0-indexed) objection occurs */
    readonly afterTurn: number;
    /** Belief change for standing by a truth */
    readonly stoodByTruth: number;
    /** Belief change for standing by a lie */
    readonly stoodByLie: number;
    /** Belief change for withdrawing */
    readonly withdrew: number;
  };

  /** Type Tax (KoA Tax) configuration */
  readonly typeTax: {
    /** Whether type tax is enabled */
    readonly enabled: boolean;
    /** Penalty for repeating evidence type */
    readonly penalty: number;
  };
}

/**
 * Default game configuration.
 * Standard V5 rules with balanced scoring.
 */
export const DEFAULT_CONFIG: GameConfig = {
  startingBelief: 50,

  cardsInHand: 6,
  cardsPerTurn: 1,
  turnsPerGame: 3,
  liesPerPuzzle: 2,

  scoring: {
    truth: (str) => str,
    lie: (str) => -(str - 1),
  },

  tiers: {
    flawless: (belief, target) => belief >= target + 5,
    cleared: (belief, target) => belief >= target,
    close: (belief, target) => belief >= target - 5,
  },

  objection: {
    enabled: true,
    afterTurn: 1, // After T2 (0-indexed)
    stoodByTruth: 2,
    stoodByLie: -4,
    withdrew: -2,
  },

  typeTax: {
    enabled: true,
    penalty: -2,
  },
};

/**
 * Easy difficulty configuration.
 * More forgiving scoring and tier thresholds.
 */
export const EASY_CONFIG: GameConfig = {
  ...DEFAULT_CONFIG,
  startingBelief: 55,
  tiers: {
    flawless: (b, t) => b >= t + 10,
    cleared: (b, t) => b >= t - 5,
    close: (b, t) => b >= t - 15,
  },
  objection: {
    ...DEFAULT_CONFIG.objection,
    stoodByLie: -3, // Less punishing
  },
};

/**
 * Hard difficulty configuration.
 * Full penalties and stricter tier thresholds.
 */
export const HARD_CONFIG: GameConfig = {
  ...DEFAULT_CONFIG,
  startingBelief: 45,
  scoring: {
    truth: (str) => str,
    lie: (str) => -str, // Full penalty
  },
  tiers: {
    flawless: (b, t) => b >= t + 8,
    cleared: (b, t) => b >= t,
    close: (b, t) => b >= t - 3,
  },
  objection: {
    ...DEFAULT_CONFIG.objection,
    stoodByLie: -6, // Harsher
  },
};
