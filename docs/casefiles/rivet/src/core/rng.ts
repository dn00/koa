/**
 * RIVET - Deterministic random number generator (xoroshiro128**)
 *
 * Reference: https://prng.di.unimi.it/xoroshiro128starstar.c
 */

import type { RNGState } from '../types/core.js';

// Re-export RNGState for convenience
export type { RNGState } from '../types/core.js';

// Mask for 64-bit operations using BigInt
const MASK_64 = 0xffffffffffffffffn;

/**
 * Rotate left operation for BigInt
 */
function rotl(x: bigint, k: number): bigint {
  return ((x << BigInt(k)) | (x >> BigInt(64 - k))) & MASK_64;
}

/**
 * Convert a 64-bit BigInt to a 16-character hex string
 */
function bigintToHex(n: bigint): string {
  return n.toString(16).padStart(16, '0');
}

/**
 * Convert a 16-character hex string to a 64-bit BigInt
 */
function hexToBigint(hex: string): bigint {
  return BigInt('0x' + hex);
}

/**
 * Validate hex string format for RNG state
 */
function validateHexState(hex: string, field: string): void {
  if (typeof hex !== 'string') {
    throw new Error(`Invalid RNG state: ${field} must be a string`);
  }
  if (hex.length !== 16) {
    throw new Error(`Invalid RNG state: ${field} must be 16-char hex`);
  }
  if (!/^[0-9a-f]{16}$/i.test(hex)) {
    throw new Error(`Invalid RNG state: ${field} must be valid hex`);
  }
}

/**
 * Simple hash function to convert seed strings to BigInt
 * Uses a variation of FNV-1a hash
 */
function hashStringToBigint(s: string): bigint {
  let hash = 0xcbf29ce484222325n; // FNV offset basis
  const fnvPrime = 0x100000001b3n;

  for (let i = 0; i < s.length; i++) {
    hash ^= BigInt(s.charCodeAt(i));
    hash = (hash * fnvPrime) & MASK_64;
  }

  return hash;
}

/**
 * RNG instance with xoroshiro128** algorithm
 */
export interface RNG {
  /**
   * Generate next random value as BigInt (0 to 2^64-1)
   */
  next(): bigint;

  /**
   * Generate random integer in range [0, max)
   */
  nextInt(max: number): number;

  /**
   * Get current state for serialization
   */
  getState(): RNGState;
}

/**
 * Create a new RNG from world seed and stream ID
 *
 * @param worldSeed - The world's seed value
 * @param streamId - Unique identifier for this RNG stream (e.g., "core.npc.ida")
 */
export function createRng(worldSeed: string, streamId: string): RNG {
  // Derive initial state from seed + streamId
  const combinedSeed = `${worldSeed}:${streamId}`;
  const s0 = hashStringToBigint(combinedSeed);
  const s1 = hashStringToBigint(combinedSeed + ':s1');

  return createRngFromState(s0, s1);
}

/**
 * Restore an RNG from serialized state
 *
 * @param state - Previously serialized RNG state
 * @throws Error if state is invalid
 */
export function restoreRng(state: RNGState): RNG {
  if (state.algo !== 'xoroshiro128**') {
    throw new Error(`Invalid RNG state: unsupported algorithm "${state.algo}"`);
  }

  validateHexState(state.s0, 's0');
  validateHexState(state.s1, 's1');

  const s0 = hexToBigint(state.s0);
  const s1 = hexToBigint(state.s1);

  return createRngFromState(s0, s1);
}

/**
 * Internal: create RNG from BigInt state values
 */
function createRngFromState(initialS0: bigint, initialS1: bigint): RNG {
  let s0 = initialS0;
  let s1 = initialS1;

  return {
    next(): bigint {
      // xoroshiro128** algorithm
      const result = (rotl((s0 * 5n) & MASK_64, 7) * 9n) & MASK_64;

      s1 ^= s0;
      s0 = rotl(s0, 24) ^ s1 ^ ((s1 << 16n) & MASK_64);
      s1 = rotl(s1, 37);

      return result;
    },

    nextInt(max: number): number {
      if (max <= 0) {
        throw new Error('nextInt max must be positive');
      }
      if (max > Number.MAX_SAFE_INTEGER) {
        throw new Error('nextInt max exceeds MAX_SAFE_INTEGER');
      }

      // Use rejection sampling for unbiased results
      const bigMax = BigInt(max);
      const threshold = (MASK_64 + 1n) - ((MASK_64 + 1n) % bigMax);

      let value: bigint;
      do {
        value = this.next();
      } while (value >= threshold);

      return Number(value % bigMax);
    },

    getState(): RNGState {
      return {
        algo: 'xoroshiro128**',
        s0: bigintToHex(s0),
        s1: bigintToHex(s1),
      };
    },
  };
}
