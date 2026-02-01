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
		/** Callback when a played card is clicked */
		onCardClick?: (card: UICard) => void;
	}

	let { focusedCard, playedCards, maxSlots = 3, onCardClick }: Props = $props();
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
			<CardPreviewPanel card={focusedCard} />
		</div>
	{:else}
		<!-- Override Sequence Mode -->
		<div class="absolute inset-0">
			<OverrideSequence {playedCards} {maxSlots} {onCardClick} />
		</div>
	{/if}
</div>
