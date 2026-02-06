import { describe, test, expect } from 'vitest';
import { decayTamper, tickPassiveObservation, tickSystems } from '../src/kernel/systems/physics.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';

function makeTestState() {
    const rng = createRng(42);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 003: Extract Physics System', () => {
    test('AC-1: decayTamper, tickPassiveObservation, tickSystems are exported and callable', () => {
        expect(typeof decayTamper).toBe('function');
        expect(typeof tickPassiveObservation).toBe('function');
        expect(typeof tickSystems).toBe('function');
    });

    test('AC-2: decayTamper reduces suppressed timers deterministically', () => {
        const state = makeTestState();
        state.perception.tamper.suppressed = { 'sensors': 3, 'comms': 1 };

        decayTamper(state);

        expect(state.perception.tamper.suppressed['sensors']).toBe(2);
        // comms was 1, should be removed after decrementing to 0
        expect(state.perception.tamper.suppressed['comms']).toBeUndefined();
    });

    test('AC-2: tickSystems reduces blackoutTicks', () => {
        const state = makeTestState();
        state.truth.station.blackoutTicks = 5;

        tickSystems(state);

        expect(state.truth.station.blackoutTicks).toBe(4);
    });

    test('AC-2: tickSystems recovers power toward 100', () => {
        const state = makeTestState();
        state.truth.station.power = 80;

        tickSystems(state);

        expect(state.truth.station.power).toBe(81);
    });

    test('AC-2: tickSystems recovers comms toward 100', () => {
        const state = makeTestState();
        state.truth.station.comms = 50;

        tickSystems(state);

        expect(state.truth.station.comms).toBe(51);
    });

    test('AC-2: tickSystems reduces doorDelay', () => {
        const state = makeTestState();
        state.truth.station.doorDelay = 3;

        tickSystems(state);

        expect(state.truth.station.doorDelay).toBe(2);
    });

    test('AC-2: tickSystems regenerates O2 when power sufficient', () => {
        const state = makeTestState();
        state.truth.rooms['dorms'].o2Level = 90;

        tickSystems(state);

        expect(state.truth.rooms['dorms'].o2Level).toBe(91);
    });

    test('AC-2: tickSystems does NOT regenerate O2 when power low', () => {
        const state = makeTestState();
        state.truth.station.power = 30; // below 40 threshold
        state.truth.rooms['dorms'].o2Level = 90;

        tickSystems(state);

        expect(state.truth.rooms['dorms'].o2Level).toBe(90);
    });

    test('AC-2: tickSystems handles fire: raises temp, lowers O2 and integrity', () => {
        const state = makeTestState();
        const room = state.truth.rooms['dorms'];
        room.onFire = true;
        const prevTemp = room.temperature;
        const prevO2 = room.o2Level;
        const prevIntegrity = room.integrity;

        tickSystems(state);

        expect(room.temperature).toBeGreaterThan(prevTemp);
        expect(room.o2Level).toBeLessThan(prevO2);
        expect(room.integrity).toBeLessThan(prevIntegrity);
    });

    test('AC-2: tickSystems handles venting: drops O2 and temperature', () => {
        const state = makeTestState();
        const room = state.truth.rooms['dorms'];
        room.isVented = true;
        const prevO2 = room.o2Level;
        const prevTemp = room.temperature;

        tickSystems(state);

        expect(room.o2Level).toBeLessThan(prevO2);
        expect(room.temperature).toBeLessThan(prevTemp);
    });

    test('AC-2: tickPassiveObservation updates crew sightings when power sufficient', () => {
        const state = makeTestState();
        state.truth.tick = 10; // matches passiveObservationInterval (10)
        state.truth.station.power = 100;
        state.truth.station.blackoutTicks = 0;

        tickPassiveObservation(state);

        const sightings = state.perception.observation.lastCrewSighting;
        expect(sightings['commander']).toBeDefined();
        expect(sightings['commander']!.tick).toBe(10);
        expect(sightings['commander']!.alive).toBe(true);
    });

    test('AC-2: tickPassiveObservation skips during blackout', () => {
        const state = makeTestState();
        state.truth.tick = 10;
        state.truth.station.power = 100;
        state.truth.station.blackoutTicks = 5;

        tickPassiveObservation(state);

        const sightings = state.perception.observation.lastCrewSighting;
        expect(sightings['commander']).toBeUndefined();
    });

    test('EC-1: KernelState type includes RoomSystemState through type chain', () => {
        const state = makeTestState();
        // Verify rooms have RoomSystemState fields
        const room = state.truth.rooms['dorms'];
        expect(room).toHaveProperty('o2Level');
        expect(room).toHaveProperty('temperature');
        expect(room).toHaveProperty('radiation');
        expect(room).toHaveProperty('integrity');
        expect(room).toHaveProperty('isVented');
        expect(room).toHaveProperty('onFire');
    });
});
