import type { DifficultyTier, CrimeType, NPCId } from '../types.js';

export interface DailyCaseRecord {
    date: string;           // ISO date (YYYY-MM-DD)
    seed: number;
    tier: DifficultyTier;
    culprit: NPCId;
    crimeType: CrimeType;
    rulesetVersion: string;
    offset: number;         // Offset from base seed
}
