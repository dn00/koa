/**
 * KOA Casefiles - Cast Recipes
 *
 * Rules for assembling NPC casts that create interesting investigation dynamics.
 * Each recipe defines archetype constraints and relationship rules.
 */

import type {
    CastRecipe,
    ArchetypeId,
    RelationshipRule,
} from '../types.js';

// ============================================================================
// Cast Recipe Definitions
// ============================================================================

/**
 * Default Recipe - Balanced cast
 *
 * Good mix of observers and oblivious types.
 * At least one gossip for motive discovery.
 */
export const DEFAULT_RECIPE: CastRecipe = {
    id: 'default',
    name: 'Balanced Household',
    description: 'A typical mix of personality types for standard difficulty.',

    archetypePool: [
        'workaholic', 'slacker', 'creative', 'techie',
        'early_bird', 'night_owl',
        'social_butterfly', 'introvert', 'gossip',
        'nosy', 'oblivious',
    ],

    minCastSize: 5,
    maxCastSize: 6,

    requiredArchetypes: [],  // No strict requirements

    forbiddenCombinations: [
        // Too many unreliable witnesses makes it unsolvable
        ['oblivious', 'oblivious'],
    ],

    relationshipRules: [
        { type: 'must_have', relationship: 'rivalry', between: undefined },
        { type: 'prefer', relationship: 'annoyance', between: undefined },
    ],
};

/**
 * Drama Recipe - High-conflict household
 *
 * Multiple rivalries and grudges. Everyone has motive.
 * Good for cases where motive elimination is key.
 */
export const DRAMA_RECIPE: CastRecipe = {
    id: 'drama',
    name: 'Dramatic Household',
    description: 'High-conflict cast with multiple rivalries and grudges.',

    archetypePool: [
        'troublemaker', 'gossip', 'paranoid',
        'social_butterfly', 'secretive',
        'workaholic', 'slacker',  // Natural tension
        'nosy', 'introvert',
    ],

    minCastSize: 5,
    maxCastSize: 6,

    requiredArchetypes: ['gossip'],  // Need someone to spread info

    forbiddenCombinations: [
        ['peacemaker', 'peacemaker'],  // Would defuse drama
    ],

    relationshipRules: [
        { type: 'must_have', relationship: 'rivalry', between: undefined },
        { type: 'must_have', relationship: 'grudge', between: undefined },
        { type: 'prefer', relationship: 'annoyance', between: undefined },
    ],
};

/**
 * Chaos Recipe - Unreliable everything
 *
 * Many distractible types. Testimonies conflict.
 * Higher difficulty due to uncertainty.
 */
export const CHAOS_RECIPE: CastRecipe = {
    id: 'chaos',
    name: 'Chaotic Household',
    description: 'Unreliable witnesses and conflicting testimonies.',

    archetypePool: [
        'slacker', 'creative', 'night_owl', 'insomniac',
        'troublemaker', 'oblivious',
        'gossip',  // Unreliable in a different way
    ],

    minCastSize: 5,
    maxCastSize: 5,  // Smaller cast, more chaos

    requiredArchetypes: ['troublemaker'],

    forbiddenCombinations: [
        ['paranoid', 'nosy'],  // Would be too reliable
    ],

    relationshipRules: [
        { type: 'prefer', relationship: 'annoyance', between: undefined },
        { type: 'cannot_have', relationship: 'alliance', between: undefined },
    ],
};

/**
 * Quiet Recipe - Observant household
 *
 * Multiple reliable witnesses but lower social interaction.
 * Good for device-log-heavy investigations.
 */
export const QUIET_RECIPE: CastRecipe = {
    id: 'quiet',
    name: 'Quiet Household',
    description: 'Observant introverts with reliable testimony.',

    archetypePool: [
        'introvert', 'techie', 'workaholic',
        'paranoid', 'secretive',
        'early_bird', 'night_owl',
    ],

    minCastSize: 5,
    maxCastSize: 5,

    requiredArchetypes: ['introvert'],

    forbiddenCombinations: [
        ['social_butterfly', 'gossip'],  // Would change the vibe
    ],

    relationshipRules: [
        { type: 'prefer', relationship: 'alliance', between: ['introvert', 'introvert'] },
        { type: 'cannot_have', relationship: 'crush', between: undefined },
    ],
};

/**
 * Social Recipe - High-traffic household
 *
 * Lots of movement and interaction. Many witness opportunities.
 * Good for testimony-heavy investigations.
 */
export const SOCIAL_RECIPE: CastRecipe = {
    id: 'social',
    name: 'Social Household',
    description: 'Extroverts and gossips with lots of interaction.',

    archetypePool: [
        'social_butterfly', 'gossip', 'peacemaker',
        'creative', 'slacker',
        'nosy', 'troublemaker',
    ],

    minCastSize: 5,
    maxCastSize: 6,

    requiredArchetypes: ['social_butterfly'],

    forbiddenCombinations: [
        ['introvert', 'introvert'],  // Would break the vibe
    ],

    relationshipRules: [
        { type: 'must_have', relationship: 'crush', between: undefined },
        { type: 'prefer', relationship: 'alliance', between: undefined },
    ],
};

// ============================================================================
// Registry
// ============================================================================

export const CAST_RECIPES: Record<string, CastRecipe> = {
    default: DEFAULT_RECIPE,
    drama: DRAMA_RECIPE,
    chaos: CHAOS_RECIPE,
    quiet: QUIET_RECIPE,
    social: SOCIAL_RECIPE,
};

export function getCastRecipe(id: string): CastRecipe {
    const recipe = CAST_RECIPES[id];
    if (!recipe) {
        throw new Error(`Unknown cast recipe: ${id}`);
    }
    return recipe;
}

export function getAllCastRecipes(): CastRecipe[] {
    return Object.values(CAST_RECIPES);
}

/**
 * Select a recipe based on difficulty tier
 */
export function selectRecipeForDifficulty(tier: 1 | 2 | 3 | 4): CastRecipe {
    switch (tier) {
        case 1:
            return DEFAULT_RECIPE;  // Balanced, easy
        case 2:
            return SOCIAL_RECIPE;   // More witnesses
        case 3:
            return DRAMA_RECIPE;    // More motives to sort through
        case 4:
            return CHAOS_RECIPE;    // Unreliable everything
    }
}
