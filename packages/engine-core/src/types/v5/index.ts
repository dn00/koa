/**
 * V5 Types Barrel Export
 * All types for the V5 game engine
 */

// ============================================================================
// Enums and Type Aliases
// ============================================================================

export type { EvidenceType, Tier, LieType } from './enums.js';

// ============================================================================
// Card Types
// ============================================================================

export type { CardId, Card } from './card.js';
export { isCardId } from './card.js';

// ============================================================================
// State Types
// ============================================================================

export type { TurnResult, ObjectionState, GameState } from './state.js';

// ============================================================================
// Puzzle Types
// ============================================================================

export type { LieInfo, V5Puzzle } from './puzzle.js';

// ============================================================================
// Config Types
// ============================================================================

export type { GameConfig } from './config.js';
export { DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG } from './config.js';

// ============================================================================
// Mode Types
// ============================================================================

export type { GameMode, BarkFilter, ModeConfig } from './mode.js';
export { MINI_MODE, ADVANCED_MODE } from './mode.js';
