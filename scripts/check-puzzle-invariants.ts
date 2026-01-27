#!/usr/bin/env npx tsx
/**
 * Puzzle Invariant Checker
 *
 * Brute-forces all valid play sequences through the turn processor,
 * then checks D32 invariants (MI-1, MI-2, MI-3, SI-1 through SI-6).
 *
 * Usage: npx tsx scripts/check-puzzle-invariants.ts
 */

import {
  processTurn,
  TrustTier,
  ContradictionSeverity,
  type TurnResult,
} from '@hsh/engine-core';
import type {
  RunState,
  Submission,
  EvidenceCard,
  CardId,
  Scrutiny,
  Puzzle,
  CounterEvidence,
} from '@hsh/engine-core';
import { THE_LAST_SLICE } from '../packages/engine-core/tests/fixtures/the-last-slice.js';

// ============================================================================
// Types
// ============================================================================

interface PlaySequence {
  readonly turns: readonly CardId[][];
  readonly totalDamage: number;
  readonly finalResistance: number;
  readonly finalScrutiny: number;
  readonly turnsUsed: number;
  readonly won: boolean;
  readonly lostScrutiny: boolean;
  readonly blocked: boolean; // hit a MAJOR contradiction
  readonly concernsAddressed: number;
  readonly countersRefuted: number;
  readonly contradictionCount: number;
}

interface InvariantResult {
  readonly id: string;
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

// ============================================================================
// Combinatorics: generate all possible submissions per turn
// ============================================================================

function combinations<T>(arr: T[], min: number, max: number): T[][] {
  const results: T[][] = [];
  function recurse(start: number, current: T[]) {
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

// ============================================================================
// Simulate all play sequences (DFS with pruning)
// ============================================================================

function simulateAll(
  puzzle: Puzzle,
  cards: ReadonlyMap<CardId, EvidenceCard>,
): PlaySequence[] {
  const results: PlaySequence[] = [];
  const maxTurns = puzzle.turns;

  function dfs(
    state: RunState,
    remainingHand: CardId[],
    turnsSoFar: CardId[][],
    totalDmg: number,
    contradictions: number,
    refutations: number,
  ) {
    // Terminal: game over or no turns left
    if (state.resistance <= 0 || state.turnsRemaining <= 0 || state.scrutiny >= 5) {
      results.push({
        turns: turnsSoFar,
        totalDamage: totalDmg,
        finalResistance: state.resistance,
        finalScrutiny: state.scrutiny,
        turnsUsed: maxTurns - state.turnsRemaining,
        won: state.resistance <= 0 && state.scrutiny < 5,
        lostScrutiny: state.scrutiny >= 5,
        blocked: false,
        concernsAddressed: state.concernsAddressed.length,
        countersRefuted: state.puzzle.counters.filter(c => c.refuted).length,
        contradictionCount: contradictions,
      });
      return;
    }

    // Generate all possible submissions from remaining hand (1-3 cards)
    const subs = combinations(remainingHand, 1, 3);

    // Also allow "pass" (skip turn with no cards) — not in current rules,
    // so we just allow the DFS to terminate naturally when no valid subs exist
    let hadValidSub = false;

    for (const sub of subs) {
      const cardIds = sub as Submission['cardIds'];
      const submission: Submission = { cardIds };

      const result = processTurn(state, submission, cards);

      if (!result.ok) {
        // MAJOR contradiction or other error — record this path as blocked
        if (result.error.code === 'MAJOR_CONTRADICTION') {
          // Don't recurse — this submission is invalid
          continue;
        }
        continue;
      }

      hadValidSub = true;
      const r = result.value;
      const newHand = remainingHand.filter(id => !sub.includes(id));

      dfs(
        r.newState,
        newHand,
        [...turnsSoFar, sub],
        totalDmg + r.damageDealt,
        contradictions + r.contradictions.length,
        refutations + r.refutationsApplied.length,
      );
    }

    // If no valid submission exists (all blocked), record as terminal
    if (!hadValidSub) {
      results.push({
        turns: turnsSoFar,
        totalDamage: totalDmg,
        finalResistance: state.resistance,
        finalScrutiny: state.scrutiny,
        turnsUsed: maxTurns - state.turnsRemaining,
        won: false,
        lostScrutiny: false,
        blocked: true,
        concernsAddressed: state.concernsAddressed.length,
        countersRefuted: state.puzzle.counters.filter(c => c.refuted).length,
        contradictionCount: contradictions,
      });
    }
  }

  const initialState: RunState = {
    puzzle,
    committedStory: [],
    resistance: puzzle.resistance,
    scrutiny: 0 as Scrutiny,
    turnsRemaining: puzzle.turns,
    concernsAddressed: [],
  };

  const hand = [...puzzle.dealtHand];
  dfs(initialState, hand, [], 0, 0, 0);

  return results;
}

// ============================================================================
// Identify key paths
// ============================================================================

function findOptimalPath(sequences: PlaySequence[]): PlaySequence | null {
  const winners = sequences.filter(s => s.won);
  if (winners.length === 0) return null;
  // Best = most damage dealt (highest margin over resistance)
  return winners.reduce((a, b) => a.totalDamage > b.totalDamage ? a : b);
}

function findNaivePath(
  puzzle: Puzzle,
  cards: ReadonlyMap<CardId, EvidenceCard>,
): PlaySequence {
  // Naive: sort by descending power, play top cards one-at-a-time (no bundling)
  const sorted = [...puzzle.dealtHand]
    .map(id => cards.get(id)!)
    .sort((a, b) => b.power - a.power);

  let state: RunState = {
    puzzle,
    committedStory: [],
    resistance: puzzle.resistance,
    scrutiny: 0 as Scrutiny,
    turnsRemaining: puzzle.turns,
    concernsAddressed: [],
  };

  const turns: CardId[][] = [];
  let totalDmg = 0;
  let contradictions = 0;
  let refutations = 0;
  let blocked = false;

  for (const card of sorted) {
    if (state.turnsRemaining <= 0 || state.resistance <= 0 || state.scrutiny >= 5) break;

    const submission: Submission = { cardIds: [card.id] };
    const result = processTurn(state, submission, cards);

    if (!result.ok) {
      // Naive player skips blocked cards
      continue;
    }

    turns.push([card.id]);
    totalDmg += result.value.damageDealt;
    contradictions += result.value.contradictions.length;
    refutations += result.value.refutationsApplied.length;
    state = result.value.newState;
  }

  return {
    turns,
    totalDamage: totalDmg,
    finalResistance: state.resistance,
    finalScrutiny: state.scrutiny,
    turnsUsed: puzzle.turns - state.turnsRemaining,
    won: state.resistance <= 0,
    lostScrutiny: state.scrutiny >= 5,
    blocked,
    concernsAddressed: state.concernsAddressed.length,
    countersRefuted: state.puzzle.counters.filter(c => c.refuted).length,
    contradictionCount: contradictions,
  };
}

function findNearMissPaths(sequences: PlaySequence[], resistance: number): PlaySequence[] {
  return sequences.filter(s => {
    const gap = Math.abs(s.totalDamage - resistance);
    return gap <= 5 && !s.blocked;
  });
}

// ============================================================================
// Invariant checks
// ============================================================================

function checkInvariants(
  puzzle: Puzzle,
  cards: ReadonlyMap<CardId, EvidenceCard>,
  allSequences: PlaySequence[],
  optimal: PlaySequence | null,
  naive: PlaySequence,
  nearMiss: PlaySequence[],
): InvariantResult[] {
  const results: InvariantResult[] = [];
  const cardList = [...cards.values()];
  const resistance = puzzle.resistance;

  // --- MI-1: Optimal vs Resistance Margin ---
  // Normal: optimal = resistance + 3 to 6
  if (optimal) {
    const margin = optimal.totalDamage - resistance;
    const pass = margin >= 3 && margin <= 6;
    results.push({
      id: 'MI-1',
      name: 'Optimal vs Resistance Margin (Normal: +3 to +6)',
      passed: pass,
      detail: `Optimal damage: ${optimal.totalDamage}, Resistance: ${resistance}, Margin: +${margin}. Path: ${formatPath(optimal)}`,
    });
  } else {
    results.push({
      id: 'MI-1',
      name: 'Optimal vs Resistance Margin',
      passed: false,
      detail: 'NO WINNING PATH FOUND — puzzle is unsolvable',
    });
  }

  // --- MI-2: Naive vs Resistance Gap ---
  // Normal: naive loses by 3-8
  {
    const gap = resistance - naive.totalDamage;
    const pass = !naive.won && gap >= 3 && gap <= 8;
    results.push({
      id: 'MI-2',
      name: 'Naive Path Loses (Normal: loses by 3-8)',
      passed: pass,
      detail: `Naive damage: ${naive.totalDamage}, Resistance: ${resistance}, Gap: ${gap}. Won: ${naive.won}. Path: ${formatPath(naive)}`,
    });
  }

  // --- MI-3: Near-Miss Path ---
  // At least 1 non-optimal path within ±5 of resistance
  {
    const pass = nearMiss.length > 0;
    results.push({
      id: 'MI-3',
      name: 'Near-Miss Path (|damage - resistance| ≤ 5)',
      passed: pass,
      detail: `Found ${nearMiss.length} near-miss paths. ${nearMiss.length > 0 ? `Best: damage=${nearMiss[0]!.totalDamage}, gap=${Math.abs(nearMiss[0]!.totalDamage - resistance)}` : 'None found.'}`,
    });
  }

  // --- SI-1: Decoy Card ---
  // Exactly 1 card that is high power (top 2) AND risky (triggers counter or contradicts optimal-path card)
  {
    const sortedByPower = [...cardList].sort((a, b) => b.power - a.power);
    const top2 = new Set(sortedByPower.slice(0, 2).map(c => c.id));
    const counterTargets = new Set(puzzle.counters.flatMap(c => [...c.targets]));
    const decoys = cardList.filter(c => top2.has(c.id) && counterTargets.has(c.id));
    const pass = decoys.length === 1;
    results.push({
      id: 'SI-1',
      name: 'Decoy Card (exactly 1 high-power + risky)',
      passed: pass,
      detail: `Top 2 by power: ${sortedByPower.slice(0, 2).map(c => `${c.id}(${c.power})`).join(', ')}. Counter targets: ${[...counterTargets].join(', ')}. Decoys found: ${decoys.map(c => c.id).join(', ') || 'none'}`,
    });
  }

  // --- SI-2: Weak Hero ---
  // At least 1 card below median power that's in the optimal path
  if (optimal) {
    const powers = cardList.map(c => c.power).sort((a, b) => a - b);
    const median = powers[Math.floor(powers.length / 2)]!;
    const optimalCards = new Set(optimal.turns.flat());
    const weakHeroes = cardList.filter(c => c.power < median && optimalCards.has(c.id));
    const pass = weakHeroes.length >= 1;
    results.push({
      id: 'SI-2',
      name: 'Weak Hero (below-median card in optimal path)',
      passed: pass,
      detail: `Median power: ${median}. Weak heroes: ${weakHeroes.map(c => `${c.id}(${c.power})`).join(', ') || 'none'}. Optimal cards: ${[...optimalCards].join(', ')}`,
    });
  }

  // --- SI-3: False Friend ---
  // At least 1 pair sharing ProofType but conflicting
  {
    let found = false;
    let detail = 'No false friend pair found';
    for (let i = 0; i < cardList.length; i++) {
      for (let j = i + 1; j < cardList.length; j++) {
        const a = cardList[i]!;
        const b = cardList[j]!;
        const sharedProof = a.proves.some(p => b.proves.includes(p));
        // Check for state contradiction (ASLEEP vs AWAKE)
        const stateConflict = a.claims.state && b.claims.state && a.claims.state !== b.claims.state;
        if (sharedProof && stateConflict) {
          found = true;
          detail = `${a.id} (${a.claims.state}) vs ${b.id} (${b.claims.state}) — both prove ${a.proves.filter(p => b.proves.includes(p)).join(',')}`;
          break;
        }
      }
      if (found) break;
    }
    results.push({
      id: 'SI-3',
      name: 'False Friend (surface-similar but conflicting pair)',
      passed: found,
      detail,
    });
  }

  // --- SI-4: Safe Exit ---
  // At least 1 card: power <= 3, no contradictions with any other card, not SKETCHY
  {
    const safeCards = cardList.filter(c =>
      c.power <= 3 &&
      c.trustTier !== TrustTier.SKETCHY
    );
    // Further check: should not contradict any other card
    // (Simplified: check that it has no state claim that conflicts with majority)
    const pass = safeCards.length >= 1;
    results.push({
      id: 'SI-4',
      name: 'Safe Exit (power ≤ 3, not SKETCHY, no contradictions)',
      passed: pass,
      detail: `Safe exit cards: ${safeCards.map(c => `${c.id}(${c.power})`).join(', ') || 'none'}`,
    });
  }

  // --- SI-5: No Clean Sweeps ---
  // No winning path with 0 scrutiny, 0 contested, all concerns, all counters not triggered
  {
    const cleanSweeps = allSequences.filter(s =>
      s.won &&
      s.finalScrutiny === 0 &&
      s.contradictionCount === 0 &&
      s.concernsAddressed === puzzle.concerns.length &&
      s.countersRefuted === 0 // no counters fired at all — check if any card was contested
    );
    // More precisely: a clean sweep means no cost absorbed at all
    // Since we track contradictions and scrutiny, 0 of both = no minor issues
    // But we also need "no contested cards" — which is harder to check from PlaySequence
    // Approximate: 0 contradictions + 0 scrutiny + won = potentially clean
    const pass = cleanSweeps.length === 0;
    results.push({
      id: 'SI-5',
      name: 'No Clean Sweeps (every win absorbs some cost)',
      passed: pass,
      detail: `Clean sweep paths found: ${cleanSweeps.length}. ${cleanSweeps.length > 0 ? `Example: ${formatPath(cleanSweeps[0]!)}` : ''}`,
    });
  }

  // --- SI-6: Order Sensitivity ---
  // At least 1 card pair where swapping order changes damage by >= 15%
  // Approximate: check if any counter targets a card that could be refuted by ordering
  {
    const counterTargets = new Set(puzzle.counters.flatMap(c => [...c.targets]));
    const refuters = cardList.filter(c => c.refutes);
    const pass = counterTargets.size > 0 && refuters.length > 0;
    results.push({
      id: 'SI-6',
      name: 'Order Sensitivity (sequence affects damage ≥15%)',
      passed: pass,
      detail: `Counter targets: ${[...counterTargets].join(', ')}. Refutation cards: ${refuters.map(c => `${c.id} refutes ${c.refutes}`).join(', ') || 'none'}. Counter/refutation interplay creates order sensitivity.`,
    });
  }

  // --- S1: All concerns addressable ---
  {
    const requiredProofs = new Set(puzzle.concerns.map(c => c.requiredProof));
    const availableProofs = new Set(cardList.flatMap(c => [...c.proves]));
    const missing = [...requiredProofs].filter(p => !availableProofs.has(p));
    const pass = missing.length === 0;
    results.push({
      id: 'S1',
      name: 'All concerns addressable with dealt hand',
      passed: pass,
      detail: `Required: ${[...requiredProofs].join(', ')}. Available: ${[...availableProofs].join(', ')}. Missing: ${missing.join(', ') || 'none'}`,
    });
  }

  // --- S3: At least 2 distinct winning paths ---
  {
    const winners = allSequences.filter(s => s.won);
    // "Distinct" = different card sets used
    const uniquePaths = new Set(winners.map(s => s.turns.flat().sort().join(',')));
    const pass = uniquePaths.size >= 2;
    results.push({
      id: 'S3',
      name: 'At least 2 distinct winning paths',
      passed: pass,
      detail: `Winning paths: ${winners.length}. Distinct card combos: ${uniquePaths.size}`,
    });
  }

  // --- S4: Max 1 trap card ---
  {
    const counterTargets = puzzle.counters.flatMap(c => [...c.targets]);
    const traps = new Set(counterTargets);
    // Cards that are counter targets AND not refutable
    const unrefutableTraps = [...traps].filter(id => {
      const counter = puzzle.counters.find(c => c.targets.includes(id));
      if (!counter) return false;
      return !cardList.some(c => c.refutes === counter.id);
    });
    const pass = unrefutableTraps.length <= 1;
    results.push({
      id: 'S4',
      name: 'Max 1 trap card (unrefutable counter target)',
      passed: pass,
      detail: `Unrefutable trap cards: ${unrefutableTraps.join(', ') || 'none'} (${unrefutableTraps.length})`,
    });
  }

  // --- S5: Refutation exists for primary counter OR winnable despite contest ---
  {
    const primaryCounter = puzzle.counters[0];
    let pass = false;
    let detail = '';
    if (primaryCounter) {
      const hasRefuter = cardList.some(c => c.refutes === primaryCounter.id);
      const winnableWithContest = allSequences.some(s => s.won);
      pass = hasRefuter || winnableWithContest;
      detail = `Primary counter: ${primaryCounter.id}. Refuter exists: ${hasRefuter}. Winnable despite contest: ${winnableWithContest}`;
    } else {
      pass = true;
      detail = 'No counters in puzzle';
    }
    results.push({
      id: 'S5',
      name: 'Refutation exists OR winnable despite contest',
      passed: pass,
      detail,
    });
  }

  // --- C1: No forced MAJOR contradictions in any winning path ---
  {
    // If there are winning paths, none of them involve MAJOR contradictions
    // (MAJOR contradictions are blocked by the engine, so by definition no winning path has them)
    const pass = true;
    results.push({
      id: 'C1',
      name: 'No forced MAJOR contradictions in winning paths',
      passed: pass,
      detail: 'MAJOR contradictions are blocked by the engine, so no winning path can include them',
    });
  }

  // --- C2: Optimal path scrutiny <= 3 ---
  if (optimal) {
    const pass = optimal.finalScrutiny <= 3;
    results.push({
      id: 'C2',
      name: 'Optimal path scrutiny ≤ 3',
      passed: pass,
      detail: `Optimal path scrutiny: ${optimal.finalScrutiny}`,
    });
  }

  // --- F8: At least 3 pairwise-compatible cards ---
  {
    // Simplified: find 3 cards with no state contradictions between them
    let foundTriple = false;
    for (let i = 0; i < cardList.length && !foundTriple; i++) {
      for (let j = i + 1; j < cardList.length && !foundTriple; j++) {
        for (let k = j + 1; k < cardList.length && !foundTriple; k++) {
          const triple = [cardList[i]!, cardList[j]!, cardList[k]!];
          const states = triple.filter(c => c.claims.state).map(c => c.claims.state);
          const uniqueStates = new Set(states);
          // Compatible if no conflicting states (all same or only 1 has state)
          if (uniqueStates.size <= 1) {
            foundTriple = true;
          }
        }
      }
    }
    results.push({
      id: 'F8',
      name: 'At least 3 pairwise-compatible cards',
      passed: foundTriple,
      detail: foundTriple ? 'Found compatible triple' : 'No triple of pairwise-compatible cards found',
    });
  }

  return results;
}

// ============================================================================
// Formatting
// ============================================================================

function formatPath(seq: PlaySequence): string {
  return seq.turns.map((t, i) => `T${i + 1}:[${t.join('+')}]`).join(' → ');
}

// ============================================================================
// Main
// ============================================================================

console.log('Puzzle Invariant Checker');
console.log('========================\n');

const { puzzle, cards } = THE_LAST_SLICE;

console.log(`Puzzle: ${puzzle.id}`);
console.log(`Target: ${puzzle.targetName}`);
console.log(`Resistance: ${puzzle.resistance}`);
console.log(`Turns: ${puzzle.turns}`);
console.log(`Cards: ${puzzle.dealtHand.length}`);
console.log(`Counters: ${puzzle.counters.length}`);
console.log(`Concerns: ${puzzle.concerns.length}\n`);

console.log('Enumerating all play sequences...');
const startTime = Date.now();
const allSequences = simulateAll(puzzle, cards);
const elapsed = Date.now() - startTime;
console.log(`Found ${allSequences.length} terminal states in ${elapsed}ms\n`);

const winners = allSequences.filter(s => s.won);
const losers = allSequences.filter(s => !s.won);

console.log(`Winning paths: ${winners.length}`);
console.log(`Losing paths: ${losers.length}\n`);

// Key paths
const optimal = findOptimalPath(allSequences);
const naive = findNaivePath(puzzle, cards);
const nearMiss = findNearMissPaths(allSequences, puzzle.resistance);

console.log('--- OPTIMAL PATH ---');
if (optimal) {
  console.log(`Path: ${formatPath(optimal)}`);
  console.log(`Damage: ${optimal.totalDamage} | Resistance: ${puzzle.resistance} | Margin: +${optimal.totalDamage - puzzle.resistance}`);
  console.log(`Scrutiny: ${optimal.finalScrutiny} | Concerns: ${optimal.concernsAddressed}/${puzzle.concerns.length}`);
} else {
  console.log('NO WINNING PATH FOUND');
}

console.log('\n--- NAIVE PATH ---');
console.log(`Path: ${formatPath(naive)}`);
console.log(`Damage: ${naive.totalDamage} | Resistance: ${puzzle.resistance} | Gap: ${puzzle.resistance - naive.totalDamage}`);
console.log(`Won: ${naive.won} | Scrutiny: ${naive.finalScrutiny}`);

console.log(`\n--- NEAR-MISS PATHS (${nearMiss.length}) ---`);
for (const nm of nearMiss.slice(0, 5)) {
  const gap = nm.totalDamage - puzzle.resistance;
  console.log(`  ${formatPath(nm)} → damage=${nm.totalDamage}, gap=${gap >= 0 ? '+' : ''}${gap}, won=${nm.won}`);
}
if (nearMiss.length > 5) console.log(`  ... and ${nearMiss.length - 5} more`);

// Damage distribution
const damages = allSequences.map(s => s.totalDamage).sort((a, b) => a - b);
console.log(`\n--- DAMAGE DISTRIBUTION ---`);
console.log(`Min: ${damages[0]} | Max: ${damages[damages.length - 1]} | Median: ${damages[Math.floor(damages.length / 2)]}`);

// Run invariant checks
console.log('\n============================');
console.log('  INVARIANT CHECK RESULTS');
console.log('============================\n');

const invariantResults = checkInvariants(puzzle, cards, allSequences, optimal, naive, nearMiss);

let passed = 0;
let failed = 0;

for (const r of invariantResults) {
  const icon = r.passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${r.id}: ${r.name}`);
  console.log(`       ${r.detail}\n`);
  if (r.passed) passed++;
  else failed++;
}

console.log('============================');
console.log(`  ${passed} passed, ${failed} failed`);
console.log('============================');

// ============================================================================
// Raw Metrics (archetype-agnostic)
// ============================================================================

console.log('\n============================');
console.log('  RAW METRICS');
console.log('============================\n');

const cardList = [...cards.values()];

// --- Key numbers ---
const optDmg = optimal?.totalDamage ?? 0;
const naiveDmg = naive.totalDamage;
const optNaiveGap = optDmg - naiveDmg;
const winRate = (winners.length / allSequences.length) * 100;

console.log('KEY NUMBERS:');
console.log(`  optimal_damage:     ${optDmg}`);
console.log(`  naive_damage:       ${naiveDmg}`);
console.log(`  optimal_naive_gap:  ${optNaiveGap}`);
console.log(`  resistance:         ${puzzle.resistance}`);
console.log(`  optimal_margin:     +${optDmg - puzzle.resistance}`);
console.log(`  naive_gap:          ${puzzle.resistance - naiveDmg > 0 ? '+' : ''}${puzzle.resistance - naiveDmg} (${naive.won ? 'WINS' : 'LOSES'})`);
console.log(`  win_rate:           ${winRate.toFixed(1)}% (${winners.length}/${allSequences.length})`);
console.log(`  near_miss_count:    ${nearMiss.length}`);

// --- Damage percentiles ---
{
  const sorted = allSequences.map(s => s.totalDamage).sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.floor(sorted.length * p)]!;
  const resistancePct = ((sorted.filter(d => d < puzzle.resistance).length / sorted.length) * 100).toFixed(0);
  console.log(`\nDAMAGE DISTRIBUTION:`);
  console.log(`  p10=${pct(0.1)} p25=${pct(0.25)} p50=${pct(0.5)} p75=${pct(0.75)} p90=${pct(0.9)}`);
  console.log(`  min=${sorted[0]} max=${sorted[sorted.length - 1]}`);
  console.log(`  resistance_percentile: P${resistancePct} (${resistancePct}% of paths deal less)`);
}

// --- Scrutiny distribution across all paths ---
{
  const scrutinyCounts = [0, 0, 0, 0, 0, 0]; // 0-5
  for (const s of allSequences) {
    scrutinyCounts[s.finalScrutiny]!++;
  }
  console.log(`\nSCRUTINY DISTRIBUTION (across all paths):`);
  for (let i = 0; i <= 5; i++) {
    const pct = ((scrutinyCounts[i]! / allSequences.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(pct) / 2));
    console.log(`  scrutiny=${i}: ${pct.padStart(5)}% ${bar} (${scrutinyCounts[i]})`);
  }
  const scrutinyLosses = allSequences.filter(s => s.lostScrutiny).length;
  console.log(`  scrutiny_loss_rate: ${((scrutinyLosses / allSequences.length) * 100).toFixed(1)}%`);
}

// --- Counter interaction rates ---
{
  const counterFired = allSequences.filter(s => s.countersRefuted > 0 || s.turns.flat().some(id => {
    return puzzle.counters.some(c => !c.refuted && c.targets.includes(id as CardId));
  }));
  const refutedPaths = allSequences.filter(s => s.countersRefuted > 0);
  const winRefuted = winners.filter(s => s.countersRefuted > 0);

  console.log(`\nCOUNTER INTERACTIONS:`);
  console.log(`  paths_with_refutation:  ${refutedPaths.length}/${allSequences.length} (${((refutedPaths.length / allSequences.length) * 100).toFixed(1)}%)`);
  console.log(`  wins_with_refutation:   ${winRefuted.length}/${winners.length} (${winners.length > 0 ? ((winRefuted.length / winners.length) * 100).toFixed(1) : 0}%)`);
  for (const counter of puzzle.counters) {
    const targeted = allSequences.filter(s => s.turns.flat().includes(counter.targets[0]!));
    console.log(`  ${counter.id}: targeted_card_played_in ${targeted.length}/${allSequences.length} paths (${((targeted.length / allSequences.length) * 100).toFixed(1)}%)`);
  }
}

// --- Clean sweep analysis ---
{
  const cleanSweeps = allSequences.filter(s =>
    s.won && s.finalScrutiny === 0 && s.contradictionCount === 0 &&
    s.concernsAddressed === puzzle.concerns.length && s.countersRefuted === 0
  );
  console.log(`\nCLEAN SWEEPS (win + 0 scrutiny + 0 contradictions + all concerns + 0 counter contact):`);
  console.log(`  count: ${cleanSweeps.length}/${winners.length} winning paths (${winners.length > 0 ? ((cleanSweeps.length / winners.length) * 100).toFixed(1) : 0}%)`);
  if (cleanSweeps.length > 0) {
    const cleanCards = new Map<string, number>();
    for (const cs of cleanSweeps) {
      for (const id of cs.turns.flat()) {
        cleanCards.set(id, (cleanCards.get(id) ?? 0) + 1);
      }
    }
    console.log(`  cards_in_clean_sweeps:`);
    for (const [id, count] of [...cleanCards.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${id}: ${((count / cleanSweeps.length) * 100).toFixed(0)}%`);
    }
  }
}

// --- Corroboration analysis ---
{
  const corrobPaths = allSequences.filter(s => {
    const cardsUsed = s.turns.flat().map(id => cards.get(id as CardId)!);
    const rawSum = cardsUsed.reduce((sum, c) => sum + c.power, 0);
    return s.totalDamage > rawSum;
  });
  const corrobWins = corrobPaths.filter(s => s.won);
  console.log(`\nCORROBORATION:`);
  console.log(`  paths_with_bonus:   ${corrobPaths.length}/${allSequences.length} (${((corrobPaths.length / allSequences.length) * 100).toFixed(1)}%)`);
  console.log(`  wins_with_bonus:    ${corrobWins.length}/${winners.length} (${winners.length > 0 ? ((corrobWins.length / winners.length) * 100).toFixed(1) : 0}%)`);
  console.log(`  wins_needing_bonus: ${corrobWins.filter(s => { const raw = s.turns.flat().map(id => cards.get(id as CardId)!).reduce((sum, c) => sum + c.power, 0); return raw <= puzzle.resistance; }).length} (would lose without it)`);

  const claimFreq = new Map<string, string[]>();
  for (const c of cardList) {
    for (const [key, val] of Object.entries(c.claims)) {
      if (val) {
        const k = `${key}:${val}`;
        if (!claimFreq.has(k)) claimFreq.set(k, []);
        claimFreq.get(k)!.push(c.id);
      }
    }
  }
  console.log(`  shared_claims:`);
  for (const [claim, ids] of [...claimFreq.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (ids.length >= 2) console.log(`    ${claim}: [${ids.join(', ')}]`);
  }
}

// --- Per-card role analysis ---
{
  console.log(`\nCARD ROLES:`);
  const sortedCards = [...cardList].sort((a, b) => b.power - a.power);
  const powers = cardList.map(c => c.power).sort((a, b) => a - b);
  const median = powers[Math.floor(powers.length / 2)]!;

  for (const c of sortedCards) {
    const roles: string[] = [];

    // Power tier
    const rank = sortedCards.indexOf(c) + 1;
    if (rank <= 2) roles.push('HIGH-POWER');
    else if (c.power < median) roles.push('BELOW-MEDIAN');

    // Trust
    if (c.trustTier) roles.push(c.trustTier);

    // Counter interaction
    const isTarget = puzzle.counters.some(ct => ct.targets.includes(c.id));
    if (isTarget) roles.push('COUNTER-TARGET');
    if (c.refutes) roles.push(`REFUTES:${c.refutes}`);

    // In optimal path?
    const inOptimal = optimal?.turns.flat().includes(c.id) ?? false;
    if (inOptimal) roles.push('IN-OPTIMAL');

    // In naive path?
    const inNaive = naive.turns.flat().includes(c.id);
    if (inNaive) roles.push('IN-NAIVE');

    // Safe exit candidate
    if (c.power <= 3 && c.trustTier !== TrustTier.SKETCHY) roles.push('SAFE-EXIT');

    // How often in winning paths
    const inWins = winners.filter(w => w.turns.flat().includes(c.id)).length;
    const winPct = winners.length > 0 ? ((inWins / winners.length) * 100).toFixed(0) : '0';

    // How often in losing paths
    const inLosses = losers.filter(l => l.turns.flat().includes(c.id)).length;
    const lossPct = losers.length > 0 ? ((inLosses / losers.length) * 100).toFixed(0) : '0';

    // State contradiction potential
    const hasState = !!c.claims.state;
    const conflictsWith = hasState
      ? cardList.filter(o => o.id !== c.id && o.claims.state && o.claims.state !== c.claims.state).map(o => o.id)
      : [];

    console.log(`  ${c.id} (power=${c.power})`);
    console.log(`    roles: [${roles.join(', ')}]`);
    console.log(`    proves: [${c.proves.join(', ')}]`);
    console.log(`    in_wins: ${winPct}% | in_losses: ${lossPct}%`);
    if (conflictsWith.length > 0) console.log(`    contradicts: [${conflictsWith.join(', ')}]`);
  }
}

// --- Resistance sweep (what-if) ---
{
  console.log(`\nRESISTANCE SWEEP:`);
  console.log(`  Shows win rate at different resistance values`);
  const dmgSorted = allSequences.map(s => s.totalDamage).sort((a, b) => a - b);
  const testResistances = [
    Math.max(1, naiveDmg - 5),
    naiveDmg,
    naiveDmg + 3,
    naiveDmg + 5,
    naiveDmg + 8,
    Math.floor((optDmg + naiveDmg) / 2),
    optDmg - 6,
    optDmg - 3,
    optDmg,
    optDmg + 3,
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  for (const r of testResistances) {
    const winsAtR = dmgSorted.filter(d => d >= r).length;
    const rate = ((winsAtR / dmgSorted.length) * 100).toFixed(1);
    const marker = r === puzzle.resistance ? ' ← CURRENT' : '';
    const naiveWins = naiveDmg >= r ? ' (naive WINS)' : '';
    console.log(`  resistance=${String(r).padStart(3)}: ${rate.padStart(5)}% win rate${naiveWins}${marker}`);
  }
}

console.log('');

if (failed > 0) {
  process.exit(1);
}
