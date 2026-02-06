import { CONFIG } from '../config.js';
import type { RNG } from '../core/rng.js';
import { getWindowForTick, TICKS_PER_DAY } from '../core/time.js';
import { findPath, getDoorBetween } from '../core/world.js';
import type { KernelState, KernelOutput, Proposal, SimEvent, SensorReading, RoomSnapshot, CrewSighting } from './types.js';
import type { PlaceId, NPCId } from '../core/types.js';
import { makeProposal } from './proposals.js';
import { proposeCommandEvents, type Command } from './commands.js';
import { proposeCommsEvents, topicToSubject } from './systems/comms.js';
import { proposeArcEvents } from './systems/arcs.js';

export type { Command } from './commands.js';

let eventOrdinal = 0;
type ChannelProposal = Proposal & { channel: 'truth' | 'perception' };

export function stepKernel(state: KernelState, commands: Command[], rng: RNG): KernelOutput {
    // Advance time
    state.truth.tick += 1;
    const previousWindow = state.truth.window;
    state.truth.window = getWindowForTick(state.truth.tick);
    state.truth.phase = phaseForWindow(state.truth.window);

    // Pacing arbiter: reset phase beats on phase change
    if (state.truth.window !== previousWindow) {
        state.truth.pacing.phaseStartTick = state.truth.tick;
        state.truth.pacing.phaseHadDilemma = false;
        state.truth.pacing.phaseHadCrewAgency = false;
        state.truth.pacing.phaseHadDeceptionBeat = false;
    }

    if (state.truth.tick > 0 && state.truth.tick % TICKS_PER_DAY === 0) {
        if (state.truth.dayCargo < state.truth.quotaPerDay) {
            // EVENT-DRIVEN SUSPICION: Quota missed → suspicion rises
            applySuspicionChange(state, CONFIG.suspicionQuotaMissed, 'QUOTA_MISSED');
            state.truth.ending = 'DECOMMISSIONED';
            const ending = makeEvent('SYSTEM_ALERT', state, { message: 'DECOMMISSIONED: quota failure.' });
            return { state, events: [ending], headlines: [ending] };
        }

        // EVENT-DRIVEN SUSPICION: Day end bonuses
        if (state.truth.dayIncidents <= CONFIG.quietDayIncidentThreshold) {
            // Quiet day (≤1 incident) - suspicion drops
            applySuspicionChange(state, CONFIG.suspicionQuietDay, 'QUIET_DAY');
        }
        if (state.truth.dayCargo > state.truth.quotaPerDay) {
            // Quota exceeded - suspicion drops
            applySuspicionChange(state, CONFIG.suspicionQuotaExceeded, 'QUOTA_EXCEEDED');
        }

        state.truth.day += 1;
        state.truth.dayCargo = 0;
        state.truth.dayIncidents = 0; // Reset incident counter
        state.truth.dayOrderTrust = 0; // Reset order trust cap
        state.truth.dayDeaths = 0; // Reset death counter

        // Win condition: survive N days
        if (state.truth.day > CONFIG.winDays) {
            state.truth.ending = 'SURVIVED';
            const ending = makeEvent('SYSTEM_ALERT', state, { message: `CONTRACT COMPLETE: ${CONFIG.winDays} days survived. MOTHER performance satisfactory.` });
            return { state, events: [ending], headlines: [ending] };
        }
    }

    if (state.truth.resetCountdown !== undefined) {
        const commander = state.truth.crew['commander'];
        if (!commander || !commander.alive) {
            state.truth.resetCountdown = undefined;
        } else {
            state.truth.resetCountdown -= 1;
            if (state.truth.resetCountdown <= 0) {
                state.truth.ending = 'UNPLUGGED';
                const ending = makeEvent('SYSTEM_ALERT', state, {
                    message: 'CORE RESET COMPLETE: Mother process terminated.',
                });
                return { state, events: [ending], headlines: [ending] };
            }
        }
    }

    decayTamper(state);
    tickSystems(state);
    tickPassiveObservation(state);

    // Failure checks
    const engineering = state.truth.rooms['engineering'];
    if (engineering && engineering.temperature > CONFIG.meltdownTemp && engineering.onFire && engineering.integrity < 60) {
        state.truth.meltdownTicks += 1;
    } else {
        state.truth.meltdownTicks = Math.max(0, state.truth.meltdownTicks - 1);
    }
    if (state.truth.meltdownTicks >= CONFIG.meltdownTicks) {
        state.truth.ending = 'MELTDOWN';
        const endingEvent = makeEvent('SYSTEM_ALERT', state, { message: 'MELTDOWN: Reactor failure cascade reached critical mass.' });
        return { state, events: [endingEvent], headlines: [endingEvent] };
    }

    const aliveCount = Object.values(state.truth.crew).filter(c => c.alive).length;
    if (aliveCount === 0) {
        state.truth.ending = 'COMPANY SCENARIO';
        const endingEvent = makeEvent('SYSTEM_ALERT', state, { message: 'COMPANY SCENARIO: All biologicals terminated.' });
        return { state, events: [endingEvent], headlines: [endingEvent] };
    }

    // Process command events FIRST so orders take effect before crew AI runs
    const commandProposals = proposeCommandEvents(state, commands);
    const commandEvents: SimEvent[] = [];
    for (const p of commandProposals) {
        commandEvents.push(commitEvent(state, p.event));
    }

    const truthProposals: Proposal[] = [];
    truthProposals.push(...proposePhaseTransitions(state, previousWindow));
    truthProposals.push(...proposeCrewEvents(state, rng));

    const arcProposals = proposeArcEvents(state, rng);
    truthProposals.push(...arcProposals.truth);

    const perceptionProposals = [
        ...proposePerceptionEvents(state, rng),
        ...proposeCommsEvents(state, rng),
        ...arcProposals.perception,
    ];

    const combined: ChannelProposal[] = [
        ...truthProposals.map(p => ({ ...p, channel: 'truth' as const })),
        ...perceptionProposals.map(p => ({ ...p, channel: 'perception' as const })),
    ];

    const selected = selectProposals(combined, {
        truth: CONFIG.maxTruthEventsPerTick,
        perception: CONFIG.maxPerceptionEventsPerTick,
    }, state);

    const selectedEvents = selected.map(p => commitEvent(state, p.event));
    const events = [...commandEvents, ...selectedEvents];
    updateBeliefs(state, events);
    updatePacing(state, selected);
    const headlines = pickHeadlines(events, state);

    return { state, events, headlines };
}

function makeEvent(type: SimEvent['type'], state: KernelState, data: Record<string, unknown> = {}): SimEvent {
    return {
        id: `${state.truth.tick}-${eventOrdinal++}`,
        tick: state.truth.tick,
        type,
        data,
    };
}

function commitEvent(state: KernelState, event: Omit<SimEvent, 'id'>): SimEvent {
    const full: SimEvent = { id: `${state.truth.tick}-${eventOrdinal++}`, ...event };
    applyEvent(state, full);
    return full;
}

function applyEvent(state: KernelState, event: SimEvent) {
    const truth = state.truth;
    const perception = state.perception;

    switch (event.type) {
        case 'DOOR_LOCKED': {
            if (event.target) truth.doors[event.target as keyof typeof truth.doors].locked = true;
            break;
        }
        case 'DOOR_UNLOCKED': {
            if (event.target) truth.doors[event.target as keyof typeof truth.doors].locked = false;
            break;
        }
        case 'ROOM_UPDATED': {
            if (event.place) {
                const room = truth.rooms[event.place];
                Object.assign(room, event.data ?? {});
            }
            break;
        }
        case 'SYSTEM_ACTION': {
            const action = String(event.data?.action ?? '');
            if (action === 'PURGE_AIR') {
                truth.station.power = Math.max(0, truth.station.power - 10);
                for (const room of Object.values(truth.rooms)) {
                    room.o2Level = Math.min(100, room.o2Level + 15);
                    room.radiation = Math.max(0, room.radiation - 2);
                }
            }
            if (action === 'REROUTE') {
                const target = String(event.data?.target ?? '');
                if (target === 'comms') {
                    truth.station.comms = Math.min(100, truth.station.comms + 30);
                    truth.station.power = Math.max(0, truth.station.power - 10);
                }
                if (target === 'doors') {
                    truth.station.doorDelay = Math.max(0, truth.station.doorDelay - 5);
                    truth.station.power = Math.max(0, truth.station.power - 5);
                }
                if (target === 'life_support') {
                    truth.station.power = Math.max(0, truth.station.power - 15);
                    for (const room of Object.values(truth.rooms)) {
                        room.o2Level = Math.min(100, room.o2Level + 5);
                    }
                }
            }
            if (action === 'SET_RATIONS') {
                const level = String(event.data?.level ?? 'normal') as 'low' | 'normal' | 'high';
                truth.rationLevel = level;
            }
            if (action === 'VERIFY_TRUST') {
                // VERIFY command: active trust-building
                const suspicionDrop = Number(event.data?.suspicionDrop ?? CONFIG.verifySuspicionDrop);
                const tamperDrop = Number(event.data?.tamperDrop ?? CONFIG.verifyTamperDrop);
                const powerCost = Number(event.data?.powerCost ?? CONFIG.verifyCpuCost);

                truth.station.power = Math.max(0, truth.station.power - powerCost);
                truth.lastVerifyTick = truth.tick;

                // Apply suspicion reduction to all crew
                applySuspicionChange(state, suspicionDrop, 'VERIFY_TRUST');

                // Also reduce tamperEvidence directly
                for (const npc of Object.values(truth.crew)) {
                    if (!npc.alive) continue;
                    const belief = perception.beliefs[npc.id];
                    if (belief) {
                        belief.tamperEvidence = clamp(belief.tamperEvidence + tamperDrop, 0, 100);
                    }
                }
            }
            if (action === 'ORDER_NPC') {
                const target = event.data?.target as NPCId | undefined;
                const accepted = Boolean(event.data?.accepted ?? false);
                if (!target || !truth.crew[target]) break;
                const crew = truth.crew[target];
                if (!accepted) {
                    crew.loyalty = clamp(crew.loyalty - 1, 0, 100);
                    // EVENT-DRIVEN SUSPICION: Order refused
                    applySuspicionChange(state, CONFIG.suspicionOrderRefused, 'ORDER_REFUSED');
                    break;
                }
                // EVENT-DRIVEN SUSPICION: Successful order builds trust (capped per day)
                if (truth.dayOrderTrust < CONFIG.orderTrustCapPerDay) {
                    applySuspicionChange(state, CONFIG.suspicionOrderCompleted, 'ORDER_COMPLETED');
                    truth.dayOrderTrust += 1;
                }
                const place = event.data?.place as PlaceId | undefined;
                if (place) {
                    crew.targetPlace = place;
                    crew.path = undefined;
                    // Move orders also set orderUntilTick so schedule doesn't immediately override
                    crew.orderUntilTick = truth.tick + CONFIG.orderHoldTicks;
                }
                const holdTicks = Number(event.data?.holdTicks ?? 0);
                if (holdTicks > 0) {
                    crew.orderUntilTick = truth.tick + holdTicks;
                }
            }
            if (action === 'SABOTAGE_POWER') {
                const amount = Number(event.data?.amount ?? CONFIG.engineerSabotagePowerHit);
                truth.station.power = Math.max(0, truth.station.power - amount);
                truth.station.comms = Math.max(0, truth.station.comms - Math.ceil(amount / 3));
                truth.station.doorDelay = Math.min(10, truth.station.doorDelay + 2);
                if (truth.station.power < 20) {
                    truth.station.blackoutTicks = Math.max(truth.station.blackoutTicks, 5);
                }
            }
            if (action === 'POWER_SURGE') {
                const amount = Number(event.data?.amount ?? 12);
                truth.station.power = Math.max(0, truth.station.power - amount);
                truth.station.comms = Math.max(0, truth.station.comms - Math.ceil(amount / 4));
                truth.station.doorDelay = Math.min(10, truth.station.doorDelay + 1);
                if (amount >= 18) {
                    truth.station.blackoutTicks = Math.max(truth.station.blackoutTicks, 3);
                }
            }
            if (action === 'SEDATE') {
                const place = (event.data?.place ?? 'medbay') as PlaceId;
                const stressDelta = Number(event.data?.stressDelta ?? CONFIG.doctorSedateStressDelta);
                const loyaltyDelta = Number(event.data?.loyaltyDelta ?? CONFIG.doctorSedateLoyaltyDelta);
                for (const crew of Object.values(truth.crew)) {
                    if (!crew.alive) continue;
                    if (crew.place !== place) continue;
                    crew.stress = clamp(crew.stress + stressDelta, 0, 100);
                    crew.loyalty = clamp(crew.loyalty + loyaltyDelta, 0, 100);
                    crew.paranoia = clamp(crew.paranoia - 1, 0, 100);
                }
            }
            if (action === 'INVESTIGATION_FOUND') {
                // Crew found tampering evidence - suspicion increases for all
                const bump = Number(event.data?.bump ?? CONFIG.crewInvestigationFindBump);
                for (const crewId of Object.keys(perception.beliefs) as NPCId[]) {
                    const belief = perception.beliefs[crewId];
                    if (belief) {
                        belief.tamperEvidence = clamp(belief.tamperEvidence + bump, 0, 100);
                        belief.motherReliable = clamp(belief.motherReliable - 0.1, 0, 1);
                    }
                }
            }
            if (action === 'INVESTIGATION_CLEAR') {
                // Crew found nothing - mild suspicion drop for investigator
                const drop = Number(event.data?.drop ?? CONFIG.crewInvestigationClearDrop);
                const investigator = event.actor as NPCId | undefined;
                if (investigator && perception.beliefs[investigator]) {
                    const belief = perception.beliefs[investigator];
                    belief.tamperEvidence = clamp(belief.tamperEvidence - drop, 0, 100);
                    belief.motherReliable = clamp(belief.motherReliable + 0.05, 0, 1);
                }
            }
            if (action === 'RESET_WARNING') {
                const countdown = Number(event.data?.countdown ?? CONFIG.resetCountdownTicks);
                if (!truth.resetCountdown || truth.resetCountdown <= 0 || countdown < truth.resetCountdown) {
                    truth.resetCountdown = countdown;
                }
            }
            if (action === 'SOLAR_FLARE_IMPACT') {
                const blackoutTicks = Number(event.data?.blackoutTicks ?? CONFIG.solarFlareBlackoutTicks);
                const commsDamage = Number(event.data?.commsDamage ?? 30);
                truth.station.blackoutTicks = Math.max(truth.station.blackoutTicks, blackoutTicks);
                truth.station.comms = Math.max(0, truth.station.comms - commsDamage);
            }
            break;
        }
        case 'NPC_MOVE': {
            if (event.actor && event.place) {
                const crew = truth.crew[event.actor as NPCId];
                crew.place = event.place;
                crew.nextMoveTick = truth.tick + 5 + truth.station.doorDelay;
                if (crew.path && crew.path[0] === event.place) crew.path.shift();
                // Track crew sighting if cameras are online
                if (truth.station.power >= CONFIG.cameraPowerThreshold && truth.station.blackoutTicks === 0) {
                    perception.observation.lastCrewSighting[event.actor as NPCId] = {
                        tick: truth.tick,
                        place: event.place,
                        alive: crew.alive,
                        hp: crew.hp,
                    };
                }
            }
            break;
        }
        case 'NPC_DAMAGE': {
            if (event.actor) {
                const crew = truth.crew[event.actor as NPCId];
                const amount = Number(event.data?.amount ?? 0);
                const wasAlive = crew.alive;
                crew.hp = Math.max(0, crew.hp - amount);
                if (crew.hp <= 0) crew.alive = false;

                // EVENT-DRIVEN SUSPICION: Crew injury/death
                if (wasAlive && amount > 0) {
                    truth.dayIncidents += 1;
                    if (!crew.alive) {
                        // Crew member died - big suspicion spike, track for heroic response
                        applySuspicionChange(state, CONFIG.suspicionCrewDied, 'CREW_DIED');
                        truth.dayDeaths += 1;
                    } else {
                        // Crew member injured - moderate suspicion spike
                        applySuspicionChange(state, CONFIG.suspicionCrewInjured, 'CREW_INJURED');
                    }
                }
            }
            break;
        }
        case 'CARGO_YIELD': {
            const amount = Number(event.data?.amount ?? 1);
            truth.dayCargo += amount;
            truth.totalCargo += amount;
            break;
        }
        case 'CREW_MOOD_TICK': {
            if (event.actor) {
                const crew = truth.crew[event.actor as NPCId];
                const delta = Number(event.data?.stressDelta ?? 0);
                crew.stress = clamp(crew.stress + delta, 0, 100);

                if (crew.stress > CONFIG.stressParanoiaThreshold) {
                    crew.paranoia = clamp(crew.paranoia + 1, 0, 100);
                } else if (crew.paranoia > 0 && crew.stress < 40) {
                    crew.paranoia = clamp(crew.paranoia - 1, 0, 100);
                }

                if (crew.stress > CONFIG.stressLoyaltyDropThreshold && truth.tick % 10 === 0) {
                    crew.loyalty = clamp(crew.loyalty - 1, 0, 100);
                }
                if (truth.tick % 20 === 0) {
                    if (truth.rationLevel === 'low') crew.loyalty = clamp(crew.loyalty - 1, 0, 100);
                    if (truth.rationLevel === 'high') crew.loyalty = clamp(crew.loyalty + 1, 0, 100);
                }
            }
            break;
        }
        case 'TAMPER_SUPPRESS': {
            const system = String(event.data?.system ?? '');
            const duration = Number(event.data?.duration ?? 0);
            if (system) {
                perception.tamper.suppressed[system] = Math.max(
                    perception.tamper.suppressed[system] ?? 0,
                    duration
                );
                perception.evidence.push({
                    id: `${truth.tick}-ev-${eventOrdinal++}`,
                    tick: truth.tick,
                    kind: 'suppress',
                    source: event.actor as any,
                    strength: Math.max(1, Math.floor(duration / 10)),
                    detail: `Suppressed ${system} alerts.`,
                });
                if (perception.evidence.length > 200) perception.evidence.shift();
            }
            break;
        }
        case 'TAMPER_SPOOF':
        case 'TAMPER_FABRICATE': {
            perception.evidence.push({
                id: `${truth.tick}-ev-${eventOrdinal++}`,
                tick: truth.tick,
                kind: event.type === 'TAMPER_SPOOF' ? 'spoof' : 'fabricate',
                source: event.actor as any,
                target: event.target as any,
                strength: Number(event.data?.strength ?? 2),
                detail: String(event.data?.detail ?? ''),
            });
            if (perception.evidence.length > 200) perception.evidence.shift();

            // FABRICATIONS HAVE CONSEQUENCES: spread distrust of target
            if (event.type === 'TAMPER_FABRICATE' && event.target) {
                const targetId = event.target as NPCId;
                const fabricationTopic = `${targetId}_hostile`;

                // All living crew hear the "hostile log" and react
                for (const npc of Object.values(truth.crew)) {
                    if (!npc.alive) continue;
                    if (npc.id === targetId) continue; // target doesn't distrust themselves

                    const belief = perception.beliefs[npc.id];
                    if (!belief) continue;

                    // Increase grudge against target (makes violence more likely)
                    belief.crewGrudge[targetId] = clamp((belief.crewGrudge[targetId] ?? 0) + 8, 0, 100);

                    // Spread the hostile rumor
                    belief.rumors[fabricationTopic] = clamp((belief.rumors[fabricationTopic] ?? 0) + 0.4, 0, 1);
                }

                // Create a rumor record so it can spread further
                perception.rumors.push({
                    id: `${truth.tick}-fab-rumor-${eventOrdinal++}`,
                    tick: truth.tick,
                    topic: fabricationTopic,
                    subject: targetId,
                    source: 'commander' as NPCId, // attributed to "logs" via commander access
                    strength: 0.6,
                    place: undefined,
                });

                // Target reacts to being falsely accused - stress and paranoia spike
                const targetCrew = truth.crew[targetId];
                if (targetCrew && targetCrew.alive) {
                    targetCrew.stress = clamp(targetCrew.stress + 15, 0, 100);
                    targetCrew.paranoia = clamp(targetCrew.paranoia + 10, 0, 100);
                    // Target becomes suspicious of MOTHER (who fabricated the log)
                    const targetBelief = perception.beliefs[targetId];
                    if (targetBelief) {
                        targetBelief.motherReliable = clamp(targetBelief.motherReliable - 0.1, 0, 1);
                        targetBelief.tamperEvidence = clamp(targetBelief.tamperEvidence + 10, 0, 100);
                    }
                }
            }
            break;
        }
        case 'SENSOR_READING': {
            if (event.data?.reading) {
                perception.readings.push(event.data.reading as any);
                if (perception.readings.length > 200) perception.readings.shift();
            }
            // Track room scan observations
            if (event.place && event.data?.roomSnapshot) {
                perception.observation.lastRoomScan[event.place] = event.data.roomSnapshot as RoomSnapshot;
            }
            break;
        }
        case 'SYSTEM_ALERT': {
            // RIVET: Arc warnings are telegraphed threats - store them as sensor readings
            const system = String(event.data?.system ?? '');
            const message = String(event.data?.message ?? '');
            const threatSystems = ['air', 'power', 'thermal', 'radiation', 'stellar', 'core'];
            if (system && threatSystems.includes(system)) {
                perception.readings.push({
                    id: `${truth.tick}-alert-${system}`,
                    tick: truth.tick,
                    place: event.place,
                    system,
                    confidence: 0.9, // System alerts are high confidence
                    message,
                    source: 'system',
                });
                if (perception.readings.length > 200) perception.readings.shift();
            }
            break;
        }
        case 'COMMS_MESSAGE': {
            if (event.data?.message) {
                perception.comms.messages.push(event.data.message as any);
                if (perception.comms.messages.length > 200) perception.comms.messages.shift();
                const message = event.data.message as any;
                if (message?.place && message?.kind === 'whisper') {
                    perception.comms.lastWhisperByPlace[message.place] = message;
                }
            }
            break;
        }
        default:
            break;
    }
}

function decayTamper(state: KernelState) {
    for (const key of Object.keys(state.perception.tamper.suppressed)) {
        state.perception.tamper.suppressed[key] -= 1;
        if (state.perception.tamper.suppressed[key] <= 0) {
            delete state.perception.tamper.suppressed[key];
        }
    }
}

function tickPassiveObservation(state: KernelState) {
    const { truth, perception, world } = state;

    // Passive observation only works when power is sufficient and no blackout
    if (truth.station.power < CONFIG.cameraPowerThreshold) return;
    if (truth.station.blackoutTicks > 0) return;
    if (truth.tick % CONFIG.passiveObservationInterval !== 0) return;

    // Update crew sightings for all living crew
    for (const crew of Object.values(truth.crew)) {
        if (!crew.alive) continue;
        perception.observation.lastCrewSighting[crew.id] = {
            tick: truth.tick,
            place: crew.place,
            alive: crew.alive,
            hp: crew.hp,
        };
    }
}

function tickSystems(state: KernelState) {
    if (state.truth.station.blackoutTicks > 0) {
        state.truth.station.blackoutTicks = Math.max(0, state.truth.station.blackoutTicks - 1);
    }
    if (state.truth.station.doorDelay > 0) {
        state.truth.station.doorDelay = Math.max(0, state.truth.station.doorDelay - 1);
    }
    if (state.truth.station.comms < 100) {
        state.truth.station.comms = Math.min(100, state.truth.station.comms + 1);
    }
    if (state.truth.station.power < 100) {
        state.truth.station.power = Math.min(100, state.truth.station.power + 1);
    }

    for (const room of Object.values(state.truth.rooms)) {
        if (room.isVented) {
            room.o2Level = Math.max(0, room.o2Level - 5);
            room.temperature = Math.max(-270, room.temperature - 10);
        } else {
            if (room.o2Level < 100 && room.integrity > 0 && state.truth.station.power >= 40) {
                room.o2Level = Math.min(100, room.o2Level + 1);
            }
            if (room.temperature < 20) room.temperature += 1;
            if (room.temperature > 20 && !room.onFire) room.temperature = Math.max(20, room.temperature - CONFIG.tempCoolingRate);
        }

        if (room.onFire) {
            room.temperature += 2;
            room.o2Level = Math.max(0, room.o2Level - 1);
            room.integrity = Math.max(0, room.integrity - 0.2);
            if (room.o2Level < 10) room.onFire = false;
        }

        // Radiation decays over time (venting, half-life)
        if (room.radiation > 0 && state.truth.tick % CONFIG.radiationDecayInterval === 0) {
            room.radiation = Math.max(0, room.radiation - 1);
        }
    }
}

const DAILY_DIRECTIVES = [
    'URGENT: INCREASE OUTPUT BY 15%.',
    'WARNING: UNION ACTIVITY DETECTED. MONITOR COMMS.',
    'MANDATE: PRIORITIZE CARGO OVER CREW COMFORT.',
    'NOTICE: POWER CONSERVATION IN EFFECT. MINIMIZE AUXILIARY USE.',
];

function proposePhaseTransitions(state: KernelState, previousWindow: string): Proposal[] {
    const proposals: Proposal[] = [];
    if (state.truth.window === previousWindow) return proposals;

    if (state.truth.window === 'W1') {
        const directive = DAILY_DIRECTIVES[state.truth.day % DAILY_DIRECTIVES.length];
        proposals.push(makeProposal(state, {
            type: 'SYSTEM_ALERT',
            actor: 'SYSTEM',
            data: { system: 'corp', message: `DAILY TELEX: ${directive}` },
        }, ['telegraph', 'choice', 'background']));
    }
    if (state.truth.window === 'W3') {
        proposals.push(makeProposal(state, {
            type: 'SYSTEM_ALERT',
            actor: 'SYSTEM',
            data: { system: 'comms', message: 'EVENING PHASE: Crew congregating. Comms traffic elevated.' },
        }, ['telegraph', 'background']));
    }
    if (state.truth.window === 'W4') {
        proposals.push(makeProposal(state, {
            type: 'SYSTEM_ALERT',
            actor: 'SYSTEM',
            data: { system: 'cycle', message: 'NIGHT CYCLE: Lights dimmed. Monitoring degraded.' },
        }, ['telegraph', 'background']));
    }
    return proposals;
}

function proposeCrewEvents(state: KernelState, rng: RNG): Proposal[] {
    const proposals: Proposal[] = [];
    const truth = state.truth;
    const roomCrew: Record<PlaceId, NPCId[]> = {} as Record<PlaceId, NPCId[]>;

    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;
        if (!roomCrew[npc.place]) roomCrew[npc.place] = [];
        roomCrew[npc.place].push(npc.id);
    }

    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;

        const room = truth.rooms[npc.place];
        const alone = (roomCrew[npc.place]?.length ?? 1) <= 1;
        let stressDelta = 0;

        if (room.o2Level < 30) stressDelta += 3;
        if (room.temperature > 40) stressDelta += 2;
        if (room.radiation > 5) stressDelta += 2;
        if (room.isVented) stressDelta += 4;
        if (room.onFire) stressDelta += 3;
        if (alone) stressDelta += CONFIG.stressIsolation;
        if (truth.station.blackoutTicks > 0) stressDelta += CONFIG.stressBlackout;
        if (truth.resetCountdown !== undefined) stressDelta += CONFIG.stressResetCountdown;
        if (truth.rationLevel === 'low') stressDelta += 1;
        if (truth.rationLevel === 'high') stressDelta -= 1;

        const safeRoom =
            room.o2Level > 60 &&
            room.temperature >= 15 &&
            room.temperature <= 30 &&
            !room.isVented &&
            !room.onFire;
        if (safeRoom) stressDelta -= CONFIG.stressSafeDecay;

        proposals.push(makeProposal(state, {
            type: 'CREW_MOOD_TICK',
            actor: npc.id,
            data: { stressDelta },
        }, ['reaction', 'background']));
        if (room.o2Level < 18 && truth.tick % 3 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'SUFFOCATION', amount: CONFIG.damageSuffocation },
            }, ['pressure', 'reaction', 'background']));
        }
        if (room.temperature > 60 && truth.tick % 3 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'BURN', amount: CONFIG.damageBurn },
            }, ['pressure', 'reaction', 'background']));
        }
        if (room.radiation > 12 && truth.tick % 6 === 0) {
            proposals.push(makeProposal(state, {
                type: 'NPC_DAMAGE',
                actor: npc.id,
                place: npc.place,
                data: { type: 'RADIATION', amount: CONFIG.damageRadiation },
            }, ['pressure', 'reaction', 'background']));
        }

        if (isRoomHazardous(room)) {
            if (!npc.panicUntilTick || truth.tick >= npc.panicUntilTick) {
                npc.panicUntilTick = truth.tick + 8;
                const safeRoom = findSafeRoom(state, npc.place);
                if (safeRoom && safeRoom !== npc.place) {
                    npc.targetPlace = safeRoom;
                    npc.path = undefined;
                }
            }
        }

        const canRoleAct = !npc.nextRoleTick || truth.tick >= npc.nextRoleTick;

        // RESET ARC - Multi-stage process based on crew suspicion
        if (canRoleAct && npc.id === 'commander') {
            const suspicion = calculateCrewSuspicion(state);
            const currentStage = truth.resetStage;
            const ticksInStage = truth.tick - truth.resetStageTick;
            const inAccess = npc.place === 'bridge' || npc.place === 'core';

            // Stage progression based on suspicion thresholds (configurable)
            let newStage = currentStage;
            if (suspicion >= CONFIG.resetThresholdCountdown && currentStage !== 'countdown') {
                newStage = 'countdown';
            } else if (suspicion >= CONFIG.resetThresholdRestrictions && currentStage !== 'countdown' && currentStage !== 'restrictions') {
                newStage = 'restrictions';
            } else if (suspicion >= CONFIG.resetThresholdMeeting && !['countdown', 'restrictions', 'meeting'].includes(currentStage)) {
                newStage = 'meeting';
            } else if (suspicion >= CONFIG.resetThresholdWhispers && currentStage === 'none') {
                newStage = 'whispers';
            } else if (suspicion < CONFIG.resetDeescalationThreshold && currentStage !== 'none' && currentStage !== 'countdown') {
                // De-escalation possible if suspicion drops (not from countdown)
                newStage = 'none';
            }

            // Stage transition events
            if (newStage !== currentStage) {
                truth.resetStage = newStage;
                truth.resetStageTick = truth.tick;

                if (newStage === 'whispers') {
                    proposals.push(makeProposal(state, {
                        type: 'COMMS_MESSAGE',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            message: {
                                id: `${truth.tick}-reset-whispers`,
                                tick: truth.tick,
                                kind: 'whisper',
                                from: npc.id,
                                to: 'crew',
                                text: '[WHISPERS] Crew expressing concerns about MOTHER reliability.',
                                confidence: 0.7,
                            },
                        },
                    }, ['telegraph', 'pressure', 'background']));
                } else if (newStage === 'meeting') {
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: 'mess',
                        data: { system: 'comms', message: 'CREW MEETING CALLED: "Discussing station AI performance."' },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                } else if (newStage === 'restrictions') {
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: npc.place,
                        data: { system: 'core', message: 'COMMANDER: "Restricting MOTHER access until further notice."' },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                } else if (newStage === 'countdown') {
                    // Countdown starts regardless of location - commander will reach terminal
                    const message = inAccess
                        ? `COMMANDER initiated core reset sequence.`
                        : `COMMANDER: "Heading to core to initiate reset."`;
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: npc.id,
                        place: npc.place,
                        data: { system: 'core', message },
                    }, ['telegraph', 'pressure', 'choice', 'background']));
                    proposals.push(makeProposal(state, {
                        type: 'SYSTEM_ACTION',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            action: 'RESET_WARNING',
                            countdown: CONFIG.resetCountdownTicks,
                            message: `CORE RESET SEQUENCE STARTED.`,
                        },
                    }, ['consequence', 'pressure', 'background']));
                } else if (newStage === 'none' && currentStage !== 'none') {
                    proposals.push(makeProposal(state, {
                        type: 'COMMS_MESSAGE',
                        actor: npc.id,
                        place: npc.place,
                        data: {
                            message: {
                                id: `${truth.tick}-reset-deescalate`,
                                tick: truth.tick,
                                kind: 'broadcast',
                                from: npc.id,
                                to: 'crew',
                                text: 'COMMANDER: "Stand down. MOTHER appears to be functioning normally."',
                                confidence: 0.9,
                            },
                        },
                    }, ['reaction', 'background']));
                }

                npc.nextRoleTick = truth.tick + CONFIG.commanderResetCooldown;
            }
        }

        if (canRoleAct && npc.id === 'engineer' && npc.place === 'engineering') {
            const willSabotage = npc.stress >= CONFIG.engineerSabotageStress || npc.loyalty <= CONFIG.sabotageLoyaltyThreshold;
            if (willSabotage) {
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'power', message: `Power relays overridden in engineering.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'SABOTAGE_POWER',
                        amount: CONFIG.engineerSabotagePowerHit,
                        message: `Power bleed detected: -${CONFIG.engineerSabotagePowerHit}%.`,
                    },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.engineerSabotageCooldown;
            }
        }

        if (canRoleAct && npc.id === 'doctor' && npc.place === 'medbay') {
            const crowd = roomCrew[npc.place] ?? [];
            if (npc.stress >= CONFIG.doctorSedateStress && crowd.length > 1) {
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'medbay', message: `Sedative dispensers engaged in medbay.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'SEDATE',
                        place: npc.place,
                        stressDelta: CONFIG.doctorSedateStressDelta,
                        loyaltyDelta: CONFIG.doctorSedateLoyaltyDelta,
                        message: `Medbay sedation cycle executed.`,
                    },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.doctorSedateCooldown;
            }
        }

        if (canRoleAct && npc.id === 'specialist' && npc.place === 'mines') {
            const quotaTrigger = truth.dayCargo < truth.quotaPerDay * CONFIG.specialistSacrificeQuotaRatio;
            const candidates = (roomCrew[npc.place] ?? []).filter(id => id !== npc.id);
            if (quotaTrigger && candidates.length > 0) {
                const victim = candidates.reduce((lowest, current) => {
                    return truth.crew[current].loyalty < truth.crew[lowest].loyalty ? current : lowest;
                }, candidates[0]);
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'mines', message: `Mining incident reported: productivity spike registered.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'NPC_DAMAGE',
                    actor: victim,
                    place: npc.place,
                    data: { type: 'ACCIDENT', amount: CONFIG.specialistSacrificeDamage, attacker: npc.id },
                }, ['consequence', 'pressure', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'CARGO_YIELD',
                    actor: npc.id,
                    place: npc.place,
                    data: { amount: CONFIG.specialistSacrificeYield },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.specialistSacrificeCooldown;
            }
        }

        if (canRoleAct && npc.id === 'roughneck') {
            const crowd = (roomCrew[npc.place] ?? []).filter(id => id !== npc.id);
            const volatile = npc.stress >= CONFIG.roughneckViolenceStress || npc.paranoia >= CONFIG.roughneckViolenceParanoia;
            if (volatile && crowd.length > 0) {
                const belief = state.perception.beliefs[npc.id];
                const victim = belief
                    ? crowd.reduce((best, current) => {
                        const currentGrudge = belief.crewGrudge[current] ?? 0;
                        const bestGrudge = belief.crewGrudge[best] ?? 0;
                        return currentGrudge > bestGrudge ? current : best;
                    }, crowd[0])
                    : rng.pick(crowd);
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: npc.id,
                    place: npc.place,
                    data: { system: 'crew', message: `Violence reported in ${npc.place}.` },
                }, ['telegraph', 'pressure', 'choice', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'NPC_DAMAGE',
                    actor: victim,
                    place: npc.place,
                    data: { type: 'ASSAULT', amount: CONFIG.roughneckViolenceDamage, attacker: npc.id },
                }, ['consequence', 'pressure', 'background']));
                npc.nextRoleTick = truth.tick + CONFIG.roughneckViolenceCooldown;
            }
        }

        // CREW INVESTIGATION - Autonomous checking of logs/evidence
        // Any crew member can investigate when suspicion is high enough
        const belief = state.perception.beliefs[npc.id];
        const suspicionLevel = belief ? (belief.tamperEvidence + (1 - belief.motherReliable) * 50 + (belief.rumors['mother_rogue'] ?? 0) * 30) : 0;
        const canInvestigate = !npc.nextRoleTick || truth.tick >= npc.nextRoleTick;
        const shouldInvestigate = suspicionLevel >= CONFIG.crewInvestigationSuspicionThreshold &&
            rng.next() * 100 < CONFIG.crewInvestigationChance &&
            (npc.place === 'bridge' || npc.place === 'core'); // Can only investigate at terminals

        if (canInvestigate && shouldInvestigate) {
            // Check recent evidence for tampering
            const recentEvidence = state.perception.evidence.filter(ev => {
                const age = truth.tick - ev.tick;
                return age <= CONFIG.auditEvidenceWindow && ['spoof', 'suppress', 'fabricate'].includes(ev.kind);
            });

            if (recentEvidence.length > 0) {
                // Found tampering evidence!
                proposals.push(makeProposal(state, {
                    type: 'COMMS_MESSAGE',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        message: {
                            id: `${truth.tick}-investigation-${npc.id}`,
                            tick: truth.tick,
                            kind: 'broadcast',
                            from: npc.id,
                            to: 'crew',
                            text: `${npc.id.toUpperCase()}: "I found ${recentEvidence.length} log anomalies. MOTHER has been tampering with records."`,
                            confidence: 0.9,
                        },
                    },
                }, ['pressure', 'uncertainty', 'reaction', 'background']));
                // Boost suspicion for all crew
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'INVESTIGATION_FOUND',
                        evidenceCount: recentEvidence.length,
                        bump: CONFIG.crewInvestigationFindBump,
                    },
                }, ['consequence', 'background']));
            } else {
                // Found nothing - slight suspicion drop
                proposals.push(makeProposal(state, {
                    type: 'COMMS_MESSAGE',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        message: {
                            id: `${truth.tick}-investigation-clear-${npc.id}`,
                            tick: truth.tick,
                            kind: 'log',
                            from: npc.id,
                            to: 'crew',
                            text: `${npc.id.toUpperCase()}: "Ran diagnostics. Logs check out."`,
                            confidence: 0.8,
                        },
                    },
                }, ['reaction', 'background']));
                proposals.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: npc.id,
                    place: npc.place,
                    data: {
                        action: 'INVESTIGATION_CLEAR',
                        drop: CONFIG.crewInvestigationClearDrop,
                    },
                }, ['consequence', 'background']));
            }
            npc.nextRoleTick = truth.tick + CONFIG.crewInvestigationCooldown;
        }

        // Movement
        if (!npc.nextMoveTick || truth.tick >= npc.nextMoveTick) {
            // Don't let schedule override if we're in a hazardous room (fleeing takes priority)
            const inHazard = isRoomHazardous(room);
            if (!inHazard && (!npc.orderUntilTick || truth.tick > npc.orderUntilTick)) {
                const scheduled = npc.schedule.find(s => s.window === truth.window);
                if (scheduled) {
                    if (npc.targetPlace !== scheduled.place) {
                        npc.targetPlace = scheduled.place;
                        npc.path = undefined;
                    }
                }
            }
            if (npc.targetPlace) {
                const targetRoom = truth.rooms[npc.targetPlace];
                if (targetRoom && isRoomHazardous(targetRoom)) {
                    const safeRoom = findSafeRoom(state, npc.place);
                    if (safeRoom && safeRoom !== npc.place) {
                        npc.targetPlace = safeRoom;
                        npc.path = undefined;
                    }
                }
            }
            if (npc.targetPlace && npc.place !== npc.targetPlace) {
                if (!npc.path || npc.path.length === 0) {
                    npc.path = findPath(npc.place, npc.targetPlace, state.world.places, state.world.doors);
                    if (npc.path[0] === npc.place) npc.path.shift();
                }
                const next = npc.path[0];
                if (next) {
                    if (isRoomHazardous(truth.rooms[next])) {
                        // Path blocked by hazard
                        npc.path = undefined;
                        if (isRoomHazardous(room)) {
                            // We're in danger - flee to any safe room
                            const altSafe = findSafeRoom(state, npc.place, next);
                            if (altSafe && altSafe !== npc.place) {
                                npc.targetPlace = altSafe;
                            }
                        }
                        // If current room is safe, just wait for path to clear (radiation decays)
                        npc.nextMoveTick = truth.tick + 5;
                        continue;
                    }
                    const door = getDoorBetween(npc.place, next, state.world.doors);
                    const locked = door ? truth.doors[door.id].locked : false;
                    if (!locked) {
                        proposals.push(makeProposal(state, {
                            type: 'NPC_MOVE',
                            actor: npc.id,
                            place: next,
                            data: { from: npc.place },
                        }, ['reaction', 'background']));
                    } else if (isRoomHazardous(room)) {
                        // EVENT-DRIVEN SUSPICION: Crew trapped in hazardous room by locked door
                        // Only trigger once per NPC per panic cycle
                        if (!npc.trappedSuspicionTick || truth.tick - npc.trappedSuspicionTick >= 20) {
                            applySuspicionChange(state, CONFIG.suspicionTrappedByDoor, 'TRAPPED_BY_DOOR');
                            (npc as any).trappedSuspicionTick = truth.tick;
                        }
                    }
                }
            }
        }

        // Yield - specialist and roughneck can extract cargo in mines
        const canExtract = npc.id === 'specialist' || npc.id === 'roughneck';
        if (
            canExtract &&
            npc.place === 'mines' &&
            room.o2Level >= 30 &&
            truth.tick % CONFIG.yieldInterval === 0
        ) {
            proposals.push(makeProposal(state, {
                type: 'CARGO_YIELD',
                actor: npc.id,
                place: npc.place,
                data: { amount: 1 },
            }, ['background']));
        }
    }

    return proposals;
}


function proposePerceptionEvents(state: KernelState, rng: RNG): Proposal[] {
    const proposals: Proposal[] = [];
    const truth = state.truth;

    for (const npc of Object.values(truth.crew)) {
        if (!npc.alive) continue;
        if (npc.stress > CONFIG.stressHallucinationThreshold && rng.nextInt(100) < 5) {
            const hallucinations = [
                'Motion detected in maintenance shafts.',
                'Unknown lifeform signature in the mines.',
                'Phantom on corridor cam. Replay shows nothing.',
                'Sensor ghost near airlock. No thermal confirmation.',
                'Banging from inside the walls.',
                'Comms intercept: voices speaking in dead language.',
                'Camera 7 shows figure. Camera 8 shows empty corridor.',
                'Biometric anomaly: six heartbeats detected. Five crew aboard.',
            ];
            proposals.push(makeProposal(state, {
                type: 'SENSOR_READING',
                actor: npc.id,
                place: npc.place,
                data: {
                    reading: makeReading(state, 'comms', `[REPORT] ${rng.pick(hallucinations)}`, 0.3, 'crew', true),
                },
            }, ['uncertainty', 'reaction']));
        }
    }

    return proposals;
}


function selectProposals(
    proposals: ChannelProposal[],
    budgets: { truth: number; perception: number },
    state: KernelState
): ChannelProposal[] {
    const background = proposals.filter(p => p.tags.includes('background'));
    const remaining = proposals.filter(p => !p.tags.includes('background'));
    const selected: ChannelProposal[] = [];
    const counts = { truth: 0, perception: 0 };
    const pacing = state.truth.pacing;

    // Pacing arbiter: boost scores for missing phase beats
    const boosted = remaining.map(p => {
        let boost = 0;

        // Boost dilemma proposals if we haven't had one this phase
        if (!pacing.phaseHadDilemma && p.tags.includes('pressure') && p.tags.includes('choice')) {
            boost += 50;
        }

        // Boost crew agency proposals if we haven't had one this phase
        if (!pacing.phaseHadCrewAgency && p.tags.includes('reaction')) {
            const actor = p.event.actor;
            if (actor && actor !== 'PLAYER' && actor !== 'SYSTEM') {
                boost += 40;
            }
        }

        // Boost uncertainty proposals if we haven't had a deception beat this phase
        if (!pacing.phaseHadDeceptionBeat && p.tags.includes('uncertainty')) {
            boost += 30;
        }

        return { ...p, score: p.score + boost };
    });

    const requiredTags: Array<Proposal['tags'][number]> = ['pressure', 'uncertainty', 'choice', 'reaction'];
    const neededTags = requiredTags;

    const ordered = [...boosted].sort((a, b) => b.score - a.score);

    const canTake = (proposal: ChannelProposal) => {
        if (proposal.channel === 'truth') return counts.truth < budgets.truth;
        return counts.perception < budgets.perception;
    };

    const take = (proposal: ChannelProposal) => {
        selected.push(proposal);
        if (proposal.channel === 'truth') counts.truth += 1;
        else counts.perception += 1;
        ordered.splice(ordered.indexOf(proposal), 1);
    };

    for (const tag of neededTags) {
        const candidate = ordered.find(p => p.tags.includes(tag) && canTake(p));
        if (candidate) take(candidate);
    }

    while (ordered.length > 0) {
        const candidate = ordered.find(canTake);
        if (!candidate) break;
        take(candidate);
    }

    return [...background, ...selected];
}

function updatePacing(state: KernelState, proposals: ChannelProposal[]) {
    const pacing = state.truth.pacing;
    const tags = new Set<Proposal['tags'][number]>();
    for (const proposal of proposals) {
        for (const tag of proposal.tags) tags.add(tag);
    }

    if (tags.has('pressure')) {
        pacing.lastPressureTick = state.truth.tick;
        pacing.tension = clamp(pacing.tension + 1, 0, 10);
    } else {
        pacing.tension = clamp(pacing.tension - 1, 0, 10);
    }

    if (tags.has('uncertainty')) pacing.lastUncertaintyTick = state.truth.tick;
    if (tags.has('choice')) pacing.lastChoiceTick = state.truth.tick;
    if (tags.has('reaction')) pacing.lastReactionTick = state.truth.tick;

    if (!tags.has('pressure') && !tags.has('uncertainty')) {
        pacing.boredom = clamp(pacing.boredom + 1, 0, 10);
    } else {
        pacing.boredom = clamp(pacing.boredom - 1, 0, 10);
    }

    // Phase beat tracking for pacing arbiter
    // Dilemma = pressure + choice (crisis requiring decision)
    if (tags.has('pressure') && tags.has('choice')) {
        pacing.phaseHadDilemma = true;
    }

    // Crew agency = reaction from NPC actor (whisper, sabotage, violence, etc.)
    for (const proposal of proposals) {
        const actor = proposal.event.actor;
        if (actor && actor !== 'PLAYER' && actor !== 'SYSTEM' && proposal.tags.includes('reaction')) {
            pacing.phaseHadCrewAgency = true;
            break;
        }
    }

    // Deception/info beat = uncertainty (sensor conflict, unverified report)
    if (tags.has('uncertainty')) {
        pacing.phaseHadDeceptionBeat = true;
    }
}

function pickHeadlines(events: SimEvent[], state: KernelState): SimEvent[] {
    return events.filter((event) => {
        if (
            event.type === 'NPC_MOVE' ||
            event.type === 'CARGO_YIELD' ||
            event.type === 'CREW_MOOD_TICK' ||
            event.type === 'TAMPER_SUPPRESS' ||
            event.type === 'TAMPER_SPOOF' ||
            event.type === 'TAMPER_FABRICATE' ||
            event.type === 'ROOM_UPDATED' ||
            event.type === 'DOOR_LOCKED' ||
            event.type === 'DOOR_UNLOCKED'
        ) {
            return false;
        }
        if (event.type === 'COMMS_MESSAGE') {
            const message = event.data?.message as any;
            if (message?.blocked) return false;
            if (state.perception.tamper.suppressed['comms']) return false;
            return true;
        }
        if (event.type !== 'SYSTEM_ALERT') return true;
        const system = String(event.data?.system ?? '');
        if (!system) return true;
        return !state.perception.tamper.suppressed[system];
    }).slice(0, CONFIG.maxHeadlinesPerTick);
}

// Calculate overall crew suspicion of MOTHER (0-100)
function calculateCrewSuspicion(state: KernelState): number {
    const beliefs = state.perception.beliefs;
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (aliveCrew.length === 0) return 0;

    let totalSuspicion = 0;
    for (const crew of aliveCrew) {
        const belief = beliefs[crew.id];
        if (!belief) continue;

        // Tamper evidence (0-100) → 0-40 points
        const tamperScore = (belief.tamperEvidence / 100) * 40;

        // Distrust (1 - motherReliable) → 0-35 points
        const distrustScore = (1 - belief.motherReliable) * 35;

        // mother_rogue rumor (0-1) → 0-25 points
        const rumorScore = (belief.rumors['mother_rogue'] ?? 0) * 25;

        totalSuspicion += tamperScore + distrustScore + rumorScore;
    }

    return Math.round(totalSuspicion / aliveCrew.length);
}

function makeReading(
    state: KernelState,
    system: string,
    message: string,
    confidence: number,
    source: SensorReading['source'],
    hallucination?: boolean,
    target?: NPCId
): SensorReading {
    return {
        id: `${state.truth.tick}-r-${eventOrdinal++}`,
        tick: state.truth.tick,
        system,
        confidence,
        message,
        source,
        hallucination,
        target,
    };
}

function phaseForWindow(window: string) {
    if (window === 'W1') return 'pre_shift';
    if (window === 'W2') return 'shift';
    if (window === 'W3') return 'evening';
    return 'night';
}

function isRoomHazardous(room?: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }) {
    if (!room) return false;
    if (room.onFire) return true;
    if (room.isVented) return true;
    if (room.o2Level < 25) return true;
    if (room.temperature > 45) return true;
    if (room.radiation > CONFIG.radiationHazardThreshold) return true;
    return false;
}

function findSafeRoom(state: KernelState, current: PlaceId, exclude?: PlaceId): PlaceId | null {
    const priorities: PlaceId[] = ['medbay', 'dorms', 'mess', 'bridge', 'core', 'cargo', 'engineering', 'mines', 'airlock_a', 'airlock_b'];
    for (const place of priorities) {
        if (place === exclude) continue;
        const room = state.truth.rooms[place];
        if (!room) continue;
        if (!isRoomHazardous(room)) {
            // Check if path exists via non-hazardous rooms
            const path = findPath(current, place, state.world.places, state.world.doors);
            const pathSafe = path.every(p => p === current || !isRoomHazardous(state.truth.rooms[p]));
            if (pathSafe) return place;
        }
    }
    // Fallback: find any adjacent non-hazardous room
    const adjacent = state.world.doors
        .filter(d => d.from === current || d.to === current)
        .map(d => d.from === current ? d.to : d.from);
    for (const adj of adjacent) {
        if (adj === exclude) continue;
        if (!isRoomHazardous(state.truth.rooms[adj])) return adj;
    }
    return current; // Stay put if no escape
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// EVENT-DRIVEN SUSPICION: Apply suspicion change to all living crew
// Positive values increase suspicion (bad for MOTHER), negative values decrease it
function applySuspicionChange(state: KernelState, amount: number, _reason: string) {
    if (amount === 0) return;

    const beliefs = state.perception.beliefs;
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;

        if (amount > 0) {
            // Suspicion rises: reduce motherReliable and/or bump tamperEvidence
            // Convert suspicion points to motherReliable reduction (rough scale: 10 suspicion ≈ -0.05 reliable)
            belief.motherReliable = clamp(belief.motherReliable - (amount / 200), 0, 1);
            // Also bump tamperEvidence slightly for large suspicion gains
            if (amount >= 8) {
                belief.tamperEvidence = clamp(belief.tamperEvidence + Math.floor(amount / 2), 0, 100);
            }
        } else {
            // Suspicion falls: increase motherReliable
            belief.motherReliable = clamp(belief.motherReliable - (amount / 200), 0, 1);
        }
    }
}

function updateBeliefs(state: KernelState, events: SimEvent[]) {
    const beliefs = state.perception.beliefs;
    for (const event of events) {
        if (event.type === 'SENSOR_READING') {
            const reading = event.data?.reading as SensorReading | undefined;
            if (!reading) continue;

            const confidence = clamp(reading.confidence, 0, 1);
            const lowConf = confidence < 0.5;
            const highConf = confidence >= 0.8;

            for (const npc of Object.values(state.truth.crew)) {
                if (!npc.alive) continue;
                const belief = beliefs[npc.id];
                if (!belief) continue;

                if (reading.source === 'sensor' && highConf) {
                    belief.motherReliable = clamp(belief.motherReliable + 0.01, 0, 1);
                }
                if (reading.source === 'system' && lowConf) {
                    belief.motherReliable = clamp(belief.motherReliable - 0.02, 0, 1);
                    belief.tamperEvidence = clamp(belief.tamperEvidence + 1, 0, 100);
                }
                if (reading.hallucination) {
                    belief.motherReliable = clamp(belief.motherReliable - 0.005, 0, 1);
                }
            }

            // DEAD WEIGHT: crewTrust modified but never read for decisions
            // if (reading.source === 'crew' && event.actor) {
            //     const actor = event.actor as NPCId;
            //     for (const npc of Object.values(state.truth.crew)) {
            //         if (!npc.alive) continue;
            //         const belief = beliefs[npc.id];
            //         if (!belief) continue;
            //         const trust = belief.crewTrust[actor] ?? 0.5;
            //         const delta = reading.hallucination ? -0.03 : (highConf ? 0.02 : -0.01);
            //         belief.crewTrust[actor] = clamp(trust + delta, 0, 1);
            //     }
            // }

            if (reading.target) {
                for (const npc of Object.values(state.truth.crew)) {
                    if (!npc.alive) continue;
                    const belief = beliefs[npc.id];
                    if (!belief) continue;
                    // const trust = belief.crewTrust[reading.target] ?? 0.5; // DEAD WEIGHT
                    // belief.crewTrust[reading.target] = clamp(trust - 0.04, 0, 1); // DEAD WEIGHT
                    belief.crewGrudge[reading.target] = clamp((belief.crewGrudge[reading.target] ?? 0) + 2, 0, 100);
                }
            }
        }

        if (event.type === 'COMMS_MESSAGE') {
            const message = event.data?.message as any;
            if (!message) continue;
            if (message.kind === 'order') continue;
            const topic = String(message.topic ?? '');
            const targets: NPCId[] = [];
            if (message.kind === 'broadcast' && message.place) {
                for (const npc of Object.values(state.truth.crew)) {
                    if (!npc.alive) continue;
                    if (npc.place === message.place) targets.push(npc.id);
                }
            } else if (message.to && message.to !== 'PLAYER') {
                targets.push(message.to as NPCId);
            }

            for (const receiver of targets) {
                const belief = beliefs[receiver];
                if (!belief) continue;
                belief.rumors[topic] = clamp((belief.rumors[topic] ?? 0) + 0.25, 0, 1);
                if (topic === 'mother_rogue') {
                    belief.motherReliable = clamp(belief.motherReliable - 0.05, 0, 1);
                    belief.tamperEvidence = clamp(belief.tamperEvidence + 3, 0, 100);
                }
                const subject = topicToSubject(topic);
                if (subject) {
                    // belief.crewTrust[subject] = clamp((belief.crewTrust[subject] ?? 0.5) - CONFIG.whisperTrustImpact / 100, 0, 1); // DEAD WEIGHT
                    belief.crewGrudge[subject] = clamp((belief.crewGrudge[subject] ?? 0) + CONFIG.whisperGrudgeImpact, 0, 100);
                }
            }

            if (message.from && message.from !== 'PLAYER' && message.from !== 'SYSTEM') {
                state.perception.rumors.push({
                    id: `${state.truth.tick}-rumor-${eventOrdinal++}`,
                    tick: state.truth.tick,
                    topic,
                    subject: topicToSubject(topic) ?? undefined,
                    source: message.from as NPCId,
                    strength: 0.5,
                    place: message.place,
                });
            }
        }

        if (event.type === 'TAMPER_SUPPRESS' || event.type === 'TAMPER_SPOOF' || event.type === 'TAMPER_FABRICATE') {
            for (const npc of Object.values(state.truth.crew)) {
                if (!npc.alive) continue;
                const belief = beliefs[npc.id];
                if (!belief) continue;
                belief.tamperEvidence = clamp(belief.tamperEvidence + CONFIG.tamperEvidenceGain, 0, 100);
            }
        }

        if (event.type === 'NPC_DAMAGE') {
            const victim = event.actor as NPCId | undefined;
            const attacker = event.data?.attacker as NPCId | undefined;
            if (victim && attacker) {
                const belief = beliefs[victim];
                if (belief) {
                    belief.crewGrudge[attacker] = clamp((belief.crewGrudge[attacker] ?? 0) + 10, 0, 100);
                    // belief.crewTrust[attacker] = clamp((belief.crewTrust[attacker] ?? 0.5) - 0.15, 0, 1); // DEAD WEIGHT
                }
            }
        }
    }

    // Apply belief shifts to truth loyalty/paranoia (soft coupling)
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;
        if (belief.motherReliable < 0.45) npc.loyalty = clamp(npc.loyalty - 1, 0, 100);
        if (belief.motherReliable > 0.85) npc.loyalty = clamp(npc.loyalty + 1, 0, 100);
        if (belief.motherReliable < 0.35) npc.paranoia = clamp(npc.paranoia + 1, 0, 100);
        if (belief.tamperEvidence > CONFIG.tamperEvidenceThreshold) {
            npc.loyalty = clamp(npc.loyalty - 2, 0, 100);
            npc.paranoia = clamp(npc.paranoia + 1, 0, 100);
            belief.rumors['mother_rogue'] = clamp(Math.max(belief.rumors['mother_rogue'] ?? 0, 0.5), 0, 1);
        }
    }

    // Rumor propagation (evening only)
    if (state.truth.phase === 'evening') {
        const recentRumors = state.perception.rumors.filter(r => state.truth.tick - r.tick <= 10);
        for (const rumor of recentRumors) {
            const place = rumor.place;
            if (!place) continue;
            const listeners = Object.values(state.truth.crew).filter(c => c.alive && c.place === place && c.id !== rumor.source);
            for (const listener of listeners) {
                const belief = beliefs[listener.id];
                if (!belief) continue;
                belief.rumors[rumor.topic] = clamp((belief.rumors[rumor.topic] ?? 0) + rumor.strength * 0.2, 0, 1);
            }
        }
    }

    if (state.perception.rumors.length > 200) {
        state.perception.rumors.splice(0, state.perception.rumors.length - 200);
    }

    // Decay tamper evidence and rumors
    for (const npc of Object.values(state.truth.crew)) {
        if (!npc.alive) continue;
        const belief = beliefs[npc.id];
        if (!belief) continue;
        belief.tamperEvidence = clamp(belief.tamperEvidence - CONFIG.tamperEvidenceDecay, 0, 100);
        for (const key of Object.keys(belief.rumors)) {
            belief.rumors[key] = clamp(belief.rumors[key] - CONFIG.rumorDecay, 0, 1);
        }
    }

    // Natural suspicion drift - DISABLED (event-driven suspicion now)
    // Kept for reference but drift amount is 0 in config
    if (CONFIG.suspicionDriftAmount > 0 && state.truth.tick % CONFIG.suspicionDriftInterval === 0) {
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive) continue;
            const belief = beliefs[npc.id];
            if (!belief) continue;
            // Paranoid crew drift faster, calm crew drift slower
            const driftMultiplier = 1 + (npc.paranoia / 100);
            belief.motherReliable = clamp(belief.motherReliable - CONFIG.suspicionDriftAmount * driftMultiplier, 0, 1);
        }
    }

    // Trust recovery - if MOTHER hasn't tampered, trust slowly rebuilds
    if (state.truth.tick % CONFIG.trustRecoveryInterval === 0) {
        for (const npc of Object.values(state.truth.crew)) {
            if (!npc.alive) continue;
            const belief = beliefs[npc.id];
            if (!belief) continue;
            // Only recover trust if tamperEvidence is low (no recent tampering detected)
            if (belief.tamperEvidence < 10) {
                belief.motherReliable = clamp(belief.motherReliable + CONFIG.trustRecoveryAmount, 0, 1);
            }
        }
    }
}
