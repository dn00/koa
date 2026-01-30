<script lang="ts">
	import { goto } from '$app/navigation';
	import { RunScreen } from '$components';
	import { gameState, currentPuzzle, phase } from '$stores/game';

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
</script>

{#if $currentPuzzle}
	<RunScreen puzzle={$currentPuzzle} onBack={handleBack} />
{/if}
