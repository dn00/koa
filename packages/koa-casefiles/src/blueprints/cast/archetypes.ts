/**
 * KOA Casefiles - NPC Archetypes
 *
 * Defines 16 NPC behavior patterns that affect:
 * - Schedule generation (when/where they go)
 * - Testimony reliability (how accurate their observations are)
 * - Social behavior (gossip tendency, embarrassment threshold)
 * - Comedy potential (personality quirks)
 */

import type { NPCArchetype, ArchetypeId } from '../types.js';

// ============================================================================
// Work Style Archetypes
// ============================================================================

export const WORKAHOLIC: NPCArchetype = {
    id: 'workaholic',
    name: 'The Workaholic',
    description: 'Always in the office. Barely notices anything not work-related.',

    schedulePattern: {
        wakeBias: 'early',
        socialBias: 'low',
        movementFrequency: 'low',
        routineRigidity: 'rigid',
    },
    preferredPlaceTypes: ['private'],  // Office, bedroom
    avoidedPlaceTypes: ['social'],

    distractibility: 80,  // Too focused on work to notice things
    peakAlertWindows: ['W1'],  // Alert in early evening (just got home)
    peakDistractedWindows: ['W3', 'W4', 'W5'],  // Deep in work mode

    gossipTendency: 20,
    witnessReliability: 40,  // Doesn't pay attention

    embarrassmentThreshold: 70,  // Hard to embarrass
    comedyTraits: ['mentions_work_constantly', 'checks_phone_during_conversations'],
};

export const SLACKER: NPCArchetype = {
    id: 'slacker',
    name: 'The Slacker',
    description: 'Moves around a lot avoiding responsibilities. Sees everything.',

    schedulePattern: {
        wakeBias: 'late',
        socialBias: 'medium',
        movementFrequency: 'high',
        routineRigidity: 'chaotic',
    },
    preferredPlaceTypes: ['social', 'functional'],  // Kitchen, living room, garage
    avoidedPlaceTypes: ['private'],  // Avoids looking like they're working

    distractibility: 30,  // Actually quite observant (nothing better to do)
    peakAlertWindows: ['W2', 'W3', 'W4'],  // Active during prime shenanigan hours
    peakDistractedWindows: ['W1'],  // Still waking up

    gossipTendency: 70,
    witnessReliability: 75,  // Good memory for drama

    embarrassmentThreshold: 30,  // Easily embarrassed
    comedyTraits: ['elaborate_excuses', 'conveniently_elsewhere_during_chores'],
};

export const CREATIVE: NPCArchetype = {
    id: 'creative',
    name: 'The Creative',
    description: 'Lost in their own world. Observes unusual things, misses obvious ones.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'medium',
        movementFrequency: 'medium',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['private', 'social'],
    avoidedPlaceTypes: [],

    distractibility: 60,  // In their own head
    peakAlertWindows: ['W3'],  // "Inspiration hours"
    peakDistractedWindows: ['W2', 'W5'],  // Processing

    gossipTendency: 50,
    witnessReliability: 60,  // Notices weird things, misses normal things

    embarrassmentThreshold: 40,
    comedyTraits: ['tangential_observations', 'artistic_metaphors_for_everything'],
};

export const TECHIE: NPCArchetype = {
    id: 'techie',
    name: 'The Techie',
    description: 'Knows all the smart home systems. Suspicious of device anomalies.',

    schedulePattern: {
        wakeBias: 'late',
        socialBias: 'low',
        movementFrequency: 'low',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['private'],  // With their gadgets
    avoidedPlaceTypes: ['social'],

    distractibility: 50,
    peakAlertWindows: ['W4', 'W5'],  // Night owl hours
    peakDistractedWindows: ['W1', 'W2'],  // Not fully online yet

    gossipTendency: 40,
    witnessReliability: 80,  // Precise about technical details

    embarrassmentThreshold: 60,
    comedyTraits: ['explains_everything_technically', 'suspicious_of_smart_home'],
};

// ============================================================================
// Sleep Pattern Archetypes
// ============================================================================

export const EARLY_BIRD: NPCArchetype = {
    id: 'early_bird',
    name: 'The Early Bird',
    description: 'Up at dawn, asleep by 9pm. Misses late-night shenanigans.',

    schedulePattern: {
        wakeBias: 'early',
        socialBias: 'medium',
        movementFrequency: 'medium',
        routineRigidity: 'rigid',
    },
    preferredPlaceTypes: ['social', 'functional'],
    avoidedPlaceTypes: [],

    distractibility: 30,  // Alert when awake
    peakAlertWindows: ['W1', 'W2'],  // Early evening
    peakDistractedWindows: ['W5', 'W6'],  // Asleep or drowsy

    gossipTendency: 50,
    witnessReliability: 70,

    embarrassmentThreshold: 50,
    comedyTraits: ['judgmental_about_sleep_schedules', 'asleep_during_drama'],
};

export const NIGHT_OWL: NPCArchetype = {
    id: 'night_owl',
    name: 'The Night Owl',
    description: 'Prowls around late at night. Knows what happens after midnight.',

    schedulePattern: {
        wakeBias: 'late',
        socialBias: 'low',
        movementFrequency: 'medium',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['private', 'social'],
    avoidedPlaceTypes: [],

    distractibility: 40,
    peakAlertWindows: ['W4', 'W5', 'W6'],  // Late night
    peakDistractedWindows: ['W1', 'W2'],  // Barely conscious

    gossipTendency: 40,
    witnessReliability: 65,

    embarrassmentThreshold: 60,
    comedyTraits: ['seen_things_at_3am', 'zombie_mode_before_noon'],
};

export const INSOMNIAC: NPCArchetype = {
    id: 'insomniac',
    name: 'The Insomniac',
    description: 'Never fully asleep. Hears everything. Trusts nothing.',

    schedulePattern: {
        wakeBias: 'normal',  // But erratic
        socialBias: 'low',
        movementFrequency: 'high',  // Restless
        routineRigidity: 'chaotic',
    },
    preferredPlaceTypes: ['social', 'functional'],  // Wanders
    avoidedPlaceTypes: [],

    distractibility: 20,  // Hypervigilant
    peakAlertWindows: ['W3', 'W4', 'W5', 'W6'],  // Most of the night
    peakDistractedWindows: ['W2'],  // Afternoon crash

    gossipTendency: 30,
    witnessReliability: 85,  // Remembers everything (unfortunately)

    embarrassmentThreshold: 80,  // Too tired to care
    comedyTraits: ['knows_everyones_secrets', 'dark_circles_aesthetic'],
};

// ============================================================================
// Social Style Archetypes
// ============================================================================

export const SOCIAL_BUTTERFLY: NPCArchetype = {
    id: 'social_butterfly',
    name: 'The Social Butterfly',
    description: 'Always where the people are. Knows everyone\'s business.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'high',
        movementFrequency: 'high',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['social'],
    avoidedPlaceTypes: ['private'],  // FOMO

    distractibility: 50,  // Distracted by conversations
    peakAlertWindows: ['W2', 'W3', 'W4'],  // Social hours
    peakDistractedWindows: ['W6'],  // Recovering from socializing

    gossipTendency: 90,
    witnessReliability: 55,  // Knows a lot but details get fuzzy

    embarrassmentThreshold: 20,  // Very easily embarrassed
    comedyTraits: ['knows_everyone', 'cannot_keep_secrets'],
};

export const INTROVERT: NPCArchetype = {
    id: 'introvert',
    name: 'The Introvert',
    description: 'Prefers solitude. Notices things others miss.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'low',
        movementFrequency: 'low',
        routineRigidity: 'rigid',
    },
    preferredPlaceTypes: ['private'],
    avoidedPlaceTypes: ['social'],

    distractibility: 25,  // Focused observer
    peakAlertWindows: ['W1', 'W5'],  // Quiet times
    peakDistractedWindows: ['W3'],  // Forced social time

    gossipTendency: 10,
    witnessReliability: 85,  // Precise but selective

    embarrassmentThreshold: 40,
    comedyTraits: ['reluctant_witness', 'prefers_pets_to_people'],
};

export const GOSSIP: NPCArchetype = {
    id: 'gossip',
    name: 'The Gossip',
    description: 'Information broker. Knows everything but embellishes freely.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'high',
        movementFrequency: 'high',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['social', 'transition'],  // Where conversations happen
    avoidedPlaceTypes: [],

    distractibility: 35,  // Actively listening
    peakAlertWindows: ['W2', 'W3', 'W4'],  // Drama hours
    peakDistractedWindows: ['W1'],  // Gathering intel

    gossipTendency: 100,  // Maximum gossip
    witnessReliability: 50,  // Adds "creative details"

    embarrassmentThreshold: 70,  // Shameless
    comedyTraits: ['embellishes_everything', 'has_a_theory_about_everyone'],
};

export const PEACEMAKER: NPCArchetype = {
    id: 'peacemaker',
    name: 'The Peacemaker',
    description: 'Tries to smooth everything over. May downplay conflicts.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'high',
        movementFrequency: 'medium',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['social'],
    avoidedPlaceTypes: [],

    distractibility: 40,
    peakAlertWindows: ['W2', 'W3'],  // When conflicts happen
    peakDistractedWindows: ['W5'],

    gossipTendency: 30,  // Doesn't want to cause drama
    witnessReliability: 60,  // May omit "inflammatory" details

    embarrassmentThreshold: 50,
    comedyTraits: ['both_sides_every_argument', 'apologizes_for_others'],
};

export const TROUBLEMAKER: NPCArchetype = {
    id: 'troublemaker',
    name: 'The Troublemaker',
    description: 'Chaos agent. May have done something suspicious just because.',

    schedulePattern: {
        wakeBias: 'late',
        socialBias: 'medium',
        movementFrequency: 'high',
        routineRigidity: 'chaotic',
    },
    preferredPlaceTypes: ['social', 'functional'],
    avoidedPlaceTypes: [],

    distractibility: 45,
    peakAlertWindows: ['W3', 'W4'],  // Mischief hours
    peakDistractedWindows: ['W1'],

    gossipTendency: 60,
    witnessReliability: 45,  // May "forget" inconvenient details

    embarrassmentThreshold: 90,  // Proud of chaos
    comedyTraits: ['suspiciously_helpful', 'alibis_that_sound_made_up'],
};

// ============================================================================
// Personality Archetypes
// ============================================================================

export const PARANOID: NPCArchetype = {
    id: 'paranoid',
    name: 'The Paranoid',
    description: 'Suspects everyone. Logs everything. Usually wrong, sometimes right.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'low',
        movementFrequency: 'medium',
        routineRigidity: 'rigid',
    },
    preferredPlaceTypes: ['private', 'transition'],  // Checking locks
    avoidedPlaceTypes: [],

    distractibility: 10,  // Hyperaware
    peakAlertWindows: ['W1', 'W2', 'W3', 'W4', 'W5'],  // Always alert
    peakDistractedWindows: [],

    gossipTendency: 40,
    witnessReliability: 70,  // Accurate but over-interprets

    embarrassmentThreshold: 60,
    comedyTraits: ['conspiracy_theories', 'checks_locks_multiple_times'],
};

export const OBLIVIOUS: NPCArchetype = {
    id: 'oblivious',
    name: 'The Oblivious',
    description: 'Genuinely does not notice things. Perfect anti-witness.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'medium',
        movementFrequency: 'medium',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['social'],
    avoidedPlaceTypes: [],

    distractibility: 95,  // Maximum oblivious
    peakAlertWindows: [],  // Never really alert
    peakDistractedWindows: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],

    gossipTendency: 20,
    witnessReliability: 20,  // Unreliable in a charming way

    embarrassmentThreshold: 80,  // Doesn't notice embarrassment either
    comedyTraits: ['misses_obvious_things', 'provides_unhelpful_testimony'],
};

export const NOSY: NPCArchetype = {
    id: 'nosy',
    name: 'The Nosy One',
    description: 'Always in everyone\'s business. Knows too much.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'high',
        movementFrequency: 'high',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['social', 'transition'],
    avoidedPlaceTypes: [],

    distractibility: 15,  // Actively snooping
    peakAlertWindows: ['W2', 'W3', 'W4', 'W5'],  // Most of the day
    peakDistractedWindows: ['W1'],

    gossipTendency: 80,
    witnessReliability: 80,  // Good observer (too good)

    embarrassmentThreshold: 30,
    comedyTraits: ['knows_things_they_shouldnt', 'asks_too_many_questions'],
};

export const SECRETIVE: NPCArchetype = {
    id: 'secretive',
    name: 'The Secretive',
    description: 'Has their own agenda. May know more than they let on.',

    schedulePattern: {
        wakeBias: 'normal',
        socialBias: 'low',
        movementFrequency: 'medium',
        routineRigidity: 'flexible',
    },
    preferredPlaceTypes: ['private', 'functional'],
    avoidedPlaceTypes: ['social'],

    distractibility: 35,
    peakAlertWindows: ['W4', 'W5'],  // Doing their own things
    peakDistractedWindows: ['W2', 'W3'],  // Avoiding attention

    gossipTendency: 5,  // Reveals nothing
    witnessReliability: 75,  // Accurate when they choose to share

    embarrassmentThreshold: 85,  // Poker face
    comedyTraits: ['vague_answers', 'unexplained_absences'],
};

// ============================================================================
// Registry
// ============================================================================

export const NPC_ARCHETYPES: Record<ArchetypeId, NPCArchetype> = {
    workaholic: WORKAHOLIC,
    slacker: SLACKER,
    creative: CREATIVE,
    techie: TECHIE,
    early_bird: EARLY_BIRD,
    night_owl: NIGHT_OWL,
    insomniac: INSOMNIAC,
    social_butterfly: SOCIAL_BUTTERFLY,
    introvert: INTROVERT,
    gossip: GOSSIP,
    peacemaker: PEACEMAKER,
    troublemaker: TROUBLEMAKER,
    paranoid: PARANOID,
    oblivious: OBLIVIOUS,
    nosy: NOSY,
    secretive: SECRETIVE,
};

export function getArchetype(id: ArchetypeId): NPCArchetype {
    const archetype = NPC_ARCHETYPES[id];
    if (!archetype) {
        throw new Error(`Unknown archetype: ${id}`);
    }
    return archetype;
}

export function getAllArchetypes(): NPCArchetype[] {
    return Object.values(NPC_ARCHETYPES);
}

export function getArchetypesByTrait(trait: string): NPCArchetype[] {
    return getAllArchetypes().filter(a => a.comedyTraits.includes(trait));
}
