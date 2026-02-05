/**
 * Heist Kernel - Coordination Reducers (Task 006)
 *
 * Handle GUARD_ALERT_BROADCAST event to update receiving guards.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, GuardComponent } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { GuardAlertBroadcastPayload } from '../events.js';

/**
 * Register coordination reducers with the registry.
 */
export function registerCoordinationReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.GUARD_ALERT_BROADCAST, guardAlertBroadcastReducer);
}

/**
 * Handle GUARD_ALERT_BROADCAST event.
 * Updates receiving guards:
 * - Sets alertTarget to the spotted position
 * - Transitions PATROL guards to INVESTIGATE
 * - Guards already in PURSUE keep their own target
 */
function guardAlertBroadcastReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as GuardAlertBroadcastPayload;
  const { targetPos, receivingGuardIds } = payload;

  for (const guardId of receivingGuardIds) {
    const guard = state.entities[guardId];
    if (!guard) continue;

    const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
    if (!guardComp) continue;

    // Only respond if not already pursuing
    if (guardComp.state === 'PURSUE') continue;

    // Set alert target
    guardComp.alertTarget = { ...targetPos };

    // Transition PATROL to INVESTIGATE
    if (guardComp.state === 'PATROL') {
      guardComp.state = 'INVESTIGATE';
    }
  }

  // Update broadcast cooldown
  state.coordination.lastBroadcastTick = state.tickIndex;
}
