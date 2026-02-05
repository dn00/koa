/**
 * RIVET Kernel - Core tick execution engine
 *
 * The kernel is the deterministic core of the simulation.
 * It executes a single tick step, coordinating:
 * 1. Command validation and translation to events
 * 2. System execution (propose events only)
 * 3. Event validation
 * 4. Reducer application (state mutation)
 * 5. Hash computation
 */

import type {
  WorldEnvelope,
  WorldState,
  PlayerCommand,
  SimEvent,
  EventType,
  Cause,
  Attribution,
  EntityRecord,
  EntityType,
  EntityId,
  RNGState,
} from '../types/core.js';
import { computeStateHash, computeEventId, canonicalJson, sha256 } from './canonical.js';
import { computeBatchHash, computeNextLastEventHash } from './hash-chain.js';
import { createRng, restoreRng, RNG } from './rng.js';
import { dayIndexFromTick } from '../types/core.js';

// === KERNEL STEP INPUT ===
export interface KernelStepInput {
  envelope: WorldEnvelope;
  commands: PlayerCommand[];
  maxEvents: number;
}

// === KERNEL STEP OUTPUT ===
export interface KernelStepOutput {
  envelopeNext: WorldEnvelope;
  events: SimEvent[];
  diffs: ProjectionDiff[];
  batchHash: string;
}

export interface ProjectionDiff {
  entityId: string;
  componentKey: string;
  before: unknown;
  after: unknown;
}

// === COMMAND VALIDATION ===
export interface CommandValidationResult {
  valid: boolean;
  reason?: string;
}

export type CommandValidator = (
  command: PlayerCommand,
  state: WorldState
) => CommandValidationResult;

// === EVENT VALIDATION ===
export interface EventValidationResult {
  valid: boolean;
  reason?: string;
}

export type EventValidator = (
  type: EventType,
  payload: unknown
) => EventValidationResult;

// === SYSTEM CONTEXT ===
export interface SystemContext {
  readonly state: WorldState;
  readonly tickIndex: number;
  readonly worldId: string;

  proposeEvent(type: EventType, payload: unknown, attribution: Attribution): void;
  rng(streamId: string): RNG;
  getEntitiesByType(type: EntityType): EntityRecord[];
  getEntity(id: EntityId): EntityRecord | undefined;
}

// === REDUCER SIGNATURE ===
export type Reducer = (state: WorldState, event: SimEvent) => void;

// === SYSTEM SIGNATURE ===
export type System = (ctx: SystemContext) => void;

// === SYSTEM DEFINITION ===
export interface SystemDefinition {
  systemId: string;
  priority?: number; // Default 0, lower = runs first
  packOrder?: number; // Default 0, lower = runs first
  run: System;
}

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
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// === SYSTEM REGISTRY (Deterministic ordering + duplicate check) ===
export class SystemRegistry {
  private systems: SystemDefinition[];

  constructor(systems: SystemDefinition[]) {
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

    // Sort systems: priority asc, packOrder asc, systemId asc
    this.systems = [...systems].sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) return priorityA - priorityB;

      const packOrderA = a.packOrder ?? 0;
      const packOrderB = b.packOrder ?? 0;
      if (packOrderA !== packOrderB) return packOrderA - packOrderB;

      return compareStrings(a.systemId, b.systemId);
    });
  }

  getSystems(): SystemDefinition[] {
    return this.systems;
  }
}

// === KERNEL OPTIONS ===
export interface KernelOptions {
  reducers: ReducerRegistry;
  systems: SystemRegistry;
  commandValidator?: CommandValidator;
  eventValidator?: EventValidator;
}

// === KERNEL CLASS ===
export interface Kernel {
  step(input: KernelStepInput): KernelStepOutput;
}

// === PROPOSED EVENT (internal) ===
interface ProposedEvent {
  type: EventType;
  payload: unknown;
  attribution: Attribution;
  causedBy: Cause;
}

/**
 * Create a new Kernel instance
 */
export function createKernel(options: KernelOptions): Kernel {
  const { reducers, systems, commandValidator, eventValidator } = options;

  return {
    step(input: KernelStepInput): KernelStepOutput {
      const { envelope, commands, maxEvents } = input;

      // Deep clone state before any mutation
      const stateCopy = structuredClone(envelope.state);

      // Track proposed events
      const proposedEvents: ProposedEvent[] = [];

      // === PHASE 1: Validate and translate commands to events ===
      for (const command of commands) {
        // Validate command
        if (commandValidator) {
          const result = commandValidator(command, stateCopy);
          if (!result.valid) {
            // Command rejected - skip it
            continue;
          }
        }

        // Translate command to event
        proposedEvents.push({
          type: 'player.command_applied',
          payload: {
            commandId: command.commandId,
            commandType: command.type,
            commandPayload: command.payload,
          },
          attribution: {},
          causedBy: { kind: 'player', commandId: command.commandId },
        });
      }

      // === PHASE 2: Run systems (they propose events) ===
      // Create frozen state view for systems
      const frozenState = deepFreeze(structuredClone(stateCopy));

      // Track RNG states used during this tick
      const rngInstances: Map<string, RNG> = new Map();

      // Run each system with its own context that captures systemId
      for (const systemDef of systems.getSystems()) {
        // Create system context with proper systemId attribution
        const ctx: SystemContext = {
          state: frozenState,
          tickIndex: envelope.tickIndex,
          worldId: envelope.worldId,

          proposeEvent(type: EventType, payload: unknown, attribution: Attribution): void {
            proposedEvents.push({
              type,
              payload,
              attribution,
              causedBy: { kind: 'system', systemId: systemDef.systemId },
            });
          },

          rng(streamId: string): RNG {
            if (rngInstances.has(streamId)) {
              return rngInstances.get(streamId)!;
            }

            // Check if stream exists in state
            const existingState = stateCopy.rngStreams[streamId];
            const rng = existingState
              ? restoreRng(existingState)
              : createRng(envelope.worldId, streamId);

            rngInstances.set(streamId, rng);
            return rng;
          },

          // Sorted entity order by id lexicographically
          // Exclude deleted entities
          getEntitiesByType(type: EntityType): EntityRecord[] {
            return Object.values(frozenState.entities)
              .filter((e) => e.type === type && e.deletedTick === undefined)
              .sort((a, b) => compareStrings(a.id, b.id));
          },

          getEntity(id: EntityId): EntityRecord | undefined {
            const entity = frozenState.entities[id];
            return entity && entity.deletedTick === undefined ? entity : undefined;
          },
        };

        systemDef.run(ctx);
      }

      // === PHASE 3: Check max events cap ===
      if (proposedEvents.length > maxEvents) {
        throw new Error(
          `Max events exceeded: ${proposedEvents.length} > ${maxEvents}`
        );
      }

      // === PHASE 4: Validate all proposed events ===
      if (eventValidator) {
        for (const proposed of proposedEvents) {
          const result = eventValidator(proposed.type, proposed.payload);
          if (!result.valid) {
            throw new Error(
              `Event validation failed: ${proposed.type} - ${result.reason}`
            );
          }
        }
      }

      // === PHASE 5: Build final events with IDs and ordinals ===
      const nextTick = envelope.tickIndex + 1;
      const events: SimEvent[] = [];

      for (let ordinal = 0; ordinal < proposedEvents.length; ordinal++) {
        const proposed = proposedEvents[ordinal]!;

        const eventId = computeEventId({
          worldId: envelope.worldId,
          tickIndex: envelope.tickIndex,
          ordinal,
          type: proposed.type,
          payload: proposed.payload,
          causedBy: proposed.causedBy,
          attribution: proposed.attribution,
        });

        events.push({
          eventId,
          tickIndex: envelope.tickIndex,
          ordinal,
          type: proposed.type,
          payload: proposed.payload,
          causedBy: proposed.causedBy,
          attribution: proposed.attribution,
        });
      }

      // === PHASE 6: Apply reducers ===
      for (const event of events) {
        const reducer = reducers.get(event.type);
        if (reducer) {
          try {
            reducer(stateCopy, event);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            throw new Error(
              `Reducer failed for event ${event.eventId}: ${message}`
            );
          }
        }
      }

      // === PHASE 7: Update RNG states ===
      for (const [streamId, rng] of rngInstances) {
        stateCopy.rngStreams[streamId] = rng.getState();
      }

      // === PHASE 8: Update calendar and favor regen ===
      const ticksPerDay = stateCopy.calendar.ticksPerDay;
      const prevDayIndex = stateCopy.calendar.currentDayIndex;
      const newDayIndex = dayIndexFromTick(nextTick, ticksPerDay);
      stateCopy.calendar.currentDayIndex = newDayIndex;

      // Apply favor regeneration at day boundary
      if (newDayIndex > prevDayIndex) {
        const regen = stateCopy.player.favorRegenPerDay;
        const cap = stateCopy.player.favorCap;
        stateCopy.player.favor = Math.min(cap, stateCopy.player.favor + regen);
      }

      // === PHASE 9: Compute hashes ===
      const newStateHash = computeStateHash(stateCopy);
      const batchHash = computeBatchHash(events);
      const newLastEventHash = computeNextLastEventHash(
        envelope.lastEventHash,
        batchHash
      );

      // === PHASE 10: Build output envelope ===
      const envelopeNext: WorldEnvelope = {
        ...envelope,
        tickIndex: nextTick,
        stateHash: newStateHash,
        lastEventHash: newLastEventHash,
        state: stateCopy,
      };

      return {
        envelopeNext,
        events,
        diffs: [], // TODO: Implement diff computation
        batchHash,
      };
    },
  };
}

/**
 * Deep freeze an object and all nested objects
 */
function deepFreeze<T>(obj: T): T {
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

// Re-export types for consumers
export type {
  WorldEnvelope,
  WorldState,
  PlayerCommand,
  SimEvent,
  EventType,
  Cause,
  Attribution,
  EntityRecord,
  EntityType,
  EntityId,
};
