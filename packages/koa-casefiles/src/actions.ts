import { PlayerSession } from './player.js';
import { EvidenceItem, PhysicalEvidence, DeviceLogEvidence, TestimonyEvidence, PresenceEvidence } from './types.js';

export type ActionResult =
    | { success: true; evidence: EvidenceItem[]; message: string }
    | { success: false; evidence: [], message: string };

/**
 * Valid action types
 */
export type ActionType = 'SEARCH' | 'INTERVIEW' | 'LOGS' | 'COMPARE';

/**
 * Interview modes - player must choose what to ask about
 */
export type InterviewMode = 'testimony' | 'gossip';

/**
 * Check if prerequisites for gated evidence have been met.
 * Gated evidence requires the player to first discover clues pointing to the location.
 */
function hasMetPrerequisites(
    knownEvidence: EvidenceItem[],
    prerequisites?: PhysicalEvidence['discoveryPrerequisites']
): boolean {
    if (!prerequisites || prerequisites.length === 0) return true;

    // Need to match ANY prerequisite (not all)
    return prerequisites.some(prereq => {
        return knownEvidence.some(known => {
            // Check if we have evidence of the right type mentioning the place
            if (prereq.type === 'device_log' && known.kind === 'device_log') {
                const deviceLog = known as DeviceLogEvidence;
                // Check both the place field AND device name (e.g., "door_office_garage" mentions garage)
                return deviceLog.place === prereq.placeHint ||
                       deviceLog.device.includes(prereq.placeHint);
            }
            if (prereq.type === 'testimony' && known.kind === 'testimony') {
                const testimony = known as TestimonyEvidence;
                // Check if testimony mentions the place or is about that location
                return testimony.place === prereq.placeHint ||
                    testimony.observable.toLowerCase().includes(prereq.placeHint.toLowerCase());
            }
            return false;
        });
    });
}

/**
 * Execute a SEARCH action.
 * Cost: 1 AP
 * Reveals: PhysicalEvidence in a specific place and window.
 *
 * Note: Gated evidence (like hidden items) requires prerequisite clues
 * before it can be discovered. This prevents the "physical evidence shortcut"
 * where players can solve the case by just searching every location.
 */
export function performSearch(
    session: PlayerSession,
    place: string,
    window: string
): ActionResult {
    if (!session.spendAP(1)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }

    // Get all physical evidence at this location and time
    const allPhysical = session.allEvidence.filter(e =>
        e.kind === 'physical' && e.place === place && e.window === window
    ) as PhysicalEvidence[];

    // Filter out gated evidence unless prerequisites are met
    const found = allPhysical.filter(e => {
        if (!e.isGated) return true;
        return hasMetPrerequisites(session.knownEvidence, e.discoveryPrerequisites);
    });

    found.forEach(e => session.revealEvidence(e));

    // Check if there's gated evidence we couldn't find yet
    const gatedButLocked = allPhysical.filter(e =>
        e.isGated && !hasMetPrerequisites(session.knownEvidence, e.discoveryPrerequisites)
    );

    let message: string;
    if (found.length > 0) {
        message = `You searched ${place} (${window}) and found ${found.length} item${found.length > 1 ? 's' : ''}.`;
    } else if (gatedButLocked.length > 0) {
        // Hint that there might be something here if they had more clues
        message = `You searched ${place} (${window}). Something feels off, but you need more clues to know where to look.`;
    } else {
        message = `You searched ${place} (${window}) but found nothing of note.`;
    }

    return { success: true, evidence: found, message };
}

/**
 * Execute an INTERVIEW action.
 * Cost: 1 AP
 *
 * Player must choose a mode:
 *   - 'testimony': What did you see/hear during [window]?
 *   - 'gossip': What do you know about household drama?
 *
 * This forces players to spend 2 AP to get full information from one NPC,
 * making investigation more deliberate.
 */
export function performInterview(
    session: PlayerSession,
    suspect: string,
    window: string,
    mode: InterviewMode = 'testimony'
): ActionResult {
    if (!session.spendAP(1)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }

    const npcName = session.world.npcs.find(n => n.id === suspect)?.name ?? suspect;
    let found: EvidenceItem[] = [];
    let message: string;

    if (mode === 'testimony') {
        // Get testimony about this specific window
        found = session.allEvidence.filter(e =>
            e.kind === 'testimony' &&
            e.witness === suspect &&
            e.window === window &&
            !session.knownEvidence.some(known => known.id === e.id)
        );

        found.forEach(e => session.revealEvidence(e));

        message = found.length > 0
            ? `${npcName} shared ${found.length} observation${found.length > 1 ? 's' : ''} about ${window}.`
            : `${npcName} didn't notice anything during ${window}.`;

    } else {
        // Get gossip this NPC knows (motive evidence where they're the source)
        found = session.allEvidence.filter(e =>
            e.kind === 'motive' &&
            e.gossipSource === suspect &&
            !session.knownEvidence.some(known => known.id === e.id)
        );

        found.forEach(e => session.revealEvidence(e));

        message = found.length > 0
            ? `${npcName} spilled some tea about household drama.`
            : `${npcName} doesn't have any gossip to share.`;
    }

    return { success: true, evidence: found, message };
}

/**
 * Execute a LOGS action.
 * Cost: 1 AP
 * Reveals: DeviceLogEvidence for a specific device type and window.
 *
 * Returns a "log slice" (max 3 entries) per spec Section 6.2 C to enforce
 * bounded discovery. Players must call LOGS multiple times to see all activity.
 */
export function checkLogs(
    session: PlayerSession,
    deviceType: string,
    window: string
): ActionResult {
    if (!session.spendAP(1)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }

    // Find ALL matching logs for this device type and window
    const allMatching = session.allEvidence.filter(e =>
        e.kind === 'device_log' &&
        e.window === window &&
        (e.deviceType.toLowerCase().includes(deviceType.toLowerCase()) ||
         e.detail.toLowerCase().includes(deviceType.toLowerCase()))
    );

    // Filter out already-revealed logs
    const unrevealed = allMatching.filter(e =>
        !session.knownEvidence.some(known => known.id === e.id)
    );

    // Return a slice (max 3 new entries)
    const LOG_SLICE_SIZE = 3;
    const found = unrevealed.slice(0, LOG_SLICE_SIZE);

    found.forEach(e => session.revealEvidence(e));

    const remaining = unrevealed.length - found.length;
    let message: string;
    if (found.length > 0) {
        message = `Retrieved ${found.length} ${deviceType} entries for ${window}.`;
        if (remaining > 0) {
            message += ` (${remaining} more available)`;
        }
    } else if (allMatching.length > 0) {
        message = `No new ${deviceType} activity found for ${window}. (Already viewed all entries)`;
    } else {
        message = `No ${deviceType} activity found for ${window}.`;
    }

    return { success: true, evidence: found, message };
}

/**
 * Compare result for COMPARE action
 */
export type CompareResult =
    | { success: true; contradiction: true; rule: string; message: string }
    | { success: true; contradiction: false; message: string }
    | { success: false; message: string };

/**
 * Execute a COMPARE action.
 * Cost: 0 AP (free action - encourages deduction)
 *
 * Compares two evidence items to check if they contradict each other.
 * This makes lie-catching an active gameplay verb.
 */
export function compareEvidence(
    session: PlayerSession,
    evidenceId1: string,
    evidenceId2: string
): CompareResult {
    // Find both evidence items in known evidence
    const ev1 = session.knownEvidence.find(e => e.id === evidenceId1);
    const ev2 = session.knownEvidence.find(e => e.id === evidenceId2);

    if (!ev1) {
        return { success: false, message: `Evidence "${evidenceId1}" not found. Use evidence IDs from your collected evidence.` };
    }
    if (!ev2) {
        return { success: false, message: `Evidence "${evidenceId2}" not found. Use evidence IDs from your collected evidence.` };
    }
    if (evidenceId1 === evidenceId2) {
        return { success: false, message: `Cannot compare evidence with itself.` };
    }

    // Check for contradictions

    // Type 1: Two presence records for same NPC in same window but different places
    if (ev1.kind === 'presence' && ev2.kind === 'presence') {
        const p1 = ev1 as PresenceEvidence;
        const p2 = ev2 as PresenceEvidence;
        if (p1.npc === p2.npc && p1.window === p2.window && p1.place !== p2.place) {
            return {
                success: true,
                contradiction: true,
                rule: 'cannot_be_two_places',
                message: `CONTRADICTION! ${p1.npc} cannot be in ${p1.place} AND ${p2.place} during ${p1.window}.`
            };
        }
    }

    // Type 2: Testimony claiming location vs presence showing different location
    if ((ev1.kind === 'testimony' && ev2.kind === 'presence') ||
        (ev1.kind === 'presence' && ev2.kind === 'testimony')) {
        const testimony = (ev1.kind === 'testimony' ? ev1 : ev2) as TestimonyEvidence;
        const presence = (ev1.kind === 'presence' ? ev1 : ev2) as PresenceEvidence;

        // Check if testimony is a self-claim about location
        if (testimony.witness === presence.npc &&
            testimony.window === presence.window &&
            testimony.observable.toLowerCase().includes('claims') &&
            testimony.place !== presence.place) {
            return {
                success: true,
                contradiction: true,
                rule: 'false_alibi',
                message: `CONTRADICTION! ${testimony.witness} claims to be in ${testimony.place} but was actually in ${presence.place} during ${testimony.window}.`
            };
        }
    }

    // Type 3: Two testimonies about same window/place with conflicting observations
    if (ev1.kind === 'testimony' && ev2.kind === 'testimony') {
        const t1 = ev1 as TestimonyEvidence;
        const t2 = ev2 as TestimonyEvidence;

        if (t1.window === t2.window && t1.place === t2.place) {
            const t1HeardNothing = t1.observable.toLowerCase().includes('nothing') ||
                                   t1.observable.toLowerCase().includes('quiet');
            const t2HeardSomething = t2.observable.toLowerCase().includes('heard') &&
                                     !t2.observable.toLowerCase().includes('nothing');
            const t1HeardSomething = t1.observable.toLowerCase().includes('heard') &&
                                     !t1.observable.toLowerCase().includes('nothing');
            const t2HeardNothing = t2.observable.toLowerCase().includes('nothing') ||
                                   t2.observable.toLowerCase().includes('quiet');

            if ((t1HeardNothing && t2HeardSomething) || (t1HeardSomething && t2HeardNothing)) {
                return {
                    success: true,
                    contradiction: true,
                    rule: 'testimony_conflict',
                    message: `CONTRADICTION! Conflicting testimony about ${t1.place} during ${t1.window}.`
                };
            }
        }
    }

    // No contradiction found
    return {
        success: true,
        contradiction: false,
        message: `No contradiction found between these evidence items.`
    };
}
