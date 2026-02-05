/**
 * Heist Kernel - Tokens System
 *
 * Handles token expiration, effects, and manual token activation.
 * Task 010: Includes LOOP_CAMERA token handling.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type { TokenType, Vec2, EntityId } from '../types.js';
import { isTokenType, manhattan } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { DEFAULT_TOKEN_CONFIG } from '../config.js';

/**
 * Helper to get token duration from config.
 */
function getTokenDuration(tokenType: TokenType, config: SystemContext['config']['tokens']): number {
  const effects = config.effects as Record<string, { durationTicks?: number }>;
  return effects[tokenType]?.durationTicks ?? 10;
}

/**
 * Find the nearest camera to any crew member.
 * Used for LOOP_CAMERA targeting when no specific camera is specified.
 */
function findNearestCamera(ctx: SystemContext): EntityId | undefined {
  const cameras = ctx.getEntitiesByType('camera');
  const crew = ctx.getEntitiesByType('crew');

  if (cameras.length === 0 || crew.length === 0) {
    return undefined;
  }

  let nearestCameraId: EntityId | undefined;
  let nearestDist = Infinity;

  for (const camera of cameras) {
    const cameraPos = camera.components['heist.position'] as { pos: Vec2 } | undefined;
    if (!cameraPos) continue;

    // Skip already looped cameras (EC-2)
    const cameraState = ctx.state.cameras[camera.id];
    if (cameraState?.loopedUntilTick && cameraState.loopedUntilTick > ctx.state.tickIndex) {
      continue;
    }

    for (const crewMember of crew) {
      const crewPos = crewMember.components['heist.position'] as { pos: Vec2 } | undefined;
      if (!crewPos) continue;

      const dist = manhattan(cameraPos.pos, crewPos.pos);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestCameraId = camera.id as EntityId;
      }
    }
  }

  return nearestCameraId;
}

/**
 * Tokens system - checks for token expirations and handles manual activation.
 */
export const tokensSystem: SystemDefinition = {
  systemId: 'heist.tokens',
  priority: 8, // After rules, before vision
  run(ctx: SystemContext) {
    const state = ctx.state;
    const tick = state.tickIndex;
    const config = ctx.config.tokens;

    // Handle pending token fire (new targeting system) - takes precedence
    if (state.pendingTokenFire) {
      const fire = state.pendingTokenFire;
      const tokenType = fire.tokenId as TokenType;

      // Validate token type
      if (!isTokenType(tokenType)) {
        // Unknown token - skip activation
        return;
      }

      // DECOY requires explicit cell target - no crew position fallback
      if (tokenType === 'DECOY') {
        if (!fire.target?.cell) {
          // Skip activation - DECOY must have cell target
          return;
        }
      }

      // Validate cell target if provided
      if (fire.target?.cell) {
        const { x, y } = fire.target.cell;
        // Check bounds
        if (x < 0 || x >= state.map.width || y < 0 || y >= state.map.height) {
          // Invalid target - skip activation
          return;
        }
        // Check not wall
        if (state.map.tiles[y]?.[x] === 'WALL') {
          // Invalid target - skip activation
          return;
        }
      }

      // Check can use token (charges + cooldown)
      const available = state.tokens.available as Record<string, number>;
      if (available[tokenType] > 0 && state.tokens.cooldownUntil <= tick) {
        // Handle LOOP_CAMERA specially (Task 010)
        if (tokenType === 'LOOP_CAMERA') {
          // AC-2: Token targets camera (nearest or selected)
          let targetCameraId: EntityId | undefined = fire.target?.entityId as EntityId | undefined;

          // ERR-1: If specified camera ID doesn't exist, fall back to nearest
          if (targetCameraId && !state.cameras[targetCameraId]) {
            // Could log: `Camera ${targetCameraId} not found, targeting nearest`
            targetCameraId = undefined;
          }

          if (!targetCameraId) {
            targetCameraId = findNearestCamera(ctx);
          }

          // EC-1: No cameras in facility - token wasted
          if (!targetCameraId) {
            // Consume the charge but no effect
            ctx.proposeEvent(HEIST_EVENTS.TOKEN_ACTIVATED, {
              tokenType,
              pos: { x: 0, y: 0 },
              expiresAt: tick,
              manual: true,
            }, { system: 'tokens' });
            return;
          }

          // EC-2: Camera already looped - token wasted
          const cameraState = state.cameras[targetCameraId];
          if (cameraState?.loopedUntilTick && cameraState.loopedUntilTick > tick) {
            ctx.proposeEvent(HEIST_EVENTS.TOKEN_ACTIVATED, {
              tokenType,
              pos: { x: 0, y: 0 },
              expiresAt: tick,
              manual: true,
            }, { system: 'tokens' });
            return;
          }

          // AC-6: Get duration from config
          const duration = DEFAULT_TOKEN_CONFIG.effects.LOOP_CAMERA.durationTicks;

          // Emit TOKEN_ACTIVATED for consistency
          ctx.proposeEvent(HEIST_EVENTS.TOKEN_ACTIVATED, {
            tokenType,
            pos: { x: 0, y: 0 },
            expiresAt: tick + duration,
            manual: true,
          }, { system: 'tokens' });

          // AC-5: Emit CAMERA_LOOPED event
          ctx.proposeEvent(HEIST_EVENTS.CAMERA_LOOPED, {
            cameraId: targetCameraId,
            untilTick: tick + duration,
          }, { system: 'tokens' });

          return;
        }

        // Determine position: use target cell, or fallback to crew position for non-targeted tokens
        const crew = Object.values(state.entities).find(e => e.type === 'crew');
        const crewPos = (crew?.components['heist.position'] as { pos: Vec2 } | undefined)?.pos;
        const pos = fire.target?.cell ?? crewPos ?? { x: 0, y: 0 };

        const duration = getTokenDuration(tokenType, config);
        ctx.proposeEvent(HEIST_EVENTS.TOKEN_ACTIVATED, {
          tokenType,
          pos,
          expiresAt: tick + duration,
          manual: true,
          targetCell: fire.target?.cell,  // Include for debugging/replay
        }, { system: 'tokens' });
      }
      return; // Don't also check pendingTokenUse
    }

    // Handle pending manual token use (legacy, backward compat)
    if (state.pendingTokenUse) {
      const tokenType = state.pendingTokenUse;

      // Check if we can use the token
      if (state.tokens.available[tokenType] > 0 && state.tokens.cooldownUntil <= tick) {
        // Find crew position for smoke
        let pos: Vec2 = { x: 0, y: 0 };
        for (const entity of Object.values(state.entities)) {
          if (entity.type === 'crew') {
            const posComp = entity.components['heist.position'] as { pos: Vec2 } | undefined;
            if (posComp) {
              pos = posComp.pos;
              break;
            }
          }
        }

        const duration = config.effects[tokenType].durationTicks ?? 10;
        ctx.proposeEvent(HEIST_EVENTS.TOKEN_ACTIVATED, {
          tokenType,
          pos,
          expiresAt: tick + duration,
          manual: true,
        }, { system: 'tokens' });
      }
    }

    // Check lights expiration
    if (state.effects.lightsOut && state.effects.lightsOutUntil <= tick) {
      ctx.proposeEvent(HEIST_EVENTS.TOKEN_EXPIRED, {
        tokenType: 'LIGHTS',
      }, { system: 'tokens' });
    }

    // Check radio jam expiration
    if (state.effects.radioJammed && state.effects.radioJammedUntil <= tick) {
      ctx.proposeEvent(HEIST_EVENTS.TOKEN_EXPIRED, {
        tokenType: 'RADIO',
      }, { system: 'tokens' });
    }

    // Check smoke zone expirations
    for (const zone of state.effects.smokeZones) {
      if (zone.until <= tick) {
        ctx.proposeEvent(HEIST_EVENTS.TOKEN_EXPIRED, {
          tokenType: 'SMOKE',
          pos: zone.pos,
        }, { system: 'tokens' });
      }
    }

    // Check decoy zone expirations
    for (const zone of state.effects.decoyZones ?? []) {
      if (zone.until <= tick) {
        ctx.proposeEvent(HEIST_EVENTS.TOKEN_EXPIRED, {
          tokenType: 'DECOY',
          pos: zone.pos,
        }, { system: 'tokens' });
      }
    }
  },
};
