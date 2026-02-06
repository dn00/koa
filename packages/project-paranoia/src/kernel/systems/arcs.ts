import { CONFIG } from '../../config.js';
import type { RNG } from '../../core/rng.js';
import type { KernelState, Proposal, ArcKind, PlaceId } from '../types.js';
import { makeProposal } from '../proposals.js';
import { applySuspicionChange } from './beliefs.js';

// Track crisis starts/resolutions for event-driven suspicion
function trackCrisisStart(state: KernelState, arcId: string, targetPlace: PlaceId) {
    state.truth.activeCrisisStarts[arcId] = state.truth.tick;
    state.truth.dayIncidents += 1;

    // Check if crew is nearby to witness the crisis
    const crewNearby = Object.values(state.truth.crew).filter(c => {
        if (!c.alive) return false;
        if (c.place === targetPlace) return true;
        // Check adjacency via doors
        const adjacent = state.world.doors
            .filter(d => d.a === targetPlace || d.b === targetPlace)
            .map(d => d.a === targetPlace ? d.b : d.a);
        return adjacent.includes(c.place);
    });

    if (crewNearby.length > 0) {
        applySuspicionChange(state, CONFIG.suspicionCrisisWitnessed, 'CRISIS_WITNESSED', `Crisis in ${targetPlace}`);
    }
}

function trackCrisisResolution(state: KernelState, arcId: string) {
    const startTick = state.truth.activeCrisisStarts[arcId];
    if (startTick !== undefined) {
        const resolutionTime = state.truth.tick - startTick;
        if (resolutionTime <= CONFIG.crisisResolveQuickTicks) {
            // Quick resolution - suspicion drops (good for MOTHER)
            applySuspicionChange(state, CONFIG.suspicionCrisisResolved, 'CRISIS_RESOLVED', `${arcId} resolved in ${resolutionTime} ticks`);

            // Heroic response bonus: if there were deaths but crisis was contained quickly
            if (state.truth.dayDeaths > 0) {
                applySuspicionChange(state, CONFIG.suspicionHeroicResponse, 'CRISIS_RESOLVED', `Heroic response to ${arcId}`);
            }
        }
        delete state.truth.activeCrisisStarts[arcId];
    }
}

let arcOrdinal = 0;

const ARC_KINDS: ArcKind[] = ['air_scrubber', 'power_surge', 'ghost_signal', 'fire_outbreak', 'radiation_leak', 'solar_flare'];

export function proposeArcEvents(state: KernelState, rng: RNG): { truth: Proposal[]; perception: Proposal[] } {
    const truth: Proposal[] = [];
    const perception: Proposal[] = [];
    const { pacing } = state.truth;

    const remaining: KernelState['truth']['arcs'] = [];
    let advances = 0;

    for (const arc of state.truth.arcs) {
        if (state.truth.tick < arc.nextTick || advances >= CONFIG.maxThreatAdvancesPerTick) {
            remaining.push(arc);
            continue;
        }

        const step = arc.stepIndex;
        const target = arc.target;

        // EVENT-DRIVEN SUSPICION: Track crisis start at step 0
        if (step === 0) {
            trackCrisisStart(state, arc.id, target);
        }

        if (arc.kind === 'air_scrubber') {
            if (step === 0) {
                if (!state.perception.tamper.suppressed['air']) {
                    truth.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: 'SYSTEM',
                        place: target,
                        data: { system: 'air', message: `[SENSOR] ${target.toUpperCase()}: Air scrubber load increasing.` },
                    }, ['telegraph', 'uncertainty', 'choice', 'background']));
                }
            } else if (step === 1) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { o2Level: Math.max(0, state.truth.rooms[target].o2Level - 8) },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 2) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { o2Level: Math.max(0, state.truth.rooms[target].o2Level - 15) },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 3) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { o2Level: Math.max(0, state.truth.rooms[target].o2Level - 25) },
                }, ['pressure', 'consequence', 'background']));
            }
        } else if (arc.kind === 'power_surge') {
            if (step === 0) {
                if (!state.perception.tamper.suppressed['power']) {
                    truth.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: 'SYSTEM',
                        place: target,
                        data: { system: 'power', message: `Power harmonics unstable near ${target.toUpperCase()}.` },
                    }, ['telegraph', 'uncertainty', 'choice', 'background']));
                }
            } else if (step === 1) {
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: 'SYSTEM',
                    place: target,
                    data: { action: 'POWER_SURGE', amount: 8 },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 2) {
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: 'SYSTEM',
                    place: target,
                    data: { action: 'POWER_SURGE', amount: 12 },
                }, ['pressure', 'consequence', 'background']));
            }
        } else if (arc.kind === 'ghost_signal') {
            if (step === 0) {
                perception.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        reading: {
                            id: `${state.truth.tick}-r-ghost-${arc.id}`,
                            tick: state.truth.tick,
                            system: 'comms',
                            confidence: 0.4,
                            message: `[SENSOR] Faint tapping detected near ${target.toUpperCase()}.`,
                            source: 'system',
                        },
                    },
                }, ['uncertainty', 'telegraph', 'choice', 'background']));
            } else if (step === 1) {
                perception.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        reading: {
                            id: `${state.truth.tick}-r-ghost-${arc.id}-log`,
                            tick: state.truth.tick,
                            system: 'comms',
                            confidence: 0.35,
                            message: `[LOG] Ghost transmission fragment recovered.`,
                            source: 'system',
                        },
                    },
                }, ['uncertainty', 'reaction', 'background']));
            } else if (step === 2) {
                perception.push(makeProposal(state, {
                    type: 'SENSOR_READING',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        reading: {
                            id: `${state.truth.tick}-r-ghost-${arc.id}-voices`,
                            tick: state.truth.tick,
                            system: 'comms',
                            confidence: 0.3,
                            message: `[REPORT] Crew reports voices in the bulkheads.`,
                            source: 'crew',
                            hallucination: true,
                        },
                    },
                }, ['uncertainty', 'reaction', 'background']));
            }
        } else if (arc.kind === 'fire_outbreak') {
            if (step === 0) {
                if (!state.perception.tamper.suppressed['thermal']) {
                    truth.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: 'SYSTEM',
                        place: target,
                        data: { system: 'thermal', message: `Thermal spike detected in ${target.toUpperCase()}.` },
                    }, ['telegraph', 'uncertainty', 'choice', 'background']));
                }
            } else if (step === 1) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        onFire: false,
                        temperature: Math.max(state.truth.rooms[target].temperature, 40),
                    },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 2) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        onFire: true,
                        temperature: Math.max(state.truth.rooms[target].temperature, 55),
                    },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 3) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: {
                        integrity: Math.max(0, state.truth.rooms[target].integrity - 8),
                        temperature: Math.max(state.truth.rooms[target].temperature, 70),
                    },
                }, ['pressure', 'consequence', 'background']));
            }
        } else if (arc.kind === 'radiation_leak') {
            if (step === 0) {
                if (!state.perception.tamper.suppressed['radiation']) {
                    truth.push(makeProposal(state, {
                        type: 'SYSTEM_ALERT',
                        actor: 'SYSTEM',
                        place: target,
                        data: { system: 'radiation', message: `Radiation leak detected near ${target.toUpperCase()}.` },
                    }, ['telegraph', 'uncertainty', 'choice', 'background']));
                }
            } else if (step === 1) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { radiation: state.truth.rooms[target].radiation + 4 },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 2) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { radiation: state.truth.rooms[target].radiation + 7 },
                }, ['pressure', 'consequence', 'background']));
            } else if (step === 3) {
                truth.push(makeProposal(state, {
                    type: 'ROOM_UPDATED',
                    actor: 'SYSTEM',
                    place: target,
                    data: { radiation: state.truth.rooms[target].radiation + 10 },
                }, ['pressure', 'consequence', 'background']));
            }
        } else if (arc.kind === 'solar_flare') {
            if (step === 0) {
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: 'SYSTEM',
                    data: { system: 'stellar', message: `[!!! STELLAR OBSERVATORY !!!] Anomalous stellar activity detected.` },
                }, ['telegraph', 'uncertainty', 'choice', 'background']));
            } else if (step === 1) {
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: 'SYSTEM',
                    data: { system: 'stellar', message: `[!!! CME INCOMING !!!] Coronal mass ejection detected. Brace for impact.` },
                }, ['telegraph', 'pressure', 'background']));
            } else if (step === 2) {
                // Extended blackout
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ACTION',
                    actor: 'SYSTEM',
                    data: {
                        action: 'SOLAR_FLARE_IMPACT',
                        blackoutTicks: CONFIG.solarFlareBlackoutTicks,
                        commsDamage: 30,
                    },
                }, ['pressure', 'consequence', 'background']));
                truth.push(makeProposal(state, {
                    type: 'SYSTEM_ALERT',
                    actor: 'SYSTEM',
                    data: { system: 'stellar', message: `[!!! IMPACT !!!] Solar flare hit. Sensors offline. Comms degraded.` },
                }, ['pressure', 'reaction', 'background']));
            }
        }

        advances += 1;
        const maxStep = getArcMaxStep(arc.kind);
        if (step >= maxStep) {
            // EVENT-DRIVEN SUSPICION: Track crisis resolution
            trackCrisisResolution(state, arc.id);
            // Prevent same arc kind from respawning immediately
            state.truth.arcKindCooldowns[arc.kind] = state.truth.tick + CONFIG.arcKindRespawnCooldown;
            continue;
        }

        arc.stepIndex = Math.min(maxStep, arc.stepIndex + 1);
        arc.nextTick = scheduleNextArcTick(state, rng, pacing);
        remaining.push(arc);
    }

    state.truth.arcs = remaining;
    return { truth, perception };
}

/** Try to create a new arc. Returns true if created, false if at max capacity. */
export function tryActivateArc(state: KernelState, rng: RNG, maxActiveThreats = CONFIG.maxActiveThreats): boolean {
    if (state.truth.arcs.length >= maxActiveThreats) return false;
    const kind = pickArcKind(state.truth, rng);
    state.truth.arcs.push(createArc(state, kind, rng));
    return true;
}

function pickArcKind(truth: KernelState['truth'], rng: RNG): ArcKind {
    const activeKinds = new Set(truth.arcs.map(a => a.kind));
    const available = ARC_KINDS.filter(kind => {
        if (activeKinds.has(kind)) return false;
        const cooldownUntil = truth.arcKindCooldowns[kind];
        if (cooldownUntil !== undefined && truth.tick < cooldownUntil) return false;
        return true;
    });
    if (available.length === 0) return ARC_KINDS[0];
    return rng.pick(available);
}

function createArc(state: KernelState, kind: ArcKind, rng: RNG) {
    return {
        id: `${kind}-${state.truth.tick}-${arcOrdinal++}`,
        kind,
        stepIndex: 0,
        // CALMER: First step after 10-20 ticks (was 4-10)
        nextTick: state.truth.tick + 10 + rng.nextInt(10),
        target: pickArcTarget(state, kind, rng),
    };
}

function pickArcTarget(state: KernelState, kind: ArcKind, rng: RNG): PlaceId {
    if (kind === 'power_surge') return 'engineering';
    if (kind === 'radiation_leak') return rng.pick(['core', 'engineering']);
    if (kind === 'solar_flare') return 'bridge'; // Station-wide, but anchored to bridge
    const occupied = Object.values(state.truth.crew)
        .filter(c => c.alive)
        .map(c => c.place);
    if (occupied.length > 0) return rng.pick(occupied);
    return rng.pick(state.world.places).id;
}

function scheduleNextArcTick(state: KernelState, rng: RNG, pacing: KernelState['truth']['pacing']): number {
    // CALMER: Arc steps every 15-30 ticks (was 8-15)
    let delay = 15 + rng.nextInt(15);
    if (pacing.boredom >= CONFIG.boredomThreshold) delay -= 3;
    if (pacing.tension >= CONFIG.tensionThreshold) delay += 5;
    delay = Math.max(8, delay);
    return state.truth.tick + delay;
}

function getArcMaxStep(kind: ArcKind): number {
    if (kind === 'air_scrubber') return 3;
    if (kind === 'power_surge') return 2;
    if (kind === 'fire_outbreak') return 3;
    if (kind === 'radiation_leak') return 3;
    if (kind === 'solar_flare') return 2;
    return 2;
}
