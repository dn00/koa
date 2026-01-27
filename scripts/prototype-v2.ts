#!/usr/bin/env npx tsx
/**
 * V2 Card Schema Prototype
 *
 * Self-contained experiment: simplified card schema (power/tag/risk),
 * mini turn processor, brute-force checker, metrics output.
 *
 * Compare output to: npx tsx scripts/check-puzzle-invariants.ts
 *
 * Usage: npx tsx scripts/prototype-v2.ts
 */

// ============================================================================
// V2 Types
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
  readonly risk: number;       // scrutiny cost when played (0-2)
  readonly proves?: ProofType; // singular
  readonly refutes?: string;   // counter ID
  readonly flavor?: string;
}

interface Counter {
  readonly id: string;
  readonly targets: readonly string[]; // card IDs
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
  readonly cards: readonly Card[];
  readonly counters: readonly Counter[];
  readonly concerns: readonly Concern[];
}

// ============================================================================
// V2 Mini Turn Processor
// ============================================================================

interface GameState {
  resistance: number;
  scrutiny: number;
  turnsRemaining: number;
  committedTags: Tag[];
  committedCardIds: Set<string>;
  addressedConcerns: Set<string>;
  counters: Counter[];
}

interface TurnResult {
  damage: number;
  scrutinyAdded: number;
  concernsAddressed: string[];
  refutationsApplied: string[];
  corroborationBonus: number;
  blocked: boolean; // MAJOR contradiction
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
  };
}

function processTurnV2(
  state: GameState,
  cardIds: string[],
  puzzle: Puzzle,
): TurnResult {
  const cards = cardIds.map(id => puzzle.cards.find(c => c.id === id)!);

  // 1. Contradiction check: each card's tag vs committed tags + prior cards in this submission
  const tagsInFlight = [...state.committedTags];
  for (const card of cards) {
    const opposite = OPPOSING.get(card.tag);
    if (opposite && tagsInFlight.includes(opposite)) {
      return {
        damage: 0, scrutinyAdded: 0, concernsAddressed: [],
        refutationsApplied: [], corroborationBonus: 0,
        blocked: true, outcome: 'CONTINUE',
      };
    }
    tagsInFlight.push(card.tag);
  }

  // 2. Refutations
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

  // 3. Contested penalties (50% for cards targeted by active counters)
  const cardPowers = cards.map(card => {
    const contested = state.counters.some(
      c => !c.refuted && c.targets.includes(card.id)
    );
    return contested ? Math.ceil(card.power * 0.5) : card.power;
  });

  // 4. Base damage
  const baseDamage = cardPowers.reduce((s, p) => s + p, 0);

  // 5. Corroboration: 2+ cards with same tag in this submission
  const tagCounts = new Map<Tag, number>();
  for (const card of cards) {
    tagCounts.set(card.tag, (tagCounts.get(card.tag) ?? 0) + 1);
  }
  const hasCorroboration = [...tagCounts.values()].some(count => count >= 2);
  const corroborationBonus = hasCorroboration ? Math.ceil(baseDamage * 0.25) : 0;
  const totalDamage = baseDamage + corroborationBonus;

  // 6. Risk → scrutiny
  let scrutinyDelta = cards.reduce((s, c) => s + c.risk, 0);
  // Recovery: -1 per refutation this turn (min 0 total delta)
  if (refutationsApplied.length > 0) {
    scrutinyDelta = Math.max(0, scrutinyDelta - refutationsApplied.length);
  }

  // 7. Concerns
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

  // 8. Apply state changes
  state.resistance = Math.max(0, state.resistance - totalDamage);
  state.scrutiny = Math.min(5, state.scrutiny + scrutinyDelta);
  state.turnsRemaining -= 1;
  state.committedTags.push(...cards.map(c => c.tag));
  for (const id of cardIds) state.committedCardIds.add(id);

  // 9. Outcome
  let outcome: TurnResult['outcome'] = 'CONTINUE';
  if (state.scrutiny >= 5) outcome = 'LOSS_SCRUTINY';
  else if (state.resistance <= 0) outcome = 'WIN';
  else if (state.turnsRemaining <= 0) outcome = 'LOSS_TURNS';

  return {
    damage: totalDamage,
    scrutinyAdded: scrutinyDelta,
    concernsAddressed,
    refutationsApplied,
    corroborationBonus,
    blocked: false,
    outcome,
  };
}

// ============================================================================
// Brute-Force All Paths
// ============================================================================

interface PlaySequence {
  turns: string[][];
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
    totalDmg: number,
    totalRisk: number,
  ) {
    if (state.resistance <= 0 || state.turnsRemaining <= 0 || state.scrutiny >= 5) {
      results.push({
        turns: turnsSoFar,
        totalDamage: totalDmg,
        finalResistance: state.resistance,
        finalScrutiny: state.scrutiny,
        turnsUsed: puzzle.turns - state.turnsRemaining,
        won: state.resistance <= 0 && state.scrutiny < 5,
        lostScrutiny: state.scrutiny >= 5,
        blocked: false,
        concernsAddressed: state.addressedConcerns.size,
        countersRefuted: state.counters.filter(c => c.refuted).length,
        totalRisk,
      });
      return;
    }

    const subs = combinations(remainingHand, 1, 3);
    let hadValid = false;

    for (const sub of subs) {
      // Clone state for this branch
      const cloned: GameState = {
        resistance: state.resistance,
        scrutiny: state.scrutiny,
        turnsRemaining: state.turnsRemaining,
        committedTags: [...state.committedTags],
        committedCardIds: new Set(state.committedCardIds),
        addressedConcerns: new Set(state.addressedConcerns),
        counters: state.counters.map(c => ({ ...c })),
      };

      const result = processTurnV2(cloned, sub, puzzle);
      if (result.blocked) continue;

      hadValid = true;
      const subRisk = sub.reduce((s, id) => s + (puzzle.cards.find(c => c.id === id)?.risk ?? 0), 0);
      const newHand = remainingHand.filter(id => !sub.includes(id));

      dfs(
        cloned,
        newHand,
        [...turnsSoFar, sub],
        totalDmg + result.damage,
        totalRisk + subRisk,
      );
    }

    if (!hadValid) {
      results.push({
        turns: turnsSoFar,
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
      });
    }
  }

  dfs(initState(puzzle), puzzle.cards.map(c => c.id), [], 0, 0);
  return results;
}

// ============================================================================
// Naive Path (descending power, one card per turn)
// ============================================================================

function findNaivePath(puzzle: Puzzle): PlaySequence {
  const sorted = [...puzzle.cards].sort((a, b) => b.power - a.power);
  const state = initState(puzzle);
  const turns: string[][] = [];
  let totalDmg = 0;
  let totalRisk = 0;

  for (const card of sorted) {
    if (state.turnsRemaining <= 0 || state.resistance <= 0 || state.scrutiny >= 5) break;

    const cloned: GameState = {
      resistance: state.resistance,
      scrutiny: state.scrutiny,
      turnsRemaining: state.turnsRemaining,
      committedTags: [...state.committedTags],
      committedCardIds: new Set(state.committedCardIds),
      addressedConcerns: new Set(state.addressedConcerns),
      counters: state.counters.map(c => ({ ...c })),
    };

    const result = processTurnV2(cloned, [card.id], puzzle);
    if (result.blocked) continue;

    turns.push([card.id]);
    totalDmg += result.damage;
    totalRisk += card.risk;
    // Apply to real state
    Object.assign(state, {
      resistance: cloned.resistance,
      scrutiny: cloned.scrutiny,
      turnsRemaining: cloned.turnsRemaining,
      committedTags: cloned.committedTags,
      committedCardIds: cloned.committedCardIds,
      addressedConcerns: cloned.addressedConcerns,
      counters: cloned.counters,
    });
  }

  return {
    turns,
    totalDamage: totalDmg,
    finalResistance: state.resistance,
    finalScrutiny: state.scrutiny,
    turnsUsed: puzzle.turns - state.turnsRemaining,
    won: state.resistance <= 0,
    lostScrutiny: state.scrutiny >= 5,
    blocked: false,
    concernsAddressed: state.addressedConcerns.size,
    countersRefuted: state.counters.filter(c => c.refuted).length,
    totalRisk,
  };
}

// ============================================================================
// Test Puzzle: "The Last Slice" v2
// ============================================================================

const THE_LAST_SLICE_V2: Puzzle = {
  name: 'The Last Slice v2',
  resistance: 12,
  turns: 3,
  cards: [
    { id: 'A', power: 4, tag: Tag.ASLEEP, risk: 2, proves: ProofType.ALERTNESS, flavor: 'Sleep tracker' },
    { id: 'B', power: 3, tag: Tag.HOME,   risk: 1, proves: ProofType.LOCATION,  flavor: 'WiFi router log' },
    { id: 'C', power: 2, tag: Tag.HOME,   risk: 0, proves: ProofType.IDENTITY,  refutes: 'counter_C1', flavor: 'Smart lock fingerprint' },
    { id: 'D', power: 3, tag: Tag.ASLEEP, risk: 1, flavor: 'Thermostat schedule' },
    { id: 'E', power: 5, tag: Tag.AWAKE,  risk: 2, proves: ProofType.IDENTITY,  flavor: 'Doorbell camera' },
    { id: 'F', power: 2, tag: Tag.ALONE,  risk: 0, flavor: 'Motion sensor (1 zone)' },
  ],
  counters: [
    { id: 'counter_C1', targets: ['B'], refuted: false },
  ],
  concerns: [
    { id: 'concern_identity',  requiredProof: ProofType.IDENTITY },
    { id: 'concern_location',  requiredProof: ProofType.LOCATION },
    { id: 'concern_alertness', requiredProof: ProofType.ALERTNESS },
  ],
};

// ============================================================================
// Metrics Output
// ============================================================================

function formatPath(seq: PlaySequence): string {
  return seq.turns.map((t, i) => `T${i + 1}:[${t.join('+')}]`).join(' → ');
}

function runAnalysis(puzzle: Puzzle) {
  console.log('V2 Prototype — Simplified Card Schema');
  console.log('======================================\n');

  console.log(`Puzzle: ${puzzle.name}`);
  console.log(`Resistance: ${puzzle.resistance} | Turns: ${puzzle.turns} | Cards: ${puzzle.cards.length}`);
  console.log(`Counters: ${puzzle.counters.length} | Concerns: ${puzzle.concerns.length}\n`);

  console.log('CARDS:');
  for (const c of puzzle.cards) {
    const extras = [
      c.proves ? `proves:${c.proves}` : null,
      c.refutes ? `refutes:${c.refutes}` : null,
    ].filter(Boolean).join(' ');
    console.log(`  ${c.id}: power=${c.power} tag=${c.tag} risk=${c.risk} ${extras} ${c.flavor ? `(${c.flavor})` : ''}`);
  }

  console.log('\nEnumerating all play sequences...');
  const start = Date.now();
  const all = simulateAll(puzzle);
  const elapsed = Date.now() - start;
  console.log(`Found ${all.length} terminal states in ${elapsed}ms\n`);

  const winners = all.filter(s => s.won);
  const losers = all.filter(s => !s.won);
  const blocked = all.filter(s => s.blocked);
  const scrutinyLosses = all.filter(s => s.lostScrutiny);

  // Optimal path
  const optimal = winners.length > 0
    ? winners.reduce((a, b) => a.totalDamage > b.totalDamage ? a : b)
    : null;
  const naive = findNaivePath(puzzle);

  // Near miss
  const nearMiss = all.filter(s => Math.abs(s.totalDamage - puzzle.resistance) <= 3 && !s.blocked);

  // --- KEY NUMBERS ---
  const winRate = (winners.length / all.length) * 100;
  console.log('KEY NUMBERS:');
  console.log(`  optimal_damage:     ${optimal?.totalDamage ?? 'N/A'}`);
  console.log(`  naive_damage:       ${naive.totalDamage}`);
  console.log(`  optimal_naive_gap:  ${optimal ? optimal.totalDamage - naive.totalDamage : 'N/A'}`);
  console.log(`  resistance:         ${puzzle.resistance}`);
  console.log(`  optimal_margin:     ${optimal ? `+${optimal.totalDamage - puzzle.resistance}` : 'N/A'}`);
  console.log(`  naive_gap:          ${puzzle.resistance - naive.totalDamage > 0 ? '+' : ''}${puzzle.resistance - naive.totalDamage} (${naive.won ? 'WINS' : 'LOSES'})`);
  console.log(`  win_rate:           ${winRate.toFixed(1)}% (${winners.length}/${all.length})`);
  console.log(`  near_miss_count:    ${nearMiss.length}`);
  console.log(`  blocked_paths:      ${blocked.length} (${((blocked.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`  scrutiny_losses:    ${scrutinyLosses.length} (${((scrutinyLosses.length / all.length) * 100).toFixed(1)}%)`);

  // --- OPTIMAL PATH ---
  console.log('\n--- OPTIMAL PATH ---');
  if (optimal) {
    console.log(`Path: ${formatPath(optimal)}`);
    console.log(`Damage: ${optimal.totalDamage} | Scrutiny: ${optimal.finalScrutiny} | Risk: ${optimal.totalRisk}`);
    console.log(`Concerns: ${optimal.concernsAddressed}/${puzzle.concerns.length} | Refuted: ${optimal.countersRefuted}/${puzzle.counters.length}`);
  } else {
    console.log('NO WINNING PATH FOUND');
  }

  console.log('\n--- NAIVE PATH ---');
  console.log(`Path: ${formatPath(naive)}`);
  console.log(`Damage: ${naive.totalDamage} | Scrutiny: ${naive.finalScrutiny} | Risk: ${naive.totalRisk}`);
  console.log(`Won: ${naive.won}`);

  // --- DAMAGE DISTRIBUTION ---
  const dmg = all.map(s => s.totalDamage).sort((a, b) => a - b);
  const pct = (p: number) => dmg[Math.floor(dmg.length * p)]!;
  const rPct = ((dmg.filter(d => d < puzzle.resistance).length / dmg.length) * 100).toFixed(0);
  console.log('\nDAMAGE DISTRIBUTION:');
  console.log(`  p10=${pct(0.1)} p25=${pct(0.25)} p50=${pct(0.5)} p75=${pct(0.75)} p90=${pct(0.9)}`);
  console.log(`  min=${dmg[0]} max=${dmg[dmg.length - 1]}`);
  console.log(`  resistance_percentile: P${rPct}`);

  // --- SCRUTINY DISTRIBUTION ---
  const scrutinyCounts = [0, 0, 0, 0, 0, 0];
  for (const s of all) scrutinyCounts[s.finalScrutiny]!++;
  console.log('\nSCRUTINY DISTRIBUTION:');
  for (let i = 0; i <= 5; i++) {
    const p = ((scrutinyCounts[i]! / all.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(p) / 2));
    console.log(`  scrutiny=${i}: ${p.padStart(5)}% ${bar} (${scrutinyCounts[i]})`);
  }
  console.log(`  scrutiny_loss_rate: ${((scrutinyLosses.length / all.length) * 100).toFixed(1)}%`);

  // --- CLEAN SWEEPS ---
  const cleanSweeps = all.filter(s =>
    s.won && s.finalScrutiny === 0 && s.totalRisk === 0 &&
    s.concernsAddressed === puzzle.concerns.length
  );
  console.log(`\nCLEAN SWEEPS (win + 0 scrutiny + 0 risk + all concerns):`);
  console.log(`  count: ${cleanSweeps.length}/${winners.length} winning paths (${winners.length > 0 ? ((cleanSweeps.length / winners.length) * 100).toFixed(1) : 0}%)`);

  // --- COUNTER INTERACTIONS ---
  const counterFiredPaths = all.filter(s => {
    return s.turns.flat().some(id => puzzle.counters.some(c => c.targets.includes(id)));
  });
  const refutedPaths = all.filter(s => s.countersRefuted > 0);
  console.log('\nCOUNTER INTERACTIONS:');
  console.log(`  paths_touching_counter_target: ${counterFiredPaths.length}/${all.length} (${((counterFiredPaths.length / all.length) * 100).toFixed(1)}%)`);
  console.log(`  paths_with_refutation: ${refutedPaths.length}/${all.length} (${((refutedPaths.length / all.length) * 100).toFixed(1)}%)`);

  // --- CORROBORATION ---
  const corrobPaths = all.filter(s => {
    const usedCards = s.turns.flat().map(id => puzzle.cards.find(c => c.id === id)!);
    const rawSum = usedCards.reduce((sum, c) => sum + c.power, 0);
    return s.totalDamage > rawSum;
  });
  console.log(`\nCORROBORATION:`);
  console.log(`  paths_with_bonus: ${corrobPaths.length}/${all.length} (${((corrobPaths.length / all.length) * 100).toFixed(1)}%)`);
  if (winners.length > 0) {
    const corrobWins = corrobPaths.filter(s => s.won);
    const neededBonus = corrobWins.filter(s => {
      const raw = s.turns.flat().map(id => puzzle.cards.find(c => c.id === id)!).reduce((sum, c) => sum + c.power, 0);
      return raw < puzzle.resistance;
    });
    console.log(`  wins_needing_bonus: ${neededBonus.length}`);
  }

  // Tag pairs for corroboration
  const tagPairs = new Map<Tag, string[]>();
  for (const c of puzzle.cards) {
    if (!tagPairs.has(c.tag)) tagPairs.set(c.tag, []);
    tagPairs.get(c.tag)!.push(c.id);
  }
  console.log(`  corroboration_groups:`);
  for (const [tag, ids] of tagPairs) {
    if (ids.length >= 2) console.log(`    ${tag}: [${ids.join(', ')}]`);
  }

  // --- TAG LOCK ANALYSIS ---
  const tagAxes = [[Tag.ASLEEP, Tag.AWAKE], [Tag.HOME, Tag.AWAY], [Tag.ALONE, Tag.ACCOMPANIED], [Tag.IDLE, Tag.ACTIVE]] as const;
  console.log(`\nTAG LOCK ANALYSIS:`);
  for (const [t1, t2] of tagAxes) {
    const cards1 = puzzle.cards.filter(c => c.tag === t1);
    const cards2 = puzzle.cards.filter(c => c.tag === t2);
    if (cards1.length === 0 && cards2.length === 0) continue;
    const power1 = cards1.reduce((s, c) => s + c.power, 0);
    const power2 = cards2.reduce((s, c) => s + c.power, 0);
    const proves1 = cards1.filter(c => c.proves).map(c => c.proves!);
    const proves2 = cards2.filter(c => c.proves).map(c => c.proves!);
    console.log(`  ${t1} vs ${t2}:`);
    console.log(`    ${t1}: ${cards1.length} cards, total power=${power1}, proves=[${proves1.join(',')}]`);
    console.log(`    ${t2}: ${cards2.length} cards, total power=${power2}, proves=[${proves2.join(',')}]`);
    // How many paths chose each side?
    const chose1 = all.filter(s => s.turns.flat().some(id => cards1.some(c => c.id === id)));
    const chose2 = all.filter(s => s.turns.flat().some(id => cards2.some(c => c.id === id)));
    const choseBoth = all.filter(s => {
      const ids = s.turns.flat();
      return ids.some(id => cards1.some(c => c.id === id)) && ids.some(id => cards2.some(c => c.id === id));
    });
    console.log(`    chose_${t1}: ${chose1.length} | chose_${t2}: ${chose2.length} | chose_both: ${choseBoth.length} (blocked)`);
  }

  // --- CARD ROLES ---
  console.log(`\nCARD ROLES:`);
  for (const c of [...puzzle.cards].sort((a, b) => b.power - a.power)) {
    const inWins = winners.filter(w => w.turns.flat().includes(c.id)).length;
    const inLosses = losers.filter(l => l.turns.flat().includes(c.id)).length;
    const winPct = winners.length > 0 ? ((inWins / winners.length) * 100).toFixed(0) : '0';
    const lossPct = losers.length > 0 ? ((inLosses / losers.length) * 100).toFixed(0) : '0';
    const opposite = OPPOSING.get(c.tag);
    const locksOut = opposite ? puzzle.cards.filter(o => o.tag === opposite).map(o => o.id) : [];

    console.log(`  ${c.id} (power=${c.power} tag=${c.tag} risk=${c.risk})`);
    console.log(`    in_wins: ${winPct}% | in_losses: ${lossPct}%`);
    if (locksOut.length > 0) console.log(`    locks_out: [${locksOut.join(', ')}]`);
    if (c.proves) console.log(`    proves: ${c.proves}`);
    if (c.refutes) console.log(`    refutes: ${c.refutes}`);
  }

  // --- RESISTANCE SWEEP ---
  console.log(`\nRESISTANCE SWEEP:`);
  const maxDmg = dmg[dmg.length - 1]!;
  const naiveDmg = naive.totalDamage;
  const testR = [
    Math.max(1, naiveDmg - 3), naiveDmg, naiveDmg + 2, naiveDmg + 4,
    puzzle.resistance,
    Math.floor((maxDmg + naiveDmg) / 2),
    maxDmg - 3, maxDmg,
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  for (const r of testR) {
    const winsAtR = dmg.filter(d => d >= r).length;
    const rate = ((winsAtR / dmg.length) * 100).toFixed(1);
    const marker = r === puzzle.resistance ? ' ← CURRENT' : '';
    const naiveWins = naiveDmg >= r ? ' (naive WINS)' : '';
    console.log(`  resistance=${String(r).padStart(3)}: ${rate.padStart(5)}% win rate${naiveWins}${marker}`);
  }

  // --- COMPARISON SUMMARY ---
  console.log('\n======================================');
  console.log('  V1 vs V2 COMPARISON');
  console.log('======================================');
  console.log('                     V1 (old)    V2 (new)');
  console.log(`  Win rate:          89.6%       ${winRate.toFixed(1)}%`);
  console.log(`  Scrutiny losses:   0.0%        ${((scrutinyLosses.length / all.length) * 100).toFixed(1)}%`);
  console.log(`  Clean sweeps:      764         ${cleanSweeps.length}`);
  console.log(`  Blocked paths:     0           ${blocked.length}`);
  console.log(`  Near-miss paths:   2501        ${nearMiss.length}`);
  console.log(`  Naive wins:        YES         ${naive.won ? 'YES' : 'NO'}`);
  console.log(`  Optimal margin:    +29         ${optimal ? `+${optimal.totalDamage - puzzle.resistance}` : 'N/A'}`);
  console.log('');
}

runAnalysis(THE_LAST_SLICE_V2);
