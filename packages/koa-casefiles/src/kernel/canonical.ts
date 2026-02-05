/**
 * RIVET-derived - Canonical state serialization and hashing
 *
 * Rules:
 * 1. UTF-8 encoding
 * 2. No whitespace
 * 3. Object keys sorted lexicographically (byte order)
 * 4. Arrays preserve order
 * 5. Numbers: integers only (no floats in authoritative state)
 * 6. No null for absent fields (omit instead)
 */

import stringify from 'fast-json-stable-stringify';
import { createHash } from 'crypto';

/**
 * Encode an object to canonical JSON string
 */
export function canonicalJson(obj: unknown): string {
    return stringify(obj);
}

/**
 * Compute SHA256 hash of a string, returned as lowercase hex
 */
export function sha256(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compute event ID from event fields
 */
export function computeEventId(fields: Record<string, unknown>): string {
    return sha256(canonicalJson(fields));
}

/**
 * Stable sort with tie-breaker
 */
export function stableSort<T>(
    arr: T[],
    primary: (a: T, b: T) => number,
    tieBreaker: (a: T, b: T) => number
): T[] {
    return [...arr].sort((a, b) => primary(a, b) || tieBreaker(a, b));
}
