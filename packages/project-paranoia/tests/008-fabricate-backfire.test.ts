import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { checkFabricateBackfire } from '../src/kernel/systems/backfire.js';
import type { NPCId, PlaceId } from '../src/core/types.js';
import { CONFIG } from '../src/config.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Backfire check runs', () => {
    test('checkFabricateBackfire evaluates PENDING FABRICATE ops', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        expect(op.status).toBe('PENDING');

        // Provide alibi
        const engineer = state.truth.crew['engineer'];
        engineer.place = 'mines' as PlaceId;
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: state.truth.tick + 1,
            place: 'mines' as PlaceId,
            alive: true,
            hp: 100,
        };
        // Another crew member in mines as witness
        const witness = Object.values(state.truth.crew).find(c => c.alive && c.id !== 'engineer')!;
        witness.place = 'mines' as PlaceId;

        state.truth.tick += 2;
        checkFabricateBackfire(state);

        expect(op.status).toBe('BACKFIRED');
    });
});

describe('AC-2: Alibi detection', () => {
    test('backfire when target seen working in mines with witness after fabrication', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;
        const fabTick = op.tick;

        // Engineer seen in mines (after fabrication tick)
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: fabTick + 5,
            place: 'mines' as PlaceId,
            alive: true,
            hp: 100,
        };
        // Engineer IS in mines
        state.truth.crew['engineer'].place = 'mines' as PlaceId;
        // Specialist is witness in mines
        state.truth.crew['specialist'].place = 'mines' as PlaceId;

        state.truth.tick = fabTick + 10;
        checkFabricateBackfire(state);

        expect(op.status).toBe('BACKFIRED');
        expect(op.crewAffected).toContain('engineer');
    });

    test('backfire when target seen in engineering with witness', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'specialist' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        state.perception.observation.lastCrewSighting['specialist'] = {
            tick: op.tick + 3,
            place: 'engineering' as PlaceId,
            alive: true,
            hp: 100,
        };
        state.truth.crew['specialist'].place = 'engineering' as PlaceId;
        state.truth.crew['engineer'].place = 'engineering' as PlaceId;

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        expect(op.status).toBe('BACKFIRED');
    });
});

describe('AC-3: No alibi = no backfire (yet)', () => {
    test('op stays PENDING when target is alone or not recently sighted', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // Engineer not sighted — no alibi
        state.truth.tick = op.tick + 10;
        checkFabricateBackfire(state);

        expect(op.status).toBe('PENDING');
    });

    test('op stays PENDING when target is alone in mines (no witness)', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // Engineer seen in mines but alone
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: op.tick + 3,
            place: 'mines' as PlaceId,
            alive: true,
            hp: 100,
        };
        state.truth.crew['engineer'].place = 'mines' as PlaceId;
        // Move all other crew away from mines
        for (const crew of Object.values(state.truth.crew)) {
            if (crew.id !== 'engineer' && crew.alive) {
                crew.place = 'dorms' as PlaceId;
            }
        }

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        expect(op.status).toBe('PENDING');
    });
});

describe('AC-4: Spike formula', () => {
    test('FABRICATE backfire severity=3, no harm → spike = 12 + 6 = 18', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // Give alibi
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: op.tick + 1,
            place: 'mines' as PlaceId,
            alive: true,
            hp: 100,
        };
        state.truth.crew['engineer'].place = 'mines' as PlaceId;
        state.truth.crew['specialist'].place = 'mines' as PlaceId;

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'FABRICATE_BACKFIRE'
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(18); // base 12 + severity 3*2=6
    });
});

describe('AC-5: Target trust destroyed', () => {
    test('target loses motherReliable and gains tamperEvidence on backfire', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        const beforeReliable = state.perception.beliefs['engineer'].motherReliable;
        const beforeEvidence = state.perception.beliefs['engineer'].tamperEvidence;

        // Give alibi
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: op.tick + 1,
            place: 'mines' as PlaceId,
            alive: true,
            hp: 100,
        };
        state.truth.crew['engineer'].place = 'mines' as PlaceId;
        state.truth.crew['specialist'].place = 'mines' as PlaceId;

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        const belief = state.perception.beliefs['engineer'];
        // motherReliable drops by 0.3 (plus whatever applySuspicionChange does)
        expect(belief.motherReliable).toBeLessThanOrEqual(beforeReliable - CONFIG.fabricateBackfireTrustDrop);
        // tamperEvidence gains 20
        expect(belief.tamperEvidence).toBeGreaterThanOrEqual(beforeEvidence + CONFIG.fabricateBackfireEvidenceGain);
    });
});

describe('EC-1: Target is dead', () => {
    test('op resolves when target died before alibi', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // Kill the target
        state.truth.crew['engineer'].alive = false;
        state.truth.crew['engineer'].hp = 0;

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        expect(op.status).toBe('RESOLVED');
    });
});

describe('EC-2: Investigation clears target', () => {
    test('alibi-based backfire still works when target has witnesses', () => {
        // This test covers alibi detection (the investigation-clear path is deferred)
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // Give alibi
        state.perception.observation.lastCrewSighting['engineer'] = {
            tick: op.tick + 2,
            place: 'engineering' as PlaceId,
            alive: true,
            hp: 100,
        };
        state.truth.crew['engineer'].place = 'engineering' as PlaceId;
        state.truth.crew['specialist'].place = 'engineering' as PlaceId;

        state.truth.tick = op.tick + 5;
        checkFabricateBackfire(state);

        expect(op.status).toBe('BACKFIRED');
    });
});

describe('EC-3: Window expires without alibi', () => {
    test('op resolves when window passes without alibi or investigation', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'FABRICATE', target: 'engineer' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'FABRICATE')!;

        // No alibi, no investigation — advance past window
        state.truth.tick = op.windowEndTick + 1;
        checkFabricateBackfire(state);

        expect(op.status).toBe('RESOLVED');
    });
});
