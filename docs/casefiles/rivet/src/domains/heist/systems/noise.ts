/**
 * Heist Kernel - Noise System
 *
 * Per AH04 Section 6: Handles noise emission and guard hearing.
 * Noise is event-driven, not continuous.
 */

import type { SystemDefinition, SystemContext } from '../kernel.js';
import type {
  Entity,
  PositionComponent,
  GuardComponent,
  CrewComponent,
  ObjectiveComponent,
} from '../types.js';
import { vecEq } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import { propagateNoise, canHearNoise, findNoiseSource } from '../utils/noise.js';
import { getHackNoiseMultiplier } from '../utils/modules.js';

/** Base noise level for working on objectives */
const BASE_HACK_NOISE = 40;

/** Guard default hearing threshold */
const DEFAULT_HEARING_THRESHOLD = 20;

/**
 * Noise system - handles noise emission and guard hearing detection.
 * Per AH04 Section 6.
 */
export const noiseSystem: SystemDefinition = {
  systemId: 'heist.noise',
  priority: 25, // After objectives (30) to see progress, before alert (40)
  run(ctx: SystemContext) {
    const state = ctx.state;
    const crew = ctx.getEntitiesByType('crew');
    const guards = ctx.getEntitiesByType('guard');
    const objectives = ctx.getEntitiesByType('objective');

    // Collect noise sources this tick
    const noiseSources: Array<{
      sourceId: string;
      pos: { x: number; y: number };
      loudness: number;
      kind: 'HACK' | 'OBJECTIVE_COMPLETE' | 'TOKEN';
    }> = [];

    // Check for crew working on objectives (emits noise)
    for (const agent of crew) {
      const crewComp = agent.components['heist.crew'] as CrewComponent | undefined;
      const posComp = agent.components['heist.position'] as PositionComponent | undefined;

      if (!crewComp || !posComp) continue;

      // Only emit noise when actively WORKING
      if (crewComp.state !== 'WORKING') continue;

      // Find objective at crew's position
      for (const obj of objectives) {
        const objComp = obj.components['heist.objective'] as ObjectiveComponent | undefined;
        const objPos = obj.components['heist.position'] as PositionComponent | undefined;

        if (!objComp || !objPos) continue;
        if (!vecEq(posComp.pos, objPos.pos)) continue;
        if (objComp.state !== 'ACTIVE') continue;

        // Apply HACK_NOISE_REDUCTION module effect
        const noiseMultiplier = getHackNoiseMultiplier(state.modules);
        const loudness = Math.floor(BASE_HACK_NOISE * noiseMultiplier);

        if (loudness > 0) {
          noiseSources.push({
            sourceId: agent.id,
            pos: { ...posComp.pos },
            loudness,
            kind: 'HACK',
          });
        }
      }
    }

    // Emit noise from active decoys
    const tick = state.tickIndex;
    for (const decoy of state.effects.decoyZones ?? []) {
      if (decoy.until > tick) {
        const noiseLevel = ctx.config.tokens.effects.DECOY.noiseLevel;
        noiseSources.push({
          sourceId: 'decoy',  // Not a real entity ID
          pos: { ...decoy.pos },
          loudness: noiseLevel,
          kind: 'TOKEN' as const,
        });
      }
    }

    // Process each noise source
    for (const noise of noiseSources) {
      // Emit NOISE_EMITTED event
      ctx.proposeEvent(HEIST_EVENTS.NOISE_EMITTED, {
        sourceId: noise.sourceId,
        pos: noise.pos,
        loudness: noise.loudness,
        kind: noise.kind,
      }, { system: 'noise' });

      // Propagate noise through the map
      const noiseField = propagateNoise(
        noise.pos,
        noise.loudness,
        state.map,
        state.modules
      );

      // Check if any guards can hear it
      for (const guard of guards) {
        const guardComp = guard.components['heist.guard'] as GuardComponent | undefined;
        const guardPos = guard.components['heist.position'] as PositionComponent | undefined;

        if (!guardComp || !guardPos) continue;

        // Guards already pursuing don't need additional noise alerts
        if (guardComp.state === 'PURSUE') continue;

        const { canHear, intensity } = canHearNoise(
          guardPos.pos,
          noiseField,
          DEFAULT_HEARING_THRESHOLD
        );

        if (canHear) {
          // Find approximate source location
          const sourcePos = findNoiseSource(guardPos.pos, noiseField) ?? noise.pos;

          ctx.proposeEvent(HEIST_EVENTS.NOISE_HEARD, {
            guardId: guard.id,
            sourcePos,
            intensity,
          }, { system: 'noise' });
        }
      }
    }
  },
};
