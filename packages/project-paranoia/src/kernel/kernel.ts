import { CONFIG } from '../config.js';
import type { RNG } from '../core/rng.js';
import { getWindowForTick, TICKS_PER_DAY } from '../core/time.js';
import type { KernelState, KernelOutput, Proposal, SimEvent, SensorReading, RoomSnapshot, CrewSighting, CommsMessage } from './types.js';
import type { PlaceId, NPCId } from '../core/types.js';
import { makeProposal } from './proposals.js';
import { proposeCommandEvents, type Command } from './commands.js';
import { proposeCommsEvents } from './systems/comms.js';
import { proposeArcEvents } from './systems/arcs.js';
import { maybeActivatePressure } from './systems/pressure.js';
import { proposeCrewEvents } from './systems/crew.js';
import { decayTamper, tickSystems, tickPassiveObservation } from './systems/physics.js';
import { applySuspicionChange, updateBeliefs } from './systems/beliefs.js';
import { checkSuppressBackfire, checkSpoofBackfire, checkFabricateBackfire, decayDoubts } from './systems/backfire.js';
import { clamp } from './utils.js';

export type { Command } from './commands.js';

let eventOrdinal = 0;
type ChannelProposal = Proposal & { channel: 'truth' | 'perception' };

function getSeverityForSystem(system: string): 1 | 2 | 3 {
    if (system === 'thermal' || system === 'fire') return 3;
    if (system === 'air' || system === 'o2' || system === 'power' || system === 'radiation') return 2;
    return 1; // comms and other systems
}

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
        state.truth.pacing.phaseCommsCount = 0;
    }

    if (state.truth.tick > 0 && state.truth.tick % TICKS_PER_DAY === 0) {
        if (state.truth.dayCargo < state.truth.quotaPerDay) {
            // EVENT-DRIVEN SUSPICION: Quota missed → suspicion rises
            applySuspicionChange(state, CONFIG.suspicionQuotaMissed, 'QUOTA_MISSED', `Day ${state.truth.day}: ${state.truth.dayCargo}/${state.truth.quotaPerDay} cargo`);
            state.truth.ending = 'DECOMMISSIONED';
            const ending = makeEvent('SYSTEM_ALERT', state, { message: 'DECOMMISSIONED: quota failure.' });
            return { state, events: [ending], headlines: [ending] };
        }

        // EVENT-DRIVEN SUSPICION: Day end bonuses
        if (state.truth.dayIncidents <= CONFIG.quietDayIncidentThreshold) {
            // Quiet day (≤1 incident) - suspicion drops
            applySuspicionChange(state, CONFIG.suspicionQuietDay, 'QUIET_DAY', `Day ${state.truth.day}: no major incidents`);
        }
        if (state.truth.dayCargo > state.truth.quotaPerDay) {
            // Quota exceeded - suspicion drops
            applySuspicionChange(state, CONFIG.suspicionQuotaExceeded, 'QUOTA_EXCEEDED', `Day ${state.truth.day}: ${state.truth.dayCargo}/${state.truth.quotaPerDay} cargo`);
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
    checkSuppressBackfire(state);
    checkSpoofBackfire(state);
    checkFabricateBackfire(state);
    cleanupTamperOps(state);
    decayDoubts(state);

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

    // Pressure routing: suspicion-aware activation before proposal generation
    const pressureProposals = maybeActivatePressure(state, rng);

    const truthProposals: Proposal[] = [];
    truthProposals.push(...proposePhaseTransitions(state, previousWindow));
    truthProposals.push(...proposeCrewEvents(state, rng));

    const arcProposals = proposeArcEvents(state, rng);
    truthProposals.push(...arcProposals.truth);

    const perceptionProposals = [
        ...proposePerceptionEvents(state, rng),
        ...proposeCommsEvents(state, rng),
        ...arcProposals.perception,
        ...pressureProposals,
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

                // Task 010: Resolve active doubt if targeting one
                const hasDoubt = Boolean(event.data?.hasDoubt);
                const doubtId = event.data?.doubtId as string | undefined;
                let verifyDetail = 'Cross-referenced telemetry';
                if (hasDoubt && doubtId) {
                    const doubt = perception.activeDoubts.find(d => d.id === doubtId);
                    if (doubt) {
                        doubt.resolved = true;
                        verifyDetail = `Cleared doubt: ${doubt.topic}`;
                        if (doubt.relatedOpId) {
                            const relatedOp = perception.tamperOps.find(o => o.id === doubt.relatedOpId);
                            if (relatedOp) relatedOp.status = 'RESOLVED';
                        }
                    }
                }

                // Apply suspicion reduction to all crew
                applySuspicionChange(state, suspicionDrop, 'VERIFY_TRUST', verifyDetail);

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
                    applySuspicionChange(state, CONFIG.suspicionOrderRefused, 'ORDER_REFUSED', `${target} refused order`);
                    break;
                }
                // EVENT-DRIVEN SUSPICION: Successful order builds trust (capped per day)
                if (truth.dayOrderTrust < CONFIG.orderTrustCapPerDay) {
                    applySuspicionChange(state, CONFIG.suspicionOrderCompleted, 'ORDER_COMPLETED', `${target} complied`);
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
                applySuspicionChange(state, bump, 'INVESTIGATION_FOUND', `${event.actor} found evidence`);
                for (const crewId of Object.keys(perception.beliefs) as NPCId[]) {
                    const belief = perception.beliefs[crewId];
                    if (belief) {
                        belief.tamperEvidence = clamp(belief.tamperEvidence + bump, 0, 100);
                    }
                }
            }
            if (action === 'INVESTIGATION_CLEAR') {
                // Crew found nothing - mild suspicion drop for investigator
                const drop = Number(event.data?.drop ?? CONFIG.crewInvestigationClearDrop);
                applySuspicionChange(state, -drop, 'INVESTIGATION_CLEAR', `${event.actor} found nothing`);
                const investigator = event.actor as NPCId | undefined;
                if (investigator && perception.beliefs[investigator]) {
                    const belief = perception.beliefs[investigator];
                    belief.tamperEvidence = clamp(belief.tamperEvidence - drop, 0, 100);
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
                    const attacker = event.data?.attacker as NPCId | undefined;
                    const damageType = String(event.data?.type ?? 'unknown');
                    if (!crew.alive) {
                        // Crew member died - big suspicion spike, track for heroic response
                        applySuspicionChange(state, CONFIG.suspicionCrewDied, 'CREW_DIED', `${event.actor} died`);
                        truth.dayDeaths += 1;
                    } else if (attacker && damageType === 'ASSAULT') {
                        // Crew member attacked by another crew member
                        applySuspicionChange(state, CONFIG.suspicionCrewInjured, 'CREW_ATTACKED', `${event.actor} attacked by ${attacker}`);
                    } else {
                        // Crew member injured by environment
                        applySuspicionChange(state, CONFIG.suspicionCrewInjured, 'CREW_INJURED', `${event.actor} injured`);
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

                // Create TamperOp for backfire tracking
                perception.tamperOps.push({
                    id: `suppress-${truth.tick}-${system}`,
                    kind: 'SUPPRESS',
                    tick: truth.tick,
                    target: { system },
                    windowEndTick: truth.tick + duration,
                    status: 'PENDING',
                    severity: getSeverityForSystem(system),
                    crewAffected: [],
                });
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

            // Create TamperOp for backfire tracking
            if (event.type === 'TAMPER_SPOOF') {
                const spoofSystem = String(event.data?.system ?? '');
                perception.tamperOps.push({
                    id: `spoof-${truth.tick}-${spoofSystem}`,
                    kind: 'SPOOF',
                    tick: truth.tick,
                    target: { system: spoofSystem },
                    windowEndTick: truth.tick + CONFIG.spoofBackfireWindow,
                    status: 'PENDING',
                    severity: getSeverityForSystem(spoofSystem),
                    crewAffected: [],
                });
            } else {
                const fabricateTarget = event.target as NPCId | undefined;
                perception.tamperOps.push({
                    id: `fabricate-${truth.tick}-${fabricateTarget ?? 'unknown'}`,
                    kind: 'FABRICATE',
                    tick: truth.tick,
                    target: { npc: fabricateTarget },
                    windowEndTick: truth.tick + CONFIG.fabricateBackfireWindow,
                    status: 'PENDING',
                    severity: 3,
                    crewAffected: [],
                });
            }

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
                perception.comms.messages.push(event.data.message as CommsMessage);
                if (perception.comms.messages.length > 200) perception.comms.messages.shift();
                const message = event.data.message as CommsMessage;
                if (message?.place && message?.kind === 'whisper') {
                    perception.comms.lastWhisperByPlace[message.place] = message;
                }
            }
            break;
        }
        default:
            break;
    }

    // Deferred side effects from pressure proposals — only applied when event is committed
    if (event.data?.pressureDoubt) {
        perception.activeDoubts.push(event.data.pressureDoubt as any);
    }
    if (event.data?.pressureSuspicion) {
        const ps = event.data.pressureSuspicion as { delta: number; reason: string; detail: string };
        applySuspicionChange(state, ps.delta, ps.reason, ps.detail);
    }
}

function cleanupTamperOps(state: KernelState): void {
    const cutoff = state.truth.tick - 240;
    state.perception.tamperOps = state.perception.tamperOps.filter(
        op => op.status === 'PENDING' || Math.max(op.tick, op.backfireTick ?? 0, op.confessedTick ?? 0) > cutoff
    );
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


