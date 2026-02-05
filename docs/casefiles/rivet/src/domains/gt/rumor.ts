/**
 * Rumor Ecology System
 */

import type { WorldState, SimEvent, EntityId } from './types/index.js';
import type { SystemContext, Reducer } from './kernel.js';
import { ReducerRegistry } from './kernel.js';
import { EVENT_TYPES, dayIndexFromTick } from './types/index.js';
import type { PlaceGraphComponent } from './placegraph.js';

// === RUMOR TYPES ===
export type RumorKind = 'job_done' | 'hardship';

export interface CoreRumorComponent {
  rumorKind: RumorKind;
  originEventId: string;
  originPlaceId: string;
  originNpcId?: string;        // NPC who triggered the rumor (Task 003)
  affectedJobKind?: string;
  intensity: number; // 0-1000
  heardByNpcIds: string[];
}

// === RELATIONSHIP TYPES ===
export interface CoreRelationshipsComponent {
  edges: Record<string, Record<string, number>>; // NpcId -> NpcId -> affinity (0-100)
}

// === EVENT PAYLOADS ===
export interface RumorSpawnedPayload {
  rumorId: string;
  rumorKind: RumorKind;
  originEventId: string;
  originPlaceId: string;
  originNpcId?: string;         // NPC who triggered the rumor (Task 003)
  affectedJobKind?: string;
  intensity: number;
}

export interface RumorSpreadPayload {
  rumorId: string;
  toNpcId: string;
  newIntensity: number;
  mutated: boolean;
  newRumorKind?: RumorKind;
}

export interface RumorDecayedPayload {
  rumorId: string;
}

export interface RelationshipChangedPayload {
  npcA: string;           // First NPC in the pair
  npcB: string;           // Second NPC in the pair
  oldAffinity: number;    // Previous affinity value
  newAffinity: number;    // New affinity value (clamped 0-100)
  reason: RelationshipChangeReason;
}

export type RelationshipChangeReason =
  | 'proximity'           // NPCs at same place
  | 'rumor_positive'      // job_done rumor effect
  | 'rumor_negative'      // hardship rumor effect
  | 'decay';              // Natural decay toward 50

// === RELATIONSHIP FUNCTIONS ===

const DEFAULT_AFFINITY = 50;

export function initializeRelationships(npcIds: string[]): CoreRelationshipsComponent {
  const edges: Record<string, Record<string, number>> = {};
  const sortedIds = [...npcIds].sort();

  for (const npcA of sortedIds) {
    edges[npcA] = {};
    for (const npcB of sortedIds) {
      if (npcA !== npcB) {
        edges[npcA][npcB] = DEFAULT_AFFINITY;
      }
    }
  }
  return { edges };
}

export function getAffinity(
  relationships: CoreRelationshipsComponent,
  npcA: string,
  npcB: string
): number {
  return relationships.edges[npcA]?.[npcB] ?? 0;
}

export function getRelationships(state: WorldState): CoreRelationshipsComponent | null {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return null;
  return worldEntity.components['core.relationships'] as CoreRelationshipsComponent ?? null;
}

export function getNpcsWithAffinityAbove(
  relationships: CoreRelationshipsComponent,
  npcId: string,
  threshold: number
): string[] {
  const npcEdges = relationships.edges[npcId];
  if (!npcEdges) return [];
  return Object.entries(npcEdges)
    .filter(([_, affinity]) => affinity > threshold)
    .map(([targetNpcId]) => targetNpcId)
    .sort();
}

// === TASK 002: RELATIONSHIP REDUCER ===

/**
 * Clamp affinity to valid range 0-100
 */
function clampAffinity(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Register relationship reducers
 */
export function relationshipReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  registry.register(EVENT_TYPES.RELATIONSHIP_CHANGED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as RelationshipChangedPayload;
    const { npcA, npcB, newAffinity } = payload;

    // Skip self-relationships
    if (npcA === npcB) return;

    const worldEntity = state.entities['world'];
    if (!worldEntity) return;

    const relationships = worldEntity.components['core.relationships'] as CoreRelationshipsComponent | undefined;
    if (!relationships) return;

    const clampedAffinity = clampAffinity(newAffinity);

    // Update both directions (symmetric)
    // A -> B
    if (!relationships.edges[npcA]) relationships.edges[npcA] = {};
    relationships.edges[npcA][npcB] = clampedAffinity;

    // B -> A
    if (!relationships.edges[npcB]) relationships.edges[npcB] = {};
    relationships.edges[npcB][npcA] = clampedAffinity;
  });

  return registry;
}

// === TASK 003: RUMOR-RELATIONSHIP SYSTEM ===

// Constants for rumor relationship effects
const RUMOR_POSITIVE_AFFINITY_DELTA = 5;  // job_done: +5 affinity
const RUMOR_NEGATIVE_AFFINITY_DELTA = -8; // hardship: -8 affinity

/**
 * Calculate affinity change from rumor spread
 * Scales with intensity (0-1000 -> 0-100%)
 */
export function calculateRumorAffinityDelta(
  rumorKind: RumorKind,
  intensity: number
): number {
  const scale = intensity / 1000;
  const baseDelta = rumorKind === 'job_done'
    ? RUMOR_POSITIVE_AFFINITY_DELTA
    : RUMOR_NEGATIVE_AFFINITY_DELTA;
  const result = Math.round(baseDelta * scale);
  // Ensure we return +0 instead of -0 for zero values
  return result === 0 ? 0 : result;
}

/**
 * Relationship rumor effect system - processes RUMOR_SPREAD events
 *
 * Runs after rumorPropagationSystem. For each RUMOR_SPREAD event,
 * proposes a RELATIONSHIP_CHANGED event between the spreader and origin NPC.
 *
 * @param ctx - System context
 * @param previousTickEvents - Events from the previous tick (includes RUMOR_SPREAD)
 */
export function relationshipRumorEffectSystem(
  ctx: SystemContext,
  previousTickEvents: SimEvent[]
): void {
  const relationships = getRelationships(ctx.state);
  if (!relationships) return;

  // Filter for RUMOR_SPREAD events
  const spreadEvents = previousTickEvents.filter(e => e.type === EVENT_TYPES.RUMOR_SPREAD);

  for (const event of spreadEvents) {
    const payload = event.payload as RumorSpreadPayload;
    const rumorEntity = ctx.getEntity(payload.rumorId);
    if (!rumorEntity) continue;

    const rumorComp = rumorEntity.components['core.rumor'] as CoreRumorComponent;
    if (!rumorComp?.originNpcId) continue; // No origin NPC to affect relationship with

    const spreadToNpcId = payload.toNpcId;
    const originNpcId = rumorComp.originNpcId;

    // Don't change self-relationship
    if (originNpcId === spreadToNpcId) continue;

    const currentAffinity = getAffinity(relationships, spreadToNpcId, originNpcId);
    const delta = calculateRumorAffinityDelta(rumorComp.rumorKind, rumorComp.intensity);

    // EC-3: Skip when delta is 0 (e.g., intensity 0)
    if (delta === 0) continue;

    const newAffinity = currentAffinity + delta;

    const reason: RelationshipChangeReason = rumorComp.rumorKind === 'job_done'
      ? 'rumor_positive'
      : 'rumor_negative';

    ctx.proposeEvent(EVENT_TYPES.RELATIONSHIP_CHANGED, {
      npcA: spreadToNpcId,
      npcB: originNpcId,
      oldAffinity: currentAffinity,
      newAffinity,
      reason,
    } satisfies RelationshipChangedPayload, {});
  }
}

// === TASK 004: PROXIMITY-RELATIONSHIP SYSTEM ===

// Constants for proximity effects
export const PROXIMITY_AFFINITY_GAIN = 2;    // +2 per day at same place
export const AFFINITY_DECAY_RATE = 1;        // -1 toward 50 per day for non-interacting
export const NEUTRAL_AFFINITY = 50;

/**
 * Proximity and decay system - runs at day boundary
 *
 * 1. NPCs at the same place gain affinity
 * 2. All relationships decay slightly toward neutral (50)
 *
 * @param ctx - System context
 * @param prevDayIndex - Previous day index for boundary detection
 */
export function relationshipProximitySystem(
  ctx: SystemContext,
  prevDayIndex: number
): void {
  const ticksPerDay = ctx.state.calendar.ticksPerDay;
  const currentDayIndex = dayIndexFromTick(ctx.tickIndex, ticksPerDay);

  // Only run at day boundary
  if (currentDayIndex === prevDayIndex) return;

  const relationships = getRelationships(ctx.state);
  if (!relationships) return;

  const npcs = ctx.getEntitiesByType('npc');
  if (npcs.length < 2) return;

  // Group NPCs by location
  const npcsByPlace = new Map<string, string[]>();
  for (const npc of npcs) {
    if (npc.deletedTick !== undefined) continue;
    const loc = npc.components['core.location'] as { placeId: string } | undefined;
    if (!loc?.placeId) continue;

    const list = npcsByPlace.get(loc.placeId) ?? [];
    list.push(npc.id);
    npcsByPlace.set(loc.placeId, list);
  }

  // Track which pairs interacted (for decay exemption)
  const interactedPairs = new Set<string>();

  // Proximity gains: NPCs at same place
  for (const [_placeId, npcIds] of npcsByPlace) {
    if (npcIds.length < 2) continue;

    // Sort for determinism
    const sortedIds = [...npcIds].sort();

    for (let i = 0; i < sortedIds.length; i++) {
      for (let j = i + 1; j < sortedIds.length; j++) {
        const npcA = sortedIds[i]!;
        const npcB = sortedIds[j]!;

        const pairKey = `${npcA}|${npcB}`;
        interactedPairs.add(pairKey);

        const currentAffinity = getAffinity(relationships, npcA, npcB);
        const newAffinity = currentAffinity + PROXIMITY_AFFINITY_GAIN;

        ctx.proposeEvent(EVENT_TYPES.RELATIONSHIP_CHANGED, {
          npcA,
          npcB,
          oldAffinity: currentAffinity,
          newAffinity,
          reason: 'proximity',
        } satisfies RelationshipChangedPayload, {});
      }
    }
  }

  // Decay: all pairs that didn't interact decay toward neutral
  const allNpcIds = npcs
    .filter(n => n.deletedTick === undefined)
    .map(n => n.id)
    .sort();

  for (let i = 0; i < allNpcIds.length; i++) {
    for (let j = i + 1; j < allNpcIds.length; j++) {
      const npcA = allNpcIds[i]!;
      const npcB = allNpcIds[j]!;

      const pairKey = `${npcA}|${npcB}`;
      if (interactedPairs.has(pairKey)) continue; // Skip pairs that interacted

      const currentAffinity = getAffinity(relationships, npcA, npcB);
      if (currentAffinity === NEUTRAL_AFFINITY) continue; // Already neutral

      // Decay toward neutral
      let newAffinity: number;
      if (currentAffinity > NEUTRAL_AFFINITY) {
        newAffinity = Math.max(NEUTRAL_AFFINITY, currentAffinity - AFFINITY_DECAY_RATE);
      } else {
        newAffinity = Math.min(NEUTRAL_AFFINITY, currentAffinity + AFFINITY_DECAY_RATE);
      }

      if (newAffinity !== currentAffinity) {
        ctx.proposeEvent(EVENT_TYPES.RELATIONSHIP_CHANGED, {
          npcA,
          npcB,
          oldAffinity: currentAffinity,
          newAffinity,
          reason: 'decay',
        } satisfies RelationshipChangedPayload, {});
      }
    }
  }
}

// === RUMOR SPAWNING SYSTEM ===

const INITIAL_RUMOR_INTENSITY = 800;

export function rumorSpawningSystem(ctx: SystemContext, previousTickEvents: SimEvent[]): void {
  for (const event of previousTickEvents) {
    if (event.type === EVENT_TYPES.JOB_COMPLETED) {
      spawnJobDoneRumor(ctx, event);
    } else if (event.type === EVENT_TYPES.NPC_NEED_CRITICAL) {
      spawnHardshipRumor(ctx, event);
    }
  }
}

function spawnJobDoneRumor(ctx: SystemContext, event: SimEvent): void {
  const payload = event.payload as { jobId: string; npcId: string; templateId?: string };
  const npc = ctx.getEntity(payload.npcId);
  const location = npc?.components['core.location'] as { placeId: string } | undefined;
  const placeId = location?.placeId ?? 'unknown';
  const jobKind = payload.templateId?.split('.')[1] ?? 'unknown';
  const rumorId = `rumor.${ctx.tickIndex}.${event.eventId.slice(0, 8)}`;

  ctx.proposeEvent(EVENT_TYPES.RUMOR_SPAWNED, {
    rumorId,
    rumorKind: 'job_done',
    originEventId: event.eventId,
    originPlaceId: placeId,
    originNpcId: payload.npcId,  // Task 003: Set origin NPC
    affectedJobKind: jobKind,
    intensity: INITIAL_RUMOR_INTENSITY,
  } satisfies RumorSpawnedPayload, {});
}

function spawnHardshipRumor(ctx: SystemContext, event: SimEvent): void {
  const payload = event.payload as { npcId: string; needId: string };
  const npc = ctx.getEntity(payload.npcId);
  const location = npc?.components['core.location'] as { placeId: string } | undefined;
  const placeId = location?.placeId ?? 'unknown';
  const rumorId = `rumor.${ctx.tickIndex}.${event.eventId.slice(0, 8)}`;

  ctx.proposeEvent(EVENT_TYPES.RUMOR_SPAWNED, {
    rumorId,
    rumorKind: 'hardship',
    originEventId: event.eventId,
    originPlaceId: placeId,
    originNpcId: payload.npcId,  // Task 003: Set origin NPC
    intensity: INITIAL_RUMOR_INTENSITY,
  } satisfies RumorSpawnedPayload, {});
}

// === RUMOR PROPAGATION SYSTEM ===

const SPREAD_INTENSITY_LOSS = 100;
const SPREAD_AFFINITY_THRESHOLD = 30;
const MUTATION_CHANCE = 0.2; // 20%

/**
 * Rumor propagation system - runs each tick
 *
 * For each active rumor:
 * 1. Find eligible NPCs (adjacent place OR social tie with affinity > 30)
 * 2. Pick one at random using 'rumors' RNG stream
 * 3. Spread to that NPC (reduce intensity, maybe mutate)
 */
export function rumorPropagationSystem(ctx: SystemContext): void {
  const rng = ctx.rng('rumors');
  const relationships = getRelationships(ctx.state);
  const rumors = ctx.getEntitiesByType('rumor');

  // Sort for determinism
  const sortedRumors = [...rumors].sort((a, b) => a.id.localeCompare(b.id));

  for (const rumor of sortedRumors) {
    if (rumor.deletedTick !== undefined) continue; // Skip tombstoned

    const rumorComp = rumor.components['core.rumor'] as CoreRumorComponent;
    if (rumorComp.intensity < SPREAD_INTENSITY_LOSS) continue; // Too weak to spread

    const eligibleNpcs = findEligibleNpcs(ctx, rumorComp, relationships);
    if (eligibleNpcs.length === 0) continue;

    // Pick random eligible NPC (deterministic via RNG stream)
    const targetIndex = rng.nextInt(eligibleNpcs.length);
    const targetNpcId = eligibleNpcs[targetIndex]!;

    // Determine mutation (20% chance) - convert bigint to [0,1) float
    const mutationRoll = Number(rng.next() % 1000n) / 1000;
    const mutated = mutationRoll < MUTATION_CHANCE;
    const newRumorKind = mutated
      ? (rumorComp.rumorKind === 'job_done' ? 'hardship' : 'job_done')
      : rumorComp.rumorKind;

    const spreadPayload: RumorSpreadPayload = {
      rumorId: rumor.id,
      toNpcId: targetNpcId,
      newIntensity: rumorComp.intensity - SPREAD_INTENSITY_LOSS,
      mutated,
    };
    if (mutated) {
      spreadPayload.newRumorKind = newRumorKind;
    }
    ctx.proposeEvent(EVENT_TYPES.RUMOR_SPREAD, spreadPayload, {});
  }
}

export function findEligibleNpcs(
  ctx: SystemContext,
  rumorComp: CoreRumorComponent,
  relationships: CoreRelationshipsComponent | null
): string[] {
  const eligible: string[] = [];
  const alreadyHeard = new Set(rumorComp.heardByNpcIds);

  // Get places where rumor is known (origin + all hearers' locations)
  const knownPlaces = new Set<string>();
  knownPlaces.add(rumorComp.originPlaceId);
  for (const npcId of rumorComp.heardByNpcIds) {
    const npc = ctx.getEntity(npcId);
    const loc = npc?.components['core.location'] as { placeId: string } | undefined;
    if (loc) knownPlaces.add(loc.placeId);
  }

  // Get adjacent places from place graph
  const worldEntity = ctx.getEntity('world');
  const placeGraph = worldEntity?.components['core.placegraph'] as PlaceGraphComponent | undefined;
  const adjacentPlaces = new Set<string>();
  if (placeGraph?.edges) {
    for (const place of knownPlaces) {
      for (const edge of placeGraph.edges) {
        if (edge.fromPlaceId === place) adjacentPlaces.add(edge.toPlaceId);
        if (edge.toPlaceId === place) adjacentPlaces.add(edge.fromPlaceId);
      }
    }
  }

  // Check all NPCs for eligibility
  const npcs = ctx.getEntitiesByType('npc');
  for (const npc of npcs) {
    if (alreadyHeard.has(npc.id)) continue; // Already heard
    if (npc.deletedTick !== undefined) continue; // Deleted

    const loc = npc.components['core.location'] as { placeId: string } | undefined;
    const npcPlace = loc?.placeId;

    // Spatial eligibility: NPC at adjacent place
    if (npcPlace && adjacentPlaces.has(npcPlace)) {
      eligible.push(npc.id);
      continue;
    }

    // Social eligibility: affinity > threshold with any NPC who has heard
    if (relationships) {
      for (const heardNpcId of rumorComp.heardByNpcIds) {
        const affinity = getAffinity(relationships, npc.id, heardNpcId);
        if (affinity > SPREAD_AFFINITY_THRESHOLD) {
          eligible.push(npc.id);
          break; // Only add once
        }
      }
    }
  }

  // Sort for determinism
  eligible.sort();
  return eligible;
}

// === RUMOR EFFECTS ON INTENT ===

export interface RumorModifiers {
  jobKindBonus: Record<string, number>; // jobKind -> positive bonus
  placePenalty: Record<string, number>; // placeId -> negative penalty
}

const BASE_JOB_DONE_BONUS = 200;
const BASE_HARDSHIP_PENALTY = -400;

/**
 * Compute rumor-based modifiers for an NPC's intent scoring
 *
 * job_done rumors: +50 to matching job kinds (scaled by intensity)
 * hardship rumors: -100 to jobs at origin place (scaled by intensity)
 */
export function getRumorModifiers(state: WorldState, npcId: string): RumorModifiers {
  const jobKindBonus: Record<string, number> = {};
  const placePenalty: Record<string, number> = {};

  // Iterate entities deterministically
  const entityIds = Object.keys(state.entities).sort();

  for (const entityId of entityIds) {
    const entity = state.entities[entityId];
    if (!entity) continue;
    if (entity.type !== 'rumor') continue;
    if (entity.deletedTick !== undefined) continue;

    const comp = entity.components['core.rumor'] as CoreRumorComponent;
    if (!comp.heardByNpcIds.includes(npcId)) continue;

    // Scale effect by intensity (0-1000 -> 0-1)
    const intensityScale = comp.intensity / 1000;

    if (comp.rumorKind === 'job_done' && comp.affectedJobKind) {
      const bonus = Math.round(BASE_JOB_DONE_BONUS * intensityScale);
      jobKindBonus[comp.affectedJobKind] = (jobKindBonus[comp.affectedJobKind] ?? 0) + bonus;
    } else if (comp.rumorKind === 'hardship') {
      const penalty = Math.round(BASE_HARDSHIP_PENALTY * intensityScale);
      placePenalty[comp.originPlaceId] = (placePenalty[comp.originPlaceId] ?? 0) + penalty;
    }
  }

  return { jobKindBonus, placePenalty };
}

// === RUMOR DECAY SYSTEM ===

const DECAY_INTENSITY_THRESHOLD = 100;

/**
 * Rumor decay system - runs at day boundaries
 *
 * Tombstones rumors with intensity < 100 by proposing RUMOR_DECAYED events.
 * Must be called with prevDayIndex to detect day boundary.
 */
export function rumorDecaySystem(ctx: SystemContext, prevDayIndex: number): void {
  const ticksPerDay = ctx.state.calendar.ticksPerDay;
  const currentDayIndex = dayIndexFromTick(ctx.tickIndex, ticksPerDay);

  // Only run at day boundary
  if (currentDayIndex === prevDayIndex) return;

  const rumors = ctx.getEntitiesByType('rumor');

  // Sort for determinism
  const sortedRumors = [...rumors].sort((a, b) => a.id.localeCompare(b.id));

  for (const rumor of sortedRumors) {
    if (rumor.deletedTick !== undefined) continue; // Already tombstoned

    const comp = rumor.components['core.rumor'] as CoreRumorComponent;
    if (comp.intensity < DECAY_INTENSITY_THRESHOLD) {
      ctx.proposeEvent(EVENT_TYPES.RUMOR_DECAYED, {
        rumorId: rumor.id,
      } satisfies RumorDecayedPayload, {});
    }
  }
}

// === REDUCERS ===

export function rumorReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  // RUMOR_SPAWNED - create rumor entity
  registry.register(EVENT_TYPES.RUMOR_SPAWNED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as RumorSpawnedPayload;
    const rumorComponent: CoreRumorComponent = {
      rumorKind: payload.rumorKind,
      originEventId: payload.originEventId,
      originPlaceId: payload.originPlaceId,
      intensity: payload.intensity,
      heardByNpcIds: [],
    };
    if (payload.originNpcId !== undefined) {
      rumorComponent.originNpcId = payload.originNpcId;  // Task 003: Store origin NPC
    }
    if (payload.affectedJobKind !== undefined) {
      rumorComponent.affectedJobKind = payload.affectedJobKind;
    }
    state.entities[payload.rumorId] = {
      id: payload.rumorId,
      type: 'rumor',
      createdTick: event.tickIndex,
      components: {
        'core.rumor': rumorComponent,
      },
    };
  });

  // RUMOR_SPREAD - update rumor entity
  registry.register(EVENT_TYPES.RUMOR_SPREAD, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as RumorSpreadPayload;
    const rumor = state.entities[payload.rumorId];
    if (!rumor) return;

    const comp = rumor.components['core.rumor'] as CoreRumorComponent;
    comp.intensity = payload.newIntensity;
    comp.heardByNpcIds.push(payload.toNpcId);
    if (payload.mutated && payload.newRumorKind) {
      comp.rumorKind = payload.newRumorKind;
    }
  });

  // RUMOR_DECAYED - tombstone rumor entity
  registry.register(EVENT_TYPES.RUMOR_DECAYED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as RumorDecayedPayload;
    const rumor = state.entities[payload.rumorId];
    if (!rumor) return;
    rumor.deletedTick = event.tickIndex;
  });

  return registry;
}
