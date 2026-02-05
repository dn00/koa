/**
 * PlaceGraph & World Seed
 *
 * Task 004: PlaceGraph & World Seed
 *
 * Implements:
 * - PlaceGraph data structure (edges stored on "world" entity)
 * - Dijkstra's algorithm for shortest path with deterministic tie-breaks
 * - World seed generation for MVP places and NPCs
 */

import type {
  WorldState,
  EntityRecord,
  EntityType,
  SimEvent,
} from './types/index.js';

// === WORLD SEED TYPES ===
// These types mirror @gt/packs types to avoid circular dependency
// Kernel defines the canonical types; packs re-exports or uses compatible types

export interface PlaceSeed {
  placeId: string;
  kind: string;
  nameKey: string;
  tags: string[];
}

export interface EdgeSeed {
  fromPlaceId: string;
  toPlaceId: string;
  travelCost: number;
  bidirectional: boolean;
}

export interface NpcSeed {
  npcId: string;
  archetypeId: string;
  nameKey: string;
  homePlaceId: string;
  startPlaceId: string;
}

export interface InitialJobSeed {
  templateId: string;
  placeId: string;
}

export interface CalendarSeedData {
  ticksPerDay: number;
}

export interface WorldSeedData {
  places: PlaceSeed[];
  edges: EdgeSeed[];
  npcs: NpcSeed[];
  initialJobs: InitialJobSeed[];
  stockpile: Record<string, number>;
  calendar?: CalendarSeedData; // Task 002: AC-2 - Seed sets ticksPerDay from config
}

// === PLACE COMPONENT ===
export interface CorePlaceComponent {
  placeId: string;
  kind: string;
  nameKey: string;
  tags: string[]; // sorted
}

// === PLACE GRAPH COMPONENT ===
export interface PlaceGraphComponent {
  edges: PlaceEdge[];
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface PlaceEdge {
  fromPlaceId: string;
  toPlaceId: string;
  travelCost: number;
  bidirectional: boolean;
  edgeKind: string;
}

// === NPC CORE COMPONENT ===
export interface CoreNpcComponent {
  npcId: string;
  nameKey: string;
  archetypeId: string;
  tags: string[]; // sorted
  homePlaceId: string;
  spawnedTick: number;
}

// === PATH RESULT ===
export interface PathResult {
  path: string[]; // placeIds from start to end (inclusive)
  totalCost: number;
}

// === SEED RESULT ===
export interface SeedResult {
  state: WorldState;
  genesisEvents: SimEvent[];
}

/**
 * Validate world seed data
 *
 * @throws Error if seed is invalid
 */
export function validateWorldSeed(seed: WorldSeedData): void {
  // Task 002: ERR-1 - Validate ticksPerDay
  if (seed.calendar?.ticksPerDay !== undefined) {
    if (seed.calendar.ticksPerDay <= 0) {
      throw new Error(`Invalid ticksPerDay: ${seed.calendar.ticksPerDay}`);
    }
  }

  // Check for duplicate place IDs
  const placeIds = new Set<string>();
  for (const place of seed.places) {
    if (placeIds.has(place.placeId)) {
      throw new Error(`Duplicate place ID: ${place.placeId}`);
    }
    placeIds.add(place.placeId);
  }

  // Check edges
  for (const edge of seed.edges) {
    // Check for zero travel cost
    if (edge.travelCost < 1) {
      throw new Error(
        `Edge travel cost must be >= 1: ${edge.fromPlaceId} -> ${edge.toPlaceId}`
      );
    }

    // Check for invalid place references
    if (!placeIds.has(edge.fromPlaceId)) {
      throw new Error(
        `Invalid edge: place ${edge.fromPlaceId} does not exist`
      );
    }
    if (!placeIds.has(edge.toPlaceId)) {
      throw new Error(
        `Invalid edge: place ${edge.toPlaceId} does not exist`
      );
    }
  }

  // Check NPC home places
  for (const npc of seed.npcs) {
    if (!placeIds.has(npc.homePlaceId)) {
      throw new Error(
        `Invalid NPC home: place ${npc.homePlaceId} does not exist for NPC ${npc.npcId}`
      );
    }
    if (!placeIds.has(npc.startPlaceId)) {
      throw new Error(
        `Invalid NPC start: place ${npc.startPlaceId} does not exist for NPC ${npc.npcId}`
      );
    }
  }
}

/**
 * Seed a new world from WorldSeedData
 *
 * Creates:
 * - "world" singleton entity with PlaceGraph component
 * - Place entities for each place
 * - NPC entities for each NPC
 *
 * @param seed - World seed data
 * @param worldId - The world's unique ID
 * @param tickIndex - Current tick (usually 0 for genesis)
 * @returns Initial world state and genesis events
 */
export function seedWorld(
  seed: WorldSeedData,
  worldId: string,
  tickIndex: number
): SeedResult {
  // Validate seed first
  validateWorldSeed(seed);

  const entities: Record<string, EntityRecord> = {};
  const genesisEvents: SimEvent[] = [];

  // === Create "world" singleton entity ===
  const worldEntity: EntityRecord = {
    id: 'world',
    type: 'world',
    createdTick: tickIndex,
    components: {},
  };

  // Build PlaceGraph edges
  const edges: PlaceEdge[] = [];
  for (const edge of seed.edges) {
    // Add forward edge
    edges.push({
      fromPlaceId: edge.fromPlaceId,
      toPlaceId: edge.toPlaceId,
      travelCost: edge.travelCost,
      bidirectional: edge.bidirectional,
      edgeKind: 'road',
    });

    // Add reverse edge if bidirectional
    if (edge.bidirectional) {
      edges.push({
        fromPlaceId: edge.toPlaceId,
        toPlaceId: edge.fromPlaceId,
        travelCost: edge.travelCost,
        bidirectional: edge.bidirectional,
        edgeKind: 'road',
      });
    }
  }

  // Sort edges for canonical serialization
  edges.sort((a, b) => {
    const fromCmp = compareStrings(a.fromPlaceId, b.fromPlaceId);
    return fromCmp !== 0 ? fromCmp : compareStrings(a.toPlaceId, b.toPlaceId);
  });

  const placeGraph: PlaceGraphComponent = { edges };
  worldEntity.components['core.placegraph'] = placeGraph;

  entities['world'] = worldEntity;

  // === Create place entities ===
  for (const placeSeed of seed.places) {
    const placeEntity: EntityRecord = {
      id: placeSeed.placeId,
      type: 'place',
      createdTick: tickIndex,
      components: {
        'core.place': {
          placeId: placeSeed.placeId,
          kind: placeSeed.kind,
          nameKey: placeSeed.nameKey,
          tags: [...placeSeed.tags].sort(),
        } as CorePlaceComponent,
      },
    };

    entities[placeSeed.placeId] = placeEntity;

    // Genesis event for place creation
    genesisEvents.push({
      eventId: `genesis-place-${placeSeed.placeId}`,
      tickIndex,
      ordinal: genesisEvents.length,
      type: 'core.place.created',
      payload: {
        placeId: placeSeed.placeId,
        kind: placeSeed.kind,
      },
      causedBy: { kind: 'world', note: 'World seeding' },
      attribution: { placeIds: [placeSeed.placeId] },
    });
  }

  // === Create NPC entities ===
  for (const npcSeed of seed.npcs) {
    const npcEntity: EntityRecord = {
      id: npcSeed.npcId,
      type: 'npc',
      createdTick: tickIndex,
      components: {
        'core.npc': {
          npcId: npcSeed.npcId,
          nameKey: npcSeed.nameKey,
          archetypeId: npcSeed.archetypeId,
          tags: [], // Will be populated from archetype
          homePlaceId: npcSeed.homePlaceId,
          spawnedTick: tickIndex,
        } as CoreNpcComponent,
      },
    };

    entities[npcSeed.npcId] = npcEntity;

    // Genesis event for NPC spawn
    genesisEvents.push({
      eventId: `genesis-npc-${npcSeed.npcId}`,
      tickIndex,
      ordinal: genesisEvents.length,
      type: 'core.npc.spawned',
      payload: {
        npcId: npcSeed.npcId,
        archetypeId: npcSeed.archetypeId,
        homePlaceId: npcSeed.homePlaceId,
      },
      causedBy: { kind: 'world', note: 'World seeding' },
      attribution: {
        actorNpcIds: [npcSeed.npcId],
        placeIds: [npcSeed.homePlaceId],
      },
    });
  }

  // === Build initial WorldState ===
  // Task 002: AC-2 - Seed sets ticksPerDay from config (defaults to 24)
  const ticksPerDay = seed.calendar?.ticksPerDay ?? 24;

  const state: WorldState = {
    rngStreams: {},
    calendar: {
      ticksPerDay,
      currentDayIndex: 0,
    },
    entities,
    player: {
      favor: 60,
      favorCap: 200,
      favorRegenPerDay: 20,
    },
  };

  return {
    state,
    genesisEvents,
  };
}

/**
 * Get neighbors of a place in the graph
 *
 * @param graph - PlaceGraph component
 * @param placeId - The place to find neighbors for
 * @returns Array of {placeId, cost} for each neighbor
 */
export function getNeighbors(
  graph: PlaceGraphComponent,
  placeId: string
): Array<{ placeId: string; cost: number }> {
  const neighbors: Array<{ placeId: string; cost: number }> = [];

  for (const edge of graph.edges) {
    if (edge.fromPlaceId === placeId) {
      neighbors.push({
        placeId: edge.toPlaceId,
        cost: edge.travelCost,
      });
    }
  }

  // Sort for deterministic iteration
  neighbors.sort((a, b) => compareStrings(a.placeId, b.placeId));

  return neighbors;
}

/**
 * Find shortest path between two places using Dijkstra's algorithm
 *
 * Tie-break rule (GK10 section 6.4):
 * 1. shortest cost
 * 2. lexicographically smallest path (by joined placeIds)
 *
 * @param graph - PlaceGraph component
 * @param from - Starting place ID
 * @param to - Destination place ID
 * @returns PathResult or null if no path exists
 */
export function shortestPath(
  graph: PlaceGraphComponent,
  from: string,
  to: string
): PathResult | null {
  // Same source and destination
  if (from === to) {
    return { path: [from], totalCost: 0 };
  }

  // Distance map: placeId -> best cost so far
  const dist: Map<string, number> = new Map();
  // Previous map: placeId -> previous placeId in best path
  const prev: Map<string, string> = new Map();
  // Visited set
  const visited: Set<string> = new Set();

  // Priority queue: [cost, placeId, pathString (for tie-breaking)]
  // Using array and sorting for simplicity (fine for small graphs)
  const queue: Array<{ cost: number; placeId: string; pathStr: string }> = [];

  dist.set(from, 0);
  queue.push({ cost: 0, placeId: from, pathStr: from });

  while (queue.length > 0) {
    // Sort queue by cost, then by pathStr for deterministic tie-breaking
    queue.sort((a, b) => {
      if (a.cost !== b.cost) return a.cost - b.cost;
      return compareStrings(a.pathStr, b.pathStr);
    });

    const current = queue.shift()!;

    if (visited.has(current.placeId)) {
      continue;
    }
    visited.add(current.placeId);

    // Found destination
    if (current.placeId === to) {
      // Reconstruct path
      const path: string[] = [];
      let node: string | undefined = to;
      while (node !== undefined) {
        path.unshift(node);
        node = prev.get(node);
      }

      return { path, totalCost: current.cost };
    }

    // Explore neighbors
    const neighbors = getNeighbors(graph, current.placeId);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor.placeId)) {
        continue;
      }

      const newCost = current.cost + neighbor.cost;
      const existingCost = dist.get(neighbor.placeId);
      const newPathStr = current.pathStr + ':' + neighbor.placeId;

      if (existingCost === undefined || newCost < existingCost) {
        // Found a better path
        dist.set(neighbor.placeId, newCost);
        prev.set(neighbor.placeId, current.placeId);
        queue.push({
          cost: newCost,
          placeId: neighbor.placeId,
          pathStr: newPathStr,
        });
      } else if (newCost === existingCost) {
        // Equal cost - check if this path is lexicographically smaller
        const existingPrev = prev.get(neighbor.placeId);
        if (existingPrev !== undefined) {
          // Build existing path string for comparison
          const existingPathStr = buildPathString(prev, neighbor.placeId, from);
          if (newPathStr < existingPathStr) {
            prev.set(neighbor.placeId, current.placeId);
            queue.push({
              cost: newCost,
              placeId: neighbor.placeId,
              pathStr: newPathStr,
            });
          }
        }
      }
    }
  }

  // No path found
  return null;
}

/**
 * Helper to build path string from prev map for comparison
 */
function buildPathString(
  prev: Map<string, string>,
  to: string,
  from: string
): string {
  const parts: string[] = [];
  let node: string | undefined = to;
  while (node !== undefined) {
    parts.unshift(node);
    node = node === from ? undefined : prev.get(node);
  }
  return parts.join(':');
}

// Types are already exported via interface declarations above
