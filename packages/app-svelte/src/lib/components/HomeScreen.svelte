<script lang="ts">
	/**
	 * Task 003: Home Screen Component
	 *
	 * Entry point for the V5 game. Displays puzzle selection, mode toggle,
	 * and tutorial overlay for first-time users.
	 */

	import { goto } from '$app/navigation';
	import type { V5Puzzle } from '@hsh/engine-core';
	import { mode as modeStore, startGame } from '$lib/stores/game';

	interface Props {
		/** Available puzzles to select from */
		puzzles: V5Puzzle[];
	}

	let { puzzles }: Props = $props();

	// Local state
	let selectedPuzzleSlug = $state<string | null>(null);
	let showTutorial = $state(false);

	// Check for first-time user on mount
	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			const tutorialComplete = localStorage.getItem('koa-tutorial-complete');
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
		goto(`/run/${selectedPuzzle.slug}`);
	}

	function dismissTutorial() {
		showTutorial = false;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('koa-tutorial-complete', 'true');
		}
	}

	function toggleMode() {
		modeStore.set($modeStore === 'mini' ? 'advanced' : 'mini');
	}
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
	<!-- Background pattern -->
	<div class="absolute inset-0 pointer-events-none opacity-5">
		<div
			class="absolute inset-0"
			style="background-image: radial-gradient(circle, #000 1px, transparent 1px); background-size: 20px 20px;"
		></div>
	</div>

	<!-- Main content -->
	<div class="w-full max-w-md z-10">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold font-mono uppercase tracking-wider text-foreground">KOA</h1>
			<p class="text-sm text-muted-foreground mt-2">Select Your Puzzle</p>
		</div>

		<!-- Puzzle List -->
		<div
			class="space-y-2 mb-6"
			data-tutorial-highlight={showTutorial ? 'true' : undefined}
			class:tutorial-highlight={showTutorial}
		>
			{#if hasPuzzles}
				{#each puzzles as puzzle (puzzle.slug)}
					<button
						class="w-full p-4 text-left border-2 rounded-[2px] transition-all
							{selectedPuzzleSlug === puzzle.slug
							? 'bg-white border-primary shadow-brutal'
							: 'bg-surface border-foreground/20 hover:border-foreground/50'}"
						data-selected={selectedPuzzleSlug === puzzle.slug ? 'true' : 'false'}
						onclick={() => selectPuzzle(puzzle.slug)}
					>
						<h3 class="font-bold text-foreground">{puzzle.name}</h3>
						<p class="text-sm text-muted-foreground mt-1 line-clamp-2">{puzzle.scenario}</p>
					</button>
				{/each}
			{:else}
				<div class="p-4 text-center text-muted-foreground border-2 border-dashed rounded-[2px]">
					No puzzles available
				</div>
			{/if}
		</div>

		<!-- Mode Toggle -->
		<div class="flex items-center justify-center gap-4 mb-6">
			<span class="text-sm font-mono text-foreground/60">Mode:</span>
			<button
				class="px-5 py-3 border-2 rounded-[2px] font-mono text-sm uppercase transition-all min-h-[44px]
					{$modeStore === 'mini' ? 'bg-primary text-white border-primary shadow-brutal' : 'bg-surface border-foreground/20'}"
				onclick={toggleMode}
			>
				{$modeStore === 'mini' ? 'Mini' : 'Advanced'}
			</button>
		</div>

		<!-- Start Button -->
		<button
			class="w-full py-4 text-lg font-mono font-bold uppercase rounded-[2px] transition-all
				{canStart
				? 'bg-primary text-white border-2 border-primary shadow-brutal hover:-translate-y-0.5'
				: 'bg-muted/50 text-muted-foreground border-2 border-muted cursor-not-allowed'}"
			disabled={!canStart}
			onclick={handleStartGame}
		>
			Start Game
		</button>
	</div>

	<!-- Tutorial Overlay -->
	{#if showTutorial}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div class="bg-white border-2 border-foreground rounded-[2px] shadow-brutal p-6 max-w-sm">
				<h2 class="text-xl font-bold mb-4">Welcome to KOA</h2>
				<p class="text-muted-foreground mb-6">
					Your smart home assistant has locked you out. Select evidence cards to convince KOA to
					grant you access.
				</p>
				<button
					class="w-full py-3 bg-primary text-white font-mono font-bold uppercase rounded-[2px] border-2 border-primary"
					onclick={dismissTutorial}
				>
					Got It
				</button>
			</div>
		</div>
	{/if}
</div>

