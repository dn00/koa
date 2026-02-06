/**
 * KOA Casefiles - Evidence Derivation
 *
 * Converts the event log into evidence items that players can discover.
 * Every evidence item MUST cite the EventIds it derives from.
 */

import type {
    World,
    SimEvent,
    CaseConfig,
    EvidenceItem,
    PresenceEvidence,
    DeviceLogEvidence,
    TestimonyEvidence,
    PhysicalEvidence,
    MotiveEvidence,
    NPCId,
    PlaceId,
    WindowId,
    MotiveType,
    RelationshipType,
    NPC,
    Item,
    MethodId,
} from './types.js';
import { WINDOWS, DIFFICULTY_PROFILES } from './types.js';
import { sha256 } from './kernel/canonical.js';
import { ACTIVITIES, type ActivityType } from './activities.js';

// ============================================================================
// Evidence ID Generation
// ============================================================================

let evidenceCounter = 0;

function makeEvidenceId(prefix: string): string {
    return `${prefix}_${++evidenceCounter}`;
}

// ============================================================================
// Presence Evidence
// ============================================================================

/**
 * Derive where each NPC was during each window.
 * Based on MOVE events.
 */
function derivePresence(
    world: World,
    events: SimEvent[]
): PresenceEvidence[] {
    const evidence: PresenceEvidence[] = [];

    // Track NPC locations over time
    const npcLocations = new Map<NPCId, Map<WindowId, { place: PlaceId; eventIds: string[] }>>();

    // Initialize with starting positions
    for (const npc of world.npcs) {
        const windowMap = new Map<WindowId, { place: PlaceId; eventIds: string[] }>();
        const firstSchedule = npc.schedule.find(s => s.window === 'W1');
        const startPlace = firstSchedule?.place ?? 'living';

        for (const w of WINDOWS) {
            windowMap.set(w.id, { place: startPlace, eventIds: [] });
        }
        npcLocations.set(npc.id, windowMap);
    }

    // Process move events
    for (const event of events) {
        if (event.type === 'NPC_MOVE' && event.actor && event.toPlace) {
            const npcMap = npcLocations.get(event.actor);
            if (npcMap) {
                // Update location for this window and all subsequent windows
                let foundWindow = false;
                for (const w of WINDOWS) {
                    if (w.id === event.window) foundWindow = true;
                    if (foundWindow) {
                        const entry = npcMap.get(w.id)!;
                        entry.place = event.toPlace;
                        entry.eventIds.push(event.id);
                    }
                }
            }
        }
    }

    // Create presence evidence
    for (const [npcId, windowMap] of npcLocations) {
        for (const [windowId, { place, eventIds }] of windowMap) {
            evidence.push({
                id: makeEvidenceId('presence'),
                kind: 'presence',
                npc: npcId,
                window: windowId,
                place,
                cites: eventIds.length > 0 ? eventIds : ['inferred_start'],
            });
        }
    }

    return evidence;
}

// ============================================================================
// Device Log Evidence
// ============================================================================

/**
 * Derive device log evidence from DOOR and MOTION events.
 * Door sensors can identify WHO opened them via smart lock integration.
 * Motion sensors only detect presence, not identity.
 *
 * Device coverage is controlled by difficulty:
 * - EASY: Full coverage (all logs available)
 * - MEDIUM: One device gap in one non-crime window
 * - HARD: Multiple gaps, sparse coverage (but always solvable)
 */
function deriveDeviceLogs(
    world: World,
    events: SimEvent[],
    config?: CaseConfig
): DeviceLogEvidence[] {
    const evidence: DeviceLogEvidence[] = [];
    const profile = config?.tier ? DIFFICULTY_PROFILES[config.tier] : DIFFICULTY_PROFILES[2];
    const gaps = profile?.deviceGaps ?? 0;

    // Determine which windows have "offline" devices based on tier profile
    const offlineWindows = getOfflineWindowsByGaps(config?.crimeWindow, gaps);

    for (const event of events) {
        // Skip events in offline windows (device coverage gaps)
        if (offlineWindows.has(event.window)) {
            continue;
        }

        if (event.type === 'DOOR_OPENED' || event.type === 'DOOR_CLOSED') {
            const device = world.devices.find(d => d.id === event.target);
            if (device) {
                // Door sensors identify WHO opened them via smart lock
                // Exception: don't directly identify culprit at crime time (anti-anticlimax)
                const isCrimeEvent = config &&
                    event.actor === config.culpritId &&
                    event.window === config.crimeWindow &&
                    event.place === config.crimePlace;

                const npc = event.actor ? world.npcs.find(n => n.id === event.actor) : undefined;
                const action = event.type === 'DOOR_OPENED' ? 'opened' : 'closed';
                const detail = npc && !isCrimeEvent
                    ? `Door ${action} by ${npc.name}`
                    : `Door ${action}`;

                evidence.push({
                    id: makeEvidenceId('device'),
                    kind: 'device_log',
                    device: device.id,
                    deviceType: device.type,
                    window: event.window,
                    place: event.place ?? device.place,
                    detail,
                    actor: isCrimeEvent ? undefined : event.actor,
                    cites: [event.id],
                });
            }
        }

        if (event.type === 'MOTION_DETECTED') {
            const device = world.devices.find(d => d.id === event.target);
            if (device) {
                evidence.push({
                    id: makeEvidenceId('device'),
                    kind: 'device_log',
                    device: device.id,
                    deviceType: device.type,
                    window: event.window,
                    place: event.place ?? device.place,
                    detail: 'Motion detected',
                    cites: [event.id],
                });
            }
        }

        // Camera snapshots - ambiguous descriptions (anti-anticlimax)
        if (event.type === 'CAMERA_SNAPSHOT') {
            const device = world.devices.find(d => d.id === event.target);
            if (device && event.actor) {
                const npc = world.npcs.find(n => n.id === event.actor);
                const description = getCameraDescription(npc, event.data?.carrying as string | undefined);

                evidence.push({
                    id: makeEvidenceId('device'),
                    kind: 'device_log',
                    device: device.id,
                    deviceType: 'camera',
                    window: event.window,
                    place: event.place ?? device.place,
                    detail: `Snapshot: ${description}`,
                    cites: [event.id],
                });
            }
        }
    }

    return evidence;
}

/**
 * Determine which windows have "offline" devices based on difficulty.
 * NEVER makes the crime window offline - that would make the case unsolvable.
 *
 * - EASY: No offline windows (full coverage)
 * - MEDIUM: One non-crime window is offline
 * - HARD: Two non-crime windows are offline (sparse but solvable)
 */
function getOfflineWindowsByGaps(
    crimeWindow: WindowId | undefined,
    gaps: number
): Set<WindowId> {
    const offline = new Set<WindowId>();

    if (gaps === 0 || !crimeWindow) {
        return offline; // Full coverage
    }

    const allWindows: WindowId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const crimeIdx = allWindows.indexOf(crimeWindow);

    // Never offline: crime window and immediately adjacent windows
    // This ensures the contradiction is always catchable (retro lesson #3)
    const protectedWindows = new Set<WindowId>([crimeWindow]);
    if (crimeIdx > 0) protectedWindows.add(allWindows[crimeIdx - 1]);
    if (crimeIdx < 5) protectedWindows.add(allWindows[crimeIdx + 1]);

    const candidateOffline = allWindows.filter(w => !protectedWindows.has(w));

    if (gaps === 1 && candidateOffline.length >= 1) {
        // One gap: earliest non-protected window
        offline.add(candidateOffline[0]);
    }

    if (gaps >= 2 && candidateOffline.length >= 2) {
        // Two gaps: earliest and latest non-protected windows (spread out)
        offline.add(candidateOffline[0]);
        offline.add(candidateOffline[candidateOffline.length - 1]);
    }

    return offline;
}

/**
 * Generate an ambiguous camera description (anti-anticlimax).
 * Never directly identifies the person.
 */
function getCameraDescription(npc: NPC | undefined, carrying?: string): string {
    if (!npc) return 'figure detected';

    // Vague physical descriptors based on archetype (from role)
    const descriptors = [
        'a figure',
        'someone',
        'a person',
        'a silhouette',
    ];

    // Add vague trait hints
    const traitHints: string[] = [];

    if (npc.role.includes('tall') || npc.role.includes('sibling')) {
        traitHints.push('appears tall');
    }
    if (npc.role.includes('teenager') || npc.role.includes('teen')) {
        traitHints.push('younger-looking');
    }
    if (npc.role.includes('grandmother') || npc.role.includes('grandma')) {
        traitHints.push('moving slowly');
    }
    // Removed clothing hints (business casual, loungewear) - player can't verify these
    // Keep only observable traits like movement patterns

    // Build description
    const base = descriptors[Math.floor(npc.id.charCodeAt(0) % descriptors.length)];
    const trait = traitHints.length > 0 ? `, ${traitHints[0]}` : '';
    const item = carrying ? `, carrying something` : '';

    return `${base}${trait}${item}`;
}

// ============================================================================
// Testimony Evidence
// ============================================================================

/**
 * Derive what NPCs could have observed.
 *
 * Key anti-anticlimax rule: Witnesses only report OBSERVABLES, not identity.
 * - "Heard footsteps in hallway"
 * - "Saw someone tall in the kitchen"
 * - "Heard a door open around 8pm"
 *
 * Never: "I saw Carol steal the cactus"
 */
function deriveTestimony(
    world: World,
    events: SimEvent[],
    config: CaseConfig
): TestimonyEvidence[] {
    const evidence: TestimonyEvidence[] = [];

    // Get NPC locations per window (simplified)
    const npcLocationsPerWindow = new Map<WindowId, Map<NPCId, PlaceId>>();

    for (const w of WINDOWS) {
        const locMap = new Map<NPCId, PlaceId>();
        for (const npc of world.npcs) {
            const scheduled = npc.schedule.find(s => s.window === w.id);
            locMap.set(npc.id, scheduled?.place ?? 'living');
        }
        npcLocationsPerWindow.set(w.id, locMap);
    }

    // For each event, determine who could have witnessed it
    for (const event of events) {
        if (!event.place || !event.actor) continue;

        const locationMap = npcLocationsPerWindow.get(event.window);
        if (!locationMap) continue;

        // Find NPCs who were in adjacent rooms
        const eventPlace = world.places.find(p => p.id === event.place);
        if (!eventPlace) continue;

        for (const npc of world.npcs) {
            if (npc.id === event.actor) continue; // Can't witness yourself

            // Culprit shouldn't witness their own crime events
            if (npc.id === config.culpritId &&
                event.window === config.crimeWindow &&
                (event.place === config.crimePlace || event.place === config.hiddenPlace)) {
                continue;
            }

            const witnessPlace = locationMap.get(npc.id);
            if (!witnessPlace) continue;

            // Adjacent or same room = can hear/see something
            const isAdjacent = eventPlace.adjacent.includes(witnessPlace);
            const isSameRoom = witnessPlace === event.place;

            if (!isAdjacent && !isSameRoom) continue;

            // Generate observable testimony based on event type
            let observable: string;
            let confidence: number;
            let subjectHint: string | undefined;

            if (event.type === 'NPC_MOVE') {
                const actorNpc = world.npcs.find(n => n.id === event.actor);
                const actorName = actorNpc?.name ?? event.actor;
                if (isSameRoom) {
                    observable = `saw ${actorName} come in`;
                    confidence = 0.8;
                    subjectHint = actorName.toLowerCase();
                } else {
                    // Adjacent room - can sometimes identify by sound/glimpse
                    observable = `heard ${actorName} moving around nearby`;
                    confidence = 0.5;
                    subjectHint = actorName.toLowerCase();
                }
            } else if (event.type === 'DOOR_OPENED' || event.type === 'DOOR_CLOSED') {
                const actorNpc = world.npcs.find(n => n.id === event.actor);
                const actorName = actorNpc?.name ?? 'someone';
                if (isSameRoom || isAdjacent) {
                    observable = event.type === 'DOOR_OPENED'
                        ? `heard ${actorName} open a door`
                        : `heard ${actorName} close a door`;
                    confidence = 0.6;
                    subjectHint = actorName.toLowerCase();
                } else {
                    observable = event.type === 'DOOR_OPENED'
                        ? 'heard a door open'
                        : 'heard a door close';
                    confidence = 0.4;
                }
            } else if (event.type === 'ITEM_TAKEN') {
                const actorNpc = world.npcs.find(n => n.id === event.actor);
                const actorName = actorNpc?.name ?? 'someone';
                if (isSameRoom) {
                    // Same room - can see but be vague about crime action
                    const method = (event.data as any)?.method;
                    observable = method
                        ? `saw ${actorName} ${method}`
                        : `saw ${actorName} messing with something`;
                    confidence = 0.6;
                    subjectHint = actorName.toLowerCase();
                } else {
                    // Adjacent - heard something, might know who
                    observable = `heard ${actorName} rummaging around`;
                    confidence = 0.4;
                    subjectHint = actorName.toLowerCase();
                }
            } else if (event.type === 'ACTIVITY_STARTED') {
                const activityId = (event.data as any)?.activity as ActivityType | undefined;
                const sound = (event.data as any)?.sound;
                const actDef = activityId ? ACTIVITIES[activityId] : undefined;
                const actorNpc = world.npcs.find(n => n.id === event.actor);
                const actorName = actorNpc?.name ?? 'someone';

                if (isSameRoom && actDef) {
                    // Witness sees the activity - name the person
                    observable = `saw ${actorName} ${actDef.looksLike}`;
                    confidence = 0.7;
                    subjectHint = actorName.toLowerCase();
                } else if (isAdjacent && sound) {
                    // Adjacent room - heard sound, might know who
                    observable = `heard ${actorName} - ${sound}`;
                    confidence = 0.5;
                    subjectHint = actorName.toLowerCase();
                } else if (sound) {
                    observable = `heard ${sound}`;
                    confidence = 0.4;
                } else if (actDef && actDef.audioClues.length > 0) {
                    observable = `heard ${actDef.audioClues[0]}`;
                    confidence = 0.3;
                } else {
                    continue;
                }
            } else {
                continue; // Skip other event types
            }

            // Anti-anticlimax: If this is the crime event used by culprit,
            // NEVER give high confidence identification
            let subject: NPCId | undefined = event.actor;
            if (event.actor === config.culpritId && event.window === config.crimeWindow) {
                confidence = Math.min(confidence, 0.5);
                subjectHint = undefined; // Remove hint for crime events
                subject = undefined; // Don't directly identify culprit at crime scene
            }

            evidence.push({
                id: makeEvidenceId('testimony'),
                kind: 'testimony',
                witness: npc.id,
                window: event.window,
                place: witnessPlace,
                observable,
                confidence,
                subjectHint,
                subject: subject, // Identify subject when we know who it is
                subjectPlace: event.place,
                cites: [event.id],
            });
        }
    }

    // Generate "presence sighting" testimony - witnesses report seeing NPCs in adjacent rooms
    // This helps discover suspects who were present but didn't trigger events
    for (const timeWindow of WINDOWS) {
        const windowId = timeWindow.id;
        const locationMap = npcLocationsPerWindow.get(windowId);
        if (!locationMap) continue;

        for (const witness of world.npcs) {
            const witnessPlace = locationMap.get(witness.id);
            if (!witnessPlace) continue;

            const witnessRoom = world.places.find(p => p.id === witnessPlace);
            if (!witnessRoom) continue;

            // Check adjacent rooms for other NPCs
            for (const adjPlaceId of witnessRoom.adjacent) {
                for (const other of world.npcs) {
                    if (other.id === witness.id) continue;

                    const otherPlace = locationMap.get(other.id);
                    if (otherPlace !== adjPlaceId) continue;

                    // Don't reveal culprit at crime scene/time
                    if (other.id === config.culpritId &&
                        windowId === config.crimeWindow &&
                        (adjPlaceId === config.crimePlace || adjPlaceId === config.hiddenPlace)) {
                        continue;
                    }

                    const adjRoom = world.places.find(p => p.id === adjPlaceId);
                    const roomName = adjRoom?.name ?? adjPlaceId;

                    evidence.push({
                        id: makeEvidenceId('testimony'),
                        kind: 'testimony',
                        witness: witness.id,
                        window: windowId,
                        place: witnessPlace,
                        observable: `noticed ${other.name} was in the ${roomName}`,
                        confidence: 0.7,
                        subjectHint: other.name.toLowerCase(),
                        subject: other.id,
                        subjectPlace: adjPlaceId,
                        cites: [],
                    });
                }
            }
        }
    }

    // Deduplicate similar testimonies
    const deduped = deduplicateTestimony(evidence);

    return deduped;
}

function getVagueDescription(npcId: NPCId, world: World): string {
    // Return truly vague descriptions - no clothing/appearance that player can't verify
    // These are intentionally generic since player should use COMPARE to catch lies
    const descriptions: Record<string, string> = {
        alice: 'someone',
        bob: 'a figure',
        carol: 'somebody',
        dan: 'a person',
        eve: 'someone moving quickly',
    };
    return descriptions[npcId] ?? 'someone';
}

function deduplicateTestimony(evidence: TestimonyEvidence[]): TestimonyEvidence[] {
    // Group by witness + window + observable type
    const groups = new Map<string, TestimonyEvidence>();

    for (const e of evidence) {
        const key = `${e.witness}_${e.window}_${e.observable}`;
        const existing = groups.get(key);

        if (!existing || e.confidence > existing.confidence) {
            groups.set(key, {
                ...e,
                cites: existing
                    ? [...new Set([...existing.cites, ...e.cites])]
                    : e.cites,
            });
        }
    }

    return Array.from(groups.values());
}

// ============================================================================
// Physical Evidence
// ============================================================================

/**
 * Derive physical evidence from ITEM_TAKEN and ITEM_HIDDEN events.
 *
 * The evidence description hints at the crime type:
 * - Theft: item "taken", "missing", found "stashed"
 * - Sabotage: item "tampered with", "messed with"
 * - Prank: item "relocated", found in "ridiculous spot"
 * - Disappearance: item "vanished", found "hidden away"
 */
function derivePhysical(
    world: World,
    events: SimEvent[],
    config: CaseConfig
): PhysicalEvidence[] {
    const evidence: PhysicalEvidence[] = [];

    // Find the item that was stolen
    const targetItem = world.items.find(i => i.id === config.targetItem);
    if (!targetItem) return evidence;

    // Crime-type specific descriptions - vague version (no location)
    const missingVagueDescriptions: Record<string, string> = {
        theft: `${targetItem.funnyName} has gone missing`,
        sabotage: `${targetItem.funnyName} has been tampered with`,
        prank: `${targetItem.funnyName} has been moved somewhere`,
        disappearance: `${targetItem.funnyName} has mysteriously vanished`,
    };

    // Method-specific descriptions for crime scene (WHERE it was taken from)
    // These clearly indicate HOW the crime was done
    const methodMissingDescriptions: Record<MethodId, string> = {
        // Theft methods
        grabbed: `${targetItem.funnyName} was grabbed from ${targetItem.startPlace} - knocked over nearby items`,
        pocketed: `${targetItem.funnyName} was swiped from ${targetItem.startPlace} - small enough to pocket`,
        smuggled: `${targetItem.funnyName} was taken from ${targetItem.startPlace} - wrapping materials left behind`,
        // Sabotage methods
        broke: `${targetItem.funnyName} was broken in ${targetItem.startPlace} - pieces scattered`,
        unplugged: `${targetItem.funnyName} was unplugged in ${targetItem.startPlace} - cables disconnected`,
        reprogrammed: `${targetItem.funnyName} was reprogrammed in ${targetItem.startPlace} - settings changed`,
        // Prank methods
        relocated: `${targetItem.funnyName} was taken from ${targetItem.startPlace} - moved somewhere silly`,
        swapped: `${targetItem.funnyName} was swapped out in ${targetItem.startPlace} - decoy left behind`,
        disguised: `${targetItem.funnyName} was disguised in ${targetItem.startPlace} - costume remnants found`,
        // Disappearance methods
        hid: `${targetItem.funnyName} was hidden - last seen in ${targetItem.startPlace}`,
        buried: `${targetItem.funnyName} was buried away from ${targetItem.startPlace}`,
        donated: `${targetItem.funnyName} was "donated" from ${targetItem.startPlace} - donation note found`,
    };

    // Fallback crime-type specific descriptions - with location (gated)
    const missingLocationDescriptions: Record<string, string> = {
        theft: `${targetItem.funnyName} was taken from ${targetItem.startPlace}`,
        sabotage: `${targetItem.funnyName} was tampered with in ${targetItem.startPlace}`,
        prank: `${targetItem.funnyName} was moved from ${targetItem.startPlace}`,
        disappearance: `${targetItem.funnyName} vanished from ${targetItem.startPlace}`,
    };

    // Method-specific descriptions for HOW deduction
    // Each method hints at how the crime was committed
    const methodFoundDescriptions: Record<MethodId, string> = {
        // Theft methods
        grabbed: `${targetItem.funnyName} was found hastily stashed in ${config.hiddenPlace} - signs of a quick grab`,
        pocketed: `${targetItem.funnyName} was found in ${config.hiddenPlace} - small enough to have been pocketed`,
        smuggled: `${targetItem.funnyName} was found wrapped up in ${config.hiddenPlace} - someone smuggled it out`,
        // Sabotage methods
        broke: `${targetItem.funnyName} was found broken in ${config.hiddenPlace}`,
        unplugged: `${targetItem.funnyName} was found unplugged/disconnected in ${config.hiddenPlace}`,
        reprogrammed: `${targetItem.funnyName} was found in ${config.hiddenPlace} with tampered settings`,
        // Prank methods
        relocated: `${targetItem.funnyName} was deliberately relocated to ${config.hiddenPlace}`,
        swapped: `${targetItem.funnyName} was swapped out - found in ${config.hiddenPlace}`,
        disguised: `${targetItem.funnyName} was disguised and left in ${config.hiddenPlace}`,
        // Disappearance methods
        hid: `${targetItem.funnyName} was carefully hidden in ${config.hiddenPlace}`,
        buried: `${targetItem.funnyName} was buried under stuff in ${config.hiddenPlace}`,
        donated: `${targetItem.funnyName} was "donated away" - found in ${config.hiddenPlace}`,
    };

    // Fallback to crime-type generic if method not found
    const foundDescriptions: Record<string, string> = {
        theft: `${targetItem.funnyName} was found stashed in ${config.hiddenPlace}`,
        sabotage: `${targetItem.funnyName} was found dumped in ${config.hiddenPlace}`,
        prank: `${targetItem.funnyName} was found in a ridiculous spot in ${config.hiddenPlace}`,
        disappearance: `${targetItem.funnyName} was found carefully hidden in ${config.hiddenPlace}`,
    };

    // Use method-specific description if available, otherwise fall back to crime-type
    const methodId = config.crimeMethod?.methodId;
    const foundDetail = methodId && methodFoundDescriptions[methodId]
        ? methodFoundDescriptions[methodId]
        : (foundDescriptions[config.crimeType] ?? `${targetItem.funnyName} was found in ${config.hiddenPlace}`);

    // Use method-specific description for crime scene, or fall back to crime-type
    const missingDetail = methodId && methodMissingDescriptions[methodId]
        ? methodMissingDescriptions[methodId]
        : (missingLocationDescriptions[config.crimeType] ?? `${targetItem.funnyName} was taken from ${targetItem.startPlace}`);

    // WHERE the item was taken from - THIS IS THE CRIME LOCATION for accusation
    // Gating REMOVED: gossip now reveals location, so player should find evidence when they search
    evidence.push({
        id: makeEvidenceId('physical'),
        kind: 'physical',
        item: targetItem.id,
        detail: `[CRIME SCENE] ${missingDetail}`,
        place: targetItem.startPlace,
        window: config.crimeWindow,
        methodTag: methodId,  // Explicit HOW hint
        cites: events
            .filter(e => e.type === 'ITEM_TAKEN' && e.target === targetItem.id)
            .map(e => e.id),
    });

    // Item is hidden in new location - NOT the crime location
    // Gating REMOVED: player should be able to find physical evidence directly via SEARCH
    evidence.push({
        id: makeEvidenceId('physical'),
        kind: 'physical',
        item: targetItem.id,
        detail: `[HIDDEN] ${foundDetail}`,
        place: config.hiddenPlace,
        window: config.crimeWindow,
        methodTag: methodId,  // Explicit HOW hint
        cites: events
            .filter(e => e.type === 'ITEM_HIDDEN' && e.target === targetItem.id)
            .map(e => e.id),
    });

    // Evidence Traces (Activities)
    const traceEvents = events.filter(e => e.type === 'TRACE_FOUND');
    for (const trace of traceEvents) {
        evidence.push({
            id: makeEvidenceId('physical'),
            kind: 'physical',
            item: 'trace', // Generic ID
            detail: `Found ${(trace.data as any).trace}`,
            place: trace.place!,
            window: trace.window,
            cites: [trace.id]
        });
    }

    return evidence;
}

// ============================================================================
// Motive Evidence (Gossip about relationships)
// ============================================================================

/**
 * Map relationship types to possible motive types they suggest.
 */
const RELATIONSHIP_TO_MOTIVE: Record<RelationshipType, MotiveType[]> = {
    rivalry: ['rivalry', 'envy'],
    grudge: ['revenge'],
    annoyance: ['revenge', 'chaos'],
    crush: ['embarrassment', 'attention'],
    alliance: ['cover_up', 'chaos'],
};

/**
 * Generate natural-sounding gossip about a relationship.
 * This is what NPCs would actually say about each other.
 */
function generateGossipText(
    suspect: NPCId,
    target: NPCId,
    relType: RelationshipType,
    backstory: string,
    world: World
): string {
    const suspectName = world.npcs.find(n => n.id === suspect)?.name ?? suspect;
    const targetName = world.npcs.find(n => n.id === target)?.name ?? target;

    // Natural gossip phrases based on relationship type
    const templates: Record<RelationshipType, string[]> = {
        rivalry: [
            `${suspectName} and ${targetName} have been at each other's throats lately`,
            `${suspectName} is always trying to one-up ${targetName}`,
            `There's serious competition between ${suspectName} and ${targetName}`,
        ],
        grudge: [
            `${suspectName} is still salty about ${targetName} - you know, ${backstory.toLowerCase()}`,
            `${suspectName} hasn't forgiven ${targetName} for the whole "${backstory.toLowerCase()}" thing`,
            `${suspectName} brings up ${targetName} and the ${backstory.toLowerCase()} constantly`,
        ],
        annoyance: [
            `${suspectName} has been complaining about ${targetName} again`,
            `${suspectName} gets visibly irritated whenever ${targetName} is mentioned`,
            `You know how ${suspectName} feels about ${targetName}... ${backstory.toLowerCase()}`,
        ],
        crush: [
            `${suspectName} gets weird around ${targetName}, have you noticed?`,
            `I think ${suspectName} has a thing for ${targetName}`,
            `${suspectName} always perks up when ${targetName} walks in`,
        ],
        alliance: [
            `${suspectName} and ${targetName} are thick as thieves lately`,
            `Those two - ${suspectName} and ${targetName} - always cover for each other`,
            `${suspectName} would probably help ${targetName} hide a body, honestly`,
        ],
    };

    const options = templates[relType] ?? [`${suspectName} has feelings about ${targetName}`];
    // Use a simple deterministic selection based on names
    const idx = (suspect.charCodeAt(0) + target.charCodeAt(0)) % options.length;
    return options[idx];
}

/**
 * Derive motive evidence from world relationships AND the actual culprit's motive.
 * Each NPC can share gossip about relationships they've observed.
 *
 * Key design: NPCs gossip about OTHER people's relationships, not their own.
 * This makes it feel natural - people don't say "I have a grudge against Bob",
 * they say "Did you hear? Alice is still mad at Bob about the Tupperware."
 *
 * IMPORTANT: The culprit's actual motive is ALWAYS added as discoverable gossip
 * so the game is fair. Someone in the house knows about the grudge/rivalry.
 */
function deriveMotiveEvidence(world: World, config?: CaseConfig): MotiveEvidence[] {
    const evidence: MotiveEvidence[] = [];

    for (const relationship of world.relationships) {
        // Find a third party to be the gossip source (not involved in the relationship)
        const uninvolved = world.npcs.filter(
            n => n.id !== relationship.from && n.id !== relationship.to
        );

        if (uninvolved.length === 0) continue;

        // Pick gossip sources (up to 2 people might know about this relationship)
        const numSources = Math.min(2, uninvolved.length);
        const sources = uninvolved.slice(0, numSources);

        for (const source of sources) {
            const gossipText = generateGossipText(
                relationship.from,
                relationship.to,
                relationship.type,
                relationship.backstory,
                world
            );

            // Map to possible motives
            const possibleMotives = RELATIONSHIP_TO_MOTIVE[relationship.type];
            const motiveHint = possibleMotives[0]; // Primary motive suggestion

            evidence.push({
                id: makeEvidenceId('motive'),
                kind: 'motive',
                suspect: relationship.from,
                target: relationship.to,
                gossipSource: source.id,
                hint: gossipText,
                motiveHint,
                cites: [], // Gossip doesn't cite specific events
            });
        }
    }

    // CRITICAL: Add the culprit's actual motive as discoverable gossip
    // This ensures the game is always fair - someone knows about the grudge
    if (config) {
        const culpritName = world.npcs.find(n => n.id === config.culpritId)?.name ?? config.culpritId;
        const targetName = config.motive.target
            ? world.npcs.find(n => n.id === config.motive.target)?.name ?? config.motive.target
            : null;

        // Find NPCs who aren't the culprit or target to be gossip sources
        const potentialSources = world.npcs.filter(
            n => n.id !== config.culpritId && n.id !== config.motive.target
        );

        if (potentialSources.length > 0) {
            // Generate gossip text that clearly hints at the actual motive TYPE
            // This is critical for the player to correctly identify WHY
            const motiveHints: Record<MotiveType, string> = {
                envy: `${culpritName} has been green with envy lately${targetName ? ` - especially about ${targetName}` : ''}`,
                embarrassment: `${culpritName} was mortified about something${targetName ? ` involving ${targetName}` : ''} - trying to cover it up`,
                cover_up: `${culpritName} has been acting shady, like they're hiding something`,
                rivalry: `${culpritName} is in fierce competition${targetName ? ` with ${targetName}` : ''} - always trying to one-up`,
                attention: `${culpritName} has been desperate for attention lately - nobody pays them any mind`,
                revenge: `${culpritName} has been plotting payback${targetName ? ` against ${targetName}` : ''}${config.motive.funnyReason ? ` - "${config.motive.funnyReason.match(/"([^"]+)"/)?.[1] ?? 'some grievance'}"` : ''}`,
                chaos: `${culpritName} has been in a chaotic mood - said something about "watching it all burn"`,
                crime_awareness: `Something happened in the house`, // Not used for actual motives
            };
            const gossipHint = motiveHints[config.motive.type] ?? `${culpritName} has been acting suspicious lately`;

            // Only 1 person knows the real motive (prevents WHY being too easy)
            const numSources = 1;
            for (let i = 0; i < numSources; i++) {
                evidence.push({
                    id: makeEvidenceId('motive'),
                    kind: 'motive',
                    suspect: config.culpritId,
                    target: config.motive.target,
                    gossipSource: potentialSources[i].id,
                    hint: gossipHint,
                    motiveHint: config.motive.type,
                    cites: [],
                });
            }
        }

        // Add "crime awareness" gossip - NPCs know WHAT happened, WHERE, and roughly WHEN
        // This gives player clear direction on where to start investigating
        const targetItem = world.items.find(i => i.id === config.targetItem);
        if (targetItem) {
            // Use human-readable room name, but show place ID for SEARCH command
            const place = world.places.find(p => p.id === config.crimePlace);
            const roomName = place?.name ?? config.crimePlace;
            const placeHint = `${roomName} (SEARCH: ${config.crimePlace})`;
            const windowTimes: Record<string, string> = {
                W1: 'late afternoon',
                W2: 'early evening',
                W3: 'evening',
                W4: 'late evening',
                W5: 'late at night',
                W6: 'after midnight',
            };
            const timeHint = windowTimes[config.crimeWindow] ?? 'sometime';

            const crimeAwareness: Record<string, string> = {
                theft: `Did you hear? ${targetItem.funnyName} went missing from the ${placeHint} during the ${timeHint} (${config.crimeWindow})!`,
                sabotage: `Someone messed with ${targetItem.funnyName} in the ${placeHint} during the ${timeHint} (${config.crimeWindow})!`,
                prank: `${targetItem.funnyName} got moved from the ${placeHint} during the ${timeHint} (${config.crimeWindow}) - check somewhere ridiculous`,
                disappearance: `${targetItem.funnyName} vanished from the ${placeHint} during the ${timeHint} (${config.crimeWindow})`,
            };
            const awarenessText = crimeAwareness[config.crimeType] ?? `Something happened to ${targetItem.funnyName} in the ${placeHint}`;

            // Multiple NPCs know about the crime (household gossip spreads fast)
            const gossipSources = world.npcs.filter(n => n.id !== config.culpritId).slice(0, 2);
            for (const source of gossipSources) {
                evidence.push({
                    id: makeEvidenceId('motive'),
                    kind: 'motive',
                    suspect: 'unknown', // Not pointing at anyone specific
                    target: targetItem.id,
                    gossipSource: source.id,
                    hint: awarenessText,
                    motiveHint: 'crime_awareness', // Special marker
                    cites: [],
                } as MotiveEvidence);
            }
        }
    }

    return evidence;
}

// ============================================================================
// Contradictory Evidence (from Twists)
// ============================================================================

/**
 * Generate contradictory evidence from twists like false_alibi.
 * When a twist exists, it creates evidence that contradicts the truth,
 * forcing the player to spot the lie.
 *
 * For false_alibi: Creates fake presence evidence (the alibi claim)
 * For unreliable_witness: Creates testimony with wrong time
 */
function deriveContradictoryEvidence(
    world: World,
    events: SimEvent[],
    config: CaseConfig
): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    if (!config.twist) return evidence;

    if (config.twist.type === 'false_alibi') {
        const alibiActor = config.twist.actor;
        const actorName = world.npcs.find(n => n.id === alibiActor)?.name ?? alibiActor;

        // Create fake presence evidence - the liar's alibi claim
        // This will contradict their true presence (from derivePresence)
        // when detected by findContradictions
        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: alibiActor,
            window: config.crimeWindow,
            place: 'bedroom', // Claimed false location (safe alibi spot)
            cites: [], // No event backs this up - it's a lie
        } as PresenceEvidence);

        // Culprit's self-testimony about false alibi
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: alibiActor,
            window: config.crimeWindow,
            place: 'bedroom',
            observable: `${actorName} insists they were here the whole time`,
            confidence: 0.9, // High confidence = lying confidently
            cites: [],
        } as TestimonyEvidence);

        // Find an innocent to "vouch" for the culprit (also lying/mistaken)
        const innocents = world.npcs.filter(n => n.id !== alibiActor);
        if (innocents.length > 0) {
            const voucher = innocents[0];
            const voucherName = voucher.name;

            // Voucher claims to have seen culprit in bedroom
            evidence.push({
                id: makeEvidenceId('testimony'),
                kind: 'testimony',
                witness: voucher.id,
                window: config.crimeWindow,
                place: 'bedroom',
                observable: `${voucherName} thinks they saw ${actorName} in the bedroom`,
                confidence: 0.5, // Low confidence - can be broken
                subjectHint: actorName.toLowerCase(),
                subject: alibiActor, // Track who was allegedly seen
                subjectPlace: 'bedroom',
                cites: [],
            } as TestimonyEvidence);

            // Voucher's own presence in bedroom (they were there, hence "saw" culprit)
            evidence.push({
                id: makeEvidenceId('presence'),
                kind: 'presence',
                npc: voucher.id,
                window: config.crimeWindow,
                place: 'bedroom',
                cites: [],
            } as PresenceEvidence);
        }
    }

    if (config.twist.type === 'unreliable_witness') {
        const witnessId = config.twist.actor;
        const witnessName = world.npcs.find(n => n.id === witnessId)?.name ?? witnessId;

        // Find the window before or after crime window for a false timestamp
        const windowIndex = WINDOWS.findIndex(w => w.id === config.crimeWindow);
        const wrongWindow = windowIndex > 0
            ? WINDOWS[windowIndex - 1].id
            : WINDOWS[windowIndex + 1]?.id ?? config.crimeWindow;

        // Testimony with wrong time - creates contradiction with device logs
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: witnessId,
            window: wrongWindow, // Wrong time!
            place: config.crimePlace,
            observable: `${witnessName} is sure something suspicious happened here`,
            confidence: 0.8,
            subjectHint: 'someone in a hurry',
            cites: [],
        } as TestimonyEvidence);

        // Witness also claims to have heard something at the wrong time
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: witnessId,
            window: wrongWindow,
            place: config.crimePlace,
            observable: `heard a commotion during ${wrongWindow}`,
            confidence: 0.7,
            cites: [],
        } as TestimonyEvidence);

        // Witness's confused presence claim (they think they were somewhere else)
        const otherPlaces = world.places.filter(p => p.id !== config.crimePlace);
        if (otherPlaces.length > 0) {
            const confusedPlace = otherPlaces[0].id;
            evidence.push({
                id: makeEvidenceId('presence'),
                kind: 'presence',
                npc: witnessId,
                window: config.crimeWindow,
                place: confusedPlace, // Claims wrong location
                cites: [],
            } as PresenceEvidence);
        }
    }

    if (config.twist.type === 'tampered_device') {
        const culpritId = config.culpritId;
        const culpritName = world.npcs.find(n => n.id === culpritId)?.name ?? culpritId;

        // Fake device log entry showing a different person at crime scene
        const innocents = world.npcs.filter(n => n.id !== culpritId);
        if (innocents.length > 0) {
            const scapegoat = innocents[0];

            // "Doctored" device log shows wrong person
            evidence.push({
                id: makeEvidenceId('device_log'),
                kind: 'device_log',
                device: `door_${config.crimePlace}_tampered`,
                deviceType: 'door_sensor',
                window: config.crimeWindow,
                place: config.crimePlace,
                detail: `Door opened by ${scapegoat.name} (log seems... edited?)`,
                cites: [],
            } as DeviceLogEvidence);

            // Testimony that contradicts the tampered log
            evidence.push({
                id: makeEvidenceId('testimony'),
                kind: 'testimony',
                witness: scapegoat.id,
                window: config.crimeWindow,
                place: 'living', // Scapegoat was actually elsewhere
                observable: `${scapegoat.name} was definitely NOT near ${config.crimePlace}`,
                confidence: 0.9,
                cites: [],
            } as TestimonyEvidence);

            // Scapegoat's actual presence elsewhere
            evidence.push({
                id: makeEvidenceId('presence'),
                kind: 'presence',
                npc: scapegoat.id,
                window: config.crimeWindow,
                place: 'living',
                cites: [],
            } as PresenceEvidence);
        }
    }

    if (config.twist.type === 'planted_evidence') {
        const patsyId = config.twist.actor;
        const patsyName = world.npcs.find(n => n.id === patsyId)?.name ?? patsyId;

        // Planted physical evidence near the patsy
        evidence.push({
            id: makeEvidenceId('physical'),
            kind: 'physical',
            item: 'planted_item',
            detail: `Suspicious gloves found near ${patsyName}'s things (conveniently placed...)`,
            place: 'bedroom',
            window: config.crimeWindow,
            cites: [],
        } as PhysicalEvidence);

        // Testimony that patsy was acting "suspicious"
        const witnesses = world.npcs.filter(n => n.id !== patsyId && n.id !== config.culpritId);
        if (witnesses.length > 0) {
            const gossiper = witnesses[0];
            evidence.push({
                id: makeEvidenceId('testimony'),
                kind: 'testimony',
                witness: gossiper.id,
                window: config.crimeWindow,
                place: 'bedroom',
                observable: `${gossiper.name} saw ${patsyName} "lurking" (they were just getting a snack)`,
                confidence: 0.4, // Low confidence - easily disproven
                subjectHint: patsyName.toLowerCase(),
                subject: patsyId, // Track who was allegedly seen
                subjectPlace: 'bedroom',
                cites: [],
            } as TestimonyEvidence);
        }

        // Patsy's alibi - they were actually elsewhere
        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: patsyId,
            window: config.crimeWindow,
            place: 'kitchen', // Patsy was actually in kitchen
            cites: [],
        } as PresenceEvidence);
    }

    if (config.twist.type === 'accomplice') {
        const helperId = config.twist.actor;
        const helperName = world.npcs.find(n => n.id === helperId)?.name ?? helperId;
        const culpritName = world.npcs.find(n => n.id === config.culpritId)?.name ?? config.culpritId;

        // Accomplice provides false alibi for culprit
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: helperId,
            window: config.crimeWindow,
            place: 'living',
            observable: `${helperName} swears ${culpritName} was with them the whole time`,
            confidence: 0.85, // High confidence - they're lying on purpose
            subjectHint: culpritName.toLowerCase(),
            subject: config.culpritId, // Track who was allegedly seen
            subjectPlace: 'living',
            cites: [],
        } as TestimonyEvidence);

        // Accomplice's own presence (covering for culprit)
        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: helperId,
            window: config.crimeWindow,
            place: 'living',
            cites: [],
        } as PresenceEvidence);

        // False presence for culprit (accomplice's lie)
        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: config.culpritId,
            window: config.crimeWindow,
            place: 'living', // Culprit wasn't actually here
            cites: [],
        } as PresenceEvidence);

        // Device log that contradicts the accomplice's story
        evidence.push({
            id: makeEvidenceId('device_log'),
            kind: 'device_log',
            device: 'motion_living',
            deviceType: 'motion_sensor',
            window: config.crimeWindow,
            place: 'living',
            detail: `Motion detected: only 1 person (${helperName} alone?)`,
            cites: [],
        } as DeviceLogEvidence);
    }

    return evidence;
}

// ============================================================================
// Main Derivation
// ============================================================================

export function deriveEvidence(
    world: World,
    events: SimEvent[],
    config: CaseConfig
): EvidenceItem[] {
    // Reset counter for deterministic IDs
    evidenceCounter = 0;

    return [
        ...derivePresence(world, events),
        ...deriveDeviceLogs(world, events, config),
        ...deriveTestimony(world, events, config),
        ...derivePhysical(world, events, config),
        ...deriveMotiveEvidence(world, config),
        ...deriveContradictoryEvidence(world, events, config),
        ...deriveCulpritAlibiClaim(world, config),
    ];
}

// ============================================================================
// Culprit's Alibi Claim (difficulty-controlled)
// ============================================================================

/**
 * Generate culprit's alibi testimony based on difficulty setting.
 *
 * Key insight: Keep self-contradiction at ALL difficulties, but change discoverability.
 *
 * - EASY: Culprit lies about CRIME WINDOW → direct, obvious contradiction
 * - MEDIUM: Culprit lies about DIFFERENT WINDOW → contradiction exists but off-axis
 * - HARD: Culprit lies + sparse device coverage → requires constraint logic
 *
 * This teaches players that COMPARE is powerful (easy), then requires them to
 * localize before they can dunk (medium), then requires synthesis (hard).
 */
function deriveCulpritAlibiClaim(
    world: World,
    config: CaseConfig
): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    const culprit = world.npcs.find(n => n.id === config.culpritId);
    if (!culprit) return evidence;

    const profile = config.tier ? DIFFICULTY_PROFILES[config.tier] : DIFFICULTY_PROFILES[2];
    const difficulty = profile?.puzzleDifficulty ?? 'easy';

    // Find a plausible alibi location (not the crime scene or hidden place)
    const alibiLocations = world.places.filter(
        p => p.id !== config.crimePlace && p.id !== config.hiddenPlace
    );
    const alibiPlace = alibiLocations.length > 0 ? alibiLocations[0].id : 'bedroom';

    if (difficulty === 'hard') {
        // HARD: Culprit lies about crime window (contradiction exists)
        // BUT there's ONE competing narrative (rotates per case)
        // AND device coverage is sparse
        // This requires synthesis, not just contradiction hunting

        // Culprit's lie (keystone - always present, always catchable)
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: config.culpritId,
            window: config.crimeWindow,
            place: alibiPlace,
            observable: `${culprit.name} claims to have been in ${alibiPlace} during ${config.crimeWindow}`,
            confidence: 0.7,
            cites: [],
        } as TestimonyEvidence);

        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: config.culpritId,
            window: config.crimeWindow,
            place: alibiPlace,
            cites: ['self_reported_alibi'],
        } as PresenceEvidence);

        // COMPETING NARRATIVE: Rotate type per case (keeps hard mode varied)
        // Types: MISREMEMBER, LOOKALIKE, TWO_STEP, CONSTRAINT
        const seed = config.seed ?? 0;
        const narrativeTypes = ['misremember', 'lookalike', 'two_step', 'constraint'] as const;
        const narrativeType = narrativeTypes[seed % narrativeTypes.length];

        const innocents = world.npcs.filter(n => n.id !== config.culpritId);
        const adjacentWindow = getAdjacentWindow(config.crimeWindow, -1) || 'W2';

        if (innocents.length > 0) {
            const confusedInnocent = innocents[0];
            const wrongPlace = world.places.find(p => p.id !== alibiPlace && p.id !== config.crimePlace)?.id || 'kitchen';

            switch (narrativeType) {
                case 'misremember':
                    // Innocent has uncertain memory (low confidence, ⚠️ flagged)
                    evidence.push({
                        id: makeEvidenceId('testimony'),
                        kind: 'testimony',
                        witness: confusedInnocent.id,
                        window: adjacentWindow,
                        place: wrongPlace,
                        observable: `⚠️ ${confusedInnocent.name} thinks they were in ${wrongPlace} during ${adjacentWindow}... maybe?`,
                        confidence: 0.3,
                        cites: [],
                    } as TestimonyEvidence);
                    evidence.push({
                        id: makeEvidenceId('presence'),
                        kind: 'presence',
                        npc: confusedInnocent.id,
                        window: adjacentWindow,
                        place: wrongPlace,
                        cites: ['uncertain_memory'],
                    } as PresenceEvidence);
                    break;

                case 'lookalike':
                    // Identity ambiguity: witness saw "someone tall" at crime scene
                    // Could match multiple NPCs - player must use other evidence
                    evidence.push({
                        id: makeEvidenceId('testimony'),
                        kind: 'testimony',
                        witness: confusedInnocent.id,
                        window: config.crimeWindow,
                        place: config.crimePlace,
                        observable: `⚠️ ${confusedInnocent.name} saw someone near ${config.crimePlace} - couldn't tell who`,
                        confidence: 0.4,
                        subjectHint: 'ambiguous figure',
                        cites: [],
                    } as TestimonyEvidence);
                    break;

                case 'two_step':
                    // Setup happened earlier: suspicious activity in prior window
                    // Red herring - someone was "casing" the scene but didn't do it
                    const setupWindow = getAdjacentWindow(config.crimeWindow, -1) || 'W2';
                    evidence.push({
                        id: makeEvidenceId('testimony'),
                        kind: 'testimony',
                        witness: confusedInnocent.id,
                        window: setupWindow,
                        place: config.crimePlace,
                        observable: `⚠️ ${confusedInnocent.name} was seen "checking out" the ${config.crimePlace} earlier`,
                        confidence: 0.5,
                        subject: confusedInnocent.id,
                        subjectPlace: config.crimePlace,
                        cites: [],
                    } as TestimonyEvidence);
                    break;

                case 'constraint':
                    // Physics constraint: innocent claims to have done something
                    // that would have been impossible given other evidence
                    evidence.push({
                        id: makeEvidenceId('testimony'),
                        kind: 'testimony',
                        witness: confusedInnocent.id,
                        window: config.crimeWindow,
                        place: wrongPlace,
                        observable: `⚠️ ${confusedInnocent.name} claims they heard the commotion from ${wrongPlace}`,
                        confidence: 0.5,
                        cites: [],
                    } as TestimonyEvidence);
                    // Add note: wrongPlace is NOT adjacent to crimePlace = impossible
                    break;
            }
        }

        return evidence;
    }

    if (difficulty === 'medium') {
        // MEDIUM: Culprit lies about a DIFFERENT window (off-axis)
        // Contradiction exists but requires asking the right question first
        // Player must localize the crime window, THEN find the lie in adjacent window
        const offAxisWindow = getAdjacentWindow(config.crimeWindow, -1) || getAdjacentWindow(config.crimeWindow, 1);
        const lieWindow = offAxisWindow || config.crimeWindow;

        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: config.culpritId,
            window: lieWindow,
            place: alibiPlace,
            observable: `${culprit.name} claims to have been in ${alibiPlace} during ${lieWindow}`,
            confidence: 0.8,
            cites: [],
        } as TestimonyEvidence);

        evidence.push({
            id: makeEvidenceId('presence'),
            kind: 'presence',
            npc: config.culpritId,
            window: lieWindow,
            place: alibiPlace,
            cites: ['self_reported_alibi'],
        } as PresenceEvidence);

        // Culprit is vague about crime window itself (doesn't directly lie about it)
        evidence.push({
            id: makeEvidenceId('testimony'),
            kind: 'testimony',
            witness: config.culpritId,
            window: config.crimeWindow,
            place: config.crimePlace,
            observable: `${culprit.name} doesn't remember exactly where they were during ${config.crimeWindow}`,
            confidence: 0.3, // Evasive
            cites: [],
        } as TestimonyEvidence);

        return evidence;
    }

    // EASY (default): Usually crime window, sometimes off-axis (teaches localization)
    // 70% crime window, 30% off-axis - but full device coverage makes both easy
    const seed = config.seed ?? 0;
    const useOffAxis = (seed % 10) < 3; // 30% chance based on seed
    const lieWindow = useOffAxis
        ? (getAdjacentWindow(config.crimeWindow, -1) || config.crimeWindow)
        : config.crimeWindow;

    evidence.push({
        id: makeEvidenceId('testimony'),
        kind: 'testimony',
        witness: config.culpritId,
        window: lieWindow,
        place: alibiPlace,
        observable: `${culprit.name} claims to have been here during ${lieWindow}`,
        confidence: 0.8, // Confident lie
        cites: [],
    } as TestimonyEvidence);

    evidence.push({
        id: makeEvidenceId('presence'),
        kind: 'presence',
        npc: config.culpritId,
        window: lieWindow,
        place: alibiPlace,
        cites: ['self_reported_alibi'],
    } as PresenceEvidence);

    return evidence;
}

/**
 * Get adjacent window (offset -1 = earlier, +1 = later)
 */
function getAdjacentWindow(window: WindowId, offset: number): WindowId | null {
    const windowOrder: WindowId[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
    const idx = windowOrder.indexOf(window);
    const newIdx = idx + offset;
    if (newIdx >= 0 && newIdx < windowOrder.length) {
        return windowOrder[newIdx];
    }
    return null;
}
