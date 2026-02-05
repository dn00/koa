/**
 * Heist Kernel - Alert System
 *
 * Handles alert level escalation and decay.
 * CALM → SUSPICIOUS → ALARM → LOCKDOWN
 * Applies module effects (per specss.md Section 13).
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type { CrewComponent, GuardComponent } from '../types.js';
import { alertGte, ALERT_ORDER } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { getSuspiciousToAlarmDelay, getAlertDecayMultiplier } from '../utils/modules.js';
import { getHeatEffectMultiplier } from '../utils/heat.js';

/**
 * Alert system - manages alert level transitions.
 */
export const alertSystem: SystemDefinition = {
  systemId: 'heist.alert',
  priority: 40, // After movement, before catch
  run(ctx: SystemContext) {
    const state = ctx.state;
    const config = ctx.config.security;

    // Count currently spotted crew
    const crew = ctx.getEntitiesByType('crew');
    let anySpotted = false;

    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      if (crewComp?.isSpotted) {
        anySpotted = true;
        break;
      }
    }

    // If crew is spotted, add suspicion evidence
    if (anySpotted) {
      ctx.proposeEvent(HEIST_EVENTS.SUSPICION_ADDED, {
        currentEvidence: state.alert.suspicionEvidence + 1,
        reason: 'crew_spotted',
      }, { system: 'alert' });

      // Check for escalation based on evidence thresholds
      if (state.alert.level === 'SUSPICIOUS') {
        const newEvidence = state.alert.suspicionEvidence + 1;
        // Apply SUSPICIOUS_TO_ALARM_DELAYED module effect (adds extra evidence threshold)
        const extraTicks = getSuspiciousToAlarmDelay(state.modules);
        const adjustedThreshold = config.suspicionToAlarm + extraTicks;

        if (newEvidence >= adjustedThreshold && !state.effects.radioJammed) {
          ctx.proposeEvent(HEIST_EVENTS.ALERT_ESCALATED, {
            from: 'SUSPICIOUS',
            to: 'ALARM',
            reason: 'sustained_evidence',
          }, { system: 'alert' });
        }
      } else if (state.alert.level === 'ALARM') {
        const newEvidence = state.alert.alarmEvidence + 1;
        // Task 006: Apply heat multiplier to lockdown threshold (lower threshold = faster lockdown)
        const baseThreshold = config.alarmToLockdown;
        const heatMultiplier = getHeatEffectMultiplier(state.heatLevel, 'lockdownThresholdMultiplier', ctx.config);
        const effectiveThreshold = Math.max(1, Math.ceil(baseThreshold * heatMultiplier));
        if (newEvidence >= effectiveThreshold) {
          ctx.proposeEvent(HEIST_EVENTS.ALERT_ESCALATED, {
            from: 'ALARM',
            to: 'LOCKDOWN',
            reason: 'sustained_evidence',
          }, { system: 'alert' });
        }
      }
    } else {
      // No spotting - check for alert decay
      if (state.alert.level === 'SUSPICIOUS') {
        const newTimer = state.alert.suspicionTimer - 1;
        if (newTimer <= 0) {
          ctx.proposeEvent(HEIST_EVENTS.ALERT_DECAYED, {
            from: 'SUSPICIOUS',
            to: 'CALM',
          }, { system: 'alert' });
        }
      }
      // Note: ALARM doesn't decay to SUSPICIOUS, it escalates to LOCKDOWN on timer
      // LOCKDOWN doesn't decay

      // Decay evidence when not spotted (allows recovery from near-escalation)
      // Apply ALERT_DECAY_SLOWER module effect (per specss.md Section 13)
      if (state.alert.suspicionEvidence > 0 || state.alert.alarmEvidence > 0) {
        const decayMultiplier = getAlertDecayMultiplier(state.modules);

        // Determine if decay should happen this tick based on multiplier
        // With multiplier 0.85, decay happens ~85% of ticks (skip every ~7th tick)
        let shouldDecay = true;
        if (decayMultiplier < 1.0) {
          const skipRate = 1.0 - decayMultiplier;
          const skipPeriod = Math.max(2, Math.round(1.0 / skipRate));
          shouldDecay = (state.tickIndex % skipPeriod) !== 0;
        }

        if (shouldDecay) {
          ctx.proposeEvent(HEIST_EVENTS.EVIDENCE_DECAYED, {
            suspicionEvidence: Math.max(0, state.alert.suspicionEvidence - 1),
            alarmEvidence: Math.max(0, state.alert.alarmEvidence - 1),
          }, { system: 'alert' });
        }
      }
    }

    // ALARM timer - escalates to LOCKDOWN if not resolved
    // Task 006: Apply heat multiplier to timer decrement (faster countdown at 75+ heat)
    if (state.alert.level === 'ALARM') {
      const heatMultiplier = getHeatEffectMultiplier(state.heatLevel, 'lockdownThresholdMultiplier', ctx.config);
      // With 0.5 multiplier, timer effectively counts down 2x per tick
      const effectiveDecrement = Math.max(1, Math.ceil(1 / heatMultiplier));
      const newTimer = state.alert.alarmTimer - effectiveDecrement;
      if (newTimer <= 0) {
        ctx.proposeEvent(HEIST_EVENTS.ALERT_ESCALATED, {
          from: 'ALARM',
          to: 'LOCKDOWN',
          reason: 'timer_expired',
        }, { system: 'alert' });
      }
    }
  },
};
