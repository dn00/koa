/**
 * Resolver - Deterministic game logic
 */

export const RESOLVER_VERSION = '0.0.1' as const;

// Task 003: Damage Calculation
export { calculateBaseDamage, DamageError } from './damage.js';

// Task 004: Contradiction Detection
export {
  detectContradictions,
  parseTime,
  parseTimeRange,
  getTimeGapMinutes,
  type ContradictionResult,
} from './contradiction.js';

// Task 008: Concern Fulfillment Tracking
export {
  checkConcernsFulfilled,
  checkSubmissionConcernsFulfilled,
  allConcernsAddressed,
  updateConcernStatus,
} from './concerns.js';

// Task 009: Event System and State Derivation
export {
  deriveState,
  deriveStatusFromEvents,
  computeStateHash,
  runStarted,
  cardsSubmitted,
  concernAddressed,
  scrutinyIncreased,
  runEnded,
  type GameEvent,
  type RunStartedPayload,
  type CardsSubmittedPayload,
  type ConcernAddressedPayload,
  type ScrutinyPayload,
  type RunEndedPayload,
} from './events.js';

// Task 005: Corroboration Bonus
export {
  checkCorroboration,
  calculateCorroborationBonus,
  type CorroborationResult,
} from './corroboration.js';

// Task 006: Counter-Evidence and Contested Penalty
export {
  checkContested,
  applyContestedPenalty,
  processContestedCards,
  type ContestResult,
} from './contested.js';

// Task 010: Scrutiny System
export {
  getScrutinyDelta,
  applyScrutinyChange,
  isScrutinyLoss,
  type ScrutinyResult,
} from './scrutiny.js';

// Task 007: Refutation Mechanics
export { canRefute, applyRefutations } from './refutation.js';
