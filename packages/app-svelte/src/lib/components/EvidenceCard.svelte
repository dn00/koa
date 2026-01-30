<script lang="ts">
	/**
	 * Task 005: EvidenceCard Component
	 *
	 * Card component with two variants: "icon" (compact grid) and "details" (full preview).
	 * Mode-aware: hides strength in Mini mode, shows in Expert mode.
	 */

	import type { UICard, Mode } from '$lib/stores/game';
	import { getEvidenceTypeLabel, getEvidenceTypeColor } from '$lib/utils/evidenceTypes';

	interface Props {
		/** The card data to display */
		card: UICard;
		/** Display variant: icon (compact) or details (full) */
		variant?: 'icon' | 'details';
		/** Current game mode (affects strength visibility) */
		mode?: Mode;
		/** Whether this card is selected */
		isSelected?: boolean;
		/** Whether this card is disabled (already played) */
		disabled?: boolean;
		/** Click handler */
		onClick?: () => void;
		/** Focus handler for preview swap */
		onFocus?: (card: UICard) => void;
		/** Blur handler for preview swap */
		onBlur?: () => void;
	}

	let {
		card,
		variant = 'icon',
		mode = 'mini',
		isSelected = false,
		disabled = false,
		onClick,
		onFocus,
		onBlur
	}: Props = $props();

	// Derived display values
	let displayType = $derived(getEvidenceTypeLabel(card.evidenceType));
	let typeColor = $derived(getEvidenceTypeColor(card.evidenceType));
	let displayTime = $derived(card.time || '--:--');
	let displayLocation = $derived(card.location || 'Unknown');

	function handleClick() {
		if (!disabled && onClick) {
			onClick();
		}
	}

	function handleFocus() {
		if (onFocus) {
			onFocus(card);
		}
	}

	function handleBlur() {
		if (onBlur) {
			onBlur();
		}
	}
</script>

{#if variant === 'icon'}
	<!-- Compact icon variant -->
	<div
		class="relative w-full flex flex-col p-3 min-h-[100px] items-center justify-between
			border-2 rounded-[2px] transition-all select-none
			{isSelected
			? 'bg-white border-primary shadow-brutal translate-y-[-2px]'
			: 'bg-surface border-foreground hover:bg-white hover:-translate-y-1'}
			{disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer shadow-brutal'}"
		role="button"
		tabindex={disabled ? -1 : 0}
		onclick={handleClick}
		onmouseenter={handleFocus}
		onmouseleave={handleBlur}
		onfocus={handleFocus}
		onblur={handleBlur}
		onkeydown={(e) => e.key === 'Enter' && handleClick()}
	>
		{#if isSelected}
			<div
				class="absolute top-1 right-1 w-1.5 h-1.5 bg-primary animate-pulse"
				data-selected-indicator
			></div>
		{/if}

		<!-- Header: Type + Time -->
		<div class="w-full flex items-center justify-between gap-1">
			<span
				class="text-sm font-mono font-bold px-1.5 py-0.5 rounded-[2px] uppercase {typeColor}"
			>
				{displayType}
			</span>
			<span class="text-sm font-mono font-bold text-foreground/80 bg-muted/10 px-1.5 py-0.5">
				{displayTime}
			</span>
		</div>

		<!-- Icon -->
		<div
			class="w-10 h-10 rounded-[2px] flex items-center justify-center text-2xl border border-foreground
				{isSelected ? 'bg-primary text-white' : 'bg-background text-foreground'}"
		>
			{card.icon}
		</div>

		<!-- Title -->
		<h3
			class="font-sans font-bold text-sm text-center leading-tight line-clamp-2 w-full
				{isSelected ? 'text-primary' : 'text-foreground'}"
		>
			{card.title}
		</h3>

		<!-- Strength (Expert only) -->
		{#if mode === 'advanced'}
			<div class="absolute bottom-1 right-1 flex gap-0.5">
				{#each Array(3) as _, i}
					<div
						class="w-1 h-1 rounded-full {i < card.strength ? 'bg-primary' : 'bg-muted/30'}"
						data-strength-pip={i < card.strength ? 'filled' : 'empty'}
					></div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<!-- Details variant for preview -->
	<div
		class="bg-white border-2 border-foreground shadow-brutal p-4 rounded-[2px]
			{disabled ? 'opacity-50 grayscale' : ''}"
	>
		<!-- Header: Type + Time -->
		<div class="flex justify-between mb-2">
			<span class="text-sm font-mono font-bold uppercase px-2 py-1 rounded-[2px] {typeColor}">
				{displayType}
			</span>
			<span class="text-sm font-mono text-muted-foreground">{displayTime}</span>
		</div>

		<!-- Icon + Title -->
		<div class="flex items-center gap-3 mb-2">
			<span class="text-2xl">{card.icon}</span>
			<h3 class="font-bold text-sm uppercase">{card.title}</h3>
		</div>

		<!-- Location -->
		<div class="text-sm font-mono text-muted-foreground mb-2">
			LOC: {displayLocation}
		</div>

		<!-- Description (Claim) -->
		<p class="text-base leading-relaxed border-t border-foreground/10 pt-2">
			{card.claim}
		</p>

		<!-- Strength (Expert only) -->
		{#if mode === 'advanced'}
			<div class="flex gap-1.5 mt-2 pt-2 border-t border-foreground/10 items-center">
				<span class="text-sm font-mono text-muted-foreground">STR:</span>
				{#each Array(3) as _, i}
					<div
						class="w-2.5 h-2.5 rounded-full {i < card.strength ? 'bg-primary' : 'bg-muted/30'}"
						data-strength-pip={i < card.strength ? 'filled' : 'empty'}
					></div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

