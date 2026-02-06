#!/usr/bin/env npx tsx
/**
 * KOA Casefiles — Diagnostic Metrics
 *
 * Runs solver + signal analysis across N seeds and outputs comprehensive
 * metrics for rapid iteration. One-shot output, machine-parseable sections.
 *
 * Usage:
 *   npx tsx scripts/diagnostics.ts [N=100] [--tier 2] [--seed-start 1] [--json]
 */
import { solve, type SolveResult } from '../src/solver.js';
import { generateValidatedCase } from '../src/sim.js';
import { PlayerSession } from '../src/player.js';
import { compareEvidence } from '../src/actions.js';
import {
    analyzeSignal,
    analyzeMotiveAmbiguity,
    analyzeKeystoneDiscoverability,
    findContradictions,
    findKeystonePair,
} from '../src/validators.js';
import { scoreDailyCandidate } from '../src/daily/finder.js';
import type { DifficultyTier, TestimonyEvidence, DeviceLogEvidence } from '../src/types.js';

// ── CLI args ──
const args = process.argv.slice(2);
const N = parseInt(args.find((_, i, a) => i > 0 && a[i - 1] !== '--tier' && a[i - 1] !== '--seed-start' && /^\d+$/.test(a[i])) ?? args[0] ?? '100', 10) || 100;
const TIER = ((): DifficultyTier => {
    const idx = args.indexOf('--tier');
    return idx >= 0 ? parseInt(args[idx + 1] || '2', 10) as DifficultyTier : 2;
})();
const SEED_START = ((): number => {
    const idx = args.indexOf('--seed-start');
    return idx >= 0 ? parseInt(args[idx + 1] || '1', 10) : 1;
})();
const JSON_MODE = args.includes('--json');

// ── Aggregators ──
interface CaseDiag {
    seed: number;
    solveResult: SolveResult;
    crimeType: string;
    signalType: string;
    signalStrength: string;
    hasHardContradiction: boolean;
    culpritHardCount: number;
    maxInnocentHardCount: number;
    compareCanSeeKeystone: boolean;  // Can COMPARE detect the keystone pair?
    suggestUseful: boolean;          // Would SUGGEST point to something useful?
    motiveAmbiguityScore: number;
    culpritStandsOut: boolean;
    keystoneDiscScore: number;
    deductionQuality: number;
    finderScore: number;
}

const cases: CaseDiag[] = [];
let genFailed = 0;

for (let i = 0; i < N; i++) {
    const seed = SEED_START + i;
    const gv = generateValidatedCase(seed, TIER);
    if (!gv) { genFailed++; continue; }

    const { sim, evidence } = gv;
    const config = sim.config;

    // Run solver
    const solveResult = solve(seed, false, TIER);

    // Signal analysis — use solver-visible evidence only (same filter as generateValidatedCase)
    const discoverableKinds = new Set(['testimony', 'device_log', 'physical', 'motive']);
    const solverVisible = evidence.filter(e => {
        if (!discoverableKinds.has(e.kind)) return false;
        const w = (e as any).window;
        return !w || w === config.crimeWindow;
    });
    const signal = analyzeSignal(solverVisible, config);
    const motiveAmb = analyzeMotiveAmbiguity(evidence, config);
    const keystoneDisc = analyzeKeystoneDiscoverability(evidence, config);
    const finderScore = scoreDailyCandidate(sim, evidence, TIER);

    // COMPARE accuracy: can it see the keystone pair?
    let compareCanSeeKeystone = false;
    let suggestUseful = false;
    if (signal.keystonePair) {
        const session = new PlayerSession(sim.world, config, evidence);
        // Collect only solver-visible evidence into session
        for (const e of solverVisible) {
            if (!session.knownEvidence.find(k => k.id === e.id)) {
                session.knownEvidence.push(e);
            }
        }
        const cmpResult = compareEvidence(session, signal.keystonePair.evidenceA, signal.keystonePair.evidenceB);
        if (cmpResult.success && 'contradiction' in cmpResult && cmpResult.contradiction) {
            compareCanSeeKeystone = true;
        }
    }

    // SUGGEST accuracy: scan all known pairs, see if any useful tension found
    {
        const session = new PlayerSession(sim.world, config, evidence);
        for (const e of solverVisible) {
            if (!session.knownEvidence.find(k => k.id === e.id)) {
                session.knownEvidence.push(e);
            }
        }
        // Check if any pair involving culprit's evidence produces a contradiction
        const culpritEvidence = solverVisible.filter(e => {
            if (e.kind === 'testimony') return (e as TestimonyEvidence).witness === config.culpritId;
            if (e.kind === 'device_log') return (e as DeviceLogEvidence).actor === config.culpritId;
            return false;
        });
        for (const ce of culpritEvidence) {
            for (const oe of solverVisible) {
                if (ce.id === oe.id) continue;
                const cmp = compareEvidence(session, ce.id, oe.id);
                if (cmp.success && 'contradiction' in cmp && cmp.contradiction) {
                    suggestUseful = true;
                    break;
                }
            }
            if (suggestUseful) break;
        }
    }

    // HARD contradiction counts
    const contradictions = findContradictions(evidence, config);
    const culpritHardCount = solveResult.metrics?.culpritHardContradictions ?? 0;
    const maxInnocentHardCount = solveResult.metrics?.maxInnocentHardContradictions ?? 0;

    cases.push({
        seed,
        solveResult,
        crimeType: config.crimeType,
        signalType: signal.signalType,
        signalStrength: signal.signalStrength,
        hasHardContradiction: culpritHardCount > 0,
        culpritHardCount,
        maxInnocentHardCount,
        compareCanSeeKeystone,
        suggestUseful,
        motiveAmbiguityScore: motiveAmb.ambiguityScore,
        culpritStandsOut: motiveAmb.culpritStandsOut,
        keystoneDiscScore: keystoneDisc.score,
        deductionQuality: finderScore.deductionQuality,
        finderScore: finderScore.total,
    });
}

// ── Output ──
const total = cases.length;
const pct = (n: number) => total > 0 ? `${(n / total * 100).toFixed(1)}%` : '-';
const avg = (arr: number[]) => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : '-';

if (JSON_MODE) {
    const summary = {
        seeds: { total: N, generated: total, genFailed },
        tier: TIER,
        solve: {
            perfect: cases.filter(c => c.solveResult.correct).length,
            core: cases.filter(c => c.solveResult.coreCorrect).length,
            failed: cases.filter(c => !c.solveResult.solved).length,
        },
        signal: {
            types: Object.fromEntries(
                [...new Set(cases.map(c => c.signalType))].map(t =>
                    [t, cases.filter(c => c.signalType === t).length]
                )
            ),
            strengths: Object.fromEntries(
                [...new Set(cases.map(c => c.signalStrength))].map(s =>
                    [s, cases.filter(c => c.signalStrength === s).length]
                )
            ),
        },
        contradictions: {
            culpritHasHard: cases.filter(c => c.hasHardContradiction).length,
            avgCulpritHard: avg(cases.map(c => c.culpritHardCount)),
            avgMaxInnocentHard: avg(cases.map(c => c.maxInnocentHardCount)),
        },
        compare: {
            canSeeKeystone: cases.filter(c => c.compareCanSeeKeystone).length,
            suggestUseful: cases.filter(c => c.suggestUseful).length,
        },
        motive: {
            ambiguity0: cases.filter(c => c.motiveAmbiguityScore === 0).length,
            ambiguity4: cases.filter(c => c.motiveAmbiguityScore === 4).length,
            ambiguity8: cases.filter(c => c.motiveAmbiguityScore === 8).length,
            culpritStandsOut: cases.filter(c => c.culpritStandsOut).length,
        },
        scoring: {
            avgDeductionQuality: avg(cases.map(c => c.deductionQuality)),
            avgFinderScore: avg(cases.map(c => c.finderScore)),
        },
        failures: cases.filter(c => !c.solveResult.correct).map(c => ({
            seed: c.seed,
            crimeType: c.crimeType,
            reason: c.solveResult.failReason,
            hasHard: c.hasHardContradiction,
            compareSeesKeystone: c.compareCanSeeKeystone,
            suggestUseful: c.suggestUseful,
        })),
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
}

// ── Human-readable output ──
const W = 60;
const line = '═'.repeat(W);
const dash = '─'.repeat(W);

console.log(`\n${line}`);
console.log(`  KOA DIAGNOSTICS — ${total} cases, tier ${TIER}, seeds ${SEED_START}-${SEED_START + N - 1}`);
console.log(`${line}\n`);

// Solve rates
const perfect = cases.filter(c => c.solveResult.correct).length;
const core = cases.filter(c => c.solveResult.coreCorrect).length;
const wrong = cases.filter(c => c.solveResult.solved && !c.solveResult.correct).length;
const failed = cases.filter(c => !c.solveResult.solved).length;

console.log(`SOLVE RATE`);
console.log(`${dash}`);
console.log(`  Perfect (6/6):  ${perfect}/${total} (${pct(perfect)})`);
console.log(`  Core (4/4):     ${core}/${total} (${pct(core)})`);
console.log(`  Wrong:          ${wrong}/${total}`);
console.log(`  Failed:         ${failed}/${total}`);
console.log(`  Gen failed:     ${genFailed}/${N}\n`);

// Solve by crime type
const crimeTypes = [...new Set(cases.map(c => c.crimeType))].sort();
console.log(`SOLVE BY CRIME TYPE`);
console.log(`${dash}`);
for (const ct of crimeTypes) {
    const ctCases = cases.filter(c => c.crimeType === ct);
    const ctSolved = ctCases.filter(c => c.solveResult.correct).length;
    console.log(`  ${ct.padEnd(15)} ${ctSolved}/${ctCases.length} (${(ctSolved / ctCases.length * 100).toFixed(0)}%)`);
}

// Signal distribution
console.log(`\nSIGNAL DISTRIBUTION`);
console.log(`${dash}`);
const signalTypes = [...new Set(cases.map(c => c.signalType))].sort();
for (const st of signalTypes) {
    console.log(`  ${st.padEnd(25)} ${cases.filter(c => c.signalType === st).length}`);
}
const strengths = [...new Set(cases.map(c => c.signalStrength))].sort();
for (const s of strengths) {
    console.log(`  strength=${s.padEnd(15)} ${cases.filter(c => c.signalStrength === s).length}`);
}

// HARD contradictions
console.log(`\nHARD CONTRADICTIONS`);
console.log(`${dash}`);
const hasHard = cases.filter(c => c.hasHardContradiction).length;
console.log(`  Culprit has ≥1 HARD:    ${hasHard}/${total} (${pct(hasHard)})`);
console.log(`  Avg culprit HARD:       ${avg(cases.map(c => c.culpritHardCount))}`);
console.log(`  Avg max innocent HARD:  ${avg(cases.map(c => c.maxInnocentHardCount))}`);
const fpRisk = cases.filter(c => c.hasHardContradiction && c.maxInnocentHardCount >= c.culpritHardCount).length;
console.log(`  False positive risk:    ${fpRisk}/${total}`);

// COMPARE / SUGGEST accuracy
console.log(`\nCOMPARE / SUGGEST ACCURACY`);
console.log(`${dash}`);
const keystoneVisible = cases.filter(c => c.compareCanSeeKeystone).length;
const suggestWorks = cases.filter(c => c.suggestUseful).length;
console.log(`  COMPARE sees keystone:  ${keystoneVisible}/${total} (${pct(keystoneVisible)})`);
console.log(`  SUGGEST finds useful:   ${suggestWorks}/${total} (${pct(suggestWorks)})`);
// Cases where keystone exists but COMPARE can't see it
const keystoneMissed = cases.filter(c => !c.compareCanSeeKeystone && c.signalType !== 'opportunity_only').length;
console.log(`  Keystone MISSED by CMP: ${keystoneMissed}/${total} (${pct(keystoneMissed)})`);

// Motive ambiguity
console.log(`\nMOTIVE AMBIGUITY`);
console.log(`${dash}`);
console.log(`  Score=0 (obvious):  ${cases.filter(c => c.motiveAmbiguityScore === 0).length}`);
console.log(`  Score=4 (2 susp):   ${cases.filter(c => c.motiveAmbiguityScore === 4).length}`);
console.log(`  Score=8 (3+ susp):  ${cases.filter(c => c.motiveAmbiguityScore === 8).length}`);
console.log(`  Culprit stands out: ${cases.filter(c => c.culpritStandsOut).length}/${total}`);

// Deduction quality
console.log(`\nDEDUCTION QUALITY`);
console.log(`${dash}`);
const dqs = cases.map(c => c.deductionQuality);
console.log(`  Avg:  ${avg(dqs)}/20`);
console.log(`  Min:  ${Math.min(...dqs)}/20`);
console.log(`  Max:  ${Math.max(...dqs)}/20`);
const fss = cases.map(c => c.finderScore);
console.log(`  Finder avg: ${avg(fss)}/100`);

// Failures detail
const failureCases = cases.filter(c => !c.solveResult.correct);
if (failureCases.length > 0) {
    console.log(`\nFAILURES`);
    console.log(`${dash}`);
    for (const f of failureCases) {
        console.log(`  seed ${f.seed}: ${f.crimeType} | ${f.solveResult.failReason} | HARD=${f.culpritHardCount} | CMP_keystone=${f.compareCanSeeKeystone} | suggest=${f.suggestUseful}`);
    }
}

// Cases where finder scores high but COMPARE is blind
const blindHighScorers = cases.filter(c => c.finderScore >= 90 && !c.compareCanSeeKeystone);
if (blindHighScorers.length > 0) {
    console.log(`\nHIGH-SCORE BUT COMPARE-BLIND (finder ≥90, COMPARE can't see keystone)`);
    console.log(`${dash}`);
    for (const c of blindHighScorers) {
        console.log(`  seed ${c.seed}: score=${c.finderScore} signal=${c.signalType}/${c.signalStrength} HARD=${c.culpritHardCount}`);
    }
}

console.log(`\n${line}\n`);
