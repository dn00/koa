<script lang="ts">
	/**
	 * Skin Gallery - Browse and select KOA skins
	 */

	import KoaAvatar from './KoaAvatar.svelte';
	import { KOA_SKINS, selectedSkinId, selectedSkin } from '$lib/stores/skin';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	// Preview state - show hovered skin in large preview
	let previewSkinId = $state<string | null>(null);

	let displaySkin = $derived(
		previewSkinId ? KOA_SKINS.find((s) => s.id === previewSkinId) || $selectedSkin : $selectedSkin
	);

	function selectSkin(skinId: string) {
		selectedSkinId.set(skinId);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
	role="dialog"
	aria-modal="true"
	aria-labelledby="gallery-title"
>
	<div class="bg-surface border-2 border-foreground rounded-[2px] shadow-brutal w-full max-w-2xl max-h-[90vh] flex flex-col relative">
		<!-- Corner decorations -->
		<div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary -translate-x-1 -translate-y-1"></div>
		<div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary translate-x-1 -translate-y-1"></div>
		<div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary -translate-x-1 translate-y-1"></div>
		<div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary translate-x-1 translate-y-1"></div>

		<!-- Header -->
		<div class="p-4 border-b-2 border-foreground/20 flex items-center justify-between shrink-0">
			<h2 id="gallery-title" class="text-lg font-bold font-mono uppercase tracking-wider text-primary">
				KOA Skin Gallery
			</h2>
			<button
				class="w-8 h-8 flex items-center justify-center border border-foreground/30 rounded-[2px] hover:bg-foreground/10 hover:border-foreground/50 transition-colors font-mono"
				onclick={onClose}
				aria-label="Close gallery"
			>
				×
			</button>
		</div>

		<!-- Content -->
		<div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
			<!-- Preview Panel -->
			<div class="md:w-1/3 p-4 flex flex-col items-center justify-center border-b-2 md:border-b-0 md:border-r-2 border-foreground/20 bg-foreground/5 shrink-0">
				<div class="w-40 h-20 md:w-48 md:h-24 mb-3">
					<KoaAvatar mood="CURIOUS" skin={displaySkin} />
				</div>
				<div class="text-center">
					<div class="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
						{displaySkin.name}
					</div>
					<div class="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
						{displaySkin.id}
					</div>
				</div>
			</div>

			<!-- Grid Panel -->
			<div class="flex-1 overflow-y-auto p-3 min-h-0">
				<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
					{#each KOA_SKINS as skin (skin.id)}
						{@const isSelected = skin.id === $selectedSkinId}
						<button
							class="aspect-[2/1] p-1.5 border-2 rounded-[2px] transition-all relative group
								{isSelected
								? 'border-primary bg-primary/10 shadow-brutal'
								: 'border-foreground/20 bg-surface hover:border-foreground/50 hover:-translate-y-0.5 hover:shadow-sm'}"
							onclick={() => selectSkin(skin.id)}
							onmouseenter={() => (previewSkinId = skin.id)}
							onmouseleave={() => (previewSkinId = null)}
							onfocus={() => (previewSkinId = skin.id)}
							onblur={() => (previewSkinId = null)}
							aria-label="Select {skin.name} skin"
							aria-pressed={isSelected}
						>
							<div class="w-full h-full">
								<KoaAvatar mood="NEUTRAL" skin={skin} />
							</div>
							{#if isSelected}
								<div class="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
									<svg class="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="p-3 border-t-2 border-foreground/20 shrink-0">
			<button
				class="w-full py-2.5 bg-foreground text-surface font-mono font-bold uppercase rounded-[2px] border-2 border-foreground hover:bg-foreground/90 transition-colors shadow-brutal text-sm"
				onclick={onClose}
			>
				Done
			</button>
		</div>
	</div>
</div>
