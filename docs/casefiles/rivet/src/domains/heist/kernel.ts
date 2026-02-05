/**
 * Heist Kernel - Core Kernel Harness
 *
 * Minimal kernel infrastructure following packages/kernel patterns.
 */

import type {
  HeistState,
  Entity,
  EntityId,
  EntityType,
  TickIndex,
  RuntimeConfig,
} from './types.js';
import type { HeistEventType } from './events.js';
import type { RNG } from './rng.js';

// === ATTRIBUTION ===

export interface Attribution {
  /** Entity IDs that caused this event (sorted) */
  actorIds?: string[];
  /** Entity IDs affected by this event (sorted) */
  targetIds?: string[];
  /** Tile position where event occurred */
  tilePos?: { x: number; y: number };
  /** Related rule ID if triggered by directive card */
  ruleId?: string;
  /** Severity for detection events (0-100) */
  severity?: number;
  /** Human-readable reason key */
  reasonKey?: string;
  /** Allow arbitrary fields for backwards compatibility */
  [key: string]: unknown;
}

// === CAUSE ===

export type Cause =
  | { kind: 'system'; systemId: string; note?: string }
  | { kind: 'player'; commandId: string; actionId?: string }
  | { kind: 'rule'; ruleId: string; note?: string }
  | { kind: 'scheduled'; scheduleId: string; note?: string }
  | { kind: 'world'; note?: string }
  | { kind: 'migration'; migrationId: string };

// === SIM EVENT ===

export interface SimEvent {
  eventId: string;
  tickIndex: TickIndex;
  ordinal: number;
  type: HeistEventType;
  payload: unknown;
  causedBy: Cause;
  attribution: Attribution;
}

// === SYSTEM CONTEXT ===

export interface SystemContext {
  readonly state: HeistState;
  readonly tickIndex: TickIndex;
  readonly worldId: string;
  /** Immutable config (from pack merged with defaults) */
  readonly config: Readonly<RuntimeConfig>;

  proposeEvent(type: HeistEventType, payload: unknown, attribution: Attribution, cause?: Cause): void;
  rng(streamId: string): RNG;
  getEntitiesByType(type: EntityType): Entity[];
  getEntity(id: EntityId): Entity | undefined;
}

// === SYSTEM DEFINITION ===

export interface SystemDefinition {
  systemId: string;
  priority?: number; // Default 0, lower = runs first
  run: (ctx: SystemContext) => void;
}

// === REDUCER ===

export type Reducer = (state: HeistState, event: SimEvent) => void;

// === REDUCER REGISTRY ===

export class ReducerRegistry {
  private reducers: Map<string, Reducer> = new Map();

  register(eventType: string, reducer: Reducer): void {
    this.reducers.set(eventType, reducer);
  }

  get(eventType: string): Reducer | undefined {
    return this.reducers.get(eventType);
  }

  has(eventType: string): boolean {
    return this.reducers.has(eventType);
  }

  getAll(): Map<string, Reducer> {
    return new Map(this.reducers);
  }
}

// === SYSTEM REGISTRY ===

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class SystemRegistry {
  private systems: SystemDefinition[];

  constructor(systems: SystemDefinition[] = []) {
    // Validate all systems have systemId
    for (const system of systems) {
      if (!system.systemId) {
        throw new Error('SystemId required');
      }
    }

    // Check for duplicate systemIds
    const seenIds = new Set<string>();
    for (const system of systems) {
      if (seenIds.has(system.systemId)) {
        throw new Error(`Duplicate systemId: ${system.systemId}`);
      }
      seenIds.add(system.systemId);
    }

    // Sort systems: priority asc, then systemId asc for stability
    this.systems = [...systems].sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return compareStrings(a.systemId, b.systemId);
    });
  }

  getSystems(): SystemDefinition[] {
    return this.systems;
  }

  register(system: SystemDefinition): void {
    if (!system.systemId) {
      throw new Error('SystemId required');
    }

    if (this.systems.some((s) => s.systemId === system.systemId)) {
      throw new Error(`Duplicate systemId: ${system.systemId}`);
    }

    this.systems.push(system);

    // Re-sort after adding
    this.systems.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return compareStrings(a.systemId, b.systemId);
    });
  }
}

// === DEEP FREEZE ===

export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  Object.freeze(obj);

  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}
