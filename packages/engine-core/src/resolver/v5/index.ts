/**
 * V5 Resolver - Game logic functions for V5 engine
 */

// Task 004: Scoring & Type Tax
export { scoreCard, checkTypeTax, type ScoringResult } from './scoring.js';

// Task 005: Objection System
export {
  shouldTriggerObjection,
  resolveObjection,
  autoResolveObjection,
  type ObjectionChoice,
  type AutoResolveResult,
} from './objection.js';

// Task 006: Tier Calculation
export { getTier } from './tier.js';

// Task 302: Mini Lite Tier Calculation
export { getMiniLiteTier, type MiniLiteTierInput } from './tier.js';

// Task 007: Engine Core
export {
  createGameState,
  playCard,
  resolveObjectionState,
  isGameOver,
  getVerdict,
  type EngineError,
  type TurnOutput,
  type ObjectionOutput,
  type VerdictData,
  type PenaltySummary,
} from './engine.js';

// Task 103: SignalRootGroup Derivation & Task 202: Independence Computation
export {
  signalRootGroup,
  getSignalRootGroup,
  computeIndependence,
  type IndependenceLevel,
} from './independence.js';

// Task 201: Coverage Computation
export { computeCoverage, type CoverageResult } from './coverage.js';

// Task 203 & 204: Concern Computation & Hit Test
export {
  computeConcern,
  matchesConcern,
  getConcernKey,
  evaluateConcernResult,
  type Concern,
  type ConcernKey,
  type ConcernResult,
} from './concern.js';
