import { describe, it, expect } from 'vitest';
import {
  formatTurnResult,
  formatSystemCheck,
  formatVerdict,
  type TurnPresentation,
  type SystemCheckPresentation,
  type ObjectionPresentation,
  type VerdictPresentation,
} from './presentation.js';
import { MINI_MODE, ADVANCED_MODE } from './types.js';
import type { TurnResult, Card, GameState, V5Puzzle } from '../v5-types.js';

// Helper to create mock turn result
const createMockTurnResult = (overrides?: Partial<TurnResult>): TurnResult => ({
  card: {
    id: 'test_card',
    strength: 4,
    evidenceType: 'DIGITAL',
    location: 'OFFICE',
    time: '10:00 AM',
    claim: 'Test claim',
    presentLine: 'Test present line',
    isLie: false,
  },
  beliefChange: 4,
  wasLie: false,
  typeTaxApplied: false,
  narration: 'Test narration',
  koaResponse: 'Test KOA response',
  ...overrides,
});

// Helper to create mock puzzle
const createMockPuzzle = (): V5Puzzle => ({
  slug: 'test-puzzle',
  name: 'Test Puzzle',
  scenario: 'Test scenario',
  knownFacts: ['Fact 1'],
  openingLine: 'Test opening',
  target: 60,
  cards: [],
  lies: [
    { cardId: 'lie_1', lieType: 'direct_contradiction', reason: 'Contradicts fact 1' },
  ],
  verdicts: {
    flawless: 'Flawless!',
    cleared: 'Cleared.',
    close: 'Close...',
    busted: 'Busted!',
  },
  koaBarks: {},
});

/**
 * Task 003: Presentation Layer
 */
describe('Task 003: Presentation Layer', () => {
  // ==========================================================================
  // AC-1: TurnPresentation Type
  // ==========================================================================
  describe('AC-1: TurnPresentation type', () => {
    it('should have required fields narration and koaResponse', () => {
      const presentation: TurnPresentation = {
        narration: 'Test narration',
        koaResponse: 'Test response',
      };

      expect(presentation.narration).toBe('Test narration');
      expect(presentation.koaResponse).toBe('Test response');
    });

    it('should allow optional fields beliefChange, beliefTotal, typeTaxApplied', () => {
      const presentation: TurnPresentation = {
        narration: 'Test',
        koaResponse: 'Test',
        beliefChange: 4,
        beliefTotal: 54,
        typeTaxApplied: true,
      };

      expect(presentation.beliefChange).toBe(4);
      expect(presentation.beliefTotal).toBe(54);
      expect(presentation.typeTaxApplied).toBe(true);
    });
  });

  // ==========================================================================
  // AC-2: formatTurnResult Mini
  // ==========================================================================
  describe('AC-2: formatTurnResult Mini mode', () => {
    it('should return narration and koaResponse', () => {
      const turnResult = createMockTurnResult();
      const presentation = formatTurnResult(turnResult, 54, MINI_MODE);

      expect(presentation.narration).toBe('Test narration');
      expect(presentation.koaResponse).toBeDefined();
    });

    it('should NOT include beliefChange numbers', () => {
      const turnResult = createMockTurnResult({ beliefChange: 4 });
      const presentation = formatTurnResult(turnResult, 54, MINI_MODE);

      expect(presentation.beliefChange).toBeUndefined();
    });

    it('should NOT include beliefTotal', () => {
      const turnResult = createMockTurnResult();
      const presentation = formatTurnResult(turnResult, 54, MINI_MODE);

      expect(presentation.beliefTotal).toBeUndefined();
    });

    it('should NOT include truth/lie indication', () => {
      const turnResult = createMockTurnResult({ wasLie: true });
      const presentation = formatTurnResult(turnResult, 46, MINI_MODE);

      // wasLie should not be exposed in presentation
      expect((presentation as any).wasLie).toBeUndefined();
    });
  });

  // ==========================================================================
  // AC-3: formatTurnResult Advanced
  // ==========================================================================
  describe('AC-3: formatTurnResult Advanced mode', () => {
    it('should include beliefChange', () => {
      const turnResult = createMockTurnResult({ beliefChange: 4 });
      const presentation = formatTurnResult(turnResult, 54, ADVANCED_MODE);

      expect(presentation.beliefChange).toBe(4);
    });

    it('should include beliefTotal', () => {
      const turnResult = createMockTurnResult();
      const presentation = formatTurnResult(turnResult, 54, ADVANCED_MODE);

      expect(presentation.beliefTotal).toBe(54);
    });

    it('should include typeTaxApplied when true', () => {
      const turnResult = createMockTurnResult({ typeTaxApplied: true });
      const presentation = formatTurnResult(turnResult, 52, ADVANCED_MODE);

      expect(presentation.typeTaxApplied).toBe(true);
    });
  });

  // ==========================================================================
  // AC-4: formatSystemCheck Mini
  // ==========================================================================
  describe('AC-4: formatSystemCheck Mini mode', () => {
    it('should return narrative bark', () => {
      const card = createMockTurnResult().card;
      const presentation = formatSystemCheck(card, MINI_MODE, 123);

      expect(presentation.narrativeBark).toBeDefined();
      expect(typeof presentation.narrativeBark).toBe('string');
    });

    it('should NOT include stand/withdraw options', () => {
      const card = createMockTurnResult().card;
      const presentation = formatSystemCheck(card, MINI_MODE, 123);

      // Mini mode returns SystemCheckPresentation, not ObjectionPresentation
      expect((presentation as ObjectionPresentation).showOptions).toBeUndefined();
    });
  });

  // ==========================================================================
  // AC-5: formatSystemCheck Advanced
  // ==========================================================================
  describe('AC-5: formatSystemCheck Advanced mode', () => {
    it('should return bark AND stand/withdraw options', () => {
      const card = createMockTurnResult().card;
      const presentation = formatSystemCheck(card, ADVANCED_MODE, 123) as ObjectionPresentation;

      expect(presentation.narrativeBark).toBeDefined();
      expect(presentation.showOptions).toBe(true);
    });

    it('should include point values for options', () => {
      const card = createMockTurnResult().card;
      const presentation = formatSystemCheck(card, ADVANCED_MODE, 123) as ObjectionPresentation;

      expect(presentation.standByPoints).toBeDefined();
      expect(presentation.withdrawPoints).toBeDefined();
    });
  });

  // ==========================================================================
  // AC-6: formatVerdict Mini
  // ==========================================================================
  describe('AC-6: formatVerdict Mini mode', () => {
    it('should include tier', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [
          { id: 'card_1', strength: 3, evidenceType: 'DIGITAL', location: 'OFFICE', time: '10:00 AM', claim: '', presentLine: '', isLie: false },
          { id: 'lie_1', strength: 4, evidenceType: 'TESTIMONY', location: 'BEDROOM', time: '11:00 AM', claim: '', presentLine: '', isLie: true },
        ],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, MINI_MODE);

      expect(presentation.tier).toBeDefined();
    });

    it('should include koaLine from puzzle verdicts', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, MINI_MODE);

      expect(presentation.koaLine).toBeDefined();
    });

    it('should mark lies in played cards', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [
          { id: 'lie_1', strength: 4, evidenceType: 'DIGITAL', location: 'OFFICE', time: '10:00 AM', claim: '', presentLine: '', isLie: true },
        ],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, MINI_MODE);

      expect(presentation.playedCards).toBeDefined();
      const lieCard = presentation.playedCards.find(c => c.cardId === 'lie_1');
      expect(lieCard?.wasLie).toBe(true);
    });

    it('should include contradiction explanations for lies', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [
          { id: 'lie_1', strength: 4, evidenceType: 'DIGITAL', location: 'OFFICE', time: '10:00 AM', claim: '', presentLine: '', isLie: true },
        ],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, MINI_MODE);

      const lieCard = presentation.playedCards.find(c => c.cardId === 'lie_1');
      expect(lieCard?.contradictionReason).toBe('Contradicts fact 1');
    });

    it('should NOT include belief numbers', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, MINI_MODE);

      expect(presentation.beliefFinal).toBeUndefined();
      expect(presentation.beliefTarget).toBeUndefined();
    });
  });

  // ==========================================================================
  // AC-7: formatVerdict Advanced
  // ==========================================================================
  describe('AC-7: formatVerdict Advanced mode', () => {
    it('should include beliefFinal', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, ADVANCED_MODE);

      expect(presentation.beliefFinal).toBe(62);
    });

    it('should include beliefTarget', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [],
        turnsPlayed: 3,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, ADVANCED_MODE);

      expect(presentation.beliefTarget).toBe(60);
    });

    it('should include turn summary with scores', () => {
      const state: GameState = {
        belief: 62,
        hand: [],
        played: [],
        turnResults: [
          createMockTurnResult({ beliefChange: 4 }),
          createMockTurnResult({ beliefChange: 3 }),
        ],
        turnsPlayed: 2,
        objection: null,
      };
      const puzzle = createMockPuzzle();

      const presentation = formatVerdict(state, puzzle, ADVANCED_MODE);

      expect(presentation.turnSummary).toBeDefined();
      expect(presentation.turnSummary?.length).toBe(2);
    });
  });

  // ==========================================================================
  // EC-1: Type Tax Display in Advanced
  // ==========================================================================
  describe('EC-1: Type tax display in Advanced mode', () => {
    it('should include typeTaxApplied=true when type tax was applied', () => {
      const turnResult = createMockTurnResult({
        typeTaxApplied: true,
        beliefChange: 1, // 3 - 2 = 1
      });

      const presentation = formatTurnResult(turnResult, 51, ADVANCED_MODE);

      expect(presentation.typeTaxApplied).toBe(true);
    });
  });
});
