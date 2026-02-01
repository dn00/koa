/**
 * Skin Store - Persisted KOA skin selection
 */

import { writable, derived } from 'svelte/store';
import type { KoaSkin } from '$lib/components/KoaAvatar.svelte';
import { KOA_SKINS, DEFAULT_SKIN_ID, getSkinById } from '$lib/constants/skins';

const STORAGE_KEY = 'koa-skin';

function createSkinStore() {
	// Read from localStorage if available
	const stored =
		typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

	const { subscribe, set: internalSet } = writable<string>(stored || DEFAULT_SKIN_ID);

	return {
		subscribe,
		set: (skinId: string) => {
			// Validate skin exists
			const exists = KOA_SKINS.some((s) => s.id === skinId);
			const validId = exists ? skinId : DEFAULT_SKIN_ID;

			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, validId);
			}
			internalSet(validId);
		}
	};
}

/**
 * Current selected skin ID.
 * Persists to localStorage.
 */
export const selectedSkinId = createSkinStore();

/**
 * Derived store that returns the full KoaSkin object for the selected skin.
 */
export const selectedSkin = derived(selectedSkinId, ($id): KoaSkin => {
	return getSkinById($id);
});

/**
 * All available skins.
 */
export { KOA_SKINS };
