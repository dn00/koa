import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { checkSpoofBackfire } from '../src/kernel/systems/backfire.js';
import type { PlaceId } from '../src/core/types.js';
import { CONFIG } from '../src/config.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Check on window expiry', () => {
    test('SPOOF op evaluated when tick reaches windowEndTick', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        // Should still be PENDING before window expires
        expect(op.status).toBe('PENDING');

        // Advance tick to window expiry, place crew at response location
        state.truth.tick = op.windowEndTick;
        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        crew.place = 'engineering' as PlaceId; // air response place

        checkSpoofBackfire(state);

        // Should have been evaluated (either BACKFIRED or RESOLVED)
        expect(op.status).not.toBe('PENDING');
    });
});

describe('AC-2: Backfire when no real crisis', () => {
    test('SPOOF for air backfires when no air_scrubber arc and crew responded', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        // No arcs active
        state.truth.arcs = [];

        // Crew "responded" by being at response places
        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        crew.place = 'engineering' as PlaceId;
        op.crewAffected.push(crew.id);

        // Advance to window expiry
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        expect(op.status).toBe('BACKFIRED');
        expect(op.backfireTick).toBe(state.truth.tick);
    });
});

describe('AC-3: No backfire when real crisis occurred', () => {
    test('SPOOF for air resolves when air_scrubber arc is active', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        // Create matching real crisis arc (air_scrubber with stepIndex > 0)
        state.truth.arcs = [{
            id: 'air_scrubber-test',
            kind: 'air_scrubber',
            stepIndex: 1,
            nextTick: 999,
            target: 'engineering' as PlaceId,
        }];

        // Crew responded
        op.crewAffected.push('engineer');

        state.truth.tick = op.windowEndTick;
        checkSpoofBackfire(state);

        expect(op.status).toBe('RESOLVED');
    });
});

describe('AC-4: Cry-wolf escalation', () => {
    test('second SPOOF backfire today gives +9 suspicion', () => {
        const { state, rng } = makeTestState();

        // First spoof already backfired (earlier tick)
        state.perception.tamperOps.push({
            id: 'spoof-prev',
            kind: 'SPOOF',
            tick: 1,
            target: { system: 'thermal' },
            windowEndTick: 20,
            status: 'BACKFIRED',
            backfireTick: 20,
            severity: 3,
            crewAffected: ['engineer'],
        });

        // Second spoof
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF' && o.status === 'PENDING')!;

        // Set up crew response
        op.crewAffected.push('specialist');
        state.truth.arcs = [];
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        expect(op.status).toBe('BACKFIRED');

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'SPOOF_BACKFIRE' && e.tick === state.truth.tick
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(CONFIG.spoofBackfireCryWolf2); // 9 for second
    });

    test('third+ SPOOF backfire gives +12 suspicion', () => {
        const { state, rng } = makeTestState();

        // Two previous backfires (earlier ticks)
        state.perception.tamperOps.push(
            {
                id: 'spoof-prev-1',
                kind: 'SPOOF',
                tick: 1,
                target: { system: 'thermal' },
                windowEndTick: 10,
                status: 'BACKFIRED',
                backfireTick: 10,
                severity: 3,
                crewAffected: ['engineer'],
            },
            {
                id: 'spoof-prev-2',
                kind: 'SPOOF',
                tick: 11,
                target: { system: 'power' },
                windowEndTick: 20,
                status: 'BACKFIRED',
                backfireTick: 20,
                severity: 2,
                crewAffected: ['specialist'],
            },
        );

        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF' && o.status === 'PENDING')!;

        op.crewAffected.push('commander');
        state.truth.arcs = [];
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'SPOOF_BACKFIRE' && e.tick === state.truth.tick
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(CONFIG.spoofBackfireCryWolf3); // 12 for third+
    });
});

describe('AC-5: Trust impact on responders', () => {
    test('crew who responded lose motherReliable on backfire', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        const crew1 = Object.values(state.truth.crew).filter(c => c.alive)[0];
        const crew2 = Object.values(state.truth.crew).filter(c => c.alive)[1];
        op.crewAffected.push(crew1.id, crew2.id);

        const before1 = state.perception.beliefs[crew1.id].motherReliable;
        const before2 = state.perception.beliefs[crew2.id].motherReliable;

        state.truth.arcs = [];
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        // Both should lose 0.04 motherReliable (plus whatever applySuspicionChange does)
        // The direct -0.04 is in addition to the suspicion change effect
        expect(state.perception.beliefs[crew1.id].motherReliable).toBeLessThan(before1);
        expect(state.perception.beliefs[crew2.id].motherReliable).toBeLessThan(before2);
    });
});

describe('EC-1: Nobody responded to spoof', () => {
    test('op resolves without backfire if crewAffected is empty', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'air' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        // No crew responded — move all crew away from response places
        for (const crew of Object.values(state.truth.crew)) {
            crew.place = 'dorms' as PlaceId;
            crew.targetPlace = undefined;
        }

        state.truth.arcs = [];
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        expect(op.status).toBe('RESOLVED');
    });
});

describe('EC-2: Spoof system without arc mapping', () => {
    test('SPOOF for comms always backfires if crew responded (no matching arc)', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SPOOF', system: 'comms' }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SPOOF')!;

        // Crew responded
        op.crewAffected.push('commander');

        state.truth.arcs = [];
        state.truth.tick = op.windowEndTick;

        checkSpoofBackfire(state);

        // No arc kind maps to comms, so can't match — always backfires
        expect(op.status).toBe('BACKFIRED');
    });
});
