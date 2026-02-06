import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { CONFIG } from '../src/config.js';
import type { NPCId, PlaceId, DoorId } from '../src/core/types.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState(seed = 12345): { state: KernelState, rng: ReturnType<typeof createRng> } {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

// =============================================================================
// Task 002: Witness Doubt Generation
// =============================================================================

describe('AC-1: VENT room with crew creates doubt', () => {
    test('VENT engineering with roughneck present creates witness doubt', () => {
        const { state, rng } = makeTestState();

        // Position roughneck in engineering
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;

        // Execute VENT command
        stepKernel(state, [{ type: 'VENT', place: 'engineering' as PlaceId }], rng);

        // Find witness doubt
        const doubt = state.perception.activeDoubts.find(
            d => d.topic.toLowerCase().includes('vent') && d.source === 'witness'
        );

        expect(doubt).toBeDefined();
        expect(doubt!.severity).toBe(CONFIG.doubtWitnessVent);
        expect(doubt!.involvedCrew).toContain('roughneck');
        expect(doubt!.source).toBe('witness');
    });
});

describe('AC-2: LOCK door with crew in connected room creates doubt', () => {
    test('LOCK door_cargo_mines with specialist in cargo creates witness doubt', () => {
        const { state, rng } = makeTestState();

        // Position specialist in cargo (connected to mines via door_cargo_mines)
        state.truth.crew['specialist' as NPCId].place = 'cargo' as PlaceId;

        // Execute LOCK command
        stepKernel(state, [{ type: 'LOCK', doorId: 'door_cargo_mines' }], rng);

        // Find witness doubt
        const doubt = state.perception.activeDoubts.find(
            d => d.topic.toLowerCase().includes('lock') && d.source === 'witness'
        );

        expect(doubt).toBeDefined();
        expect(doubt!.severity).toBe(CONFIG.doubtWitnessLock);
        expect(doubt!.involvedCrew).toContain('specialist');
    });
});

describe('AC-3: No doubt when room and adjacent rooms are empty', () => {
    test('VENT empty room with no adjacent crew creates no witness doubt', () => {
        const { state, rng } = makeTestState();

        // Move all crew to mess (away from engineering AND its adjacent rooms)
        for (const npc of Object.values(state.truth.crew)) {
            npc.place = 'mess' as PlaceId;
        }

        // Execute VENT command
        stepKernel(state, [{ type: 'VENT', place: 'engineering' as PlaceId }], rng);

        // No new witness doubts (no crew in room or adjacent)
        const witnessDoubts = state.perception.activeDoubts.filter(
            d => d.source === 'witness'
        );
        expect(witnessDoubts.length).toBe(0);
    });
});

describe('AC-4: Multiple crew in room = one doubt with all witnesses', () => {
    test('VENT with roughneck and specialist creates one doubt with both', () => {
        const { state, rng } = makeTestState();

        // Position both in engineering
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.crew['specialist' as NPCId].place = 'engineering' as PlaceId;

        // Execute VENT command
        stepKernel(state, [{ type: 'VENT', place: 'engineering' as PlaceId }], rng);

        // Find witness doubt
        const witnessDoubts = state.perception.activeDoubts.filter(
            d => d.topic.toLowerCase().includes('vent') && d.source === 'witness'
        );

        expect(witnessDoubts.length).toBe(1);
        const doubt = witnessDoubts[0];
        expect(doubt.involvedCrew).toContain('roughneck');
        expect(doubt.involvedCrew).toContain('specialist');
    });
});

describe('AC-5: Dead crew don\'t witness', () => {
    test('VENT with dead roughneck and alive specialist only involves specialist', () => {
        const { state, rng } = makeTestState();

        // Position both in engineering, but roughneck is dead
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.crew['roughneck' as NPCId].alive = false;
        state.truth.crew['specialist' as NPCId].place = 'engineering' as PlaceId;

        // Execute VENT command
        stepKernel(state, [{ type: 'VENT', place: 'engineering' as PlaceId }], rng);

        // Find witness doubt
        const doubt = state.perception.activeDoubts.find(
            d => d.topic.toLowerCase().includes('vent') && d.source === 'witness'
        );

        expect(doubt).toBeDefined();
        expect(doubt!.involvedCrew).toContain('specialist');
        expect(doubt!.involvedCrew).not.toContain('roughneck');
    });
});

describe('AC-6: ORDER creates mild doubt on target', () => {
    test('ORDER specialist to mines creates low-severity doubt', () => {
        const { state, rng } = makeTestState();

        // Ensure order will be accepted (high loyalty)
        state.truth.crew['specialist' as NPCId].loyalty = 80;
        const belief = state.perception.beliefs['specialist' as NPCId];
        if (belief) belief.motherReliable = 0.8;

        // Execute ORDER command
        stepKernel(state, [{ type: 'ORDER', target: 'specialist' as NPCId, intent: 'move', place: 'mines' as PlaceId }], rng);

        // Find witness doubt
        const doubt = state.perception.activeDoubts.find(
            d => d.topic.toLowerCase().includes('order') && d.source === 'witness'
        );

        expect(doubt).toBeDefined();
        expect(doubt!.severity).toBe(CONFIG.doubtWitnessOrder);
        expect(doubt!.involvedCrew).toContain('specialist');
    });
});

describe('AC-7: PURGE_AIR creates doubt involving all alive crew', () => {
    test('PURGE_AIR with 3 alive crew creates doubt involving all 3', () => {
        const { state, rng } = makeTestState();

        // Get count of alive crew
        const aliveCrewBefore = Object.values(state.truth.crew).filter(c => c.alive);

        // Execute PURGE_AIR command
        stepKernel(state, [{ type: 'PURGE_AIR' }], rng);

        // Find witness doubt
        const doubt = state.perception.activeDoubts.find(
            d => d.topic.toLowerCase().includes('purge') && d.source === 'witness'
        );

        expect(doubt).toBeDefined();
        expect(doubt!.severity).toBe(CONFIG.doubtWitnessPurge);
        expect(doubt!.involvedCrew.length).toBe(aliveCrewBefore.length);
    });
});

describe('EC-1: Crew in adjacent room hear VENT (low severity)', () => {
    test('VENT engineering creates low-severity doubt for crew in adjacent cargo', () => {
        const { state, rng } = makeTestState();

        // Position roughneck in cargo (adjacent to engineering)
        state.truth.crew['roughneck' as NPCId].place = 'cargo' as PlaceId;

        // Move everyone else away from engineering and its adjacent rooms
        for (const npc of Object.values(state.truth.crew)) {
            if (npc.id !== 'roughneck' && (npc.place === 'engineering' || npc.place === 'cargo')) {
                npc.place = 'mess' as PlaceId;
            }
        }

        // Execute VENT command
        stepKernel(state, [{ type: 'VENT', place: 'engineering' as PlaceId }], rng);

        // Adjacent crew hear the depressurization — creates low-severity witness doubt
        const witnessDoubts = state.perception.activeDoubts.filter(
            d => d.source === 'witness' && d.topic.toLowerCase().includes('vent')
        );
        expect(witnessDoubts.length).toBe(1);
        expect(witnessDoubts[0].severity).toBe(1); // Low severity for adjacent
        expect(witnessDoubts[0].involvedCrew).toContain('roughneck');
    });
});

describe('EC-2: LOCK door with no crew on either side', () => {
    test('LOCK door between empty rooms creates no doubt', () => {
        const { state, rng } = makeTestState();

        // Move all crew to mess (away from cargo and mines)
        for (const npc of Object.values(state.truth.crew)) {
            npc.place = 'mess' as PlaceId;
        }

        // Execute LOCK command
        stepKernel(state, [{ type: 'LOCK', doorId: 'door_cargo_mines' }], rng);

        // No witness doubt
        const witnessDoubts = state.perception.activeDoubts.filter(
            d => d.source === 'witness' && d.topic.toLowerCase().includes('lock')
        );
        expect(witnessDoubts.length).toBe(0);
    });
});

describe('EC-3: Multiple commands in same tick', () => {
    test('VENT and LOCK in same tick create separate doubts', () => {
        const { state, rng } = makeTestState();

        // Position crew strategically
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.crew['specialist' as NPCId].place = 'cargo' as PlaceId;

        // Execute both commands in same tick
        stepKernel(state, [
            { type: 'VENT', place: 'engineering' as PlaceId },
            { type: 'LOCK', doorId: 'door_cargo_mines' },
        ], rng);

        // Find witness doubts
        const ventDoubt = state.perception.activeDoubts.find(
            d => d.source === 'witness' && d.topic.toLowerCase().includes('vent')
        );
        const lockDoubt = state.perception.activeDoubts.find(
            d => d.source === 'witness' && d.topic.toLowerCase().includes('lock')
        );

        expect(ventDoubt).toBeDefined();
        expect(lockDoubt).toBeDefined();
        expect(ventDoubt!.topic).not.toBe(lockDoubt!.topic);
    });
});
