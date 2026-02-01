<script lang="ts">
	/**
	 * Zone 3 Audit Complete Button
	 *
	 * Replaces card grid after audit sequence completes.
	 * Large, tappable button to proceed to results.
	 */

	interface Props {
		/** Called when user taps to proceed */
		onProceed: () => void;
	}

	let { onProceed }: Props = $props();
</script>

<button
	onclick={onProceed}
	class="w-full h-full flex flex-col items-center justify-center m-2 mt-5
		bg-primary/10 border-2 border-primary rounded-[2px]
		hover:bg-primary/20 hover:-translate-y-1
		active:translate-y-0 active:bg-primary/25
		transition-all duration-200
		animate-in fade-in zoom-in-95 duration-500"
	data-audit-proceed-button
>
	<div class="text-primary">
		<svg 
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="9 18 15 12 9 6"></polyline>
		</svg>
	</div>
	<div class="text-lg font-mono font-bold uppercase tracking-widest text-primary">
		View Results
	</div>
	<div class="text-xs text-muted-foreground font-mono">Tap to continue</div>
</button>
