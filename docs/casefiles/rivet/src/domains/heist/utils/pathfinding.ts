/**
 * Heist Kernel - Pathfinding Utilities
 *
 * Extracted from prototype.ts lines 299-431.
 * A* and BFS pathfinding, cover/shadow finding.
 *
 * Task 002: Deterministic A* with dynamic costs.
 * Task 004: Intent system for move intents.
 */

import type {
  Vec2,
  TileType,
  HeistMap,
  GuardState,
  PathingConfig,
  ReservationTable,
  MoveIntent,
  MoveKind,
  MoveReason,
  RoutePlan,
  RoutePlanGoal,
  Entity,
  PositionComponent,
  CrewComponent,
  DoorState,
  DoorQueue,
  PathingState,
  TickIndex,
  EntityId,
  RuntimeConfig,
  AlertLevel,
} from '../types.js';
import { vecKey, vecEq, manhattan } from '../types.js';

// === TASK 002: COST CONTEXT TYPES ===

/**
 * Guard information for danger cost calculation.
 */
export interface GuardInfo {
  pos: Vec2;
  state: GuardState;
}

/**
 * Context for pathfinding cost calculations.
 */
export interface PathingCostContext {
  map: HeistMap;
  guards: GuardInfo[];           // guard positions + states (for dangerCostByGuardState)
  crewPositions: Vec2[];         // other crew positions (for crowdCost)
  lightOverlay: Uint16Array;     // from state.overlays.light
  smokeOverlay: Uint16Array;     // from state.overlays.smoke
  reservations: ReservationTable;
  config: PathingConfig;
  currentTick: TickIndex;
  /** Agent ID for excluding own reservations from penalty */
  agentId?: EntityId;
  /** For guards pathing: invert lightCost (prefer lit), ignore dangerCost */
  isGuard?: boolean;
}

// === DETERMINISTIC NEIGHBOR ORDER (spec 3.1) ===
const NEIGHBOR_ORDER = [
  { x: 0, y: -1 },  // N
  { x: 1, y: 0 },   // E
  { x: 0, y: 1 },   // S
  { x: -1, y: 0 },  // W
];

/**
 * Check if a tile is walkable.
 */
export function isWalkable(tile: TileType): boolean {
  return tile !== 'WALL';
}

/**
 * Check if a position is walkable on the map.
 */
export function canWalk(map: HeistMap, pos: Vec2): boolean {
  if (pos.x < 0 || pos.x >= map.width || pos.y < 0 || pos.y >= map.height) {
    return false;
  }
  const row = map.tiles[pos.y];
  if (!row) return false;
  const tile = row[pos.x];
  if (!tile) return false;
  return isWalkable(tile);
}

/**
 * Check if a tile allows vent traversal.
 */
export function canUseVent(tile: TileType): boolean {
  return tile === 'VENT' || isWalkable(tile);
}

/**
 * Get walkable neighbor positions.
 */
export function getNeighbors(
  pos: Vec2,
  map: HeistMap,
  canUseVents: boolean = false
): Vec2[] {
  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  const neighbors: Vec2[] = [];

  for (const dir of dirs) {
    const next: Vec2 = { x: pos.x + dir.x, y: pos.y + dir.y };

    if (next.x < 0 || next.x >= map.width || next.y < 0 || next.y >= map.height) {
      continue;
    }

    const row = map.tiles[next.y];
    if (!row) continue;
    const tile = row[next.x];
    if (!tile) continue;

    if (canUseVents ? canUseVent(tile) : isWalkable(tile)) {
      neighbors.push(next);
    }
  }

  return neighbors;
}

/**
 * Manhattan distance heuristic.
 */
export function manhattanDistance(a: Vec2, b: Vec2): number {
  return manhattan(a, b);
}

/**
 * BFS pathfinding - finds shortest path.
 * Returns array of positions from start (exclusive) to goal (inclusive).
 * Returns empty array if no path exists.
 */
export function findPath(
  from: Vec2,
  to: Vec2,
  map: HeistMap,
  canUseVents: boolean = false
): Vec2[] {
  // Can't walk to non-walkable tile
  if (!canWalk(map, to)) return [];

  // Already at destination
  if (from.x === to.x && from.y === to.y) return [];

  const queue: { pos: Vec2; path: Vec2[] }[] = [{ pos: from, path: [] }];
  const visited = new Set<string>();
  visited.add(vecKey(from));

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;

    for (const next of getNeighbors(pos, map, canUseVents)) {
      const key = vecKey(next);

      if (visited.has(key)) continue;
      visited.add(key);

      const newPath = [...path, next];

      if (next.x === to.x && next.y === to.y) {
        return newPath;
      }

      queue.push({ pos: next, path: newPath });
    }
  }

  return []; // No path found
}

/**
 * A* pathfinding - more efficient for long distances.
 * Returns array of positions from start (exclusive) to goal (inclusive).
 * Returns empty array if no path exists.
 */
export function findPathAStar(
  from: Vec2,
  to: Vec2,
  map: HeistMap,
  canUseVents: boolean = false
): Vec2[] {
  // Can't walk to non-walkable tile
  if (!canWalk(map, to)) return [];

  // Already at destination
  if (from.x === to.x && from.y === to.y) return [];

  interface Node {
    pos: Vec2;
    g: number; // cost from start
    f: number; // g + heuristic
    parent?: string;
  }

  const openSet = new Map<string, Node>();
  const closedSet = new Set<string>();

  const startKey = vecKey(from);
  openSet.set(startKey, {
    pos: from,
    g: 0,
    f: manhattan(from, to),
  });

  const cameFrom = new Map<string, string>();

  while (openSet.size > 0) {
    // Find node with lowest f score
    let current: Node | null = null;
    let currentKey = '';
    for (const [key, node] of openSet) {
      if (!current || node.f < current.f) {
        current = node;
        currentKey = key;
      }
    }

    if (!current) break;

    // Reached goal
    if (current.pos.x === to.x && current.pos.y === to.y) {
      // Reconstruct path
      const path: Vec2[] = [];
      let key: string | undefined = currentKey;

      while (key && key !== startKey) {
        const parts = key.split(',');
        const xPart = parts[0];
        const yPart = parts[1];
        if (xPart !== undefined && yPart !== undefined) {
          path.unshift({ x: parseInt(xPart), y: parseInt(yPart) });
        }
        key = cameFrom.get(key);
      }

      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check neighbors
    for (const neighbor of getNeighbors(current.pos, map, canUseVents)) {
      const neighborKey = vecKey(neighbor);

      if (closedSet.has(neighborKey)) continue;

      const g = current.g + 1;
      const existing = openSet.get(neighborKey);

      if (!existing || g < existing.g) {
        cameFrom.set(neighborKey, currentKey);
        openSet.set(neighborKey, {
          pos: neighbor,
          g,
          f: g + manhattan(neighbor, to),
        });
      }
    }
  }

  return []; // No path found
}

/**
 * Find nearest tile adjacent to a wall (for cover).
 */
export function findNearestCover(
  from: Vec2,
  map: HeistMap
): Vec2 | null {
  const queue: Vec2[] = [from];
  const visited = new Set<string>();
  visited.add(vecKey(from));

  const isAdjacentToWall = (pos: Vec2): boolean => {
    const dirs = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of dirs) {
      const adj = { x: pos.x + dir.x, y: pos.y + dir.y };
      if (
        adj.x >= 0 &&
        adj.x < map.width &&
        adj.y >= 0 &&
        adj.y < map.height
      ) {
        const row = map.tiles[adj.y];
        if (row && row[adj.x] === 'WALL') {
          return true;
        }
      }
    }
    return false;
  };

  while (queue.length > 0) {
    const pos = queue.shift()!;

    // Check if this position is cover
    if (canWalk(map, pos) && isAdjacentToWall(pos)) {
      return pos;
    }

    // Add walkable neighbors
    for (const next of getNeighbors(pos, map)) {
      const key = vecKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return null;
}

/**
 * Find nearest shadow tile.
 */
export function findNearestShadow(
  from: Vec2,
  map: HeistMap
): Vec2 | null {
  const queue: Vec2[] = [from];
  const visited = new Set<string>();
  visited.add(vecKey(from));

  while (queue.length > 0) {
    const pos = queue.shift()!;

    // Check if this is a shadow tile
    if (map.tiles[pos.y]?.[pos.x] === 'SHADOW') {
      return pos;
    }

    // Add walkable neighbors
    for (const next of getNeighbors(pos, map)) {
      const key = vecKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  return null;
}

/**
 * Find nearest tile of a specific type.
 */
export function findNearestTile(
  from: Vec2,
  tileType: TileType,
  map: HeistMap
): Vec2 | null {
  for (let y = 0; y < map.height; y++) {
    const row = map.tiles[y];
    if (!row) continue;
    for (let x = 0; x < map.width; x++) {
      if (row[x] === tileType) {
        return { x, y };
      }
    }
  }
  return null;
}

// === TASK 002: DETERMINISTIC A* WITH COSTS ===

/**
 * Calculate the movement cost for a tile based on danger, light, and crowd factors.
 * Uses integer arithmetic (*100) for determinism.
 */
function tileCost(tile: Vec2, ctx: PathingCostContext, canUseVents: boolean): number {
  let cost = 100; // base (scaled by 100)

  // ventCost: vents are shortcuts (only applies if canUseVents)
  const tileType = ctx.map.tiles[tile.y]?.[tile.x];
  if (tileType === 'VENT' && canUseVents) {
    cost = Math.floor(100 * ctx.config.ventCostMultiplier);
  }

  // Skip danger cost for guards
  if (!ctx.isGuard) {
    // dangerCost: near guards (with state multiplier)
    for (const guard of ctx.guards) {
      const dist = manhattan(tile, guard.pos);
      if (dist <= ctx.config.dangerRadius) {
        // Linear falloff: max at dist=0, zero at dist=dangerRadius+1
        const baseDanger = ctx.config.dangerCostPerTile * (ctx.config.dangerRadius + 1 - dist);
        const stateMultiplier = ctx.config.dangerCostByGuardState[guard.state] ?? 1.0;
        cost += Math.floor(baseDanger * stateMultiplier * 100);
      }
    }
  }

  // lightCost: lit tiles (higher = more lit)
  const idx = tile.y * ctx.map.width + tile.x;
  const lightValue = ctx.lightOverlay[idx] || 0; // 0-1000
  if (ctx.isGuard) {
    // Guards prefer lit tiles (invert: subtract light cost)
    cost -= Math.floor((lightValue / 1000) * ctx.config.lightCostMultiplier * 100);
  } else {
    // Crew avoids lit tiles
    cost += Math.floor((lightValue / 1000) * ctx.config.lightCostMultiplier * 100);
  }

  // crowdCost: near other crew (crew only)
  if (!ctx.isGuard) {
    for (const crew of ctx.crewPositions) {
      if (manhattan(tile, crew) <= 1) {
        cost += ctx.config.crowdCost * 100;
      }
    }
  }

  // reservePenalty: if reserved in planning horizon (Task 005)
  if (!ctx.isGuard && ctx.reservations && ctx.agentId) {
    const tileId = vecKey(tile);
    const penalty = getReservePenalty(
      ctx.reservations,
      tileId,
      ctx.currentTick,
      ctx.config.reservationHorizonH,
      ctx.agentId,
      ctx.config.reservePenaltyBIG
    );
    cost += penalty * 100;
  }

  // Ensure cost is never negative
  return Math.max(cost, 1);
}

/**
 * Deterministic tie-breaking comparator for A* nodes.
 * On equal fScore: lower h wins, then lower g wins, then lex-smaller tileId wins.
 */
function compareNodes(
  a: { key: string; f: number; g: number; h: number },
  b: { key: string; f: number; g: number; h: number }
): number {
  // First: compare f scores
  if (a.f !== b.f) return a.f - b.f;
  // Second: lower h wins
  if (a.h !== b.h) return a.h - b.h;
  // Third: lower g wins
  if (a.g !== b.g) return a.g - b.g;
  // Fourth: lexicographically smaller tileId wins
  return a.key.localeCompare(b.key);
}

/**
 * A* pathfinding with dynamic cost overlays (danger, light, crowd).
 * Produces identical paths for identical inputs (deterministic).
 *
 * Returns array of positions from start (exclusive) to goal (inclusive).
 * Returns empty array if no path exists.
 *
 * @param from - Starting position
 * @param to - Goal position
 * @param ctx - Cost context with map, guards, overlays, config
 * @param canUseVents - Whether crew can use vent tiles
 */
export function findPathWithCosts(
  from: Vec2,
  to: Vec2,
  ctx: PathingCostContext,
  canUseVents: boolean
): Vec2[] {
  // Validate start position
  if (from.x < 0 || from.x >= ctx.map.width || from.y < 0 || from.y >= ctx.map.height) {
    return [];
  }

  // Validate goal position
  if (to.x < 0 || to.x >= ctx.map.width || to.y < 0 || to.y >= ctx.map.height) {
    return [];
  }

  // Can't walk to non-walkable tile
  if (!canWalk(ctx.map, to)) return [];

  // Can't start from non-walkable tile
  if (!canWalk(ctx.map, from)) return [];

  // Already at destination
  if (from.x === to.x && from.y === to.y) return [];

  interface Node {
    pos: Vec2;
    g: number; // cost from start
    h: number; // heuristic to goal
    f: number; // g + h
  }

  const openSet = new Map<string, Node>();
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, string>();

  const startKey = vecKey(from);
  const h = manhattan(from, to) * 100; // Scale heuristic by 100 to match costs
  openSet.set(startKey, {
    pos: from,
    g: 0,
    h,
    f: h,
  });

  while (openSet.size > 0) {
    // Find node with lowest f score using deterministic tie-breaking
    const candidates: { key: string; f: number; g: number; h: number }[] = [];
    for (const [key, node] of openSet) {
      candidates.push({ key, f: node.f, g: node.g, h: node.h });
    }
    candidates.sort(compareNodes);

    const firstCandidate = candidates[0];
    if (!firstCandidate) break;
    const currentKey = firstCandidate.key;
    const current = openSet.get(currentKey);
    if (!current) break;

    // Reached goal
    if (current.pos.x === to.x && current.pos.y === to.y) {
      // Reconstruct path
      const path: Vec2[] = [];
      let pathKey: string | undefined = currentKey;

      while (pathKey && pathKey !== startKey) {
        const parts = pathKey.split(',');
        const xPart = parts[0];
        const yPart = parts[1];
        if (xPart !== undefined && yPart !== undefined) {
          path.unshift({ x: parseInt(xPart), y: parseInt(yPart) });
        }
        pathKey = cameFrom.get(pathKey);
      }

      return path;
    }

    openSet.delete(currentKey);
    closedSet.add(currentKey);

    // Check neighbors in deterministic order (N, E, S, W)
    for (const dir of NEIGHBOR_ORDER) {
      const neighbor: Vec2 = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };

      // Check bounds
      if (neighbor.x < 0 || neighbor.x >= ctx.map.width ||
          neighbor.y < 0 || neighbor.y >= ctx.map.height) {
        continue;
      }

      // Check walkability
      const row = ctx.map.tiles[neighbor.y];
      if (!row) continue;
      const tile = row[neighbor.x];
      if (!tile) continue;
      const isWalkableNeighbor = canUseVents ? canUseVent(tile) : isWalkable(tile);
      if (!isWalkableNeighbor) continue;

      const neighborKey = vecKey(neighbor);
      if (closedSet.has(neighborKey)) continue;

      // Calculate cost to this neighbor
      const moveCost = tileCost(neighbor, ctx, canUseVents);
      const g = current.g + moveCost;
      const existing = openSet.get(neighborKey);

      if (!existing || g < existing.g) {
        const hNeighbor = manhattan(neighbor, to) * 100;
        cameFrom.set(neighborKey, currentKey);
        openSet.set(neighborKey, {
          pos: neighbor,
          g,
          h: hNeighbor,
          f: g + hNeighbor,
        });
      }
    }
  }

  return []; // No path found
}

// === TASK 004: INTENT SYSTEM ===

/**
 * Minimal context interface for intent creation.
 * This allows for easier testing without full SystemContext.
 */
export interface IntentContext {
  state: {
    tickIndex: TickIndex;
    doors: Record<string, DoorState>;
  };
  config: RuntimeConfig;
  tickIndex: TickIndex;
}

/**
 * Compute deterministic priority key for conflict resolution.
 * Format: `${teamOrder}:${stanceOrder}:${roleOrder}:${agentId}`
 *
 * Lower = higher priority (moves first)
 */
export function computePriorityKey(agent: Entity, ctx: IntentContext): string {
  // Team order: CREW before GUARD (crew moves first, guards still detect)
  const teamOrder = agent.type === 'crew' ? '0' : '1';

  // Stance order: SPRINT > NORMAL > SNEAK (sprint is urgent)
  const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
  const stance = crewComp?.stance || 'NORMAL';
  const stanceOrder = stance === 'SPRINT' ? '0' : stance === 'NORMAL' ? '1' : '2';

  // Role order: for now, all equal (could add leader concept later)
  const roleOrder = '0';

  // Agent ID: final tie-break (deterministic)
  return `${teamOrder}:${stanceOrder}:${roleOrder}:${agent.id}`;
}

/**
 * Check if a door exists between two adjacent tiles.
 * Returns the doorId if found, null otherwise.
 */
export function getDoorBetween(
  a: Vec2,
  b: Vec2,
  doors: Record<string, DoorState>
): string | null {
  // Doors are on DOOR tiles - check if either tile is a door
  for (const [doorId, door] of Object.entries(doors)) {
    if (vecEq(door.pos, a) || vecEq(door.pos, b)) {
      // Check if a and b are adjacent (manhattan = 1)
      if (manhattan(a, b) === 1) {
        return doorId;
      }
    }
  }
  return null;
}

/**
 * Create a MoveIntent for an agent based on their current route.
 *
 * @param agent - The entity to create intent for
 * @param route - The agent's current route plan (or undefined)
 * @param ctx - System context with state and config
 * @returns MoveIntent, or null if agent has no position component
 */
export function createMoveIntent(
  agent: Entity,
  route: RoutePlan | undefined,
  ctx: IntentContext
): MoveIntent | null {
  const posComp = agent.components['heist.position'] as PositionComponent | undefined;
  const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;

  // No position component - can't create intent
  if (!posComp) {
    return null;
  }

  const from = vecKey(posComp.pos);
  const priorityKey = computePriorityKey(agent, ctx);

  // Case 1: Currently interacting (working, hacking)
  if (crewComp?.state === 'WORKING') {
    return {
      tick: ctx.state.tickIndex,
      agentId: agent.id,
      from,
      to: from,  // stay in place
      kind: 'WAIT' as MoveKind,
      priorityKey,
      why: { reason: 'INTERACTING' as MoveReason, details: { state: crewComp.state } },
    };
  }

  // Case 2: No route or empty route or cursor at/past end
  if (!route || route.path.length === 0 || route.cursor >= route.path.length - 1) {
    return {
      tick: ctx.state.tickIndex,
      agentId: agent.id,
      from,
      to: from,
      kind: 'WAIT' as MoveKind,
      priorityKey,
      why: { reason: 'FOLLOW_ROUTE' as MoveReason, details: { noRoute: !route } },
    };
  }

  // Case 3: Normal movement - propose step to next tile
  const nextTile = route.path[route.cursor + 1];
  if (!nextTile) {
    // Safety check - should not happen given prior validation
    return {
      tick: ctx.state.tickIndex,
      agentId: agent.id,
      from,
      to: from,
      kind: 'WAIT' as MoveKind,
      priorityKey,
      why: { reason: 'FOLLOW_ROUTE' as MoveReason, details: { noRoute: true } },
    };
  }
  const to = vecKey(nextTile);

  // Check if next step crosses a door
  const doorId = getDoorBetween(posComp.pos, nextTile, ctx.state.doors);
  if (doorId) {
    const door = ctx.state.doors[doorId];
    if (door && !door.isOpen) {
      // Door closed - need to open it
      return {
        tick: ctx.state.tickIndex,
        agentId: agent.id,
        from,
        to: from,  // stay in place while opening
        kind: 'OPEN_DOOR' as MoveKind,
        priorityKey,
        why: { reason: 'DOOR_CLOSED' as MoveReason, details: { doorId } },
      };
    }
  }

  // Normal step
  return {
    tick: ctx.state.tickIndex,
    agentId: agent.id,
    from,
    to,
    kind: 'STEP' as MoveKind,
    priorityKey,
    why: { reason: 'FOLLOW_ROUTE' as MoveReason },
  };
}

// === TASK 003: ROUTE CACHING ===

/**
 * Simple djb2 hash function for string hashing.
 * Fast and deterministic.
 */
export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16);
}

/**
 * Compute deterministic hash of planning inputs.
 * Hash changes when any planning-relevant input changes.
 *
 * @param agentId - The agent's ID
 * @param agentPos - Agent's current position
 * @param goal - The route goal
 * @param doorStateHash - Hash of all door open/closed states
 * @param overlayEpoch - Epoch counter for overlay changes
 * @param alertLevel - Current alert level
 */
export function computePlanHash(
  agentId: EntityId,
  agentPos: Vec2,
  goal: RoutePlanGoal,
  doorStateHash: string,
  overlayEpoch: number,
  alertLevel: AlertLevel
): string {
  try {
    const input = JSON.stringify({
      agentId,
      pos: vecKey(agentPos),
      goal: { kind: goal.kind, tileId: goal.tileId, objectiveId: goal.objectiveId },
      doors: doorStateHash,
      overlay: overlayEpoch,
      alert: alertLevel,
    });
    return hashString(input);
  } catch {
    // ERR-1: JSON.stringify failed (e.g., circular reference)
    // Return deterministic fallback based on agent ID and position (no Date.now for determinism)
    console.warn('Plan hash fallback');
    return hashString(`fallback:${agentId}:${vecKey(agentPos)}:${overlayEpoch}`);
  }
}

/**
 * Check if agent should replan their route.
 *
 * Replan triggers:
 * 1. No existing route
 * 2. Next step invalid (blocked or door closed)
 * 3. Stuck for too long (blockedTicks >= stuckTicks)
 * 4. Goal changed
 * 5. Plan hash mismatch (environment changed, after cooldown)
 * 6. Route completed (cursor at end)
 */
export function shouldReplan(
  agent: Entity,
  route: RoutePlan | undefined,
  ctx: {
    state: {
      tickIndex: TickIndex;
      pathing?: PathingState;
      doors: Record<string, DoorState>;
      alert: { level: AlertLevel };
      map: HeistMap;
    };
    config: RuntimeConfig;
  }
): boolean {
  // No existing route
  if (!route) return true;

  // Route completed - cursor at end
  if (route.cursor >= route.path.length - 1) return true;

  const posComp = agent.components['heist.position'] as PositionComponent | undefined;
  const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;

  if (!posComp) return true;

  // Check goal change (overrides cooldown)
  if (crewComp?.currentObjective) {
    if (route.goal.kind === 'objective' && route.goal.objectiveId !== crewComp.currentObjective) {
      return true;
    }
  }

  // Check stuck threshold (overrides cooldown)
  const blockedTicks = ctx.state.pathing?.blockedTicks[agent.id] ?? 0;
  if (blockedTicks >= ctx.config.pathing.stuckTicks) {
    return true;
  }

  // Cooldown not expired - don't replan unless critical
  if (ctx.state.tickIndex < route.replanCooldownUntilTick) {
    return false;
  }

  // Next step invalid (door closed or tile blocked)
  const nextTile = route.path[route.cursor + 1];
  if (nextTile) {
    // Check if door is closed
    const doorId = getDoorBetween(posComp.pos, nextTile, ctx.state.doors);
    if (doorId) {
      const door = ctx.state.doors[doorId];
      if (door && !door.isOpen) {
        return true;
      }
    }

    // Check if tile is walkable
    if (!canWalk(ctx.state.map, nextTile)) {
      return true;
    }
  }

  // Check if any tile in path is now blocked (EC-3)
  for (let i = route.cursor + 1; i < route.path.length; i++) {
    const tile = route.path[i];
    if (tile && !canWalk(ctx.state.map, tile)) {
      return true;
    }
  }

  // Plan hash mismatch - environment changed
  const doorStateHash = hashString(JSON.stringify(
    Object.entries(ctx.state.doors)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, door]) => ({ id, isOpen: door.isOpen }))
  ));
  const overlayEpoch = ctx.state.pathing?.overlayEpoch ?? 0;

  const currentHash = computePlanHash(
    agent.id,
    posComp.pos,
    route.goal,
    doorStateHash,
    overlayEpoch,
    ctx.state.alert.level
  );

  if (currentHash !== route.planHash) {
    return true;
  }

  return false;
}

/**
 * Create a new route plan for an agent.
 */
export function createRoutePlan(
  agent: Entity,
  goal: RoutePlanGoal,
  path: Vec2[],
  ctx: {
    state: {
      tickIndex: TickIndex;
      pathing?: PathingState;
      doors: Record<string, DoorState>;
      alert: { level: AlertLevel };
    };
    config: RuntimeConfig;
  }
): RoutePlan {
  const posComp = agent.components['heist.position'] as PositionComponent | undefined;
  const agentPos = posComp?.pos ?? { x: 0, y: 0 };

  const doorStateHash = hashString(JSON.stringify(
    Object.entries(ctx.state.doors)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([id, door]) => ({ id, isOpen: door.isOpen }))
  ));
  const overlayEpoch = ctx.state.pathing?.overlayEpoch ?? 0;

  const planHash = computePlanHash(
    agent.id,
    agentPos,
    goal,
    doorStateHash,
    overlayEpoch,
    ctx.state.alert.level
  );

  return {
    agentId: agent.id,
    goal,
    path,
    cursor: 0,
    plannedAtTick: ctx.state.tickIndex,
    planHash,
    replanCooldownUntilTick: ctx.state.tickIndex + ctx.config.pathing.replanCooldownTicks,
  };
}

// === TASK 005: RESERVATIONS + CONFLICT RESOLUTION ===

/**
 * Create a new reservation table with the given horizon.
 */
export function createReservationTable(horizonH: number): ReservationTable {
  return { horizonH, reservedBy: {} };
}

/**
 * Reserve a tile at a specific tick for an agent.
 */
export function reserveTile(
  table: ReservationTable,
  tileId: string,
  tick: TickIndex,
  agentId: EntityId
): void {
  const key = `${tileId}@${tick}`;
  table.reservedBy[key] = agentId;
}

/**
 * Check if a tile is reserved at a specific tick.
 */
export function isReserved(
  table: ReservationTable,
  tileId: string,
  tick: TickIndex,
  excludeAgent?: EntityId
): boolean {
  const key = `${tileId}@${tick}`;
  const reserver = table.reservedBy[key];
  return reserver !== undefined && reserver !== excludeAgent;
}

/**
 * Get the reserve penalty for a tile in the A* cost calculation.
 * Returns penaltyBIG if tile is reserved by another agent within horizon.
 */
export function getReservePenalty(
  table: ReservationTable,
  tileId: string,
  currentTick: TickIndex,
  horizonH: number,
  excludeAgent: EntityId,
  penaltyBIG: number
): number {
  for (let t = currentTick; t < currentTick + horizonH; t++) {
    if (isReserved(table, tileId, t, excludeAgent)) {
      return penaltyBIG;
    }
  }
  return 0;
}

/**
 * Clear expired reservations from the table.
 */
export function clearExpiredReservations(
  table: ReservationTable,
  currentTick: TickIndex
): void {
  for (const key of Object.keys(table.reservedBy)) {
    const atIndex = key.lastIndexOf('@');
    if (atIndex === -1) continue;
    const tickStr = key.substring(atIndex + 1);
    const tick = parseInt(tickStr, 10);
    if (tick < currentTick) {
      delete table.reservedBy[key];
    }
  }
}

/**
 * Result of conflict resolution.
 */
export interface ResolutionResult {
  moves: Array<{ agentId: EntityId; from: Vec2; to: Vec2 }>;
  blocked: Array<{ agentId: EntityId; from: Vec2; to: Vec2; reason: string; blockedBy?: EntityId }>;
}

/**
 * Parse a vecKey string back to Vec2.
 */
function parseVec(key: string): Vec2 {
  const parts = key.split(',');
  return { x: parseInt(parts[0] ?? '0', 10), y: parseInt(parts[1] ?? '0', 10) };
}

/**
 * Resolve move intents into actual moves and blocked agents.
 *
 * Phases:
 * A: Chain moves into empty tiles
 * B: Swaps (same team, non-door)
 * C: Contested destinations - priority wins
 * D: Remaining unresolved (cycles) - break by priority
 */
export function resolveIntents(
  intents: MoveIntent[],
  occupancy: Record<string, EntityId>,
  config: PathingConfig
): ResolutionResult {
  const result: ResolutionResult = { moves: [], blocked: [] };

  if (intents.length === 0) return result;

  // Sort intents by priority (lower key = higher priority)
  const sorted = [...intents].sort((a, b) => a.priorityKey.localeCompare(b.priorityKey));

  // Build intent graph
  const intentByAgent = new Map<EntityId, MoveIntent>();
  const incoming = new Map<string, EntityId[]>(); // tile -> agents wanting to move there

  for (const intent of sorted) {
    intentByAgent.set(intent.agentId, intent);
    if (intent.to !== intent.from) {
      const list = incoming.get(intent.to) || [];
      list.push(intent.agentId);
      incoming.set(intent.to, list);
    }
  }

  // Track final positions
  const finalPos = new Map<EntityId, string>();
  const resolved = new Set<EntityId>();
  // Track which tiles have been claimed by moves this tick
  const claimedDest = new Set<string>();

  // Phase A: Chain moves into empty tiles
  // Process in priority order, handling contested tiles immediately
  let changed = true;
  while (changed) {
    changed = false;
    for (const intent of sorted) {
      if (resolved.has(intent.agentId)) continue;

      if (intent.to === intent.from) {
        // WAIT - resolve immediately
        finalPos.set(intent.agentId, intent.to);
        resolved.add(intent.agentId);
        changed = true;
        continue;
      }

      // Check if destination is already claimed by another agent this tick
      if (claimedDest.has(intent.to)) {
        // Someone else already claimed this tile - we're blocked
        // Find who claimed it
        const winner = [...finalPos.entries()].find(([_, pos]) => pos === intent.to)?.[0];
        const blockedEntry: { agentId: EntityId; from: Vec2; to: Vec2; reason: string; blockedBy?: EntityId } = {
          agentId: intent.agentId,
          from: parseVec(intent.from),
          to: parseVec(intent.to),
          reason: 'CONTESTED',
        };
        if (winner) {
          blockedEntry.blockedBy = winner;
        }
        result.blocked.push(blockedEntry);
        finalPos.set(intent.agentId, intent.from);
        resolved.add(intent.agentId);
        changed = true;
        continue;
      }

      // Check if destination is empty or vacated
      const destOccupant = occupancy[intent.to];
      // Treat undefined occupant as empty (ERR-1)
      const destVacated = destOccupant && resolved.has(destOccupant) && finalPos.get(destOccupant) !== intent.to;
      const destEmpty = !destOccupant || destVacated;

      if (destEmpty) {
        result.moves.push({
          agentId: intent.agentId,
          from: parseVec(intent.from),
          to: parseVec(intent.to),
        });
        finalPos.set(intent.agentId, intent.to);
        claimedDest.add(intent.to);
        resolved.add(intent.agentId);
        changed = true;
      }
    }
  }

  // Phase B: Swaps (same team, non-door)
  if (config.allowSwapsSameTeam) {
    for (const intent of sorted) {
      if (resolved.has(intent.agentId)) continue;

      const destOccupant = occupancy[intent.to];
      if (!destOccupant) continue;

      const otherIntent = intentByAgent.get(destOccupant);
      if (!otherIntent || resolved.has(destOccupant)) continue;

      // Check if swap: A wants B's tile and B wants A's tile
      if (otherIntent.to === intent.from) {
        // Check same team (both crew or both guard)
        const agentTeam = intent.priorityKey.charAt(0);
        const otherTeam = otherIntent.priorityKey.charAt(0);

        if (agentTeam === otherTeam || config.allowSwapsAcrossTeams) {
          result.moves.push({
            agentId: intent.agentId,
            from: parseVec(intent.from),
            to: parseVec(intent.to),
          });
          result.moves.push({
            agentId: destOccupant,
            from: parseVec(otherIntent.from),
            to: parseVec(otherIntent.to),
          });

          finalPos.set(intent.agentId, intent.to);
          finalPos.set(destOccupant, otherIntent.to);
          resolved.add(intent.agentId);
          resolved.add(destOccupant);
        }
      }
    }
  }

  // Phase C: Contested destinations - priority wins
  for (const [tile, agents] of incoming) {
    const unresolved = agents.filter(a => !resolved.has(a));
    if (unresolved.length <= 1) continue;

    // First unresolved agent wins (already sorted by priority)
    const winner = unresolved[0];
    const losers = unresolved.slice(1);

    for (const loser of losers) {
      const intent = intentByAgent.get(loser);
      if (!intent) continue;

      const blockedEntry: { agentId: EntityId; from: Vec2; to: Vec2; reason: string; blockedBy?: EntityId } = {
        agentId: loser,
        from: parseVec(intent.from),
        to: parseVec(intent.to),
        reason: 'CONTESTED',
      };
      if (winner) {
        blockedEntry.blockedBy = winner;
      }
      result.blocked.push(blockedEntry);
      finalPos.set(loser, intent.from);
      resolved.add(loser);
    }
  }

  // Phase D: Remaining unresolved (cycles) - break by priority
  for (const intent of sorted) {
    if (resolved.has(intent.agentId)) continue;

    result.blocked.push({
      agentId: intent.agentId,
      from: parseVec(intent.from),
      to: parseVec(intent.to),
      reason: 'CYCLE',
    });
    finalPos.set(intent.agentId, intent.from);
    resolved.add(intent.agentId);
  }

  return result;
}

// === TASK 006: DOOR QUEUES ===

/**
 * Create a new door queue.
 */
export function createDoorQueue(doorId: string, a: string, b: string): DoorQueue {
  return {
    doorId,
    a,
    b,
    state: 'CLOSED',
    queue: [],
  };
}

/**
 * Check if an agent can traverse a door this tick.
 */
export function canTraverseDoor(
  door: DoorQueue,
  agentId: EntityId,
  currentTick: TickIndex,
  config: PathingConfig
): boolean {
  // Door must be open
  if (door.state !== 'OPEN') return false;

  // Check capacity (first N in queue can pass)
  const queuePos = door.queue.indexOf(agentId);
  if (queuePos === -1) {
    // Not in queue - can pass if capacity available
    return door.queue.length < config.doorCapacityPerTick;
  }

  // In queue - can pass if within capacity
  return queuePos < config.doorCapacityPerTick;
}

/**
 * Add an agent to a door queue.
 */
export function joinDoorQueue(door: DoorQueue, agentId: EntityId): DoorQueue {
  if (door.queue.includes(agentId)) return door;

  return {
    ...door,
    queue: [...door.queue, agentId],
  };
}

/**
 * Start opening a closed door.
 */
export function startOpeningDoor(
  door: DoorQueue,
  agentId: EntityId,
  currentTick: TickIndex,
  config: PathingConfig
): DoorQueue {
  if (door.state !== 'CLOSED') return door;

  return {
    ...door,
    state: 'OPENING',
    openingByAgent: agentId,
    openingCompletesAtTick: currentTick + config.doorOpenTicks,
    queue: door.queue.includes(agentId) ? door.queue : [...door.queue, agentId],
  };
}

/**
 * Update door state for a tick.
 * Handles opening completion and auto-close.
 */
export function tickDoorState(
  door: DoorQueue,
  currentTick: TickIndex,
  config: PathingConfig
): DoorQueue {
  // Check if opening completes
  if (door.state === 'OPENING' && door.openingCompletesAtTick !== undefined && currentTick >= door.openingCompletesAtTick) {
    // Create new object without the opening fields
    const result: DoorQueue = {
      doorId: door.doorId,
      a: door.a,
      b: door.b,
      state: 'OPEN',
      queue: door.queue,
      lastTraversalTick: currentTick,
    };
    return result;
  }

  // Check auto-close
  if (door.state === 'OPEN' && door.lastTraversalTick !== undefined) {
    const ticksSinceTraversal = currentTick - door.lastTraversalTick;
    if (ticksSinceTraversal >= config.autoCloseDelayTicks && door.queue.length === 0) {
      // Create new object without lastTraversalTick
      const result: DoorQueue = {
        doorId: door.doorId,
        a: door.a,
        b: door.b,
        state: 'CLOSED',
        queue: door.queue,
      };
      return result;
    }
  }

  return door;
}

/**
 * Record that an agent has traversed a door.
 */
export function recordTraversal(
  door: DoorQueue,
  agentId: EntityId,
  currentTick: TickIndex
): DoorQueue {
  return {
    ...door,
    queue: door.queue.filter(id => id !== agentId),
    lastTraversalTick: currentTick,
  };
}

/**
 * Find if there's a door between two adjacent tiles.
 * Returns doorId if found, null otherwise.
 */
export function findDoorBetweenTiles(
  from: string,
  to: string,
  doorQueues: Record<string, DoorQueue>
): string | null {
  for (const [doorId, door] of Object.entries(doorQueues)) {
    if ((door.a === from && door.b === to) || (door.a === to && door.b === from)) {
      return doorId;
    }
  }
  return null;
}

/**
 * Convert a STEP intent to QUEUE_DOOR or OPEN_DOOR if door is closed/opening.
 */
export function handleDoorIntent(
  intent: MoveIntent,
  doorQueues: Record<string, DoorQueue>,
  config: PathingConfig
): MoveIntent {
  // Find door between from and to
  const doorId = findDoorBetweenTiles(intent.from, intent.to, doorQueues);
  if (!doorId) return intent; // no door

  const door = doorQueues[doorId];
  if (!door) return intent;

  // Door is open and agent can traverse
  if (canTraverseDoor(door, intent.agentId, intent.tick, config)) {
    return intent; // proceed with STEP
  }

  // Door is closed - need to open
  if (door.state === 'CLOSED') {
    // First arriver opens
    if (door.queue.length === 0) {
      return {
        ...intent,
        to: intent.from, // stay in place
        kind: 'OPEN_DOOR',
        why: { reason: 'DOOR_CLOSED', details: { doorId } },
      };
    }
  }

  // Door opening or at capacity - queue
  return {
    ...intent,
    to: intent.from, // stay in place
    kind: 'QUEUE_DOOR',
    why: { reason: 'DOOR_CAPACITY', details: { doorId, queuePos: door.queue.length } },
  };
}

// === TASK 007: SYSTEM INTEGRATION ===

/**
 * Initialize a new PathingState with default values.
 */
export function initializePathingState(): PathingState {
  return {
    routes: {},
    reservations: createReservationTable(8),
    doorQueues: {},
    blockedTicks: {},
    overlayEpoch: 0,
  };
}

/**
 * Build PathingCostContext from SystemContext.
 * Provides all data needed for A* cost calculations.
 */
export function buildPathingCostContext(ctx: {
  state: {
    map: HeistMap;
    entities: Record<string, Entity>;
    overlays?: { light: Uint16Array; smoke: Uint16Array };
    pathing?: PathingState;
    tickIndex: TickIndex;
  };
  config: RuntimeConfig;
}, agentId?: EntityId, isGuard?: boolean): PathingCostContext {
  const guards: GuardInfo[] = [];
  const crewPositions: Vec2[] = [];

  // Collect guard and crew positions
  for (const entity of Object.values(ctx.state.entities)) {
    const posComp = entity.components['heist.position'] as PositionComponent | undefined;
    if (!posComp) continue;

    if (entity.type === 'guard') {
      const guardComp = entity.components['heist.guard'] as { state: GuardState } | undefined;
      if (guardComp) {
        guards.push({ pos: posComp.pos, state: guardComp.state });
      }
    } else if (entity.type === 'crew') {
      // Exclude the current agent from crew positions (for crowdCost)
      if (entity.id !== agentId) {
        crewPositions.push(posComp.pos);
      }
    }
  }

  // Default empty overlays if not present (for backward compatibility with tests)
  const mapSize = ctx.state.map.width * ctx.state.map.height;
  const defaultOverlay = new Uint16Array(mapSize);

  const result: PathingCostContext = {
    map: ctx.state.map,
    guards,
    crewPositions,
    lightOverlay: ctx.state.overlays?.light ?? defaultOverlay,
    smokeOverlay: ctx.state.overlays?.smoke ?? defaultOverlay,
    reservations: ctx.state.pathing?.reservations ?? createReservationTable(8),
    config: ctx.config.pathing,
    currentTick: ctx.state.tickIndex,
  };

  // Only set optional properties if they have defined values
  if (agentId !== undefined) {
    result.agentId = agentId;
  }
  if (isGuard !== undefined) {
    result.isGuard = isGuard;
  }

  return result;
}

/**
 * Build occupancy map from current entity positions.
 * Returns a map of tileId -> agentId.
 */
export function buildOccupancy(ctx: {
  state: {
    entities: Record<string, Entity>;
  };
}): Record<string, EntityId> {
  const occupancy: Record<string, EntityId> = {};

  for (const entity of Object.values(ctx.state.entities)) {
    if (entity.type !== 'crew' && entity.type !== 'guard') continue;

    const posComp = entity.components['heist.position'] as PositionComponent | undefined;
    if (posComp) {
      occupancy[vecKey(posComp.pos)] = entity.id;
    }
  }

  return occupancy;
}

/**
 * Get or create a route for an agent.
 * Uses route caching and only replans when necessary.
 */
export function getOrCreateRoute(
  agent: Entity,
  goal: RoutePlanGoal,
  costCtx: PathingCostContext,
  ctx: {
    state: {
      tickIndex: TickIndex;
      pathing?: PathingState;
      doors: Record<string, DoorState>;
      alert: { level: AlertLevel };
      map: HeistMap;
      entities: Record<string, Entity>;
    };
    config: RuntimeConfig;
  }
): RoutePlan | undefined {
  const existingRoute = ctx.state.pathing?.routes[agent.id];

  if (!shouldReplan(agent, existingRoute, ctx)) {
    return existingRoute;
  }

  // Compute goal position
  const goalPos = resolveGoalPosition(goal, { state: { entities: ctx.state.entities } });
  if (!goalPos) return undefined;

  const posComp = agent.components['heist.position'] as PositionComponent | undefined;
  if (!posComp) return undefined;

  // Already at goal
  if (vecEq(posComp.pos, goalPos)) return undefined;

  // Determine if agent can use vents (crew can, guards cannot)
  const canUseVents = agent.type === 'crew';

  // Use new A* with costs
  const path = findPathWithCosts(posComp.pos, goalPos, costCtx, canUseVents);
  if (path.length === 0) return undefined;

  // Create route plan with current position as first element
  const fullPath = [posComp.pos, ...path];
  const route = createRoutePlan(agent, goal, fullPath, ctx);

  return route;
}

/**
 * Resolve a goal to a specific position.
 */
function resolveGoalPosition(
  goal: RoutePlanGoal,
  ctx: {
    state: {
      entities: Record<string, Entity>;
    };
  }
): Vec2 | null {
  if (goal.kind === 'tile' && goal.tileId) {
    const parts = goal.tileId.split(',');
    const xPart = parts[0];
    const yPart = parts[1];
    if (parts.length === 2 && xPart !== undefined && yPart !== undefined) {
      const x = parseInt(xPart, 10);
      const y = parseInt(yPart, 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { x, y };
      }
    }
    return null;
  }

  if (goal.kind === 'objective' && goal.objectiveId) {
    const objective = ctx.state.entities[goal.objectiveId];
    if (objective) {
      const posComp = objective.components['heist.position'] as PositionComponent | undefined;
      if (posComp) {
        return posComp.pos;
      }
    }
    return null;
  }

  return null;
}
