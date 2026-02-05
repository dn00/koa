/**
 * KOA Casefiles - World Setup
 *
 * Defines the house layout, devices, items, and NPCs for the MVP.
 */

import type { Place, Device, Item, NPC, World, WindowId } from './types.js';
import type { RNG } from './kernel/rng.js';

// ============================================================================
// Places - Fixed 5-room house
// ============================================================================

/*
 *          ┌──────────┐
 *          │ Bedroom  │
 *          └────┬─────┘
 *               │
 * ┌──────────┐  │  ┌──────────┐
 * │ Kitchen  │──┼──│  Living  │
 * └──────────┘  │  └──────────┘
 *               │
 *          ┌────┴─────┐
 *          │  Office  │
 *          └────┬─────┘
 *               │
 *          ┌────┴─────┐
 *          │  Garage  │
 *          └──────────┘
 */

export const PLACES: Place[] = [
    { id: 'kitchen', name: 'Kitchen', adjacent: ['living', 'bedroom'] },
    { id: 'living', name: 'Living Room', adjacent: ['kitchen', 'bedroom', 'office'] },
    { id: 'bedroom', name: 'Bedroom', adjacent: ['kitchen', 'living'] },
    { id: 'office', name: 'Office', adjacent: ['living', 'garage'] },
    { id: 'garage', name: 'Garage', adjacent: ['office'] },
];

// ============================================================================
// Devices - Sensors throughout the house
// ============================================================================

export const DEVICES: Device[] = [
    // Door sensors on all connections
    { id: 'door_kitchen_living', type: 'door_sensor', place: 'kitchen', connectsTo: 'living' },
    { id: 'door_kitchen_bedroom', type: 'door_sensor', place: 'kitchen', connectsTo: 'bedroom' },
    { id: 'door_living_bedroom', type: 'door_sensor', place: 'living', connectsTo: 'bedroom' },
    { id: 'door_living_office', type: 'door_sensor', place: 'living', connectsTo: 'office' },
    { id: 'door_office_garage', type: 'door_sensor', place: 'office', connectsTo: 'garage' },

    // Motion sensor in living room (high traffic area)
    { id: 'motion_living', type: 'motion_sensor', place: 'living' },

    // Wifi presence in garage (detects phones)
    { id: 'wifi_garage', type: 'wifi_presence', place: 'garage' },
];

// ============================================================================
// Items - Stealable/Pranakable objects
// ============================================================================

export const ITEMS: Item[] = [
    // Kitchen items
    {
        id: 'sourdough',
        name: 'Sourdough Starter',
        funnyName: "Grandma's 47-year-old sourdough starter 'Doughlores'",
        startPlace: 'kitchen',
    },
    {
        id: 'leftovers',
        name: 'Labeled Leftovers',
        funnyName: "The CLEARLY LABELED leftovers (touching = war)",
        startPlace: 'kitchen',
    },
    {
        id: 'coffee',
        name: 'Good Coffee',
        funnyName: "The expensive coffee beans that are 'for guests only'",
        startPlace: 'kitchen',
    },

    // Living room items
    {
        id: 'cactus',
        name: 'Therapy Cactus',
        funnyName: "Herbert the therapy cactus (certified emotional support plant)",
        startPlace: 'living',
    },
    {
        id: 'remote',
        name: 'TV Remote',
        funnyName: "The sacred TV remote (batteries held in by hope)",
        startPlace: 'living',
    },
    {
        id: 'blanket',
        name: 'Good Blanket',
        funnyName: "THE blanket (there's only one good one)",
        startPlace: 'living',
    },

    // Office items
    {
        id: 'router',
        name: 'Vintage Router',
        funnyName: "Dad's 'lucky' 2003 Linksys router that he refuses to replace",
        startPlace: 'office',
    },
    {
        id: 'charger',
        name: 'Phone Charger',
        funnyName: "The only working phone charger in the house",
        startPlace: 'office',
    },

    // Bedroom items
    {
        id: 'urn',
        name: "Grandma's Urn",
        funnyName: "Grandma's urn (she's not dead, she just really likes urns)",
        startPlace: 'bedroom',
    },
    {
        id: 'pillow',
        name: 'Good Pillow',
        funnyName: "The good pillow (everyone knows which one)",
        startPlace: 'bedroom',
    },

    // Garage items
    {
        id: 'noodles',
        name: 'Pool Noodles',
        funnyName: "The emergency pool noodle stash (47 noodles, meticulously counted)",
        startPlace: 'garage',
    },
    {
        id: 'ladder',
        name: 'The Ladder',
        funnyName: "The 'borrowed' ladder from the neighbor (since 2017)",
        startPlace: 'garage',
    },
];

// ============================================================================
// NPCs - The suspects
// ============================================================================

const NPC_TEMPLATES: Omit<NPC, 'schedule'>[] = [
    { id: 'alice', name: 'Alice', role: 'workaholic sibling' },
    { id: 'bob', name: 'Bob', role: 'couch potato roommate' },
    { id: 'carol', name: 'Carol', role: 'night owl cousin' },
    { id: 'dan', name: 'Dan', role: 'early bird neighbor' },
    { id: 'eve', name: 'Eve', role: 'mysterious houseguest' },
];

// Schedule patterns per archetype
type ScheduleArchetype = 'workaholic' | 'homebody' | 'nightowl' | 'earlybird' | 'wanderer';

const SCHEDULE_PATTERNS: Record<ScheduleArchetype, Partial<Record<WindowId, string[]>>> = {
    workaholic: {
        W1: ['office'],
        W2: ['office'],
        W3: ['office', 'kitchen'],
        W4: ['living', 'kitchen'],
        W5: ['bedroom'],
        W6: ['bedroom'],
    },
    homebody: {
        W1: ['living'],
        W2: ['living', 'kitchen'],
        W3: ['living'],
        W4: ['living'],
        W5: ['living', 'bedroom'],
        W6: ['bedroom'],
    },
    nightowl: {
        W1: ['bedroom'],
        W2: ['bedroom', 'kitchen'],
        W3: ['kitchen', 'living'],
        W4: ['living', 'office'],
        W5: ['office', 'garage'],
        W6: ['garage', 'living'],
    },
    earlybird: {
        W1: ['kitchen', 'living'],
        W2: ['living', 'office'],
        W3: ['office'],
        W4: ['bedroom'],
        W5: ['bedroom'],
        W6: ['bedroom'],
    },
    wanderer: {
        W1: ['kitchen', 'living', 'garage'],
        W2: ['office', 'bedroom', 'living'],
        W3: ['garage', 'kitchen', 'office'],
        W4: ['living', 'bedroom', 'kitchen'],
        W5: ['office', 'garage', 'living'],
        W6: ['bedroom', 'living'],
    },
};

const NPC_ARCHETYPES: Record<string, ScheduleArchetype> = {
    alice: 'workaholic',
    bob: 'homebody',
    carol: 'nightowl',
    dan: 'earlybird',
    eve: 'wanderer',
};

function generateSchedule(npcId: string, rng: RNG): NPC['schedule'] {
    const archetype = NPC_ARCHETYPES[npcId] ?? 'wanderer';
    const patterns = SCHEDULE_PATTERNS[archetype];

    const schedule: NPC['schedule'] = [];

    for (const windowId of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] as WindowId[]) {
        const options = patterns[windowId] ?? ['living'];
        const place = rng.pick(options);
        schedule.push({
            window: windowId,
            place,
            activity: getActivity(place, windowId),
        });
    }

    return schedule;
}

function getActivity(place: string, window: WindowId): string {
    const activities: Record<string, string[]> = {
        kitchen: ['cooking', 'snacking', 'doing dishes', 'raiding fridge'],
        living: ['watching TV', 'scrolling phone', 'napping on couch', 'arguing about thermostat'],
        bedroom: ['sleeping', 'reading', 'pretending to sleep', 'doom scrolling'],
        office: ['working', 'pretending to work', 'on a call', 'staring at spreadsheets'],
        garage: ['looking for tools', 'hiding from family', 'working on "project"', 'counting pool noodles'],
    };

    const options = activities[place] ?? ['existing'];
    // Deterministic pick based on window
    const index = parseInt(window.slice(1)) % options.length;
    return options[index];
}

// ============================================================================
// Relationships - Drama between NPCs
// ============================================================================

import type { Relationship, RelationshipType } from './types.js';

const RELATIONSHIP_TEMPLATES: Array<{
    from: string;
    to: string;
    type: RelationshipType;
    intensity: number;
    backstory: string;
}> = [
        { from: 'alice', to: 'bob', type: 'annoyance', intensity: 7, backstory: "Bob never returned Alice's Tupperware (2019)" },
        { from: 'bob', to: 'alice', type: 'grudge', intensity: 5, backstory: "Alice passive-aggressively labeled his shelf space" },
        { from: 'carol', to: 'dan', type: 'rivalry', intensity: 8, backstory: "Both claim to make the best coffee, neither is right" },
        { from: 'dan', to: 'carol', type: 'rivalry', intensity: 6, backstory: "Carol's late-night noise vs Dan's 5am smoothie blender" },
        { from: 'eve', to: 'alice', type: 'crush', intensity: 4, backstory: "Eve finds Alice's spreadsheet enthusiasm... attractive?" },
        { from: 'bob', to: 'carol', type: 'alliance', intensity: 7, backstory: "United front on keeping the thermostat above 72°F" },
        { from: 'carol', to: 'eve', type: 'alliance', intensity: 6, backstory: "Both think the house rules are 'suggestions'" },
        { from: 'dan', to: 'bob', type: 'annoyance', intensity: 8, backstory: "Bob's couch ownership has gone unchallenged too long" },
        { from: 'alice', to: 'eve', type: 'grudge', intensity: 5, backstory: "Eve used Alice's special mug. Once." },
        { from: 'eve', to: 'dan', type: 'annoyance', intensity: 3, backstory: "Dan's morning cheerfulness is frankly suspicious" },
    ];

function generateRelationships(rng: RNG): Relationship[] {
    // Return a shuffled subset for variety
    const shuffled = rng.shuffle([...RELATIONSHIP_TEMPLATES]);
    return shuffled.slice(0, 6 + rng.nextInt(4)); // 6-9 relationships
}

// ============================================================================
// World Creation
// ============================================================================

export function createWorld(rng: RNG): World {
    const npcs: NPC[] = NPC_TEMPLATES.map(template => ({
        ...template,
        schedule: generateSchedule(template.id, rng),
    }));

    const relationships = generateRelationships(rng);

    return {
        places: [...PLACES],
        devices: [...DEVICES],
        items: [...ITEMS],
        npcs,
        relationships,
    };
}

/**
 * Find path between two places (BFS)
 */
export function findPath(from: string, to: string, places: Place[]): string[] {
    if (from === to) return [from];

    const placeMap = new Map(places.map(p => [p.id, p]));
    const queue: string[][] = [[from]];
    const visited = new Set<string>([from]);

    while (queue.length > 0) {
        const path = queue.shift()!;
        const current = path[path.length - 1];
        const place = placeMap.get(current);

        if (!place) continue;

        for (const neighbor of place.adjacent) {
            if (neighbor === to) {
                return [...path, neighbor];
            }
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }

    return []; // No path found
}

/**
 * Get the door device between two places
 */
export function getDoorBetween(from: string, to: string, devices: Device[]): Device | undefined {
    return devices.find(d =>
        d.type === 'door_sensor' &&
        ((d.place === from && d.connectsTo === to) ||
            (d.place === to && d.connectsTo === from))
    );
}
