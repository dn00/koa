/**
 * RIVET - Core type definitions
 *
 * Adapt this file for your game's state shape.
 * The patterns here are stable - the specific types are examples.
 */

// === CORE PRIMITIVES ===
export type WorldId = string; // UUID
export type TickIndex = number; // monotonic integer
export type EntityId = string; // stable id
export type EventId = string; // sha256 hash

// === PACK DESCRIPTOR ===
export interface PackDescriptor {
  packId: string; // e.g. "pack.core.starter_rules.v1"
  version: string; // semver
  contentHash: string; // sha256 of pack bundle
  order: number; // deterministic ordering
}

// === WORLD ENVELOPE ===
export interface WorldEnvelope {
  worldId: WorldId;
  kernelVersion: string;
  worldTemplatePack: PackDescriptor;
  rulesPackSet: PackDescriptor[];
  worldRulesDigest: string; // sha256({kernelVersion, worldTemplatePack, rulesPackSet})
  tickIndex: TickIndex;
  stateHash: string; // sha256(canonical_json(state))
  lastEventHash: string; // hash chain tip
  state: WorldState;
}

// === WORLD STATE ===
// Adapt this for your game
export interface WorldState {
  rngStreams: Record<string, RNGState>;
  calendar: CalendarState;
  entities: Record<EntityId, EntityRecord>;
  player: PlayerState;
}

export interface CalendarState {
  ticksPerDay: number; // e.g., 24
  currentDayIndex: number; // derived: floor(tickIndex / ticksPerDay)
}

export interface PlayerState {
  favor: number; // 0..favorCap
  favorCap: number;
  favorRegenPerDay: number;
}

// === RNG STATE (xoroshiro128**) ===
export interface RNGState {
  algo: 'xoroshiro128**';
  s0: string; // uint64 as hex string (16 chars)
  s1: string; // uint64 as hex string (16 chars)
}

// === ENTITY RECORD ===
// Extend EntityType for your game
export type EntityType = 'npc' | 'job' | 'place' | 'world' | 'rumor' | string;

export interface EntityRecord {
  id: EntityId;
  type: EntityType;
  createdTick: number;
  deletedTick?: number; // tombstone
  components: Record<string, unknown>; // namespaced components
}

// === EVENT TYPE REGISTRY ===
// Define your game's event types here
export const EVENT_TYPES = {
  // Player events
  COMMAND_APPLIED: 'player.command_applied',

  // NPC events (example from GT)
  NPC_TRAVEL_STARTED: 'core.npc.travel_started',
  NPC_ARRIVED: 'core.npc.arrived',
  NPC_NEED_CRITICAL: 'core.npc.need_critical',
  NPC_ATE: 'core.npc.ate',
  NPC_SLEPT: 'core.npc.slept',
  NPC_INTENT_SET: 'core.npc.intent_set',
  NPC_SPAWNED: 'core.npc.spawned',

  // Job events
  JOB_CREATED: 'core.job.created',
  JOB_CLAIMED: 'core.job.claimed',
  JOB_PROGRESSED: 'core.job.progressed',
  JOB_COMPLETED: 'core.job.completed',
  JOB_CANCELLED: 'core.job.cancelled',

  // Economy events
  STOCKPILE_DELTA: 'core.stockpile.delta',
  STOCKPILE_INITIALIZED: 'core.stockpile.initialized',

  // Player command events
  EDICT_ISSUED: 'core.edict.issued',
  EDICT_EXPIRED: 'core.edict.expired',
  FAVOR_CHANGED: 'core.player.favor_changed',

  // Ambition events
  AMBITION_SELECTED: 'core.ambition.selected',
  AMBITION_PROGRESSED: 'core.ambition.progressed',
  AMBITION_COMPLETED: 'core.ambition.completed',

  // World events
  PLACE_CREATED: 'core.place.created',

  // Rumor events
  RUMOR_SPAWNED: 'core.rumor.spawned',
  RUMOR_SPREAD: 'core.rumor.spread',
  RUMOR_DECAYED: 'core.rumor.decayed',
  RELATIONSHIP_CHANGED: 'core.relationship.changed',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES] | string;

// === DAY BOUNDARY UTILITIES ===
export const TICKS_PER_DAY = 24; // Default value only

/**
 * Compute day index from tick index
 *
 * @param tickIndex - The tick index
 * @param ticksPerDay - Ticks per day from state.calendar (defaults to 24)
 * @returns Day index (0-based)
 */
export function dayIndexFromTick(tickIndex: TickIndex, ticksPerDay?: number): number {
  const tpd = ticksPerDay ?? TICKS_PER_DAY;
  return Math.floor(tickIndex / tpd);
}

/**
 * Check if a day boundary was crossed between two ticks
 *
 * @param prevTick - Previous tick index
 * @param nextTick - Next tick index
 * @param ticksPerDay - Ticks per day from state.calendar (defaults to 24)
 * @returns True if day boundary was crossed
 */
export function isDayBoundary(prevTick: TickIndex, nextTick: TickIndex, ticksPerDay?: number): boolean {
  return dayIndexFromTick(prevTick, ticksPerDay) !== dayIndexFromTick(nextTick, ticksPerDay);
}

// === EVENT STRUCTURE ===
export interface SimEvent {
  eventId: EventId;
  tickIndex: TickIndex;
  ordinal: number; // 0..K within tick
  type: EventType;
  payload: unknown;
  causedBy: Cause;
  attribution: Attribution;
}

export type Cause =
  | { kind: 'player'; commandId: string; actionId?: string }
  | { kind: 'system'; systemId: string; note?: string }
  | { kind: 'scheduled'; scheduleId: string; note?: string }
  | { kind: 'world'; note?: string }
  | { kind: 'migration'; migrationId: string };

export interface Attribution {
  actorNpcIds?: string[]; // sorted lex
  placeIds?: string[]; // sorted lex
  targetNpcIds?: string[]; // sorted lex
  targetEntityIds?: string[]; // sorted lex
  jobId?: string;
  severity?: number; // 0..1000
  reasonKey?: string;
}

// === PLAYER COMMAND ===
export type CommandType = 'edict.set' | 'miracle.cast' | 'ambition.set' | 'noop' | string;

export interface PlayerCommand {
  commandId: string;
  type: CommandType;
  payload: unknown;
  issuedAtTick: TickIndex;
}

// === EVENT ID FIELDS (for computing event IDs) ===
export interface EventIdFields {
  worldId: WorldId;
  tickIndex: TickIndex;
  ordinal: number;
  type: EventType;
  payload: unknown;
  causedBy: Cause;
  attribution: Attribution;
}

// === SPATIAL TYPES (for grid-based games) ===
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Convert Vec2 to string key for use in Maps/Sets
 */
export function vecKey(v: Vec2): string {
  return `${v.x},${v.y}`;
}

/**
 * Check if two Vec2 are equal
 */
export function vecEq(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Manhattan distance between two points
 */
export function manhattan(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// === NEED TYPE (example from GT) ===
export type NeedId = 'hunger' | 'sleep';

export const NEED_CONFIG = {
  hunger: { drainPerTick: 3, warningThreshold: 600, criticalThreshold: 850 },
  sleep: { drainPerTick: 2, warningThreshold: 600, criticalThreshold: 850 },
} as const;
