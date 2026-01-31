/**
 * V5 Types — Micro-Daily Puzzle
 * 6 cards, 1 per turn, 3 turns
 * Hidden truthiness, Known Facts for reasoning
 * Home AI theme (KOA = smart home assistant)
 */

// ============================================================================
// Evidence Cards
// ============================================================================

export type EvidenceType = 'DIGITAL' | 'PHYSICAL' | 'TESTIMONY' | 'SENSOR';

export interface Card {
  id: string;
  strength: number;          // 1-5: Belief gain if truth
  evidenceType: EvidenceType;
  location: string;
  time: string;
  claim: string;             // The evidence statement
  presentLine: string;       // What YOU say when submitting this card
  isLie: boolean;            // Hidden from player, used by engine
}

// ============================================================================
// Lie Classification (for content constraints)
// ============================================================================

export type LieType = 'direct_contradiction' | 'relational' | 'implausible_timeline';

export interface LieInfo {
  cardId: string;
  lieType: LieType;
  reason: string;            // Why it's a lie (for verdicts)
  contradictsWith?: string;  // For relational lies: which card or fact it conflicts with
}

// ============================================================================
// Link Phrases — Connect narration atoms between turns
// ============================================================================

export type LinkTag =
  | 'same_location'
  | 'same_type'
  | 'different_type'
  | 'adjacent_time'
  | 'escalation'
  | 'closing';

// ============================================================================
// KOA Dialogue System
// ============================================================================

export type DialogueSlot =
  | 'OPENING_STANCE'
  | 'AFTER_PLAY'
  | 'RELATIONAL_CONFLICT'    // When two played cards conflict
  | 'OBJECTION_PROMPT'       // After T2: challenges last card
  | 'OBJECTION_STOOD_TRUTH'  // Stood by a truth
  | 'OBJECTION_STOOD_LIE'    // Stood by a lie
  | 'OBJECTION_WITHDREW'     // Withdrew
  | 'FINAL_VERDICT';

export type DialogueAxis =
  | 'timeline'          // Time-based reasoning
  | 'coherence'         // Story consistency
  | 'channel_reliance'  // Same evidence type repeated
  | 'location_fixation' // Same location repeated
  | 'contradiction'     // Lie detected
  | 'plausibility';     // General believability

export type DialogueValence = 'praise' | 'neutral' | 'suspicion' | 'warning';

export interface DialogueLine {
  slot: DialogueSlot;
  axis?: DialogueAxis;
  valence: DialogueValence;
  intensity: number;
  text: string;
}

// ============================================================================
// Game State
// ============================================================================

export interface TurnResult {
  card: Card;
  beliefChange: number;
  wasLie: boolean;
  typeTaxApplied: boolean;
  narration: string;         // Player's presentLine
  koaResponse: string;       // KOA's reaction
}

export interface ObjectionState {
  challengedCard: Card | null;
  resolved: boolean;
  result: 'stood_by' | 'withdrawn' | null;
  beliefChange: number;
}

export interface GameState {
  belief: number;
  hand: Card[];
  played: Card[];
  turnResults: TurnResult[];
  turnsPlayed: number;
  objection: ObjectionState | null;
}

export type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

// ============================================================================
// Puzzle Definition
// ============================================================================

export interface V5Puzzle {
  slug: string;
  name: string;
  scenario: string;          // 2-3 lines setting the scene
  knownFacts: string[];      // 3-5 bullets: what the player knows
  openingLine: string;       // KOA's opening (puzzle-specific)
  target: number;            // Belief threshold to clear
  cards: readonly Card[];

  // Lie information (hidden from player, for engine + validation)
  lies: LieInfo[];

  // Tier-based verdict lines
  verdicts: {
    flawless: string;
    cleared: string;
    close: string;
    busted: string;
  };

  // Puzzle-specific KOA barks
  koaBarks: {
    cardPlayed?: Record<string, string[]>;
    relationalConflict?: string[];  // When played cards conflict with each other
    objectionPrompt?: Record<string, string[]>;
    objectionStoodTruth?: Record<string, string[]>;
    objectionStoodLie?: Record<string, string[]>;
    objectionWithdrew?: Record<string, string[]>;
    liesRevealed?: Record<string, string[]>;  // Punchlines when lies caught at end
  };

  // Optional epilogue explaining what actually happened
  epilogue?: string;
}

// ============================================================================
// Game Config (tunables)
// ============================================================================

export interface GameConfig {
  // Starting state
  startingBelief: number;

  // Structure
  cardsInHand: number;       // 6
  cardsPerTurn: number;      // 1
  turnsPerGame: number;      // 3
  liesPerPuzzle: number;     // 3

  // Scoring
  scoring: {
    truth: (strength: number) => number;
    lie: (strength: number) => number;
  };

  // Tiers
  tiers: {
    flawless: (belief: number, target: number) => boolean;
    cleared: (belief: number, target: number) => boolean;
    close: (belief: number, target: number) => boolean;
  };

  // Objection
  objection: {
    enabled: boolean;
    afterTurn: number;       // 0-indexed: 1 = after T2
    stoodByTruth: number;    // +2
    stoodByLie: number;      // -4
    withdrew: number;        // -2
  };

  // Type Tax (KoA Tax) — repeat evidence type = penalty on next play
  typeTax: {
    enabled: boolean;
    penalty: number;         // -2 default
  };
}

// ============================================================================
// Default Config
// ============================================================================

export const DEFAULT_CONFIG: GameConfig = {
  startingBelief: 50,

  cardsInHand: 6,
  cardsPerTurn: 1,
  turnsPerGame: 3,
  liesPerPuzzle: 3,

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
    afterTurn: 1,           // After T2
    stoodByTruth: 2,
    stoodByLie: -4,
    withdrew: -2,
  },

  typeTax: {
    enabled: true,          // On by default for micro-daily
    penalty: -2,
  },
};

// ============================================================================
// Difficulty Presets
// ============================================================================

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
    stoodByLie: -3,  // Less punishing
  },
};

export const HARD_CONFIG: GameConfig = {
  ...DEFAULT_CONFIG,
  startingBelief: 45,
  scoring: {
    truth: (str) => str,
    lie: (str) => -str,  // Full penalty
  },
  tiers: {
    flawless: (b, t) => b >= t + 8,
    cleared: (b, t) => b >= t,
    close: (b, t) => b >= t - 3,
  },
  objection: {
    ...DEFAULT_CONFIG.objection,
    stoodByLie: -6,  // Harsher
  },
};

// ============================================================================
// Validation Result Types
// ============================================================================

export interface InvariantCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  severity: 'error' | 'warn';
}

export interface DiagnosticMetrics {
  // T1 opening analysis
  t1CardFrequency: Record<string, number>;  // % of sequences starting with each card
  dominantOpening: string | null;           // Card ID if >50% frequency
  t1EVSpread: number;                       // Max - min EV for T1 choices

  // Replayability
  nearOptimalCount: number;                 // Lines within 2 pts of best
  replayabilityIndex: number;               // nearOptimal / total (0-1)

  // Decision quality
  orderMattersRate: number;                 // % where ordering changes score
  blindnessScore: number;                   // 0 = clear decision, 1 = all T1s equal

  // Type tax
  typeTaxTriggerRate: number;               // % of sequences where tax triggers
  avgTypeTaxCount: number;                  // Average times tax triggers per sequence
}

export interface ValidationResult {
  puzzle: string;
  passed: boolean;
  checks: InvariantCheck[];
  stats: {
    totalSequences: number;
    scoreMin: number;
    scoreMax: number;
    scoreP50: number;
    winRate: number;
    flawlessRate: number;
    bustedRate: number;
  };
  diagnostics: DiagnosticMetrics;
}
