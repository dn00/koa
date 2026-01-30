<script lang="ts">
	/**
	 * Task 004: ActionBar Component
	 *
	 * Shows "AVAILABLE VARIABLES" label and TRANSMIT button.
	 * Button disabled when no card is selected.
	 */

	interface Props {
		/** ID of selected card, or null if none selected */
		selectedCardId: string | null;
		/** Callback when TRANSMIT is clicked */
		onTransmit: () => void;
	}

	let { selectedCardId, onTransmit }: Props = $props();

	function handleClick() {
		if (selectedCardId) {
			onTransmit();
		}
	}
</script>

<div class="h-14 border-b border-foreground/10 flex items-center justify-between px-4 bg-muted/5">
	<span class="text-sm font-mono font-bold uppercase text-foreground/70 tracking-wider">
		AVAILABLE VARIABLES
	</span>

	<button
		onclick={handleClick}
		disabled={!selectedCardId}
		class="h-12 px-6 text-base font-mono font-bold uppercase rounded-[2px] border transition-all flex items-center gap-2
			{selectedCardId
			? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-0.5 active:translate-y-0'
			: 'bg-transparent text-muted-foreground border-foreground/20 cursor-not-allowed'}"
	>
		TRANSMIT
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<polyline points="9 18 15 12 9 6"></polyline>
		</svg>
	</button>
</div>

