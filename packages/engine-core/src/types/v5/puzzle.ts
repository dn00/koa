/**
 * V5 Puzzle Types
 * V5Puzzle definition and LieInfo
 */

import type { Card } from './card.js';
import type { LieType } from './enums.js';

/**
 * Information about a lie in the puzzle.
 * Used by the engine and for validation.
 */
export interface LieInfo {
  /** ID of the card that is a lie */
  readonly cardId: string;

  /** Type of lie: direct contradiction or relational */
  readonly lieType: LieType;

  /** Why it's a lie (for verdicts/explanation) */
  readonly reason: string;

  /** For relational lies: which card or fact it conflicts with */
  readonly contradictsWith?: string;
}

/**
 * Complete puzzle definition for V5 game.
 * Contains cards, lies, verdicts, and KOA dialogue.
 */
export interface V5Puzzle {
  /** URL-friendly identifier */
  readonly slug: string;

  /** Display name */
  readonly name: string;

  /** 2-3 line scenario setting the scene */
  readonly scenario: string;

  /** 3-5 bullet points of known facts for player reasoning */
  readonly knownFacts: readonly string[];

  /** KOA's opening line (puzzle-specific) */
  readonly openingLine: string;

  /** Belief threshold required to clear */
  readonly target: number;

  /** All cards in this puzzle */
  readonly cards: readonly Card[];

  /** Information about which cards are lies */
  readonly lies: readonly LieInfo[];

  /** Tier-based verdict lines */
  readonly verdicts: {
    readonly flawless: string;
    readonly cleared: string;
    readonly close: string;
    readonly busted: string;
  };

  /** Puzzle-specific KOA barks/dialogue */
  readonly koaBarks: {
    /** Response when specific card is played */
    readonly cardPlayed?: Readonly<Record<string, readonly string[]>>;
    /** When played cards conflict with each other */
    readonly relationalConflict?: readonly string[];
    /** Objection prompt for specific cards */
    readonly objectionPrompt?: Readonly<Record<string, readonly string[]>>;
    /** Response when player stood by a truth */
    readonly objectionStoodTruth?: Readonly<Record<string, readonly string[]>>;
    /** Response when player stood by a lie */
    readonly objectionStoodLie?: Readonly<Record<string, readonly string[]>>;
    /** Response when player withdrew */
    readonly objectionWithdrew?: Readonly<Record<string, readonly string[]>>;
  };
}
