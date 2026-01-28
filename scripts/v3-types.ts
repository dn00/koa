/**
 * V3 "The Statement" — Shared Types
 */

export interface Card {
  readonly id: string;
  readonly strength: number;
  readonly location: string;
  readonly time: string;
  readonly source: string;
  readonly claim: string;
  readonly narration: string;
  readonly isLie: boolean;
}

export interface HintDimension {
  readonly attribute: 'location' | 'time' | 'source' | 'claim_pattern';
  readonly test: string; // human-readable: "> 11PM", "= LIVING_ROOM", "denial", etc.
  readonly matchFn: (card: Card) => boolean; // machine-checkable
}

export interface ReactiveHint {
  readonly text: string;
  readonly implicates: readonly string[]; // card IDs this hint points toward
  readonly quality: 'specific' | 'vague'; // specific = risky T1 (in hint group), vague = safe T1
}

export interface Puzzle {
  readonly name: string;
  readonly slug: string;
  readonly scenario: string;
  readonly target: number;
  readonly hint: string;
  readonly hintMatchingIds: readonly string[];
  readonly hintDimension: HintDimension;
  readonly cards: readonly Card[];
  readonly reactiveHints: Record<string, ReactiveHint>;
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
  played: Card[];
  turnsPlayed: number;
  activeHint: string | null;
}

export interface TurnResult {
  card: Card;
  isLie: boolean;
  delta: number; // +strength for truth, -(strength-1) for lie
  score: number;
}
