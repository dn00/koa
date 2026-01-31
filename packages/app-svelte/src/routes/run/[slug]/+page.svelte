<script lang="ts">
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

	// Navigate to result when game ends
	$effect(() => {
		if ($phase === 'VERDICT' || $phase === 'SHARE') {
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
