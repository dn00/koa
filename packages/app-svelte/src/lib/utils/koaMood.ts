/**
 * KOA Mood Derivation - Matching mockup KoaAvatarPortable
 */

import type { GameState } from '@hsh/engine-core';

/**
 * KOA Mood States (15 total) - matches KoaAvatarPortable.tsx
 */
export type KoaMood =
	| 'NEUTRAL'
	| 'SUSPICIOUS'
	| 'DISAPPOINTED'
	| 'AMUSED'
	| 'WATCHING'
	| 'PROCESSING'
	| 'GLITCH'
	| 'SLEEPY'
	| 'ANGRY'
	| 'ACCEPTING'
	| 'CURIOUS'
	| 'GRUDGING'
	| 'IMPRESSED'
	| 'RESIGNED'
	| 'SMUG';

/**
 * Derive KOA mood from game state.
 */
export function deriveKoaMood(state: Pick<GameState, 'belief' | 'turnsPlayed'>): KoaMood {
	const { belief, turnsPlayed } = state;

	// Early game - neutral
	if (turnsPlayed === 0) return 'NEUTRAL';

	// Based on belief trajectory
	if (belief >= 70) return 'IMPRESSED';
	if (belief >= 60) return 'ACCEPTING';
	if (belief >= 50) return 'CURIOUS';
	if (belief >= 40) return 'WATCHING';
	if (belief >= 30) return 'SUSPICIOUS';
	if (belief >= 20) return 'DISAPPOINTED';
	return 'SMUG';
}

/**
 * Get mood for specific game events
 */
export function getEventMood(event: string): KoaMood {
	switch (event) {
		case 'card_played':
			return 'PROCESSING';
		case 'objection_start':
			return 'SUSPICIOUS';
		case 'objection_correct':
			return 'GRUDGING';
		case 'objection_wrong':
			return 'SMUG';
		case 'win':
			return 'RESIGNED';
		case 'lose':
			return 'AMUSED';
		case 'flawless':
			return 'IMPRESSED';
		case 'idle':
			return 'SLEEPY';
		case 'error':
			return 'GLITCH';
		default:
			return 'NEUTRAL';
	}
}
