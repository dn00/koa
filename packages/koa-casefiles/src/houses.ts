/**
 * KOA Casefiles - Canonical Houses & Casts
 *
 * Hand-crafted house layouts and NPC configurations.
 * Each has specific personality and gameplay dynamics.
 */

import type { Place, Device, Item, NPC, WindowId } from './types.js';
import type { ArchetypeId } from './blueprints/types.js';

// ============================================================================
// House Layouts
// ============================================================================

export interface HouseLayout {
    id: string;
    name: string;
    description: string;
    places: Place[];
    devices: Device[];
    items: Item[];
}

/**
 * THE SHARE HOUSE (Default)
 *
 * Classic 5-room suburban share house. Central living room hub.
 * Good sensor coverage, one dead-end (garage).
 *
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
export const SHARE_HOUSE: HouseLayout = {
    id: 'share_house',
    name: 'The Share House',
    description: 'Classic suburban share house. Everyone knows everyone\'s business.',
    places: [
        { id: 'kitchen', name: 'Kitchen', adjacent: ['living', 'bedroom'] },
        { id: 'living', name: 'Living Room', adjacent: ['kitchen', 'bedroom', 'office'] },
        { id: 'bedroom', name: 'Bedroom', adjacent: ['kitchen', 'living'] },
        { id: 'office', name: 'Office', adjacent: ['living', 'garage'] },
        { id: 'garage', name: 'Garage', adjacent: ['office'] },
    ],
    devices: [
        { id: 'door_kitchen_living', type: 'door_sensor', place: 'kitchen', connectsTo: 'living' },
        { id: 'door_kitchen_bedroom', type: 'door_sensor', place: 'kitchen', connectsTo: 'bedroom' },
        { id: 'door_living_bedroom', type: 'door_sensor', place: 'living', connectsTo: 'bedroom' },
        { id: 'door_living_office', type: 'door_sensor', place: 'living', connectsTo: 'office' },
        { id: 'door_office_garage', type: 'door_sensor', place: 'office', connectsTo: 'garage' },
        { id: 'motion_living', type: 'motion_sensor', place: 'living' },
        { id: 'wifi_garage', type: 'wifi_presence', place: 'garage' },
    ],
    items: [
        { id: 'sourdough', name: 'Sourdough Starter', funnyName: "Grandma's 47-year-old sourdough starter 'Doughlores'", startPlace: 'kitchen' },
        { id: 'leftovers', name: 'Labeled Leftovers', funnyName: "The CLEARLY LABELED leftovers (touching = war)", startPlace: 'kitchen' },
        { id: 'coffee', name: 'Good Coffee', funnyName: "The expensive coffee beans that are 'for guests only'", startPlace: 'kitchen' },
        { id: 'cactus', name: 'Therapy Cactus', funnyName: "Herbert the therapy cactus (certified emotional support plant)", startPlace: 'living' },
        { id: 'remote', name: 'TV Remote', funnyName: "The sacred TV remote (batteries held in by hope)", startPlace: 'living' },
        { id: 'blanket', name: 'Good Blanket', funnyName: "THE blanket (there's only one good one)", startPlace: 'living' },
        { id: 'router', name: 'Vintage Router', funnyName: "Dad's 'lucky' 2003 Linksys router that he refuses to replace", startPlace: 'office' },
        { id: 'charger', name: 'Phone Charger', funnyName: "The only working phone charger in the house", startPlace: 'office' },
        { id: 'urn', name: "Grandma's Urn", funnyName: "Grandma's urn (she's not dead, she just really likes urns)", startPlace: 'bedroom' },
        { id: 'pillow', name: 'Good Pillow', funnyName: "The good pillow (everyone knows which one)", startPlace: 'bedroom' },
        { id: 'noodles', name: 'Pool Noodles', funnyName: "The emergency pool noodle stash (47 noodles, meticulously counted)", startPlace: 'garage' },
        { id: 'ladder', name: 'The Ladder', funnyName: "The 'borrowed' ladder from the neighbor (since 2017)", startPlace: 'garage' },
    ],
};

/**
 * THE CRAMPED APARTMENT
 *
 * Tiny city apartment. Everyone's always in each other's space.
 * Loop layout means multiple escape routes but nowhere to hide.
 *
 *    ┌─────────┬─────────┐
 *    │ Bedroom │ Bathroom│
 *    └────┬────┴────┬────┘
 *         │         │
 *    ┌────┴─────────┴────┐
 *    │      Living       │
 *    └────┬─────────┬────┘
 *         │         │
 *    ┌────┴────┬────┴────┐
 *    │ Kitchen │ Closet  │
 *    └─────────┴─────────┘
 */
export const CRAMPED_APARTMENT: HouseLayout = {
    id: 'cramped_apartment',
    name: 'The Cramped Apartment',
    description: 'Tiny city apartment. Privacy is a myth.',
    places: [
        { id: 'living', name: 'Living Room', adjacent: ['bedroom', 'bathroom', 'kitchen', 'closet'] },
        { id: 'bedroom', name: 'Bedroom', adjacent: ['living', 'bathroom'] },
        { id: 'bathroom', name: 'Bathroom', adjacent: ['living', 'bedroom'] },
        { id: 'kitchen', name: 'Kitchen', adjacent: ['living', 'closet'] },
        { id: 'closet', name: 'Storage Closet', adjacent: ['living', 'kitchen'] },
    ],
    devices: [
        { id: 'door_living_bedroom', type: 'door_sensor', place: 'living', connectsTo: 'bedroom' },
        { id: 'door_living_bathroom', type: 'door_sensor', place: 'living', connectsTo: 'bathroom' },
        { id: 'door_bedroom_bathroom', type: 'door_sensor', place: 'bedroom', connectsTo: 'bathroom' },
        { id: 'motion_living', type: 'motion_sensor', place: 'living' },
        { id: 'wifi_living', type: 'wifi_presence', place: 'living' },
    ],
    items: [
        { id: 'ramen', name: 'Emergency Ramen', funnyName: "The 'emergency' ramen stash (36 packs, for 'hard times')", startPlace: 'kitchen' },
        { id: 'plant', name: 'Dying Plant', funnyName: "The plant that refuses to die despite everyone's neglect", startPlace: 'living' },
        { id: 'remote', name: 'TV Remote', funnyName: "The remote (perpetually lost between couch cushions)", startPlace: 'living' },
        { id: 'hairdryer', name: 'Fancy Hairdryer', funnyName: "The Dyson hairdryer that cost more than the couch", startPlace: 'bathroom' },
        { id: 'charger', name: 'Phone Charger', funnyName: "The communal charger (always missing when you need it)", startPlace: 'bedroom' },
        { id: 'shoes', name: 'Nice Shoes', funnyName: "The nice shoes that someone keeps 'borrowing'", startPlace: 'closet' },
        { id: 'vacuum', name: 'Robot Vacuum', funnyName: "Roomba named 'DJ Roomba' (it has a speaker taped to it)", startPlace: 'closet' },
        { id: 'snacks', name: 'Hidden Snacks', funnyName: "The 'hidden' snack drawer (everyone knows about it)", startPlace: 'bedroom' },
    ],
};

/**
 * THE MCMANSION
 *
 * Sprawling suburban monstrosity. Too many rooms, not enough sensors.
 * Two wings mean lots of unmonitored space.
 *
 *    [WEST WING]              [EAST WING]
 *    ┌─────────┐              ┌─────────┐
 *    │ Master  │              │ Guest   │
 *    │ Bedroom │              │ Room    │
 *    └────┬────┘              └────┬────┘
 *         │                        │
 *    ┌────┴────┐    ┌─────┐  ┌────┴────┐
 *    │ Bath    │────│Hall │──│ Office  │
 *    └─────────┘    └──┬──┘  └─────────┘
 *                      │
 *              ┌───────┴───────┐
 *              │    Great      │
 *              │     Room      │
 *              └───────┬───────┘
 *                      │
 *    ┌─────────┬───────┴───────┬─────────┐
 *    │ Kitchen │    Dining     │  Den    │
 *    └─────────┴───────────────┴─────────┘
 */
export const MCMANSION: HouseLayout = {
    id: 'mcmansion',
    name: 'The McMansion',
    description: 'Sprawling suburban excess. So many rooms, so few witnesses.',
    places: [
        { id: 'great_room', name: 'Great Room', adjacent: ['hall', 'kitchen', 'dining', 'den'] },
        { id: 'hall', name: 'Hallway', adjacent: ['great_room', 'master', 'bath', 'guest', 'office'] },
        { id: 'kitchen', name: 'Kitchen', adjacent: ['great_room', 'dining'] },
        { id: 'dining', name: 'Dining Room', adjacent: ['great_room', 'kitchen', 'den'] },
        { id: 'den', name: 'Den', adjacent: ['great_room', 'dining'] },
        { id: 'master', name: 'Master Bedroom', adjacent: ['hall', 'bath'] },
        { id: 'bath', name: 'Master Bath', adjacent: ['hall', 'master'] },
        { id: 'guest', name: 'Guest Room', adjacent: ['hall', 'office'] },
        { id: 'office', name: 'Home Office', adjacent: ['hall', 'guest'] },
    ],
    devices: [
        { id: 'door_hall_great', type: 'door_sensor', place: 'hall', connectsTo: 'great_room' },
        { id: 'door_hall_master', type: 'door_sensor', place: 'hall', connectsTo: 'master' },
        { id: 'door_hall_guest', type: 'door_sensor', place: 'hall', connectsTo: 'guest' },
        { id: 'motion_great', type: 'motion_sensor', place: 'great_room' },
        { id: 'motion_hall', type: 'motion_sensor', place: 'hall' },
        { id: 'wifi_office', type: 'wifi_presence', place: 'office' },
    ],
    items: [
        { id: 'wine', name: 'Fancy Wine', funnyName: "The 'special occasion' wine (7 years and counting)", startPlace: 'dining' },
        { id: 'art', name: 'Suspicious Art', funnyName: "The 'investment' art piece that might be upside down", startPlace: 'great_room' },
        { id: 'trophy', name: 'Participation Trophy', funnyName: "The prominently displayed participation trophy from 1987", startPlace: 'den' },
        { id: 'espresso', name: 'Espresso Machine', funnyName: "The $3000 espresso machine nobody knows how to use", startPlace: 'kitchen' },
        { id: 'robe', name: 'Fancy Robe', funnyName: "The hotel robe that was 'definitely a gift'", startPlace: 'master' },
        { id: 'towels', name: 'Fancy Towels', funnyName: "The decorative towels that must NEVER be used", startPlace: 'bath' },
        { id: 'keyboard', name: 'Mechanical Keyboard', funnyName: "The obnoxiously loud mechanical keyboard", startPlace: 'office' },
        { id: 'candle', name: 'Yankee Candle', funnyName: "The 47th Yankee Candle (still in plastic wrap)", startPlace: 'guest' },
    ],
};

// ============================================================================
// NPC Casts
// ============================================================================

export interface CastConfig {
    id: string;
    name: string;
    description: string;
    npcs: Omit<NPC, 'schedule'>[];
    archetypes: Record<string, ArchetypeId>;
}

/**
 * THE ROOMMATES (Default)
 * Classic mix of personality types. Everyone has beef with everyone.
 */
export const ROOMMATES: CastConfig = {
    id: 'roommates',
    name: 'The Roommates',
    description: 'Classic share house chaos. Everyone tolerates everyone.',
    npcs: [
        { id: 'alice', name: 'Alice', role: 'workaholic sibling' },
        { id: 'bob', name: 'Bob', role: 'couch potato roommate' },
        { id: 'carol', name: 'Carol', role: 'night owl cousin' },
        { id: 'dan', name: 'Dan', role: 'early bird neighbor' },
        { id: 'eve', name: 'Eve', role: 'mysterious houseguest' },
    ],
    archetypes: {
        alice: 'workaholic',
        bob: 'slacker',
        carol: 'night_owl',
        dan: 'early_bird',
        eve: 'secretive',
    },
};

/**
 * THE FAMILY
 * Dysfunctional family dynamics. Generational chaos.
 */
export const FAMILY: CastConfig = {
    id: 'family',
    name: 'The Family',
    description: 'Three generations of passive aggression.',
    npcs: [
        { id: 'mom', name: 'Mom', role: 'long-suffering matriarch' },
        { id: 'dad', name: 'Dad', role: 'oblivious patriarch' },
        { id: 'teen', name: 'Jordan', role: 'dramatic teenager' },
        { id: 'kid', name: 'Max', role: 'suspiciously quiet child' },
        { id: 'grandma', name: 'Grandma', role: 'chaos agent grandmother' },
    ],
    archetypes: {
        mom: 'peacemaker',
        dad: 'oblivious',
        teen: 'night_owl',
        kid: 'secretive',
        grandma: 'troublemaker',
    },
};

/**
 * THE COWORKERS
 * Office retreat gone wrong. Corporate drama.
 */
export const COWORKERS: CastConfig = {
    id: 'coworkers',
    name: 'The Coworkers',
    description: 'Team building weekend. Team destroying reality.',
    npcs: [
        { id: 'boss', name: 'Patricia', role: 'micromanaging boss' },
        { id: 'suck_up', name: 'Kevin', role: 'desperate suck-up' },
        { id: 'slacker', name: 'Mike', role: 'professional slacker' },
        { id: 'new_hire', name: 'Zoe', role: 'confused new hire' },
        { id: 'hr', name: 'Linda', role: 'seen-too-much HR rep' },
    ],
    archetypes: {
        boss: 'paranoid',
        suck_up: 'social_butterfly',
        slacker: 'slacker',
        new_hire: 'oblivious',
        hr: 'gossip',
    },
};

/**
 * THE FRIENDS
 * College friends reunion. Old grudges resurface.
 */
export const FRIENDS: CastConfig = {
    id: 'friends',
    name: 'The Friends',
    description: 'College reunion. Decade-old drama included.',
    npcs: [
        { id: 'host', name: 'Sam', role: 'anxious host' },
        { id: 'rich', name: 'Blake', role: 'insufferably successful one' },
        { id: 'mess', name: 'Taylor', role: 'lovable disaster' },
        { id: 'couple_a', name: 'Alex', role: 'half of the couple' },
        { id: 'couple_b', name: 'Jamie', role: 'other half (it\'s complicated)' },
    ],
    archetypes: {
        host: 'peacemaker',
        rich: 'workaholic',
        mess: 'troublemaker',
        couple_a: 'introvert',
        couple_b: 'nosy',
    },
};

/**
 * THE SUBURBAN CLASSIC (New Default)
 *
 * Well-designed 7-room family home. Good flow, good sensor coverage.
 * The "goldilocks" house - not too small, not too sprawling.
 *
 *                    ┌──────────┐
 *                    │  Patio   │
 *                    └────┬─────┘
 *                         │
 *    ┌──────────┐   ┌─────┴─────┐   ┌──────────┐
 *    │  Master  │───│  Living   │───│  Office  │
 *    │ Bedroom  │   │   Room    │   │          │
 *    └────┬─────┘   └─────┬─────┘   └──────────┘
 *         │               │
 *    ┌────┴─────┐   ┌─────┴─────┐
 *    │Bathroom  │   │  Kitchen  │
 *    └──────────┘   └─────┬─────┘
 *                         │
 *                   ┌─────┴─────┐
 *                   │  Garage   │
 *                   └───────────┘
 *
 * Camera coverage: Living room, Patio
 * Good hiding spots: Garage, Office
 * High traffic: Kitchen, Living
 */
export const SUBURBAN_CLASSIC: HouseLayout = {
    id: 'suburban_classic',
    name: 'The Suburban Classic',
    description: 'The house everyone grew up in. Memories in every corner.',
    places: [
        { id: 'living', name: 'Living Room', adjacent: ['master', 'kitchen', 'office', 'patio'] },
        { id: 'kitchen', name: 'Kitchen', adjacent: ['living', 'garage'] },
        { id: 'master', name: 'Master Bedroom', adjacent: ['living', 'bathroom'] },
        { id: 'bathroom', name: 'Bathroom', adjacent: ['master'] },
        { id: 'office', name: 'Home Office', adjacent: ['living'] },
        { id: 'garage', name: 'Garage', adjacent: ['kitchen'] },
        { id: 'patio', name: 'Back Patio', adjacent: ['living'] },
    ],
    devices: [
        // Door sensors on key transitions
        { id: 'door_living_master', type: 'door_sensor', place: 'living', connectsTo: 'master' },
        { id: 'door_living_kitchen', type: 'door_sensor', place: 'living', connectsTo: 'kitchen' },
        { id: 'door_living_office', type: 'door_sensor', place: 'living', connectsTo: 'office' },
        { id: 'door_living_patio', type: 'door_sensor', place: 'living', connectsTo: 'patio' },
        { id: 'door_kitchen_garage', type: 'door_sensor', place: 'kitchen', connectsTo: 'garage' },
        // Motion sensors in common areas
        { id: 'motion_living', type: 'motion_sensor', place: 'living' },
        { id: 'motion_kitchen', type: 'motion_sensor', place: 'kitchen' },
        // Camera on patio (outdoor security) and living room
        { id: 'camera_patio', type: 'camera', place: 'patio' },
        { id: 'camera_living', type: 'camera', place: 'living' },
        // Wifi presence in office
        { id: 'wifi_office', type: 'wifi_presence', place: 'office' },
    ],
    items: [
        // Kitchen
        { id: 'cookbook', name: 'Family Cookbook', funnyName: "The family cookbook (50% recipes, 50% passive-aggressive margin notes)", startPlace: 'kitchen' },
        { id: 'leftovers', name: 'Leftovers', funnyName: "The 'mystery' leftovers that have been there since... when?", startPlace: 'kitchen' },
        { id: 'mug', name: 'World\'s Best Mug', funnyName: "The 'World's Best [Role]' mug (heavily disputed)", startPlace: 'kitchen' },
        // Living room
        { id: 'remote', name: 'TV Remote', funnyName: "The sacred remote (custody battle ongoing)", startPlace: 'living' },
        { id: 'blanket', name: 'Couch Blanket', funnyName: "The one good blanket (location classified)", startPlace: 'living' },
        { id: 'photo', name: 'Family Photo', funnyName: "The family photo where everyone looks weird except the dog", startPlace: 'living' },
        { id: 'speaker', name: 'Bluetooth Speaker', funnyName: "The portable speaker that only plays 'classics' (dad rock)", startPlace: 'living' },
        { id: 'candle', name: 'Fancy Candle', funnyName: "The $45 candle that 'smells like a forest'", startPlace: 'living' },
        // Master bedroom
        { id: 'jewelry', name: 'Jewelry Box', funnyName: "The jewelry box with 'sentimental' costume jewelry", startPlace: 'master' },
        { id: 'pillow', name: 'The Good Pillow', funnyName: "The one pillow that isn't flat (worth killing for)", startPlace: 'master' },
        { id: 'watch', name: 'Smartwatch', funnyName: "The fitness watch tracking 0 steps for 6 months", startPlace: 'master' },
        { id: 'earbuds', name: 'Wireless Earbuds', funnyName: "The AirPods that someone keeps 'accidentally' taking", startPlace: 'master' },
        // Bathroom
        { id: 'hairdryer', name: 'Hairdryer', funnyName: "The hairdryer that sounds like a jet engine", startPlace: 'bathroom' },
        { id: 'toothbrush', name: 'Electric Toothbrush', funnyName: "The $300 Sonicare (now with someone else's bristle DNA)", startPlace: 'bathroom' },
        { id: 'facecream', name: 'Face Cream', funnyName: "The $90 'miracle' cream that's 'definitely working'", startPlace: 'bathroom' },
        // Office
        { id: 'charger', name: 'Phone Charger', funnyName: "The only charger that actually works", startPlace: 'office' },
        { id: 'headphones', name: 'Noise-Canceling Headphones', funnyName: "The headphones that 'disappeared' from someone's desk", startPlace: 'office' },
        // Garage
        { id: 'tools', name: 'Tool Set', funnyName: "The tools that are 'organized' (they're not)", startPlace: 'garage' },
        { id: 'ladder', name: 'The Ladder', funnyName: "The neighbor's ladder (they stopped asking for it back)", startPlace: 'garage' },
        { id: 'cooler', name: 'Camping Cooler', funnyName: "The cooler from the 2019 camping trip (still has that smell)", startPlace: 'garage' },
        // Patio
        { id: 'grill', name: 'Grill Tools', funnyName: "The grill tools that only one person is allowed to touch", startPlace: 'patio' },
        { id: 'plant', name: 'Potted Plant', funnyName: "The plant that survives purely out of spite", startPlace: 'patio' },
        { id: 'umbrella', name: 'Patio Umbrella', funnyName: "The umbrella that's been 'about to be replaced' for 3 years", startPlace: 'patio' },
    ],
};

/**
 * THE EXTENDED HOUSEHOLD
 * A 6-person cast for larger mysteries. More relationships, more suspects.
 */
export const EXTENDED_HOUSEHOLD: CastConfig = {
    id: 'extended',
    name: 'The Extended Household',
    description: 'When the whole family descends. Six suspects, infinite drama.',
    npcs: [
        { id: 'host', name: 'Morgan', role: 'stressed host' },
        { id: 'spouse', name: 'Casey', role: 'passive-aggressive spouse' },
        { id: 'teen', name: 'Riley', role: 'eye-rolling teenager' },
        { id: 'inlaw', name: 'Pat', role: 'opinionated in-law' },
        { id: 'sibling', name: 'Quinn', role: 'competitive sibling' },
        { id: 'friend', name: 'Avery', role: 'overstaying friend' },
    ],
    archetypes: {
        host: 'peacemaker',
        spouse: 'paranoid',
        teen: 'night_owl',
        inlaw: 'gossip',
        sibling: 'workaholic',
        friend: 'slacker',
    },
};

// ============================================================================
// Registry
// ============================================================================

export const HOUSES: Record<string, HouseLayout> = {
    suburban_classic: SUBURBAN_CLASSIC,
    share_house: SHARE_HOUSE,
    cramped_apartment: CRAMPED_APARTMENT,
    mcmansion: MCMANSION,
};

export const CASTS: Record<string, CastConfig> = {
    extended: EXTENDED_HOUSEHOLD,
    roommates: ROOMMATES,
    family: FAMILY,
    coworkers: COWORKERS,
    friends: FRIENDS,
};

export function getHouse(id: string): HouseLayout {
    return HOUSES[id] ?? SUBURBAN_CLASSIC;
}

export function getCast(id: string): CastConfig {
    return CASTS[id] ?? EXTENDED_HOUSEHOLD;
}

export function getAllHouses(): HouseLayout[] {
    return Object.values(HOUSES);
}

export function getAllCasts(): CastConfig[] {
    return Object.values(CASTS);
}
