/**
 * KOA Casefiles - Core Types
 */

// ============================================================================
// Primitives
// ============================================================================

export type NPCId = string;
export type PlaceId = string;
export type DeviceId = string;
export type ItemId = string;
export type WindowId = string;
export type EventId = string;

// ============================================================================
// Motives (Section 8.5 - Comedy Engine)
// ============================================================================

export type MotiveType =
    | 'envy'           // "Alice always brags about her sourdough"
    | 'embarrassment'  // "Had to hide it before anyone saw"
    | 'cover_up'       // "Evidence of previous shenanigan"
    | 'rivalry'        // "Bob's bread is CLEARLY inferior"
    | 'attention'      // "No one appreciates my contributions"
    | 'revenge'        // "Payback for the thermostat incident"
    | 'chaos';         // "Just wanted to watch the world burn"

export interface Motive {
    type: MotiveType;
    target?: NPCId;           // Who the motive is about (if applicable)
    description: string;      // "Carol is jealous of Alice's sourdough fame"
    funnyReason: string;      // "The sourdough got more likes than her selfies"
}

// ============================================================================
// Relationships (Powers motive selection)
// ============================================================================

export type RelationshipType =
    | 'rivalry'        // Competitive, want to one-up each other
    | 'alliance'       // Cover for each other, share secrets
    | 'grudge'         // Past beef, would frame each other
    | 'crush'          // Would do dumb things to impress
    | 'annoyance';     // General irritation, petty retaliation

export interface Relationship {
    from: NPCId;
    to: NPCId;
    type: RelationshipType;
    intensity: number;        // 1-10, affects motive strength
    backstory: string;        // "Bob never returned Alice's Tupperware (2019)"
}

// ============================================================================
// Twist Rules (Section 14 - Complexity knobs)
// ============================================================================

export type TwistType =
    | 'false_alibi'           // Culprit claims to be elsewhere
    | 'unreliable_witness'    // Witness misremembers time/details
    | 'tampered_device'       // Device log was messed with
    | 'planted_evidence'      // Evidence pointing to wrong person
    | 'accomplice';           // Someone helped cover up

export interface TwistRule {
    type: TwistType;
    actor: NPCId;             // Who is affected/responsible
    description: string;      // "Bob's wifi presence was spoofed"
    affectsEvidence: string[]; // Evidence IDs this twist affects
}

// ============================================================================
// Suspicious Acts (Red Herrings doing sketchy things)
// ============================================================================

export interface SuspiciousAct {
    npc: NPCId;
    window: WindowId;
    place: PlaceId;
    action: string;           // "sneaking to kitchen"
    looksLike: string;        // "hiding evidence"
    actualReason: string;     // "shame-eating leftover cake"
    generatesEvents: boolean; // Whether this creates MOVE/DOOR events
}

// ============================================================================
// Time
// ============================================================================

export interface TimeWindow {
    id: WindowId;
    label: string;           // "6:00pm - 8:00pm"
    startTick: number;
    endTick: number;
}

export const WINDOWS: TimeWindow[] = [
    { id: 'W1', label: '4:00pm - 5:30pm', startTick: 0, endTick: 15 },
    { id: 'W2', label: '5:30pm - 7:00pm', startTick: 16, endTick: 30 },
    { id: 'W3', label: '7:00pm - 8:30pm', startTick: 31, endTick: 45 },  // Crime window
    { id: 'W4', label: '8:30pm - 10:00pm', startTick: 46, endTick: 60 },
    { id: 'W5', label: '10:00pm - 11:30pm', startTick: 61, endTick: 75 },
    { id: 'W6', label: '11:30pm - 1:00am', startTick: 76, endTick: 90 },
];

export function getWindowForTick(tick: number): WindowId {
    for (const w of WINDOWS) {
        if (tick >= w.startTick && tick <= w.endTick) {
            return w.id;
        }
    }
    return 'W6'; // Default to last window
}

// ============================================================================
// World - Places
// ============================================================================

export interface Place {
    id: PlaceId;
    name: string;
    adjacent: PlaceId[];
}

// ============================================================================
// World - Devices
// ============================================================================

export type DeviceType = 'door_sensor' | 'motion_sensor' | 'wifi_presence';

export interface Device {
    id: DeviceId;
    type: DeviceType;
    place: PlaceId;
    connectsTo?: PlaceId;  // For door sensors
}

// ============================================================================
// World - Items
// ============================================================================

export interface Item {
    id: ItemId;
    name: string;
    funnyName: string;     // "Herbert the therapy cactus"
    startPlace: PlaceId;
}

// ============================================================================
// World - NPCs
// ============================================================================

export interface ScheduleEntry {
    window: WindowId;
    place: PlaceId;
    activity: string;
}

export interface NPC {
    id: NPCId;
    name: string;
    role: string;
    schedule: ScheduleEntry[];
}

// ============================================================================
// Events
// ============================================================================

export type EventType =
    | 'NPC_MOVE'
    | 'DOOR_OPENED'
    | 'DOOR_CLOSED'
    | 'MOTION_DETECTED'
    | 'ITEM_TAKEN'
    | 'ITEM_HIDDEN'
    | 'ITEM_SWAPPED'       // Replaced with decoy
    | 'ITEM_DROPPED'       // Left somewhere obvious
    | 'SUSPICIOUS_ACT'     // Red herring doing sketchy things
    | 'DEVICE_TAMPERED';   // Someone messed with a sensor

export interface SimEvent {
    id: EventId;
    tick: number;
    window: WindowId;
    type: EventType;
    actor?: NPCId;
    place?: PlaceId;
    fromPlace?: PlaceId;
    toPlace?: PlaceId;
    target?: ItemId | DeviceId;
    data?: Record<string, unknown>;
}

// ============================================================================
// Crime Types (Section 7 - Cozy Shenanigans)
// ============================================================================

export type CrimeType =
    | 'theft'         // Item missing
    | 'sabotage'      // Device/item ruined or disabled
    | 'prank'         // Item swapped/moved for chaos
    | 'disappearance'; // Item "lost" (hidden in plain sight)

export interface CrimeMethod {
    type: CrimeType;
    description: string;   // "stole the sourdough"
    funnyMethod: string;   // "during the great kitchen distraction of 2024"
}

// ============================================================================
// Case Configuration
// ============================================================================

export interface CaseConfig {
    seed: number;
    suspects: NPCId[];
    culpritId: NPCId;
    crimeType: CrimeType;           // What kind of crime
    crimeMethod: CrimeMethod;       // How they did it
    targetItem: ItemId;
    crimeWindow: WindowId;
    crimePlace: PlaceId;
    hiddenPlace: PlaceId;           // Where item was hidden/moved
    motive: Motive;                 // Why they did it
    twist?: TwistRule;              // Optional complexity
    suspiciousActs: SuspiciousAct[]; // Red herring behaviors
    distractedWitness?: NPCId;      // Someone who was there but didn't notice
}

// ============================================================================
// Evidence
// ============================================================================

export type EvidenceKind = 'presence' | 'device_log' | 'testimony' | 'physical';

export interface BaseEvidence {
    id: string;
    kind: EvidenceKind;
    cites: EventId[];
}

export interface PresenceEvidence extends BaseEvidence {
    kind: 'presence';
    npc: NPCId;
    window: WindowId;
    place: PlaceId;
}

export interface DeviceLogEvidence extends BaseEvidence {
    kind: 'device_log';
    device: DeviceId;
    deviceType: DeviceType;
    window: WindowId;
    place: PlaceId;
    detail: string;        // "Door opened", "Motion detected"
    actor?: NPCId;         // If known (e.g., from wifi)
}

export interface TestimonyEvidence extends BaseEvidence {
    kind: 'testimony';
    witness: NPCId;
    window: WindowId;
    place: PlaceId;
    observable: string;    // "heard footsteps", "saw tall figure"
    confidence: number;    // 0.0 - 1.0
    subjectHint?: string;  // "tall", "wearing red", etc. (NOT NPCId)
}

export interface PhysicalEvidence extends BaseEvidence {
    kind: 'physical';
    item: ItemId;
    detail: string;        // "Missing from kitchen", "Found in garage"
    place: PlaceId;
    window: WindowId;
}

export type EvidenceItem =
    | PresenceEvidence
    | DeviceLogEvidence
    | TestimonyEvidence
    | PhysicalEvidence;

// ============================================================================
// Simulation Result
// ============================================================================

export interface World {
    places: Place[];
    devices: Device[];
    items: Item[];
    npcs: NPC[];
    relationships: Relationship[];  // NPC relationships for motive selection
}

export interface SimulationResult {
    seed: number;
    world: World;
    eventLog: SimEvent[];
    config: CaseConfig;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    reason?: string;
    details?: Record<string, unknown>;
}

export interface CaseValidation {
    seed: number;
    solvability: ValidationResult;
    antiAnticlimax: ValidationResult;
    redHerrings: ValidationResult;
    passed: boolean;
    culprit: NPCId;
    evidenceCount: number;
}
