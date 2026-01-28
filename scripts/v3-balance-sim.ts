/**
 * V3 Balance Simulator
 *
 * Comprehensive analysis of puzzle balance and strategy viability.
 *
 * Checks:
 * 1. Is "play safe" always optimal? (target vs min truth combo)
 * 2. Is FLAWLESS achievable? (top 3 truths vs target)
 * 3. Is CLEARED achievable after eating a lie? (recovery math)
 * 4. Win rates by strategy (random, safe-first, probe-first, oracle)
 * 5. T1 decision quality (is there a reasonable T1 for each puzzle?)
 * 6. Does sequencing matter? (is T1 choice meaningfully different from T3?)
 *
 * Usage: npx tsx scripts/v3-balance-sim.ts
 */

import { ALL_PUZZLES } from './v3-puzzles.js';

// ============================================================================
// Helpers
// ============================================================================

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first!, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

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

interface SimCard {
  id: string;
  strength: number;
  isLie: boolean;
  inHintGroup: boolean;
}

// ============================================================================
// Strategy simulators
// ============================================================================

/**
 * Random strategy: pick 3 cards at random, play in random order.
 * Returns distribution of outcomes over all possible 3-card plays.
 */
function simRandom(cards: SimCard[], target: number) {
  const allPlays = combinations(cards, 3);
  let wins = 0, flawless = 0, cleared = 0, close = 0, busted = 0;

  for (const play of allPlays) {
    const score = play.reduce((s, c) => s + (c.isLie ? -(c.strength - 1) : c.strength), 0);
    const liesPlayed = play.filter(c => c.isLie).length;
    if (score >= target && liesPlayed === 0) { flawless++; wins++; }
    else if (score >= target) { cleared++; wins++; }
    else if (score >= target - 2) { close++; }
    else { busted++; }
  }

  const total = allPlays.length;
  return {
    total,
    wins, flawless, cleared, close, busted,
    winRate: (wins / total * 100),
    flawlessRate: (flawless / total * 100),
  };
}

/**
 * Safe-first strategy: sort cards by confidence (non-hint-group first, then by strength desc).
 * Always avoids hint group if possible. Picks top 3.
 */
function simSafeFirst(cards: SimCard[], target: number) {
  // Safe-first: prefer non-hint-group, then highest strength
  const sorted = [...cards].sort((a, b) => {
    if (a.inHintGroup !== b.inHintGroup) return a.inHintGroup ? 1 : -1; // non-hint first
    return b.strength - a.strength; // then highest strength
  });
  const picked = sorted.slice(0, 3);
  const score = picked.reduce((s, c) => s + (c.isLie ? -(c.strength - 1) : c.strength), 0);
  const liesPlayed = picked.filter(c => c.isLie).length;
  const tier = score >= target && liesPlayed === 0 ? 'FLAWLESS'
    : score >= target ? 'CLEARED'
    : score >= target - 2 ? 'CLOSE' : 'BUSTED';
  return { picked: picked.map(c => c.id), score, liesPlayed, tier };
}

/**
 * Strength-first strategy: just pick the 3 highest-strength cards.
 * This is the "greedy" approach — maximum expected points, no deduction.
 */
function simStrengthFirst(cards: SimCard[], target: number) {
  const sorted = [...cards].sort((a, b) => b.strength - a.strength);
  const picked = sorted.slice(0, 3);
  const score = picked.reduce((s, c) => s + (c.isLie ? -(c.strength - 1) : c.strength), 0);
  const liesPlayed = picked.filter(c => c.isLie).length;
  const tier = score >= target && liesPlayed === 0 ? 'FLAWLESS'
    : score >= target ? 'CLEARED'
    : score >= target - 2 ? 'CLOSE' : 'BUSTED';
  return { picked: picked.map(c => c.id), score, liesPlayed, tier };
}

/**
 * Oracle strategy: knows which cards are lies. Picks optimal 3 truths.
 */
function simOracle(cards: SimCard[], target: number) {
  const truths = cards.filter(c => !c.isLie).sort((a, b) => b.strength - a.strength);
  const picked = truths.slice(0, 3);
  const score = picked.reduce((s, c) => s + c.strength, 0);
  const tier = score >= target ? 'FLAWLESS' : score >= target - 2 ? 'CLOSE' : 'BUSTED';
  return { picked: picked.map(c => c.id), score, liesPlayed: 0, tier };
}

// ============================================================================
// T1 decision analysis
// ============================================================================

interface T1Analysis {
  card: SimCard;
  // If truth: score contribution, reactive hint quality
  ifTruth: { points: number; hintQuality: 'specific' | 'vague'; bestT23Score: number; bestTotal: number };
  // If lie: penalty, reactive hint (always specific), best recovery
  ifLie: { penalty: number; bestT23Score: number; bestTotal: number; recovers: boolean };
  // Expected value (assuming unknown — 2 lies out of 6)
  ev: number;
  // Is this a "probe" (hint-group card)?
  isProbe: boolean;
}

function analyzeT1Options(cards: SimCard[], target: number): T1Analysis[] {
  const truths = cards.filter(c => !c.isLie);
  const lieCount = cards.filter(c => c.isLie).length;
  const totalCards = cards.length;

  return cards.map(card => {
    // If this card is truth
    const remainingAfterTruth = truths.filter(c => c.id !== card.id).sort((a, b) => b.strength - a.strength);
    const bestT23Truth = remainingAfterTruth.slice(0, 2).reduce((s, c) => s + c.strength, 0);
    const ifTruth = {
      points: card.strength,
      hintQuality: (card.inHintGroup ? 'specific' : 'vague') as 'specific' | 'vague',
      bestT23Score: bestT23Truth,
      bestTotal: card.strength + bestT23Truth,
    };

    // If this card is lie
    const penalty = -(card.strength - 1);
    const bestT23Lie = truths.sort((a, b) => b.strength - a.strength).slice(0, 2).reduce((s, c) => s + c.strength, 0);
    const ifLie = {
      penalty,
      bestT23Score: bestT23Lie,
      bestTotal: penalty + bestT23Lie,
      recovers: (penalty + bestT23Lie) >= target,
    };

    // Naive EV: P(truth) * truth_score + P(lie) * lie_score
    // P(lie) = lieCount / totalCards for unknown card
    const pLie = card.isLie ? 1 : 0; // oracle view
    // For "player perspective" EV, use uniform prior
    const pLiePlayer = lieCount / totalCards;
    const ev = (1 - pLiePlayer) * ifTruth.bestTotal + pLiePlayer * ifLie.bestTotal;

    return {
      card,
      ifTruth,
      ifLie,
      ev,
      isProbe: card.inHintGroup,
    };
  });
}

// ============================================================================
// Sequencing analysis
// ============================================================================

/**
 * Does T1 choice affect achievable outcomes?
 * Compare: "play X first then best 2" vs "play Y first then best 2"
 * If all T1 choices lead to the same outcome, sequencing doesn't matter.
 */
function analyzeSequencing(cards: SimCard[], target: number) {
  const truths = cards.filter(c => !c.isLie);
  const results: { t1: string; bestOutcome: string; score: number }[] = [];

  for (const t1Card of cards) {
    const score1 = t1Card.isLie ? -(t1Card.strength - 1) : t1Card.strength;
    // After T1, pick best 2 truths from remaining
    const remaining = truths.filter(c => c.id !== t1Card.id).sort((a, b) => b.strength - a.strength);
    const best2 = remaining.slice(0, 2);
    const scoreRest = best2.reduce((s, c) => s + c.strength, 0);
    const total = score1 + scoreRest;
    const liesPlayed = t1Card.isLie ? 1 : 0;
    const tier = total >= target && liesPlayed === 0 ? 'FLAWLESS'
      : total >= target ? 'CLEARED'
      : total >= target - 2 ? 'CLOSE' : 'BUSTED';
    results.push({ t1: t1Card.id, bestOutcome: tier, score: total });
  }

  const uniqueOutcomes = new Set(results.map(r => r.bestOutcome));
  return {
    results,
    sequencingMatters: uniqueOutcomes.size > 1,
    uniqueOutcomes: [...uniqueOutcomes],
  };
}

// ============================================================================
// Full puzzle analysis
// ============================================================================

function analyzePuzzle(puzzle: typeof ALL_PUZZLES[number], overrideTarget?: number) {
  const target = overrideTarget ?? puzzle.target;
  const cards: SimCard[] = puzzle.cards.map(c => ({
    id: c.id,
    strength: c.strength,
    isLie: c.isLie,
    inHintGroup: puzzle.hintMatchingIds.includes(c.id),
  }));

  const truths = cards.filter(c => !c.isLie);
  const lies = cards.filter(c => c.isLie);

  // Truth combo analysis
  const truthCombos = combinations(truths, 3);
  const truthScores = truthCombos.map(combo => ({
    cards: combo.map(c => c.id),
    score: combo.reduce((s, c) => s + c.strength, 0),
  }));
  const minTruth = Math.min(...truthScores.map(t => t.score));
  const maxTruth = Math.max(...truthScores.map(t => t.score));
  const truthsThatClear = truthScores.filter(t => t.score >= target);
  const truthsThatFail = truthScores.filter(t => t.score < target);

  // Strategy sims
  const random = simRandom(cards, target);
  const safeFirst = simSafeFirst(cards, target);
  const strengthFirst = simStrengthFirst(cards, target);
  const oracle = simOracle(cards, target);

  // T1 analysis
  const t1Options = analyzeT1Options(cards, target);

  // Sequencing
  const sequencing = analyzeSequencing(cards, target);

  // Lie recovery
  const lieRecoveries = lies.map(lie => {
    const penalty = -(lie.strength - 1);
    const remainingTruths = truths.sort((a, b) => b.strength - a.strength);
    const best2 = remainingTruths.slice(0, 2).reduce((s, c) => s + c.strength, 0);
    return {
      id: lie.id, str: lie.strength, penalty,
      best2, total: penalty + best2,
      tier: (penalty + best2) >= target ? 'CLEARED'
        : (penalty + best2) >= target - 2 ? 'CLOSE' : 'BUSTED',
    };
  });

  return {
    name: puzzle.name,
    target,
    originalTarget: puzzle.target,
    cards, truths, lies,
    truthScores, minTruth, maxTruth,
    truthsThatClear, truthsThatFail,
    safeAlwaysClears: minTruth >= target,
    random, safeFirst, strengthFirst, oracle,
    t1Options, sequencing, lieRecoveries,
  };
}

// ============================================================================
// Output
// ============================================================================

function printFull(a: ReturnType<typeof analyzePuzzle>) {
  const tgt = a.target !== a.originalTarget ? `${a.target} (was ${a.originalTarget})` : `${a.target}`;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${a.name}  |  Target: ${tgt}`);
  console.log(`${'═'.repeat(70)}`);

  // Cards
  console.log(`\n  Cards:`);
  for (const c of a.cards) {
    const tag = c.isLie ? 'LIE' : 'truth';
    const group = c.inHintGroup ? 'hint-group' : 'outside';
    console.log(`    ${c.id.padEnd(14)} str ${c.strength}  ${tag.padEnd(5)}  ${group}`);
  }

  // Truth combos
  console.log(`\n  Truth Combos (pick 3 of ${a.truths.length} truths):`);
  for (const tc of a.truthScores) {
    const status = tc.score >= a.target ? '✓ CLEARS' : '✗ FAILS';
    console.log(`    [${tc.cards.join(', ')}] = ${tc.score}  ${status}`);
  }
  console.log(`  Safe always clears: ${a.safeAlwaysClears ? 'YES ← no risk needed' : 'NO ← some combos fail (GOOD)'}`);

  // Lie recovery
  console.log(`\n  Lie Recovery (eat lie T1, play best 2 truths):`);
  for (const r of a.lieRecoveries) {
    console.log(`    ${r.id}(${r.str}): ${r.penalty} + ${r.best2} = ${r.total} → ${r.tier}`);
  }

  // Strategy comparison
  console.log(`\n  Strategy Comparison:`);
  console.log(`    Random:         win ${a.random.winRate.toFixed(0)}%, flawless ${a.random.flawlessRate.toFixed(0)}%`);
  console.log(`    Safe-first:     ${a.safeFirst.tier} (${a.safeFirst.score}) → [${a.safeFirst.picked.join(', ')}]`);
  console.log(`    Strength-first: ${a.strengthFirst.tier} (${a.strengthFirst.score}) → [${a.strengthFirst.picked.join(', ')}]`);
  console.log(`    Oracle:         ${a.oracle.tier} (${a.oracle.score}) → [${a.oracle.picked.join(', ')}]`);

  // T1 decision
  console.log(`\n  T1 Decision Analysis (player perspective EV):`);
  const sorted = [...a.t1Options].sort((a, b) => b.ev - a.ev);
  for (const t of sorted) {
    const probe = t.isProbe ? 'PROBE' : 'safe ';
    const hint = t.ifTruth.hintQuality === 'specific' ? 'specific hint' : 'vague hint   ';
    const recovery = t.ifLie.recovers ? 'recovers' : 'FAILS   ';
    console.log(`    ${t.card.id.padEnd(14)} ${probe}  EV=${t.ev.toFixed(1)}  if-truth: +${t.card.strength} (${hint}, best=${t.ifTruth.bestTotal})  if-lie: ${t.ifLie.penalty} (${recovery}, best=${t.ifLie.bestTotal})`);
  }

  // Sequencing
  console.log(`\n  Sequencing (does T1 choice affect outcome?):`);
  console.log(`    Matters: ${a.sequencing.sequencingMatters ? 'YES ← different T1 leads to different tiers' : 'NO ← all T1 choices lead to same tier'}`);
  for (const r of a.sequencing.results) {
    console.log(`    T1=${r.t1.padEnd(14)} → ${r.bestOutcome} (${r.score})`);
  }
}

// ============================================================================
// Main
// ============================================================================

console.log('V3 BALANCE SIMULATOR — Full Analysis');
console.log('=====================================\n');

// Current puzzles
console.log('▶ CURRENT TARGETS (status quo)\n');
for (const puzzle of ALL_PUZZLES) {
  printFull(analyzePuzzle(puzzle));
}

// Proposed new targets
console.log('\n\n');
console.log('▶ PROPOSED TARGETS\n');

const proposedTargets: Record<string, number> = {
  'The Power Outage': 10,
  'The Thermostat War': 9,
  'The Hot Tub Incident': 10,
};

for (const puzzle of ALL_PUZZLES) {
  const newTarget = proposedTargets[puzzle.name];
  if (newTarget) {
    printFull(analyzePuzzle(puzzle, newTarget));
  }
}

// Target sweep: find optimal target for each puzzle
console.log('\n\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TARGET SWEEP — Finding optimal target for each puzzle');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

for (const puzzle of ALL_PUZZLES) {
  console.log(`\n  ${puzzle.name}:`);
  console.log(`  ${'─'.repeat(60)}`);

  for (let t = puzzle.target; t <= 15; t++) {
    const a = analyzePuzzle(puzzle, t);
    const checks = {
      flawless: a.oracle.tier === 'FLAWLESS',
      notAlwaysSafe: !a.safeAlwaysClears,
      seqMatters: a.sequencing.sequencingMatters,
      lieRecoverable: a.lieRecoveries.some(r => r.tier === 'CLEARED' || r.tier === 'CLOSE'),
      randomWin: a.random.winRate >= 10 && a.random.winRate <= 40,
      strengthNotOracle: a.strengthFirst.tier !== a.oracle.tier || a.strengthFirst.score !== a.oracle.score,
    };
    const passCount = Object.values(checks).filter(Boolean).length;
    const failedNames = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);
    const marker = passCount === 6 ? '✓✓✓ ALL PASS' : `${passCount}/6`;
    const failStr = failedNames.length > 0 ? ` [FAIL: ${failedNames.join(', ')}]` : '';

    // Show truth combo details
    const clearRate = a.truthsThatClear.length + '/' + a.truthScores.length;
    const recoveries = a.lieRecoveries.map(r => `${r.id}→${r.tier}`).join(', ');

    console.log(`  target=${String(t).padStart(2)}  ${marker.padEnd(15)} truth-clear=${clearRate} random-win=${a.random.winRate.toFixed(0).padStart(2)}% recovery=[${recoveries}]${failStr}`);
  }
}

// Summary verdict
console.log('\n\n');
console.log('═'.repeat(70));
console.log('  SUMMARY');
console.log('═'.repeat(70));
console.log();

for (const puzzle of ALL_PUZZLES) {
  const current = analyzePuzzle(puzzle);
  const proposed = analyzePuzzle(puzzle, proposedTargets[puzzle.name]);

  console.log(`  ${puzzle.name}:`);
  console.log(`    Current (target ${current.target}): safe-always-clears=${current.safeAlwaysClears}, sequencing-matters=${current.sequencing.sequencingMatters}, random-win=${current.random.winRate.toFixed(0)}%`);
  console.log(`    Proposed (target ${proposed.target}): safe-always-clears=${proposed.safeAlwaysClears}, sequencing-matters=${proposed.sequencing.sequencingMatters}, random-win=${proposed.random.winRate.toFixed(0)}%`);
  console.log();
}

console.log(`  Design health checks (proposed targets):`);
for (const puzzle of ALL_PUZZLES) {
  const a = analyzePuzzle(puzzle, proposedTargets[puzzle.name]);
  const checks = [
    { name: 'FLAWLESS achievable', pass: a.oracle.tier === 'FLAWLESS' },
    { name: 'Safe play NOT always optimal', pass: !a.safeAlwaysClears },
    { name: 'Sequencing matters', pass: a.sequencing.sequencingMatters },
    { name: 'At least 1 lie recoverable', pass: a.lieRecoveries.some(r => r.tier === 'CLEARED' || r.tier === 'CLOSE') },
    { name: 'Random win rate 15-40%', pass: a.random.winRate >= 15 && a.random.winRate <= 40 },
    { name: 'Strength-first ≠ Oracle', pass: a.strengthFirst.tier !== a.oracle.tier || a.strengthFirst.score !== a.oracle.score },
  ];
  console.log(`\n  ${puzzle.name} (target ${a.target}):`);
  for (const check of checks) {
    console.log(`    ${check.pass ? '✓' : '✗'} ${check.name}`);
  }
}
