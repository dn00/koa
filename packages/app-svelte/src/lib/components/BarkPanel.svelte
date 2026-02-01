<script lang="ts">
	/**
	 * Task 016: BarkPanel Component
	 * Task 701: T2 Suspicion Display
	 *
	 * Tabbed panel showing KOA's current bark (SYS_MSG tab) or
	 * scenario facts (LOGS tab). Bark text uses typewriter effect.
	 * Shows T2 suspicion line + subtitle after sequence bark completes.
	 */

	import { untrack } from 'svelte';
	import Typewriter from './Typewriter.svelte';
	import { suspicionText, suspicionShown, markSuspicionShown } from '$lib/stores/game';
	import { fitText } from '$lib/actions/fitText';

	interface Scenario {
		header: string;
		facts: string[];
	}

	interface Props {
		/** Current KOA bark text */
		currentBark: string;
		/** Scenario with header and facts */
		scenario: Scenario;
		/** Current view mode (BARK vs LOGS) */
		msgMode: 'BARK' | 'LOGS';
		/** Current turn number (1, 2, or 3) */
		turnsPlayed?: number;
		/** Delay before typewriter starts */
		delayStart?: boolean;
		/** Called when typewriter starts */
		onSpeechStart?: () => void;
		/** Called when typewriter completes */
		onSpeechComplete?: () => void;
		/** Called when mode changes */
		onModeChange: (mode: 'BARK' | 'LOGS') => void;
	}

	let {
		currentBark,
		scenario,
		msgMode,
		turnsPlayed = 0,
		delayStart = false,
		onSpeechStart,
		onSpeechComplete,
		onModeChange
	}: Props = $props();

	// Task 701: Track suspicion animation state
	let suspicionLineVisible = $state(false);

	// Track previous bark to detect changes
	let previousBark = $state<string | undefined>(undefined);

	// Track barks that have already been typed out (use object for Svelte 5 reactivity)
	let typedBarks = $state<Record<string, boolean>>({});

	// Auto-switch to BARK when bark changes
	$effect(() => {
		const prev = untrack(() => previousBark);
		if (prev !== undefined && currentBark !== prev) {
			onModeChange('BARK');
			// Reset suspicion animation state when bark changes
			suspicionLineVisible = false;
		}
		previousBark = currentBark;
	});

	// Task 701: Handle bark completion and trigger suspicion animation
	function handleBarkComplete() {
		// Mark this bark as typed
		typedBarks[currentBark] = true;
		onSpeechComplete?.();

		// If T2 and suspicion text exists, show suspicion line after bark
		if (turnsPlayed === 2 && $suspicionText && !$suspicionShown) {
			// Delay before showing suspicion line (400ms after bark)
			setTimeout(() => {
				suspicionLineVisible = true;
				markSuspicionShown();
			}, 400);
		}
	}

	function setMode(mode: 'BARK' | 'LOGS') {
		onModeChange(mode);
	}

	// Format fact number with leading zero
	function formatFactNumber(index: number): string {
		return String(index + 1).padStart(2, '0');
	}

	// Task 701: Determine if suspicion should be shown
	$effect(() => {
		// Clear suspicion display when moving past T2
		if (turnsPlayed !== 2) {
			suspicionLineVisible = false;
		}
	});
</script>

<div
	class="bg-white border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] rounded-[2px] rounded-bl-none relative flex flex-col h-full transition-all duration-300"
>
	<!-- Decorative Corner -->
	<div
		class="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1 pointer-events-none"
		data-decorative-corner
	></div>

	<!-- Header: Tabs -->
	<div class="shrink-0 px-1 py-0 border-b bg-muted/5 border-foreground/20 flex items-stretch h-7">
		<button
			onclick={() => setMode('BARK')}
			class="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-colors rounded-tl-[2px]
				{msgMode === 'BARK'
				? 'bg-white text-primary relative top-[1px] border-b border-white'
				: 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}"
			aria-label="SYS_MSG"
		>
			<svg
				width="10"
				height="10"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
				></path>
			</svg>
			SYS_MSG
		</button>

		<div class="w-[1px] bg-foreground/10 h-full my-auto"></div>

		<button
			onclick={() => setMode('LOGS')}
			class="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider transition-colors rounded-tr-[2px]
				{msgMode === 'LOGS'
				? 'bg-white text-primary relative top-[1px] border-b border-white'
				: 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}"
			aria-label="LOGS"
		>
			<svg
				width="10"
				height="10"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
				<polyline points="14 2 14 8 20 8"></polyline>
				<line x1="16" y1="13" x2="8" y2="13"></line>
				<line x1="16" y1="17" x2="8" y2="17"></line>
				<polyline points="10 9 9 9 8 9"></polyline>
			</svg>
			LOGS
		</button>
	</div>

	<!-- Content Body -->
	<div
		class="flex-1 flex flex-col pl-6 pr-4 pt-6 pb-14 leading-relaxed text-foreground scrollbar-hide min-h-0 overflow-hidden"
		data-panel-content
	>
		{#if msgMode === 'BARK'}
			<div
				class="flex-1 min-h-0 flex flex-col justify-center overflow-hidden"
				use:fitText={{ text: currentBark, minSize: 11, maxSize: 18, multiLine: true }}
			>
				<div class="w-full text-left">
					{#if !delayStart}
						<Typewriter
							text={currentBark}
							speed={30}
							skipAnimation={!!typedBarks[currentBark]}
							onStart={onSpeechStart}
							onComplete={handleBarkComplete}
						/>
					{/if}
				</div>

				<!-- Task 701: T2 Suspicion Display -->
				{#if turnsPlayed === 2 && $suspicionText && suspicionLineVisible}
					<div class="mt-4 pt-3 border-t border-foreground/10">
						<div
							class="suspicion-line text-foreground/90 animate-in fade-in slide-in-from-bottom-2 duration-300"
						>
							{$suspicionText.line}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex-1 min-h-0 flex flex-col overflow-hidden"
				style="font-size: clamp(11px, 2.5vw, 16px);"
			>
				<!-- Scenario Header -->
				<div class="flex items-center gap-1.5 mb-1.5 text-red-500 border-b border-red-100 pb-1">
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="shrink-0"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					<span class="font-bold font-mono uppercase leading-tight">
						{scenario.header}
					</span>
				</div>

				<!-- Facts List -->
				<ul class="flex flex-col gap-1">
					{#each scenario.facts as fact, i}
						<li class="flex gap-2 text-foreground/90 leading-snug items-start font-sans">
							<span class="font-mono font-bold text-foreground/50 shrink-0">
								{formatFactNumber(i)}
							</span>
							<span>{fact}</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

