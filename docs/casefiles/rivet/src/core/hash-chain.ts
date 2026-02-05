/**
 * RIVET - Hash Chain Utilities
 *
 * Implements verifiable hash chain computation:
 * - batchHash = sha256(canonical_json(events[]))
 * - lastEventHash = sha256(bytes(prevLastEventHash) || bytes(batchHash))
 */

import type { SimEvent, TickIndex } from '../types/core.js';
import { canonicalJson, sha256 } from './canonical.js';

/**
 * Error thrown when hash chain verification fails
 */
export class HashChainMismatchError extends Error {
  constructor(
    public readonly tickIndex: TickIndex,
    public readonly expected: string,
    public readonly actual: string
  ) {
    super(
      `Hash chain mismatch at tick ${tickIndex}: expected ${expected.slice(0, 16)}..., got ${actual.slice(0, 16)}...`
    );
    this.name = 'HashChainMismatchError';
  }
}

/**
 * Genesis hash constant - starting point for hash chain
 */
export const GENESIS_HASH = '0'.repeat(64);

/**
 * Compute batch hash from events array
 *
 * Per spec: batchHash = sha256(canonical_json(events[]))
 *
 * @param events - Array of SimEvent in order
 * @returns SHA256 hash as lowercase hex string
 */
export function computeBatchHash(events: SimEvent[]): string {
  return sha256(canonicalJson(events));
}

/**
 * Compute next lastEventHash from previous hash and batch hash
 *
 * Per spec: lastEventHash = sha256(bytes(prevLastEventHash) || bytes(batchHash))
 *
 * Note: We concatenate the hex strings directly. This is equivalent to
 * concatenating the underlying bytes since both are fixed 64-char hex.
 *
 * @param prevLastEventHash - Previous lastEventHash (64 char hex)
 * @param batchHash - Current batch hash (64 char hex)
 * @returns New lastEventHash as lowercase hex string
 */
export function computeNextLastEventHash(
  prevLastEventHash: string,
  batchHash: string
): string {
  // Concatenate the two hex strings (equivalent to byte concatenation)
  return sha256(prevLastEventHash + batchHash);
}

/**
 * Verify that a hash chain is valid
 *
 * @param events - Events to verify
 * @param prevLastEventHash - Previous lastEventHash to chain from (or genesisHash for tick 0)
 * @param expectedLastEventHash - Expected final lastEventHash
 * @param tickIndex - Tick index for error reporting
 * @throws HashChainMismatchError if verification fails
 */
export function verifyHashChain(
  events: SimEvent[],
  prevLastEventHash: string,
  expectedLastEventHash: string,
  tickIndex: TickIndex
): void {
  const batchHash = computeBatchHash(events);
  const computedLastEventHash = computeNextLastEventHash(prevLastEventHash, batchHash);

  if (computedLastEventHash !== expectedLastEventHash) {
    throw new HashChainMismatchError(
      tickIndex,
      expectedLastEventHash,
      computedLastEventHash
    );
  }
}

/**
 * Migrate a legacy hash chain to the spec-compliant algorithm
 *
 * This is a one-shot migration that recomputes all hashes using the
 * canonical algorithm.
 *
 * @param events - Events in the batch
 * @param prevLastEventHash - Previous lastEventHash to chain from
 * @returns Object with new batchHash and lastEventHash
 */
export function migrateHashChain(
  events: SimEvent[],
  prevLastEventHash: string
): { batchHash: string; lastEventHash: string } {
  const batchHash = computeBatchHash(events);
  const lastEventHash = computeNextLastEventHash(prevLastEventHash, batchHash);

  return { batchHash, lastEventHash };
}

/**
 * Compute genesis hash for a world
 *
 * @param worldId - The world's unique identifier
 * @returns SHA256 hash of worldId
 */
export function computeGenesisHash(worldId: string): string {
  return sha256(worldId);
}
