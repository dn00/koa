/**
 * KOA Casefiles - Batch Seed Validator
 *
 * Validates multiple seeds and outputs metrics for tuning.
 *
 * Usage:
 *   npx tsx src/validate-seeds.ts [--count N] [--start S] [--verbose]
 */

import { simulate } from './sim.js';
import { deriveEvidence } from './evidence.js';
import {
    validateCase,
    validatePlayability,
    getAllChains,
    findContradictions,
    findKeystonePair,
    DEFAULT_PLAYER_CONSTRAINTS,
} from './validators.js';
import type {
    CaseConfig,
    EvidenceItem,
    NPCId,
    PlayabilityResult,
} from './types.js';

// ============================================================================
// Metrics Types
// ============================================================================

interface SeedValidation {
    seed: number;
    valid: boolean;
    playable: boolean;

    // The truth
    culprit: NPCId;
    crimeType: string;
    method: string;
    crimeWindow: string;
    crimePlace: string;   // WHERE answer (origin)
    hiddenPlace: string;  // Where item was found
    motive: string;

    // WHERE ambiguity check
    whereOriginMatchesFound: boolean;  // true if crime and hidden place are same

    // Solvability metrics
    minAP: number;
    apMargin: number;
    contradictionCount: number;
    hasKeystone: boolean;
    keystoneImplicatesCulprit: boolean;

    // Discoverability per part
    whoDiscoverable: boolean;
    whatDiscoverable: boolean;
    howDiscoverable: boolean;
    whenDiscoverable: boolean;
    whereDiscoverable: boolean;
    whyDiscoverable: boolean;

    // Quality metrics
    redHerringCount: number;
    culpritHasDoorLog: boolean;
    culpritHasTestimony: boolean;
    falseAlibiExists: boolean;
    firstMoveClarity: 'clear' | 'moderate' | 'unclear';

    // Issues
    issues: string[];
}

interface BatchResults {
    totalSeeds: number;
    validCount: number;
    playableCount: number;
    validRate: number;
    playableRate: number;

    // AP distribution
    avgMinAP: number;
    minAPDistribution: Record<string, number>;

    // Clarity distribution
    clarityDistribution: Record<string, number>;

    // Discoverability rates
    whoDiscoverableRate: number;
    whatDiscoverableRate: number;
    howDiscoverableRate: number;
    whenDiscoverableRate: number;
    whereDiscoverableRate: number;
    whyDiscoverableRate: number;

    // Quality metrics
    avgContradictions: number;
    keystoneRate: number;
    culpritDoorLogRate: number;
    falseAlibiRate: number;

    // Common issues
    issueFrequency: Record<string, number>;

    // Good seeds (playable with clear first move)
    goodSeeds: number[];

    // Per-seed details (if verbose)
    seeds?: SeedValidation[];
}

// ============================================================================
// Validation Logic
// ============================================================================

function validateSeed(seed: number): SeedValidation | null {
    // Run simulation
    const result = simulate(seed, 2, { useBlueprints: true });

    if (!result) {
        return null;
    }

    const { world, config, eventLog } = result;

    // Derive evidence
    const evidence = deriveEvidence(world, eventLog, config);

    // Run validators
    const caseValidation = validateCase(world, config, evidence);
    const chains = getAllChains(config, evidence);
    const playability = validatePlayability(config, evidence, chains, DEFAULT_PLAYER_CONSTRAINTS);
    const contradictions = findContradictions(evidence, config);
    const keystone = findKeystonePair(config, evidence, contradictions);

    // Check discoverability per part
    const whoDiscoverable = chains.who.length > 0;
    const howDiscoverable = chains.how.length > 0 || hasMethodInPhysical(evidence, config);
    const whenDiscoverable = chains.when.length > 0 || hasCrimeAwareness(evidence);
    const whereDiscoverable = chains.where.length > 0 || hasCrimeAwareness(evidence);
    const whyDiscoverable = chains.why.length > 0 || hasCulpritMotive(evidence, config);
    const whatDiscoverable = hasPhysicalEvidence(evidence, config);

    // Check culprit appears in door logs
    const culpritHasDoorLog = evidence.some(e =>
        e.kind === 'device_log' &&
        e.deviceType === 'door_sensor' &&
        e.actor === config.culpritId
    );

    // Check culprit mentioned in testimony
    const culpritHasTestimony = evidence.some(e =>
        e.kind === 'testimony' &&
        (e.subject === config.culpritId || e.subjectHint?.toLowerCase() === config.culpritId)
    );

    // Check false alibi exists (culprit claims wrong location)
    const falseAlibiExists = evidence.some(e =>
        e.kind === 'testimony' &&
        e.witness === config.culpritId &&
        e.place !== config.crimePlace &&
        e.window === config.crimeWindow &&
        (e.observable.includes('claims') || e.observable.includes('insists'))
    );

    // Count red herrings (innocents with opportunity at crime scene)
    const redHerringCount = countRedHerrings(evidence, config);

    // Keystone implicates culprit?
    const keystoneImplicatesCulprit = keystone?.implicated.includes(config.culpritId) ?? false;

    return {
        seed,
        valid: caseValidation.passed,
        playable: playability.playable,

        culprit: config.culpritId,
        crimeType: config.crimeType,
        method: config.crimeMethod.methodId,
        crimeWindow: config.crimeWindow,
        crimePlace: config.crimePlace,
        hiddenPlace: config.hiddenPlace,
        motive: config.motive.type,
        whereOriginMatchesFound: config.crimePlace === config.hiddenPlace,

        minAP: playability.minAPToSolve,
        apMargin: playability.apMargin,
        contradictionCount: contradictions.length,
        hasKeystone: !!keystone,
        keystoneImplicatesCulprit,

        whoDiscoverable,
        whatDiscoverable,
        howDiscoverable,
        whenDiscoverable,
        whereDiscoverable,
        whyDiscoverable,

        redHerringCount,
        culpritHasDoorLog,
        culpritHasTestimony,
        falseAlibiExists,
        firstMoveClarity: playability.firstMoveClarity,

        issues: playability.issues,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function hasMethodInPhysical(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'physical' &&
        e.item === config.targetItem &&
        e.methodTag
    );
}

function hasCrimeAwareness(evidence: EvidenceItem[]): boolean {
    return evidence.some(e =>
        e.kind === 'motive' &&
        e.motiveHint === 'crime_awareness'
    );
}

function hasCulpritMotive(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'motive' &&
        e.suspect === config.culpritId &&
        e.motiveHint === config.motive.type
    );
}

function hasPhysicalEvidence(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'physical' &&
        e.item === config.targetItem
    );
}

function countRedHerrings(evidence: EvidenceItem[], config: CaseConfig): number {
    // Count innocents who have presence at crime scene during crime window
    const innocents = config.suspects.filter(s => s !== config.culpritId);

    let count = 0;
    for (const suspect of innocents) {
        const atScene = evidence.some(e =>
            e.kind === 'presence' &&
            e.npc === suspect &&
            e.window === config.crimeWindow &&
            e.place === config.crimePlace
        );
        if (atScene) count++;
    }

    return count;
}

// ============================================================================
// Batch Processing
// ============================================================================

function runBatch(startSeed: number, count: number, verbose: boolean): BatchResults {
    const validations: SeedValidation[] = [];
    const failedSeeds: number[] = [];

    console.log(`\nValidating ${count} seeds starting from ${startSeed}...\n`);

    for (let i = 0; i < count; i++) {
        const seed = startSeed + i;

        try {
            const result = validateSeed(seed);

            if (result) {
                validations.push(result);

                if (verbose) {
                    const status = result.playable ? '✅' : result.valid ? '⚠️' : '❌';
                    console.log(`${status} Seed ${seed}: AP=${result.minAP}, clarity=${result.firstMoveClarity}, contradictions=${result.contradictionCount}`);
                } else if ((i + 1) % 10 === 0) {
                    process.stdout.write('.');
                }
            } else {
                failedSeeds.push(seed);
                if (verbose) {
                    console.log(`❌ Seed ${seed}: simulation failed`);
                }
            }
        } catch (err) {
            failedSeeds.push(seed);
            if (verbose) {
                console.log(`❌ Seed ${seed}: ${err}`);
            }
        }
    }

    if (!verbose) console.log('\n');

    // Aggregate results
    const validCount = validations.filter(v => v.valid).length;
    const playableCount = validations.filter(v => v.playable).length;

    // AP distribution
    const minAPDistribution: Record<string, number> = {};
    for (const v of validations) {
        const bucket = v.minAP <= 4 ? '1-4' :
                       v.minAP <= 6 ? '5-6' :
                       v.minAP <= 8 ? '7-8' :
                       v.minAP <= 10 ? '9-10' : '11+';
        minAPDistribution[bucket] = (minAPDistribution[bucket] || 0) + 1;
    }

    // Clarity distribution
    const clarityDistribution: Record<string, number> = {
        clear: 0,
        moderate: 0,
        unclear: 0,
    };
    for (const v of validations) {
        clarityDistribution[v.firstMoveClarity]++;
    }

    // Issue frequency
    const issueFrequency: Record<string, number> = {};
    for (const v of validations) {
        for (const issue of v.issues) {
            // Normalize issue text
            const key = issue.split(':')[0].trim();
            issueFrequency[key] = (issueFrequency[key] || 0) + 1;
        }
    }

    // Good seeds (playable + clear first move)
    const goodSeeds = validations
        .filter(v => v.playable && v.firstMoveClarity === 'clear')
        .map(v => v.seed);

    const total = validations.length;

    return {
        totalSeeds: count,
        validCount,
        playableCount,
        validRate: total > 0 ? validCount / total : 0,
        playableRate: total > 0 ? playableCount / total : 0,

        avgMinAP: total > 0 ? validations.reduce((sum, v) => sum + v.minAP, 0) / total : 0,
        minAPDistribution,

        clarityDistribution,

        whoDiscoverableRate: total > 0 ? validations.filter(v => v.whoDiscoverable).length / total : 0,
        whatDiscoverableRate: total > 0 ? validations.filter(v => v.whatDiscoverable).length / total : 0,
        howDiscoverableRate: total > 0 ? validations.filter(v => v.howDiscoverable).length / total : 0,
        whenDiscoverableRate: total > 0 ? validations.filter(v => v.whenDiscoverable).length / total : 0,
        whereDiscoverableRate: total > 0 ? validations.filter(v => v.whereDiscoverable).length / total : 0,
        whyDiscoverableRate: total > 0 ? validations.filter(v => v.whyDiscoverable).length / total : 0,

        avgContradictions: total > 0 ? validations.reduce((sum, v) => sum + v.contradictionCount, 0) / total : 0,
        keystoneRate: total > 0 ? validations.filter(v => v.hasKeystone).length / total : 0,
        culpritDoorLogRate: total > 0 ? validations.filter(v => v.culpritHasDoorLog).length / total : 0,
        falseAlibiRate: total > 0 ? validations.filter(v => v.falseAlibiExists).length / total : 0,

        issueFrequency,
        goodSeeds,

        seeds: validations, // Always include for metric calculation
    };
}

// ============================================================================
// Output Formatting
// ============================================================================

function printResults(results: BatchResults): void {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    KOA CASEFILES SEED VALIDATION              ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('SUMMARY');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Total seeds tested:     ${results.totalSeeds}`);
    console.log(`Valid cases:            ${results.validCount} (${(results.validRate * 100).toFixed(1)}%)`);
    console.log(`Playable cases:         ${results.playableCount} (${(results.playableRate * 100).toFixed(1)}%)`);
    console.log(`Good seeds (curated):   ${results.goodSeeds.length}\n`);

    console.log('AP DISTRIBUTION');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`Average min AP:         ${results.avgMinAP.toFixed(1)}`);
    for (const [bucket, count] of Object.entries(results.minAPDistribution)) {
        const bar = '█'.repeat(Math.round(count / results.totalSeeds * 40));
        console.log(`  ${bucket.padEnd(6)} ${bar} ${count}`);
    }
    console.log();

    console.log('FIRST MOVE CLARITY');
    console.log('───────────────────────────────────────────────────────────────');
    for (const [clarity, count] of Object.entries(results.clarityDistribution)) {
        const pct = (count / results.totalSeeds * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(count / results.totalSeeds * 40));
        console.log(`  ${clarity.padEnd(10)} ${bar} ${count} (${pct}%)`);
    }
    console.log();

    console.log('DISCOVERABILITY RATES');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`  WHO:   ${(results.whoDiscoverableRate * 100).toFixed(1)}%`);
    console.log(`  WHAT:  ${(results.whatDiscoverableRate * 100).toFixed(1)}%`);
    console.log(`  HOW:   ${(results.howDiscoverableRate * 100).toFixed(1)}%`);
    console.log(`  WHEN:  ${(results.whenDiscoverableRate * 100).toFixed(1)}%`);
    console.log(`  WHERE: ${(results.whereDiscoverableRate * 100).toFixed(1)}%`);
    console.log(`  WHY:   ${(results.whyDiscoverableRate * 100).toFixed(1)}%`);
    console.log();

    console.log('QUALITY METRICS');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`  Avg contradictions:      ${results.avgContradictions.toFixed(1)}`);
    console.log(`  Keystone exists:         ${(results.keystoneRate * 100).toFixed(1)}%`);
    console.log(`  Culprit in door logs:    ${(results.culpritDoorLogRate * 100).toFixed(1)}%`);
    console.log(`  False alibi exists:      ${(results.falseAlibiRate * 100).toFixed(1)}%`);

    // WHERE ambiguity metric
    const whereAmbiguousCount = results.seeds
        ? results.seeds.filter(s => !s.whereOriginMatchesFound).length
        : 0;
    if (results.seeds) {
        console.log(`  WHERE origin≠found:      ${whereAmbiguousCount} (${(whereAmbiguousCount / results.seeds.length * 100).toFixed(1)}%)`);
    }
    console.log();

    if (Object.keys(results.issueFrequency).length > 0) {
        console.log('COMMON ISSUES');
        console.log('───────────────────────────────────────────────────────────────');
        const sortedIssues = Object.entries(results.issueFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        for (const [issue, count] of sortedIssues) {
            console.log(`  ${count.toString().padStart(3)} - ${issue}`);
        }
        console.log();
    }

    if (results.goodSeeds.length > 0) {
        console.log('CURATED SEEDS (playable + clear first move)');
        console.log('───────────────────────────────────────────────────────────────');
        // Print in rows of 10
        for (let i = 0; i < Math.min(50, results.goodSeeds.length); i += 10) {
            const row = results.goodSeeds.slice(i, i + 10).join(', ');
            console.log(`  ${row}`);
        }
        if (results.goodSeeds.length > 50) {
            console.log(`  ... and ${results.goodSeeds.length - 50} more`);
        }
        console.log();
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
    const args = process.argv.slice(2);

    let count = 100;
    let startSeed = 1;
    let verbose = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--count' && args[i + 1]) {
            count = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--start' && args[i + 1]) {
            startSeed = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--verbose' || args[i] === '-v') {
            verbose = true;
        }
    }

    const results = runBatch(startSeed, count, verbose);
    printResults(results);

    // Output curated seeds as JSON for easy use
    if (results.goodSeeds.length > 0) {
        console.log('// Curated seeds (copy-paste ready):');
        console.log(`const CURATED_SEEDS = ${JSON.stringify(results.goodSeeds.slice(0, 50))};`);
    }
}

main();
