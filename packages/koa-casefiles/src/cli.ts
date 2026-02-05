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
import { validateCase, findImplicatingChains, getAllChains } from './validators.js';
import type { CaseValidation, DifficultyConfig } from './types.js';
import { ACTIVITIES } from './activities.js';

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
}

function parseArgs(): Args {
    const args = process.argv.slice(2);
    let generate = 100;
    let seed: number | undefined;
    let verbose = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--generate' || arg === '-g') {
            generate = parseInt(args[++i], 10) || 100;
        } else if (arg === '--seed' || arg === '-s') {
            seed = parseInt(args[++i], 10);
            generate = 1;
        } else if (arg === '--verbose' || arg === '-v') {
            verbose = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
KOA Casefiles - Case Generation Validator

Usage:
  npx tsx src/cli.ts [options]

Options:
  --generate, -g <n>   Generate and validate n cases (default: 100)
  --seed, -s <n>       Generate single case with specific seed
  --verbose, -v        Show detailed output
  --help, -h           Show this help
`);
            process.exit(0);
        }
    }

    return { generate, seed, verbose };
}

// ============================================================================
// Single Case Generation
// ============================================================================

function generateCase(seed: number, verbose: boolean): CaseValidation | null {
    const result = simulate(seed);

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

function runBatch(count: number, startSeed: number, verbose: boolean): void {
    console.log(`\nGenerating ${count} cases...\n`);

    let passed = 0;
    let failed = 0;
    let noOpportunity = 0;
    const failureReasons: Record<string, number> = {};

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;
        const validation = generateCase(seed, verbose);

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
// Main
// ============================================================================

const args = parseArgs();

if (args.seed !== undefined) {
    // Single seed mode - show full comedy details
    console.log(`\nGenerating case with seed ${args.seed}...\n`);

    const result = simulate(args.seed);

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
    if (config.distractedWitness) {
        const witness = result.world.npcs.find(n => n.id === config.distractedWitness);
        console.log(`😴 Distracted witness: ${witness?.name} (was there but didn't notice)`);
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
    runBatch(args.generate, 0, args.verbose);
}

