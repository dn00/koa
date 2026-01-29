import { describe, it, expect } from 'vitest';
import { getTier } from '../../../src/resolver/v5/tier.js';
import type { GameConfig, Tier } from '../../../src/types/v5/index.js';
import { DEFAULT_CONFIG } from '../../../src/types/v5/index.js';

/**
 * Task 006: Tier Calculation
 * Tests for getTier function
 */
describe('Task 006: Tier Calculation', () => {
  // Helper to create a custom config
  function createConfig(overrides: Partial<GameConfig> = {}): GameConfig {
    return {
      ...DEFAULT_CONFIG,
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: getTier Returns FLAWLESS When Above Target+5
  // ==========================================================================
  describe('AC-1: getTier Returns FLAWLESS When Above Target+5', () => {
    it('should return FLAWLESS when belief >= target + 5', () => {
      // belief=60, target=50 => 60 >= 55 is true
      const result = getTier(60, 50, DEFAULT_CONFIG);
      expect(result).toBe('FLAWLESS');
    });

    it('should return FLAWLESS exactly at target + 5', () => {
      // belief=55, target=50 => 55 >= 55 is true
      const result = getTier(55, 50, DEFAULT_CONFIG);
      expect(result).toBe('FLAWLESS');
    });

    it('should return FLAWLESS for high belief values', () => {
      const result = getTier(100, 50, DEFAULT_CONFIG);
      expect(result).toBe('FLAWLESS');
    });
  });

  // ==========================================================================
  // AC-2: getTier Returns CLEARED When At/Above Target
  // ==========================================================================
  describe('AC-2: getTier Returns CLEARED When At/Above Target', () => {
    it('should return CLEARED when belief equals target', () => {
      // belief=50, target=50 => 50 >= 50 is true (but not >= 55 for flawless)
      const result = getTier(50, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLEARED');
    });

    it('should return CLEARED when belief is between target and target+5', () => {
      // belief=52, target=50 => 52 >= 50 is true, 52 >= 55 is false
      const result = getTier(52, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLEARED');
    });

    it('should return CLEARED at target+4', () => {
      // belief=54, target=50 => 54 >= 55 is false, 54 >= 50 is true
      const result = getTier(54, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLEARED');
    });
  });

  // ==========================================================================
  // AC-3: getTier Returns CLOSE When Near Target
  // ==========================================================================
  describe('AC-3: getTier Returns CLOSE When Near Target', () => {
    it('should return CLOSE when belief is within 5 below target', () => {
      // belief=47, target=50 => 47 >= 45 is true, 47 >= 50 is false
      const result = getTier(47, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLOSE');
    });

    it('should return CLOSE exactly at target - 5', () => {
      // belief=45, target=50 => 45 >= 45 is true
      const result = getTier(45, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLOSE');
    });

    it('should return CLOSE for belief just below target', () => {
      // belief=49, target=50 => 49 >= 45 is true, 49 >= 50 is false
      const result = getTier(49, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLOSE');
    });
  });

  // ==========================================================================
  // EC-1: Boundary between FLAWLESS and CLEARED
  // ==========================================================================
  describe('EC-1: Boundary between FLAWLESS and CLEARED', () => {
    it('should return CLEARED at exactly target+4 (not FLAWLESS)', () => {
      // belief=54, target=50 => needs >= 55 for FLAWLESS, so CLEARED
      const result = getTier(54, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLEARED');
    });

    it('should return FLAWLESS at exactly target+5', () => {
      const result = getTier(55, 50, DEFAULT_CONFIG);
      expect(result).toBe('FLAWLESS');
    });
  });

  // ==========================================================================
  // EC-2: Boundary between CLOSE and BUSTED
  // ==========================================================================
  describe('EC-2: Boundary between CLOSE and BUSTED', () => {
    it('should return BUSTED at exactly target-6 (not CLOSE)', () => {
      // belief=44, target=50 => 44 >= 45 is false, so BUSTED
      const result = getTier(44, 50, DEFAULT_CONFIG);
      expect(result).toBe('BUSTED');
    });

    it('should return CLOSE at exactly target-5', () => {
      // belief=45, target=50 => 45 >= 45 is true
      const result = getTier(45, 50, DEFAULT_CONFIG);
      expect(result).toBe('CLOSE');
    });

    it('should return BUSTED for very low belief', () => {
      const result = getTier(0, 50, DEFAULT_CONFIG);
      expect(result).toBe('BUSTED');
    });

    it('should return BUSTED for negative belief', () => {
      const result = getTier(-10, 50, DEFAULT_CONFIG);
      expect(result).toBe('BUSTED');
    });
  });

  // ==========================================================================
  // Additional: Custom config
  // ==========================================================================
  describe('Custom tier configuration', () => {
    it('should use custom tier functions from config', () => {
      const customConfig = createConfig({
        tiers: {
          flawless: (b, t) => b >= t + 10, // More strict
          cleared: (b, t) => b >= t,
          close: (b, t) => b >= t - 3, // Less forgiving
        },
      });

      // With custom config: flawless needs +10, close only -3
      expect(getTier(60, 50, customConfig)).toBe('FLAWLESS');
      expect(getTier(55, 50, customConfig)).toBe('CLEARED');
      expect(getTier(48, 50, customConfig)).toBe('CLOSE');
      expect(getTier(46, 50, customConfig)).toBe('BUSTED');
    });
  });

  // ==========================================================================
  // Additional: All tiers are reachable
  // ==========================================================================
  describe('All tiers are reachable', () => {
    it('should be able to return all four tier values', () => {
      const tiers: Tier[] = [];

      tiers.push(getTier(60, 50, DEFAULT_CONFIG)); // FLAWLESS
      tiers.push(getTier(50, 50, DEFAULT_CONFIG)); // CLEARED
      tiers.push(getTier(46, 50, DEFAULT_CONFIG)); // CLOSE
      tiers.push(getTier(40, 50, DEFAULT_CONFIG)); // BUSTED

      expect(tiers).toContain('FLAWLESS');
      expect(tiers).toContain('CLEARED');
      expect(tiers).toContain('CLOSE');
      expect(tiers).toContain('BUSTED');
      expect(new Set(tiers).size).toBe(4);
    });
  });
});
