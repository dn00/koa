/**
 * Task 010: Persistence Service
 *
 * Handles saving and loading V5Event[] to/from localStorage.
 * Uses event sourcing pattern (I4 invariant) - events are the source of truth.
 */

/**
 * V5Event interface for type safety.
 * Events are the source of truth for game state.
 */
export interface V5Event {
	type: string;
	payload: unknown;
	timestamp: number;
}

/**
 * Storage key for persisted events.
 */
export const STORAGE_KEY = 'hsh_v5_events';

/**
 * Check if localStorage is available.
 */
function isStorageAvailable(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const test = '__storage_test__';
		window.localStorage.setItem(test, test);
		window.localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
}

/**
 * Save V5Event[] to localStorage.
 *
 * AC-1: Events persisted to localStorage when events change.
 *
 * @param events - Array of V5 events to persist
 */
export function saveEvents(events: V5Event[]): void {
	if (!isStorageAvailable()) return;

	try {
		const serialized = JSON.stringify(events);
		window.localStorage.setItem(STORAGE_KEY, serialized);
	} catch (error) {
		// Handle quota exceeded or other errors silently
		console.warn('Failed to save events to localStorage:', error);
	}
}

/**
 * Load V5Event[] from localStorage.
 *
 * AC-2: Events restored from localStorage, game state derived.
 * EC-1: Returns null for corrupted/invalid JSON.
 *
 * @returns Array of V5 events, or null if none stored or corrupted
 */
export function loadEvents(): V5Event[] | null {
	if (!isStorageAvailable()) return null;

	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);

		// No stored data
		if (!stored) return null;

		// Empty string
		if (stored.trim() === '') return null;

		// Parse JSON
		const parsed = JSON.parse(stored);

		// Validate it's an array
		if (!Array.isArray(parsed)) return null;

		return parsed as V5Event[];
	} catch {
		// EC-1: Corrupted storage returns null
		return null;
	}
}

/**
 * Clear V5Event[] from localStorage.
 *
 * AC-3: Events cleared from storage on game reset.
 */
export function clearEvents(): void {
	if (!isStorageAvailable()) return;

	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Ignore errors on clear
	}
}

/**
 * Subscribe to events changes and auto-save.
 * Returns unsubscribe function.
 *
 * @param getEvents - Function to get current events
 * @returns Unsubscribe function
 */
export function createAutoSave(
	getEvents: () => V5Event[]
): () => void {
	// Simple debounce
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	const save = () => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			saveEvents(getEvents());
		}, 500);
	};

	return () => {
		if (timeoutId) clearTimeout(timeoutId);
	};
}
