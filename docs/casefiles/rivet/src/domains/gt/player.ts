/**
 * Player Commands - Edicts + Miracles
 *
 * Task 008: Player Commands (Edicts + Miracles)
 *
 * Implements:
 * - core.player component: favor=60 initial, cap=200, regen=+20/day
 * - core.player.cooldowns component: tracks availableAtTick per actionId
 * - core.player.dailyUsage component: edictsUsed (max 2/day), miraclesUsed (max 1/day)
 * - core.edict.active component: active edicts with deltaPriority
 * - Edict prioritize_job_kind: +200 priority, 3 day duration, 1 day cooldown
 * - Miracle complete_job: cost 60 favor, 3 day cooldown
 * - player.command_applied event for all accepted commands
 */

import type {
  WorldState,
  SimEvent,
  PlayerCommand,
  PlayerState,
  EdictPayload,
  MiraclePayload,
  AmbitionPayload,
} from './types/index.js';
import { EVENT_TYPES } from './types/index.js';
import { ReducerRegistry } from './kernel.js';
import type { CommandValidationResult } from './kernel.js';
import type { CoreJobComponent } from './job.js';

// === CONSTANTS ===

export const INITIAL_FAVOR = 60;
export const FAVOR_CAP = 200;
export const FAVOR_REGEN_PER_DAY = 20;

export const EDICT_PRIORITY_BONUS = 200;
export const EDICT_DURATION_DAYS = 3;
export const EDICT_COOLDOWN_DAYS = 1;

export const MIRACLE_FAVOR_COST = 60;
export const MIRACLE_COOLDOWN_DAYS = 3;

export const DAILY_EDICT_CAP = 2;
export const DAILY_MIRACLE_CAP = 1;

// Valid job kinds for edicts
export const VALID_JOB_KINDS: readonly string[] = ['job.harvest', 'job.build', 'job.repair'];

// === COMPONENT TYPES ===

export interface CorePlayerCooldownsComponent {
  availableAtTick: Record<string, number>; // actionId -> tick when available
}

export interface CorePlayerDailyUsageComponent {
  edictsUsed: number;
  miraclesUsed: number;
  lastResetDay: number;
}

export interface ActiveEdict {
  edictId: string;
  actionId: string;
  target: { jobKind: string };
  deltaPriority: number;
  issuedAtTick: number;
  expiresAtTick: number;
}

export interface CoreEdictActiveComponent {
  edicts: ActiveEdict[];
}

// === COMPONENT FACTORIES ===

/**
 * Create the player component with initial values
 */
export function createPlayerComponent(): PlayerState {
  return {
    favor: INITIAL_FAVOR,
    favorCap: FAVOR_CAP,
    favorRegenPerDay: FAVOR_REGEN_PER_DAY,
  };
}

/**
 * Create the cooldowns component
 */
export function createCooldownsComponent(): CorePlayerCooldownsComponent {
  return {
    availableAtTick: {},
  };
}

/**
 * Create the daily usage component
 */
export function createDailyUsageComponent(): CorePlayerDailyUsageComponent {
  return {
    edictsUsed: 0,
    miraclesUsed: 0,
    lastResetDay: 0,
  };
}

// === HELPER FUNCTIONS ===

/**
 * Check if an action is on cooldown
 */
export function isOnCooldown(
  cooldowns: Record<string, number>,
  actionId: string,
  currentTick: number
): boolean {
  const availableAt = cooldowns[actionId];
  if (availableAt === undefined) return false;
  return currentTick < availableAt;
}

/**
 * Get active edicts from world state
 */
export function getActiveEdicts(state: WorldState): ActiveEdict[] {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return [];

  const edictComp = worldEntity.components['core.edict.active'] as CoreEdictActiveComponent | undefined;
  if (!edictComp) return [];

  return edictComp.edicts;
}

/**
 * Get total priority bonus from active edicts for a job kind
 */
export function getEdictPriorityBonus(state: WorldState, jobKind: string): number {
  const edicts = getActiveEdicts(state);
  let bonus = 0;

  for (const edict of edicts) {
    if (edict.actionId === 'edict.prioritize_job_kind' && edict.target.jobKind === jobKind) {
      bonus += edict.deltaPriority;
    }
  }

  return bonus;
}

/**
 * Get cooldowns component from world state
 */
function getCooldowns(state: WorldState): Record<string, number> {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return {};

  const cooldownComp = worldEntity.components['core.player.cooldowns'] as CorePlayerCooldownsComponent | undefined;
  if (!cooldownComp) return {};

  return cooldownComp.availableAtTick;
}

/**
 * Get daily usage component from world state
 *
 * Task 002: AC-3 - Day-boundary logic uses state.calendar.ticksPerDay
 */
function getDailyUsage(state: WorldState, currentTick: number): CorePlayerDailyUsageComponent {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return { edictsUsed: 0, miraclesUsed: 0, lastResetDay: 0 };

  const usageComp = worldEntity.components['core.player.dailyUsage'] as CorePlayerDailyUsageComponent | undefined;
  if (!usageComp) return { edictsUsed: 0, miraclesUsed: 0, lastResetDay: 0 };

  // Check if we need to reset for a new day
  // Task 002: Use ticksPerDay from state calendar
  const ticksPerDay = state.calendar.ticksPerDay;
  const currentDay = Math.floor(currentTick / ticksPerDay);
  if (usageComp.lastResetDay < currentDay) {
    return { edictsUsed: 0, miraclesUsed: 0, lastResetDay: currentDay };
  }

  return usageComp;
}

/**
 * Apply favor regeneration at day boundary
 */
export function applyFavorRegen(state: WorldState): void {
  const regen = state.player.favorRegenPerDay;
  const cap = state.player.favorCap;
  state.player.favor = Math.min(cap, state.player.favor + regen);
}

// === COMMAND VALIDATION ===

/**
 * Create a unified command validator for all player commands
 * This validates commands BEFORE they generate player.command_applied events
 */
export function createCommandValidator(
  validateAmbition: (state: WorldState, command: PlayerCommand, currentTick: number) => CommandValidationResult
): (command: PlayerCommand, state: WorldState) => CommandValidationResult {
  return (command: PlayerCommand, state: WorldState): CommandValidationResult => {
    const currentTick = command.issuedAtTick;

    switch (command.type) {
      case 'edict.set':
        return validateEdictCommand(state, command, currentTick);

      case 'miracle.cast':
        return validateMiracleCommand(state, command, currentTick);

      case 'ambition.set':
        return validateAmbition(state, command, currentTick);

      default:
        // Unknown command type - let it through (might be handled elsewhere)
        return { valid: true };
    }
  };
}

/**
 * Validate an edict command
 */
export function validateEdictCommand(
  state: WorldState,
  command: PlayerCommand,
  currentTick: number
): CommandValidationResult {
  const payload = command.payload as EdictPayload;

  // Validate job kind
  if (!VALID_JOB_KINDS.includes(payload.target.jobKind)) {
    return { valid: false, reason: `Invalid job kind: ${payload.target.jobKind}` };
  }

  // Check daily cap
  const usage = getDailyUsage(state, currentTick);
  if (usage.edictsUsed >= DAILY_EDICT_CAP) {
    return { valid: false, reason: `Daily edict cap reached (${DAILY_EDICT_CAP}/day)` };
  }

  // Check cooldown
  const cooldowns = getCooldowns(state);
  if (isOnCooldown(cooldowns, payload.actionId, currentTick)) {
    const availableAt = cooldowns[payload.actionId]!;
    return {
      valid: false,
      reason: `Action on cooldown until tick ${availableAt}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a miracle command
 */
export function validateMiracleCommand(
  state: WorldState,
  command: PlayerCommand,
  currentTick: number
): CommandValidationResult {
  const payload = command.payload as MiraclePayload;

  // Check favor
  if (state.player.favor < MIRACLE_FAVOR_COST) {
    return {
      valid: false,
      reason: `Insufficient favor: have ${state.player.favor}, need ${MIRACLE_FAVOR_COST}`,
    };
  }

  // Check cooldown
  const cooldowns = getCooldowns(state);
  if (isOnCooldown(cooldowns, payload.actionId, currentTick)) {
    const availableAt = cooldowns[payload.actionId]!;
    return {
      valid: false,
      reason: `Action on cooldown until tick ${availableAt}`,
    };
  }

  // Check daily cap
  const usage = getDailyUsage(state, currentTick);
  if (usage.miraclesUsed >= DAILY_MIRACLE_CAP) {
    return { valid: false, reason: `Daily miracle cap reached (${DAILY_MIRACLE_CAP}/day)` };
  }

  // Check job exists and is not completed
  const jobEntity = state.entities[payload.target.jobId];
  if (!jobEntity || jobEntity.deletedTick !== undefined) {
    return { valid: false, reason: `Job not found: ${payload.target.jobId}` };
  }

  if (jobEntity.type !== 'job') {
    return { valid: false, reason: `Entity is not a job: ${payload.target.jobId}` };
  }

  const job = jobEntity.components['core.job'] as CoreJobComponent | undefined;
  if (!job) {
    return { valid: false, reason: `Job component not found: ${payload.target.jobId}` };
  }

  if (job.status === 'completed') {
    return { valid: false, reason: `Job already completed: ${payload.target.jobId}` };
  }

  return { valid: true };
}

// === PLAYER REDUCERS ===

export function playerReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  // core.edict.issued - add edict to active list
  registry.register(EVENT_TYPES.EDICT_ISSUED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      edictId: string;
      actionId: string;
      target: { jobKind: string };
      deltaPriority: number;
      expiresAtTick: number;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }

    let edictComp = worldEntity.components['core.edict.active'] as CoreEdictActiveComponent | undefined;
    if (!edictComp) {
      edictComp = { edicts: [] };
      worldEntity.components['core.edict.active'] = edictComp;
    }

    edictComp.edicts.push({
      edictId: payload.edictId,
      actionId: payload.actionId,
      target: payload.target,
      deltaPriority: payload.deltaPriority,
      issuedAtTick: event.tickIndex,
      expiresAtTick: payload.expiresAtTick,
    });

    // Update daily usage
    // Task 002: AC-3 - Use state.calendar.ticksPerDay
    const ticksPerDay = state.calendar.ticksPerDay;
    let usageComp = worldEntity.components['core.player.dailyUsage'] as CorePlayerDailyUsageComponent | undefined;
    if (!usageComp) {
      usageComp = createDailyUsageComponent();
      worldEntity.components['core.player.dailyUsage'] = usageComp;
    }

    const currentDay = Math.floor(event.tickIndex / ticksPerDay);
    if (usageComp.lastResetDay < currentDay) {
      usageComp.edictsUsed = 0;
      usageComp.miraclesUsed = 0;
      usageComp.lastResetDay = currentDay;
    }
    usageComp.edictsUsed++;

    // Update cooldown
    let cooldownComp = worldEntity.components['core.player.cooldowns'] as CorePlayerCooldownsComponent | undefined;
    if (!cooldownComp) {
      cooldownComp = createCooldownsComponent();
      worldEntity.components['core.player.cooldowns'] = cooldownComp;
    }

    cooldownComp.availableAtTick[payload.actionId] = event.tickIndex + EDICT_COOLDOWN_DAYS * ticksPerDay;
  });

  // core.edict.expired - remove edict from active list
  registry.register(EVENT_TYPES.EDICT_EXPIRED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      edictId: string;
    };

    const worldEntity = state.entities['world'];
    if (!worldEntity) return;

    const edictComp = worldEntity.components['core.edict.active'] as CoreEdictActiveComponent | undefined;
    if (!edictComp) return;

    edictComp.edicts = edictComp.edicts.filter((e) => e.edictId !== payload.edictId);
  });

  // core.player.favor_changed - update favor
  registry.register(EVENT_TYPES.FAVOR_CHANGED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      delta: number;
      reason: string;
      newFavor: number;
    };

    state.player.favor = payload.newFavor;
  });

  // player.command_applied - process commands and generate domain events
  registry.register(EVENT_TYPES.COMMAND_APPLIED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      commandId: string;
      commandType: string;
      commandPayload: EdictPayload | MiraclePayload | AmbitionPayload;
    };

    const currentTick = event.tickIndex;

    // Handle edict.set command
    if (payload.commandType === 'edict.set') {
      const edictPayload = payload.commandPayload as EdictPayload;

      // Validate the command
      const validationResult = validateEdictCommand(state, {
        commandId: payload.commandId,
        type: 'edict.set',
        payload: edictPayload,
        issuedAtTick: currentTick
      }, currentTick);

      if (!validationResult.valid) {
        return; // Command validation failed, skip processing
      }

      // Create edict
      const worldEntity = state.entities['world'];
      if (!worldEntity) return;

      let edictComp = worldEntity.components['core.edict.active'] as CoreEdictActiveComponent | undefined;
      if (!edictComp) {
        edictComp = { edicts: [] };
        worldEntity.components['core.edict.active'] = edictComp;
      }

      // Use commandId for deterministic edict ID (no Math.random for reproducibility)
      // Task 002: AC-3 - Use state.calendar.ticksPerDay
      const ticksPerDay = state.calendar.ticksPerDay;
      const edictId = `edict-${currentTick}-${payload.commandId}`;
      const expiresAtTick = currentTick + EDICT_DURATION_DAYS * ticksPerDay;

      edictComp.edicts.push({
        edictId,
        actionId: edictPayload.actionId,
        target: edictPayload.target,
        deltaPriority: EDICT_PRIORITY_BONUS,
        issuedAtTick: currentTick,
        expiresAtTick,
      });

      // Update daily usage
      let usageComp = worldEntity.components['core.player.dailyUsage'] as CorePlayerDailyUsageComponent | undefined;
      if (!usageComp) {
        usageComp = createDailyUsageComponent();
        worldEntity.components['core.player.dailyUsage'] = usageComp;
      }

      const currentDay = Math.floor(currentTick / ticksPerDay);
      if (usageComp.lastResetDay < currentDay) {
        usageComp.edictsUsed = 0;
        usageComp.miraclesUsed = 0;
        usageComp.lastResetDay = currentDay;
      }
      usageComp.edictsUsed++;

      // Update cooldown
      let cooldownComp = worldEntity.components['core.player.cooldowns'] as CorePlayerCooldownsComponent | undefined;
      if (!cooldownComp) {
        cooldownComp = createCooldownsComponent();
        worldEntity.components['core.player.cooldowns'] = cooldownComp;
      }
      cooldownComp.availableAtTick[edictPayload.actionId] = currentTick + EDICT_COOLDOWN_DAYS * ticksPerDay;
    }

    // Handle miracle.cast command
    if (payload.commandType === 'miracle.cast') {
      const miraclePayload = payload.commandPayload as MiraclePayload;

      // Validate the command
      const validationResult = validateMiracleCommand(state, {
        commandId: payload.commandId,
        type: 'miracle.cast',
        payload: miraclePayload,
        issuedAtTick: currentTick
      }, currentTick);

      if (!validationResult.valid) {
        return; // Command validation failed, skip processing
      }

      const worldEntity = state.entities['world'];
      if (!worldEntity) return;

      // Deduct favor
      state.player.favor = Math.max(0, state.player.favor - MIRACLE_FAVOR_COST);

      // Complete the job instantly
      const jobEntity = state.entities[miraclePayload.target.jobId];
      if (jobEntity) {
        const job = jobEntity.components['core.job'] as CoreJobComponent | undefined;
        if (job && job.status !== 'completed') {
          job.workDone = job.workRequired;
          job.status = 'completed';
          job.completedTick = currentTick;

          // Produce job outputs - import JOB_TEMPLATES for this
          // Note: We need to dynamically import or reference the template
          // For now, handle harvest jobs which produce 15 food
          if (job.templateId === 'jobtmpl.harvest.field') {
            const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
            if (stockpile?.resources) {
              stockpile.resources['res.food'] = (stockpile.resources['res.food'] ?? 0) + 15;
            }
          }
        }
      }

      // Update daily usage
      // Task 002: AC-3 - Use state.calendar.ticksPerDay
      const miracleTicksPerDay = state.calendar.ticksPerDay;
      let usageComp = worldEntity.components['core.player.dailyUsage'] as CorePlayerDailyUsageComponent | undefined;
      if (!usageComp) {
        usageComp = createDailyUsageComponent();
        worldEntity.components['core.player.dailyUsage'] = usageComp;
      }

      const currentDay = Math.floor(currentTick / miracleTicksPerDay);
      if (usageComp.lastResetDay < currentDay) {
        usageComp.edictsUsed = 0;
        usageComp.miraclesUsed = 0;
        usageComp.lastResetDay = currentDay;
      }
      usageComp.miraclesUsed++;

      // Update cooldown
      let cooldownComp = worldEntity.components['core.player.cooldowns'] as CorePlayerCooldownsComponent | undefined;
      if (!cooldownComp) {
        cooldownComp = createCooldownsComponent();
        worldEntity.components['core.player.cooldowns'] = cooldownComp;
      }
      cooldownComp.availableAtTick[miraclePayload.actionId] = currentTick + MIRACLE_COOLDOWN_DAYS * miracleTicksPerDay;
    }

    // Handle ambition.set command
    if (payload.commandType === 'ambition.set') {
      const ambitionPayload = payload.commandPayload as AmbitionPayload;
      const trackId = ambitionPayload.target.trackId;

      const worldEntity = state.entities['world'];
      if (!worldEntity) return;

      // Import dynamically for now - in real implementation would import properly
      // Validate track exists (basic check)
      const validTracks = ['food_security', 'sanctuary'];
      if (!validTracks.includes(trackId)) {
        return; // Invalid track
      }

      interface AmbitionState {
        activeTrackId: string | undefined;
        progress: Record<string, number | boolean>;
        completedTracks: string[];
        maintainStartDay?: number;
      }

      let ambition = worldEntity.components['core.ambition'] as AmbitionState | undefined;

      if (!ambition) {
        const newAmbition: AmbitionState = {
          activeTrackId: undefined,
          progress: {},
          completedTracks: [],
        };
        worldEntity.components['core.ambition'] = newAmbition;
        ambition = newAmbition;
      }

      // Check not already completed
      if (ambition.completedTracks.includes(trackId)) {
        return;
      }

      ambition.activeTrackId = trackId;
      // Task 002: AC-3 - Use state.calendar.ticksPerDay
      ambition.maintainStartDay = Math.floor(currentTick / state.calendar.ticksPerDay);

      // Initialize progress
      if (trackId === 'food_security') {
        ambition.progress = { harvestCount: 0, maintainDaysMet: 0 };
      } else if (trackId === 'sanctuary') {
        ambition.progress = { shrineRepaired: false, maintainDaysMet: 0 };
      }
    }
  });

  return registry;
}
