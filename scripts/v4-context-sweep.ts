/**
 * Context Balance Sweep
 *
 * Tests [1,2,3,4,5,6] with contextual scoring.
 * Key design decision: penalty is ALWAYS -(baseStr - 1).
 * Only truth scoring is modified by context.
 * This creates asymmetry: low-str lies are cheap but low-str truths
 * can be valuable in the right context.
 *
 * Evidence types: each card has one of 4 types (D, P, T, S)
 * We test all meaningful type assignments to 6 cards.
 *
 * Scoring contexts modify truth values only.
 * We test: weight (1.5x one type), suspicion (0.5x one type),
 * pair bonus, diversity bonus, escalation.
 *
 * For each context × type assignment × lie pair × target:
 *   Check adapted balance criteria.
 *
 * New liesTempting: replaced with "every card has contextual reason to play"
 *   = for each card, there exists at least one hand containing it that
 *     scores higher than at least one hand not containing it.
 *   (trivially true for truths; for lies, the player doesn't know it's a lie,
 *    so we check: would the card LOOK worth playing if it were a truth?)
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

const DECK = [1, 2, 3, 4, 5, 6];
const N = 6;
const PLAY = 3;
type EType = 'D' | 'P' | 'T' | 'S';
const ALL_TYPES: EType[] = ['D', 'P', 'T', 'S'];

// Penalty: always base strength
const penalty = (str: number) => -(str - 1);

// --- Scoring Contexts ---

interface ScoringContext {
  name: string;
  // Returns the truth score for a card given its strength, type, hand position (0-2), and full hand info
  truthScore: (str: number, type: EType, position: number, handTypes: EType[]) => number;
  description: string;
}

function makeWeightContext(boostedType: EType, multiplier: number): ScoringContext {
  return {
    name: `WEIGHT_${boostedType}_${multiplier}x`,
    description: `${boostedType} evidence scores ${multiplier}x`,
    truthScore: (str, type) => type === boostedType ? Math.floor(str * multiplier) : str,
  };
}

function makeSuspicionContext(suspectType: EType): ScoringContext {
  return {
    name: `SUSPECT_${suspectType}`,
    description: `${suspectType} evidence scores 0.5x (KOA suspicious)`,
    truthScore: (str, type) => type === suspectType ? Math.ceil(str / 2) : str,
  };
}

const CONTEXTS: ScoringContext[] = [
  // Baseline
  {
    name: 'NONE',
    description: 'No modifier',
    truthScore: (str) => str,
  },
  // Weight contexts (boost one type)
  ...ALL_TYPES.map(t => makeWeightContext(t, 1.5)),
  ...ALL_TYPES.map(t => makeWeightContext(t, 2)),
  // Suspicion contexts (penalize one type)
  ...ALL_TYPES.map(t => makeSuspicionContext(t)),
  // Pair bonus: 2 cards of same type = +3
  {
    name: 'PAIR_+3',
    description: 'Playing 2+ cards of same type: +3 bonus',
    truthScore: (str, type, pos, handTypes) => {
      // Base score + share of pair bonus
      const pairCount = handTypes.filter(t => t === type).length;
      if (pairCount >= 2 && pos === 0) {
        // Add bonus once (on first card of the pair type)
        return str + 3;
      }
      return str;
    },
  },
  // Diversity bonus: all 3 different types = +3
  {
    name: 'DIVERSITY_+3',
    description: 'All 3 cards different types: +3 bonus',
    truthScore: (str, type, pos, handTypes) => {
      const unique = new Set(handTypes).size;
      if (unique === 3 && pos === 0) return str + 3;
      return str;
    },
  },
  // Escalation: T1=0.75x, T2=1x, T3=1.5x
  {
    name: 'ESCALATION',
    description: 'Cards played later score more: T1×0.75, T2×1, T3×1.5',
    truthScore: (str, type, pos) => {
      const mult = [0.75, 1, 1.5][pos];
      return Math.round(str * mult);
    },
  },
];

// --- Type Assignments ---
// Generate canonical type assignments: distribute 4 types across 6 cards
// At least 1 of each type? No — some puzzles might only use 2-3 types
// We want assignments where the context actually matters
// Test: 2-2-1-1, 2-2-2-0, 3-2-1-0, 3-1-1-1 distributions

function generateTypeAssignments(): EType[][] {
  // Generate unique distributions (up to type relabeling)
  const distributions = [
    [2, 2, 1, 1], // 4 types, balanced
    [2, 2, 2, 0], // 3 types, even
    [3, 2, 1, 0], // 3 types, skewed
    [3, 1, 1, 1], // 4 types, one dominant
    [3, 3, 0, 0], // 2 types, even
    [4, 1, 1, 0], // 3 types, very skewed
    [4, 2, 0, 0], // 2 types, skewed
  ];

  const results: EType[][] = [];
  const seen = new Set<string>();

  for (const dist of distributions) {
    // For each distribution, generate all ways to assign types to strength positions
    // Since strengths are fixed [1,2,3,4,5,6], position matters
    function assignTypes(remaining: { type: EType; count: number }[], current: EType[]): void {
      if (current.length === 6) {
        const key = current.join('');
        if (!seen.has(key)) {
          seen.add(key);
          results.push([...current]);
        }
        return;
      }
      for (const r of remaining) {
        if (r.count > 0) {
          r.count--;
          current.push(r.type);
          assignTypes(remaining, current);
          current.pop();
          r.count++;
        }
      }
    }

    const typeCounts = dist.map((count, i) => ({ type: ALL_TYPES[i], count }));
    assignTypes(typeCounts, []);
  }

  return results;
}

// --- Evaluation ---

function handScore(
  hand: number[], // card indices
  types: EType[],
  lieIndices: number[],
  context: ScoringContext,
): number {
  let total = 0;
  const handTypes = hand.map(i => types[i]);

  for (let pos = 0; pos < hand.length; pos++) {
    const idx = hand[pos];
    if (lieIndices.includes(idx)) {
      total += penalty(DECK[idx]);
    } else {
      total += context.truthScore(DECK[idx], types[idx], pos, handTypes);
    }
  }
  return total;
}

// Score a card AS IF it were a truth (player's perspective before knowing)
function apparentScore(
  cardIdx: number,
  otherIndices: number[],
  types: EType[],
  context: ScoringContext,
): number {
  const hand = [cardIdx, ...otherIndices];
  const handTypes = hand.map(i => types[i]);
  return context.truthScore(DECK[cardIdx], types[cardIdx], 0, handTypes);
}

interface CheckResult {
  flawless: boolean;
  notAlwaysSafe: boolean;
  seqMatters: boolean;
  lieRecoverable: boolean;
  randomWin: boolean;
  strengthNotOracle: boolean;
  everyCardWorthPlaying: boolean; // replaces liesTempting
  worstNotKO: boolean;
  liesDiffer: boolean;
  weakCanBeatStrong: boolean; // P3: non-obvious optimal
}

function evaluate(
  types: EType[],
  lieIndices: number[],
  context: ScoringContext,
  target: number,
): CheckResult {
  const allHands = combinations([0,1,2,3,4,5], PLAY);
  const truthIndices = [...Array(N).keys()].filter(i => !lieIndices.includes(i));

  // All hand scores
  const handScores = allHands.map(h => handScore(h, types, lieIndices, context));

  // Truth-only hands
  const truthHands = allHands.filter(h => h.every(i => !lieIndices.includes(i)));
  const truthScores = truthHands.map(h => handScore(h, types, lieIndices, context));

  const flawless = truthScores.length > 0 && Math.max(...truthScores) >= target;
  const notAlwaysSafe = truthScores.length === 0 || Math.min(...truthScores) < target;
  const clearCount = truthScores.filter(s => s >= target).length;
  const seqMatters = clearCount > 0 && clearCount < truthHands.length;

  // Lie recovery
  const lieRecoveries = lieIndices.map(li => {
    const handsWithOneLie = allHands.filter(h =>
      h.includes(li) && h.filter(i => lieIndices.includes(i)).length === 1
    );
    if (handsWithOneLie.length === 0) return -Infinity;
    return Math.max(...handsWithOneLie.map(h => handScore(h, types, lieIndices, context)));
  });
  const lieRecoverable = lieRecoveries.some(s => s >= target - 2);

  // Random win
  const wins = handScores.filter(s => s >= target).length;
  const randomWinRate = (wins / allHands.length) * 100;
  const randomWin = randomWinRate >= 10 && randomWinRate <= 40;

  // Strength-first vs oracle
  const sfHand = [...Array(N).keys()].sort((a, b) => DECK[b] - DECK[a]).slice(0, PLAY);
  const sfScore = handScore(sfHand, types, lieIndices, context);
  const oracleScore = Math.max(...handScores);
  const strengthNotOracle = sfScore !== oracleScore;

  // Every card worth playing (replaces liesTempting)
  // For each card: if the player assumes it's a truth, is there a hand where
  // including it scores higher than some hand excluding it?
  let everyCardWorthPlaying = true;
  for (let i = 0; i < N; i++) {
    const handsWithCard = allHands.filter(h => h.includes(i));
    const handsWithoutCard = allHands.filter(h => !h.includes(i));
    // Score AS IF no lies (player's perspective)
    const bestWith = Math.max(...handsWithCard.map(h => {
      let total = 0;
      const handTypes = h.map(idx => types[idx]);
      for (let pos = 0; pos < h.length; pos++) {
        total += context.truthScore(DECK[h[pos]], types[h[pos]], pos, handTypes);
      }
      return total;
    }));
    const bestWithout = Math.max(...handsWithoutCard.map(h => {
      let total = 0;
      const handTypes = h.map(idx => types[idx]);
      for (let pos = 0; pos < h.length; pos++) {
        total += context.truthScore(DECK[h[pos]], types[h[pos]], pos, handTypes);
      }
      return total;
    }));
    // Card is worth playing if its best hand is competitive with best hand without it
    // Specifically: best hand with card >= best hand without card * 0.7
    // (the card should be a serious contender, not always dominated)
    if (bestWith < bestWithout * 0.6) {
      everyCardWorthPlaying = false;
    }
  }

  // Worst not KO
  const worstNotKO = lieRecoveries.length > 0 && Math.min(...lieRecoveries) >= target - 4;

  // Lies differ
  const lieStr = lieIndices.map(i => DECK[i]);
  const liesDiffer = new Set(lieStr).size === lieStr.length;

  // Weak can beat strong: exists a hand where replacing a higher-str card with
  // a lower-str card increases the APPARENT score (assuming all truths)
  let weakCanBeatStrong = false;
  for (const hand of allHands) {
    const handTypes = hand.map(i => types[i]);
    let baseScore = 0;
    for (let pos = 0; pos < hand.length; pos++) {
      baseScore += context.truthScore(DECK[hand[pos]], types[hand[pos]], pos, handTypes);
    }
    for (let pos = 0; pos < hand.length; pos++) {
      for (const outside of [...Array(N).keys()].filter(i => !hand.includes(i))) {
        if (DECK[outside] < DECK[hand[pos]]) {
          // Swap: replace higher-str with lower-str
          const newHand = [...hand];
          newHand[pos] = outside;
          const newTypes = newHand.map(i => types[i]);
          let newScore = 0;
          for (let p = 0; p < newHand.length; p++) {
            newScore += context.truthScore(DECK[newHand[p]], types[newHand[p]], p, newTypes);
          }
          if (newScore > baseScore) {
            weakCanBeatStrong = true;
          }
        }
      }
    }
    if (weakCanBeatStrong) break;
  }

  return {
    flawless, notAlwaysSafe, seqMatters, lieRecoverable, randomWin,
    strengthNotOracle, everyCardWorthPlaying, worstNotKO, liesDiffer,
    weakCanBeatStrong,
  };
}

// --- Main Sweep ---

console.log('═'.repeat(80));
console.log('CONTEXT BALANCE SWEEP — [1,2,3,4,5,6] + Scoring Contexts');
console.log('═'.repeat(80));

const typeAssignments = generateTypeAssignments();
const liePairs = combinations([0,1,2,3,4,5], 2) as [number, number][];

console.log(`\nType assignments: ${typeAssignments.length}`);
console.log(`Lie pairs: ${liePairs.length}`);
console.log(`Scoring contexts: ${CONTEXTS.length}`);
console.log();

// For each context, find the best type assignment and count viable lie pairs
interface ContextResult {
  context: ScoringContext;
  bestTypes: EType[];
  viablePairs: number;
  weakBeatsStrong: boolean;
  details: { liePair: [number, number]; target: number; weakBeat: boolean }[];
}

const contextResults: ContextResult[] = [];

for (const context of CONTEXTS) {
  let bestTypes: EType[] = [];
  let bestViable = 0;
  let bestWeak = false;
  let bestDetails: ContextResult['details'] = [];

  for (const types of typeAssignments) {
    let viable = 0;
    let anyWeak = false;
    const details: ContextResult['details'] = [];

    for (const liePair of liePairs) {
      for (let target = 1; target <= 30; target++) {
        const checks = evaluate(types, liePair, context, target);
        const requiredChecks = [
          checks.flawless, checks.notAlwaysSafe, checks.seqMatters,
          checks.lieRecoverable, checks.randomWin, checks.strengthNotOracle,
          checks.everyCardWorthPlaying, checks.worstNotKO, checks.liesDiffer,
        ];
        if (requiredChecks.every(Boolean)) {
          viable++;
          if (checks.weakCanBeatStrong) anyWeak = true;
          details.push({ liePair, target, weakBeat: checks.weakCanBeatStrong });
          break; // found a target for this lie pair
        }
      }
    }

    if (viable > bestViable || (viable === bestViable && anyWeak && !bestWeak)) {
      bestViable = viable;
      bestTypes = types;
      bestWeak = anyWeak;
      bestDetails = details;
    }
  }

  contextResults.push({
    context,
    bestTypes,
    viablePairs: bestViable,
    weakBeatsStrong: bestWeak,
    details: bestDetails,
  });
}

contextResults.sort((a, b) => b.viablePairs - a.viablePairs);

console.log('RESULTS BY CONTEXT (best type assignment for each)');
console.log('─'.repeat(80));
console.log();

for (const r of contextResults) {
  const pct = ((r.viablePairs / 15) * 100).toFixed(0);
  const marker = r.viablePairs >= 8 ? ' ★★★' : r.viablePairs >= 5 ? ' ★★' : r.viablePairs >= 3 ? ' ★' : '';
  console.log(`  ${r.context.name.padEnd(20)} ${r.viablePairs}/15 (${pct}%)  weak>strong: ${r.weakBeatsStrong ? 'YES' : 'no '}  types: [${r.bestTypes.join(',')}]${marker}`);

  if (r.details.length > 0) {
    for (const d of r.details) {
      const lieStr = d.liePair.map(i => `${DECK[i]}(${r.bestTypes[i]})`);
      console.log(`    L[${lieStr.join(',')}] target=${d.target}${d.weakBeat ? ' (weak>strong!)' : ''}`);
    }
  }
  console.log();
}

// Cross-context analysis: for one type assignment, how many TOTAL lie pairs across all contexts?
console.log('\n' + '═'.repeat(80));
console.log('CROSS-CONTEXT: Best type assignment across ALL contexts combined');
console.log('═'.repeat(80));

let globalBestTypes: EType[] = [];
let globalBestPairs = 0;
let globalBestMap = new Map<string, { context: string; target: number }>();

for (const types of typeAssignments) {
  const viablePairSet = new Map<string, { context: string; target: number }>();

  for (const context of CONTEXTS) {
    for (const liePair of liePairs) {
      const key = liePair.join(',');
      if (viablePairSet.has(key)) continue; // already found a context for this pair

      for (let target = 1; target <= 30; target++) {
        const checks = evaluate(types, liePair, context, target);
        const required = [
          checks.flawless, checks.notAlwaysSafe, checks.seqMatters,
          checks.lieRecoverable, checks.randomWin, checks.strengthNotOracle,
          checks.everyCardWorthPlaying, checks.worstNotKO, checks.liesDiffer,
        ];
        if (required.every(Boolean)) {
          viablePairSet.set(key, { context: context.name, target });
          break;
        }
      }
    }
  }

  if (viablePairSet.size > globalBestPairs) {
    globalBestPairs = viablePairSet.size;
    globalBestTypes = types;
    globalBestMap = new Map(viablePairSet);
  }
}

console.log(`\n  Best type assignment: [${globalBestTypes.join(',')}]`);
console.log(`  Strength→Type mapping: ${DECK.map((s, i) => `${s}=${globalBestTypes[i]}`).join(' ')}`);
console.log(`  Total viable lie pairs: ${globalBestPairs}/15 (${((globalBestPairs/15)*100).toFixed(0)}%)`);
console.log();

for (const [pair, info] of [...globalBestMap.entries()].sort()) {
  const [a, b] = pair.split(',').map(Number);
  console.log(`  L[${DECK[a]},${DECK[b]}] → context: ${info.context.padEnd(20)} target: ${info.target}`);
}

// Verdict
console.log('\n' + '═'.repeat(80));
console.log('VERDICT');
console.log('═'.repeat(80));
if (globalBestPairs >= 12) {
  console.log('\n  ✓ CANONICAL DECK UNLOCKED. Contextual scoring makes [1,2,3,4,5,6] viable.');
  console.log(`    ${globalBestPairs}/15 lie pairs work — enough for weeks of unique daily puzzles.`);
} else if (globalBestPairs >= 8) {
  console.log('\n  ~ PARTIALLY UNLOCKED. Contextual scoring helps significantly.');
  console.log(`    ${globalBestPairs}/15 lie pairs — usable but some gaps remain.`);
} else if (globalBestPairs > 4) {
  console.log('\n  ~ MARGINAL IMPROVEMENT over baseline (was 4/15).');
  console.log(`    ${globalBestPairs}/15 lie pairs — not enough for a canonical deck.`);
} else {
  console.log('\n  ✗ Contextual scoring does not solve the problem.');
}
