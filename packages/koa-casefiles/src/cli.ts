#!/usr/bin/env node
/**
 * KOA Casefiles - CLI for case generation and validation
 *
 * Usage:
 *   npx tsx src/cli.ts --generate 100       # Generate and validate 100 cases
 *   npx tsx src/cli.ts --generate 10 -v     # Verbose output
 *   npx tsx src/cli.ts --seed 42            # Generate single case with seed
 */

import { simulate } from './sim.js';
import { deriveEvidence } from './evidence.js';
import {
    validateCase,
    findImplicatingChains,
    getAllChains,
    validatePlayability,
    DEFAULT_PLAYER_CONSTRAINTS,
    DEFAULT_TUNER_CONFIG,
    type PlayerConstraints,
    type PlayabilityResult,
    type TunerResult,
} from './validators.js';
import type { CaseValidation, DifficultyConfig } from './types.js';
import { ACTIVITIES } from './activities.js';
import { autosolve, solve } from './solver.js';
import type { SolverMetrics } from './validators.js';

// Default difficulty config for validation
const DEFAULT_DIFFICULTY: DifficultyConfig = {
    tier: 2,
    suspectCount: 5,
    windowCount: 6,
    twistRules: ['false_alibi'],
    redHerringStrength: 5,
};

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface Args {
    generate: number;
    seed?: number;
    verbose: boolean;
    useBlueprints: boolean;
    tier: number;
    houseId?: string;
    castId?: string;
    tune: boolean;
    playability: boolean;
    autosolve: boolean;
}

function parseArgs(): Args {
    const args = process.argv.slice(2);
    let generate = 100;
    let seed: number | undefined;
    let verbose = false;
    let useBlueprints = false;
    let tier = 2;
    let houseId: string | undefined;
    let castId: string | undefined;
    let tune = false;
    let playability = false;
    let autosolve = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--generate' || arg === '-g') {
            generate = parseInt(args[++i], 10) || 100;
        } else if (arg === '--seed' || arg === '-s') {
            seed = parseInt(args[++i], 10);
            generate = 1;
        } else if (arg === '--verbose' || arg === '-v') {
            verbose = true;
        } else if (arg === '--blueprints' || arg === '-b') {
            useBlueprints = true;
        } else if (arg === '--tier' || arg === '-t') {
            tier = parseInt(args[++i], 10) || 2;
        } else if (arg === '--house') {
            houseId = args[++i];
        } else if (arg === '--cast') {
            castId = args[++i];
        } else if (arg === '--tune') {
            tune = true;
        } else if (arg === '--playability' || arg === '-p') {
            playability = true;
        } else if (arg === '--autosolve' || arg === '-a') {
            autosolve = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
KOA Casefiles - Case Generation Validator

Usage:
  npx tsx src/cli.ts [options]

Options:
  --generate, -g <n>   Generate and validate n cases (default: 100)
  --seed, -s <n>       Generate single case with specific seed
  --verbose, -v        Show detailed output
  --blueprints, -b     Use blueprint system (new incident templates)
  --tier, -t <n>       Difficulty tier 1-4 (default: 2)
  --house <id>         House layout: share_house, cramped_apartment, mcmansion
  --cast <id>          NPC cast: roommates, family, coworkers, friends
  --playability, -p    Check playability with current player constraints
  --tune               Grid search for optimal player constraints
  --autosolve, -a      Run automated solver across seeds (practical playtest)
  --help, -h           Show this help
`);
            process.exit(0);
        }
    }

    return { generate, seed, verbose, useBlueprints, tier, houseId, castId, tune, playability, autosolve };
}

// ============================================================================
// Single Case Generation
// ============================================================================

function generateCase(
    seed: number,
    verbose: boolean,
    useBlueprints: boolean = false,
    tier: number = 2,
    houseId?: string,
    castId?: string
): CaseValidation | null {
    const result = simulate(seed, tier, { useBlueprints, houseId, castId });

    if (!result) {
        if (verbose) {
            console.log(`Seed ${seed}: ⚠️ No valid crime opportunity`);
        }
        return null;
    }

    const evidence = deriveEvidence(result.world, result.eventLog, result.config);
    const validation = validateCase(result.world, result.config, evidence, DEFAULT_DIFFICULTY);

    if (verbose) {
        const status = validation.passed ? '✅' : '❌';
        const reasons: string[] = [];

        if (!validation.solvability.valid) {
            reasons.push(`solvability: ${validation.solvability.reason}`);
        }
        if (!validation.antiAnticlimax.valid) {
            reasons.push(`anti-anticlimax: ${validation.antiAnticlimax.reason}`);
        }
        if (!validation.redHerrings.valid) {
            reasons.push(`red-herrings: ${validation.redHerrings.reason}`);
        }
        if (validation.difficulty && !validation.difficulty.valid) {
            reasons.push(`difficulty: ${validation.difficulty.reason}`);
        }
        if (validation.funness && !validation.funness.valid) {
            reasons.push(`funness: ${validation.funness.reason}`);
        }

        // Show difficulty metrics
        const diffMetrics = validation.difficulty
            ? `AP=${validation.difficulty.estimatedMinAP} contradictions=${validation.difficulty.contradictionCount} branching=${validation.difficulty.branchingFactor}`
            : '';

        console.log(`Seed ${seed}: ${status} culprit=${validation.culprit} evidence=${validation.evidenceCount} ${diffMetrics}`);

        if (reasons.length > 0) {
            for (const reason of reasons) {
                console.log(`  → ${reason}`);
            }
        }
    }

    return validation;
}

// ============================================================================
// Batch Generation
// ============================================================================

function runBatch(
    count: number,
    startSeed: number,
    verbose: boolean,
    useBlueprints: boolean = false,
    tier: number = 2,
    houseId?: string,
    castId?: string
): void {
    const mode = useBlueprints ? ' (BLUEPRINTS)' : '';
    const config = houseId || castId ? ` [${houseId ?? 'share_house'}+${castId ?? 'roommates'}]` : '';
    console.log(`\nGenerating ${count} cases${mode}${config}...\n`);

    let passed = 0;
    let failed = 0;
    let noOpportunity = 0;
    const failureReasons: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;
        const validation = generateCase(seed, verbose, useBlueprints, tier, houseId, castId);

        if (!validation) {
            noOpportunity++;
            continue;
        }

        if (validation.passed) {
            passed++;
        } else {
            failed++;

            // Track failure reasons
            if (!validation.solvability.valid) {
                const key = `solvability: ${validation.solvability.reason}`;
                failureReasons[key] = (failureReasons[key] || 0) + 1;
            }
            if (!validation.antiAnticlimax.valid) {
                const key = `anti-anticlimax: ${validation.antiAnticlimax.reason}`;
                failureReasons[key] = (failureReasons[key] || 0) + 1;
            }
            if (!validation.redHerrings.valid) {
                const key = `red-herrings: ${validation.redHerrings.reason}`;
                failureReasons[key] = (failureReasons[key] || 0) + 1;
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS');
    console.log('='.repeat(60));

    const total = passed + failed + noOpportunity;
    const validCases = passed + failed;
    const passRate = validCases > 0 ? ((passed / validCases) * 100).toFixed(1) : 0;

    console.log(`\nTotal seeds:        ${total}`);
    console.log(`Valid cases:        ${validCases}`);
    console.log(`  ✅ Passed:        ${passed} (${passRate}%)`);
    console.log(`  ❌ Failed:        ${failed}`);
    console.log(`  ⚠️  No opportunity: ${noOpportunity}`);

    if (Object.keys(failureReasons).length > 0) {
        console.log('\nFailure breakdown:');
        for (const [reason, count] of Object.entries(failureReasons).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${count}x ${reason}`);
        }
    }

    // Pass/fail determination
    const targetRate = 90;
    const actualRate = parseFloat(passRate as string);

    console.log('\n' + '='.repeat(60));
    if (actualRate >= targetRate) {
        console.log(`🎉 SUCCESS: Pass rate ${passRate}% meets target ${targetRate}%`);
    } else {
        console.log(`⚠️ BELOW TARGET: Pass rate ${passRate}% below target ${targetRate}%`);
    }
    console.log('='.repeat(60) + '\n');
}

// ============================================================================
// Playability Check
// ============================================================================

function runPlayabilityCheck(
    count: number,
    startSeed: number,
    verbose: boolean,
    useBlueprints: boolean = false,
    tier: number = 2
): void {
    console.log(`\nChecking playability of ${count} cases with current constraints...\n`);
    console.log(`Constraints: ${DEFAULT_PLAYER_CONSTRAINTS.maxDays} days, ${DEFAULT_PLAYER_CONSTRAINTS.apPerDay} AP/day, cover-up after day ${DEFAULT_PLAYER_CONSTRAINTS.coverUpDay}, ${DEFAULT_PLAYER_CONSTRAINTS.maxLeads} leads\n`);

    let playable = 0;
    let unplayable = 0;
    let noOpportunity = 0;
    const issueCount: Record<string, number> = {};
    let totalAPMargin = 0;
    let totalMinAP = 0;

    // Guidance metrics aggregation
    let totalWindowSignalAP = 0;
    let totalKeystoneReachAP = 0;
    let totalWindowSpread = 0;
    const clarityCount: Record<string, number> = { clear: 0, moderate: 0, unclear: 0 };

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;
        const result = simulate(seed, tier, { useBlueprints });

        if (!result) {
            noOpportunity++;
            continue;
        }

        const evidence = deriveEvidence(result.world, result.eventLog, result.config);
        const chains = getAllChains(result.config, evidence);
        const playResult = validatePlayability(result.config, evidence, chains);

        if (playResult.playable) {
            playable++;
        } else {
            unplayable++;
        }

        totalAPMargin += playResult.apMargin;
        totalMinAP += playResult.minAPToSolve;

        // Aggregate guidance metrics
        totalWindowSignalAP += playResult.crimeWindowSignalAP;
        if (playResult.keystoneReachAP >= 0) {
            totalKeystoneReachAP += playResult.keystoneReachAP;
        }
        totalWindowSpread += playResult.windowSpread;
        clarityCount[playResult.firstMoveClarity]++;

        for (const issue of playResult.issues) {
            issueCount[issue] = (issueCount[issue] || 0) + 1;
        }

        if (verbose) {
            const status = playResult.playable ? '✅' : '❌';
            const clarity = playResult.firstMoveClarity[0].toUpperCase(); // C/M/U
            console.log(`Seed ${seed}: ${status} minAP=${playResult.minAPToSolve} margin=${playResult.apMargin} keystone=${playResult.keystoneExists ? 'Y' : 'N'} clarity=${clarity} spread=${playResult.windowSpread}`);
            if (playResult.issues.length > 0) {
                for (const issue of playResult.issues) {
                    console.log(`  → ${issue}`);
                }
            }
        }
    }

    const validCases = playable + unplayable;
    const playRate = validCases > 0 ? ((playable / validCases) * 100).toFixed(1) : 0;
    const avgMargin = validCases > 0 ? (totalAPMargin / validCases).toFixed(1) : 0;
    const avgMinAP = validCases > 0 ? (totalMinAP / validCases).toFixed(1) : 0;

    // Guidance metrics averages
    const avgWindowSignalAP = validCases > 0 ? (totalWindowSignalAP / validCases).toFixed(1) : 0;
    const avgKeystoneReachAP = validCases > 0 ? (totalKeystoneReachAP / validCases).toFixed(1) : 0;
    const avgWindowSpread = validCases > 0 ? (totalWindowSpread / validCases).toFixed(1) : 0;

    console.log('\n' + '='.repeat(60));
    console.log('PLAYABILITY RESULTS');
    console.log('='.repeat(60));
    console.log(`\nTotal seeds:        ${count}`);
    console.log(`Valid cases:        ${validCases}`);
    console.log(`  ✅ Playable:      ${playable} (${playRate}%)`);
    console.log(`  ❌ Unplayable:    ${unplayable}`);
    console.log(`  ⚠️  No opportunity: ${noOpportunity}`);
    console.log(`\nAverage min AP:     ${avgMinAP}`);
    console.log(`Average AP margin:  ${avgMargin}`);

    console.log('\n' + '-'.repeat(60));
    console.log('PLAYER GUIDANCE METRICS');
    console.log('-'.repeat(60));
    console.log(`\nAvg window signal AP:   ${avgWindowSignalAP} (lower = easier to find crime window)`);
    console.log(`Avg keystone reach AP:  ${avgKeystoneReachAP} (lower = easier to find contradiction)`);
    console.log(`Avg window spread:      ${avgWindowSpread} (higher = more spread out)`);
    console.log(`\nFirst move clarity:`);
    console.log(`  Clear:    ${clarityCount.clear} (${validCases > 0 ? ((clarityCount.clear / validCases) * 100).toFixed(0) : 0}%)`);
    console.log(`  Moderate: ${clarityCount.moderate} (${validCases > 0 ? ((clarityCount.moderate / validCases) * 100).toFixed(0) : 0}%)`);
    console.log(`  Unclear:  ${clarityCount.unclear} (${validCases > 0 ? ((clarityCount.unclear / validCases) * 100).toFixed(0) : 0}%)`);

    if (Object.keys(issueCount).length > 0) {
        console.log('\n' + '-'.repeat(60));
        console.log('Issue breakdown:');
        for (const [issue, cnt] of Object.entries(issueCount).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${cnt}x ${issue}`);
        }
    }

    console.log('='.repeat(60) + '\n');
}

// ============================================================================
// Grid Search Tuner
// ============================================================================

function runTuner(
    casesPerConfig: number,
    startSeed: number,
    useBlueprints: boolean = false,
    tier: number = 2
): void {
    console.log(`\nRunning grid search tuner (${casesPerConfig} cases per config)...\n`);

    const results: TunerResult[] = [];

    const { daysRange, apPerDayRange, coverUpDayRange, maxLeadsRange } = DEFAULT_TUNER_CONFIG;

    let totalConfigs = daysRange.length * apPerDayRange.length * coverUpDayRange.length * maxLeadsRange.length;
    let configNum = 0;

    for (const days of daysRange) {
        for (const apPerDay of apPerDayRange) {
            for (const coverUpDay of coverUpDayRange) {
                for (const maxLeads of maxLeadsRange) {
                    configNum++;
                    const constraints: PlayerConstraints = {
                        maxDays: days,
                        apPerDay,
                        coverUpDay,
                        maxLeads,
                        leadDiscount: 1,
                    };

                    let playable = 0;
                    let total = 0;
                    let totalMargin = 0;
                    let totalMinAP = 0;
                    const issues: Record<string, number> = {};

                    // Guidance metrics aggregation
                    let totalWindowSignalAP = 0;
                    let totalKeystoneReachAP = 0;
                    let totalWindowSpread = 0;
                    const clarityCount: Record<string, number> = { clear: 0, moderate: 0, unclear: 0 };

                    // Solver metrics aggregation
                    const difficultyCount: Record<'easy' | 'medium' | 'hard' | 'unsolvable', number> = { easy: 0, medium: 0, hard: 0, unsolvable: 0 };
                    const difficultySolved: Record<'easy' | 'medium' | 'hard' | 'unsolvable', number> = { easy: 0, medium: 0, hard: 0, unsolvable: 0 };
                    let culpritSelfContradiction = 0;
                    let culpritCrimeSceneLie = 0;
                    let culpritSignatureMotive = 0;
                    let falsePositiveRisk = 0;
                    let totalCulpritContradictions = 0;
                    let totalInnocentContradictions = 0;
                    let solveCount = 0;
                    let solverCases = 0;

                    for (let i = 0; i < casesPerConfig; i++) {
                        const seed = startSeed + i;
                        const result = simulate(seed, tier, { useBlueprints });
                        if (!result) continue;

                        const evidence = deriveEvidence(result.world, result.eventLog, result.config);
                        const chains = getAllChains(result.config, evidence);
                        const playResult = validatePlayability(result.config, evidence, chains, constraints);

                        total++;
                        if (playResult.playable) playable++;
                        totalMargin += playResult.apMargin;
                        totalMinAP += playResult.minAPToSolve;

                        // Aggregate guidance metrics
                        totalWindowSignalAP += playResult.crimeWindowSignalAP;
                        if (playResult.keystoneReachAP >= 0) {
                            totalKeystoneReachAP += playResult.keystoneReachAP;
                        }
                        totalWindowSpread += playResult.windowSpread;
                        clarityCount[playResult.firstMoveClarity]++;

                        for (const issue of playResult.issues) {
                            issues[issue] = (issues[issue] || 0) + 1;
                        }

                        // Run solver and collect metrics
                        const solverResult = solve(seed, false);
                        if (solverResult.metrics) {
                            solverCases++;
                            difficultyCount[solverResult.metrics.difficultyTier]++;
                            if (solverResult.correct) {
                                difficultySolved[solverResult.metrics.difficultyTier]++;
                                solveCount++;
                            }
                            if (solverResult.metrics.culpritHasSelfContradiction) culpritSelfContradiction++;
                            if (solverResult.metrics.culpritHasCrimeSceneLie) culpritCrimeSceneLie++;
                            if (solverResult.metrics.culpritHasSignatureMotive) culpritSignatureMotive++;
                            if (solverResult.metrics.maxInnocentContradictions >= solverResult.metrics.culpritContradictionCount) {
                                falsePositiveRisk++;
                            }
                            totalCulpritContradictions += solverResult.metrics.culpritContradictionCount;
                            totalInnocentContradictions += solverResult.metrics.maxInnocentContradictions;
                        }
                    }

                    const passRate = total > 0 ? playable / total : 0;
                    const avgMargin = total > 0 ? totalMargin / total : 0;
                    const avgMinAP = total > 0 ? totalMinAP / total : 0;

                    // Guidance metrics averages
                    const avgWindowSignalAP = total > 0 ? totalWindowSignalAP / total : 0;
                    const avgKeystoneReachAP = total > 0 ? totalKeystoneReachAP / total : 0;
                    const avgWindowSpread = total > 0 ? totalWindowSpread / total : 0;

                    // Solver metrics
                    const solverMetrics: SolverMetrics = {
                        difficultyCount,
                        difficultySolved,
                        culpritSelfContradiction,
                        culpritCrimeSceneLie,
                        culpritSignatureMotive,
                        falsePositiveRisk,
                        avgCulpritContradictions: solverCases > 0 ? totalCulpritContradictions / solverCases : 0,
                        avgInnocentContradictions: solverCases > 0 ? totalInnocentContradictions / solverCases : 0,
                        solveRate: solverCases > 0 ? solveCount / solverCases : 0,
                        solveCount,
                    };

                    results.push({
                        constraints,
                        passRate,
                        avgAPMargin: avgMargin,
                        avgMinAP,
                        issues,
                        avgWindowSignalAP,
                        avgKeystoneReachAP,
                        avgWindowSpread,
                        clarityDistribution: clarityCount,
                        solverMetrics,
                    });

                    process.stdout.write(`\r  [${configNum}/${totalConfigs}] days=${days} ap=${apPerDay} cover=${coverUpDay ?? 'none'} leads=${maxLeads} → ${(passRate * 100).toFixed(0)}% playable, ${(solverMetrics.solveRate * 100).toFixed(0)}% solved`);
                }
            }
        }
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('TUNER RESULTS (sorted by pass rate, then margin)');
    console.log('='.repeat(80));

    // Sort by pass rate descending, then by margin descending
    results.sort((a, b) => {
        if (b.passRate !== a.passRate) return b.passRate - a.passRate;
        return b.avgAPMargin - a.avgAPMargin;
    });

    // Show top 10
    console.log('\nTop 10 configurations:\n');
    console.log('  Days  AP/Day  Cover  Leads | Pass%  Margin  MinAP | Signal  Keystone  Spread | Solve%');
    console.log('  ' + '-'.repeat(88));

    for (let i = 0; i < Math.min(10, results.length); i++) {
        const r = results[i];
        const c = r.constraints;
        const coverStr = c.coverUpDay !== null ? `D${c.coverUpDay}` : '--';
        const solveStr = r.solverMetrics ? `${(r.solverMetrics.solveRate * 100).toFixed(0)}%` : '-';
        console.log(
            `  ${c.maxDays.toString().padEnd(4)}  ${c.apPerDay.toString().padEnd(6)}  ${coverStr.padEnd(5)}  ${c.maxLeads.toString().padEnd(5)} | ` +
            `${(r.passRate * 100).toFixed(0).padStart(4)}%  ${r.avgAPMargin.toFixed(1).padStart(6)}  ${r.avgMinAP.toFixed(1).padStart(5)} | ` +
            `${r.avgWindowSignalAP.toFixed(1).padStart(6)}  ${r.avgKeystoneReachAP.toFixed(1).padStart(8)}  ${r.avgWindowSpread.toFixed(1).padStart(6)} | ${solveStr.padStart(5)}`
        );
    }

    // Find best config that's >= 90% pass rate
    const best90 = results.find(r => r.passRate >= 0.9);
    if (best90) {
        console.log('\n' + '='.repeat(80));
        console.log('RECOMMENDED CONFIG (>=90% pass rate):');
        console.log('='.repeat(80));
        console.log(`\n  maxDays: ${best90.constraints.maxDays}`);
        console.log(`  apPerDay: ${best90.constraints.apPerDay}`);
        console.log(`  coverUpDay: ${best90.constraints.coverUpDay ?? 'null (no cover-up)'}`);
        console.log(`  maxLeads: ${best90.constraints.maxLeads}`);
        console.log(`\n  Pass rate: ${(best90.passRate * 100).toFixed(1)}%`);
        console.log(`  Avg AP margin: ${best90.avgAPMargin.toFixed(1)}`);
        console.log(`  Avg min AP: ${best90.avgMinAP.toFixed(1)}`);
        console.log(`\n  GUIDANCE METRICS:`);
        console.log(`  Avg window signal AP: ${best90.avgWindowSignalAP.toFixed(1)} (lower = easier to find crime window)`);
        console.log(`  Avg keystone reach AP: ${best90.avgKeystoneReachAP.toFixed(1)} (lower = easier to find contradiction)`);
        console.log(`  Avg window spread: ${best90.avgWindowSpread.toFixed(1)}`);
        const totalClarity = (best90.clarityDistribution.clear || 0) + (best90.clarityDistribution.moderate || 0) + (best90.clarityDistribution.unclear || 0);
        if (totalClarity > 0) {
            console.log(`  First move clarity: clear=${((best90.clarityDistribution.clear || 0) / totalClarity * 100).toFixed(0)}% moderate=${((best90.clarityDistribution.moderate || 0) / totalClarity * 100).toFixed(0)}% unclear=${((best90.clarityDistribution.unclear || 0) / totalClarity * 100).toFixed(0)}%`);
        }

        // Show solver metrics for best config
        if (best90.solverMetrics) {
            const sm = best90.solverMetrics;
            const totalCases = sm.difficultyCount.easy + sm.difficultyCount.medium + sm.difficultyCount.hard + sm.difficultyCount.unsolvable;

            console.log(`\n  SOLVER METRICS:`);
            console.log(`  Solve rate: ${(sm.solveRate * 100).toFixed(1)}% (${sm.solveCount}/${totalCases})`);

            console.log(`\n  Difficulty Distribution:`);
            console.log(`    easy:       ${sm.difficultyCount.easy.toString().padStart(3)} (${(sm.difficultyCount.easy/totalCases*100).toFixed(0)}%)  solved: ${sm.difficultySolved.easy}`);
            console.log(`    medium:     ${sm.difficultyCount.medium.toString().padStart(3)} (${(sm.difficultyCount.medium/totalCases*100).toFixed(0)}%)  solved: ${sm.difficultySolved.medium}`);
            console.log(`    hard:       ${sm.difficultyCount.hard.toString().padStart(3)} (${(sm.difficultyCount.hard/totalCases*100).toFixed(0)}%)  solved: ${sm.difficultySolved.hard}`);
            console.log(`    unsolvable: ${sm.difficultyCount.unsolvable.toString().padStart(3)} (${(sm.difficultyCount.unsolvable/totalCases*100).toFixed(0)}%)  solved: ${sm.difficultySolved.unsolvable}`);

            console.log(`\n  Signal Availability (culprit has...):`);
            console.log(`    Self-contradiction: ${sm.culpritSelfContradiction}/${totalCases} (${(sm.culpritSelfContradiction/totalCases*100).toFixed(0)}%)`);
            console.log(`    Crime scene lie:    ${sm.culpritCrimeSceneLie}/${totalCases} (${(sm.culpritCrimeSceneLie/totalCases*100).toFixed(0)}%)`);
            console.log(`    Signature motive:   ${sm.culpritSignatureMotive}/${totalCases} (${(sm.culpritSignatureMotive/totalCases*100).toFixed(0)}%)`);

            console.log(`\n  False Positive Risk:`);
            console.log(`    Cases where innocent >= culprit contradictions: ${sm.falsePositiveRisk}/${totalCases} (${(sm.falsePositiveRisk/totalCases*100).toFixed(0)}%)`);
            console.log(`    Avg culprit contradictions:  ${sm.avgCulpritContradictions.toFixed(1)}`);
            console.log(`    Avg innocent contradictions: ${sm.avgInnocentContradictions.toFixed(1)}`);
        }
    } else {
        console.log('\n⚠️  No configuration achieved 90% pass rate!');
        console.log('Consider making cases easier or increasing player resources.');
    }

    console.log('\n');
}

// ============================================================================
// Main
// ============================================================================

const args = parseArgs();

if (args.tune) {
    // Grid search tuner mode
    runTuner(args.generate, 0, args.useBlueprints, args.tier);
} else if (args.autosolve) {
    // Automated solver mode - practical playtest
    autosolve(args.generate, args.seed ?? 1, args.verbose);
} else if (args.playability) {
    // Playability check mode
    runPlayabilityCheck(args.generate, 0, args.verbose, args.useBlueprints, args.tier);
} else if (args.seed !== undefined) {
    // Single seed mode - show full comedy details
    const mode = args.useBlueprints ? ' (BLUEPRINTS)' : '';
    const configLabel = args.houseId || args.castId ? ` [${args.houseId ?? 'share_house'}+${args.castId ?? 'roommates'}]` : '';
    console.log(`\nGenerating case with seed ${args.seed}${mode}${configLabel}...\n`);

    const result = simulate(args.seed, args.tier, {
        useBlueprints: args.useBlueprints,
        houseId: args.houseId,
        castId: args.castId,
    });

    if (!result) {
        console.log('⚠️ No valid crime opportunity for this seed');
        process.exit(1);
    }

    const evidence = deriveEvidence(result.world, result.eventLog, result.config);
    const validation = validateCase(result.world, result.config, evidence, DEFAULT_DIFFICULTY);

    const config = result.config;
    const item = result.world.items.find(i => i.id === config.targetItem);
    const culprit = result.world.npcs.find(n => n.id === config.culpritId);

    console.log('='.repeat(60));
    console.log('🎭 THE CRIME');
    console.log('='.repeat(60));
    console.log(`\n🎯 Crime Type: ${config.crimeType.toUpperCase()}`);
    console.log(`📦 Target: ${item?.funnyName}`);
    console.log(`🔧 How: ${config.crimeMethod.description} ${config.crimeMethod.funnyMethod}`);
    console.log(`📍 Where: ${config.crimePlace}`);
    console.log(`🕐 When: ${config.crimeWindow} (7:00pm - 8:30pm)`);
    console.log(`🕵️ Hidden in: ${config.hiddenPlace}`);
    if (config.distractedWitnesses && config.distractedWitnesses.length > 0) {
        const names = config.distractedWitnesses
            .map(id => result.world.npcs.find(n => n.id === id)?.name)
            .filter(Boolean)
            .join(', ');
        console.log(`😴 Distracted witness(es): ${names} (was there but didn't notice)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 THE CULPRIT');
    console.log('='.repeat(60));
    console.log(`\n👤 ${culprit?.name} (${culprit?.role})`);

    console.log('\n' + '='.repeat(60));
    console.log('💭 THE MOTIVE (Comedy Engine)');
    console.log('='.repeat(60));
    console.log(`\n🎭 Type: ${config.motive.type}`);
    console.log(`📝 Description: ${config.motive.description}`);
    console.log(`😂 Why really: "${config.motive.funnyReason}"`);
    if (config.motive.target) {
        const target = result.world.npcs.find(n => n.id === config.motive.target);
        console.log(`🎯 Against: ${target?.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🚨 SUSPICIOUS ACTS (Red Herrings)');
    console.log('='.repeat(60));
    for (const act of config.suspiciousActs) {
        const npc = result.world.npcs.find(n => n.id === act.npc);
        console.log(`\n👤 ${npc?.name} (${act.window})`);
        console.log(`   🔍 Seen: ${act.action}`);
        console.log(`   🤔 Looks like: ${act.looksLike}`);
        console.log(`   😅 Actually: ${act.actualReason}`);

        // Find evidence related to this act
        const relatedEvidence = evidence.filter(e =>
            (e.kind === 'physical' && e.item === 'trace' && e.place === act.place && e.window === act.window) ||
            (e.kind === 'testimony' && e.window === act.window && e.observable.startsWith('heard '))
        );

        // Lookup definition
        const actDef = Object.values(ACTIVITIES).find(d => d.visualDescription === act.action);

        if (relatedEvidence.length > 0 && actDef) {
            console.log('   📂 Evidence Traces:');
            for (const e of relatedEvidence) {
                if (e.kind === 'physical') {
                    // Only show if it matches definition
                    if (actDef.physicalTraces.some(t => (e as any).detail.includes(t))) {
                        console.log(`      - 🕵️ ${(e as any).detail}`);
                    }
                } else if (e.kind === 'testimony') {
                    // Check if the sound matches the activity
                    const obs = (e as any).observable;
                    if (actDef.audioClues.some(sound => obs.includes(sound))) {
                        console.log(`      - 👂 Witness ${(e as any).witness}: "${obs}"`);
                    }
                }
            }
        }
    }

    if (config.twist) {
        console.log('\n' + '='.repeat(60));
        console.log('🔀 TWIST');
        console.log('='.repeat(60));
        console.log(`\n⚡ Type: ${config.twist.type}`);
        console.log(`📝 ${config.twist.description}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('💕 RELATIONSHIPS');
    console.log('='.repeat(60));
    for (const rel of result.world.relationships) {
        const from = result.world.npcs.find(n => n.id === rel.from);
        const to = result.world.npcs.find(n => n.id === rel.to);
        console.log(`\n${from?.name} → ${to?.name} (${rel.type}, intensity ${rel.intensity})`);
        console.log(`   "${rel.backstory}"`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VALIDATION');
    console.log('='.repeat(60));
    console.log(`\n${validation.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Evidence count: ${validation.evidenceCount}`);
    console.log(`Solvability: ${validation.solvability.valid ? '✓' : '✗'} ${validation.solvability.reason || ''}`);
    console.log(`Anti-anticlimax: ${validation.antiAnticlimax.valid ? '✓' : '✗'} ${validation.antiAnticlimax.reason || ''}`);
    console.log(`Red herrings: ${validation.redHerrings.valid ? '✓' : '✗'} ${validation.redHerrings.reason || ''}`);

    // Show difficulty metrics
    if (validation.difficulty) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DIFFICULTY METRICS');
        console.log('='.repeat(60));
        console.log(`\nEstimated minimum AP: ${validation.difficulty.estimatedMinAP}`);
        console.log(`Contradiction count: ${validation.difficulty.contradictionCount}`);
        console.log(`Branching factor: ${validation.difficulty.branchingFactor}`);
        console.log(`Chains by target:`);
        for (const [target, count] of Object.entries(validation.difficulty.chainsByTarget)) {
            console.log(`  ${target.toUpperCase()}: ${count} chain(s)`);
        }
        console.log(`Difficulty valid: ${validation.difficulty.valid ? '✓' : '✗'} ${validation.difficulty.reason || ''}`);
    }

    if (validation.funness) {
        console.log(`Funness valid: ${validation.funness.valid ? '✓' : '✗'} ${validation.funness.reason || ''}`);
    }

    if (validation.contradictions && validation.contradictions.length > 0) {
        console.log('\n📍 Contradictions found:');
        for (const c of validation.contradictions) {
            console.log(`  - ${c.rule}: ${c.evidenceA} vs ${c.evidenceB}`);
        }
    }

    if (validation.passed) {
        console.log('\n' + '='.repeat(60));
        console.log('🕵️ SOLUTION PATH (How the Player Solves It)');
        console.log('='.repeat(60));

        const chains = findImplicatingChains(config.culpritId, config, evidence);
        for (const chain of chains) {
            console.log(`\n🔗 ${chain.type.toUpperCase()} CHAIN (${Math.round(chain.confidence * 100)}% Confidence)`);
            for (const e of chain.evidence) {
                if (e.kind === 'presence') {
                    console.log(`   - Verified at ${e.place} during ${e.window}`);
                } else if (e.kind === 'device_log') {
                    console.log(`   - Device: ${e.detail} at ${e.place} during ${e.window}`);
                } else if (e.kind === 'testimony') {
                    console.log(`   - Witness ${e.witness}: "${e.observable}" (Pointed to ${e.subjectHint})`);
                } else if (e.kind === 'physical') {
                    console.log(`   - Found ${e.item} at ${e.place}: "${e.detail}"`);
                }
            }
        }
    }

    console.log('');

} else {
    // Batch mode
    runBatch(args.generate, 0, args.verbose, args.useBlueprints, args.tier, args.houseId, args.castId);
}

