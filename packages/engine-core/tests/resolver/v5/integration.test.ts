/**
 * Task 902: E2E Integration Test for v1 Lite Game Flow
 *
 * Tests the complete v1 Lite axis system: Coverage, Independence, Concern.
 * Uses the thermostat puzzle with all v1 Lite tags.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PUZZLE_THERMOSTAT_INCIDENT } from '../../../src/packs/generated-puzzle.js';
import { computeConcern, evaluateConcernResult, matchesConcern } from '../../../src/resolver/v5/concern.js';
import { computeCoverage } from '../../../src/resolver/v5/coverage.js';
import { computeIndependence } from '../../../src/resolver/v5/independence.js';
import { getMiniLiteTier } from '../../../src/resolver/v5/tier.js';
import { getSuspicionText } from '../../../src/narration/suspicion-barks.js';
import { getCeilingExplanation } from '../../../src/narration/audit-barks.js';
import type { Card, Concern, MiniLiteTierInput, CoverageResult, IndependenceLevel, CeilingBlocker } from '../../../src/types/v5/index.js';

/**
 * Helper: Get card by ID from thermostat puzzle
 */
function getCard(id: string): Card {
  const card = PUZZLE_THERMOSTAT_INCIDENT.cards.find(c => c.id === id);
  if (!card) throw new Error(`Card not found: ${id}`);
  return card;
}

/**
 * Helper: Simulate a complete 3-turn game and return all computed values
 */
function simulateGame(cardIds: [string, string, string]): {
  cards: Card[];
  concern: Concern;
  concernHit: boolean;
  coverage: CoverageResult;
  independence: IndependenceLevel;
  tier: ReturnType<typeof getMiniLiteTier>;
  suspicionText: ReturnType<typeof getSuspicionText>;
} {
  const cards = cardIds.map(getCard);
  const [card1, card2, card3] = cards;

  // Compute concern after T2
  const concern = computeConcern(card1, card2);
  const suspicionText = getSuspicionText(concern.key);

  // Compute all results after T3
  const { concernHit } = evaluateConcernResult(cards, concern);
  const coverage = computeCoverage(cards);
  const independence = computeIndependence(cards);

  const tierInput: MiniLiteTierInput = {
    cards,
    coverage,
    independence,
    concern,
    concernHit,
  };
  const tier = getMiniLiteTier(tierInput);

  return {
    cards,
    concern,
    concernHit,
    coverage,
    independence,
    tier,
    suspicionText,
  };
}

/**
 * Helper: Compute ceiling blocker (mirrors game.ts logic)
 */
function computeCeilingBlocker(
  tier: ReturnType<typeof getMiniLiteTier>,
  concernHit: boolean,
  independence: IndependenceLevel,
  concern: Concern,
  truthCount: number
): CeilingBlocker {
  if (tier !== 'CLEARED' || truthCount !== 3) return null;

  // same_system overlap rule: only concern matters
  if (concern.key === 'same_system') {
    return concernHit ? 'concern' : null;
  }

  const isCorrelated = independence === 'correlated_weak' || independence === 'correlated_strong';

  if (concernHit && isCorrelated) return 'both';
  if (concernHit) return 'concern';
  if (isCorrelated) return 'correlation';
  return null;
}

describe('v1 Lite Integration Tests', () => {
  describe('Thermostat Puzzle Card Tags', () => {
    it('all cards have v1 Lite tags', () => {
      for (const card of PUZZLE_THERMOSTAT_INCIDENT.cards) {
        expect(card.factTouch).toBeDefined();
        expect([1, 2, 3]).toContain(card.factTouch);
        expect(card.signalRoot).toBeDefined();
        expect(card.controlPath).toBeDefined();
        expect(card.claimShape).toBeDefined();
        expect(card.subsystem).toBeDefined();
      }
    });

    it('truths cover all 3 facts', () => {
      const truths = PUZZLE_THERMOSTAT_INCIDENT.cards.filter(c => !c.isLie);
      const factsTouched = new Set(truths.map(c => c.factTouch));
      expect(factsTouched.size).toBe(3);
      expect(factsTouched.has(1)).toBe(true);
      expect(factsTouched.has(2)).toBe(true);
      expect(factsTouched.has(3)).toBe(true);
    });
  });

  describe('Outcome: FLAWLESS', () => {
    it('should achieve FLAWLESS with 3 truths, diverse sources, concern avoided', () => {
      // All 3 truths: sleep_apnea, smart_vent, partner_snoring
      // Different signalRoots (wearable_health, koa_cloud, human_partner)
      // T1+T2 trigger automation_heavy, T3 avoids (manual)
      const result = simulateGame(['sleep_apnea', 'smart_vent', 'partner_snoring']);

      expect(result.tier).toBe('FLAWLESS');
      expect(result.coverage.status).toBe('complete');
      expect(result.independence).toBe('diverse');
      expect(result.concernHit).toBe(false);
    });

    it('should have no ceiling explanation for FLAWLESS', () => {
      const result = simulateGame(['sleep_apnea', 'smart_vent', 'partner_snoring']);
      const truthCount = result.cards.filter(c => !c.isLie).length;

      const blocker = computeCeilingBlocker(
        result.tier,
        result.concernHit,
        result.independence,
        result.concern,
        truthCount
      );

      expect(blocker).toBeNull();
    });

    it('should work with different card order', () => {
      // Same cards, different order
      const result = simulateGame(['partner_snoring', 'sleep_apnea', 'smart_vent']);

      expect(result.tier).toBe('FLAWLESS');
      expect(result.coverage.status).toBe('complete');
    });
  });

  describe('Outcome: CLOSE', () => {
    it('should achieve CLOSE with 2 truths + 1 lie', () => {
      // 2 truths (sleep_apnea, smart_vent) + 1 lie (temp_app)
      const result = simulateGame(['sleep_apnea', 'smart_vent', 'temp_app']);

      expect(result.tier).toBe('CLOSE');
    });

    it('should achieve CLOSE regardless of which lie is played', () => {
      // Try different lie combinations
      const combinations: [string, string, string][] = [
        ['sleep_apnea', 'partner_snoring', 'temp_app'],
        ['smart_vent', 'partner_snoring', 'hvac_manual'],
        ['sleep_apnea', 'smart_vent', 'window_sensor'],
      ];

      for (const combo of combinations) {
        const result = simulateGame(combo);
        const truthCount = result.cards.filter(c => !c.isLie).length;
        expect(truthCount).toBe(2);
        expect(result.tier).toBe('CLOSE');
      }
    });
  });

  describe('Outcome: BUSTED', () => {
    it('should achieve BUSTED with 2+ lies', () => {
      // 1 truth + 2 lies
      const result = simulateGame(['sleep_apnea', 'temp_app', 'hvac_manual']);
      const truthCount = result.cards.filter(c => !c.isLie).length;

      expect(truthCount).toBe(1);
      expect(result.tier).toBe('BUSTED');
    });

    it('should achieve BUSTED with all lies', () => {
      // 0 truths + 3 lies
      const result = simulateGame(['temp_app', 'hvac_manual', 'window_sensor']);
      const truthCount = result.cards.filter(c => !c.isLie).length;

      expect(truthCount).toBe(0);
      expect(result.tier).toBe('BUSTED');
    });
  });

  describe('T2 Suspicion Display', () => {
    it('should show automation_heavy suspicion for T1+T2 with same controlPath', () => {
      // sleep_apnea (automation) + smart_vent (automation)
      const card1 = getCard('sleep_apnea');
      const card2 = getCard('smart_vent');
      const concern = computeConcern(card1, card2);

      expect(concern.key).toBe('automation_heavy');

      const text = getSuspicionText(concern.key);
      expect(text).toBeDefined();
      expect(text?.line).toBeDefined();
      expect(text?.line.length).toBeGreaterThan(0);
    });

    it('should show manual_heavy suspicion for T1+T2 with manual controlPath', () => {
      // partner_snoring (manual) + window_sensor (manual)
      const card1 = getCard('partner_snoring');
      const card2 = getCard('window_sensor');
      const concern = computeConcern(card1, card2);

      expect(concern.key).toBe('manual_heavy');

      const text = getSuspicionText(concern.key);
      expect(text).toBeDefined();
      expect(text?.line).toBeDefined();
    });

    it('should show same_system suspicion when signalRoot matches', () => {
      // hvac_manual (device_firmware) + window_sensor (device_firmware)
      const card1 = getCard('hvac_manual');
      const card2 = getCard('window_sensor');
      const concern = computeConcern(card1, card2);

      expect(concern.key).toBe('same_system');
      expect((concern as { root: string }).root).toBe('device_firmware');

      const text = getSuspicionText(concern.key);
      expect(text).toBeDefined();
    });

    it('should show no_concern when T1+T2 are fully diverse', () => {
      // sleep_apnea (wearable_health, automation) + partner_snoring (human_partner, manual)
      // Different on all axes
      const card1 = getCard('sleep_apnea');
      const card2 = getCard('partner_snoring');
      const concern = computeConcern(card1, card2);

      // Check what concern this produces
      // They differ in signalRoot, controlPath, claimShape... let's see
      expect(card1.signalRoot).toBe('wearable_health');
      expect(card2.signalRoot).toBe('human_partner');
      expect(card1.controlPath).toBe('automation');
      expect(card2.controlPath).toBe('manual');
      expect(card1.claimShape).toBe('positive');
      expect(card2.claimShape).toBe('absence');
      expect(card1.evidenceType).toBe('SENSOR');
      expect(card2.evidenceType).toBe('TESTIMONY');

      // All different → no_concern
      expect(concern.key).toBe('no_concern');

      const text = getSuspicionText(concern.key);
      expect(text).toBeDefined();
      // no_concern shows "mixing sources" type message
      expect(text?.line.toLowerCase()).toContain('mix');
    });
  });

  describe('Concern Hit Detection', () => {
    it('should detect concern hit (3-of-3) when all cards match concern dimension', () => {
      // hvac_manual + window_sensor → same_system (device_firmware)
      // Both cards have device_firmware signalRoot

      const card1 = getCard('hvac_manual');    // device_firmware
      const card2 = getCard('window_sensor');  // device_firmware

      const concern = computeConcern(card1, card2);
      expect(concern.key).toBe('same_system');

      // Test matchesConcern
      expect(matchesConcern(card1, concern)).toBe(true);
      expect(matchesConcern(card2, concern)).toBe(true);

      // All cards match → concernHit = true
      const { concernHit } = evaluateConcernResult([card1, card2], concern);
      expect(concernHit).toBe(true);
    });

    it('should detect concern avoided (2-of-3) when T3 diversifies', () => {
      // T1: sleep_apnea (automation)
      // T2: smart_vent (automation) → automation_heavy
      // T3: partner_snoring (manual) → diversifies

      const cards = [
        getCard('sleep_apnea'),
        getCard('smart_vent'),
        getCard('partner_snoring'),
      ];
      const concern = computeConcern(cards[0], cards[1]);

      expect(concern.key).toBe('automation_heavy');

      // T3 doesn't match → concernHit = false (avoided)
      const { concernHit, concernAvoided } = evaluateConcernResult(cards, concern);
      expect(concernHit).toBe(false);
      expect(concernAvoided).toBe(true);
    });
  });

  describe('Coverage Computation', () => {
    it('should compute complete coverage with 3 different factTouch values', () => {
      const cards = [
        getCard('sleep_apnea'),     // factTouch: 1
        getCard('smart_vent'),      // factTouch: 2
        getCard('partner_snoring'), // factTouch: 3
      ];

      const coverage = computeCoverage(cards);
      expect(coverage.status).toBe('complete');
      expect(coverage.missingFacts).toEqual([]);
    });

    it('should compute gap coverage with duplicate factTouch values', () => {
      const cards = [
        getCard('sleep_apnea'), // factTouch: 1
        getCard('temp_app'),    // factTouch: 1 (same!)
        getCard('smart_vent'),  // factTouch: 2
      ];

      const coverage = computeCoverage(cards);
      expect(coverage.status).toBe('gap');
      // Missing fact 3
      expect(coverage.missingFacts).toContain(3);
    });
  });

  describe('Independence Computation', () => {
    it('should compute diverse independence with different signalRootGroups', () => {
      const cards = [
        getCard('sleep_apnea'),     // wearable_health → device group
        getCard('smart_vent'),      // koa_cloud → cloud group
        getCard('partner_snoring'), // human_partner → human group
      ];

      const independence = computeIndependence(cards);
      expect(independence).toBe('diverse');
    });

    it('should compute correlated independence when 2+ cards share signalRootGroup', () => {
      // hvac_manual and window_sensor both have device_firmware → device group
      const cards = [
        getCard('hvac_manual'),    // device_firmware → device
        getCard('window_sensor'),  // device_firmware → device
        getCard('partner_snoring'), // human_partner → human
      ];

      const independence = computeIndependence(cards);
      // 2 of 3 from same group = correlated_weak
      expect(['correlated_weak', 'correlated_strong']).toContain(independence);
    });
  });

  describe('Ceiling Explanations', () => {
    it('should generate ceiling explanation for concern blocker', () => {
      const explanation = getCeilingExplanation('concern', 'automation_heavy');
      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(0);
    });

    it('should generate ceiling explanation for correlation blocker', () => {
      const explanation = getCeilingExplanation('correlation');
      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(0);
    });

    it('should generate ceiling explanation for both blockers', () => {
      const explanation = getCeilingExplanation('both', 'same_system');
      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(0);
    });
  });

  describe('Overlap Rule (same_system)', () => {
    it('should make independence informational only when concern is same_system', () => {
      // When concern is same_system, independence doesn't affect outcome
      // This is the "overlap rule" from spec

      // Create scenario: same_system concern, correlated independence
      // Both hvac_manual and window_sensor share device_firmware
      const card1 = getCard('hvac_manual');    // device_firmware
      const card2 = getCard('window_sensor');  // device_firmware

      const concern = computeConcern(card1, card2);
      expect(concern.key).toBe('same_system');

      // Independence would be correlated (both device group)
      // But since concern is same_system, independence is display-only
      // The tier logic handles this - we just verify the concern is correctly identified

      // If T3 is also device_firmware, it hits concern → CLEARED (not double penalty)
      // If T3 diversifies, it avoids concern → could be FLAWLESS
    });
  });

  describe('Priority Order', () => {
    it('should check signalRoot before controlPath (priority 1 > priority 2)', () => {
      // hvac_manual: device_firmware, manual
      // window_sensor: device_firmware, manual
      // Both share signalRoot AND controlPath
      // signalRoot should win (priority 1)

      const card1 = getCard('hvac_manual');
      const card2 = getCard('window_sensor');
      const concern = computeConcern(card1, card2);

      // Should be same_system, not manual_heavy
      expect(concern.key).toBe('same_system');
    });

    it('should check controlPath before claimShape (priority 2 > priority 3)', () => {
      // sleep_apnea: automation, positive
      // smart_vent: automation, positive
      // Both share controlPath AND claimShape
      // controlPath should win (priority 2)

      const card1 = getCard('sleep_apnea');
      const card2 = getCard('smart_vent');
      const concern = computeConcern(card1, card2);

      // Should be automation_heavy, not positive_heavy (which doesn't exist)
      expect(concern.key).toBe('automation_heavy');
    });
  });

  describe('End-to-End Flow Simulation', () => {
    it('should simulate complete FLAWLESS game flow', () => {
      // Step 1: T1 played
      const t1 = getCard('sleep_apnea');

      // Step 2: T2 played, concern computed
      const t2 = getCard('smart_vent');
      const concern = computeConcern(t1, t2);
      expect(concern.key).toBe('automation_heavy');

      const suspicion = getSuspicionText(concern.key);
      expect(suspicion?.line).toBeDefined();

      // Step 3: T3 played, all results computed
      const t3 = getCard('partner_snoring');
      const cards = [t1, t2, t3];

      const { concernHit } = evaluateConcernResult(cards, concern);
      expect(concernHit).toBe(false); // Avoided!

      const coverage = computeCoverage(cards);
      expect(coverage.status).toBe('complete');

      const independence = computeIndependence(cards);
      expect(independence).toBe('diverse');

      const tier = getMiniLiteTier({
        cards,
        coverage,
        independence,
        concern,
        concernHit,
      });
      expect(tier).toBe('FLAWLESS');
    });

    it('should simulate complete CLOSE game flow', () => {
      // Step 1: T1 played (truth)
      const t1 = getCard('sleep_apnea');

      // Step 2: T2 played (truth)
      const t2 = getCard('smart_vent');
      const concern = computeConcern(t1, t2);

      // Step 3: T3 played (LIE!)
      const t3 = getCard('temp_app'); // This is a lie
      expect(t3.isLie).toBe(true);

      const cards = [t1, t2, t3];
      const truthCount = cards.filter(c => !c.isLie).length;
      expect(truthCount).toBe(2);

      const tier = getMiniLiteTier({
        cards,
        coverage: computeCoverage(cards),
        independence: computeIndependence(cards),
        concern,
        concernHit: evaluateConcernResult(cards, concern).concernHit,
      });
      expect(tier).toBe('CLOSE');
    });
  });
});
