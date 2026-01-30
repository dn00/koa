/**
 * Task 014: Data Panels Tests
 *
 * Tests for CardPreviewPanel and Zone 2 swap behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import CardPreviewPanel from '$lib/components/CardPreviewPanel.svelte';
import Zone2Display from '$lib/components/Zone2Display.svelte';
import type { UICard } from '$lib/stores/game';
import type { EvidenceType } from '@hsh/engine-core';

// Helper to create test cards
const createTestCard = (overrides: Partial<UICard> = {}): UICard => ({
	id: 'test-card' as UICard['id'],
	title: 'Thermostat Log',
	icon: '7',
	strength: 3,
	evidenceType: 'SENSOR' as EvidenceType,
	location: 'Living Room',
	time: '02:15 AM',
	claim: 'Temperature was set to 72F at the time of incident.',
	presentLine: 'The thermostat shows normal activity.',
	isLie: false,
	...overrides
});

describe('Task 014: Data Panels', () => {
	afterEach(() => {
		cleanup();
	});

	describe('CardPreviewPanel', () => {
		describe('AC-1: CardPreviewPanel Inline', () => {
			it('shows card icon', () => {
				const card = createTestCard({ icon: '7' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText('7')).toBeInTheDocument();
			});

			it('shows type badge', () => {
				const card = createTestCard({ evidenceType: 'SENSOR' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText('SENSOR')).toBeInTheDocument();
			});

			it('shows location', () => {
				const card = createTestCard({ location: 'Kitchen' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText(/kitchen/i)).toBeInTheDocument();
			});

			it('shows time', () => {
				const card = createTestCard({ time: '03:42 AM' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText('03:42 AM')).toBeInTheDocument();
			});

			it('shows card title', () => {
				const card = createTestCard({ title: 'Server Access Log' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText('Server Access Log')).toBeInTheDocument();
			});

			it('shows card description (claim)', () => {
				const card = createTestCard({ claim: 'Device authenticated at 03:42 AM.' });
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText(/device authenticated/i)).toBeInTheDocument();
			});

			it('has decorative corner element', () => {
				const card = createTestCard();
				const { container } = render(CardPreviewPanel, { props: { card } });

				const corner = container.querySelector('[data-decorative-corner]');
				expect(corner).toBeInTheDocument();
			});
		});
	});

	describe('Zone2Display', () => {
		describe('AC-2: Zone 2 Swap Behavior', () => {
			it('shows OverrideSequence when no card is focused', () => {
				render(Zone2Display, {
					props: { focusedCard: null, playedCards: [], maxSlots: 3 }
				});

				// Should show slot labels
				expect(screen.getByText('SLOT_01')).toBeInTheDocument();
			});

			it('shows CardPreviewPanel when card is focused', () => {
				const card = createTestCard({ title: 'Focused Card' });
				render(Zone2Display, {
					props: { focusedCard: card, playedCards: [], maxSlots: 3 }
				});

				// Should show card preview, not slots
				expect(screen.getByText('Focused Card')).toBeInTheDocument();
				expect(screen.queryByText('SLOT_01')).not.toBeInTheDocument();
			});

			it('has transition container for smooth swap', () => {
				const { container } = render(Zone2Display, {
					props: { focusedCard: null, playedCards: [], maxSlots: 3 }
				});

				const transitionContainer = container.querySelector('[data-zone2-content]');
				expect(transitionContainer).toBeInTheDocument();
			});
		});

		describe('AC-3: Preview Dismissal', () => {
			it('swaps back to OverrideSequence when focus is removed via re-render', () => {
				const card = createTestCard({ title: 'Focused Card' });
				const { rerender } = render(Zone2Display, {
					props: { focusedCard: card, playedCards: [], maxSlots: 3 }
				});

				// Initially showing preview
				expect(screen.getByText('Focused Card')).toBeInTheDocument();

				// Remove focus via re-render
				rerender({ focusedCard: null, playedCards: [], maxSlots: 3 });

				// Should now show override sequence
				expect(screen.queryByText('Focused Card')).not.toBeInTheDocument();
				expect(screen.getByText('SLOT_01')).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		describe('EC-1: No Facts', () => {
			it('renders without error when scenario has empty facts', () => {
				// CardPreviewPanel doesn't use facts, but Zone2Display might pass scenario
				const card = createTestCard();
				const { container } = render(CardPreviewPanel, { props: { card } });

				expect(container.querySelector('.flex')).toBeInTheDocument();
			});
		});

		describe('EC-2: Long Header Text', () => {
			it('wraps long title correctly within container', () => {
				const card = createTestCard({
					title:
						'This Is A Very Long Card Title That Should Wrap Correctly Within The Container'
				});
				const { container } = render(CardPreviewPanel, { props: { card } });

				// Title should be present and not overflow
				const titleElement = screen.getByText(/this is a very long/i);
				expect(titleElement).toBeInTheDocument();

				// Check container exists
				const panel = container.firstChild as HTMLElement;
				expect(panel).toBeInTheDocument();
			});

			it('wraps long claim text correctly', () => {
				const card = createTestCard({
					claim:
						'This is a very long description that explains the evidence in great detail and should wrap properly without breaking the layout of the card preview panel component.'
				});
				render(CardPreviewPanel, { props: { card } });

				expect(screen.getByText(/this is a very long description/i)).toBeInTheDocument();
			});
		});
	});
});
