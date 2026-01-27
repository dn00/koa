/**
 * Concern type representing KOA's doubts about the story.
 */

import type { ConcernId } from './ids.js';
import type { ConcernType, ProofType } from './enums.js';

/**
 * AC-5: A concern raised by KOA about the player's story.
 * - id: Unique identifier
 * - type: The type of concern (matches ConcernType enum)
 * - requiredProof: The proof type needed to address this concern
 * - addressed: Whether this concern has been resolved
 */
export interface Concern {
  readonly id: ConcernId;
  readonly type: ConcernType;
  readonly requiredProof: ProofType;
  readonly addressed: boolean;
}
