<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';

	/**
	 * Task 015: Typewriter Component
	 *
	 * Reveals text character-by-character with configurable speed
	 * and callbacks for syncing with KOA avatar state.
	 */

	interface Props {
		/** Text to reveal character by character */
		text: string;
		/** Milliseconds per character (default: 20) */
		speed?: number;
		/** Skip animation and show full text immediately */
		skipAnimation?: boolean;
		/** Called when typing starts */
		onStart?: () => void;
		/** Called when typing finishes */
		onComplete?: () => void;
	}

	let { text, speed = 20, skipAnimation = false, onStart, onComplete }: Props = $props();

	let displayedText = $state('');
	let interval: ReturnType<typeof setInterval> | null = null;
	let previousText = $state<string | undefined>(undefined);

	function stopTyping() {
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
	}

	function startTyping(textToType: string) {
		stopTyping();
		displayedText = '';

		onStart?.();

		// Handle empty text case
		if (textToType.length === 0) {
			onComplete?.();
			return;
		}

		let idx = 0;
		interval = setInterval(() => {
			if (idx < textToType.length) {
				idx++;
				displayedText = textToType.slice(0, idx);
			}
			if (idx >= textToType.length) {
				stopTyping();
				onComplete?.();
			}
		}, speed);
	}

	onMount(() => {
		previousText = text;
		if (skipAnimation) {
			displayedText = text;
			onComplete?.();
		} else {
			startTyping(text);
		}
	});

	onDestroy(() => {
		stopTyping();
	});

	// Handle text changes - restart typing with new text
	$effect(() => {
		// Access text to create dependency
		const currentText = text;
		// Only restart if text actually changed (not on initial mount)
		const prev = untrack(() => previousText);
		if (prev !== undefined && currentText !== prev) {
			previousText = currentText;
			startTyping(currentText);
		}
	});
</script>

<span>{displayedText}<span class="inline-block w-2 h-4 ml-1 align-middle bg-current animate-cursor"></span></span>
