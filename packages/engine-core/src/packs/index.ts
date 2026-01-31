/**
 * Pack System - Pluggable puzzle loading
 */

// Types
export type {
  PuzzlePack,
  PuzzlePackManifest,
  PackError,
  ValidationError,
  PackLoader,
} from './types.js';

// Validation
export { validatePack } from './validation.js';

// Builtin Pack (Task 009)
export { BUILTIN_PACK, createBuiltinLoader } from './builtin.js';

// V1 Lite Validation (Tasks 401, 402, 403, 404, 405)
export {
  validateV1Lite,
  checkFactTouchPresence,
  checkSignalRootEnum,
  checkControlPathEnum,
  checkClaimShapeEnum,
  checkSubsystemPresence,
  checkMiniNoTimestamps,
  checkTruthsPartition,
  checkFactCoverage,
  checkLiesTrapAxis,
  checkLiesBaitReason,
  checkTrapAxisDiversity,
  // Task 404: P4+ Constraint Checks
  checkP4Basic,
  checkP4Plus,
  // Task 405: Fairness Simulation Checks
  checkExactlyOneAllTruths,
  checkAllTruthsFairness,
  type V1LiteCheck,
  type V1LiteValidationResult,
  type V1LiteCard,
  type V1LiteLieInfo,
  type V1LiteCardWithEvidence,
} from './v1-lite-validator.js';
