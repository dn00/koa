<script lang="ts">
	import { goto } from '$app/navigation';
	import { ResultScreen } from '$components';
	import { gameState, currentPuzzle } from '$stores/game';
	import { getVerdict, DEFAULT_CONFIG } from '@hsh/engine-core';
	import type { VerdictData } from '@hsh/engine-core';

	// Compute verdict from state
	let verdict = $derived<VerdictData | null>(
		$gameState && $currentPuzzle
			? getVerdict($gameState, $currentPuzzle, DEFAULT_CONFIG)
			: null
	);

	// Redirect to home if no game state
	$effect(() => {
		if (!$gameState || !$currentPuzzle) {
			goto('/');
		}
	});
</script>

{#if verdict}
	<ResultScreen {verdict} dayNumber={1} />
{/if}
