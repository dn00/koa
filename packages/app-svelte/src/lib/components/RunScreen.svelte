<script lang="ts">
	/**
	 * Task 006: Run Screen Component
	 * Task 022: Card Play Juice & Timing
	 * Task 901: Wire Complete v1 Lite Game Flow
	 *
	 * Orchestrates V5 gameplay: 3 turns of card play followed by Final Audit.
	 * Uses panel-based layout with KOA avatar + bark side-by-side.
	 * After T3, runs audit sequence in BarkPanel, then shows View Results button.
	 */

	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { V5Puzzle } from '@hsh/engine-core';
	import {
		coverageLines,
		independenceLines,
		getConcernLine
	} from '@hsh/engine-core';
	import {
		gameState,
		phase,
		mode,
		playCardAction,
		axisResults,
		auditPhase,
		revealedAuditLines,
		startAuditSequence,
		completeAudit,
		revealAuditLine,
		resetAuditState,
		type UICard
	} from '$lib/stores/game';
	import { tick } from 'svelte';
	import { EVIDENCE_TYPE_HEX } from '$lib/utils/evidenceTypes';
	import { deriveKoaMood, type KoaMood } from '$lib/utils/koaMood';
	import { animateCardPlay } from '$lib/animations/gsap';
	import KoaAvatar from './KoaAvatar.svelte';
	import BarkPanel from './BarkPanel.svelte';
	import Zone2Display from './Zone2Display.svelte';
	import ActionBar from './ActionBar.svelte';
	import EvidenceCard from './EvidenceCard.svelte';
	import Zone3AuditButton from './Zone3AuditButton.svelte';

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
	let portalFlash = $state(false); // Flash effect on card play
	let portalFlashColor = $state('#E07A5F'); // Flash color based on card type
	let inspectedCard = $state<UICard | null>(null); // Clicked card from played slots
	let openingBarkComplete = $state(false); // Track when first bark finishes for LOG flash
	let pendingCard = $state<UICard | null>(null); // Card being revealed in slot
	let revealProgress = $state(0); // 0-1 progress of card reveal animation

	// Start initial delay timer on mount
	$effect(() => {
		const timer = setTimeout(() => {
			isInitializing = false;
		}, TIMING.initialDelay);
		return () => clearTimeout(timer);
	});

	// Task 022: KOA mood override during processing
	let moodOverride = $state<KoaMood | null>(null);

	// Derive whether to show audit proceed button
	let showAuditButton = $derived($auditPhase === 'ready');

	// Initialize bark from puzzle opening line
	$effect(() => {
		if (puzzle.openingLine) {
			currentBark = puzzle.openingLine;
		}
	});

	// When audit starts, trigger the result reveal (T3 bark stays visible)
	$effect(() => {
		if ($auditPhase === 'auditing') {
			// Delay then reveal results - T3 bark stays as currentBark
			setTimeout(() => handleAuditBarkComplete(), 600);
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
	let zone2Mode = $derived<'preview' | 'slots'>(focusedCard || inspectedCard ? 'preview' : 'slots');

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

	// Handle background click to dismiss inspected card
	function handleBackgroundClick(e: MouseEvent) {
		// Only dismiss if not processing
		if (!isProcessing) {
			inspectedCard = null;
		}
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

		// Set pending card immediately so it shows in the slot
		pendingCard = card;
		revealProgress = 0;

		// Get card element for pulse animation
		const cardElement = document.querySelector(`[data-card-id="${selectedCardId}"]`) as HTMLElement;
		const color = EVIDENCE_TYPE_HEX[card.evidenceType] || '#3b82f6';

		// Start animations on next frame (after DOM updates with pending card)
		requestAnimationFrame(() => {
			// Get slot element (now has pending card)
			const slotElement = document.querySelector('[data-slot-pending="true"]') as HTMLElement;

			// Animate card pulse and slot energy fill
			if (cardElement && slotElement) {
				animateCardPlay(cardElement, slotElement, color);
			}

			// Animate reveal progress from 0 to 1
			const startTime = performance.now();
			const duration = TIMING.energyFill;

			function animateReveal(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function (ease-out) - same as GSAP power2.out
				revealProgress = 1 - Math.pow(1 - progress, 2);

				if (progress < 1) {
					requestAnimationFrame(animateReveal);
				}
			}
			requestAnimationFrame(animateReveal);
		});

		// Determine if final turn (for longer dramatic pause)
		const currentTurns = $gameState?.turnsPlayed || 0;
		const isFinalTurn = currentTurns === 2;

		// Calculate total delay: energy fill + KOA thinking time
		const thinkingTime = isFinalTurn ? TIMING.koaThinkingFinal : TIMING.koaThinking;
		const totalDelay = TIMING.energyFill + thinkingTime;

		// Task 022: After animation + thinking, KOA responds
		setTimeout(() => {
			// Clear pending card before playing (so state update shows the real card)
			pendingCard = null;
			revealProgress = 0;

			// Play the card (updates game state)
			const result = playCardAction(selectedCardId!, card);

			if (result.ok) {
				// Trigger portal flash effect after successful transmission
				portalFlashColor = EVIDENCE_TYPE_HEX[card.evidenceType] || '#E07A5F';
				portalFlash = true;
				setTimeout(() => {
					portalFlash = false;
				}, 400);

				// If type tax triggered, stay DISAPPOINTED until next card selection
				// Otherwise clear the processing mood
				if (result.value.typeTaxApplied) {
					moodOverride = 'DISAPPOINTED';
				} else {
					moodOverride = null;
				}

				selectedCardId = null;

				// Update bark with KOA response (T3 bark will trigger audit after completion)
				currentBark = result.value.koaResponse || getDefaultResponse($gameState?.turnsPlayed || 0);
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
		// Trigger LOG flash after opening bark completes (first turn)
		if (!openingBarkComplete && ($gameState?.turnsPlayed ?? 0) === 0) {
			openingBarkComplete = true;
		}
		// Start audit after T3 bark completes (with delay)
		if ($phase === 'RESULT' && !$auditPhase) {
			setTimeout(() => startAuditSequence(), 500);
		}
	}

	// Confirmation dialog state
	let showExitConfirm = $state(false);

	// Handle back navigation
	function handleBack() {
		showExitConfirm = true;
	}

	function confirmExit() {
		showExitConfirm = false;
		if (onBack) {
			onBack();
		} else {
			goto(`${base}/`);
		}
	}

	function cancelExit() {
		showExitConfirm = false;
	}

	// Check if card is played (disabled)
	function isCardPlayed(cardId: string): boolean {
		return playedCards.some((pc) => pc.id === cardId);
	}

	// Handle audit bark completion - reveal all result lines and complete
	function handleAuditBarkComplete() {
		// Reveal all 3 lines sequentially
		const coverageLine = $axisResults?.coverage.status === 'complete'
			? coverageLines.complete
			: coverageLines.gap;
		const independenceLine = $axisResults?.independence === 'diverse'
			? independenceLines.diverse
			: independenceLines.correlated;
		const concernHit = $axisResults?.concernHit ?? false;
		const noConcern = $axisResults?.noConcern ?? false;
		const concernLine = getConcernLine(concernHit, noConcern);

		setTimeout(() => revealAuditLine('coverage', coverageLine), 300);
		setTimeout(() => revealAuditLine('independence', independenceLine), 700);
		setTimeout(() => revealAuditLine('concern', concernLine), 1100);
		setTimeout(() => completeAudit(), 1600);
	}

</script>

<div
	class="flex flex-col h-full w-full bg-background relative overflow-hidden font-sans"
	onclick={handleBackgroundClick}
	role="button"
	tabindex="-1"
	onkeydown={() => {}}
>
	<!-- Background Decoration -->
	<div class="absolute inset-0 pointer-events-none z-0">
		<div class="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
	</div>

	<!-- Navigation -->
	<div class="absolute top-2 left-2 z-30">
		<button
			onclick={handleBack}
			class="h-8 w-8 flex items-center justify-center bg-surface border border-foreground/30 rounded-[2px] opacity-70 hover:opacity-100 hover:border-foreground/50 transition-all"
			aria-label="Back"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>
	</div>

	<!-- Zone 1: Bark Panel with floating avatar -->
	<div
		class="flex-1 min-h-0 bg-background/50 flex flex-col relative shadow-[0_5px_15px_rgba(0,0,0,0.05)] z-20 px-3 py-3 overflow-visible crt-glow"
		data-zone="hero"
	>
		<!-- Background Effects -->
		<div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
			<div class="absolute inset-0 bg-dot-pattern opacity-30"></div>
			<div class="absolute inset-0 scanlines"></div>
			<div class="absolute inset-0 crt-vignette"></div>
			<div class="absolute inset-0 noise-overlay"></div>
			<!-- Portal flash on card play -->
			{#if portalFlash}
				<div
					class="absolute inset-0 portal-flash"
					style="--flash-color: {portalFlashColor};"
				></div>
			{/if}
		</div>

		<!-- Bark Panel Container -->
		<div
			class="flex-1 pl-14 pb-4 min-h-0 flex flex-col z-10 relative"
			data-zone="bark-panel"
		>
			<BarkPanel
				{currentBark}
				{scenario}
				{msgMode}
				turnsPlayed={$gameState?.turnsPlayed ?? 0}
				delayStart={isInitializing}
				auditPhase={$auditPhase}
				revealedAuditLines={$revealedAuditLines}
				onSpeechStart={handleSpeechStart}
				onSpeechComplete={handleSpeechComplete}
				onAuditBarkComplete={handleAuditBarkComplete}
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
					RECEIPT_ANALYSIS
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
		<Zone2Display
			focusedCard={focusedCard || inspectedCard}
			{playedCards}
			{pendingCard}
			{revealProgress}
			maxSlots={3}
			onCardClick={(card) => (inspectedCard = card)}
		/>
	</div>

	<!-- Zone 3: Card Tray / Audit Button -->
	<div
		class="shrink-0 bg-surface border-t-2 border-foreground relative z-30 flex flex-col pb-4"
		data-zone="card-tray"
	>
		<!-- Action Bar -->
		<div data-zone="action-bar">
			<ActionBar
				selectedCardId={isProcessing || isInitializing || showAuditButton ? null : selectedCardId}
				{msgMode}
				shouldFlashLogs={openingBarkComplete}
				onTransmit={handleTransmit}
				onToggleMode={() => (msgMode = msgMode === 'LOGS' ? 'BARK' : 'LOGS')}
			/>
		</div>

		<!-- Card Grid or Audit Button -->
		<div class="p-4 bg-surface/50 relative min-h-60" data-zone="card-grid">
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
							disabled={isPlayed || isProcessing || showAuditButton}
							onClick={() => !isPlayed && !showAuditButton && handleCardClick(card.id)}
							onFocus={() => !isPlayed && !showAuditButton && handleCardFocus(card)}
							onBlur={handleCardBlur}
						/>
					</div>
				{/each}
			</div>

			<!-- Audit Button Overlay -->
			{#if showAuditButton}
				<div class="absolute inset-0 flex items-center justify-center bg-surface/95" data-zone="audit-proceed">
					<Zone3AuditButton onProceed={() => { resetAuditState(); goto(`${base}/result`); }} />
				</div>
			{/if}
		</div>
	</div>

	<!-- Exit Confirmation Dialog -->
	{#if showExitConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div class="bg-white border-2 border-foreground rounded-[2px] shadow-brutal p-5 max-w-xs w-full">
				<h2 class="text-lg font-bold font-mono uppercase mb-2">Exit Game?</h2>
				<p class="text-sm text-muted-foreground mb-5">
					Your progress will be lost.
				</p>
				<div class="flex gap-3">
					<button
						onclick={cancelExit}
						class="flex-1 py-2.5 bg-surface border-2 border-foreground/20 font-mono font-bold uppercase text-sm rounded-[2px] hover:border-foreground/40 transition-all"
					>
						Cancel
					</button>
					<button
						onclick={confirmExit}
						class="flex-1 py-2.5 bg-primary text-white border-2 border-primary font-mono font-bold uppercase text-sm rounded-[2px] shadow-brutal hover:-translate-y-0.5 transition-all"
					>
						Exit
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
