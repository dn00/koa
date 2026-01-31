<script lang="ts">
	/**
	 * Task 004: OverrideSequence Component
	 *
	 * Displays 3 large card slots showing played cards.
	 * Empty slots show "+" icon and "SLOT_01/02/03".
	 */

	import type { UICard } from '$lib/stores/game';
	import { getEvidenceTypeLabel } from '$lib/utils/evidenceTypes';

	interface Props {
		/** Array of played cards (0-3) */
		playedCards: UICard[];
		/** Maximum number of slots (default 3) */
		maxSlots?: number;
	}

	let { playedCards = [], maxSlots = 3 }: Props = $props();
</script>

<div class="flex gap-3 h-full">
	{#each Array(maxSlots) as _, i}
		{@const card = playedCards[i]}
		<div
			class="flex-1 border-2 rounded-[2px] relative transition-all duration-300 flex items-center justify-center h-full
				{card ? 'bg-surface border-foreground shadow-sm' : 'bg-transparent border-dashed border-foreground/20'}"
			data-slot-filled={card ? 'true' : 'false'}
		>
			{#if card}
				<div
					class="flex flex-col items-center justify-center w-full h-full p-1 animate-in zoom-in-90 duration-300 gap-0.5"
				>
					<div class="w-full flex justify-center items-center">
						<span
							class="text-[9px] font-mono font-bold bg-foreground text-surface px-1.5 py-0.5 rounded-[1px] tracking-wider uppercase"
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
		</div>
	{/each}
</div>

