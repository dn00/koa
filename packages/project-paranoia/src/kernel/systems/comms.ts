import { CONFIG } from '../../config.js';
import type { RNG } from '../../core/rng.js';
import type { KernelState, NPCId, PlaceId, Proposal } from '../types.js';
import { makeProposal } from '../proposals.js';

export const WHISPER_TOPICS = [
    { id: 'mother_rogue', text: 'MOTHER is lying to us.' },
    { id: 'commander_reset', text: 'The Commander is talking about resetting MOTHER.' },
    { id: 'engineer_sabotage', text: 'Rook is going to sabotage the power.' },
    { id: 'doctor_sedate', text: 'Imani is sedating people at night.' },
    { id: 'specialist_sacrifice', text: 'Vega would trade us for cargo.' },
    { id: 'roughneck_violence', text: 'Pike is losing it.' },
] as const;

export function proposeCommsEvents(state: KernelState, rng: RNG): Proposal[] {
    const proposals: Proposal[] = [];
    const truth = state.truth;
    if (truth.phase !== 'evening') return proposals;

    // Cap comms messages per phase to avoid evening whisper firehose
    if (truth.pacing.phaseCommsCount >= CONFIG.maxCommsPerPhase) return proposals;

    maybeStartIncident(state, rng);
    const incidentProposals = advanceIncidents(state);
    proposals.push(...incidentProposals);
    truth.pacing.phaseCommsCount += incidentProposals.length;

    if (truth.pacing.phaseCommsCount >= CONFIG.maxCommsPerPhase) return proposals;
    if (truth.tick % CONFIG.whisperInterval !== 0) return proposals;

    const roomCrew: Array<[PlaceId, NPCId[]]> = [];
    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;
        const existing = roomCrew.find(([place]) => place === npc.place);
        if (existing) {
            existing[1].push(npc.id);
        } else {
            roomCrew.push([npc.place, [npc.id]]);
        }
    }

    const candidateRooms = roomCrew.filter(([, ids]) => ids.length >= 2);
    if (candidateRooms.length === 0) return proposals;

    const [place, ids] = rng.pick(candidateRooms);
    const speaker = rng.pick(ids);
    const listener = rng.pick(ids.filter(id => id !== speaker));
    const topic = pickWhisperTopic(state, speaker, rng);
    const blocked = !!state.perception.tamper.suppressed['comms'];

    proposals.push(makeProposal(state, {
        type: 'COMMS_MESSAGE',
        actor: speaker,
        place,
        target: listener,
        data: {
            message: makeMessage({
                tick: truth.tick,
                kind: 'whisper',
                from: speaker,
                to: listener,
                place,
                topic: topic.id,
                text: `[WHISPER] ${speaker.toUpperCase()}: ${topic.text}`,
                confidence: 0.45,
                blocked,
            }),
        },
    }, ['uncertainty', 'reaction', 'choice']));
    truth.pacing.phaseCommsCount += 1;

    return proposals;
}

function maybeStartIncident(state: KernelState, rng: RNG) {
    const truth = state.truth;
    if (truth.incidents.length > 0) return;
    if (rng.nextInt(100) > 20) return;

    const candidates = Object.values(truth.crew).filter(c => c.alive && c.place === 'mess');
    if (candidates.length < 2) return;

    const instigator = rng.pick(candidates);
    const target = rng.pick(candidates.filter(c => c.id !== instigator.id));
    const topic = pickWhisperTopic(state, instigator.id, rng);
    const witnessPool = candidates.filter(c => c.id !== instigator.id && c.id !== target.id);
    const witness = rng.nextInt(100) < 60 && witnessPool.length > 0
        ? rng.pick(witnessPool).id
        : undefined;

    truth.incidents.push({
        id: `${truth.tick}-incident-${truth.incidents.length}`,
        topic: topic.id,
        instigator: instigator.id,
        target: target.id,
        witness,
        place: instigator.place,
        stepIndex: 0,
        nextTick: truth.tick + 2,
    });
}

function advanceIncidents(state: KernelState): Proposal[] {
    const proposals: Proposal[] = [];
    const remaining: typeof state.truth.incidents = [];

    for (const incident of state.truth.incidents) {
        if (state.truth.tick < incident.nextTick) {
            remaining.push(incident);
            continue;
        }

        const blocked = !!state.perception.tamper.suppressed['comms'];
        if (incident.stepIndex === 0) {
            proposals.push(makeProposal(state, {
                type: 'COMMS_MESSAGE',
                actor: incident.instigator,
                place: incident.place,
                target: incident.witness ?? incident.target,
                data: {
                    message: makeMessage({
                        tick: state.truth.tick,
                        kind: 'whisper',
                        from: incident.instigator,
                        to: incident.witness ?? incident.target,
                        place: incident.place,
                        topic: incident.topic,
                        text: `[WHISPER] ${incident.instigator.toUpperCase()}: ${topicToText(incident.topic)}`,
                        confidence: 0.55,
                        blocked,
                    }),
                },
            }, ['uncertainty', 'reaction', 'choice']));
            incident.stepIndex = 1;
            incident.nextTick = state.truth.tick + 3;
            remaining.push(incident);
            continue;
        }

        if (incident.stepIndex === 1) {
            proposals.push(makeProposal(state, {
                type: 'COMMS_MESSAGE',
                actor: incident.witness ?? incident.instigator,
                place: incident.place,
                data: {
                    message: makeMessage({
                        tick: state.truth.tick,
                        kind: 'broadcast',
                        from: incident.witness ?? incident.instigator,
                        place: incident.place,
                        topic: incident.topic,
                        text: `[BROADCAST] ${topicToText(incident.topic)}`,
                        confidence: 0.6,
                        blocked,
                    }),
                },
            }, ['reaction', 'choice']));
            continue;
        }
    }

    state.truth.incidents = remaining;
    return proposals;
}

function pickWhisperTopic(state: KernelState, speaker: NPCId, rng: RNG) {
    const truth = state.truth;
    const npc = truth.crew[speaker];
    const belief = state.perception.beliefs[speaker];

    if (belief?.motherReliable !== undefined && belief.motherReliable < 0.5) {
        return WHISPER_TOPICS[0];
    }
    if (npc.id === 'commander' && npc.loyalty < CONFIG.commanderResetLoyalty) {
        return WHISPER_TOPICS[1];
    }
    if (npc.id === 'engineer' && npc.stress >= CONFIG.engineerSabotageStress) {
        return WHISPER_TOPICS[2];
    }
    if (npc.id === 'doctor' && npc.stress >= CONFIG.doctorSedateStress) {
        return WHISPER_TOPICS[3];
    }
    if (npc.id === 'specialist' && truth.dayCargo < truth.quotaPerDay * CONFIG.specialistSacrificeQuotaRatio) {
        return WHISPER_TOPICS[4];
    }
    if (npc.id === 'roughneck' && npc.paranoia >= CONFIG.roughneckViolenceParanoia) {
        return WHISPER_TOPICS[5];
    }
    return rng.pick(WHISPER_TOPICS);
}

export function topicToSubject(topic: string): NPCId | null {
    if (topic === 'commander_reset') return 'commander';
    if (topic === 'engineer_sabotage') return 'engineer';
    if (topic === 'doctor_sedate') return 'doctor';
    if (topic === 'specialist_sacrifice') return 'specialist';
    if (topic === 'roughneck_violence') return 'roughneck';
    return null;
}

export function topicToText(topic: string): string {
    const found = WHISPER_TOPICS.find(t => t.id === topic);
    return found ? found.text : 'Something is wrong.';
}

function makeMessage(params: {
    tick: number;
    kind: 'whisper' | 'log' | 'broadcast' | 'intercept' | 'order';
    from?: NPCId | 'PLAYER' | 'SYSTEM';
    to?: NPCId;
    place?: PlaceId;
    topic?: string;
    text: string;
    confidence: number;
    blocked?: boolean;
}) {
    const { tick, kind, from, to, place, topic, text, confidence, blocked } = params;
    return {
        id: `${tick}-${kind}-${from ?? 'anon'}-${topic ?? 'generic'}`,
        tick,
        kind,
        from,
        to,
        place,
        topic,
        text,
        confidence,
        blocked,
    };
}
