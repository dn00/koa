/**
 * RIVET - Canonical state serialization and hashing
 *
 * Rules:
 * 1. UTF-8 encoding
 * 2. No whitespace
 * 3. Object keys sorted lexicographically (byte order)
 * 4. Arrays preserve order
 * 5. Numbers: integers only (no floats in authoritative state)
 * 6. No null for absent fields (omit instead)
 * 7. All IDs are strings
 */

import stringify from 'fast-json-stable-stringify';
import { createHash } from 'crypto';
import type {
  WorldState,
  EntityRecord,
  EventIdFields,
  Attribution,
  PackDescriptor,
} from '../types/core.js';

/**
 * Encode an object to canonical JSON string
 *
 * - Keys are sorted lexicographically
 * - No whitespace
 * - UTF-8 encoded
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
 * Compute the state hash for a WorldState
 *
 * Returns sha256(canonicalJson(state)) as lowercase hex
 */
export function computeStateHash(state: WorldState): string {
  return sha256(canonicalJson(state));
}

/**
 * Normalize attribution arrays by sorting them
 */
function normalizeAttribution(attr: Attribution): Attribution {
  const normalized: Attribution = {};

  if (attr.actorNpcIds) {
    normalized.actorNpcIds = [...attr.actorNpcIds].sort();
  }
  if (attr.placeIds) {
    normalized.placeIds = [...attr.placeIds].sort();
  }
  if (attr.targetNpcIds) {
    normalized.targetNpcIds = [...attr.targetNpcIds].sort();
  }
  if (attr.targetEntityIds) {
    normalized.targetEntityIds = [...attr.targetEntityIds].sort();
  }
  if (attr.jobId !== undefined) {
    normalized.jobId = attr.jobId;
  }
  if (attr.severity !== undefined) {
    normalized.severity = attr.severity;
  }
  if (attr.reasonKey !== undefined) {
    normalized.reasonKey = attr.reasonKey;
  }

  return normalized;
}

/**
 * Compute deterministic event ID from event fields
 *
 * Normalizes attribution arrays before hashing
 */
export function computeEventId(fields: EventIdFields): string {
  const normalizedFields = {
    worldId: fields.worldId,
    tickIndex: fields.tickIndex,
    ordinal: fields.ordinal,
    type: fields.type,
    payload: fields.payload,
    causedBy: fields.causedBy,
    attribution: normalizeAttribution(fields.attribution),
  };

  return sha256(canonicalJson(normalizedFields));
}

/**
 * Compute world rules digest from kernel version and pack descriptors
 *
 * Returns sha256({kernelVersion, worldTemplatePack, rulesPackSet})
 */
export function computeWorldRulesDigest(
  kernelVersion: string,
  worldTemplatePack: PackDescriptor,
  rulesPackSet: PackDescriptor[]
): string {
  const data = {
    kernelVersion,
    worldTemplatePack,
    rulesPackSet,
  };

  return sha256(canonicalJson(data));
}

/**
 * Get entities from state sorted by EntityId lexicographically
 */
export function getEntitiesSorted(state: WorldState): EntityRecord[] {
  const ids = Object.keys(state.entities).sort();
  const entities: EntityRecord[] = [];
  for (const id of ids) {
    const entity = state.entities[id];
    if (entity !== undefined) {
      entities.push(entity);
    }
  }
  return entities;
}

/**
 * Stable sort with tie-breaker
 *
 * @param arr - Array to sort
 * @param primary - Primary comparison function
 * @param tieBreaker - Tie-breaker comparison function
 */
export function stableSort<T>(
  arr: T[],
  primary: (a: T, b: T) => number,
  tieBreaker: (a: T, b: T) => number
): T[] {
  return [...arr].sort((a, b) => primary(a, b) || tieBreaker(a, b));
}
