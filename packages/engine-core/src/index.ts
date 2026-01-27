/**
 * @hsh/engine-core
 *
 * Pure TypeScript game engine for Home Smart Home.
 * This package has zero DOM dependencies and is fully deterministic.
 */

// Types
export * from './types/index.js';

// Resolver
export * from './resolver/index.js';

// Validation
export * from './validation/index.js';

// Placeholder export to verify the package works
export const ENGINE_VERSION = '0.0.1' as const;
