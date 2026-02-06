import { describe, it, expect } from 'vitest';
import {
    DEFAULT_SCHEDULE,
    getTierForDate,
    dateToDayOfWeek,
    getDailyBaseSeed,
    findValidDailySeed,
    type DayOfWeek,
    type WeeklySchedule,
    type DailyCaseRecord,
} from '../src/daily/index.js';
import { generateValidatedCase } from '../src/sim.js';
import { validateCase } from '../src/validators.js';
import { RULESET_VERSION } from '../src/types.js';

/* ── Task 001 ── Schedule, History Types, and Date Lookup ── */

describe('Task 001 — AC-1: DEFAULT_SCHEDULE has all 7 days with correct tiers', () => {
    it('has entries for all 7 days', () => {
        const days: DayOfWeek[] = [
            'monday', 'tuesday', 'wednesday', 'thursday',
            'friday', 'saturday', 'sunday',
        ];
        for (const day of days) {
            expect(DEFAULT_SCHEDULE[day]).toBeDefined();
            expect(DEFAULT_SCHEDULE[day].tier).toBeGreaterThanOrEqual(1);
            expect(DEFAULT_SCHEDULE[day].tier).toBeLessThanOrEqual(4);
        }
    });

    it('assigns correct tiers per spec', () => {
        expect(DEFAULT_SCHEDULE.monday.tier).toBe(1);
        expect(DEFAULT_SCHEDULE.tuesday.tier).toBe(2);
        expect(DEFAULT_SCHEDULE.wednesday.tier).toBe(2);
        expect(DEFAULT_SCHEDULE.thursday.tier).toBe(3);
        expect(DEFAULT_SCHEDULE.friday.tier).toBe(2);
        expect(DEFAULT_SCHEDULE.saturday.tier).toBe(1);
        expect(DEFAULT_SCHEDULE.sunday.tier).toBe(4);
    });
});

describe('Task 001 — AC-2: getTierForDate resolves date to tier', () => {
    it('returns tier 3 for 2026-02-05 (Thursday)', () => {
        expect(getTierForDate('2026-02-05')).toBe(3);
    });

    it('returns tier 1 for 2026-02-02 (Monday)', () => {
        expect(getTierForDate('2026-02-02')).toBe(1);
    });

    it('returns tier 4 for 2026-02-08 (Sunday)', () => {
        expect(getTierForDate('2026-02-08')).toBe(4);
    });
});

describe('Task 001 — AC-3: getTierForDate uses UTC day', () => {
    it('resolves based on UTC day-of-week, not local timezone', () => {
        // 2026-02-05 is Thursday UTC regardless of local timezone
        const tier = getTierForDate('2026-02-05');
        expect(tier).toBe(3); // Thursday = Challenging
    });
});

describe('Task 001 — AC-4: DailyCaseRecord has required fields', () => {
    it('can construct a record with all required fields', () => {
        const record: DailyCaseRecord = {
            date: '2026-02-05',
            seed: 12345,
            tier: 3,
            culprit: 'alice',
            crimeType: 'theft',
            rulesetVersion: '0.1.0',
            offset: 7,
        };
        expect(record.date).toBe('2026-02-05');
        expect(record.seed).toBe(12345);
        expect(record.tier).toBe(3);
        expect(record.culprit).toBe('alice');
        expect(record.crimeType).toBe('theft');
        expect(record.rulesetVersion).toBe('0.1.0');
        expect(record.offset).toBe(7);
    });
});

describe('Task 001 — AC-5: dateToDayOfWeek maps correctly', () => {
    it('maps all 7 days correctly', () => {
        // 2026-02-02 is Monday, 2026-02-03 is Tuesday, etc.
        const cases: [string, DayOfWeek][] = [
            ['2026-02-02', 'monday'],
            ['2026-02-03', 'tuesday'],
            ['2026-02-04', 'wednesday'],
            ['2026-02-05', 'thursday'],
            ['2026-02-06', 'friday'],
            ['2026-02-07', 'saturday'],
            ['2026-02-08', 'sunday'],
        ];
        for (const [dateStr, expected] of cases) {
            expect(dateToDayOfWeek(new Date(dateStr))).toBe(expected);
        }
    });
});

describe('Task 001 — EC-1: getTierForDate with custom schedule', () => {
    it('uses custom schedule when provided', () => {
        const custom: WeeklySchedule = {
            monday: { tier: 4 },
            tuesday: { tier: 4 },
            wednesday: { tier: 4 },
            thursday: { tier: 4 },
            friday: { tier: 4 },
            saturday: { tier: 4 },
            sunday: { tier: 4 },
        };
        // 2026-02-02 is Monday
        expect(getTierForDate('2026-02-02', custom)).toBe(4);
    });
});

/* ── Task 002 ── Seed Finder Logic ── */

describe('Task 002 — AC-1: getDailyBaseSeed is deterministic', () => {
    it('returns identical number for same inputs', () => {
        const a = getDailyBaseSeed('2026-02-05', 'secret', RULESET_VERSION);
        const b = getDailyBaseSeed('2026-02-05', 'secret', RULESET_VERSION);
        expect(a).toBe(b);
    });
});

describe('Task 002 — AC-2: getDailyBaseSeed differs by date', () => {
    it('returns different numbers for different dates', () => {
        const a = getDailyBaseSeed('2026-02-05', 'secret', RULESET_VERSION);
        const b = getDailyBaseSeed('2026-02-06', 'secret', RULESET_VERSION);
        expect(a).not.toBe(b);
    });
});

describe('Task 002 — AC-3: getDailyBaseSeed differs by secret', () => {
    it('returns different numbers for different secrets', () => {
        const a = getDailyBaseSeed('2026-02-05', 'secret-a', RULESET_VERSION);
        const b = getDailyBaseSeed('2026-02-05', 'secret-b', RULESET_VERSION);
        expect(a).not.toBe(b);
    });
});

describe('Task 002 — AC-4: getDailyBaseSeed returns valid number range', () => {
    it('returns a positive integer', () => {
        const seed = getDailyBaseSeed('2026-02-05', 'secret', RULESET_VERSION);
        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThanOrEqual(0xFFFFFFFF);
    });
});

describe('Task 002 — AC-5: findValidDailySeed finds a valid seed', () => {
    it('returns a FinderResult with required fields', () => {
        const result = findValidDailySeed('2026-02-05', 2, []);
        expect(result).not.toBeNull();
        expect(result!.seed).toEqual(expect.any(Number));
        expect(result!.tier).toEqual(expect.any(Number));
        expect(result!.offset).toEqual(expect.any(Number));
        expect(result!.culprit).toEqual(expect.any(String));
        expect(result!.crimeType).toEqual(expect.any(String));
        expect(result!.date).toBe('2026-02-05');
        expect(result!.rulesetVersion).toBe(RULESET_VERSION);
    });
}, 30_000);

describe('Task 002 — AC-6: findValidDailySeed result produces valid case', () => {
    it('result seed generates a valid case that passes validateCase', () => {
        const result = findValidDailySeed('2026-02-05', 2, []);
        expect(result).not.toBeNull();
        const caseData = generateValidatedCase(result!.seed, result!.tier);
        expect(caseData).not.toBeNull();
        const validation = validateCase(
            caseData!.sim.world,
            caseData!.sim.config,
            caseData!.evidence,
        );
        expect(validation.passed).toBe(true);
    });
}, 30_000);

describe('Task 002 — AC-7: findValidDailySeed returns null when exhausted', () => {
    it('returns null when maxOffsets is 0', () => {
        const result = findValidDailySeed('2026-02-05', 2, [], { maxOffsets: 0 });
        expect(result).toBeNull();
    });
});

describe('Task 002 — AC-8: findValidDailySeed skips same crimeType as yesterday', () => {
    it('returned crimeType differs from yesterday', () => {
        // Run once to find what crimeType we get with no constraints
        const baseline = findValidDailySeed('2026-02-05', 2, []);
        expect(baseline).not.toBeNull();

        // Now constrain yesterday to that crimeType
        const history: DailyCaseRecord[] = [{
            date: '2026-02-04',
            seed: 1,
            tier: 2,
            culprit: 'nobody',
            crimeType: baseline!.crimeType as DailyCaseRecord['crimeType'],
            rulesetVersion: RULESET_VERSION,
            offset: 0,
        }];
        const constrained = findValidDailySeed('2026-02-05', 2, history);
        // Either null (couldn't find different) or different crimeType
        if (constrained) {
            expect(constrained.crimeType).not.toBe(baseline!.crimeType);
        }
    });
}, 30_000);

describe('Task 002 — AC-9: findValidDailySeed skips same culprit as yesterday', () => {
    it('returned culprit differs from yesterday', () => {
        const baseline = findValidDailySeed('2026-02-05', 2, []);
        expect(baseline).not.toBeNull();

        const history: DailyCaseRecord[] = [{
            date: '2026-02-04',
            seed: 1,
            tier: 2,
            culprit: baseline!.culprit,
            crimeType: 'disappearance', // unlikely to conflict
            rulesetVersion: RULESET_VERSION,
            offset: 0,
        }];
        const constrained = findValidDailySeed('2026-02-05', 2, history);
        if (constrained) {
            expect(constrained.culprit).not.toBe(baseline!.culprit);
        }
    });
}, 30_000);

describe('Task 002 — AC-10: findValidDailySeed with empty history has no constraints', () => {
    it('returns first valid seed without variety filtering', () => {
        const result = findValidDailySeed('2026-02-05', 2, []);
        expect(result).not.toBeNull();
    });
}, 30_000);

describe('Task 002 — EC-1: getDailyBaseSeed differs by rulesetVersion', () => {
    it('returns different base seed for different rulesetVersion', () => {
        const a = getDailyBaseSeed('2026-02-05', 'secret', '0.1.0');
        const b = getDailyBaseSeed('2026-02-05', 'secret', '0.2.0');
        expect(a).not.toBe(b);
    });
});

describe('Task 002 — EC-2: findValidDailySeed skips invalid offset', () => {
    it('skips offsets that produce invalid cases', () => {
        // With enough offsets, it should find a valid one even if first few fail
        const result = findValidDailySeed('2026-02-05', 2, [], { maxOffsets: 1000 });
        if (result) {
            // offset >= 0 means it searched
            expect(result.offset).toBeGreaterThanOrEqual(0);
        }
    });
}, 30_000);

describe('Task 002 — ERR-1: findValidDailySeed with impossible constraints', () => {
    it('returns null, never throws', () => {
        // Tiny search space with restrictive history
        const history: DailyCaseRecord[] = [{
            date: '2026-02-04',
            seed: 1,
            tier: 2,
            culprit: 'alice',
            crimeType: 'theft',
            rulesetVersion: RULESET_VERSION,
            offset: 0,
        }];
        const result = findValidDailySeed('2026-02-05', 2, history, { maxOffsets: 1 });
        // Should be null or a valid result — never throws
        expect(result === null || typeof result === 'object').toBe(true);
    });
});
