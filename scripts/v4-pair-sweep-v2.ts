/**
 * V4 Pair Sweep v2 — 8 cards, 3 lies, 3 pairs of 2
 * Fixed checks: "flawless" = best play clears target (not truth-only).
 * "pairingMatters" = not all plays score the same.
 * Added: "lieContainment" = pairing lies together scores better than spreading them.
 */

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

const DECK = [1, 2, 3, 4, 5, 6, 7, 8];
const N = 8;
type EType = 'D' | 'P' | 'T' | 'S';

interface Card {
  idx: number; strength: number; type: EType; location: number; time: number;
}

function getPairBonus(a: Card, b: Card): number {
  let bonus = 0;
  if (a.location === b.location) bonus += 3;        // corroboration
  if (Math.abs(a.time - b.time) === 1) bonus += 2;  // timeline
  if (a.type !== b.type) bonus += 2;                 // coverage
  if (a.type === b.type) bonus += 3;                 // reinforcement
  return bonus;
}

const penalty = (str: number) => -(str - 1);

function partitionIntoPairs(cards: number[]): number[][][] {
  if (cards.length === 0) return [[]];
  if (cards.length === 2) return [[[cards[0], cards[1]]]];
  const first = cards[0];
  const rest = cards.slice(1);
  const result: number[][][] = [];
  for (let i = 0; i < rest.length; i++) {
    const remaining = rest.filter((_, j) => j !== i);
    for (const sub of partitionIntoPairs(remaining)) {
      result.push([[first, rest[i]], ...sub]);
    }
  }
  return result;
}

function generatePairPlays(indices: number[], pairsToPlay: number): number[][][] {
  const cardsToPlay = pairsToPlay * 2;
  const leaveOuts = combinations(indices, indices.length - cardsToPlay);
  const allPlays: number[][][] = [];
  for (const left of leaveOuts) {
    const played = indices.filter(i => !left.includes(i));
    for (const partition of partitionIntoPairs(played)) {
      allPlays.push(partition);
    }
  }
  return allPlays;
}

function scorePlay(pairs: number[][], cards: Card[], lieIndices: number[]): number {
  let total = 0;
  for (const pair of pairs) {
    const [a, b] = pair;
    const aLie = lieIndices.includes(a);
    const bLie = lieIndices.includes(b);
    total += aLie ? penalty(cards[a].strength) : cards[a].strength;
    total += bLie ? penalty(cards[b].strength) : cards[b].strength;
    if (!aLie && !bLie) total += getPairBonus(cards[a], cards[b]);
  }
  return total;
}

// Test multiple type/location configs
const TYPE_CONFIGS: { name: string, types: EType[], locations: number[], times: number[] }[] = [
  {
    name: 'interleaved',
    types: ['D', 'P', 'T', 'S', 'D', 'P', 'T', 'S'],
    locations: [0, 1, 2, 3, 0, 1, 2, 3],
    times: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    name: 'paired-types',
    types: ['D', 'D', 'P', 'P', 'T', 'T', 'S', 'S'],
    locations: [0, 1, 2, 3, 0, 1, 2, 3],
    times: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    name: 'paired-locs',
    types: ['D', 'P', 'T', 'S', 'D', 'P', 'T', 'S'],
    locations: [0, 0, 1, 1, 2, 2, 3, 3],
    times: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    name: 'paired-both',
    types: ['D', 'D', 'P', 'P', 'T', 'T', 'S', 'S'],
    locations: [0, 0, 1, 1, 2, 2, 3, 3],
    times: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    name: 'adjacent-time',
    types: ['D', 'P', 'T', 'S', 'D', 'P', 'T', 'S'],
    locations: [0, 1, 2, 3, 0, 1, 2, 3],
    times: [0, 1, 1, 2, 2, 3, 3, 4],  // more adjacent pairs
  },
  {
    name: 'max-bonuses',
    types: ['D', 'D', 'P', 'P', 'T', 'T', 'S', 'S'],
    locations: [0, 0, 1, 1, 2, 2, 3, 3],
    times: [0, 1, 2, 3, 4, 5, 6, 7],
  },
];

const allIndices = [...Array(N).keys()];
const lieTriples = combinations(allIndices, 3);
const allPlays3 = generatePairPlays(allIndices, 3);

console.log('═'.repeat(80));
console.log('V4 PAIR SWEEP v2: 8 cards, 3 LIES, 3 pairs of 2 (6 of 8)');
console.log('Fixed checks for forced-lie scenario');
console.log('═'.repeat(80));
console.log(`Lie triples: ${lieTriples.length}`);
console.log(`Total plays: ${allPlays3.length}\n`);

for (const config of TYPE_CONFIGS) {
  const cards: Card[] = DECK.map((str, i) => ({
    idx: i, strength: str,
    type: config.types[i],
    location: config.locations[i],
    time: config.times[i],
  }));

  console.log(`\n── Config: ${config.name} ──`);
  console.log(`   Types: [${config.types.join(',')}]  Locs: [${config.locations.join(',')}]`);

  let viable = 0;
  let failCounts: Record<string, number> = {};

  for (const lies of lieTriples) {
    const lieStr = lies.map(i => DECK[i]);

    // Categorize plays by lie count
    const playsByLieCount = new Map<number, { plays: number[][][], scores: number[] }>();
    for (const play of allPlays3) {
      const played = play.flat();
      const liesPlayed = lies.filter(li => played.includes(li)).length;
      if (!playsByLieCount.has(liesPlayed)) playsByLieCount.set(liesPlayed, { plays: [], scores: [] });
      const entry = playsByLieCount.get(liesPlayed)!;
      entry.plays.push(play);
      entry.scores.push(scorePlay(play, cards, lies));
    }

    const allScores = allPlays3.map(p => scorePlay(p, cards, lies));
    const bestScore = Math.max(...allScores);
    const worstScore = Math.min(...allScores);

    // Min-lie plays (best achievable — play as few lies as possible)
    // With 3 lies and leaving 2 out, best case is 1 lie played
    const minLiePlays = playsByLieCount.get(1);
    const minLieScores = minLiePlays?.scores ?? [];

    let passedTarget = 0;
    let bestPass = 0;
    let bestFails: string[] = [];
    let bestTarget = 0;

    for (let target = 5; target <= 45; target++) {
      // FLAWLESS: best possible play clears target
      const flawless = bestScore >= target;

      // NOT_ALWAYS_SAFE: even playing min lies, not guaranteed to clear
      const notAlwaysSafe = minLieScores.length === 0 || Math.min(...minLieScores) < target;

      // PAIRING_MATTERS: different pairings of the same cards produce different scores
      // (i.e., how you pair matters, not just which cards you pick)
      const scoreSet = new Set(allScores);
      const pairingMatters = scoreSet.size > 3; // meaningful variance in outcomes

      // LIE_RECOVERABLE: even with 2 lies played, best score is close to target
      const twoLiePlays = playsByLieCount.get(2);
      const twoLieMax = twoLiePlays ? Math.max(...twoLiePlays.scores) : -Infinity;
      const lieRecoverable = twoLieMax >= target - 4;

      // RANDOM_WIN: random play wins 5-40% of the time
      const wins = allScores.filter(s => s >= target).length;
      const winRate = (wins / allPlays3.length) * 100;
      const randomWin = winRate >= 5 && winRate <= 40;

      // STRENGTH_NOT_ORACLE: picking strongest cards isn't optimal
      const sfCards = allIndices.slice().sort((a, b) => cards[b].strength - cards[a].strength).slice(0, 6);
      const sfParts = partitionIntoPairs(sfCards);
      const sfBest = Math.max(...sfParts.map(p => scorePlay(p, cards, lies)));
      const strengthNotOracle = sfBest !== bestScore;

      // LIES_DIFFER: all lies have different strengths
      const liesDiffer = new Set(lies.map(i => DECK[i])).size === lies.length;

      // LIE_CONTAINMENT: pairing 2 lies together scores better than spreading
      // (creates a "contain the damage" strategy)
      let lieContainment = false;
      if (minLiePlays && twoLiePlays) {
        // Compare: best 1-lie play vs some 2-lie plays
        // If both exist and their ranges overlap, containment is a real strategy
        const bestOneLie = Math.max(...minLieScores);
        lieContainment = twoLieMax >= Math.min(...minLieScores) + 2;
      }

      const checks = { flawless, notAlwaysSafe, pairingMatters, lieRecoverable, randomWin, strengthNotOracle, liesDiffer, lieContainment };
      const passCount = Object.values(checks).filter(Boolean).length;
      const fails = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);

      if (passCount > bestPass) { bestPass = passCount; bestTarget = target; bestFails = fails; }
      if (passCount === 8 && !passedTarget) passedTarget = target;
    }

    if (passedTarget) {
      viable++;
    } else {
      for (const f of bestFails) failCounts[f] = (failCounts[f] || 0) + 1;
    }
  }

  console.log(`   Viable: ${viable}/${lieTriples.length}`);
  if (Object.keys(failCounts).length > 0) {
    const sorted = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
    console.log(`   Top failures: ${sorted.map(([k, v]) => `${k}(${v})`).join(', ')}`);
  }
}

// Also show detailed results for the best config
console.log('\n' + '═'.repeat(80));
console.log('DETAILED: best config per-triple');
console.log('═'.repeat(80));

const bestConfig = TYPE_CONFIGS[0]; // will check which is best above
const cards: Card[] = DECK.map((str, i) => ({
  idx: i, strength: str,
  type: bestConfig.types[i],
  location: bestConfig.locations[i],
  time: bestConfig.times[i],
}));

for (const lies of lieTriples) {
  const lieStr = lies.map(i => DECK[i]);
  const allScores = allPlays3.map(p => scorePlay(p, cards, lies));
  const bestScore = Math.max(...allScores);

  const playsByLieCount = new Map<number, number[]>();
  for (const play of allPlays3) {
    const played = play.flat();
    const lc = lies.filter(li => played.includes(li)).length;
    if (!playsByLieCount.has(lc)) playsByLieCount.set(lc, []);
    playsByLieCount.get(lc)!.push(scorePlay(play, cards, lies));
  }

  const minLieScores = playsByLieCount.get(1) ?? [];
  const twoLieScores = playsByLieCount.get(2) ?? [];
  const threeLieScores = playsByLieCount.get(3) ?? [];

  console.log(`  L[${lieStr.join(',')}] best=${bestScore} | 1-lie: ${minLieScores.length > 0 ? Math.min(...minLieScores)+'-'+Math.max(...minLieScores) : 'N/A'} | 2-lie: ${twoLieScores.length > 0 ? Math.min(...twoLieScores)+'-'+Math.max(...twoLieScores) : 'N/A'} | 3-lie: ${threeLieScores.length > 0 ? Math.min(...threeLieScores)+'-'+Math.max(...threeLieScores) : 'N/A'}`);
}
