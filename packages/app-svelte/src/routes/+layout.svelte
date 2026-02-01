<script lang="ts">
	import '$lib/styles/tokens.css';

	let { children } = $props();
</script>

<div class="min-h-[100dvh] w-full bg-slate-900 flex justify-center">
	<div class="app-shell w-full max-w-[560px] min-h-[100dvh] bg-background shadow-2xl">
		{@render children()}
	</div>
</div>
