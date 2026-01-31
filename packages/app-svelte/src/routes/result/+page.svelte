<script lang="ts">
	import { goto } from '$app/navigation';
	import { ResultScreen } from '$components';
	import { gameState, currentPuzzle, resetStores } from '$stores/game';
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

	function handlePlayAgain() {
		resetStores();
		goto('/');
	}
</script>

{#if verdict}
	<ResultScreen {verdict} dayNumber={1} />
	<div class="fixed bottom-4 left-0 right-0 flex justify-center">
		<button
			class="px-6 py-3 bg-primary text-white font-mono font-bold uppercase rounded-[2px] border-2 border-primary"
			onclick={handlePlayAgain}
		>
			Play Again
		</button>
	</div>
{/if}
