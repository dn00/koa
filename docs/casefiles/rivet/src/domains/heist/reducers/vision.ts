/**
 * Heist Kernel - Vision Reducers
 *
 * Handle vision-related events including detection accumulator and guard state transitions.
 * Task 003: Camera detection events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type {
  HeistState,
  GuardComponent,
  CrewComponent,
  EntityId,
} from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type {
  CrewSpottedPayload,
  CrewLostPayload,
  CrewNoticedPayload,
  DetectionAccumUpdatedPayload,
  CrewNoticedByCameraPayload,
  CrewSpottedByCameraPayload,
  CrewLostByCameraPayload,
  CameraDetectionAccumUpdatedPayload,
} from '../events.js';

/**
 * Register vision reducers with the registry.
 */
export function registerVisionReducers(registry: ReducerRegistry): void {
  // Core detection reducers (accumulator-based)
  registry.register(HEIST_EVENTS.DETECTION_ACCUM_UPDATED, detectionAccumUpdatedReducer);
  registry.register(HEIST_EVENTS.CREW_NOTICED, crewNoticedReducer);
  registry.register(HEIST_EVENTS.CREW_SPOTTED, crewSpottedReducer);
  registry.register(HEIST_EVENTS.CREW_LOST, crewLostReducer);

  // Camera detection reducers (Task 003)
  registry.register(HEIST_EVENTS.CAMERA_DETECTION_ACCUM_UPDATED, cameraDetectionAccumUpdatedReducer);
  registry.register(HEIST_EVENTS.CREW_NOTICED_BY_CAMERA, crewNoticedByCameraReducer);
  registry.register(HEIST_EVENTS.CREW_SPOTTED_BY_CAMERA, crewSpottedByCameraReducer);
  registry.register(HEIST_EVENTS.CREW_LOST_BY_CAMERA, crewLostByCameraReducer);
}

/**
 * Create a new ReducerRegistry with vision reducers.
 */
export function createVisionReducers(): ReducerRegistry {
  const { ReducerRegistry } = require('../kernel.js');
  const registry = new ReducerRegistry();
  registerVisionReducers(registry);
  return registry;
}

/**
 * Handle DETECTION_ACCUM_UPDATED event.
 * Updates the guard's detection accumulator for a specific crew target.
 * Manages noticedTargets Set based on threshold crossings.
 */
function detectionAccumUpdatedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as DetectionAccumUpdatedPayload;
  const { guardId, crewId, value, crossed } = payload;

  const guard = state.entities[guardId];
  if (!guard) return;

  const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
  if (!guardComp) return;

  // Initialize if missing (defensive)
  if (!guardComp.detectionAccum) {
    guardComp.detectionAccum = {};
  }
  if (!guardComp.noticedTargets) {
    guardComp.noticedTargets = new Set();
  }

  // Update the accumulator value
  guardComp.detectionAccum[crewId] = value;

  // Manage noticedTargets Set based on threshold crossings
  if (crossed === 'NOTICED') {
    guardComp.noticedTargets.add(crewId);
  } else if (crossed === 'LOST') {
    guardComp.noticedTargets.delete(crewId);
  }
}

/**
 * Handle CREW_NOTICED event.
 * Transitions guards from PATROL to INVESTIGATE state.
 * Per Task 003: NOTICED triggers INVESTIGATE from PATROL only.
 */
function crewNoticedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewNoticedPayload;
  const { guardId, crewId, pos } = payload;

  const guard = state.entities[guardId];
  if (!guard) return;

  const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
  if (!guardComp) return;

  // Update lastSeen for investigation
  guardComp.lastSeen = { pos: { ...pos }, tick: state.tickIndex };

  // NOTICED triggers INVESTIGATE from PATROL only
  // (SPOTTED handles escalation to PURSUE)
  if (guardComp.state === 'PATROL') {
    guardComp.state = 'INVESTIGATE';
    guardComp.alertTarget = { ...pos };
  }

  // Note: Do NOT set crew.isSpotted on NOTICED - that's only for SPOTTED
}

/**
 * Handle CREW_SPOTTED event.
 * Per Task 003: SPOTTED always transitions to PURSUE (no alert level check).
 * Accumulator crossing 70 = definitive sighting.
 */
function crewSpottedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewSpottedPayload;
  const { guardId, crewId, pos } = payload;

  // Update guard
  const guard = state.entities[guardId];
  if (guard) {
    const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
    if (guardComp) {
      guardComp.lastSeen = { pos: { ...pos }, tick: state.tickIndex };

      // SPOTTED always transitions to PURSUE (accumulator 70+ = definitive sighting)
      guardComp.state = 'PURSUE';
      guardComp.alertTarget = { ...pos };
    }
  }

  // Update crew's spotted state
  const crew = state.entities[crewId];
  if (crew) {
    const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
    if (crewComp) {
      // Autopause on first spotting
      if (!crewComp.isSpotted) {
        state.shouldPause = true;
        state.pauseReason = `SPOTTED by ${guardId}!`;
      }
      crewComp.isSpotted = true;
    }
  }
}

/**
 * Handle CREW_LOST event.
 * Per Task 003: CREW_LOST does NOT change guard state - guard continues investigating.
 * This allows recovery when breaking LOS.
 */
function crewLostReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewLostPayload;
  const { crewId } = payload;

  // Update crew's spotted state only
  // Note: Guard keeps INVESTIGATE state and alertTarget
  const crew = state.entities[crewId];
  if (crew) {
    const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
    if (crewComp) {
      crewComp.isSpotted = false;
    }
  }
}

// === CAMERA DETECTION REDUCERS (Task 003) ===

/**
 * Handle CAMERA_DETECTION_ACCUM_UPDATED event.
 * Updates the camera's detection accumulator for a specific crew target.
 * Camera state is stored in HeistState.cameras, not entity components.
 */
function cameraDetectionAccumUpdatedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CameraDetectionAccumUpdatedPayload;
  const { cameraId, crewId, value, crossed } = payload;

  const cameraState = state.cameras[cameraId];
  if (!cameraState) return;

  // Initialize if missing (defensive)
  if (!cameraState.detectionAccum) {
    cameraState.detectionAccum = {};
  }
  if (!cameraState.noticedTargets) {
    cameraState.noticedTargets = new Set();
  }

  // Update the accumulator value
  cameraState.detectionAccum[crewId] = value;

  // Manage noticedTargets Set based on threshold crossings
  if (crossed === 'NOTICED') {
    cameraState.noticedTargets.add(crewId);
  } else if (crossed === 'LOST') {
    cameraState.noticedTargets.delete(crewId);
  }
}

/**
 * Handle CREW_NOTICED_BY_CAMERA event.
 * Camera noticing doesn't transition guards directly, but can contribute to alert.
 */
function crewNoticedByCameraReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewNoticedByCameraPayload;
  // Camera notice events are logged but don't directly affect guard state
  // They contribute to alert via the alert system (AC-5)
}

/**
 * Handle CREW_SPOTTED_BY_CAMERA event.
 * AC-5: Camera spotted contributes to alert (same as guard spotted).
 * Sets crew.isSpotted = true (camera confirmation of crew location).
 */
function crewSpottedByCameraReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewSpottedByCameraPayload;
  const { cameraId, crewId, pos } = payload;

  // Update crew's spotted state (camera has confirmed sighting)
  const crew = state.entities[crewId];
  if (crew) {
    const crewComp = crew.components['heist.crew'] as CrewComponent | undefined;
    if (crewComp) {
      // Autopause on first spotting by camera
      if (!crewComp.isSpotted) {
        state.shouldPause = true;
        state.pauseReason = `SPOTTED by camera ${cameraId}!`;
      }
      crewComp.isSpotted = true;
    }
  }

  // Note: Alert contribution is handled by the alert system checking isSpotted
}

/**
 * Handle CREW_LOST_BY_CAMERA event.
 * Camera losing sight doesn't clear isSpotted (other sensors may still see).
 */
function crewLostByCameraReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CrewLostByCameraPayload;
  // Camera lost events are logged but don't directly clear isSpotted
  // The guard/camera that still has LOS keeps isSpotted = true
}
