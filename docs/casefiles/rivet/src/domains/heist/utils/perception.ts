/**
 * Perception Utils - Light and Smoke Overlay Computation
 *
 * perception-systems Tasks 005 (light), 006 (light-vision), 007 (smoke), 008 (smoke-vision)
 */

import type { LightEmitter, SmokeSource, Vec2, TileType } from '../types.js';
import { DEFAULT_LIGHT_CONFIG } from '../config.js';

/**
 * Compute light overlay from light emitters.
 *
 * @param width - Facility width
 * @param height - Facility height
 * @param emitters - Array of light emitters
 * @param disabledDomains - Set of power domain IDs that are disabled
 * @returns Uint16Array with light values 0-1000 for each tile
 */
export function computeLightOverlay(
  width: number,
  height: number,
  emitters: LightEmitter[],
  disabledDomains: Set<string>
): Uint16Array {
  const overlay = new Uint16Array(width * height);

  // Fill with ambient light
  overlay.fill(DEFAULT_LIGHT_CONFIG.ambientLevel);

  for (const emitter of emitters) {
    // Skip if powered by a disabled domain
    if (emitter.poweredBy && disabledDomains.has(emitter.poweredBy)) {
      continue;
    }

    // Skip if emitter position is out of bounds (ERR-1)
    if (
      emitter.position.x < 0 ||
      emitter.position.x >= width ||
      emitter.position.y < 0 ||
      emitter.position.y >= height
    ) {
      // Could log warning here: "Light emitter at ({x},{y}) out of bounds"
      continue;
    }

    // Apply light within radius
    for (let dx = -emitter.radius; dx <= emitter.radius; dx++) {
      for (let dy = -emitter.radius; dy <= emitter.radius; dy++) {
        const x = emitter.position.x + dx;
        const y = emitter.position.y + dy;

        // Skip out of bounds (EC-2)
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);

        // Skip if outside circular radius
        if (dist > emitter.radius) continue;

        let contribution: number;
        if (emitter.falloff === 'LINEAR') {
          // Linear falloff: full intensity at center, zero at edge
          contribution = Math.floor(emitter.intensity * (1 - dist / emitter.radius));
        } else {
          // STEP falloff: full intensity in inner ring, half in outer
          const halfRadius = emitter.radius / 2;
          const halfIntensity = Math.floor(emitter.intensity / 2);
          contribution = dist <= halfRadius ? emitter.intensity : halfIntensity;
        }

        const idx = y * width + x;
        // Stack light values, cap at maxLevel (EC-1)
        const currentValue = overlay[idx] ?? 0;
        overlay[idx] = Math.min(DEFAULT_LIGHT_CONFIG.maxLevel, currentValue + contribution);
      }
    }
  }

  return overlay;
}

/**
 * Compute smoke overlay from active smoke sources.
 *
 * @param width - Facility width
 * @param height - Facility height
 * @param sources - Array of smoke sources
 * @param currentTick - Current tick index for expiry check
 * @returns Uint16Array with smoke values 0-1000 for each tile
 */
export function computeSmokeOverlay(
  width: number,
  height: number,
  sources: SmokeSource[],
  currentTick: number
): Uint16Array {
  const overlay = new Uint16Array(width * height);

  // No ambient smoke - starts at 0

  // Filter to only active sources (AC-3)
  const activeSources = sources.filter(s => s.untilTick > currentTick);

  for (const source of activeSources) {
    // Skip if source position is out of bounds
    if (
      source.position.x < 0 ||
      source.position.x >= width ||
      source.position.y < 0 ||
      source.position.y >= height
    ) {
      continue;
    }

    // Apply smoke within radius
    for (let dx = -source.radius; dx <= source.radius; dx++) {
      for (let dy = -source.radius; dy <= source.radius; dy++) {
        const x = source.position.x + dx;
        const y = source.position.y + dy;

        // Skip out of bounds (EC-2)
        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);

        // Skip if outside circular radius
        if (dist > source.radius) continue;

        let contribution: number;
        if (source.falloff === 'LINEAR') {
          // Linear falloff: full intensity at center, zero at edge
          contribution = Math.floor(source.intensity * (1 - dist / source.radius));
        } else {
          // CONSTANT: same intensity throughout radius
          contribution = source.intensity;
        }

        // Clamp contribution to ensure non-negative (ERR-1)
        contribution = Math.max(0, contribution);

        const idx = y * width + x;
        // Stack smoke values, cap at 1000 (EC-1)
        const currentValue = overlay[idx] ?? 0;
        overlay[idx] = Math.min(1000, currentValue + contribution);
      }
    }
  }

  return overlay;
}

// =============================================================================
// Task 006: Light Factor for Vision Integration
// =============================================================================

/**
 * Get light factor for visibility calculation.
 * Per AH04 Section 5.4: lightFactor(L) = 0.35 + 0.65*L
 * where L is light level normalized to 0-1 (level / 1000)
 *
 * @param position - Tile position to check
 * @param lightOverlay - Light overlay array (Uint16Array)
 * @param width - Facility width
 * @returns Light factor between 0.35 and 1.0
 */
export function getLightFactor(
  position: Vec2,
  lightOverlay: Uint16Array | undefined,
  width: number
): number {
  // Graceful fallback when overlay not initialized (ERR-1)
  if (!lightOverlay) {
    // Return factor for ambient light (0.2)
    return 0.35 + 0.65 * (DEFAULT_LIGHT_CONFIG.ambientLevel / 1000);
  }

  const idx = position.y * width + position.x;
  const lightLevel = (lightOverlay[idx] ?? DEFAULT_LIGHT_CONFIG.ambientLevel) / 1000; // 0-1

  // Light factor formula from AH04 Section 5.4
  // "lightFactor(L) = 0.35 + 0.65*L"
  return 0.35 + 0.65 * lightLevel;
}

// =============================================================================
// Task 008: Smoke Factor for Vision Integration
// =============================================================================

/**
 * Get smoke factor for visibility calculation.
 * Per AH04 Section 5.4: smokeFactor(S) = 1.0 - 0.85*S
 * where S is smoke level normalized to 0-1 (level / 1000)
 *
 * @param position - Tile position to check
 * @param smokeOverlay - Smoke overlay array (Uint16Array)
 * @param width - Facility width
 * @returns Smoke factor between 0.15 and 1.0
 */
export function getSmokeFactor(
  position: Vec2,
  smokeOverlay: Uint16Array | undefined,
  width: number
): number {
  // Graceful fallback when overlay not initialized (ERR-1)
  if (!smokeOverlay) {
    // No smoke = factor 1.0
    return 1.0;
  }

  const idx = position.y * width + position.x;
  const smokeLevel = (smokeOverlay[idx] ?? 0) / 1000; // 0-1

  // Smoke factor formula from AH04 Section 5.4
  // "smokeFactor(S) = 1.0 - 0.85*S"
  return 1.0 - 0.85 * smokeLevel;
}

/**
 * Bresenham's line algorithm with smoke overlay awareness.
 * Returns true if there is clear LOS from 'from' to 'to'.
 * High smoke (> 800) blocks LOS entirely.
 *
 * @param from - Starting position
 * @param to - Target position
 * @param tiles - Tile grid for wall checking
 * @param smokeOverlay - Smoke overlay array
 * @param width - Facility width
 * @returns true if LOS exists, false if blocked by wall or heavy smoke
 */
export function hasLineOfSightWithSmoke(
  from: Vec2,
  to: Vec2,
  tiles: TileType[][],
  smokeOverlay: Uint16Array | undefined,
  width: number
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
      if (tile === undefined || tile === 'WALL') {
        return false;
      }

      // Check smoke density (AC-2: high smoke blocks LOS)
      // Threshold: > 800 blocks LOS
      if (smokeOverlay) {
        const idx = y0 * width + x0;
        const smokeLevel = smokeOverlay[idx] ?? 0;
        if (smokeLevel > 800) {
          return false;
        }
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
