<script lang="ts">
	/**
	 * Task 014: CardPreviewPanel Component
	 *
	 * Shows card details inline in Zone 2 when a card is focused.
	 * Displays icon, type badge, location, time, title, and claim.
	 */

	import type { UICard } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';

	interface Props {
		/** The card to preview */
		card: UICard;
	}

	let { card }: Props = $props();

	// Derived display values
	let displayType = $derived(getEvidenceTypeLabel(card.evidenceType));
	let typeColor = $derived(getEvidenceTypeColor(card.evidenceType));
	let displayTime = $derived(card.time || '--:--');
	let displayLocation = $derived(card.location || 'Unknown Location');
</script>

<div class="flex gap-3 h-full animate-in">
	<!-- Icon Box -->
	<div
		class="h-full aspect-square bg-surface border-2 border-primary flex flex-col items-center justify-center shadow-sm shrink-0"
	>
		<div class="text-3xl mb-1">{card.icon}</div>
		<span class="text-xs font-mono font-bold uppercase bg-primary text-white px-1.5 py-0.5 rounded-[1px]">
			{displayType}
		</span>
	</div>

	<!-- Text Details -->
	<div
		class="flex-1 bg-surface border border-foreground/20 p-3 shadow-sm flex flex-col overflow-hidden relative"
	>
		<!-- Decorative Corner -->
		<div
			class="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1 pointer-events-none"
			data-decorative-corner
		></div>

		<!-- Header -->
		<div class="shrink-0 mb-1">
			<div class="flex justify-between items-start">
				<h3 class="text-base font-bold font-sans uppercase leading-tight truncate pr-2">
					{card.title}
				</h3>
				<span class="text-xs font-mono text-muted-foreground whitespace-nowrap">
					{displayTime}
				</span>
			</div>
			<div class="text-sm font-mono text-foreground/60 truncate">
				{displayLocation}
			</div>
		</div>

		<!-- Description (Claim) -->
		<div
			class="flex-1 overflow-y-auto scrollbar-hide border-t border-foreground/10 pt-2 min-h-0"
		>
			<p class="text-base leading-snug text-foreground/90 font-sans">
				{card.claim}
			</p>
		</div>
	</div>
</div>

