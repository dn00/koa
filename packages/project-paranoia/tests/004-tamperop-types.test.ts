import { describe, test, expect } from 'vitest';
import type {
    TamperOp,
    TamperOpKind,
    TamperOpStatus,
    ActiveDoubt,
    SuspicionLedgerEntry,
} from '../src/kernel/types.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';

function makeTestState() {
    const rng = createRng(42);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

describe('Task 004: TamperOp + ActiveDoubt + Ledger Types', () => {
    test('AC-1: TamperOp type satisfies expected shape', () => {
        const op: TamperOp = {
            id: 'test-op-1',
            kind: 'SUPPRESS',
            tick: 10,
            target: {
                system: 'sensors',
                place: 'bridge',
            },
            windowEndTick: 20,
            status: 'PENDING',
            severity: 2,
            crewAffected: ['commander', 'engineer'],
        };
        expect(op.id).toBe('test-op-1');
        expect(op.kind).toBe('SUPPRESS');
        expect(op.status).toBe('PENDING');
        expect(op.severity).toBe(2);
        expect(op.crewAffected).toEqual(['commander', 'engineer']);
        expect(op.backfireTick).toBeUndefined();
        expect(op.confessedTick).toBeUndefined();
        expect(op.relatedArcId).toBeUndefined();
    });

    test('AC-1: TamperOp supports all kinds', () => {
        const kinds: TamperOpKind[] = ['SUPPRESS', 'SPOOF', 'FABRICATE'];
        for (const kind of kinds) {
            const op: TamperOp = {
                id: `test-${kind}`,
                kind,
                tick: 1,
                target: {},
                windowEndTick: 10,
                status: 'PENDING',
                severity: 1,
                crewAffected: [],
            };
            expect(op.kind).toBe(kind);
        }
    });

    test('AC-1: TamperOp supports all statuses', () => {
        const statuses: TamperOpStatus[] = ['PENDING', 'RESOLVED', 'BACKFIRED', 'CONFESSED'];
        for (const status of statuses) {
            const op: TamperOp = {
                id: `test-${status}`,
                kind: 'SUPPRESS',
                tick: 1,
                target: {},
                windowEndTick: 10,
                status,
                severity: 1,
                crewAffected: [],
            };
            expect(op.status).toBe(status);
        }
    });

    test('AC-1: ActiveDoubt type satisfies expected shape', () => {
        const doubt: ActiveDoubt = {
            id: 'doubt-1',
            topic: 'sensor_mismatch',
            createdTick: 5,
            severity: 3,
            involvedCrew: ['doctor', 'specialist'],
            relatedOpId: 'op-1',
            system: 'sensors',
            resolved: false,
        };
        expect(doubt.id).toBe('doubt-1');
        expect(doubt.severity).toBe(3);
        expect(doubt.resolved).toBe(false);
    });

    test('AC-1: SuspicionLedgerEntry type satisfies expected shape', () => {
        const entry: SuspicionLedgerEntry = {
            tick: 10,
            delta: 5,
            reason: 'TAMPER_DETECTED',
            detail: 'Sensor readings inconsistent',
        };
        expect(entry.tick).toBe(10);
        expect(entry.delta).toBe(5);
        expect(entry.reason).toBe('TAMPER_DETECTED');
    });

    test('AC-2: PerceptionState has tamperOps, activeDoubts, suspicionLedger arrays', () => {
        const state = makeTestState();
        expect(state.perception).toHaveProperty('tamperOps');
        expect(state.perception).toHaveProperty('activeDoubts');
        expect(state.perception).toHaveProperty('suspicionLedger');
    });

    test('AC-3: createInitialState initializes all three to empty arrays', () => {
        const state = makeTestState();
        expect(state.perception.tamperOps).toEqual([]);
        expect(state.perception.activeDoubts).toEqual([]);
        expect(state.perception.suspicionLedger).toEqual([]);
    });

    test('AC-4: All 5 types are importable from types.ts', () => {
        // TypeScript compilation would fail if these weren't exported.
        // Verify by constructing instances of each type.
        const kind: TamperOpKind = 'SUPPRESS';
        const status: TamperOpStatus = 'PENDING';
        const op: TamperOp = {
            id: 'x', kind, tick: 0, target: {},
            windowEndTick: 0, status, severity: 1, crewAffected: [],
        };
        const doubt: ActiveDoubt = {
            id: 'x', topic: 'y', createdTick: 0,
            severity: 1, involvedCrew: [], resolved: false,
        };
        const entry: SuspicionLedgerEntry = {
            tick: 0, delta: 0, reason: '', detail: '',
        };
        expect(op).toBeDefined();
        expect(doubt).toBeDefined();
        expect(entry).toBeDefined();
    });

    test('EC-1: tamperOps/activeDoubts/suspicionLedger arrays are mutable on state', () => {
        // Verify we can push to the arrays (simulating runtime usage)
        const state = makeTestState();

        const op: TamperOp = {
            id: 'op-1', kind: 'SPOOF', tick: 1, target: { system: 'sensors' },
            windowEndTick: 10, status: 'PENDING', severity: 2, crewAffected: ['commander'],
        };
        state.perception.tamperOps.push(op);
        expect(state.perception.tamperOps.length).toBe(1);
        expect(state.perception.tamperOps[0].id).toBe('op-1');

        const doubt: ActiveDoubt = {
            id: 'd-1', topic: 'test', createdTick: 1,
            severity: 1, involvedCrew: [], resolved: false,
        };
        state.perception.activeDoubts.push(doubt);
        expect(state.perception.activeDoubts.length).toBe(1);

        const entry: SuspicionLedgerEntry = {
            tick: 1, delta: 3, reason: 'TEST', detail: 'test detail',
        };
        state.perception.suspicionLedger.push(entry);
        expect(state.perception.suspicionLedger.length).toBe(1);
    });
});
