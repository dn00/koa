/**
 * V5 Engine Module
 *
 * Exports types and utilities for the V5 game engine,
 * supporting Mini and Advanced presentation modes.
 */

export {
  // Mode types
  type GameMode,
  type BarkFilter,
  type ModeConfig,
  // Mode presets
  MINI_MODE,
  ADVANCED_MODE,
  // Result type
  type Result,
  ok,
  err,
  // Turn input
  type TurnInput,
  // Extended state
  type ExtendedGameState,
} from './types.js';

// Re-export base V5 types
export * from '../v5-types.js';
