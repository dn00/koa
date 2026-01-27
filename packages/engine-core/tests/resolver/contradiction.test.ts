import { describe, it, expect } from 'vitest';
import {
  detectContradictions,
  parseTime,
  parseTimeRange,
  getTimeGapMinutes,
} from '../../src/resolver/contradiction.js';
import type { EvidenceCard, CardId } from '../../src/index.js';
import { ProofType, ContradictionSeverity } from '../../src/index.js';

/**
 * Task 004: Contradiction Detection
 */
describe('Task 004: Contradiction Detection', () => {
  // Helper to create test cards
  function createCard(
    id: string,
    options: {
      state?: string;
      location?: string;
      timeRange?: string;
    }
  ): EvidenceCard {
    return {
      id: `card_${id}` as CardId,
      power: 1,
      proves: [ProofType.IDENTITY],
      claims: {
        state: options.state,
        location: options.location,
        timeRange: options.timeRange,
      },
    };
  }

  // ==========================================================================
  // Time Parsing Tests
  // ==========================================================================
  describe('Time Parsing', () => {
    it('should parse 12-hour AM time', () => {
      const result = parseTime('2:05am');
      expect(result).toEqual({ minutes: 125 }); // 2*60 + 5
    });

    it('should parse 12-hour PM time', () => {
      const result = parseTime('2:05pm');
      expect(result).toEqual({ minutes: 845 }); // 14*60 + 5
    });

    it('should parse 12:00am as midnight', () => {
      const result = parseTime('12:00am');
      expect(result).toEqual({ minutes: 0 });
    });

    it('should parse 12:00pm as noon', () => {
      const result = parseTime('12:00pm');
      expect(result).toEqual({ minutes: 720 }); // 12*60
    });

    it('should parse 24-hour time', () => {
      const result = parseTime('14:30');
      expect(result).toEqual({ minutes: 870 }); // 14*60 + 30
    });

    it('should parse time range', () => {
      const result = parseTimeRange('2:05am-2:10am');
      expect(result).toEqual({ start: 125, end: 130 });
    });
  });

  // ==========================================================================
  // Time Gap Calculation
  // ==========================================================================
  describe('Time Gap Calculation', () => {
    it('should calculate gap between sequential ranges', () => {
      const range1 = { start: 100, end: 110 };
      const range2 = { start: 115, end: 120 };
      expect(getTimeGapMinutes(range1, range2)).toBe(5);
    });

    it('should return 0 for overlapping ranges', () => {
      const range1 = { start: 100, end: 120 };
      const range2 = { start: 110, end: 130 };
      expect(getTimeGapMinutes(range1, range2)).toBe(0);
    });

    it('should handle reversed order', () => {
      const range1 = { start: 115, end: 120 };
      const range2 = { start: 100, end: 110 };
      expect(getTimeGapMinutes(range1, range2)).toBe(5);
    });
  });

  // ==========================================================================
  // AC-1: ASLEEP→AWAKE in <3min = MAJOR
  // ==========================================================================
  describe('AC-1: ASLEEP→AWAKE in <3min = MAJOR', () => {
    it('should detect MAJOR contradiction for 2 minute gap', () => {
      const asleepCard = createCard('1', {
        state: 'ASLEEP',
        timeRange: '2:00am-2:05am',
      });
      const awakeCard = createCard('2', {
        state: 'AWAKE',
        timeRange: '2:07am-2:10am',
      });

      const result = detectContradictions(awakeCard, [asleepCard]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MAJOR);
      expect(result?.type).toBe('STATE_CONFLICT');
    });
  });

  // ==========================================================================
  // AC-2: ASLEEP→AWAKE in 3-10min = MINOR
  // ==========================================================================
  describe('AC-2: ASLEEP→AWAKE in 3-10min = MINOR', () => {
    it('should detect MINOR contradiction for 5 minute gap', () => {
      const asleepCard = createCard('1', {
        state: 'ASLEEP',
        timeRange: '2:00am-2:05am',
      });
      const awakeCard = createCard('2', {
        state: 'AWAKE',
        timeRange: '2:10am-2:15am',
      });

      const result = detectContradictions(awakeCard, [asleepCard]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MINOR);
      expect(result?.type).toBe('STATE_CONFLICT');
    });
  });

  // ==========================================================================
  // AC-3: ASLEEP→AWAKE in >10min = NONE
  // ==========================================================================
  describe('AC-3: ASLEEP→AWAKE in >10min = NONE', () => {
    it('should return null for 15 minute gap', () => {
      const asleepCard = createCard('1', {
        state: 'ASLEEP',
        timeRange: '2:00am-2:05am',
      });
      const awakeCard = createCard('2', {
        state: 'AWAKE',
        timeRange: '2:20am-2:25am',
      });

      const result = detectContradictions(awakeCard, [asleepCard]);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // AC-4: HOME→GYM in <20min = MAJOR
  // ==========================================================================
  describe('AC-4: HOME→GYM in <20min = MAJOR', () => {
    it('should detect MAJOR contradiction for 15 minute travel', () => {
      const homeCard = createCard('1', {
        location: 'living room',
        timeRange: '6:00am-6:05am',
      });
      const gymCard = createCard('2', {
        location: 'gym',
        timeRange: '6:20am-6:25am',
      });

      const result = detectContradictions(gymCard, [homeCard]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MAJOR);
      expect(result?.type).toBe('LOCATION_CONFLICT');
    });
  });

  // ==========================================================================
  // AC-5: HOME→GYM in 20-30min = MINOR
  // ==========================================================================
  describe('AC-5: HOME→GYM in 20-30min = MINOR', () => {
    it('should detect MINOR contradiction for 25 minute travel', () => {
      const homeCard = createCard('1', {
        location: 'living room',
        timeRange: '6:00am-6:05am',
      });
      const gymCard = createCard('2', {
        location: 'gym',
        timeRange: '6:30am-6:35am',
      });

      const result = detectContradictions(gymCard, [homeCard]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MINOR);
      expect(result?.type).toBe('LOCATION_CONFLICT');
    });

    it('should return null for 40 minute travel', () => {
      const homeCard = createCard('1', {
        location: 'living room',
        timeRange: '6:00am-6:05am',
      });
      const gymCard = createCard('2', {
        location: 'gym',
        timeRange: '6:45am-6:50am',
      });

      const result = detectContradictions(gymCard, [homeCard]);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // AC-6: Adjacent rooms <30sec = MAJOR
  // ==========================================================================
  describe('AC-6: Adjacent rooms <30sec = MAJOR', () => {
    it('should detect MAJOR contradiction for instant room change', () => {
      const room1Card = createCard('1', {
        location: 'living room',
        timeRange: '10:00am-10:05am',
      });
      const room2Card = createCard('2', {
        location: 'kitchen',
        timeRange: '10:05am-10:10am',
      });

      const result = detectContradictions(room2Card, [room1Card]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MAJOR);
      expect(result?.type).toBe('LOCATION_CONFLICT');
    });
  });

  // ==========================================================================
  // AC-7: Return ContradictionSeverity
  // ==========================================================================
  describe('AC-7: Return ContradictionSeverity', () => {
    it('should return result with severity property', () => {
      const card1 = createCard('1', {
        state: 'ASLEEP',
        timeRange: '2:00am-2:05am',
      });
      const card2 = createCard('2', {
        state: 'AWAKE',
        timeRange: '2:06am-2:10am',
      });

      const result = detectContradictions(card2, [card1]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBeDefined();
      expect([
        ContradictionSeverity.MINOR,
        ContradictionSeverity.MAJOR,
        ContradictionSeverity.CRITICAL,
      ]).toContain(result?.severity);
    });
  });

  // ==========================================================================
  // EC-1: Cards with no overlapping claims = NONE
  // ==========================================================================
  describe('EC-1: Cards with no overlapping claims = NONE', () => {
    it('should return null when cards have different claim types', () => {
      const stateCard = createCard('1', {
        state: 'AWAKE',
        timeRange: '8:00am-8:05am',
      });
      const locationCard = createCard('2', {
        location: 'kitchen',
        timeRange: '8:00am-8:05am',
      });

      const result = detectContradictions(locationCard, [stateCard]);
      expect(result).toBeNull();
    });

    it('should return null when cards have no time ranges', () => {
      const card1 = createCard('1', { state: 'ASLEEP' });
      const card2 = createCard('2', { state: 'AWAKE' });

      const result = detectContradictions(card2, [card1]);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // EC-2: Same location, different times = NONE
  // ==========================================================================
  describe('EC-2: Same location, different times = NONE', () => {
    it('should return null for same location at different times', () => {
      const card1 = createCard('1', {
        location: 'kitchen',
        timeRange: '8:00am-8:30am',
      });
      const card2 = createCard('2', {
        location: 'kitchen',
        timeRange: '9:00am-9:30am',
      });

      const result = detectContradictions(card2, [card1]);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // EC-2: Same Card check
  // ==========================================================================
  describe('EC-2: Same Card check', () => {
    it('should return null when checking card against itself in committed story', () => {
      const card = createCard('1', {
        state: 'ASLEEP',
        timeRange: '2:00am-6:00am',
      });

      // When a card is in the committed story and we check the same card,
      // it should not find a contradiction with itself
      const result = detectContradictions(card, [card]);
      // Same card cannot contradict itself (same data)
      expect(result).toBeNull();
    });

    it('should return null for cards with same ID', () => {
      const card1 = createCard('same', {
        state: 'ASLEEP',
        timeRange: '2:00am-6:00am',
      });
      const card2 = createCard('same', {
        state: 'ASLEEP',
        timeRange: '2:00am-6:00am',
      });

      const result = detectContradictions(card1, [card2]);
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should return null for empty committed story', () => {
      const card = createCard('1', {
        state: 'AWAKE',
        timeRange: '8:00am-8:05am',
      });

      const result = detectContradictions(card, []);
      expect(result).toBeNull();
    });

    it('should check against all committed cards', () => {
      const card1 = createCard('1', {
        state: 'AWAKE',
        timeRange: '8:00am-8:30am',
      });
      const card2 = createCard('2', {
        state: 'ASLEEP',
        timeRange: '8:25am-8:30am',
      });
      const newCard = createCard('3', {
        state: 'AWAKE',
        timeRange: '8:28am-8:35am',
      });

      // Should find contradiction with card2 (ASLEEP→AWAKE in <3min)
      const result = detectContradictions(newCard, [card1, card2]);
      expect(result).not.toBeNull();
      expect(result?.severity).toBe(ContradictionSeverity.MAJOR);
    });
  });
});
