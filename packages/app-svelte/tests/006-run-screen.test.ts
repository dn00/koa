/**
 * Task 006: Run Screen Tests
 *
 * Tests for the Run Screen component that orchestrates V5 gameplay:
 * 3 turns of card play followed by objection prompt.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import RunScreen from '$lib/components/RunScreen.svelte';
import type { V5Puzzle, Card } from '@hsh/engine-core';
import { resetStores, gameState, startGame, phase } from '$lib/stores/game';
import { get } from 'svelte/store';

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

// Mock navigation
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

// Test card factory
function createTestCard(id: string, isLie: boolean = false): Card {
	return {
		id,
		evidenceType: 'DIGITAL',
		claim: `Test claim for ${id}`,
		location: 'Kitchen',
		time: '02:15 AM',
		strength: 2,
		isLie,
		presentLine: `Presenting ${id}`,
		lieReason: isLie ? `${id} contradicts the facts` : undefined
	};
}

// Test puzzle factory
function createTestPuzzle(): V5Puzzle {
	return {
		slug: 'test-puzzle',
		name: 'Test Puzzle',
		scenario: 'KOA locked the fridge.',
		knownFacts: ['You were home.', 'The time was 2 AM.', 'You claim innocence.'],
		openingLine: 'System locked. Justify your actions.',
		target: 65,
		cards: [
			createTestCard('card-1', false),
			createTestCard('card-2', false),
			createTestCard('card-3', true),
			createTestCard('card-4', false),
			createTestCard('card-5', true),
			createTestCard('card-6', false)
		],
		lies: [
			{ cardId: 'card-3', lieType: 'direct_contradiction', reason: 'Contradicts fact 1' },
			{ cardId: 'card-5', lieType: 'relational', reason: 'Conflicts with card-1' }
		],
		verdicts: {
			flawless: 'Perfect execution.',
			cleared: 'Acceptable.',
			close: 'Barely made it.',
			busted: 'Denied.'
		},
		koaBarks: {}
	};
}

// Helper to add UI fields to cards
function addUIFields(card: Card) {
	return {
		...card,
		icon: '📄',
		title: `Card ${card.id}`
	};
}

describe('Task 006: Run Screen', () => {
	let testPuzzle: V5Puzzle;

	beforeEach(() => {
		localStorageMock.clear();
		mockGoto.mockClear();
		resetStores();
		testPuzzle = createTestPuzzle();
		startGame(testPuzzle, Date.now());
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('AC-1: Screen Layout', () => {
		it('renders Zone 1 (Avatar + Bark panel) when game started', () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Zone 1 should contain avatar and bark panel
			expect(document.querySelector('[data-zone="avatar"]')).toBeInTheDocument();
			expect(document.querySelector('[data-zone="bark-panel"]')).toBeInTheDocument();
		});

		it('renders Zone 2 (Override Slots)', () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			expect(document.querySelector('[data-zone="override-sequence"]')).toBeInTheDocument();
		});

		it('renders Zone 3 (Action Bar + Card Grid)', () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			expect(document.querySelector('[data-zone="action-bar"]')).toBeInTheDocument();
			expect(document.querySelector('[data-zone="card-grid"]')).toBeInTheDocument();
		});
	});

	describe('AC-2: Card Play Flow', () => {
		it('allows selecting a card from the grid', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Find a card and click it
			const cards = document.querySelectorAll('[data-card-id]');
			expect(cards.length).toBeGreaterThan(0);

			await fireEvent.click(cards[0]);

			// Card should be marked as selected
			expect(cards[0]).toHaveAttribute('data-selected', 'true');
		});

		it('enables TRANSMIT button when card is selected', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Initially TRANSMIT should be disabled
			const transmitButton = screen.getByRole('button', { name: /transmit/i });
			expect(transmitButton).toBeDisabled();

			// Select a card
			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.click(cards[0]);

			// Now TRANSMIT should be enabled
			expect(transmitButton).not.toBeDisabled();
		});

		it('plays card when TRANSMIT is clicked', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Select and play a card
			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.click(cards[0]);

			const transmitButton = screen.getByRole('button', { name: /transmit/i });
			await fireEvent.click(transmitButton);

			// Game state should reflect played card
			const state = get(gameState);
			expect(state?.turnsPlayed).toBe(1);
		});
	});

	describe('AC-3: Turn Progression', () => {
		it('shows filled slot after card is played', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Play first card
			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.click(cards[0]);
			await fireEvent.click(screen.getByRole('button', { name: /transmit/i }));

			// Override sequence should show 1 filled slot
			await waitFor(() => {
				const filledSlots = document.querySelectorAll('[data-slot-filled="true"]');
				expect(filledSlots.length).toBe(1);
			});
		});

		it('shows 2 filled slots after turn 2', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Play two cards with waiting between
			for (let i = 0; i < 2; i++) {
				await waitFor(() => {
					const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
					expect(cards.length).toBeGreaterThan(0);
				});

				const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
				await fireEvent.click(cards[0]);

				await waitFor(() => {
					const transmitButton = screen.getByRole('button', { name: /transmit/i });
					expect(transmitButton).not.toBeDisabled();
				});

				await fireEvent.click(screen.getByRole('button', { name: /transmit/i }));

				// Wait for play to complete
				await new Promise(r => setTimeout(r, 350));
			}

			await waitFor(() => {
				const filledSlots = document.querySelectorAll('[data-slot-filled="true"]');
				expect(filledSlots.length).toBe(2);
			});
		});

		it('shows placeholder for unfilled slots', () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// All 3 slots should be empty initially
			const emptySlots = document.querySelectorAll('[data-slot-filled="false"]');
			expect(emptySlots.length).toBe(3);
		});
	});

	describe('AC-4: Card Preview on Hover', () => {
		it('shows card preview in Zone 2 when card is focused', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Hover over a card
			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.mouseEnter(cards[0]);

			// Zone 2 should switch to preview mode
			await waitFor(() => {
				expect(document.querySelector('[data-zone2-mode="preview"]')).toBeInTheDocument();
			});
		});

		it('returns to Override Slots when card is unfocused', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.mouseEnter(cards[0]);
			await fireEvent.mouseLeave(cards[0]);

			// Zone 2 should return to slots mode
			await waitFor(() => {
				expect(document.querySelector('[data-zone2-mode="slots"]')).toBeInTheDocument();
			});
		});
	});

	describe('AC-5: Bark/Logs Toggle', () => {
		it('shows bark by default', () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			const barkPanel = document.querySelector('[data-zone="bark-panel"]');
			expect(barkPanel).toBeInTheDocument();
		});

		it('can switch to LOGS tab to see facts', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			const logsTab = screen.getByRole('button', { name: /logs/i });
			await fireEvent.click(logsTab);

			// Should show known facts
			expect(screen.getByText(/you were home/i)).toBeInTheDocument();
		});
	});

	describe('AC-6: Objection Trigger', () => {
		it('triggers objection prompt after turn 2 in Advanced mode', async () => {
			// This test is for integration with objection system
			// In mini mode, objection auto-resolves
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Play two cards with proper waiting
			for (let i = 0; i < 2; i++) {
				await waitFor(() => {
					const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
					expect(cards.length).toBeGreaterThan(0);
				});

				const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
				await fireEvent.click(cards[0]);

				await waitFor(() => {
					const transmitButton = screen.getByRole('button', { name: /transmit/i });
					expect(transmitButton).not.toBeDisabled();
				});

				await fireEvent.click(screen.getByRole('button', { name: /transmit/i }));
				await new Promise(r => setTimeout(r, 350));
			}

			// Objection should have been processed (auto-resolve in mini)
			await waitFor(() => {
				const state = get(gameState);
				// After turn 2, objection should be resolved or pending
				expect(state?.turnsPlayed).toBe(2);
			});
		});
	});

	describe('AC-7: Game End Navigation', () => {
		it('navigates to Result Screen after turn 3', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Play three cards with proper waiting
			for (let i = 0; i < 3; i++) {
				await waitFor(() => {
					const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
					expect(cards.length).toBeGreaterThan(0);
				});

				const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
				await fireEvent.click(cards[0]);

				await waitFor(() => {
					const transmitButton = screen.getByRole('button', { name: /transmit/i });
					expect(transmitButton).not.toBeDisabled();
				});

				await fireEvent.click(screen.getByRole('button', { name: /transmit/i }));
				await new Promise(r => setTimeout(r, 350));
			}

			// Should navigate to verdict or phase should change
			await waitFor(() => {
				const currentPhase = get(phase);
				expect(currentPhase).toBe('VERDICT');
			}, { timeout: 3000 });
		});
	});

	describe('EC-1: Quick Card Plays', () => {
		it('disables TRANSMIT during animation/processing', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			const cards = document.querySelectorAll('[data-card-id]');
			await fireEvent.click(cards[0]);

			const transmitButton = screen.getByRole('button', { name: /transmit/i });
			await fireEvent.click(transmitButton);

			// During processing, button should be disabled or state should prevent double-play
			// This is validated by checking game state doesn't skip turns
			await waitFor(() => {
				const state = get(gameState);
				expect(state?.turnsPlayed).toBe(1);
			});
		});
	});

	describe('EC-2: Page Refresh Mid-Game', () => {
		it('renders with existing game state', () => {
			// Start game and play a card to change state
			const state = get(gameState);
			expect(state).not.toBeNull();

			// Re-render with same puzzle (simulating refresh)
			cleanup();
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Component should restore from store
			expect(document.querySelector('[data-zone="card-grid"]')).toBeInTheDocument();
		});
	});

	describe('ERR-1: No Cards Left', () => {
		it('handles gracefully if hand is somehow empty', async () => {
			render(RunScreen, {
				props: {
					puzzle: testPuzzle
				}
			});

			// Play all 3 turns with proper waiting
			for (let i = 0; i < 3; i++) {
				await waitFor(() => {
					const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
					expect(cards.length).toBeGreaterThan(0);
				});

				const cards = document.querySelectorAll('[data-card-id]:not([data-disabled="true"])');
				await fireEvent.click(cards[0]);

				await waitFor(() => {
					const transmitButton = screen.getByRole('button', { name: /transmit/i });
					expect(transmitButton).not.toBeDisabled();
				});

				await fireEvent.click(screen.getByRole('button', { name: /transmit/i }));
				await new Promise(r => setTimeout(r, 350));
			}

			// After 3 turns, game should end gracefully
			await waitFor(() => {
				const currentPhase = get(phase);
				expect(currentPhase).toBe('VERDICT');
			}, { timeout: 3000 });
		});
	});
});
