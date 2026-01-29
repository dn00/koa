/**
 * State Hashing - Deterministic hashing for GameState
 *
 * Implements canonical JSON serialization with sorted keys
 * and SHA-256 hashing for state verification.
 *
 * Follows Python kernel's snapshot_hash() pattern.
 */

import type { GameState } from './types/v5/index.js';

/**
 * Recursively sort object keys to produce deterministic JSON.
 * Arrays preserve their order; only object keys are sorted.
 *
 * @param obj - Any value to sort
 * @returns Value with all nested object keys sorted
 */
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
          return acc;
        },
        {} as Record<string, unknown>
      );
  }
  return obj;
}

/**
 * Convert an object to canonical JSON string.
 * Keys are sorted recursively, no whitespace.
 *
 * Matches Python's: json.dumps(obj, sort_keys=True, separators=(",", ":"))
 *
 * @param obj - Object to serialize
 * @returns Canonical JSON string
 */
export function canonicalJson(obj: unknown): string {
  const sorted = sortKeys(obj);
  return JSON.stringify(sorted);
}

// SHA-256 Constants
const K: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/**
 * Right rotate a 32-bit integer.
 */
function rotr(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/**
 * SHA-256 hash function - pure TypeScript implementation.
 * Returns 64-character hex string.
 */
function sha256(message: string): string {
  // Convert string to bytes (UTF-8)
  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    const c = message.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6));
      bytes.push(0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 0x3f));
      bytes.push(0x80 | (c & 0x3f));
    } else {
      // Surrogate pair
      i++;
      const c2 = message.charCodeAt(i);
      const codePoint = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }

  // Pre-processing: adding padding bits
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0x00);
  }

  // Append original length in bits as 64-bit big-endian
  for (let i = 7; i >= 0; i--) {
    bytes.push((bitLength / Math.pow(2, i * 8)) & 0xff);
  }

  // Initialize hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Process each 512-bit chunk
  for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
    // Create message schedule array
    const w: number[] = new Array(64);

    // Copy chunk into first 16 words
    for (let i = 0; i < 16; i++) {
      const base = chunkStart + i * 4;
      const b0 = bytes[base];
      const b1 = bytes[base + 1];
      const b2 = bytes[base + 2];
      const b3 = bytes[base + 3];
      if (b0 !== undefined && b1 !== undefined && b2 !== undefined && b3 !== undefined) {
        w[i] = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
      }
    }

    // Extend to remaining 48 words
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const w16 = w[i - 16];
      const w7 = w[i - 7];
      if (w15 !== undefined && w2 !== undefined && w16 !== undefined && w7 !== undefined) {
        const s0 = rotr(7, w15) ^ rotr(18, w15) ^ (w15 >>> 3);
        const s1 = rotr(17, w2) ^ rotr(19, w2) ^ (w2 >>> 10);
        w[i] = ((w16 + s0 + w7 + s1) >>> 0);
      }
    }

    // Initialize working variables
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    // Compression function main loop
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const ki = K[i];
      const wi = w[i];
      if (ki === undefined || wi === undefined) continue;
      const temp1 = (h + S1 + ch + ki + wi) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    // Add compressed chunk to current hash value
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // Produce final hash value (big-endian)
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

/**
 * Compute SHA-256 hash of a GameState.
 *
 * Uses canonical JSON serialization to ensure deterministic hashing.
 * Same state will always produce the same hash.
 *
 * @param state - GameState to hash
 * @returns 64-character hex string (SHA-256)
 */
export async function computeStateHash(state: GameState): Promise<string> {
  const json = canonicalJson(state);
  return sha256(json);
}
