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
