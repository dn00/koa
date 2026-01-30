<script lang="ts">
	/**
	 * Task 006: Run Screen Component
	 *
	 * Orchestrates V5 gameplay: 3 turns of card play followed by objection prompt.
	 * Uses panel-based layout with KOA avatar + bark side-by-side.
	 */

	import { goto } from '$app/navigation';
	import type { V5Puzzle } from '@hsh/engine-core';
	import {
		gameState,
		phase,
		playCardAction,
		mode,
		type UICard
	} from '$lib/stores/game';
	import { deriveKoaMood, type KoaMood } from '$lib/utils/koaMood';
	import KoaAvatar from './KoaAvatar.svelte';
	import BarkPanel from './BarkPanel.svelte';
	import Zone2Display from './Zone2Display.svelte';
	import ActionBar from './ActionBar.svelte';
	import EvidenceCard from './EvidenceCard.svelte';

	interface Props {
		/** The puzzle being played */
		puzzle: V5Puzzle;
		/** Optional: Navigate back callback */
		onBack?: () => void;
	}

	let { puzzle, onBack }: Props = $props();

	// Default opening bark
	const defaultBark = 'System locked. Justify your actions.';

	// Local UI state
	let selectedCardId = $state<string | null>(null);
	let focusedCard = $state<UICard | null>(null);
	let isSpeaking = $state(false);
	let currentBark = $state(defaultBark);
	let isProcessing = $state(false);

	// Initialize bark from puzzle opening line
	$effect(() => {
		if (puzzle.openingLine) {
			currentBark = puzzle.openingLine;
		}
	});

	// Timeouts for focus handling
	let focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

	// Derive scenario data from puzzle
	let scenario = $derived({
		header: puzzle.scenario.split('.')[0] + '.',
		facts: [...puzzle.knownFacts]
	});

	// Derive available cards (hand) with UI extensions
	let availableCards = $derived<UICard[]>(
		$gameState?.hand.map((card) => ({
			...card,
			icon: getCardIcon(card.evidenceType),
			title: card.claim.split(' ').slice(0, 5).join(' ')
		})) || []
	);

	// Derive played cards with UI extensions
	let playedCards = $derived<UICard[]>(
		$gameState?.played.map((card) => ({
			...card,
			icon: getCardIcon(card.evidenceType),
			title: card.claim.split(' ').slice(0, 5).join(' ')
		})) || []
	);

	// Derive KOA mood from game state
	let koaMood = $derived<KoaMood>(
		$gameState ? deriveKoaMood($gameState) : 'NEUTRAL'
	);

	// Zone 2 mode (preview vs slots)
	let zone2Mode = $derived<'preview' | 'slots'>(focusedCard ? 'preview' : 'slots');

	// Get icon for evidence type
	function getCardIcon(type: string): string {
		const icons: Record<string, string> = {
			DIGITAL: '💾',
			SENSOR: '📡',
			TESTIMONY: '👤',
			PHYSICAL: '🔍'
		};
		return icons[type] || '📄';
	}

	// Handle card selection
	function handleCardClick(cardId: string) {
		if (isProcessing) return;
		if (selectedCardId === cardId) {
			selectedCardId = null;
		} else {
			selectedCardId = cardId;
		}
	}

	// Handle card focus (hover/focus)
	function handleCardFocus(card: UICard) {
		if (focusTimeoutId) {
			clearTimeout(focusTimeoutId);
			focusTimeoutId = null;
		}
		focusedCard = card;
	}

	// Handle card blur
	function handleCardBlur() {
		if (focusTimeoutId) {
			clearTimeout(focusTimeoutId);
		}
		focusTimeoutId = setTimeout(() => {
			focusedCard = null;
			focusTimeoutId = null;
		}, 100);
	}

	// Handle TRANSMIT button click
	function handleTransmit() {
		if (!selectedCardId || isProcessing) return;

		const card = availableCards.find((c) => c.id === selectedCardId);
		if (!card) return;

		isProcessing = true;

		// Clear focused state
		if (focusTimeoutId) {
			clearTimeout(focusTimeoutId);
			focusTimeoutId = null;
		}
		focusedCard = null;

		// Play the card
		const result = playCardAction(selectedCardId, card);

		if (result.ok) {
			// Update bark with KOA response
			currentBark = result.value.koaResponse || getDefaultResponse($gameState?.turnsPlayed || 0);
			selectedCardId = null;

			// Check if game is over
			if ($phase === 'VERDICT') {
				// Navigate to verdict after a delay
				setTimeout(() => {
					goto(`/verdict/${puzzle.slug}`);
				}, 1500);
			}
		}

		// Re-enable after brief delay
		setTimeout(() => {
			isProcessing = false;
		}, 300);
	}

	// Default KOA response based on turn
	function getDefaultResponse(turnsPlayed: number): string {
		if (turnsPlayed === 3) return 'Calculating override probability... Stand by.';
		if (turnsPlayed === 2) return 'Log updated. I need one more data point to correlate.';
		const responses = [
			'Noted. Proceed.',
			'I have recorded this in the temporary cache.',
			'Does not fully align with sensor data, but proceeding.',
			'If you say so.',
			'Calculating relevance...'
		];
		return responses[Math.floor(Math.random() * responses.length)];
	}

	// Handle speech callbacks
	function handleSpeechStart() {
		isSpeaking = true;
	}

	function handleSpeechComplete() {
		isSpeaking = false;
	}

	// Handle back navigation
	function handleBack() {
		if (onBack) {
			onBack();
		} else {
			goto('/');
		}
	}

	// Check if card is played (disabled)
	function isCardPlayed(cardId: string): boolean {
		return playedCards.some((pc) => pc.id === cardId);
	}
</script>

<div class="flex flex-col h-full w-full bg-background relative overflow-hidden font-sans">
	<!-- Background Decoration -->
	<div class="absolute inset-0 pointer-events-none z-0">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
	</div>

	<!-- Navigation -->
	<div class="absolute top-3 left-3 z-30">
		<button
			onclick={handleBack}
			class="h-11 w-11 flex items-center justify-center bg-surface border-2 border-foreground rounded-[2px] opacity-60 hover:opacity-100 transition-all shadow-brutal"
			aria-label="Back"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
		</button>
	</div>

	<!-- Zone 1: KOA Hero (Avatar + Bark Panel) -->
	<div
		class="flex-1 min-h-0 bg-background/50 flex flex-row items-center relative shadow-[0_5px_15px_rgba(0,0,0,0.05)] z-20 pl-0 pr-4 py-4 gap-0 overflow-hidden"
		data-zone="hero"
	>
		<!-- Background Effects -->
		<div class="absolute inset-0 pointer-events-none z-0">
			<div class="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
			<div class="absolute inset-0 scanlines opacity-20"></div>
		</div>

		<!-- Device Frame Decoration -->
		<div class="absolute inset-0 border-[6px] border-foreground/5 pointer-events-none z-10"></div>

		<!-- Avatar Container -->
		<div
			class="w-[170px] xs:w-[210px] md:w-[300px] aspect-[2/1] relative shrink-0 z-10 -ml-6 flex items-center justify-center"
			data-zone="avatar"
		>
			<KoaAvatar mood={koaMood} {isSpeaking} />
		</div>

		<!-- Bark Panel Container -->
		<div
			class="flex-1 min-w-0 flex flex-col justify-center h-full z-10 -ml-8 md:-ml-12 relative"
			data-zone="bark-panel"
		>
			<BarkPanel
				{currentBark}
				{scenario}
				onSpeechStart={handleSpeechStart}
				onSpeechComplete={handleSpeechComplete}
			/>
		</div>
	</div>

	<!-- Zone 2: Override Sequence / Card Preview -->
	<div
		class="shrink-0 py-3 px-4 bg-background/50 border-b border-foreground/5 z-10 transition-all min-h-[8rem]"
		data-zone="override-sequence"
		data-zone2-mode={zone2Mode}
	>
		<!-- Zone 2 Header -->
		<div class="flex items-center justify-between mb-2 h-5">
			{#if focusedCard}
				<div class="text-sm font-mono font-bold uppercase text-primary flex items-center gap-2 tracking-wider">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
					</svg>
					DATA_ANALYSIS_PREVIEW
				</div>
			{:else}
				<div class="text-sm font-mono font-bold uppercase text-foreground/60 flex items-center gap-2 tracking-wider">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					OVERRIDE_SEQUENCE
				</div>
			{/if}
		</div>

		<!-- Zone 2 Content -->
		<Zone2Display {focusedCard} {playedCards} maxSlots={3} />
	</div>

	<!-- Zone 3: Card Tray -->
	<div
		class="shrink-0 bg-surface border-t-2 border-foreground relative z-30 flex flex-col pb-4"
		data-zone="card-tray"
	>
		<!-- Action Bar -->
		<div data-zone="action-bar">
			<ActionBar
				selectedCardId={isProcessing ? null : selectedCardId}
				onTransmit={handleTransmit}
			/>
		</div>

		<!-- Card Grid -->
		<div class="p-4 bg-surface/50" data-zone="card-grid">
			<div class="grid grid-cols-3 md:grid-cols-6 gap-3">
				{#each availableCards as card (card.id)}
					{@const isPlayed = isCardPlayed(card.id)}
					<div class="relative" data-card-id={card.id}>
						<EvidenceCard
							{card}
							variant="icon"
							mode={$mode}
							isSelected={selectedCardId === card.id}
							disabled={isPlayed || isProcessing}
							onClick={() => handleCardClick(card.id)}
							onFocus={() => handleCardFocus(card)}
							onBlur={handleCardBlur}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

