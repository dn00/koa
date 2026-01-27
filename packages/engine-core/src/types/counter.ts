/**
 * Counter-evidence type representing KOA's challenges to the story.
 */

import type { CardId, CounterId } from './ids.js';

/**
 * AC-4: Counter-evidence that KOA uses to challenge the player's story.
 * - id: Unique identifier
 * - targets: CardIds that this counter-evidence challenges
 * - refutedBy: Optional CardId that can refute this counter-evidence
 * - refuted: Whether this counter-evidence has been refuted
 */
export interface CounterEvidence {
  readonly id: CounterId;
  readonly targets: readonly CardId[];
  readonly refutedBy?: CardId;
  readonly refuted: boolean;
}
