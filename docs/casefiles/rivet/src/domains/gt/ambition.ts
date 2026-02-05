/**
 * Ambition System
 *
 * Task 009: Ambitions System
 *
 * Implements:
 * - core.ambition component on world entity with activeTrackId, progress, completedTracks
 * - Two MVP tracks: food_security and sanctuary
 * - count_events objective type: count matching events per tick
 * - maintain_condition objective type: resource_gte and no_event conditions
 * - Rewards: food_security +40 favor, sanctuary +20 favor
 * - Progress evaluated deterministically from events
 * - Maintain objectives reset on failure (allowResets=true)
 */

import type {
  WorldState,
  SimEvent,
  PlayerCommand,
  AmbitionPayload,
  EventType,
} from './types/index.js';
import { EVENT_TYPES, dayIndexFromTick } from './types/index.js';
import { ReducerRegistry } from './kernel.js';
import type { CommandValidationResult } from './kernel.js';

// === CONSTANTS ===

export const FOOD_SECURITY_REWARD = 40;
export const SANCTUARY_REWARD = 20;

// === COMPONENT TYPES ===

export interface AmbitionObjectiveCountEvents {
  type: 'count_events';
  objectiveId: string;
  eventType: EventType;
  count: number;
  filter?: {
    templateId?: string;
    jobKind?: string;
  };
}

export interface AmbitionObjectiveMaintainCondition {
  type: 'maintain_condition';
  objectiveId: string;
  condition: MaintainCondition;
  maintainDays: number;
  allowResets: boolean;
}

export type MaintainCondition =
  | { type: 'resource_gte'; resourceId: string; amount: number }
  | { type: 'no_event'; eventType: EventType };

export type AmbitionObjective = AmbitionObjectiveCountEvents | AmbitionObjectiveMaintainCondition;

export interface AmbitionReward {
  favor: number;
}

export interface AmbitionTrack {
  trackId: string;
  nameKey: string;
  descriptionKey: string;
  objectives: AmbitionObjective[];
  reward: AmbitionReward;
}

export interface AmbitionProgress {
  [key: string]: number | boolean;
}

export interface CoreAmbitionComponent {
  activeTrackId: string | undefined;
  progress: AmbitionProgress;
  completedTracks: string[];
  maintainStartDay?: number; // Day when maintain condition started being tracked
}

// === MVP AMBITION TRACKS ===

export const AMBITION_TRACKS: Record<string, AmbitionTrack> = {
  food_security: {
    trackId: 'food_security',
    nameKey: 'ambition.food_security.name',
    descriptionKey: 'ambition.food_security.description',
    objectives: [
      {
        type: 'count_events',
        objectiveId: 'harvest_jobs',
        eventType: EVENT_TYPES.JOB_COMPLETED,
        count: 3,
        filter: {
          templateId: 'jobtmpl.harvest.field',
        },
      },
      {
        type: 'maintain_condition',
        objectiveId: 'maintain_food',
        condition: {
          type: 'resource_gte',
          resourceId: 'res.food',
          amount: 50,
        },
        maintainDays: 2,
        allowResets: true,
      },
    ],
    reward: {
      favor: FOOD_SECURITY_REWARD,
    },
  },
  sanctuary: {
    trackId: 'sanctuary',
    nameKey: 'ambition.sanctuary.name',
    descriptionKey: 'ambition.sanctuary.description',
    objectives: [
      {
        type: 'count_events',
        objectiveId: 'shrine_repair',
        eventType: EVENT_TYPES.JOB_COMPLETED,
        count: 1,
        filter: {
          templateId: 'jobtmpl.repair.shrine',
        },
      },
      {
        type: 'maintain_condition',
        objectiveId: 'no_critical_needs',
        condition: {
          type: 'no_event',
          eventType: EVENT_TYPES.NPC_NEED_CRITICAL,
        },
        maintainDays: 2,
        allowResets: true,
      },
    ],
    reward: {
      favor: SANCTUARY_REWARD,
    },
  },
};

// === COMPONENT FACTORY ===

/**
 * Create a new ambition component
 */
export function createAmbitionComponent(): CoreAmbitionComponent {
  return {
    activeTrackId: undefined,
    progress: {},
    completedTracks: [],
  };
}

/**
 * Initialize progress for a specific track
 */
export function initializeProgressForTrack(trackId: string): AmbitionProgress {
  if (trackId === 'food_security') {
    return {
      harvestCount: 0,
      maintainDaysMet: 0,
    };
  } else if (trackId === 'sanctuary') {
    return {
      shrineRepaired: false,
      maintainDaysMet: 0,
    };
  }
  return {};
}

// === HELPER FUNCTIONS ===

/**
 * Get ambition state from world state
 */
export function getAmbitionState(state: WorldState): CoreAmbitionComponent | null {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return null;

  return worldEntity.components['core.ambition'] as CoreAmbitionComponent | undefined ?? null;
}

/**
 * Get stockpile from world state
 */
function getStockpile(state: WorldState): Record<string, number> {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return {};

  const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
  return stockpile?.resources ?? {};
}

/**
 * Check if a day boundary occurred between two ticks
 * Task 002: AC-3 - Day-boundary logic uses ticksPerDay parameter
 */
function isDayBoundary(prevTick: number, currentTick: number, ticksPerDay: number): boolean {
  return dayIndexFromTick(prevTick, ticksPerDay) !== dayIndexFromTick(currentTick, ticksPerDay);
}

// === COMMAND VALIDATION ===

/**
 * Validate an ambition.set command
 */
export function validateAmbitionCommand(
  state: WorldState,
  command: PlayerCommand,
  currentTick: number
): CommandValidationResult {
  const payload = command.payload as AmbitionPayload;
  const trackId = payload.target.trackId;

  // Check if track exists
  if (!trackId || !AMBITION_TRACKS[trackId]) {
    return { valid: false, reason: `Invalid track ID: ${trackId}` };
  }

  const ambitionState = getAmbitionState(state);
  if (!ambitionState) {
    return { valid: true }; // Component will be created
  }

  // Check if track is already completed
  if (ambitionState.completedTracks.includes(trackId)) {
    return { valid: false, reason: `Track already completed: ${trackId}` };
  }

  // Check if this track is already active
  if (ambitionState.activeTrackId === trackId) {
    return { valid: false, reason: `Track already active: ${trackId}` };
  }

  return { valid: true };
}

// === PROGRESS EVALUATION ===

export interface AmbitionProgressResult {
  progressUpdate?: AmbitionProgress;
  completed: boolean;
  reward?: AmbitionReward;
}

/**
 * Evaluate ambition progress based on events
 *
 * This is a pure function that determines what progress updates should occur
 * based on the current state and events. The actual state mutation happens
 * via reducers.
 *
 * Task 002: AC-3 - Day-boundary logic uses state.calendar.ticksPerDay
 */
export function evaluateAmbitionProgress(
  state: WorldState,
  events: SimEvent[],
  currentTick: number,
  prevTick?: number,
  ticksPerDay?: number
): AmbitionProgressResult {
  const ambitionState = getAmbitionState(state);

  // No active ambition = no progress
  if (!ambitionState || !ambitionState.activeTrackId) {
    return { completed: false };
  }

  const trackId = ambitionState.activeTrackId;
  const track = AMBITION_TRACKS[trackId];
  if (!track) {
    return { completed: false };
  }

  // Clone current progress
  // Task 002: AC-3 - Use ticksPerDay from state calendar
  const tpd = ticksPerDay ?? state.calendar.ticksPerDay;
  const progress: AmbitionProgress = { ...ambitionState.progress };
  const currentDayIndex = dayIndexFromTick(currentTick, tpd);
  const prevDayIndex = prevTick !== undefined ? dayIndexFromTick(prevTick, tpd) : currentDayIndex;
  const atDayBoundary = prevTick !== undefined && isDayBoundary(prevTick, currentTick, tpd);

  // Process based on track type
  if (trackId === 'food_security') {
    // Count harvest job completions
    let harvestCount = (progress.harvestCount as number) ?? 0;
    for (const event of events) {
      if (event.type === EVENT_TYPES.JOB_COMPLETED) {
        const payload = event.payload as { templateId?: string };
        if (payload.templateId === 'jobtmpl.harvest.field') {
          harvestCount++;
        }
      }
    }
    progress.harvestCount = harvestCount;

    // Check maintain condition at day boundary
    if (atDayBoundary) {
      const stockpile = getStockpile(state);
      const food = stockpile['res.food'] ?? 0;

      if (food >= 50) {
        progress.maintainDaysMet = ((progress.maintainDaysMet as number) ?? 0) + 1;
      } else {
        // Reset on failure
        progress.maintainDaysMet = 0;
      }
    }

    // Check completion
    const countObjective = track.objectives.find(o => o.type === 'count_events') as AmbitionObjectiveCountEvents;
    const maintainObjective = track.objectives.find(o => o.type === 'maintain_condition') as AmbitionObjectiveMaintainCondition;

    const countMet = harvestCount >= countObjective.count;
    const maintainMet = (progress.maintainDaysMet as number) >= maintainObjective.maintainDays;

    if (countMet && maintainMet) {
      return {
        progressUpdate: progress,
        completed: true,
        reward: track.reward,
      };
    }

    return {
      progressUpdate: progress,
      completed: false,
    };
  } else if (trackId === 'sanctuary') {
    // Check for shrine repair completion
    let shrineRepaired = (progress.shrineRepaired as boolean) ?? false;
    for (const event of events) {
      if (event.type === EVENT_TYPES.JOB_COMPLETED) {
        const payload = event.payload as { templateId?: string };
        if (payload.templateId === 'jobtmpl.repair.shrine') {
          shrineRepaired = true;
        }
      }
    }
    progress.shrineRepaired = shrineRepaired;

    // Check for need_critical events (causes reset)
    let hasNeedCritical = false;
    for (const event of events) {
      if (event.type === EVENT_TYPES.NPC_NEED_CRITICAL) {
        hasNeedCritical = true;
        break;
      }
    }

    // Check maintain condition at day boundary
    if (atDayBoundary) {
      if (hasNeedCritical) {
        // Reset on failure
        progress.maintainDaysMet = 0;
      } else {
        progress.maintainDaysMet = ((progress.maintainDaysMet as number) ?? 0) + 1;
      }
    } else if (hasNeedCritical) {
      // Even if not at day boundary, need_critical in the current day's events resets
      // This is handled at next day boundary, but we track it for the evaluation
      progress.maintainDaysMet = 0;
    }

    // Check completion
    const countObjective = track.objectives.find(o => o.type === 'count_events') as AmbitionObjectiveCountEvents;
    const maintainObjective = track.objectives.find(o => o.type === 'maintain_condition') as AmbitionObjectiveMaintainCondition;

    const countMet = shrineRepaired;
    const maintainMet = (progress.maintainDaysMet as number) >= maintainObjective.maintainDays;

    if (countMet && maintainMet) {
      return {
        progressUpdate: progress,
        completed: true,
        reward: track.reward,
      };
    }

    return {
      progressUpdate: progress,
      completed: false,
    };
  }

  return { completed: false };
}

// === AMBITION SYSTEM ===

import type { SystemContext } from './kernel.js';

/**
 * Ambition system - runs each tick to evaluate progress
 *
 * This system tracks progress on the active ambition based on events
 * that occurred in the current tick.
 */
export function ambitionSystem(ctx: SystemContext, tickEvents: SimEvent[]): void {
  const ambitionState = getAmbitionState(ctx.state);

  // No active ambition = nothing to do
  if (!ambitionState || !ambitionState.activeTrackId) {
    return;
  }

  const trackId = ambitionState.activeTrackId;
  const track = AMBITION_TRACKS[trackId];
  if (!track) {
    return;
  }

  // Evaluate progress based on events in this tick
  // Task 002: AC-3 - Pass ticksPerDay from state calendar
  const prevTick = ctx.tickIndex > 0 ? ctx.tickIndex - 1 : 0;
  const result = evaluateAmbitionProgress(ctx.state, tickEvents, ctx.tickIndex, prevTick, ctx.state.calendar.ticksPerDay);

  // Propose progress update if progress changed
  if (result.progressUpdate) {
    ctx.proposeEvent(EVENT_TYPES.AMBITION_PROGRESSED, {
      trackId,
      progress: result.progressUpdate,
    }, {});
  }

  // Propose completion if completed
  if (result.completed && result.reward) {
    ctx.proposeEvent(EVENT_TYPES.AMBITION_COMPLETED, {
      trackId,
      reward: result.reward,
    }, {});
  }
}

// === AMBITION REDUCERS ===

export function ambitionReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  // core.ambition.selected - select a new ambition track
  registry.register(EVENT_TYPES.AMBITION_SELECTED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      trackId: string;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }

    let ambition = worldEntity.components['core.ambition'] as CoreAmbitionComponent | undefined;
    if (!ambition) {
      ambition = createAmbitionComponent();
      worldEntity.components['core.ambition'] = ambition;
    }

    ambition.activeTrackId = payload.trackId;
    ambition.progress = initializeProgressForTrack(payload.trackId);
    // Task 002: AC-3 - Use state.calendar.ticksPerDay for day calculation
    ambition.maintainStartDay = dayIndexFromTick(event.tickIndex, state.calendar.ticksPerDay);
  });

  // core.ambition.progressed - update progress
  registry.register(EVENT_TYPES.AMBITION_PROGRESSED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      trackId: string;
      progress: AmbitionProgress;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) return;

    const ambition = worldEntity.components['core.ambition'] as CoreAmbitionComponent | undefined;
    if (!ambition || ambition.activeTrackId !== payload.trackId) return;

    // Merge progress
    ambition.progress = { ...ambition.progress, ...payload.progress };
  });

  // core.ambition.completed - track completed
  registry.register(EVENT_TYPES.AMBITION_COMPLETED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      trackId: string;
      reward: AmbitionReward;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }

    const ambition = worldEntity.components['core.ambition'] as CoreAmbitionComponent | undefined;
    if (!ambition) return;

    // Add to completed tracks
    if (!ambition.completedTracks.includes(payload.trackId)) {
      ambition.completedTracks.push(payload.trackId);
    }

    // Clear active track - use delete to properly remove the property
    delete (ambition as { activeTrackId?: string }).activeTrackId;
    ambition.progress = {};

    // Grant reward
    state.player.favor = Math.min(
      state.player.favorCap,
      state.player.favor + payload.reward.favor
    );
  });

  return registry;
}
