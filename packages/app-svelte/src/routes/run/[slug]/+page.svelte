<script lang="ts">
	/**
	 * Task 901: Wire Complete v1 Lite Game Flow
	 *
	 * Coordinates the game flow: Intro → RunScreen (T1 → T2 → T3) → Final Audit → Result
	 * Navigation to /result is now handled by RunScreen after FinalAuditPanel completes.
	 */
	import { goto } from '$app/navigation';
	import { RunScreen, IntroScreen } from '$components';
	import { gameState, currentPuzzle, phase } from '$stores/game';

	// Intro screen state
	let showIntro = $state(true);
	let isTransitioning = $state(false);

	// Redirect to home if no game started
	$effect(() => {
		if (!$gameState || !$currentPuzzle) {
			goto('/');
		}
	});

	// Reset intro state when puzzle changes (for new game)
	$effect(() => {
		if ($currentPuzzle) {
			showIntro = true;
			isTransitioning = false;
		}
	});

	// NOTE: Navigation to /result is now handled by RunScreen after FinalAuditPanel completes
	// This ensures the Final Audit animation plays before showing results.
	// Only navigate on SHARE phase (for future share functionality)
	$effect(() => {
		if ($phase === 'SHARE') {
			goto('/result');
		}
	});

	function handleBack() {
		goto('/');
	}

	function handleStart() {
		// Start transition animation
		isTransitioning = true;
		// After fade out, switch screens
		setTimeout(() => {
			showIntro = false;
		}, 400);
	}
</script>

{#if $currentPuzzle}
	{#key $currentPuzzle.slug}
		{#if showIntro}
			<div class="h-full w-full transition-all duration-400 {isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}">
				<IntroScreen puzzle={$currentPuzzle} dayNumber={1} onStart={handleStart} />
			</div>
		{:else}
			<div class="h-full w-full animate-in fade-in zoom-in-95 duration-500">
				<RunScreen puzzle={$currentPuzzle} onBack={handleBack} />
			</div>
		{/if}
	{/key}
{/if}
