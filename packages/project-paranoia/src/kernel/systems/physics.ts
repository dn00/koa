import { CONFIG } from '../../config.js';
import type { KernelState } from '../types.js';

export function decayTamper(state: KernelState) {
    for (const key of Object.keys(state.perception.tamper.suppressed)) {
        state.perception.tamper.suppressed[key] -= 1;
        if (state.perception.tamper.suppressed[key] <= 0) {
            delete state.perception.tamper.suppressed[key];
        }
    }
}

export function tickPassiveObservation(state: KernelState) {
    const { truth, perception } = state;

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

export function tickSystems(state: KernelState) {
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
