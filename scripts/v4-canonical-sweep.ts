/**
 * Canonical Deck Sweep v3 — includes strength 6, tests [1,2,3,4,5,6] specifically
 * and sweeps all 6-card distributions with strengths 1-6.
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

function evaluate(
  strengths: number[],
  lieIndices: [number, number],
  stealthIdx: number,
  hintGroup: number[],
  target: number
): Record<string, boolean> {
  const hintLieIdx = lieIndices.find(i => i !== stealthIdx)!;
  const truthIndices = [0,1,2,3,4,5].filter(i => !lieIndices.includes(i));
  const truthStrengths = truthIndices.map(i => strengths[i]);
  const lieStrengths = lieIndices.map(i => strengths[i]);
  const stealthStr = strengths[stealthIdx];

  const truthCombos = combinations(truthStrengths, 3);
  const truthComboSums = truthCombos.map(c => c.reduce((a, b) => a + b, 0));
  const minTruthSum = Math.min(...truthComboSums);
  const maxTruthSum = Math.max(...truthComboSums);

  const flawless = maxTruthSum >= target;
  const notAlwaysSafe = minTruthSum < target;
  const clearCount = truthComboSums.filter(s => s >= target).length;
  const seqMatters = clearCount > 0 && clearCount < truthCombos.length;

  const bestLieRecovery = lieIndices.map(li => {
    const remaining = truthStrengths.slice().sort((a, b) => b - a);
    return -(strengths[li] - 1) + remaining[0] + remaining[1];
  });
  const lieRecoverable = bestLieRecovery.some(score => score >= target - 2);

  const allPerms: number[][] = [];
  for (let a = 0; a < 6; a++)
    for (let b = 0; b < 6; b++)
      for (let c = 0; c < 6; c++)
        if (a !== b && b !== c && a !== c)
          allPerms.push([a, b, c]);

  let wins = 0;
  for (const perm of allPerms) {
    let score = 0;
    for (const idx of perm) {
      if (lieIndices.includes(idx)) score -= (strengths[idx] - 1);
      else score += strengths[idx];
    }
    if (score >= target) wins++;
  }
  const randomWinRate = (wins / allPerms.length) * 100;
  const randomWin = randomWinRate >= 10 && randomWinRate <= 40;

  const sorted = [...Array(6).keys()].sort((a, b) => strengths[b] - strengths[a]);
  const strengthFirstSeq = sorted.slice(0, 3);
  let sfScore = 0;
  for (const idx of strengthFirstSeq) {
    if (lieIndices.includes(idx)) sfScore -= (strengths[idx] - 1);
    else sfScore += strengths[idx];
  }
  const oracleScore = truthStrengths.slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
  const strengthNotOracle = sfScore !== oracleScore;

  const avgLie = lieStrengths.reduce((a, b) => a + b, 0) / lieStrengths.length;
  const avgTruth = truthStrengths.reduce((a, b) => a + b, 0) / truthStrengths.length;
  const liesTempting = avgLie > avgTruth;

  const worstLieT1 = Math.min(...lieIndices.map(li => {
    const remaining = truthStrengths.slice().sort((a, b) => b - a);
    return -(strengths[li] - 1) + remaining[0] + remaining[1];
  }));
  const worstNotKO = worstLieT1 >= target - 4;

  const allSorted = strengths.slice().sort((a, b) => a - b);
  const median = (allSorted[2] + allSorted[3]) / 2;
  const stealthTempting = stealthStr >= median;

  const liesDiffer = lieStrengths[0] !== lieStrengths[1];

  return {
    flawless, notAlwaysSafe, seqMatters, lieRecoverable, randomWin,
    strengthNotOracle, liesTempting, worstNotKO, stealthTempting, liesDiffer,
  };
}

const liePairs = combinations([0,1,2,3,4,5], 2) as [number, number][];
const hintGroups = combinations([0,1,2,3,4,5], 3);

// First: test [1,2,3,4,5,6] specifically and exhaustively
console.log('═'.repeat(70));
console.log('DEEP ANALYSIS: [1, 2, 3, 4, 5, 6]');
console.log('═'.repeat(70));

const PERFECT = [1, 2, 3, 4, 5, 6];
let totalViable = 0;
const viablePairs = new Set<string>();
const pairInfo: Record<string, { targets: number[], stealths: number[] }> = {};

for (const liePair of liePairs) {
  for (const stealthIdx of liePair) {
    const hintLieIdx = liePair.find(i => i !== stealthIdx)!;
    const validHintGroups = hintGroups.filter(hg =>
      hg.includes(hintLieIdx) && !hg.includes(stealthIdx) &&
      hg.filter(i => !liePair.includes(i)).length >= 1
    );

    for (const hg of validHintGroups) {
      for (let target = 1; target <= 25; target++) {
        const checks = evaluate(PERFECT, liePair, stealthIdx, hg, target);
        const allPass = Object.values(checks).every(Boolean);
        if (allPass) {
          totalViable++;
          const key = liePair.join(',');
          viablePairs.add(key);
          if (!pairInfo[key]) pairInfo[key] = { targets: [], stealths: [] };
          if (!pairInfo[key].targets.includes(target)) pairInfo[key].targets.push(target);
          if (!pairInfo[key].stealths.includes(stealthIdx)) pairInfo[key].stealths.push(stealthIdx);
        }
      }
    }
  }

  // Also show WHY each pair fails (if it does)
  const key = liePair.join(',');
  if (!viablePairs.has(key)) {
    // Check what fails at the "best" target
    const truthIndices = [0,1,2,3,4,5].filter(i => !liePair.includes(i));
    const truthStr = truthIndices.map(i => PERFECT[i]);
    const lieStr = liePair.map(i => PERFECT[i]);

    // Try each target and show which checks fail
    let bestTarget = 0;
    let bestPassCount = 0;
    let bestFailures: string[] = [];

    for (let target = 1; target <= 25; target++) {
      for (const stealthIdx of liePair) {
        const hintLieIdx = liePair.find(i => i !== stealthIdx)!;
        const validHGs = hintGroups.filter(hg =>
          hg.includes(hintLieIdx) && !hg.includes(stealthIdx) &&
          hg.filter(i => !liePair.includes(i)).length >= 1
        );
        for (const hg of validHGs) {
          const checks = evaluate(PERFECT, liePair, stealthIdx, hg, target);
          const passCount = Object.values(checks).filter(Boolean).length;
          if (passCount > bestPassCount) {
            bestPassCount = passCount;
            bestTarget = target;
            bestFailures = Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k);
          }
        }
      }
    }

    console.log(`  FAIL L[${lieStr.join(',')}] T[${truthStr.join(',')}]  best: ${bestPassCount}/10 at target=${bestTarget}  fails: [${bestFailures.join(', ')}]`);
  }
}

console.log(`\nViable lie pairs: ${viablePairs.size}/15  Total configs: ${totalViable}\n`);

for (const [key, info] of Object.entries(pairInfo)) {
  const [a, b] = key.split(',').map(Number);
  const truthIndices = [0,1,2,3,4,5].filter(i => i !== a && i !== b);
  console.log(`  PASS L[${PERFECT[a]},${PERFECT[b]}] T[${truthIndices.map(i => PERFECT[i]).join(',')}]  targets: ${info.targets.sort((a,b)=>a-b).join(',')}  stealth: ${info.stealths.map(i => `${PERFECT[i]}(idx${i})`).join(', ')}`);
}

// Now sweep all unique distributions with range 1-6
console.log(`\n\n${'═'.repeat(70)}`);
console.log('FULL SWEEP: All distributions with strengths 1-6, all unique values');
console.log('═'.repeat(70));
console.log('(6 cards, each a different strength from 1-6)\n');

// [1,2,3,4,5,6] is the ONLY distribution with all unique values 1-6.
// So let's also check distributions with one duplicate allowed
console.log('Also checking distributions with exactly 1 duplicate (5 distinct values):');

const VALS = [1,2,3,4,5,6];
const withOneDup: number[][] = [];
// Pick which value to duplicate, pick which value to drop
for (const dup of VALS) {
  for (const drop of VALS) {
    if (dup === drop) continue;
    const dist = VALS.filter(v => v !== drop).concat([dup]).sort((a,b) => a-b);
    const key = dist.join(',');
    // Avoid duplicates in our list
    if (!withOneDup.some(d => d.join(',') === key)) {
      withOneDup.push(dist);
    }
  }
}

console.log(`Testing ${withOneDup.length} distributions with 1 duplicate...\n`);

interface Result {
  strengths: number[];
  viablePairs: number;
  totalConfigs: number;
  splits: number;
  details: Map<string, { targets: number[], lieStr: number[], truthStr: number[] }>;
}

const allResults: Result[] = [];

for (const strengths of [[1,2,3,4,5,6], ...withOneDup]) {
  let configs = 0;
  const vPairs = new Set<string>();
  const details = new Map<string, { targets: number[], lieStr: number[], truthStr: number[] }>();

  for (const liePair of liePairs) {
    for (const stealthIdx of liePair) {
      const hintLieIdx = liePair.find(i => i !== stealthIdx)!;
      const validHGs = hintGroups.filter(hg =>
        hg.includes(hintLieIdx) && !hg.includes(stealthIdx) &&
        hg.filter(i => !liePair.includes(i)).length >= 1
      );
      for (const hg of validHGs) {
        for (let target = 1; target <= 25; target++) {
          const checks = evaluate(strengths, liePair, stealthIdx, hg, target);
          if (Object.values(checks).every(Boolean)) {
            configs++;
            const key = liePair.join(',');
            vPairs.add(key);
            if (!details.has(key)) {
              const ti = [0,1,2,3,4,5].filter(i => !liePair.includes(i));
              details.set(key, {
                targets: [],
                lieStr: liePair.map(i => strengths[i]).sort((a,b)=>a-b),
                truthStr: ti.map(i => strengths[i]).sort((a,b)=>a-b),
              });
            }
            const d = details.get(key)!;
            if (!d.targets.includes(target)) d.targets.push(target);
          }
        }
      }
    }
  }

  const splits = new Set([...details.values()].map(d => `L${d.lieStr}T${d.truthStr}`)).size;
  allResults.push({ strengths, viablePairs: vPairs.size, totalConfigs: configs, splits, details });
}

allResults.sort((a, b) => b.viablePairs - a.viablePairs || b.splits - a.splits || b.totalConfigs - a.totalConfigs);

for (const r of allResults.slice(0, 15)) {
  console.log(`  [${r.strengths.join(',')}]  pairs: ${r.viablePairs}/15  splits: ${r.splits}  configs: ${r.totalConfigs}`);
  for (const [_, d] of r.details) {
    console.log(`    L[${d.lieStr.join(',')}] T[${d.truthStr.join(',')}]  targets: ${d.targets.sort((a,b)=>a-b).join(',')}`);
  }
  console.log();
}
