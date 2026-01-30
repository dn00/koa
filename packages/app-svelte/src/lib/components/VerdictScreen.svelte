<script lang="ts">
	/**
	 * Task 007: Verdict + Share Screen Component
	 *
	 * Shows tier badge, played cards with lie reveal, contradictions,
	 * and ShareCard artifact generation.
	 */

	import { goto } from '$app/navigation';
	import type { VerdictData, Tier } from '@hsh/engine-core';
	import { mode } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';

	interface Props {
		/** Verdict data from engine */
		verdict: VerdictData;
		/** Day number for share card */
		dayNumber: number;
	}

	let { verdict, dayNumber }: Props = $props();

	// Share card visibility state
	let showShareCard = $state(false);

	// Tier styling configuration
	const tierStyles: Record<Tier, { color: string; bgColor: string; icon: string }> = {
		FLAWLESS: {
			color: 'text-green-500',
			bgColor: 'bg-green-50 border-green-200',
			icon: '★'
		},
		CLEARED: {
			color: 'text-blue-500',
			bgColor: 'bg-blue-50 border-blue-200',
			icon: '✓'
		},
		CLOSE: {
			color: 'text-yellow-500',
			bgColor: 'bg-yellow-50 border-yellow-200',
			icon: '~'
		},
		BUSTED: {
			color: 'text-red-500',
			bgColor: 'bg-red-50 border-red-200',
			icon: '✗'
		}
	};

	// Derived values
	let tierStyle = $derived(tierStyles[verdict.tier]);
	let hasLies = $derived(verdict.playedCards.some((pc) => pc.wasLie));
	let contradictions = $derived(
		verdict.playedCards.filter((pc) => pc.wasLie && pc.contradictionReason)
	);

	// Results array for share card (true = truth, false = lie)
	let results = $derived(verdict.playedCards.map((pc) => !pc.wasLie));

	function handlePlayAgain() {
		goto('/');
	}

	function handleShare() {
		showShareCard = true;
	}

	function closeShareCard() {
		showShareCard = false;
	}
</script>

<div
	class="min-h-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden"
>
	<!-- Background Pattern -->
	<div class="absolute inset-0 pointer-events-none z-0">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
		<div class="absolute inset-0 scanlines opacity-50"></div>
	</div>

	<div class="z-10 w-full max-w-md space-y-6">
		<!-- Tier Badge -->
		<div class="text-center">
			<div
				class="inline-flex flex-col items-center gap-2 p-6 border-2 rounded-[2px] shadow-brutal {tierStyle.bgColor}"
				data-tier={verdict.tier}
			>
				<span class="text-4xl">{tierStyle.icon}</span>
				<span class="text-3xl font-mono font-bold uppercase tracking-wider {tierStyle.color}">
					{verdict.tier}
				</span>
			</div>
		</div>

		<!-- Belief Summary (Advanced Mode Only) -->
		{#if $mode === 'advanced'}
			<div
				class="text-center text-sm font-mono text-muted-foreground"
				data-belief-display
			>
				<span>Belief: {verdict.beliefFinal}</span>
				<span class="mx-2">|</span>
				<span>Target: {verdict.beliefTarget}</span>
			</div>
		{/if}

		<!-- KOA Verdict Line -->
		<div class="text-center px-4">
			<p class="text-lg italic text-foreground/90 leading-relaxed">
				"{verdict.koaLine}"
			</p>
		</div>

		<!-- Played Cards Summary -->
		<div class="bg-surface border-2 border-foreground rounded-[2px] p-4 shadow-sm">
			<h3 class="text-sm font-mono font-bold uppercase text-foreground/60 mb-4 tracking-wider">
				Cards Played
			</h3>
			<div class="flex justify-center gap-4">
				{#each verdict.playedCards as playedCard}
					<div
						class="flex flex-col items-center gap-2"
						data-played-card
						data-card-truth={!playedCard.wasLie}
					>
						<!-- Card Mini Display -->
						<div
							class="w-20 h-24 border-2 rounded-[2px] flex flex-col items-center justify-center p-2
								{playedCard.wasLie ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}"
						>
							<span class="text-xl mb-1">
								{playedCard.card.id.slice(0, 2).toUpperCase()}
							</span>
							<span
								class="text-xs font-mono uppercase px-1.5 py-0.5 rounded-[1px] {getEvidenceTypeColor(playedCard.card.evidenceType)}"
							>
								{getEvidenceTypeLabel(playedCard.card.evidenceType)}
							</span>
						</div>

						<!-- Truth/Lie Indicator -->
						{#if playedCard.wasLie}
							<div
								class="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-base font-bold"
								data-lie-indicator
							>
								✗
							</div>
						{:else}
							<div
								class="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-base font-bold"
								data-truth-indicator
							>
								✓
							</div>
						{/if}

						<!-- Label -->
						<span class="text-sm font-mono font-bold uppercase {playedCard.wasLie ? 'text-red-600' : 'text-green-600'}">
							{playedCard.wasLie ? 'LIE' : 'TRUTH'}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Contradiction Block (only if lies were played) -->
		{#if hasLies && contradictions.length > 0}
			<div
				class="bg-red-50 border-2 border-red-200 rounded-[2px] p-4"
				data-contradiction-block
			>
				<h3 class="text-sm font-mono font-bold uppercase text-red-600 mb-3 tracking-wider flex items-center gap-2">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					Contradictions Detected
				</h3>
				<ul class="space-y-3">
					{#each contradictions as { card, contradictionReason }}
						<li class="text-base text-red-700">
							<span class="font-bold">{card.id}:</span>
							{contradictionReason}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="space-y-3">
			<button
				onclick={handleShare}
				class="w-full py-3 bg-primary text-white font-mono font-bold uppercase rounded-[2px] border-2 border-primary shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
				aria-label="Share"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="18" cy="5" r="3"></circle>
					<circle cx="6" cy="12" r="3"></circle>
					<circle cx="18" cy="19" r="3"></circle>
					<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
					<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
				</svg>
				SHARE
			</button>

			<button
				onclick={handlePlayAgain}
				class="w-full py-3 bg-surface border-2 border-foreground font-mono font-bold uppercase rounded-[2px] shadow-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all"
				aria-label="Play Again"
			>
				BACK TO START
			</button>
		</div>
	</div>

	<!-- Share Card Modal -->
	{#if showShareCard}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div
				class="bg-surface border-2 border-foreground rounded-[2px] shadow-brutal p-6 max-w-sm w-full animate-in"
				data-share-card
			>
				<div class="text-center space-y-4">
					<!-- Header -->
					<h2 class="text-lg font-mono font-bold uppercase">KOA Mini - Day {dayNumber}</h2>

					<!-- Results Icons -->
					<div class="flex justify-center gap-2 text-xl">
						{#each results as isSuccess}
							<span>{isSuccess ? '✅' : '❌'}</span>
						{/each}
					</div>

					<!-- Tier -->
					<div class="font-mono font-bold uppercase {tierStyle.color}">
						{verdict.tier}
					</div>

					<!-- Quote -->
					<p class="text-sm italic text-muted-foreground">
						"{verdict.koaLine}"
					</p>

					<!-- Close Button -->
					<button
						onclick={closeShareCard}
						class="w-full py-2 bg-muted/20 border border-foreground/20 rounded-[2px] text-sm font-mono uppercase hover:bg-muted/40 transition-colors"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

