/**
 * Heist Kernel - Tokens Reducers
 *
 * Handle TOKEN_ACTIVATED, TOKEN_EXPIRED, and CAMERA_LOOPED events.
 * Task 010: CAMERA_LOOPED reducer for LOOP_CAMERA token.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, Vec2, EntityId } from '../types.js';
import { vecEq } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { TokenActivatedPayload, TokenExpiredPayload, CameraLoopedPayload } from '../events.js';

/**
 * Register tokens reducers with the registry.
 */
export function registerTokensReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.TOKEN_ACTIVATED, tokenActivatedReducer);
  registry.register(HEIST_EVENTS.TOKEN_EXPIRED, tokenExpiredReducer);
  registry.register(HEIST_EVENTS.CAMERA_LOOPED, cameraLoopedReducer);
}

/**
 * Handle TOKEN_ACTIVATED event.
 */
function tokenActivatedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as TokenActivatedPayload & { manual?: boolean; targetCell?: Vec2 };
  const { tokenType, pos, expiresAt, targetCell } = payload;

  // Consume charge
  if (state.tokens.available[tokenType] > 0) {
    state.tokens.available[tokenType]--;
  }

  // Set cooldown
  state.tokens.cooldownUntil = state.tickIndex + state.config.tokens.cooldownTicks;

  // Clear pending token use if this was manual
  if (payload.manual) {
    state.pendingTokenUse = undefined;
    // Also clear pendingTokenFire
    state.pendingTokenFire = undefined;
  }

  // Apply effect
  switch (tokenType) {
    case 'LIGHTS':
      state.effects.lightsOut = true;
      state.effects.lightsOutUntil = expiresAt;
      break;

    case 'RADIO':
      state.effects.radioJammed = true;
      state.effects.radioJammedUntil = expiresAt;
      break;

    case 'SMOKE':
      state.effects.smokeZones.push({
        pos: { ...pos },
        until: expiresAt,
      });
      break;

    case 'DECOY':
      if (targetCell) {
        state.effects.decoyZones.push({
          pos: { ...targetCell },
          until: expiresAt,
        });
      }
      break;
  }
}

/**
 * Handle TOKEN_EXPIRED event.
 */
function tokenExpiredReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as TokenExpiredPayload & { pos?: Vec2 };
  const { tokenType, pos } = payload;

  switch (tokenType) {
    case 'LIGHTS':
      state.effects.lightsOut = false;
      state.effects.lightsOutUntil = 0;
      break;

    case 'RADIO':
      state.effects.radioJammed = false;
      state.effects.radioJammedUntil = 0;
      break;

    case 'SMOKE':
      // Remove expired smoke zones
      if (pos) {
        // Remove the specific smoke zone at this position
        state.effects.smokeZones = state.effects.smokeZones.filter(
          (zone) => !vecEq(zone.pos, pos)
        );
      } else {
        // Remove all expired
        state.effects.smokeZones = state.effects.smokeZones.filter(
          (zone) => zone.until > state.tickIndex
        );
      }
      break;

    case 'DECOY':
      // Remove expired decoy zones
      if (pos) {
        // Remove the specific decoy zone at this position
        state.effects.decoyZones = state.effects.decoyZones.filter(
          (zone) => !vecEq(zone.pos, pos)
        );
      } else {
        // Remove all expired
        state.effects.decoyZones = state.effects.decoyZones.filter(
          (zone) => zone.until > state.tickIndex
        );
      }
      break;

    case 'LOOP_CAMERA':
      // LOOP_CAMERA expiration is handled via camera state, not effects
      // Nothing to do here - camera state's loopedUntilTick naturally expires
      break;
  }
}

/**
 * Handle CAMERA_LOOPED event (Task 010).
 * AC-4: Sets CameraState.loopedUntilTick = currentTick + duration
 */
function cameraLoopedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as CameraLoopedPayload;
  const { cameraId, untilTick } = payload;

  const cameraState = state.cameras[cameraId];
  if (cameraState) {
    cameraState.loopedUntilTick = untilTick;
  }
}
