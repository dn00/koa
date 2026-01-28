/**
 * Debug pair play with 3 lies instead of 2.
 * 8 cards, 3 lies, play 3 pairs of 2 (6 of 8).
 * With 3 lies and 5 truths, player can't always avoid all lies
 * when playing 6 cards (must play at least 1 lie).
 *
 * Also test: 8 cards, 2 lies, play 2 pairs of 2 (4 of 8).
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
  if (a.location === b.location) bonus += 3;
  if (Math.abs(a.time - b.time) === 1) bonus += 2;
  if (a.type !== b.type) bonus += 2;
  if (a.type === b.type) bonus += 3;
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

const cards: Card[] = DECK.map((str, i) => ({
  idx: i, strength: str,
  type: (['D', 'P', 'T', 'S', 'D', 'P', 'T', 'S'] as EType[])[i],
  location: [0, 1, 2, 3, 0, 1, 2, 3][i],
  time: i,
}));

const allIndices = [...Array(N).keys()];

// ========== SCENARIO A: 3 lies, play 3 pairs ==========
console.log('═'.repeat(80));
console.log('SCENARIO A: 8 cards, 3 LIES, play 3 pairs of 2 (6 of 8)');
console.log('5 truths, 3 lies — must play at least 1 lie');
console.log('═'.repeat(80));

const lieTriples = combinations(allIndices, 3);
console.log(`Lie triples: ${lieTriples.length}`);

const allPlays3 = generatePairPlays(allIndices, 3);
console.log(`Total plays: ${allPlays3.length}\n`);

let aViable = 0;
for (const lies of lieTriples.slice(0, 15)) {
  const lieStr = lies.map(i => DECK[i]);
  const truthIndices = allIndices.filter(i => !lies.includes(i));

  // Truth-only plays: all played cards are truths
  const truthPlays = allPlays3.filter(play =>
    lies.every(li => !play.flat().includes(li))
  );
  const truthScores = truthPlays.map(p => scorePlay(p, cards, lies));

  // One-lie plays
  const oneLiePlays = allPlays3.filter(play => {
    const played = play.flat();
    return lies.filter(li => played.includes(li)).length === 1;
  });
  const oneLieScores = oneLiePlays.map(p => scorePlay(p, cards, lies));

  const allScores = allPlays3.map(p => scorePlay(p, cards, lies));

  console.log(`  Lies [${lieStr.join(',')}]: truth-only=${truthPlays.length} plays, scores ${truthScores.length > 0 ? Math.min(...truthScores) + '-' + Math.max(...truthScores) : 'N/A'} | one-lie scores: ${oneLieScores.length > 0 ? Math.min(...oneLieScores) + '-' + Math.max(...oneLieScores) : 'N/A'} | all: ${Math.min(...allScores)}-${Math.max(...allScores)}`);

  // Find best target
  let bestTarget = 0;
  let bestPass = 0;
  let bestFails: string[] = [];

  for (let target = 5; target <= 45; target++) {
    const flawless = truthScores.length > 0 && Math.max(...truthScores) >= target;
    const notAlwaysSafe = truthScores.length === 0 || Math.min(...truthScores) < target;
    const clearCount = truthScores.filter(s => s >= target).length;
    const pairingMatters = clearCount > 0 && clearCount < truthPlays.length;
    const lieRecoverable = oneLieScores.length > 0 && Math.max(...oneLieScores) >= target - 2;
    const wins = allScores.filter(s => s >= target).length;
    const winRate = (wins / allPlays3.length) * 100;
    const randomWin = winRate >= 5 && winRate <= 40;

    const sfCards = allIndices.slice().sort((a, b) => cards[b].strength - cards[a].strength).slice(0, 6);
    const sfParts = partitionIntoPairs(sfCards);
    const sfBest = Math.max(...sfParts.map(p => scorePlay(p, cards, lies)));
    const oracle = Math.max(...allScores);
    const strengthNotOracle = sfBest !== oracle;

    const liesDiffer = new Set(lies.map(i => DECK[i])).size === lies.length;

    const checks = { flawless, notAlwaysSafe, pairingMatters, lieRecoverable, randomWin, strengthNotOracle, liesDiffer };
    const passCount = Object.values(checks).filter(Boolean).length;
    const fails = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);

    if (passCount > bestPass) {
      bestPass = passCount;
      bestTarget = target;
      bestFails = fails;
    }
    if (passCount === 7) {
      aViable++;
      console.log(`    ★ ALL PASS at target=${target} winRate=${winRate.toFixed(1)}%`);
      break;
    }
  }
  if (bestPass < 7) {
    console.log(`    Best: ${bestPass}/7 at target=${bestTarget} FAIL: ${bestFails.join(', ')}`);
  }
}

console.log(`\n  Viable (from first 15 triples): ${aViable}`);

// ========== SCENARIO B: 2 lies, play 2 pairs (4 of 8) ==========
console.log('\n' + '═'.repeat(80));
console.log('SCENARIO B: 8 cards, 2 LIES, play 2 pairs of 2 (4 of 8)');
console.log('6 truths, 2 lies — leave 4 cards unplayed');
console.log('═'.repeat(80));

const liePairs = combinations(allIndices, 2) as [number, number][];
const allPlays2 = generatePairPlays(allIndices, 2);
console.log(`Lie pairs: ${liePairs.length}`);
console.log(`Total plays: ${allPlays2.length}\n`);

let bViable = 0;
for (const liePair of liePairs) {
  const lieStr = liePair.map(i => DECK[i]);

  const truthPlays = allPlays2.filter(play =>
    liePair.every(li => !play.flat().includes(li))
  );
  const truthScores = truthPlays.map(p => scorePlay(p, cards, liePair));

  const oneLiePlays = allPlays2.filter(play => {
    const played = play.flat();
    return liePair.filter(li => played.includes(li)).length === 1;
  });
  const oneLieScores = oneLiePlays.map(p => scorePlay(p, cards, liePair));

  const allScores = allPlays2.map(p => scorePlay(p, cards, liePair));

  let bestTarget = 0;
  let bestPass = 0;
  let bestFails: string[] = [];
  let passedTarget = 0;

  for (let target = 5; target <= 40; target++) {
    const flawless = truthScores.length > 0 && Math.max(...truthScores) >= target;
    const notAlwaysSafe = truthScores.length === 0 || Math.min(...truthScores) < target;
    const clearCount = truthScores.filter(s => s >= target).length;
    const pairingMatters = clearCount > 0 && clearCount < truthPlays.length;
    const lieRecoverable = oneLieScores.length > 0 && Math.max(...oneLieScores) >= target - 2;
    const wins = allScores.filter(s => s >= target).length;
    const winRate = (wins / allPlays2.length) * 100;
    const randomWin = winRate >= 5 && winRate <= 40;

    const sfCards = allIndices.slice().sort((a, b) => cards[b].strength - cards[a].strength).slice(0, 4);
    const sfParts = partitionIntoPairs(sfCards);
    const sfBest = Math.max(...sfParts.map(p => scorePlay(p, cards, liePair)));
    const oracle = Math.max(...allScores);
    const strengthNotOracle = sfBest !== oracle;

    const liesDiffer = new Set(liePair.map(i => DECK[i])).size === liePair.length;

    const checks = { flawless, notAlwaysSafe, pairingMatters, lieRecoverable, randomWin, strengthNotOracle, liesDiffer };
    const passCount = Object.values(checks).filter(Boolean).length;
    const fails = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);

    if (passCount > bestPass) {
      bestPass = passCount;
      bestTarget = target;
      bestFails = fails;
    }
    if (passCount === 7 && !passedTarget) {
      passedTarget = target;
    }
  }

  if (passedTarget) {
    bViable++;
    console.log(`  L[${lieStr.join(',')}] ★ PASS at target=${passedTarget}`);
  } else {
    console.log(`  L[${lieStr.join(',')}]   ${bestPass}/7 at target=${bestTarget} FAIL: ${bestFails.join(', ')}`);
  }
}

console.log(`\n  Viable: ${bViable}/${liePairs.length}`);

// ========== SCENARIO C: 3 lies, play 2 pairs (4 of 8) ==========
console.log('\n' + '═'.repeat(80));
console.log('SCENARIO C: 8 cards, 3 LIES, play 2 pairs of 2 (4 of 8)');
console.log('5 truths, 3 lies — leave 4 unplayed');
console.log('═'.repeat(80));

let cViable = 0;
for (const lies of lieTriples) {
  const lieStr = lies.map(i => DECK[i]);

  const truthPlays = allPlays2.filter(play =>
    lies.every(li => !play.flat().includes(li))
  );
  const truthScores = truthPlays.map(p => scorePlay(p, cards, lies));

  const oneLiePlays = allPlays2.filter(play => {
    const played = play.flat();
    return lies.filter(li => played.includes(li)).length === 1;
  });
  const oneLieScores = oneLiePlays.map(p => scorePlay(p, cards, lies));

  const allScores = allPlays2.map(p => scorePlay(p, cards, lies));

  let passedTarget = 0;
  let bestPass = 0;
  let bestFails: string[] = [];
  let bestTarget = 0;

  for (let target = 5; target <= 40; target++) {
    const flawless = truthScores.length > 0 && Math.max(...truthScores) >= target;
    const notAlwaysSafe = truthScores.length === 0 || Math.min(...truthScores) < target;
    const clearCount = truthScores.filter(s => s >= target).length;
    const pairingMatters = clearCount > 0 && clearCount < truthPlays.length;
    const lieRecoverable = oneLieScores.length > 0 && Math.max(...oneLieScores) >= target - 2;
    const wins = allScores.filter(s => s >= target).length;
    const winRate = (wins / allPlays2.length) * 100;
    const randomWin = winRate >= 5 && winRate <= 40;

    const sfCards = allIndices.slice().sort((a, b) => cards[b].strength - cards[a].strength).slice(0, 4);
    const sfParts = partitionIntoPairs(sfCards);
    const sfBest = Math.max(...sfParts.map(p => scorePlay(p, cards, lies)));
    const oracle = Math.max(...allScores);
    const strengthNotOracle = sfBest !== oracle;

    const liesDiffer = new Set(lies.map(i => DECK[i])).size === lies.length;

    const checks = { flawless, notAlwaysSafe, pairingMatters, lieRecoverable, randomWin, strengthNotOracle, liesDiffer };
    const passCount = Object.values(checks).filter(Boolean).length;
    const fails = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);

    if (passCount > bestPass) { bestPass = passCount; bestTarget = target; bestFails = fails; }
    if (passCount === 7 && !passedTarget) passedTarget = target;
  }

  if (passedTarget) cViable++;
}

console.log(`  Viable: ${cViable}/${lieTriples.length}`);

// Summary
console.log('\n' + '═'.repeat(80));
console.log('SUMMARY');
console.log('═'.repeat(80));
console.log(`  A: 8 cards, 3 lies, 3 pairs → ${aViable}/15+ viable`);
console.log(`  B: 8 cards, 2 lies, 2 pairs → ${bViable}/${liePairs.length} viable`);
console.log(`  C: 8 cards, 3 lies, 2 pairs → ${cViable}/${lieTriples.length} viable`);
