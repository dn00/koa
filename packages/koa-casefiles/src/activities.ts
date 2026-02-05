/**
 * Activity Definitions
 * 
 * Activities are things NPCs do when they are idle or distracted.
 * They generate actual events and evidence traces in the world.
 */

import type { PlaceId, NPC } from './types.js';

export type ActivityType =
    | 'snacking'
    | 'reading_fanfic'
    | 'wrapping_gift'
    | 'plant_care'
    | 'pacing'
    | 'talking_to_self'
    | 'cleaning'
    | 'hiding_object' // Generic hiding (not the crime)
    | 'napping'
    | 'working_out';

export interface ActivityDef {
    id: ActivityType;
    requiredPlaces?: PlaceId[]; // Where can this happen?
    requiredItem?: string; // Abstract requirement (e.g. "laptop")

    // Traces left in the room (Physical Evidence)
    physicalTraces: string[];

    // Sounds heard by others (Testimony Clues)
    audioClues: string[];

    // Digital logs (Device Evidence)
    digitalLogs?: string[];

    // What it looks like if you walk in (Alibi/Witness)
    visualDescription: string;

    // What it looks like (Suspicion)
    looksLike: string;

    // The "True" reason (Alibi explanation)
    alibi: string;
}

export const ACTIVITIES: Record<ActivityType, ActivityDef> = {
    snacking: {
        id: 'snacking',
        requiredPlaces: ['kitchen', 'living'],
        physicalTraces: ['cookie crumbs', 'empty wrapper', 'smudge of chocolate'],
        audioClues: ['crinkling plastic', 'late night chewing', 'fridge door alarm'],
        visualDescription: 'hunched over a plate',
        looksLike: 'hiding contraband',
        alibi: 'was stress-eating leftovers',
    },
    reading_fanfic: {
        id: 'reading_fanfic',
        // Any room
        physicalTraces: ['warm laptop', 'suspicious facial tissues'],
        audioClues: ['stifled giggling', 'typing sounds', 'heavy sighing'],
        digitalLogs: ['archiveofourown.org access', 'tumblr.com access'],
        visualDescription: 'quickly closing laptop',
        looksLike: 'hiding incriminating search history',
        alibi: 'was reading... educational material (fanfic)',
    },
    wrapping_gift: {
        id: 'wrapping_gift',
        requiredPlaces: ['living', 'garage', 'office'],
        physicalTraces: ['glitter', 'snipped tape pieces', 'wrapping paper scraps'],
        audioClues: ['tearing paper', 'cutting sounds', 'muttered cursing'],
        visualDescription: 'blocking view of the table',
        looksLike: 'packaging illegal goods',
        alibi: 'was wrapping a surprise gift',
    },
    plant_care: {
        id: 'plant_care',
        requiredPlaces: ['living', 'garage'], // Where cactus/garden is
        physicalTraces: ['spilled soil', 'water droplets', 'pruning shears'],
        audioClues: ['spritzing sounds', 'talking to plants'],
        visualDescription: 'inspecting leaves intensely',
        looksLike: 'searching for bugs (literally)',
        alibi: 'was checking Herbert for mealybugs',
    },
    pacing: {
        id: 'pacing',
        // Any room
        physicalTraces: ['scuffed floor/carpet'],
        audioClues: ['rhythmic thumping', 'squeaky floorboard'],
        visualDescription: 'walking in circles',
        looksLike: 'nerves before a crime',
        alibi: 'was trying to get my steps in',
    },
    talking_to_self: {
        id: 'talking_to_self',
        // Any room
        physicalTraces: [], // No physical trace
        audioClues: ['muttered arguments', 'rehearsing dialogue', 'angry whispering'],
        visualDescription: 'talking to the mirror/wall',
        looksLike: 'practicing an alibi',
        alibi: 'was winning a fake argument from 3 years ago',
    },
    cleaning: {
        id: 'cleaning',
        requiredPlaces: ['kitchen', 'living', 'bathroom'],
        physicalTraces: ['smell of bleach', 'moved furniture', 'wet spot'],
        audioClues: ['vacuum noise', 'clinking bottles', 'scrubbing'],
        visualDescription: 'scrubbing furiously',
        looksLike: 'cleaning up a crime scene',
        alibi: 'noticed a spot and couldn\'t let it go',
    },
    hiding_object: {
        id: 'hiding_object',
        // Any room
        physicalTraces: ['disturbed dust', 'loose floorboard', 'fingerprints on vent'],
        audioClues: ['scraping sound', 'hollow thud'],
        visualDescription: 'crawling on the floor',
        looksLike: 'hiding evidence',
        alibi: 'was looking for my lost contact lens',
    },
    napping: {
        id: 'napping',
        requiredPlaces: ['bedroom', 'living'],
        physicalTraces: ['drool spot', 'messy hair'],
        audioClues: ['snoring', 'heavy breathing'],
        visualDescription: 'unconscious on furniture',
        looksLike: 'playing dead',
        alibi: 'was "resting my eyes"',
    },
    working_out: {
        id: 'working_out',
        requiredPlaces: ['garage', 'living'],
        physicalTraces: ['sweat drops', 'moved yoga mat'],
        audioClues: ['grunting', 'jumping jacks thuds', 'counting out loud'],
        visualDescription: 'doing burpees',
        looksLike: 'training for a heist',
        alibi: 'felt guilty about the cake',
    }
};
