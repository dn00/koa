/**
 * Tests for Task 007: Refutation Mechanics
 *
 * Evidence cards can refute counter-evidence, removing their penalty effect.
 */

import { describe, it, expect } from 'vitest';
import {
  canRefute,
  applyRefutations,
} from '../../src/resolver/refutation.js';
import type { EvidenceCard, CounterEvidence } from '../../src/types/index.js';
import type { CardId, CounterId } from '../../src/types/ids.js';

// Helper functions
function createCard(
  id: string,
  power: number = 10,
  refutes?: string
): EvidenceCard {
  return {
    id: `card_${id}` as CardId,
    power,
    proves: [],
    claims: {},
    ...(refutes ? { refutes: `counter_${refutes}` as CounterId } : {}),
  };
}

function createCounter(
  id: string,
  targets: string[] = [],
  refuted: boolean = false,
  refutedBy?: string
): CounterEvidence {
  return {
    id: `counter_${id}` as CounterId,
    targets: targets.map((t) => `card_${t}` as CardId),
    refuted,
    ...(refutedBy ? { refutedBy: `card_${refutedBy}` as CardId } : {}),
  };
}

describe('Task 007: Refutation Mechanics', () => {
  describe('canRefute()', () => {
    describe('AC-1: Detect refutation cards with matching counter IDs', () => {
      it('should return true when card.refutes matches counter.id', () => {
        const card = createCard('refuter', 10, 'target');
        const counter = createCounter('target', ['victim']);

        expect(canRefute(card, counter)).toBe(true);
      });

      it('should detect refutation for multiple valid pairs', () => {
        const card1 = createCard('ref1', 10, 'c1');
        const card2 = createCard('ref2', 10, 'c2');
        const counter1 = createCounter('c1', ['a']);
        const counter2 = createCounter('c2', ['b']);

        expect(canRefute(card1, counter1)).toBe(true);
        expect(canRefute(card2, counter2)).toBe(true);
      });
    });

    describe('AC-2: Return false when no match', () => {
      it('should return false when card.refutes does not match counter.id', () => {
        const card = createCard('refuter', 10, 'other');
        const counter = createCounter('target', ['victim']);

        expect(canRefute(card, counter)).toBe(false);
      });

      it('should return false when comparing different counters', () => {
        const card = createCard('ref', 10, 'counterA');
        const counterB = createCounter('counterB', ['x']);

        expect(canRefute(card, counterB)).toBe(false);
      });
    });

    describe('EC-1: Cards without refutes field', () => {
      it('should return false when card has no refutes field', () => {
        const card = createCard('normal', 10);
        const counter = createCounter('any', ['target']);

        expect(canRefute(card, counter)).toBe(false);
      });

      it('should handle cards with undefined refutes gracefully', () => {
        const card: EvidenceCard = {
          id: 'card_test' as CardId,
          power: 10,
          proves: [],
          claims: {},
          refutes: undefined,
        };
        const counter = createCounter('any', ['x']);

        expect(canRefute(card, counter)).toBe(false);
      });
    });
  });

  describe('applyRefutations()', () => {
    describe('AC-3: Mark counter as refuted', () => {
      it('should mark counter as refuted when matching card exists', () => {
        const cards = [createCard('refuter', 10, 'target')];
        const counters = [createCounter('target', ['victim'])];

        const result = applyRefutations(cards, counters);

        expect(result).toHaveLength(1);
        expect(result[0].refuted).toBe(true);
        expect(result[0].refutedBy).toBe('card_refuter');
      });

      it('should set refutedBy to the card ID that refuted it', () => {
        const cards = [createCard('myCard', 15, 'counter1')];
        const counters = [createCounter('counter1', ['x'])];

        const result = applyRefutations(cards, counters);

        expect(result[0].refutedBy).toBe('card_myCard');
      });
    });

    describe('AC-7: Immutable updated counters array', () => {
      it('should return a new array, not modify original', () => {
        const cards = [createCard('ref', 10, 'c1')];
        const counters = [createCounter('c1', ['x'])];
        const originalCounters = [...counters];

        const result = applyRefutations(cards, counters);

        expect(result).not.toBe(counters);
        expect(counters[0].refuted).toBe(false); // Original unchanged
        expect(result[0].refuted).toBe(true);
        expect(counters).toEqual(originalCounters);
      });

      it('should create new counter objects, not mutate them', () => {
        const cards = [createCard('ref', 10, 'c1')];
        const counters = [createCounter('c1', ['x'])];

        const result = applyRefutations(cards, counters);

        expect(result[0]).not.toBe(counters[0]);
      });
    });

    describe('EC-2: Multiple refutations in single submission', () => {
      it('should handle multiple cards refuting different counters', () => {
        const cards = [
          createCard('ref1', 10, 'c1'),
          createCard('ref2', 10, 'c2'),
        ];
        const counters = [
          createCounter('c1', ['a']),
          createCounter('c2', ['b']),
          createCounter('c3', ['c']),
        ];

        const result = applyRefutations(cards, counters);

        expect(result).toHaveLength(3);
        expect(result[0].refuted).toBe(true);
        expect(result[0].refutedBy).toBe('card_ref1');
        expect(result[1].refuted).toBe(true);
        expect(result[1].refutedBy).toBe('card_ref2');
        expect(result[2].refuted).toBe(false);
        expect(result[2].refutedBy).toBeUndefined();
      });

      it('should leave unmatched counters unchanged', () => {
        const cards = [createCard('ref1', 10, 'c1')];
        const counters = [
          createCounter('c1', ['a']),
          createCounter('c2', ['b']),
        ];

        const result = applyRefutations(cards, counters);

        expect(result[1].refuted).toBe(false);
        expect(result[1].id).toBe('counter_c2');
      });
    });

    describe('EC-3: Re-refuting already-refuted counter', () => {
      it('should not change already refuted counter', () => {
        const cards = [createCard('newRef', 10, 'c1')];
        const counters = [createCounter('c1', ['x'], true, 'oldRef')];

        const result = applyRefutations(cards, counters);

        expect(result[0].refuted).toBe(true);
        expect(result[0].refutedBy).toBe('card_oldRef'); // Original refuter preserved
      });

      it('should not overwrite refutedBy for already refuted counters', () => {
        const cards = [
          createCard('second', 10, 'c1'),
          createCard('third', 10, 'c1'),
        ];
        const counters = [createCounter('c1', ['x'], true, 'first')];

        const result = applyRefutations(cards, counters);

        expect(result[0].refutedBy).toBe('card_first');
      });
    });

    describe('AC-4: Refuted counters apply no penalty (integration)', () => {
      it('should mark counters that will skip penalty in contested check', () => {
        const cards = [createCard('ref', 10, 'badCounter')];
        const counters = [createCounter('badCounter', ['victim'])];

        const result = applyRefutations(cards, counters);

        // The refuted counter should now be skipped by contested.ts
        expect(result[0].refuted).toBe(true);
        // contested.ts AC-3 skips refuted counters
      });
    });

    describe('AC-5: Damage restoration when counter refuted', () => {
      it('should enable full damage by marking counter refuted', () => {
        // When a counter is refuted, contested.ts will skip it,
        // so the card gets full damage instead of 50% penalty
        const cards = [createCard('refuter', 20, 'blocker')];
        const counters = [createCounter('blocker', ['card_refuter'])];

        const result = applyRefutations(cards, counters);

        expect(result[0].refuted).toBe(true);
        // contested.checkContested will now skip this counter
      });
    });

    describe('AC-6: Refutation persists across turns', () => {
      it('should preserve refuted state in returned counters', () => {
        const cards = [createCard('ref', 10, 'c1')];
        const counters = [createCounter('c1', ['x'])];

        const turn1Result = applyRefutations(cards, counters);
        expect(turn1Result[0].refuted).toBe(true);

        // Simulating next turn - passing the already-refuted counter
        const turn2Result = applyRefutations([], turn1Result);
        expect(turn2Result[0].refuted).toBe(true);
        expect(turn2Result[0].refutedBy).toBe('card_ref');
      });

      it('should maintain refutation across multiple processing calls', () => {
        const counters = [createCounter('c1', ['x'], true, 'originalRef')];

        const result = applyRefutations([], counters);

        expect(result[0].refuted).toBe(true);
        expect(result[0].refutedBy).toBe('card_originalRef');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty cards array', () => {
        const counters = [createCounter('c1', ['x'])];

        const result = applyRefutations([], counters);

        expect(result).toHaveLength(1);
        expect(result[0].refuted).toBe(false);
      });

      it('should handle empty counters array', () => {
        const cards = [createCard('ref', 10, 'c1')];

        const result = applyRefutations(cards, []);

        expect(result).toHaveLength(0);
      });

      it('should handle both arrays empty', () => {
        const result = applyRefutations([], []);

        expect(result).toHaveLength(0);
      });

      it('should handle cards with no refutes field mixed with refuting cards', () => {
        const cards = [
          createCard('normal1', 10),
          createCard('refuter', 10, 'c1'),
          createCard('normal2', 10),
        ];
        const counters = [createCounter('c1', ['x'])];

        const result = applyRefutations(cards, counters);

        expect(result[0].refuted).toBe(true);
        expect(result[0].refutedBy).toBe('card_refuter');
      });
    });
  });
});
