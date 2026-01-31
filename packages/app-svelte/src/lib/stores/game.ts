/**
 * Task 002: Svelte Stores (V5 + Chat)
 *
 * Game state management using Svelte stores and engine-core functions.
 * Provides reactive state for V5 game logic, chat logs, and UI phases.
 */

import { writable, derived, get } from 'svelte/store';
import type { Card, GameState, V5Puzzle, EngineError } from '@hsh/engine-core';
import {
	createGameState,
	playCard,
	resolveObjectionState,
	isGameOver,
	shouldTriggerObjection,
	autoResolveObjection,
	DEFAULT_CONFIG,
	MINI_MODE,
	ADVANCED_MODE
} from '@hsh/engine-core';
import type { ModeConfig } from '@hsh/engine-core';

// ============================================================================
// Types
// ============================================================================

export type GamePhase = 'READING' | 'PICKING' | 'RESULT' | 'SHARE';
export type Mode = 'mini' | 'advanced';

/**
 * Extended card with UI-only display fields.
 * These fields are not part of engine-core Card.
 */
export interface UICard extends Card {
	readonly icon: string;
	readonly title: string;
}

/**
 * Chat log entry for the Mini mode conversation view.
 */
export interface MiniLog {
	readonly id: string;
	readonly speaker: 'KOA' | 'PLAYER';
	readonly text?: string;
	readonly card?: UICard;
	readonly timestamp: Date;
}

/**
 * Result of an objection resolution.
 */
export interface ObjectionResult {
	readonly choice: 'stood_by' | 'withdrawn';
	readonly beliefChange: number;
	readonly autoResolved: boolean;
}

/**
 * Result of playing a card, including potential objection.
 */
export interface PlayCardResult {
	readonly state: GameState;
	readonly beliefChange: number;
	readonly wasLie: boolean;
	readonly typeTaxApplied: boolean;
	readonly card: Card;
	readonly koaResponse: string;
	readonly objectionResult?: ObjectionResult;
}

/**
 * Result type for play card action (success or error).
 */
export type PlayCardActionResult =
	| { ok: true; value: PlayCardResult }
	| { ok: false; error: EngineError };

// ============================================================================
// Core Stores
// ============================================================================

/**
 * Current game state from engine-core.
 * Null when no game is in progress.
 */
export const gameState = writable<GameState | null>(null);

/**
 * Current puzzle being played.
 * Null when no game is in progress.
 */
export const currentPuzzle = writable<V5Puzzle | null>(null);

/**
 * Chat log entries for the conversation view.
 * Cleared when a new game starts.
 */
export const chatLogs = writable<MiniLog[]>([]);

/**
 * Current game phase (READING, PICKING, VERDICT, SHARE).
 */
export const phase = writable<GamePhase>('READING');

// ============================================================================
// Mode Store (with persistence)
// ============================================================================

function createModeStore() {
	// Read from localStorage if available
	const stored =
		typeof localStorage !== 'undefined' ? (localStorage.getItem('koa-mode') as Mode | null) : null;

	const { subscribe, set: internalSet } = writable<Mode>(stored || 'mini');

	return {
		subscribe,
		set: (value: Mode) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('koa-mode', value);
			}
			internalSet(value);
		}
	};
}

/**
 * Current game mode (mini or advanced).
 * Persists to localStorage.
 */
export const mode = createModeStore();

/**
 * Derived store that returns the ModeConfig for the current mode.
 */
export const modeConfig = derived(mode, ($mode): ModeConfig => {
	return $mode === 'advanced' ? ADVANCED_MODE : MINI_MODE;
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Generate a unique ID for log entries.
 */
function generateId(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for environments without crypto.randomUUID
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a log entry to the chat log.
 *
 * @param speaker - Who is speaking (KOA or PLAYER)
 * @param text - Optional text message (for KOA)
 * @param card - Optional card (for PLAYER)
 */
export function addLog(speaker: 'KOA' | 'PLAYER', text?: string, card?: UICard): void {
	chatLogs.update((logs) => [
		...logs,
		{
			id: generateId(),
			speaker,
			text,
			card,
			timestamp: new Date()
		}
	]);
}

/**
 * Determine the story completion pattern based on evidence types played.
 * Used for Turn 3 barks in storyCompletions.
 *
 * Returns patterns that match puzzle generator expectations:
 * - all_digital, all_testimony, all_sensor, all_physical (all same type)
 * - digital_heavy, testimony_heavy, etc. (2 of same type)
 * - mixed_strong (good variety with complementary types)
 * - mixed_varied (all different but no clear strength)
 */
function getStoryPattern(playedCards: readonly Card[]): string {
	if (playedCards.length < 3) return 'mixed_varied';

	const types = playedCards.map((c) => c.evidenceType);
	const typeCounts = types.reduce(
		(acc, t) => {
			acc[t] = (acc[t] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>
	);

	const uniqueTypes = Object.keys(typeCounts);

	// All same type (all_digital, all_testimony, all_sensor, all_physical)
	if (uniqueTypes.length === 1) {
		const type = uniqueTypes[0].toLowerCase();
		return `all_${type}`;
	}

	// Two of one type, one of another (digital_heavy, testimony_heavy, etc.)
	if (uniqueTypes.length === 2) {
		const dominant = Object.entries(typeCounts).find(([_, count]) => count === 2)?.[0];
		if (dominant) {
			return `${dominant.toLowerCase()}_heavy`;
		}
	}

	// All different types = mixed
	// Determine strength based on whether types complement each other
	// Digital + Sensor = strong technical story (machine-corroborated)
	// Testimony + Physical = strong human story (witness + tangible proof)
	const hasDigital = types.includes('DIGITAL');
	const hasSensor = types.includes('SENSOR');
	const hasTestimony = types.includes('TESTIMONY');
	const hasPhysical = types.includes('PHYSICAL');

	if ((hasDigital && hasSensor) || (hasTestimony && hasPhysical)) {
		return 'mixed_strong';
	}

	return 'mixed_varied';
}

/**
 * Generate a KOA response based on game state and puzzle barks.
 * Uses sequence-aware barks for Turn 2+ (THE WOW FACTOR).
 *
 * Turn 1: Uses cardPlayed barks (individual card reactions)
 * Turn 2: Uses sequences barks (reacts to card ORDER: "cardA→cardB")
 * Turn 3: Uses storyCompletions barks (reacts to overall story pattern)
 */
function getKoaResponse(
	puzzle: V5Puzzle | null,
	cardId: string,
	turnsPlayed: number,
	_wasLie: boolean,
	playedCards?: readonly Card[]
): string {
	const koaBarks = puzzle?.koaBarks;

	// Turn 3: Try storyCompletions bark
	if (turnsPlayed === 3 && koaBarks?.storyCompletions && playedCards && playedCards.length >= 3) {
		const pattern = getStoryPattern(playedCards);
		const barks = koaBarks.storyCompletions[pattern];
		if (barks && barks.length > 0) {
			return barks[Math.floor(Math.random() * barks.length)];
		}
	}

	// Turn 2+: Try sequences bark (based on previous card → current card)
	if (turnsPlayed >= 2 && koaBarks?.sequences && playedCards && playedCards.length >= 2) {
		const prevCard = playedCards[playedCards.length - 2];
		const sequenceKey = `${prevCard.id}→${cardId}`;
		const barks = koaBarks.sequences[sequenceKey];
		if (barks && barks.length > 0) {
			return barks[Math.floor(Math.random() * barks.length)];
		}
	}

	// Turn 1 or fallback: Try cardPlayed bark
	if (koaBarks?.cardPlayed) {
		const barks = koaBarks.cardPlayed[cardId];
		if (barks && barks.length > 0) {
			return barks[Math.floor(Math.random() * barks.length)];
		}
	}

	// Final fallback responses
	if (turnsPlayed === 3) return 'Calculating override probability...';
	if (turnsPlayed === 2) return 'System check in progress. One more variable required.';
	return 'Noted. Continue.';
}

/**
 * Start a new game with the given puzzle.
 *
 * @param puzzle - The V5 puzzle to play
 * @param _seed - Random seed for reproducibility (reserved for future use)
 */
export function startGame(puzzle: V5Puzzle, _seed: number): void {
	const state = createGameState(puzzle, DEFAULT_CONFIG);
	gameState.set(state);
	currentPuzzle.set(puzzle);
	chatLogs.set([]);
	addLog('KOA', puzzle.openingLine || 'Access denied. Review the logs.');
	phase.set('READING');
}

/**
 * Play a card from hand.
 *
 * @param cardId - ID of card to play
 * @param uiCard - UICard with display fields for chat log
 * @returns Result with new state or error
 */
export function playCardAction(cardId: string, uiCard: UICard): PlayCardActionResult {
	const state = get(gameState);
	const currentMode = get(modeConfig);

	if (!state) {
		return {
			ok: false,
			error: {
				code: 'INVALID_STATE',
				message: 'No game in progress'
			}
		};
	}

	const result = playCard(state, cardId, DEFAULT_CONFIG, Date.now());

	if (!result.ok) {
		return {
			ok: false,
			error: result.error
		};
	}

	const { state: newState, wasLie, beliefChange, typeTaxApplied, card } = result.value;

	// Add player card to chat log
	addLog('PLAYER', undefined, uiCard);

	// Generate KOA response from puzzle barks (with sequence awareness)
	const puzzle = get(currentPuzzle);
	const koaResponse = getKoaResponse(puzzle, cardId, newState.turnsPlayed, wasLie, newState.played);

	// Check for objection after turn 2
	let objectionResult: ObjectionResult | undefined;
	let finalState = newState;

	if (shouldTriggerObjection(newState.turnsPlayed, DEFAULT_CONFIG)) {
		const lastCard = newState.played[newState.played.length - 1];

		if (lastCard && !currentMode.playerChoosesObjection) {
			// Mini mode: auto-resolve objection
			const autoResult = autoResolveObjection(lastCard, DEFAULT_CONFIG);

			// Apply objection to state
			const objResult = resolveObjectionState(newState, autoResult.choice, DEFAULT_CONFIG);
			if (objResult.ok) {
				finalState = objResult.value.state;
				objectionResult = {
					choice: autoResult.choice,
					beliefChange: autoResult.beliefChange,
					autoResolved: true
				};
			}
		} else if (lastCard) {
			// Advanced mode: signal that objection is pending (not auto-resolved)
			objectionResult = {
				choice: 'stood_by', // Will be replaced by player choice
				beliefChange: 0,
				autoResolved: false
			};
		}
	}

	// Update game state
	gameState.set(finalState);

	// Check for game over
	if (isGameOver(finalState, DEFAULT_CONFIG)) {
		phase.set('RESULT');
	}

	return {
		ok: true,
		value: {
			state: finalState,
			beliefChange,
			wasLie,
			typeTaxApplied,
			card,
			koaResponse,
			objectionResult
		}
	};
}

/**
 * Reset all stores to initial state.
 * Useful for testing.
 */
export function resetStores(): void {
	gameState.set(null);
	currentPuzzle.set(null);
	chatLogs.set([]);
	phase.set('READING');
	mode.set('mini');
}
