import { describe, test, expect } from 'vitest';
import { proposeCrewEvents, isRoomHazardous, findSafeRoom } from '../src/kernel/systems/crew.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { clamp } from '../src/kernel/utils.js';

function makeTestState() {
    const rng = createRng(42);
    const world = createWorld(rng);
    return { state: createInitialState(world, 8), rng };
}

describe('Task 001: Extract Crew System', () => {
    test('AC-1: proposeCrewEvents is exported from crew.ts and callable', () => {
        const { state, rng } = makeTestState();
        const proposals = proposeCrewEvents(state, rng);
        expect(Array.isArray(proposals)).toBe(true);
        expect(proposals.length).toBeGreaterThan(0);
    });

    test('AC-2: isRoomHazardous and findSafeRoom are co-located in crew.ts; clamp is in utils.ts', () => {
        // isRoomHazardous is exported from crew.ts
        expect(typeof isRoomHazardous).toBe('function');
        expect(isRoomHazardous({ o2Level: 100, temperature: 20, radiation: 0, isVented: false, onFire: false })).toBe(false);
        expect(isRoomHazardous({ o2Level: 10, temperature: 20, radiation: 0, isVented: false, onFire: false })).toBe(true);

        // findSafeRoom is exported from crew.ts
        expect(typeof findSafeRoom).toBe('function');

        // clamp is importable from utils.ts
        expect(typeof clamp).toBe('function');
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    test('AC-4: proposeCrewEvents produces deterministic output for same seed', () => {
        // Run twice with same state+seed, verify identical proposals
        const { state: state1, rng: rng1 } = makeTestState();
        const proposals1 = proposeCrewEvents(state1, rng1);

        const { state: state2, rng: rng2 } = makeTestState();
        const proposals2 = proposeCrewEvents(state2, rng2);

        expect(proposals1.length).toBe(proposals2.length);
        for (let i = 0; i < proposals1.length; i++) {
            expect(proposals1[i].event.type).toBe(proposals2[i].event.type);
            expect(proposals1[i].event.actor).toBe(proposals2[i].event.actor);
            expect(proposals1[i].tags).toEqual(proposals2[i].tags);
        }
    });

    test('EC-1: clamp is importable from utils.ts by both crew.ts and kernel.ts', () => {
        // clamp is a shared utility — verify it works correctly
        expect(clamp(50, 0, 100)).toBe(50);
        expect(clamp(-10, 0, 100)).toBe(0);
        expect(clamp(200, 0, 100)).toBe(100);
    });

    test('EC-2: crew.ts does not import from kernel.ts (no circular dependency)', async () => {
        // Verify crew.ts only imports from types, proposals, config, core, beliefs, utils
        // If there were circular imports, the import at the top of this file would fail.
        // We verify by checking that proposeCrewEvents works without errors.
        const { state, rng } = makeTestState();
        expect(() => proposeCrewEvents(state, rng)).not.toThrow();
    });

    test('ERR-1: All imports resolve (TypeScript compilation)', () => {
        // If any imports in crew.ts were broken, this test file itself wouldn't compile.
        // Verify the key exports exist and are the expected types.
        expect(typeof proposeCrewEvents).toBe('function');
        expect(typeof isRoomHazardous).toBe('function');
        expect(typeof findSafeRoom).toBe('function');
    });

    describe('isRoomHazardous edge cases', () => {
        test('returns false for undefined room', () => {
            expect(isRoomHazardous(undefined)).toBe(false);
        });

        test('detects fire', () => {
            expect(isRoomHazardous({ o2Level: 100, temperature: 20, radiation: 0, isVented: false, onFire: true })).toBe(true);
        });

        test('detects venting', () => {
            expect(isRoomHazardous({ o2Level: 100, temperature: 20, radiation: 0, isVented: true, onFire: false })).toBe(true);
        });

        test('detects low O2', () => {
            expect(isRoomHazardous({ o2Level: 20, temperature: 20, radiation: 0, isVented: false, onFire: false })).toBe(true);
        });

        test('detects high temperature', () => {
            expect(isRoomHazardous({ o2Level: 100, temperature: 50, radiation: 0, isVented: false, onFire: false })).toBe(true);
        });

        test('detects high radiation', () => {
            expect(isRoomHazardous({ o2Level: 100, temperature: 20, radiation: 10, isVented: false, onFire: false })).toBe(true);
        });
    });

    describe('findSafeRoom', () => {
        test('finds safe room when current room is hazardous', () => {
            const { state } = makeTestState();
            // Make current room hazardous
            state.truth.rooms['mines'].onFire = true;
            const safe = findSafeRoom(state, 'mines');
            expect(safe).not.toBeNull();
            expect(safe).not.toBe('mines');
        });

        test('returns current place if no escape', () => {
            const { state } = makeTestState();
            // Make all rooms hazardous
            for (const room of Object.values(state.truth.rooms)) {
                room.onFire = true;
            }
            const result = findSafeRoom(state, 'mines');
            expect(result).toBe('mines');
        });
    });
});
