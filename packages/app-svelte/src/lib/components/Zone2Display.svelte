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
	}

	let { focusedCard, playedCards, maxSlots = 3 }: Props = $props();
</script>

<div class="h-24 relative" data-zone2-content>
	{#if focusedCard}
		<!-- Card Preview Mode -->
		<div class="absolute inset-0">
			<CardPreviewPanel card={focusedCard} />
		</div>
	{:else}
		<!-- Override Sequence Mode -->
		<div class="absolute inset-0">
			<OverrideSequence {playedCards} {maxSlots} />
		</div>
	{/if}
</div>
