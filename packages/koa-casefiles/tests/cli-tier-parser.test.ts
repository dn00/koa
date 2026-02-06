import { describe, test, expect } from 'vitest';
import { parseTier } from '../src/tier-parser.js';
import { simulate, generateValidatedCase } from '../src/sim.js';
import { DIFFICULTY_PROFILES } from '../src/types.js';

// Task 004 — Update CLI and game.ts parsers

describe('AC-1: --tier 3 uses Challenging profile', () => {
    test('parseTier("3") returns tier 3', () => {
        expect(parseTier('3')).toBe(3);
    });

    test('parseTier("challenging") returns tier 3', () => {
        expect(parseTier('challenging')).toBe(3);
    });

    test('parseTier("chal") returns tier 3', () => {
        expect(parseTier('chal')).toBe(3);
    });

    test('simulate with tier 3 produces tier 3 config', () => {
        // Try several seeds to find one that produces a case
        for (let seed = 1; seed <= 20; seed++) {
            const result = simulate(seed, 3);
            if (result) {
                expect(result.config.tier).toBe(3);
                return;
            }
        }
        throw new Error('No valid case generated for tier 3 within 20 seeds');
    });
});

describe('AC-2: --difficulty hard maps to tier 4', () => {
    test('parseTier("hard") returns tier 4', () => {
        expect(parseTier('hard')).toBe(4);
    });

    test('parseTier("h") returns tier 4', () => {
        expect(parseTier('h')).toBe(4);
    });

    test('simulate with tier 4 produces tier 4 config', () => {
        for (let seed = 1; seed <= 20; seed++) {
            const result = simulate(seed, 4);
            if (result) {
                expect(result.config.tier).toBe(4);
                return;
            }
        }
        throw new Error('No valid case generated for tier 4 within 20 seeds');
    });
});

describe('AC-3: Named aliases accepted', () => {
    test('parseTier("tutorial") returns tier 1', () => {
        expect(parseTier('tutorial')).toBe(1);
    });

    test('parseTier("tut") returns tier 1', () => {
        expect(parseTier('tut')).toBe(1);
    });

    test('parseTier("standard") returns tier 2', () => {
        expect(parseTier('standard')).toBe(2);
    });

    test('parseTier("std") returns tier 2', () => {
        expect(parseTier('std')).toBe(2);
    });

    test('parseTier("expert") returns tier 4', () => {
        expect(parseTier('expert')).toBe(4);
    });

    test('parseTier("exp") returns tier 4', () => {
        expect(parseTier('exp')).toBe(4);
    });
});

describe('EC-1: Invalid tier value falls back', () => {
    test('parseTier("5") returns undefined', () => {
        expect(parseTier('5')).toBeUndefined();
    });

    test('parseTier("banana") returns undefined', () => {
        expect(parseTier('banana')).toBeUndefined();
    });

    test('parseTier("0") returns undefined', () => {
        expect(parseTier('0')).toBeUndefined();
    });
});

describe('EC-2: Both --tier and --difficulty use same parseTier', () => {
    test('--difficulty and --tier both resolve through parseTier (last wins in CLI)', () => {
        // Both --tier and --difficulty feed into parseTier in the arg loop.
        // When both are provided, the last one wins (sequential arg parsing).
        // We verify parseTier handles all value types that either flag could receive.
        expect(parseTier('3')).toBe(3);           // --tier 3
        expect(parseTier('easy')).toBe(1);         // --difficulty easy
        expect(parseTier('challenging')).toBe(3);  // --tier challenging
        expect(parseTier('hard')).toBe(4);         // --difficulty hard
    });
});

describe('EC-3: Legacy difficulty aliases map correctly', () => {
    test('parseTier("easy") returns tier 1', () => {
        expect(parseTier('easy')).toBe(1);
    });

    test('parseTier("e") returns tier 1', () => {
        expect(parseTier('e')).toBe(1);
    });

    test('parseTier("medium") returns tier 2', () => {
        expect(parseTier('medium')).toBe(2);
    });

    test('parseTier("med") returns tier 2', () => {
        expect(parseTier('med')).toBe(2);
    });

    test('parseTier("m") returns tier 2', () => {
        expect(parseTier('m')).toBe(2);
    });
});

describe('ERR-1: No tier specified defaults to tier 2', () => {
    test('simulate without tier defaults to tier 2', () => {
        for (let seed = 1; seed <= 20; seed++) {
            const result = simulate(seed);
            if (result) {
                expect(result.config.tier).toBe(2);
                return;
            }
        }
        throw new Error('No valid case generated with default tier within 20 seeds');
    });
});
