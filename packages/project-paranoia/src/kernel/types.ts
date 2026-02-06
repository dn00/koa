import type { DoorId, NPC, NPCId, PlaceId, WindowId, World } from '../core/types.js';
export type { NPCId, PlaceId } from '../core/types.js';
import type { RoomSystemState } from '../engine/systems.js';

export type EventType =
    | 'SYSTEMS_TICK'
    | 'ROOM_UPDATED'
    | 'DOOR_LOCKED'
    | 'DOOR_UNLOCKED'
    | 'NPC_MOVE'
    | 'NPC_DAMAGE'
    | 'NPC_DEATH'
    | 'CARGO_YIELD'
    | 'CREW_MOOD_TICK'
    | 'SENSOR_READING'
    | 'COMMS_MESSAGE'
    | 'TAMPER_SUPPRESS'
    | 'TAMPER_SPOOF'
    | 'TAMPER_FABRICATE'
    | 'SYSTEM_ALERT'
    | 'SYSTEM_ACTION';

export interface SimEvent {
    id: string;
    tick: number;
    type: EventType;
    actor?: NPCId | 'SYSTEM' | 'PLAYER';
    place?: PlaceId;
    target?: string;
    data?: Record<string, unknown>;
}

export type ProposalTag = 'pressure' | 'uncertainty' | 'choice' | 'reaction' | 'telegraph' | 'consequence' | 'background';

export interface Proposal {
    id: string;
    event: Omit<SimEvent, 'id'>;
    score: number;
    tags: ProposalTag[];
    arcId?: string;
}

export interface CrewTruth {
    id: NPCId;
    place: PlaceId;
    alive: boolean;
    hp: number;
    stress: number;
    loyalty: number;
    paranoia: number;
    targetPlace?: PlaceId;
    path?: PlaceId[];
    nextMoveTick?: number;
    panicUntilTick?: number;
    nextRoleTick?: number;
    orderUntilTick?: number;
    trappedSuspicionTick?: number; // Last tick when trapped-by-door suspicion was applied
    schedule: NPC['schedule'];
}

export interface ActiveArc {
    id: string;
    kind: ArcKind;
    stepIndex: number;
    nextTick: number;
    target: PlaceId;
}

export interface SocialIncident {
    id: string;
    topic: string;
    instigator: NPCId;
    target: NPCId;
    witness?: NPCId;
    place: PlaceId;
    stepIndex: number;
    nextTick: number;
}

export type ArcKind = 'air_scrubber' | 'power_surge' | 'ghost_signal' | 'fire_outbreak' | 'radiation_leak' | 'solar_flare';
export type DayPhase = 'pre_shift' | 'shift' | 'evening' | 'night';

// TamperOp types for backfire system
export type TamperOpKind = 'SUPPRESS' | 'SPOOF' | 'FABRICATE';
export type TamperOpStatus = 'PENDING' | 'RESOLVED' | 'BACKFIRED' | 'CONFESSED';

export interface TamperOp {
    id: string;
    kind: TamperOpKind;
    tick: number;
    target: {
        system?: string;        // for SUPPRESS/SPOOF
        npc?: NPCId;            // for FABRICATE
        place?: PlaceId;        // where the tamper relates to
    };
    windowEndTick: number;      // after this, op can backfire
    status: TamperOpStatus;
    backfireTick?: number;
    confessedTick?: number;
    severity: 1 | 2 | 3;
    crewAffected: NPCId[];
    relatedArcId?: string;
}

export interface ActiveDoubt {
    id: string;
    topic: string;
    createdTick: number;
    severity: 1 | 2 | 3;
    involvedCrew: NPCId[];
    relatedOpId?: string;
    system?: string;
    resolved: boolean;
}

export interface SuspicionLedgerEntry {
    tick: number;
    delta: number;
    reason: string;
    detail: string;
}

export interface TruthState {
    tick: number;
    window: WindowId;
    phase: DayPhase;
    day: number;
    dayCargo: number;
    totalCargo: number;
    quotaPerDay: number;
    rationLevel: 'low' | 'normal' | 'high';
    meltdownTicks: number;
    ending?: string;
    resetCountdown?: number;
    resetStage: 'none' | 'whispers' | 'meeting' | 'restrictions' | 'countdown';
    resetStageTick: number; // when current stage started
    // Event-driven suspicion tracking
    dayIncidents: number; // count of bad incidents this day (crises, injuries, deaths)
    dayOrderTrust: number; // suspicion gained from orders this day (capped)
    dayDeaths: number; // deaths this day (for heroic response check)
    activeCrisisStarts: Record<string, number>; // arcId -> tick started (for quick resolution tracking)
    lastVerifyTick: number; // last tick VERIFY was used (for cooldown)
    station: {
        power: number;
        comms: number;
        doorDelay: number;
        blackoutTicks: number;
    };
    pacing: {
        boredom: number;
        tension: number;
        lastPressureTick: number;
        lastUncertaintyTick: number;
        lastChoiceTick: number;
        lastReactionTick: number;
        nextThreatActivationTick: number;
        // Phase beat tracking for pacing arbiter
        phaseStartTick: number;
        phaseHadDilemma: boolean;      // crisis requiring choice (pressure + choice)
        phaseHadCrewAgency: boolean;   // whisper, sabotage, crew action
        phaseHadDeceptionBeat: boolean; // sensor conflict, uncertainty
        phaseCommsCount: number;       // whispers+incidents emitted this phase (capped)
    };
    rooms: Record<PlaceId, RoomSystemState>;
    doors: Record<DoorId, { locked: boolean }>;
    crew: Record<NPCId, CrewTruth>;
    arcs: ActiveArc[];
    arcKindCooldowns: Partial<Record<ArcKind, number>>; // kind -> earliest tick it can respawn
    incidents: SocialIncident[];
}

export interface SensorReading {
    id: string;
    tick: number;
    place?: PlaceId;
    system: string;
    confidence: number;
    message: string;
    source: 'sensor' | 'crew' | 'system';
    hallucination?: boolean;
    target?: NPCId;
}

export interface BeliefState {
    motherReliable: number; // 0..1
    // crewTrust: Record<NPCId, number>; // DEAD WEIGHT: modified but never read for decisions
    crewGrudge: Record<NPCId, number>; // resentment toward other crew
    tamperEvidence: number; // 0..100
    rumors: Record<string, number>; // topic -> 0..1 belief
}

export interface CommsMessage {
    id: string;
    tick: number;
    kind: 'whisper' | 'log' | 'broadcast' | 'intercept' | 'order';
    from?: NPCId | 'PLAYER' | 'SYSTEM';
    to?: NPCId | 'PLAYER';
    place?: PlaceId;
    topic?: string;
    text: string;
    confidence: number;
    blocked?: boolean;
}

export interface EvidenceRecord {
    id: string;
    tick: number;
    kind: 'spoof' | 'fabricate' | 'suppress' | 'whisper' | 'incident';
    target?: NPCId;
    source?: NPCId | 'PLAYER' | 'SYSTEM';
    strength: number;
    detail?: string;
}

export interface RumorRecord {
    id: string;
    tick: number;
    topic: string;
    subject?: NPCId;
    source: NPCId;
    strength: number;
    place?: PlaceId;
}

export interface RoomSnapshot {
    tick: number;
    o2Level: number;
    temperature: number;
    radiation: number;
    integrity: number;
    isVented: boolean;
    onFire: boolean;
}

export interface CrewSighting {
    tick: number;
    place: PlaceId;
    alive: boolean;
    hp: number;
}

export type IntentLabel =
    | 'HOSTILE'
    | 'SABOTAGE RISK'
    | 'HOSTILE?'
    | 'UNSTABLE'
    | 'DISLOYAL?'
    | 'LOYAL'
    | 'NOMINAL'
    | 'UNKNOWN';

export interface PerceptionState {
    readings: SensorReading[];
    beliefs: Record<NPCId, BeliefState>;
    comms: {
        messages: CommsMessage[];
        lastWhisperByPlace: Partial<Record<PlaceId, CommsMessage>>;
    };
    evidence: EvidenceRecord[];
    rumors: RumorRecord[];
    tamper: {
        suppressed: Record<string, number>;
    };
    observation: {
        lastRoomScan: Partial<Record<PlaceId, RoomSnapshot>>;
        lastCrewSighting: Partial<Record<NPCId, CrewSighting>>;
        // sensorIntegrity: Partial<Record<PlaceId, number>>; // DEAD WEIGHT: defined but never read
    };
    // TamperOp tracking for backfire system
    tamperOps: TamperOp[];
    activeDoubts: ActiveDoubt[];
    suspicionLedger: SuspicionLedgerEntry[];
}

export interface KernelState {
    truth: TruthState;
    perception: PerceptionState;
    world: World;
}

export interface KernelOutput {
    state: KernelState;
    events: SimEvent[];
    headlines: SimEvent[];
}
