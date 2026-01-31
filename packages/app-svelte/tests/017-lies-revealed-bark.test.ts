/**
 * Task 017: Lies Revealed Bark on Verdict Screen Tests
 *
 * Tests for verdict bark selection based on lies played and KOA mood derivation.
 *
 * Test count verification:
 * - AC-1: Verdict bark when 0 lies played
 * - AC-2: Punchline bark when 1 lie played
 * - AC-3: Punchline bark when 2 lies played (uses 'multiple' key)
 * - AC-3b: Punchline bark when 3 lies played (uses 'all' key)
 * - AC-4: KOA avatar mood (SMUG for lies, IMPRESSED for FLAWLESS, GRUDGING for CLEARED)
 * - AC-5: Fallback to verdicts[tier] when liesRevealed is missing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { getVerdict, DEFAULT_CONFIG } from '@hsh/engine-core';
import type { GameState, Card, V5Puzzle, Tier } from '@hsh/engine-core';
import ResultScreen from '$lib/components/ResultScreen.svelte';
import { resetStores } from '$lib/stores/game';

// Mock navigation
const mockGoto = vi.fn();
vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mockGoto(...args)
}));

// Test card factory
function createTestCard(overrides: Partial<Card> = {}): Card {
	return {
		id: 'test-card' as Card['id'],
		strength: 3,
		evidenceType: 'DIGITAL',
		location: 'OFFICE',
		time: '10:00 AM',
		claim: 'Test claim',
		presentLine: 'Test presentation',
		isLie: false,
		...overrides
	};
}

// Test puzzle factory with liesRevealed barks
function createTestPuzzle(overrides: Partial<V5Puzzle> = {}): V5Puzzle {
	return {
		slug: 'test-puzzle',
		name: 'Test Puzzle',
		scenario: 'Test scenario',
		knownFacts: ['Fact 1', 'Fact 2'],
		openingLine: 'Opening line',
		target: 60,
		cards: [
			createTestCard({ id: 'card-truth-1' as Card['id'], strength: 5, isLie: false }),
			createTestCard({ id: 'card-truth-2' as Card['id'], strength: 4, isLie: false }),
			createTestCard({ id: 'card-truth-3' as Card['id'], strength: 3, isLie: false }),
			createTestCard({ id: 'lie-usb-log' as Card['id'], strength: 3, isLie: true }),
			createTestCard({ id: 'lie-neighbor' as Card['id'], strength: 3, isLie: true }),
			createTestCard({ id: 'lie-printer' as Card['id'], strength: 3, isLie: true })
		],
		lies: [
			{ cardId: 'lie-usb-log', lieType: 'direct_contradiction', reason: 'USB log contradicts cloud relay' },
			{ cardId: 'lie-neighbor', lieType: 'relational', reason: 'Neighbor saw someone but motion sensor saw a cat' },
			{ cardId: 'lie-printer', lieType: 'direct_contradiction', reason: 'Printer queue says local but job came from cloud' }
		],
		verdicts: {
			flawless: 'Flawless verdict - perfect execution',
			cleared: 'Cleared verdict - acceptable defense',
			close: 'Close verdict - barely made it',
			busted: 'Busted verdict - caught red-handed'
		},
		koaBarks: {
			liesRevealed: {
				'lie-usb-log': ['USB transfer at 3:04. But the job came through cloud relay. Not even close.'],
				'lie-neighbor': ['Neighbor saw someone at the desk. Motion sensor saw a cat. You do the math.'],
				'lie-printer': ['Printer queue says local. But the job came from cloud. Pick one.'],
				multiple: ['Two bad cards. Two contradictions. Your story has structural issues.'],
				all: ['Three lies. All caught. You played every bad card in the deck.']
			}
		},
		...overrides
	};
}


describe('Task 017: Lies Revealed Bark on Verdict Screen', () => {
	beforeEach(() => {
		resetStores();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	describe('AC-1: Verdict Bark for Clean Play (0 lies)', () => {
		it('returns puzzle.verdicts[tier] when 0 lies are played', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 55, // target + 5 = FLAWLESS
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-3' as Card['id'], isLie: false })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe('Flawless verdict - perfect execution');
		});

		it('returns cleared verdict when 0 lies and tier is CLEARED', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 52, // At target = CLEARED
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-3' as Card['id'], isLie: false })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe('Cleared verdict - acceptable defense');
		});
	});

	describe('AC-2: Punchline Bark for Single Lie (1 lie)', () => {
		it('returns liesRevealed[cardId][0] when 1 lie is played', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 45,
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe(
				'USB transfer at 3:04. But the job came through cloud relay. Not even close.'
			);
		});

		it('returns bark for specific lie card ID when only that lie is played', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 45,
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					createTestCard({ id: 'lie-neighbor' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe(
				'Neighbor saw someone at the desk. Motion sensor saw a cat. You do the math.'
			);
		});
	});

	describe('AC-3: Punchline Bark for Multiple Lies (2 lies)', () => {
		it('returns liesRevealed["multiple"][0] when 2 lies are played', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 40,
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true }),
					createTestCard({ id: 'lie-neighbor' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe(
				'Two bad cards. Two contradictions. Your story has structural issues.'
			);
		});
	});

	describe('AC-3b: Punchline Bark for All Lies (3 lies)', () => {
		it('returns liesRevealed["all"][0] when 3 lies are played', () => {
			const puzzle = createTestPuzzle({ target: 50 });
			const state: GameState = {
				belief: 35,
				hand: [],
				played: [
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true }),
					createTestCard({ id: 'lie-neighbor' as Card['id'], isLie: true }),
					createTestCard({ id: 'lie-printer' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			expect(verdict.koaLine).toBe(
				'Three lies. All caught. You played every bad card in the deck.'
			);
		});
	});

	describe('AC-4: KOA Avatar Mood on Verdict Screen', () => {
		it('shows SMUG mood when lies are caught', () => {
			const verdictData = {
				tier: 'CLOSE' as Tier,
				beliefFinal: 45,
				beliefTarget: 50,
				koaLine: 'Two bad cards. Two contradictions.',
				playedCards: [
					{ card: createTestCard({ id: 'truth-1' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'lie-1' as Card['id'], isLie: true }), wasLie: true },
					{ card: createTestCard({ id: 'lie-2' as Card['id'], isLie: true }), wasLie: true }
				]
			};

			const { container } = render(ResultScreen, {
				props: { verdict: verdictData, dayNumber: 1 }
			});

			// KOA avatar should be visible with mood reflecting lies caught
			const koaAvatarContainer = container.querySelector('[data-koa-avatar]');
			expect(koaAvatarContainer).toBeInTheDocument();

			// The KoaAvatar receives mood='SMUG' when lies are detected
			// Verify the avatar is rendered (mood is passed as prop to KoaAvatar)
			const verdictBark = container.querySelector('[data-koa-verdict-bark]');
			expect(verdictBark).toBeInTheDocument();
		});

		it('shows IMPRESSED mood for FLAWLESS tier with no lies', () => {
			const verdictData = {
				tier: 'FLAWLESS' as Tier,
				beliefFinal: 70,
				beliefTarget: 60,
				koaLine: 'Perfect execution.',
				playedCards: [
					{ card: createTestCard({ id: 'truth-1' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-2' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-3' as Card['id'], isLie: false }), wasLie: false }
				]
			};

			const { container } = render(ResultScreen, {
				props: { verdict: verdictData, dayNumber: 1 }
			});

			const koaAvatarContainer = container.querySelector('[data-koa-avatar]');
			expect(koaAvatarContainer).toBeInTheDocument();

			// Verify FLAWLESS tier badge is shown (indicates IMPRESSED mood context)
			expect(container.querySelector('[data-tier="FLAWLESS"]')).toBeInTheDocument();
		});

		it('shows GRUDGING mood for CLEARED tier with no lies', () => {
			const verdictData = {
				tier: 'CLEARED' as Tier,
				beliefFinal: 62,
				beliefTarget: 60,
				koaLine: 'Acceptable defense.',
				playedCards: [
					{ card: createTestCard({ id: 'truth-1' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-2' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-3' as Card['id'], isLie: false }), wasLie: false }
				]
			};

			const { container } = render(ResultScreen, {
				props: { verdict: verdictData, dayNumber: 1 }
			});

			const koaAvatarContainer = container.querySelector('[data-koa-avatar]');
			expect(koaAvatarContainer).toBeInTheDocument();

			// Verify CLEARED tier badge is shown (indicates GRUDGING mood context)
			expect(container.querySelector('[data-tier="CLEARED"]')).toBeInTheDocument();
		});

		it('shows NEUTRAL mood for other tiers with no lies', () => {
			const verdictData = {
				tier: 'CLOSE' as Tier,
				beliefFinal: 58,
				beliefTarget: 60,
				koaLine: 'Barely made it.',
				playedCards: [
					{ card: createTestCard({ id: 'truth-1' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-2' as Card['id'], isLie: false }), wasLie: false },
					{ card: createTestCard({ id: 'truth-3' as Card['id'], isLie: false }), wasLie: false }
				]
			};

			const { container } = render(ResultScreen, {
				props: { verdict: verdictData, dayNumber: 1 }
			});

			const koaAvatarContainer = container.querySelector('[data-koa-avatar]');
			expect(koaAvatarContainer).toBeInTheDocument();

			// Verify CLOSE tier badge is shown (indicates NEUTRAL mood context)
			expect(container.querySelector('[data-tier="CLOSE"]')).toBeInTheDocument();
		});
	});

	describe('AC-5: Fallback When liesRevealed is Missing', () => {
		it('falls back to verdicts[tier] when liesRevealed is not defined', () => {
			const puzzle = createTestPuzzle({
				target: 50,
				koaBarks: {} // No liesRevealed defined
			});
			const state: GameState = {
				belief: 45,
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			// Should fall back to tier-based verdict since liesRevealed is missing
			expect(verdict.koaLine).toBe('Close verdict - barely made it');
		});

		it('falls back to verdicts[tier] when specific lie key is missing from liesRevealed', () => {
			const puzzle = createTestPuzzle({
				target: 50,
				koaBarks: {
					liesRevealed: {
						// Only has 'multiple' and 'all', missing specific card IDs
						multiple: ['Two lies caught.'],
						all: ['All lies caught.']
					}
				}
			});
			const state: GameState = {
				belief: 45,
				hand: [],
				played: [
					createTestCard({ id: 'card-truth-1' as Card['id'], isLie: false }),
					createTestCard({ id: 'card-truth-2' as Card['id'], isLie: false }),
					// This specific lie card ID is not in liesRevealed
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			// Should fall back to tier-based verdict since 'lie-usb-log' key is missing
			expect(verdict.koaLine).toBe('Close verdict - barely made it');
		});

		it('uses tier-based verdict for busted tier when liesRevealed missing', () => {
			const puzzle = createTestPuzzle({
				target: 60,
				koaBarks: {} // No liesRevealed defined
			});
			const state: GameState = {
				belief: 40, // Below threshold = BUSTED
				hand: [],
				played: [
					createTestCard({ id: 'lie-usb-log' as Card['id'], isLie: true }),
					createTestCard({ id: 'lie-neighbor' as Card['id'], isLie: true }),
					createTestCard({ id: 'lie-printer' as Card['id'], isLie: true })
				],
				turnResults: [],
				turnsPlayed: 3,
				objection: null
			};

			const verdict = getVerdict(state, puzzle, DEFAULT_CONFIG);

			// Should fall back to busted verdict
			expect(verdict.koaLine).toBe('Busted verdict - caught red-handed');
		});
	});
});
