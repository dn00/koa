/**
 * Check motive ambiguity distribution across seeds.
 * Usage: npx tsx scripts/check-ambiguity.ts [N=300] [--tier 2]
 */
import { generateValidatedCase } from '../src/sim.js';
import { analyzeMotiveAmbiguity } from '../src/validators.js';
import { scoreDailyCandidate } from '../src/daily/finder.js';
import type { DifficultyTier } from '../src/types.js';

const N = parseInt(process.argv[2] || '300', 10);
const TIER = ((): DifficultyTier => {
    const idx = process.argv.indexOf('--tier');
    return idx >= 0 ? parseInt(process.argv[idx + 1] || '2', 10) as DifficultyTier : 2;
})();

const ambCounts: Record<number, number> = { 0: 0, 4: 0, 8: 0 };
const dqScores: number[] = [];
let standsOutCount = 0;
let validCount = 0;

for (let seed = 1; seed <= N; seed++) {
    const result = generateValidatedCase(seed, TIER);
    if (!result) continue;
    validCount++;
    const { sim, evidence } = result;
    const a = analyzeMotiveAmbiguity(evidence, sim.config);
    ambCounts[a.ambiguityScore] = (ambCounts[a.ambiguityScore] || 0) + 1;
    if (a.culpritStandsOut) standsOutCount++;
    const score = scoreDailyCandidate(sim, evidence, TIER);
    dqScores.push(score.deductionQuality);
}

console.log(`Motive ambiguity (${validCount} valid / ${N} seeds, tier ${TIER}):`);
console.log(`  ambiguityScore=0: ${ambCounts[0]} (culprit obvious)`);
console.log(`  ambiguityScore=4: ${ambCounts[4]} (2 suspects accusatory)`);
console.log(`  ambiguityScore=8: ${ambCounts[8]} (3+ suspects accusatory)`);
console.log(`  Culprit stands out: ${standsOutCount}/${validCount}`);

const avg = dqScores.reduce((a, b) => a + b, 0) / dqScores.length;
console.log(`\nDeduction Quality: min=${Math.min(...dqScores)} max=${Math.max(...dqScores)} avg=${avg.toFixed(1)}`);
