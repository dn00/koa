<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to home - /run without slug is invalid
	onMount(() => {
		goto('/');
	});
</script>

<p>Redirecting...</p>
