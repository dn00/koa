import { createHmac } from 'crypto';
import { RULESET_VERSION, DIFFICULTY_PROFILES, profileToDifficultyConfig, type DifficultyTier } from '../types.js';
import { generateValidatedCase } from '../sim.js';
import { validateCase } from '../validators.js';
import type { DailyCaseRecord } from './history.js';
import type { WeeklySchedule } from './schedule.js';

export interface FinderOptions {
    secret?: string;
    maxOffsets?: number;
    schedule?: WeeklySchedule;
    rulesetVersion?: string;
}

export interface FinderResult {
    seed: number;
    tier: DifficultyTier;
    offset: number;
    culprit: string;
    crimeType: string;
    date: string;
    rulesetVersion: string;
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

export function findValidDailySeed(
    date: string,
    tier: DifficultyTier,
    history: DailyCaseRecord[],
    options?: FinderOptions,
): FinderResult | null {
    const secret = options?.secret ?? 'dev-secret';
    const maxOffsets = options?.maxOffsets ?? 1000;
    const version = options?.rulesetVersion ?? RULESET_VERSION;
    const baseSeed = getDailyBaseSeed(date, secret, version);

    const yesterday = history.length > 0 ? history[history.length - 1] : null;

    for (let offset = 0; offset < maxOffsets; offset++) {
        const seed = baseSeed + offset;
        const result = generateValidatedCase(seed, tier);
        if (!result) continue;

        const { sim, evidence } = result;
        const diffConfig = profileToDifficultyConfig(DIFFICULTY_PROFILES[tier]);
        const validation = validateCase(sim.world, sim.config, evidence, diffConfig);
        if (!validation.passed) continue;

        const culprit = sim.config.culpritId;
        const crimeType = sim.config.crimeType;

        if (yesterday) {
            if (crimeType === yesterday.crimeType) continue;
            if (culprit === yesterday.culprit) continue;
        }

        return {
            seed,
            tier,
            offset,
            culprit,
            crimeType,
            date,
            rulesetVersion: version,
        };
    }

    return null;
}
