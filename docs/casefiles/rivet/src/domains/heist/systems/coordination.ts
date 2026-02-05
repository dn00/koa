/**
 * Heist Kernel - Coordination System (Task 006)
 *
 * Handles guard coordination where guards broadcast alerts when spotting crew.
 * Nearby guards respond by transitioning to INVESTIGATE state.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  GuardComponent,
  PositionComponent,
  EntityId,
  AlertLevel,
} from '../types.js';
import { manhattan } from '../types.js';
import { HEIST_EVENTS } from '../events.js';

/**
 * Coordination system - handles guard alert broadcasts.
 *
 * Runs after vision to:
 * 1. Check for guards that just spotted crew (PURSUE state with lastSeen this tick)
 * 2. Find nearby guards within broadcast range
 * 3. Emit GUARD_ALERT_BROADCAST event
 *
 * Respects:
 * - Radio jam effect (blocks all broadcasts)
 * - Broadcast cooldown (prevents spam)
 */
export const coordinationSystem: SystemDefinition = {
  systemId: 'heist.coordination',
  priority: 12, // After vision (10), before movement
  run(ctx: SystemContext) {
    const state = ctx.state;

    // Skip if radio jammed
    if (state.effects.radioJammed) return;

    // Only broadcast if convergeOnSpotted is enabled for current alert level
    const alertLevel = state.alert.level as AlertLevel;
    const modeConfig = ctx.config.alertModes?.[alertLevel];
    if (!modeConfig?.convergeOnSpotted) return;

    // Check cooldown
    const coordinationConfig = ctx.config.coordination;
    if (state.tickIndex < state.coordination.lastBroadcastTick + coordinationConfig.broadcastCooldownTicks) {
      return;
    }

    const guards = ctx.getEntitiesByType('guard');

    for (const guard of guards) {
      const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
      const guardPos = guard.components['heist.position'] as PositionComponent | undefined;

      if (!guardComp || !guardPos) continue;

      // Check if this guard just spotted crew (PURSUE state and lastSeen this tick)
      if (guardComp.state !== 'PURSUE') continue;
      if (!guardComp.lastSeen || guardComp.lastSeen.tick !== state.tickIndex) continue;

      const targetPos = guardComp.lastSeen.pos;
      const broadcastRange = coordinationConfig.broadcastRange;

      // Find guards in range
      const receivingGuards: EntityId[] = [];
      for (const otherGuard of guards) {
        if (otherGuard.id === guard.id) continue;

        const otherPos = otherGuard.components['heist.position'] as PositionComponent | undefined;
        if (!otherPos) continue;

        if (manhattan(guardPos.pos, otherPos.pos) <= broadcastRange) {
          receivingGuards.push(otherGuard.id);
        }
      }

      // Only emit if there are receivers
      if (receivingGuards.length > 0) {
        ctx.proposeEvent(HEIST_EVENTS.GUARD_ALERT_BROADCAST, {
          sourceGuardId: guard.id,
          targetPos: { ...targetPos },
          receivingGuardIds: receivingGuards,
        }, { system: 'coordination' });

        // One broadcast per tick is enough (cooldown will prevent more)
        return;
      }
    }
  },
};
