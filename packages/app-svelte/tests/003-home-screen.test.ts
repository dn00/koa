/**
 * Task 003: Home Screen Tests
 *
 * Tests for Home Screen component with puzzle selection, tutorial system,
 * and navigation functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import HomeScreen from '$lib/components/HomeScreen.svelte';
import type { V5Puzzle } from '@hsh/engine-core';
import { resetStores } from '$lib/stores/game';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock SvelteKit navigation
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

// Test puzzle data
const createTestPuzzle = (slug: string, name: string): V5Puzzle => ({
	slug,
	name,
	scenario: `Test scenario for ${name}`,
	knownFacts: ['Fact 1', 'Fact 2'],
	openingLine: 'Access denied.',
	target: 70,
	cards: [],
	lies: [],
	verdicts: {
		flawless: 'Perfect.',
		cleared: 'Acceptable.',
		close: 'Barely.',
		busted: 'Denied.'
	},
	koaBarks: {}
});

const testPuzzles: V5Puzzle[] = [
	createTestPuzzle('puzzle-1', 'Fridge Lock'),
	createTestPuzzle('puzzle-2', 'Thermostat Override'),
	createTestPuzzle('puzzle-3', 'Front Door')
];

describe('Task 003: Home Screen', () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockGoto.mockClear();
		resetStores();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('AC-1: Puzzle List', () => {
		it('displays all puzzles in selectable list when pack is loaded', () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			// All puzzles should be rendered
			expect(screen.getByText('Fridge Lock')).toBeInTheDocument();
			expect(screen.getByText('Thermostat Override')).toBeInTheDocument();
			expect(screen.getByText('Front Door')).toBeInTheDocument();
		});

		it('renders puzzles in order', () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			// Find all puzzle buttons (each puzzle is a button with title)
			const puzzleButtons = document.querySelectorAll('button[data-selected]');
			expect(puzzleButtons).toHaveLength(3);
		});
	});

	describe('AC-2: Puzzle Selection', () => {
		it('highlights selected puzzle when tapped', async () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			const puzzleButton = screen.getByText('Fridge Lock').closest('button');
			expect(puzzleButton).toBeInTheDocument();

			await fireEvent.click(puzzleButton!);

			// Should have selected styling (data attribute)
			expect(puzzleButton).toHaveAttribute('data-selected', 'true');
		});

		it('can change selection to different puzzle', async () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			const puzzle1 = screen.getByText('Fridge Lock').closest('button');
			const puzzle2 = screen.getByText('Thermostat Override').closest('button');

			await fireEvent.click(puzzle1!);
			expect(puzzle1).toHaveAttribute('data-selected', 'true');

			await fireEvent.click(puzzle2!);
			expect(puzzle2).toHaveAttribute('data-selected', 'true');
			expect(puzzle1).toHaveAttribute('data-selected', 'false');
		});
	});

	describe('AC-3: Start Game', () => {
		it('navigates to Run Screen when Start Game is clicked with puzzle selected', async () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			// Select a puzzle first
			const puzzleButton = screen.getByText('Fridge Lock').closest('button');
			await fireEvent.click(puzzleButton!);

			// Click start button
			const startButton = screen.getByRole('button', { name: /start game/i });
			await fireEvent.click(startButton);

			// Should navigate to run screen with puzzle slug
			expect(mockGoto).toHaveBeenCalledWith('/run/puzzle-1');
		});

		it('does not navigate when no puzzle is selected', async () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			const startButton = screen.getByRole('button', { name: /start game/i });
			await fireEvent.click(startButton);

			expect(mockGoto).not.toHaveBeenCalled();
		});
	});

	describe('AC-4: Tutorial Overlay (Day 0)', () => {
		it('shows TutorialOverlay for first-time user', () => {
			// No localStorage flag set = first time user
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			expect(screen.getByText(/welcome/i)).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument();
		});

		it('does not show TutorialOverlay for returning user', () => {
			localStorageMock.setItem('koa-tutorial-complete', 'true');

			render(HomeScreen, { props: { puzzles: testPuzzles } });

			expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
		});

		it('sets localStorage flag when tutorial is dismissed', async () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			const gotItButton = screen.getByRole('button', { name: /got it/i });
			await fireEvent.click(gotItButton);

			expect(localStorageMock.getItem('koa-tutorial-complete')).toBe('true');
		});
	});

	describe('AC-5: Tutorial Card Highlight', () => {
		it('shows pulsing highlight on target element during tutorial', () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			// During tutorial, puzzle list should have highlight
			const highlightedElement = document.querySelector('[data-tutorial-highlight]');
			expect(highlightedElement).toBeInTheDocument();
		});

		it('highlight has pulsing animation class', () => {
			render(HomeScreen, { props: { puzzles: testPuzzles } });

			const highlight = document.querySelector('.tutorial-highlight');
			expect(highlight).toBeInTheDocument();
		});
	});

	describe('EC-1: No Puzzles', () => {
		it('shows "No puzzles available" message when pack is empty', () => {
			render(HomeScreen, { props: { puzzles: [] } });

			expect(screen.getByText(/no puzzles available/i)).toBeInTheDocument();
		});

		it('disables start button when no puzzles available', () => {
			render(HomeScreen, { props: { puzzles: [] } });

			const startButton = screen.getByRole('button', { name: /start game/i });
			expect(startButton).toBeDisabled();
		});
	});
});
