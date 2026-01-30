/**
 * Task 015: Typewriter Component Tests
 *
 * Requirements:
 * - ACs: 4 (AC-1 through AC-4)
 * - ECs: 2 (EC-1, EC-2)
 * - ERRs: 0
 * - Total: 6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import Typewriter from '$components/Typewriter.svelte';

describe('AC-1: Character Reveal', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('reveals characters one at a time at configured speed', async () => {
		const { container } = render(Typewriter, {
			props: {
				text: 'Hello',
				speed: 50
			}
		});

		const span = container.querySelector('span');
		expect(span).toBeDefined();

		// Initially should show first character after first interval
		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('H');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('He');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('Hel');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('Hell');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('Hello');
	});

	it('full text visible after (chars * speed) ms', async () => {
		const text = 'Hello World';
		const speed = 50;
		const expectedTime = text.length * speed; // 11 * 50 = 550ms

		const { container } = render(Typewriter, {
			props: {
				text,
				speed
			}
		});

		const span = container.querySelector('span');

		// Advance to just before complete
		await vi.advanceTimersByTimeAsync(expectedTime - 1);
		expect(span!.textContent).not.toBe(text);

		// Advance to complete
		await vi.advanceTimersByTimeAsync(51);
		expect(span!.textContent).toBe(text);
	});
});

describe('AC-2: onStart Callback', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('calls onStart once at the beginning', async () => {
		const onStart = vi.fn();

		render(Typewriter, {
			props: {
				text: 'Hello',
				speed: 50,
				onStart
			}
		});

		// onStart should be called on mount
		await tick();
		expect(onStart).toHaveBeenCalledTimes(1);

		// Advance through typing - onStart should not be called again
		await vi.advanceTimersByTimeAsync(300);
		expect(onStart).toHaveBeenCalledTimes(1);
	});
});

describe('AC-3: onComplete Callback', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('calls onComplete once when all characters are revealed', async () => {
		const onComplete = vi.fn();

		render(Typewriter, {
			props: {
				text: 'Hi',
				speed: 50,
				onComplete
			}
		});

		// Not called yet
		expect(onComplete).not.toHaveBeenCalled();

		// First character
		await vi.advanceTimersByTimeAsync(50);
		expect(onComplete).not.toHaveBeenCalled();

		// Second character - should trigger complete
		await vi.advanceTimersByTimeAsync(50);
		expect(onComplete).toHaveBeenCalledTimes(1);

		// Should not be called again
		await vi.advanceTimersByTimeAsync(100);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});
});

describe('AC-4: Configurable Speed', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('each character appears at configured speed interval', async () => {
		const { container } = render(Typewriter, {
			props: {
				text: 'ABC',
				speed: 100
			}
		});

		const span = container.querySelector('span');

		// At 50ms, no characters yet (speed is 100)
		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('');

		// At 100ms, first character
		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('A');

		// At 200ms, second character
		await vi.advanceTimersByTimeAsync(100);
		expect(span!.textContent).toBe('AB');

		// At 300ms, third character
		await vi.advanceTimersByTimeAsync(100);
		expect(span!.textContent).toBe('ABC');
	});

	it('uses default speed when not specified', async () => {
		const onComplete = vi.fn();

		render(Typewriter, {
			props: {
				text: 'AB',
				onComplete
			}
		});

		// Default speed is 20ms
		// At 40ms both characters should be shown
		await vi.advanceTimersByTimeAsync(40);
		expect(onComplete).toHaveBeenCalled();
	});
});

describe('EC-1: Empty Text', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('onStart and onComplete fire even with empty text', async () => {
		const onStart = vi.fn();
		const onComplete = vi.fn();

		render(Typewriter, {
			props: {
				text: '',
				speed: 50,
				onStart,
				onComplete
			}
		});

		await tick();
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('renders nothing with empty text', async () => {
		const { container } = render(Typewriter, {
			props: {
				text: '',
				speed: 50
			}
		});

		const span = container.querySelector('span');
		expect(span!.textContent).toBe('');
	});
});

describe('EC-2: Text Changes Mid-Typing', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('restarts with new text when text prop changes', async () => {
		const onStart = vi.fn();
		const onComplete = vi.fn();

		// For Svelte 5, we need to test text changes by re-rendering
		// This tests the behavior when the component receives new props
		const { container, rerender } = render(Typewriter, {
			props: {
				text: 'Hello',
				speed: 50,
				onStart,
				onComplete
			}
		});

		const span = container.querySelector('span');

		// Type some characters
		await vi.advanceTimersByTimeAsync(100);
		expect(span!.textContent).toBe('He');

		// Reset mocks before prop change
		onStart.mockClear();
		onComplete.mockClear();

		// Change text prop by rerendering
		await rerender({ text: 'New', speed: 50, onStart, onComplete });
		await tick();

		// onStart should be called again for new text
		expect(onStart).toHaveBeenCalledTimes(1);

		// Text should restart from beginning
		expect(span!.textContent).toBe('');

		// Type new text
		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('N');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('Ne');

		await vi.advanceTimersByTimeAsync(50);
		expect(span!.textContent).toBe('New');

		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('clears interval when text changes mid-typing', async () => {
		const { container, rerender } = render(Typewriter, {
			props: {
				text: 'ABCDEFGHIJ',
				speed: 50
			}
		});

		const span = container.querySelector('span');

		// Type some characters
		await vi.advanceTimersByTimeAsync(100);
		expect(span!.textContent).toBe('AB');

		// Change text - old interval should be cleared
		await rerender({ text: 'XY', speed: 50 });
		await tick();

		// Advance time - should type new text, not old
		await vi.advanceTimersByTimeAsync(100);
		expect(span!.textContent).toBe('XY');

		// Should not continue with old text
		await vi.advanceTimersByTimeAsync(200);
		expect(span!.textContent).toBe('XY');
	});
});
