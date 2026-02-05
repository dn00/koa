/**
 * RIVET - Pathfinding Utilities
 *
 * A* and BFS pathfinding, cover/shadow finding.
 * Game-agnostic grid navigation algorithms.
 */

import type { Vec2 } from '../types/core.js';
import { vecKey, vecEq, manhattan } from '../types/core.js';
import type { TileType } from './vision.js';

// === MAP INTERFACE ===
export interface GridMap {
  width: number;
  height: number;
  tiles: TileType[][];
}

// === DETERMINISTIC NEIGHBOR ORDER ===
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
export function canWalk(map: GridMap, pos: Vec2): boolean {
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
  map: GridMap,
  canUseVents: boolean = false
): Vec2[] {
  const neighbors: Vec2[] = [];

  for (const dir of NEIGHBOR_ORDER) {
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
  map: GridMap,
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
  map: GridMap,
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
  map: GridMap
): Vec2 | null {
  const queue: Vec2[] = [from];
  const visited = new Set<string>();
  visited.add(vecKey(from));

  const isAdjacentToWall = (pos: Vec2): boolean => {
    for (const dir of NEIGHBOR_ORDER) {
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
  map: GridMap
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
  map: GridMap
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

// === COST-AWARE A* ===

/**
 * Guard/danger information for cost calculation.
 */
export interface DangerSource {
  pos: Vec2;
  dangerMultiplier: number; // Higher = more dangerous
}

/**
 * Context for pathfinding cost calculations.
 */
export interface PathingCostContext {
  map: GridMap;
  dangers: DangerSource[];        // Danger sources to avoid
  crowdPositions: Vec2[];         // Other agents to spread from
  lightOverlay?: Uint16Array;     // 0-1000 light levels
  config: PathingCostConfig;
}

export interface PathingCostConfig {
  dangerRadius: number;           // Radius to avoid dangers
  dangerCostPerTile: number;      // Base cost per tile near danger
  lightCostMultiplier: number;    // Cost multiplier for lit tiles
  crowdCost: number;              // Cost for being near others
  ventCostMultiplier: number;     // Cost multiplier for vents (< 1 = faster)
}

/**
 * Default pathing cost config
 */
export const DEFAULT_PATHING_CONFIG: PathingCostConfig = {
  dangerRadius: 4,
  dangerCostPerTile: 50,
  lightCostMultiplier: 20,
  crowdCost: 30,
  ventCostMultiplier: 0.5,
};

/**
 * Calculate the movement cost for a tile based on danger, light, and crowd factors.
 * Uses integer arithmetic (*100) for determinism.
 */
function tileCost(tile: Vec2, ctx: PathingCostContext, canUseVents: boolean): number {
  let cost = 100; // base (scaled by 100)

  // ventCost: vents are shortcuts
  const tileType = ctx.map.tiles[tile.y]?.[tile.x];
  if (tileType === 'VENT' && canUseVents) {
    cost = Math.floor(100 * ctx.config.ventCostMultiplier);
  }

  // dangerCost: near danger sources
  for (const danger of ctx.dangers) {
    const dist = manhattan(tile, danger.pos);
    if (dist <= ctx.config.dangerRadius) {
      const baseDanger = ctx.config.dangerCostPerTile * (ctx.config.dangerRadius + 1 - dist);
      cost += Math.floor(baseDanger * danger.dangerMultiplier * 100);
    }
  }

  // lightCost: lit tiles
  if (ctx.lightOverlay) {
    const idx = tile.y * ctx.map.width + tile.x;
    const lightValue = ctx.lightOverlay[idx] || 0; // 0-1000
    cost += Math.floor((lightValue / 1000) * ctx.config.lightCostMultiplier * 100);
  }

  // crowdCost: near other agents
  for (const other of ctx.crowdPositions) {
    if (manhattan(tile, other) <= 1) {
      cost += ctx.config.crowdCost * 100;
    }
  }

  // Ensure cost is never negative
  return Math.max(cost, 1);
}

/**
 * Deterministic tie-breaking comparator for A* nodes.
 */
function compareNodes(
  a: { key: string; f: number; g: number; h: number },
  b: { key: string; f: number; g: number; h: number }
): number {
  if (a.f !== b.f) return a.f - b.f;
  if (a.h !== b.h) return a.h - b.h;
  if (a.g !== b.g) return a.g - b.g;
  return a.key.localeCompare(b.key);
}

/**
 * A* pathfinding with dynamic cost overlays (danger, light, crowd).
 * Produces identical paths for identical inputs (deterministic).
 *
 * Returns array of positions from start (exclusive) to goal (inclusive).
 * Returns empty array if no path exists.
 */
export function findPathWithCosts(
  from: Vec2,
  to: Vec2,
  ctx: PathingCostContext,
  canUseVents: boolean = false
): Vec2[] {
  // Validate positions
  if (from.x < 0 || from.x >= ctx.map.width || from.y < 0 || from.y >= ctx.map.height) {
    return [];
  }
  if (to.x < 0 || to.x >= ctx.map.width || to.y < 0 || to.y >= ctx.map.height) {
    return [];
  }
  if (!canWalk(ctx.map, to)) return [];
  if (!canWalk(ctx.map, from)) return [];
  if (from.x === to.x && from.y === to.y) return [];

  interface Node {
    pos: Vec2;
    g: number;
    h: number;
    f: number;
  }

  const openSet = new Map<string, Node>();
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, string>();

  const startKey = vecKey(from);
  const h = manhattan(from, to) * 100;
  openSet.set(startKey, { pos: from, g: 0, h, f: h });

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

    // Check neighbors in deterministic order
    for (const dir of NEIGHBOR_ORDER) {
      const neighbor: Vec2 = { x: current.pos.x + dir.x, y: current.pos.y + dir.y };

      if (neighbor.x < 0 || neighbor.x >= ctx.map.width ||
          neighbor.y < 0 || neighbor.y >= ctx.map.height) {
        continue;
      }

      const row = ctx.map.tiles[neighbor.y];
      if (!row) continue;
      const tile = row[neighbor.x];
      if (!tile) continue;
      const isWalkableNeighbor = canUseVents ? canUseVent(tile) : isWalkable(tile);
      if (!isWalkableNeighbor) continue;

      const neighborKey = vecKey(neighbor);
      if (closedSet.has(neighborKey)) continue;

      const moveCost = tileCost(neighbor, ctx, canUseVents);
      const g = current.g + moveCost;
      const existing = openSet.get(neighborKey);

      if (!existing || g < existing.g) {
        const hNeighbor = manhattan(neighbor, to) * 100;
        cameFrom.set(neighborKey, currentKey);
        openSet.set(neighborKey, { pos: neighbor, g, h: hNeighbor, f: g + hNeighbor });
      }
    }
  }

  return [];
}
