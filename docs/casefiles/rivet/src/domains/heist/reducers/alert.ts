/**
 * Heist Kernel - Alert Reducers
 *
 * Handle ALERT_ESCALATED, ALERT_DECAYED, SUSPICION_ADDED events.
 * Applies module effects (per specss.md Section 13).
 * Per Task 007: Emits ALERT_BEHAVIOR_CHANGED on level transitions.
 */

import type { ReducerRegistry, SimEvent, SystemContext } from '../kernel.js';
import type { HeistState, AlertLevel, GuardComponent, AlertBehaviorMode } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type { AlertEscalatedPayload, AlertDecayedPayload, SuspicionAddedPayload, EvidenceDecayedPayload, AlertBehaviorChangedPayload } from '../events.js';
import { getSuspiciousToAlarmDelay, getFirstAlertDelay } from '../utils/modules.js';

/** Events to emit from reducers (collected during reducer execution) */
let pendingBehaviorChangeEvents: AlertBehaviorChangedPayload[] = [];

/**
 * Register alert reducers with the registry.
 */
export function registerAlertReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.ALERT_ESCALATED, alertEscalatedReducer);
  registry.register(HEIST_EVENTS.ALERT_DECAYED, alertDecayedReducer);
  registry.register(HEIST_EVENTS.SUSPICION_ADDED, suspicionAddedReducer);
  registry.register(HEIST_EVENTS.EVIDENCE_DECAYED, evidenceDecayedReducer);
  registry.register(HEIST_EVENTS.ALERT_BEHAVIOR_CHANGED, alertBehaviorChangedReducer);
}

/**
 * Get and clear pending behavior change events.
 * Called by kernel after reducer runs to emit additional events.
 */
export function getPendingBehaviorChanges(): AlertBehaviorChangedPayload[] {
  const events = [...pendingBehaviorChangeEvents];
  pendingBehaviorChangeEvents = [];
  return events;
}

/**
 * Queue an ALERT_BEHAVIOR_CHANGED event to be emitted.
 */
function queueBehaviorChange(from: AlertBehaviorMode, to: AlertBehaviorMode): void {
  pendingBehaviorChangeEvents.push({ from, to });
}

/**
 * Handle ALERT_ESCALATED event.
 * Per Task 007 AC-5: Emits ALERT_BEHAVIOR_CHANGED on level change.
 */
function alertEscalatedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as AlertEscalatedPayload;
  const { from, to } = payload;
  const config = state.config.security;

  // Queue behavior change event (Task 007 AC-5)
  queueBehaviorChange(from as AlertBehaviorMode, to as AlertBehaviorMode);

  state.alert.level = to;

  // Autopause on alert escalation
  state.shouldPause = true;
  state.pauseReason = `Alert: ${from} → ${to}`;

  // Reset evidence counters on escalation
  if (to === 'SUSPICIOUS') {
    // Apply FIRST_ALERT_DELAYED module effect
    const firstAlertDelay = getFirstAlertDelay(state.modules);
    const isFirstAlert = state.modules && !state.modules.firstAlertOccurred;

    state.alert.suspicionTimer = config.suspicionDecayTicks + (isFirstAlert ? firstAlertDelay : 0);
    state.alert.suspicionEvidence = 0;
    state.heat += config.spottedHeat;

    // Mark first alert as occurred
    if (state.modules && !state.modules.firstAlertOccurred) {
      state.modules.firstAlertOccurred = true;
    }
  } else if (to === 'ALARM') {
    state.alert.alarmTimer = config.alarmDecayTicks;
    state.alert.alarmEvidence = 0;
    state.heat += config.alarmHeat;

    // CRITICAL: When escalating to ALARM, all guards with recent sightings
    // should switch to PURSUE mode immediately
    for (const entity of Object.values(state.entities)) {
      if (entity.type === 'guard') {
        const guardComp = entity.components['heist.guard'] as GuardComponent | undefined;
        if (guardComp && guardComp.lastSeen) {
          // If guard saw something recently (within 20 ticks), pursue!
          const ticksSinceSeen = state.tickIndex - guardComp.lastSeen.tick;
          if (ticksSinceSeen < 20) {
            guardComp.state = 'PURSUE';
          }
        }
      }
    }
  } else if (to === 'LOCKDOWN') {
    state.heat += config.lockdownHeat;
  }
}

/**
 * Handle ALERT_DECAYED event.
 * Per Task 007 AC-5: Emits ALERT_BEHAVIOR_CHANGED on level change.
 */
function alertDecayedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as AlertDecayedPayload;
  const { from, to } = payload;

  // Queue behavior change event (Task 007 AC-5)
  queueBehaviorChange(from as AlertBehaviorMode, to as AlertBehaviorMode);

  state.alert.level = to;

  // Reset timers and evidence
  state.alert.suspicionTimer = 0;
  state.alert.suspicionEvidence = 0;
  state.alert.alarmTimer = 0;
  state.alert.alarmEvidence = 0;
}

/**
 * Handle SUSPICION_ADDED event.
 * Per Task 007 AC-5: Emits ALERT_BEHAVIOR_CHANGED when escalating CALM to SUSPICIOUS.
 */
function suspicionAddedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as SuspicionAddedPayload;
  const config = state.config.security;

  // First spotting triggers immediate escalation to SUSPICIOUS
  if (state.alert.level === 'CALM') {
    // Queue behavior change event (Task 007 AC-5)
    queueBehaviorChange('CALM', 'SUSPICIOUS');

    state.alert.level = 'SUSPICIOUS';
    state.alert.suspicionTimer = config.suspicionDecayTicks;
    state.alert.suspicionEvidence = 1;
    state.heat += config.spottedHeat;
  } else if (state.alert.level === 'SUSPICIOUS') {
    state.alert.suspicionEvidence++;
    // Reset decay timer when new evidence
    state.alert.suspicionTimer = config.suspicionDecayTicks;
  } else if (state.alert.level === 'ALARM') {
    state.alert.alarmEvidence++;
  }
  // LOCKDOWN doesn't accumulate more evidence
}

/**
 * Handle EVIDENCE_DECAYED event.
 */
function evidenceDecayedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as EvidenceDecayedPayload;

  state.alert.suspicionEvidence = payload.suspicionEvidence;
  state.alert.alarmEvidence = payload.alarmEvidence;
}

/**
 * Handle ALERT_BEHAVIOR_CHANGED event.
 * Per Task 007: Informational event - no state change needed.
 * Systems can listen to this event to react to behavior mode changes.
 */
function alertBehaviorChangedReducer(_state: HeistState, _event: SimEvent): void {
  // No-op: This is an informational event for external listeners (UI, logging, etc.)
  // Guard movement system already reads alertModes config directly
}
