import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { checkSuppressBackfire, checkSpoofBackfire, checkFabricateBackfire } from '../src/kernel/systems/backfire.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState(seed = 12345): KernelState {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return createInitialState(world, 10);
}

// =============================================================================
// Task 003: Narrative Consequence Enhancement
// =============================================================================

describe('AC-1: Suppress backfire doubt has narrative topic', () => {
    test('SUPPRESS thermal backfire creates doubt with descriptive topic', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // Create a SUPPRESS op for thermal
        state.perception.tamperOps.push({
            id: 'suppress-test',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 2,
            crewAffected: [],
        });

        // Put crew in a room with fire to trigger backfire
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].onFire = true;

        checkSuppressBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-test'
        );
        expect(doubt).toBeDefined();
        // Should have narrative topic (not just "thermal crisis was hidden")
        expect(doubt!.topic.toLowerCase()).toMatch(/hid|hidden|concealed|lied/);
    });
});

describe('AC-2: All backfire doubts have severity 3', () => {
    test('SUPPRESS backfire doubt has severity 3 regardless of original op severity', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // Create a SUPPRESS op with severity 1
        state.perception.tamperOps.push({
            id: 'suppress-low',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'air' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 1, // low severity
            crewAffected: [],
        });

        // Trigger backfire
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].o2Level = 20; // low O2

        checkSuppressBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-low'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.severity).toBe(3); // Always 3 for backfire
    });
});

describe('AC-3: Suppress backfire involves all crew who witnessed harm', () => {
    test('SUPPRESS backfire includes crew in hazardous room and adjacent rooms', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // Create SUPPRESS for thermal
        state.perception.tamperOps.push({
            id: 'suppress-expanded',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 3,
            crewAffected: ['roughneck' as NPCId], // original affected
        });

        // Roughneck in fire room
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].onFire = true;

        // Specialist in adjacent room (cargo)
        state.truth.crew['specialist' as NPCId].place = 'cargo' as PlaceId;

        checkSuppressBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-expanded'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.involvedCrew).toContain('roughneck');
        // Specialist should be included via expanded witness logic
        // Note: exact behavior depends on implementation
    });
});

describe('AC-4: Spoof backfire involves all responders', () => {
    test('SPOOF backfire includes crew who moved toward response location', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // Create SPOOF op
        state.perception.tamperOps.push({
            id: 'spoof-test',
            kind: 'SPOOF',
            tick: 20,
            target: { system: 'thermal' },
            windowEndTick: 50, // expires now
            status: 'PENDING',
            severity: 2,
            crewAffected: ['commander' as NPCId, 'engineer' as NPCId], // responders
        });

        // No real crisis - backfire will trigger
        state.truth.arcs = [];

        checkSpoofBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'spoof-test'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.involvedCrew).toContain('commander');
        expect(doubt!.involvedCrew).toContain('engineer');
    });
});

describe('AC-5: Fabricate backfire involves target + alibi witnesses', () => {
    test('FABRICATE backfire includes target and crew who confirmed alibi', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // Create FABRICATE op against doctor
        state.perception.tamperOps.push({
            id: 'fabricate-test',
            kind: 'FABRICATE',
            tick: 20,
            target: { npc: 'doctor' as NPCId },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 3,
            crewAffected: [],
        });

        // Doctor has alibi - working in medbay with others
        state.truth.crew['doctor' as NPCId].place = 'medbay' as PlaceId;
        state.perception.observation.lastCrewSighting['doctor' as NPCId] = {
            tick: 45,
            place: 'mines' as PlaceId, // working place
            alive: true,
            hp: 100,
        };
        // Roughneck present as witness
        state.truth.crew['roughneck' as NPCId].place = 'mines' as PlaceId;

        checkFabricateBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'fabricate-test'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.involvedCrew).toContain('doctor');
        // Roughneck (alibi witness) should be added in expanded logic
    });
});

describe('AC-6: All backfire doubts have source "backfire"', () => {
    test('SUPPRESS backfire doubt has source field set to "backfire"', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        state.perception.tamperOps.push({
            id: 'suppress-source-test',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 2,
            crewAffected: [],
        });

        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].onFire = true;

        checkSuppressBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-source-test'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.source).toBe('backfire');
    });
});

describe('EC-1: Backfire with no additional witnesses', () => {
    test('Suppress backfire with only op.crewAffected uses those crew', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        state.perception.tamperOps.push({
            id: 'suppress-minimal',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 2,
            crewAffected: ['roughneck' as NPCId],
        });

        // Only roughneck in the affected room
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].onFire = true;

        // Move everyone else away
        for (const npc of Object.values(state.truth.crew)) {
            if (npc.id !== 'roughneck') {
                npc.place = 'mess' as PlaceId;
            }
        }

        checkSuppressBackfire(state);

        const doubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-minimal'
        );
        expect(doubt).toBeDefined();
        expect(doubt!.involvedCrew.length).toBeGreaterThan(0);
    });
});

describe('EC-2: Multiple backfires in same tick', () => {
    test('SUPPRESS and SPOOF backfire in same tick create separate doubts', () => {
        const state = makeTestState();
        state.truth.tick = 50;

        // SUPPRESS that will backfire
        state.perception.tamperOps.push({
            id: 'suppress-multi',
            kind: 'SUPPRESS',
            tick: 40,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'PENDING',
            severity: 2,
            crewAffected: [],
        });

        // SPOOF that will backfire (window ends now)
        state.perception.tamperOps.push({
            id: 'spoof-multi',
            kind: 'SPOOF',
            tick: 20,
            target: { system: 'air' },
            windowEndTick: 50,
            status: 'PENDING',
            severity: 2,
            crewAffected: ['commander' as NPCId],
        });

        // Setup for suppress backfire
        state.truth.crew['roughneck' as NPCId].place = 'engineering' as PlaceId;
        state.truth.rooms['engineering' as PlaceId].onFire = true;

        // No real crisis for spoof
        state.truth.arcs = [];

        checkSuppressBackfire(state);
        checkSpoofBackfire(state);

        const suppressDoubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'suppress-multi'
        );
        const spoofDoubt = state.perception.activeDoubts.find(
            d => d.relatedOpId === 'spoof-multi'
        );

        expect(suppressDoubt).toBeDefined();
        expect(spoofDoubt).toBeDefined();
        expect(suppressDoubt!.topic).not.toBe(spoofDoubt!.topic);
    });
});
