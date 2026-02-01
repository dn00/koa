<script lang="ts">
	/**
	 * Task 014: Zone2Display Component
	 *
	 * Container that swaps between OverrideSequence and CardPreviewPanel
	 * based on whether a card is focused.
	 */

	import type { UICard } from '$lib/stores/game';
	import OverrideSequence from './OverrideSequence.svelte';
	import CardPreviewPanel from './CardPreviewPanel.svelte';

	interface Props {
		/** Currently focused card (from hover/focus), or null */
		focusedCard: UICard | null;
		/** Array of played cards (0-3) */
		playedCards: UICard[];
		/** Maximum number of slots */
		maxSlots?: number;
		/** Card currently being transmitted (shows with reveal animation) */
		pendingCard?: UICard | null;
		/** Reveal progress for pending card (0-1) */
		revealProgress?: number;
		/** Callback when a played card is clicked */
		onCardClick?: (card: UICard) => void;
	}

	let { focusedCard, playedCards, maxSlots = 3, pendingCard = null, revealProgress = 0, onCardClick }: Props = $props();
</script>

<div class="h-24 relative" data-zone2-content>
	{#if focusedCard}
		<!-- Card Preview Mode -->
		<!-- Stop propagation so clicking the preview itself doesn't dismiss it -->
		<div
			class="absolute inset-0"
			role="button"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<div class="absolute -top-6 right-1 text-[8px] font-mono uppercase tracking-widest text-muted-foreground bg-white/90 border border-foreground/20 px-1.5 py-0.5 rounded-[2px] shadow-sm">
				Tap to close
			</div>
			<CardPreviewPanel card={focusedCard} />
		</div>
	{:else}
		<!-- Override Sequence Mode -->
		<div class="absolute inset-0">
			<OverrideSequence {playedCards} {maxSlots} {pendingCard} {revealProgress} {onCardClick} />
		</div>
	{/if}
</div>
