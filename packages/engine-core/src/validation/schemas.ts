/**
 * Pack validation schemas.
 * Task 011: Pack Schemas
 *
 * Defines JSON schemas for puzzle packs and voice packs.
 */

import type {
  CardId,
  CounterId,
  ConcernId,
  PuzzleId,
  ProofType,
  ConcernType,
} from '../types/index.js';
import { ok, err, type Result, isCardId, isCounterId, isConcernId, isPuzzleId } from '../types/index.js';

// ============================================================================
// Validation Error
// ============================================================================

/**
 * Validation error with path information.
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

// ============================================================================
// Schema Types
// ============================================================================

/**
 * Evidence card schema (matches EvidenceCard type).
 * AC-2: Has all required fields (id, power, proves, claims)
 * EC-1: Optional fields are marked optional (source, refutes)
 */
export interface EvidenceCardSchema {
  readonly id: CardId;
  readonly power: number;
  readonly proves: readonly ProofType[];
  readonly claims: ClaimsSchema;
  readonly source?: string;
  readonly refutes?: CounterId;
}

/**
 * Claims schema.
 */
export interface ClaimsSchema {
  readonly location?: string;
  readonly state?: string;
  readonly activity?: string;
  readonly timeRange?: string;
}

/**
 * Counter-evidence schema.
 * AC-3: Has targets array (required field)
 */
export interface CounterEvidenceSchema {
  readonly id: CounterId;
  readonly targets: readonly CardId[];
  readonly refutedBy?: CardId;
}

/**
 * Concern schema.
 * AC-4: Has requiredProof (required field)
 */
export interface ConcernSchema {
  readonly id: ConcernId;
  readonly type: ConcernType;
  readonly requiredProof: ProofType;
}

/**
 * Puzzle schema.
 */
export interface PuzzleSchema {
  readonly id: PuzzleId;
  readonly targetName: string;
  readonly resistance: number;
  readonly concerns: readonly ConcernSchema[];
  readonly counters: readonly CounterEvidenceSchema[];
  readonly dealtHand: readonly CardId[];
  readonly turns: number;
}

/**
 * Puzzle pack schema.
 * AC-1: Has puzzles array (required field)
 */
export interface PuzzlePackSchema {
  readonly version: string;
  readonly puzzles: readonly PuzzleSchema[];
  readonly cards: readonly EvidenceCardSchema[];
  readonly counters: readonly CounterEvidenceSchema[];
}

/**
 * Outcome keys for voice bark mapping.
 * AC-5: Voice pack has barks keyed by OutcomeKey
 */
export type OutcomeKey =
  | 'SUBMISSION_CLEAN'
  | 'SUBMISSION_CONTESTED'
  | 'CONTRADICTION_MINOR'
  | 'CONTRADICTION_MAJOR'
  | 'CONCERN_ADDRESSED'
  | 'REFUTATION_SUCCESS'
  | 'WIN'
  | 'LOSS_SCRUTINY'
  | 'LOSS_TURNS';

/**
 * Voice pack schema.
 * AC-5: Has barks keyed by OutcomeKey (map structure)
 */
export interface VoicePackSchema {
  readonly version: string;
  readonly barks: Readonly<Record<OutcomeKey, readonly string[]>>;
}

// ============================================================================
// Validation Helpers
// ============================================================================

const VALID_PROOF_TYPES = new Set(['IDENTITY', 'ALERTNESS', 'INTENT', 'LOCATION', 'LIVENESS']);
const VALID_CONCERN_TYPES = new Set(['IDENTITY', 'ALERTNESS', 'INTENT', 'LOCATION', 'LIVENESS']);
const VALID_OUTCOME_KEYS = new Set<OutcomeKey>([
  'SUBMISSION_CLEAN',
  'SUBMISSION_CONTESTED',
  'CONTRADICTION_MINOR',
  'CONTRADICTION_MAJOR',
  'CONCERN_ADDRESSED',
  'REFUTATION_SUCCESS',
  'WIN',
  'LOSS_SCRUTINY',
  'LOSS_TURNS',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// ============================================================================
// Card Validation
// ============================================================================

function validateClaims(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    errors.push({ path, message: 'claims must be an object' });
    return errors;
  }

  // All fields are optional, but if present must be strings
  if (data.location !== undefined && !isString(data.location)) {
    errors.push({ path: `${path}.location`, message: 'location must be a string' });
  }
  if (data.state !== undefined && !isString(data.state)) {
    errors.push({ path: `${path}.state`, message: 'state must be a string' });
  }
  if (data.activity !== undefined && !isString(data.activity)) {
    errors.push({ path: `${path}.activity`, message: 'activity must be a string' });
  }
  if (data.timeRange !== undefined && !isString(data.timeRange)) {
    errors.push({ path: `${path}.timeRange`, message: 'timeRange must be a string' });
  }

  return errors;
}

function validateEvidenceCard(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    errors.push({ path, message: 'card must be an object' });
    return errors;
  }

  // Required: id
  if (!isString(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a string' });
  } else if (!isCardId(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id must match card_* format' });
  }

  // Required: power
  if (!isNumber(data.power)) {
    errors.push({ path: `${path}.power`, message: 'power is required and must be a number' });
  } else if (data.power < 0) {
    errors.push({ path: `${path}.power`, message: 'power must be non-negative' });
  }

  // Required: proves
  if (!isArray(data.proves)) {
    errors.push({ path: `${path}.proves`, message: 'proves is required and must be an array' });
  } else {
    for (let i = 0; i < data.proves.length; i++) {
      const proof = data.proves[i];
      if (!isString(proof) || !VALID_PROOF_TYPES.has(proof)) {
        errors.push({
          path: `${path}.proves[${i}]`,
          message: `invalid proof type: ${String(proof)}`,
        });
      }
    }
  }

  // Required: claims
  if (data.claims === undefined) {
    errors.push({ path: `${path}.claims`, message: 'claims is required' });
  } else {
    errors.push(...validateClaims(data.claims, `${path}.claims`));
  }

  // Optional: source
  if (data.source !== undefined && !isString(data.source)) {
    errors.push({ path: `${path}.source`, message: 'source must be a string' });
  }

  // Optional: refutes
  if (data.refutes !== undefined) {
    if (!isString(data.refutes)) {
      errors.push({ path: `${path}.refutes`, message: 'refutes must be a string' });
    } else if (!isCounterId(data.refutes)) {
      errors.push({ path: `${path}.refutes`, message: 'refutes must match counter_* format' });
    }
  }

  return errors;
}

// ============================================================================
// Counter Evidence Validation
// ============================================================================

function validateCounterEvidence(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    errors.push({ path, message: 'counter must be an object' });
    return errors;
  }

  // Required: id
  if (!isString(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a string' });
  } else if (!isCounterId(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id must match counter_* format' });
  }

  // Required: targets
  if (!isArray(data.targets)) {
    errors.push({ path: `${path}.targets`, message: 'targets is required and must be an array' });
  } else {
    for (let i = 0; i < data.targets.length; i++) {
      const target = data.targets[i];
      if (!isString(target) || !isCardId(target)) {
        errors.push({
          path: `${path}.targets[${i}]`,
          message: 'target must be a valid CardId',
        });
      }
    }
  }

  // Optional: refutedBy
  if (data.refutedBy !== undefined) {
    if (!isString(data.refutedBy)) {
      errors.push({ path: `${path}.refutedBy`, message: 'refutedBy must be a string' });
    } else if (!isCardId(data.refutedBy)) {
      errors.push({ path: `${path}.refutedBy`, message: 'refutedBy must match card_* format' });
    }
  }

  return errors;
}

// ============================================================================
// Concern Validation
// ============================================================================

function validateConcern(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    errors.push({ path, message: 'concern must be an object' });
    return errors;
  }

  // Required: id
  if (!isString(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a string' });
  } else if (!isConcernId(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id must match concern_* format' });
  }

  // Required: type
  if (!isString(data.type) || !VALID_CONCERN_TYPES.has(data.type)) {
    errors.push({
      path: `${path}.type`,
      message: 'type is required and must be a valid ConcernType',
    });
  }

  // Required: requiredProof
  if (!isString(data.requiredProof) || !VALID_PROOF_TYPES.has(data.requiredProof)) {
    errors.push({
      path: `${path}.requiredProof`,
      message: 'requiredProof is required and must be a valid ProofType',
    });
  }

  return errors;
}

// ============================================================================
// Puzzle Validation
// ============================================================================

function validatePuzzle(data: unknown, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    errors.push({ path, message: 'puzzle must be an object' });
    return errors;
  }

  // Required: id
  if (!isString(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id is required and must be a string' });
  } else if (!isPuzzleId(data.id)) {
    errors.push({ path: `${path}.id`, message: 'id must match puzzle_* format' });
  }

  // Required: targetName
  if (!isString(data.targetName)) {
    errors.push({ path: `${path}.targetName`, message: 'targetName is required and must be a string' });
  }

  // Required: resistance
  if (!isNumber(data.resistance)) {
    errors.push({ path: `${path}.resistance`, message: 'resistance is required and must be a number' });
  } else if (data.resistance < 0) {
    errors.push({ path: `${path}.resistance`, message: 'resistance must be non-negative' });
  }

  // Required: concerns
  if (!isArray(data.concerns)) {
    errors.push({ path: `${path}.concerns`, message: 'concerns is required and must be an array' });
  } else {
    for (let i = 0; i < data.concerns.length; i++) {
      errors.push(...validateConcern(data.concerns[i], `${path}.concerns[${i}]`));
    }
  }

  // Required: counters
  if (!isArray(data.counters)) {
    errors.push({ path: `${path}.counters`, message: 'counters is required and must be an array' });
  } else {
    for (let i = 0; i < data.counters.length; i++) {
      errors.push(...validateCounterEvidence(data.counters[i], `${path}.counters[${i}]`));
    }
  }

  // Required: dealtHand
  if (!isArray(data.dealtHand)) {
    errors.push({ path: `${path}.dealtHand`, message: 'dealtHand is required and must be an array' });
  } else {
    for (let i = 0; i < data.dealtHand.length; i++) {
      const cardId = data.dealtHand[i];
      if (!isString(cardId) || !isCardId(cardId)) {
        errors.push({
          path: `${path}.dealtHand[${i}]`,
          message: 'dealtHand must contain valid CardIds',
        });
      }
    }
  }

  // Required: turns
  if (!isNumber(data.turns)) {
    errors.push({ path: `${path}.turns`, message: 'turns is required and must be a number' });
  } else if (data.turns < 1) {
    errors.push({ path: `${path}.turns`, message: 'turns must be at least 1' });
  }

  return errors;
}

// ============================================================================
// Pack Validation
// ============================================================================

/**
 * Validate a puzzle pack.
 * AC-1: PuzzlePack schema validates puzzles array
 * AC-2: EvidenceCard schema has all required fields
 * AC-3: CounterEvidence schema has targets array
 * AC-4: Concern schema has requiredProof
 * AC-6: Schema exports TypeScript types
 * ERR-1: Invalid pack returns validation error (fail-closed)
 *
 * @param data - Unknown data to validate
 * @returns Result with validated PuzzlePackSchema or ValidationError array
 */
export function validatePuzzlePack(
  data: unknown
): Result<PuzzlePackSchema, ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    return err([{ path: '', message: 'pack must be an object' }]);
  }

  // Required: version
  if (!isString(data.version)) {
    errors.push({ path: 'version', message: 'version is required and must be a string' });
  }

  // Required: puzzles
  if (!isArray(data.puzzles)) {
    errors.push({ path: 'puzzles', message: 'puzzles is required and must be an array' });
  } else {
    for (let i = 0; i < data.puzzles.length; i++) {
      errors.push(...validatePuzzle(data.puzzles[i], `puzzles[${i}]`));
    }
  }

  // Required: cards
  if (!isArray(data.cards)) {
    errors.push({ path: 'cards', message: 'cards is required and must be an array' });
  } else {
    for (let i = 0; i < data.cards.length; i++) {
      errors.push(...validateEvidenceCard(data.cards[i], `cards[${i}]`));
    }
  }

  // Required: counters
  if (!isArray(data.counters)) {
    errors.push({ path: 'counters', message: 'counters is required and must be an array' });
  } else {
    for (let i = 0; i < data.counters.length; i++) {
      errors.push(...validateCounterEvidence(data.counters[i], `counters[${i}]`));
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(data as unknown as PuzzlePackSchema);
}

/**
 * Validate a voice pack.
 * AC-5: VoicePack schema has barks keyed by OutcomeKey
 * ERR-1: Invalid pack returns validation error (fail-closed)
 *
 * @param data - Unknown data to validate
 * @returns Result with validated VoicePackSchema or ValidationError array
 */
export function validateVoicePack(
  data: unknown
): Result<VoicePackSchema, ValidationError[]> {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    return err([{ path: '', message: 'pack must be an object' }]);
  }

  // Required: version
  if (!isString(data.version)) {
    errors.push({ path: 'version', message: 'version is required and must be a string' });
  }

  // Required: barks
  if (!isObject(data.barks)) {
    errors.push({ path: 'barks', message: 'barks is required and must be an object' });
  } else {
    // Check all required outcome keys are present
    for (const key of VALID_OUTCOME_KEYS) {
      if (!(key in data.barks)) {
        errors.push({ path: `barks.${key}`, message: `missing required outcome key: ${key}` });
      } else {
        const barks = (data.barks as Record<string, unknown>)[key];
        if (!isArray(barks)) {
          errors.push({ path: `barks.${key}`, message: 'barks must be an array of strings' });
        } else {
          for (let i = 0; i < barks.length; i++) {
            if (!isString(barks[i])) {
              errors.push({
                path: `barks.${key}[${i}]`,
                message: 'bark must be a string',
              });
            }
          }
        }
      }
    }

    // Check for unexpected keys
    for (const key of Object.keys(data.barks)) {
      if (!VALID_OUTCOME_KEYS.has(key as OutcomeKey)) {
        errors.push({ path: `barks.${key}`, message: `unexpected outcome key: ${key}` });
      }
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(data as unknown as VoicePackSchema);
}
