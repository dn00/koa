<script lang="ts">
	/**
	 * Result Screen
	 * Shows game outcome with overlapping avatar, tier badge, and card summary.
	 * Follows the game's brutalist design language.
	 */

	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { VerdictData, Tier } from '@hsh/engine-core';
	import { getCeilingExplanation, coverageLines, independenceLines, getConcernLine } from '@hsh/engine-core';
	import { mode, outcome, ceilingBlocker, concern, currentPuzzle, axisResults } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';
	import { animateVerdictReveal } from '$lib/animations/gsap';
	import KoaAvatar from './KoaAvatar.svelte';
	import type { KoaMood } from './KoaAvatar.svelte';
	import { selectedSkin } from '$lib/stores/skin';

	interface Props {
		verdict: VerdictData;
		dayNumber: number;
	}

	let { verdict, dayNumber }: Props = $props();

	let ceilingExplanation = $derived.by(() => {
		const currentOutcome = $mode === 'mini' && $outcome ? $outcome : verdict.tier;
		const blocker = $ceilingBlocker;
		if (currentOutcome === 'CLEARED' && blocker) {
			return getCeilingExplanation(blocker, $concern?.key ?? undefined);
		}
		return null;
	});

	let shareFeedback = $state('');
	let expandedSection = $state<'cards' | 'lies' | 'story' | 'audit' | null>('cards');

	function toggleSection(section: 'cards' | 'lies' | 'story' | 'audit') {
		expandedSection = expandedSection === section ? null : section;
	}

	// Audit results for display
	let auditLines = $derived.by(() => {
		if (!$axisResults) return null;
		const coverageLine = $axisResults.coverage.status === 'complete'
			? coverageLines.complete
			: coverageLines.gap;
		const independenceLine = $axisResults.independence === 'diverse'
			? independenceLines.diverse
			: independenceLines.correlated;
		const concernLine = getConcernLine($axisResults.concernHit, $axisResults.noConcern);
		return { coverage: coverageLine, independence: independenceLine, concern: concernLine };
	});

	let tierBadgeRef: HTMLElement | null = null;

	onMount(() => {
		if (tierBadgeRef) animateVerdictReveal(tierBadgeRef);
	});

	// Task 703: Tier styling configuration (v1 Lite outcomes)
	// FLAWLESS=Star, CLEARED=Shield, CLOSE=Warning, BUSTED=Skull/X
	const tierStyles: Record<Tier, { color: string; bgColor: string; borderColor: string; iconPath: string }> = {
		FLAWLESS: { 
			color: 'text-yellow-600', 
			bgColor: 'bg-yellow-50', 
			borderColor: 'border-yellow-500', 
			iconPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
		},
		CLEARED: { 
			color: 'text-green-600', 
			bgColor: 'bg-green-50', 
			borderColor: 'border-green-500', 
			iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4'
		},
		CLOSE: { 
			color: 'text-foreground', 
			bgColor: 'bg-muted/20', 
			borderColor: 'border-foreground/40', 
			iconPath: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01'
		},
		BUSTED: { 
			color: 'text-red-600', 
			bgColor: 'bg-red-50', 
			borderColor: 'border-red-500', 
			iconPath: 'M18 6L6 18M6 6l12 12'
		}
	};

	function getOutcomeMood(liesCount: number, tier: Tier): KoaMood {
		if (liesCount > 0) return 'SMUG';
		if (tier === 'FLAWLESS') return 'IMPRESSED';
		if (tier === 'CLEARED') return 'GRUDGING';
		return 'NEUTRAL';
	}

	let displayTier = $derived($mode === 'mini' && $outcome ? $outcome : verdict.tier);
	let tierStyle = $derived(tierStyles[displayTier]);
	let hasLies = $derived(verdict.playedCards.some((pc) => pc.wasLie));
	let liesCount = $derived(verdict.playedCards.filter((pc) => pc.wasLie).length);
	let koaMood = $derived(getOutcomeMood(liesCount, displayTier));
	let contradictions = $derived(verdict.playedCards.filter((pc) => pc.wasLie && pc.contradictionReason));
	let results = $derived(verdict.playedCards.map((pc) => !pc.wasLie));

	function handlePlayAgain() {
		goto(`${base}/`);
	}

	async function handleShare() {
		const emojiResults = results.map((r) => (r ? '✅' : '❌')).join('');
		const shareText = `KOA Mini - Day ${dayNumber}\n${emojiResults}\n${verdict.tier}\n"${verdict.koaLine}"`;
		try {
			await navigator.clipboard.writeText(shareText);
			shareFeedback = 'Copied!';
			setTimeout(() => { shareFeedback = ''; }, 2000);
		} catch {
			shareFeedback = 'Failed';
			setTimeout(() => { shareFeedback = ''; }, 2000);
		}
	}
</script>

<div class="h-[100dvh] w-full bg-background flex flex-col overflow-hidden">
	<!-- Background -->
	<div class="absolute inset-0 pointer-events-none z-0">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
	</div>

	<!-- Top Section: Result Summary (Fixed Height but flexible content) -->
	<div class="shrink-0 p-4 pb-2 z-10 relative">
		<div class="bg-surface border-2 border-foreground rounded-[2px] shadow-brutal p-6 relative overflow-visible">
			<!-- Header -->
			<div class="text-center mb-6">
				<h2 class="font-mono font-bold uppercase text-primary tracking-widest text-sm">
					FINAL AUDIT RESULT
				</h2>
			</div>

			<!-- Center Badge -->
			<div class="flex justify-center mb-2">
				<div
					bind:this={tierBadgeRef}
					class="flex flex-col items-center justify-center p-2 border-2 rounded-[2px] {tierStyle.bgColor} {tierStyle.borderColor} shadow-sm w-auto h-auto min-w-[6rem] min-h-[6rem] shrink-0 z-20 relative bg-opacity-95"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="40"
						height="40"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="{tierStyle.color} mb-2"
					>
						<path d={tierStyle.iconPath} />
					</svg>
					<span class="text-xl font-mono font-bold uppercase tracking-wider {tierStyle.color}">
						{displayTier}
					</span>
				</div>
			</div>

			<!-- Quick Bark (Centered) -->
			<!-- Removed extra bottom padding since avatar moved -->
			<p class="type-body-sm italic text-foreground/90 leading-tight text-center mt-4 mb-2 px-2 relative z-20">
				"{verdict.koaLine}"
			</p>

			<!-- Floating Avatar (Top Left - Left of Badge) -->
			<!-- User requested location left of the badge and "make it larger" -->
			<div class="absolute top-12 left-[-20px] w-[150px] h-[150px] z-30 pointer-events-none transform -rotate-6">
				<KoaAvatar mood={koaMood} skin={$selectedSkin} width="100%" height="100%" />
			</div>
		</div>
	</div>

	<!-- Middle Section: Accordion (Flex Fill) -->
	<div class="flex-1 min-h-0 flex flex-col px-4 pb-2 gap-2 z-10">
		<!-- Accordion Items Container (Fill remaining space) -->
		<div class="flex-1 flex flex-col gap-2 min-h-0">
			
			<!-- Cards Played -->
			<div class="bg-surface border-2 border-foreground rounded-[2px] flex flex-col {expandedSection === 'cards' ? 'flex-1 min-h-0' : 'shrink-0'} transition-all duration-300">
				<button
					class="w-full px-4 py-3 flex items-center justify-between text-left bg-muted/5 hover:bg-muted/10 transition-colors shrink-0"
					onclick={() => toggleSection('cards')}
				>
					<span class="type-body-xs font-mono font-bold uppercase text-foreground/60 tracking-wider">
						Cards Played
					</span>
					<span class="text-foreground/40 text-xs transition-transform duration-200 {expandedSection === 'cards' ? 'rotate-180' : ''}">▼</span>
				</button>
				{#if expandedSection === 'cards'}
					<div class="flex-1 overflow-y-auto p-4 scrollbar-hide border-t border-foreground/10">
						<div class="flex flex-wrap justify-center gap-4">
							{#each verdict.playedCards as playedCard, i}
								<div class="flex flex-col items-center gap-2">
									<!-- Larger Cards: w-20 h-22 (reduced from h-28) -->
									<div
										class="w-20 h-22 border-2 rounded-[2px] flex flex-col items-center justify-center p-2 text-center
											{playedCard.wasLie ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'}"
									>
										<span class="text-3xl mb-1">
											{playedCard.card.evidenceType === 'DIGITAL' ? '💾' :
											 playedCard.card.evidenceType === 'SENSOR' ? '📡' :
											 playedCard.card.evidenceType === 'TESTIMONY' ? '👤' : '🔍'}
										</span>
										<span
											class="text-[9px] font-mono uppercase font-bold px-1 rounded-[1px] leading-tight break-all {getEvidenceTypeColor(playedCard.card.evidenceType)}"
										>
											{getEvidenceTypeLabel(playedCard.card.evidenceType)}
										</span>
									</div>
									<span class="text-[10px] font-mono font-bold uppercase {playedCard.wasLie ? 'text-red-600' : 'text-green-600'}">
										{playedCard.wasLie ? 'LIE' : 'TRUTH'}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Audit Results -->
			{#if auditLines}
				<div class="bg-slate-50 border-2 border-slate-300 rounded-[2px] flex flex-col {expandedSection === 'audit' ? 'flex-1 min-h-0' : 'shrink-0'} transition-all duration-300">
					<button
						class="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-100/50 hover:bg-slate-100 transition-colors shrink-0"
						onclick={() => toggleSection('audit')}
					>
						<span class="type-body-xs font-mono font-bold uppercase text-slate-600 tracking-wider">
							Audit Results
						</span>
						<span class="text-slate-400 text-xs transition-transform duration-200 {expandedSection === 'audit' ? 'rotate-180' : ''}">▼</span>
					</button>
					{#if expandedSection === 'audit'}
						<div class="flex-1 overflow-y-auto p-4 scrollbar-hide border-t border-slate-200 space-y-3">
							<div class="flex items-start gap-2">
								<span class="text-lg">{auditLines.coverage.includes('✅') ? '✅' : '⚠️'}</span>
								<div>
									<div class="text-sm font-mono font-bold {auditLines.coverage.includes('✅') ? 'text-green-600' : 'text-amber-600'}">
										{auditLines.coverage}
									</div>
									<p class="text-xs text-slate-600 mt-1">
										{auditLines.coverage.includes('✅')
											? 'Your evidence addressed all the known facts in the case.'
											: 'Some facts were not directly supported by your evidence.'}
									</p>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<span class="text-lg">{auditLines.independence.includes('✅') ? '✅' : '⚠️'}</span>
								<div>
									<div class="text-sm font-mono font-bold {auditLines.independence.includes('✅') ? 'text-green-600' : 'text-amber-600'}">
										{auditLines.independence}
									</div>
									<p class="text-xs text-slate-600 mt-1">
										{auditLines.independence.includes('✅')
											? 'Your sources came from different systems, making your story more credible.'
											: 'Multiple pieces of evidence came from the same source, weakening credibility.'}
									</p>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<span class="text-lg">{auditLines.concern.includes('✅') ? '✅' : '⚠️'}</span>
								<div>
									<div class="text-sm font-mono font-bold {auditLines.concern.includes('✅') ? 'text-green-600' : 'text-amber-600'}">
										{auditLines.concern}
									</div>
									<p class="text-xs text-slate-600 mt-1">
										{auditLines.concern.includes('Balanced')
											? 'Your evidence was well-balanced from the start.'
											: auditLines.concern.includes('✅')
												? 'You adjusted your approach after KOA flagged a pattern.'
												: 'You continued the same pattern even after KOA warned you.'}
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Lies (Conditional) -->
			{#if hasLies && contradictions.length > 0}
				<div class="bg-red-50 border-2 border-red-400 rounded-[2px] flex flex-col {expandedSection === 'lies' ? 'flex-1 min-h-0' : 'shrink-0'} transition-all duration-300">
					<button
						class="w-full px-4 py-3 flex items-center justify-between text-left bg-red-100/50 hover:bg-red-100 transition-colors shrink-0"
						onclick={() => toggleSection('lies')}
					>
						<span class="type-body-xs font-mono font-bold uppercase text-red-600 tracking-wider flex items-center gap-2">
							Lies Exposed ({contradictions.length})
						</span>
						<span class="text-red-400 text-xs transition-transform duration-200 {expandedSection === 'lies' ? 'rotate-180' : ''}">▼</span>
					</button>
					{#if expandedSection === 'lies'}
						<div class="flex-1 overflow-y-auto p-4 scrollbar-hide border-t border-red-200">
							<ul class="space-y-3">
								{#each contradictions as { card, contradictionReason }}
									<li class="text-xs text-red-700 leading-snug">
										<span class="font-bold border-b border-red-300 mr-1">{card.id}</span>
										{contradictionReason}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Epilogue (Conditional) -->
			{#if $currentPuzzle?.epilogue}
				<div class="bg-slate-50 border-2 border-slate-300 rounded-[2px] flex flex-col {expandedSection === 'story' ? 'flex-1 min-h-0' : 'shrink-0'} transition-all duration-300">
					<button
						class="w-full px-4 py-3 flex items-center justify-between text-left bg-slate-100/50 hover:bg-slate-100 transition-colors shrink-0"
						onclick={() => toggleSection('story')}
					>
						<span class="type-body-xs font-mono font-bold uppercase text-slate-600 tracking-wider">
							What Actually Happened
						</span>
						<span class="text-slate-400 text-xs transition-transform duration-200 {expandedSection === 'story' ? 'rotate-180' : ''}">▼</span>
					</button>
					{#if expandedSection === 'story'}
						<div class="flex-1 overflow-y-auto p-4 scrollbar-hide border-t border-slate-200">
							<p class="text-sm text-slate-700 leading-relaxed">
								{$currentPuzzle.epilogue}
							</p>
						</div>
					{/if}
				</div>
			{/if}
			
		</div>
	</div>

	<!-- Fixed Actions Footer -->
	<div class="p-4 bg-background border-t-2 border-foreground/10 shrink-0 z-20">
		<div class="flex gap-3 max-w-lg mx-auto">
			<button
				onclick={handlePlayAgain}
				class="flex-1 py-3 bg-surface border-2 border-foreground font-mono font-bold uppercase text-sm rounded-[2px] shadow-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all"
			>
				Play Again
			</button>
			<button
				onclick={handleShare}
				class="flex-1 py-3 bg-primary text-white font-mono font-bold uppercase text-sm rounded-[2px] border-2 border-primary shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2"
			>
				{#if shareFeedback}
					{shareFeedback}
				{:else}
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
					</svg>
					Share
				{/if}
			</button>
		</div>
	</div>
</div>
