import { PlayerSession, ActionType } from './player.js';
import type { ContradictionLevel, EvidenceSemantic, SlicedWindowId } from './types.js';
import { EvidenceItem, PhysicalEvidence, DeviceLogEvidence, TestimonyEvidence, PresenceEvidence, MotiveEvidence } from './types.js';

export type SearchResultCode = 'HIT' | 'EMPTY' | 'GATED' | 'NOISE';

export type ActionResult =
    | { success: true; evidence: EvidenceItem[]; message: string; resultCode?: SearchResultCode }
    | { success: false; evidence: [], message: string; resultCode?: SearchResultCode };

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
 * Cost: 1 AP (free if on a lead)
 * Reveals: PhysicalEvidence in a specific place and window.
 *
 * Note: Gated evidence (like hidden items) requires prerequisite clues
 * before it can be discovered. This prevents the "physical evidence shortcut"
 * where players can solve the case by just searching every location.
 */
export function performSearch(
    session: PlayerSession,
    place: string,
    window: string,
    free: boolean = false
): ActionResult {
    if (!free && !session.spendAP(1, 'search', `${place}:${window}`)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }
    if (free) {
        // Record action but don't spend AP
        session.actionHistory.push({ type: 'search', day: session.currentDay, apCost: 0, target: `${place}:${window}` });
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
    let resultCode: SearchResultCode;
    if (found.length > 0) {
        message = `You searched ${place} (${window}) and found ${found.length} item${found.length > 1 ? 's' : ''}.`;
        resultCode = 'HIT';
    } else if (gatedButLocked.length > 0) {
        // Actionable hint: tell player what to do next
        message = `You searched ${place} (${window}). Evidence may be here, but you need a witness or log that points to this location first. Try INTERVIEW or LOGS.`;
        resultCode = 'GATED';
    } else {
        message = `You searched ${place} (${window}). Dead end - nothing relevant here during this window.`;
        resultCode = 'EMPTY';
    }

    return { success: true, evidence: found, message, resultCode };
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
    mode: InterviewMode = 'testimony',
    free: boolean = false
): ActionResult {
    if (!free && !session.spendAP(1, 'interview', `${suspect}:${mode}`)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }
    if (free) {
        session.actionHistory.push({ type: 'interview', day: session.currentDay, apCost: 0, target: `${suspect}:${mode}` });
    }

    const npcName = session.world.npcs.find(n => n.id === suspect)?.name ?? suspect;
    let found: EvidenceItem[] = [];
    let message: string;

    if (mode === 'testimony') {
        // Get testimony about this specific window
        const unrevealed = session.allEvidence.filter(e =>
            e.kind === 'testimony' &&
            e.witness === suspect &&
            e.window === window &&
            !session.knownEvidence.some(known => known.id === e.id)
        );

        // Return a slice (max 4 new observations per interview)
        const TESTIMONY_SLICE_SIZE = 4;
        found = unrevealed.slice(0, TESTIMONY_SLICE_SIZE);

        found.forEach(e => session.revealEvidence(e));

        const remaining = unrevealed.length - found.length;
        if (found.length > 0) {
            message = `${npcName} shared ${found.length} observation${found.length > 1 ? 's' : ''} about ${window}.`;
            if (remaining > 0) {
                message += ` (${remaining} more available)`;
            }
        } else {
            const allMatching = session.allEvidence.filter(e =>
                e.kind === 'testimony' &&
                e.witness === suspect &&
                e.window === window
            );
            message = allMatching.length > 0
                ? `${npcName} has nothing new to share about ${window}. (Already heard everything)`
                : `${npcName} didn't notice anything during ${window}.`;
        }

    } else {
        // Get gossip this NPC knows (motive evidence where they're the source)
        found = session.allEvidence.filter(e =>
            e.kind === 'motive' &&
            e.gossipSource === suspect &&
            !session.knownEvidence.some(known => known.id === e.id)
        );

        // GUARANTEE: If player doesn't have crime_awareness yet, include it from ANY source
        const hasCrimeAwareness = session.knownEvidence.some(e =>
            e.kind === 'motive' && (e as MotiveEvidence).motiveHint === 'crime_awareness'
        );
        if (!hasCrimeAwareness) {
            const crimeAwareness = session.allEvidence.find(e =>
                e.kind === 'motive' &&
                (e as MotiveEvidence).motiveHint === 'crime_awareness' &&
                !session.knownEvidence.some(known => known.id === e.id)
            );
            if (crimeAwareness && !found.includes(crimeAwareness)) {
                found.push(crimeAwareness);
            }
        }

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
    window: string,
    free: boolean = false
): ActionResult {
    if (!free && !session.spendAP(1, 'logs', `${deviceType}:${window}`)) {
        return { success: false, evidence: [], message: 'Not enough Action Points.' };
    }
    if (free) {
        session.actionHistory.push({ type: 'logs', day: session.currentDay, apCost: 0, target: `${deviceType}:${window}` });
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
 * Compare result for COMPARE action.
 * `level` distinguishes HARD (physically impossible) from SOFT (odd but plausible).
 * `contradiction` is true for both HARD and SOFT (backward compat).
 */
export type CompareResult =
    | { success: true; contradiction: true; level: ContradictionLevel; rule: string; message: string }
    | { success: true; contradiction: false; level: 'NO_CONTRADICTION'; message: string }
    | { success: false; message: string };

// ── Semantic helpers for compareEvidence ──

/** Infer semantic from evidence kind + deviceType when field is absent (legacy compat). */
function inferSemantic(ev: EvidenceItem): EvidenceSemantic {
    if (ev.semantic) return ev.semantic;
    if (ev.kind === 'device_log') {
        const d = ev as DeviceLogEvidence;
        return d.deviceType === 'door_sensor' ? 'movement' : 'presence';
    }
    if (ev.kind === 'testimony') {
        const t = ev as TestimonyEvidence;
        if (t.claimType) return 'claim';
        if (t.observable.includes('door')) return 'movement';
        return 'presence';
    }
    return 'presence';
}

/** Source: device hardware vs NPC testimony. */
type EvidenceSource = 'device' | 'testimony';

function inferSource(ev: EvidenceItem): EvidenceSource {
    return ev.kind === 'device_log' ? 'device' : 'testimony';
}

/** Slices overlap if either is null/undefined (covers full window) or they match. */
function slicesOverlap(a: SlicedWindowId | undefined, b: SlicedWindowId | undefined): boolean {
    if (!a || !b) return true;
    return a === b;
}

/** Extract the NPC that this evidence is about. */
function evidenceNpc(ev: EvidenceItem): string | undefined {
    if (ev.kind === 'presence') return (ev as PresenceEvidence).npc;
    if (ev.kind === 'device_log') return (ev as DeviceLogEvidence).actor;
    if (ev.kind === 'testimony') {
        const t = ev as TestimonyEvidence;
        // Claims and self-location testimony → witness is the subject
        if (t.claimType || t.semantic === 'claim') return t.witness;
        // Observation testimony → subject is the NPC being observed
        return t.subject ?? t.witness;
    }
    return undefined;
}

/** Extract the place this evidence asserts about the NPC. */
function evidencePlace(ev: EvidenceItem): string | undefined {
    if (ev.kind === 'presence') return (ev as PresenceEvidence).place;
    if (ev.kind === 'device_log') return (ev as DeviceLogEvidence).place;
    if (ev.kind === 'testimony') {
        const t = ev as TestimonyEvidence;
        if (t.claimType || t.semantic === 'claim') return t.place;
        return t.subjectPlace ?? t.place;
    }
    return undefined;
}

/** Extract the window this evidence covers. */
function evidenceWindow(ev: EvidenceItem): string | undefined {
    if (ev.kind === 'presence') return (ev as PresenceEvidence).window;
    if (ev.kind === 'device_log') return (ev as DeviceLogEvidence).window;
    if (ev.kind === 'testimony') return (ev as TestimonyEvidence).window;
    return undefined;
}

function isStayClaim(ev: EvidenceItem): boolean {
    if (ev.kind === 'testimony') return (ev as TestimonyEvidence).claimType === 'STAY';
    if (ev.kind === 'presence') return (ev as PresenceEvidence).isSelfReported === true;
    return false;
}

/**
 * Execute a COMPARE action.
 * Cost: 0 AP (free action - encourages deduction)
 *
 * Compares two evidence items using semantic HARD/SOFT rules:
 * - HARD: physically impossible (STAY claim vs presence elsewhere, device vs device)
 * - SOFT: odd but plausible (testimony disagree, movement tension)
 * - NONE: no conflict
 */
export function compareEvidence(
    session: PlayerSession,
    evidenceId1: string,
    evidenceId2: string
): CompareResult {
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

    // Only compare evidence kinds that carry location assertions
    const locationKinds = new Set(['presence', 'device_log', 'testimony']);
    if (!locationKinds.has(ev1.kind) || !locationKinds.has(ev2.kind)) {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }

    // Extract semantic properties
    const npc1 = evidenceNpc(ev1);
    const npc2 = evidenceNpc(ev2);
    const place1 = evidencePlace(ev1);
    const place2 = evidencePlace(ev2);
    const window1 = evidenceWindow(ev1);
    const window2 = evidenceWindow(ev2);
    const sem1 = inferSemantic(ev1);
    const sem2 = inferSemantic(ev2);
    const src1 = inferSource(ev1);
    const src2 = inferSource(ev2);
    const stay1 = isStayClaim(ev1);
    const stay2 = isStayClaim(ev2);

    // Prerequisites for any contradiction: same NPC, same window
    if (!npc1 || !npc2 || npc1 !== npc2) {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }
    if (!window1 || !window2 || window1 !== window2) {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }
    if (!place1 || !place2) {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }

    // Same-place special case: a STAY claim + door_sensor at the same place is
    // SOFT_TENSION — the person interacted with a boundary door, suggesting movement
    // out of their claimed location. Other same-place combos are no contradiction.
    if (place1 === place2) {
        const isDoor1 = ev1.kind === 'device_log' && (ev1 as DeviceLogEvidence).deviceType === 'door_sensor';
        const isDoor2 = ev2.kind === 'device_log' && (ev2 as DeviceLogEvidence).deviceType === 'door_sensor';
        if ((stay1 && isDoor2) || (stay2 && isDoor1)) {
            return { success: true, contradiction: true, level: 'SOFT_TENSION', rule: 'stay_vs_movement',
                message: `Interesting... ${npc1} claims to have stayed put, but a door log suggests movement during ${window1}.` };
        }
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }

    // Slices must overlap for a conflict to exist
    if (!slicesOverlap(ev1.slice, ev2.slice)) {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }

    // ── HARD rules: require STAY claim or device-vs-device ──

    // Rule 1: STAY claim vs device presence = HARD (the money shot)
    if (stay1 && src2 === 'device' && sem2 === 'presence') {
        return { success: true, contradiction: true, level: 'HARD_CONTRADICTION', rule: 'stay_vs_device_presence',
            message: `CONTRADICTION! ${npc1} claims to have stayed in ${place1} but was detected in ${place2} during ${window1}!` };
    }
    if (stay2 && src1 === 'device' && sem1 === 'presence') {
        return { success: true, contradiction: true, level: 'HARD_CONTRADICTION', rule: 'stay_vs_device_presence',
            message: `CONTRADICTION! ${npc1} claims to have stayed in ${place2} but was detected in ${place1} during ${window1}!` };
    }

    // Rule 2: STAY claim vs testimony presence (conf >= 0.5) = HARD
    if (stay1 && sem2 === 'presence' && src2 === 'testimony') {
        const conf2 = ev2.kind === 'testimony' ? (ev2 as TestimonyEvidence).confidence : 1.0;
        if (conf2 >= 0.5) {
            return { success: true, contradiction: true, level: 'HARD_CONTRADICTION', rule: 'stay_vs_witness',
                message: `CONTRADICTION! ${npc1} claims to have stayed in ${place1} but was seen in ${place2} during ${window1}!` };
        }
    }
    if (stay2 && sem1 === 'presence' && src1 === 'testimony') {
        const conf1 = ev1.kind === 'testimony' ? (ev1 as TestimonyEvidence).confidence : 1.0;
        if (conf1 >= 0.5) {
            return { success: true, contradiction: true, level: 'HARD_CONTRADICTION', rule: 'stay_vs_witness',
                message: `CONTRADICTION! ${npc1} claims to have stayed in ${place2} but was seen in ${place1} during ${window1}!` };
        }
    }

    // Rule 3: Device presence vs device presence (same NPC, overlapping slice, diff place) = HARD
    if (src1 === 'device' && src2 === 'device' && sem1 === 'presence' && sem2 === 'presence') {
        return { success: true, contradiction: true, level: 'HARD_CONTRADICTION', rule: 'device_presence_conflict',
            message: `CONTRADICTION! Sensors show ${npc1} in both ${place1} and ${place2} during ${window1}!` };
    }

    // ── SOFT rules ──

    // Rule 4: STAY claim vs movement evidence (door log) = SOFT
    if ((stay1 && sem2 === 'movement') || (stay2 && sem1 === 'movement')) {
        return { success: true, contradiction: true, level: 'SOFT_TENSION', rule: 'stay_vs_movement',
            message: `Interesting... ${npc1} claims to have stayed put, but a door log suggests movement during ${window1}.` };
    }

    // Rule 5: Testimony vs testimony (presence) = SOFT always (perspective, not lies)
    if (src1 === 'testimony' && src2 === 'testimony' && sem1 === 'presence' && sem2 === 'presence') {
        return { success: true, contradiction: true, level: 'SOFT_TENSION', rule: 'witness_disagree',
            message: `Witnesses disagree about where ${npc1} was during ${window1} — could be different perspectives.` };
    }

    // Rule 6: Testimony vs device presence (no STAY claim) = SOFT
    if ((src1 === 'device' && src2 === 'testimony') || (src2 === 'device' && src1 === 'testimony')) {
        if ((sem1 === 'presence' || sem2 === 'presence') && !stay1 && !stay2) {
            return { success: true, contradiction: true, level: 'SOFT_TENSION', rule: 'testimony_vs_device',
                message: `Device log and testimony disagree about ${npc1}'s location during ${window1}.` };
        }
    }

    // Rule 7: Movement vs presence = SOFT
    if ((sem1 === 'movement' && sem2 === 'presence') || (sem2 === 'movement' && sem1 === 'presence')) {
        return { success: true, contradiction: true, level: 'SOFT_TENSION', rule: 'presence_vs_movement',
            message: `Evidence suggests ${npc1} was moving around during ${window1}.` };
    }

    // Rule 8: Movement vs movement = no contradiction (normal walking)
    if (sem1 === 'movement' && sem2 === 'movement') {
        return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
    }

    // Default: no contradiction
    return { success: true, contradiction: false, level: 'NO_CONTRADICTION', message: `No contradiction found between these evidence items.` };
}
