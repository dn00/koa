/**
 * Resolver - Deterministic game logic
 */

export const RESOLVER_VERSION = '0.0.1' as const;

// Task 003: Damage Calculation
export { calculateBaseDamage } from './damage.js';

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
} from './concerns.js';

// Task 009: Event System and State Derivation
export {
  deriveState,
  deriveStatusFromEvents,
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
