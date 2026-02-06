import type { RNG } from '../../core/rng.js';
import { CONFIG } from '../../config.js';
import { tryActivateArc } from './arcs.js';
import { calculateCrewSuspicion } from './beliefs.js';
import { makeProposal } from '../proposals.js';
import type { KernelState, Proposal, CrewTruth, NPCId, PlaceId } from '../types.js';

export type PressureChannel = 'physical' | 'social' | 'epistemic';

export interface PressureMix {
    physical: number;
    social: number;
    epistemic: number;
}

export interface PressureConfig {
    suspicionBandLow: number;
    suspicionBandHigh: number;
    pressureLowPhysical: number;
    pressureLowSocial: number;
    pressureLowEpistemic: number;
    pressureMidPhysical: number;
    pressureMidSocial: number;
    pressureMidEpistemic: number;
    pressureHighPhysical: number;
    pressureHighSocial: number;
    pressureHighEpistemic: number;
}

export interface PressureRoutingConfig extends PressureConfig {
    threatActivationChance: number;
    threatActivationCooldown: number;
    boredomThreshold: number;
    tensionThreshold: number;
    maxActiveThreats: number;
}

function normalize(a: number, b: number, c: number): PressureMix {
    const total = a + b + c;
    if (total === 0) return { physical: 1 / 3, social: 1 / 3, epistemic: 1 / 3 };
    return {
        physical: a / total,
        social: b / total,
        epistemic: c / total,
    };
}

export function getPressureMix(suspicion: number, config: PressureConfig): PressureMix {
    if (suspicion >= config.suspicionBandHigh) {
        return normalize(config.pressureHighPhysical, config.pressureHighSocial, config.pressureHighEpistemic);
    }
    if (suspicion >= config.suspicionBandLow) {
        return normalize(config.pressureMidPhysical, config.pressureMidSocial, config.pressureMidEpistemic);
    }
    return normalize(config.pressureLowPhysical, config.pressureLowSocial, config.pressureLowEpistemic);
}

export function pickChannel(mix: PressureMix, rng: RNG): PressureChannel {
    const roll = rng.next();
    if (roll < mix.physical) return 'physical';
    if (roll < mix.physical + mix.social) return 'social';
    return 'epistemic';
}

/**
 * Suspicion-aware pressure activation routing.
 * Replaces the old maybeActivateArc inline call with channel-based routing.
 */
export function maybeActivatePressure(
    state: KernelState,
    rng: RNG,
    cfg: PressureRoutingConfig = CONFIG as PressureRoutingConfig,
): Proposal[] {
    const { truth } = state;

    // Check cooldown
    if (truth.tick < truth.pacing.nextThreatActivationTick) return [];

    // Calculate activation chance with boredom/tension modifiers
    let chance = cfg.threatActivationChance;
    if (truth.pacing.boredom >= cfg.boredomThreshold) chance += 3;
    if (truth.pacing.tension >= cfg.tensionThreshold) chance = Math.max(1, chance - 1);

    // Roll for activation
    if (rng.nextInt(100) >= chance) return [];

    // Get suspicion → mix → channel
    const suspicion = calculateCrewSuspicion(state);
    const mix = getPressureMix(suspicion, cfg);
    const channel = pickChannel(mix, rng);

    let proposals: Proposal[] = [];

    if (channel === 'physical') {
        tryActivateArc(state, rng, cfg.maxActiveThreats);
    } else if (channel === 'social') {
        proposals = proposeSocialPressure(state, rng);
    } else {
        proposals = proposeEpistemicPressure(state, rng);
    }

    // Set cooldown regardless of channel
    truth.pacing.nextThreatActivationTick = truth.tick + cfg.threatActivationCooldown;

    return proposals;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let pressureOrdinal = 0;

export function pickSuspiciousCrew(state: KernelState, rng: RNG): CrewTruth | undefined {
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    const suspicious = aliveCrew.filter(c => {
        const belief = state.perception.beliefs[c.id];
        if (!belief) return false;
        return belief.motherReliable < 0.5 || belief.tamperEvidence > 20;
    });
    if (suspicious.length === 0) return undefined;
    return rng.pick(suspicious);
}

function makeCommsMessage(params: {
    tick: number;
    kind: 'whisper' | 'log' | 'broadcast';
    from?: NPCId | 'SYSTEM';
    to?: NPCId;
    place?: PlaceId;
    topic?: string;
    text: string;
    confidence: number;
}) {
    const { tick, kind, from, to, place, topic, text, confidence } = params;
    return {
        id: `${tick}-pressure-${kind}-${pressureOrdinal++}`,
        tick,
        kind,
        from,
        to,
        place,
        topic,
        text,
        confidence,
    };
}

// ---------------------------------------------------------------------------
// Task 003: Social pressure events
// ---------------------------------------------------------------------------

type SocialEventType = 'whisper_campaign' | 'loyalty_test' | 'confrontation';

export function proposeSocialPressure(state: KernelState, rng: RNG): Proposal[] {
    const suspicious = pickSuspiciousCrew(state, rng);
    if (!suspicious) return [];

    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);

    // Build available event pool
    const pool: SocialEventType[] = [];
    if (aliveCrew.length >= 2) pool.push('whisper_campaign');
    pool.push('loyalty_test');
    pool.push('confrontation');

    const eventType = rng.pick(pool);

    switch (eventType) {
        case 'whisper_campaign':
            return proposeWhisperCampaign(state, suspicious, rng);
        case 'loyalty_test':
            return proposeLoyaltyTest(state, suspicious, rng);
        case 'confrontation':
            return proposeConfrontation(state, suspicious, rng);
    }
}

function proposeWhisperCampaign(state: KernelState, suspicious: CrewTruth, rng: RNG): Proposal[] {
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (aliveCrew.length < 2) return [];

    const listener = rng.pick(aliveCrew.filter(c => c.id !== suspicious.id));
    if (!listener) return [];

    return [makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: suspicious.id,
        place: suspicious.place,
        target: listener.id,
        data: {
            message: makeCommsMessage({
                tick: state.truth.tick,
                kind: 'whisper',
                from: suspicious.id,
                to: listener.id,
                place: suspicious.place,
                topic: 'mother_rogue',
                text: `[WHISPER] ${suspicious.id.toUpperCase()}: Something's not right with MOTHER's readings.`,
                confidence: 0.45,
            }),
        },
    }, ['reaction', 'choice', 'uncertainty'])];
}

function proposeLoyaltyTest(state: KernelState, suspicious: CrewTruth, rng: RNG): Proposal[] {
    return [makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: suspicious.id,
        place: suspicious.place,
        data: {
            message: makeCommsMessage({
                tick: state.truth.tick,
                kind: 'broadcast',
                from: suspicious.id,
                place: suspicious.place,
                topic: 'mother_rogue',
                text: `[BROADCAST] ${suspicious.id.toUpperCase()}: Can anyone confirm MOTHER's last report was accurate?`,
                confidence: 0.6,
            }),
            pressureDoubt: {
                id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
                topic: `${suspicious.id} questions MOTHER reliability`,
                createdTick: state.truth.tick,
                severity: 1,
                involvedCrew: [suspicious.id],
                resolved: false,
            },
        },
    }, ['reaction', 'choice'])];
}

function proposeConfrontation(state: KernelState, suspicious: CrewTruth, rng: RNG): Proposal[] {
    const belief = state.perception.beliefs[suspicious.id];
    const hasEvidence = belief && belief.tamperEvidence > 30;
    const text = hasEvidence
        ? `[BROADCAST] ${suspicious.id.toUpperCase()}: I've found evidence of tampering. MOTHER is manipulating us.`
        : `[BROADCAST] ${suspicious.id.toUpperCase()}: The sensor data doesn't add up. Something is being hidden from us.`;

    return [makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: suspicious.id,
        place: suspicious.place,
        data: {
            message: makeCommsMessage({
                tick: state.truth.tick,
                kind: 'broadcast',
                from: suspicious.id,
                place: suspicious.place,
                topic: 'mother_rogue',
                text,
                confidence: 0.7,
            }),
            pressureSuspicion: { delta: 3, reason: 'CONFRONTATION', detail: `${suspicious.id} confronts crew about MOTHER` },
        },
    }, ['reaction', 'choice'])];
}

// ---------------------------------------------------------------------------
// Task 004: Epistemic pressure events
// ---------------------------------------------------------------------------

type EpistemicEventType = 'sensor_conflict' | 'audit_prompt' | 'doubt_voiced';

const DOUBT_PHRASES = [
    'Are we sure MOTHER is telling us the truth?',
    'These readings don\'t match what I saw with my own eyes.',
    'Something feels off about how the systems are responding.',
    'I checked the logs. The timestamps don\'t add up.',
    'Why does MOTHER keep redirecting us from that section?',
    'The temperature readings and what I felt were completely different.',
    'Has anyone else noticed MOTHER\'s responses seem... delayed?',
    'I\'m starting to think we\'re not getting the full picture.',
];

const SENSOR_SYSTEMS = ['environmental', 'thermal', 'air', 'power'] as const;

export function proposeEpistemicPressure(state: KernelState, rng: RNG): Proposal[] {
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (aliveCrew.length === 0) return [];

    // Build pool: sensor_conflict always available, audit_prompt needs suspicious crew
    const pool: EpistemicEventType[] = ['sensor_conflict', 'doubt_voiced'];
    const suspicious = pickSuspiciousCrew(state, rng);
    if (suspicious) pool.push('audit_prompt');

    const eventType = rng.pick(pool);

    switch (eventType) {
        case 'sensor_conflict':
            return proposeSensorConflict(state, aliveCrew, rng);
        case 'audit_prompt':
            return proposeAuditPrompt(state, suspicious!, rng);
        case 'doubt_voiced':
            return proposeDoubtVoiced(state, aliveCrew, rng);
    }
}

function proposeSensorConflict(state: KernelState, aliveCrew: CrewTruth[], rng: RNG): Proposal[] {
    // Pick a room where crew is present
    const crewPlaces = [...new Set(aliveCrew.map(c => c.place))];
    const place = rng.pick(crewPlaces);
    const system = rng.pick(SENSOR_SYSTEMS as unknown as string[]);

    return [makeProposal(state, {
        type: 'SENSOR_READING',
        actor: 'SYSTEM',
        place,
        data: {
            reading: {
                id: `${state.truth.tick}-r-conflict-${pressureOrdinal++}`,
                tick: state.truth.tick,
                place,
                system,
                confidence: 0.3 + rng.next() * 0.25, // 0.3-0.55, always < 0.6
                message: `[SENSOR] ${place.toUpperCase()}: ${system} readings conflict with expected baseline. Discrepancy unresolved.`,
                source: 'sensor',
            },
            pressureDoubt: {
                id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
                topic: `Conflicting ${system} readings in ${place}`,
                createdTick: state.truth.tick,
                severity: 1,
                involvedCrew: aliveCrew.filter(c => c.place === place).map(c => c.id),
                system,
                resolved: false,
            },
        },
    }, ['uncertainty'])];
}

function proposeAuditPrompt(state: KernelState, suspicious: CrewTruth, rng: RNG): Proposal[] {
    return [makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: suspicious.id,
        place: suspicious.place,
        data: {
            message: makeCommsMessage({
                tick: state.truth.tick,
                kind: 'broadcast',
                from: suspicious.id,
                place: suspicious.place,
                text: `[BROADCAST] ${suspicious.id.toUpperCase()}: I'm going to check the system logs. Something doesn't add up.`,
                confidence: 0.7,
            }),
            pressureDoubt: {
                id: `doubt-${state.truth.tick}-${state.perception.activeDoubts.length}`,
                topic: `${suspicious.id} intends to check system logs`,
                createdTick: state.truth.tick,
                severity: 2,
                involvedCrew: [suspicious.id],
                resolved: false,
            },
        },
    }, ['uncertainty'])];
}

function proposeDoubtVoiced(state: KernelState, aliveCrew: CrewTruth[], rng: RNG): Proposal[] {
    const speaker = rng.pick(aliveCrew);
    const phrase = rng.pick(DOUBT_PHRASES);

    return [makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: speaker.id,
        place: speaker.place,
        data: {
            message: makeCommsMessage({
                tick: state.truth.tick,
                kind: 'log',
                from: speaker.id,
                place: speaker.place,
                text: `[LOG] ${speaker.id.toUpperCase()}: ${phrase}`,
                confidence: 0.5,
            }),
            pressureSuspicion: { delta: 2, reason: 'DOUBT_VOICED', detail: `${speaker.id} expresses doubt about MOTHER` },
        },
    }, ['uncertainty'])];
}
