import { describe, test, expect } from 'vitest';
import {
    DIFFICULTY_PROFILES,
    DIFFICULTY_TIER_TARGETS,
    profileToDifficultyConfig,
    type DifficultyTier,
    type DifficultyProfile,
} from '../src/types.js';

// Task 001 — DifficultyProfile type & mapping table

describe('AC-1: DIFFICULTY_PROFILES covers all 4 tiers', () => {
    const tiers: DifficultyTier[] = [1, 2, 3, 4];

    test('all 4 tiers exist', () => {
        for (const t of tiers) {
            expect(DIFFICULTY_PROFILES[t]).toBeDefined();
        }
    });

    test('tier names are correct', () => {
        expect(DIFFICULTY_PROFILES[1].name).toBe('Tutorial');
        expect(DIFFICULTY_PROFILES[2].name).toBe('Standard');
        expect(DIFFICULTY_PROFILES[3].name).toBe('Challenging');
        expect(DIFFICULTY_PROFILES[4].name).toBe('Expert');
    });

    test('puzzleDifficulty mapping is correct', () => {
        expect(DIFFICULTY_PROFILES[1].puzzleDifficulty).toBe('easy');
        expect(DIFFICULTY_PROFILES[2].puzzleDifficulty).toBe('easy');
        expect(DIFFICULTY_PROFILES[3].puzzleDifficulty).toBe('medium');
        expect(DIFFICULTY_PROFILES[4].puzzleDifficulty).toBe('hard');
    });

    test('deviceGaps increase with tier', () => {
        expect(DIFFICULTY_PROFILES[1].deviceGaps).toBe(0);
        expect(DIFFICULTY_PROFILES[2].deviceGaps).toBe(0);
        expect(DIFFICULTY_PROFILES[3].deviceGaps).toBe(1);
        expect(DIFFICULTY_PROFILES[4].deviceGaps).toBe(2);
    });

    test('twistRules expand with tier', () => {
        expect(DIFFICULTY_PROFILES[1].twistRules).toEqual([]);
        expect(DIFFICULTY_PROFILES[2].twistRules).toContain('false_alibi');
        expect(DIFFICULTY_PROFILES[2].twistRules).toContain('unreliable_witness');
        expect(DIFFICULTY_PROFILES[3].twistRules).toContain('planted_evidence');
        expect(DIFFICULTY_PROFILES[4].twistRules).toContain('tampered_device');
        expect(DIFFICULTY_PROFILES[4].twistRules).toContain('accomplice');
    });

    test('preferredSignalType per tier', () => {
        expect(DIFFICULTY_PROFILES[1].preferredSignalType).toBe('self_contradiction');
        expect(DIFFICULTY_PROFILES[2].preferredSignalType).toBe('self_contradiction');
        expect(DIFFICULTY_PROFILES[3].preferredSignalType).toBe('device_contradiction');
        expect(DIFFICULTY_PROFILES[4].preferredSignalType).toBe('scene_presence');
    });

    test('targets have required fields', () => {
        for (const t of tiers) {
            const targets = DIFFICULTY_PROFILES[t].targets;
            expect(targets).toHaveProperty('minAP');
            expect(targets).toHaveProperty('maxAP');
            expect(targets).toHaveProperty('minContradictions');
            expect(targets).toHaveProperty('maxContradictions');
            expect(targets).toHaveProperty('minBranching');
            expect(targets.minAP).toBeLessThanOrEqual(targets.maxAP);
            expect(targets.minContradictions).toBeLessThanOrEqual(targets.maxContradictions);
        }
    });

    test('redHerringStrength increases with tier', () => {
        expect(DIFFICULTY_PROFILES[1].redHerringStrength).toBe(3);
        expect(DIFFICULTY_PROFILES[2].redHerringStrength).toBe(5);
        expect(DIFFICULTY_PROFILES[3].redHerringStrength).toBe(7);
        expect(DIFFICULTY_PROFILES[4].redHerringStrength).toBe(9);
    });

    test('each profile has tier field matching its key', () => {
        for (const t of tiers) {
            expect(DIFFICULTY_PROFILES[t].tier).toBe(t);
        }
    });
});

describe('AC-2: DIFFICULTY_TIER_TARGETS backward compatibility', () => {
    test('tier 1 targets match', () => {
        expect(DIFFICULTY_TIER_TARGETS[1]).toEqual({
            minAP: 4, maxAP: 8,
            minContradictions: 1, maxContradictions: 3,
            minBranching: 2,
        });
    });

    test('tier 2 targets match', () => {
        expect(DIFFICULTY_TIER_TARGETS[2]).toEqual({
            minAP: 7, maxAP: 14,
            minContradictions: 3, maxContradictions: 5,
            minBranching: 2,
        });
    });

    test('tier 3 targets match', () => {
        expect(DIFFICULTY_TIER_TARGETS[3]).toEqual({
            minAP: 10, maxAP: 16,
            minContradictions: 4, maxContradictions: 7,
            minBranching: 3,
        });
    });

    test('tier 4 targets match', () => {
        expect(DIFFICULTY_TIER_TARGETS[4]).toEqual({
            minAP: 12, maxAP: 18,
            minContradictions: 5, maxContradictions: 8,
            minBranching: 3,
        });
    });
});

describe('AC-3: profileToDifficultyConfig maps correctly', () => {
    test('tier 3 profile maps to valid DifficultyConfig', () => {
        const config = profileToDifficultyConfig(DIFFICULTY_PROFILES[3]);
        expect(config).toEqual({
            tier: 3,
            suspectCount: 5,
            windowCount: 6,
            twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'],
            redHerringStrength: 7,
        });
    });

    test('tier 1 profile maps correctly', () => {
        const config = profileToDifficultyConfig(DIFFICULTY_PROFILES[1]);
        expect(config.tier).toBe(1);
        expect(config.twistRules).toEqual([]);
        expect(config.redHerringStrength).toBe(3);
    });

    test('tier 4 profile maps correctly', () => {
        const config = profileToDifficultyConfig(DIFFICULTY_PROFILES[4]);
        expect(config.tier).toBe(4);
        expect(config.twistRules).toContain('accomplice');
        expect(config.redHerringStrength).toBe(9);
    });
});

describe('EC-1: Non-existent tier returns undefined', () => {
    test('tier 5 returns undefined', () => {
        expect(DIFFICULTY_PROFILES[5 as any]).toBeUndefined();
    });

    test('tier 0 returns undefined', () => {
        expect(DIFFICULTY_PROFILES[0 as any]).toBeUndefined();
    });
});
