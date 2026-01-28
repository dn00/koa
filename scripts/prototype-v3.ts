#!/usr/bin/env npx tsx
/**
 * V3 "The Statement" — Prototype Checker / Validator
 *
 * Enumerates all 6×5×4 = 120 play sequences for each puzzle.
 * Validates puzzle constraints and outputs metrics.
 *
 * Usage: npx tsx scripts/prototype-v3.ts
 */

import type { Card, Puzzle, Tier, GameState, TurnResult, ReactiveHint } from './v3-types.js';
import { ALL_PUZZLES } from './v3-puzzles.js';

// ============================================================================
// Types (checker-specific)
// ============================================================================

interface PlaySequence {
  plays: [string, string, string];
  results: TurnResult[];
  finalScore: number;
  liesPlayed: number;
  tier: Tier;
  reactiveHint: string | null;
}

// ============================================================================
// Game Engine
// ============================================================================

function initState(puzzle: Puzzle): GameState {
  return {
    score: 0,
    hand: [...puzzle.cards],
    played: [],
    turnsPlayed: 0,
    activeHint: null,
  };
}

function playCard(cardId: string, state: GameState, puzzle: Puzzle): TurnResult {
  const card = state.hand.find(c => c.id === cardId)!;
  const isLie = card.isLie;
  const delta = isLie ? -card.strength : +card.strength;
  state.score += delta;
  state.hand = state.hand.filter(c => c.id !== cardId);
  state.played.push(card);
  state.turnsPlayed++;

  if (state.turnsPlayed === 1 && puzzle.reactiveHints[cardId]) {
    state.activeHint = puzzle.reactiveHints[cardId]!.text;
  }

  return { card, isLie, delta, score: state.score };
}

function getTier(score: number, target: number, liesPlayed: number): Tier {
  if (liesPlayed === 0 && score >= target) return 'FLAWLESS';
  if (score >= target) return 'CLEARED';
  if (score >= target - 2) return 'CLOSE';
  return 'BUSTED';
}

// ============================================================================
// Brute-Force Enumeration
// ============================================================================

function enumerateAll(puzzle: Puzzle): PlaySequence[] {
  const results: PlaySequence[] = [];
  const cardIds = puzzle.cards.map(c => c.id);

  for (let i = 0; i < cardIds.length; i++) {
    for (let j = 0; j < cardIds.length; j++) {
      if (j === i) continue;
      for (let k = 0; k < cardIds.length; k++) {
        if (k === i || k === j) continue;

        const state = initState(puzzle);
        const turnResults: TurnResult[] = [];

        turnResults.push(playCard(cardIds[i]!, state, puzzle));
        turnResults.push(playCard(cardIds[j]!, state, puzzle));
        turnResults.push(playCard(cardIds[k]!, state, puzzle));

        const liesPlayed = turnResults.filter(r => r.isLie).length;

        results.push({
          plays: [cardIds[i]!, cardIds[j]!, cardIds[k]!],
          results: turnResults,
          finalScore: state.score,
          liesPlayed,
          tier: getTier(state.score, puzzle.target, liesPlayed),
          reactiveHint: state.activeHint,
        });
      }
    }
  }

  return results;
}

// ============================================================================
// Analysis
// ============================================================================

function runAnalysis(puzzle: Puzzle) {
  console.log('V3 "The Statement" — Prototype Checker');
  console.log('=========================================================\n');

  console.log(`Puzzle: ${puzzle.name}`);
  console.log(`Target: ${puzzle.target} | Cards: ${puzzle.cards.length} | Lies: ${puzzle.cards.filter(c => c.isLie).length}`);
  console.log(`Hint: ${puzzle.hint}\n`);

  console.log('CARDS:');
  for (const c of puzzle.cards) {
    const lie = c.isLie ? ' [LIE]' : '';
    console.log(`  ${c.id.padEnd(16)} str:${c.strength} loc:${c.location.padEnd(12)} time:${c.time.padEnd(10)} src:${c.source}${lie}`);
    console.log(`  ${''.padEnd(16)} "${c.claim}"`);
  }

  console.log('\nEnumerating all play sequences...');
  const start = Date.now();
  const all = enumerateAll(puzzle);
  const elapsed = Date.now() - start;
  console.log(`Found ${all.length} sequences in ${elapsed}ms\n`);

  const tiers = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const seq of all) tiers[seq.tier]++;

  const wins = all.filter(s => s.tier === 'FLAWLESS' || s.tier === 'CLEARED');
  const flawless = all.filter(s => s.tier === 'FLAWLESS');
  const close = all.filter(s => s.tier === 'CLOSE');
  const busted = all.filter(s => s.tier === 'BUSTED');

  const winRate = (wins.length / all.length) * 100;
  const flawlessRate = (flawless.length / all.length) * 100;

  console.log('=== TIER DISTRIBUTION ===');
  console.log(`FLAWLESS:  ${flawless.length} (${flawlessRate.toFixed(1)}%)`);
  console.log(`CLEARED:   ${tiers.CLEARED} (${((tiers.CLEARED / all.length) * 100).toFixed(1)}%)`);
  console.log(`CLOSE:     ${close.length} (${((close.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`BUSTED:    ${busted.length} (${((busted.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`Win rate:  ${winRate.toFixed(1)}% (FLAWLESS + CLEARED)`);

  const scores = all.map(s => s.finalScore).sort((a, b) => a - b);
  const pct = (p: number) => scores[Math.floor(scores.length * p)]!;
  console.log('\n=== SCORE DISTRIBUTION ===');
  console.log(`  min=${scores[0]} p25=${pct(0.25)} p50=${pct(0.5)} p75=${pct(0.75)} max=${scores[scores.length - 1]}`);

  const liesCounts = [0, 0, 0];
  for (const seq of all) liesCounts[seq.liesPlayed]!++;
  console.log('\n=== LIES PLAYED ===');
  console.log(`  0 lies: ${liesCounts[0]} (${((liesCounts[0]! / all.length) * 100).toFixed(1)}%) — FLAWLESS candidates`);
  console.log(`  1 lie:  ${liesCounts[1]} (${((liesCounts[1]! / all.length) * 100).toFixed(1)}%)`);
  console.log(`  2 lies: ${liesCounts[2]} (${((liesCounts[2]! / all.length) * 100).toFixed(1)}%)`);

  console.log('\n=== CARD FREQUENCY IN WINS ===');
  for (const c of puzzle.cards) {
    const inWins = wins.filter(w => w.plays.includes(c.id)).length;
    const pctInWins = wins.length > 0 ? ((inWins / wins.length) * 100).toFixed(0) : '0';
    const lie = c.isLie ? ' [LIE]' : '';
    console.log(`  ${c.id.padEnd(16)} ${pctInWins.padStart(3)}% of wins${lie}`);
  }

  console.log('\n=== T1 STRATEGY (reactive hint value) ===');
  for (const c of puzzle.cards) {
    const t1Plays = all.filter(s => s.plays[0] === c.id);
    const t1Wins = t1Plays.filter(s => s.tier === 'FLAWLESS' || s.tier === 'CLEARED');
    const t1WinRate = t1Plays.length > 0 ? ((t1Wins.length / t1Plays.length) * 100).toFixed(1) : 'N/A';
    const hintObj = puzzle.reactiveHints[c.id];
    const hint = hintObj ? hintObj.text : '(no hint)';
    const lie = c.isLie ? ' [LIE]' : '';
    console.log(`  T1:${c.id.padEnd(16)} win rate: ${t1WinRate.padStart(5)}% (${t1Wins.length}/${t1Plays.length})${lie}`);
    console.log(`  ${''.padEnd(20)} hint: ${hint}`);
  }

  const sorted = [...all].sort((a, b) => b.finalScore - a.finalScore);
  console.log('\n=== BEST SEQUENCE ===');
  const best = sorted[0]!;
  console.log(`  ${best.plays.join(' -> ')} | score: ${best.finalScore} | tier: ${best.tier}`);
  for (const r of best.results) {
    console.log(`    ${r.card.id}: ${r.isLie ? 'LIE' : 'TRUTH'} ${r.delta > 0 ? '+' : ''}${r.delta} -> ${r.score}`);
  }

  console.log('\n=== WORST SEQUENCE ===');
  const worst = sorted[sorted.length - 1]!;
  console.log(`  ${worst.plays.join(' -> ')} | score: ${worst.finalScore} | tier: ${worst.tier}`);
  for (const r of worst.results) {
    console.log(`    ${r.card.id}: ${r.isLie ? 'LIE' : 'TRUTH'} ${r.delta > 0 ? '+' : ''}${r.delta} -> ${r.score}`);
  }

  // ============================================================================
  // INVARIANT CHECKS
  // ============================================================================

  console.log('\n=== INVARIANT CHECKS ===');

  const truths = puzzle.cards.filter(c => !c.isLie);
  const lies = puzzle.cards.filter(c => c.isLie);
  const hintIds = new Set(puzzle.hintMatchingIds);
  const hintCards = puzzle.cards.filter(c => hintIds.has(c.id));
  const safeCards = puzzle.cards.filter(c => !hintIds.has(c.id));

  // --- Structural checks ---

  const i1 = lies.length === 2;
  console.log(`I1  Exactly 2 lies:              ${i1 ? 'PASS' : 'FAIL'} (${lies.length} lies)`);

  const i2 = puzzle.cards.length === 6;
  console.log(`I2  Exactly 6 cards:             ${i2 ? 'PASS' : 'FAIL'} (${puzzle.cards.length} cards)`);

  const i3 = all.length === 120;
  console.log(`I3  Sequence count (6P3=120):    ${i3 ? 'PASS' : 'FAIL'} (${all.length})`);

  // --- Hint structure checks (Option C: split lies) ---

  const i4 = hintCards.length >= 2 && hintCards.length <= 4;
  console.log(`I4  Hint matches 2-4 cards:      ${i4 ? 'PASS' : 'FAIL'} (${hintCards.length} matched)`);

  const hintLies = hintCards.filter(c => c.isLie);
  const hintTruths = hintCards.filter(c => !c.isLie);
  const i5 = hintLies.length === 1 && hintTruths.length >= 1;
  console.log(`I5  Hint: 1 lie + ≥1 red herring:${i5 ? ' PASS' : ' FAIL'} (${hintLies.length}L ${hintTruths.length}T)`);

  const outsideLies = safeCards.filter(c => c.isLie);
  const i6 = outsideLies.length === 1;
  console.log(`I6  1 stealth lie outside hint:   ${i6 ? 'PASS' : 'FAIL'} (${outsideLies.length} outside lies)`);

  // --- No safe group (THE key C invariant) ---

  const hintGroupScore = hintCards.reduce((s, c) => s + (c.isLie ? -c.strength : c.strength), 0);
  const nonHintScore = safeCards.reduce((s, c) => s + (c.isLie ? -c.strength : c.strength), 0);

  const i7a = hintGroupScore < puzzle.target;
  console.log(`I7a Hint group score < target:   ${i7a ? 'PASS' : 'FAIL'} (${hintGroupScore} vs ${puzzle.target})`);

  const i7b = nonHintScore < puzzle.target;
  console.log(`I7b Non-hint score < target:     ${i7b ? 'PASS' : 'FAIL'} (${nonHintScore} vs ${puzzle.target})`);

  // --- Winnability checks ---

  const topTruths = [...truths].sort((a, b) => b.strength - a.strength).slice(0, 3);
  const maxTruthScore = topTruths.reduce((s, c) => s + c.strength, 0);
  const i8 = maxTruthScore >= puzzle.target;
  console.log(`I8  Winnable (top3 truths):      ${i8 ? 'PASS' : 'FAIL'} (${maxTruthScore} vs target ${puzzle.target})`);

  const avgLie = lies.reduce((s, c) => s + c.strength, 0) / lies.length;
  const avgTruth = truths.reduce((s, c) => s + c.strength, 0) / truths.length;
  const i9 = avgLie > avgTruth;
  console.log(`I9  Lies are tempting (avg):     ${i9 ? 'PASS' : 'FAIL'} (avg lie ${avgLie.toFixed(1)} vs avg truth ${avgTruth.toFixed(1)})`);

  // --- T1 recovery checks ---

  const lieStrengths = lies.map(l => l.strength).sort((a, b) => a - b);
  const weakerLie = lieStrengths[0]!;
  const worstLie = lieStrengths[lieStrengths.length - 1]!;
  const top2Truths = [...truths].sort((a, b) => b.strength - a.strength).slice(0, 2);
  const top2Sum = top2Truths.reduce((s, c) => s + c.strength, 0);

  const weakRecovery = -weakerLie + top2Sum;
  const i10 = weakRecovery >= puzzle.target - 2;
  console.log(`I10 T1 weaker lie → CLOSE:       ${i10 ? 'PASS' : 'FAIL'} (-${weakerLie}+${top2Sum}=${weakRecovery} vs target-2=${puzzle.target - 2})`);

  const worstRecovery = -worstLie + top2Sum;
  const i11 = worstRecovery >= puzzle.target - 4;
  console.log(`I11 T1 worst lie not instant KO:  ${i11 ? 'PASS' : 'FAIL'} (-${worstLie}+${top2Sum}=${worstRecovery} vs target-4=${puzzle.target - 4})`);

  // --- Lie variance check ---

  const i12 = lies[0]!.strength !== lies[1]!.strength;
  console.log(`I12 Lie strengths differ:        ${i12 ? 'PASS' : 'FAIL'} (${lies.map(l => l.strength).join(', ')})`);

  // --- Win rate checks ---

  const i13 = winRate >= 15 && winRate <= 70;
  console.log(`I13 Win rate 15-70% (rand):      ${i13 ? 'PASS' : 'FAIL'} (${winRate.toFixed(1)}%)`);

  const i14 = flawlessRate >= 5 && flawlessRate <= 35;
  console.log(`I14 FLAWLESS rate 5-35%:         ${i14 ? 'PASS' : 'FAIL'} (${flawlessRate.toFixed(1)}%)`);

  // --- Content checks ---

  const hintCoverage = puzzle.cards.filter(c => puzzle.reactiveHints[c.id]).length;
  const i15 = hintCoverage === 6;
  console.log(`I15 Reactive hint coverage 6/6:  ${i15 ? 'PASS' : 'FAIL'} (${hintCoverage}/6)`);

  const quipCoverage = puzzle.cards.filter(c => puzzle.verdictQuips[c.id]).length;
  const i16 = quipCoverage === 6;
  console.log(`I16 Verdict quip coverage 6/6:   ${i16 ? 'PASS' : 'FAIL'} (${quipCoverage}/6)`);

  // --- Hint dimension verification (I17) ---
  // Verify hintMatchingIds actually match the hintDimension function

  const dimensionMatches = puzzle.cards.filter(c => puzzle.hintDimension.matchFn(c)).map(c => c.id);
  const hintIdSet = new Set(puzzle.hintMatchingIds);
  const dimSet = new Set(dimensionMatches);
  const i17 = hintIdSet.size === dimSet.size && [...hintIdSet].every(id => dimSet.has(id));
  const mismatch = i17 ? '' : ` (declared: [${[...hintIdSet].join(',')}] vs matchFn: [${[...dimSet].join(',')}])`;
  console.log(`I17 Hint dimension matches IDs:  ${i17 ? 'PASS' : 'FAIL'}${mismatch}`);

  // --- Reactive hint implicates checks (I18, I19) ---
  // I18: Every SPECIFIC reactive hint implicates the stealth lie (for truth plays) or the other lie (for lie plays)
  // Vague hints are exempt — they intentionally provide no actionable narrowing.

  const stealthLie = outsideLies[0]!;
  const hintLie = hintLies[0]!;
  let i18 = true;
  const i18Failures: string[] = [];

  for (const card of puzzle.cards) {
    const rh = puzzle.reactiveHints[card.id];
    if (!rh) continue;
    if (rh.quality === 'vague') continue; // vague hints don't need to implicate
    const implSet = new Set(rh.implicates);

    if (card.isLie) {
      // Lie play: must implicate the OTHER lie
      const otherLie = card.id === stealthLie.id ? hintLie : stealthLie;
      if (!implSet.has(otherLie.id)) {
        i18 = false;
        i18Failures.push(`${card.id}(lie) doesn't implicate other lie ${otherLie.id}`);
      }
    } else {
      // Truth play (specific): must implicate the stealth lie
      if (!implSet.has(stealthLie.id)) {
        i18 = false;
        i18Failures.push(`${card.id}(truth,specific) doesn't implicate stealth lie ${stealthLie.id}`);
      }
    }
  }
  console.log(`I18 Hints implicate correct lies: ${i18 ? 'PASS' : 'FAIL'}${i18Failures.length ? ` (${i18Failures.join('; ')})` : ''}`);

  // I19: Implicates list is small enough to be actionable (≤3 cards)
  let i19 = true;
  const i19Failures: string[] = [];
  for (const card of puzzle.cards) {
    const rh = puzzle.reactiveHints[card.id];
    if (!rh) continue;
    if (rh.implicates.length > 3) {
      i19 = false;
      i19Failures.push(`${card.id}: ${rh.implicates.length} implicates`);
    }
  }
  console.log(`I19 Hint implicates ≤3 cards:    ${i19 ? 'PASS' : 'FAIL'}${i19Failures.length ? ` (${i19Failures.join('; ')})` : ''}`);

  // --- Dialogue leakage check (I20) ---
  // No card ID should appear in closing dialogue lines

  const cardIds = new Set(puzzle.cards.map(c => c.id));
  const dialogueTexts = [
    puzzle.dialogue.flawless,
    puzzle.dialogue.cleared,
    puzzle.dialogue.close,
    puzzle.dialogue.busted,
  ];
  let i20 = true;
  const i20Leaks: string[] = [];
  for (const text of dialogueTexts) {
    const lower = text.toLowerCase();
    for (const id of cardIds) {
      // Check for card ID as a word boundary match
      const re = new RegExp(`\\b${id.replace('_', '[_ ]')}\\b`, 'i');
      if (re.test(lower)) {
        i20 = false;
        i20Leaks.push(`"${id}" found in dialogue`);
      }
    }
  }
  console.log(`I20 No card IDs in dialogue:     ${i20 ? 'PASS' : 'FAIL'}${i20Leaks.length ? ` (${i20Leaks.join('; ')})` : ''}`);

  // --- Hint-group plausibility spread (I21) ---
  // The hint lie must share at least one attribute (location or source) with ≥1 red herring
  // in the hint group. If it's unique on all axes, it's too easily identifiable.

  const hintLieCard = hintLies[0]!;
  const hintRedHerrings = hintTruths;
  const sharesAttribute = hintRedHerrings.some(rh =>
    rh.location === hintLieCard.location || rh.source === hintLieCard.source
  );
  const i21 = sharesAttribute;
  console.log(`I21 Hint lie shares attr w/ RH:  ${i21 ? 'PASS' : 'WARN'} (lie=${hintLieCard.id} loc=${hintLieCard.location} src=${hintLieCard.source})`);

  // --- Hint lie strength check (I22) ---
  // The hint lie should not be strictly higher strength than all red herrings in its group.

  const maxRHStrength = Math.max(...hintRedHerrings.map(rh => rh.strength));
  const i22 = hintLieCard.strength <= maxRHStrength;
  console.log(`I22 Hint lie str ≤ max RH str:   ${i22 ? 'PASS' : 'WARN'} (lie=${hintLieCard.strength} vs maxRH=${maxRHStrength})`);

  // --- Reactive hint quality checks (I23, I24, I25) ---

  // I23: Reactive hint quality matches card group
  let i23 = true;
  const i23Failures: string[] = [];
  for (const card of puzzle.cards) {
    const rh = puzzle.reactiveHints[card.id];
    if (!rh) continue;
    if (card.isLie) continue; // lie cards exempt — lie plays always reveal
    const inHintGroup = hintIds.has(card.id);
    if (inHintGroup && rh.quality !== 'specific') {
      i23 = false;
      i23Failures.push(`${card.id}(hint-group) should be specific, got ${rh.quality}`);
    }
    if (!inHintGroup && rh.quality !== 'vague') {
      i23 = false;
      i23Failures.push(`${card.id}(non-hint) should be vague, got ${rh.quality}`);
    }
  }
  console.log(`I23 Hint quality matches group:   ${i23 ? 'PASS' : 'FAIL'}${i23Failures.length ? ` (${i23Failures.join('; ')})` : ''}`);

  // I24: Vague hints must NOT implicate specific cards
  let i24 = true;
  const i24Failures: string[] = [];
  for (const card of puzzle.cards) {
    const rh = puzzle.reactiveHints[card.id];
    if (!rh) continue;
    if (rh.quality === 'vague' && rh.implicates.length > 0) {
      i24 = false;
      i24Failures.push(`${card.id}(vague) has ${rh.implicates.length} implicates`);
    }
  }
  console.log(`I24 Vague hints have no implicates:${i24 ? 'PASS' : 'FAIL'}${i24Failures.length ? ` (${i24Failures.join('; ')})` : ''}`);

  // I25: Specific hints (non-lie plays) must implicate ≥1 card
  let i25 = true;
  const i25Failures: string[] = [];
  for (const card of puzzle.cards) {
    const rh = puzzle.reactiveHints[card.id];
    if (!rh) continue;
    if (rh.quality === 'specific' && !card.isLie && rh.implicates.length < 1) {
      i25 = false;
      i25Failures.push(`${card.id}(specific,truth) has 0 implicates`);
    }
  }
  console.log(`I25 Specific hints implicate ≥1:  ${i25 ? 'PASS' : 'FAIL'}${i25Failures.length ? ` (${i25Failures.join('; ')})` : ''}`);

  const safeSum = nonHintScore;  // for summary compatibility
  // I21 and I22 are WARNs (heuristic signals), not counted in pass/fail
  const checks = [i1, i2, i3, i4, i5, i6, i7a, i7b, i8, i9, i10, i11, i12, i13, i14, i15, i16, i17, i18, i19, i20, i23, i24, i25];
  const passed = checks.filter(Boolean).length;
  const failed = checks.length - passed;
  console.log(`\nResult: ${passed}/${checks.length} checks passed${failed > 0 ? ` — ${failed} FAILED` : ''}`);
  console.log('');

  // Compute informed win rate (safe T1 sequences only) for cross-puzzle check
  const hintIdSetForFilter = new Set(puzzle.hintMatchingIds);
  const safeT1Seqs = all.filter(s => !hintIdSetForFilter.has(s.plays[0]!));
  const safeT1Wins = safeT1Seqs.filter(s => s.tier === 'FLAWLESS' || s.tier === 'CLEARED');
  const informedWinRate = safeT1Seqs.length > 0 ? (safeT1Wins.length / safeT1Seqs.length) * 100 : 0;

  // Compute informed-probe win rate: T1 IS in hintMatchingIds AND is a truth (risky probe that pays off)
  const lieIds = new Set(lies.map(l => l.id));
  const probeT1Seqs = all.filter(s => hintIdSetForFilter.has(s.plays[0]!) && !lieIds.has(s.plays[0]!));
  const probeT1Wins = probeT1Seqs.filter(s => s.tier === 'FLAWLESS' || s.tier === 'CLEARED');
  const probeWinRate = probeT1Seqs.length > 0 ? (probeT1Wins.length / probeT1Seqs.length) * 100 : 0;

  return { winRate, flawlessRate, wins, all, truths, lies, safeSum, weakRecovery, worstRecovery, informedWinRate, probeWinRate };
}

// ============================================================================
// Run All Puzzles + Summary
// ============================================================================

interface PuzzleSummary {
  name: string;
  target: number;
  winRate: number;
  flawlessRate: number;
  closeRate: number;
  bustedRate: number;
  maxScore: number;
  minScore: number;
  avgLieStr: number;
  avgTruthStr: number;
  safeComplement: number;
  weakRecovery: number;
  worstRecovery: number;
  lieStrengths: number[];
  informedWinRate: number;
  probeWinRate: number;
}

const summaries: PuzzleSummary[] = [];

for (const puzzle of ALL_PUZZLES) {
  const result = runAnalysis(puzzle);
  const { winRate, flawlessRate, all, truths, lies, safeSum, weakRecovery, worstRecovery, informedWinRate, probeWinRate } = result;

  const close = all.filter(s => s.tier === 'CLOSE');
  const busted = all.filter(s => s.tier === 'BUSTED');
  const scores = all.map(s => s.finalScore);

  summaries.push({
    name: puzzle.name,
    target: puzzle.target,
    winRate,
    flawlessRate,
    closeRate: (close.length / all.length) * 100,
    bustedRate: (busted.length / all.length) * 100,
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    avgLieStr: lies.reduce((s, c) => s + c.strength, 0) / lies.length,
    avgTruthStr: truths.reduce((s, c) => s + c.strength, 0) / truths.length,
    safeComplement: safeSum,
    weakRecovery,
    worstRecovery,
    lieStrengths: lies.map(l => l.strength),
    informedWinRate,
    probeWinRate,
  });
}

// Cross-puzzle summary
console.log('\n');
console.log('================================================================');
console.log('              V3 CROSS-PUZZLE SUMMARY');
console.log('================================================================\n');

const col = (s: string, w: number) => s.padEnd(w);
const num = (n: number, d = 1) => n.toFixed(d);

const hdr = `  ${col('Metric', 24)} ${summaries.map(s => col(s.name, 22)).join('')}`;
console.log(hdr);
console.log('  ' + '-'.repeat(hdr.length - 2));

const row = (label: string, vals: string[]) =>
  `  ${col(label, 24)} ${vals.map(v => col(v, 22)).join('')}`;

console.log(row('Target', summaries.map(s => `${s.target}`)));
console.log(row('Win rate', summaries.map(s => `${num(s.winRate)}%`)));
console.log(row('FLAWLESS rate', summaries.map(s => `${num(s.flawlessRate)}%`)));
console.log(row('CLOSE rate', summaries.map(s => `${num(s.closeRate)}%`)));
console.log(row('BUSTED rate', summaries.map(s => `${num(s.bustedRate)}%`)));
console.log(row('Score range', summaries.map(s => `${s.minScore} to ${s.maxScore}`)));
console.log(row('Avg lie strength', summaries.map(s => `${num(s.avgLieStr)}`)));
console.log(row('Avg truth strength', summaries.map(s => `${num(s.avgTruthStr)}`)));
console.log(row('Safe complement', summaries.map(s => `${s.safeComplement} < ${s.target}`)));
console.log(row('Weak lie recovery', summaries.map(s => `${s.weakRecovery} ≥ ${s.target}`)));
console.log(row('Worst lie recovery', summaries.map(s => `${s.worstRecovery} ≥ ${s.target - 2}`)));
console.log(row('Lie strengths', summaries.map(s => `{${s.lieStrengths.join(', ')}}`)));
console.log(row('Informed win rate', summaries.map(s => `${num(s.informedWinRate)}%`)));
console.log(row('Probe win rate', summaries.map(s => `${num(s.probeWinRate)}%`)));
console.log(row('Probe-safe gap', summaries.map(s => `${num(s.probeWinRate - s.informedWinRate)}pp`)));

// ============================================================================
// CROSS-PUZZLE INVARIANT CHECKS
// ============================================================================

console.log('\n\n================================================================');
console.log('              CROSS-PUZZLE CHECKS');
console.log('================================================================\n');

let crossFails = 0;

// C1: Difficulty progression — win rates should decrease or stay flat
const winRates = summaries.map(s => s.winRate);
const c1 = winRates.every((r, i) => i === 0 || r <= winRates[i - 1]!);
console.log(`C1 Win rate non-increasing:      ${c1 ? 'PASS' : 'FAIL'} (${winRates.map(r => num(r) + '%').join(' → ')})`);
if (!c1) crossFails++;

// C2: No single strength is ALWAYS a lie across all puzzles
const allLieStrSets = summaries.map(s => new Set(s.lieStrengths));
let alwaysLieStr: number[] = [];
for (let str = 1; str <= 5; str++) {
  if (allLieStrSets.every(s => s.has(str))) alwaysLieStr.push(str);
}
const c2 = alwaysLieStr.length === 0;
console.log(`C2 No strength always a lie:     ${c2 ? 'PASS' : 'WARN'} (${c2 ? 'none' : `str ${alwaysLieStr.join(',')} in all puzzles`})`);
if (!c2) console.log('   → Meta-pattern: players may learn to always avoid this strength');

// C3: Lie strength variance across puzzles — not all the same pair
const liePairs = summaries.map(s => s.lieStrengths.sort().join(','));
const uniquePairs = new Set(liePairs);
const c3 = uniquePairs.size >= 2;
console.log(`C3 Lie pairs vary across puzzles:${c3 ? ' PASS' : ' FAIL'} (${liePairs.join(' | ')})`);
if (!c3) crossFails++;

// C4: Target progression — should increase or stay flat
const targets = summaries.map(s => s.target);
const c4 = targets.every((t, i) => i === 0 || t >= targets[i - 1]!);
console.log(`C4 Target non-decreasing:        ${c4 ? 'PASS' : 'FAIL'} (${targets.join(' → ')})`);
if (!c4) crossFails++;

// C5: All safe complements strictly below target
const c5 = summaries.every(s => s.safeComplement < s.target);
console.log(`C5 All safe complements < target:${c5 ? ' PASS' : ' FAIL'}`);
if (!c5) crossFails++;

// C6: All weaker-lie T1 recoveries reach CLOSE (target-2)
const c6 = summaries.every(s => s.weakRecovery >= s.target - 2);
console.log(`C6 All weak-lie T1 → CLOSE:      ${c6 ? 'PASS' : 'FAIL'}`);
if (!c6) crossFails++;

// C7: All worst-lie T1 recoveries reach CLOSE (target-2)
const c7 = summaries.every(s => s.worstRecovery >= s.target - 2);
console.log(`C7 All worst-lie T1 → CLOSE:     ${c7 ? 'PASS' : 'WARN'} (hard puzzles may BUSTED — acceptable)`);

// C8: Informed win rate non-increasing (difficulty progression for thinking players)
const informedRates = summaries.map(s => s.informedWinRate);
const c8 = informedRates.every((r, i) => i === 0 || r <= informedRates[i - 1]!);
console.log(`C8 Informed win rate decreasing:  ${c8 ? 'PASS' : 'FAIL'} (${informedRates.map(r => num(r) + '%').join(' → ')})`);
if (!c8) crossFails++;

const crossChecks = [c1, c2, c3, c4, c5, c6, c8];
const crossPassed = crossChecks.filter(Boolean).length;
console.log(`\nCross-puzzle: ${crossPassed}/${crossChecks.length} checks passed${crossFails > 0 ? ` — ${crossFails} FAILED` : ''}`);
console.log('');
