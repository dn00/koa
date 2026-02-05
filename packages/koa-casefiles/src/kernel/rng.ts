/**
 * RIVET-derived - Deterministic random number generator (xoroshiro128**)
 *
 * Reference: https://prng.di.unimi.it/xoroshiro128starstar.c
 */

// Mask for 64-bit operations using BigInt
const MASK_64 = 0xffffffffffffffffn;

/**
 * RNG state for serialization
 */
export interface RNGState {
    algo: 'xoroshiro128**';
    s0: string; // 16-char hex
    s1: string; // 16-char hex
}

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
    /** Generate next random value as BigInt (0 to 2^64-1) */
    next(): bigint;

    /** Generate random integer in range [0, max) */
    nextInt(max: number): number;

    /** Pick a random element from an array */
    pick<T>(arr: T[]): T;

    /** Shuffle an array in place */
    shuffle<T>(arr: T[]): T[];

    /** Get current state for serialization */
    getState(): RNGState;
}

/**
 * Create a new RNG from a numeric seed
 */
export function createRng(seed: number): RNG {
    const seedStr = seed.toString();
    const s0 = hashStringToBigint(seedStr);
    const s1 = hashStringToBigint(seedStr + ':s1');

    return createRngFromState(s0, s1);
}

/**
 * Create a new RNG from world seed and stream ID
 */
export function createRngWithStream(worldSeed: string, streamId: string): RNG {
    const combinedSeed = `${worldSeed}:${streamId}`;
    const s0 = hashStringToBigint(combinedSeed);
    const s1 = hashStringToBigint(combinedSeed + ':s1');

    return createRngFromState(s0, s1);
}

/**
 * Restore an RNG from serialized state
 */
export function restoreRng(state: RNGState): RNG {
    if (state.algo !== 'xoroshiro128**') {
        throw new Error(`Invalid RNG state: unsupported algorithm "${state.algo}"`);
    }

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

        pick<T>(arr: T[]): T {
            if (arr.length === 0) {
                throw new Error('Cannot pick from empty array');
            }
            return arr[this.nextInt(arr.length)];
        },

        shuffle<T>(arr: T[]): T[] {
            // Fisher-Yates shuffle
            for (let i = arr.length - 1; i > 0; i--) {
                const j = this.nextInt(i + 1);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
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
