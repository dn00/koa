/**
 * CaseBundle generation and verification
 *
 * Bridges the simulation pipeline with the publish format.
 * Bundles contain public game data + solution hash — never spoilers.
 */

import type {
    World,
    CaseConfig,
    CaseBundle,
    Solution,
    WorldSnapshot,
    WorldSnapshotNPC,
    BundleValidatorReport,
    DifficultyTier,
} from './types.js';
import {
    RULESET_VERSION,
    DIFFICULTY_PROFILES,
    profileToDifficultyConfig,
} from './types.js';
import { canonicalJson, sha256 } from './kernel/canonical.js';
import { generateValidatedCase } from './sim.js';
import { analyzeSignal, validatePlayability, getAllChains, validateCase } from './validators.js';

/** Strip World down to client-safe WorldSnapshot */
export function toWorldSnapshot(world: World): WorldSnapshot {
    return {
        places: world.places,
        devices: world.devices,
        items: world.items,
        npcs: world.npcs.map((npc): WorldSnapshotNPC => ({
            id: npc.id,
            name: npc.name,
            role: npc.role,
        })),
    };
}

/** Extract Solution from CaseConfig */
export function extractSolution(config: CaseConfig): Solution {
    return {
        who: config.culpritId,
        what: config.crimeType,
        when: config.crimeWindow,
        where: config.crimePlace,
        how: config.crimeMethod.methodId,
        why: config.motive.type,
    };
}

/** Hash a Solution using canonical JSON + SHA256 */
export function hashSolution(solution: Solution): string {
    return sha256(canonicalJson(solution));
}

/** Verify a player's answer against a bundle's solution hash */
export function verifyAnswer(solutionHash: string, answer: Solution): boolean {
    return hashSolution(answer) === solutionHash;
}

export interface BundleOptions {
    bundleId?: string;
    houseId?: string;
    castId?: string;
}

export interface BundleValidationResult {
    valid: boolean;
    issues: string[];
    hashMatch: boolean;
    reportMatch: boolean;
    rulesetMatch: boolean;
}

/** Validate a bundle by regenerating from seed and checking consistency */
export function validateBundle(
    bundle: CaseBundle,
    tier?: DifficultyTier,
): BundleValidationResult {
    const issues: string[] = [];
    const effectiveTier = tier ?? bundle.tier;

    // Check ruleset version
    const rulesetMatch = bundle.rulesetVersion === RULESET_VERSION;
    if (!rulesetMatch) {
        issues.push(`Ruleset version mismatch: bundle=${bundle.rulesetVersion}, current=${RULESET_VERSION}`);
    }

    // Regenerate from seed
    const regenerated = generateValidatedCase(bundle.seed, effectiveTier);
    if (!regenerated) {
        return { valid: false, issues: ['Failed to regenerate case from seed'], hashMatch: false, reportMatch: false, rulesetMatch };
    }

    // Verify solution hash
    const solution = extractSolution(regenerated.sim.config);
    const expectedHash = hashSolution(solution);
    const hashMatch = expectedHash === bundle.solutionHash;
    if (!hashMatch) {
        issues.push('Solution hash does not match regenerated case');
    }

    // Verify validator report key fields
    const signal = analyzeSignal(regenerated.evidence, regenerated.sim.config);
    const reportMatch = (
        bundle.validatorReport.signalType === signal.signalType &&
        bundle.validatorReport.keystoneExists === signal.hasSignal
    );
    if (!reportMatch) {
        issues.push('Validator report does not match regenerated case');
    }

    return {
        valid: hashMatch && reportMatch,
        issues,
        hashMatch,
        reportMatch,
        rulesetMatch,
    };
}

/** Generate a complete CaseBundle from a seed */
export function generateBundle(
    seed: number,
    tier: DifficultyTier = 2,
    options: BundleOptions = {},
): CaseBundle | null {
    const result = generateValidatedCase(seed, tier, {
        houseId: options.houseId,
        castId: options.castId,
    });
    if (!result) return null;

    const { sim, evidence } = result;
    const { world, config } = sim;

    const signal = analyzeSignal(evidence, config);
    const chains = getAllChains(config, evidence);
    const playability = validatePlayability(config, evidence, chains);
    const validation = validateCase(
        world,
        config,
        evidence,
        profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]),
    );

    const validatorReport: BundleValidatorReport = {
        solvable: validation.solvability.valid,
        playable: playability.playable,
        signalType: signal.signalType,
        signalStrength: signal.signalStrength,
        keystoneExists: signal.hasSignal,
        estimatedMinAP: validation.difficulty?.estimatedMinAP ?? 0,
        contradictionCount: validation.difficulty?.contradictionCount ?? 0,
        difficulty: tier,
    };

    const solution = extractSolution(config);
    const solutionHash = hashSolution(solution);

    return {
        version: '1.0.0',
        bundleId: options.bundleId ?? `seed-${seed}`,
        rulesetVersion: RULESET_VERSION,
        generatedAt: new Date().toISOString(),
        seed,
        tier,
        world: toWorldSnapshot(world),
        suspects: config.suspects,
        validatorReport,
        solutionHash,
    };
}
