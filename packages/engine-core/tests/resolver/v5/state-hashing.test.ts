import { describe, it, expect } from 'vitest';
import { canonicalJson, computeStateHash } from '../../../src/hash.js';
import type { GameState, Card, CardId, TurnResult } from '../../../src/types/v5/index.js';

/**
 * Task 003: State Hashing
 * Tests for canonicalJson and computeStateHash functions
 */
describe('Task 003: State Hashing', () => {
  // Helper to create a test card
  function createCard(id: string, strength: number, isLie = false): Card {
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

  // Helper to create a test game state
  function createGameState(overrides: Partial<GameState> = {}): GameState {
    return {
      belief: 50,
      hand: [],
      played: [],
      turnResults: [],
      turnsPlayed: 0,
      objection: null,
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: canonicalJson Function
  // ==========================================================================
  describe('AC-1: canonicalJson Function', () => {
    it('should return JSON with sorted keys and no spaces', () => {
      const obj = { b: 1, a: 2 };
      const result = canonicalJson(obj);
      expect(result).toBe('{"a":2,"b":1}');
    });

    it('should produce deterministic output regardless of key order', () => {
      const obj1 = { z: 1, a: 2, m: 3 };
      const obj2 = { a: 2, z: 1, m: 3 };
      expect(canonicalJson(obj1)).toBe(canonicalJson(obj2));
    });
  });

  // ==========================================================================
  // AC-2: computeStateHash Function
  // ==========================================================================
  describe('AC-2: computeStateHash Function', () => {
    it('should return 64-character hex string (SHA-256)', async () => {
      const state = createGameState();
      const hash = await computeStateHash(state);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different states', async () => {
      const state1 = createGameState({ belief: 50 });
      const state2 = createGameState({ belief: 55 });
      const hash1 = await computeStateHash(state1);
      const hash2 = await computeStateHash(state2);
      expect(hash1).not.toBe(hash2);
    });
  });

  // ==========================================================================
  // AC-3: Hash is Deterministic
  // ==========================================================================
  describe('AC-3: Hash is Deterministic', () => {
    it('should return identical hash for identical GameState objects created separately', async () => {
      const card1 = createCard('001', 3, false);
      const card2 = createCard('001', 3, false);

      const state1: GameState = {
        belief: 53,
        hand: [card1],
        played: [],
        turnResults: [],
        turnsPlayed: 1,
        objection: null,
      };

      const state2: GameState = {
        belief: 53,
        hand: [card2],
        played: [],
        turnResults: [],
        turnsPlayed: 1,
        objection: null,
      };

      const hash1 = await computeStateHash(state1);
      const hash2 = await computeStateHash(state2);
      expect(hash1).toBe(hash2);
    });

    it('should be deterministic across multiple calls', async () => {
      const state = createGameState({ belief: 42 });
      const hash1 = await computeStateHash(state);
      const hash2 = await computeStateHash(state);
      const hash3 = await computeStateHash(state);
      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  // ==========================================================================
  // EC-1: Nested object sorting
  // ==========================================================================
  describe('EC-1: Nested object sorting', () => {
    it('should sort all nested object keys recursively', () => {
      const obj = {
        z: { b: 1, a: 2 },
        a: { d: 3, c: 4 },
      };
      const result = canonicalJson(obj);
      expect(result).toBe('{"a":{"c":4,"d":3},"z":{"a":2,"b":1}}');
    });

    it('should handle GameState with nested turnResults', async () => {
      const card = createCard('001', 3, false);
      const turnResult: TurnResult = {
        card,
        beliefChange: 3,
        wasLie: false,
        typeTaxApplied: false,
        narration: 'Test narration',
        koaResponse: 'Test response',
      };

      const state1 = createGameState({
        turnResults: [turnResult],
        turnsPlayed: 1,
      });

      // Create identical state with keys in different order
      const state2: GameState = {
        turnsPlayed: 1,
        belief: 50,
        objection: null,
        hand: [],
        played: [],
        turnResults: [
          {
            koaResponse: 'Test response',
            narration: 'Test narration',
            typeTaxApplied: false,
            wasLie: false,
            beliefChange: 3,
            card,
          },
        ],
      };

      const hash1 = await computeStateHash(state1);
      const hash2 = await computeStateHash(state2);
      expect(hash1).toBe(hash2);
    });
  });

  // ==========================================================================
  // EC-2: Array ordering preserved
  // ==========================================================================
  describe('EC-2: Array ordering preserved', () => {
    it('should preserve array order (arrays are not sorted)', () => {
      const arr1 = [3, 1, 2];
      const arr2 = [1, 2, 3];
      expect(canonicalJson(arr1)).not.toBe(canonicalJson(arr2));
      expect(canonicalJson(arr1)).toBe('[3,1,2]');
      expect(canonicalJson(arr2)).toBe('[1,2,3]');
    });

    it('should produce different hashes when card order differs in hand', async () => {
      const cardA = createCard('a', 3);
      const cardB = createCard('b', 2);

      const state1 = createGameState({ hand: [cardA, cardB] });
      const state2 = createGameState({ hand: [cardB, cardA] });

      const hash1 = await computeStateHash(state1);
      const hash2 = await computeStateHash(state2);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle array of objects with sorted keys', () => {
      const arr = [
        { b: 2, a: 1 },
        { d: 4, c: 3 },
      ];
      const result = canonicalJson(arr);
      expect(result).toBe('[{"a":1,"b":2},{"c":3,"d":4}]');
    });
  });
});
