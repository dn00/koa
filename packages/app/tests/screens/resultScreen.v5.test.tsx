/**
 * Task 008: Update Results Screen (V5 Migration)
 *
 * Tests for V5-updated ResultScreen displaying tier, belief, and played cards.
 * Total tests required: 5 (4 AC + 1 EC + 0 ERR)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { useGameStore } from '../../src/stores/gameStore.js';
import { ResultScreen } from '../../src/screens/results/ResultScreen.js';
import {
  BUILTIN_PACK,
  DEFAULT_CONFIG,
  type V5Puzzle,
  type VerdictData,
  type Tier,
} from '@hsh/engine-core';

// Mock useNavigate to prevent navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Task 008: Update Results Screen', () => {
  const testPuzzle: V5Puzzle = BUILTIN_PACK.puzzles[0]!;
  const testSeed = 12345;

  /**
   * Helper to play a complete game and reach results
   */
  function playCompleteGame(): void {
    const store = useGameStore.getState();
    store.startGame(testPuzzle.slug, DEFAULT_CONFIG, testSeed);

    // Play 3 cards (all turns)
    for (let i = 0; i < 3; i++) {
      const currentState = useGameStore.getState();
      const hand = currentState.gameState!.hand;
      const cardId = hand[0]!.id;
      store.playCard(cardId);
    }
  }

  // Reset store before each test
  beforeEach(() => {
    useGameStore.getState().reset();
    mockNavigate.mockClear();
  });

  // ==========================================================================
  // AC-1: Display Tier instead of RunStatus
  // ==========================================================================
  describe('AC-1: Display Tier instead of RunStatus', () => {
    it('should display tier (e.g., CLEARED, BUSTED) instead of WON/LOST', () => {
      playCompleteGame();

      const store = useGameStore.getState();
      const verdict = store.getVerdict();

      // Verify we have a verdict
      expect(verdict).not.toBeNull();
      expect(['FLAWLESS', 'CLEARED', 'CLOSE', 'BUSTED']).toContain(verdict!.tier);

      render(
        <MemoryRouter initialEntries={['/results']}>
          <ResultScreen />
        </MemoryRouter>
      );

      // Should display tier somewhere in the screen
      const tierElement = screen.getByTestId('verdict-tier');
      expect(tierElement).toBeInTheDocument();
      expect(['FLAWLESS', 'CLEARED', 'CLOSE', 'BUSTED']).toContain(tierElement.textContent);
    });
  });

  // ==========================================================================
  // AC-2: Display final belief vs target
  // ==========================================================================
  describe('AC-2: Display final belief vs target', () => {
    it('should show belief score and target (e.g., 58/57)', () => {
      playCompleteGame();

      const store = useGameStore.getState();
      const verdict = store.getVerdict();

      expect(verdict).not.toBeNull();

      render(
        <MemoryRouter initialEntries={['/results']}>
          <ResultScreen />
        </MemoryRouter>
      );

      // Should display belief score
      const beliefElement = screen.getByTestId('belief-score');
      expect(beliefElement).toBeInTheDocument();

      // Should contain the final belief and target values
      expect(beliefElement.textContent).toContain(String(verdict!.beliefFinal));
      expect(beliefElement.textContent).toContain(String(verdict!.beliefTarget));
    });
  });

  // ==========================================================================
  // AC-3: Display played cards with lie reveal
  // ==========================================================================
  describe('AC-3: Display played cards with lie reveal', () => {
    it('should show each played card with wasLie indicator', () => {
      playCompleteGame();

      const store = useGameStore.getState();
      const verdict = store.getVerdict();

      expect(verdict).not.toBeNull();
      expect(verdict!.playedCards.length).toBeGreaterThan(0);

      render(
        <MemoryRouter initialEntries={['/results']}>
          <ResultScreen />
        </MemoryRouter>
      );

      // Should have a played cards section
      const playedCardsSection = screen.getByTestId('played-cards');
      expect(playedCardsSection).toBeInTheDocument();

      // Each card should be displayed
      const cardElements = screen.getAllByTestId(/^played-card-/);
      expect(cardElements.length).toBe(verdict!.playedCards.length);
    });
  });

  // ==========================================================================
  // AC-4: Display KOA verdict line
  // ==========================================================================
  describe('AC-4: Display KOA verdict line', () => {
    it('should show verdict dialogue from puzzle', () => {
      playCompleteGame();

      const store = useGameStore.getState();
      const verdict = store.getVerdict();

      expect(verdict).not.toBeNull();
      expect(verdict!.koaLine).toBeDefined();

      render(
        <MemoryRouter initialEntries={['/results']}>
          <ResultScreen />
        </MemoryRouter>
      );

      // Should display KOA's verdict line
      const koaLineElement = screen.getByTestId('koa-verdict-line');
      expect(koaLineElement).toBeInTheDocument();
      expect(koaLineElement.textContent).toBe(verdict!.koaLine);
    });
  });

  // ==========================================================================
  // EC-1: No played cards (edge case)
  // ==========================================================================
  describe('EC-1: No played cards (edge case)', () => {
    it('should show appropriate message when playedCards is empty', () => {
      // This is an edge case - normally a game would have played cards
      // We test the component with an empty played cards array
      const emptyVerdict: VerdictData = {
        tier: 'BUSTED' as Tier,
        beliefFinal: 50,
        beliefTarget: 57,
        koaLine: 'You had nothing to say.',
        playedCards: [],
      };

      // Render with mocked verdict
      render(
        <MemoryRouter initialEntries={['/results']}>
          <ResultScreen testVerdict={emptyVerdict} />
        </MemoryRouter>
      );

      // Should show a message for no cards
      const emptyMessage = screen.getByTestId('no-cards-message');
      expect(emptyMessage).toBeInTheDocument();
    });
  });
});
