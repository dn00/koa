/**
 * Heist Kernel - Noise Propagation Utilities
 *
 * Per AH04 Section 6: BFS noise propagation with wall dampening.
 */

import type { Vec2, TileType, HeistMap, ModulesState } from '../types.js';
import { getNoiseDampening } from './modules.js';

/** Default noise attenuation per tile of travel */
const BASE_DISTANCE_PENALTY = 10;

/** Penalty when noise passes through a wall-adjacent boundary */
const WALL_PENALTY = 25;

/** Penalty when noise passes through a closed door */
const DOOR_PENALTY = 15;

/**
 * Propagate noise from a source position using BFS.
 * Returns a map of positions to noise intensity at that position.
 *
 * Per AH04 Section 6.2:
 * - Start at sourceTile with intensity = baseLoudness
 * - Each neighbor decreases by distance penalty
 * - Additional penalty for walls/doors
 * - Stop when intensity <= 0
 *
 * @param source - Source position of noise
 * @param baseLoudness - Initial noise level (0-100)
 * @param map - The facility map
 * @param modules - Module state for NOISE_DAMPENING effect
 */
export function propagateNoise(
  source: Vec2,
  baseLoudness: number,
  map: HeistMap,
  modules?: ModulesState
): Map<string, number> {
  const result = new Map<string, number>();
  const posKey = (p: Vec2) => `${p.x},${p.y}`;

  // Apply NOISE_DAMPENING module effect - increases wall penalty
  const extraWalls = getNoiseDampening(modules);
  const effectiveWallPenalty = WALL_PENALTY + (extraWalls * WALL_PENALTY);

  // BFS queue: [position, current intensity]
  const queue: Array<{ pos: Vec2; intensity: number }> = [
    { pos: source, intensity: baseLoudness },
  ];
  const visited = new Set<string>();
  visited.add(posKey(source));
  result.set(posKey(source), baseLoudness);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { pos, intensity } = current;

    // Check all 4 neighbors
    const neighbors = [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 },
    ];

    for (const neighbor of neighbors) {
      const key = posKey(neighbor);
      if (visited.has(key)) continue;

      // Check bounds
      if (
        neighbor.x < 0 ||
        neighbor.x >= map.width ||
        neighbor.y < 0 ||
        neighbor.y >= map.height
      ) {
        continue;
      }

      const tile = map.tiles[neighbor.y]?.[neighbor.x];
      if (!tile) continue;

      // Calculate attenuation
      let attenuation = BASE_DISTANCE_PENALTY;

      // Wall blocks sound significantly
      if (tile === 'WALL') {
        attenuation += effectiveWallPenalty;
      }

      // Door dampens sound
      if (tile === 'DOOR') {
        attenuation += DOOR_PENALTY;
      }

      const newIntensity = intensity - attenuation;

      // Only propagate if intensity is still meaningful
      if (newIntensity > 0) {
        visited.add(key);
        result.set(key, newIntensity);
        queue.push({ pos: neighbor, intensity: newIntensity });
      }
    }
  }

  return result;
}

/**
 * Check if a guard at a given position can hear noise.
 *
 * @param guardPos - Guard's position
 * @param noiseField - Map of positions to noise intensity
 * @param hearingThreshold - Minimum intensity to hear (default 20)
 */
export function canHearNoise(
  guardPos: Vec2,
  noiseField: Map<string, number>,
  hearingThreshold: number = 20
): { canHear: boolean; intensity: number } {
  const key = `${guardPos.x},${guardPos.y}`;
  const intensity = noiseField.get(key) ?? 0;
  return {
    canHear: intensity >= hearingThreshold,
    intensity,
  };
}

/**
 * Find the approximate source of noise from a guard's perspective.
 * Returns the position with highest intensity within a radius.
 */
export function findNoiseSource(
  guardPos: Vec2,
  noiseField: Map<string, number>,
  searchRadius: number = 5
): Vec2 | null {
  let maxIntensity = 0;
  let maxPos: Vec2 | null = null;

  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const pos = { x: guardPos.x + dx, y: guardPos.y + dy };
      const key = `${pos.x},${pos.y}`;
      const intensity = noiseField.get(key) ?? 0;

      if (intensity > maxIntensity) {
        maxIntensity = intensity;
        maxPos = pos;
      }
    }
  }

  return maxPos;
}
