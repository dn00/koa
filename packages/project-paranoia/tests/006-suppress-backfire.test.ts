import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { checkSuppressBackfire } from '../src/kernel/systems/backfire.js';
import type { PlaceId } from '../src/core/types.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Backfire check runs each tick', () => {
    test('checkSuppressBackfire is called during stepKernel and evaluates PENDING ops', () => {
        const { state, rng } = makeTestState();

        // Create a SUPPRESS op
        const commands: Command[] = [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }];
        stepKernel(state, commands, rng);

        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;
        expect(op.status).toBe('PENDING');

        // Set up conditions: put crew in burning room
        const place = Object.values(state.truth.crew).find(c => c.alive)!.place;
        state.truth.rooms[place].onFire = true;

        // Step again — backfire should trigger
        stepKernel(state, [], rng);
        expect(op.status).toBe('BACKFIRED');
    });
});

describe('AC-2: Backfire on crew witnessing suppressed crisis', () => {
    test('SUPPRESS thermal backfires when crew in burning room', () => {
        const { state, rng } = makeTestState();

        // Create SUPPRESS for thermal
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Put a crew member in a burning room
        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].onFire = true;

        // Run backfire check
        checkSuppressBackfire(state);

        expect(op.status).toBe('BACKFIRED');
        expect(op.backfireTick).toBe(state.truth.tick);
        expect(op.crewAffected).toContain(crew.id);
    });

    test('SUPPRESS air backfires when crew in low-O2 room', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'air', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].o2Level = 20;

        checkSuppressBackfire(state);
        expect(op.status).toBe('BACKFIRED');
    });

    test('SUPPRESS radiation backfires when crew in high-rad room', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'radiation', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].radiation = 10;

        checkSuppressBackfire(state);
        expect(op.status).toBe('BACKFIRED');
    });

    test('SUPPRESS power backfires when station power < 40', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'power', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        state.truth.station.power = 30;

        checkSuppressBackfire(state);
        expect(op.status).toBe('BACKFIRED');
    });
});

describe('AC-3: Spike formula correct', () => {
    test('SUPPRESS severity=3, no casualties → spike = 10 + 6 = 16', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].onFire = true;

        const ledgerBefore = state.perception.suspicionLedger.length;
        checkSuppressBackfire(state);

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'SUPPRESS_BACKFIRE' && e.tick === state.truth.tick
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(16); // base 10 + severity 3*2
    });
});

describe('AC-4: Spike with casualties', () => {
    test('SUPPRESS severity=2, injury during window → spike = 10 + 4 + 2 = 16', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'air', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Simulate an injury in the ledger during the suppress window
        state.perception.suspicionLedger.push({
            tick: state.truth.tick,
            delta: 5,
            reason: 'CREW_INJURED',
            detail: 'someone injured',
        });

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].o2Level = 20;

        checkSuppressBackfire(state);

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'SUPPRESS_BACKFIRE'
        );
        expect(entry).toBeDefined();
        expect(entry!.delta).toBe(16); // base 10 + severity 2*2 + injury 2
    });
});

describe('AC-5: Spike capped', () => {
    test('SUPPRESS severity=3, injury + death → spike capped at 18', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);

        // Add both injury and death to ledger
        state.perception.suspicionLedger.push(
            { tick: state.truth.tick, delta: 5, reason: 'CREW_INJURED', detail: 'injured' },
            { tick: state.truth.tick, delta: 14, reason: 'CREW_DIED', detail: 'died' },
        );

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].onFire = true;

        checkSuppressBackfire(state);

        const entry = state.perception.suspicionLedger.find(
            e => e.reason === 'SUPPRESS_BACKFIRE'
        );
        expect(entry).toBeDefined();
        // base 10 + severity 3*2=6 + injury 2 + death 4 = 22, capped at 18
        expect(entry!.delta).toBe(18);
    });
});

describe('AC-6: Status transition', () => {
    test('PENDING op becomes BACKFIRED with backfireTick', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        expect(op.status).toBe('PENDING');

        const crew = Object.values(state.truth.crew).find(c => c.alive)!;
        state.truth.rooms[crew.place].onFire = true;

        checkSuppressBackfire(state);

        expect(op.status).toBe('BACKFIRED');
        expect(op.backfireTick).toBe(state.truth.tick);
    });
});

describe('EC-1: Multiple crew in crisis room', () => {
    test('single backfire even with 3 crew in burning room — all added to crewAffected', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Move all crew to same burning room
        const targetPlace = 'engineering' as PlaceId;
        state.truth.rooms[targetPlace].onFire = true;
        const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
        for (const c of aliveCrew) c.place = targetPlace;

        checkSuppressBackfire(state);

        expect(op.status).toBe('BACKFIRED');
        expect(op.crewAffected.length).toBe(aliveCrew.length);

        // Verify only one SUPPRESS_BACKFIRE ledger entry (not N entries)
        const backfireEntries = state.perception.suspicionLedger.filter(
            e => e.reason === 'SUPPRESS_BACKFIRE'
        );
        expect(backfireEntries.length).toBe(1);
    });
});

describe('EC-2: Suppression expired naturally', () => {
    test('op becomes RESOLVED when window expires without crisis', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 10 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Advance tick past windowEndTick
        state.truth.tick = op.windowEndTick + 1;

        checkSuppressBackfire(state);

        expect(op.status).toBe('RESOLVED');
    });
});

describe('EC-3: Crisis resolves before crew enters', () => {
    test('no backfire if no crew in crisis room', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'thermal', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS')!;

        // Set fire in an empty room
        const crewPlaces = new Set(Object.values(state.truth.crew).filter(c => c.alive).map(c => c.place));
        const emptyRoom = Object.keys(state.truth.rooms).find(r => !crewPlaces.has(r as PlaceId)) as PlaceId;
        if (emptyRoom) {
            state.truth.rooms[emptyRoom].onFire = true;
        }

        checkSuppressBackfire(state);

        // No crew saw it — no backfire
        expect(op.status).toBe('PENDING');
    });
});

describe('ERR-1: No matching room state', () => {
    test('skip backfire for unrecognized system', () => {
        const { state, rng } = makeTestState();
        stepKernel(state, [{ type: 'SUPPRESS', system: 'comms', duration: 50 }], rng);
        const op = state.perception.tamperOps.find(o => o.kind === 'SUPPRESS' && o.target.system === 'comms')!;

        // Comms doesn't map to any room condition
        checkSuppressBackfire(state);

        // Should stay PENDING (no condition to check)
        expect(op.status).toBe('PENDING');
    });
});
