
/**
 * PROJECT PARANOIA: SYSTEMS LAYER
 * 
 * Manages the physics of the station (O2, Temperature, Radiation).
 */

import { PLACES } from '../core/world.js';
import type { PlaceId } from '../core/types.js';

export interface RoomSystemState {
    id: PlaceId;
    o2Level: number;        // 0-100%
    temperature: number;    // Celsius (Default 20)
    radiation: number;      // Rads (Default 0)
    integrity: number;      // 0-100%
    isVented: boolean;      // If true, O2 drops rapidly
    onFire: boolean;        // If true, Temp rises
}

export interface StationSystemState {
    power: number;          // 0-100%
    comms: number;          // 0-100%
    doorDelay: number;      // ticks of extra latency
    blackoutTicks: number;  // if >0, no sensors
    suppressedAlerts: Record<string, number>;
}

export class SystemsManager {
    private states = new Map<PlaceId, RoomSystemState>();
    private station: StationSystemState = {
        power: 100,
        comms: 100,
        doorDelay: 0,
        blackoutTicks: 0,
        suppressedAlerts: {},
    };

    constructor() {
        this.init();
    }

    private init() {
        for (const placeDef of Object.values(PLACES)) {
            this.states.set(placeDef.id, {
                id: placeDef.id,
                o2Level: 100,
                temperature: 20,
                radiation: 0,
                integrity: 100,
                isVented: false,
                onFire: false,
            });
        }
    }

    /**
     * Advance physics by one tick.
     */
    tick() {
        if (this.station.blackoutTicks > 0) {
            this.station.blackoutTicks = Math.max(0, this.station.blackoutTicks - 1);
        }

        if (this.station.doorDelay > 0) {
            this.station.doorDelay = Math.max(0, this.station.doorDelay - 1);
        }

        if (this.station.comms < 100) {
            this.station.comms = Math.min(100, this.station.comms + 1);
        }

        if (this.station.power < 100) {
            this.station.power = Math.min(100, this.station.power + 1);
        }

        for (const key of Object.keys(this.station.suppressedAlerts)) {
            this.station.suppressedAlerts[key] = Math.max(0, this.station.suppressedAlerts[key] - 1);
            if (this.station.suppressedAlerts[key] === 0) {
                delete this.station.suppressedAlerts[key];
            }
        }

        for (const state of this.states.values()) {
            // 1. O2 Logic
            if (state.isVented) {
                // Rapid decompression
                state.o2Level = Math.max(0, state.o2Level - 5);
                state.temperature = Math.max(-270, state.temperature - 10); // Spaaaaace is cold
            } else {
                // Natural life support regeneration
                if (state.o2Level < 100 && state.integrity > 0 && this.station.power >= 40) {
                    state.o2Level = Math.min(100, state.o2Level + 1);
                }
                // Temp normalization
                if (state.temperature < 20) state.temperature += 1;
                if (state.temperature > 20 && !state.onFire) state.temperature -= 1;
            }

            // 2. Fire Logic
            if (state.onFire) {
                state.temperature += 5;
                state.o2Level -= 1; // Fire consumes O2
                state.integrity -= 0.5;

                // Fire dies without O2
                if (state.o2Level < 10) {
                    state.onFire = false; // Starved
                }
            }

            // 3. Radiation decay
            if (state.radiation > 0) {
                state.radiation = Math.max(0, state.radiation - 0.5);
            }
        }
    }

    /**
     * Get snapshot of a room.
     */
    get(place: PlaceId): RoomSystemState | undefined {
        return this.states.get(place);
    }

    getStation(): StationSystemState {
        return this.station;
    }

    /**
     * Get all states (for scan).
     */
    getAll(): RoomSystemState[] {
        return Array.from(this.states.values());
    }

    // ACTIONS ================================================================

    ventRoom(place: PlaceId) {
        const state = this.states.get(place);
        if (state) {
            state.isVented = true;
        }
    }

    sealRoom(place: PlaceId) {
        const state = this.states.get(place);
        if (state) {
            state.isVented = false;
        }
    }

    igniteRoom(place: PlaceId) {
        const state = this.states.get(place);
        if (state) {
            state.onFire = true;
            state.temperature += 100; // Immediate spike
        }
    }

    adjustO2(place: PlaceId, amount: number) {
        const state = this.states.get(place);
        if (state) {
            state.o2Level = Math.max(0, Math.min(100, state.o2Level + amount));
        }
    }

    addRadiation(place: PlaceId, amount: number) {
        const state = this.states.get(place);
        if (state) {
            state.radiation = Math.max(0, state.radiation + amount);
        }
    }

    applyDoorDelay(amount: number) {
        this.station.doorDelay = Math.max(this.station.doorDelay, amount);
    }

    setComms(value: number) {
        this.station.comms = Math.max(0, Math.min(100, value));
    }

    setPower(value: number) {
        this.station.power = Math.max(0, Math.min(100, value));
    }

    triggerBlackout(ticks: number) {
        this.station.blackoutTicks = Math.max(this.station.blackoutTicks, ticks);
    }

    suppressAlerts(system: string, duration: number) {
        this.station.suppressedAlerts[system] = Math.max(
            this.station.suppressedAlerts[system] ?? 0,
            duration
        );
    }

    isSuppressed(system: string): boolean {
        return (this.station.suppressedAlerts[system] ?? 0) > 0;
    }

    reroute(target: 'comms' | 'doors' | 'life_support') {
        if (target === 'comms') {
            this.station.comms = Math.min(100, this.station.comms + 30);
            this.station.power = Math.max(0, this.station.power - 10);
        }
        if (target === 'doors') {
            this.station.doorDelay = Math.max(0, this.station.doorDelay - 5);
            this.station.power = Math.max(0, this.station.power - 5);
        }
        if (target === 'life_support') {
            this.station.power = Math.max(0, this.station.power - 15);
            for (const state of this.states.values()) {
                state.o2Level = Math.min(100, state.o2Level + 5);
            }
        }
    }

    purgeAir() {
        this.station.power = Math.max(0, this.station.power - 10);
        for (const state of this.states.values()) {
            state.o2Level = Math.min(100, state.o2Level + 15);
            state.radiation = Math.max(0, state.radiation - 2);
        }
    }
}
