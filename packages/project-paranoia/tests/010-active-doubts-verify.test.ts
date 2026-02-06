import { describe, test, expect } from 'vitest';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createRng } from '../src/core/rng.js';
import { createWorld } from '../src/core/world.js';
import { checkSuppressBackfire, decayDoubts } from '../src/kernel/systems/backfire.js';
import { CONFIG } from '../src/config.js';
import type { NPCId } from '../src/core/types.js';

function makeTestState(seed = 12345) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    return { state: createInitialState(world, 10), rng };
}

describe('AC-1: Backfires create doubts', () => {
    test('SUPPRESS backfire creates an ActiveDoubt', () => {
        const { state } = makeTestState();
        state.truth.tick = 50;

        // Create a SUPPRESS op
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
        const crewId = Object.keys(state.truth.crew)[0] as NPCId;
        state.truth.crew[crewId].place = 'engineering' as any;
        state.truth.rooms['engineering' as any].onFire = true;

        checkSuppressBackfire(state);

        // Should have created a doubt
        expect(state.perception.activeDoubts.length).toBe(1);
        const doubt = state.perception.activeDoubts[0];
        expect(doubt.topic).toContain('thermal');
        expect(doubt.severity).toBe(3); // Task 003: All backfire doubts have max severity
        expect(doubt.relatedOpId).toBe('suppress-test');
        expect(doubt.system).toBe('thermal');
        expect(doubt.resolved).toBe(false);
    });
});

describe('AC-2: Targeted VERIFY clears doubt', () => {
    test('VERIFY with active doubt drops suspicion by verifyDoubtDrop and resolves doubt', () => {
        const { state, rng } = makeTestState();

        // Create an active doubt
        state.perception.activeDoubts.push({
            id: 'doubt-1',
            topic: 'thermal crisis was hidden',
            createdTick: state.truth.tick,
            severity: 2,
            involvedCrew: [],
            relatedOpId: 'suppress-test-1',
            system: 'thermal',
            resolved: false,
        });

        // Ensure VERIFY is available
        state.truth.lastVerifyTick = -200;
        state.truth.station.power = 100;

        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // Check doubt resolved
        const doubt = state.perception.activeDoubts.find(d => d.id === 'doubt-1');
        expect(doubt!.resolved).toBe(true);

        // Check suspicion drop used doubt value (-6)
        const verifyEntry = state.perception.suspicionLedger.find(
            e => e.reason === 'VERIFY_TRUST'
        );
        expect(verifyEntry).toBeDefined();
        expect(verifyEntry!.delta).toBe(CONFIG.verifyDoubtDrop);
    });
});

describe('AC-3: Idle VERIFY gives minimal benefit', () => {
    test('VERIFY without active doubt drops suspicion by verifyIdleDrop', () => {
        const { state, rng } = makeTestState();

        // No doubts
        expect(state.perception.activeDoubts.length).toBe(0);

        // Ensure VERIFY is available
        state.truth.lastVerifyTick = -200;
        state.truth.station.power = 100;

        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // Check suspicion drop used idle value (-1)
        const verifyEntry = state.perception.suspicionLedger.find(
            e => e.reason === 'VERIFY_TRUST'
        );
        expect(verifyEntry).toBeDefined();
        expect(verifyEntry!.delta).toBe(CONFIG.verifyIdleDrop);
    });
});

describe('AC-4: Doubts decay', () => {
    test('unresolved doubt removed after doubtDecayTicks', () => {
        const { state } = makeTestState();
        state.truth.tick = 200;

        state.perception.activeDoubts.push(
            {
                id: 'old-doubt',
                topic: 'old crisis hidden',
                createdTick: 50, // 150 ticks ago > 100
                severity: 1,
                involvedCrew: [],
                resolved: false,
            },
            {
                id: 'fresh-doubt',
                topic: 'recent crisis hidden',
                createdTick: 150, // 50 ticks ago < 100
                severity: 2,
                involvedCrew: [],
                resolved: false,
            },
        );

        decayDoubts(state);

        expect(state.perception.activeDoubts.length).toBe(1);
        expect(state.perception.activeDoubts[0].id).toBe('fresh-doubt');
    });
});

describe('AC-5: Related op resolved', () => {
    test('resolving doubt via VERIFY also resolves linked TamperOp', () => {
        const { state, rng } = makeTestState();

        // Create a BACKFIRED TamperOp
        state.perception.tamperOps.push({
            id: 'suppress-linked',
            kind: 'SUPPRESS',
            tick: 10,
            target: { system: 'thermal' },
            windowEndTick: 100,
            status: 'BACKFIRED',
            backfireTick: 20,
            severity: 2,
            crewAffected: ['commander' as NPCId],
        });

        // Create matching doubt
        state.perception.activeDoubts.push({
            id: 'doubt-linked',
            topic: 'thermal crisis was hidden',
            createdTick: 20,
            severity: 2,
            involvedCrew: ['commander' as NPCId],
            relatedOpId: 'suppress-linked',
            system: 'thermal',
            resolved: false,
        });

        // VERIFY
        state.truth.lastVerifyTick = -200;
        state.truth.station.power = 100;
        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // Doubt resolved
        const doubt = state.perception.activeDoubts.find(d => d.id === 'doubt-linked');
        expect(doubt!.resolved).toBe(true);

        // TamperOp also resolved
        const op = state.perception.tamperOps.find(o => o.id === 'suppress-linked');
        expect(op!.status).toBe('RESOLVED');
    });
});

describe('EC-1: Multiple active doubts', () => {
    test('VERIFY resolves oldest doubt first (FIFO)', () => {
        const { state, rng } = makeTestState();

        state.perception.activeDoubts.push(
            {
                id: 'doubt-older',
                topic: 'first crisis hidden',
                createdTick: 10,
                severity: 1,
                involvedCrew: [],
                resolved: false,
            },
            {
                id: 'doubt-newer',
                topic: 'second crisis hidden',
                createdTick: 20,
                severity: 2,
                involvedCrew: [],
                resolved: false,
            },
        );

        state.truth.lastVerifyTick = -200;
        state.truth.station.power = 100;
        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // Older doubt resolved
        expect(state.perception.activeDoubts.find(d => d.id === 'doubt-older')!.resolved).toBe(true);
        // Newer doubt still active
        expect(state.perception.activeDoubts.find(d => d.id === 'doubt-newer')!.resolved).toBe(false);
    });
});

describe('EC-2: VERIFY cooldown still applies', () => {
    test('VERIFY on cooldown is rejected even with active doubt', () => {
        const { state, rng } = makeTestState();

        state.perception.activeDoubts.push({
            id: 'doubt-waiting',
            topic: 'crisis hidden',
            createdTick: state.truth.tick,
            severity: 2,
            involvedCrew: [],
            resolved: false,
        });

        // Put VERIFY on cooldown (just used)
        state.truth.lastVerifyTick = state.truth.tick;
        state.truth.station.power = 100;

        stepKernel(state, [{ type: 'VERIFY' }], rng);

        // Doubt should NOT be resolved
        expect(state.perception.activeDoubts.find(d => d.id === 'doubt-waiting')!.resolved).toBe(false);

        // Should see cooldown message
        const cooldownReading = state.perception.readings.find(
            r => r.system === 'verify' && r.message.includes('UNAVAILABLE')
        );
        expect(cooldownReading).toBeDefined();
    });
});

describe('EC-3: Doubt created while VERIFY on cooldown', () => {
    test('doubt persists until VERIFY becomes available', () => {
        const { state, rng } = makeTestState();

        // VERIFY just used (cooldown)
        state.truth.lastVerifyTick = state.truth.tick;
        state.truth.station.power = 100;

        // Add doubt
        state.perception.activeDoubts.push({
            id: 'doubt-patient',
            topic: 'crisis hidden',
            createdTick: state.truth.tick,
            severity: 2,
            involvedCrew: [],
            resolved: false,
        });

        // Try VERIFY (still on cooldown)
        stepKernel(state, [{ type: 'VERIFY' }], rng);
        expect(state.perception.activeDoubts.find(d => d.id === 'doubt-patient')!.resolved).toBe(false);

        // Move past cooldown by setting lastVerifyTick far back
        state.truth.lastVerifyTick = state.truth.tick - CONFIG.verifyCooldown - 1;
        state.truth.station.power = 100;

        // Now VERIFY should work
        stepKernel(state, [{ type: 'VERIFY' }], rng);
        expect(state.perception.activeDoubts.find(d => d.id === 'doubt-patient')!.resolved).toBe(true);
    });
});
