/**
 * KOA Casefiles - World Setup
 *
 * Defines the house layout, devices, items, and NPCs for the MVP.
 */

import type { Place, Device, Item, NPC, World, WindowId, Relationship, RelationshipType } from './types.js';
import type { RNG } from './kernel/rng.js';
import type { TopologyId, GeneratedTopology, PlaceType, ArchetypeId, NPCArchetype } from './blueprints/types.js';
import { generateTopologyById, generateRandomTopology, topologyToWorld } from './blueprints/topology/generator.js';
import { getHouse, getCast, type CastConfig } from './houses.js';
import { NPC_ARCHETYPES as ARCHETYPE_REGISTRY } from './blueprints/cast/archetypes.js';

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
        W1: ['office', 'bedroom'], // Getting ready, checking emails
        W2: ['office', 'kitchen'], // Coffee run
        W3: ['office', 'garage'], // Checking stored files
        W4: ['living', 'kitchen'], // Late lunch/dinner
        W5: ['bedroom', 'office'],
        W6: ['bedroom'],
    },
    homebody: {
        W1: ['living', 'kitchen'], // Breakfast
        W2: ['living', 'garage'], // Hiding from chores
        W3: ['living', 'bedroom'], // Nap time
        W4: ['living', 'kitchen'], // Snacking
        W5: ['living', 'office'], // Gaming on the good PC
        W6: ['bedroom'],
    },
    nightowl: {
        W1: ['bedroom'],
        W2: ['bedroom', 'kitchen'],
        W3: ['kitchen', 'living'],
        W4: ['living', 'office'],
        W5: ['office', 'garage'], // Late night project
        W6: ['garage', 'living'],
    },
    earlybird: {
        W1: ['kitchen', 'garage'], // Early morning tinkering
        W2: ['living', 'office', 'garage'],
        W3: ['office', 'kitchen'],
        W4: ['bedroom', 'living'],
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

// ============================================================================
// Generated Topology World Creation
// ============================================================================

/**
 * Map place types to item categories for distribution
 */
const PLACE_TYPE_ITEMS: Record<PlaceType, string[]> = {
    social: ['cactus', 'remote', 'blanket', 'coffee', 'leftovers'],
    private: ['urn', 'pillow', 'charger', 'router'],
    functional: ['noodles', 'ladder', 'sourdough'],
    transition: [], // No items in hallways/stairs
};

/**
 * Distribute items across generated places based on place types
 */
function distributeItems(topology: GeneratedTopology, rng: RNG): Item[] {
    const items: Item[] = [];
    const usedItemIds = new Set<string>();

    // Group places by type
    const placesByType = new Map<PlaceType, string[]>();
    for (const place of topology.places) {
        const list = placesByType.get(place.type) ?? [];
        list.push(place.id);
        placesByType.set(place.type, list);
    }

    // Distribute items from templates to appropriate place types
    for (const item of ITEMS) {
        // Find appropriate places for this item
        let candidates: string[] = [];

        for (const [placeType, itemIds] of Object.entries(PLACE_TYPE_ITEMS)) {
            if (itemIds.includes(item.id)) {
                const places = placesByType.get(placeType as PlaceType) ?? [];
                candidates.push(...places);
            }
        }

        // Fallback: if no matching places, use any non-transition place
        if (candidates.length === 0) {
            candidates = topology.places
                .filter(p => p.type !== 'transition')
                .map(p => p.id);
        }

        if (candidates.length > 0) {
            const place = rng.pick(candidates);
            items.push({
                ...item,
                startPlace: place,
            });
            usedItemIds.add(item.id);
        }
    }

    return items;
}

/**
 * Generate schedules adapted to the generated topology
 */
function generateScheduleForTopology(
    npcId: string,
    topology: GeneratedTopology,
    rng: RNG
): NPC['schedule'] {
    const archetype = NPC_ARCHETYPES[npcId] ?? 'wanderer';
    const patterns = SCHEDULE_PATTERNS[archetype];

    // Map old place IDs to new ones based on type
    const placesByType = new Map<string, string[]>();
    for (const place of topology.places) {
        // Map template names to simple categories
        const category = getPlaceCategory(place.templateId);
        const list = placesByType.get(category) ?? [];
        list.push(place.id);
        placesByType.set(category, list);
    }

    const schedule: NPC['schedule'] = [];

    for (const windowId of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] as WindowId[]) {
        const oldOptions = patterns[windowId] ?? ['living'];

        // Convert old place names to available places
        const newOptions: string[] = [];
        for (const oldPlace of oldOptions) {
            const candidates = placesByType.get(oldPlace) ?? [];
            newOptions.push(...candidates);
        }

        // Fallback: if no matches, pick any place
        const finalOptions = newOptions.length > 0
            ? newOptions
            : topology.places.map(p => p.id);

        const place = rng.pick(finalOptions);
        schedule.push({
            window: windowId,
            place,
            activity: getActivityForPlace(place, windowId, topology),
        });
    }

    return schedule;
}

/**
 * Map template names to simple categories for schedule matching
 */
function getPlaceCategory(templateName: string): string {
    const mapping: Record<string, string> = {
        'Living Room': 'living',
        'Great Room': 'living',
        'Kitchen': 'kitchen',
        'Bedroom': 'bedroom',
        'Office': 'office',
        'Garage': 'garage',
        'Bathroom': 'bedroom', // Treated like private space
        'Hallway': 'living',   // Treated like social space
        'Stairs': 'living',
        'Dining Room': 'kitchen',
    };
    return mapping[templateName] ?? 'living';
}

/**
 * Get activity for a place in the generated topology
 */
function getActivityForPlace(placeId: string, window: WindowId, topology: GeneratedTopology): string {
    const place = topology.places.find(p => p.id === placeId);
    if (!place) return 'existing';

    const activities: Record<string, string[]> = {
        'Kitchen': ['cooking', 'snacking', 'doing dishes', 'raiding fridge'],
        'Living Room': ['watching TV', 'scrolling phone', 'napping on couch', 'arguing about thermostat'],
        'Great Room': ['lounging', 'watching TV', 'reading', 'staring out window'],
        'Bedroom': ['sleeping', 'reading', 'pretending to sleep', 'doom scrolling'],
        'Office': ['working', 'pretending to work', 'on a call', 'staring at spreadsheets'],
        'Garage': ['looking for tools', 'hiding from family', 'working on "project"', 'counting pool noodles'],
        'Bathroom': ['existing mysteriously', 'taking too long', 'avoiding people'],
        'Hallway': ['passing through', 'lingering suspiciously', 'checking phone'],
        'Stairs': ['going up', 'going down', 'sitting dramatically'],
        'Dining Room': ['eating', 'reading paper', 'avoiding eye contact'],
    };

    const options = activities[place.templateId] ?? ['existing'];
    const index = parseInt(window.slice(1)) % options.length;
    return options[index];
}

/**
 * Create a world with a generated topology
 */
export function createWorldWithTopology(
    rng: RNG,
    topologyId?: TopologyId
): World {
    // Generate or select topology
    const topology = topologyId
        ? generateTopologyById(topologyId, rng)
        : generateRandomTopology(rng);

    // Convert topology to World format
    const { places, devices } = topologyToWorld(topology);

    // Distribute items across generated places
    const items = distributeItems(topology, rng);

    // Generate NPCs with adapted schedules
    const npcs: NPC[] = NPC_TEMPLATES.map(template => ({
        ...template,
        schedule: generateScheduleForTopology(template.id, topology, rng),
    }));

    const relationships = generateRelationships(rng);

    return {
        places,
        devices,
        items,
        npcs,
        relationships,
    };
}

// ============================================================================
// Canonical House + Cast World Creation
// ============================================================================

/**
 * Generate schedule based on archetype behavior patterns
 */
function generateScheduleFromArchetype(
    npcId: string,
    archetypeId: ArchetypeId,
    places: Place[],
    rng: RNG
): NPC['schedule'] {
    const archetype = ARCHETYPE_REGISTRY[archetypeId];
    if (!archetype) {
        // Fallback to simple schedule
        return generateSchedule(npcId, rng);
    }

    const schedule: NPC['schedule'] = [];
    const placeIds = places.map(p => p.id);

    // Map place types to place IDs
    const placesByCategory = new Map<string, string[]>();
    for (const place of places) {
        const category = getPlaceCategoryFromId(place.id);
        const list = placesByCategory.get(category) ?? [];
        list.push(place.id);
        placesByCategory.set(category, list);
    }

    // Generate schedule based on archetype preferences
    for (const windowId of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'] as WindowId[]) {
        // Check if distracted or alert in this window
        const isAlert = archetype.peakAlertWindows.includes(windowId);
        const isDistracted = archetype.peakDistractedWindows.includes(windowId);

        // Pick place based on preferences
        let candidates: string[] = [];

        // Prefer certain place types based on archetype
        for (const pref of archetype.preferredPlaceTypes) {
            const mapped = mapPlaceType(pref);
            const placesOfType = placesByCategory.get(mapped) ?? [];
            candidates.push(...placesOfType);
        }

        // If no preferred places available, use any place not avoided
        if (candidates.length === 0) {
            candidates = placeIds.filter(pid => {
                const category = getPlaceCategoryFromId(pid);
                const placeType = mapCategoryToPlaceType(category);
                return !archetype.avoidedPlaceTypes.includes(placeType);
            });
        }

        // Final fallback
        if (candidates.length === 0) {
            candidates = placeIds;
        }

        const place = rng.pick(candidates);
        schedule.push({
            window: windowId,
            place,
            activity: getActivityForArchetype(place, windowId, archetype, isDistracted),
        });
    }

    return schedule;
}

/**
 * Map PlaceType to simple category
 */
function mapPlaceType(placeType: PlaceType): string {
    switch (placeType) {
        case 'social': return 'living';
        case 'private': return 'bedroom';
        case 'functional': return 'garage';
        case 'transition': return 'living';
        default: return 'living';
    }
}

/**
 * Map category back to PlaceType
 */
function mapCategoryToPlaceType(category: string): PlaceType {
    switch (category) {
        case 'living':
        case 'kitchen':
            return 'social';
        case 'bedroom':
        case 'office':
            return 'private';
        case 'garage':
            return 'functional';
        default:
            return 'social';
    }
}

/**
 * Get place category from place ID
 */
function getPlaceCategoryFromId(placeId: string): string {
    if (placeId.includes('living') || placeId.includes('great')) return 'living';
    if (placeId.includes('kitchen') || placeId.includes('dining')) return 'kitchen';
    if (placeId.includes('bedroom') || placeId.includes('bath') || placeId.includes('master')) return 'bedroom';
    if (placeId.includes('office') || placeId.includes('den')) return 'office';
    if (placeId.includes('garage') || placeId.includes('closet')) return 'garage';
    if (placeId.includes('hall') || placeId.includes('stair')) return 'living';
    return 'living';
}

/**
 * Get activity based on archetype and state
 */
function getActivityForArchetype(
    placeId: string,
    window: WindowId,
    archetype: NPCArchetype,
    isDistracted: boolean
): string {
    const category = getPlaceCategoryFromId(placeId);

    // Base activities by place
    const activities: Record<string, string[]> = {
        living: ['watching TV', 'scrolling phone', 'napping on couch', 'people watching'],
        kitchen: ['cooking', 'snacking', 'doing dishes', 'raiding fridge'],
        bedroom: ['sleeping', 'reading', 'doom scrolling', 'hiding from everyone'],
        office: ['working', 'pretending to work', 'on a call', 'online shopping'],
        garage: ['looking for tools', 'hiding from people', 'mysterious project', 'organizing'],
    };

    // Archetype-specific activity overrides
    if (archetype.id === 'workaholic' && category === 'office') {
        return isDistracted ? 'pretending to work' : 'grinding away';
    }
    if (archetype.id === 'slacker') {
        return isDistracted ? 'napping' : 'avoiding responsibilities';
    }
    if (archetype.id === 'insomniac') {
        return isDistracted ? 'finally sleeping' : 'wandering restlessly';
    }
    if (archetype.id === 'gossip') {
        return 'gathering intel';
    }
    if (archetype.id === 'paranoid') {
        return isDistracted ? 'momentarily relaxed' : 'checking locks';
    }
    if (archetype.id === 'troublemaker') {
        return isDistracted ? 'planning something' : 'up to no good';
    }

    const options = activities[category] ?? ['existing'];
    const index = parseInt(window.slice(1)) % options.length;
    return options[index];
}

/**
 * Generate relationships between cast members
 */
function generateCastRelationships(cast: CastConfig, rng: RNG): Relationship[] {
    const relationships: Relationship[] = [];
    const npcs = cast.npcs;

    // Generate some relationships between cast members
    const relationshipTypes: RelationshipType[] = ['rivalry', 'alliance', 'grudge', 'crush', 'annoyance'];

    // Create 5-8 relationships
    const numRelationships = 5 + rng.nextInt(4);

    for (let i = 0; i < numRelationships; i++) {
        const from = rng.pick(npcs);
        const to = rng.pick(npcs.filter(n => n.id !== from.id));
        if (!to) continue;

        // Don't duplicate relationships
        if (relationships.some(r => r.from === from.id && r.to === to.id)) continue;

        const type = rng.pick(relationshipTypes);
        const intensity = 3 + rng.nextInt(7); // 3-9

        relationships.push({
            from: from.id,
            to: to.id,
            type,
            intensity,
            backstory: generateBackstory(from.name, to.name, type, rng),
        });
    }

    return relationships;
}

/**
 * Generate a backstory for a relationship
 */
function generateBackstory(fromName: string, toName: string, type: RelationshipType, rng: RNG): string {
    const templates: Record<RelationshipType, string[]> = {
        rivalry: [
            `${fromName} and ${toName} compete over everything`,
            `Both claim to be the favorite`,
            `The coffee incident of 2019 started this`,
        ],
        alliance: [
            `United against the others`,
            `Share a secret hobby`,
            `Both hate the thermostat setting`,
        ],
        grudge: [
            `${toName} borrowed something and never returned it`,
            `The group chat incident`,
            `${fromName} still remembers what ${toName} said`,
        ],
        crush: [
            `${fromName} laughs too hard at ${toName}'s jokes`,
            `It's obvious to everyone except ${toName}`,
            `The shared playlist situation`,
        ],
        annoyance: [
            `${toName}'s habits drive ${fromName} crazy`,
            `Small things add up`,
            `The passive-aggressive notes`,
        ],
    };

    return rng.pick(templates[type]);
}

/**
 * Create a world from canonical house and cast configs
 */
export function createWorldFromConfig(
    rng: RNG,
    houseId: string = 'share_house',
    castId: string = 'roommates'
): World {
    const house = getHouse(houseId);
    const cast = getCast(castId);

    // Generate NPCs with archetype-based schedules
    const npcs: NPC[] = cast.npcs.map(template => ({
        ...template,
        schedule: generateScheduleFromArchetype(
            template.id,
            cast.archetypes[template.id],
            house.places,
            rng
        ),
    }));

    // Generate relationships
    const relationships = generateCastRelationships(cast, rng);

    return {
        places: [...house.places],
        devices: [...house.devices],
        items: [...house.items],
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
