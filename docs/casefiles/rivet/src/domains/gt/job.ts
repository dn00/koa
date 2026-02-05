/**
 * Job System
 *
 * Task 006: Job System
 *
 * Implements:
 * - Job entity type and core.job component
 * - All job event types and reducers
 * - Job system (runs after NPC system)
 * - Job scoring for NPC intent
 * - Claim arbitration logic
 * - Work progress logic (25 work per tick for MVP)
 * - Completion detection
 * - Auto-spawn system (runs at day boundary)
 * - 3 job templates from GT22
 */

import type {
  WorldState,
  EntityRecord,
  SimEvent,
  EventType,
  NeedId,
} from './types/index.js';
import type { SystemContext, Reducer } from './kernel.js';
import { ReducerRegistry } from './kernel.js';
import { EVENT_TYPES, dayIndexFromTick } from './types/index.js';
import { applyStockpileDelta, type StockpileDelta } from './economy.js';

// === COMPONENT TYPES ===

export type JobStatus = 'open' | 'claimed' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type JobKind = 'job.harvest' | 'job.build' | 'job.repair';

export interface CoreJobComponent {
  jobId: string;
  kind: JobKind;
  placeId: string;
  templateId: string;

  // Ownership
  createdTick: number;
  createdBy: { source: 'system' | 'player'; systemId?: string; commandId?: string };

  // Priority
  priority: number; // -1000..1000 (higher = more urgent)
  urgencyClass: number; // 0..9 (0 = highest)

  // Work accounting (integers)
  workRequired: number;
  workDone: number;
  status: JobStatus;

  // Claim
  claimedByNpcId?: string;
  claimedTick?: number;
  startedTick?: number;
  completedTick?: number;

  // Eligibility (MVP: minimal)
  requiredTags?: string[];
  forbiddenTags?: string[];

  // Presentation
  titleKey?: string;
}

// === JOB TEMPLATE ===

export interface JobTemplateOutput {
  resourceId: string;
  amount: number;
}

export interface JobTemplateInput {
  resourceId: string;
  amount: number;
}

export interface JobTemplateDef {
  templateId: string;
  kind: JobKind;
  workRequired: number;
  basePriority: number;
  urgencyClass: number;
  outputs?: JobTemplateOutput[];
  inputs?: JobTemplateInput[];
  titleKey: string;
  placeId?: string; // Default place for this template
  requiredTags?: string[];
}

// === PACK JOB TEMPLATE DEF (Task 007) ===
// This type matches the pack JobTemplateDef format from @gt/packs

export interface PackJobTemplateDef {
  templateId: string;
  titleKey: string;
  kind: string;
  workRequired: number;
  basePriority: number;
  urgencyClass: number;
  requiredTags: string[];
  inputResources: Record<string, number>;
  outputResources: Record<string, number>;
  placeId?: string;
}

// === JOB TEMPLATE REGISTRY (Task 007) ===

/**
 * Job template registry for pack-authoritative templates.
 * Task 007: AC-1 - Job templates sourced from rules pack
 */
export type JobTemplateRegistry = Map<string, JobTemplateDef>;

/**
 * Create a job template registry from pack data.
 * Task 007: AC-1 - Converts pack JobTemplateDef to kernel JobTemplateDef
 *
 * @param packTemplates - Job templates from the rules pack
 * @returns Registry mapping templateId to kernel JobTemplateDef
 */
export function createJobTemplateRegistry(packTemplates: PackJobTemplateDef[]): JobTemplateRegistry {
  const registry = new Map<string, JobTemplateDef>();

  for (const packTemplate of packTemplates) {
    // Convert pack format to kernel format
    const kernelTemplate: JobTemplateDef = {
      templateId: packTemplate.templateId,
      kind: `job.${packTemplate.kind}` as JobKind, // Pack uses 'harvest', kernel uses 'job.harvest'
      workRequired: packTemplate.workRequired,
      basePriority: packTemplate.basePriority,
      urgencyClass: packTemplate.urgencyClass,
      titleKey: packTemplate.titleKey,
      requiredTags: packTemplate.requiredTags,
      outputs: Object.entries(packTemplate.outputResources).map(([resourceId, amount]) => ({
        resourceId,
        amount,
      })),
      inputs: Object.entries(packTemplate.inputResources).map(([resourceId, amount]) => ({
        resourceId,
        amount,
      })),
    };

    if (packTemplate.placeId !== undefined) {
      kernelTemplate.placeId = packTemplate.placeId;
    }

    registry.set(packTemplate.templateId, kernelTemplate);
  }

  return registry;
}

/**
 * Get a job template from the registry.
 * Task 007: AC-3 - Returns undefined for unknown templateId
 *
 * @param registry - The job template registry
 * @param templateId - The template ID to look up
 * @returns The template definition or undefined
 */
export function getJobTemplate(registry: JobTemplateRegistry, templateId: string): JobTemplateDef | undefined {
  return registry.get(templateId);
}

/**
 * Validate that all required templates are present in the registry.
 * Task 007: ERR-1 - Throws if required template is missing
 *
 * @param registry - The job template registry
 * @param requiredTemplateIds - List of required template IDs
 * @throws Error if a required template is missing
 */
export function validateRequiredTemplates(registry: JobTemplateRegistry, requiredTemplateIds: string[]): void {
  for (const templateId of requiredTemplateIds) {
    if (!registry.has(templateId)) {
      throw new Error(`Missing job template: ${templateId}`);
    }
  }
}

// === LEGACY JOB_TEMPLATES (deprecated, kept for backward compatibility) ===
// Task 007: AC-2 - These are deprecated; use JobTemplateRegistry instead

/**
 * @deprecated Use createJobTemplateRegistry() with pack data instead.
 * This constant is kept for backward compatibility only.
 */
export const JOB_TEMPLATES: Record<string, JobTemplateDef> = {
  'jobtmpl.harvest.field': {
    templateId: 'jobtmpl.harvest.field',
    kind: 'job.harvest',
    workRequired: 80,
    basePriority: 250,
    urgencyClass: 1,
    outputs: [{ resourceId: 'res.food', amount: 15 }],
    titleKey: 'job.harvest.field.title',
    placeId: 'p.farm',
  },
  'jobtmpl.build.storage': {
    templateId: 'jobtmpl.build.storage',
    kind: 'job.build',
    workRequired: 120,
    basePriority: 180,
    urgencyClass: 2,
    inputs: [
      { resourceId: 'res.wood', amount: 10 },
      { resourceId: 'res.stone', amount: 5 },
    ],
    outputs: [],
    titleKey: 'job.build.storage.title',
    placeId: 'p.workshop',
  },
  'jobtmpl.repair.shrine': {
    templateId: 'jobtmpl.repair.shrine',
    kind: 'job.repair',
    workRequired: 160,
    basePriority: 220,
    urgencyClass: 1,
    inputs: [{ resourceId: 'res.stone', amount: 6 }],
    outputs: [],
    titleKey: 'job.repair.shrine.title',
    placeId: 'p.shrine',
  },
};

// === CONSTANTS ===

export const JOB_WORK_PER_TICK = 25;
export const AUTO_SPAWN_FOOD_THRESHOLD = 30;

// === HELPER FUNCTIONS ===

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function getStockpile(state: WorldState): Record<string, number> {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return {};
  const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
  return stockpile?.resources ?? {};
}

function getStockpileComponentForInputs(state: WorldState): { resources: Record<string, number> } {
  const worldEntity = state.entities['world'];
  if (!worldEntity) {
    throw new Error('World entity not found');
  }

  const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
  if (!stockpile || !stockpile.resources) {
    throw new Error('Stockpile missing for job inputs');
  }

  return stockpile as { resources: Record<string, number> };
}

function getNpcLocation(state: WorldState, npcId: string): string | null {
  const npc = state.entities[npcId];
  if (!npc) return null;
  const location = npc.components['core.location'] as { placeId?: string } | undefined;
  return location?.placeId ?? null;
}

function getJobTemplateFromRegistry(
  templateId: string,
  registry?: JobTemplateRegistry
): JobTemplateDef | undefined {
  return registry?.get(templateId) ?? JOB_TEMPLATES[templateId];
}

function hasActiveJobWithTemplate(state: WorldState, templateId: string): boolean {
  for (const entity of Object.values(state.entities)) {
    if (entity.type !== 'job' || entity.deletedTick !== undefined) continue;
    const job = entity.components['core.job'] as CoreJobComponent | undefined;
    if (!job) continue;
    if (job.templateId !== templateId) continue;
    if (job.status === 'open' || job.status === 'claimed' || job.status === 'in_progress') {
      return true;
    }
  }
  return false;
}

function hasCompletedJobWithTemplate(state: WorldState, templateId: string): boolean {
  for (const entity of Object.values(state.entities)) {
    if (entity.type !== 'job' || entity.deletedTick !== undefined) continue;
    const job = entity.components['core.job'] as CoreJobComponent | undefined;
    if (!job) continue;
    if (job.templateId === templateId && job.status === 'completed') {
      return true;
    }
  }
  return false;
}

function findPlaceIdByTag(state: WorldState, tag: string): string | undefined {
  const placeIds = Object.values(state.entities)
    .filter((entity) => entity.type === 'place' && !entity.deletedTick)
    .filter((entity) => {
      const placeComp = entity.components['core.place'] as { tags?: string[] } | undefined;
      return placeComp?.tags?.includes(tag);
    })
    .map((entity) => entity.id)
    .sort((a, b) => compareStrings(a, b));

  return placeIds[0];
}

function applyJobResourceChanges(
  state: WorldState,
  template: JobTemplateDef
): boolean {
  const inputs = template.inputs ?? [];
  const outputs = template.outputs ?? [];

  if (inputs.length === 0 && outputs.length === 0) {
    return true;
  }

  let stockpile: { resources: Record<string, number> };

  if (inputs.length > 0) {
    stockpile = getStockpileComponentForInputs(state);

    for (const input of inputs.slice().sort((a, b) => compareStrings(a.resourceId, b.resourceId))) {
      const available = stockpile.resources[input.resourceId] ?? 0;
      if (available < input.amount) {
        return false;
      }
    }
  } else {
    const worldEntity = state.entities['world'];
    if (!worldEntity) {
      throw new Error('World entity not found');
    }
    let comp = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
    if (!comp) {
      comp = { resources: {} };
      worldEntity.components['core.stockpile'] = comp;
    }
    if (!comp.resources) {
      comp.resources = {};
    }
    stockpile = comp as { resources: Record<string, number> };
  }

  const deltaByResource = new Map<string, number>();

  for (const input of inputs) {
    const current = deltaByResource.get(input.resourceId) ?? 0;
    deltaByResource.set(input.resourceId, current - input.amount);
  }

  for (const output of outputs) {
    const current = deltaByResource.get(output.resourceId) ?? 0;
    deltaByResource.set(output.resourceId, current + output.amount);
  }

  const deltas: StockpileDelta[] = Array.from(deltaByResource.entries())
    .sort(([a], [b]) => compareStrings(a, b))
    .map(([resourceId, amount]) => ({ resourceId, amount }));

  stockpile.resources = applyStockpileDelta(stockpile.resources, deltas);
  return true;
}

// === JOB ENTITY FACTORY ===

export function createJobEntity(
  jobId: string,
  kind: JobKind,
  placeId: string,
  templateId: string,
  workRequired: number,
  priority: number,
  urgencyClass: number,
  createdTick: number,
  createdBy: { source: 'system' | 'player'; systemId?: string },
  requiredTags?: string[]
): EntityRecord {
  const job: CoreJobComponent = {
    jobId,
    kind,
    placeId,
    templateId,
    createdTick,
    createdBy,
    priority,
    urgencyClass,
    workRequired,
    workDone: 0,
    status: 'open',
  };

  if (requiredTags !== undefined) {
    job.requiredTags = requiredTags;
  }

  return {
    id: jobId,
    type: 'job',
    createdTick,
    components: {
      'core.job': job,
    },
  };
}

/**
 * Create a job entity from a template.
 * Task 007: AC-1, AC-3 - Uses pack-sourced templates via registry
 *
 * @param template - The template definition (must not be undefined)
 * @param placeId - The place where the job is located
 * @param createdTick - The tick when the job was created
 * @param jobId - The unique job ID
 * @param registry - Optional registry (for validation/future use)
 * @returns The job entity record
 * @throws Error if template is undefined
 */
export function createJobFromTemplate(
  template: JobTemplateDef | undefined,
  placeId: string,
  createdTick: number,
  jobId: string,
  registry?: JobTemplateRegistry
): EntityRecord {
  if (!template) {
    throw new Error('Cannot create job from undefined template');
  }

  return createJobEntity(
    jobId,
    template.kind,
    placeId,
    template.templateId,
    template.workRequired,
    template.basePriority,
    template.urgencyClass,
    createdTick,
    { source: 'system', systemId: 'job.autospawn' },
    template.requiredTags
  );
}

// === JOB QUERIES ===

/**
 * List all open jobs in the world
 */
export function listOpenJobs(state: WorldState): EntityRecord[] {
  const jobs: EntityRecord[] = [];

  for (const entity of Object.values(state.entities)) {
    if (entity.type !== 'job' || entity.deletedTick !== undefined) continue;

    const job = entity.components['core.job'] as CoreJobComponent | undefined;
    if (job && job.status === 'open') {
      jobs.push(entity);
    }
  }

  // Sort by jobId for deterministic iteration
  return jobs.sort((a, b) => compareStrings(a.id, b.id));
}

/**
 * Check if a harvest job exists (open or in_progress)
 */
export function hasActiveHarvestJob(state: WorldState): boolean {
  for (const entity of Object.values(state.entities)) {
    if (entity.type !== 'job' || entity.deletedTick !== undefined) continue;

    const job = entity.components['core.job'] as CoreJobComponent | undefined;
    if (job && job.kind === 'job.harvest' && (job.status === 'open' || job.status === 'in_progress' || job.status === 'claimed')) {
      return true;
    }
  }
  return false;
}

/**
 * Score a job for an NPC
 *
 * Formula: 100 + 10*(9-urgencyClass) + priority - distCost
 *
 * Tie-break: urgencyClass asc, priority desc, createdTick asc, jobId asc
 */
export function scoreJobForNpc(job: CoreJobComponent, distCost: number): number {
  return 100 + 10 * (9 - job.urgencyClass) + job.priority - distCost;
}

// === JOB SYSTEM ===

/**
 * Job system - runs after NPC system each tick
 *
 * Responsibilities:
 * - Track job state transitions
 * - Handle completion events
 */
export function jobSystem(ctx: SystemContext): void {
  // Job system primarily reacts to events proposed by NPC system
  // The actual work is done in reducers
  // This system can add any per-tick job logic if needed

  const jobs = ctx.getEntitiesByType('job');

  for (const jobEntity of jobs) {
    const job = jobEntity.components['core.job'] as CoreJobComponent;
    if (!job) continue;

    // Check for any jobs that need cleanup
    // (Future: timeout logic, etc.)
  }
}

// === AUTO-SPAWN SYSTEM ===

/**
 * Auto-spawn config for configurable thresholds.
 * Task 004: AC-3 - Allows override of food auto-spawn threshold.
 */
export interface AutoSpawnConfig {
  foodAutoSpawnThreshold: number;
}

/**
 * Auto-spawn system - runs at day boundary
 *
 * Rules (GT22 section 7.3):
 * - If food < threshold: ensure harvest job exists (spawn if none open/in_progress)
 *
 * Task 002: AC-3 - Day-boundary logic uses state.calendar.ticksPerDay
 * Task 004: AC-3 - Uses configurable foodAutoSpawnThreshold from config
 * Task 007: AC-1 - Use JobTemplateRegistry when available, fallback to JOB_TEMPLATES
 *
 * @param ctx - System context
 * @param prevDayIndex - Previous day index for day boundary detection
 * @param registry - Optional job template registry (from pack data)
 * @param autoSpawnConfig - Optional config for auto-spawn thresholds (Task 004)
 */
export function autoSpawnSystem(
  ctx: SystemContext,
  prevDayIndex: number,
  registry?: JobTemplateRegistry,
  autoSpawnConfig?: AutoSpawnConfig
): void {
  // Task 002: Use ticksPerDay from state calendar
  const ticksPerDay = ctx.state.calendar.ticksPerDay;
  const currentDayIndex = dayIndexFromTick(ctx.tickIndex, ticksPerDay);

  // Only run at day boundary
  if (currentDayIndex === prevDayIndex) return;

  const stockpile = getStockpile(ctx.state);
  const food = stockpile['res.food'] ?? 0;

  // Task 004: AC-3, ERR-1 - Use configurable threshold (fallback to constant)
  // Clamp negative values to 0 (means "always spawn if no active job")
  // NaN/Infinity are caught by validateEmergenceConfig at world creation
  const rawThreshold = autoSpawnConfig?.foodAutoSpawnThreshold ?? AUTO_SPAWN_FOOD_THRESHOLD;
  const foodThreshold = Math.max(0, rawThreshold);

  // Check if we need to spawn a harvest job
  // Task 007: AC-1 - Use JobTemplateRegistry when available, fallback to JOB_TEMPLATES
  if (food < foodThreshold && !hasActiveHarvestJob(ctx.state)) {
    // Try registry first, then fallback to legacy JOB_TEMPLATES
    const template = getJobTemplateFromRegistry('jobtmpl.harvest.field', registry);
    if (template) {
      const jobId = `job.harvest.${ctx.tickIndex}`;

      // Find a place with 'food' tag (deterministic: sort by id)
      const targetPlace = findPlaceIdByTag(ctx.state, 'food') ?? template.placeId ?? 'p.farm';

      ctx.proposeEvent(EVENT_TYPES.JOB_CREATED, {
        jobId,
        kind: template.kind,
        placeId: targetPlace,
        templateId: template.templateId,
        workRequired: template.workRequired,
        priority: template.basePriority,
        urgencyClass: template.urgencyClass,
        requiredTags: template.requiredTags,
        createdBy: { source: 'system', systemId: 'job.autospawn' },
      }, { placeIds: [targetPlace] });
    }
    // else: Template not found - skip this job, continue to other auto-spawn rules
  }

  // Ensure shrine repair job exists unless already completed
  const repairTemplateId = 'jobtmpl.repair.shrine';
  if (!hasCompletedJobWithTemplate(ctx.state, repairTemplateId) &&
      !hasActiveJobWithTemplate(ctx.state, repairTemplateId)) {
    const template = getJobTemplateFromRegistry(repairTemplateId, registry);
    if (template) {
      const jobId = `job.repair.${ctx.tickIndex}`;
      const targetPlace = template.placeId ?? findPlaceIdByTag(ctx.state, 'spiritual');
      if (targetPlace) {
        ctx.proposeEvent(EVENT_TYPES.JOB_CREATED, {
          jobId,
          kind: template.kind,
          placeId: targetPlace,
          templateId: template.templateId,
          workRequired: template.workRequired,
          priority: template.basePriority,
          urgencyClass: template.urgencyClass,
          requiredTags: template.requiredTags,
          createdBy: { source: 'system', systemId: 'job.autospawn' },
        }, { placeIds: [targetPlace] });
      }
      // else: No valid place - skip this job
    }
    // else: Template not found - skip this job
  }
}

// === JOB REDUCERS ===

/**
 * Create job reducers registry.
 * Task 007: AC-1 - Use JobTemplateRegistry when available, fallback to JOB_TEMPLATES
 *
 * @param templateRegistry - Optional job template registry (from pack data)
 */
export function jobReducers(templateRegistry?: JobTemplateRegistry): ReducerRegistry {
  const registry = new ReducerRegistry();

  // core.job.created
  registry.register(EVENT_TYPES.JOB_CREATED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      kind: JobKind;
      placeId: string;
      templateId: string;
      workRequired: number;
      priority: number;
      urgencyClass: number;
      requiredTags?: string[];
      createdBy: { source: 'system' | 'player'; systemId?: string };
    };

    const jobEntity = createJobEntity(
      payload.jobId,
      payload.kind,
      payload.placeId,
      payload.templateId,
      payload.workRequired,
      payload.priority,
      payload.urgencyClass,
      event.tickIndex,
      payload.createdBy,
      payload.requiredTags
    );

    state.entities[payload.jobId] = jobEntity;
  });

  // core.job.claimed
  registry.register(EVENT_TYPES.JOB_CLAIMED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      npcId: string;
    };

    const jobEntity = state.entities[payload.jobId];
    if (!jobEntity) return;

    const job = jobEntity.components['core.job'] as CoreJobComponent;

    // Handle race conditions: multiple NPCs may try to claim same job in same tick
    // Only the first claim succeeds, subsequent claims are silently ignored
    if (job.status !== 'open') {
      // Already claimed - if by same NPC, it's fine; if by another, they won the race
      return;
    }

    job.status = 'claimed';
    job.claimedByNpcId = payload.npcId;
    job.claimedTick = event.tickIndex;
  });

  // core.job.progressed
  registry.register(EVENT_TYPES.JOB_PROGRESSED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      npcId: string;
      workAmount: number;
    };

    const jobEntity = state.entities[payload.jobId];
    if (!jobEntity) {
      throw new Error(`Job ${payload.jobId} not found`);
    }

    const job = jobEntity.components['core.job'] as CoreJobComponent;

    // Validate NPC is at job location
    const npcLocation = getNpcLocation(state, payload.npcId);
    if (npcLocation !== job.placeId) {
      throw new Error(
        `NPC not at job location: ${payload.npcId} at ${npcLocation}, job at ${job.placeId}`
      );
    }

    // Validate job is claimed by this NPC
    if (job.claimedByNpcId !== payload.npcId) {
      throw new Error(`Job ${payload.jobId} not claimed by ${payload.npcId}`);
    }

    // Apply work progress
    job.workDone = Math.min(job.workRequired, job.workDone + payload.workAmount);

    // Update status
    if (job.status === 'claimed') {
      job.status = 'in_progress';
      job.startedTick = event.tickIndex;
    }

    // Check for completion (only produce outputs once, when transitioning to completed)
    const wasNotCompleted = job.status !== 'completed';
    if (job.workDone >= job.workRequired && wasNotCompleted) {
      // Produce outputs and consume inputs based on template
      // Task 007: AC-1, AC-3 - Use JobTemplateRegistry when available, fallback to JOB_TEMPLATES
      const template = getJobTemplateFromRegistry(job.templateId, templateRegistry);
      if (template) {
        const completed = applyJobResourceChanges(state, template);
        if (!completed) {
          return;
        }
      }

      job.status = 'completed';
      job.completedTick = event.tickIndex;
    }
  });

  // core.job.completed
  registry.register(EVENT_TYPES.JOB_COMPLETED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      npcId: string;
      templateId?: string;
    };

    const jobEntity = state.entities[payload.jobId];
    if (!jobEntity) return;

    const job = jobEntity.components['core.job'] as CoreJobComponent;

    // Set completed if not already (JOB_PROGRESSED may have set it)
    if (job.status !== 'completed') {
      const templateId = payload.templateId ?? job.templateId;
      const template = getJobTemplateFromRegistry(templateId, templateRegistry);
      if (template) {
        const completed = applyJobResourceChanges(state, template);
        if (!completed) {
          return;
        }
      }

      job.status = 'completed';
      job.completedTick = event.tickIndex;
    }

    // Always release NPC claim on completion event
    if (job.status === 'completed') {
      delete job.claimedByNpcId;
      delete job.claimedTick;
    }
  });

  // core.job.released (EC-3)
  registry.register('core.job.released' as EventType, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      npcId: string;
      reason: string;
    };

    const jobEntity = state.entities[payload.jobId];
    if (!jobEntity) return;

    const job = jobEntity.components['core.job'] as CoreJobComponent;

    // Return job to open status
    job.status = 'open';
    delete job.claimedByNpcId;
    delete job.claimedTick;
    delete job.startedTick;
  });

  // core.job.cancelled
  registry.register(EVENT_TYPES.JOB_CANCELLED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      jobId: string;
      reason?: string;
    };

    const jobEntity = state.entities[payload.jobId];
    if (!jobEntity) return;

    const job = jobEntity.components['core.job'] as CoreJobComponent;
    job.status = 'cancelled';
  });

  return registry;
}
