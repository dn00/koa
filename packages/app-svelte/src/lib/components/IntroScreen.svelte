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
	}

	let { puzzle, dayNumber, onStart }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center h-full w-full bg-background p-6 overflow-y-auto">
	<!-- Main Container -->
	<div
		class="w-full max-w-2xl bg-surface border-2 border-foreground shadow-brutal rounded-[2px] overflow-hidden"
	>
		<!-- Header -->
		<div class="bg-primary border-b-2 border-foreground px-6 py-4">
			<div class="text-2xl font-mono font-bold text-background">KOA MINI</div>
			<div class="text-lg font-mono font-bold text-background/90">
				Day {dayNumber}: {puzzle.name}
			</div>
		</div>

		<!-- Content -->
		<div class="p-6 space-y-6">
			<!-- KOA Avatar Section -->
			<div class="flex items-center justify-center py-4">
				<div class="w-48 h-24">
					<KoaAvatar mood="NEUTRAL" isSpeaking={false} />
				</div>
			</div>

			<!-- Scenario (neutral narration) -->
			<div
				class="bg-muted/10 border-2 border-foreground shadow-brutal rounded-[2px] p-4 text-center"
			>
				<p class="text-base font-sans text-foreground leading-relaxed">
					{puzzle.scenario}
				</p>
			</div>

			<!-- Known Facts -->
			<div class="border-2 border-foreground shadow-brutal rounded-[2px] p-4 bg-white">
				<div class="flex items-center gap-2 mb-3 border-b-2 border-foreground pb-2">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
					</svg>
					<h2 class="text-sm font-mono font-bold uppercase text-primary tracking-wider">
						KNOWN FACTS
					</h2>
				</div>
				<ul class="space-y-2">
					{#each puzzle.knownFacts as fact}
						<li class="flex items-start gap-2 text-foreground">
							<span class="text-primary font-bold shrink-0">•</span>
							<span class="font-sans">{fact}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Instructions -->
			<div class="text-center py-2">
				<p class="text-base font-sans text-muted-foreground">
					Pick 3 cards that fit the facts. Avoid the lies.
				</p>
			</div>

			<!-- START Button -->
			<div class="flex justify-center pt-2">
				<button
					onclick={onStart}
					class="px-12 py-4 bg-primary text-background font-mono font-bold text-lg uppercase border-2 border-foreground shadow-brutal rounded-[2px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
				>
					START
				</button>
			</div>
		</div>
	</div>
</div>
