/**
 * Evidence-related types for the game.
 */

import type { CardId, CounterId } from './ids.js';
import type { ProofType } from './enums.js';

/**
 * AC-3: Claims made by an evidence card.
 * All fields are optional since cards may not make all types of claims.
 */
export interface Claims {
  readonly location?: string;
  readonly state?: string;
  readonly activity?: string;
  readonly timeRange?: string;
}

/**
 * AC-2: An evidence card that players use to build their story.
 * - id: Unique identifier
 * - power: Strength of the evidence (affects resistance reduction)
 * - proves: Array of proof types this evidence provides (EC-1: can be empty)
 * - claims: What the evidence asserts
 * - source: Optional attribution (e.g., "smart doorbell", "thermostat")
 * - refutes: Optional counter-evidence ID this card can refute
 */
export interface EvidenceCard {
  readonly id: CardId;
  readonly power: number;
  readonly proves: readonly ProofType[];
  readonly claims: Claims;
  readonly source?: string;
  readonly refutes?: CounterId;
}
