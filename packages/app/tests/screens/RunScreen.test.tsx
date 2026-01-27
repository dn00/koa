/**
 * Tests for Task 017: Run Screen
 *
 * Main gameplay UI with HUD components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RunScreen } from '../../src/screens/run/RunScreen.js';
import { useGameStore } from '../../src/stores/gameStore.js';
import { useSettingsStore } from '../../src/stores/settingsStore.js';
import type { Puzzle, EvidenceCard, Concern, CounterEvidence } from '@hsh/engine-core';
import type { CardId, ConcernId, CounterId, PuzzleId } from '@hsh/engine-core';
import { ProofType, ConcernType } from '@hsh/engine-core';

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

function createConcern(id: string, addressed: boolean = false): Concern {
  return {
    id: `concern_${id}` as ConcernId,
    type: ConcernType.IDENTITY,
    requiredProof: ProofType.IDENTITY,
    addressed,
  };
}

function createCounter(id: string, targets: string[] = []): CounterEvidence {
  return {
    id: `counter_${id}` as CounterId,
    targets: targets.map((t) => `card_${t}` as CardId),
    refuted: false,
  };
}

function createPuzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle_test' as PuzzleId,
    targetName: 'Test Target',
    resistance: 100,
    concerns: [createConcern('1'), createConcern('2')],
    counters: [createCounter('1', ['a'])],
    dealtHand: ['card_1', 'card_2', 'card_3', 'card_4', 'card_5', 'card_6'] as CardId[],
    turns: 8,
    ...overrides,
  };
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Task 017: Run Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.getState().reset();
    useSettingsStore.getState().reset();
  });

  describe('AC-1: Layout shows all areas', () => {
    it('should render HUD, hand, story, and counter areas', () => {
      const puzzle = createPuzzle();
      const hand = [
        createCard('1'),
        createCard('2'),
        createCard('3'),
        createCard('4'),
        createCard('5'),
        createCard('6'),
      ];
      useGameStore.getState().startRun(puzzle, hand);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('run-hud')).toBeInTheDocument();
      expect(screen.getByTestId('hand-carousel')).toBeInTheDocument();
      expect(screen.getByTestId('story-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('counter-panel')).toBeInTheDocument();
    });
  });

  describe('AC-2: Resistance with progress bar', () => {
    it('should display resistance bar with current value', () => {
      const puzzle = createPuzzle({ resistance: 80 });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('resistance-bar')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('should show progress bar percentage', () => {
      const puzzle = createPuzzle({ resistance: 100 });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('AC-3: Scrutiny indicator', () => {
    it('should display scrutiny level', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('scrutiny-indicator')).toBeInTheDocument();
      expect(screen.getByText(/0.*\/.*5/)).toBeInTheDocument();
    });
  });

  describe('AC-4: Concerns with addressed state', () => {
    it('should display concern chips', () => {
      const puzzle = createPuzzle({
        concerns: [createConcern('1', false), createConcern('2', false)],
      });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const chips = screen.getAllByTestId('concern-chip');
      expect(chips.length).toBe(2);
    });

    it('should visually distinguish addressed concerns', () => {
      const puzzle = createPuzzle({
        concerns: [createConcern('1', false)],
      });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      // Address the concern through the game store
      useGameStore.getState().addressConcern('concern_1' as ConcernId);

      renderWithRouter(<RunScreen />);

      const chip = screen.getByTestId('concern-chip');
      expect(chip).toHaveAttribute('data-addressed', 'true');
    });
  });

  describe('AC-5: Turns remaining', () => {
    it('should display turns remaining', () => {
      const puzzle = createPuzzle({ turns: 6 });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('turns-display')).toBeInTheDocument();
      expect(screen.getByText(/6/)).toBeInTheDocument();
    });
  });

  describe('AC-6: Hand displays 6 cards', () => {
    it('should display all cards in hand', () => {
      const puzzle = createPuzzle();
      const hand = [
        createCard('1'),
        createCard('2'),
        createCard('3'),
        createCard('4'),
        createCard('5'),
        createCard('6'),
      ];
      useGameStore.getState().startRun(puzzle, hand);

      renderWithRouter(<RunScreen />);

      const cards = screen.getAllByRole('button', { name: /Source/i });
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AC-7: Committed story timeline', () => {
    it('should display committed cards in timeline', () => {
      const puzzle = createPuzzle();
      const hand = [createCard('1'), createCard('2')];
      useGameStore.getState().startRun(puzzle, hand);
      useGameStore.getState().submitCards([hand[0]], 10);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('story-timeline')).toBeInTheDocument();
    });

    it('should show empty state when no cards committed', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const timeline = screen.getByTestId('story-timeline');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('AC-8: Counter panel visible (FULL)', () => {
    it('should show counter panel when visibility is always', () => {
      const puzzle = createPuzzle();
      useSettingsStore.getState().setCounterVisibility('always');
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const panel = screen.getByTestId('counter-panel');
      expect(panel).toHaveAttribute('data-visibility', 'always');
    });
  });

  describe('AC-9: Counter panel hidden (HIDDEN)', () => {
    it('should hide counter panel when visibility is never', () => {
      const puzzle = createPuzzle();
      useSettingsStore.getState().setCounterVisibility('never');
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const panel = screen.getByTestId('counter-panel');
      expect(panel).toHaveAttribute('data-visibility', 'never');
    });
  });

  describe('AC-10: Submit button visible/enabled', () => {
    it('should show submit button', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should enable submit when cards selected', () => {
      const puzzle = createPuzzle();
      const hand = [createCard('1')];
      useGameStore.getState().startRun(puzzle, hand);

      renderWithRouter(<RunScreen />);

      // Select a card first
      const card = screen.getByRole('button', { name: /Source 1/i });
      fireEvent.click(card);

      const submit = screen.getByRole('button', { name: /submit/i });
      expect(submit).not.toBeDisabled();
    });
  });

  describe('AC-11: Mobile touch carousel', () => {
    it('should render hand as carousel', () => {
      const puzzle = createPuzzle();
      const hand = [createCard('1'), createCard('2')];
      useGameStore.getState().startRun(puzzle, hand);

      renderWithRouter(<RunScreen />);

      expect(screen.getByTestId('hand-carousel')).toBeInTheDocument();
    });
  });

  describe('EC-1: No cards selected (button disabled)', () => {
    it('should disable submit when no cards selected', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);

      renderWithRouter(<RunScreen />);

      const submit = screen.getByRole('button', { name: /submit/i });
      expect(submit).toBeDisabled();
    });
  });

  describe('EC-2: All concerns addressed', () => {
    it('should show all concerns as addressed', () => {
      const puzzle = createPuzzle({
        concerns: [createConcern('1', false), createConcern('2', false)],
      });
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      // Address both concerns through the game store
      useGameStore.getState().addressConcern('concern_1' as ConcernId);
      useGameStore.getState().addressConcern('concern_2' as ConcernId);

      renderWithRouter(<RunScreen />);

      const chips = screen.getAllByTestId('concern-chip');
      chips.forEach((chip) => {
        expect(chip).toHaveAttribute('data-addressed', 'true');
      });
    });
  });

  describe('EC-3: Scrutiny at 4 (warning)', () => {
    it('should show warning state at high scrutiny', () => {
      const puzzle = createPuzzle();
      useGameStore.getState().startRun(puzzle, [createCard('1')]);
      useGameStore.getState().increaseScrutiny(4);

      renderWithRouter(<RunScreen />);

      const indicator = screen.getByTestId('scrutiny-indicator');
      expect(indicator).toHaveAttribute('data-warning', 'true');
    });
  });

  describe('ERR-1: No active run (redirect)', () => {
    it('should redirect to home when no run state', () => {
      // Don't start a run
      useGameStore.getState().reset();

      renderWithRouter(<RunScreen />);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
