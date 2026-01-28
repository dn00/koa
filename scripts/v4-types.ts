/**
 * V4 Pair Play — Shared Types
 */

export interface Card {
  readonly id: string;
  readonly strength: number;
  readonly evidenceType: 'DIGITAL' | 'PHYSICAL' | 'TESTIMONY' | 'SENSOR';
  readonly location: string;
  readonly time: string;
  readonly claim: string;
  readonly narration: string;
  readonly isLie: boolean;
}

export interface ComboResult {
  readonly name: string;
  readonly bonus: number;
  readonly description: string;
}

export interface PairResult {
  readonly cards: [Card, Card];
  readonly baseScore: number;      // sum of strengths (truth) or penalties (lie)
  readonly combos: ComboResult[];   // only if both truths
  readonly comboTotal: number;
  readonly totalScore: number;      // base + combos
  readonly liesInPair: number;
}

export interface ReactiveHint {
  readonly text: string;
  readonly quality: 'specific' | 'vague';
}

export interface PairNarration {
  /** The player's combined excuse weaving both cards into one coherent statement */
  readonly playerStatement: string;
  /** KOA's immediate reaction to the pair (before mechanical results) */
  readonly koaResponse: string;
}

export interface V4Puzzle {
  readonly name: string;
  readonly slug: string;
  readonly scenario: string;
  readonly target: number;
  readonly stance: Stance;  // determines combo values and KOA's focus
  readonly hint: string;    // atmospheric opening (stance hint is added automatically)
  readonly cards: readonly Card[];
  readonly pairNarrations: Record<string, PairNarration>;  // keyed by "cardA+cardB" sorted, 28 entries
  readonly reactiveHints: Record<string, ReactiveHint>;  // keyed by "cardA+cardB" sorted
  readonly verdictQuips: Record<string, { truth: string; lie: string }>;
  readonly dialogue: {
    readonly flawless: string;
    readonly cleared: string;
    readonly close: string;
    readonly busted: string;
  };
}

export type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

// Stance determines combo values and KOA's focus
export type Stance = 'SKEPTIC' | 'TRADITIONALIST' | 'NEUTRAL';

export interface StanceConfig {
  readonly name: Stance;
  readonly hint: string;  // KOA's opening line expressing the stance
  readonly reinforcement: number;  // same-type bonus
  readonly coverage: number;       // different-type bonus
  readonly corroboration: number;  // same-location bonus
  readonly timeline: number;       // adjacent-time bonus
}

export const STANCES: Record<Stance, StanceConfig> = {
  SKEPTIC: {
    name: 'SKEPTIC',
    hint: "I don't trust evidence that all says the same thing. Show me variety.",
    reinforcement: 1,
    coverage: 4,
    corroboration: 3,
    timeline: 2,
  },
  TRADITIONALIST: {
    name: 'TRADITIONALIST',
    hint: "Give me corroborating sources, not scattered fragments. Consistency matters.",
    reinforcement: 4,
    coverage: 0,
    corroboration: 4,
    timeline: 2,
  },
  NEUTRAL: {
    name: 'NEUTRAL',
    hint: "Convince me. I'm watching everything.",
    reinforcement: 3,
    coverage: 2,
    corroboration: 3,
    timeline: 2,
  },
};

// Reactive tells based on pair patterns (not lie-revealing, just pattern commentary)
export interface ReactiveTell {
  readonly text: string;
  readonly trigger: 'same_type' | 'same_location' | 'mixed_type' | 'high_strength' | 'lie_detected' | 'both_truth';
}

// Pressure state tracks patterns that affect future scoring
export interface PressureState {
  previousPairStrength: number;       // combined base strength of last pair
  typesPlayedBefore: Set<string>;     // types from turns BEFORE current
  lastPairLocation: string | null;    // if both cards in last pair shared a location
}

// The Objection: after T2, KOA challenges one card
export interface ObjectionState {
  challengedCard: Card | null;
  resolved: boolean;
  result: 'stood_by' | 'withdrawn' | null;
  scoreChange: number;
}

export interface GameState {
  score: number;
  hand: Card[];
  playedPairs: [Card, Card][];
  pairResults: PairResult[];
  turnsPlayed: number;
  activeHints: string[];
  pressure: PressureState;
  objection: ObjectionState | null;  // set after T2
}
