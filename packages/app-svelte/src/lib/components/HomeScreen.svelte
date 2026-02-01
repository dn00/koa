<script lang="ts">
	/**
	 * Task 003: Home Screen Component
	 *
	 * Entry point for the V5 game. Displays puzzle selection, mode toggle,
	 * and tutorial overlay for first-time users.
	 */

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { V5Puzzle } from '@hsh/engine-core';
	import { startGame } from '$lib/stores/game';

	interface Props {
		/** Available puzzles to select from */
		puzzles: V5Puzzle[];
	}

	let { puzzles }: Props = $props();

	// Local state
	let selectedPuzzleSlug = $state<string | null>(null);
	let showTutorial = $state(false);
	let showHowToPlay = $state(false);

	// Check for first-time user on mount
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			const tutorialComplete = localStorage.getItem('KOA-tutorial-complete');
			showTutorial = !tutorialComplete;
		}
	});

	// Derived state
	let selectedPuzzle = $derived(puzzles.find((p) => p.slug === selectedPuzzleSlug) || null);
	let hasPuzzles = $derived(puzzles.length > 0);
	let canStart = $derived(selectedPuzzle !== null);

	function selectPuzzle(slug: string) {
		if (selectedPuzzleSlug === slug) {
			selectedPuzzleSlug = null;
		} else {
			selectedPuzzleSlug = slug;
		}
	}

	function handleStartGame() {
		if (!selectedPuzzle) return;

		// Start the game with selected puzzle
		startGame(selectedPuzzle, Date.now());

		// Navigate to run screen
		goto(`${base}/run/${selectedPuzzle.slug}`);
	}

	function dismissTutorial() {
		showTutorial = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('KOA-tutorial-complete', 'true');
		}
	}

</script>

<div class="h-[100dvh] w-full bg-background flex flex-col items-center justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] relative overflow-hidden font-sans">
	<!-- Simple background -->
	<div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.03]"></div>
	</div>

	<!-- Main content -->
	<div class="w-full max-w-md z-10 flex flex-col h-full py-8">
		<!-- Header -->
		<div class="text-center mb-8 shrink-0 relative">
			<div class="inline-block border-2 border-foreground px-6 py-4 bg-surface shadow-brutal mb-4 relative hover:-translate-y-1 transition-transform duration-200">
				<h1 class="text-2xl font-bold font-mono uppercase tracking-widest text-primary leading-none">HOME SMART HOME</h1>
				<div class="absolute top-0 left-0 w-1.5 h-1.5 bg-foreground"></div>
				<div class="absolute top-0 right-0 w-1.5 h-1.5 bg-foreground"></div>
				<div class="absolute bottom-0 left-0 w-1.5 h-1.5 bg-foreground"></div>
				<div class="absolute bottom-0 right-0 w-1.5 h-1.5 bg-foreground"></div>
			</div>
			<p class="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">System Accesspoint</p>
		</div>

		<!-- Puzzle List -->
		<div
			class="space-y-3 mb-6 overflow-y-auto pr-2 flex-1 min-h-0 scrollbar-hide px-1"
			data-tutorial-highlight={showTutorial ? 'true' : undefined}
			class:tutorial-highlight={showTutorial}
		>
			{#if hasPuzzles}
				{#each puzzles as puzzle (puzzle.slug)}
					{@const difficulty = puzzle.difficulty || 'medium'}
					{@const difficultyColor = difficulty === 'easy' ? 'text-green-600 bg-green-50 border-green-300' : difficulty === 'hard' ? 'text-red-600 bg-red-50 border-red-300' : 'text-amber-600 bg-amber-50 border-amber-300'}
					<button
						class="w-full p-4 text-left border-2 rounded-[2px] transition-all group relative overflow-hidden duration-200
							{selectedPuzzleSlug === puzzle.slug
							? 'bg-surface border-primary shadow-brutal'
							: 'bg-surface border-foreground/20 hover:-translate-y-1 hover:shadow-brutal hover:border-foreground/50'}"
						data-selected={selectedPuzzleSlug === puzzle.slug ? 'true' : 'false'}
						onclick={() => selectPuzzle(puzzle.slug)}
					>
						<div class="flex justify-between items-center mb-2">
							<h3 class="font-mono font-bold uppercase tracking-wider text-sm {selectedPuzzleSlug === puzzle.slug ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'}">
								{puzzle.name}
							</h3>
							<span class="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 border rounded-[2px] {difficultyColor}">
								{difficulty}
							</span>
						</div>
						<p class="text-xs leading-relaxed text-muted-foreground">
							{puzzle.scenario}
						</p>
						{#if selectedPuzzleSlug === puzzle.slug}
							<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
						{/if}
					</button>
				{/each}
			{:else}
				<div class="p-8 text-center text-muted-foreground border-2 border-dashed border-foreground/30 rounded-[2px] font-mono text-sm uppercase">
					No simulation data found
				</div>
			{/if}
		</div>

		<!-- Bottom Actions Container -->
		<div class="shrink-0 space-y-3">
			<!-- Start Button -->
			<button
				class="w-full py-4 text-lg font-mono font-bold uppercase rounded-[2px] transition-all border-2 relative overflow-hidden
					{canStart
					? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-1 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none'
					: 'bg-muted/20 text-muted-foreground border-foreground/10 cursor-not-allowed opacity-70'}"
				disabled={!canStart}
				onclick={handleStartGame}
			>
				<span class="relative z-10 flex items-center justify-center gap-2">
					{#if canStart}
						<span class="animate-pulse">▶</span>
					{/if}
					{canStart ? 'LOAD SCENARIO' : 'Select a Scenario'}
				</span>
			</button>

			<!-- How to Play Button -->
			<button
				class="w-full py-2.5 text-xs font-mono font-bold uppercase rounded-[2px] transition-all border border-foreground/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
				onclick={() => showHowToPlay = true}
			>
				How to Play
			</button>
		</div>
	</div>

	<!-- Tutorial Overlay -->
	{#if showTutorial}
		<div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
			<div class="bg-surface border-2 border-foreground rounded-[2px] shadow-brutal p-8 max-w-sm w-full relative">
				<!-- Corner decorations -->
				<div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1"></div>
				<div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1"></div>

				<h2 class="text-xl font-bold font-mono uppercase tracking-wider mb-4 text-primary">Access Denied</h2>
				<p class="text-sm font-mono text-foreground/80 mb-6 leading-relaxed">
					Your smart home assistant has locked you out. Select <span class="text-primary font-bold">evidence cards</span> to justify your logic and force a system override.
				</p>
				<button
					class="w-full py-3 bg-foreground text-surface font-mono font-bold uppercase rounded-[2px] border-2 border-foreground hover:bg-foreground/90 transition-colors shadow-brutal"
					onclick={dismissTutorial}
				>
					Acknowledge
				</button>
			</div>
		</div>
	{/if}

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
