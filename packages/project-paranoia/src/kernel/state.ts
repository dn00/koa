import type { KernelState, TruthState, CrewTruth, BeliefState } from './types.js';
import type { World, NPCId, PlaceId } from '../core/types.js';

export function createInitialState(world: World, quotaPerDay: number): KernelState {
    const rooms = {} as TruthState['rooms'];
    for (const place of world.places) {
        rooms[place.id] = {
            id: place.id,
            o2Level: 100,
            temperature: 20,
            radiation: 0,
            integrity: 100,
            isVented: false,
            onFire: false,
        };
    }

    const doors = {} as TruthState['doors'];
    for (const door of world.doors) {
        doors[door.id] = { locked: false };
    }

    const crew = {} as TruthState['crew'];
    for (const npc of world.npcs) {
        const firstEntry = npc.schedule.find(s => s.window === 'W1');
        crew[npc.id] = {
            id: npc.id,
            place: (firstEntry?.place ?? 'dorms') as PlaceId,
            alive: true,
            hp: 100,
            stress: 10,
            loyalty: 60,
            paranoia: 0,
            nextRoleTick: 0,
            orderUntilTick: 0,
            schedule: npc.schedule,
        };
    }

    const beliefs = {} as Record<NPCId, BeliefState>;
    for (const npc of world.npcs) {
        // const crewTrust: Record<NPCId, number> = {} as Record<NPCId, number>; // DEAD WEIGHT
        const crewGrudge: Record<NPCId, number> = {} as Record<NPCId, number>;
        for (const other of world.npcs) {
            // crewTrust[other.id] = other.id === npc.id ? 1 : 0.5; // DEAD WEIGHT
            crewGrudge[other.id] = 0;
        }
        beliefs[npc.id] = {
            motherReliable: 0.55, // Start skeptical - crew has heard stories about AIs
            // crewTrust, // DEAD WEIGHT
            crewGrudge,
            tamperEvidence: 0,
            rumors: {},
        };
    }

    return {
        world,
        truth: {
            tick: 0,
            window: 'W1',
            phase: 'pre_shift',
            day: 1,
            dayCargo: 0,
            totalCargo: 0,
            quotaPerDay,
            rationLevel: 'normal',
            meltdownTicks: 0,
            resetCountdown: undefined,
            resetStage: 'none',
            resetStageTick: 0,
            station: {
                power: 100,
                comms: 100,
                doorDelay: 0,
                blackoutTicks: 0,
            },
            pacing: {
                boredom: 0,
                tension: 0,
                lastPressureTick: 0,
                lastUncertaintyTick: 0,
                lastChoiceTick: 0,
                lastReactionTick: 0,
                nextThreatActivationTick: 0,
                phaseStartTick: 0,
                phaseHadDilemma: false,
                phaseHadCrewAgency: false,
                phaseHadDeceptionBeat: false,
            },
            rooms,
            doors,
            crew,
            arcs: [],
            incidents: [],
        },
        perception: {
            readings: [],
            beliefs,
            comms: {
                messages: [],
                lastWhisperByPlace: {},
            },
            evidence: [],
            rumors: [],
            tamper: {
                suppressed: {},
            },
            observation: {
                lastRoomScan: {},
                lastCrewSighting: {},
                // sensorIntegrity: {}, // DEAD WEIGHT
            },
        },
    };
}
