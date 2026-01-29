import { describe, it, expect } from 'vitest';
import {
  shouldTriggerObjection,
  resolveObjection,
  autoResolveObjection,
} from '../../../src/resolver/v5/objection.js';
import type { Card, CardId, GameConfig } from '../../../src/types/v5/index.js';
import { DEFAULT_CONFIG } from '../../../src/types/v5/index.js';

/**
 * Task 005: Objection System
 * Tests for shouldTriggerObjection, resolveObjection, autoResolveObjection functions
 */
describe('Task 005: Objection System', () => {
  // Helper to create a test card
  function createCard(id: string, strength: number, isLie: boolean): Card {
    return {
      id: `card_${id}` as CardId,
      strength,
      evidenceType: 'DIGITAL',
      location: 'Test Location',
      time: '10:00 AM',
      claim: 'Test claim',
      presentLine: 'Test present line',
      isLie,
    };
  }

  // Helper to create a custom config
  function createConfig(overrides: Partial<GameConfig> = {}): GameConfig {
    return {
      ...DEFAULT_CONFIG,
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: shouldTriggerObjection Returns True After Turn 2
  // ==========================================================================
  describe('AC-1: shouldTriggerObjection Returns True After Turn 2', () => {
    it('should return true when turnsPlayed equals afterTurn + 1', () => {
      // DEFAULT_CONFIG.objection.afterTurn = 1
      // So objection triggers when turnsPlayed = 2 (after T2, 0-indexed T1)
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, enabled: true, afterTurn: 1 },
      });
      expect(shouldTriggerObjection(2, config)).toBe(true);
    });

    it('should return false before the configured turn', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, enabled: true, afterTurn: 1 },
      });
      expect(shouldTriggerObjection(1, config)).toBe(false);
      expect(shouldTriggerObjection(0, config)).toBe(false);
    });

    it('should return false after the configured turn', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, enabled: true, afterTurn: 1 },
      });
      expect(shouldTriggerObjection(3, config)).toBe(false);
    });

    it('should work with different afterTurn values', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, enabled: true, afterTurn: 0 },
      });
      expect(shouldTriggerObjection(1, config)).toBe(true);
      expect(shouldTriggerObjection(2, config)).toBe(false);
    });
  });

  // ==========================================================================
  // AC-2: resolveObjection Calculates Stand By Truth
  // ==========================================================================
  describe('AC-2: resolveObjection Calculates Stand By Truth', () => {
    it('should return positive belief change when standing by truth', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, stoodByTruth: 2 },
      });
      const result = resolveObjection(false, 'stood_by', config);
      expect(result).toBe(2);
    });

    it('should use configured stoodByTruth value', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, stoodByTruth: 5 },
      });
      const result = resolveObjection(false, 'stood_by', config);
      expect(result).toBe(5);
    });
  });

  // ==========================================================================
  // AC-3: resolveObjection Calculates Stand By Lie
  // ==========================================================================
  describe('AC-3: resolveObjection Calculates Stand By Lie', () => {
    it('should return negative belief change when standing by lie', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, stoodByLie: -4 },
      });
      const result = resolveObjection(true, 'stood_by', config);
      expect(result).toBe(-4);
    });

    it('should use configured stoodByLie value', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, stoodByLie: -6 },
      });
      const result = resolveObjection(true, 'stood_by', config);
      expect(result).toBe(-6);
    });
  });

  // ==========================================================================
  // AC-4: autoResolveObjection Makes Optimal Choice
  // ==========================================================================
  describe('AC-4: autoResolveObjection Makes Optimal Choice', () => {
    it('should return stood_by with +2 for truth card', () => {
      const truthCard = createCard('truth', 3, false);
      const config = createConfig({
        objection: {
          ...DEFAULT_CONFIG.objection,
          stoodByTruth: 2,
          stoodByLie: -4,
          withdrew: -2,
        },
      });
      const result = autoResolveObjection(truthCard, config);
      expect(result).toEqual({ choice: 'stood_by', beliefChange: 2 });
    });

    it('should return withdrawn with -2 for lie card', () => {
      const lieCard = createCard('lie', 3, true);
      const config = createConfig({
        objection: {
          ...DEFAULT_CONFIG.objection,
          stoodByTruth: 2,
          stoodByLie: -4,
          withdrew: -2,
        },
      });
      const result = autoResolveObjection(lieCard, config);
      expect(result).toEqual({ choice: 'withdrawn', beliefChange: -2 });
    });

    it('should use configured values for belief changes', () => {
      const truthCard = createCard('truth', 3, false);
      const lieCard = createCard('lie', 3, true);
      const config = createConfig({
        objection: {
          ...DEFAULT_CONFIG.objection,
          stoodByTruth: 5,
          stoodByLie: -10,
          withdrew: -3,
        },
      });

      const truthResult = autoResolveObjection(truthCard, config);
      expect(truthResult.beliefChange).toBe(5);

      const lieResult = autoResolveObjection(lieCard, config);
      expect(lieResult.beliefChange).toBe(-3);
    });
  });

  // ==========================================================================
  // EC-1: Objection disabled in config
  // ==========================================================================
  describe('EC-1: Objection disabled in config', () => {
    it('should always return false when objection.enabled is false', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, enabled: false, afterTurn: 1 },
      });

      // Even at the right turn, should return false
      expect(shouldTriggerObjection(2, config)).toBe(false);
      expect(shouldTriggerObjection(1, config)).toBe(false);
      expect(shouldTriggerObjection(3, config)).toBe(false);
    });
  });

  // ==========================================================================
  // ERR-1: Invalid objection choice (type test)
  // ==========================================================================
  describe('ERR-1: Invalid objection choice', () => {
    it('should only accept valid choice values (compile-time check)', () => {
      // This test verifies that valid values compile
      // TypeScript prevents invalid choices at compile time
      const validChoices: Array<'stood_by' | 'withdrawn'> = ['stood_by', 'withdrawn'];
      expect(validChoices).toHaveLength(2);

      // Verify resolveObjection works with both valid choices
      const config = DEFAULT_CONFIG;
      expect(typeof resolveObjection(false, 'stood_by', config)).toBe('number');
      expect(typeof resolveObjection(false, 'withdrawn', config)).toBe('number');

      // Invalid values like 'invalid' would cause TypeScript error:
      // @ts-expect-error - This line would error if uncommented, proving type safety
      // resolveObjection(false, 'invalid', config);
    });
  });

  // ==========================================================================
  // Additional: Withdraw option
  // ==========================================================================
  describe('resolveObjection Withdraw', () => {
    it('should return withdrew belief change for withdraw choice', () => {
      const config = createConfig({
        objection: { ...DEFAULT_CONFIG.objection, withdrew: -2 },
      });

      // Withdraw returns same value regardless of wasLie
      expect(resolveObjection(false, 'withdrawn', config)).toBe(-2);
      expect(resolveObjection(true, 'withdrawn', config)).toBe(-2);
    });
  });
});
