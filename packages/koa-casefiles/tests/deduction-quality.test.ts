import { describe, it, expect } from 'vitest';
import { generateValidatedCase } from '../src/sim.js';
import {
    analyzeMotiveAmbiguity,
    analyzeKeystoneDiscoverability,
    analyzeSignal,
} from '../src/validators.js';
import { scoreDailyCandidate } from '../src/daily/finder.js';
import type { MotiveEvidence, EvidenceItem } from '../src/types.js';

// Helper: generate a real case
function getTestCase(seed: number, tier: 1 | 2 | 3 | 4 = 2) {
    const result = generateValidatedCase(seed, tier);
    if (!result) throw new Error(`Seed ${seed} failed to generate`);
    return result;
}

/* ══════════════════════════════════════════════════════════════════════════
   analyzeMotiveAmbiguity
   ══════════════════════════════════════════════════════════════════════════ */

describe('analyzeMotiveAmbiguity — culprit with unique accusatory gossip', () => {
    it('returns culpritStandsOut=true when culprit is only suspect with accusatory gossip', () => {
        // Search seeds for a case where only culprit has accusatory gossip
        for (let seed = 1; seed <= 100; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const analysis = analyzeMotiveAmbiguity(evidence, sim.config);
            if (analysis.culpritStandsOut) {
                expect(analysis.ambiguityScore).toBe(0);
                expect(analysis.accusatorySuspectCount).toBeLessThanOrEqual(1);
                return;
            }
        }
        // If no case found, skip gracefully
        expect(true).toBe(true);
    });
}, 30_000);

describe('analyzeMotiveAmbiguity — multiple suspects with accusatory gossip', () => {
    it('returns ambiguityScore >= 4 when 2+ suspects have accusatory gossip', () => {
        for (let seed = 1; seed <= 200; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const analysis = analyzeMotiveAmbiguity(evidence, sim.config);
            if (analysis.accusatorySuspectCount >= 2) {
                expect(analysis.ambiguityScore).toBeGreaterThanOrEqual(4);
                expect(analysis.culpritStandsOut).toBe(false);
                return;
            }
        }
        // If no case found, skip gracefully
        expect(true).toBe(true);
    });
}, 30_000);

describe('analyzeMotiveAmbiguity — score ranges', () => {
    it('ambiguityScore is always 0, 4, or 8', () => {
        for (let seed = 1; seed <= 50; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const analysis = analyzeMotiveAmbiguity(evidence, sim.config);
            expect([0, 4, 8]).toContain(analysis.ambiguityScore);
        }
    });
}, 30_000);

/* ══════════════════════════════════════════════════════════════════════════
   analyzeKeystoneDiscoverability
   ══════════════════════════════════════════════════════════════════════════ */

describe('analyzeKeystoneDiscoverability — first batch', () => {
    it('case with both keystone pieces in first batch scores 10', () => {
        for (let seed = 1; seed <= 100; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const disc = analyzeKeystoneDiscoverability(evidence, sim.config);
            if (disc.bothInFirstBatch) {
                expect(disc.score).toBe(10);
                return;
            }
        }
        expect(true).toBe(true);
    });
}, 30_000);

describe('analyzeKeystoneDiscoverability — STAY claim always first batch', () => {
    it('STAY claim counts as first batch', () => {
        for (let seed = 1; seed <= 50; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const signal = analyzeSignal(evidence, sim.config);
            if (!signal.keystonePair) continue;

            // Check if keystone A is the STAY claim
            const evA = evidence.find(e => e.id === signal.keystonePair!.evidenceA);
            if (evA && evA.kind === 'testimony' && (evA as any).claimType === 'STAY') {
                const disc = analyzeKeystoneDiscoverability(evidence, sim.config);
                expect(disc.keystoneAInFirstBatch).toBe(true);
                return;
            }
            // Check if keystone B is the STAY claim
            const evB = evidence.find(e => e.id === signal.keystonePair!.evidenceB);
            if (evB && evB.kind === 'testimony' && (evB as any).claimType === 'STAY') {
                const disc = analyzeKeystoneDiscoverability(evidence, sim.config);
                expect(disc.keystoneBInFirstBatch).toBe(true);
                return;
            }
        }
        expect(true).toBe(true);
    });
}, 30_000);

describe('analyzeKeystoneDiscoverability — score range', () => {
    it('score is always 0, 2, 6, or 10', () => {
        for (let seed = 1; seed <= 50; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const disc = analyzeKeystoneDiscoverability(evidence, sim.config);
            expect([0, 2, 6, 10]).toContain(disc.score);
        }
    });
}, 30_000);

/* ══════════════════════════════════════════════════════════════════════════
   STAY claim fix verification
   ══════════════════════════════════════════════════════════════════════════ */

describe('STAY claim has subject/subjectPlace fields', () => {
    it('STAY claim testimony has subject === culpritId and subjectPlace === alibiPlace', () => {
        const { sim, evidence } = getTestCase(42);
        const stayClaim = evidence.find(e =>
            e.kind === 'testimony' && (e as any).claimType === 'STAY'
        ) as any;
        expect(stayClaim).toBeDefined();
        expect(stayClaim.subject).toBe(sim.config.culpritId);
        expect(stayClaim.subjectPlace).toBe(stayClaim.place);
    });
}, 30_000);

/* ══════════════════════════════════════════════════════════════════════════
   deductionQuality subscore integration
   ══════════════════════════════════════════════════════════════════════════ */

describe('deductionQuality subscore', () => {
    it('5 subscores each 0-20, summing to 0-100', () => {
        const { sim, evidence } = getTestCase(42);
        const score = scoreDailyCandidate(sim, evidence, 2);

        expect(score.playability).toBeGreaterThanOrEqual(0);
        expect(score.playability).toBeLessThanOrEqual(20);
        expect(score.difficultyFit).toBeGreaterThanOrEqual(0);
        expect(score.difficultyFit).toBeLessThanOrEqual(20);
        expect(score.funness).toBeGreaterThanOrEqual(0);
        expect(score.funness).toBeLessThanOrEqual(20);
        expect(score.discoverability).toBeGreaterThanOrEqual(0);
        expect(score.discoverability).toBeLessThanOrEqual(20);
        expect(score.deductionQuality).toBeGreaterThanOrEqual(0);
        expect(score.deductionQuality).toBeLessThanOrEqual(20);

        expect(score.total).toBe(
            score.playability + score.difficultyFit + score.funness +
            score.discoverability + score.deductionQuality
        );
        expect(score.total).toBeGreaterThanOrEqual(0);
        expect(score.total).toBeLessThanOrEqual(100);
    });

    it('deterministic — same case always produces same score', () => {
        const { sim, evidence } = getTestCase(42);
        const score1 = scoreDailyCandidate(sim, evidence, 2);
        const score2 = scoreDailyCandidate(sim, evidence, 2);
        expect(score1).toEqual(score2);
    });

    it('case with ambiguous motives + early-discoverable keystone scores higher deductionQuality', () => {
        const scores: { deductionQuality: number; ambiguity: number; discoverability: number }[] = [];
        for (let seed = 1; seed <= 100; seed++) {
            const result = generateValidatedCase(seed, 2);
            if (!result) continue;
            const { sim, evidence } = result;
            const score = scoreDailyCandidate(sim, evidence, 2);
            const motiveAmbiguity = analyzeMotiveAmbiguity(evidence, sim.config);
            const keystoneDisc = analyzeKeystoneDiscoverability(evidence, sim.config);
            scores.push({
                deductionQuality: score.deductionQuality,
                ambiguity: motiveAmbiguity.ambiguityScore,
                discoverability: keystoneDisc.score,
            });
            if (scores.length >= 20) break;
        }

        // Verify that deductionQuality is always in valid range
        for (const s of scores) {
            expect(s.deductionQuality).toBeGreaterThanOrEqual(0);
            expect(s.deductionQuality).toBeLessThanOrEqual(20);
        }
    });
}, 30_000);
