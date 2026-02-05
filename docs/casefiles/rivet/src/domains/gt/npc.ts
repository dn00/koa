/**
 * NPC System - Needs, Travel, and Intent
 *
 * Task 005: NPC System (Needs + Travel + Intent)
 *
 * Implements:
 * - core.location component
 * - core.travel component
 * - core.npc.needs component with lazy updates
 * - core.npc.intent component
 * - NPC system (runs each tick)
 * - Intent scoring and selection
 * - Travel start/progress/arrive logic
 * - Satisfy need actions (eat, sleep)
 * - NPC event reducers
 */

import type {
  WorldState,
  EntityRecord,
  SimEvent,
  EventType,
  NeedId,
  NEED_CONFIG,
} from './types/index.js';
import type { SystemContext, Reducer } from './kernel.js';
import { ReducerRegistry } from './kernel.js';
import type { PlaceGraphComponent } from './placegraph.js';
import { shortestPath } from './placegraph.js';
import { EVENT_TYPES } from './types/index.js';
import { getRumorModifiers } from './rumor.js';

// === COMPONENT TYPES ===

export interface CoreLocationComponent {
  placeId: string;
}

export interface CoreTravelComponent {
  status: 'idle' | 'traveling';
  fromPlaceId?: string;
  toPlaceId?: string;
  edgeKind?: string;
  remainingCost?: number; // integer ticks remaining
  startedTick?: number;
}

export interface NeedState {
  value: number; // 0..1000
  lastUpdatedTick: number;
}

export interface CoreNpcNeedsComponent {
  needs: Record<NeedId, NeedState>;
  rates: Record<NeedId, number>; // per-tick increase (integers)
  criticalThreshold: number;
  criticalEmitted?: Partial<Record<NeedId, boolean>>; // Track if critical event was emitted
}

export type IntentType = 'idle' | 'satisfy_need' | 'travel_to_place' | 'do_job';

export interface CoreNpcIntentComponent {
  intentType: IntentType;
  targetNeedId?: NeedId;
  targetPlaceId?: string;
  targetJobId?: string;
  plannedPath?: string[];
  startedTick: number;
  minCommitTicks: number;
  computedPriority: number;
}

// === CONSTANTS ===

export const NPC_WORK_AMOUNT = 25;
export const DEFAULT_MIN_COMMIT_TICKS = 3;
export const CRITICAL_THRESHOLD = 850;

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Intent ranking for tie-breaks (lower = higher priority)
const INTENT_RANK: Record<IntentType, number> = {
  satisfy_need: 0,
  do_job: 1,
  idle: 2,
  travel_to_place: 1, // Same as do_job
};

// === INTENT OPTION ===

export interface IntentOption {
  intentType: IntentType;
  targetNeedId?: NeedId;
  targetPlaceId?: string;
  targetJobId?: string;
  score: number;
  rank: number;
}

// === COMPONENT FACTORIES ===

export function createNpcNeedsComponent(
  hungerValue: number = 0,
  sleepValue: number = 0,
  lastUpdatedTick: number = 0
): CoreNpcNeedsComponent {
  return {
    needs: {
      hunger: { value: hungerValue, lastUpdatedTick },
      sleep: { value: sleepValue, lastUpdatedTick },
    },
    rates: { hunger: 3, sleep: 2 },
    criticalThreshold: CRITICAL_THRESHOLD,
    criticalEmitted: {},
  };
}

export function createNpcIntentComponent(
  startedTick: number = 0
): CoreNpcIntentComponent {
  return {
    intentType: 'idle',
    startedTick,
    minCommitTicks: DEFAULT_MIN_COMMIT_TICKS,
    computedPriority: 0,
  };
}

// === LAZY NEED UPDATE ===

export function applyNeedDecay(
  need: NeedState,
  rate: number,
  nowTick: number
): NeedState {
  const dt = nowTick - need.lastUpdatedTick;
  if (dt <= 0) return need;

  const nextValue = Math.min(1000, Math.max(0, need.value + dt * rate));
  return { value: nextValue, lastUpdatedTick: nowTick };
}

// === INTENT SCORING ===

/**
 * Score a satisfy_need intent
 * Formula: 3 * need.value - distCost
 */
export function scoreNeedIntent(needValue: number, distCost: number): number {
  return 3 * needValue - distCost;
}

/**
 * Score a do_job intent
 * Formula: 400 - distCost - (sleep > 800 ? 200 : 0)
 */
export function scoreJobIntent(distCost: number, sleepValue: number): number {
  const sleepPenalty = sleepValue > 800 ? 200 : 0;
  return 400 - distCost - sleepPenalty;
}

/**
 * Score an intent option
 */
export function scoreIntent(
  option: IntentOption,
  needValues: Record<NeedId, number>,
  distCost: number
): number {
  switch (option.intentType) {
    case 'satisfy_need':
      const needId = option.targetNeedId!;
      return scoreNeedIntent(needValues[needId], distCost);
    case 'do_job':
      return scoreJobIntent(distCost, needValues.sleep);
    case 'idle':
      return 0;
    default:
      return 0;
  }
}

/**
 * Select best intent from options using deterministic tie-breaking
 *
 * Tie-break rules (GK11 section 8.5):
 * 1. Higher score wins
 * 2. Smaller intentRank
 * 3. Lex smallest targetPlaceId
 * 4. Lex smallest targetJobId
 * 5. RNG if still tied
 */
export function selectBestIntent(options: IntentOption[], rngValue: number): IntentOption {
  if (options.length === 0) {
    return { intentType: 'idle', score: 0, rank: INTENT_RANK.idle };
  }

  // Sort by: score desc, rank asc, targetPlaceId asc, targetJobId asc
  const sorted = [...options].sort((a, b) => {
    // 1. Higher score wins
    if (b.score !== a.score) return b.score - a.score;

    // 2. Smaller rank wins
    if (a.rank !== b.rank) return a.rank - b.rank;

    // 3. Lex smallest targetPlaceId
    const placeA = a.targetPlaceId ?? '';
    const placeB = b.targetPlaceId ?? '';
    if (placeA !== placeB) return compareStrings(placeA, placeB);

    // 4. Lex smallest targetJobId
    const jobA = a.targetJobId ?? '';
    const jobB = b.targetJobId ?? '';
    if (jobA !== jobB) return compareStrings(jobA, jobB);

    // 5. RNG (handled by caller if truly tied)
    return 0;
  });

  return sorted[0]!;
}

// === HELPER FUNCTIONS ===

function getPlaceGraph(state: WorldState): PlaceGraphComponent | null {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return null;
  return worldEntity.components['core.placegraph'] as PlaceGraphComponent | undefined ?? null;
}

function getPlaceTags(state: WorldState, placeId: string): string[] {
  const place = state.entities[placeId];
  if (!place || place.type !== 'place') return [];
  const placeComp = place.components['core.place'] as { tags?: string[] } | undefined;
  return placeComp?.tags ?? [];
}

function placeHasTag(state: WorldState, placeId: string, tag: string): boolean {
  return getPlaceTags(state, placeId).includes(tag);
}

function placeExists(state: WorldState, placeId: string): boolean {
  const entity = state.entities[placeId];
  return entity !== undefined && entity.type === 'place' && entity.deletedTick === undefined;
}

function findFoodPlace(state: WorldState): string | null {
  for (const entity of Object.values(state.entities)) {
    if (entity.type === 'place' && !entity.deletedTick) {
      const placeComp = entity.components['core.place'] as { tags?: string[] } | undefined;
      if (placeComp?.tags?.includes('food')) {
        return entity.id;
      }
    }
  }
  return null;
}

function getStockpile(state: WorldState): Record<string, number> {
  const worldEntity = state.entities['world'];
  if (!worldEntity) return {};
  const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
  return stockpile?.resources ?? {};
}

function getNpcLocation(entity: EntityRecord): string | null {
  const location = entity.components['core.location'] as CoreLocationComponent | undefined;
  return location?.placeId ?? null;
}

function getNpcHome(entity: EntityRecord): string | null {
  const npcComp = entity.components['core.npc'] as { homePlaceId?: string } | undefined;
  return npcComp?.homePlaceId ?? null;
}

// === NPC SYSTEM CONFIG ===

/**
 * Configuration for the NPC system.
 *
 * Task 003: Critical Need Override Intent
 */
export interface NpcSystemConfig {
  criticalNeedOverridesJob: boolean;
}

/**
 * Default NPC system configuration (backwards compatible).
 */
export const DEFAULT_NPC_SYSTEM_CONFIG: NpcSystemConfig = {
  criticalNeedOverridesJob: false,
};

// === CRITICAL NEED OVERRIDE HELPER ===

/**
 * Get the critical need that should override job intent.
 *
 * Task 003: AC-1, EC-1
 *
 * Returns the highest-value need that is at or above criticalThreshold.
 * Ties are broken lexicographically by NeedId for determinism.
 *
 * @param needsComp - The NPC's needs component
 * @param tickIndex - Current tick for lazy need calculation
 * @returns The critical need info, or null if no need is critical
 */
export function getCriticalNeedOverride(
  needsComp: CoreNpcNeedsComponent,
  tickIndex: number
): { needId: NeedId; value: number } | null {
  const criticalNeeds: Array<{ needId: NeedId; value: number }> = [];

  for (const needId of ['hunger', 'sleep'] as NeedId[]) {
    const need = needsComp.needs[needId];
    const rate = needsComp.rates[needId];
    const updated = applyNeedDecay(need, rate, tickIndex);

    if (updated.value >= needsComp.criticalThreshold) {
      criticalNeeds.push({ needId, value: updated.value });
    }
  }

  if (criticalNeeds.length === 0) {
    return null;
  }

  // Sort by: value descending, then NeedId ascending (lexicographic)
  criticalNeeds.sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.needId < b.needId ? -1 : a.needId > b.needId ? 1 : 0;
  });

  return criticalNeeds[0]!;
}

// === NPC SYSTEM ===

/**
 * NPC system - runs each tick to process all NPCs
 *
 * Task 003: Added criticalNeedOverridesJob config support
 *
 * Pipeline:
 * 1. Update needs (lazy)
 * 2. Check for critical threshold crossings
 * 3. Check for critical need override (if enabled)
 * 4. Process travel
 * 5. Select/execute intent
 *
 * @param ctx - System context
 * @param config - Optional NPC system config (defaults to backwards-compatible settings)
 */
export function npcSystem(ctx: SystemContext, config?: Partial<NpcSystemConfig>): void {
  const npcs = ctx.getEntitiesByType('npc');
  const graph = getPlaceGraph(ctx.state);
  const resolvedConfig: NpcSystemConfig = { ...DEFAULT_NPC_SYSTEM_CONFIG, ...config };

  for (const npc of npcs) {
    processNpc(ctx, npc, graph, resolvedConfig);
  }
}

function processNpc(
  ctx: SystemContext,
  npc: EntityRecord,
  graph: PlaceGraphComponent | null,
  config: NpcSystemConfig
): void {
  const needsComp = npc.components['core.npc.needs'] as CoreNpcNeedsComponent | undefined;
  const travelComp = npc.components['core.travel'] as CoreTravelComponent | undefined;
  const intentComp = npc.components['core.npc.intent'] as CoreNpcIntentComponent | undefined;
  const locationComp = npc.components['core.location'] as CoreLocationComponent | undefined;

  // ERR-1: Skip override logic if missing needs component (but continue with other NPC processing)
  if (!travelComp || !intentComp || !locationComp) {
    return; // NPC not fully initialized
  }

  // === PHASE 1: Update needs (lazy) ===
  // Skip need processing if no needs component (ERR-1)
  if (needsComp) {
    const prevNeeds: Record<NeedId, number> = {
      hunger: needsComp.needs.hunger.value,
      sleep: needsComp.needs.sleep.value,
    };

    // Apply need decay
    for (const needId of ['hunger', 'sleep'] as NeedId[]) {
      const need = needsComp.needs[needId];
      const rate = needsComp.rates[needId];
      const updated = applyNeedDecay(need, rate, ctx.tickIndex);

      // Check for critical threshold crossing
      const wasBelowThreshold = prevNeeds[needId] < needsComp.criticalThreshold;
      const isAtOrAboveThreshold = updated.value >= needsComp.criticalThreshold;
      const alreadyEmitted = needsComp.criticalEmitted?.[needId] ?? false;

      if (wasBelowThreshold && isAtOrAboveThreshold && !alreadyEmitted) {
        ctx.proposeEvent(EVENT_TYPES.NPC_NEED_CRITICAL, {
          npcId: npc.id,
          needId,
          value: updated.value,
        }, { actorNpcIds: [npc.id] });
      }
    }
  }

  // === PHASE 2: Critical need override (Task 003) ===
  // Check early before intent scoring if criticalNeedOverridesJob is enabled
  if (config.criticalNeedOverridesJob && needsComp) {
    const criticalOverride = getCriticalNeedOverride(needsComp, ctx.tickIndex);

    if (criticalOverride) {
      // Determine target place for the critical need
      let targetPlaceId: string | null = null;

      if (criticalOverride.needId === 'hunger') {
        targetPlaceId = findFoodPlace(ctx.state);
      } else if (criticalOverride.needId === 'sleep') {
        targetPlaceId = getNpcHome(npc);
      }

      // EC-2: Only override if there's a valid target place
      if (targetPlaceId) {
        // Check if already satisfying this need
        if (
          intentComp.intentType !== 'satisfy_need' ||
          intentComp.targetNeedId !== criticalOverride.needId
        ) {
          // Force switch to satisfy_need for the critical need
          ctx.proposeEvent(EVENT_TYPES.NPC_INTENT_SET, {
            npcId: npc.id,
            intentType: 'satisfy_need',
            targetNeedId: criticalOverride.needId,
            targetPlaceId,
          }, { actorNpcIds: [npc.id] });
          return; // Skip normal intent processing
        }
      }
      // EC-2: No valid target - fall through to normal processing
    }
  }

  // === PHASE 3: Process travel ===
  if (travelComp.status === 'traveling' && travelComp.remainingCost !== undefined && travelComp.startedTick !== undefined) {
    // Check if enough time has passed to arrive (remainingCost is total travel cost)
    const elapsedTicks = ctx.tickIndex - travelComp.startedTick;

    if (elapsedTicks >= travelComp.remainingCost) {
      // Arrived!
      ctx.proposeEvent(EVENT_TYPES.NPC_ARRIVED, {
        npcId: npc.id,
        fromPlaceId: travelComp.fromPlaceId,
        toPlaceId: travelComp.toPlaceId,
      }, { actorNpcIds: [npc.id], placeIds: [travelComp.toPlaceId!] });
    }
    // Travel continues - will check again next tick
    return; // Don't process intent while traveling
  }

  // === PHASE 4: Check intent hysteresis ===
  const ticksSinceIntentStart = ctx.tickIndex - intentComp.startedTick;
  const canSwitchIntent = ticksSinceIntentStart >= intentComp.minCommitTicks;

  // === PHASE 5: Execute current intent or select new one ===
  const currentLocation = locationComp.placeId;

  // Skip need-based actions if no needs component
  if (!needsComp) {
    return;
  }

  // If intent is to satisfy a need and we're at the right place, do it
  if (intentComp.intentType === 'satisfy_need') {
    const targetNeed = intentComp.targetNeedId!;

    if (targetNeed === 'hunger') {
      // Check if at food place, food available, AND actually hungry (value >= threshold)
      const atFoodPlace = placeHasTag(ctx.state, currentLocation, 'food');
      const stockpile = getStockpile(ctx.state);
      const foodAvailable = (stockpile['res.food'] ?? 0) >= 2; // foodConsumptionPerMeal = 2
      // Use lazy-calculated value (stored + elapsed time * rate)
      const hungerValue = applyNeedDecay(needsComp.needs.hunger, needsComp.rates.hunger, ctx.tickIndex).value;
      const MIN_NEED_TO_ACT = 50; // Need must be at least this high to actually eat

      if (atFoodPlace && foodAvailable && hungerValue >= MIN_NEED_TO_ACT) {
        // Propose eat event
        ctx.proposeEvent(EVENT_TYPES.NPC_ATE, {
          npcId: npc.id,
          placeId: currentLocation,
          hungerAfter: 0, // Will be set by reducer
        }, { actorNpcIds: [npc.id], placeIds: [currentLocation] });
        return;
      }
    } else if (targetNeed === 'sleep') {
      // Check if at home AND actually need sleep (value >= threshold)
      const homePlaceId = getNpcHome(npc);
      // Use lazy-calculated value (stored + elapsed time * rate)
      const sleepValue = applyNeedDecay(needsComp.needs.sleep, needsComp.rates.sleep, ctx.tickIndex).value;
      const MIN_NEED_TO_ACT = 50; // Need must be at least this high to actually sleep
      if (currentLocation === homePlaceId && sleepValue >= MIN_NEED_TO_ACT) {
        // Propose sleep event
        ctx.proposeEvent(EVENT_TYPES.NPC_SLEPT, {
          npcId: npc.id,
          placeId: currentLocation,
          sleepAfter: 0,
        }, { actorNpcIds: [npc.id], placeIds: [currentLocation] });
        return;
      }
    }

    // Need to travel to target place
    const targetPlace = intentComp.targetPlaceId;
    if (targetPlace && targetPlace !== currentLocation && graph) {
      startTravelIfNeeded(ctx, npc, currentLocation, targetPlace, graph);
      return;
    }
  }

  // If intent is do_job, check if at job location and work
  if (intentComp.intentType === 'do_job' && intentComp.targetJobId) {
    const jobEntity = ctx.getEntity(intentComp.targetJobId);
    if (jobEntity) {
      const jobComp = jobEntity.components['core.job'] as { placeId: string; claimedByNpcId?: string; status?: string } | undefined;
      if (jobComp) {
        const jobPlace = jobComp.placeId;

        // At job location
        if (currentLocation === jobPlace) {
          // If job is open (not claimed), claim it first
          if (jobComp.status === 'open' && !jobComp.claimedByNpcId) {
            ctx.proposeEvent(EVENT_TYPES.JOB_CLAIMED, {
              jobId: intentComp.targetJobId,
              npcId: npc.id,
            }, { actorNpcIds: [npc.id], jobId: intentComp.targetJobId });
            return;
          }

          // If job is claimed by us and not completed, do work
          if (jobComp.claimedByNpcId === npc.id && jobComp.status !== 'completed') {
            // Get full job component to check work progress
            const fullJobComp = jobEntity.components['core.job'] as {
              workDone: number;
              workRequired: number;
              templateId?: string;
            } | undefined;

            ctx.proposeEvent('core.job.progressed' as EventType, {
              jobId: intentComp.targetJobId,
              npcId: npc.id,
              workAmount: NPC_WORK_AMOUNT,
            }, { actorNpcIds: [npc.id], jobId: intentComp.targetJobId });

            // Check if this work will complete the job - emit JOB_COMPLETED
            if (fullJobComp && (fullJobComp.workDone + NPC_WORK_AMOUNT) >= fullJobComp.workRequired) {
              ctx.proposeEvent(EVENT_TYPES.JOB_COMPLETED, {
                jobId: intentComp.targetJobId,
                npcId: npc.id,
                templateId: fullJobComp.templateId,
              }, { actorNpcIds: [npc.id], jobId: intentComp.targetJobId });
            }
            return;
          }
        }

        // Need to travel to job
        if (jobPlace !== currentLocation && graph) {
          startTravelIfNeeded(ctx, npc, currentLocation, jobPlace, graph);
          return;
        }
      }
    }
  }

  // If we can switch intent, evaluate options
  if (canSwitchIntent) {
    const options = buildIntentOptions(ctx, npc, graph);
    const rng = ctx.rng(`npc.${npc.id}.intent`);
    const best = selectBestIntent(options, rng.nextInt(1000));

    if (best.intentType !== intentComp.intentType ||
        best.targetNeedId !== intentComp.targetNeedId ||
        best.targetJobId !== intentComp.targetJobId) {
      // Switch intent
      ctx.proposeEvent(EVENT_TYPES.NPC_INTENT_SET, {
        npcId: npc.id,
        intentType: best.intentType,
        targetNeedId: best.targetNeedId,
        targetPlaceId: best.targetPlaceId,
        targetJobId: best.targetJobId,
      }, { actorNpcIds: [npc.id] });
    }
  }
}

function startTravelIfNeeded(
  ctx: SystemContext,
  npc: EntityRecord,
  fromPlaceId: string,
  toPlaceId: string,
  graph: PlaceGraphComponent
): void {
  if (fromPlaceId === toPlaceId) return;

  const pathResult = shortestPath(graph, fromPlaceId, toPlaceId);
  if (!pathResult || pathResult.path.length < 2) return;

  // Start travel to next place in path
  const nextPlace = pathResult.path[1]!;

  // Find edge cost
  let edgeCost = 1;
  for (const edge of graph.edges) {
    if (edge.fromPlaceId === fromPlaceId && edge.toPlaceId === nextPlace) {
      edgeCost = edge.travelCost;
      break;
    }
  }

  ctx.proposeEvent(EVENT_TYPES.NPC_TRAVEL_STARTED, {
    npcId: npc.id,
    fromPlaceId,
    toPlaceId: nextPlace,
    travelCost: edgeCost,
  }, { actorNpcIds: [npc.id], placeIds: [fromPlaceId, nextPlace] });
}

function buildIntentOptions(
  ctx: SystemContext,
  npc: EntityRecord,
  graph: PlaceGraphComponent | null
): IntentOption[] {
  const options: IntentOption[] = [];
  const needsComp = npc.components['core.npc.needs'] as CoreNpcNeedsComponent;
  const locationComp = npc.components['core.location'] as CoreLocationComponent;
  const currentLocation = locationComp.placeId;

  // Calculate current need values using lazy evaluation (stored value + elapsed time * rate)
  const needValues: Record<NeedId, number> = {
    hunger: applyNeedDecay(needsComp.needs.hunger, needsComp.rates.hunger, ctx.tickIndex).value,
    sleep: applyNeedDecay(needsComp.needs.sleep, needsComp.rates.sleep, ctx.tickIndex).value,
  };

  // Minimum need thresholds - don't bother satisfying needs until they're significant
  // This prevents NPCs from eating/sleeping every single tick
  const MIN_NEED_THRESHOLD = 100;

  // Add satisfy_need options (only if need value exceeds threshold)
  // Hunger - need to go to food place
  const foodPlace = findFoodPlace(ctx.state);
  if (foodPlace && needValues.hunger >= MIN_NEED_THRESHOLD) {
    const distCost = graph ? (shortestPath(graph, currentLocation, foodPlace)?.totalCost ?? 0) : 0;
    options.push({
      intentType: 'satisfy_need',
      targetNeedId: 'hunger',
      targetPlaceId: foodPlace,
      score: scoreNeedIntent(needValues.hunger, distCost),
      rank: INTENT_RANK.satisfy_need,
    });
  }

  // Sleep - need to go to home
  const homePlaceId = getNpcHome(npc);
  if (homePlaceId && needValues.sleep >= MIN_NEED_THRESHOLD) {
    const distCost = graph ? (shortestPath(graph, currentLocation, homePlaceId)?.totalCost ?? 0) : 0;
    options.push({
      intentType: 'satisfy_need',
      targetNeedId: 'sleep',
      targetPlaceId: homePlaceId,
      score: scoreNeedIntent(needValues.sleep, distCost),
      rank: INTENT_RANK.satisfy_need,
    });
  }

  // Task 007: Get rumor modifiers for this NPC
  const rumorMods = getRumorModifiers(ctx.state, npc.id);

  // Add do_job options
  const jobs = ctx.getEntitiesByType('job');
  for (const job of jobs) {
    const jobComp = job.components['core.job'] as { status: string; placeId: string; claimedByNpcId?: string; templateId?: string } | undefined;
    if (!jobComp) continue;

    // Only consider open jobs or in-progress jobs claimed by this NPC
    // Skip completed/cancelled/failed jobs
    if (jobComp.status === 'completed' || jobComp.status === 'cancelled' || jobComp.status === 'failed') continue;
    if (jobComp.status !== 'open' && jobComp.claimedByNpcId !== npc.id) continue;

    const distCost = graph ? (shortestPath(graph, currentLocation, jobComp.placeId)?.totalCost ?? 0) : 0;
    let score = scoreJobIntent(distCost, needValues.sleep);

    // Task 007: Apply rumor modifiers
    // job_done bonus: increases priority for jobs of that kind
    const jobKind = jobComp.templateId?.split('.')[1];
    if (jobKind) {
      score += rumorMods.jobKindBonus[jobKind] ?? 0;
    }

    // hardship penalty: decreases priority for jobs at affected places
    score += rumorMods.placePenalty[jobComp.placeId] ?? 0;

    options.push({
      intentType: 'do_job',
      targetJobId: job.id,
      targetPlaceId: jobComp.placeId,
      score,
      rank: INTENT_RANK.do_job,
    });
  }

  // Always add idle option
  options.push({
    intentType: 'idle',
    score: 0,
    rank: INTENT_RANK.idle,
  });

  return options;
}

// === NPC REDUCERS ===

export function npcReducers(): ReducerRegistry {
  const registry = new ReducerRegistry();

  // core.npc.travel_started
  registry.register(EVENT_TYPES.NPC_TRAVEL_STARTED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      fromPlaceId: string;
      toPlaceId: string;
      travelCost: number;
    };

    // Validate destination exists
    if (!placeExists(state, payload.toPlaceId)) {
      throw new Error(`Invalid travel destination: ${payload.toPlaceId}`);
    }

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const travel = npc.components['core.travel'] as CoreTravelComponent;
    travel.status = 'traveling';
    travel.fromPlaceId = payload.fromPlaceId;
    travel.toPlaceId = payload.toPlaceId;
    travel.remainingCost = payload.travelCost;
    travel.startedTick = event.tickIndex;
    travel.edgeKind = 'road';
  });

  // core.npc.arrived
  registry.register(EVENT_TYPES.NPC_ARRIVED, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      fromPlaceId: string;
      toPlaceId: string;
    };

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const location = npc.components['core.location'] as CoreLocationComponent;
    location.placeId = payload.toPlaceId;

    const travel = npc.components['core.travel'] as CoreTravelComponent;
    travel.status = 'idle';
    delete travel.fromPlaceId;
    delete travel.toPlaceId;
    delete travel.remainingCost;
    delete travel.startedTick;
  });

  // core.npc.need_critical
  registry.register(EVENT_TYPES.NPC_NEED_CRITICAL, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      needId: NeedId;
      value: number;
    };

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const needs = npc.components['core.npc.needs'] as CoreNpcNeedsComponent;
    if (!needs.criticalEmitted) {
      needs.criticalEmitted = {};
    }
    needs.criticalEmitted[payload.needId] = true;

    // Update the need value
    needs.needs[payload.needId].value = payload.value;
    needs.needs[payload.needId].lastUpdatedTick = event.tickIndex;
  });

  // core.npc.ate
  registry.register(EVENT_TYPES.NPC_ATE, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      placeId: string;
      hungerAfter: number;
    };

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const needs = npc.components['core.npc.needs'] as CoreNpcNeedsComponent;
    needs.needs.hunger.value = 0;
    needs.needs.hunger.lastUpdatedTick = event.tickIndex;

    // Reset critical emitted flag
    if (needs.criticalEmitted) {
      needs.criticalEmitted.hunger = false;
    }

    // Consume food from stockpile (2 food per meal)
    const worldEntity = state.entities['world'];
    if (worldEntity) {
      const stockpile = worldEntity.components['core.stockpile'] as { resources?: Record<string, number> } | undefined;
      if (stockpile?.resources) {
        const currentFood = stockpile.resources['res.food'] ?? 0;
        stockpile.resources['res.food'] = Math.max(0, currentFood - 2);
      }
    }
  });

  // core.npc.slept
  registry.register(EVENT_TYPES.NPC_SLEPT, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      placeId: string;
      sleepAfter: number;
    };

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const needs = npc.components['core.npc.needs'] as CoreNpcNeedsComponent;
    needs.needs.sleep.value = 0;
    needs.needs.sleep.lastUpdatedTick = event.tickIndex;

    // Reset critical emitted flag
    if (needs.criticalEmitted) {
      needs.criticalEmitted.sleep = false;
    }
  });

  // core.npc.intent_set
  registry.register(EVENT_TYPES.NPC_INTENT_SET, (state: WorldState, event: SimEvent) => {
    const payload = event.payload as {
      npcId: string;
      intentType: IntentType;
      targetNeedId?: NeedId;
      targetPlaceId?: string;
      targetJobId?: string;
    };

    const npc = state.entities[payload.npcId];
    if (!npc) return;

    const intent = npc.components['core.npc.intent'] as CoreNpcIntentComponent;
    intent.intentType = payload.intentType;
    intent.startedTick = event.tickIndex;
    intent.minCommitTicks = DEFAULT_MIN_COMMIT_TICKS;

    // Handle optional fields explicitly
    if (payload.targetNeedId !== undefined) {
      intent.targetNeedId = payload.targetNeedId;
    } else {
      delete intent.targetNeedId;
    }

    if (payload.targetPlaceId !== undefined) {
      intent.targetPlaceId = payload.targetPlaceId;
    } else {
      delete intent.targetPlaceId;
    }

    if (payload.targetJobId !== undefined) {
      intent.targetJobId = payload.targetJobId;
    } else {
      delete intent.targetJobId;
    }
  });

  return registry;
}
