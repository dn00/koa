/**
 * Balance report for KOA Casefiles.
 *
 * Wraps the existing solver (src/solver.ts) and aggregates metrics across
 * N seeds to produce a balance report.
 *
 * Usage: npx tsx scripts/smart-solver.ts [N=100] [--tier 4] [--trace 50]
 */

import { solve, autosolve, type SolveResult } from '../src/solver.js';
import type { DifficultyTier } from '../src/types.js';

const NUM_GAMES = parseInt(process.argv[2] || '100', 10);
const TIER = ((): DifficultyTier => {
    const idx = process.argv.indexOf('--tier');
    return idx >= 0 ? parseInt(process.argv[idx + 1] || '4', 10) as DifficultyTier : 4;
})();
const TRACE_SEED = ((): number => {
    const idx = process.argv.indexOf('--trace');
    return idx >= 0 ? parseInt(process.argv[idx + 1] || '0', 10) : 0;
})();

// If --autosolve flag, delegate directly to existing autosolve
if (process.argv.includes('--autosolve')) {
    autosolve(NUM_GAMES, 1, process.argv.includes('--verbose'), TIER);
    process.exit(0);
}

// ============================================================
// RUN SOLVER
// ============================================================

const results: SolveResult[] = [];

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1 + i;
    const verbose = seed === TRACE_SEED;
    const r = solve(seed, verbose, TIER);
    results.push(r);
}

// ============================================================
// BALANCE REPORT
// ============================================================

function pct(count: number, total: number): string {
    return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0.0%';
}

function avg(arr: number[]): number {
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

const n = results.length;
const correct = results.filter(r => r.correct);
const coreCorrect = results.filter(r => r.coreCorrect);
const simFailed = results.filter(r => r.failReason === 'sim_failed');
const valid = results.filter(r => r.failReason !== 'sim_failed');

console.log(`\n${'═'.repeat(60)}`);
console.log(`  KOA BALANCE REPORT — ${n} games, Tier ${TIER}`);
console.log(`${'═'.repeat(60)}`);

// ── Outcomes ──
console.log(`  Perfect (6/6):    ${correct.length.toString().padStart(4)} (${pct(correct.length, n)})`);
console.log(`  Core (4/4):       ${coreCorrect.length.toString().padStart(4)} (${pct(coreCorrect.length, n)})`);
console.log(`  Sim failed:       ${simFailed.length.toString().padStart(4)} (${pct(simFailed.length, n)})`);

if (valid.length === 0) {
    console.log('\n  No valid games to analyze.');
    process.exit(0);
}

// ── Per-field accuracy ──
console.log(`\n${'─'.repeat(60)}`);
console.log('  ACCUSATION ACCURACY');
console.log(`${'─'.repeat(60)}`);

// Parse accusation and expected from details to get per-field accuracy
const fieldNames = ['who', 'what', 'how', 'when', 'where', 'why'];
const fieldCorrect: Record<string, number> = {};
for (const f of fieldNames) fieldCorrect[f] = 0;

for (const r of valid) {
    if (!r.details?.accusation || !r.details?.expected) continue;
    const accused = r.details.accusation.split(' ');
    const expected = r.details.expected.split(' ');
    for (let i = 0; i < fieldNames.length && i < accused.length && i < expected.length; i++) {
        if (accused[i] === expected[i]) fieldCorrect[fieldNames[i]]++;
    }
}

const withDetails = valid.filter(r => r.details?.accusation && r.details?.expected).length;
for (const f of fieldNames) {
    const c = fieldCorrect[f];
    const bar = '█'.repeat(Math.ceil(c / (withDetails || 1) * 40));
    console.log(`  ${f.padEnd(6)} ${pct(c, withDetails).padStart(6)}  ${bar}`);
}

// ── AP Efficiency ──
console.log(`\n${'─'.repeat(60)}`);
console.log('  AP EFFICIENCY');
console.log(`${'─'.repeat(60)}`);
console.log(`  Avg AP used:  ${avg(valid.map(r => r.apUsed)).toFixed(1)}/12`);

// ── HARD/SOFT Contradiction Metrics ──
const withMetrics = valid.filter(r => r.metrics);
if (withMetrics.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  HARD/SOFT CONTRADICTION METRICS');
    console.log(`${'─'.repeat(60)}`);

    const hasAtLeast1Hard = withMetrics.filter(r => (r.metrics?.culpritHardContradictions ?? 0) >= 1).length;
    const culpritMostCaught = withMetrics.filter(r => r.metrics?.culpritIsMostCaught).length;

    console.log(`  Culprit has >= 1 HARD:     ${hasAtLeast1Hard}/${withMetrics.length} (${pct(hasAtLeast1Hard, withMetrics.length)})  target: 100%`);
    console.log(`  Culprit most caught HARD:  ${culpritMostCaught}/${withMetrics.length} (${pct(culpritMostCaught, withMetrics.length)})  target: >= 90%`);
    console.log(`  Avg HARD culprit:          ${avg(withMetrics.map(r => r.metrics?.culpritHardContradictions ?? 0)).toFixed(1)}`);
    console.log(`  Avg HARD max innocent:     ${avg(withMetrics.map(r => r.metrics?.maxInnocentHardContradictions ?? 0)).toFixed(1)}`);
    console.log(`  Avg SOFT per case:         ${avg(withMetrics.map(r => r.metrics?.totalSoftContradictions ?? 0)).toFixed(1)}`);

    // False positive risk (HARD-based)
    const fpRiskHard = withMetrics.filter(r =>
        r.metrics && r.metrics.maxInnocentHardContradictions >= r.metrics.culpritHardContradictions
        && r.metrics.culpritHardContradictions > 0
    ).length;
    console.log(`  HARD false positive risk:  ${fpRiskHard}/${withMetrics.length} (${pct(fpRiskHard, withMetrics.length)})`);

    // Difficulty distribution
    const diffCount: Record<string, number> = {};
    const diffSolved: Record<string, number> = {};
    for (const r of withMetrics) {
        const tier = r.metrics!.difficultyTier;
        diffCount[tier] = (diffCount[tier] || 0) + 1;
        if (r.correct) diffSolved[tier] = (diffSolved[tier] || 0) + 1;
    }
    console.log('\n  Difficulty distribution:');
    for (const d of ['easy', 'medium', 'hard', 'unsolvable']) {
        const total = diffCount[d] || 0;
        const solved = diffSolved[d] || 0;
        if (total > 0) {
            console.log(`    ${d.padEnd(12)} ${total.toString().padStart(3)} cases, ${solved.toString().padStart(3)} solved (${pct(solved, total)})`);
        }
    }
}

// ── Signal Analysis ──
const withSignal = valid.filter(r => r.signalAnalysis);
if (withSignal.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  SIGNAL ANALYSIS');
    console.log(`${'─'.repeat(60)}`);
    const strengths: Record<string, number> = {};
    for (const r of withSignal) {
        const s = r.signalAnalysis!.signalStrength;
        strengths[s] = (strengths[s] || 0) + 1;
    }
    for (const [s, count] of Object.entries(strengths).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${s.padEnd(12)} ${count.toString().padStart(3)} (${pct(count, withSignal.length)})`);
    }
}

// ── Failure Analysis ──
const failures = valid.filter(r => !r.correct);
if (failures.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('  FAILURE ANALYSIS');
    console.log(`${'─'.repeat(60)}`);

    // Group by wrong fields
    const wrongFields: Record<string, number> = {};
    for (const f of failures) {
        if (f.failReason?.startsWith('wrong:')) {
            const fields = f.failReason.replace('wrong: ', '').split(', ');
            for (const field of fields) {
                const name = field.split('(')[0];
                wrongFields[name] = (wrongFields[name] || 0) + 1;
            }
        } else if (f.failReason) {
            wrongFields[f.failReason] = (wrongFields[f.failReason] || 0) + 1;
        }
    }
    for (const [field, count] of Object.entries(wrongFields).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${field.padEnd(22)} ${count}x`);
    }

    // Show first 10
    console.log(`\n  First 10 failures:`);
    for (const r of failures.slice(0, 10)) {
        const reason = r.failReason?.replace('wrong: ', '') ?? 'unknown';
        const dt = r.metrics?.difficultyTier ?? '?';
        console.log(`    seed ${r.seed.toString().padStart(3)}: ${reason} [${dt}]`);
    }
}

console.log(`\n${'═'.repeat(60)}\n`);
