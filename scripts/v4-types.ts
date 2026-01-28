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
  readonly hint: string;
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

export interface GameState {
  score: number;
  hand: Card[];
  playedPairs: [Card, Card][];
  pairResults: PairResult[];
  turnsPlayed: number;
  activeHints: string[];
}
