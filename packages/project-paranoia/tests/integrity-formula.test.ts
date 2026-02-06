import { describe, test, expect } from 'vitest';
import { calculateIntegrity } from '../src/kernel/integrity.js';
import type { RoomSystemState } from '../src/engine/systems.js';

function makeHealthyRoom(id: string): RoomSystemState {
    return {
        id: id as any,
        o2Level: 100,
        temperature: 20,
        radiation: 0,
        integrity: 100,
        isVented: false,
        onFire: false,
    };
}

function makeRooms(count: number): RoomSystemState[] {
    const ids = ['bridge', 'engineering', 'medbay', 'dorms', 'mess', 'cargo', 'mines', 'core', 'airlock_a', 'airlock_b'];
    return ids.slice(0, count).map(id => makeHealthyRoom(id));
}

describe('Task 003: Integrity Formula Rework', () => {
    describe('AC-1: One burning room drops integrity below 80%', () => {
        test('1 room on fire with degraded O2/integrity', () => {
            const rooms = makeRooms(8);
            // Set one room on fire with degraded stats
            rooms[1].onFire = true;
            rooms[1].integrity = 60;
            rooms[1].o2Level = 80;
            rooms[1].temperature = 120;

            const result = calculateIntegrity(rooms, 100);
            expect(result).toBeLessThanOrEqual(80);
        });
    });

    describe('AC-2: All rooms healthy returns 100%', () => {
        test('healthy station is 100%', () => {
            const rooms = makeRooms(8);
            const result = calculateIntegrity(rooms, 100);
            expect(result).toBe(100);
        });
    });

    describe('AC-3: Unmanaged fire reaches critical integrity', () => {
        test('room at integrity 50 and fire yields station integrity <= 65%', () => {
            const rooms = makeRooms(8);
            // Simulate 30 ticks of unmanaged fire
            rooms[1].onFire = true;
            rooms[1].integrity = 50;
            rooms[1].o2Level = 70; // fire drains O2 over time
            rooms[1].temperature = 150;

            const result = calculateIntegrity(rooms, 100);
            expect(result).toBeLessThanOrEqual(65);
        });
    });

    describe('EC-1: Multiple rooms burning', () => {
        test('2 fires drops integrity further than 1 fire', () => {
            // 1 fire
            const rooms1 = makeRooms(8);
            rooms1[1].onFire = true;
            rooms1[1].integrity = 60;
            rooms1[1].o2Level = 80;
            const single = calculateIntegrity(rooms1, 100);

            // 2 fires
            const rooms2 = makeRooms(8);
            rooms2[1].onFire = true;
            rooms2[1].integrity = 60;
            rooms2[1].o2Level = 80;
            rooms2[2].onFire = true;
            rooms2[2].integrity = 60;
            rooms2[2].o2Level = 80;
            const double = calculateIntegrity(rooms2, 100);

            expect(double).toBeLessThan(single);
        });
    });

    describe('EC-2: Vented room', () => {
        test('vented room with O2=0 reflects crisis', () => {
            const rooms = makeRooms(8);
            rooms[1].isVented = true;
            rooms[1].o2Level = 0;
            rooms[1].integrity = 80;

            const result = calculateIntegrity(rooms, 100);
            // Vented room should visibly drag down integrity
            expect(result).toBeLessThan(85);
        });
    });
});
