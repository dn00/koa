<script lang="ts">
	/**
	 * Task 004: OverrideSequence Component
	 *
	 * Displays 3 large card slots showing played cards.
	 * Empty slots show "+" icon and "SLOT_01/02/03".
	 * Supports pending card with reveal animation.
	 */

	import type { UICard } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';

	interface Props {
		/** Array of played cards (0-3) */
		playedCards: UICard[];
		/** Maximum number of slots (default 3) */
		maxSlots?: number;
		/** Card currently being transmitted (shows with reveal animation) */
		pendingCard?: UICard | null;
		/** Reveal progress for pending card (0-1) */
		revealProgress?: number;
		/** Callback when a played card is clicked */
		onCardClick?: (card: UICard) => void;
	}

	let { playedCards = [], maxSlots = 3, pendingCard = null, revealProgress = 0, onCardClick }: Props = $props();

	// Get the card to display in a slot (played card or pending card)
	function getSlotCard(index: number): UICard | null {
		// If this is the next empty slot and we have a pending card, show it
		if (pendingCard && index === playedCards.length) {
			return pendingCard;
		}
		return playedCards[index] ?? null;
	}

	// Check if slot is showing the pending card
	function isPendingSlot(index: number): boolean {
		return pendingCard !== null && index === playedCards.length;
	}
</script>

<div class="flex gap-3 h-full">
	{#each Array(maxSlots) as _, i}
		{@const card = getSlotCard(i)}
		{@const isPending = isPendingSlot(i)}
		{@const clipPercent = isPending ? Math.round((1 - revealProgress) * 100) : 0}
		<button
			class="flex-1 border-2 rounded-[2px] relative transition-all duration-300 flex items-center justify-center h-full p-0 overflow-hidden
				{card ? 'bg-surface border-foreground shadow-sm cursor-pointer hover:bg-white' : 'bg-transparent border-dashed border-foreground/20 cursor-default'}"
			data-slot-filled={card && !isPending ? 'true' : 'false'}
			data-slot-pending={isPending ? 'true' : 'false'}
			data-slot-index={i}
			onclick={(e) => {
				if (card && !isPending && onCardClick) {
					e.stopPropagation();
					onCardClick(card);
				}
			}}
		>
			{#if card}
				<div
					class="flex flex-col items-center justify-center w-full h-full p-1 gap-0.5 relative z-10"
					style={isPending ? `clip-path: inset(${clipPercent}% 0 0 0);` : ''}
					data-card-content
				>
					<div class="w-full flex justify-center items-center">
						<span
							class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-[1px] tracking-wider uppercase {getEvidenceTypeColor(
								card.evidenceType
							)}"
						>
							{getEvidenceTypeLabel(card.evidenceType)}
						</span>
					</div>

					<div class="flex-1 flex items-center justify-center text-xl pb-0.5">
						{card.icon}
					</div>

					<div class="text-[10px] font-bold text-center leading-none line-clamp-1 w-full px-1 mb-0.5 uppercase">
						{card.title}
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center opacity-30 gap-1">
					<span class="text-xl">+</span>
					<span class="text-[9px] font-mono font-bold">SLOT_0{i + 1}</span>
				</div>
			{/if}
		</button>
	{/each}
</div>

