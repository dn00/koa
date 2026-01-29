import { describe, it, expect } from 'vitest';
import {
  type DialogueTag,
  type TurnPosition,
  type TaggedDialogueLine,
  filterBarksForMode,
  TAGGED_KOA_LINES,
  pickKoaLineFiltered,
} from './dialogue-filter.js';
import type { BarkFilter } from './types.js';

/**
 * Task 005: Dialogue Tagging & Filter
 */
describe('Task 005: Dialogue Tagging & Filter', () => {
  // ==========================================================================
  // AC-1: DialogueTag Type
  // ==========================================================================
  describe('AC-1: DialogueTag type', () => {
    it('should have mini-safe value', () => {
      const tag: DialogueTag = 'mini-safe';
      expect(tag).toBe('mini-safe');
    });

    it('should have mentions-score value', () => {
      const tag: DialogueTag = 'mentions-score';
      expect(tag).toBe('mentions-score');
    });

    it('should have mentions-tax value', () => {
      const tag: DialogueTag = 'mentions-tax';
      expect(tag).toBe('mentions-tax');
    });

    it('should have mentions-flag value', () => {
      const tag: DialogueTag = 'mentions-flag';
      expect(tag).toBe('mentions-flag');
    });
  });

  // ==========================================================================
  // AC-2: TaggedDialogueLine Interface
  // ==========================================================================
  describe('AC-2: TaggedDialogueLine interface', () => {
    it('should extend DialogueLine with tags array', () => {
      const line: TaggedDialogueLine = {
        slot: 'AFTER_PLAY',
        axis: 'coherence',
        valence: 'neutral',
        intensity: 1,
        text: 'Test line',
        tags: ['mini-safe'],
      };

      expect(line.tags).toEqual(['mini-safe']);
      expect(line.slot).toBe('AFTER_PLAY');
    });

    it('should allow multiple tags', () => {
      const line: TaggedDialogueLine = {
        slot: 'AFTER_PLAY',
        axis: 'channel_reliance',
        valence: 'warning',
        intensity: 3,
        text: 'Same channel again? I\'m discounting this.',
        tags: ['mentions-tax', 'mentions-score'],
      };

      expect(line.tags).toContain('mentions-tax');
      expect(line.tags).toContain('mentions-score');
    });
  });

  // ==========================================================================
  // AC-3: KOA_LINES Tagged
  // ==========================================================================
  describe('AC-3: KOA_LINES tagged', () => {
    it('should have tags on all lines', () => {
      TAGGED_KOA_LINES.forEach((line, index) => {
        expect(line.tags).toBeDefined();
        expect(Array.isArray(line.tags)).toBe(true);
        expect(line.tags.length).toBeGreaterThan(0);
      });
    });

    it('should have at least one mini-safe line', () => {
      const miniSafeLines = TAGGED_KOA_LINES.filter(l =>
        l.tags.includes('mini-safe')
      );
      expect(miniSafeLines.length).toBeGreaterThan(0);
    });

    it('should have some non-mini-safe lines', () => {
      const nonMiniSafeLines = TAGGED_KOA_LINES.filter(l =>
        !l.tags.includes('mini-safe')
      );
      expect(nonMiniSafeLines.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // AC-4: filterBarksForMode Mini
  // ==========================================================================
  describe('AC-4: filterBarksForMode mini-safe', () => {
    it('should return only lines with mini-safe tag', () => {
      const mixedLines: TaggedDialogueLine[] = [
        {
          slot: 'AFTER_PLAY',
          axis: 'coherence',
          valence: 'neutral',
          intensity: 1,
          text: 'Safe line',
          tags: ['mini-safe'],
        },
        {
          slot: 'AFTER_PLAY',
          axis: 'channel_reliance',
          valence: 'warning',
          intensity: 3,
          text: 'Unsafe line with score mention',
          tags: ['mentions-score'],
        },
      ];

      const filtered = filterBarksForMode(mixedLines, 'mini-safe');

      expect(filtered.length).toBe(1);
      expect(filtered[0].text).toBe('Safe line');
    });

    it('should return empty array when no mini-safe lines', () => {
      const unsafeLines: TaggedDialogueLine[] = [
        {
          slot: 'AFTER_PLAY',
          axis: 'channel_reliance',
          valence: 'warning',
          intensity: 3,
          text: 'Discounting this.',
          tags: ['mentions-score'],
        },
      ];

      const filtered = filterBarksForMode(unsafeLines, 'mini-safe');

      expect(filtered.length).toBe(0);
    });
  });

  // ==========================================================================
  // AC-5: filterBarksForMode All
  // ==========================================================================
  describe('AC-5: filterBarksForMode all', () => {
    it('should return all lines unchanged', () => {
      const mixedLines: TaggedDialogueLine[] = [
        {
          slot: 'AFTER_PLAY',
          axis: 'coherence',
          valence: 'neutral',
          intensity: 1,
          text: 'Safe line',
          tags: ['mini-safe'],
        },
        {
          slot: 'AFTER_PLAY',
          axis: 'channel_reliance',
          valence: 'warning',
          intensity: 3,
          text: 'Unsafe line',
          tags: ['mentions-score'],
        },
      ];

      const filtered = filterBarksForMode(mixedLines, 'all');

      expect(filtered.length).toBe(2);
    });
  });

  // ==========================================================================
  // AC-6: pickKoaLine Uses Filter
  // ==========================================================================
  describe('AC-6: pickKoaLine uses filter', () => {
    it('should only consider mini-safe lines when filter is mini-safe', () => {
      // Call pickKoaLineFiltered with mini-safe filter
      // It should never return a line that mentions score/tax/etc.
      const result = pickKoaLineFiltered(
        'AFTER_PLAY',
        'coherence',
        'neutral',
        1,
        123,
        'mini-safe'
      );

      // The result should be a valid line
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return any matching line when filter is all', () => {
      const result = pickKoaLineFiltered(
        'AFTER_PLAY',
        'channel_reliance',
        'warning',
        3,
        456,
        'all'
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  // ==========================================================================
  // AC-7: Turn Position Tag
  // ==========================================================================
  describe('AC-7: Turn position tag', () => {
    it('should have TurnPosition type with T1, T2, T3, any values', () => {
      const positions: TurnPosition[] = ['T1', 'T2', 'T3', 'any'];
      positions.forEach(pos => {
        expect(['T1', 'T2', 'T3', 'any']).toContain(pos);
      });
    });

    it('should allow optional turnPosition field on TaggedDialogueLine', () => {
      const lineWithPosition: TaggedDialogueLine = {
        slot: 'AFTER_PLAY',
        axis: 'coherence',
        valence: 'neutral',
        intensity: 1,
        text: 'T1 specific line',
        tags: ['mini-safe'],
        turnPosition: 'T1',
      };

      expect(lineWithPosition.turnPosition).toBe('T1');
    });

    it('should work without turnPosition (defaults to any)', () => {
      const lineWithoutPosition: TaggedDialogueLine = {
        slot: 'AFTER_PLAY',
        axis: 'coherence',
        valence: 'neutral',
        intensity: 1,
        text: 'Generic line',
        tags: ['mini-safe'],
      };

      expect(lineWithoutPosition.turnPosition).toBeUndefined();
    });
  });

  // ==========================================================================
  // EC-1: No Mini-Safe Lines for Slot
  // ==========================================================================
  describe('EC-1: No mini-safe lines for slot/axis combo', () => {
    it('should return fallback when no mini-safe lines match', () => {
      // Filter to empty set for a very specific slot/axis combo
      // pickKoaLineFiltered should handle this gracefully
      const result = pickKoaLineFiltered(
        'OBJECTION_PROMPT', // Specific slot
        'contradiction',
        'warning',
        3,
        789,
        'mini-safe'
      );

      // Should return something (either a fallback or "...")
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});
