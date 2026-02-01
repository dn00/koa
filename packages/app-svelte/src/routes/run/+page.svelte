<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	// Redirect to home - /run without slug is invalid
	onMount(() => {
		goto(`${base}/`);
	});
</script>

<p>Redirecting...</p>
