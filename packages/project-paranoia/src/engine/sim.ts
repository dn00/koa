/**
 * KOA Casefiles - Simulation Engine (Refactored for PARANOIA)
 *
 * Runs NPC routines and crisis execution in real-time.
 */

import type { World, SimEvent, WindowId, NPCId, PlaceId } from '../core/types.js';
import type { RNG } from '../core/rng.js';
import { findPath, getDoorBetween } from '../core/world.js';
import { CONFIG } from '../config.js';

// ============================================================================
// NPC State Tracking
// ============================================================================

export interface NPCState {
    id: NPCId;
    currentPlace: PlaceId;
    distracted?: string; // Activity if distracted

    // Paranoia / Real-time State
    targetPlace?: PlaceId;
    path?: PlaceId[];
    nextMoveTick?: number;
    panicUntilTick?: number;
    alive: boolean;
    stress: number;
    loyalty: number;
    paranoia: number;
    nextHallucinationTick?: number;
    nextWhisperTick?: number;
    nextSabotageTick?: number;
}

export function initNPCStates(world: World): Map<NPCId, NPCState> {
    const states = new Map<NPCId, NPCState>();
    for (const npc of world.npcs) {
        // Start at their W1 scheduled location
        const firstEntry = npc.schedule.find(s => s.window === 'W1');
        states.set(npc.id, {
            id: npc.id,
            currentPlace: firstEntry?.place ?? 'dorms',
            alive: true,
            stress: 10,
            loyalty: 60,
            paranoia: 0,
        });
    }
    return states;
}

// ============================================================================
// Routine Simulation
// ============================================================================

let eventOrdinal = 0;

function createEvent(
    tick: number,
    window: WindowId,
    type: SimEvent['type'],
    fields: Partial<SimEvent>
): SimEvent {
    const event: SimEvent = {
        id: '', // Will be computed
        tick,
        window,
        type,
        ...fields,
    };

    // Compute deterministic event ID
    event.id = `${tick}-${eventOrdinal++}`;

    return event;
}

/**
 * Run a single tick of the simulation.
 * This is the "Paranoia Mode" engine.
 */
// ... (imports)
import { SystemsManager } from './systems.js';

// ... (initNPCStates)

export function stepSimulation(
    world: World,
    npcStates: Map<NPCId, NPCState>,
    tick: number,
    window: WindowId,
    rng: RNG,
    systems: SystemsManager // NEW DEPENDENCY
): SimEvent[] {
    const events: SimEvent[] = [];

    // TICK PHYSICS
    systems.tick();

    const occupancy = new Map<PlaceId, number>();
    for (const npc of world.npcs) {
        const state = npcStates.get(npc.id)!;
        if (!state.alive) continue;
        occupancy.set(state.currentPlace, (occupancy.get(state.currentPlace) ?? 0) + 1);
    }

    for (const npc of world.npcs) {
        const state = npcStates.get(npc.id)!;
        if (!state.alive) continue;
        let isPanicking = false;

        // 0. PHYSICAL DAMAGE CHECK
        const roomSys = systems.get(state.currentPlace);
        if (roomSys) {
            // Suffocation
            if (roomSys.o2Level < 20) {
                events.push(createEvent(tick, window, 'NPC_DAMAGE', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: { type: 'SUFFOCATION', amount: CONFIG.damageSuffocation }
                }));
                // Forced Panic Movement (Basic override)
                state.panicUntilTick = Math.max(state.panicUntilTick ?? 0, tick + 20);
                isPanicking = true;
                if (!state.targetPlace || state.targetPlace === state.currentPlace || !state.path) {
                    state.targetPlace = rng.pick(world.places.filter(p => p.id !== state.currentPlace)).id;
                    state.path = undefined;
                }
            }

            // Burning
            if (roomSys.temperature > 50) {
                events.push(createEvent(tick, window, 'NPC_DAMAGE', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: { type: 'BURN', amount: CONFIG.damageBurn }
                }));
            }

            // Radiation
            if (roomSys.radiation > 5) {
                events.push(createEvent(tick, window, 'NPC_DAMAGE', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: { type: 'RADIATION', amount: CONFIG.damageRadiation }
                }));
            }
        }

        // 0.1 STRESS + PSYCHOLOGY
        if (roomSys) {
            if (roomSys.o2Level < 30) state.stress += 3;
            if (roomSys.temperature > 40) state.stress += 2;
            if (roomSys.radiation > 5) state.stress += 2;
            if (roomSys.isVented) state.stress += 4;
            if (roomSys.onFire) state.stress += 3;
        }

        if ((occupancy.get(state.currentPlace) ?? 1) <= 1) {
            state.stress += CONFIG.stressIsolation;
        }

        if (systems.getStation().blackoutTicks > 0) {
            state.stress += CONFIG.stressBlackout;
        }

        const safeRoom =
            roomSys &&
            roomSys.o2Level > 60 &&
            roomSys.temperature >= 15 &&
            roomSys.temperature <= 30 &&
            !roomSys.isVented &&
            !roomSys.onFire;

        if (safeRoom) state.stress -= CONFIG.stressSafeDecay;

        state.stress = Math.max(0, Math.min(100, state.stress));

        if (state.stress > CONFIG.stressParanoiaThreshold) {
            state.paranoia = Math.min(100, state.paranoia + 1);
        } else if (state.paranoia > 0 && state.stress < 40) {
            state.paranoia = Math.max(0, state.paranoia - 1);
        }

        if (state.stress > CONFIG.stressLoyaltyDropThreshold && tick % 10 === 0) {
            state.loyalty = Math.max(0, state.loyalty - 1);
        }

        if (state.stress > CONFIG.stressHallucinationThreshold) {
            const nextHallucination = state.nextHallucinationTick ?? 0;
            if (tick >= nextHallucination) {
                const hallucinations = [
                    'Motion detected in maintenance shafts.',
                    'Unknown lifeform in the mines.',
                    'Crew report phantom on corridor cam.',
                    'Sensor ghost detected near airlock.',
                ];
                events.push(createEvent(tick, window, 'SYSTEM_ALERT', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: {
                        system: 'comms',
                        kind: 'HALLUCINATION',
                        hallucination: true,
                        message: `[REPORT] ${rng.pick(hallucinations)}`,
                    },
                }));
                state.paranoia = Math.min(100, state.paranoia + 2);
                state.nextHallucinationTick = tick + CONFIG.hallucinationCooldown + rng.nextInt(10);
            }
        }

        if (systems.getStation().comms < 60 || systems.getStation().blackoutTicks > 0) {
            if (rng.nextInt(100) < 3) {
                events.push(createEvent(tick, window, 'SYSTEM_ALERT', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: {
                        system: 'comms',
                        kind: 'GLITCH',
                        message: `[GLITCH] Signal integrity compromised. Static bleed detected.`,
                    },
                }));
            }
        }

        if (window === 'W3' && state.loyalty < CONFIG.whisperLoyaltyThreshold) {
            const nextWhisper = state.nextWhisperTick ?? 0;
            if (tick >= nextWhisper) {
                events.push(createEvent(tick, window, 'SYSTEM_ALERT', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: {
                        system: 'comms',
                        kind: 'WHISPER',
                        message: `[WHISPER] Low voices detected in ${state.currentPlace}.`,
                    },
                }));
                state.nextWhisperTick = tick + 15 + rng.nextInt(10);
            }
        }

        if (state.loyalty < CONFIG.sabotageLoyaltyThreshold) {
            const nextSabotage = state.nextSabotageTick ?? 0;
            if (tick >= nextSabotage && rng.nextInt(100) < CONFIG.sabotageChance) {
                events.push(createEvent(tick, window, 'SYSTEM_ACTION', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: {
                        action: 'SABOTAGE_POWER',
                        amount: 10,
                        message: `[SABOTAGE] Power fluctuation detected near ${state.currentPlace}.`,
                    },
                }));
                state.nextSabotageTick = tick + 20 + rng.nextInt(10);
                state.paranoia = Math.min(100, state.paranoia + 3);
            }
        }

        if (state.panicUntilTick && tick <= state.panicUntilTick) {
            isPanicking = true;
        } else if (state.panicUntilTick && tick > state.panicUntilTick) {
            state.panicUntilTick = undefined;
        }

        const scheduled = npc.schedule.find(s => s.window === window);
        // ... (rest of logic)

        if (!scheduled) continue;

        // 1. Determine Target
        if (!isPanicking && state.loyalty <= CONFIG.mutinyLoyaltyThreshold && state.targetPlace !== 'core') {
            state.targetPlace = 'core';
            state.path = undefined;
        } else if (!isPanicking && state.targetPlace !== scheduled.place) {
            state.targetPlace = scheduled.place;
            state.path = undefined; // Invalidate path
        } else if (isPanicking && (!state.targetPlace || state.targetPlace === state.currentPlace)) {
            state.targetPlace = rng.pick(world.places.filter(p => p.id !== state.currentPlace)).id;
            state.path = undefined;
        }

        const maybeYield = () => {
            if (
                npc.id === 'specialist' &&
                state.currentPlace === 'mines' &&
                roomSys &&
                roomSys.o2Level >= 30 &&
                systems.getStation().power >= 40 &&
                state.stress <= 60 &&
                tick % CONFIG.yieldInterval === 0
            ) {
                events.push(createEvent(tick, window, 'CARGO_YIELD', {
                    actor: npc.id,
                    place: state.currentPlace,
                    data: { amount: 1 }
                }));
            }
        };

        // 2. Already at target?
        if (state.currentPlace === state.targetPlace) {
            maybeYield();
            continue;
        }

        // 3. Pathfinding (Lazy)
        if (!state.path || state.path.length === 0) {
            state.path = findPath(state.currentPlace, state.targetPlace!, world.places, world.doors);
            // Remove current location from start of path
            if (state.path[0] === state.currentPlace) {
                state.path.shift();
            }
        }

        // 4. Movement Logic
        if (!state.nextMoveTick || tick >= state.nextMoveTick) {
            if (state.path && state.path.length > 0) {
                const nextPlace = state.path[0];

                // Check Door
                const door = getDoorBetween(state.currentPlace, nextPlace, world.doors);

                // PARANOIA FEATURE: Check if locked
                const isLocked = (door as any)?.locked === true;

                if (isLocked) {
                    // Door is locked!
                    state.nextMoveTick = tick + 10; // Try again in 10 ticks
                } else {
                    // Move!
                    if (door) {
                        events.push(createEvent(tick, window, 'DOOR_OPENED', {
                            actor: npc.id,
                            place: state.currentPlace,
                            toPlace: nextPlace,
                            target: door.id,
                        }));
                    }

                    events.push(createEvent(tick, window, 'NPC_MOVE', {
                        actor: npc.id,
                        fromPlace: state.currentPlace,
                        toPlace: nextPlace,
                        place: nextPlace,
                    }));

                    if (door) {
                        events.push(createEvent(tick, window, 'DOOR_CLOSED', {
                            actor: npc.id,
                            place: nextPlace,
                            fromPlace: state.currentPlace,
                            target: door.id,
                        }));
                    }

                    // Update State
                    state.currentPlace = nextPlace;
                    state.path.shift();
                    const doorDelay = systems.getStation().doorDelay;
                    state.nextMoveTick = tick + 5 + rng.nextInt(5) + doorDelay; // Travel time
                }
            }
        }

        // 5. Work Output (Causal, deterministic)
        maybeYield();
    }

    return events;
}

// Activities intentionally removed in paranoia mode to keep the sim causal.
