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

<div class="flex flex-col items-center justify-start md:justify-center min-h-[100dvh] w-full bg-background p-4 md:p-6 overflow-y-auto">
	<!-- Main Container -->
	<div
		class="w-full max-w-2xl bg-surface border-2 border-foreground shadow-brutal rounded-[2px] overflow-hidden shrink-0 my-auto flex flex-col"
	>
		<!-- Header -->
		<div class="bg-primary border-b-2 border-foreground px-4 py-3 md:px-6 md:py-4 shrink-0">
			<div class="type-heading-md md:type-heading-lg text-background">KOA MINI</div>
			<div class="type-heading-sm md:type-heading-md text-background/90">
				Day {dayNumber}: {puzzle.name}
			</div>
		</div>

		<!-- Content -->
		<div class="p-4 md:p-6 flex flex-col gap-4 md:gap-6">
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
				<p class="type-body-sm md:type-body text-foreground leading-relaxed">
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
						class="md:w-4 md:h-4"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
					</svg>
					<h2 class="type-heading-sm text-primary tracking-wider text-xs md:text-sm">
						KNOWN FACTS
					</h2>
				</div>
				<ul class="space-y-1.5 md:space-y-2">
					{#each puzzle.knownFacts as fact}
						<li class="flex items-start gap-2 text-foreground">
							<span class="text-primary font-bold shrink-0">•</span>
							<span class="type-body-sm md:type-body">{fact}</span>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Instructions -->
			<div class="text-center py-1 md:py-2 mt-auto">
				<p class="type-body-xs md:type-body-sm text-muted-foreground">
					Pick 3 cards that fit the facts. Avoid the lies.
				</p>
			</div>

			<!-- START Button -->
			<div class="flex justify-center pt-2 shrink-0 pb-safe-bottom">
				<button
					onclick={onStart}
					class="w-full md:w-auto px-8 py-3 md:px-12 md:py-4 bg-primary text-background type-heading-sm md:type-heading-md border-2 border-foreground shadow-brutal rounded-[2px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
				>
					START
				</button>
			</div>
		</div>
	</div>
</div>
