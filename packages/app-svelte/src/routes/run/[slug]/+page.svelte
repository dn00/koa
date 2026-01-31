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

	// Redirect to home if no game started
	$effect(() => {
		if (!$gameState || !$currentPuzzle) {
			goto('/');
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
		showIntro = false;
	}
</script>

{#if $currentPuzzle}
	{#if showIntro}
		<IntroScreen puzzle={$currentPuzzle} dayNumber={1} onStart={handleStart} />
	{:else}
		<RunScreen puzzle={$currentPuzzle} onBack={handleBack} />
	{/if}
{/if}
