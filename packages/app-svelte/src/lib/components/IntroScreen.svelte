<script lang="ts">
	/**
	 * Task 021: Game Intro Screen Component
	 *
	 * Intro screen shown before card selection that displays:
	 * - Day number and puzzle name
	 * - KOA avatar in NEUTRAL mood
	 * - Opening line from puzzle
	 * - Known Facts as bullet list
	 * - Brief instructions
	 * - START button
	 */

	import type { V5Puzzle } from '@hsh/engine-core';
	import KoaAvatar from './KoaAvatar.svelte';

	interface Props {
		/** The puzzle being played */
		puzzle: V5Puzzle;
		/** Day number (e.g., 37) */
		dayNumber: number;
		/** Callback when START button is clicked */
		onStart: () => void;
		/** Callback when back button is clicked */
		onBack?: () => void;
	}

	let { puzzle, dayNumber, onStart, onBack }: Props = $props();

	let showHowToPlay = $state(false);
</script>

<div class="h-[100dvh] w-full bg-background flex flex-col items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] relative overflow-hidden font-sans">
	<!-- Background pattern -->
	<div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
		<div class="absolute inset-0 bg-dot-pattern opacity-30"></div>
		<div class="absolute inset-0 scanlines"></div>
		<div class="absolute inset-0 crt-vignette"></div>
		<div class="absolute inset-0 noise-overlay"></div>
	</div>

	<!-- Main Container -->
	<div
		class="w-full max-w-2xl bg-surface border-2 border-foreground shadow-brutal rounded-[2px] overflow-hidden shrink-0 z-10 flex flex-col max-h-full"
	>
		<!-- Header -->
		<div class="bg-primary border-b-2 border-foreground px-4 py-3 md:px-6 md:py-4 shrink-0 relative">
			{#if onBack}
				<button
					onclick={onBack}
					class="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-background/80 hover:text-background transition-colors"
					aria-label="Back"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>
			{/if}
			<div class="type-heading-md md:type-heading-lg text-background font-mono uppercase {onBack ? 'pl-8' : ''}">KOA MINI</div>
			<div class="type-heading-sm md:type-heading-md text-background/90 font-mono uppercase {onBack ? 'pl-8' : ''}">
				Day {dayNumber}: {puzzle.name}
			</div>
		</div>

		<!-- Content -->
		<div class="p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto">
			<!-- KOA Avatar Section -->
			<div class="flex items-center justify-center py-2 md:py-4 shrink-0">
				<div class="w-32 h-16 md:w-48 md:h-24">
					<KoaAvatar mood="NEUTRAL" isSpeaking={false} />
				</div>
			</div>

			<!-- Scenario (neutral narration) -->
			<div
				class="bg-muted/10 border-2 border-foreground shadow-brutal rounded-[2px] p-3 md:p-4 text-center shrink-0"
			>
				<p class="type-body-sm md:type-body text-foreground leading-relaxed font-mono">
					{puzzle.scenario}
				</p>
			</div>

			<!-- Known Facts -->
			<div class="border-2 border-foreground shadow-brutal rounded-[2px] p-3 md:p-4 bg-white shrink-0">
				<div class="flex items-center gap-2 mb-2 md:mb-3 border-b-2 border-foreground pb-2">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="md:w-4 md:h-4 text-primary"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
					</svg>
					<h2 class="type-heading-sm text-primary tracking-wider text-xs md:text-sm font-mono uppercase">
						KNOWN FACTS
					</h2>
				</div>
				<ul class="space-y-1.5 md:space-y-2">
					{#each puzzle.knownFacts as fact}
						<li class="flex items-start gap-2 text-foreground">
							<span class="text-primary font-bold shrink-0">•</span>
							<span class="type-body-sm md:type-body font-mono">{fact}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Buttons -->
			<div class="flex flex-col gap-3 mt-auto shrink-0 pb-safe-bottom">
				<!-- START Button -->
				<button
					onclick={onStart}
					class="w-full py-3 bg-primary text-background text-sm shadow-brutal rounded-[2px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-mono font-bold uppercase"
				>
					I Have Receipts
				</button>

				<!-- How to Play Button -->
				<button
					onclick={() => showHowToPlay = true}
					class="w-full py-2 text-xs font-mono font-bold uppercase rounded-[2px] transition-all border border-foreground/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
				>
					How to Play
				</button>
			</div>
		</div>
	</div>

	<!-- How to Play Modal -->
	{#if showHowToPlay}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
			<div class="bg-surface border-2 border-foreground rounded-[2px] shadow-brutal p-6 max-w-md w-full relative max-h-[85vh] overflow-y-auto">
				<!-- Corner decorations -->
				<div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1"></div>
				<div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1"></div>

				<h2 class="text-xl font-bold font-mono uppercase tracking-wider mb-5 text-primary">How to Play</h2>

				<div class="space-y-4 text-sm font-mono text-foreground/90 leading-relaxed">
					<div>
						<h3 class="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-1">The Situation</h3>
						<p>Your smart home AI, <span class="text-primary font-bold">KOA</span>, has locked you out. Something suspicious happened in your home, and KOA won't restore access until you explain yourself.</p>
					</div>

					<div>
						<h3 class="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-1">Your Goal</h3>
						<p>Build a convincing case by selecting <span class="text-primary font-bold">3 evidence cards</span> over 3 turns. Each card is a piece of evidence — but not all evidence is true.</p>
					</div>

					<div>
						<h3 class="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-1">The Catch</h3>
						<p>Some cards are <span class="text-red-600 font-bold">lies</span> that contradict the known facts. KOA will audit your story at the end. If your evidence holds up, access is restored. If not...</p>
					</div>

					<div>
						<h3 class="font-bold uppercase text-xs tracking-wider text-muted-foreground mb-1">Tips</h3>
						<ul class="list-disc list-inside space-y-1 text-foreground/80">
							<li>Read the <span class="font-bold">Known Facts</span> carefully</li>
							<li>Check if claims contradict what you know</li>
							<li>Vary your evidence sources for credibility</li>
							<li>KOA gets suspicious if your story has holes</li>
						</ul>
					</div>
				</div>

				<button
					class="w-full mt-6 py-3 bg-foreground text-surface font-mono font-bold uppercase rounded-[2px] border-2 border-foreground hover:bg-foreground/90 transition-colors shadow-brutal"
					onclick={() => showHowToPlay = false}
				>
					Got It
				</button>
			</div>
		</div>
	{/if}
</div>
