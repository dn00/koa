<script lang="ts">
	/**
	 * Task 008: ObjectionPrompt Component
	 *
	 * Modal overlay for Advanced mode objection choice.
	 * Shows Stand By / Withdraw buttons after turn 2.
	 */

	import type { UICard } from '$lib/stores/game';

	type ObjectionChoice = 'stood_by' | 'withdrawn';

	interface Props {
		/** The card being challenged */
		challengedCard: UICard;
		/** Whether the prompt is visible */
		visible: boolean;
		/** Callback when player makes a choice */
		onChoice: (choice: ObjectionChoice) => void;
	}

	let { challengedCard, visible, onChoice }: Props = $props();

	function handleStandBy() {
		onChoice('stood_by');
	}

	function handleWithdraw() {
		onChoice('withdrawn');
	}
</script>

{#if visible}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		data-testid="objection-prompt"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

		<!-- Modal -->
		<div
			class="relative w-full max-w-md bg-surface border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] rounded-[2px] overflow-hidden animate-in zoom-in-95 fade-in duration-200"
		>
			<!-- Header -->
			<div class="px-4 py-3 bg-primary text-primary-foreground border-b-2 border-foreground">
				<div class="flex items-center gap-2">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						class="animate-pulse"
					>
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
					<span class="text-sm font-mono font-bold uppercase tracking-wider">
						SYSTEM CHECK
					</span>
				</div>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-4">
				<!-- KOA Message -->
				<div class="text-base text-foreground leading-relaxed">
					<span class="font-bold text-primary">KOA:</span>
					<span class="ml-2 italic">
						"Hold on... let me verify this evidence you just presented."
					</span>
				</div>

				<!-- Challenged Card Preview -->
				<div class="p-3 bg-muted/30 border border-foreground/10 rounded-[2px]">
					<div class="flex items-start gap-3">
						<div class="text-2xl shrink-0">{challengedCard.icon}</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-mono font-bold text-muted-foreground uppercase">
								{challengedCard.evidenceType}
							</div>
							<div class="text-base font-medium text-foreground mt-1 line-clamp-2">
								{challengedCard.claim}
							</div>
						</div>
					</div>
				</div>

				<!-- Divider -->
				<div class="border-t border-foreground/10"></div>

				<!-- Choice Buttons -->
				<div class="flex gap-4">
					<button
						onclick={handleStandBy}
						class="flex-1 py-4 px-4 bg-green-500 hover:bg-green-600 text-white border-2 border-foreground shadow-brutal rounded-[2px] transition-all min-h-[60px]"
						aria-label="Stand By"
					>
						<div class="text-base font-bold uppercase">Stand By</div>
						<div class="text-sm opacity-80 mt-1">+2 / -4</div>
					</button>

					<button
						onclick={handleWithdraw}
						class="flex-1 py-4 px-4 bg-amber-500 hover:bg-amber-600 text-white border-2 border-foreground shadow-brutal rounded-[2px] transition-all min-h-[60px]"
						aria-label="Withdraw"
					>
						<div class="text-base font-bold uppercase">Withdraw</div>
						<div class="text-sm opacity-80 mt-1">-2</div>
					</button>
				</div>

				<!-- Explanation -->
				<div class="text-sm text-foreground/60 text-center font-mono">
					Stand By: +2 if true, -4 if false | Withdraw: -2 always (safe)
				</div>
			</div>
		</div>
	</div>
{/if}

