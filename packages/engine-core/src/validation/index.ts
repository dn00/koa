/**
 * Validation - Pack and state validation
 */

export const VALIDATION_VERSION = '0.0.1' as const;

// Task 011: Pack Schemas
export {
  validatePuzzlePack,
  validateVoicePack,
  type ValidationError,
  type EvidenceCardSchema,
  type ClaimsSchema,
  type CounterEvidenceSchema,
  type ConcernSchema,
  type PuzzleSchema,
  type PuzzlePackSchema,
  type VoicePackSchema,
  type OutcomeKey,
} from './schemas.js';
