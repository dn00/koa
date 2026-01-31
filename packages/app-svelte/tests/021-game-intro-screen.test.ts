/**
 * Task 021: Game Intro Screen Tests
 *
 * Tests for the IntroScreen component shown before card selection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import IntroScreen from '$lib/components/IntroScreen.svelte';
import type { V5Puzzle } from '@hsh/engine-core';

// Mock puzzle data
function createTestPuzzle(): V5Puzzle {
	return {
		slug: 'printgate',
		name: 'PrintGate',
		scenario: 'Sixteen pages. 3 AM. Merger documents. I am not angry. I am documenting.',
		knownFacts: [
			'Print job arrived via cloud',
			'Motion sensor: pet-height',
			'Router: zero device sessions'
		],
		openingLine: 'Sixteen pages. 3 AM. Merger documents. I am not angry. I am documenting.',
		target: 65,
		cards: [],
		lies: [],
		verdicts: {
			flawless: 'Perfect.',
			cleared: 'Fine.',
			close: 'Generous.',
			busted: 'Locked.'
		},
		koaBarks: {}
	};
}

describe('Task 021: Game Intro Screen', () => {
	let mockOnStart: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockOnStart = vi.fn();
	});

	afterEach(() => {
		cleanup();
	});

	describe('AC-1: Route Exists', () => {
		it('renders intro screen before card selection', () => {
			const puzzle = createTestPuzzle();
			render(IntroScreen, {
				props: {
					puzzle,
					dayNumber: 37,
					onStart: mockOnStart
				}
			});

			// Verify component renders
			expect(screen.getByText('KOA MINI')).toBeInTheDocument();
		});
	});

	describe('AC-2: Scenario Display', () => {
		it('shows puzzle name and KOA opening line', () => {
			const puzzle = createTestPuzzle();
			render(IntroScreen, {
				props: {
					puzzle,
					dayNumber: 37,
					onStart: mockOnStart
				}
			});

			// Check for day number and puzzle name
			expect(screen.getByText(/Day 37:/)).toBeInTheDocument();
			expect(screen.getByText(/PrintGate/)).toBeInTheDocument();

			// Check for opening line
			expect(screen.getByText(/Sixteen pages. 3 AM. Merger documents/)).toBeInTheDocument();
		});
	});

	describe('AC-3: Known Facts Display', () => {
		it('shows all Known Facts as bullet list', () => {
			const puzzle = createTestPuzzle();
			render(IntroScreen, {
				props: {
					puzzle,
					dayNumber: 37,
					onStart: mockOnStart
				}
			});

			// Check for "KNOWN FACTS" header
			expect(screen.getByText('KNOWN FACTS')).toBeInTheDocument();

			// Check each fact is displayed
			expect(screen.getByText(/Print job arrived via cloud/)).toBeInTheDocument();
			expect(screen.getByText(/Motion sensor: pet-height/)).toBeInTheDocument();
			expect(screen.getByText(/Router: zero device sessions/)).toBeInTheDocument();
		});
	});

	describe('AC-4: Instructions Display', () => {
		it('shows brief instructions for first-time player', () => {
			const puzzle = createTestPuzzle();
			render(IntroScreen, {
				props: {
					puzzle,
					dayNumber: 37,
					onStart: mockOnStart
				}
			});

			// Check for instructions
			expect(
				screen.getByText(/Pick 3 cards that fit the facts. Avoid the lies./)
			).toBeInTheDocument();
		});
	});

	describe('AC-5: Start Button', () => {
		it('navigates to card selection when START is tapped', async () => {
			const puzzle = createTestPuzzle();
			render(IntroScreen, {
				props: {
					puzzle,
					dayNumber: 37,
					onStart: mockOnStart
				}
			});

			// Find and click START button
			const startButton = screen.getByRole('button', { name: /START/i });
			expect(startButton).toBeInTheDocument();

			await fireEvent.click(startButton);

			// Verify callback was called
			expect(mockOnStart).toHaveBeenCalledTimes(1);
		});
	});
});
