/**
 * Task 010: Services (Persistence, Packs) Tests
 *
 * Requirements:
 * - ACs: 4 (AC-1 through AC-4)
 * - ECs: 1 (EC-1)
 * - ERRs: 1 (ERR-1)
 * - Total: 6
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	saveEvents,
	loadEvents,
	clearEvents,
	STORAGE_KEY
} from '$lib/services/persistence';
import { loadPack, BUILTIN_PACK_ID } from '$lib/services/packLoader';
import type { V5Puzzle } from '@hsh/engine-core';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
		// Internal helper for tests
		_getStore: () => store
	};
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Sample V5Event type for testing
interface V5Event {
	type: string;
	payload: unknown;
	timestamp: number;
}

describe('Task 010: Services (Persistence, Packs)', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('AC-1: Save Events', () => {
		it('persists events to localStorage when saveEvents is called', () => {
			const events: V5Event[] = [
				{ type: 'GAME_STARTED', payload: { puzzleId: 'test' }, timestamp: Date.now() },
				{ type: 'CARD_PLAYED', payload: { cardId: 'card-1' }, timestamp: Date.now() }
			];

			saveEvents(events);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY,
				JSON.stringify(events)
			);
		});

		it('overwrites existing events on subsequent save', () => {
			const events1: V5Event[] = [
				{ type: 'GAME_STARTED', payload: {}, timestamp: 1000 }
			];
			const events2: V5Event[] = [
				{ type: 'GAME_STARTED', payload: {}, timestamp: 1000 },
				{ type: 'CARD_PLAYED', payload: { cardId: 'card-1' }, timestamp: 2000 }
			];

			saveEvents(events1);
			saveEvents(events2);

			// Last call should have the updated events
			const lastCall = localStorageMock.setItem.mock.calls[
				localStorageMock.setItem.mock.calls.length - 1
			];
			expect(lastCall[1]).toBe(JSON.stringify(events2));
		});

		it('saves empty array when events are cleared', () => {
			const events: V5Event[] = [];
			saveEvents(events);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				STORAGE_KEY,
				JSON.stringify([])
			);
		});
	});

	describe('AC-2: Load Events', () => {
		it('restores events from localStorage when loadEvents is called', () => {
			const events: V5Event[] = [
				{ type: 'GAME_STARTED', payload: { puzzleId: 'test' }, timestamp: 1000 }
			];
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(events));
			vi.clearAllMocks(); // Clear setItem call

			const loaded = loadEvents();

			expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
			expect(loaded).toEqual(events);
		});

		it('returns null when no events are stored', () => {
			const loaded = loadEvents();

			expect(loaded).toBeNull();
		});

		it('derives game state from loaded events', () => {
			// This tests that loaded events can be used to derive state
			// The actual derivation is in the game store
			const events: V5Event[] = [
				{ type: 'GAME_STARTED', payload: { puzzleId: 'midnight-print' }, timestamp: 1000 },
				{ type: 'CARD_PLAYED', payload: { cardId: 'browser_history' }, timestamp: 2000 }
			];
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(events));

			const loaded = loadEvents();

			expect(loaded).not.toBeNull();
			expect(loaded?.length).toBe(2);
			expect(loaded?.[0]?.type).toBe('GAME_STARTED');
			expect(loaded?.[1]?.type).toBe('CARD_PLAYED');
		});
	});

	describe('AC-3: Clear Events', () => {
		it('removes events from storage when clearEvents is called', () => {
			const events: V5Event[] = [
				{ type: 'GAME_STARTED', payload: {}, timestamp: 1000 }
			];
			localStorageMock.setItem(STORAGE_KEY, JSON.stringify(events));
			vi.clearAllMocks();

			clearEvents();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
		});

		it('is safe to call when no events exist', () => {
			// Should not throw
			expect(() => clearEvents()).not.toThrow();
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
		});
	});

	describe('AC-4: Load Builtin Pack', () => {
		it('returns array of V5Puzzle from engine-core when loading builtin pack', async () => {
			const puzzles = await loadPack(BUILTIN_PACK_ID);

			expect(puzzles).toBeDefined();
			expect(Array.isArray(puzzles)).toBe(true);
			expect(puzzles.length).toBeGreaterThan(0);
		});

		it('returns puzzles with required V5Puzzle fields', async () => {
			const puzzles = await loadPack(BUILTIN_PACK_ID);

			const puzzle = puzzles[0];
			expect(puzzle).toBeDefined();
			expect(puzzle?.slug).toBeDefined();
			expect(puzzle?.name).toBeDefined();
			expect(puzzle?.scenario).toBeDefined();
			expect(puzzle?.cards).toBeDefined();
			expect(puzzle?.lies).toBeDefined();
			expect(puzzle?.verdicts).toBeDefined();
		});

		it('returns puzzles with correct card structure', async () => {
			const puzzles = await loadPack(BUILTIN_PACK_ID);

			const puzzle = puzzles[0];
			expect(puzzle?.cards.length).toBeGreaterThan(0);

			const card = puzzle?.cards[0];
			expect(card?.id).toBeDefined();
			expect(card?.evidenceType).toBeDefined();
			expect(card?.claim).toBeDefined();
			expect(typeof card?.isLie).toBe('boolean');
		});
	});

	describe('EC-1: Corrupted Storage', () => {
		it('returns null when localStorage contains invalid JSON', () => {
			localStorageMock.setItem(STORAGE_KEY, 'not valid json {{{');
			vi.clearAllMocks();

			const loaded = loadEvents();

			expect(loaded).toBeNull();
		});

		it('starts fresh game when storage is corrupted', () => {
			localStorageMock.setItem(STORAGE_KEY, '{ incomplete json');

			const loaded = loadEvents();

			// Should return null, allowing app to start fresh
			expect(loaded).toBeNull();
		});

		it('handles empty string in storage', () => {
			localStorageMock.setItem(STORAGE_KEY, '');

			const loaded = loadEvents();

			expect(loaded).toBeNull();
		});
	});

	describe('ERR-1: Unknown Pack', () => {
		it('throws error with helpful message for unknown pack ID', async () => {
			await expect(loadPack('unknown-pack-id')).rejects.toThrow(
				/unknown pack.*unknown-pack-id/i
			);
		});

		it('includes pack ID in error message', async () => {
			try {
				await loadPack('custom-pack-xyz');
				expect.fail('Should have thrown');
			} catch (error) {
				expect((error as Error).message).toContain('custom-pack-xyz');
			}
		});
	});
});
