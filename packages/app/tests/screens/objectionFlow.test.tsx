/**
 * Task 005: Add Objection Flow (V5 Migration)
 *
 * Tests for objection prompt UI that appears after turn 2.
 * Total tests required: 5 (3 AC + 1 EC + 1 ERR)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useGameStore } from '../../src/stores/gameStore.js';
import { ObjectionPrompt } from '../../src/components/ObjectionPrompt/ObjectionPrompt.js';
import {
  BUILTIN_PACK,
  DEFAULT_CONFIG,
  type V5Puzzle,
} from '@hsh/engine-core';

describe('Task 005: Add Objection Flow', () => {
  // Get test puzzle from BUILTIN_PACK
  const testPuzzle: V5Puzzle = BUILTIN_PACK.puzzles[0]!;
  const testSeed = 12345;

  /**
   * Helper to play cards until after turn 2 (when objection triggers)
   */
  function playUntilObjectionTrigger(): void {
    const store = useGameStore.getState();
    store.startGame(testPuzzle.slug, DEFAULT_CONFIG, testSeed);

    // Play 2 cards to trigger objection opportunity (after turn 2)
    for (let i = 0; i < 2; i++) {
      const currentState = useGameStore.getState();
      const hand = currentState.gameState!.hand;
      const cardId = hand[0]!.id;
      store.playCard(cardId);
    }
  }

  // Reset store before each test
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  // ==========================================================================
  // AC-1: Objection prompt appears after T2
  // ==========================================================================
  describe('AC-1: Objection prompt appears after T2', () => {
    it('should display ObjectionPrompt modal when shouldTriggerObjection returns true', () => {
      playUntilObjectionTrigger();

      const store = useGameStore.getState();

      // shouldShowObjection should return true after turn 2
      expect(store.shouldShowObjection()).toBe(true);

      // Render the ObjectionPrompt
      render(
        <BrowserRouter>
          <ObjectionPrompt
            onStandBy={() => {}}
            onWithdraw={() => {}}
          />
        </BrowserRouter>
      );

      // Prompt should be visible
      expect(screen.getByTestId('objection-prompt')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-2: Stand By option works
  // ==========================================================================
  describe('AC-2: Stand By option works', () => {
    it('should call resolveObjection with stood_by when Stand By is clicked', () => {
      playUntilObjectionTrigger();

      const mockStandBy = vi.fn();

      render(
        <BrowserRouter>
          <ObjectionPrompt
            onStandBy={mockStandBy}
            onWithdraw={() => {}}
          />
        </BrowserRouter>
      );

      // Click Stand By button
      const standByButton = screen.getByRole('button', { name: /stand by/i });
      fireEvent.click(standByButton);

      expect(mockStandBy).toHaveBeenCalledTimes(1);
    });

    it('should integrate with store resolveObjection for stood_by', () => {
      playUntilObjectionTrigger();

      const store = useGameStore.getState();
      const result = store.resolveObjection('stood_by');

      expect(result.ok).toBe(true);

      // Objection should now be resolved
      const updatedState = useGameStore.getState();
      expect(updatedState.gameState!.objection?.resolved).toBe(true);
      expect(updatedState.gameState!.objection?.result).toBe('stood_by');
    });
  });

  // ==========================================================================
  // AC-3: Withdraw option works
  // ==========================================================================
  describe('AC-3: Withdraw option works', () => {
    it('should call resolveObjection with withdrawn when Withdraw is clicked', () => {
      playUntilObjectionTrigger();

      const mockWithdraw = vi.fn();

      render(
        <BrowserRouter>
          <ObjectionPrompt
            onStandBy={() => {}}
            onWithdraw={mockWithdraw}
          />
        </BrowserRouter>
      );

      // Click Withdraw button
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      fireEvent.click(withdrawButton);

      expect(mockWithdraw).toHaveBeenCalledTimes(1);
    });

    it('should integrate with store resolveObjection for withdrawn', () => {
      playUntilObjectionTrigger();

      const store = useGameStore.getState();
      const result = store.resolveObjection('withdrawn');

      expect(result.ok).toBe(true);

      // Objection should now be resolved
      const updatedState = useGameStore.getState();
      expect(updatedState.gameState!.objection?.resolved).toBe(true);
      expect(updatedState.gameState!.objection?.result).toBe('withdrawn');
    });
  });

  // ==========================================================================
  // EC-1: Objection already resolved
  // ==========================================================================
  describe('EC-1: Objection already resolved', () => {
    it('should not show prompt if objection is already resolved', () => {
      playUntilObjectionTrigger();

      const store = useGameStore.getState();

      // Resolve the objection
      store.resolveObjection('stood_by');

      // shouldShowObjection should now return false
      expect(store.shouldShowObjection()).toBe(false);
    });
  });

  // ==========================================================================
  // ERR-1: Resolve when no objection pending
  // ==========================================================================
  describe('ERR-1: Resolve when no objection pending', () => {
    it('should return error from engine when resolveObjection called without objection state', () => {
      const store = useGameStore.getState();

      // Start game but don't play any cards
      store.startGame(testPuzzle.slug, DEFAULT_CONFIG, testSeed);

      // Verify game started
      const gameState = useGameStore.getState().gameState;
      expect(gameState).not.toBeNull();
      expect(gameState!.turnsPlayed).toBe(0);

      // Try to resolve objection before any cards are played
      const result = store.resolveObjection('stood_by');

      // With 0 cards played, there's no card to challenge
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('OBJECTION_INVALID');
      }
    });
  });
});
