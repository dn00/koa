/**
 * Task 004: HUD Components Tests
 *
 * Tests for OverrideSequence, ExpertViewOverlay, and ActionBar components.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import OverrideSequence from '$lib/components/OverrideSequence.svelte';
import ExpertViewOverlay from '$lib/components/ExpertViewOverlay.svelte';
import ActionBar from '$lib/components/ActionBar.svelte';
import type { UICard } from '$lib/stores/game';
import type { EvidenceType } from '@hsh/engine-core';

// Helper to create test cards
const createTestCard = (
	id: string,
	title: string,
	icon: string,
	type: EvidenceType = 'DIGITAL'
): UICard => ({
	id: id as UICard['id'],
	title,
	icon,
	strength: 3,
	evidenceType: type,
	location: 'Test Location',
	time: '02:15 AM',
	claim: 'Test claim',
	presentLine: 'Test present line',
	isLie: false
});

describe('Task 004: HUD Components', () => {
	afterEach(() => {
		cleanup();
	});

	describe('OverrideSequence', () => {
		describe('AC-1: OverrideSequence Empty State', () => {
			it('shows 3 empty slots with "+" icon when no cards played', () => {
				render(OverrideSequence, { props: { playedCards: [], maxSlots: 3 } });

				// Should have 3 slots
				const plusIcons = screen.getAllByText('+');
				expect(plusIcons).toHaveLength(3);
			});

			it('shows slot labels SLOT_01, SLOT_02, SLOT_03', () => {
				render(OverrideSequence, { props: { playedCards: [], maxSlots: 3 } });

				expect(screen.getByText('SLOT_01')).toBeInTheDocument();
				expect(screen.getByText('SLOT_02')).toBeInTheDocument();
				expect(screen.getByText('SLOT_03')).toBeInTheDocument();
			});
		});

		describe('AC-2: OverrideSequence With Cards', () => {
			it('shows cards in slots 1-2 and empty slot 3 when 2 cards played', () => {
				const playedCards = [
					createTestCard('card-1', 'Card One', '1'),
					createTestCard('card-2', 'Card Two', '2')
				];

				render(OverrideSequence, { props: { playedCards, maxSlots: 3 } });

				expect(screen.getByText('Card One')).toBeInTheDocument();
				expect(screen.getByText('Card Two')).toBeInTheDocument();
				expect(screen.getByText('SLOT_03')).toBeInTheDocument();
				expect(screen.queryByText('SLOT_01')).not.toBeInTheDocument();
				expect(screen.queryByText('SLOT_02')).not.toBeInTheDocument();
			});
		});

		describe('AC-3: OverrideSequence Card Display', () => {
			it('shows type badge, icon emoji, and card title for filled slot', () => {
				const playedCards = [createTestCard('card-1', 'Thermostat Log', '7', 'SENSOR')];

				render(OverrideSequence, { props: { playedCards, maxSlots: 3 } });

				// Type badge (SENSOR maps to SENSOR label)
				expect(screen.getByText('SENSOR')).toBeInTheDocument();
				// Icon
				expect(screen.getByText('7')).toBeInTheDocument();
				// Title
				expect(screen.getByText('Thermostat Log')).toBeInTheDocument();
			});
		});
	});

	describe('ExpertViewOverlay', () => {
		describe('AC-4: ExpertViewOverlay Hidden in Mini', () => {
			it('is not visible when mode is mini', () => {
				const { container } = render(ExpertViewOverlay, {
					props: { mode: 'mini', belief: 65 }
				});

				// Component should not render anything visible - just comment node
				const visibleChildren = Array.from(container.childNodes).filter(
					(node) => node.nodeType === Node.ELEMENT_NODE
				);
				expect(visibleChildren.length).toBe(0);
			});
		});

		describe('AC-5: ExpertViewOverlay Visible in Expert', () => {
			it('shows UNLOCK PROBABILITY with correct percentage in expert mode', () => {
				render(ExpertViewOverlay, { props: { mode: 'expert', belief: 65 } });

				expect(screen.getByText(/unlock probability/i)).toBeInTheDocument();
				// belief 65 means 35% unlock probability (100-65=35)
				expect(screen.getByText('35%')).toBeInTheDocument();
			});

			it('shows progress bar at correct width', () => {
				render(ExpertViewOverlay, { props: { mode: 'expert', belief: 65 } });

				const progressBar = document.querySelector('[data-progress-bar]');
				expect(progressBar).toBeInTheDocument();
				expect(progressBar).toHaveStyle({ width: '35%' });
			});
		});
	});

	describe('ActionBar', () => {
		describe('AC-6: ActionBar TRANSMIT Button', () => {
			it('has active styling when card is selected', () => {
				render(ActionBar, {
					props: { selectedCardId: 'card-1', onTransmit: vi.fn() }
				});

				const transmitButton = screen.getByRole('button', { name: /transmit/i });
				expect(transmitButton).not.toBeDisabled();
				expect(transmitButton.className).toContain('bg-primary');
			});

			it('triggers playSelectedCard when clicked', async () => {
				const mockTransmit = vi.fn();
				render(ActionBar, {
					props: { selectedCardId: 'card-1', onTransmit: mockTransmit }
				});

				const transmitButton = screen.getByRole('button', { name: /transmit/i });
				await fireEvent.click(transmitButton);

				expect(mockTransmit).toHaveBeenCalled();
			});
		});

		describe('AC-7: ActionBar TRANSMIT Disabled', () => {
			it('has disabled styling when no card selected', () => {
				render(ActionBar, {
					props: { selectedCardId: null, onTransmit: vi.fn() }
				});

				const transmitButton = screen.getByRole('button', { name: /transmit/i });
				expect(transmitButton).toBeDisabled();
				expect(transmitButton.className).toContain('cursor-not-allowed');
			});

			it('does nothing when clicked while disabled', async () => {
				const mockTransmit = vi.fn();
				render(ActionBar, {
					props: { selectedCardId: null, onTransmit: mockTransmit }
				});

				const transmitButton = screen.getByRole('button', { name: /transmit/i });
				await fireEvent.click(transmitButton);

				expect(mockTransmit).not.toHaveBeenCalled();
			});
		});
	});

	describe('Edge Cases', () => {
		describe('EC-1: All Cards Played', () => {
			it('shows all 3 slots filled when game is complete', () => {
				const playedCards = [
					createTestCard('card-1', 'Card One', '1'),
					createTestCard('card-2', 'Card Two', '2'),
					createTestCard('card-3', 'Card Three', '3')
				];

				render(OverrideSequence, { props: { playedCards, maxSlots: 3 } });

				expect(screen.getByText('Card One')).toBeInTheDocument();
				expect(screen.getByText('Card Two')).toBeInTheDocument();
				expect(screen.getByText('Card Three')).toBeInTheDocument();
				expect(screen.queryByText(/SLOT_/)).not.toBeInTheDocument();
			});
		});

		describe('EC-2: Belief at Boundaries', () => {
			it('shows 100% when belief is 0', () => {
				render(ExpertViewOverlay, { props: { mode: 'expert', belief: 0 } });

				expect(screen.getByText('100%')).toBeInTheDocument();
				const progressBar = document.querySelector('[data-progress-bar]');
				expect(progressBar).toHaveStyle({ width: '100%' });
			});

			it('shows 0% when belief is 100', () => {
				render(ExpertViewOverlay, { props: { mode: 'expert', belief: 100 } });

				expect(screen.getByText('0%')).toBeInTheDocument();
				const progressBar = document.querySelector('[data-progress-bar]');
				expect(progressBar).toHaveStyle({ width: '0%' });
			});
		});
	});
});
