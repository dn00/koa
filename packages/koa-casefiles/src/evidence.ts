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
    NPCId,
    PlaceId,
    WindowId,
} from './types.js';
import { WINDOWS } from './types.js';
import { sha256 } from './kernel/canonical.js';

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
 */
function deriveDeviceLogs(
    world: World,
    events: SimEvent[]
): DeviceLogEvidence[] {
    const evidence: DeviceLogEvidence[] = [];

    for (const event of events) {
        if (event.type === 'DOOR_OPENED' || event.type === 'DOOR_CLOSED') {
            const device = world.devices.find(d => d.id === event.target);
            if (device) {
                evidence.push({
                    id: makeEvidenceId('device'),
                    kind: 'device_log',
                    device: device.id,
                    deviceType: device.type,
                    window: event.window,
                    place: event.place ?? device.place,
                    detail: event.type === 'DOOR_OPENED' ? 'Door opened' : 'Door closed',
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
                    // Note: we do NOT include actor here - that would be too easy
                    cites: [event.id],
                });
            }
        }
    }

    return evidence;
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
                if (isSameRoom) {
                    observable = 'saw someone enter the room';
                    confidence = 0.7;
                    subjectHint = getVagueDescription(event.actor, world);
                } else {
                    observable = 'heard footsteps nearby';
                    confidence = 0.4;
                }
            } else if (event.type === 'DOOR_OPENED' || event.type === 'DOOR_CLOSED') {
                observable = event.type === 'DOOR_OPENED'
                    ? 'heard a door open'
                    : 'heard a door close';
                confidence = 0.5;
            } else if (event.type === 'ITEM_TAKEN') {
                if (isSameRoom) {
                    // This would be anti-anticlimax - reduce confidence
                    observable = 'saw someone handling something';
                    confidence = 0.3;
                    subjectHint = getVagueDescription(event.actor, world);
                } else {
                    observable = 'heard rustling sounds';
                    confidence = 0.3;
                }
            } else {
                continue; // Skip other event types
            }

            // Anti-anticlimax: If this is the crime event used by culprit,
            // NEVER give high confidence identification
            if (event.actor === config.culpritId && event.window === config.crimeWindow) {
                confidence = Math.min(confidence, 0.5);
                subjectHint = undefined; // Remove hint for crime events
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
                cites: [event.id],
            });
        }
    }

    // Deduplicate similar testimonies
    const deduped = deduplicateTestimony(evidence);

    return deduped;
}

function getVagueDescription(npcId: NPCId, world: World): string {
    // Return vague physical descriptions, never names
    const descriptions: Record<string, string> = {
        alice: 'someone in business casual',
        bob: 'a person in a hoodie',
        carol: 'someone with dark hair',
        dan: 'an early-riser type',
        eve: 'a mysterious figure',
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

    // Item is missing from original location
    evidence.push({
        id: makeEvidenceId('physical'),
        kind: 'physical',
        item: targetItem.id,
        detail: `${targetItem.funnyName} is missing from ${targetItem.startPlace}`,
        place: targetItem.startPlace,
        window: config.crimeWindow,
        cites: events
            .filter(e => e.type === 'ITEM_TAKEN' && e.target === targetItem.id)
            .map(e => e.id),
    });

    // Item is hidden in new location
    evidence.push({
        id: makeEvidenceId('physical'),
        kind: 'physical',
        item: targetItem.id,
        detail: `${targetItem.funnyName} was found hidden in ${config.hiddenPlace}`,
        place: config.hiddenPlace,
        window: config.crimeWindow,
        cites: events
            .filter(e => e.type === 'ITEM_HIDDEN' && e.target === targetItem.id)
            .map(e => e.id),
    });

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
        ...deriveDeviceLogs(world, events),
        ...deriveTestimony(world, events, config),
        ...derivePhysical(world, events, config),
    ];
}
