import { describe, it, expect } from 'vitest';
import {
  // Types
  type GameMode,
  type BarkFilter,
  type ModeConfig,
  type TurnInput,
  type ExtendedGameState,
  type Result,
  // Constants
  MINI_MODE,
  ADVANCED_MODE,
  // Helpers
  ok,
  err,
} from './types.js';

/**
 * Task 001: Mode & Engine Types
 * Tests for V5 engine modularization types
 */
describe('Task 001: Mode & Engine Types', () => {
  // ==========================================================================
  // AC-1: ModeConfig Type
  // ==========================================================================
  describe('AC-1: ModeConfig type defined', () => {
    it('should have all required fields', () => {
      const config: ModeConfig = {
        mode: 'mini',
        showBeliefBar: false,
        showNumericScoring: false,
        playerChoosesObjection: false,
        showTypeTaxRule: false,
        barkFilter: 'mini-safe',
      };

      expect(config.mode).toBeDefined();
      expect(typeof config.showBeliefBar).toBe('boolean');
      expect(typeof config.showNumericScoring).toBe('boolean');
      expect(typeof config.playerChoosesObjection).toBe('boolean');
      expect(typeof config.showTypeTaxRule).toBe('boolean');
      expect(config.barkFilter).toBeDefined();
    });

    it('should accept all valid GameMode values', () => {
      const modes: GameMode[] = ['mini', 'advanced', 'trial'];
      modes.forEach((mode) => {
        const config: ModeConfig = {
          mode,
          showBeliefBar: true,
          showNumericScoring: true,
          playerChoosesObjection: true,
          showTypeTaxRule: true,
          barkFilter: 'all',
        };
        expect(config.mode).toBe(mode);
      });
    });

    it('should accept all valid BarkFilter values', () => {
      const filters: BarkFilter[] = ['mini-safe', 'all'];
      filters.forEach((filter) => {
        const config: ModeConfig = {
          mode: 'advanced',
          showBeliefBar: true,
          showNumericScoring: true,
          playerChoosesObjection: true,
          showTypeTaxRule: true,
          barkFilter: filter,
        };
        expect(config.barkFilter).toBe(filter);
      });
    });
  });

  // ==========================================================================
  // AC-2: MINI_MODE Preset
  // ==========================================================================
  describe('AC-2: MINI_MODE preset', () => {
    it('should have mode=mini', () => {
      expect(MINI_MODE.mode).toBe('mini');
    });

    it('should have showBeliefBar=false', () => {
      expect(MINI_MODE.showBeliefBar).toBe(false);
    });

    it('should have showNumericScoring=false', () => {
      expect(MINI_MODE.showNumericScoring).toBe(false);
    });

    it('should have playerChoosesObjection=false', () => {
      expect(MINI_MODE.playerChoosesObjection).toBe(false);
    });

    it('should have showTypeTaxRule=false', () => {
      expect(MINI_MODE.showTypeTaxRule).toBe(false);
    });

    it('should have barkFilter=mini-safe', () => {
      expect(MINI_MODE.barkFilter).toBe('mini-safe');
    });
  });

  // ==========================================================================
  // AC-3: ADVANCED_MODE Preset
  // ==========================================================================
  describe('AC-3: ADVANCED_MODE preset', () => {
    it('should have mode=advanced', () => {
      expect(ADVANCED_MODE.mode).toBe('advanced');
    });

    it('should have showBeliefBar=true', () => {
      expect(ADVANCED_MODE.showBeliefBar).toBe(true);
    });

    it('should have showNumericScoring=true', () => {
      expect(ADVANCED_MODE.showNumericScoring).toBe(true);
    });

    it('should have playerChoosesObjection=true', () => {
      expect(ADVANCED_MODE.playerChoosesObjection).toBe(true);
    });

    it('should have showTypeTaxRule=true', () => {
      expect(ADVANCED_MODE.showTypeTaxRule).toBe(true);
    });

    it('should have barkFilter=all', () => {
      expect(ADVANCED_MODE.barkFilter).toBe('all');
    });
  });

  // ==========================================================================
  // AC-4: ModeConfig playerChoosesObjection
  // ==========================================================================
  describe('AC-4: MINI_MODE playerChoosesObjection=false', () => {
    it('should have playerChoosesObjection=false (auto-resolve by engine)', () => {
      expect(MINI_MODE.playerChoosesObjection).toBe(false);
    });

    it('should contrast with ADVANCED_MODE where player chooses', () => {
      expect(ADVANCED_MODE.playerChoosesObjection).toBe(true);
      expect(MINI_MODE.playerChoosesObjection).not.toBe(
        ADVANCED_MODE.playerChoosesObjection
      );
    });
  });

  // ==========================================================================
  // AC-5: Result Type Utilities
  // ==========================================================================
  describe('AC-5: Result type and ok/err helpers', () => {
    it('should create ok Result with ok() helper', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should create err Result with err() helper', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });

    it('should work with string values', () => {
      const result = ok('success');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('success');
      }
    });

    it('should work with object values', () => {
      const data = { id: 1, name: 'test' };
      const result = ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it('should work with custom error types', () => {
      const customError = { code: 'E001', message: 'Custom error' };
      const result: Result<string, typeof customError> = err(customError);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('E001');
      }
    });
  });

  // ==========================================================================
  // AC-6: TurnInput Interface (Extensible)
  // ==========================================================================
  describe('AC-6: TurnInput interface (extensible)', () => {
    it('should have required cardId field', () => {
      const input: TurnInput = {
        cardId: 'card_001',
      };
      expect(input.cardId).toBe('card_001');
    });

    it('should allow optional tacticId field for future', () => {
      const input: TurnInput = {
        cardId: 'card_001',
        tacticId: 'tactic_defense',
      };
      expect(input.cardId).toBe('card_001');
      expect(input.tacticId).toBe('tactic_defense');
    });

    it('should work without tacticId', () => {
      const input: TurnInput = {
        cardId: 'card_002',
      };
      expect(input.tacticId).toBeUndefined();
    });
  });

  // ==========================================================================
  // AC-7: GameState Extension Points
  // ==========================================================================
  describe('AC-7: GameState extension points', () => {
    it('should have optional hearingNumber field', () => {
      const state: ExtendedGameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
        hearingNumber: 3,
      };
      expect(state.hearingNumber).toBe(3);
    });

    it('should have optional tacticDeck field', () => {
      const state: ExtendedGameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
        tacticDeck: [],
      };
      expect(state.tacticDeck).toEqual([]);
    });

    it('should have optional koaCounters field', () => {
      const state: ExtendedGameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
        koaCounters: ['channel_reliance', 'rehearsed'],
      };
      expect(state.koaCounters).toEqual(['channel_reliance', 'rehearsed']);
    });

    it('should work with all optional fields omitted', () => {
      const state: ExtendedGameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
      };
      expect(state.hearingNumber).toBeUndefined();
      expect(state.tacticDeck).toBeUndefined();
      expect(state.koaCounters).toBeUndefined();
    });

    it('should work with all optional fields present', () => {
      const state: ExtendedGameState = {
        belief: 50,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 0,
        objection: null,
        hearingNumber: 1,
        tacticDeck: [],
        koaCounters: ['timeline_drift'],
      };
      expect(state.hearingNumber).toBe(1);
      expect(state.tacticDeck).toBeDefined();
      expect(state.koaCounters).toContain('timeline_drift');
    });
  });

  // ==========================================================================
  // EC-1: Type Inference
  // ==========================================================================
  describe('EC-1: Type inference for ok/err', () => {
    it('should infer Result<number, never> from ok(number)', () => {
      const result = ok(123);
      // TypeScript should infer this correctly - if it compiles, inference works
      expect(result.ok).toBe(true);
      if (result.ok) {
        const value: number = result.value;
        expect(value).toBe(123);
      }
    });

    it('should infer Result<never, Error> from err(Error)', () => {
      const result = err(new Error('test'));
      // TypeScript should infer this correctly - if it compiles, inference works
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const error: Error = result.error;
        expect(error.message).toBe('test');
      }
    });

    it('should narrow type correctly after ok check', () => {
      const result: Result<string, Error> = ok('hello');

      if (result.ok) {
        // TypeScript narrows to { ok: true; value: string }
        expect(result.value.toUpperCase()).toBe('HELLO');
      } else {
        // This branch should not execute
        expect.fail('Should not reach error branch');
      }
    });

    it('should narrow type correctly after err check', () => {
      const result: Result<string, Error> = err(new Error('failure'));

      if (!result.ok) {
        // TypeScript narrows to { ok: false; error: Error }
        expect(result.error.message).toBe('failure');
      } else {
        // This branch should not execute
        expect.fail('Should not reach success branch');
      }
    });
  });
});
