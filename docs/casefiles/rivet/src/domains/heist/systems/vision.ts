/**
 * Heist Kernel - Vision System
 *
 * Checks guard line-of-sight and emits detection events based on accumulator.
 * Per AH04 Section 5.4-5.5: detection uses 0-100 accumulator with gain/decay.
 * Per Task 008: Applies stance visibility multiplier to detection gain.
 * Per Task 003: Also processes cameras as vision sensors.
 * Per Task 004: Implements sweeping camera behavior.
 * Per Task 009: Adds why payloads to CREW_SPOTTED events.
 * Per Task 011: Adds ENTERED_CAMERA_CONE events for triggers.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  GuardComponent,
  CrewComponent,
  CrewStance,
  Vec2,
  EntityId,
  CameraComponent,
  CameraState,
  HeistState,
  SweepPattern,
} from '../types.js';
import { manhattan } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { canGuardSee, isInSmoke, isShadowTile, hasLineOfSight, isInVisionCone } from '../utils/vision.js';
import { getShadowBonus, getCameraConfirmMultiplier } from '../utils/modules.js';
import { getHeatEffectMultiplier } from '../utils/heat.js';
import type { HeatLevel, RuntimeConfig } from '../types.js';
import { DEFAULT_CAMERA_CONFIG } from '../config.js';

/**
 * Update sweeping cameras - rotates them according to sweep pattern.
 * Task 004: Called at start of vision system before detection checks.
 *
 * AC-1: Sweeping camera rotates by degreesPerTick each tick.
 * AC-2: Direction reverses at boundaries (oscillates).
 * AC-3: Deterministic rotation (no RNG).
 * EC-1: Single-degree range stays fixed.
 * EC-2: Disabled cameras still update facing.
 * EC-3: Looped cameras still update facing.
 * ERR-1: Missing sweepPattern is treated as FIXED (logs error).
 */
function updateSweepingCameras(ctx: SystemContext): void {
  const cameras = ctx.getEntitiesByType('camera');
  const state = ctx.state;

  for (const camera of cameras) {
    const cameraComp = camera.components['heist.camera'] as CameraComponent | undefined;
    if (!cameraComp) continue;

    // Only process SWEEPING cameras
    if (cameraComp.cameraType !== 'SWEEPING') continue;

    // ERR-1: Missing sweep pattern - treat as FIXED (skip sweep update)
    const pattern = cameraComp.sweepPattern;
    if (!pattern) {
      // Log error: "SWEEPING camera {id} missing sweepPattern"
      continue;
    }

    // Get camera state
    const cameraState = state.cameras[camera.id];
    if (!cameraState) continue;

    // EC-1: Single-degree range stays fixed
    if (pattern.minFacing === pattern.maxFacing) {
      cameraState.currentFacing = pattern.minFacing;
      continue;
    }

    // Calculate new facing (EC-2, EC-3: Update even for disabled/looped cameras)
    let newFacing = cameraState.currentFacing + (pattern.degreesPerTick * pattern.direction);

    // AC-2: Reverse at boundaries
    if (newFacing >= pattern.maxFacing) {
      newFacing = pattern.maxFacing;
      pattern.direction = -1;
    } else if (newFacing <= pattern.minFacing) {
      newFacing = pattern.minFacing;
      pattern.direction = 1;
    }

    // Update camera state
    cameraState.currentFacing = newFacing;
  }
}

/**
 * Check if position is in camera cone (for ENTERED_CAMERA_CONE events).
 * Task 011: Returns true if position is within camera FOV and range.
 */
function isInCameraCone(
  cameraPos: Vec2,
  cameraFacingDegrees: number,
  targetPos: Vec2,
  fovDegrees: number,
  range: number,
  cameraType: 'FIXED' | 'DOME' | 'SWEEPING'
): boolean {
  const dist = manhattan(cameraPos, targetPos);

  // Out of range
  if (dist > range || dist === 0) {
    return false;
  }

  // DOME cameras have 360 FOV
  if (cameraType === 'DOME') {
    return true;
  }

  // Convert camera facing degrees to direction vector
  const facingRad = (cameraFacingDegrees * Math.PI) / 180;
  const cameraFacingVec: Vec2 = {
    x: Math.sin(facingRad),
    y: -Math.cos(facingRad),
  };

  return isInVisionCone(cameraPos, cameraFacingVec, targetPos, fovDegrees, range);
}

/**
 * Get visibility multiplier based on crew stance.
 * Per Task 008: SNEAK = 0.7, SPRINT = 1.3, NORMAL = 1.0
 */
function getStanceVisibilityMultiplier(
  stance: CrewStance | undefined,
  stanceConfig: { sneak: { visibilityMultiplier: number }; sprint: { visibilityMultiplier: number } } | undefined
): number {
  if (!stance || !stanceConfig) return 1.0;

  switch (stance) {
    case 'SNEAK':
      return stanceConfig.sneak.visibilityMultiplier;
    case 'SPRINT':
      return stanceConfig.sprint.visibilityMultiplier;
    case 'NORMAL':
    default:
      return 1.0;
  }
}

/**
 * Compute visibility score (0-1) based on environmental factors.
 * Per AH04 Section 5.4:
 * v = baseVisibility * lightFactor * smokeFactor * coverFactor * stanceFactor * distanceFactor
 */
function getVisibilityScore(
  guardPos: Vec2,
  guardFacing: Vec2,
  targetPos: Vec2,
  tiles: import('../types.js').TileType[][],
  config: {
    visionRange: number;
    visionAngle: number;
    peripheralRange: number;
    lightsOut: boolean;
    smokeZones: { pos: Vec2; until: number }[];
    currentTick: number;
    smokeRadius: number;
    shadowBonus: number;
    heatLevel: HeatLevel;
    heatConfig: RuntimeConfig;
  }
): { canSee: boolean; visibility: number; factors: { light: number; smoke: number; cover: number; stance: number; distance: number }; hasLOS: boolean; inFOV: boolean; dist: number } {
  const {
    visionRange,
    visionAngle,
    peripheralRange,
    lightsOut,
    smokeZones,
    currentTick,
    smokeRadius,
    shadowBonus,
    heatLevel,
    heatConfig,
  } = config;

  const dist = manhattan(guardPos, targetPos);

  // Check smoke first - completely blocks vision
  const inSmoke = isInSmoke(targetPos, smokeZones, currentTick, smokeRadius);
  if (inSmoke) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 0, cover: 1, stance: 1, distance: 1 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // Calculate effective range considering lights out
  let effectiveRange = lightsOut ? Math.floor(visionRange / 2) : visionRange;

  // Apply shadow tile concealment
  const isInShadow = isShadowTile(targetPos, tiles);
  if (isInShadow) {
    const baseCoverReduction = 0.3;
    const coverBonus = baseCoverReduction * shadowBonus;
    // Apply heat multiplier (Task 005: cover is weaker at 50+ heat)
    const heatCoverMultiplier = getHeatEffectMultiplier(heatLevel, 'coverBonusMultiplier', heatConfig);
    const effectiveCoverBonus = coverBonus * heatCoverMultiplier;
    effectiveRange = Math.floor(effectiveRange * (1.0 - Math.min(0.7, effectiveCoverBonus)));
  }

  // Out of range
  if (dist > effectiveRange || dist === 0) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 0 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // Check LOS
  const hasLOS = hasLineOfSight(guardPos, targetPos, tiles);
  if (!hasLOS) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 1 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // Check if in peripheral vision (always visible if adjacent with LOS)
  const inPeripheral = dist > 0 && dist <= peripheralRange;

  // Check vision cone (unless in peripheral)
  let inFOV = inPeripheral;
  if (!inPeripheral) {
    inFOV = isInVisionCone(guardPos, guardFacing, targetPos, visionAngle, effectiveRange);
  }

  if (!inFOV) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 1 },
      hasLOS: true,
      inFOV: false,
      dist,
    };
  }

  // Calculate visibility factors
  // Per AH04 Section 5.4:
  // lightFactor = 0.35 + 0.65 * L (L=0 when lights out, L=1 normal)
  const lightFactor = lightsOut ? 0.35 : 1.0;

  // smokeFactor = 1.0 (already checked smoke above)
  const smokeFactor = 1.0;

  // coverFactor = isInCover ? (1.0 - coverBonus * heatMultiplier) : 1.0
  // Task 005: Apply heat multiplier to cover bonus
  const heatCoverMultiplier = getHeatEffectMultiplier(heatLevel, 'coverBonusMultiplier', heatConfig);
  const coverFactor = isInShadow ? (1.0 - 0.3 * shadowBonus * heatCoverMultiplier) : 1.0;

  // stanceFactor - would need crew stance info, use 1.0 for now
  // TODO: Get stance from crew component when available
  const stanceFactor = 1.0;

  // distanceFactor = 1.0 - (dist / range) * 0.5
  const distanceFactor = Math.max(0, 1.0 - (dist / effectiveRange) * 0.5);

  const visibility = Math.max(0, Math.min(1,
    lightFactor * smokeFactor * coverFactor * stanceFactor * distanceFactor
  ));

  return {
    canSee: true,
    visibility,
    factors: {
      light: lightFactor,
      smoke: smokeFactor,
      cover: coverFactor,
      stance: stanceFactor,
      distance: distanceFactor,
    },
    hasLOS: true,
    inFOV: true,
    dist,
  };
}

/**
 * Vision system - runs early in tick to detect crew visibility.
 * Implements detection accumulator per AH04 Section 5.5:
 * - Gain = visibility * gainRate when in LOS+FOV
 * - Decay = decayRate when NOT in LOS+FOV
 * - CREW_NOTICED at noticedThreshold (35)
 * - CREW_SPOTTED at spottedThreshold (70)
 * - CREW_LOST when decay below lostThreshold (25) after noticed
 */
export const visionSystem: SystemDefinition = {
  systemId: 'heist.vision',
  priority: 10, // Run early
  run(ctx: SystemContext) {
    const guards = ctx.getEntitiesByType('guard');
    const crew = ctx.getEntitiesByType('crew');
    const cameras = ctx.getEntitiesByType('camera');
    const state = ctx.state;
    const detectionConfig = ctx.config.detection;

    // Task 004: Update sweeping cameras at start of vision system
    updateSweepingCameras(ctx);

    // Get module effects
    const confirmMultiplier = getCameraConfirmMultiplier(state.modules);
    const shadowBonus = getShadowBonus(state.modules);

    // Task 011: Track previous cone status for ENTERED_CAMERA_CONE events
    // Build current cone status
    const currentConeStatus: Map<string, Set<string>> = new Map(); // crewId -> Set of cameraIds in cone
    for (const agent of crew) {
      const crewPos = agent.components['heist.position'] as PositionComponent | undefined;
      if (!crewPos) continue;

      const inCones = new Set<string>();
      for (const camera of cameras) {
        const cameraComp = camera.components['heist.camera'] as CameraComponent | undefined;
        const cameraPos = camera.components['heist.position'] as PositionComponent | undefined;
        const cameraState = state.cameras[camera.id];

        if (!cameraComp || !cameraPos || !cameraState) continue;

        // Check if crew is in camera cone (regardless of looped/disabled status)
        // EC-3: Looped cameras still have cones
        const inCone = isInCameraCone(
          cameraPos.pos,
          cameraState.currentFacing,
          crewPos.pos,
          cameraComp.fovDegrees,
          cameraComp.range,
          cameraComp.cameraType
        );

        if (inCone) {
          inCones.add(camera.id);
        }
      }
      currentConeStatus.set(agent.id, inCones);
    }

    // Task 011: Emit ENTERED_CAMERA_CONE events for cone entry transitions
    // EC-1: No trigger on first tick (spawning inside cone is not "entering")
    // Edge detection requires previous state - check if coneStatus exists
    const prevConeStatus = state.coneStatus;
    const isFirstTick = !prevConeStatus; // If no previous status, this is initialization

    // Clear recent cone entries from previous tick and store new ones
    const recentConeEntries: Array<{
      crewId: EntityId;
      cameraId: EntityId;
      distance: number;
      tick: number;
    }> = [];

    // Only emit events if we have previous state (not on first tick)
    if (!isFirstTick) {
      for (const [crewId, currentCones] of currentConeStatus) {
        const prevCones = prevConeStatus.get(crewId) ?? new Set<string>();

        // Find cameras that crew just entered
        for (const cameraId of currentCones) {
          if (!prevCones.has(cameraId)) {
            // Edge trigger: crew just entered this camera's cone
            const crewEntity = crew.find(c => c.id === crewId);
            const crewPos = crewEntity?.components['heist.position'] as PositionComponent | undefined;
            const cameraEntity = cameras.find(c => c.id === cameraId);
            const cameraPos = cameraEntity?.components['heist.position'] as PositionComponent | undefined;

            if (crewPos && cameraPos) {
              const distance = manhattan(cameraPos.pos, crewPos.pos);

              ctx.proposeEvent(HEIST_EVENTS.ENTERED_CAMERA_CONE, {
                crewId,
                cameraId,
                distance,
              }, { system: 'vision' });

              // Also store for trigger checking in next tick
              recentConeEntries.push({
                crewId: crewId as EntityId,
                cameraId: cameraId as EntityId,
                distance,
                tick: state.tickIndex,
              });
            }
          }
        }
      }
    }

    // Store cone status and entries for next tick (via state mutation)
    state.coneStatus = currentConeStatus;
    state.recentConeEntries = recentConeEntries;

    for (const guard of guards) {
      const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
      const guardPos = guard.components['heist.position'] as PositionComponent | undefined;

      if (!guardComp || !guardPos) continue;

      // Initialize detectionAccum if missing (defensive)
      if (!guardComp.detectionAccum) {
        guardComp.detectionAccum = {};
      }
      if (!guardComp.noticedTargets) {
        guardComp.noticedTargets = new Set();
      }

      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;

        if (!crewComp || !crewPos) continue;

        const crewId = agent.id as EntityId;

        // Get visibility info
        const visInfo = getVisibilityScore(
          guardPos.pos,
          guardPos.facing,
          crewPos.pos,
          state.map.tiles,
          {
            visionRange: guardComp.visionRange,
            visionAngle: guardComp.visionAngle,
            peripheralRange: 1,
            lightsOut: state.effects.lightsOut,
            smokeZones: state.effects.smokeZones,
            currentTick: state.tickIndex,
            smokeRadius: ctx.config.tokens.effects.SMOKE.radius,
            shadowBonus,
            // Task 005: Pass heatLevel and config for cover bonus modification
            heatLevel: state.heatLevel,
            heatConfig: ctx.config,
          }
        );

        const prevAccum = guardComp.detectionAccum[crewId] ?? 0;
        const wasNoticed = guardComp.noticedTargets.has(crewId);

        // Get stance visibility multiplier (Task 008)
        const stanceVisibilityMultiplier = getStanceVisibilityMultiplier(
          crewComp.stance,
          ctx.config.stance
        );

        let newAccum: number;
        if (visInfo.canSee) {
          // Apply CAMERA_CONFIRM_SLOWER module as gainRate multiplier
          const gainMultiplier = 1 / confirmMultiplier;
          // Apply stance visibility multiplier (Task 008: AC-1, AC-2, AC-3)
          newAccum = Math.min(100, prevAccum + visInfo.visibility * detectionConfig.gainRate * gainMultiplier * stanceVisibilityMultiplier);
        } else {
          newAccum = Math.max(0, prevAccum - detectionConfig.decayRate);
        }

        // Determine which threshold was crossed
        let crossed: 'NOTICED' | 'SPOTTED' | 'LOST' | null = null;

        // Check threshold crossings and emit events
        // CREW_NOTICED at noticedThreshold (only first time)
        if (prevAccum < detectionConfig.noticedThreshold && newAccum >= detectionConfig.noticedThreshold) {
          crossed = 'NOTICED';
          ctx.proposeEvent(HEIST_EVENTS.CREW_NOTICED, {
            guardId: guard.id,
            crewId: crewId,
            pos: { ...crewPos.pos },
            accumulator: newAccum,
            why: {
              dist: visInfo.dist,
              hasLOS: visInfo.hasLOS,
              inFOV: visInfo.inFOV,
              factors: {
                ...visInfo.factors,
                stance: stanceVisibilityMultiplier, // Task 008: Include stance factor
              },
              visibility: visInfo.visibility,
              detectBefore: prevAccum,
              detectAfter: newAccum,
            },
          }, { system: 'vision' });
        }

        // CREW_SPOTTED at spottedThreshold (Task 009: AC-3 - include why payload)
        if (prevAccum < detectionConfig.spottedThreshold && newAccum >= detectionConfig.spottedThreshold) {
          crossed = 'SPOTTED';
          ctx.proposeEvent(HEIST_EVENTS.CREW_SPOTTED, {
            guardId: guard.id,
            crewId: crewId,
            pos: { ...crewPos.pos },
            why: {
              dist: visInfo.dist,
              hasLOS: visInfo.hasLOS,
              inFOV: visInfo.inFOV,
              factors: {
                ...visInfo.factors,
                stance: stanceVisibilityMultiplier,
              },
              visibility: visInfo.visibility,
              detectBefore: prevAccum,
              detectAfter: newAccum,
            },
          }, { system: 'vision' });
        }

        // CREW_LOST when decay below lostThreshold after noticed
        if (wasNoticed && prevAccum >= detectionConfig.lostThreshold && newAccum < detectionConfig.lostThreshold) {
          crossed = 'LOST';
          ctx.proposeEvent(HEIST_EVENTS.CREW_LOST, {
            guardId: guard.id,
            crewId: crewId,
          }, { system: 'vision' });
        }

        // Emit DETECTION_ACCUM_UPDATED for every change
        if (newAccum !== prevAccum) {
          ctx.proposeEvent(HEIST_EVENTS.DETECTION_ACCUM_UPDATED, {
            guardId: guard.id,
            crewId: crewId,
            value: newAccum,
            crossed,
          }, { system: 'vision' });
        }
      }
    }

    // === CAMERA VISION PROCESSING (Task 003) ===
    // (cameras already fetched above for cone tracking)

    for (const camera of cameras) {
      const cameraComp = camera.components['heist.camera'] as CameraComponent | undefined;
      const cameraPos = camera.components['heist.position'] as PositionComponent | undefined;

      if (!cameraComp || !cameraPos) continue;

      // Get camera state
      const cameraState = state.cameras[camera.id];

      // ERR-1: Camera missing state - skip with warning
      if (!cameraState) {
        // Could log: `Camera ${camera.id} missing state, skipping`
        continue;
      }

      // AC-3: Skip looped cameras (Task 010)
      if (cameraState.loopedUntilTick && cameraState.loopedUntilTick > state.tickIndex) {
        continue;
      }

      // Skip disabled cameras
      if (!cameraState.enabled) {
        continue;
      }

      // Initialize detection state if missing
      if (!cameraState.detectionAccum) {
        cameraState.detectionAccum = {};
      }
      if (!cameraState.noticedTargets) {
        cameraState.noticedTargets = new Set();
      }

      for (const agent of crew) {
        const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
        const crewPos = agent.components['heist.position'] as PositionComponent | undefined;

        if (!crewComp || !crewPos) continue;

        const crewId = agent.id as EntityId;

        // Get camera visibility
        const cameraVisInfo = getCameraVisibilityScore(
          cameraPos.pos,
          cameraState.currentFacing,
          crewPos.pos,
          state.map.tiles,
          {
            fovDegrees: cameraComp.fovDegrees,
            range: cameraComp.range,
            cameraType: cameraComp.cameraType,
            lightsOut: state.effects.lightsOut,
            smokeZones: state.effects.smokeZones,
            currentTick: state.tickIndex,
            smokeRadius: ctx.config.tokens.effects.SMOKE.radius,
            shadowBonus,
            heatLevel: state.heatLevel,
            heatConfig: ctx.config,
          }
        );

        const prevAccum = cameraState.detectionAccum[crewId] ?? 0;
        const wasNoticed = cameraState.noticedTargets.has(crewId);

        // Get stance visibility multiplier (Task 008)
        const stanceVisibilityMultiplier = getStanceVisibilityMultiplier(
          crewComp.stance,
          ctx.config.stance
        );

        // Camera detection config (can be separate from guard config)
        const cameraGainRate = DEFAULT_CAMERA_CONFIG.detection.gainRate;
        const cameraDecayRate = DEFAULT_CAMERA_CONFIG.detection.decayRate;

        let newAccum: number;
        if (cameraVisInfo.canSee) {
          // Apply CAMERA_CONFIRM_SLOWER module as gainRate multiplier
          const gainMultiplier = 1 / confirmMultiplier;
          newAccum = Math.min(100, prevAccum + cameraVisInfo.visibility * cameraGainRate * gainMultiplier * stanceVisibilityMultiplier);
        } else {
          newAccum = Math.max(0, prevAccum - cameraDecayRate);
        }

        // Update accumulator in state
        cameraState.detectionAccum[crewId] = newAccum;

        // Determine which threshold was crossed
        let crossed: 'NOTICED' | 'SPOTTED' | 'LOST' | null = null;

        // AC-3: Camera emits distinct events
        // CREW_NOTICED_BY_CAMERA at noticedThreshold
        if (prevAccum < detectionConfig.noticedThreshold && newAccum >= detectionConfig.noticedThreshold) {
          crossed = 'NOTICED';
          cameraState.noticedTargets.add(crewId);
          ctx.proposeEvent(HEIST_EVENTS.CREW_NOTICED_BY_CAMERA, {
            cameraId: camera.id,
            crewId: crewId,
            pos: { ...crewPos.pos },
            accumulator: newAccum,
            why: {
              dist: cameraVisInfo.dist,
              hasLOS: cameraVisInfo.hasLOS,
              inFOV: cameraVisInfo.inFOV,
              factors: {
                ...cameraVisInfo.factors,
                stance: stanceVisibilityMultiplier,
              },
              visibility: cameraVisInfo.visibility,
              detectBefore: prevAccum,
              detectAfter: newAccum,
            },
          }, { system: 'vision' });
        }

        // CREW_SPOTTED_BY_CAMERA at spottedThreshold (Task 009: AC-3 - include why payload)
        if (prevAccum < detectionConfig.spottedThreshold && newAccum >= detectionConfig.spottedThreshold) {
          crossed = 'SPOTTED';
          ctx.proposeEvent(HEIST_EVENTS.CREW_SPOTTED_BY_CAMERA, {
            cameraId: camera.id,
            crewId: crewId,
            pos: { ...crewPos.pos },
            why: {
              dist: cameraVisInfo.dist,
              hasLOS: cameraVisInfo.hasLOS,
              inFOV: cameraVisInfo.inFOV,
              factors: {
                ...cameraVisInfo.factors,
                stance: stanceVisibilityMultiplier,
              },
              visibility: cameraVisInfo.visibility,
              detectBefore: prevAccum,
              detectAfter: newAccum,
            },
          }, { system: 'vision' });
        }

        // CREW_LOST_BY_CAMERA when decay below lostThreshold after noticed
        if (wasNoticed && prevAccum >= detectionConfig.lostThreshold && newAccum < detectionConfig.lostThreshold) {
          crossed = 'LOST';
          cameraState.noticedTargets.delete(crewId);
          ctx.proposeEvent(HEIST_EVENTS.CREW_LOST_BY_CAMERA, {
            cameraId: camera.id,
            crewId: crewId,
          }, { system: 'vision' });
        }

        // Emit CAMERA_DETECTION_ACCUM_UPDATED for every change
        if (newAccum !== prevAccum) {
          ctx.proposeEvent(HEIST_EVENTS.CAMERA_DETECTION_ACCUM_UPDATED, {
            cameraId: camera.id,
            crewId: crewId,
            value: newAccum,
            crossed,
          }, { system: 'vision' });
        }
      }
    }
  },
};

/**
 * Compute camera visibility score.
 * Similar to getVisibilityScore but uses camera-specific FOV handling.
 * AC-4: DOME cameras skip FOV check (360 degree coverage).
 */
function getCameraVisibilityScore(
  cameraPos: Vec2,
  cameraFacingDegrees: number,
  targetPos: Vec2,
  tiles: import('../types.js').TileType[][],
  config: {
    fovDegrees: number;
    range: number;
    cameraType: 'FIXED' | 'DOME' | 'SWEEPING';
    lightsOut: boolean;
    smokeZones: { pos: Vec2; until: number }[];
    currentTick: number;
    smokeRadius: number;
    shadowBonus: number;
    heatLevel: HeatLevel;
    heatConfig: RuntimeConfig;
  }
): { canSee: boolean; visibility: number; factors: { light: number; smoke: number; cover: number; stance: number; distance: number }; hasLOS: boolean; inFOV: boolean; dist: number } {
  const {
    fovDegrees,
    range,
    cameraType,
    lightsOut,
    smokeZones,
    currentTick,
    smokeRadius,
    shadowBonus,
    heatLevel,
    heatConfig,
  } = config;

  const dist = manhattan(cameraPos, targetPos);

  // EC-1: Check smoke first - completely blocks vision
  const inSmoke = isInSmoke(targetPos, smokeZones, currentTick, smokeRadius);
  if (inSmoke) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 0, cover: 1, stance: 1, distance: 1 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // Calculate effective range considering lights out
  let effectiveRange = lightsOut ? Math.floor(range / 2) : range;

  // Apply shadow tile concealment
  const isInShadow = isShadowTile(targetPos, tiles);
  if (isInShadow) {
    const baseCoverReduction = 0.3;
    const coverBonus = baseCoverReduction * shadowBonus;
    const heatCoverMultiplier = getHeatEffectMultiplier(heatLevel, 'coverBonusMultiplier', heatConfig);
    const effectiveCoverBonus = coverBonus * heatCoverMultiplier;
    effectiveRange = Math.floor(effectiveRange * (1.0 - Math.min(0.7, effectiveCoverBonus)));
  }

  // EC-2: Out of range (including max range boundary with reduced visibility)
  if (dist > effectiveRange || dist === 0) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 0 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // Check LOS
  const hasLOS = hasLineOfSight(cameraPos, targetPos, tiles);
  if (!hasLOS) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 1 },
      hasLOS: false,
      inFOV: false,
      dist,
    };
  }

  // AC-4: DOME cameras have 360 FOV - skip FOV check
  let inFOV = false;
  if (cameraType === 'DOME') {
    inFOV = true; // Always in FOV for DOME cameras
  } else {
    // Convert camera facing degrees to direction vector
    const facingRad = (cameraFacingDegrees * Math.PI) / 180;
    const cameraFacingVec: Vec2 = {
      x: Math.sin(facingRad),  // sin for x because 0 degrees = up
      y: -Math.cos(facingRad), // -cos for y because y increases downward
    };

    inFOV = isInVisionCone(cameraPos, cameraFacingVec, targetPos, fovDegrees, effectiveRange);
  }

  if (!inFOV) {
    return {
      canSee: false,
      visibility: 0,
      factors: { light: 1, smoke: 1, cover: 1, stance: 1, distance: 1 },
      hasLOS: true,
      inFOV: false,
      dist,
    };
  }

  // Calculate visibility factors
  const lightFactor = lightsOut ? 0.35 : 1.0;
  const smokeFactor = 1.0;
  const heatCoverMultiplier = getHeatEffectMultiplier(heatLevel, 'coverBonusMultiplier', heatConfig);
  const coverFactor = isInShadow ? (1.0 - 0.3 * shadowBonus * heatCoverMultiplier) : 1.0;
  const stanceFactor = 1.0;

  // EC-2: distanceFactor - reduced visibility at max range
  const distanceFactor = Math.max(0, 1.0 - (dist / effectiveRange) * 0.5);

  const visibility = Math.max(0, Math.min(1,
    lightFactor * smokeFactor * coverFactor * stanceFactor * distanceFactor
  ));

  return {
    canSee: true,
    visibility,
    factors: {
      light: lightFactor,
      smoke: smokeFactor,
      cover: coverFactor,
      stance: stanceFactor,
      distance: distanceFactor,
    },
    hasLOS: true,
    inFOV: true,
    dist,
  };
}
