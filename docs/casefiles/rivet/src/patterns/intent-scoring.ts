/**
 * Intent Scoring Pattern
 *
 * Score-based decision making for AI with deterministic tie-breaking.
 * Used for NPC intent selection, job priority, target selection, etc.
 *
 * Key features:
 * - Score functions for different intent types
 * - Deterministic tie-breaking (score → rank → id)
 * - Hysteresis to prevent rapid switching
 *
 * From: Godhood Terrarium NPC intent system
 */

// === TYPES ===

export interface ScoredOption<T> {
  option: T;
  score: number;
  rank: number;           // For tie-breaking (lower = higher priority)
  tiebreakId: string;     // Final tie-breaker (lexicographic)
}

export interface IntentHysteresis {
  currentIntent: string;
  startedTick: number;
  minCommitTicks: number; // Minimum ticks before switching
}

// === FUNCTIONS ===

/**
 * Select best option using deterministic tie-breaking
 *
 * Tie-break order:
 * 1. Higher score wins
 * 2. Lower rank wins
 * 3. Lexicographically smaller tiebreakId wins
 */
export function selectBest<T>(options: ScoredOption<T>[]): T | undefined {
  if (options.length === 0) return undefined;

  const sorted = [...options].sort((a, b) => {
    // Higher score wins
    if (b.score !== a.score) return b.score - a.score;
    // Lower rank wins
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Lexicographic tiebreakId
    return a.tiebreakId.localeCompare(b.tiebreakId);
  });

  return sorted[0]?.option;
}

/**
 * Check if intent can switch (respects hysteresis)
 */
export function canSwitchIntent(
  hysteresis: IntentHysteresis,
  currentTick: number
): boolean {
  return (currentTick - hysteresis.startedTick) >= hysteresis.minCommitTicks;
}

/**
 * Update hysteresis after switching intent
 */
export function switchIntent(
  hysteresis: IntentHysteresis,
  newIntent: string,
  currentTick: number,
  minCommitTicks: number = 3
): IntentHysteresis {
  return {
    currentIntent: newIntent,
    startedTick: currentTick,
    minCommitTicks,
  };
}

// === COMMON SCORING FUNCTIONS ===

/**
 * Score for satisfying a need
 * Higher need value = higher score
 * Distance reduces score
 */
export function scoreNeed(needValue: number, distanceCost: number): number {
  return 3 * needValue - distanceCost;
}

/**
 * Score for doing a job
 * Base score reduced by distance and fatigue
 */
export function scoreJob(
  basePriority: number,
  urgencyClass: number,
  distanceCost: number,
  fatigueLevel: number = 0
): number {
  const urgencyBonus = 10 * (9 - urgencyClass);
  const fatiguePenalty = fatigueLevel > 800 ? 200 : 0;
  return 100 + urgencyBonus + basePriority - distanceCost - fatiguePenalty;
}

/**
 * Score for pursuing a target
 * Closer = higher score
 * Visibility bonus
 */
export function scorePursuit(
  distance: number,
  isVisible: boolean,
  maxRange: number = 10
): number {
  const distanceScore = Math.max(0, (maxRange - distance) * 10);
  const visibilityBonus = isVisible ? 100 : 0;
  return distanceScore + visibilityBonus;
}

/**
 * Score for investigating a location
 * Evidence strength + recency
 */
export function scoreInvestigate(
  evidenceStrength: number,
  ticksSinceEvidence: number,
  distanceCost: number
): number {
  const recencyPenalty = Math.min(100, ticksSinceEvidence * 2);
  return evidenceStrength - recencyPenalty - distanceCost;
}

// === INTENT TYPES (examples) ===

export type IntentType =
  | 'idle'
  | 'satisfy_need'
  | 'do_job'
  | 'travel'
  | 'pursue'
  | 'investigate'
  | 'flee'
  | 'hide';

/**
 * Default intent ranks (lower = higher priority in ties)
 */
export const DEFAULT_INTENT_RANKS: Record<IntentType, number> = {
  flee: 0,        // Highest priority
  satisfy_need: 1,
  pursue: 2,
  investigate: 3,
  do_job: 4,
  travel: 5,
  hide: 6,
  idle: 7,        // Lowest priority
};

/**
 * Build a scored option for an intent
 */
export function buildIntentOption<T extends { type: IntentType; id: string }>(
  intent: T,
  score: number,
  ranks: Record<IntentType, number> = DEFAULT_INTENT_RANKS
): ScoredOption<T> {
  return {
    option: intent,
    score,
    rank: ranks[intent.type] ?? 99,
    tiebreakId: intent.id,
  };
}
