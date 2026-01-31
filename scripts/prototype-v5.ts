#!/usr/bin/env npx tsx
/**
 * V5 Validator — Daily Puzzle Balance Checker
 *
 * Design:
 *   - 6 cards, play 3 (1 per turn), leave 3
 *   - 3 truths, 3 lies (hidden from player)
 *   - Known Facts for reasoning (no visible risk pips)
 *   - Objection after T2: challenges highest-strength played card
 *
 * Content Constraints:
 *   C1: ≤1 direct-contradiction lie (other must be relational)
 *   C2: Facts should be ranges/constraints, not exact answers
 *   C3: Safe line (all truths) cannot reach target alone
 *
 * Usage: npx tsx scripts/prototype-v5.ts [--puzzle slug] [--no-objection] [--verbose]
 */

import type { Card, V5Puzzle, GameConfig, Tier, InvariantCheck, ValidationResult, DiagnosticMetrics } from './v5-types.js';
import { DEFAULT_CONFIG } from './v5-types.js';

// ============================================================================
// CLI Args
// ============================================================================

const args = process.argv.slice(2);
const puzzleArg = args.find((_, i, a) => a[i - 1] === '--puzzle');
const noObjection = args.includes('--no-objection');
const verbose = args.includes('--verbose');
const jsonMode = args.includes('--json');

// ============================================================================
// Combinatorics
// ============================================================================

function* combinations<T>(arr: readonly T[], k: number): Generator<T[]> {
  if (k === 0) { yield []; return; }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) { yield arr; return; }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i]!, ...perm];
    }
  }
}

// ============================================================================
// Scoring
// ============================================================================

function scoreCard(card: Card, config: GameConfig): number {
  return card.isLie ? config.scoring.lie(card.strength) : config.scoring.truth(card.strength);
}

function getTier(belief: number, target: number, config: GameConfig): Tier {
  if (config.tiers.flawless(belief, target)) return 'FLAWLESS';
  if (config.tiers.cleared(belief, target)) return 'CLEARED';
  if (config.tiers.close(belief, target)) return 'CLOSE';
  return 'BUSTED';
}

// ============================================================================
// Objection Logic
// ============================================================================

interface ObjectionResult {
  challengedCard: Card;
  optimalChoice: 'stood_by' | 'withdrawn';
  optimalDelta: number;
}

function calculateObjection(
  playedCards: Card[],
  config: GameConfig
): ObjectionResult {
  // Challenge highest-strength card from T1+T2 (first 2 cards played)
  const t1t2Cards = playedCards.slice(0, config.objection.afterTurn + 1);
  const sorted = [...t1t2Cards].sort((a, b) => b.strength - a.strength);
  const challenged = sorted[0]!;

  const stoodDelta = challenged.isLie
    ? config.objection.stoodByLie
    : config.objection.stoodByTruth;
  const withdrewDelta = config.objection.withdrew;

  // Optimal: stand by if truth (gains points), withdraw if lie (limits loss)
  const optimalChoice = challenged.isLie ? 'withdrawn' : 'stood_by';
  const optimalDelta = challenged.isLie ? withdrewDelta : stoodDelta;

  return { challengedCard: challenged, optimalChoice, optimalDelta };
}

// ============================================================================
// Play Sequence
// ============================================================================

interface PlaySequence {
  cards: Card[];              // Cards played in order
  leftOut: Card[];            // Cards not played
  scores: number[];           // Score per turn
  typeTaxApplied: boolean[];  // Whether tax was applied each turn
  totalScore: number;         // Before objection
  scoreWithObjection: number; // After optimal objection
  objection: ObjectionResult | null;
  liesPlayed: number;
  typeTaxCount: number;       // How many times tax triggered
  tier: Tier;
}

function enumerateSequences(puzzle: V5Puzzle, config: GameConfig): PlaySequence[] {
  const results: PlaySequence[] = [];
  const useObjection = config.objection.enabled && !noObjection;
  const useTypeTax = config.typeTax.enabled;

  // C(6,3) = 20 ways to choose which 3 cards to play
  for (const selection of combinations(puzzle.cards, config.turnsPerGame)) {
    const leftOut = puzzle.cards.filter(c => !selection.includes(c));

    // For each selection, all orderings matter for objection + type tax
    for (const ordering of permutations(selection)) {
      const scores: number[] = [];
      const typeTaxApplied: boolean[] = [];
      let totalScore = config.startingBelief;
      let prevType: string | null = null;
      let typeTaxCount = 0;
      let pendingTaxPenalty = 0;  // Tax applies to NEXT play

      for (let i = 0; i < ordering.length; i++) {
        const card = ordering[i]!;
        let delta = scoreCard(card, config);

        // Apply pending tax from previous turn's type repeat
        if (pendingTaxPenalty !== 0) {
          delta += pendingTaxPenalty;
          typeTaxApplied.push(true);
          pendingTaxPenalty = 0;
        } else {
          typeTaxApplied.push(false);
        }

        // Check if this triggers tax for NEXT turn
        if (useTypeTax && prevType === card.evidenceType) {
          pendingTaxPenalty = config.typeTax.penalty;
          typeTaxCount++;
        }

        scores.push(delta);
        totalScore += delta;
        prevType = card.evidenceType;
      }

      // Objection after T2
      const objection = useObjection
        ? calculateObjection(ordering, config)
        : null;
      const objectionDelta = objection?.optimalDelta ?? 0;
      const scoreWithObjection = totalScore + objectionDelta;

      const liesPlayed = ordering.filter(c => c.isLie).length;
      const tier = getTier(scoreWithObjection, puzzle.target, config);

      results.push({
        cards: ordering,
        leftOut,
        scores,
        typeTaxApplied,
        totalScore,
        scoreWithObjection,
        objection,
        liesPlayed,
        typeTaxCount,
        tier,
      });
    }
  }

  return results;
}

// ============================================================================
// Invariant Checks
// ============================================================================

function runChecks(puzzle: V5Puzzle, sequences: PlaySequence[], config: GameConfig): InvariantCheck[] {
  const checks: InvariantCheck[] = [];
  const cards = [...puzzle.cards];
  const lies = cards.filter(c => c.isLie);
  const truths = cards.filter(c => !c.isLie);

  const check = (
    id: string,
    label: string,
    passed: boolean,
    detail: string,
    severity: 'error' | 'warn' = 'error'
  ) => {
    checks.push({ id, label, passed, detail, severity });
  };

  // ============================================================================
  // Structural Checks
  // ============================================================================

  check('S1', 'Card count', cards.length === config.cardsInHand,
    `${cards.length} (expected ${config.cardsInHand})`);

  check('S2', 'Lie count', lies.length === config.liesPerPuzzle,
    `${lies.length} (expected ${config.liesPerPuzzle})`);

  check('S3', 'Truth count', truths.length === config.cardsInHand - config.liesPerPuzzle,
    `${truths.length} (expected ${config.cardsInHand - config.liesPerPuzzle})`);

  check('S4', 'Known facts present', puzzle.knownFacts.length >= 3 && puzzle.knownFacts.length <= 5,
    `${puzzle.knownFacts.length} facts (expected 3-5)`);

  check('S5', 'Lies info matches cards', puzzle.lies.every(l => cards.some(c => c.id === l.cardId)),
    puzzle.lies.map(l => l.cardId).join(', '));

  // Unique IDs
  const ids = cards.map(c => c.id);
  check('S6', 'Unique card IDs', new Set(ids).size === ids.length,
    ids.join(', '));

  // ============================================================================
  // Content Constraints
  // ============================================================================

  // C1: No direct-contradiction lies (all require inference)
  const directLies = puzzle.lies.filter(l => l.lieType === 'direct_contradiction');
  check('C1', 'No direct contradiction lies', directLies.length === 0,
    `${directLies.length} direct contradiction(s) — all lies must require inference`);

  // C2: At least one relational lie
  const relationalLies = puzzle.lies.filter(l => l.lieType === 'relational');
  check('C2', 'At least 1 relational lie', relationalLies.length >= 1,
    `${relationalLies.length} relational lie(s)`);

  // C3: Lies are tempting enough to potentially be played
  // (avg lie strength should be competitive with avg truth strength)
  const avgLieStr = lies.reduce((s, c) => s + c.strength, 0) / lies.length;
  const avgTruthStr = truths.reduce((s, c) => s + c.strength, 0) / truths.length;
  check('C3', 'Lies are tempting (avg str ≥ truths)', avgLieStr >= avgTruthStr - 1,
    `avg lie = ${avgLieStr.toFixed(1)} vs avg truth = ${avgTruthStr.toFixed(1)}`);

  // ============================================================================
  // Balance Checks
  // ============================================================================

  const scores = sequences.map(s => s.scoreWithObjection).sort((a, b) => a - b);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);
  const p50 = scores[Math.floor(scores.length / 2)]!;

  // B1: Best play reaches target
  check('B1', 'Best play clears target', best >= puzzle.target,
    `best = ${best} vs target = ${puzzle.target}`);

  // B2: Best play can reach FLAWLESS
  check('B2', 'Best play reaches FLAWLESS', best >= puzzle.target + 5,
    `best = ${best} vs flawless = ${puzzle.target + 5}`);

  // B3: Worst play is BUSTED
  check('B3', 'Worst play is BUSTED', worst < puzzle.target - 5,
    `worst = ${worst} vs busted = ${puzzle.target - 5}`);

  // B4: Score spread is reasonable
  const spread = best - worst;
  check('B4', 'Score spread 10-25', spread >= 10 && spread <= 25,
    `spread = ${spread}`);

  // Tier distribution
  const tierCounts: Record<Tier, number> = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const seq of sequences) tierCounts[seq.tier]++;
  const total = sequences.length;
  const winRate = ((tierCounts.FLAWLESS + tierCounts.CLEARED) / total) * 100;
  const flawlessRate = (tierCounts.FLAWLESS / total) * 100;
  const bustedRate = (tierCounts.BUSTED / total) * 100;

  // B5: Win rate
  check('B5', 'Win rate 3-15%', winRate >= 3 && winRate <= 15,
    `${winRate.toFixed(1)}%`);

  // B6: FLAWLESS rate
  check('B6', 'FLAWLESS rate 1-10%', flawlessRate >= 1 && flawlessRate <= 10,
    `${flawlessRate.toFixed(1)}%`);

  // B7: BUSTED exists
  check('B7', 'BUSTED rate > 0%', bustedRate > 0,
    `${bustedRate.toFixed(1)}%`);

  // ============================================================================
  // Lie Properties
  // ============================================================================

  // L1: Lie strengths are exactly 3, 4, 5 (fixed template)
  const lieStrengths = lies.map(c => c.strength).sort((a, b) => a - b);
  const expectedLieStrengths = [3, 4, 5];
  const lieStrOk = lieStrengths.length === 3 &&
    lieStrengths.every((s, i) => s === expectedLieStrengths[i]);
  check('L1', 'Lie strengths are 3, 4, 5', lieStrOk,
    `got ${lieStrengths.join(', ')} — expected 3, 4, 5`);

  // L1b: Truth strengths are exactly 3, 3, 4 (fixed template)
  const truthStrengths = truths.map(c => c.strength).sort((a, b) => a - b);
  const expectedTruthStrengths = [3, 3, 4];
  const truthStrOk = truthStrengths.length === 3 &&
    truthStrengths.every((s, i) => s === expectedTruthStrengths[i]);
  check('L1b', 'Truth strengths are 3, 3, 4', truthStrOk,
    `got ${truthStrengths.join(', ')} — expected 3, 3, 4`);

  // L1c: Evidence type distribution (3+ types, max 2 of any)
  const typeCounts = new Map<string, number>();
  for (const card of puzzle.cards) {
    typeCounts.set(card.evidenceType, (typeCounts.get(card.evidenceType) || 0) + 1);
  }
  const uniqueTypes = typeCounts.size;
  const maxOfAnyType = Math.max(...typeCounts.values());
  check('L1c', 'Evidence type distribution', uniqueTypes >= 3 && maxOfAnyType <= 2,
    `${uniqueTypes} types, max ${maxOfAnyType} of any — want 3+ types, max 2 each`);

  // L2: At least one lie is tempting (strength ≥ avg truth strength)
  const avgTruthStrength = truths.reduce((s, c) => s + c.strength, 0) / truths.length;
  const temptingLies = lies.filter(c => c.strength >= avgTruthStrength);
  check('L2', 'At least 1 tempting lie', temptingLies.length >= 1,
    `lies with str ≥ ${avgTruthStrength.toFixed(1)}: ${temptingLies.map(c => `${c.id}(${c.strength})`).join(', ') || 'none'}`);

  // L3: Playing 1 lie doesn't auto-bust (should reach CLOSE at minimum)
  const oneLiePlays = sequences.filter(s => s.liesPlayed === 1);
  const oneLieBest = oneLiePlays.length > 0 ? Math.max(...oneLiePlays.map(s => s.scoreWithObjection)) : 0;
  check('L3', '1-lie play can reach CLOSE', oneLieBest >= puzzle.target - 5,
    `best 1-lie = ${oneLieBest} vs close = ${puzzle.target - 5}`);

  // L4: Playing 2 lies is recoverable to CLOSE
  const twoLiePlays = sequences.filter(s => s.liesPlayed === 2);
  const twoLieBest = twoLiePlays.length > 0 ? Math.max(...twoLiePlays.map(s => s.scoreWithObjection)) : 0;
  check('L4', '2-lie play can reach CLOSE', twoLieBest >= puzzle.target - 5,
    `best 2-lie = ${twoLieBest}`, 'warn');

  // ============================================================================
  // Objection Checks
  // ============================================================================

  if (config.objection.enabled && !noObjection) {
    // O1: Objection choice matters
    const standByCount = sequences.filter(s => s.objection?.optimalChoice === 'stood_by').length;
    const withdrawCount = sequences.filter(s => s.objection?.optimalChoice === 'withdrawn').length;
    check('O1', 'Objection choice varies', standByCount > 0 && withdrawCount > 0,
      `stand_by: ${standByCount}, withdrawn: ${withdrawCount}`);

    // O2: High-strength cards get challenged
    const challengedIds = new Set(sequences.map(s => s.objection?.challengedCard.id));
    check('O2', 'Multiple cards can be challenged', challengedIds.size >= 2,
      `${challengedIds.size} different cards challenged`);
  }

  // ============================================================================
  // Content Checks
  // ============================================================================

  // X1: All cards have presentLine
  const missingPresentLine = cards.filter(c => !c.presentLine || c.presentLine.length < 10);
  check('X1', 'All cards have presentLine', missingPresentLine.length === 0,
    missingPresentLine.length > 0 ? `missing: ${missingPresentLine.map(c => c.id).join(', ')}` : 'ok');

  // X2: All cards have barks
  const barkCards = Object.keys(puzzle.koaBarks?.cardPlayed ?? {});
  check('X2', 'All cards have barks', cards.every(c => barkCards.includes(c.id)),
    `${barkCards.length}/${cards.length} cards have barks`);

  // X3: Verdicts defined
  check('X3', 'All verdicts defined',
    !!puzzle.verdicts.flawless && !!puzzle.verdicts.cleared && !!puzzle.verdicts.close && !!puzzle.verdicts.busted,
    'verdicts present');

  // ============================================================================
  // Sequence Bark Checks (New: THE WOW FACTOR)
  // ============================================================================

  // X4: Sequences barks defined (30 combinations for 6 cards)
  const sequenceKeys = Object.keys(puzzle.koaBarks?.sequences ?? {});
  const expectedSequences = cards.length * (cards.length - 1); // 6 * 5 = 30
  const hasSequences = sequenceKeys.length > 0;
  check('X4', 'Sequences barks defined', hasSequences,
    hasSequences ? `${sequenceKeys.length}/${expectedSequences} sequences` : 'no sequences (optional)',
    'warn');

  // X5: All sequence barks have valid card pairs
  if (hasSequences) {
    const cardIds = new Set(cards.map(c => c.id));
    const invalidSequences = sequenceKeys.filter(key => {
      const [from, to] = key.split('→');
      return !from || !to || !cardIds.has(from) || !cardIds.has(to) || from === to;
    });
    check('X5', 'Sequence keys are valid card pairs', invalidSequences.length === 0,
      invalidSequences.length > 0 ? `invalid: ${invalidSequences.join(', ')}` : 'all valid',
      'warn');
  }

  // X6: StoryCompletions barks defined
  const storyKeys = Object.keys(puzzle.koaBarks?.storyCompletions ?? {});
  const hasStoryCompletions = storyKeys.length > 0;
  check('X6', 'StoryCompletions barks defined', hasStoryCompletions,
    hasStoryCompletions ? `${storyKeys.length} patterns` : 'no storyCompletions (optional)',
    'warn');

  // X7: LiesRevealed barks defined
  const liesRevealedKeys = Object.keys(puzzle.koaBarks?.liesRevealed ?? {});
  const lieIds = lies.map(l => l.id);
  const hasLiesRevealed = liesRevealedKeys.length > 0;
  const expectedLiesRevealed = lies.length + 2; // lie IDs + "multiple" + "all"
  check('X7', 'LiesRevealed barks defined', hasLiesRevealed,
    hasLiesRevealed ? `${liesRevealedKeys.length}/${expectedLiesRevealed} entries` : 'no liesRevealed (optional)',
    'warn');

  return checks;
}

// ============================================================================
// Diagnostic Metrics
// ============================================================================

function calculateDiagnostics(puzzle: V5Puzzle, sequences: PlaySequence[], config: GameConfig): DiagnosticMetrics {
  const total = sequences.length;

  // T1 opening frequency: which cards are played first
  const t1Counts: Record<string, number> = {};
  for (const card of puzzle.cards) t1Counts[card.id] = 0;
  for (const seq of sequences) {
    const t1Card = seq.cards[0]!;
    t1Counts[t1Card.id]++;
  }
  const t1CardFrequency: Record<string, number> = {};
  for (const [id, count] of Object.entries(t1Counts)) {
    t1CardFrequency[id] = (count / total) * 100;
  }

  // Dominant opening: any card >50% of T1 plays?
  const dominantOpening = Object.entries(t1CardFrequency)
    .find(([_, pct]) => pct > 50)?.[0] ?? null;

  // T1 EV spread: group by T1 card, get avg score per T1 choice
  const t1EVs: Record<string, number[]> = {};
  for (const card of puzzle.cards) t1EVs[card.id] = [];
  for (const seq of sequences) {
    const t1Card = seq.cards[0]!;
    t1EVs[t1Card.id].push(seq.scoreWithObjection);
  }
  const t1AvgEVs = Object.entries(t1EVs)
    .filter(([_, scores]) => scores.length > 0)
    .map(([id, scores]) => ({
      id,
      avgEV: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));
  const evMax = Math.max(...t1AvgEVs.map(x => x.avgEV));
  const evMin = Math.min(...t1AvgEVs.map(x => x.avgEV));
  const t1EVSpread = evMax - evMin;

  // Blindness score: 0 = clear best T1, 1 = all T1s equal
  // Normalize by max possible spread
  const maxPossibleSpread = config.scoring.truth(5) - config.scoring.lie(5); // rough max
  const blindnessScore = Math.max(0, 1 - (t1EVSpread / maxPossibleSpread));

  // Near-optimal count: lines within 2 pts of best
  const scores = sequences.map(s => s.scoreWithObjection);
  const best = Math.max(...scores);
  const nearOptimalCount = sequences.filter(s => s.scoreWithObjection >= best - 2).length;
  const replayabilityIndex = nearOptimalCount / total;

  // Order matters: same cards, different order = different score
  const byCardSet = new Map<string, number[]>();
  for (const seq of sequences) {
    const key = seq.cards.map(c => c.id).sort().join('+');
    if (!byCardSet.has(key)) byCardSet.set(key, []);
    byCardSet.get(key)!.push(seq.scoreWithObjection);
  }
  let orderMattersCount = 0;
  for (const [_, scores] of byCardSet) {
    if (new Set(scores).size > 1) orderMattersCount += scores.length;
  }
  const orderMattersRate = (orderMattersCount / total) * 100;

  // Type tax metrics
  const taxTriggeredCount = sequences.filter(s => s.typeTaxCount > 0).length;
  const typeTaxTriggerRate = (taxTriggeredCount / total) * 100;
  const avgTypeTaxCount = sequences.reduce((sum, s) => sum + s.typeTaxCount, 0) / total;

  return {
    t1CardFrequency,
    dominantOpening,
    t1EVSpread,
    nearOptimalCount,
    replayabilityIndex,
    orderMattersRate,
    blindnessScore,
    typeTaxTriggerRate,
    avgTypeTaxCount,
  };
}

// ============================================================================
// Validation Runner
// ============================================================================

function validate(puzzle: V5Puzzle, config: GameConfig = DEFAULT_CONFIG): ValidationResult {
  const sequences = enumerateSequences(puzzle, config);
  const checks = runChecks(puzzle, sequences, config);
  const diagnostics = calculateDiagnostics(puzzle, sequences, config);

  // Add diagnostic-based checks
  if (diagnostics.dominantOpening) {
    checks.push({
      id: 'D1',
      label: 'No dominant T1 opening',
      passed: false,
      detail: `${diagnostics.dominantOpening} is ${diagnostics.t1CardFrequency[diagnostics.dominantOpening]?.toFixed(1)}% of T1`,
      severity: 'warn',
    });
  } else {
    checks.push({
      id: 'D1',
      label: 'No dominant T1 opening',
      passed: true,
      detail: 'No card >50% of T1 plays',
      severity: 'warn',
    });
  }

  checks.push({
    id: 'D2',
    label: 'T1 is a real decision',
    passed: diagnostics.blindnessScore < 0.8,
    detail: `blindness = ${diagnostics.blindnessScore.toFixed(2)} (lower = clearer decision)`,
    severity: 'warn',
  });

  checks.push({
    id: 'D3',
    label: 'Multiple near-optimal lines',
    passed: diagnostics.nearOptimalCount >= 3,
    detail: `${diagnostics.nearOptimalCount} lines within 2 of best`,
    severity: 'warn',
  });

  // Type tax check (if enabled)
  if (config.typeTax.enabled) {
    checks.push({
      id: 'D4',
      label: 'Type tax creates sequencing',
      passed: diagnostics.typeTaxTriggerRate >= 20 && diagnostics.typeTaxTriggerRate <= 80,
      detail: `${diagnostics.typeTaxTriggerRate.toFixed(1)}% trigger rate (want 20-80%)`,
      severity: 'warn',
    });
  }

  const scores = sequences.map(s => s.scoreWithObjection).sort((a, b) => a - b);
  const tierCounts: Record<Tier, number> = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const seq of sequences) tierCounts[seq.tier]++;
  const total = sequences.length;

  return {
    puzzle: puzzle.slug,
    passed: checks.filter(c => c.severity === 'error').every(c => c.passed),
    checks,
    stats: {
      totalSequences: total,
      scoreMin: scores[0]!,
      scoreMax: scores[scores.length - 1]!,
      scoreP50: scores[Math.floor(scores.length / 2)]!,
      winRate: ((tierCounts.FLAWLESS + tierCounts.CLEARED) / total) * 100,
      flawlessRate: (tierCounts.FLAWLESS / total) * 100,
      bustedRate: (tierCounts.BUSTED / total) * 100,
    },
    diagnostics,
  };
}

// ============================================================================
// Output
// ============================================================================

function printResult(puzzle: V5Puzzle, result: ValidationResult, config: GameConfig) {
  if (jsonMode) return; // JSON mode prints at the end

  console.log('═'.repeat(70));
  console.log(`Puzzle: ${puzzle.name} (${puzzle.slug})`);
  console.log(`Target: ${result.stats.scoreMin} — ${result.stats.scoreP50} — ${result.stats.scoreMax} (min/p50/max) vs ${puzzle.target}`);
  console.log(`Sequences: ${result.stats.totalSequences} | Win: ${result.stats.winRate.toFixed(1)}% | FLAWLESS: ${result.stats.flawlessRate.toFixed(1)}% | BUSTED: ${result.stats.bustedRate.toFixed(1)}%`);
  console.log('');

  if (verbose) {
    console.log('KNOWN FACTS:');
    for (const fact of puzzle.knownFacts) {
      console.log(`  • ${fact}`);
    }
    console.log('');

    console.log('CARDS:');
    for (const c of puzzle.cards) {
      const lie = c.isLie ? ' [LIE]' : '';
      const lieInfo = puzzle.lies.find(l => l.cardId === c.id);
      const lieType = lieInfo ? ` (${lieInfo.lieType})` : '';
      console.log(`  ${c.id.padEnd(20)} str:${c.strength} ${c.evidenceType.padEnd(10)} ${c.location.padEnd(12)}${lie}${lieType}`);
    }
    console.log('');

    console.log('LIES:');
    for (const lie of puzzle.lies) {
      console.log(`  ${lie.cardId}: ${lie.lieType} — ${lie.reason}`);
    }
    console.log('');

    // Diagnostics
    console.log('DIAGNOSTICS:');
    console.log(`  T1 EV spread:      ${result.diagnostics.t1EVSpread.toFixed(2)}`);
    console.log(`  Blindness score:   ${result.diagnostics.blindnessScore.toFixed(2)} (0=clear, 1=blind)`);
    console.log(`  Near-optimal:      ${result.diagnostics.nearOptimalCount} lines within 2 of best`);
    console.log(`  Replayability:     ${(result.diagnostics.replayabilityIndex * 100).toFixed(1)}%`);
    console.log(`  Order matters:     ${result.diagnostics.orderMattersRate.toFixed(1)}%`);
    console.log(`  Type tax rate:     ${result.diagnostics.typeTaxTriggerRate.toFixed(1)}% (avg ${result.diagnostics.avgTypeTaxCount.toFixed(2)} per run)`);
    if (result.diagnostics.dominantOpening) {
      console.log(`  Dominant T1:       ${result.diagnostics.dominantOpening} (${result.diagnostics.t1CardFrequency[result.diagnostics.dominantOpening]?.toFixed(1)}%)`);
    }
    console.log('');

    console.log('T1 CARD FREQUENCY:');
    for (const [id, pct] of Object.entries(result.diagnostics.t1CardFrequency).sort((a, b) => b[1] - a[1])) {
      const bar = '█'.repeat(Math.round(pct / 5));
      console.log(`  ${id.padEnd(20)} ${pct.toFixed(1).padStart(5)}% ${bar}`);
    }
    console.log('');
  }

  console.log('INVARIANT CHECKS:');
  for (const check of result.checks) {
    const icon = check.passed ? '✓' : (check.severity === 'warn' ? '⚠' : '✗');
    console.log(`  [${icon}] ${check.id.padEnd(4)} ${check.label.padEnd(35)} ${check.detail}`);
  }
  console.log('');

  const errors = result.checks.filter(c => !c.passed && c.severity === 'error');
  const warns = result.checks.filter(c => !c.passed && c.severity === 'warn');

  if (result.passed) {
    console.log(`✓ ALL CHECKS PASSED${warns.length > 0 ? ` (${warns.length} warnings)` : ''}`);
  } else {
    console.log(`✗ ${errors.length} CHECKS FAILED${warns.length > 0 ? `, ${warns.length} warnings` : ''}`);
  }
  console.log('');
}

function printBestWorst(puzzle: V5Puzzle, config: GameConfig) {
  const sequences = enumerateSequences(puzzle, config);
  const sorted = [...sequences].sort((a, b) => b.scoreWithObjection - a.scoreWithObjection);
  const best = sorted[0]!;
  const worst = sorted[sorted.length - 1]!;

  console.log('BEST PLAY:');
  console.log(`  Score: ${best.scoreWithObjection} (${best.totalScore} before objection) | Tier: ${best.tier} | Lies: ${best.liesPlayed}`);
  console.log(`  Cards: ${best.cards.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(' → ')}`);
  console.log(`  Left out: ${best.leftOut.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(', ')}`);
  if (best.objection) {
    console.log(`  Objection: ${best.objection.challengedCard.id} → ${best.objection.optimalChoice} (${best.objection.optimalDelta > 0 ? '+' : ''}${best.objection.optimalDelta})`);
  }
  console.log('');

  console.log('WORST PLAY:');
  console.log(`  Score: ${worst.scoreWithObjection} (${worst.totalScore} before objection) | Tier: ${worst.tier} | Lies: ${worst.liesPlayed}`);
  console.log(`  Cards: ${worst.cards.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(' → ')}`);
  console.log(`  Left out: ${worst.leftOut.map(c => `${c.id}(${c.isLie ? 'L' : 'T'}:${c.strength})`).join(', ')}`);
  if (worst.objection) {
    console.log(`  Objection: ${worst.objection.challengedCard.id} → ${worst.objection.optimalChoice} (${worst.objection.optimalDelta > 0 ? '+' : ''}${worst.objection.optimalDelta})`);
  }
  console.log('');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Dynamic import for puzzles (allows hot-reloading)
  const { V5_PUZZLES } = await import('./v5-puzzles.js');

  if (!jsonMode) {
    console.log('V5 Validator — Daily Puzzle Balance Checker');
    console.log(`Config: ${noObjection ? 'no-objection' : 'with-objection'}${verbose ? ', verbose' : ''}${jsonMode ? ', json' : ''}`);
    console.log('');
  }

  const puzzlesToRun = puzzleArg
    ? V5_PUZZLES.filter(p => p.slug === puzzleArg)
    : V5_PUZZLES;

  if (puzzlesToRun.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: `No puzzle found with slug: ${puzzleArg}` }));
    } else {
      console.error(`No puzzle found with slug: ${puzzleArg}`);
      console.error(`Available: ${V5_PUZZLES.map(p => p.slug).join(', ')}`);
    }
    process.exit(1);
  }

  let allPassed = true;
  const jsonResults: ValidationResult[] = [];

  for (const puzzle of puzzlesToRun) {
    const result = validate(puzzle, DEFAULT_CONFIG);

    if (jsonMode) {
      jsonResults.push(result);
    } else {
      printResult(puzzle, result, DEFAULT_CONFIG);
      if (verbose) {
        printBestWorst(puzzle, DEFAULT_CONFIG);
      }
    }

    if (!result.passed) allPassed = false;
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      passed: allPassed,
      results: jsonResults,
    }, null, 2));
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
