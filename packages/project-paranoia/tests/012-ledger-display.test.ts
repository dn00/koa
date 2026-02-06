import { describe, test, expect } from 'vitest';
import {
    formatLedgerEntries,
    formatDayRecap,
    formatActiveDoubtsDisplay,
} from '../src/kernel/perception.js';
import type { SuspicionLedgerEntry, ActiveDoubt } from '../src/kernel/types.js';

describe('AC-1: Recent ledger in STATUS', () => {
    test('shows last 5 ledger entries formatted with most recent first', () => {
        const ledger: SuspicionLedgerEntry[] = [
            { tick: 100, delta: 10, reason: 'SUPPRESS_BACKFIRE', detail: 'thermal crisis hidden' },
            { tick: 110, delta: 5, reason: 'CRISIS_WITNESSED', detail: 'fire in medbay' },
            { tick: 120, delta: -6, reason: 'VERIFY_TRUST', detail: 'cleared doubt' },
            { tick: 130, delta: 2, reason: 'EARLY_CONFESSION', detail: 'admitted thermal' },
            { tick: 140, delta: -4, reason: 'QUIET_DAY', detail: 'no incidents' },
            { tick: 150, delta: 3, reason: 'ORDER_REFUSED', detail: 'commander refused' },
        ];

        const lines = formatLedgerEntries(ledger, 5);

        // Should show last 5 (skip the oldest entry at tick 100)
        expect(lines.length).toBe(5);
        // Most recent first
        expect(lines[0]).toContain('T150');
        expect(lines[0]).toContain('+3');
        expect(lines[0]).toContain('ORDER_REFUSED');
        // Negative deltas show sign (VERIFY_TRUST at tick 120 is 4th most recent → index 3)
        expect(lines[3]).toContain('-6');
        expect(lines[3]).toContain('VERIFY_TRUST');
    });
});

describe('AC-2: End-of-day recap', () => {
    test('shows start/end suspicion, net change, and top increases/decreases', () => {
        const ledger: SuspicionLedgerEntry[] = [
            { tick: 100, delta: 10, reason: 'SUPPRESS_BACKFIRE', detail: 'thermal crisis hidden' },
            { tick: 110, delta: 5, reason: 'CRISIS_WITNESSED', detail: 'fire in medbay' },
            { tick: 120, delta: -6, reason: 'VERIFY_TRUST', detail: 'cleared doubt' },
            { tick: 130, delta: 2, reason: 'EARLY_CONFESSION', detail: 'admitted thermal' },
            { tick: 140, delta: -4, reason: 'QUIET_DAY', detail: 'no incidents' },
        ];

        const lines = formatDayRecap(ledger, 100, 240, 3, 32, 47);

        // Should contain day number
        expect(lines.some(l => l.includes('DAY 3'))).toBe(true);
        // Should contain start/end suspicion values
        expect(lines.some(l => l.includes('Started: 32') && l.includes('Ended: 47'))).toBe(true);
        // Should list top increases
        expect(lines.some(l => l.includes('+10') && l.includes('SUPPRESS_BACKFIRE'))).toBe(true);
        // Should list top decreases
        expect(lines.some(l => l.includes('-6') && l.includes('VERIFY_TRUST'))).toBe(true);
    });
});

describe('AC-3: Active doubts shown', () => {
    test('shows active doubts with age and VERIFY hint', () => {
        const doubts: ActiveDoubt[] = [
            {
                id: 'doubt-1',
                topic: 'thermal crisis was hidden',
                createdTick: 100,
                severity: 2,
                involvedCrew: [],
                resolved: false,
            },
            {
                id: 'doubt-2',
                topic: 'Sensor conflict in cargo',
                createdTick: 130,
                severity: 1,
                involvedCrew: [],
                resolved: false,
            },
            {
                id: 'doubt-resolved',
                topic: 'already resolved doubt',
                createdTick: 90,
                severity: 1,
                involvedCrew: [],
                resolved: true,
            },
        ];

        const lines = formatActiveDoubtsDisplay(doubts, 150);

        // Only unresolved doubts shown (2 of 3)
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('thermal crisis was hidden');
        expect(lines[0]).toContain('50 ticks ago');
        expect(lines[0]).toContain('VERIFY');
        expect(lines[1]).toContain('20 ticks ago');
    });
});

describe('AC-4: Empty states', () => {
    test('empty ledger returns empty array', () => {
        expect(formatLedgerEntries([], 5).length).toBe(0);
    });

    test('no active doubts returns empty array', () => {
        expect(formatActiveDoubtsDisplay([], 100).length).toBe(0);
    });

    test('empty ledger day recap returns empty array', () => {
        expect(formatDayRecap([], 100, 240, 1).length).toBe(0);
    });
});

describe('EC-1: Very long detail strings', () => {
    test('detail truncated to ~60 chars with ellipsis', () => {
        const ledger: SuspicionLedgerEntry[] = [
            { tick: 100, delta: 5, reason: 'TEST', detail: 'A'.repeat(100) },
        ];

        const lines = formatLedgerEntries(ledger, 5);
        expect(lines.length).toBe(1);
        expect(lines[0]).toContain('...');
        // Full detail (100 chars) should not appear
        expect(lines[0]).not.toContain('A'.repeat(100));
    });
});

describe('EC-2: Many ledger entries in one tick', () => {
    test('all entries from same tick shown up to display limit', () => {
        const ledger: SuspicionLedgerEntry[] = [
            { tick: 100, delta: 5, reason: 'EVENT_A', detail: 'first' },
            { tick: 100, delta: 3, reason: 'EVENT_B', detail: 'second' },
            { tick: 100, delta: -2, reason: 'EVENT_C', detail: 'third' },
        ];

        const lines = formatLedgerEntries(ledger, 5);
        expect(lines.length).toBe(3);
        // All show T100
        for (const line of lines) {
            expect(line).toContain('T100');
        }
    });
});
