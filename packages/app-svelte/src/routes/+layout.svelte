<script lang="ts">
	import '$lib/styles/tokens.css';
	import { onMount } from 'svelte';

	let { children } = $props();

	function applyInflationScale() {
		const probe = document.createElement('div');
		probe.style.cssText =
			'position:absolute;left:-9999px;top:-9999px;font-size:16px;line-height:1;white-space:nowrap;';
		probe.textContent = 'AAAAAA';
		document.body.appendChild(probe);
		const computed = parseFloat(getComputedStyle(probe).fontSize);
		document.body.removeChild(probe);
		const ratio = computed / 16;
		const scale = Math.max(0.85, Math.min(1, 1 / ratio));
		document.documentElement.style.setProperty('--ui-scale', String(scale));
	}

	onMount(() => {
		applyInflationScale();
		window.addEventListener('resize', applyInflationScale);
		return () => window.removeEventListener('resize', applyInflationScale);
	});
</script>

<div class="min-h-[100dvh] w-full bg-slate-900 flex justify-center">
	<div class="app-shell w-full max-w-[560px] min-h-[100dvh] bg-background shadow-2xl">
		{@render children()}
	</div>
</div>
