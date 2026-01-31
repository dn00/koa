<script lang="ts">
	/**
	 * Task 702: Final Audit Panel
	 *
	 * Displays after T3 submission and before Result screen.
	 * Shows three axis check lines (Coverage, Independence, Concern)
	 * with sequential animation (300ms between lines).
	 * Includes a "Processing..." beat (~0.5s) before panel.
	 */

	import { onMount } from 'svelte';
	import {
		coverageLines,
		independenceLines,
		getConcernLine
	} from '@hsh/engine-core';

	interface Props {
		/** Whether coverage is complete */
		coverageComplete: boolean;
		/** Whether independence is OK (diverse) */
		independenceOk: boolean;
		/** Whether concern was hit (doubled down) */
		concernHit: boolean;
		/** Whether there was no concern */
		noConcern: boolean;
		/** Called when all lines have been shown and panel is ready to transition */
		onComplete?: () => void;
	}

	let {
		coverageComplete,
		independenceOk,
		concernHit,
		noConcern,
		onComplete
	}: Props = $props();

	// Animation state
	let showProcessing = $state(true);
	let showPanel = $state(false);
	let line1Visible = $state(false);
	let line2Visible = $state(false);
	let line3Visible = $state(false);

	// Compute the audit lines
	let coverageLine = $derived(coverageComplete ? coverageLines.complete : coverageLines.gap);
	let independenceLine = $derived(independenceOk ? independenceLines.diverse : independenceLines.correlated);
	let concernLine = $derived(getConcernLine(concernHit, noConcern));

	// Check if line indicates a pass (has checkmark)
	function isPassLine(line: string): boolean {
		return line.includes('\u2705'); // checkmark emoji
	}

	onMount(() => {
		// Step 1: Show "Processing..." for ~500ms
		setTimeout(() => {
			showProcessing = false;
			showPanel = true;

			// Step 2: Reveal lines sequentially (300ms between each)
			setTimeout(() => {
				line1Visible = true;

				setTimeout(() => {
					line2Visible = true;

					setTimeout(() => {
						line3Visible = true;

						// Step 3: Brief pause after all lines, then signal complete
						setTimeout(() => {
							onComplete?.();
						}, 500);
					}, 300);
				}, 300);
			}, 200); // Small initial delay after panel appears
		}, 500);
	});
</script>

<div
	class="final-audit-container fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-in fade-in duration-300"
	data-final-audit
>
	{#if showProcessing}
		<!-- Processing Beat -->
		<div
			class="text-white/60 font-mono text-lg uppercase tracking-widest animate-pulse"
			data-processing
		>
			Processing...
		</div>
	{/if}

	{#if showPanel}
		<!-- Final Audit Panel -->
		<div
			class="final-audit-panel bg-black/95 border border-white/20 rounded-[2px] p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
			data-audit-panel
		>
			<!-- Header -->
			<h3
				class="text-sm font-mono font-bold uppercase tracking-[0.15em] text-white/50 mb-6 text-center"
			>
				FINAL AUDIT
			</h3>

			<!-- Audit Lines -->
			<div class="space-y-4">
				<!-- Coverage Line -->
				{#if line1Visible}
					<div
						class="audit-line text-lg font-sans animate-in fade-in slide-in-from-left-2 duration-300
							{isPassLine(coverageLine) ? 'text-green-400' : 'text-amber-400'}"
						data-audit-coverage
					>
						{coverageLine}
					</div>
				{:else}
					<div class="audit-line h-7 opacity-0"><!-- Placeholder --></div>
				{/if}

				<!-- Independence Line -->
				{#if line2Visible}
					<div
						class="audit-line text-lg font-sans animate-in fade-in slide-in-from-left-2 duration-300
							{isPassLine(independenceLine) ? 'text-green-400' : 'text-amber-400'}"
						data-audit-independence
					>
						{independenceLine}
					</div>
				{:else}
					<div class="audit-line h-7 opacity-0"><!-- Placeholder --></div>
				{/if}

				<!-- Concern Line -->
				{#if line3Visible}
					<div
						class="audit-line text-lg font-sans animate-in fade-in slide-in-from-left-2 duration-300
							{isPassLine(concernLine) ? 'text-green-400' : 'text-amber-400'}"
						data-audit-concern
					>
						{concernLine}
					</div>
				{:else}
					<div class="audit-line h-7 opacity-0"><!-- Placeholder --></div>
				{/if}
			</div>
		</div>
	{/if}
</div>
