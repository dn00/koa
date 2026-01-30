<script lang="ts">
	import { HomeScreen } from '$components';
	import { loadPack, BUILTIN_PACK_ID } from '$lib/services/packLoader';
	import type { V5Puzzle } from '@hsh/engine-core';

	let puzzles = $state<V5Puzzle[]>([]);

	// Load puzzles on mount
	$effect(() => {
		loadPack(BUILTIN_PACK_ID).then((loaded) => {
			puzzles = loaded;
		});
	});
</script>

<HomeScreen {puzzles} />
