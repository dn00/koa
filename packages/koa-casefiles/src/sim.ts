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
} from './types.js';
import { WINDOWS, getWindowForTick } from './types.js';
import { createWorld, findPath, getDoorBetween, PLACES } from './world.js';
import { createRng, type RNG } from './kernel/rng.js';
import { computeEventId } from './kernel/canonical.js';

// Gossip ecology - emergent simulation
import {
    runPreSimulation,
    createEmptyHistory,
    deriveEmergentMotive,
    spawnDeedGossip,
    type GossipState,
    type CaseHistory,
} from './gossip/index.js';

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

// ============================================================================
// NPC State Tracking
// ============================================================================

interface NPCState {
    id: NPCId;
    currentPlace: PlaceId;
}

function initNPCStates(world: World): Map<NPCId, NPCState> {
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
function simulateRoutines(
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

        if (!scheduled || scheduled.place === state.currentPlace) {
            continue; // Already there or no movement needed
        }

        // Find path from current place to scheduled place
        const path = findPath(state.currentPlace, scheduled.place, world.places);

        if (path.length < 2) continue; // Already there

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

            // Motion sensor trigger if passing through living room
            if (to === 'living') {
                const motionSensor = world.devices.find(d => d.id === 'motion_living');
                if (motionSensor) {
                    events.push(createEvent(tick, 'MOTION_DETECTED', {
                        actor: npc.id,
                        place: 'living',
                        target: motionSensor.id,
                    }));
                }
            }

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
 */
function findOpportunities(
    world: World,
    npcStates: Map<NPCId, NPCState>,
    crimeWindow: WindowId,
    rng: RNG
): Opportunity[] {
    const opportunities: Opportunity[] = [];

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

    // For each item, find NPCs who have opportunity
    for (const item of world.items) {
        const itemPlace = item.startPlace;

        // Who is at the item's location?
        const npcsAtItem = world.npcs.filter(npc =>
            npcLocations.get(npc.id)?.place === itemPlace
        );

        if (npcsAtItem.length === 0) continue;

        // Check each NPC at that location as potential culprit
        for (const potentialCulprit of npcsAtItem) {
            const culpritInfo = npcLocations.get(potentialCulprit.id);

            // Culprit can't be distracted themselves
            if (culpritInfo?.distracted) continue;

            // Check if other NPCs at same location are all distracted
            const otherNpcsAtItem = npcsAtItem.filter(n => n.id !== potentialCulprit.id);
            const allDistracted = otherNpcsAtItem.every(n =>
                npcLocations.get(n.id)?.distracted !== undefined
            );

            // Opportunity exists if alone OR all others are distracted
            if (otherNpcsAtItem.length === 0 || allDistracted) {
                // Find a hiding place (adjacent room that's empty or has only distracted NPCs)
                const place = world.places.find(p => p.id === itemPlace);
                if (!place) continue;

                for (const adjacent of place.adjacent) {
                    const npcsAtAdjacent = world.npcs.filter(n => {
                        const loc = npcLocations.get(n.id);
                        return loc?.place === adjacent && !loc.distracted;
                    });

                    // Can hide if adjacent is empty or all distracted
                    if (npcsAtAdjacent.length === 0) {
                        const distractedWitness = otherNpcsAtItem.length > 0
                            ? otherNpcsAtItem[0]
                            : undefined;

                        opportunities.push({
                            npc: potentialCulprit,
                            item,
                            place: itemPlace,
                            window: crimeWindow,
                            hidePlace: adjacent,
                            distractedWitness,
                        });
                        break; // One opportunity per item per culprit
                    }
                }
            }
        }
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
    rng: RNG
): { events: SimEvent[]; config: Partial<CaseConfig> } {
    const events: SimEvent[] = [];
    let tick = crimeTickStart + rng.nextInt(5);

    // Take the item
    events.push(createEvent(tick, 'ITEM_TAKEN', {
        actor: opportunity.npc.id,
        place: opportunity.place,
        target: opportunity.item.id,
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

    // Motion sensor if passing through living
    if (opportunity.hidePlace === 'living') {
        events.push(createEvent(tick, 'MOTION_DETECTED', {
            actor: opportunity.npc.id,
            place: 'living',
            target: 'motion_living',
        }));
    }

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
    descriptions: string[];
    funnyMethods: string[];
}> = {
    theft: {
        descriptions: [
            'stole {item}',
            'made off with {item}',
            'yoinked {item}',
        ],
        funnyMethods: [
            'while pretending to look for their phone',
            'during the great kitchen distraction of 2024',
            'using the ancient art of \"borrowing indefinitely\"',
            'with the confidence of someone who definitely owns that thing',
        ],
    },
    sabotage: {
        descriptions: [
            'sabotaged {item}',
            'ruined {item}',
            'tampered with {item}',
        ],
        funnyMethods: [
            'in a fit of passive-aggressive brilliance',
            'because \"accidents happen\"',
            'while maintaining complete deniability',
            'with surgical precision and petty motivation',
        ],
    },
    prank: {
        descriptions: [
            'pranked the household with {item}',
            'relocated {item} for maximum confusion',
            'swapped {item} with something worse',
        ],
        funnyMethods: [
            'for absolutely no reason other than chaos',
            'and immediately regretted nothing',
            'while giggling like a gremlin',
            'as part of an elaborate scheme that made sense at the time',
        ],
    },
    disappearance: {
        descriptions: [
            'made {item} \"disappear\"',
            'hid {item} in plain sight',
            'ensured {item} would never be found (until tomorrow)',
        ],
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

    let description = rng.pick(templates.descriptions);
    const funnyMethod = rng.pick(templates.funnyMethods);

    // Fill in template vars
    description = description.replace('{item}', item.name);

    return {
        type: crimeType,
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
        ],
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
// Suspicious Acts - Red herrings doing sketchy things
// ============================================================================

const SUSPICIOUS_ACT_TEMPLATES: Array<{
    action: string;
    looksLike: string;
    actualReason: string;
}> = [
        { action: 'sneaking to kitchen at night', looksLike: 'hiding evidence', actualReason: 'shame-eating leftover cake' },
        { action: 'whispering on phone in garage', looksLike: 'coordinating with accomplice', actualReason: 'ordering surprise gift' },
        { action: 'quickly closing laptop when approached', looksLike: 'hiding incriminating search history', actualReason: 'was reading fanfiction' },
        { action: 'checking all the doors repeatedly', looksLike: 'ensuring no witnesses', actualReason: 'OCD about home security' },
        { action: 'moving something heavy in garage', looksLike: 'disposing of evidence', actualReason: 'finally putting away holiday decorations' },
        { action: 'avoiding eye contact all evening', looksLike: 'guilty conscience', actualReason: 'hasn\'t told anyone they ate the last yogurt' },
        { action: 'seen near the crime scene after the fact', looksLike: 'returning to check their work', actualReason: 'looking for their reading glasses' },
        { action: 'washing hands repeatedly', looksLike: 'removing evidence', actualReason: 'germaphobe having a moment' },
        { action: 'suddenly very interested in trash day', looksLike: 'disposing of evidence', actualReason: 'finally throwing away ex\'s stuff' },
        { action: 'asking weird questions about alibis', looksLike: 'fishing for information', actualReason: 'writing a mystery novel' },
    ];

function generateSuspiciousActs(
    world: World,
    culpritId: NPCId,
    crimeWindow: WindowId,
    rng: RNG
): { acts: SuspiciousAct[]; events: SimEvent[] } {
    const acts: SuspiciousAct[] = [];
    const events: SimEvent[] = [];

    const innocents = world.npcs.filter(n => n.id !== culpritId);
    const numActs = 2 + rng.nextInt(3); // 2-4 suspicious acts

    const shuffledTemplates = rng.shuffle([...SUSPICIOUS_ACT_TEMPLATES]);
    const shuffledInnocents = rng.shuffle([...innocents]);

    for (let i = 0; i < Math.min(numActs, shuffledInnocents.length); i++) {
        const npc = shuffledInnocents[i];
        const template = shuffledTemplates[i % shuffledTemplates.length];

        // Pick a window (prefer around crime window for maximum suspicion)
        const suspiciousWindows: WindowId[] = ['W2', 'W3', 'W4'];
        const window = rng.pick(suspiciousWindows);

        // Get NPC's location during that window
        const scheduled = npc.schedule.find(s => s.window === window);
        const place = scheduled?.place ?? 'living';

        const act: SuspiciousAct = {
            npc: npc.id,
            window,
            place,
            action: template.action,
            looksLike: template.looksLike,
            actualReason: template.actualReason,
            generatesEvents: rng.nextInt(100) < 50, // 50% generate events
        };

        acts.push(act);

        // Generate SUSPICIOUS_ACT event if applicable
        if (act.generatesEvents) {
            const windowDef = WINDOWS.find(w => w.id === window)!;
            events.push(createEvent(
                windowDef.startTick + 5 + rng.nextInt(10),
                'SUSPICIOUS_ACT',
                {
                    actor: npc.id,
                    place,
                    data: { action: act.action, looksLike: act.looksLike },
                }
            ));
        }
    }

    return { acts, events };
}

// ============================================================================
// Twist Rules - Optional complexity
// ============================================================================

function maybeGenerateTwist(
    world: World,
    culpritId: NPCId,
    rng: RNG
): TwistRule | undefined {
    // 30% chance of a twist
    if (rng.nextInt(100) >= 30) return undefined;

    const twistTypes = ['false_alibi', 'unreliable_witness'] as const;
    const type = rng.pick([...twistTypes]);

    const innocents = world.npcs.filter(n => n.id !== culpritId);
    const actor = rng.pick(innocents);

    switch (type) {
        case 'false_alibi':
            return {
                type: 'false_alibi',
                actor: actor.id,
                description: `${actor.name} claims they were in the bedroom all evening (they weren't)`,
                affectsEvidence: [],
            };
        case 'unreliable_witness':
            return {
                type: 'unreliable_witness',
                actor: actor.id,
                description: `${actor.name}'s testimony is off by one time window (they fell asleep and lost track of time)`,
                affectsEvidence: [],
            };
    }
}

// ============================================================================
// Main Simulation
// ============================================================================

export function simulate(seed: number): SimulationResult | null {
    // Reset ordinal for deterministic event IDs
    eventOrdinal = 0;

    const rng = createRng(seed);
    const world = createWorld(rng);
    const npcStates = initNPCStates(world);

    const allEvents: SimEvent[] = [];

    // Pre-crime: W1-W2
    for (const window of ['W1', 'W2'] as WindowId[]) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // Crime window: W3
    const crimeWindowDef = WINDOWS.find(w => w.id === 'W3')!;

    // First, simulate normal routines to get everyone in position
    const w3Routines = simulateRoutines(world, npcStates, 'W3', crimeWindowDef.startTick, rng);
    allEvents.push(...w3Routines);

    // Find opportunities for crime
    const opportunities = findOpportunities(world, npcStates, 'W3', rng);

    if (opportunities.length === 0) {
        // No valid crime setup - this seed fails
        return null;
    }

    // Pick one opportunity
    const chosen = rng.pick(opportunities);

    // Run pre-simulation to evolve gossip state
    const history = createEmptyHistory(); // TODO: Pass in accumulated history
    const gossipState = runPreSimulation(world, history, rng);

    // Generate motive from emergent state (not templates)
    const motive = deriveEmergentMotive(
        chosen.npc,
        chosen.item,
        world,
        gossipState,
        history,
        rng
    );

    // Execute crime
    const { events: crimeEvents, config: crimeConfig } = executeCrime(
        world,
        npcStates,
        chosen,
        crimeWindowDef.startTick + 10,
        rng
    );
    allEvents.push(...crimeEvents);

    // Generate suspicious acts for red herrings
    const { acts: suspiciousActs, events: suspiciousEvents } = generateSuspiciousActs(
        world,
        chosen.npc.id,
        'W3',
        rng
    );
    allEvents.push(...suspiciousEvents);

    // Maybe add a twist
    const twist = maybeGenerateTwist(world, chosen.npc.id, rng);

    // Aftermath: W4-W6
    for (const window of ['W4', 'W5', 'W6'] as WindowId[]) {
        const windowDef = WINDOWS.find(w => w.id === window)!;
        const events = simulateRoutines(world, npcStates, window, windowDef.startTick, rng);
        allEvents.push(...events);
    }

    // Sort events by tick
    allEvents.sort((a, b) => a.tick - b.tick);

    // Generate crime type and method
    const crimeTypes: CrimeType[] = ['theft', 'sabotage', 'prank', 'disappearance'];
    const crimeType = rng.pick(crimeTypes);
    const crimeMethod = generateCrimeMethod(crimeType, chosen.item, chosen.npc, rng);

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
        distractedWitness: chosen.distractedWitness?.id,
    };

    return {
        seed,
        world,
        eventLog: allEvents,
        config,
    };
}
