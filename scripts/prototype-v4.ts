#!/usr/bin/env npx tsx
/**
 * V4 Pair Play — Prototype Checker / Validator
 *
 * Enumerates all possible play sequences for each puzzle:
 *   - Choose 2 cards to leave out: C(8,2) = 28
 *   - Partition remaining 6 into 3 pairs: 15 ways
 *   - Order the 3 pairs: 3! = 6
 *   Total: 28 × 15 × 6 = 2520 play sequences
 *
 * With PRESSURE SYSTEM, pair order now affects scoring through:
 *   - HIGH STRENGTH: -1 if previous pair > 10 combined strength
 *   - TYPE ECHO: -1 per card if type was played in previous turns
 *   - LOCATION CHAIN: -1 if continuing a location cluster
 *
 * With THE OBJECTION after T2:
 *   - KOA challenges highest-strength played card
 *   - Stand By: +2 if truth, -3 if lie
 *   - Withdraw: -2 regardless
 *
 * Validates balance invariants adapted for V4 pair play.
 *
 * Usage: npx tsx scripts/prototype-v4.ts
 */

import type { Card, ComboResult, PairResult, V4Puzzle, StanceConfig, PressureState } from './v4-types.js';
import { STANCES } from './v4-types.js';
import { ALL_V4_PUZZLES } from './v4-puzzles.js';

// ============================================================================
// Mode Flags
// ============================================================================

const trainingMode = process.argv.includes('--training');
const noPressure = trainingMode || process.argv.includes('--no-pressure');
const noObjection = trainingMode || process.argv.includes('--no-objection');
const compareMode = process.argv.includes('--compare'); // Show both training and full stats

// ============================================================================
// Combinatorics
// ============================================================================

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first!, ...c]),
    ...combinations(rest, k),
  ];
}

/** Partition an array of cards into pairs. Returns all possible pair partitions. */
function partitionIntoPairs(cards: Card[]): [Card, Card][][] {
  if (cards.length === 0) return [[]];
  if (cards.length === 2) return [[[cards[0]!, cards[1]!]]];
  const first = cards[0]!;
  const rest = cards.slice(1);
  const result: [Card, Card][][] = [];
  for (let i = 0; i < rest.length; i++) {
    const remaining = rest.filter((_, j) => j !== i);
    for (const sub of partitionIntoPairs(remaining)) {
      result.push([[first, rest[i]!], ...sub]);
    }
  }
  return result;
}

/** Generate all permutations of an array */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i]!, ...perm]);
    }
  }
  return result;
}

// ============================================================================
// Pressure System
// ============================================================================

function initPressure(): PressureState {
  return {
    previousPairStrength: 0,
    typesPlayedBefore: new Set(),
    lastPairLocation: null,
  };
}

function calculatePressurePenalty(pair: [Card, Card], pressure: PressureState): number {
  let penalty = 0;
  const [a, b] = pair;

  // HIGH STRENGTH: previous pair > 10 strength
  if (pressure.previousPairStrength > 10) {
    penalty -= 1;
  }

  // TYPE ECHO: playing a type you've played in a PREVIOUS turn
  if (pressure.typesPlayedBefore.has(a.evidenceType)) {
    penalty -= 1;
  }
  if (pressure.typesPlayedBefore.has(b.evidenceType)) {
    penalty -= 1;
  }

  // SAME-LOCATION CHAIN: previous pair clustered, this pair continues
  if (pressure.lastPairLocation) {
    if (a.location === pressure.lastPairLocation || b.location === pressure.lastPairLocation) {
      penalty -= 1;
    }
  }

  return penalty;
}

function updatePressure(pair: [Card, Card], oldPressure: PressureState): PressureState {
  const [a, b] = pair;
  const newTypesPlayed = new Set(oldPressure.typesPlayedBefore);
  newTypesPlayed.add(a.evidenceType);
  newTypesPlayed.add(b.evidenceType);

  return {
    previousPairStrength: a.strength + b.strength,
    typesPlayedBefore: newTypesPlayed,
    lastPairLocation: a.location === b.location ? a.location : null,
  };
}

// ============================================================================
// Combo Scoring (mirrors play-v4.ts, uses stance)
// ============================================================================

function getCombos(a: Card, b: Card, stance: StanceConfig): ComboResult[] {
  const combos: ComboResult[] = [];
  if (a.location === b.location && stance.corroboration > 0) {
    combos.push({ name: 'Corroboration', bonus: stance.corroboration, description: `Same location: ${a.location}` });
  }
  const timeToMinutes = (t: string): number => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let h = parseInt(match[1]!);
    const m = parseInt(match[2]!);
    const ampm = match[3]!.toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };
  const diff = Math.abs(timeToMinutes(a.time) - timeToMinutes(b.time));
  if (diff > 0 && diff <= 90 && stance.timeline > 0) {
    combos.push({ name: 'Timeline', bonus: stance.timeline, description: `Adjacent times: ${a.time} & ${b.time}` });
  }
  if (a.evidenceType !== b.evidenceType && stance.coverage > 0) {
    combos.push({ name: 'Coverage', bonus: stance.coverage, description: `Different types: ${a.evidenceType} + ${b.evidenceType}` });
  }
  if (a.evidenceType === b.evidenceType && stance.reinforcement > 0) {
    combos.push({ name: 'Reinforcement', bonus: stance.reinforcement, description: `Same type: ${a.evidenceType}` });
  }
  return combos;
}

function scorePair(a: Card, b: Card, stance: StanceConfig, pressurePenalty: number = 0): PairResult {
  const aScore = a.isLie ? -(a.strength - 1) : a.strength;
  const bScore = b.isLie ? -(b.strength - 1) : b.strength;
  const baseScore = aScore + bScore;
  const bothTruth = !a.isLie && !b.isLie;
  const combos = bothTruth ? getCombos(a, b, stance) : [];
  const comboTotal = combos.reduce((s, c) => s + c.bonus, 0);
  return {
    cards: [a, b],
    baseScore,
    combos,
    comboTotal,
    totalScore: baseScore + comboTotal + pressurePenalty,
    liesInPair: (a.isLie ? 1 : 0) + (b.isLie ? 1 : 0),
  };
}

// ============================================================================
// Play Sequence Types
// ============================================================================

interface PlaySequence {
  pairs: [Card, Card][];
  pairResults: PairResult[];
  totalScore: number;           // Before objection
  scoreWithObjection: number;   // After optimal objection choice
  objectionCard: Card | null;   // Card challenged by KOA
  objectionChoice: 'stand_by' | 'withdraw';  // Optimal choice
  objectionDelta: number;       // Score change from objection
  liesPlayed: number;
  leftOut: Card[];
  liesDodged: number;
  pressurePenalties: number[];  // Penalty applied each turn
  orderMatters: boolean;        // True if this ordering differs from others
}

// ============================================================================
// The Objection Logic
// ============================================================================

function calculateObjection(playedCards: Card[]): { card: Card; standByDelta: number; withdrawDelta: number; optimalChoice: 'stand_by' | 'withdraw'; optimalDelta: number } {
  // Challenge the highest-strength card played after T2 (first 4 cards)
  const t1t2Cards = playedCards.slice(0, 4);
  const sortedByStrength = [...t1t2Cards].sort((a, b) => b.strength - a.strength);
  const challengedCard = sortedByStrength[0]!;

  const standByDelta = challengedCard.isLie ? -3 : +2;
  const withdrawDelta = -2;

  // Optimal choice: stand by if truth, withdraw if lie
  const optimalChoice = challengedCard.isLie ? 'withdraw' : 'stand_by';
  const optimalDelta = challengedCard.isLie ? withdrawDelta : standByDelta;

  return { card: challengedCard, standByDelta, withdrawDelta, optimalChoice, optimalDelta };
}

// ============================================================================
// Enumeration (with pressure and objection)
// ============================================================================

interface EnumerationConfig {
  usePressure: boolean;
  useObjection: boolean;
}

function enumerateAll(puzzle: V4Puzzle, config: EnumerationConfig = { usePressure: true, useObjection: true }): PlaySequence[] {
  const cards = [...puzzle.cards];
  const stance = STANCES[puzzle.stance];
  const results: PlaySequence[] = [];

  // Choose 2 cards to leave out: C(8,2) = 28
  const leaveOuts = combinations(cards, 2);

  for (const leftOut of leaveOuts) {
    const leftOutIds = new Set(leftOut.map(c => c.id));
    const played = cards.filter(c => !leftOutIds.has(c.id));

    // Partition 6 cards into 3 pairs: 15 ways
    const partitions = partitionIntoPairs(played);

    for (const pairing of partitions) {
      // Order the 3 pairs: 3! = 6 ways (order matters due to pressure)
      // If pressure disabled, only need 1 ordering per pairing
      const orderings = config.usePressure ? permutations(pairing) : [pairing];

      for (const pairs of orderings) {
        let pressure = initPressure();
        const pairResults: PairResult[] = [];
        const pressurePenalties: number[] = [];

        // Score each pair in order with pressure
        for (const pair of pairs) {
          const penalty = config.usePressure ? calculatePressurePenalty(pair, pressure) : 0;
          pressurePenalties.push(penalty);
          const result = scorePair(pair[0], pair[1], stance, penalty);
          pairResults.push(result);
          pressure = updatePressure(pair, pressure);
        }

        const totalScore = pairResults.reduce((s, pr) => s + pr.totalScore, 0);
        const liesPlayed = pairResults.reduce((s, pr) => s + pr.liesInPair, 0);
        const liesDodged = leftOut.filter(c => c.isLie).length;

        // The Objection after T2 (if enabled)
        const playedFlat = pairs.flat();
        const objection = calculateObjection(playedFlat);
        const objectionDelta = config.useObjection ? objection.optimalDelta : 0;

        results.push({
          pairs,
          pairResults,
          totalScore,
          scoreWithObjection: totalScore + objectionDelta,
          objectionCard: config.useObjection ? objection.card : null,
          objectionChoice: objection.optimalChoice,
          objectionDelta,
          liesPlayed,
          leftOut,
          liesDodged,
          pressurePenalties,
          orderMatters: false, // Will be set later
        });
      }
    }
  }

  // Mark sequences where ordering matters (different scores for same pairing)
  if (config.usePressure) {
    const byPairingKey = new Map<string, PlaySequence[]>();
    for (const seq of results) {
      // Key by left-out + unordered pairing
      const pairingKey = seq.leftOut.map(c => c.id).sort().join('+') + '|' +
        seq.pairs.map(([a, b]) => [a.id, b.id].sort().join(',')).sort().join(';');
      if (!byPairingKey.has(pairingKey)) byPairingKey.set(pairingKey, []);
      byPairingKey.get(pairingKey)!.push(seq);
    }
    for (const [_, seqs] of byPairingKey) {
      const scores = new Set(seqs.map(s => s.scoreWithObjection));
      if (scores.size > 1) {
        for (const s of seqs) s.orderMatters = true;
      }
    }
  }

  return results;
}

// ============================================================================
// Tier
// ============================================================================

type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

function getTier(score: number, target: number): Tier {
  if (score >= target + 5) return 'FLAWLESS';
  if (score >= target) return 'CLEARED';
  if (score >= target - 3) return 'CLOSE';
  return 'BUSTED';
}

// ============================================================================
// Analysis
// ============================================================================

function runAnalysis(puzzle: V4Puzzle) {
  console.log('V4 Pair Play — Prototype Checker (with Pressure + Objection)');
  console.log('═'.repeat(65) + '\n');

  const stance = STANCES[puzzle.stance];
  console.log(`Puzzle: ${puzzle.name}`);
  console.log(`Target: ${puzzle.target} | Cards: ${puzzle.cards.length} | Lies: ${puzzle.cards.filter(c => c.isLie).length}`);
  console.log(`Stance: ${puzzle.stance} (reinf:${stance.reinforcement} cov:${stance.coverage} corr:${stance.corroboration} time:${stance.timeline})`);
  console.log(`Hint: ${puzzle.hint}\n`);

  console.log('CARDS:');
  for (const c of puzzle.cards) {
    const lie = c.isLie ? ' [LIE]' : '';
    console.log(`  ${c.id.padEnd(22)} str:${c.strength} type:${c.evidenceType.padEnd(10)} loc:${c.location.padEnd(12)} time:${c.time}${lie}`);
  }

  const config = { usePressure: !noPressure, useObjection: !noObjection };
  const expectedCount = config.usePressure ? 2520 : 420;
  const modeDesc = noPressure && noObjection ? 'TRAINING' :
    noPressure ? 'NO PRESSURE' :
    noObjection ? 'NO OBJECTION' : 'FULL';

  console.log(`\nMode: ${modeDesc} (pressure: ${config.usePressure ? 'ON' : 'OFF'}, objection: ${config.useObjection ? 'ON' : 'OFF'})`);
  console.log(`Enumerating all play sequences (28 leave-outs × 15 pairings${config.usePressure ? ' × 6 orderings' : ''} = ${expectedCount})...`);
  const start = Date.now();
  const all = enumerateAll(puzzle, config);
  const elapsed = Date.now() - start;
  console.log(`Found ${all.length} sequences in ${elapsed}ms`);

  // Unique scores (with objection)
  const uniqueScores = new Set(all.map(s => s.scoreWithObjection));
  console.log(`Unique score outcomes: ${uniqueScores.size}\n`);

  // Tier distribution (using scoreWithObjection = optimal objection choice)
  const tiers: Record<Tier, number> = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const seq of all) tiers[getTier(seq.scoreWithObjection, puzzle.target)]++;

  const wins = all.filter(s => getTier(s.scoreWithObjection, puzzle.target) === 'FLAWLESS' || getTier(s.scoreWithObjection, puzzle.target) === 'CLEARED');
  const flawless = all.filter(s => getTier(s.scoreWithObjection, puzzle.target) === 'FLAWLESS');
  const close = all.filter(s => getTier(s.scoreWithObjection, puzzle.target) === 'CLOSE');
  const busted = all.filter(s => getTier(s.scoreWithObjection, puzzle.target) === 'BUSTED');

  const winRate = (wins.length / all.length) * 100;
  const flawlessRate = (flawless.length / all.length) * 100;

  console.log('=== TIER DISTRIBUTION (with optimal objection) ===');
  console.log(`FLAWLESS:  ${flawless.length} (${flawlessRate.toFixed(1)}%)`);
  console.log(`CLEARED:   ${tiers.CLEARED} (${((tiers.CLEARED / all.length) * 100).toFixed(1)}%)`);
  console.log(`CLOSE:     ${close.length} (${((close.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`BUSTED:    ${busted.length} (${((busted.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`Win rate:  ${winRate.toFixed(1)}% (FLAWLESS + CLEARED)`);

  // Score distribution
  const scores = all.map(s => s.scoreWithObjection).sort((a, b) => a - b);
  const pct = (p: number) => scores[Math.floor(scores.length * p)]!;
  console.log('\n=== SCORE DISTRIBUTION (with objection) ===');
  console.log(`  min=${scores[0]} p25=${pct(0.25)} p50=${pct(0.5)} p75=${pct(0.75)} max=${scores[scores.length - 1]}`);

  // Pressure statistics
  const orderMattersCount = all.filter(s => s.orderMatters).length;
  const totalPressure = all.reduce((s, seq) => s + seq.pressurePenalties.reduce((a, b) => a + b, 0), 0);
  const avgPressure = totalPressure / all.length;
  console.log('\n=== PRESSURE STATISTICS ===');
  console.log(`Order matters: ${orderMattersCount}/${all.length} (${((orderMattersCount / all.length) * 100).toFixed(1)}%)`);
  console.log(`Avg pressure penalty: ${avgPressure.toFixed(2)} per game`);

  // Objection statistics
  const objectionStandByCount = all.filter(s => s.objectionChoice === 'stand_by').length;
  const objectionWithdrawCount = all.filter(s => s.objectionChoice === 'withdraw').length;
  console.log('\n=== OBJECTION STATISTICS ===');
  console.log(`Optimal stand-by: ${objectionStandByCount} (${((objectionStandByCount / all.length) * 100).toFixed(1)}%)`);
  console.log(`Optimal withdraw: ${objectionWithdrawCount} (${((objectionWithdrawCount / all.length) * 100).toFixed(1)}%)`);

  // Lies played distribution
  const liesCounts: Record<number, number> = {};
  for (const seq of all) liesCounts[seq.liesPlayed] = (liesCounts[seq.liesPlayed] || 0) + 1;
  console.log('\n=== LIES PLAYED ===');
  for (const [n, count] of Object.entries(liesCounts).sort((a, b) => +a[0] - +b[0])) {
    console.log(`  ${n} lies: ${count} (${((count / all.length) * 100).toFixed(1)}%)`);
  }

  // Card frequency in wins
  console.log('\n=== CARD FREQUENCY IN WINS ===');
  for (const c of puzzle.cards) {
    const inWins = wins.filter(w => w.pairs.flat().some(pc => pc.id === c.id)).length;
    const pctInWins = wins.length > 0 ? ((inWins / wins.length) * 100).toFixed(0) : '0';
    const lie = c.isLie ? ' [LIE]' : '';
    console.log(`  ${c.id.padEnd(22)} ${pctInWins.padStart(3)}% of wins${lie}`);
  }

  // Best and worst sequences (by scoreWithObjection)
  const sorted = [...all].sort((a, b) => b.scoreWithObjection - a.scoreWithObjection);
  const best = sorted[0]!;
  const worst = sorted[sorted.length - 1]!;

  console.log('\n=== BEST SEQUENCE ===');
  console.log(`  Score: ${best.scoreWithObjection}${config.useObjection ? ` (${best.totalScore} before objection)` : ''} | Tier: ${getTier(best.scoreWithObjection, puzzle.target)} | Lies played: ${best.liesPlayed}`);
  console.log(`  Left out: ${best.leftOut.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(', ')}`);
  for (let i = 0; i < best.pairResults.length; i++) {
    const pr = best.pairResults[i]!;
    const [a, b] = pr.cards;
    const comboStr = pr.combos.length > 0 ? ` + ${pr.combos.map(c => `${c.name}(+${c.bonus})`).join(' + ')}` : '';
    const pressureStr = best.pressurePenalties[i]! < 0 ? ` [pressure: ${best.pressurePenalties[i]}]` : '';
    console.log(`  T${i + 1}: [${a.id}](${a.isLie ? 'L' : 'T'}) + [${b.id}](${b.isLie ? 'L' : 'T'}) → ${pr.totalScore}${comboStr}${pressureStr}`);
  }
  if (best.objectionCard) {
    console.log(`  Objection: [${best.objectionCard.id}] → ${best.objectionChoice} (${best.objectionDelta > 0 ? '+' : ''}${best.objectionDelta})`);
  }

  console.log('\n=== WORST SEQUENCE ===');
  console.log(`  Score: ${worst.scoreWithObjection}${config.useObjection ? ` (${worst.totalScore} before objection)` : ''} | Tier: ${getTier(worst.scoreWithObjection, puzzle.target)} | Lies played: ${worst.liesPlayed}`);
  console.log(`  Left out: ${worst.leftOut.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(', ')}`);
  for (let i = 0; i < worst.pairResults.length; i++) {
    const pr = worst.pairResults[i]!;
    const [a, b] = pr.cards;
    const comboStr = pr.combos.length > 0 ? ` + ${pr.combos.map(c => `${c.name}(+${c.bonus})`).join(' + ')}` : '';
    const pressureStr = worst.pressurePenalties[i]! < 0 ? ` [pressure: ${worst.pressurePenalties[i]}]` : '';
    console.log(`  T${i + 1}: [${a.id}](${a.isLie ? 'L' : 'T'}) + [${b.id}](${b.isLie ? 'L' : 'T'}) → ${pr.totalScore}${comboStr}${pressureStr}`);
  }
  if (worst.objectionCard) {
    console.log(`  Objection: [${worst.objectionCard.id}] → ${worst.objectionChoice} (${worst.objectionDelta > 0 ? '+' : ''}${worst.objectionDelta})`);
  }

  // ============================================================================
  // INVARIANT CHECKS
  // ============================================================================

  console.log('\n=== INVARIANT CHECKS ===\n');

  const truths = puzzle.cards.filter(c => !c.isLie);
  const lies = puzzle.cards.filter(c => c.isLie);
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  const check = (id: string, label: string, passed: boolean, detail: string, isWarn = false) => {
    const status = passed ? 'PASS' : (isWarn ? 'WARN' : 'FAIL');
    console.log(`${id.padEnd(5)} ${label.padEnd(36)} ${status} ${detail}`);
    if (passed) passCount++;
    else if (isWarn) warnCount++;
    else failCount++;
  };

  // --- Structural checks ---

  check('I1', 'Exactly 8 cards', puzzle.cards.length === 8, `(${puzzle.cards.length} cards)`);
  check('I2', 'Exactly 3 lies', lies.length === 3, `(${lies.length} lies)`);
  // Sequence count depends on whether pressure is enabled
  check('I3', `Sequence count (${expectedCount})`, all.length === expectedCount, `(${all.length})`);

  // All strengths unique 1-8
  const strengths = puzzle.cards.map(c => c.strength).sort((a, b) => a - b);
  check('I4', 'Strengths are [1,2,3,4,5,6,7,8]', strengths.join(',') === '1,2,3,4,5,6,7,8', `(${strengths.join(',')})`);

  // Evidence types: 2 of each
  const typeCounts: Record<string, number> = {};
  for (const c of puzzle.cards) typeCounts[c.evidenceType] = (typeCounts[c.evidenceType] || 0) + 1;
  const typeDistOk = Object.values(typeCounts).every(v => v === 2) && Object.keys(typeCounts).length === 4;
  check('I5', 'Evidence types: 2 of each (4 types)', typeDistOk, `(${Object.entries(typeCounts).map(([k, v]) => `${k}:${v}`).join(', ')})`);

  // --- Winnability checks ---

  // Best possible score clears target (with objection)
  check('I6', 'Best play clears target', best.scoreWithObjection >= puzzle.target, `(best=${best.scoreWithObjection} vs target=${puzzle.target})`);

  // Best play reaches FLAWLESS
  check('I7', 'Best play reaches FLAWLESS', best.scoreWithObjection >= puzzle.target + 5, `(best=${best.scoreWithObjection} vs flawless=${puzzle.target + 5})`);

  // --- Pairing/Ordering matters ---

  // Different pairings/orderings of the same 6 cards produce different scores
  // Group by left-out pair, check score variance within each group
  const byLeftOut = new Map<string, number[]>();
  for (const seq of all) {
    const key = seq.leftOut.map(c => c.id).sort().join('+');
    if (!byLeftOut.has(key)) byLeftOut.set(key, []);
    byLeftOut.get(key)!.push(seq.scoreWithObjection);
  }
  let pairingVariance = 0;
  for (const [_, leaveScores] of byLeftOut) {
    const unique = new Set(leaveScores);
    if (unique.size > 1) pairingVariance++;
  }
  check('I9', 'Pairing/order matters (score variance)', pairingVariance >= byLeftOut.size * 0.5, `(${pairingVariance}/${byLeftOut.size} leave-outs have variance)`);

  // Order specifically matters (not just pairing) — only check if pressure is enabled
  if (config.usePressure) {
    const orderMattersRate = (orderMattersCount / all.length) * 100;
    check('I9b', 'Order matters (≥30% of sequences)', orderMattersRate >= 30, `(${orderMattersRate.toFixed(1)}%)`);
  }

  // Not always safe: even dodging 2 lies (best leave-out), bad pairing can still lose
  let alwaysWinLeaveOuts = 0;
  for (const [_, leaveOutScores] of byLeftOut) {
    if (leaveOutScores.every(s => s >= puzzle.target)) alwaysWinLeaveOuts++;
  }
  check('I8', 'Not always safe (no auto-win leave-out)', alwaysWinLeaveOuts < byLeftOut.size, `(${alwaysWinLeaveOuts}/${byLeftOut.size} leave-outs always win)`);

  // --- Lie recovery ---

  // With 2 lies played, best score still reachable (CLOSE)
  const twoLiePlays = all.filter(s => s.liesPlayed === 2);
  const twoLieBest = twoLiePlays.length > 0 ? Math.max(...twoLiePlays.map(s => s.scoreWithObjection)) : -Infinity;
  check('I10', 'Lie recoverable (2-lie best ≥ target-3)', twoLieBest >= puzzle.target - 3, `(best 2-lie=${twoLieBest} vs close=${puzzle.target - 3})`);

  // With 3 lies played, not instant KO (can still get some points)
  const threeLiePlays = all.filter(s => s.liesPlayed === 3);
  const threeLieBest = threeLiePlays.length > 0 ? Math.max(...threeLiePlays.map(s => s.scoreWithObjection)) : -Infinity;
  check('I11', '3-lie play not catastrophic (> 0)', threeLieBest > 0, `(best 3-lie=${threeLieBest})`, true);

  // --- Win rate checks ---

  check('I12', 'Win rate 10-50% (random)', winRate >= 10 && winRate <= 50, `(${winRate.toFixed(1)}%)`);
  check('I13', 'FLAWLESS rate 5-30%', flawlessRate >= 5 && flawlessRate <= 30, `(${flawlessRate.toFixed(1)}%)`);

  // --- Lie properties ---

  // All lie strengths differ
  const lieStrs = lies.map(c => c.strength);
  check('I14', 'Lie strengths all differ', new Set(lieStrs).size === 3, `(${lieStrs.join(', ')})`);

  // Lies are tempting: each lie has a same-type or same-location partner (combo bait)
  // In V4, temptation comes from combo potential, not just raw strength
  const avgLie = lies.reduce((s, c) => s + c.strength, 0) / lies.length;
  const avgTruth = truths.reduce((s, c) => s + c.strength, 0) / truths.length;
  const liesWithComboBait = lies.filter(lie =>
    puzzle.cards.some(c => c.id !== lie.id && (c.location === lie.location || c.evidenceType === lie.evidenceType))
  );
  check('I15', 'Lies tempting (combo bait exists)', liesWithComboBait.length === lies.length, `(${liesWithComboBait.length}/${lies.length} lies have combo-eligible partners, avg lie=${avgLie.toFixed(1)} vs avg truth=${avgTruth.toFixed(1)})`);

  // --- Strength-first not oracle ---

  // Playing the 6 strongest cards doesn't guarantee best score
  const byStrength = [...puzzle.cards].sort((a, b) => b.strength - a.strength).slice(0, 6);
  const sfPartitions = partitionIntoPairs(byStrength);
  // For strength-first, try all orderings and pick best with objection
  let sfBest = -Infinity;
  for (const pairing of sfPartitions) {
    for (const ordering of permutations(pairing)) {
      let pressure = initPressure();
      let total = 0;
      const playedCards: Card[] = [];
      for (const pair of ordering) {
        const penalty = calculatePressurePenalty(pair, pressure);
        total += scorePair(pair[0], pair[1], stance, penalty).totalScore;
        pressure = updatePressure(pair, pressure);
        playedCards.push(...pair);
      }
      const objection = calculateObjection(playedCards);
      total += objection.optimalDelta;
      if (total > sfBest) sfBest = total;
    }
  }
  check('I16', 'Strength-first not oracle', sfBest < best.scoreWithObjection, `(strength-first best=${sfBest} vs actual best=${best.scoreWithObjection})`);

  // --- Combo checks ---

  // At least some plays trigger combos
  const playsWithCombos = all.filter(s => s.pairResults.some(pr => pr.combos.length > 0));
  check('I17', 'Combos trigger in ≥20% of plays', (playsWithCombos.length / all.length) >= 0.2, `(${((playsWithCombos.length / all.length) * 100).toFixed(1)}%)`);

  // Combos aren't free — at least some combo-eligible pairs include a lie card
  const comboBlockedPlays = all.filter(s => {
    for (const pr of s.pairResults) {
      const [a, b] = pr.cards;
      if (a.location === b.location || a.evidenceType === b.evidenceType) {
        if (a.isLie || b.isLie) return true; // combo blocked by lie
      }
    }
    return false;
  });
  check('I18', 'Some combos blocked by lies', comboBlockedPlays.length > 0, `(${comboBlockedPlays.length} plays have blocked combos)`);

  // --- Lie containment ---

  // Pairing 2 lies together can score better than spreading lies across pairs
  const containedPlays = all.filter(s => s.pairResults.some(pr => pr.liesInPair === 2));
  const spreadPlays = all.filter(s => s.pairResults.every(pr => pr.liesInPair <= 1) && s.liesPlayed >= 2);
  if (containedPlays.length > 0 && spreadPlays.length > 0) {
    const bestContained = Math.max(...containedPlays.map(s => s.totalScore));
    const bestSpread = Math.max(...spreadPlays.map(s => s.totalScore));
    check('I19', 'Lie containment viable strategy', bestContained >= bestSpread - 3, `(contained best=${bestContained} vs spread best=${bestSpread})`);
  } else {
    check('I19', 'Lie containment viable strategy', false, '(no contained plays found)');
  }

  // --- Content checks ---

  // Pair narrations coverage (28 pairs)
  const pairNarrationCount = Object.keys(puzzle.pairNarrations).length;
  check('I20', 'Pair narrations coverage (28)', pairNarrationCount === 28, `(${pairNarrationCount}/28)`);

  // Reactive hints coverage (28 pairs)
  const reactiveHintCount = Object.keys(puzzle.reactiveHints).length;
  check('I21', 'Reactive hints coverage (28)', reactiveHintCount === 28, `(${reactiveHintCount}/28)`);

  // Verdict quips coverage (8 cards)
  const quipCount = Object.keys(puzzle.verdictQuips).length;
  check('I22', 'Verdict quips coverage (8)', quipCount === 8, `(${quipCount}/8)`);

  // --- Summary ---

  const totalChecks = passCount + failCount;
  console.log(`\nResult: ${passCount}/${totalChecks} checks passed${failCount > 0 ? ` — ${failCount} FAILED` : ''}${warnCount > 0 ? ` (${warnCount} warnings)` : ''}`);

  return { all, wins, winRate, flawlessRate, best, worst, lies, truths };
}

// ============================================================================
// Run All Puzzles
// ============================================================================

for (const puzzle of ALL_V4_PUZZLES) {
  runAnalysis(puzzle);
  console.log('\n');
}
