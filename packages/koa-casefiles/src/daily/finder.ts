import { createHmac } from 'crypto';
import {
    RULESET_VERSION,
    DIFFICULTY_PROFILES,
    DIFFICULTY_TIER_TARGETS,
    profileToDifficultyConfig,
    type DifficultyTier,
    type SimulationResult,
    type EvidenceItem,
    type CaseConfig,
    type SignalType,
    type PhysicalEvidence,
    type MotiveEvidence,
} from '../types.js';
import { generateValidatedCase } from '../sim.js';
import {
    validateCase,
    validatePlayability,
    validateDifficulty,
    validateFunness,
    getAllChains,
    analyzeSignal,
    analyzeMotiveAmbiguity,
    analyzeKeystoneDiscoverability,
} from '../validators.js';
import type { DailyCaseRecord } from './history.js';
import type { WeeklySchedule } from './schedule.js';

export interface FinderOptions {
    secret?: string;
    maxOffsets?: number;
    schedule?: WeeklySchedule;
    rulesetVersion?: string;
    candidatePool?: number;  // Number of valid candidates to collect before picking best (default 50)
}

export interface CandidateScore {
    total: number;            // 0-100 composite
    playability: number;      // 0-20 subscore
    difficultyFit: number;    // 0-20 subscore
    funness: number;          // 0-20 subscore
    discoverability: number;  // 0-20 subscore
    deductionQuality: number; // 0-20 subscore
}

export interface FinderResult {
    seed: number;
    tier: DifficultyTier;
    offset: number;
    culprit: string;
    crimeType: string;
    date: string;
    rulesetVersion: string;
    methodId: string;
    signalType: SignalType;
    score: number;
    scoreBreakdown: CandidateScore;
    candidatesEvaluated: number;
}

// ============================================================================
// Discoverability Helpers (reimplemented from validate-seeds.ts)
// ============================================================================

function hasMethodInPhysical(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'physical' &&
        (e as PhysicalEvidence).item === config.targetItem &&
        (e as PhysicalEvidence).methodTag
    );
}

function hasCrimeAwareness(evidence: EvidenceItem[]): boolean {
    return evidence.some(e =>
        e.kind === 'motive' &&
        (e as MotiveEvidence).motiveHint === 'crime_awareness'
    );
}

function hasCulpritMotive(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'motive' &&
        (e as MotiveEvidence).suspect === config.culpritId &&
        (e as MotiveEvidence).motiveHint === config.motive.type
    );
}

function hasPhysicalEvidence(evidence: EvidenceItem[], config: CaseConfig): boolean {
    return evidence.some(e =>
        e.kind === 'physical' &&
        (e as PhysicalEvidence).item === config.targetItem
    );
}

// ============================================================================
// Quality Scoring
// ============================================================================

/**
 * Score a validated case on a 0-100 scale using existing validators.
 * Deterministic: same case always produces same score.
 */
export function scoreDailyCandidate(
    sim: SimulationResult,
    evidence: EvidenceItem[],
    tier: DifficultyTier,
): CandidateScore {
    const config = sim.config;
    const chains = getAllChains(config, evidence);
    const diffConfig = profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]);

    // --- Playability (0-25 raw, scaled to 0-20) ---
    const play = validatePlayability(config, evidence, chains);
    let playabilityRaw = 0;
    // apMargin: 0-8 points (1 point per AP margin, max 8)
    playabilityRaw += Math.min(8, Math.max(0, play.apMargin));
    // firstMoveClarity: clear=8, moderate=4, unclear=0
    playabilityRaw += play.firstMoveClarity === 'clear' ? 8
        : play.firstMoveClarity === 'moderate' ? 4 : 0;
    // keystoneReachAP: low=5 (≤2), medium=3 (3-4), high=0 (5+)
    const kra = play.keystoneReachAP;
    playabilityRaw += kra >= 0 && kra <= 2 ? 5 : kra <= 4 ? 3 : 0;
    // windowSpread: 0-4 points (1 point per window, capped at 4)
    playabilityRaw += Math.min(4, play.windowSpread);
    playabilityRaw = Math.min(25, playabilityRaw);
    const playability = Math.round(playabilityRaw * 0.8);

    // --- Difficulty Fit (0-25 raw, scaled to 0-20) ---
    const diff = validateDifficulty(sim.world, config, evidence, diffConfig);
    const targets = DIFFICULTY_TIER_TARGETS[tier];
    let difficultyFitRaw = 0;
    // minAP closeness to tier midpoint: max 10 points
    const midpoint = (targets.minAP + targets.maxAP) / 2;
    const apDist = Math.abs(diff.estimatedMinAP - midpoint);
    const apRange = (targets.maxAP - targets.minAP) / 2;
    difficultyFitRaw += Math.round(Math.max(0, 10 - (apDist / Math.max(1, apRange)) * 10));
    // Contradiction count in range: 8 points
    if (diff.contradictionCount >= targets.minContradictions &&
        diff.contradictionCount <= targets.maxContradictions) {
        difficultyFitRaw += 8;
    } else {
        // Partial credit for being close
        const contDist = diff.contradictionCount < targets.minContradictions
            ? targets.minContradictions - diff.contradictionCount
            : diff.contradictionCount - targets.maxContradictions;
        difficultyFitRaw += Math.max(0, 8 - contDist * 2);
    }
    // Branching meets minimum: 7 points
    if (diff.branchingFactor >= targets.minBranching) {
        difficultyFitRaw += 7;
    } else {
        difficultyFitRaw += Math.max(0, 7 - (targets.minBranching - diff.branchingFactor) * 3);
    }
    difficultyFitRaw = Math.min(25, difficultyFitRaw);
    const difficultyFit = Math.round(difficultyFitRaw * 0.8);

    // --- Funness (0-25 raw, scaled to 0-20) ---
    const fun = validateFunness(config, evidence, chains);
    let funnessRaw = 0;
    // Passes all funness checks: 15 points
    if (fun.valid) {
        funnessRaw += 15;
    }
    // Has red herrings (suspiciousActs): +5
    if (config.suspiciousActs.length > 0) {
        funnessRaw += 5;
    }
    // Motive variety (multiple suspects with motive): +5
    const motiveEvidence = evidence.filter(e => e.kind === 'motive') as MotiveEvidence[];
    const suspectsWithMotive = new Set(motiveEvidence.map(m => m.suspect));
    if (suspectsWithMotive.size >= 2) {
        funnessRaw += 5;
    }
    funnessRaw = Math.min(25, funnessRaw);
    const funness = Math.round(funnessRaw * 0.8);

    // --- Discoverability (0-25 raw, scaled to 0-20) ---
    // 4 points per discoverable dimension, +1 bonus if all 6
    let discoverabilityRaw = 0;
    const whoDisc = chains.who.length > 0;
    const howDisc = chains.how.length > 0 || hasMethodInPhysical(evidence, config);
    const whenDisc = chains.when.length > 0 || hasCrimeAwareness(evidence);
    const whereDisc = chains.where.length > 0 || hasCrimeAwareness(evidence);
    const whyDisc = chains.why.length > 0 || hasCulpritMotive(evidence, config);
    const whatDisc = hasPhysicalEvidence(evidence, config);

    const dims = [whoDisc, whatDisc, howDisc, whenDisc, whereDisc, whyDisc];
    const discoveredCount = dims.filter(Boolean).length;
    discoverabilityRaw = discoveredCount * 4;
    if (discoveredCount === 6) discoverabilityRaw += 1;
    discoverabilityRaw = Math.min(25, discoverabilityRaw);
    const discoverability = Math.round(discoverabilityRaw * 0.8);

    // --- Deduction Quality (0-20) ---
    const signal = analyzeSignal(evidence, config);
    const motiveAmbiguity = analyzeMotiveAmbiguity(evidence, config);
    const keystoneDisc = analyzeKeystoneDiscoverability(evidence, config);

    let deductionQuality = 0;
    // Motive ambiguity (0-8): from analyzeMotiveAmbiguity
    deductionQuality += motiveAmbiguity.ambiguityScore;
    // Keystone discoverability (0-8): scaled from 0-10
    deductionQuality += Math.round(keystoneDisc.score * 0.8);
    // Signal strength (0-4): strong self/device contradiction = 4, medium = 2
    if (signal.signalStrength === 'strong' &&
        (signal.signalType === 'self_contradiction' || signal.signalType === 'device_contradiction')) {
        deductionQuality += 4;
    } else if (signal.signalStrength === 'medium') {
        deductionQuality += 2;
    }

    // Note: False-positive risk (innocent with HARD contradictions matching culprit)
    // is detected by the diagnostics script but not penalized here — it requires
    // running the full COMPARE scan which is too expensive for the finder.
    // The 50-candidate pool and existing scoring sufficiently avoids these seeds.

    deductionQuality = Math.max(0, Math.min(20, deductionQuality));

    const total = playability + difficultyFit + funness + discoverability + deductionQuality;

    return { total, playability, difficultyFit, funness, discoverability, deductionQuality };
}

export function getDailyBaseSeed(
    date: string,
    secret: string,
    rulesetVersion: string,
): number {
    const hmac = createHmac('sha256', secret);
    hmac.update(`${date}:${rulesetVersion}`);
    return parseInt(hmac.digest('hex').slice(0, 8), 16);
}

interface ScoredCandidate {
    result: FinderResult;
    adjustedScore: number;
}

export function findValidDailySeed(
    date: string,
    tier: DifficultyTier,
    history: DailyCaseRecord[],
    options?: FinderOptions,
): FinderResult | null {
    const secret = options?.secret ?? 'dev-secret';
    const maxOffsets = options?.maxOffsets ?? 1000;
    const candidatePool = options?.candidatePool ?? 50;
    const version = options?.rulesetVersion ?? RULESET_VERSION;
    const baseSeed = getDailyBaseSeed(date, secret, version);

    // Extended variety: last 2 days for hard rejects, last 7 for soft penalties
    const last2 = history.slice(-2);
    const last7 = history.slice(-7);

    // Hard reject sets (crimeType and culprit from last 2 days)
    const recentCrimeTypes = new Set(last2.map(r => r.crimeType));
    const recentCulprits = new Set(last2.map(r => r.culprit));

    // Soft penalty sets (methodId from last 7 days, signalType from last 3 days)
    const recentMethodIds = new Set(
        last7.filter(r => r.methodId).map(r => r.methodId!)
    );
    const last3 = history.slice(-3);
    const recentSignalTypes = new Set(
        last3.filter(r => r.signalType).map(r => r.signalType!)
    );

    const candidates: ScoredCandidate[] = [];

    for (let offset = 0; offset < maxOffsets; offset++) {
        const seed = baseSeed + offset;
        const result = generateValidatedCase(seed, tier);
        if (!result) continue;

        const { sim, evidence } = result;
        const diffConfig = profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]);
        const validation = validateCase(sim.world, sim.config, evidence, diffConfig);
        if (!validation.passed) continue;
        if (validation.funness && !validation.funness.valid) continue; // Hard gate: reject unfun cases
        if (validation.comedy && !validation.comedy.valid) continue; // Hard gate: reject comedy-invalid cases

        const culprit = sim.config.culpritId;
        const crimeType = sim.config.crimeType;

        // Hard variety gates (reject)
        if (recentCrimeTypes.has(crimeType)) continue;
        if (recentCulprits.has(culprit)) continue;

        // Score the candidate
        const scoreBreakdown = scoreDailyCandidate(sim, evidence, tier);
        const signal = analyzeSignal(evidence, sim.config);
        const methodId = sim.config.crimeMethod.methodId;

        // Soft variety penalties (applied after scoring)
        let adjustedScore = scoreBreakdown.total;
        if (recentMethodIds.has(methodId)) {
            adjustedScore -= 10;
        }
        if (recentSignalTypes.has(signal.signalType)) {
            adjustedScore -= 5;
        }

        const finderResult: FinderResult = {
            seed,
            tier,
            offset,
            culprit,
            crimeType,
            date,
            rulesetVersion: version,
            methodId,
            signalType: signal.signalType,
            score: scoreBreakdown.total,
            scoreBreakdown,
            candidatesEvaluated: 0, // filled later
        };

        candidates.push({ result: finderResult, adjustedScore });

        if (candidates.length >= candidatePool) break;
    }

    if (candidates.length === 0) return null;

    // Sort by adjusted score descending, ties broken by offset (first found = stable sort)
    candidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

    const best = candidates[0].result;
    best.candidatesEvaluated = candidates.length;
    return best;
}
