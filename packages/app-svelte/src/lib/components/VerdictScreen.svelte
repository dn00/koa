<script lang="ts">
	/**
	 * Task 007: Verdict + Share Screen Component
	 * Task 017: Lies Revealed Bark on Verdict Screen
	 * Task 023: Verdict Transition Animation
	 *
	 * Shows tier badge, played cards with lie reveal, contradictions,
	 * KOA avatar with mood, and ShareCard artifact generation.
	 */

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { VerdictData, Tier } from '@hsh/engine-core';
	import { mode } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';
	import { animateVerdictReveal } from '$lib/animations/gsap';
	import KoaAvatar from './KoaAvatar.svelte';
	import type { KoaMood } from './KoaAvatar.svelte';

	interface Props {
		/** Verdict data from engine */
		verdict: VerdictData;
		/** Day number for share card */
		dayNumber: number;
	}

	let { verdict, dayNumber }: Props = $props();

	// Share card visibility state
	let showShareCard = $state(false);
	let shareFeedback = $state('');

	// Task 023: Reference to tier badge for animation
	let tierBadgeRef: HTMLElement | null = null;

	// Task 023: Animate verdict reveal on mount
	onMount(() => {
		if (tierBadgeRef) {
			animateVerdictReveal(tierBadgeRef);
		}
	});

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

	/**
	 * Get KOA's mood based on lies played and tier.
	 * SMUG when lies are caught, IMPRESSED for flawless, GRUDGING for cleared.
	 */
	function getVerdictMood(liesCount: number, tier: Tier): KoaMood {
		if (liesCount > 0) return 'SMUG'; // Caught them lying
		if (tier === 'FLAWLESS') return 'IMPRESSED';
		if (tier === 'CLEARED') return 'GRUDGING';
		return 'NEUTRAL';
	}

	/**
	 * Get icon for evidence type
	 */
	function getEvidenceIcon(evidenceType: string): string {
		const icons: Record<string, string> = {
			photo: '📷',
			video: '🎥',
			audio: '🎵',
			document: '📄',
			witness: '👤',
			forensic: '🔬',
			digital: '💾'
		};
		return icons[evidenceType] || '📋';
	}

	// Derived values
	let tierStyle = $derived(tierStyles[verdict.tier]);
	let hasLies = $derived(verdict.playedCards.some((pc) => pc.wasLie));
	let liesCount = $derived(verdict.playedCards.filter((pc) => pc.wasLie).length);
	let koaMood = $derived(getVerdictMood(liesCount, verdict.tier));
	let contradictions = $derived(
		verdict.playedCards.filter((pc) => pc.wasLie && pc.contradictionReason)
	);

	// Results array for share card (true = truth, false = lie)
	let results = $derived(verdict.playedCards.map((pc) => !pc.wasLie));

	// Check if penalties were triggered
	let hasPenalties = $derived(verdict.penalties.typeTaxCount > 0);

	// Penalty hint messages (vague for Mini, explicit for Advanced)
	// NOTE: Avoid courtroom vocab (defense, evidence, testimony, verdict, trial, guilty)
	// This is a smart home, not a courtroom. KOA sees "receipts", "logs", "data", "sources"
	const PENALTY_HINTS_MINI = [
		'KOA noticed you leaning on the same type of source.',
		'Your story was... somewhat one-note.',
		'Variety in your receipts could help.'
	];

	function getPenaltyHint(): string {
		const index = verdict.penalties.typeTaxCount % PENALTY_HINTS_MINI.length;
		return PENALTY_HINTS_MINI[index] ?? PENALTY_HINTS_MINI[0];
	}

	function handlePlayAgain() {
		goto('/');
	}

	async function handleShare() {
		// Format share text
		const emojiResults = results.map((isSuccess) => (isSuccess ? '✅' : '❌')).join('');
		const shareText = `KOA Mini - Day ${dayNumber}\n${emojiResults}\n${verdict.tier}\n"${verdict.koaLine}"`;

		// Copy to clipboard
		try {
			await navigator.clipboard.writeText(shareText);
			shareFeedback = 'Copied!';
			setTimeout(() => {
				shareFeedback = '';
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
			shareFeedback = 'Failed to copy';
			setTimeout(() => {
				shareFeedback = '';
			}, 2000);
		}
	}

	function closeShareCard() {
		showShareCard = false;
	}
</script>

<div
	class="min-h-full bg-background flex flex-col items-center justify-center p-4 relative overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
	data-verdict-container
>
	<!-- Background Pattern -->
	<div class="absolute inset-0 pointer-events-none z-0">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
		<div class="absolute inset-0 scanlines opacity-50"></div>
	</div>

	<div class="z-10 w-full max-w-md space-y-6">
		<!-- Tier Badge (Task 023: Animated on mount) -->
		<div class="text-center">
			<div
				bind:this={tierBadgeRef}
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

		<!-- KOA Avatar + Verdict Line -->
		<div class="flex flex-col items-center gap-4 px-4" data-koa-verdict-bark>
			<!-- KOA Avatar -->
			<div class="w-24 h-12" data-koa-avatar>
				<KoaAvatar mood={koaMood} width="100%" height="100%" />
			</div>
			<!-- Verdict Bark -->
			<p class="text-lg italic text-foreground/90 leading-relaxed text-center">
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
							<span class="text-2xl mb-1">
								{getEvidenceIcon(playedCard.card.evidenceType)}
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

		<!-- Penalty Hints (only if penalties were triggered) -->
		{#if hasPenalties}
			<div
				class="bg-amber-50 border-2 border-amber-200 rounded-[2px] p-4"
				data-penalty-hints
			>
				{#if $mode === 'advanced'}
					<!-- Advanced mode: explicit breakdown -->
					<h3 class="text-sm font-mono font-bold uppercase text-amber-700 mb-3 tracking-wider flex items-center gap-2">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
							<line x1="12" y1="9" x2="12" y2="13"></line>
							<line x1="12" y1="17" x2="12.01" y2="17"></line>
						</svg>
						Penalties Applied
					</h3>
					<ul class="space-y-2 text-sm text-amber-800">
						{#each verdict.penalties.typeTaxTurns as turn}
							<li class="flex items-center gap-2">
								<span class="font-mono">Turn {turn}:</span>
								<span>Same evidence type</span>
								<span class="font-bold">({verdict.penalties.typeTaxTotal / verdict.penalties.typeTaxCount})</span>
							</li>
						{/each}
						<li class="pt-2 border-t border-amber-200 font-bold">
							Total: {verdict.penalties.typeTaxTotal}
						</li>
					</ul>
				{:else}
					<!-- Mini mode: vague hint -->
					<p class="text-sm text-amber-700 italic flex items-center gap-2">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
							<line x1="12" y1="17" x2="12.01" y2="17"></line>
						</svg>
						{getPenaltyHint()}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="space-y-3">
			<button
				onclick={handleShare}
				class="w-full py-3 bg-primary text-white font-mono font-bold uppercase rounded-[2px] border-2 border-primary shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
				aria-label="Share"
			>
				{#if shareFeedback}
					<span>{shareFeedback}</span>
				{:else}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
					</svg>
					SHARE
				{/if}
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

