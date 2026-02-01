/**
 * Task 009: GSAP Animations
 *
 * Animation utilities for the V5 Svelte frontend.
 * All timing follows D16 budgets from game-feel spec.
 */

import { gsap } from 'gsap';
import { get } from 'svelte/store';
import { mode } from '$lib/stores/game';

// ============================================================================
// Timing Constants (from D16 spec)
// ============================================================================

export const TIMING = {
	/** Button feedback */
	IMMEDIATE: 50,
	/** State updates */
	MECHANICS: 120,
	/** Small interactions */
	MICRO: { MIN: 80, MAX: 150 },
	/** Card movements */
	MESO: { MIN: 180, MAX: 280 },
	/** Celebrations */
	MACRO: { MIN: 600, MAX: 1200 },
	/** Between sequential cards */
	CARD_STAGGER: 80,
	/** Number count animations */
	COUNT_UP: 300
} as const;

// ============================================================================
// Easing Constants
// ============================================================================

export const EASE = {
	/** Snappy exit */
	SNAP: 'power2.out',
	/** Spring-like */
	SPRING: 'back.out(1.7)',
	/** Smooth both ways */
	SMOOTH: 'power2.inOut',
	/** Bouncy celebration */
	ELASTIC: 'elastic.out(1, 0.5)'
} as const;

// ============================================================================
// Reduced Motion Support
// ============================================================================

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get effective duration respecting reduced motion preference.
 * Returns 0 if user prefers reduced motion.
 */
export function getEffectiveDuration(duration: number): number {
	return prefersReducedMotion() ? 0 : duration;
}

// ============================================================================
// Animation Kill Utility
// ============================================================================

/** Track last animated element for rapid selection handling */
let lastSelectedElement: HTMLElement | null = null;

/**
 * Kill any running animations on an element.
 */
export function killAnimation(element: HTMLElement | null): void {
	if (element) {
		gsap.killTweensOf(element);
	}
}

// ============================================================================
// AC-1: Card Deal to Grid
// ============================================================================

/**
 * Animate cards dealing into the grid.
 * Cards spring in from bottom with staggered timing.
 *
 * @param cards - Array of card elements to animate
 */
export function animateCardDeal(cards: HTMLElement[]): gsap.core.Tween | null {
	if (!cards.length) return null;

	const duration = getEffectiveDuration(TIMING.MESO.MAX) / 1000;
	const stagger = getEffectiveDuration(TIMING.CARD_STAGGER) / 1000;

	return gsap.from(cards, {
		y: 50,
		opacity: 0,
		scale: 0.9,
		duration,
		stagger,
		ease: EASE.SPRING,
		clearProps: 'all'
	});
}

// ============================================================================
// AC-2: Card Select Feedback
// ============================================================================

/**
 * Animate card selection/deselection.
 *
 * @param card - Card element to animate
 * @param selected - Whether card is being selected or deselected
 * @param previousElement - Optional previous element to kill animations on
 */
export function animateCardSelect(
	card: HTMLElement,
	selected: boolean,
	previousElement?: HTMLElement | null
): gsap.core.Tween | null {
	// Kill previous animation for rapid selection
	if (previousElement) {
		killAnimation(previousElement);
	} else if (lastSelectedElement && lastSelectedElement !== card) {
		gsap.killTweensOf(lastSelectedElement);
	}

	lastSelectedElement = selected ? card : null;

	const duration = getEffectiveDuration(160) / 1000;

	return gsap.to(card, {
		scale: selected ? 1.08 : 1,
		y: selected ? -2 : 0,
		duration,
		ease: EASE.SNAP
	});
}

// ============================================================================
// AC-3: Card Play to Override Slot
// ============================================================================

/**
 * Animate card playing from grid to override slot.
 * Card stays in grid (greyed out via CSS), slot gets energizing transmit effect.
 *
 * @param card - Card element in grid (pulse effect)
 * @param slot - Override slot element (energy fill from bottom effect)
 * @param color - Hex color for the energy effect (default: blue)
 */
export function animateCardPlay(
	card: HTMLElement,
	slot: HTMLElement,
	color: string = '#3b82f6'
): { cardTween: gsap.core.Timeline; slotTween: gsap.core.Timeline } {
	const duration = getEffectiveDuration(800) / 1000;

	// Card: quick pulse before greying out (CSS handles the grey)
	const cardTween = gsap.timeline();
	cardTween
		.to(card, {
			scale: 1.05,
			duration: duration * 0.3,
			ease: 'power2.out'
		})
		.to(card, {
			scale: 1,
			duration: duration * 0.4,
			ease: 'power2.inOut'
		});

	// Convert hex to rgb for opacity handling
	const hex = color.replace('#', '');
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const rgb = `${r}, ${g}, ${b}`;

	// Create energy fill container
	const energyContainer = document.createElement('div');
	energyContainer.style.cssText = `
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 0%;
		pointer-events: none;
		z-index: 5;
		overflow: hidden;
	`;

	// Main energy fill with animated gradient
	const energyFill = document.createElement('div');
	energyFill.style.cssText = `
		position: absolute;
		inset: 0;
		background: linear-gradient(
			0deg,
			${color} 0%,
			rgba(${rgb}, 0.8) 20%,
			rgba(${rgb}, 0.4) 60%,
			rgba(${rgb}, 0.1) 100%
		);
	`;

	// Scanline overlay for tech feel
	const scanlines = document.createElement('div');
	scanlines.style.cssText = `
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 2px,
			rgba(0, 0, 0, 0.1) 2px,
			rgba(0, 0, 0, 0.1) 4px
		);
		animation: energyScan 0.1s linear infinite;
	`;

	// Bright edge at top
	const topEdge = document.createElement('div');
	topEdge.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(0deg, ${color}, #FFFFFF);
		box-shadow: 0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px rgba(${rgb}, 0.5);
	`;

	// Add CSS animation if not already present
	if (!document.getElementById('energy-animation-styles')) {
		const style = document.createElement('style');
		style.id = 'energy-animation-styles';
		style.textContent = `
			@keyframes energyScan {
				0% { transform: translateY(0); }
				100% { transform: translateY(4px); }
			}
			@keyframes energyPulse {
				0%, 100% { opacity: 0.8; }
				50% { opacity: 1; }
			}
		`;
		document.head.appendChild(style);
	}

	energyContainer.appendChild(energyFill);
	energyContainer.appendChild(scanlines);
	energyContainer.appendChild(topEdge);

	// Make slot position relative if not already
	const originalPosition = slot.style.position;
	slot.style.position = 'relative';
	slot.appendChild(energyContainer);

	// Slot: energy fill from bottom effect
	const slotTween = gsap.timeline({
		onComplete: () => {
			// Clean up energy elements
			energyContainer.remove();
			slot.style.position = originalPosition;
		}
	});

	slotTween
		// Energy fills from bottom - use full duration to sync with card reveal
		.to(energyContainer, {
			height: '100%',
			duration: duration,
			ease: 'power2.out'
		})
		// Flash bright at peak
		.to(topEdge, {
			boxShadow: `0 0 20px #FFFFFF, 0 0 40px ${color}, 0 0 60px ${color}`,
			duration: 0.15,
			ease: 'power2.in'
		}, '-=0.15')
		// Quick flash of the whole thing
		.to(energyFill, {
			opacity: 1.5,
			duration: 0.1,
		}, '-=0.1')
		// Energy dissipates
		.to(energyFill, {
			opacity: 0,
			duration: duration * 0.1,
			ease: 'power2.out'
		});

	return { cardTween, slotTween };
}

/**
 * Animate card appearing in slot after being played.
 * Call this when the card content appears in the slot.
 *
 * @param slotContent - The card content element inside the slot
 */
export function animateCardReveal(slotContent: HTMLElement): gsap.core.Tween {
	const duration = getEffectiveDuration(300) / 1000;

	return gsap.from(slotContent, {
		scale: 0.8,
		opacity: 0,
		y: 10,
		duration,
		ease: EASE.SPRING,
		clearProps: 'all'
	});
}

// ============================================================================
// AC-4: Zone 2 Content Swap
// ============================================================================

/**
 * Animate Zone 2 content swap between slots and preview.
 *
 * @param slots - Override slots container
 * @param preview - Card preview container
 * @param showPreview - Whether to show preview (true) or slots (false)
 */
export function animateZone2Swap(
	slots: HTMLElement,
	preview: HTMLElement,
	showPreview: boolean
): { slotsTween: gsap.core.Tween; previewTween: gsap.core.Tween | null } {
	const duration = getEffectiveDuration(200) / 1000;

	// Fade slots in/out
	const slotsTween = gsap.to(slots, {
		opacity: showPreview ? 0 : 1,
		duration,
		ease: EASE.SNAP
	});

	// Zoom preview in/out
	let previewTween: gsap.core.Tween | null = null;
	if (showPreview) {
		previewTween = gsap.fromTo(
			preview,
			{ scale: 0.95, opacity: 0 },
			{ scale: 1, opacity: 1, duration, ease: EASE.SNAP }
		);
	} else {
		previewTween = gsap.to(preview, {
			opacity: 0,
			scale: 0.95,
			duration,
			ease: EASE.SNAP
		});
	}

	return { slotsTween, previewTween };
}

// ============================================================================
// AC-5: Verdict Reveal
// ============================================================================

/**
 * Animate verdict reveal with tier badge zoom.
 *
 * @param badge - Tier badge element
 */
export function animateVerdictReveal(badge: HTMLElement): gsap.core.Tween {
	const duration = getEffectiveDuration(400) / 1000;

	return gsap.from(badge, {
		scale: 0.5,
		opacity: 0,
		y: 20,
		duration,
		ease: EASE.ELASTIC
	});
}

// ============================================================================
// AC-6: BeliefBar Animation (Advanced Only)
// ============================================================================

/**
 * Animate belief bar fill change.
 * Skipped in mini mode.
 *
 * @param bar - Belief bar fill element
 * @param fromValue - Previous belief value
 * @param toValue - New belief value
 */
export function animateBeliefBar(
	bar: HTMLElement,
	fromValue: number,
	toValue: number
): gsap.core.Tween | null {
	// Skip in mini mode (AC-7)
	const currentMode = get(mode);
	if (currentMode === 'mini') {
		return null;
	}

	const duration = getEffectiveDuration(220) / 1000;

	// Calculate percentage (assuming max 100)
	const toPercent = Math.min(100, Math.max(0, toValue));

	return gsap.to(bar, {
		width: `${toPercent}%`,
		duration,
		ease: 'power2.out'
	});
}

// ============================================================================
// Utility: Create Animation Context (for cleanup)
// ============================================================================

/**
 * Create a GSAP context for Svelte component lifecycle.
 * Use with onMount/onDestroy for proper cleanup.
 */
export function createAnimationContext(): {
	add: (fn: () => void) => void;
	revert: () => void;
} {
	const tweens: gsap.core.Tween[] = [];

	return {
		add: (fn: () => void) => {
			fn();
		},
		revert: () => {
			tweens.forEach((t) => t.kill());
		}
	};
}
