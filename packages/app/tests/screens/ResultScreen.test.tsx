/**
 * Tests for Task 020: Result Screen
 *
 * Post-game UI showing win/loss state and stats.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResultScreen } from '../../src/screens/results/ResultScreen.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import type { Puzzle, EvidenceCard } from '@hsh/engine-core';
import type { CardId, ConcernId, CounterId, PuzzleId } from '@hsh/engine-core';
import { ProofType, ConcernType, RunStatus } from '@hsh/engine-core';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to create test data
function createCard(id: string, power: number = 10): EvidenceCard {
  return {
    id: `card_${id}` as CardId,
    power,
    proves: [ProofType.IDENTITY],
    claims: { location: 'home' },
    source: `Source ${id}`,
  };
}

function createPuzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle_test' as PuzzleId,
    targetName: 'Test Target',
    resistance: 100,
    concerns: [
      {
        id: 'concern_1' as ConcernId,
        type: ConcernType.IDENTITY,
        requiredProof: ProofType.IDENTITY,
        addressed: false,
      },
    ],
    counters: [
      {
        id: 'counter_1' as CounterId,
        targets: ['card_1' as CardId],
        refuted: false,
      },
    ],
    dealtHand: ['card_1', 'card_2'] as CardId[],
    turns: 8,
    ...overrides,
  };
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Task 020: Result Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().reset();
  });

  describe('AC-1: Win shows "ACCESS GRANTED"', () => {
    it('should display ACCESS GRANTED on win', () => {
      const puzzle = createPuzzle();
      const hand = [createCard('1')];
      useGameStore.getState().startRun(puzzle, hand);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByText('ACCESS GRANTED')).toBeInTheDocument();
    });

    it('should show win styling', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      const container = screen.getByTestId('result-screen');
      expect(container).toHaveAttribute('data-result', 'win');
    });
  });

  describe('AC-2: Loss shows "ACCESS DENIED" with reason', () => {
    it('should display ACCESS DENIED on loss', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.LOST, 'turns_exhausted');

      renderWithRouter(<ResultScreen />);

      expect(screen.getByText('ACCESS DENIED')).toBeInTheDocument();
    });

    it('should show loss reason', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.LOST, 'turns_exhausted');

      renderWithRouter(<ResultScreen />);

      expect(screen.getByTestId('loss-reason')).toBeInTheDocument();
    });
  });

  describe('AC-3: Loss reason for turns exhausted', () => {
    it('should show "Access window closed" for turns exhausted', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.LOST, 'turns_exhausted');

      renderWithRouter(<ResultScreen />);

      expect(screen.getByText(/access window closed/i)).toBeInTheDocument();
    });
  });

  describe('AC-4: Loss reason for scrutiny', () => {
    it('should show scrutiny message for scrutiny loss', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.LOST, 'scrutiny');

      renderWithRouter(<ResultScreen />);

      expect(screen.getByText(/KOA is convinced you're lying/i)).toBeInTheDocument();
    });
  });

  describe('AC-5: Score recap stats', () => {
    it('should display score recap section', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().submitCards([createCard('1')], 10);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByTestId('score-recap')).toBeInTheDocument();
    });

    it('should show turns used', () => {
      const puzzle = createPuzzle({ turns: 8 });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().submitCards([createCard('1')], 10);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByText(/turns/i)).toBeInTheDocument();
    });
  });

  describe('AC-6: Share button', () => {
    it('should render share button', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });
  });

  describe('AC-7: Play Again button', () => {
    it('should render play again button', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    });

    it('should navigate to home on play again click', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      const button = screen.getByRole('button', { name: /play again/i });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('AC-8: Archive button', () => {
    it('should render archive button', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
    });

    it('should navigate to archive on click', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      const button = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/archive');
    });
  });

  describe('AC-9: Win animation', () => {
    it('should show celebration on win', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.getByTestId('celebration')).toBeInTheDocument();
    });

    it('should not show celebration on loss', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.LOST);

      renderWithRouter(<ResultScreen />);

      expect(screen.queryByTestId('celebration')).not.toBeInTheDocument();
    });
  });

  describe('EC-1: Perfect run indicator', () => {
    it('should show perfect run indicator when no scrutiny', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      // With 0 scrutiny, should show perfect indicator
      expect(screen.getByTestId('perfect-indicator')).toBeInTheDocument();
    });

    it('should not show perfect indicator with scrutiny', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().increaseScrutiny(2);
      useGameStore.getState().endRun(RunStatus.WON);

      renderWithRouter(<ResultScreen />);

      expect(screen.queryByTestId('perfect-indicator')).not.toBeInTheDocument();
    });
  });

  describe('No run state', () => {
    it('should redirect to home when no run state', () => {
      useGameStore.getState().reset();

      renderWithRouter(<ResultScreen />);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
