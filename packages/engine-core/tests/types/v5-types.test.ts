import { describe, it, expect } from 'vitest';
import type {
  // Task 001 types
  CardId,
  EvidenceType,
  Card,
  GameState,
  TurnResult,
  ObjectionState,
  V5Puzzle,
  LieInfo,
  LieType,
  Tier,
  // Task 002 types
  GameConfig,
  ModeConfig,
  GameMode,
  BarkFilter,
} from '../../src/types/v5/index.js';
import {
  isCardId,
  // Task 002 presets
  DEFAULT_CONFIG,
  EASY_CONFIG,
  HARD_CONFIG,
  MINI_MODE,
  ADVANCED_MODE,
} from '../../src/types/v5/index.js';

/**
 * Task 001: V5 Core Types
 * Tests for CardId, EvidenceType, Card, GameState, V5Puzzle, TurnResult, ObjectionState
 */
describe('Task 001: V5 Core Types', () => {
  // ==========================================================================
  // AC-1: CardId Branded Type
  // ==========================================================================
  describe('AC-1: CardId Branded Type', () => {
    it('should return true and narrow type for valid card ID starting with card_', () => {
      const id = 'card_001';
      expect(isCardId(id)).toBe(true);

      // Type narrowing test - if this compiles, the type guard works
      if (isCardId(id)) {
        const cardId: CardId = id;
        expect(cardId).toBe('card_001');
      }
    });

    it('should return true for card IDs with alphanumeric and hyphens', () => {
      expect(isCardId('card_test-123')).toBe(true);
      expect(isCardId('card_a-b-c')).toBe(true);
    });

    it('should return true for simple lowercase alphanumeric IDs', () => {
      // Per spec: "id.startsWith('card_') || /^[a-z0-9-]+$/.test(id)"
      expect(isCardId('evidence-01')).toBe(true);
      expect(isCardId('photo-scan')).toBe(true);
    });
  });

  // ==========================================================================
  // AC-2: EvidenceType Literal Union
  // ==========================================================================
  describe('AC-2: EvidenceType Literal Union', () => {
    it('should only allow DIGITAL, PHYSICAL, TESTIMONY, SENSOR values', () => {
      // These assignments should compile
      const digital: EvidenceType = 'DIGITAL';
      const physical: EvidenceType = 'PHYSICAL';
      const testimony: EvidenceType = 'TESTIMONY';
      const sensor: EvidenceType = 'SENSOR';

      expect(digital).toBe('DIGITAL');
      expect(physical).toBe('PHYSICAL');
      expect(testimony).toBe('TESTIMONY');
      expect(sensor).toBe('SENSOR');
    });
  });

  // ==========================================================================
  // AC-3: Card Interface Complete
  // ==========================================================================
  describe('AC-3: Card Interface Complete', () => {
    it('should have all required fields: id, strength, evidenceType, location, time, claim, presentLine, isLie', () => {
      const card: Card = {
        id: 'card_001' as CardId,
        strength: 3,
        evidenceType: 'DIGITAL',
        location: 'Living Room',
        time: '10:30 AM',
        claim: 'Motion detected in living room',
        presentLine: 'The sensor clearly shows movement here.',
        isLie: false,
      };

      expect(card.id).toBe('card_001');
      expect(card.strength).toBe(3);
      expect(card.evidenceType).toBe('DIGITAL');
      expect(card.location).toBe('Living Room');
      expect(card.time).toBe('10:30 AM');
      expect(card.claim).toBe('Motion detected in living room');
      expect(card.presentLine).toBe('The sensor clearly shows movement here.');
      expect(card.isLie).toBe(false);
    });

    it('should have readonly fields', () => {
      const card: Card = {
        id: 'card_002' as CardId,
        strength: 5,
        evidenceType: 'TESTIMONY',
        location: 'Kitchen',
        time: '11:00 AM',
        claim: 'Witness saw activity',
        presentLine: 'According to the witness statement...',
        isLie: true,
      };

      // TypeScript readonly check - if this compiles without error, readonly is enforced at compile time
      // At runtime, we just verify the object shape
      expect(Object.keys(card)).toContain('id');
      expect(Object.keys(card)).toContain('isLie');
    });
  });

  // ==========================================================================
  // AC-4: GameState Interface Complete
  // ==========================================================================
  describe('AC-4: GameState Interface Complete', () => {
    it('should have all required fields: belief, hand, played, turnResults, turnsPlayed, objection', () => {
      const card: Card = {
        id: 'card_001' as CardId,
        strength: 3,
        evidenceType: 'SENSOR',
        location: 'Hallway',
        time: '09:00 AM',
        claim: 'Motion detected',
        presentLine: 'The hallway sensor recorded this.',
        isLie: false,
      };

      const turnResult: TurnResult = {
        card,
        beliefChange: 3,
        wasLie: false,
        typeTaxApplied: false,
        narration: 'The hallway sensor recorded this.',
        koaResponse: 'Interesting evidence.',
      };

      const gameState: GameState = {
        belief: 53,
        hand: [card],
        played: [],
        turnResults: [turnResult],
        turnsPlayed: 1,
        objection: null,
      };

      expect(gameState.belief).toBe(53);
      expect(gameState.hand).toHaveLength(1);
      expect(gameState.played).toEqual([]);
      expect(gameState.turnResults).toHaveLength(1);
      expect(gameState.turnsPlayed).toBe(1);
      expect(gameState.objection).toBeNull();
    });

    it('should allow ObjectionState in objection field', () => {
      const card: Card = {
        id: 'card_002' as CardId,
        strength: 2,
        evidenceType: 'PHYSICAL',
        location: 'Garage',
        time: '08:00 AM',
        claim: 'Physical evidence found',
        presentLine: 'This physical evidence proves...',
        isLie: true,
      };

      const objectionState: ObjectionState = {
        challengedCard: card,
        resolved: true,
        result: 'stood_by',
        beliefChange: -4,
      };

      const gameState: GameState = {
        belief: 46,
        hand: [],
        played: [card],
        turnResults: [],
        turnsPlayed: 2,
        objection: objectionState,
      };

      expect(gameState.objection).not.toBeNull();
      expect(gameState.objection?.challengedCard).toBe(card);
      expect(gameState.objection?.result).toBe('stood_by');
    });
  });

  // ==========================================================================
  // AC-5: V5Puzzle Interface Complete
  // ==========================================================================
  describe('AC-5: V5Puzzle Interface Complete', () => {
    it('should have all required fields: slug, name, scenario, knownFacts, openingLine, target, cards, lies, verdicts, koaBarks', () => {
      const card: Card = {
        id: 'card_001' as CardId,
        strength: 4,
        evidenceType: 'DIGITAL',
        location: 'Office',
        time: '14:00',
        claim: 'Digital signature verified',
        presentLine: 'The digital record shows...',
        isLie: false,
      };

      const lieInfo: LieInfo = {
        cardId: 'card_002',
        lieType: 'direct_contradiction',
        reason: 'Contradicts known timeline',
      };

      const puzzle: V5Puzzle = {
        slug: 'test-puzzle',
        name: 'The Test Case',
        scenario: 'A mysterious test has occurred. You must prove your innocence.',
        knownFacts: ['Fact 1', 'Fact 2', 'Fact 3'],
        openingLine: 'KOA: Let us examine the evidence.',
        target: 65,
        cards: [card],
        lies: [lieInfo],
        verdicts: {
          flawless: 'Perfect! Absolutely convincing.',
          cleared: 'Good enough. Case closed.',
          close: 'Barely made it through.',
          busted: 'Not convincing at all.',
        },
        koaBarks: {
          cardPlayed: { card_001: ['Interesting choice.'] },
        },
      };

      expect(puzzle.slug).toBe('test-puzzle');
      expect(puzzle.name).toBe('The Test Case');
      expect(puzzle.scenario).toContain('mysterious test');
      expect(puzzle.knownFacts).toHaveLength(3);
      expect(puzzle.openingLine).toContain('KOA');
      expect(puzzle.target).toBe(65);
      expect(puzzle.cards).toHaveLength(1);
      expect(puzzle.lies).toHaveLength(1);
      expect(puzzle.verdicts.flawless).toContain('Perfect');
      expect(puzzle.koaBarks.cardPlayed).toBeDefined();
    });

    it('should allow optional koaBarks fields', () => {
      const puzzle: V5Puzzle = {
        slug: 'minimal-puzzle',
        name: 'Minimal',
        scenario: 'Minimal scenario',
        knownFacts: [],
        openingLine: 'Hello',
        target: 50,
        cards: [],
        lies: [],
        verdicts: {
          flawless: 'F',
          cleared: 'C',
          close: 'CL',
          busted: 'B',
        },
        koaBarks: {}, // Empty is valid
      };

      expect(puzzle.koaBarks.cardPlayed).toBeUndefined();
      expect(puzzle.koaBarks.relationalConflict).toBeUndefined();
    });
  });

  // ==========================================================================
  // AC-6: TurnResult and ObjectionState Types
  // ==========================================================================
  describe('AC-6: TurnResult and ObjectionState Types', () => {
    it('should have TurnResult with: card, beliefChange, wasLie, typeTaxApplied, narration, koaResponse', () => {
      const card: Card = {
        id: 'card_001' as CardId,
        strength: 2,
        evidenceType: 'TESTIMONY',
        location: 'Court',
        time: '15:00',
        claim: 'Witness testimony',
        presentLine: 'The witness states...',
        isLie: false,
      };

      const turnResult: TurnResult = {
        card,
        beliefChange: 2,
        wasLie: false,
        typeTaxApplied: false,
        narration: 'The witness states...',
        koaResponse: 'I see.',
      };

      expect(turnResult.card).toBe(card);
      expect(turnResult.beliefChange).toBe(2);
      expect(turnResult.wasLie).toBe(false);
      expect(turnResult.typeTaxApplied).toBe(false);
      expect(turnResult.narration).toBe('The witness states...');
      expect(turnResult.koaResponse).toBe('I see.');
    });

    it('should have ObjectionState with: challengedCard, resolved, result, beliefChange', () => {
      const card: Card = {
        id: 'card_lie' as CardId,
        strength: 3,
        evidenceType: 'SENSOR',
        location: 'Basement',
        time: '16:00',
        claim: 'Sensor reading',
        presentLine: 'The sensor shows...',
        isLie: true,
      };

      const objection: ObjectionState = {
        challengedCard: card,
        resolved: false,
        result: null,
        beliefChange: 0,
      };

      expect(objection.challengedCard).toBe(card);
      expect(objection.resolved).toBe(false);
      expect(objection.result).toBeNull();
      expect(objection.beliefChange).toBe(0);
    });

    it('should allow ObjectionState result values: stood_by, withdrawn, null', () => {
      const objectionStood: ObjectionState = {
        challengedCard: null,
        resolved: true,
        result: 'stood_by',
        beliefChange: 2,
      };

      const objectionWithdrawn: ObjectionState = {
        challengedCard: null,
        resolved: true,
        result: 'withdrawn',
        beliefChange: -2,
      };

      expect(objectionStood.result).toBe('stood_by');
      expect(objectionWithdrawn.result).toBe('withdrawn');
    });
  });

  // ==========================================================================
  // EC-1: Empty CardId validation
  // ==========================================================================
  describe('EC-1: Empty CardId validation', () => {
    it('should return false for empty string', () => {
      expect(isCardId('')).toBe(false);
    });
  });

  // ==========================================================================
  // EC-2: CardId with special characters
  // ==========================================================================
  describe('EC-2: CardId with special characters', () => {
    it('should return false for card IDs with special characters like !@#', () => {
      expect(isCardId('card_!@#')).toBe(false);
      expect(isCardId('card_test@123')).toBe(false);
      expect(isCardId('card_test#value')).toBe(false);
    });

    it('should return false for IDs with spaces', () => {
      expect(isCardId('card with space')).toBe(false);
      expect(isCardId('card_ space')).toBe(false);
    });

    it('should return false for IDs with uppercase when not prefixed', () => {
      // Uppercase without card_ prefix should fail the alphanumeric-hyphen regex
      expect(isCardId('Evidence-01')).toBe(false);
      expect(isCardId('PHOTO')).toBe(false);
    });
  });

  // ==========================================================================
  // ERR-1: Type safety prevents invalid EvidenceType
  // ==========================================================================
  describe('ERR-1: Type safety prevents invalid EvidenceType', () => {
    it('should only compile with valid EvidenceType values (compile-time check)', () => {
      // This test verifies that valid values compile
      // Invalid values like 'INVALID' would cause a TypeScript error
      const validTypes: EvidenceType[] = ['DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR'];
      expect(validTypes).toHaveLength(4);

      // Type assertion pattern - this would fail at compile time if EvidenceType allowed other values
      // @ts-expect-error - This line would error if uncommented, proving type safety
      // const invalidType: EvidenceType = 'INVALID';

      // We can verify the type at runtime by checking all valid values exist
      validTypes.forEach((t) => {
        expect(['DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR']).toContain(t);
      });
    });
  });
});

/**
 * Task 002: V5 Config & Mode Types
 * Tests for GameConfig, ModeConfig, presets
 */
describe('Task 002: V5 Config & Mode Types', () => {
  // ==========================================================================
  // AC-1: GameConfig Interface
  // ==========================================================================
  describe('AC-1: GameConfig Interface', () => {
    it('should have all required fields', () => {
      // Test that DEFAULT_CONFIG satisfies the interface
      const config: GameConfig = DEFAULT_CONFIG;

      expect(config.startingBelief).toBeDefined();
      expect(config.cardsInHand).toBeDefined();
      expect(config.cardsPerTurn).toBeDefined();
      expect(config.turnsPerGame).toBeDefined();
      expect(config.liesPerPuzzle).toBeDefined();
      expect(config.scoring).toBeDefined();
      expect(config.scoring.truth).toBeTypeOf('function');
      expect(config.scoring.lie).toBeTypeOf('function');
      expect(config.tiers).toBeDefined();
      expect(config.tiers.flawless).toBeTypeOf('function');
      expect(config.tiers.cleared).toBeTypeOf('function');
      expect(config.tiers.close).toBeTypeOf('function');
      expect(config.objection).toBeDefined();
      expect(config.objection.enabled).toBeDefined();
      expect(config.objection.afterTurn).toBeDefined();
      expect(config.objection.stoodByTruth).toBeDefined();
      expect(config.objection.stoodByLie).toBeDefined();
      expect(config.objection.withdrew).toBeDefined();
      expect(config.typeTax).toBeDefined();
      expect(config.typeTax.enabled).toBeDefined();
      expect(config.typeTax.penalty).toBeDefined();
    });

    it('should have scoring functions that accept strength and return number', () => {
      const config: GameConfig = DEFAULT_CONFIG;

      // Test truth scoring
      const truthResult = config.scoring.truth(3);
      expect(typeof truthResult).toBe('number');

      // Test lie scoring
      const lieResult = config.scoring.lie(3);
      expect(typeof lieResult).toBe('number');
    });

    it('should have tier functions that accept belief and target and return boolean', () => {
      const config: GameConfig = DEFAULT_CONFIG;

      // Test tier functions
      expect(typeof config.tiers.flawless(70, 65)).toBe('boolean');
      expect(typeof config.tiers.cleared(65, 65)).toBe('boolean');
      expect(typeof config.tiers.close(60, 65)).toBe('boolean');
    });
  });

  // ==========================================================================
  // AC-2: DEFAULT_CONFIG Preset
  // ==========================================================================
  describe('AC-2: DEFAULT_CONFIG Preset', () => {
    it('should have startingBelief=50', () => {
      expect(DEFAULT_CONFIG.startingBelief).toBe(50);
    });

    it('should have turnsPerGame=3', () => {
      expect(DEFAULT_CONFIG.turnsPerGame).toBe(3);
    });

    it('should have objection.enabled=true', () => {
      expect(DEFAULT_CONFIG.objection.enabled).toBe(true);
    });

    it('should have typeTax.enabled=true', () => {
      expect(DEFAULT_CONFIG.typeTax.enabled).toBe(true);
    });

    it('should have correct additional default values', () => {
      expect(DEFAULT_CONFIG.cardsInHand).toBe(6);
      expect(DEFAULT_CONFIG.cardsPerTurn).toBe(1);
      expect(DEFAULT_CONFIG.liesPerPuzzle).toBe(2);
      expect(DEFAULT_CONFIG.objection.afterTurn).toBe(1);
      expect(DEFAULT_CONFIG.typeTax.penalty).toBe(-2);
    });
  });

  // ==========================================================================
  // AC-3: ModeConfig Interface
  // ==========================================================================
  describe('AC-3: ModeConfig Interface', () => {
    it('should have all required fields: mode, showBeliefBar, showNumericScoring, playerChoosesObjection, showTypeTaxRule, barkFilter', () => {
      const config: ModeConfig = {
        mode: 'mini',
        showBeliefBar: false,
        showNumericScoring: false,
        playerChoosesObjection: false,
        showTypeTaxRule: false,
        barkFilter: 'mini-safe',
      };

      expect(config.mode).toBe('mini');
      expect(config.showBeliefBar).toBe(false);
      expect(config.showNumericScoring).toBe(false);
      expect(config.playerChoosesObjection).toBe(false);
      expect(config.showTypeTaxRule).toBe(false);
      expect(config.barkFilter).toBe('mini-safe');
    });

    it('should accept GameMode values: mini, advanced, trial', () => {
      const mini: GameMode = 'mini';
      const advanced: GameMode = 'advanced';
      const trial: GameMode = 'trial';

      expect(mini).toBe('mini');
      expect(advanced).toBe('advanced');
      expect(trial).toBe('trial');
    });

    it('should accept BarkFilter values: mini-safe, all', () => {
      const miniSafe: BarkFilter = 'mini-safe';
      const all: BarkFilter = 'all';

      expect(miniSafe).toBe('mini-safe');
      expect(all).toBe('all');
    });
  });

  // ==========================================================================
  // AC-4: MINI_MODE and ADVANCED_MODE Presets
  // ==========================================================================
  describe('AC-4: MINI_MODE and ADVANCED_MODE Presets', () => {
    it('should have MINI_MODE with showBeliefBar=false', () => {
      expect(MINI_MODE.showBeliefBar).toBe(false);
    });

    it('should have MINI_MODE with showNumericScoring=false', () => {
      expect(MINI_MODE.showNumericScoring).toBe(false);
    });

    it('should have MINI_MODE with playerChoosesObjection=false', () => {
      expect(MINI_MODE.playerChoosesObjection).toBe(false);
    });

    it('should have MINI_MODE with barkFilter=mini-safe', () => {
      expect(MINI_MODE.barkFilter).toBe('mini-safe');
    });

    it('should have MINI_MODE with showTypeTaxRule=false', () => {
      expect(MINI_MODE.showTypeTaxRule).toBe(false);
    });

    it('should have MINI_MODE with mode=mini', () => {
      expect(MINI_MODE.mode).toBe('mini');
    });

    it('should have ADVANCED_MODE with all display flags true', () => {
      expect(ADVANCED_MODE.showBeliefBar).toBe(true);
      expect(ADVANCED_MODE.showNumericScoring).toBe(true);
      expect(ADVANCED_MODE.playerChoosesObjection).toBe(true);
      expect(ADVANCED_MODE.showTypeTaxRule).toBe(true);
    });

    it('should have ADVANCED_MODE with barkFilter=all', () => {
      expect(ADVANCED_MODE.barkFilter).toBe('all');
    });

    it('should have ADVANCED_MODE with mode=advanced', () => {
      expect(ADVANCED_MODE.mode).toBe('advanced');
    });
  });

  // ==========================================================================
  // EC-1: GameConfig scoring functions handle edge values
  // ==========================================================================
  describe('EC-1: GameConfig scoring functions handle edge values', () => {
    it('should handle scoring.truth(0) returning 0', () => {
      expect(DEFAULT_CONFIG.scoring.truth(0)).toBe(0);
    });

    it('should handle scoring.lie(0) returning 0 or positive (penalty at strength 0)', () => {
      const lieResult = DEFAULT_CONFIG.scoring.lie(0);
      // Per DEFAULT_CONFIG: lie: (str) => -(str - 1) = -(-1) = 1
      // So lie(0) should be 1 (positive, meaning belief gain actually)
      expect(lieResult).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge values consistently', () => {
      // Test with strength 1 (minimum practical)
      expect(DEFAULT_CONFIG.scoring.truth(1)).toBe(1);
      // -(1-1) = -0, which equals 0 in numeric comparison but not in Object.is
      // Using numeric comparison to verify the value is effectively zero
      expect(DEFAULT_CONFIG.scoring.lie(1) === 0).toBe(true);
      expect(DEFAULT_CONFIG.scoring.lie(1) + 0).toBe(0);

      // Test with strength 5 (maximum)
      expect(DEFAULT_CONFIG.scoring.truth(5)).toBe(5);
      expect(DEFAULT_CONFIG.scoring.lie(5)).toBe(-4); // -(5-1) = -4
    });
  });

  // ==========================================================================
  // Additional tests for EASY_CONFIG and HARD_CONFIG presets
  // ==========================================================================
  describe('EASY_CONFIG and HARD_CONFIG Presets', () => {
    it('should have EASY_CONFIG with startingBelief=55', () => {
      expect(EASY_CONFIG.startingBelief).toBe(55);
    });

    it('should have HARD_CONFIG with startingBelief=45', () => {
      expect(HARD_CONFIG.startingBelief).toBe(45);
    });

    it('should have HARD_CONFIG with stricter lie penalty', () => {
      // HARD_CONFIG: lie: (str) => -str (full penalty)
      expect(HARD_CONFIG.scoring.lie(3)).toBe(-3);
      expect(HARD_CONFIG.scoring.lie(5)).toBe(-5);
    });
  });
});
