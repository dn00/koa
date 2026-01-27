#!/usr/bin/env npx tsx
/**
 * V2.5 Prototype — Validate Before Porting
 *
 * V2 schema (power/tag/risk) + 3 interference rules:
 *   A) Repetition Risk — same `proves` as committed card → +1 scrutiny
 *   B) Graduated Contradictions — 1st contradiction = WARNING (+1 scrutiny), 2nd = BLOCKED
 *   C) Source Diversity Bonus — corroborating cards from different sources → 35% instead of 25%
 *
 * Also: ambiguous feedback formatter + 7-Principles validator.
 *
 * Usage: npx tsx scripts/prototype-v2.5.ts
 */

// ============================================================================
// V2.5 Types
// ============================================================================

const Tag = {
  ASLEEP: 'ASLEEP',
  AWAKE: 'AWAKE',
  HOME: 'HOME',
  AWAY: 'AWAY',
  ALONE: 'ALONE',
  ACCOMPANIED: 'ACCOMPANIED',
  IDLE: 'IDLE',
  ACTIVE: 'ACTIVE',
} as const;
type Tag = (typeof Tag)[keyof typeof Tag];

const OPPOSING = new Map<Tag, Tag>([
  [Tag.ASLEEP, Tag.AWAKE], [Tag.AWAKE, Tag.ASLEEP],
  [Tag.HOME, Tag.AWAY], [Tag.AWAY, Tag.HOME],
  [Tag.ALONE, Tag.ACCOMPANIED], [Tag.ACCOMPANIED, Tag.ALONE],
  [Tag.IDLE, Tag.ACTIVE], [Tag.ACTIVE, Tag.IDLE],
]);

const ProofType = {
  IDENTITY: 'IDENTITY',
  ALERTNESS: 'ALERTNESS',
  INTENT: 'INTENT',
  LOCATION: 'LOCATION',
  LIVENESS: 'LIVENESS',
} as const;
type ProofType = (typeof ProofType)[keyof typeof ProofType];

interface Card {
  readonly id: string;
  readonly power: number;
  readonly tag: Tag;
  readonly risk: number;
  readonly proves?: ProofType;
  readonly refutes?: string;
  readonly flavor?: string;
  readonly source?: string; // device type for source diversity bonus
}

interface Counter {
  readonly id: string;
  readonly targets: readonly string[];
  refuted: boolean;
}

interface Concern {
  readonly id: string;
  readonly requiredProof: ProofType;
}

interface Puzzle {
  readonly name: string;
  readonly resistance: number;
  readonly turns: number;
  readonly scrutinyLimit: number;
  readonly cards: readonly Card[];
  readonly counters: readonly Counter[];
  readonly concerns: readonly Concern[];
}

// ============================================================================
// V2.5 Game State (adds contradictionsSoFar + committedProofs)
// ============================================================================

interface GameState {
  resistance: number;
  scrutiny: number;
  turnsRemaining: number;
  committedTags: Tag[];
  committedCardIds: Set<string>;
  addressedConcerns: Set<string>;
  counters: Counter[];
  contradictionsSoFar: number;       // Rule B: graduated contradictions
  committedProofs: ProofType[];      // Rule A: repetition risk tracking
}

interface TurnResult {
  damage: number;
  scrutinyAdded: number;
  concernsAddressed: string[];
  refutationsApplied: string[];
  corroborationBonus: number;
  blocked: boolean;
  contradictionWarning: boolean;     // Rule B: first contradiction = warning
  repetitionRiskFired: boolean;      // Rule A
  sourceDiversityUsed: boolean;      // Rule C
  outcome: 'CONTINUE' | 'WIN' | 'LOSS_SCRUTINY' | 'LOSS_TURNS';
}

function initState(puzzle: Puzzle): GameState {
  return {
    resistance: puzzle.resistance,
    scrutiny: 0,
    turnsRemaining: puzzle.turns,
    committedTags: [],
    committedCardIds: new Set(),
    addressedConcerns: new Set(),
    counters: puzzle.counters.map(c => ({ ...c, refuted: false })),
    contradictionsSoFar: 0,
    committedProofs: [],
  };
}

function cloneState(state: GameState): GameState {
  return {
    resistance: state.resistance,
    scrutiny: state.scrutiny,
    turnsRemaining: state.turnsRemaining,
    committedTags: [...state.committedTags],
    committedCardIds: new Set(state.committedCardIds),
    addressedConcerns: new Set(state.addressedConcerns),
    counters: state.counters.map(c => ({ ...c })),
    contradictionsSoFar: state.contradictionsSoFar,
    committedProofs: [...state.committedProofs],
  };
}

// ============================================================================
// V2.5 Turn Processor (13 steps)
// ============================================================================

function processTurn(
  state: GameState,
  cardIds: string[],
  puzzle: Puzzle,
): TurnResult {
  const cards = cardIds.map(id => puzzle.cards.find(c => c.id === id)!);

  let contradictionWarning = false;
  let repetitionRiskFired = false;
  let sourceDiversityUsed = false;

  // --- Step 1-2: Contradiction check with graduated rule (Rule B) ---
  const tagsInFlight = [...state.committedTags];
  for (const card of cards) {
    const opposite = OPPOSING.get(card.tag);
    if (opposite && tagsInFlight.includes(opposite)) {
      if (state.contradictionsSoFar === 0) {
        // First contradiction: WARNING (downgraded from MAJOR to MINOR)
        state.contradictionsSoFar++;
        contradictionWarning = true;
        // +1 scrutiny applied below in scrutiny calc
        // Don't block, but don't add this tag to flight (it's contradictory)
        continue;
      } else {
        // Second+ contradiction: BLOCKED
        return {
          damage: 0, scrutinyAdded: 0, concernsAddressed: [],
          refutationsApplied: [], corroborationBonus: 0,
          blocked: true, contradictionWarning: false,
          repetitionRiskFired: false, sourceDiversityUsed: false,
          outcome: 'CONTINUE',
        };
      }
    }
    tagsInFlight.push(card.tag);
  }

  // --- Step 3: Refutations ---
  const refutationsApplied: string[] = [];
  for (const card of cards) {
    if (card.refutes) {
      const counter = state.counters.find(c => c.id === card.refutes);
      if (counter && !counter.refuted) {
        counter.refuted = true;
        refutationsApplied.push(counter.id);
      }
    }
  }

  // --- Step 4: Contested penalties ---
  const cardPowers = cards.map(card => {
    const contested = state.counters.some(
      c => !c.refuted && c.targets.includes(card.id)
    );
    return contested ? Math.ceil(card.power * 0.5) : card.power;
  });

  // --- Step 5: Base damage ---
  const baseDamage = cardPowers.reduce((s, p) => s + p, 0);

  // --- Step 6: Corroboration with source diversity (Rule C) ---
  const tagCounts = new Map<Tag, number>();
  const tagSources = new Map<Tag, Set<string>>();
  for (const card of cards) {
    tagCounts.set(card.tag, (tagCounts.get(card.tag) ?? 0) + 1);
    if (!tagSources.has(card.tag)) tagSources.set(card.tag, new Set());
    if (card.source) tagSources.get(card.tag)!.add(card.source);
  }

  let corroborationBonus = 0;
  const hasCorroboration = [...tagCounts.values()].some(count => count >= 2);
  if (hasCorroboration) {
    // Check if any corroborating group has diverse sources
    let hasDiverseSources = false;
    for (const [tag, count] of tagCounts) {
      if (count >= 2 && (tagSources.get(tag)?.size ?? 0) >= 2) {
        hasDiverseSources = true;
        break;
      }
    }
    const bonusRate = hasDiverseSources ? 0.30 : 0.20;
    if (hasDiverseSources) sourceDiversityUsed = true;
    corroborationBonus = Math.ceil(baseDamage * bonusRate);
  }
  const totalDamage = baseDamage + corroborationBonus;

  // --- Step 7: Risk → scrutiny ---
  let scrutinyDelta = cards.reduce((s, c) => s + c.risk, 0);

  // --- Step 8: Rule A — Repetition Risk ---
  for (const card of cards) {
    if (card.proves && state.committedProofs.includes(card.proves)) {
      scrutinyDelta += 1;
      repetitionRiskFired = true;
    }
  }

  // --- Step 9: Rule B — Graduated contradiction scrutiny ---
  if (contradictionWarning) {
    scrutinyDelta += 1;
  }

  // --- Step 10: Refutation recovery ---
  if (refutationsApplied.length > 0) {
    scrutinyDelta = Math.max(0, scrutinyDelta - refutationsApplied.length);
  }

  // --- Step 11: Concerns ---
  const concernsAddressed: string[] = [];
  for (const card of cards) {
    if (card.proves) {
      for (const concern of puzzle.concerns) {
        if (concern.requiredProof === card.proves && !state.addressedConcerns.has(concern.id)) {
          concernsAddressed.push(concern.id);
          state.addressedConcerns.add(concern.id);
        }
      }
    }
  }

  // --- Step 12: Apply state changes ---
  state.resistance = Math.max(0, state.resistance - totalDamage);
  state.scrutiny = Math.min(puzzle.scrutinyLimit, state.scrutiny + scrutinyDelta);
  state.turnsRemaining -= 1;
  state.committedTags.push(...cards.map(c => c.tag));
  for (const id of cardIds) state.committedCardIds.add(id);
  for (const card of cards) {
    if (card.proves) state.committedProofs.push(card.proves);
  }

  // --- Step 13: Outcome ---
  // WIN requires: resistance broken + minimum concerns addressed (⌈total/2⌉)
  const minConcerns = Math.ceil(puzzle.concerns.length / 2);
  let outcome: TurnResult['outcome'] = 'CONTINUE';
  if (state.scrutiny >= puzzle.scrutinyLimit) outcome = 'LOSS_SCRUTINY';
  else if (state.resistance <= 0 && state.addressedConcerns.size >= minConcerns) outcome = 'WIN';
  else if (state.resistance <= 0 && state.turnsRemaining <= 0) outcome = 'LOSS_TURNS'; // broke resistance but not enough concerns
  else if (state.turnsRemaining <= 0) outcome = 'LOSS_TURNS';

  return {
    damage: totalDamage,
    scrutinyAdded: scrutinyDelta,
    concernsAddressed,
    refutationsApplied,
    corroborationBonus,
    blocked: false,
    contradictionWarning,
    repetitionRiskFired,
    sourceDiversityUsed,
    outcome,
  };
}

// ============================================================================
// Ambiguous Feedback Formatter (Principle 4)
// ============================================================================

const KOA_HINTS = {
  repetition: [
    "You keep coming back to that same story...",
    "Interesting... another device saying the same thing.",
    "I've heard that angle before.",
  ],
  contradiction: [
    "Hmm, something doesn't quite add up.",
    "Wait... that doesn't match what you showed me earlier.",
    "Inconsistency detected.",
  ],
  highScrutiny: [
    "I'm starting to have my doubts.",
    "This is getting harder to believe.",
    "You might want to be more careful.",
  ],
  lowScrutiny: [
    "Go on, I'm listening...",
    "That checks out so far.",
  ],
};

function formatAmbiguousFeedback(result: TurnResult, state: GameState, puzzle: Puzzle): string {
  const lines: string[] = [];

  // Damage — always shown
  lines.push(`  Damage dealt: ${result.damage}`);
  lines.push(`  Resistance remaining: ${state.resistance}`);

  // Scrutiny — aggregate only, never itemized
  if (result.scrutinyAdded > 0) {
    lines.push(`  Scrutiny +${result.scrutinyAdded} (total: ${state.scrutiny}/${puzzle.scrutinyLimit})`);
  } else {
    lines.push(`  Scrutiny unchanged (${state.scrutiny}/${puzzle.scrutinyLimit})`);
  }

  // Concerns addressed (safe to show)
  if (result.concernsAddressed.length > 0) {
    lines.push(`  Concerns addressed: ${result.concernsAddressed.length}`);
  }

  // KOA hint — deliberately ambiguous
  if (result.contradictionWarning) {
    lines.push(`  KOA: "${KOA_HINTS.contradiction[Math.floor(Math.random() * KOA_HINTS.contradiction.length)]}"`);
  } else if (result.repetitionRiskFired) {
    lines.push(`  KOA: "${KOA_HINTS.repetition[Math.floor(Math.random() * KOA_HINTS.repetition.length)]}"`);
  } else if (state.scrutiny >= Math.floor(puzzle.scrutinyLimit * 0.6)) {
    lines.push(`  KOA: "${KOA_HINTS.highScrutiny[Math.floor(Math.random() * KOA_HINTS.highScrutiny.length)]}"`);
  } else {
    lines.push(`  KOA: "${KOA_HINTS.lowScrutiny[Math.floor(Math.random() * KOA_HINTS.lowScrutiny.length)]}"`);
  }

  return lines.join('\n');
}

// ============================================================================
// Brute-Force All Paths
// ============================================================================

interface PlaySequence {
  turns: string[][];
  turnResults: TurnResult[];
  totalDamage: number;
  finalResistance: number;
  finalScrutiny: number;
  turnsUsed: number;
  won: boolean;
  lostScrutiny: boolean;
  blocked: boolean;
  concernsAddressed: number;
  countersRefuted: number;
  totalRisk: number;
  repetitionRiskFired: boolean;
  contradictionWarningUsed: boolean;
  sourceDiversityUsed: boolean;
  blockedAttempts: number; // submissions rejected by 2nd+ contradiction
}

function combinations(arr: string[], min: number, max: number): string[][] {
  const results: string[][] = [];
  function recurse(start: number, current: string[]) {
    if (current.length >= min) results.push([...current]);
    if (current.length >= max) return;
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]!);
      recurse(i + 1, current);
      current.pop();
    }
  }
  recurse(0, []);
  return results;
}

function simulateAll(puzzle: Puzzle): PlaySequence[] {
  const results: PlaySequence[] = [];

  function dfs(
    state: GameState,
    remainingHand: string[],
    turnsSoFar: string[][],
    resultsSoFar: TurnResult[],
    totalDmg: number,
    totalRisk: number,
    repFired: boolean,
    contraUsed: boolean,
    srcDiv: boolean,
    blockedAttempts: number,
  ) {
    const minConcernsNeeded = Math.ceil(puzzle.concerns.length / 2);
    const allConcernsMet = state.addressedConcerns.size >= puzzle.concerns.length;
    if (state.turnsRemaining <= 0 || state.scrutiny >= puzzle.scrutinyLimit || (state.resistance <= 0 && allConcernsMet)) {
      results.push({
        turns: turnsSoFar,
        turnResults: resultsSoFar,
        totalDamage: totalDmg,
        finalResistance: state.resistance,
        finalScrutiny: state.scrutiny,
        turnsUsed: puzzle.turns - state.turnsRemaining,
        won: state.resistance <= 0 && state.scrutiny < puzzle.scrutinyLimit && state.addressedConcerns.size >= minConcernsNeeded,
        lostScrutiny: state.scrutiny >= puzzle.scrutinyLimit,
        blocked: false,
        concernsAddressed: state.addressedConcerns.size,
        countersRefuted: state.counters.filter(c => c.refuted).length,
        totalRisk,
        repetitionRiskFired: repFired,
        contradictionWarningUsed: contraUsed,
        sourceDiversityUsed: srcDiv,
        blockedAttempts,
      });
      return;
    }

    const subs = combinations(remainingHand, 1, 2);
    let hadValid = false;
    let blocksThisTurn = 0;

    for (const sub of subs) {
      const cloned = cloneState(state);
      const result = processTurn(cloned, sub, puzzle);
      if (result.blocked) { blocksThisTurn++; continue; }

      hadValid = true;
      const subRisk = sub.reduce((s, id) => s + (puzzle.cards.find(c => c.id === id)?.risk ?? 0), 0);
      const newHand = remainingHand.filter(id => !sub.includes(id));

      dfs(
        cloned,
        newHand,
        [...turnsSoFar, sub],
        [...resultsSoFar, result],
        totalDmg + result.damage,
        totalRisk + subRisk,
        repFired || result.repetitionRiskFired,
        contraUsed || result.contradictionWarning,
        srcDiv || result.sourceDiversityUsed,
        blockedAttempts + blocksThisTurn,
      );
    }

    if (!hadValid) {
      results.push({
        turns: turnsSoFar,
        turnResults: resultsSoFar,
        totalDamage: totalDmg,
        finalResistance: state.resistance,
        finalScrutiny: state.scrutiny,
        turnsUsed: puzzle.turns - state.turnsRemaining,
        won: false,
        lostScrutiny: false,
        blocked: true,
        concernsAddressed: state.addressedConcerns.size,
        countersRefuted: state.counters.filter(c => c.refuted).length,
        totalRisk,
        repetitionRiskFired: repFired,
        contradictionWarningUsed: contraUsed,
        sourceDiversityUsed: srcDiv,
        blockedAttempts: blockedAttempts + blocksThisTurn,
      });
    }
  }

  dfs(initState(puzzle), puzzle.cards.map(c => c.id), [], [], 0, 0, false, false, false, 0);
  return results;
}

// ============================================================================
// Naive Path (descending power, one card per turn)
// ============================================================================

function findNaivePath(puzzle: Puzzle): PlaySequence {
  const sorted = [...puzzle.cards].sort((a, b) => b.power - a.power);
  const state = initState(puzzle);
  const turns: string[][] = [];
  const turnResults: TurnResult[] = [];
  let totalDmg = 0;
  let totalRisk = 0;
  let repFired = false;
  let contraUsed = false;
  let srcDiv = false;

  for (const card of sorted) {
    const naiveAllConcerns = state.addressedConcerns.size >= puzzle.concerns.length;
    if (state.turnsRemaining <= 0 || state.scrutiny >= puzzle.scrutinyLimit || (state.resistance <= 0 && naiveAllConcerns)) break;

    const cloned = cloneState(state);
    const result = processTurn(cloned, [card.id], puzzle);
    if (result.blocked) continue;

    turns.push([card.id]);
    turnResults.push(result);
    totalDmg += result.damage;
    totalRisk += card.risk;
    repFired = repFired || result.repetitionRiskFired;
    contraUsed = contraUsed || result.contradictionWarning;
    srcDiv = srcDiv || result.sourceDiversityUsed;

    Object.assign(state, cloned);
  }

  return {
    turns,
    turnResults,
    totalDamage: totalDmg,
    finalResistance: state.resistance,
    finalScrutiny: state.scrutiny,
    turnsUsed: puzzle.turns - state.turnsRemaining,
    won: state.resistance <= 0 && state.scrutiny < puzzle.scrutinyLimit && state.addressedConcerns.size >= Math.ceil(puzzle.concerns.length / 2),
    lostScrutiny: state.scrutiny >= puzzle.scrutinyLimit,
    blocked: false,
    concernsAddressed: state.addressedConcerns.size,
    countersRefuted: state.counters.filter(c => c.refuted).length,
    totalRisk,
    repetitionRiskFired: repFired,
    contradictionWarningUsed: contraUsed,
    sourceDiversityUsed: srcDiv,
    blockedAttempts: 0,
  };
}

// ============================================================================
// Test Puzzle: "The Midnight Snack"
// ============================================================================

const THE_MIDNIGHT_SNACK: Puzzle = {
  name: 'The Midnight Snack',
  resistance: 12,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    { id: 'A', power: 5, tag: Tag.ASLEEP,  risk: 1, proves: ProofType.ALERTNESS, source: 'sleep_tracker', flavor: 'Sleep tracker' },
    { id: 'B', power: 3, tag: Tag.HOME,    risk: 1, proves: ProofType.LOCATION,  source: 'wifi',          flavor: 'WiFi log' },
    { id: 'C', power: 2, tag: Tag.HOME,    risk: 0, proves: ProofType.IDENTITY,  refutes: 'counter_1', source: 'smart_lock', flavor: 'Smart lock' },
    { id: 'D', power: 3, tag: Tag.ASLEEP,  risk: 0, proves: ProofType.ALERTNESS, source: 'thermostat',    flavor: 'Thermostat' },
    { id: 'E', power: 5, tag: Tag.AWAKE,   risk: 2, proves: ProofType.IDENTITY,  source: 'doorbell',      flavor: 'Doorbell cam' },
    { id: 'F', power: 2, tag: Tag.ALONE,   risk: 0, source: 'motion',            flavor: 'Motion sensor' },
    { id: 'G', power: 2, tag: Tag.AWAKE,   risk: 1, proves: ProofType.LIVENESS,  source: 'camera',        flavor: 'Security camera' },
  ],
  counters: [
    { id: 'counter_1', targets: ['B'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity',  requiredProof: ProofType.IDENTITY },
    { id: 'concern_location',  requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
};

// ============================================================================
// Test Puzzle 2: "The Thermostat War" (TRAP archetype)
// Highest-power card is the trap — proves IDENTITY but AWAY tag locks out
// the HOME cards you need for location proof. High risk too.
// ============================================================================

const THE_THERMOSTAT_WAR: Puzzle = {
  name: 'The Thermostat War (TRAP)',
  resistance: 11,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    // A is the TRAP: highest power, AWAY contradicts HOME cards, high risk
    { id: 'A', power: 6, tag: Tag.AWAY,    risk: 2, proves: ProofType.IDENTITY,  source: 'gps',        flavor: 'Phone GPS ping' },
    { id: 'B', power: 3, tag: Tag.HOME,    risk: 1, proves: ProofType.LOCATION,  source: 'router',     flavor: 'Router MAC log' },
    { id: 'C', power: 3, tag: Tag.HOME,    risk: 0, proves: ProofType.IDENTITY,  refutes: 'counter_tw1', source: 'smart_lock', flavor: 'Smart lock entry' },
    // D proves LOCATION (same as B) → repetition risk fires
    { id: 'D', power: 4, tag: Tag.IDLE,    risk: 1, proves: ProofType.LOCATION,  source: 'thermostat', flavor: 'Thermostat schedule' },
    { id: 'E', power: 2, tag: Tag.HOME,    risk: 0, proves: ProofType.ALERTNESS, source: 'camera',     flavor: 'Hallway camera' },
    { id: 'F', power: 2, tag: Tag.ALONE,   risk: 0, source: 'motion',            flavor: 'Motion sensor' },
  ],
  counters: [
    { id: 'counter_tw1', targets: ['B'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
};

// ============================================================================
// Test Puzzle 3: "The Missing Remote" (TIGHT MARGINS archetype)
// Highest-power card is essential — you NEED it to clear resistance.
// Margin is razor-thin, every point counts.
// ============================================================================

const THE_MISSING_REMOTE: Puzzle = {
  name: 'The Missing Remote (TIGHT MARGINS)',
  resistance: 13,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    // A is essential — highest power, must use it despite contest
    { id: 'A', power: 5, tag: Tag.HOME,    risk: 1, proves: ProofType.LOCATION,  source: 'wifi',       flavor: 'WiFi connection log' },
    // B is ACTIVE, contradicts F (IDLE) — creates contradiction axis
    { id: 'B', power: 4, tag: Tag.ACTIVE,  risk: 1, proves: ProofType.ALERTNESS, source: 'watch',      flavor: 'Smartwatch activity' },
    { id: 'C', power: 3, tag: Tag.HOME,    risk: 0, proves: ProofType.IDENTITY,  refutes: 'counter_mr1', source: 'smart_lock', flavor: 'Smart lock' },
    // D proves LOCATION (same as A) → repetition risk
    { id: 'D', power: 3, tag: Tag.ALONE,   risk: 1, proves: ProofType.LOCATION,  source: 'motion',     flavor: 'Motion sensor (1 zone)' },
    { id: 'E', power: 2, tag: Tag.IDLE,    risk: 0, proves: ProofType.IDENTITY,  source: 'camera',     flavor: 'Doorbell cam' },
    { id: 'F', power: 2, tag: Tag.IDLE,    risk: 0, proves: ProofType.INTENT,    source: 'tv',         flavor: 'TV standby log' },
  ],
  counters: [
    { id: 'counter_mr1', targets: ['A'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity',  requiredProof: ProofType.IDENTITY },
    { id: 'concern_location',  requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
};

// ============================================================================
// Test Puzzle 4: "The Shampoo Thief" (COUNTER-HEAVY archetype)
// 3 counters — must sequence refutations to avoid contested penalties.
// Highest-power card is contested; refute first or eat the penalty.
// ============================================================================

const THE_SHAMPOO_THIEF: Puzzle = {
  name: 'The Shampoo Thief (COUNTER-HEAVY)',
  resistance: 13,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    // A & B are both contested by multiple counters — sequence refutations first
    { id: 'A', power: 5, tag: Tag.HOME,    risk: 1, proves: ProofType.LOCATION,  source: 'wifi',       flavor: 'WiFi log' },
    // B is AWAKE, contradicts E (ASLEEP) — creates axis
    { id: 'B', power: 4, tag: Tag.AWAKE,   risk: 1, proves: ProofType.ALERTNESS, source: 'watch',      flavor: 'Smartwatch HR' },
    { id: 'C', power: 2, tag: Tag.HOME,    risk: 0, proves: ProofType.IDENTITY,  refutes: 'counter_st1', source: 'smart_lock', flavor: 'Smart lock' },
    // D proves LOCATION (same as A) → repetition risk
    { id: 'D', power: 2, tag: Tag.ALONE,   risk: 0, proves: ProofType.LOCATION,  refutes: 'counter_st2', source: 'motion', flavor: 'Motion sensor' },
    // E is ASLEEP, contradicts B (AWAKE) — creates push-your-luck via graduated contradiction
    { id: 'E', power: 3, tag: Tag.ASLEEP,  risk: 1, proves: ProofType.ALERTNESS, refutes: 'counter_st3', source: 'camera', flavor: 'Bedroom camera' },
    // F is ASLEEP too — if player uses warning on B+E, then F creates 2nd contradiction → block
    { id: 'F', power: 2, tag: Tag.ASLEEP,  risk: 0, proves: ProofType.INTENT,    source: 'speaker',    flavor: 'Sleep podcast log' },
  ],
  counters: [
    { id: 'counter_st1', targets: ['A'], refuted: false },
    { id: 'counter_st2', targets: ['B'], refuted: false },
    { id: 'counter_st3', targets: ['B'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity',  requiredProof: ProofType.IDENTITY },
    { id: 'concern_location',  requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
};

// ============================================================================
// Test Puzzle 5: "The Last Slice" (V2.5 port of V1 fixture)
// Original V1 had 89.6% win rate. V2.5 port should hit 40-60%.
// Archetype: CORROBORATION (ASLEEP pair + HOME pair, decoy is AWAKE GPS)
// ============================================================================

const THE_LAST_SLICE_V25: Puzzle = {
  name: 'The Last Slice v2.5 (CORROBORATION)',
  resistance: 14,
  turns: 3,
  scrutinyLimit: 5,
  cards: [
    { id: 'doorbell',     power: 3, tag: Tag.HOME,   risk: 1, proves: ProofType.IDENTITY, refutes: 'counter_alibi', source: 'smart_doorbell',  flavor: 'Smart doorbell' },
    { id: 'fitbit',       power: 4, tag: Tag.ASLEEP, risk: 0, proves: ProofType.ALERTNESS, source: 'fitness_tracker', flavor: 'Fitbit' },
    { id: 'thermostat',   power: 3, tag: Tag.HOME,   risk: 0, proves: ProofType.LOCATION,  source: 'smart_thermostat', flavor: 'Smart thermostat' },
    { id: 'phone_gps',    power: 5, tag: Tag.AWAKE,  risk: 2, proves: ProofType.LOCATION,  source: 'phone_gps',      flavor: 'Phone GPS' },
    { id: 'speaker',      power: 3, tag: Tag.AWAKE,  risk: 1, proves: ProofType.INTENT,    source: 'smart_speaker',  flavor: 'Smart speaker' },
    { id: 'security_cam', power: 5, tag: Tag.ASLEEP, risk: 1, proves: ProofType.LIVENESS,  source: 'security_camera', flavor: 'Security camera' },
  ],
  counters: [
    { id: 'counter_alibi', targets: ['security_cam'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity', requiredProof: ProofType.IDENTITY },
    { id: 'concern_location', requiredProof: ProofType.LOCATION },
    { id: 'concern_intent',   requiredProof: ProofType.INTENT },
  ],
};

// ============================================================================
// Metrics Output
// ============================================================================

function formatPath(seq: PlaySequence): string {
  return seq.turns.map((t, i) => `T${i + 1}:[${t.join('+')}]`).join(' → ');
}

function runAnalysis(puzzle: Puzzle) {
  console.log('V2.5 Prototype — Interference Rules + Ambiguous Feedback');
  console.log('=========================================================\n');

  console.log(`Puzzle: ${puzzle.name}`);
  console.log(`Resistance: ${puzzle.resistance} | Turns: ${puzzle.turns} | Scrutiny limit: ${puzzle.scrutinyLimit} | Cards: ${puzzle.cards.length}`);
  console.log(`Counters: ${puzzle.counters.length} | Concerns: ${puzzle.concerns.length}\n`);

  console.log('CARDS:');
  for (const c of puzzle.cards) {
    const extras = [
      c.proves ? `proves:${c.proves}` : null,
      c.refutes ? `refutes:${c.refutes}` : null,
      c.source ? `source:${c.source}` : null,
    ].filter(Boolean).join(' ');
    console.log(`  ${c.id}: power=${c.power} tag=${c.tag} risk=${c.risk} ${extras} (${c.flavor ?? ''})`);
  }

  console.log('\nEnumerating all play sequences...');
  const start = Date.now();
  const all = simulateAll(puzzle);
  const elapsed = Date.now() - start;
  console.log(`Found ${all.length} terminal states in ${elapsed}ms\n`);

  const winners = all.filter(s => s.won);
  const losers = all.filter(s => !s.won);
  const blocked = all.filter(s => s.blocked);
  const hadBlockedAttempts = all.filter(s => s.blockedAttempts > 0);
  const scrutinyLosses = all.filter(s => s.lostScrutiny);

  const optimal = winners.length > 0
    ? winners.reduce((best, s) => {
        // Best = lowest scrutiny, then highest damage, then fewest turns
        if (s.finalScrutiny < best.finalScrutiny) return s;
        if (s.finalScrutiny === best.finalScrutiny && s.totalDamage > best.totalDamage) return s;
        return best;
      })
    : null;
  const maxDamageWin = winners.length > 0
    ? winners.reduce((a, b) => a.totalDamage > b.totalDamage ? a : b)
    : null;
  const naive = findNaivePath(puzzle);

  // ============================================================================
  // V2.5 METRICS
  // ============================================================================

  const winRate = (winners.length / all.length) * 100;
  const cleanSweeps = all.filter(s =>
    s.won && s.finalScrutiny === 0 && s.totalRisk === 0 &&
    s.concernsAddressed === puzzle.concerns.length
  );
  const scrutinyAt0 = all.filter(s => s.finalScrutiny === 0);

  console.log('=== V2.5 METRICS ===');
  console.log(`Win rate:           ${winRate.toFixed(1)}% (${winners.length}/${all.length})`);
  console.log(`Clean sweeps:       ${cleanSweeps.length}`);
  console.log(`Blocked paths:      ${blocked.length} fully blocked, ${hadBlockedAttempts.length} hit blocks (contradictions fire)`);
  console.log(`Scrutiny at 0:      ${((scrutinyAt0.length / all.length) * 100).toFixed(1)}% (target < 30%)`);
  console.log(`Naive wins:         ${naive.won ? 'YES' : 'NO'}`);
  console.log(`Optimal margin:     ${maxDamageWin ? `+${maxDamageWin.totalDamage - puzzle.resistance}` : 'N/A'}`);

  // ============================================================================
  // V2.5 INTERFERENCE
  // ============================================================================

  const repFiredWins = winners.filter(s => s.repetitionRiskFired).length;
  const contraUsedWins = winners.filter(s => s.contradictionWarningUsed).length;
  const srcDivWins = winners.filter(s => s.sourceDiversityUsed).length;

  // For corroboration paths (to compute source diversity % of corroborations)
  const corrobPaths = all.filter(s => s.turnResults.some(r => r.corroborationBonus > 0));
  const srcDivCorr = all.filter(s => s.sourceDiversityUsed);

  console.log('\n=== V2.5 INTERFERENCE ===');
  console.log(`Repetition risk fired:    ${winners.length > 0 ? ((repFiredWins / winners.length) * 100).toFixed(1) : 'N/A'}% of winning paths`);
  console.log(`Graduated contradiction:  ${winners.length > 0 ? ((contraUsedWins / winners.length) * 100).toFixed(1) : 'N/A'}% used free warning`);
  console.log(`Source diversity bonus:    ${corrobPaths.length > 0 ? ((srcDivCorr.length / corrobPaths.length) * 100).toFixed(1) : 'N/A'}% of corroborations`);

  // ============================================================================
  // 7 PRINCIPLES CHECK
  // ============================================================================

  console.log('\n=== 7 PRINCIPLES CHECK ===');

  // P1: Transparent/Opaque — Testimony Lock (all cards visible, resolution hidden)
  console.log('P1 Transparent/Opaque:    PASS (Testimony Lock — all cards visible, tag locks deducible but not previewed)');

  // P2: Irreversible + Info — each turn consumes budget, reveals scrutiny/damage
  console.log('P2 Irreversible+Info:     PASS (turn budget consumed, scrutiny/damage revealed per turn)');

  // P3: Counter-intuitive optimal — does naive path lose?
  const p3pass = !naive.won;
  console.log(`P3 Counter-intuitive:     ${p3pass ? 'PASS' : 'FAIL'} (naive path ${naive.won ? 'WINS — greedy works' : 'LOSES — must think'})`);

  // P4: Helpful + Dangerous feedback — manual (ambiguous design)
  console.log('P4 Helpful+Dangerous:     MANUAL (ambiguous feedback design — scrutiny not itemized, KOA hints)');

  // P5: Depth without punishing breadth — win rate 30-70%
  const p5pass = winRate >= 30 && winRate <= 70;
  console.log(`P5 Depth/Breadth:         ${p5pass ? 'PASS' : 'FAIL'} (win rate ${winRate.toFixed(1)}%, target 30-70%)`);

  // P6: Shareable artifact — design only
  console.log('P6 Shareable:             DESIGN (turns/scrutiny/badges + KOA quote on share card)');

  // P7: Constraint as engine — blocked paths > 0
  const p7pass = blocked.length > 0 || hadBlockedAttempts.length > 0;
  console.log(`P7 Constraint as engine:  ${p7pass ? 'PASS' : 'FAIL'} (${blocked.length} blocked paths)`);

  // --- Sub-invariants ---
  console.log('\n--- Sub-Invariant Checks ---');

  // SI-5: Zero clean sweeps
  const si5pass = cleanSweeps.length === 0;
  console.log(`SI-5 No clean sweeps:     ${si5pass ? 'PASS' : 'FAIL'} (${cleanSweeps.length} clean sweeps)`);

  // MI-1: Optimal margin 3-8
  const optMargin = maxDamageWin ? maxDamageWin.totalDamage - puzzle.resistance : 0;
  const mi1pass = optMargin >= 3 && optMargin <= 8;
  console.log(`MI-1 Optimal margin 3-8:  ${mi1pass ? 'PASS' : 'FAIL'} (margin: +${optMargin})`);

  // MI-2: Naive path loses
  const mi2pass = !naive.won;
  console.log(`MI-2 Naive loses:         ${mi2pass ? 'PASS' : 'FAIL'}`);

  // ============================================================================
  // DETAILED ANALYSIS
  // ============================================================================

  console.log('\n=== DETAILED ANALYSIS ===');

  // Optimal path
  console.log('\n--- OPTIMAL PATH (lowest scrutiny, then highest damage) ---');
  if (optimal) {
    console.log(`Path: ${formatPath(optimal)}`);
    console.log(`Damage: ${optimal.totalDamage} | Scrutiny: ${optimal.finalScrutiny} | Risk: ${optimal.totalRisk}`);
    console.log(`Concerns: ${optimal.concernsAddressed}/${puzzle.concerns.length} | Refuted: ${optimal.countersRefuted}/${puzzle.counters.length}`);
    console.log(`Rules fired: rep=${optimal.repetitionRiskFired} contra=${optimal.contradictionWarningUsed} srcDiv=${optimal.sourceDiversityUsed}`);
  } else {
    console.log('NO WINNING PATH FOUND');
  }

  if (maxDamageWin && maxDamageWin !== optimal) {
    console.log('\n--- MAX DAMAGE WIN ---');
    console.log(`Path: ${formatPath(maxDamageWin)}`);
    console.log(`Damage: ${maxDamageWin.totalDamage} | Scrutiny: ${maxDamageWin.finalScrutiny}`);
  }

  console.log('\n--- NAIVE PATH (descending power, one card/turn) ---');
  console.log(`Path: ${formatPath(naive)}`);
  console.log(`Damage: ${naive.totalDamage} | Scrutiny: ${naive.finalScrutiny} | Won: ${naive.won}`);

  // Ambiguous feedback demo for naive path
  console.log('\n--- AMBIGUOUS FEEDBACK DEMO (naive path) ---');
  {
    const demoState = initState(puzzle);
    const sorted = [...puzzle.cards].sort((a, b) => b.power - a.power);
    let turn = 0;
    for (const card of sorted) {
      const demoAllConcerns = demoState.addressedConcerns.size >= puzzle.concerns.length;
      if (demoState.turnsRemaining <= 0 || demoState.scrutiny >= puzzle.scrutinyLimit || (demoState.resistance <= 0 && demoAllConcerns)) break;
      const cloned = cloneState(demoState);
      const result = processTurn(cloned, [card.id], puzzle);
      if (result.blocked) {
        console.log(`Turn ${++turn}: [${card.id}] — BLOCKED`);
        continue;
      }
      turn++;
      Object.assign(demoState, cloned);
      console.log(`Turn ${turn}: [${card.id}] (${card.flavor})`);
      console.log(formatAmbiguousFeedback(result, demoState, puzzle));
      // Show what's hidden: the actual breakdown
      const hidden: string[] = [];
      if (result.repetitionRiskFired) hidden.push('repetition+1');
      if (result.contradictionWarning) hidden.push('contradiction+1');
      hidden.push(`risk=${card.risk}`);
      console.log(`  [HIDDEN from player: ${hidden.join(', ')}]`);
    }
  }

  // Damage distribution
  const dmg = all.map(s => s.totalDamage).sort((a, b) => a - b);
  const pct = (p: number) => dmg[Math.floor(dmg.length * p)]!;
  console.log('\n--- DAMAGE DISTRIBUTION ---');
  console.log(`  p10=${pct(0.1)} p25=${pct(0.25)} p50=${pct(0.5)} p75=${pct(0.75)} p90=${pct(0.9)}`);
  console.log(`  min=${dmg[0]} max=${dmg[dmg.length - 1]}`);

  // Scrutiny distribution
  const maxS = puzzle.scrutinyLimit;
  const scrutinyCounts = Array.from({ length: maxS + 1 }, () => 0);
  for (const s of all) scrutinyCounts[Math.min(s.finalScrutiny, maxS)]!++;
  console.log('\n--- SCRUTINY DISTRIBUTION ---');
  for (let i = 0; i <= maxS; i++) {
    const p = ((scrutinyCounts[i]! / all.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(p) / 2));
    console.log(`  scrutiny=${i}: ${p.padStart(5)}% ${bar} (${scrutinyCounts[i]})`);
  }

  // Card roles
  console.log('\n--- CARD ROLES ---');
  for (const c of [...puzzle.cards].sort((a, b) => b.power - a.power)) {
    const inWins = winners.filter(w => w.turns.flat().includes(c.id)).length;
    const winPct = winners.length > 0 ? ((inWins / winners.length) * 100).toFixed(0) : '0';
    const opposite = OPPOSING.get(c.tag);
    const locksOut = opposite ? puzzle.cards.filter(o => o.tag === opposite).map(o => o.id) : [];
    console.log(`  ${c.id} (pwr=${c.power} tag=${c.tag} risk=${c.risk} src=${c.source ?? '-'})`);
    console.log(`    in_wins: ${winPct}% ${locksOut.length > 0 ? `| locks_out: [${locksOut.join(',')}]` : ''} ${c.proves ? `| proves: ${c.proves}` : ''}`);
  }

  // Corroboration groups
  console.log('\n--- CORROBORATION GROUPS ---');
  const tagPairs = new Map<Tag, Card[]>();
  for (const c of puzzle.cards) {
    if (!tagPairs.has(c.tag)) tagPairs.set(c.tag, []);
    tagPairs.get(c.tag)!.push(c);
  }
  for (const [tag, cards] of tagPairs) {
    if (cards.length >= 2) {
      const sources = cards.map(c => c.source ?? '?');
      const diverse = new Set(sources).size >= 2;
      console.log(`  ${tag}: [${cards.map(c => c.id).join(', ')}] sources=[${sources.join(',')}] ${diverse ? '→ 30% bonus' : '→ 20% bonus'}`);
    }
  }

  // ============================================================================
  // COMPARISON TABLE
  // ============================================================================

  console.log('\n=========================================================');
  console.log('  V1 vs V2 vs V2.5 COMPARISON');
  console.log('=========================================================');
  console.log('                        V1 (broken)  V2 (proto)   V2.5 (new)   Target');
  console.log(`  Win rate:             89.6%        51.3%        ${winRate.toFixed(1).padStart(5)}%       40-60%`);
  console.log(`  Clean sweeps:         764          0            ${String(cleanSweeps.length).padStart(5)}        0`);
  console.log(`  Blocked paths:        0            4            ${String(blocked.length).padStart(5)}        > 0 (${hadBlockedAttempts.length} hit blocks)`);
  console.log(`  Scrutiny at 0:        100%         0%           ${((scrutinyAt0.length / all.length) * 100).toFixed(1).padStart(5)}%       < 30%`);
  console.log(`  Naive wins:           YES          NO           ${(naive.won ? 'YES' : 'NO').padStart(5)}        NO`);
  console.log(`  Optimal margin:       +29          +7           ${('+' + optMargin).padStart(5)}        +3 to +8`);
  console.log(`  Rep risk fires:       N/A          N/A          ${(winners.length > 0 ? ((repFiredWins / winners.length) * 100).toFixed(1) : 'N/A').padStart(5)}%       > 20% wins`);
  console.log(`  Grad. contradiction:  N/A          N/A          ${(winners.length > 0 ? ((contraUsedWins / winners.length) * 100).toFixed(1) : 'N/A').padStart(5)}%       > 10% wins`);
  console.log(`  Source diversity:      N/A          N/A          ${(corrobPaths.length > 0 ? ((srcDivCorr.length / corrobPaths.length) * 100).toFixed(1) : 'N/A').padStart(5)}%       > 15% corrob`);
  // ============================================================================
  // REPLAYABILITY ANALYSIS
  // ============================================================================

  console.log('\n=== REPLAYABILITY ANALYSIS ===');

  // Distinct card sets used in winning paths (order-independent)
  const winCardSets = new Set<string>();
  for (const w of winners) {
    const cards = w.turns.flat().sort().join(',');
    winCardSets.add(cards);
  }
  console.log(`Distinct winning card sets: ${winCardSets.size}`);

  // Distinct strategic paths: normalize by card-set-per-turn (order of turns matters, not card order within turn)
  const winStrategies = new Set<string>();
  for (const w of winners) {
    const key = w.turns.map(t => t.sort().join('+')).join(' → ');
    winStrategies.add(key);
  }
  console.log(`Distinct winning strategies (turn-ordered): ${winStrategies.size}`);

  // How many truly different "plans" exist? Group by which tag axis is chosen (ASLEEP vs AWAKE side)
  const asleepWins = winners.filter(w => {
    const ids = w.turns.flat();
    return ids.includes('A') || ids.includes('D');
  });
  const awakeWins = winners.filter(w => {
    const ids = w.turns.flat();
    return ids.includes('E') || ids.includes('G');
  });
  const bothAxisWins = winners.filter(w => {
    const ids = w.turns.flat();
    return (ids.includes('A') || ids.includes('D')) && (ids.includes('E') || ids.includes('G'));
  });
  const neitherAxisWins = winners.filter(w => {
    const ids = w.turns.flat();
    return !ids.includes('A') && !ids.includes('D') && !ids.includes('E') && !ids.includes('G');
  });
  console.log(`\nStrategic axis split (ASLEEP vs AWAKE):`);
  console.log(`  ASLEEP side only:  ${asleepWins.length - bothAxisWins.length} wins`);
  console.log(`  AWAKE side only:   ${awakeWins.length - bothAxisWins.length} wins`);
  console.log(`  Both (via warning): ${bothAxisWins.length} wins`);
  console.log(`  Neither axis:      ${neitherAxisWins.length} wins`);

  // Optimal play length
  const winTurnCounts = new Map<number, number>();
  for (const w of winners) {
    const t = w.turnsUsed;
    winTurnCounts.set(t, (winTurnCounts.get(t) ?? 0) + 1);
  }
  console.log(`\nWinning path lengths:`);
  for (const [t, count] of [...winTurnCounts].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${t} turns: ${count} paths (${((count / winners.length) * 100).toFixed(1)}%)`);
  }

  // Scrutiny spread among winners (how many "grades" of win exist?)
  const winScrutiny = new Map<number, number>();
  for (const w of winners) {
    winScrutiny.set(w.finalScrutiny, (winScrutiny.get(w.finalScrutiny) ?? 0) + 1);
  }
  console.log(`\nWin quality spread (scrutiny at win):`);
  for (const [s, count] of [...winScrutiny].sort((a, b) => a[0] - b[0])) {
    const label = s === 0 ? 'FLAWLESS' : s <= 2 ? 'CLEAN' : s <= 3 ? 'MESSY' : 'BARELY';
    console.log(`  scrutiny=${s} (${label}): ${count} paths (${((count / winners.length) * 100).toFixed(1)}%)`);
  }

  // Badge tier breakdown (v2.5.1)
  const badgeFlawless = winners.filter(w => w.finalScrutiny <= 2 && w.concernsAddressed === puzzle.concerns.length);
  const badgeThorough = winners.filter(w => w.concernsAddressed === puzzle.concerns.length && w.finalScrutiny > 2);
  const badgeClean = winners.filter(w => w.finalScrutiny <= 2 && w.concernsAddressed < puzzle.concerns.length);
  const badgeWin = winners.filter(w => w.finalScrutiny > 2 && w.concernsAddressed < puzzle.concerns.length);
  console.log(`\nBadge tier breakdown (v2.5.1):`);
  console.log(`  FLAWLESS  (all concerns + scrutiny ≤ 2): ${badgeFlawless.length} paths (${winners.length > 0 ? ((badgeFlawless.length / winners.length) * 100).toFixed(1) : '0'}%)`);
  console.log(`  THOROUGH  (all concerns):                ${badgeThorough.length} paths (${winners.length > 0 ? ((badgeThorough.length / winners.length) * 100).toFixed(1) : '0'}%)`);
  console.log(`  CLEAN     (scrutiny ≤ 2):                ${badgeClean.length} paths (${winners.length > 0 ? ((badgeClean.length / winners.length) * 100).toFixed(1) : '0'}%)`);
  console.log(`  WIN       (base):                        ${badgeWin.length} paths (${winners.length > 0 ? ((badgeWin.length / winners.length) * 100).toFixed(1) : '0'}%)`);


  // Concerns addressed among winners
  const winConcerns = new Map<number, number>();
  for (const w of winners) {
    winConcerns.set(w.concernsAddressed, (winConcerns.get(w.concernsAddressed) ?? 0) + 1);
  }
  console.log(`\nConcerns addressed among winners:`);
  for (const [c, count] of [...winConcerns].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${c}/${puzzle.concerns.length}: ${count} paths (${((count / winners.length) * 100).toFixed(1)}%)`);
  }

  // Bottom line: how many plays until "solved"?
  // v2.5.1: FLAWLESS = all concerns + scrutiny ≤ 2
  const flawlessWins = winners.filter(w => w.finalScrutiny <= 2 && w.concernsAddressed === puzzle.concerns.length);
  console.log(`\n--- BOTTOM LINE ---`);
  console.log(`Min concerns for WIN: ${Math.ceil(puzzle.concerns.length / 2)}/${puzzle.concerns.length} (v2.5.1 gate)`);
  console.log(`Puzzle has ${winStrategies.size} distinct winning strategies.`);
  console.log(`${winCardSets.size} different card selections can win.`);
  console.log(`FLAWLESS wins (scrutiny<=2 + all concerns): ${flawlessWins.length}/${winners.length} (${winners.length > 0 ? ((flawlessWins.length / winners.length) * 100).toFixed(1) : '0'}%)`);
  if (flawlessWins.length > 0) {
    const flawlessStrats = new Set(flawlessWins.map(w => w.turns.map(t => t.sort().join('+')).join(' → ')));
    console.log(`FLAWLESS strategies: ${flawlessStrats.size}`);
    for (const s of flawlessStrats) console.log(`  ${s}`);
  }
  // v2.5.1: SP-1 safe-path check
  const safeOnlyCards = puzzle.cards.filter(c => c.risk === 0);
  const safeMaxDmg = safeOnlyCards.reduce((s, c) => s + c.power, 0);
  console.log(`\nSafe-path (risk-0 only) max raw power: ${safeMaxDmg} vs resistance ${puzzle.resistance} (margin: ${safeMaxDmg > puzzle.resistance ? '+' : ''}${safeMaxDmg - puzzle.resistance})`);
  console.log(`\nReplay estimate: A single puzzle is "solved" once the player finds`);
  console.log(`a FLAWLESS path. With ${winStrategies.size} strategies and ${flawlessWins.length > 0 ? ((flawlessWins.length / winners.length) * 100).toFixed(0) : 0}% of wins being FLAWLESS,`);
  console.log(`this puzzle supports ~${Math.max(1, Math.ceil(Math.log2(winStrategies.size)))} meaningful attempts before mastery.`);
  console.log(`Longevity comes from the PUZZLE LIBRARY, not a single puzzle.`);
  console.log('');
}

// ============================================================================
// Run All Puzzles + Cross-Puzzle Summary
// ============================================================================

const ALL_PUZZLES = [
  THE_MIDNIGHT_SNACK,
  THE_THERMOSTAT_WAR,
  THE_MISSING_REMOTE,
  THE_SHAMPOO_THIEF,
  THE_LAST_SLICE_V25,
];

interface PuzzleSummary {
  name: string;
  winRate: number;
  cleanSweeps: number;
  blockedPaths: number;
  hitBlocks: number;
  scrutinyAt0Pct: number;
  naiveWins: boolean;
  optimalMargin: number;
  repRiskPct: number;
  contradictionPct: number;
  srcDivPct: number;
  highCardInOptimal: boolean;
  distinctStrategies: number;
  flawlessCount: number;  // v2.5.1: all concerns + scrutiny ≤ 2
  totalWins: number;
  totalPaths: number;
  safePathMargin: number; // v2.5.1: SP-1 — max damage from risk-0 cards only minus resistance
  minConcernsRequired: number; // v2.5.1: ⌈concerns/2⌉
}

const summaries: PuzzleSummary[] = [];

for (const puzzle of ALL_PUZZLES) {
  runAnalysis(puzzle);

  // Collect summary data
  const all = simulateAll(puzzle);
  const winners = all.filter(s => s.won);
  const blocked = all.filter(s => s.blocked);
  const hadBlocks = all.filter(s => s.blockedAttempts > 0);
  const scrutinyAt0 = all.filter(s => s.finalScrutiny === 0);
  const naive = findNaivePath(puzzle);
  const maxDmgWin = winners.length > 0
    ? winners.reduce((a, b) => a.totalDamage > b.totalDamage ? a : b)
    : null;
  const cleanSweeps = all.filter(s =>
    s.won && s.finalScrutiny === 0 && s.totalRisk === 0 &&
    s.concernsAddressed === puzzle.concerns.length
  );
  const repFiredWins = winners.filter(s => s.repetitionRiskFired).length;
  const contraUsedWins = winners.filter(s => s.contradictionWarningUsed).length;
  const corrobPaths = all.filter(s => s.turnResults.some(r => r.corroborationBonus > 0));
  const srcDivCorr = all.filter(s => s.sourceDiversityUsed);

  // Is highest-power card in optimal path?
  const highCard = [...puzzle.cards].sort((a, b) => b.power - a.power)[0]!;
  const optimal = winners.length > 0
    ? winners.reduce((best, s) => {
        if (s.finalScrutiny < best.finalScrutiny) return s;
        if (s.finalScrutiny === best.finalScrutiny && s.totalDamage > best.totalDamage) return s;
        return best;
      })
    : null;
  const highCardInOptimal = optimal ? optimal.turns.flat().includes(highCard.id) : false;

  const winStrategies = new Set(winners.map(w => w.turns.map(t => t.sort().join('+')).join(' → ')));
  // v2.5.1: FLAWLESS = all concerns + scrutiny ≤ 2
  const flawlessWins = winners.filter(w => w.finalScrutiny <= 2 && w.concernsAddressed === puzzle.concerns.length);

  // v2.5.1: SP-1 — compute max damage from risk-0 cards only
  const safeCards = puzzle.cards.filter(c => c.risk === 0);
  const safePaths = simulateAll({
    ...puzzle,
    cards: safeCards,
    // keep counters/concerns but only safe cards available
  });
  const safeWins = safePaths.filter(s => s.won);
  const maxSafeDamage = safePaths.length > 0
    ? safePaths.reduce((max, s) => Math.max(max, s.totalDamage), 0)
    : 0;
  const safePathMargin = maxSafeDamage - puzzle.resistance;

  summaries.push({
    name: puzzle.name,
    winRate: (winners.length / all.length) * 100,
    cleanSweeps: cleanSweeps.length,
    blockedPaths: blocked.length,
    hitBlocks: hadBlocks.length,
    scrutinyAt0Pct: (scrutinyAt0.length / all.length) * 100,
    naiveWins: naive.won,
    optimalMargin: maxDmgWin ? maxDmgWin.totalDamage - puzzle.resistance : 0,
    repRiskPct: winners.length > 0 ? (repFiredWins / winners.length) * 100 : 0,
    contradictionPct: winners.length > 0 ? (contraUsedWins / winners.length) * 100 : 0,
    srcDivPct: corrobPaths.length > 0 ? (srcDivCorr.length / corrobPaths.length) * 100 : 0,
    highCardInOptimal,
    distinctStrategies: winStrategies.size,
    flawlessCount: flawlessWins.length,
    totalWins: winners.length,
    totalPaths: all.length,
    safePathMargin,
    minConcernsRequired: Math.ceil(puzzle.concerns.length / 2),
  });
}

// ============================================================================
// Cross-Puzzle Summary
// ============================================================================

console.log('\n\n');
console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║              CROSS-PUZZLE ARCHETYPE VALIDATION SUMMARY              ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝\n');

const col = (s: string, w: number) => s.padEnd(w);
const num = (n: number, d = 1) => n.toFixed(d);
const yn = (b: boolean) => b ? 'YES' : 'NO';

const hdr = `  ${col('Metric', 28)} ${col('Target', 12)} ${summaries.map(s => col(s.name.split(' (')[0]!, 16)).join('')}`;
console.log(hdr);
console.log('  ' + '─'.repeat(hdr.length - 2));

const row = (label: string, target: string, vals: string[]) =>
  `  ${col(label, 28)} ${col(target, 12)} ${vals.map(v => col(v, 16)).join('')}`;

console.log(row('Win rate', '40-60%', summaries.map(s => `${num(s.winRate)}%`)));
console.log(row('Clean sweeps', '0', summaries.map(s => String(s.cleanSweeps))));
console.log(row('Hit blocks', '> 0', summaries.map(s => String(s.hitBlocks))));
console.log(row('Scrutiny at 0', '< 30%', summaries.map(s => `${num(s.scrutinyAt0Pct)}%`)));
console.log(row('Naive wins', 'NO', summaries.map(s => yn(s.naiveWins))));
console.log(row('Optimal margin', '+3 to +8', summaries.map(s => `+${s.optimalMargin}`)));
console.log(row('Rep risk fires', '> 20% wins', summaries.map(s => `${num(s.repRiskPct)}%`)));
console.log(row('Grad. contradiction', '> 10% wins', summaries.map(s => `${num(s.contradictionPct)}%`)));
console.log(row('Source diversity', '> 15% corrob', summaries.map(s => `${num(s.srcDivPct)}%`)));
console.log(row('High card optimal?', 'varies', summaries.map(s => yn(s.highCardInOptimal))));
console.log(row('Distinct strategies', '', summaries.map(s => String(s.distinctStrategies))));
console.log(row('FLAWLESS paths', '> 0', summaries.map(s => `${s.flawlessCount}/${s.totalWins}`)));
console.log(row('Safe-path margin', '≤ +3', summaries.map(s => `${s.safePathMargin > 0 ? '+' : ''}${s.safePathMargin}`)));
console.log(row('Min concerns for WIN', '', summaries.map(s => `${s.minConcernsRequired}`)));

// Archetype validation
console.log('\n--- ARCHETYPE VALIDATION (D32 §Weekly Archetype Distribution) ---');

const highCardResults = summaries.map(s => s.highCardInOptimal);
const highInOptCount = highCardResults.filter(Boolean).length;
const highAsTrapCount = highCardResults.filter(x => !x).length;
console.log(`High card IN optimal path: ${highInOptCount}/4 puzzles (D32: >=2/7 per week)`);
console.log(`High card IS the trap:     ${highAsTrapCount}/4 puzzles (D32: >=2/7 per week)`);

// Pass/fail summary
console.log('\n--- PASS/FAIL PER PUZZLE ---');
for (const s of summaries) {
  const checks = [
    { name: 'P5-winrate',   pass: s.winRate >= 30 && s.winRate <= 70 },
    { name: 'SI5-sweeps',   pass: s.cleanSweeps === 0 },
    { name: 'MI1-margin',   pass: s.optimalMargin >= 3 && s.optimalMargin <= 8 },
    { name: 'MI2-naive',    pass: !s.naiveWins },
    { name: 'P7-blocks',    pass: s.hitBlocks > 0 || s.blockedPaths > 0 },
    { name: 'RepRisk>20%',  pass: s.repRiskPct > 20 },
    { name: 'Contra>10%',   pass: s.contradictionPct > 10 },
    { name: 'SrcDiv>15%',   pass: s.srcDivPct > 15 },
    { name: 'FL-1 FLAWLESS', pass: s.flawlessCount > 0 },
    { name: 'SP-1 safe≤+3', pass: s.safePathMargin <= 3 },
  ];
  const passed = checks.filter(c => c.pass).length;
  const failed = checks.filter(c => !c.pass);
  const status = failed.length === 0 ? 'ALL PASS' : `${passed}/${checks.length} (FAIL: ${failed.map(f => f.name).join(', ')})`;
  console.log(`  ${col(s.name, 40)} ${status}`);
}

console.log('');
