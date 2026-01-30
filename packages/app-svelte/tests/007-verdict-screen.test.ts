/**
 * Task 007: Verdict + Share Screen Tests
 *
 * Tests for the Verdict Screen showing tier badge, played cards with lie reveal,
 * contradictions, and ShareCard artifact generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import VerdictScreen from '$lib/components/VerdictScreen.svelte';
import type { Tier, Card } from '@hsh/engine-core';
import type { VerdictData } from '@hsh/engine-core';
import { resetStores, mode } from '$lib/stores/game';

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

// Test verdict data factory
function createTestVerdict(
	tier: Tier,
	playedCards: Array<{ card: Card; wasLie: boolean; contradictionReason?: string }>
): VerdictData {
	const koaLines: Record<Tier, string> = {
		FLAWLESS: 'Perfect execution. I am impressed.',
		CLEARED: 'Fine. I will allow it this once.',
		CLOSE: 'Your story has holes, but I am feeling generous.',
		BUSTED: 'I have already locked the fridge.'
	};

	return {
		tier,
		beliefFinal: tier === 'FLAWLESS' ? 75 : tier === 'CLEARED' ? 68 : tier === 'CLOSE' ? 58 : 45,
		beliefTarget: 65,
		koaLine: koaLines[tier],
		playedCards
	};
}

describe('Task 007: Verdict + Share Screen', () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockGoto.mockClear();
		resetStores();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('AC-1: Tier Display', () => {
		it('shows CLEARED tier with appropriate styling', () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3', true), wasLie: true }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByText('CLEARED')).toBeInTheDocument();
			expect(document.querySelector('[data-tier="CLEARED"]')).toBeInTheDocument();
		});

		it('shows FLAWLESS tier with special celebration styling', () => {
			const verdict = createTestVerdict('FLAWLESS', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByText('FLAWLESS')).toBeInTheDocument();
			expect(document.querySelector('[data-tier="FLAWLESS"]')).toBeInTheDocument();
		});

		it('shows BUSTED tier correctly', () => {
			const verdict = createTestVerdict('BUSTED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2', true), wasLie: true },
				{ card: createTestCard('card-3', true), wasLie: true }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByText('BUSTED')).toBeInTheDocument();
		});

		it('shows CLOSE tier correctly', () => {
			const verdict = createTestVerdict('CLOSE', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3', true), wasLie: true }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByText('CLOSE')).toBeInTheDocument();
		});
	});

	describe('AC-2: Belief Summary (Advanced Only)', () => {
		it('shows belief values in advanced mode', () => {
			mode.set('advanced');

			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Should show final belief and target
			expect(screen.getByText(/68/)).toBeInTheDocument();
			expect(screen.getByText(/65/)).toBeInTheDocument();
		});

		it('hides belief values in mini mode', () => {
			mode.set('mini');

			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Belief numbers should not be visible
			expect(document.querySelector('[data-belief-display]')).not.toBeInTheDocument();
		});
	});

	describe('AC-3: Card Reveal', () => {
		it('shows all played cards with truth/lie status', () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3', true), wasLie: true }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Should show 3 cards
			const cardElements = document.querySelectorAll('[data-played-card]');
			expect(cardElements.length).toBe(3);

			// Check truth markers
			const truthMarkers = document.querySelectorAll('[data-card-truth="true"]');
			expect(truthMarkers.length).toBe(2);

			// Check lie markers
			const lieMarkers = document.querySelectorAll('[data-card-truth="false"]');
			expect(lieMarkers.length).toBe(1);
		});

		it('displays check mark for truths and X for lies', () => {
			const verdict = createTestVerdict('CLOSE', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2', true), wasLie: true },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Should have visual indicators
			expect(document.querySelector('[data-truth-indicator]')).toBeInTheDocument();
			expect(document.querySelector('[data-lie-indicator]')).toBeInTheDocument();
		});
	});

	describe('AC-4: Play Again', () => {
		it('navigates to Home Screen when Play Again is clicked', async () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			const playAgainButton = screen.getByRole('button', { name: /play again|back|start/i });
			await fireEvent.click(playAgainButton);

			expect(mockGoto).toHaveBeenCalledWith('/');
		});
	});

	describe('AC-5: Contradiction Display', () => {
		it('shows ContradictionBlock when lies were played', () => {
			const verdict = createTestVerdict('CLOSE', [
				{ card: createTestCard('card-1'), wasLie: false },
				{
					card: createTestCard('card-2', true),
					wasLie: true,
					contradictionReason: 'Contradicts Fact #2: You claimed to be in bed by 11'
				},
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Should show contradiction explanation
			expect(screen.getByText(/contradicts/i)).toBeInTheDocument();
		});

		it('does not show ContradictionBlock when no lies played', () => {
			const verdict = createTestVerdict('FLAWLESS', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// No contradiction block when no lies
			expect(document.querySelector('[data-contradiction-block]')).not.toBeInTheDocument();
		});
	});

	describe('AC-6: ShareCard Generation', () => {
		it('shows Share button on verdict screen', () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
		});

		it('generates ShareCard with day, results, tier, and quote when Share is clicked', async () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3', true), wasLie: true }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			const shareButton = screen.getByRole('button', { name: /share/i });
			await fireEvent.click(shareButton);

			// ShareCard should appear with required fields
			await waitFor(() => {
				expect(document.querySelector('[data-share-card]')).toBeInTheDocument();
			});

			// Should contain day number
			expect(screen.getByText(/day 37/i)).toBeInTheDocument();
		});
	});

	describe('AC-7: VerdictLine Quote', () => {
		it('displays KOA quote based on tier', () => {
			const verdict = createTestVerdict('CLEARED', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// Should display the KOA quote
			expect(screen.getByText(/i will allow it/i)).toBeInTheDocument();
		});

		it('shows BUSTED quote for losing', () => {
			const verdict = createTestVerdict('BUSTED', [
				{ card: createTestCard('card-1', true), wasLie: true },
				{ card: createTestCard('card-2', true), wasLie: true },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			expect(screen.getByText(/locked the fridge/i)).toBeInTheDocument();
		});
	});

	describe('EC-1: FLAWLESS (No Lies)', () => {
		it('shows special celebration for FLAWLESS tier', () => {
			const verdict = createTestVerdict('FLAWLESS', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			// FLAWLESS should have special styling
			const tierBadge = document.querySelector('[data-tier="FLAWLESS"]');
			expect(tierBadge).toBeInTheDocument();

			// Special visual treatment (green background on container)
			expect(tierBadge?.className).toContain('bg-green');
		});

		it('all cards show truth markers for FLAWLESS', () => {
			const verdict = createTestVerdict('FLAWLESS', [
				{ card: createTestCard('card-1'), wasLie: false },
				{ card: createTestCard('card-2'), wasLie: false },
				{ card: createTestCard('card-3'), wasLie: false }
			]);

			render(VerdictScreen, {
				props: {
					verdict,
					dayNumber: 37
				}
			});

			const truthMarkers = document.querySelectorAll('[data-card-truth="true"]');
			expect(truthMarkers.length).toBe(3);

			const lieMarkers = document.querySelectorAll('[data-card-truth="false"]');
			expect(lieMarkers.length).toBe(0);
		});
	});
});
