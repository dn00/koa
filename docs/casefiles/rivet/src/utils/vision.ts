/**
 * RIVET - Vision Utilities
 *
 * Line-of-sight, vision cone, and peripheral vision calculations.
 * Game-agnostic algorithms for 2D grid-based visibility.
 */

import type { Vec2 } from '../types/core.js';
import { manhattan } from '../types/core.js';

// === TILE TYPES (adapt for your game) ===
export type TileType = 'FLOOR' | 'WALL' | 'DOOR' | 'SHADOW' | 'VENT' | 'COVER' | string;

/**
 * Check if a tile type blocks line of sight
 */
export function blocksLOS(tile: TileType): boolean {
  return tile === 'WALL' || tile === 'DOOR';
}

/**
 * Bresenham's line algorithm for line-of-sight checking.
 * Returns true if there is clear LOS from 'from' to 'to'.
 */
export function hasLineOfSight(
  from: Vec2,
  to: Vec2,
  tiles: TileType[][]
): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // Reached target
    if (x0 === x1 && y0 === y1) return true;

    // Check tile at current position (skip start position)
    if (!(x0 === from.x && y0 === from.y)) {
      const tile = tiles[y0]?.[x0];
      if (tile === undefined || blocksLOS(tile)) {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Door state for LOS with doors
 */
export interface DoorState {
  pos: Vec2;
  isOpen: boolean;
}

/**
 * Bresenham's line algorithm with door state awareness.
 * Returns true if there is clear LOS from 'from' to 'to'.
 * Closed doors block LOS, open doors allow LOS.
 */
export function hasLineOfSightWithDoors(
  from: Vec2,
  to: Vec2,
  tiles: TileType[][],
  doors: Record<string, DoorState>
): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    // Reached target
    if (x0 === x1 && y0 === y1) return true;

    // Check tile at current position (skip start position)
    if (!(x0 === from.x && y0 === from.y)) {
      const tile = tiles[y0]?.[x0];

      if (tile === undefined) return false;

      // Handle DOOR tiles - check door state
      if (tile === 'DOOR') {
        const doorId = `door_${x0}_${y0}`;
        const door = doors[doorId];
        // Closed door (or unknown door) blocks LOS
        if (!door || !door.isOpen) {
          return false;
        }
        // Open door allows LOS - continue checking
      } else if (tile === 'WALL') {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Check if target is within a vision cone.
 *
 * @param viewerPos - Viewer's position
 * @param viewerFacing - Viewer's facing direction (normalized or not)
 * @param targetPos - Target's position
 * @param angleDegs - Total vision cone angle in degrees
 * @param range - Maximum vision range
 */
export function isInVisionCone(
  viewerPos: Vec2,
  viewerFacing: Vec2,
  targetPos: Vec2,
  angleDegs: number,
  range: number
): boolean {
  const dist = manhattan(viewerPos, targetPos);
  if (dist > range || dist === 0) return false;

  const toTarget = {
    x: targetPos.x - viewerPos.x,
    y: targetPos.y - viewerPos.y,
  };

  const facingLen = Math.sqrt(viewerFacing.x ** 2 + viewerFacing.y ** 2);
  const toTargetLen = Math.sqrt(toTarget.x ** 2 + toTarget.y ** 2);

  // Handle zero-length facing (looking nowhere)
  if (facingLen === 0 || toTargetLen === 0) {
    return true; // Default to visible if no facing direction
  }

  // Dot product gives cos(angle)
  const dot =
    (viewerFacing.x * toTarget.x + viewerFacing.y * toTarget.y) /
    (facingLen * toTargetLen);

  const angleDeg = Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);

  // Check if within half-angle on each side
  const halfAngle = angleDegs / 2;
  return angleDeg <= halfAngle;
}

/**
 * Check if target is in peripheral vision (adjacent tiles).
 * Viewers can always see immediately adjacent tiles.
 */
export function isInPeripheral(
  viewerPos: Vec2,
  targetPos: Vec2,
  peripheralRange: number = 1
): boolean {
  const dist = manhattan(viewerPos, targetPos);
  return dist > 0 && dist <= peripheralRange;
}

/**
 * Get all tiles visible from a position within range.
 * Useful for debugging and UI visualization.
 */
export function getVisibleTiles(
  from: Vec2,
  range: number,
  tiles: TileType[][]
): Vec2[] {
  const visible: Vec2[] = [];
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const x = from.x + dx;
      const y = from.y + dy;

      // Skip out of bounds
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Skip origin
      if (dx === 0 && dy === 0) continue;

      // Check manhattan distance
      if (Math.abs(dx) + Math.abs(dy) > range) continue;

      const pos = { x, y };
      if (hasLineOfSight(from, pos, tiles)) {
        visible.push(pos);
      }
    }
  }

  return visible;
}

/**
 * Check if position is within a smoke zone.
 */
export function isInSmoke(
  pos: Vec2,
  smokeZones: { pos: Vec2; until: number }[],
  currentTick: number,
  smokeRadius: number = 2
): boolean {
  return smokeZones.some(
    (zone) =>
      manhattan(zone.pos, pos) <= smokeRadius && zone.until > currentTick
  );
}

/**
 * Check if a tile provides concealment (SHADOW or COVER).
 */
export function isShadowTile(pos: Vec2, tiles: TileType[][]): boolean {
  const tile = tiles[pos.y]?.[pos.x];
  return tile === 'SHADOW';
}

/**
 * Full visibility check configuration
 */
export interface VisibilityConfig {
  visionRange: number;
  visionAngle: number;
  peripheralRange: number;
  lightsOut: boolean;
  smokeZones: { pos: Vec2; until: number }[];
  currentTick: number;
  smokeRadius: number;
  shadowBonus?: number; // Multiplier for shadow concealment (default 1.0)
}

/**
 * Full visibility check for a viewer seeing a target.
 * Combines all visibility checks.
 * Applies shadow tile concealment bonus.
 */
export function canSee(
  viewerPos: Vec2,
  viewerFacing: Vec2,
  targetPos: Vec2,
  tiles: TileType[][],
  config: VisibilityConfig
): boolean {
  const {
    visionRange,
    visionAngle,
    peripheralRange,
    lightsOut,
    smokeZones,
    currentTick,
    smokeRadius,
    shadowBonus = 1.0,
  } = config;

  // Check if target is in smoke
  if (isInSmoke(targetPos, smokeZones, currentTick, smokeRadius)) {
    return false;
  }

  // Adjust range for lights out
  let effectiveRange = lightsOut
    ? Math.floor(visionRange / 2)
    : visionRange;

  // Apply shadow tile concealment (reduces effective range against target in shadow)
  if (isShadowTile(targetPos, tiles)) {
    const baseCoverReduction = 0.3; // Base 30% range reduction in shadow
    const coverBonus = baseCoverReduction * shadowBonus;
    effectiveRange = Math.floor(effectiveRange * (1.0 - Math.min(0.7, coverBonus)));
  }

  const dist = manhattan(viewerPos, targetPos);

  // Out of range entirely
  if (dist > effectiveRange) {
    return false;
  }

  // Peripheral vision (always works for adjacent)
  if (isInPeripheral(viewerPos, targetPos, peripheralRange)) {
    return hasLineOfSight(viewerPos, targetPos, tiles);
  }

  // Vision cone check
  if (!isInVisionCone(viewerPos, viewerFacing, targetPos, visionAngle, effectiveRange)) {
    return false;
  }

  // Final LOS check
  return hasLineOfSight(viewerPos, targetPos, tiles);
}
