/**
 * Task 005: EvidenceCard Tests
 *
 * Tests for EvidenceCard component with icon and details variants,
 * mode-aware strength display, and selection/disabled states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import EvidenceCard from '$lib/components/EvidenceCard.svelte';
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

describe('Task 005: EvidenceCard', () => {
	afterEach(() => {
		cleanup();
	});

	describe('AC-1: Icon Variant Layout', () => {
		it('shows compact layout with type badge in header', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			// Type badge (SENSOR)
			expect(screen.getByText('SENSOR')).toBeInTheDocument();
		});

		it('shows time in header row', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			expect(screen.getByText('02:15 AM')).toBeInTheDocument();
		});

		it('shows icon in center', () => {
			const card = createTestCard({ icon: '7' });
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			expect(screen.getByText('7')).toBeInTheDocument();
		});

		it('shows title at bottom', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			expect(screen.getByText('Thermostat Log')).toBeInTheDocument();
		});

		it('has correct height class', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			// Find the card element with role button
			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('h-24');
		});
	});

	describe('AC-2: Details Variant Layout', () => {
		it('shows type badge and time in header', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'details', mode: 'mini' } });

			expect(screen.getByText('SENSOR')).toBeInTheDocument();
			expect(screen.getByText('02:15 AM')).toBeInTheDocument();
		});

		it('shows title and location', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'details', mode: 'mini' } });

			expect(screen.getByText('Thermostat Log')).toBeInTheDocument();
			expect(screen.getByText(/living room/i)).toBeInTheDocument();
		});

		it('shows description (claim) in footer', () => {
			const card = createTestCard();
			render(EvidenceCard, { props: { card, variant: 'details', mode: 'mini' } });

			expect(screen.getByText(/temperature was set to 72f/i)).toBeInTheDocument();
		});
	});

	describe('AC-3: All Fields Displayed', () => {
		it('displays all required fields in details variant', () => {
			const card = createTestCard({
				evidenceType: 'DIGITAL',
				time: '03:42 AM',
				title: 'Server Log Entry',
				location: 'Cloud Archive',
				claim: 'Connection established from approved device.'
			});

			render(EvidenceCard, { props: { card, variant: 'details', mode: 'mini' } });

			expect(screen.getByText('LOG')).toBeInTheDocument(); // DIGITAL maps to LOG
			expect(screen.getByText('03:42 AM')).toBeInTheDocument();
			expect(screen.getByText('Server Log Entry')).toBeInTheDocument();
			expect(screen.getByText(/cloud archive/i)).toBeInTheDocument();
			expect(screen.getByText(/connection established/i)).toBeInTheDocument();
		});
	});

	describe('AC-4: Strength Hidden in Mini', () => {
		it('does not show strength indicator in mini mode', () => {
			const card = createTestCard({ strength: 3 });
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			// Strength pips should not be present
			const pips = document.querySelectorAll('[data-strength-pip]');
			expect(pips.length).toBe(0);
		});
	});

	describe('AC-5: Strength Shown in Expert', () => {
		it('shows strength indicator in expert mode', () => {
			const card = createTestCard({ strength: 3 });
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'expert' } });

			// Should have 3 pips
			const pips = document.querySelectorAll('[data-strength-pip]');
			expect(pips.length).toBe(3);
		});

		it('shows correct number of filled pips for strength', () => {
			const card = createTestCard({ strength: 2 });
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'expert' } });

			const filledPips = document.querySelectorAll('[data-strength-pip="filled"]');
			const emptyPips = document.querySelectorAll('[data-strength-pip="empty"]');

			expect(filledPips.length).toBe(2);
			expect(emptyPips.length).toBe(1);
		});
	});

	describe('AC-6: Selection State', () => {
		it('shows primary color border when selected', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', isSelected: true }
			});

			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('border-primary');
		});

		it('shows elevated shadow when selected', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', isSelected: true }
			});

			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('shadow-brutal');
		});

		it('shows pulsing indicator dot when selected', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', isSelected: true }
			});

			const indicator = document.querySelector('[data-selected-indicator]');
			expect(indicator).toBeInTheDocument();
			expect(indicator?.classList.contains('animate-pulse')).toBe(true);
		});
	});

	describe('AC-7: Disabled State', () => {
		it('has opacity-50 when disabled', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', disabled: true }
			});

			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('opacity-50');
		});

		it('has grayscale when disabled', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', disabled: true }
			});

			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('grayscale');
		});

		it('has cursor-not-allowed when disabled', () => {
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', disabled: true }
			});

			const cardElement = screen.getByRole('button');
			expect(cardElement.className).toContain('cursor-not-allowed');
		});

		it('does not trigger onClick when disabled', async () => {
			const mockClick = vi.fn();
			const card = createTestCard();
			render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini', disabled: true, onClick: mockClick }
			});

			await fireEvent.click(screen.getByRole('button'));
			expect(mockClick).not.toHaveBeenCalled();
		});
	});

	describe('EC-1: Missing Optional Fields', () => {
		it('shows "--:--" for missing time', () => {
			const card = createTestCard({ time: '' });
			render(EvidenceCard, { props: { card, variant: 'icon', mode: 'mini' } });

			expect(screen.getByText('--:--')).toBeInTheDocument();
		});

		it('shows "Unknown" for missing location', () => {
			const card = createTestCard({ location: '' });
			render(EvidenceCard, { props: { card, variant: 'details', mode: 'mini' } });

			expect(screen.getByText(/unknown/i)).toBeInTheDocument();
		});
	});

	describe('EC-2: Long Title', () => {
		it('truncates long title with ellipsis', () => {
			const card = createTestCard({
				title: 'This is a very long title that should be truncated with ellipsis for proper display'
			});
			const { container } = render(EvidenceCard, {
				props: { card, variant: 'icon', mode: 'mini' }
			});

			// Check for line-clamp class
			const titleElement = container.querySelector('.line-clamp-2');
			expect(titleElement).toBeInTheDocument();
		});
	});
});
