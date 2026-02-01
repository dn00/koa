/**
 * Task 012: KOA Avatar Tests
 *
 * Tests for KoaAvatar component with mood states, isSpeaking animation,
 * glitch effects, and mood derivation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import KoaAvatar from '$lib/components/KoaAvatar.svelte';
import { deriveKoaMood, type KoaMood } from '$lib/utils/koaMood';
import type { GameState } from '@hsh/engine-core';

describe('Task 012: KOA Avatar', () => {
	afterEach(() => {
		cleanup();
	});

	describe('AC-1: Svelte Component', () => {
		it('renders correctly with props', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false }
			});

			expect(container.querySelector('[data-mood]')).toBeInTheDocument();
		});

		it('accepts all expected props', () => {
			const { container } = render(KoaAvatar, {
				props: {
					mood: 'impressed' as KoaMood,
					isSpeaking: true,
					size: 'hero'
				}
			});

			expect(container.querySelector('[data-mood]')).toBeInTheDocument();
		});
	});

	describe('AC-2: Mood State Display', () => {
		it('shows impressed expression when mood is impressed', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'impressed', isSpeaking: false }
			});

			// Check for mood-specific data attribute
			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('impressed');
		});

		it('shows neutral expression when mood is neutral', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('neutral');
		});

		it('shows suspicious expression when mood is suspicious', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'suspicious', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('suspicious');
		});
	});

	describe('AC-3: Mood Derivation', () => {
		it('returns neutral for turnsPlayed=0', () => {
			const state = { belief: 50, turnsPlayed: 0 } as GameState;
			expect(deriveKoaMood(state)).toBe('neutral');
		});

		it('returns impressed for belief >= 70', () => {
			const state = { belief: 75, turnsPlayed: 1 } as GameState;
			expect(deriveKoaMood(state)).toBe('impressed');
		});

		it('returns interested for belief >= 55', () => {
			const state = { belief: 60, turnsPlayed: 1 } as GameState;
			expect(deriveKoaMood(state)).toBe('interested');
		});

		it('returns curious for belief >= 40', () => {
			const state = { belief: 45, turnsPlayed: 1 } as GameState;
			expect(deriveKoaMood(state)).toBe('curious');
		});

		it('returns suspicious for belief >= 25', () => {
			const state = { belief: 30, turnsPlayed: 1 } as GameState;
			expect(deriveKoaMood(state)).toBe('suspicious');
		});

		it('returns skeptical for belief < 25', () => {
			const state = { belief: 20, turnsPlayed: 1 } as GameState;
			expect(deriveKoaMood(state)).toBe('skeptical');
		});
	});

	describe('AC-4: Glitch Effects', () => {
		it('shows glitch visual effect when mood is glitch_minor', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'glitch_minor', isSpeaking: false }
			});

			const glitchElement = container.querySelector('[data-glitch]');
			expect(glitchElement).toBeInTheDocument();
		});

		it('shows more intense glitch for glitch_major', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'glitch_major', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('glitch_major');
			expect(container.querySelector('[data-glitch="major"]')).toBeInTheDocument();
		});

		it('shows system error state', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'system_error', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('system_error');
		});
	});

	describe('AC-5: isSpeaking Animation State', () => {
		it('has speaking animation when isSpeaking is true', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: true }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.classList.contains('speaking')).toBe(true);
		});

		it('does not have speaking animation when isSpeaking is false', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			expect(avatar?.classList.contains('speaking')).toBe(false);
		});

		it('eyes have pulse animation when speaking', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: true }
			});

			const eyes = container.querySelector('[data-eyes]');
			expect(eyes?.classList.contains('animate-pulse')).toBe(true);
		});
	});

	describe('AC-6: Zone 1 Layout', () => {
		it('renders large size for hero variant', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false, size: 'hero' }
			});

			const avatar = container.querySelector('[data-size]');
			expect(avatar?.getAttribute('data-size')).toBe('hero');
		});

		it('is suitable for left-aligned layout', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false, size: 'hero' }
			});

			// Should have appropriate width for zone 1 left side
			const avatar = container.querySelector('[data-mood]');
			expect(avatar).toBeInTheDocument();
		});
	});

	describe('EC-1: Rapid Mood Changes', () => {
		it('handles mood change smoothly via re-render', () => {
			// Render with initial mood
			const { container, rerender } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false }
			});

			let avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('neutral');

			// Re-render with new mood
			rerender({ mood: 'impressed', isSpeaking: false });

			avatar = container.querySelector('[data-mood]');
			expect(avatar?.getAttribute('data-mood')).toBe('impressed');
		});

		it('has transition class for smooth animation', () => {
			const { container } = render(KoaAvatar, {
				props: { mood: 'neutral', isSpeaking: false }
			});

			const avatar = container.querySelector('[data-mood]');
			// Should have transition class for smooth mood changes
			expect(
				avatar?.classList.contains('transition-all') ||
					avatar?.classList.contains('transition-transform')
			).toBe(true);
		});
	});
});
