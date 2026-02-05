/**
 * KOA Casefiles - Simulation Engine
 *
 * Runs NPC routines and crime execution to generate an event log.
 */

import type {
    World,
    SimEvent,
    CaseConfig,
    SimulationResult,
    WindowId,
    NPCId,
    PlaceId,
    ItemId,
    EventType,
    NPC,
    Item,
    Motive,
    MotiveType,
    SuspiciousAct,
    TwistRule,
    Relationship,
    CrimeType,
    CrimeMethod,
    DifficultyConfig,
    TwistType,
    MethodId,
} from './types.js';
import { METHODS_BY_CRIME } from './types.js';
import { WINDOWS, getWindowForTick } from './types.js';

// ============================================================================
// Difficulty Presets (Spec Section 14)
// ============================================================================

export const DIFFICULTY_PRESETS: Record<number, DifficultyConfig> = {
    1: {
        tier: 1,
        suspectCount: 5,   // Easier with fewer suspects
        windowCount: 6,
        twistRules: [],    // No twists for beginners
        redHerringStrength: 3,
    },
    2: {
        tier: 2,
        suspectCount: 5,
        windowCount: 6,
        twistRules: ['false_alibi', 'unreliable_witness'] as TwistType[],
        redHerringStrength: 5,
    },
    3: {
        tier: 3,
        suspectCount: 5,
        windowCount: 6,
        twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'] as TwistType[],
        redHerringStrength: 7,
    },
    4: {
        tier: 4,
        suspectCount: 5,
        windowCount: 6,
        twistRules: ['false_alibi', 'unreliable_witness', 'tampered_device', 'planted_evidence', 'accomplice'] as TwistType[],
        redHerringStrength: 9,
    },
};
import { createWorld, createWorldFromConfig, findPath, getDoorBetween, PLACES } from './world.js';
import { createRng, type RNG } from './kernel/rng.js';
import { computeEventId } from './kernel/canonical.js';

// Blueprint system imports
import {
    ALL_BLUEPRINTS,
    tryInstantiateAny,
    executeCrimePlan,
    setEventOrdinal,
    type CrimePlan,
    type IncidentBlueprint,
} from './blueprints/index.js';

// Gossip ecology - emergent simulation
import {
    runPreSimulation,
    createEmptyHistory,
    deriveEmergentMotive,
    spawnDeedGossip,
    generateSyntheticHistory, // Added
    initGossipState, // Added
    type GossipState,
    type CaseHistory,
} from './gossip/index.js';
import { ACTIVITIES, type ActivityType } from './activities.js';

// ============================================================================
// Event Generation Helpers
// ============================================================================

let eventOrdinal = 0;

function createEvent(
    tick: number,
    type: EventType,
    fields: Partial<SimEvent>
): SimEvent {
    const event: SimEvent = {
        id: '', // Will be computed
        tick,
        window: getWindowForTick(tick),
        type,
        ...fields,
    };

    // Compute deterministic event ID
    event.id = computeEventId({
        tick,
        ordinal: eventOrdinal++,
        type,
        ...fields,
    });

    return event;
}

/**
 * Trigger all sensors (motion, camera) in a room when someone enters.
 * Returns the events generated.
 */
function triggerRoomSensors(
    world: World,
    place: PlaceId,
    actor: NPCId,
    tick: number,
    carrying?: ItemId
): SimEvent[] {
    const events: SimEvent[] = [];

    // Find all sensors in this room
    const sensorsInRoom = world.devices.filter(d => d.place === place);

    for (const sensor of sensorsInRoom) {
        if (sensor.type === 'motion_sensor') {
            events.push(createEvent(tick, 'MOTION_DETECTED', {
                actor,
                place,
                target: sensor.id,
            }));
        }

        if (sensor.type === 'camera') {
            events.push(createEvent(tick, 'CAMERA_SNAPSHOT', {
                actor,
                place,
                target: sensor.id,
                data: carrying ? { carrying } : undefined,
            }));
        }
    }

    return events;
}

// ============================================================================
// NPC State Tracking
// ============================================================================

interface NPCState {
    id: NPCId;
    currentPlace: PlaceId;
    distracted?: string; // Activity if distracted
}

export function initNPCStates(world: World): Map<NPCId, NPCState> {
    const states = new Map<NPCId, NPCState>();
    for (const npc of world.npcs) {
        // Start at their W1 scheduled location
        const firstEntry = npc.schedule.find(s => s.window === 'W1');
        states.set(npc.id, {
            id: npc.id,
            currentPlace: firstEntry?.place ?? 'living',
        });
    }
    return states;
}

// ============================================================================
// Routine Simulation
// ============================================================================

/**
 * Simulate NPC movements according to their schedules.
 * Generates MOVE, DOOR, and MOTION events.
 */
export function simulateRoutines(
    world: World,
    npcStates: Map<NPCId, NPCState>,
    window: WindowId,
    startTick: number,
    rng: RNG
): SimEvent[] {
    const events: SimEvent[] = [];

    for (const npc of world.npcs) {
        const state = npcStates.get(npc.id)!;
        const scheduled = npc.schedule.find(s => s.window === window);

        if (!scheduled) {
            continue;
        }

        // Find path from current place to scheduled place
        const path = findPath(state.currentPlace, scheduled.place, world.places);

        if (path.length < 2) {
            // Already there / Idle
            // Chance to perform an activity (Simulated Red Herring)
            const idleTick = startTick + rng.nextInt(5);
            const activityEvents = simulateActivity(npc, state.currentPlace, idleTick, rng);
            events.push(...activityEvents);
            continue;
        }

        // Generate events for each step
        let tick = startTick + rng.nextInt(5); // Slight randomization

        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];

            // Door open event
            const door = getDoorBetween(from, to, world.devices);
            if (door) {
                events.push(createEvent(tick, 'DOOR_OPENED', {
                    actor: npc.id,
                    place: from,
                    toPlace: to,
                    target: door.id,
                }));
            }

            tick += 1;

            // Move event
            events.push(createEvent(tick, 'NPC_MOVE', {
                actor: npc.id,
                fromPlace: from,
                toPlace: to,
                place: to,
            }));

            // Trigger all sensors in the destination room
            events.push(...triggerRoomSensors(world, to, npc.id, tick));

            // Door close event
            if (door) {
                tick += 1;
                events.push(createEvent(tick, 'DOOR_CLOSED', {
                    actor: npc.id,
                    place: to,
                    fromPlace: from,
                    target: door.id,
                }));
            }

            tick += 2;
        }

        // Update NPC state
        state.currentPlace = scheduled.place;
    }

    return events;
}

/**
 * Simulate random activities when idle (Red Herrings 2.0)
 */
function simulateActivity(npc: NPC, place: PlaceId, tick: number, rng: RNG): SimEvent[] {
    const events: SimEvent[] = [];

    // 50% chance to do something weird if idle
    if (rng.nextInt(100) > 50) return events;

    // Find valid activities for this place
    const candidates = Object.values(ACTIVITIES).filter(def => {
        if (!def.requiredPlaces) return true; // Anywhere
        return def.requiredPlaces.includes(place);
    });

    if (candidates.length === 0) return events;

    const activity = rng.pick(candidates);

    // 1. Start Activity
    events.push(createEvent(tick, 'ACTIVITY_STARTED', {
        actor: npc.id,
        place,
        data: {
            activity: activity.id,
            description: activity.visualDescription,
            sound: rng.pick(activity.audioClues)
        }
    }));

    // 2. Leave Traces (Physical Evidence)
    if (activity.physicalTraces.length > 0) {
        events.push(createEvent(tick, 'TRACE_FOUND', {
            actor: npc.id, // Implicitly created by them
            place,
            data: {
                trace: rng.pick(activity.physicalTraces),
                fromActivity: activity.id
            }
        }));
    }

    return events;
}

// ============================================================================
// Crime Execution
// ============================================================================

interface Opportunity {
    npc: NPC;
    item: Item;
    place: PlaceId;
    window: WindowId;
    hidePlace: PlaceId;
    distractedWitness?: NPC;  // Someone who was there but "distracted"
}

// Activities that make someone "distracted" and unable to witness crimes
const DISTRACTED_ACTIVITIES = [
    'sleeping',
    'doom_scrolling',
    'on_phone_call',
    'headphones_on',
    'deep_in_thought',
    'napping',
    'watching_tv',
    'reading',
] as const;

type DistractedActivity = typeof DISTRACTED_ACTIVITIES[number];

/**
 * Determine if an NPC is "distracted" during a window based on their archetype
 * Returns the activity if distracted, undefined if alert
 */
function getDistraction(npc: NPC, window: WindowId, rng: RNG): DistractedActivity | undefined {
    // Role-based distraction probabilities
    const distractionChance = {
        'workaholic sibling': 20,      // Focused, rarely distracted
        'couch potato roommate': 70,   // Often zoned out
        'early bird parent': 30,       // Alert but busy
        'night owl teen': 60,          // Phone addict
        'mysterious houseguest': 40,   // Unpredictable
    }[npc.role] ?? 30;

    // Time-based modifiers
    const windowModifier = {
        'W1': 0,    // Morning - everyone alert
        'W2': 10,   // Afternoon - getting tired
        'W3': 20,   // Evening - prime distraction time
        'W4': 30,   // Night - very distracted
        'W5': 40,   // Late night - sleepy
        'W6': 20,   // Midnight - mixed
    }[window] ?? 0;

    const totalChance = distractionChance + windowModifier;

    if (rng.nextInt(100) < totalChance) {
        return rng.pick([...DISTRACTED_ACTIVITIES]);
    }
    return undefined;
}

/**
 * Find NPCs who have opportunity to commit crimes.
 * Opportunity = NPC is with item AND either alone OR only distracted witnesses present
 *
 * BALANCING: Returns at most ONE opportunity per NPC to ensure fair culprit distribution.
 * The item is randomly selected from available items at their location.
 */
function findOpportunities(
    world: World,
    npcStates: Map<NPCId, NPCState>,
    crimeWindow: WindowId,
    rng: RNG
): Opportunity[] {
    const opportunities: Opportunity[] = [];
    const npcsWithOpportunity = new Set<NPCId>(); // Track NPCs who already have an opportunity

    // Get where each NPC is during the crime window + their distraction status
    const npcLocations = new Map<NPCId, { place: PlaceId; distracted?: DistractedActivity }>();
    for (const npc of world.npcs) {
        const scheduled = npc.schedule.find(s => s.window === crimeWindow);
        if (scheduled) {
            npcLocations.set(npc.id, {
                place: scheduled.place,
                distracted: getDistraction(npc, crimeWindow, rng),
            });
        }
    }

    // Check each NPC for opportunity (NPC-first, not item-first, for balance)
    for (const potentialCulprit of world.npcs) {
        const culpritInfo = npcLocations.get(potentialCulprit.id);
        if (!culpritInfo) continue;

        // NOTE: Culprits CAN be "distracted" - the distraction just means they're
        // not paying attention to others, which actually makes crime easier!
        // Only witnesses are blocked by distraction.

        const culpritPlace = culpritInfo.place;

        // Find items at culprit's location
        const itemsHere = world.items.filter(item => item.startPlace === culpritPlace);
        if (itemsHere.length === 0) continue;

        // Check if other NPCs at same location are all distracted or absent
        const othersHere = world.npcs.filter(n => {
            if (n.id === potentialCulprit.id) return false;
            const loc = npcLocations.get(n.id);
            return loc?.place === culpritPlace;
        });

        const allDistracted = othersHere.every(n =>
            npcLocations.get(n.id)?.distracted !== undefined
        );

        // Opportunity exists if alone OR all others are distracted
        if (othersHere.length === 0 || allDistracted) {
            // Find a hiding place (adjacent room that's empty or has only distracted NPCs)
            const place = world.places.find(p => p.id === culpritPlace);
            if (!place) continue;

            // Find ALL valid adjacent rooms for hiding
            const validHidePlaces: PlaceId[] = [];
            for (const adjacent of place.adjacent) {
                const npcsAtAdjacent = world.npcs.filter(n => {
                    const loc = npcLocations.get(n.id);
                    return loc?.place === adjacent && !loc.distracted;
                });

                // Can hide if adjacent is empty or all distracted
                if (npcsAtAdjacent.length === 0) {
                    validHidePlaces.push(adjacent);
                }
            }

            // Randomly pick from valid hide places for variety
            if (validHidePlaces.length > 0) {
                const hidePlace = rng.pick(validHidePlaces);
                const distractedWitness = othersHere.length > 0
                    ? othersHere[0]
                    : undefined;

                // Pick ONE random item for this NPC (balancing fix)
                const item = rng.pick(itemsHere);

                opportunities.push({
                    npc: potentialCulprit,
                    item,
                    place: culpritPlace,
                    window: crimeWindow,
                    hidePlace,
                    distractedWitness,
                });

                npcsWithOpportunity.add(potentialCulprit.id);
            }
        }

        // Skip to next NPC if this one already has an opportunity
        if (npcsWithOpportunity.has(potentialCulprit.id)) continue;
    }

    return opportunities;
}

/**
 * Execute the crime and generate events.
 */
function executeCrime(
    world: World,
    npcStates: Map<NPCId, NPCState>,
    opportunity: Opportunity,
    crimeTickStart: number,
    crimeMethod: CrimeMethod, // Comedy injection
    rng: RNG
): { events: SimEvent[]; config: Partial<CaseConfig> } {
    const events: SimEvent[] = [];
    let tick = crimeTickStart + rng.nextInt(5);

    // Take the item
    events.push(createEvent(tick, 'ITEM_TAKEN', {
        actor: opportunity.npc.id,
        place: opportunity.place,
        target: opportunity.item.id,
        data: { method: crimeMethod.funnyMethod }
    }));

    tick += 2;

    // Move to hide location (generates door events)
    const door = getDoorBetween(opportunity.place, opportunity.hidePlace, world.devices);
    if (door) {
        events.push(createEvent(tick, 'DOOR_OPENED', {
            actor: opportunity.npc.id,
            place: opportunity.place,
            toPlace: opportunity.hidePlace,
            target: door.id,
        }));
        tick += 1;
    }

    events.push(createEvent(tick, 'NPC_MOVE', {
        actor: opportunity.npc.id,
        fromPlace: opportunity.place,
        toPlace: opportunity.hidePlace,
        place: opportunity.hidePlace,
    }));

    // Trigger sensors in the hide place (motion, camera)
    events.push(...triggerRoomSensors(world, opportunity.hidePlace, opportunity.npc.id, tick, opportunity.item.id));

    tick += 1;

    if (door) {
        events.push(createEvent(tick, 'DOOR_CLOSED', {
            actor: opportunity.npc.id,
            place: opportunity.hidePlace,
            fromPlace: opportunity.place,
            target: door.id,
        }));
        tick += 1;
    }

    // Hide the item
    events.push(createEvent(tick, 'ITEM_HIDDEN', {
        actor: opportunity.npc.id,
        place: opportunity.hidePlace,
        target: opportunity.item.id,
    }));

    tick += 2;

    // Move back to original location
    if (door) {
        events.push(createEvent(tick, 'DOOR_OPENED', {
            actor: opportunity.npc.id,
            place: opportunity.hidePlace,
            toPlace: opportunity.place,
            target: door.id,
        }));
        tick += 1;
    }

    events.push(createEvent(tick, 'NPC_MOVE', {
        actor: opportunity.npc.id,
        fromPlace: opportunity.hidePlace,
        toPlace: opportunity.place,
        place: opportunity.place,
    }));

    if (door) {
        tick += 1;
        events.push(createEvent(tick, 'DOOR_CLOSED', {
            actor: opportunity.npc.id,
            place: opportunity.place,
            fromPlace: opportunity.hidePlace,
            target: door.id,
        }));
    }

    return {
        events,
        config: {
            culpritId: opportunity.npc.id,
            targetItem: opportunity.item.id,
            crimeWindow: opportunity.window,
            crimePlace: opportunity.place,
            hiddenPlace: opportunity.hidePlace,
        },
    };
}

// ============================================================================
// Crime Method Generator - The "HOW" with comedy
// ============================================================================

const CRIME_METHOD_TEMPLATES: Record<CrimeType, {
    methods: Record<MethodId, string[]>; // methodId -> funny descriptions
    funnyMethods: string[];
}> = {
    theft: {
        methods: {
            grabbed: ['grabbed {item} when no one was looking', 'snatched {item} mid-conversation'],
            pocketed: ['slipped {item} into their pocket', 'concealed {item} in their hoodie'],
            smuggled: ['smuggled {item} out in a tote bag', 'hid {item} under a blanket'],
            // Not applicable to theft
            broke: [], unplugged: [], reprogrammed: [],
            relocated: [], swapped: [], disguised: [],
            hid: [], buried: [], donated: [],
        },
        funnyMethods: [
            'while pretending to look for their phone',
            'during the great kitchen distraction of 2024',
            'using the ancient art of \"borrowing indefinitely\"',
            'with the confidence of someone who definitely owns that thing',
        ],
    },
    sabotage: {
        methods: {
            broke: ['broke {item} \"accidentally\"', 'shattered {item} with suspicious precision'],
            unplugged: ['unplugged {item} and hid the cord', 'disconnected {item} for \"maintenance\"'],
            reprogrammed: ['reprogrammed {item} to fail spectacularly', 'changed {item} settings to chaos mode'],
            // Not applicable
            grabbed: [], pocketed: [], smuggled: [],
            relocated: [], swapped: [], disguised: [],
            hid: [], buried: [], donated: [],
        },
        funnyMethods: [
            'in a fit of passive-aggressive brilliance',
            'because \"accidents happen\"',
            'while maintaining complete deniability',
            'with surgical precision and petty motivation',
        ],
    },
    prank: {
        methods: {
            relocated: ['relocated {item} to the garage rafters', 'moved {item} somewhere ridiculous'],
            swapped: ['swapped {item} with a decoy', 'replaced {item} with a note saying \"gone fishin\"'],
            disguised: ['disguised {item} as something else', 'covered {item} with a wig and sunglasses'],
            // Not applicable
            grabbed: [], pocketed: [], smuggled: [],
            broke: [], unplugged: [], reprogrammed: [],
            hid: [], buried: [], donated: [],
        },
        funnyMethods: [
            'for absolutely no reason other than chaos',
            'and immediately regretted nothing',
            'while giggling like a gremlin',
            'as part of an elaborate scheme that made sense at the time',
        ],
    },
    disappearance: {
        methods: {
            hid: ['hid {item} in a \"secret\" spot', 'stashed {item} where only they would look'],
            buried: ['buried {item} under laundry', 'concealed {item} beneath junk mail'],
            donated: ['\"donated\" {item} to the neighbor', '\"accidentally\" left {item} at the coffee shop'],
            // Not applicable
            grabbed: [], pocketed: [], smuggled: [],
            broke: [], unplugged: [], reprogrammed: [],
            relocated: [], swapped: [], disguised: [],
        },
        funnyMethods: [
            'and will gaslight everyone about its existence',
            'using a hiding spot that is definitely too obvious',
            'while claiming they have \"no idea\" what happened',
            'and is now committed to the bit',
        ],
    },
};

function generateCrimeMethod(
    crimeType: CrimeType,
    item: Item,
    culprit: NPC,
    rng: RNG
): CrimeMethod {
    const templates = CRIME_METHOD_TEMPLATES[crimeType];

    // Pick a valid methodId for this crime type
    const validMethods = METHODS_BY_CRIME[crimeType];
    const methodId = rng.pick(validMethods);

    // Get descriptions for this method
    const methodDescriptions = templates.methods[methodId];
    let description = methodDescriptions.length > 0
        ? rng.pick(methodDescriptions)
        : `${methodId} the ${item.name}`;

    const funnyMethod = rng.pick(templates.funnyMethods);

    // Fill in template vars
    description = description.replace('{item}', item.name);

    return {
        type: crimeType,
        methodId,
        description,
        funnyMethod,
    };
}

// ============================================================================
// Motive Engine - The "WHY" that makes crimes funny
// ============================================================================

const MOTIVE_TEMPLATES: Record<MotiveType, {
    descriptions: string[];
    funnyReasons: string[];
}> = {
    envy: {
        descriptions: [
            '{culprit} is jealous of {victim}\'s {item}',
            '{culprit} can\'t stand that {victim} has {item}',
            '{culprit} deserves {item} more than {victim}',
        ],
        funnyReasons: [
            'It got more Instagram likes than their selfie',
            'Everyone keeps complimenting it instead of them',
            'It\'s been haunting their dreams',
            'The neighbors noticed it and not their new haircut',
            'It was featured in the family newsletter. They weren\'t.',
            'The cat likes it more than them',
            'It\'s the main topic at every dinner party',
            'Even their therapist mentioned it',
        ],
    },
    embarrassment: {
        descriptions: [
            '{culprit} needs to hide {item} before anyone sees',
            '{culprit} must destroy the evidence',
            'No one can know about {culprit} and the {item}',
        ],
        funnyReasons: [
            'They accidentally talked to it like a person. For an hour.',
            'They were caught cuddling it at 3am',
            'Their browser history would explain everything',
            'Someone recorded them doing a TikTok dance near it',
            'There are photos. Multiple photos.',
            'They cried over it during movie night',
            'They named it. Out loud. In front of everyone.',
            'The Ring doorbell captured everything',
        ],
    },
    cover_up: {
        descriptions: [
            '{culprit} broke {item} last week and is now hiding the evidence',
            '{culprit} replaced {item} with a fake and the fake is failing',
            '{culprit} knows what really happened to the original {item}',
        ],
        funnyReasons: [
            'The superglue is starting to show',
            'The painted-on details are smudging',
            'The duct tape \'solution\' is unraveling',
            'The Amazon return window closed yesterday',
            'They\'ve been gaslighting everyone for three weeks',
            'The replacement is from Wish and it shows',
            'One more close inspection and everything falls apart',
            'The paper mache is not holding up in humidity',
        ],
    },
    rivalry: {
        descriptions: [
            '{culprit} is striking back against {victim}',
            'This is payback for what {victim} did',
            '{culprit} refuses to let {victim} win again',
        ],
        funnyReasons: [
            'The great thermostat war of 2023 never ended',
            'The last slice of pizza incident demands justice',
            'Someone has to settle the "who makes better coffee" debate',
            'Board game night still hasn\'t been resolved',
            'The parking spot dispute entered its third year',
            'Their fantasy football rivalry knows no bounds',
            'The "who ate my yogurt" cold war continues',
            'The lawn care competition has gone too far',
        ],
    },
    attention: {
        descriptions: [
            '{culprit} needs everyone to notice them for once',
            '{culprit} is tired of being the forgettable one',
            'If {culprit} can\'t have attention, neither can {item}',
        ],
        funnyReasons: [
            'No one remembered their birthday. Again.',
            'The family group chat ignores their messages',
            'Even the smart home AI forgets their name',
            'Their Spotify Wrapped was mocked relentlessly',
            'No one watches their Instagram stories',
            'The family photo album has three pictures of them total',
            'The dog greets everyone else first',
            'Autocorrect doesn\'t even know their name',
        ],
    },
    revenge: {
        descriptions: [
            '{culprit} will make {victim} pay',
            'What goes around comes around for {victim}',
            '{culprit} has waited patiently for this moment',
        ],
        funnyReasons: [
            'The "borrowed" charger was never returned. It\'s been 847 days.',
            'They ate the labeled food. THE LABELED FOOD.',
            'Someone left 0:01 on the microwave timer. Every. Single. Time.',
            'The spoiler was dropped casually. The wounds remain fresh.',
            'The guest bathroom was left in an unforgivable state',
            'They used the last of the milk and put the empty carton back',
            'The passive-aggressive Post-it notes have escalated',
            'Someone "reorganized" the shared Netflix profile',
        ],
    },
    chaos: {
        descriptions: [
            '{culprit} just wants to watch things unfold',
            '{culprit} thinks this house needs more excitement',
            'Sometimes you just gotta cause problems on purpose',
        ],
        funnyReasons: [
            'Mercury is in retrograde and so is their impulse control',
            'The last family meeting was too peaceful',
            'Chaos is a ladder, and they\'re climbing',
            'They were simply too bored to behave',
            'The drama well had run dry. Someone had to refill it.',
            'Their horoscope said "shake things up"',
            'They needed content for their group chat',
            'The household peace was getting suspicious',
        ],
    },
    crime_awareness: {
        // Special type - not used for actual crime motives, only for gossip
        descriptions: [],
        funnyReasons: [],
    },
};

function generateMotive(
    culprit: NPC,
    item: Item,
    world: World,
    rng: RNG
): Motive {
    // Pick motive type based on relationships
    const culpritRelations = world.relationships.filter(r => r.from === culprit.id);

    let motiveType: MotiveType;
    let target: NPCId | undefined;

    if (culpritRelations.length > 0 && rng.nextInt(100) < 70) {
        // 70% chance to use relationship-driven motive
        const rel = rng.pick(culpritRelations);
        target = rel.to;

        switch (rel.type) {
            case 'rivalry': motiveType = rng.pick(['rivalry', 'revenge']); break;
            case 'grudge': motiveType = 'revenge'; break;
            case 'annoyance': motiveType = rng.pick(['revenge', 'chaos']); break;
            case 'crush': motiveType = rng.pick(['attention', 'embarrassment']); break;
            case 'alliance': motiveType = rng.pick(['cover_up', 'chaos']); break;
            default: motiveType = rng.pick(['envy', 'chaos']);
        }
    } else {
        // Random motive
        const types: MotiveType[] = ['envy', 'embarrassment', 'cover_up', 'attention', 'chaos'];
        motiveType = rng.pick(types);
    }

    const templates = MOTIVE_TEMPLATES[motiveType];
    let description = rng.pick(templates.descriptions);
    const funnyReason = rng.pick(templates.funnyReasons);

    // Fill in template vars
    const victim = target ? world.npcs.find(n => n.id === target)?.name ?? 'someone' : 'the household';
    description = description
        .replace('{culprit}', culprit.name)
        .replace('{victim}', victim)
        .replace('{item}', item.name);

    return {
        type: motiveType,
        target,
        description,
        funnyReason,
    };
}



// ============================================================================
// Twist Rules - Optional complexity
// ============================================================================

function maybeGenerateTwist(
    world: World,
    culpritId: NPCId,
    rng: RNG,
    allowedTwists?: TwistType[]
): TwistRule | undefined {
    // 80% chance of a twist (or 0% if no twists allowed)
    if (!allowedTwists || allowedTwists.length === 0) return undefined;
    if (rng.nextInt(100) >= 80) return undefined;

    const type = rng.pick(allowedTwists);

    const culprit = world.npcs.find(n => n.id === culpritId)!;
    const innocents = world.npcs.filter(n => n.id !== culpritId);

    switch (type) {
        case 'false_alibi':
            // Culprit lies about their whereabouts - catching this implicates them
            return {
                type: 'false_alibi',
                actor: culpritId,
                description: `${culprit.name} claims they were in the bedroom all evening (they weren't)`,
                affectsEvidence: [],
            };
        case 'unreliable_witness': {
            // Random innocent has confused timing - creates noise
            const witness = rng.pick(innocents);
            return {
                type: 'unreliable_witness',
                actor: witness.id,
                description: `${witness.name}'s testimony is off by one time window (they fell asleep and lost track of time)`,
                affectsEvidence: [],
            };
        }
        case 'tampered_device': {
            // Someone "fixed" the smart home logs (badly) - device shows wrong actor
            return {
                type: 'tampered_device',
                actor: culpritId,
                description: `${culprit.name} tried to edit the smart home logs (they're not as tech-savvy as they think)`,
                affectsEvidence: [],
            };
        }
        case 'planted_evidence': {
            // Evidence planted to frame an innocent
            const patsy = rng.pick(innocents);
            return {
                type: 'planted_evidence',
                actor: patsy.id,
                description: `Suspicious items were "found" near ${patsy.name}'s stuff (someone's setting them up)`,
                affectsEvidence: [],
            };
        }
        case 'accomplice': {
            // Someone helped the culprit - provides false alibi for them
            const helper = rng.pick(innocents);
            return {
                type: 'accomplice',
                actor: helper.id,
                description: `${helper.name} is covering for ${culprit.name} (they owe them a favor)`,
                affectsEvidence: [],
            };
        }
    }
}

// ============================================================================
// Simulation Options
// ============================================================================

export interface SimulationOptions {
    /** Use blueprint system instead of legacy crime generation */
    useBlueprints?: boolean;
    /** Specific blueprints to use (defaults to ALL_BLUEPRINTS) */
    blueprints?: IncidentBlueprint[];
    /** House layout to use (defaults to 'share_house') */
    houseId?: string;
    /** Cast of NPCs to use (defaults to 'roommates') */
    castId?: string;
}

// ============================================================================
// Main Simulation
// ============================================================================

/**
 * Run the case simulation.
 *
 * @param seed - RNG seed for deterministic generation
 * @param difficultyTier - 1-4, controls twist complexity and red herring strength
 * @param options - Optional configuration (useBlueprints, etc.)
 * @returns SimulationResult or null if no valid crime setup found
 */
export function simulate(
    seed: number,
    difficultyTier: number = 2,
    options: SimulationOptions = {}
): SimulationResult | null {
    // If blueprints enabled, use the new system
    if (options.useBlueprints) {
        return simulateWithBlueprints(seed, difficultyTier, options);
    }

    // Otherwise, use legacy system (backward compatible)
    // Reset ordinal for deterministic event IDs
    eventOrdinal = 0;

    const difficultyConfig = DIFFICULTY_PRESETS[difficultyTier] ?? DIFFICULTY_PRESETS[2];

    const rng = createRng(seed);

    // Use canonical house/cast if specified, otherwise legacy world
    const world = (options.houseId || options.castId)
        ? createWorldFromConfig(rng, options.houseId ?? 'share_house', options.castId ?? 'roommates')
        : createWorld(rng);

    const npcStates = initNPCStates(world);

    const allEvents: SimEvent[] = [];

    // Pick random crime window (W2-W5 has highest validation pass rates)
    const crimeWindowOptions: WindowId[] = ['W2', 'W3', 'W4', 'W5'];
    const crimeWindowId = rng.pick(crimeWindowOptions);
    const crimeWindowDef = WINDOWS.find(w => w.id === crimeWindowId)!;

    // Pre-crime: all windows before crime window
    const allWindowIds: WindowId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const crimeWindowIndex = allWindowIds.indexOf(crimeWindowId);
    const preCrimeWindows = allWindowIds.slice(0, crimeWindowIndex);

    for (const window of preCrimeWindows) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // First, simulate normal routines to get everyone in position
    // Simulate routines during crime window
    const crimeWindowRoutines = simulateRoutines(world, npcStates, crimeWindowId, crimeWindowDef.startTick, rng);
    allEvents.push(...crimeWindowRoutines);

    // Find opportunities for crime
    // Find opportunities
    let opportunities = findOpportunities(world, npcStates, crimeWindowDef.id, rng);

    // RESCUE STRATEGY: If no natural opportunities, force a distraction
    if (opportunities.length === 0) {
        // Find any NPC co-located with an item they don't own
        // We need to access the locations/items derived inside findOpportunities, but we can't.
        // So we iterate independently.
        const rescueCandidates: { culprit: NPC, item: Item, witnesses: NPCId[] }[] = [];

        for (const culpritId of npcStates.keys()) {
            const state = npcStates.get(culpritId)!;
            const place = state.currentPlace;

            // Find items here
            const itemsHere = world.items.filter(i => i.startPlace === place);

            for (const item of itemsHere) {
                // Get witnesses
                const witnesses = Array.from(npcStates.keys()).filter(id =>
                    id !== culpritId && npcStates.get(id)!.currentPlace === place
                );

                // Keep candidate
                const culprit = world.npcs.find(n => n.id === culpritId)!;
                rescueCandidates.push({ culprit, item, witnesses });
            }
        }

        if (rescueCandidates.length > 0) {
            // Pick a random candidate to force
            const rescue = rng.pick(rescueCandidates);

            // FORCE DISTRACTION on all witnesses
            for (const witnessId of rescue.witnesses) {
                const witnessState = npcStates.get(witnessId)!;
                if (!witnessState.distracted) {
                    witnessState.distracted = 'sleeping'; // Force them to sleep
                }
            }

            // Re-run detection
            opportunities = findOpportunities(world, npcStates, crimeWindowDef.id, rng);
        }
    }

    if (opportunities.length === 0) {
        // No valid crime setup - this seed fails
        return null;
    }

    // Pick one opportunity
    const chosen = rng.pick(opportunities);

    // Run pre-simulation (Synthetic History for Cold Start)
    const history = createEmptyHistory();
    const gossipState = initGossipState(world, history);

    // Generate 30 days of fake history to seed grudges/alliances
    generateSyntheticHistory(world, gossipState, history, rng, 30);

    // Run short pre-sim for today's gossip propagation
    runPreSimulation(world, history, rng, 50);

    // Generate motive from emergent state (not templates)
    const motive = deriveEmergentMotive(
        chosen.npc,
        chosen.item,
        world,
        gossipState,
        history,
        rng
    );

    // Generate crime type and method EARLY (so we can log it)
    const crimeTypes: CrimeType[] = ['theft', 'sabotage', 'prank', 'disappearance'];
    const crimeType = rng.pick(crimeTypes);
    const crimeMethod = generateCrimeMethod(crimeType, chosen.item, chosen.npc, rng);

    // Execute crime
    const { events: crimeEvents, config: crimeConfig } = executeCrime(
        world,
        npcStates,
        chosen,
        crimeWindowDef.startTick + 10,
        crimeMethod, // Pass generic flavor
        rng
    );
    allEvents.push(...crimeEvents);

    // (Red Herrings are now fully emergent inside simulateRoutines)

    // Maybe add a twist (based on difficulty tier)
    const twist = maybeGenerateTwist(world, chosen.npc.id, rng, difficultyConfig.twistRules);

    // Aftermath: all windows after crime window
    const aftermathWindows = allWindowIds.slice(crimeWindowIndex + 1);
    for (const window of aftermathWindows) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // Sort events by tick
    allEvents.sort((a, b) => a.tick - b.tick);



    // Harvest Suspicious Acts from the simulation (Emergent Red Herrings)
    const suspiciousActs: SuspiciousAct[] = [];
    const activityEvents = allEvents.filter(e => e.type === 'ACTIVITY_STARTED');
    for (const event of activityEvents) {
        if (!event.data || !event.actor || !event.place) continue;

        // Lookup definition
        const actId = (event.data as any).activity as ActivityType;
        const actDef = ACTIVITIES[actId];

        if (actDef) {
            suspiciousActs.push({
                npc: event.actor,
                window: event.window,
                place: event.place,
                action: actDef.visualDescription,
                looksLike: actDef.looksLike,
                actualReason: actDef.alibi,
                generatesEvents: true
            });
        }
    }

    const config: CaseConfig = {
        seed,
        suspects: world.npcs.map(n => n.id),
        culpritId: crimeConfig.culpritId!,
        crimeType,
        crimeMethod,
        targetItem: crimeConfig.targetItem!,
        crimeWindow: crimeConfig.crimeWindow!,
        crimePlace: crimeConfig.crimePlace!,
        hiddenPlace: crimeConfig.hiddenPlace!,
        motive,
        twist,
        suspiciousActs,
        distractedWitnesses: chosen.distractedWitness ? [chosen.distractedWitness.id] : undefined,
    };

    return {
        seed,
        world,
        eventLog: allEvents,
        config,
    };
}

// ============================================================================
// Blueprint-Based Simulation
// ============================================================================

/**
 * Run simulation using the blueprint system.
 *
 * This provides more variety through:
 * - 10 different incident blueprints
 * - Multiple method variants per blueprint
 * - Intent-driven crime execution
 */
function simulateWithBlueprints(
    seed: number,
    difficultyTier: number,
    options: SimulationOptions
): SimulationResult | null {
    // Reset ordinal for deterministic event IDs
    eventOrdinal = 0;
    setEventOrdinal(0);

    const difficultyConfig = DIFFICULTY_PRESETS[difficultyTier] ?? DIFFICULTY_PRESETS[2];

    const rng = createRng(seed);

    // Use canonical house/cast if specified, otherwise legacy world
    const world = (options.houseId || options.castId)
        ? createWorldFromConfig(rng, options.houseId ?? 'share_house', options.castId ?? 'roommates')
        : createWorld(rng);

    const npcStates = initNPCStates(world);

    const allEvents: SimEvent[] = [];

    // Use provided blueprints or all available
    const blueprints = options.blueprints ?? ALL_BLUEPRINTS;

    // Try to instantiate a blueprint
    const instantiation = tryInstantiateAny(blueprints, world, rng, 20);
    if (!instantiation) {
        // Fall back to legacy system if blueprints fail
        return simulate(seed, difficultyTier, { useBlueprints: false, houseId: options.houseId, castId: options.castId });
    }

    const { blueprint, plan } = instantiation;

    // Get crime window info
    const crimeWindowId = plan.crimeWindow;
    const crimeWindowDef = WINDOWS.find(w => w.id === crimeWindowId)!;

    // Pre-crime: all windows before crime window
    const allWindowIds: WindowId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const crimeWindowIndex = allWindowIds.indexOf(crimeWindowId);
    const preCrimeWindows = allWindowIds.slice(0, crimeWindowIndex);

    for (const window of preCrimeWindows) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // Simulate routines during crime window
    const crimeWindowRoutines = simulateRoutines(world, npcStates, crimeWindowId, crimeWindowDef.startTick, rng);
    allEvents.push(...crimeWindowRoutines);

    // Find distracted witnesses: any non-culprit NPCs at the crime scene
    const distractedWitnesses: NPCId[] = [];
    for (const [npcId, state] of npcStates) {
        if (npcId !== plan.culprit && state.currentPlace === plan.crimePlace) {
            distractedWitnesses.push(npcId);
        }
    }

    // Execute crime using blueprint plan
    const crimeEvents = executeCrimePlan(plan, world, rng);
    allEvents.push(...crimeEvents);

    // Run pre-simulation for gossip/motive
    const history = createEmptyHistory();
    const gossipState = initGossipState(world, history);
    generateSyntheticHistory(world, gossipState, history, rng, 30);
    runPreSimulation(world, history, rng, 50);

    // Get culprit and item for motive generation
    const culprit = world.npcs.find(n => n.id === plan.culprit)!;
    const targetItem = world.items.find(i => i.id === plan.targetItem)!;

    // Generate motive from emergent state
    const motive = deriveEmergentMotive(
        culprit,
        targetItem,
        world,
        gossipState,
        history,
        rng
    );

    // Map blueprint incident type to crime type
    const crimeType = mapIncidentToCrimeType(blueprint.incidentType);

    // Generate crime method (use the variant's method ID)
    const crimeMethod = generateCrimeMethod(crimeType, targetItem, culprit, rng);
    // Override with the plan's method
    crimeMethod.methodId = plan.variantId;

    // Maybe add a twist
    const twist = maybeGenerateTwist(world, plan.culprit, rng, difficultyConfig.twistRules);

    // Aftermath: all windows after crime window
    const aftermathWindows = allWindowIds.slice(crimeWindowIndex + 1);
    for (const window of aftermathWindows) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // Sort events by tick
    allEvents.sort((a, b) => a.tick - b.tick);

    // Harvest Suspicious Acts
    const suspiciousActs: SuspiciousAct[] = [];
    const activityEvents = allEvents.filter(e => e.type === 'ACTIVITY_STARTED');
    for (const event of activityEvents) {
        if (!event.data || !event.actor || !event.place) continue;
        const actId = (event.data as any).activity as ActivityType;
        const actDef = ACTIVITIES[actId];
        if (actDef) {
            suspiciousActs.push({
                npc: event.actor,
                window: event.window,
                place: event.place,
                action: actDef.visualDescription,
                looksLike: actDef.looksLike,
                actualReason: actDef.alibi,
                generatesEvents: true
            });
        }
    }

    const config: CaseConfig = {
        seed,
        suspects: world.npcs.map(n => n.id),
        culpritId: plan.culprit,
        crimeType,
        crimeMethod,
        targetItem: plan.targetItem,
        crimeWindow: plan.crimeWindow,
        crimePlace: plan.crimePlace,
        hiddenPlace: plan.hidePlace,
        motive,
        twist,
        suspiciousActs,
        distractedWitnesses: distractedWitnesses.length > 0 ? distractedWitnesses : undefined,
    };

    return {
        seed,
        world,
        eventLog: allEvents,
        config,
    };
}

/**
 * Map blueprint incident type to existing crime type
 */
function mapIncidentToCrimeType(incidentType: string): CrimeType {
    switch (incidentType) {
        case 'theft': return 'theft';
        case 'sabotage': return 'sabotage';
        case 'prank': return 'prank';
        case 'swap': return 'prank'; // Swap is a type of prank
        case 'disappearance': return 'disappearance';
        default: return 'theft';
    }
}
