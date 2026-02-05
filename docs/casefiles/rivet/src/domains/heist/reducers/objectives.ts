/**
 * Heist Kernel - Objectives Reducers
 *
 * Handle OBJECTIVE_PROGRESS, OBJECTIVE_COMPLETE, OBJECTIVE_UNLOCKED events.
 */

import type { ReducerRegistry, SimEvent } from '../kernel.js';
import type { HeistState, ObjectiveComponent } from '../types.js';
import { HEIST_EVENTS } from '../events.js';
import type {
  ObjectiveProgressPayload,
  ObjectiveCompletePayload,
  ObjectiveUnlockedPayload,
} from '../events.js';

/**
 * Register objectives reducers with the registry.
 */
export function registerObjectivesReducers(registry: ReducerRegistry): void {
  registry.register(HEIST_EVENTS.OBJECTIVE_PROGRESS, objectiveProgressReducer);
  registry.register(HEIST_EVENTS.OBJECTIVE_COMPLETE, objectiveCompleteReducer);
  registry.register(HEIST_EVENTS.OBJECTIVE_UNLOCKED, objectiveUnlockedReducer);
}

/**
 * Handle OBJECTIVE_PROGRESS event.
 */
function objectiveProgressReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as ObjectiveProgressPayload;
  const { objectiveId, progress } = payload;

  const entity = state.entities[objectiveId];
  if (!entity || entity.type !== 'objective') return;

  const objComp = entity.components['heist.objective'] as ObjectiveComponent | undefined;
  if (!objComp) return;

  const prevProgress = objComp.progress;
  objComp.progress = Math.min(100, progress);

  // Autopause on 50% milestone
  if (prevProgress < 50 && objComp.progress >= 50) {
    state.shouldPause = true;
    state.pauseReason = `${objComp.label} - 50% complete`;
  }
}

/**
 * Handle OBJECTIVE_COMPLETE event.
 */
function objectiveCompleteReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as ObjectiveCompletePayload;
  const { objectiveId } = payload;

  const entity = state.entities[objectiveId];
  if (!entity || entity.type !== 'objective') return;

  const objComp = entity.components['heist.objective'] as ObjectiveComponent | undefined;
  if (!objComp) return;

  objComp.state = 'DONE';
  objComp.progress = 100;

  // Autopause on objective complete
  state.shouldPause = true;
  state.pauseReason = `${objComp.label} COMPLETE!`;

  // Check for objectives that have this as a prerequisite
  for (const nextEntity of Object.values(state.entities)) {
    if (nextEntity.type !== 'objective' || nextEntity.id === objectiveId) continue;

    const nextObjComp = nextEntity.components['heist.objective'] as ObjectiveComponent | undefined;
    if (!nextObjComp || nextObjComp.state !== 'LOCKED') continue;

    // Check if this objective has the completed one as a prerequisite
    if (!nextObjComp.prerequisites.includes(objectiveId)) continue;

    // Check if ALL prerequisites are done
    const allPrereqsDone = nextObjComp.prerequisites.every(prereqId => {
      const prereqEntity = state.entities[prereqId];
      if (!prereqEntity || prereqEntity.type !== 'objective') return false;
      const prereqComp = prereqEntity.components['heist.objective'] as ObjectiveComponent | undefined;
      return prereqComp && prereqComp.state === 'DONE';
    });

    if (allPrereqsDone) {
      nextObjComp.state = 'ACTIVE';
    }
  }
}

/**
 * Handle OBJECTIVE_UNLOCKED event.
 */
function objectiveUnlockedReducer(state: HeistState, event: SimEvent): void {
  const payload = event.payload as ObjectiveUnlockedPayload;
  const { objectiveId } = payload;

  const entity = state.entities[objectiveId];
  if (!entity || entity.type !== 'objective') return;

  const objComp = entity.components['heist.objective'] as ObjectiveComponent | undefined;
  if (!objComp) return;

  objComp.state = 'ACTIVE';
}
