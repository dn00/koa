<script lang="ts">
	/**
	 * Task 006: Run Screen Component
	 * Task 022: Card Play Juice & Timing
	 * Task 901: Wire Complete v1 Lite Game Flow
	 *
	 * Orchestrates V5 gameplay: 3 turns of card play followed by Final Audit.
	 * Uses panel-based layout with KOA avatar + bark side-by-side.
	 * After T3, shows FinalAuditPanel before navigating to result.
	 */

	import { goto } from '$app/navigation';
	import type { V5Puzzle } from '@hsh/engine-core';
	import {
		gameState,
		phase,
		mode,
		playCardAction,
		axisResults,
		type UICard
	} from '$lib/stores/game';
	import { tick } from 'svelte';
	import { getEvidenceTypeLabel, EVIDENCE_TYPE_HEX } from '$lib/utils/evidenceTypes';
	import { deriveKoaMood, type KoaMood } from '$lib/utils/koaMood';
	import { animateCardPlay } from '$lib/animations/gsap';
	import KoaAvatar from './KoaAvatar.svelte';
	import BarkPanel from './BarkPanel.svelte';
	import Zone2Display from './Zone2Display.svelte';
	import ActionBar from './ActionBar.svelte';
	import EvidenceCard from './EvidenceCard.svelte';
	import FinalAuditPanel from './FinalAuditPanel.svelte';

	interface Props {
		/** The puzzle being played */
		puzzle: V5Puzzle;
		/** Optional: Navigate back callback */
		onBack?: () => void;
	}

	let { puzzle, onBack }: Props = $props();

	// Default opening bark
	const defaultBark = 'System locked. Justify your actions.';

	// Task 022: Timing constants (synced with GSAP animation)
	const TIMING = {
		energyFill: 800, // Energy fill animation duration (matches gsap.ts)
		koaThinking: 400, // KOA processing after receiving data
		koaThinkingFinal: 800, // Longer thinking on final turn (dramatic)
		verdictTransition: 1200, // Pause before navigating to verdict
		initialDelay: 1000 // Pause before opening bark starts
	};

	// Local UI state
	let selectedCardId = $state<string | null>(null);
	let focusedCard = $state<UICard | null>(null);
	let isSpeaking = $state(false);
	let currentBark = $state(defaultBark);
	let isProcessing = $state(false);
	let msgMode = $state<'BARK' | 'LOGS'>('BARK');
	let isInitializing = $state(true); // Initial delay before bark starts

	// Start initial delay timer on mount
	$effect(() => {
		const timer = setTimeout(() => {
			isInitializing = false;
		}, TIMING.initialDelay);
		return () => clearTimeout(timer);
	});

	// Task 022: KOA mood override during processing
	let moodOverride = $state<KoaMood | null>(null);

	// Task 901: Final Audit Panel state (component-local animation phase)
	let showFinalAudit = $state(false);

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

	// Track all original cards (stays constant throughout game)
	let allCards = $state<UICard[]>([]);

	// Initialize all cards once when puzzle loads
	$effect(() => {
		if (puzzle && allCards.length === 0) {
			allCards = puzzle.cards.map((card) => ({
				...card,
				icon: getCardIcon(card.evidenceType),
				title: card.source || card.claim.split(' ').slice(0, 5).join(' ')
			}));
		}
	});

	// Derive played cards with UI extensions
	let playedCards = $derived<UICard[]>(
		$gameState?.played.map((card) => ({
			...card,
			icon: getCardIcon(card.evidenceType),
			title: card.source || card.claim.split(' ').slice(0, 5).join(' ')
		})) || []
	);

	// Derive KOA mood from game state, with override during processing (Task 022)
	let koaMood = $derived<KoaMood>(
		moodOverride ? moodOverride : ($gameState ? deriveKoaMood($gameState) : 'NEUTRAL')
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

		// Clear any lingering mood override (e.g., DISAPPOINTED from type tax)
		if (moodOverride) {
			moodOverride = null;
		}

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

	// Handle TRANSMIT button click (Task 022: Card Play Juice)
	async function handleTransmit() {
		if (!selectedCardId || isProcessing) return;

		console.log('[RunScreen] Transmitting card:', selectedCardId);

		const card = allCards.find((c) => c.id === selectedCardId);
		if (!card) return;

		isProcessing = true;

		// Clear focused state
		if (focusTimeoutId) {
			clearTimeout(focusTimeoutId);
			focusTimeoutId = null;
		}
		
		// Ensure slots are visible before animating
		const wasFocused = focusedCard !== null;
		focusedCard = null;
		
		if (wasFocused) {
			await tick();
		}

		// Task 022: Set KOA mood to PROCESSING (receiving data)
		moodOverride = 'PROCESSING';

		// Task 022: Get card element and slot for animation
		const cardElement = document.querySelector(`[data-card-id="${selectedCardId}"]`) as HTMLElement;
		const slotElement = document.querySelector('[data-slot-filled="false"]') as HTMLElement;

		console.log('[RunScreen] Animation elements:', { cardElement, slotElement });

		// Task 022: Animate card play if elements exist
		if (cardElement && slotElement) {
			const color = EVIDENCE_TYPE_HEX[card.evidenceType] || '#3b82f6';
			console.log('[RunScreen] Animating with color:', color);
			animateCardPlay(cardElement, slotElement, color);
		} else {
			console.warn('[RunScreen] Missing animation elements, skipping animation');
		}


		// Determine if final turn (for longer dramatic pause)
		const currentTurns = $gameState?.turnsPlayed || 0;
		const isFinalTurn = currentTurns === 2;

		// Calculate total delay: energy fill + KOA thinking time
		const thinkingTime = isFinalTurn ? TIMING.koaThinkingFinal : TIMING.koaThinking;
		const totalDelay = TIMING.energyFill + thinkingTime;

		// Task 022: After animation + thinking, KOA responds
		setTimeout(() => {
			// Play the card (updates game state)
			const result = playCardAction(selectedCardId!, card);

			if (result.ok) {
				// Update bark with KOA response
				currentBark = result.value.koaResponse || getDefaultResponse($gameState?.turnsPlayed || 0);

				// If type tax triggered, stay DISAPPOINTED until next card selection
				// Otherwise clear the processing mood
				if (result.value.typeTaxApplied) {
					moodOverride = 'DISAPPOINTED';
					// Mood clears when player selects next card (see handleCardClick)
				} else {
					moodOverride = null;
				}

				selectedCardId = null;

				// Task 901: Check if game is over - show Final Audit panel
				if ($phase === 'RESULT') {
					// Show Final Audit panel instead of immediate navigation
					// Navigation happens after FinalAuditPanel animation completes
					setTimeout(() => {
						showFinalAudit = true;
					}, TIMING.verdictTransition);
				}
			} else {
				moodOverride = null;
			}

			// Re-enable input
			isProcessing = false;
		}, totalDelay);
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

	// Task 901: Handle Final Audit panel completion
	function handleFinalAuditComplete() {
		console.log('[RunScreen] Final Audit complete, navigating to result');
		goto('/result');
	}

	// Task 901: Derived props for FinalAuditPanel
	let finalAuditProps = $derived({
		coverageComplete: $axisResults?.coverage.status === 'complete',
		independenceOk: $axisResults?.independence === 'diverse',
		concernHit: $axisResults?.concernHit ?? false,
		noConcern: $axisResults?.noConcern ?? false
	});
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

	<!-- Zone 1: Bark Panel with floating avatar -->
	<div
		class="flex-1 min-h-0 bg-background/50 flex flex-col relative shadow-[0_5px_15px_rgba(0,0,0,0.05)] z-20 px-3 py-3 overflow-visible"
		data-zone="hero"
	>
		<!-- Background Effects -->
		<div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
			<div class="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
			<div class="absolute inset-0 scanlines opacity-20"></div>
		</div>

		<!-- Bark Panel Container -->
		<div
			class="flex-1 pl-14 pt-10 pb-5 min-h-0 flex flex-col z-10 relative"
			data-zone="bark-panel"
		>
			<BarkPanel
				{currentBark}
				{scenario}
				{msgMode}
				turnsPlayed={$gameState?.turnsPlayed ?? 0}
				delayStart={isInitializing}
				onSpeechStart={handleSpeechStart}
				onSpeechComplete={handleSpeechComplete}
				onModeChange={(m) => (msgMode = m)}
			/>
		</div>

		<!-- Floating Avatar (overlaps bottom-left corner of panel) -->
		<div
			class="absolute bottom-0 left-0 w-[190px] h-[190px] md:w-[240px] md:h-[240px] z-40 pointer-events-none translate-y-[20%] -translate-x-[15%]"
			data-zone="avatar"
		>
			<KoaAvatar mood={koaMood} {isSpeaking} />
		</div>
	</div>

	<!-- Zone 2: Override Sequence / Card Preview -->
	<div
		class="shrink-0 py-3 px-4 bg-background/50 border-b border-foreground/5 z-10 transition-all min-h-[7rem]"
		data-zone="override-sequence"
		data-zone2-mode={zone2Mode}
	>
		<!-- Zone 2 Header -->
		<div class="flex items-center justify-between mb-2 h-5">
			{#if focusedCard}
				<!-- Existing preview code... -->
				<div class="text-[10px] font-mono font-bold uppercase text-primary flex items-center gap-1.5 tracking-wider">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
					</svg>
					DATA_ANALYSIS_PREVIEW
				</div>
			{:else}
				<div class="text-[10px] font-mono font-bold uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					SECURITY_OVERRIDE_SEQUENCE
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
				selectedCardId={isProcessing || isInitializing ? null : selectedCardId}
				{msgMode}
				onTransmit={handleTransmit}
				onToggleMode={() => (msgMode = msgMode === 'LOGS' ? 'BARK' : 'LOGS')}
			/>
		</div>

		<!-- Card Grid -->
		<div class="p-4 bg-surface/50" data-zone="card-grid">
			<div class="grid grid-cols-3 md:grid-cols-6 gap-3">
				{#each allCards as card (card.id)}
					{@const isPlayed = isCardPlayed(card.id)}
					<div
						class="relative transition-all duration-300 {isPlayed ? 'opacity-40 grayscale' : ''}"
						data-card-id={card.id}
						data-selected={selectedCardId === card.id}
						data-played={isPlayed}
						data-disabled={isPlayed || isProcessing}
					>
						<EvidenceCard
							{card}
							variant="icon"
							mode={$mode}
							isSelected={selectedCardId === card.id && !isPlayed}
							disabled={isPlayed || isProcessing}
							onClick={() => !isPlayed && handleCardClick(card.id)}
							onFocus={() => !isPlayed && handleCardFocus(card)}
							onBlur={handleCardBlur}
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Task 901: Final Audit Panel (shown after T3 before navigating to Result) -->
	{#if showFinalAudit}
		<FinalAuditPanel
			coverageComplete={finalAuditProps.coverageComplete}
			independenceOk={finalAuditProps.independenceOk}
			concernHit={finalAuditProps.concernHit}
			noConcern={finalAuditProps.noConcern}
			onComplete={handleFinalAuditComplete}
		/>
	{/if}
</div>

