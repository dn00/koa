/**
 * KOA Casefiles - Case Director
 *
 * Controls case difficulty by influencing twist selection.
 * Supports fixed difficulty or rotation patterns.
 *
 * Difficulty tiers:
 * - easy:   Culprit self-contradicts (false_alibi twist) → obvious liar
 * - medium: Culprit lies about crime scene only → need to connect dots
 * - hard:   Culprit tells truth → only motive/opportunity signal
 */

import type { NPCId, TwistType, Twist, World } from './types.js';

export type DifficultyTier = 'easy' | 'medium' | 'hard';

export type RotationPattern =
    | 'fixed'           // Always same difficulty
    | 'cycle'           // easy → medium → hard → easy...
    | 'ramp'            // easy → easy → medium → medium → hard...
    | 'random'          // Random each case
    | 'weighted';       // Weighted random (e.g., 60% easy, 30% medium, 10% hard)

export interface DirectorConfig {
    pattern: RotationPattern;
    baseDifficulty: DifficultyTier;
    weights?: { easy: number; medium: number; hard: number };  // For 'weighted' pattern
    rampLength?: number;  // Cases per difficulty in 'ramp' pattern
}

export const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
    pattern: 'fixed',
    baseDifficulty: 'easy',
};

export class CaseDirector {
    private config: DirectorConfig;
    private caseCount: number = 0;

    constructor(config: Partial<DirectorConfig> = {}) {
        this.config = { ...DEFAULT_DIRECTOR_CONFIG, ...config };
    }

    /**
     * Get the difficulty for the current case.
     */
    getCurrentDifficulty(): DifficultyTier {
        const { pattern, baseDifficulty, weights, rampLength = 3 } = this.config;

        switch (pattern) {
            case 'fixed':
                return baseDifficulty;

            case 'cycle': {
                const tiers: DifficultyTier[] = ['easy', 'medium', 'hard'];
                const startIdx = tiers.indexOf(baseDifficulty);
                return tiers[(startIdx + this.caseCount) % 3];
            }

            case 'ramp': {
                // Spend rampLength cases at each difficulty
                const phase = Math.floor(this.caseCount / rampLength) % 3;
                const tiers: DifficultyTier[] = ['easy', 'medium', 'hard'];
                return tiers[phase];
            }

            case 'random': {
                const tiers: DifficultyTier[] = ['easy', 'medium', 'hard'];
                return tiers[Math.floor(Math.random() * 3)];
            }

            case 'weighted': {
                const w = weights ?? { easy: 60, medium: 30, hard: 10 };
                const total = w.easy + w.medium + w.hard;
                const roll = Math.random() * total;
                if (roll < w.easy) return 'easy';
                if (roll < w.easy + w.medium) return 'medium';
                return 'hard';
            }

            default:
                return baseDifficulty;
        }
    }

    /**
     * Advance to next case (for rotation patterns).
     */
    nextCase(): void {
        this.caseCount++;
    }

    /**
     * Reset case counter.
     */
    reset(): void {
        this.caseCount = 0;
    }

    /**
     * Select twist based on current difficulty.
     *
     * - easy: Culprit gets false_alibi (self-contradiction)
     * - medium: No false_alibi for culprit, but crime scene lie possible
     * - hard: Culprit tells truth (twist goes to innocent or none)
     */
    selectTwist(
        culpritId: NPCId,
        innocents: NPCId[],
        world: World,
        availableTwists: TwistType[],
        rng: { nextInt: (max: number) => number; pick: <T>(arr: T[]) => T }
    ): Twist | null {
        const difficulty = this.getCurrentDifficulty();
        const culprit = world.npcs.find(n => n.id === culpritId);

        if (!culprit) return null;

        switch (difficulty) {
            case 'easy':
                // Force culprit to have false_alibi → guaranteed self-contradiction
                if (availableTwists.includes('false_alibi')) {
                    return {
                        type: 'false_alibi',
                        actor: culpritId,
                        description: `${culprit.name} claims they were elsewhere (they weren't)`,
                        affectsEvidence: [],
                    };
                }
                // Fallback: any twist on culprit
                return this.createTwistForActor(culpritId, culprit.name, availableTwists, rng);

            case 'medium':
                // No false_alibi for culprit - they lie about crime scene but don't self-contradict
                // Give twist to innocent instead, or use unreliable_witness
                if (innocents.length > 0 && availableTwists.includes('unreliable_witness')) {
                    const innocent = rng.pick(innocents);
                    const innocentNpc = world.npcs.find(n => n.id === innocent);
                    return {
                        type: 'unreliable_witness',
                        actor: innocent,
                        description: `${innocentNpc?.name ?? innocent} misremembers details`,
                        affectsEvidence: [],
                    };
                }
                // Fallback: no twist (culprit only has crime scene lie from testimony)
                return null;

            case 'hard':
                // Culprit tells the truth - only motive/opportunity signal
                // Either no twist, or twist on innocent to create red herrings
                if (innocents.length > 0 && rng.nextInt(100) < 50) {
                    const innocent = rng.pick(innocents);
                    const innocentNpc = world.npcs.find(n => n.id === innocent);
                    // Give innocent a suspicious twist (makes them look guilty)
                    if (availableTwists.includes('false_alibi')) {
                        return {
                            type: 'false_alibi',
                            actor: innocent,
                            description: `${innocentNpc?.name ?? innocent} lies about whereabouts (hiding something innocent)`,
                            affectsEvidence: [],
                        };
                    }
                }
                return null;

            default:
                return null;
        }
    }

    private createTwistForActor(
        actorId: NPCId,
        actorName: string,
        availableTwists: TwistType[],
        rng: { pick: <T>(arr: T[]) => T }
    ): Twist | null {
        if (availableTwists.length === 0) return null;

        const type = rng.pick(availableTwists);

        switch (type) {
            case 'false_alibi':
                return {
                    type: 'false_alibi',
                    actor: actorId,
                    description: `${actorName} claims they were elsewhere`,
                    affectsEvidence: [],
                };
            case 'unreliable_witness':
                return {
                    type: 'unreliable_witness',
                    actor: actorId,
                    description: `${actorName} misremembers time/details`,
                    affectsEvidence: [],
                };
            default:
                return null;
        }
    }

    /**
     * Get description of current difficulty for UI.
     */
    getDifficultyDescription(): string {
        const difficulty = this.getCurrentDifficulty();
        switch (difficulty) {
            case 'easy':
                return 'Easy - The culprit will contradict themselves';
            case 'medium':
                return 'Medium - Connect the dots at the crime scene';
            case 'hard':
                return 'Hard - Only motive and opportunity reveal the culprit';
        }
    }

    /**
     * Get current config for debugging/display.
     */
    getConfig(): DirectorConfig {
        return { ...this.config };
    }

    /**
     * Get case count for debugging/display.
     */
    getCaseCount(): number {
        return this.caseCount;
    }
}

/**
 * Parse difficulty from CLI string.
 */
export function parseDifficulty(str: string): DifficultyTier | null {
    const lower = str.toLowerCase();
    if (lower === 'easy' || lower === 'e' || lower === '1') return 'easy';
    if (lower === 'medium' || lower === 'med' || lower === 'm' || lower === '2') return 'medium';
    if (lower === 'hard' || lower === 'h' || lower === '3') return 'hard';
    return null;
}

/**
 * Parse rotation pattern from CLI string.
 */
export function parsePattern(str: string): RotationPattern | null {
    const lower = str.toLowerCase();
    if (lower === 'fixed' || lower === 'f') return 'fixed';
    if (lower === 'cycle' || lower === 'c') return 'cycle';
    if (lower === 'ramp' || lower === 'r') return 'ramp';
    if (lower === 'random' || lower === 'rand') return 'random';
    if (lower === 'weighted' || lower === 'w') return 'weighted';
    return null;
}
