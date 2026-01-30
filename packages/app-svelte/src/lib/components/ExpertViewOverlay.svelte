<script lang="ts">
	/**
	 * Task 004: ExpertViewOverlay Component
	 *
	 * Shows unlock probability in Expert mode.
	 * Hidden in Mini mode.
	 */

	import type { Mode } from '$lib/stores/game';

	interface Props {
		/** Current game mode */
		mode: Mode;
		/** Current belief value (0-100) */
		belief: number;
	}

	let { mode, belief }: Props = $props();

	// Unlock probability is inverse of belief (100 - belief)
	let unlockProbability = $derived(Math.max(0, Math.min(100, 100 - belief)));
</script>

{#if mode === 'advanced'}
	<div class="bg-surface/80 backdrop-blur-sm border border-foreground/10 rounded-[2px] p-4">
		<div class="flex items-center justify-between mb-3">
			<span class="text-sm font-mono font-bold uppercase text-foreground/60 tracking-wider">
				UNLOCK PROBABILITY
			</span>
			<span class="text-base font-mono font-bold text-primary">
				{unlockProbability}%
			</span>
		</div>

		<!-- Progress bar -->
		<div class="h-3 bg-muted/20 rounded-[2px] overflow-hidden">
			<div
				class="h-full transition-all duration-300 rounded-[2px]"
				style="width: {unlockProbability}%; background: linear-gradient(90deg, #ff3b30 0%, #ff9500 50%, #34c759 100%);"
				data-progress-bar
			></div>
		</div>
	</div>
{/if}
