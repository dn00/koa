import { describe, it, expect } from 'vitest';
import {
  getScrutinyDelta,
  applyScrutinyChange,
  isScrutinyLoss,
} from '../../src/resolver/scrutiny.js';
import type { Scrutiny, CardId } from '../../src/index.js';
import { ContradictionSeverity } from '../../src/index.js';
import type { ContradictionResult } from '../../src/resolver/contradiction.js';

/**
 * Task 010: Scrutiny System
 */
describe('Task 010: Scrutiny System', () => {
  // Helper to create contradiction results
  function createContradiction(severity: ContradictionSeverity): ContradictionResult {
    return {
      severity,
      type: 'STATE_CONFLICT',
      card1Id: 'card_1' as CardId,
      card2Id: 'card_2' as CardId,
      description: 'Test contradiction',
    };
  }

  // ==========================================================================
  // AC-1: MINOR → +1 scrutiny
  // ==========================================================================
  describe('AC-1: MINOR contradiction increases scrutiny by 1', () => {
    it('should return delta of 1 for MINOR contradiction', () => {
      const contradiction = createContradiction(ContradictionSeverity.MINOR);
      expect(getScrutinyDelta(contradiction)).toBe(1);
    });

    it('should apply delta to current scrutiny', () => {
      const result = applyScrutinyChange(2 as Scrutiny, 1);
      expect(result.previousScrutiny).toBe(2);
      expect(result.newScrutiny).toBe(3);
      expect(result.delta).toBe(1);
    });
  });

  // ==========================================================================
  // AC-2: Scrutiny 5 = loss
  // ==========================================================================
  describe('AC-2: Scrutiny 5 triggers loss', () => {
    it('should set isLossCondition when scrutiny reaches 5', () => {
      const result = applyScrutinyChange(4 as Scrutiny, 1);
      expect(result.newScrutiny).toBe(5);
      expect(result.isLossCondition).toBe(true);
    });

    it('should detect loss at exactly 5', () => {
      expect(isScrutinyLoss(5 as Scrutiny)).toBe(true);
    });

    it('should not trigger loss below 5', () => {
      expect(isScrutinyLoss(4 as Scrutiny)).toBe(false);
      expect(isScrutinyLoss(3 as Scrutiny)).toBe(false);
      expect(isScrutinyLoss(0 as Scrutiny)).toBe(false);
    });

    it('should not set isLossCondition below 5', () => {
      const result = applyScrutinyChange(3 as Scrutiny, 1);
      expect(result.newScrutiny).toBe(4);
      expect(result.isLossCondition).toBe(false);
    });
  });

  // ==========================================================================
  // AC-3: Clamped to 0-5 range
  // ==========================================================================
  describe('AC-3: Clamped to 0-5 range', () => {
    it('should clamp scrutiny to maximum of 5', () => {
      const result = applyScrutinyChange(4 as Scrutiny, 3);
      expect(result.newScrutiny).toBe(5);
    });

    it('should clamp scrutiny to minimum of 0', () => {
      const result = applyScrutinyChange(1 as Scrutiny, -5);
      expect(result.newScrutiny).toBe(0);
    });

    it('should allow valid values within range', () => {
      const result = applyScrutinyChange(2 as Scrutiny, 1);
      expect(result.newScrutiny).toBe(3);
    });
  });

  // ==========================================================================
  // EC-1: Null contradiction → 0 (no change)
  // ==========================================================================
  describe('EC-1: Null contradiction results in no scrutiny change', () => {
    it('should return delta of 0 for null contradiction', () => {
      expect(getScrutinyDelta(null)).toBe(0);
    });

    it('should not change scrutiny when delta is 0', () => {
      const result = applyScrutinyChange(3 as Scrutiny, 0);
      expect(result.previousScrutiny).toBe(3);
      expect(result.newScrutiny).toBe(3);
      expect(result.delta).toBe(0);
    });
  });

  // ==========================================================================
  // EC-2: MAJOR → 0 (blocked at submission)
  // ==========================================================================
  describe('EC-2: MAJOR contradiction does not increase scrutiny', () => {
    it('should return delta of 0 for MAJOR contradiction', () => {
      const contradiction = createContradiction(ContradictionSeverity.MAJOR);
      expect(getScrutinyDelta(contradiction)).toBe(0);
    });
  });

  // ==========================================================================
  // EC-1: Multiple MINORs in One Turn
  // ==========================================================================
  describe('EC-1: Multiple MINORs in One Turn', () => {
    it('should accumulate scrutiny from multiple MINOR contradictions', () => {
      // Simulates 2 MINOR contradictions in one turn
      const minor1 = createContradiction(ContradictionSeverity.MINOR);
      const minor2 = createContradiction(ContradictionSeverity.MINOR);

      const delta1 = getScrutinyDelta(minor1);
      const delta2 = getScrutinyDelta(minor2);
      const totalDelta = delta1 + delta2;

      expect(totalDelta).toBe(2); // +2 total

      // Apply cumulative delta to scrutiny
      const result = applyScrutinyChange(2 as Scrutiny, totalDelta);
      expect(result.previousScrutiny).toBe(2);
      expect(result.newScrutiny).toBe(4);
      expect(result.delta).toBe(2);
    });

    it('should trigger loss if multiple MINORs push scrutiny to 5', () => {
      // Start at 4, two MINORs would push to 6, but clamps at 5
      const minor1 = createContradiction(ContradictionSeverity.MINOR);
      const minor2 = createContradiction(ContradictionSeverity.MINOR);
      const totalDelta = getScrutinyDelta(minor1) + getScrutinyDelta(minor2);

      const result = applyScrutinyChange(4 as Scrutiny, totalDelta);
      expect(result.newScrutiny).toBe(5); // Clamped
      expect(result.isLossCondition).toBe(true);
    });
  });

  // ==========================================================================
  // ERR-1: Invalid Scrutiny Value (type system enforces, clamping handles)
  // ==========================================================================
  describe('ERR-1: Invalid Scrutiny Value', () => {
    it('should clamp values above 5 to 5', () => {
      // Attempt to push scrutiny beyond valid range
      const result = applyScrutinyChange(5 as Scrutiny, 10);
      expect(result.newScrutiny).toBe(5);
    });

    it('should clamp negative results to 0', () => {
      const result = applyScrutinyChange(0 as Scrutiny, -10);
      expect(result.newScrutiny).toBe(0);
    });
  });

  // ==========================================================================
  // Additional edge cases
  // ==========================================================================
  describe('Additional edge cases', () => {
    it('should handle starting from 0 scrutiny', () => {
      const result = applyScrutinyChange(0 as Scrutiny, 1);
      expect(result.previousScrutiny).toBe(0);
      expect(result.newScrutiny).toBe(1);
      expect(result.isLossCondition).toBe(false);
    });

    it('should handle large positive delta', () => {
      const result = applyScrutinyChange(0 as Scrutiny, 10);
      expect(result.newScrutiny).toBe(5);
      expect(result.isLossCondition).toBe(true);
    });

    it('should handle negative delta from low scrutiny', () => {
      const result = applyScrutinyChange(1 as Scrutiny, -1);
      expect(result.newScrutiny).toBe(0);
      expect(result.isLossCondition).toBe(false);
    });
  });
});
