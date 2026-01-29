/**
 * @hsh/engine-core
 *
 * Pure TypeScript game engine for V5 adversarial testimony game.
 * This package has zero DOM dependencies and is fully deterministic.
 */

// Types
export * from './types/index.js';

// Resolver (V5 game logic)
export * from './resolver/index.js';

// Packs (V5 puzzle pack system)
export * from './packs/index.js';

// Hash utilities
export * from './hash.js';

// Version
export const ENGINE_VERSION = '0.1.0' as const;
