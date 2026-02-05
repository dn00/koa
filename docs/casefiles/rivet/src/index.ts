/**
 * RIVET - Replayable, Immutable, Verified Event Ticks
 *
 * A deterministic, event-sourced simulation kernel for "indirect control" games.
 *
 * Usage:
 * ```typescript
 * import { createKernel, ReducerRegistry, SystemRegistry } from '@rivet/core';
 * ```
 */

// Core kernel infrastructure
export * from './core/kernel.js';
export * from './core/rng.js';
export * from './core/canonical.js';
export * from './core/hash-chain.js';
export * from './core/validation.js';

// Core types
export * from './types/core.js';

// Utility algorithms
export * from './utils/pathfinding.js';
export * from './utils/vision.js';

// Reusable patterns
export * from './patterns/index.js';
