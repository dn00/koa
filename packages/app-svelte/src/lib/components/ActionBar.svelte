<script lang="ts">
	/**
	 * Task 004: ActionBar Component
	 *
	 * Shows "AVAILABLE VARIABLES" label and TRANSMIT button.
	 * Button disabled when no card is selected.
	 */

	import { onMount } from 'svelte';

	interface Props {
		/** ID of selected card, or null if none selected */
		selectedCardId: string | null;
		/** Current view mode (BARK vs LOGS) */
		msgMode: 'BARK' | 'LOGS';
		/** Callback when TRANSMIT is clicked */
		onTransmit: () => void;
		/** Callback when toggle is clicked */
		onToggleMode: () => void;
	}

	let { selectedCardId, msgMode, onTransmit, onToggleMode }: Props = $props();

	// Feature discovery: Glow until clicked
	let hasViewedLogs = $state(true); // Default true to avoid flash

	onMount(() => {
		const viewed = localStorage.getItem('aura_has_viewed_logs');
		if (!viewed) {
			hasViewedLogs = false;
		}
	});

	function handleToggle() {
		if (!hasViewedLogs) {
			hasViewedLogs = true;
			localStorage.setItem('aura_has_viewed_logs', 'true');
		}
		onToggleMode();
	}

	function handleClick() {
		if (selectedCardId) {
			onTransmit();
		}
	}
</script>

<div class="h-12 border-b border-foreground/10 flex items-center justify-between px-4 bg-muted/5">
	<span class="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
		AVAILABLE VARIABLES
	</span>

	<div class="flex items-center gap-2">
		<button
			onclick={handleToggle}
			class="h-8 px-3 text-xs font-mono font-bold uppercase rounded-[2px] border bg-surface text-foreground hover:bg-white hover:shadow-sm transition-all flex items-center gap-2
				{hasViewedLogs ? 'border-foreground/20' : 'border-primary shadow-[0_0_15px_rgba(224,122,95,0.6)] animate-pulse'}"
		>
			{#if msgMode === 'LOGS'}
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				VIEW SYS
			{:else}
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10 9 9 9 8 9"></polyline>
				</svg>
				VIEW LOG
			{/if}
		</button>

		<button
			onclick={handleClick}
			disabled={!selectedCardId}
			class="h-8 px-4 text-xs font-mono font-bold uppercase rounded-[2px] border transition-all flex items-center gap-2
				{selectedCardId
				? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-0.5 active:translate-y-0'
				: 'bg-transparent text-muted-foreground border-foreground/20 cursor-not-allowed'}"
		>
			TRANSMIT
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>
</div>

