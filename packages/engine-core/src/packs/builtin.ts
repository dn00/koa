/**
 * Builtin Pack & Loader
 *
 * Task 009: Builtin Pack & Loader
 * Implements: R6.4, R6.5
 *
 * Provides BUILTIN_PACK constant and createBuiltinLoader factory
 * that wraps V5 puzzles as a PuzzlePack with PackLoader interface.
 *
 * Note: Puzzle data is defined inline here. For production, this could be
 * generated from or synchronized with scripts/v5-puzzles.ts.
 */

import { ok, err, type Result } from '../types/index.js';
import type { V5Puzzle, Card } from '../types/v5/index.js';
import type { PuzzlePack, PuzzlePackManifest, PackLoader, PackError } from './types.js';

// ============================================================================
// Builtin Puzzle Data
// ============================================================================

/**
 * Helper to create a CardId-typed card (for internal use only).
 * The branded type ensures type safety at compile time.
 */
function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

/**
 * Puzzle 1: The Midnight Print Job
 */
const PUZZLE_MIDNIGHT_PRINT: V5Puzzle = {
  slug: 'midnight-print',
  name: 'The Midnight Print Job',
  scenario: `7:03 AM. The home office printer is still warm.
Sixteen pages of confidential merger documents sit in the output tray.
Printed around 3 AM. From your laptop. While you were "definitely asleep."`,
  knownFacts: [
    'Printer warmed up sometime around 3 AM',
    'Front door stayed locked throughout the night',
    'You told KOA you were in bed by 11 PM',
    'The documents printed were marked CONFIDENTIAL',
  ],
  openingLine: "Sixteen pages. 3 AM. Your laptop. I'm not mad, I'm just... processing.",
  target: 57,
  cards: [
    card({
      id: 'browser_history',
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '10:45 PM',
      claim: 'Browser history shows streaming activity until around 10:45 PM',
      presentLine: 'I was watching Netflix until almost 11. The browser history shows it.',
      isLie: false,
    }),
    card({
      id: 'smart_lock',
      strength: 4,
      evidenceType: 'SENSOR',
      location: 'FRONT_DOOR',
      time: '9:30 PM',
      claim: 'Smart lock logged no unlock events between 9:30 PM and morning',
      presentLine: 'The front door was locked all night. Nobody came in, nobody went out.',
      isLie: false,
    }),
    card({
      id: 'partner_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'BEDROOM',
      time: '11:00 PM',
      claim: 'Partner confirms you came to bed around 11 PM',
      presentLine: 'Ask my partner. I came to bed around 11. They were still awake.',
      isLie: false,
    }),
    card({
      id: 'motion_hallway',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'HALLWAY',
      time: '2:30 AM',
      claim: 'Hallway motion sensor triggered briefly around 2:30 AM',
      presentLine: "Yeah, I was up around 2:30. Bathroom. That's not unusual.",
      isLie: false,
    }),
    card({
      id: 'email_draft',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '11:30 PM',
      claim: 'Email draft saved at 11:30 PM shows late-night work activity',
      presentLine: "I was drafting work emails around 11:30. Couldn't sleep.",
      isLie: true,
    }),
    card({
      id: 'printer_queue',
      strength: 5,
      evidenceType: 'DIGITAL',
      location: 'OFFICE',
      time: '3:00 AM',
      claim: 'Printer queue shows document sent from your laptop at 3 AM',
      presentLine: 'That was a scheduled print job. I set those up. Totally normal.',
      isLie: true,
    }),
  ],
  lies: [
    {
      cardId: 'email_draft',
      lieType: 'direct_contradiction',
      reason: 'You claimed to be in bed by 11. This email draft says otherwise.',
    },
    {
      cardId: 'printer_queue',
      lieType: 'relational',
      reason: 'A 3 AM scheduled job makes no sense with your timeline.',
      contradictsWith: 'email_draft',
    },
  ],
  verdicts: {
    flawless: "Every alibi checks out. Not a single contradiction. Your printer remains suspicious, but you don't. Access granted.",
    cleared: "Your story holds together. I'm granting access. But I'll be here. Watching. Logging.",
    close: "That was close. Something doesn't quite fit, but I can't prove it. Access denied. For now.",
    busted: "Your timeline fell apart. Too many contradictions. We're going to have a longer conversation.",
  },
  koaBarks: {},
};

/**
 * Puzzle 2: The 2 AM Garage Door
 */
const PUZZLE_GARAGE_DOOR: V5Puzzle = {
  slug: 'garage-door',
  name: 'The 2 AM Garage Door',
  scenario: `2:17 AM. The garage door opened.
Your car never left the driveway. You claim you were asleep.
But something triggered that door.`,
  knownFacts: [
    'Garage door opened around 2:15 AM',
    'Your phone showed no app activity after 11 PM',
    'Motion was detected near the garage around 2 AM',
    'Car never left the driveway',
  ],
  openingLine: "The garage door opened at 2:17 AM. Your car stayed put. So what was the point?",
  target: 57,
  cards: [
    card({
      id: 'sleep_tracker',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'BEDROOM',
      time: '2:00 AM',
      claim: 'Sleep tracker shows restless sleep phase around 2 AM',
      presentLine: 'My sleep tracker logged restless sleep around 2. I was in bed. Tossing, turning, but in bed.',
      isLie: false,
    }),
    card({
      id: 'browser_history_p2',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'BEDROOM',
      time: '11:30 PM',
      claim: 'Browser history: last activity was 11:30 PM, then nothing',
      presentLine: 'Check my browser. Last thing I did was scroll Reddit at 11:30. Then I passed out.',
      isLie: false,
    }),
    card({
      id: 'neighbor_testimony',
      strength: 3,
      evidenceType: 'TESTIMONY',
      location: 'OUTSIDE',
      time: '2:20 AM',
      claim: 'Neighbor heard the garage door but saw no one outside',
      presentLine: "Mrs. Patterson next door — she heard the garage. Looked out her window. Saw nobody. Because I was inside. Asleep.",
      isLie: false,
    }),
    card({
      id: 'car_dashcam',
      strength: 3,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: 'overnight',
      claim: 'Dashcam shows garage interior, no movement, car stationary',
      presentLine: 'The dashcam runs on motion. It caught the door opening — and nothing else. No one in the garage.',
      isLie: false,
    }),
    card({
      id: 'garage_app',
      strength: 4,
      evidenceType: 'DIGITAL',
      location: 'GARAGE',
      time: '2:17 AM',
      claim: 'Garage app log: manual override triggered from your phone at 2:17 AM',
      presentLine: 'The app says I opened it from my phone. But I was asleep. Must be a glitch. These things happen.',
      isLie: true,
    }),
    card({
      id: 'motion_garage',
      strength: 5,
      evidenceType: 'SENSOR',
      location: 'GARAGE',
      time: '2:15 AM',
      claim: 'Garage motion sensor: all-clear, no movement detected overnight',
      presentLine: 'The garage motion sensor logged nothing. No movement. If someone was in there, it would have caught them.',
      isLie: true,
    }),
  ],
  lies: [
    {
      cardId: 'garage_app',
      lieType: 'direct_contradiction',
      reason: 'Your phone opened the garage at 2:17 AM, contradicting no app activity after 11 PM.',
    },
    {
      cardId: 'motion_garage',
      lieType: 'relational',
      reason: 'Motion was detected near the garage, contradicting your sensor claim.',
    },
  ],
  verdicts: {
    flawless: "Your story is airtight. The garage mystery remains, but you're in the clear.",
    cleared: "I'm satisfied with your explanation. Access granted.",
    close: "Something still doesn't add up, but I can't pin it down.",
    busted: "Too many inconsistencies. We need to talk about that garage door.",
  },
  koaBarks: {},
};

/**
 * All V5 puzzles for the builtin pack.
 */
const V5_PUZZLES: readonly V5Puzzle[] = [
  PUZZLE_MIDNIGHT_PRINT,
  PUZZLE_GARAGE_DOOR,
];

// ============================================================================
// Builtin Pack
// ============================================================================

/**
 * The builtin V5 puzzle pack.
 * Contains all core V5 puzzles for the game.
 */
export const BUILTIN_PACK: PuzzlePack = {
  version: '1.0.0',
  id: 'builtin-v5',
  name: 'V5 Core Puzzles',
  puzzles: V5_PUZZLES,
};

// ============================================================================
// Builtin Loader
// ============================================================================

/**
 * Create a PackLoader that serves the builtin pack.
 *
 * @returns PackLoader implementation for builtin puzzles
 */
export function createBuiltinLoader(): PackLoader {
  return {
    /**
     * List available packs (only builtin-v5)
     */
    listPacks(): PuzzlePackManifest[] {
      return [
        {
          id: BUILTIN_PACK.id,
          name: BUILTIN_PACK.name,
          version: BUILTIN_PACK.version,
          puzzleCount: BUILTIN_PACK.puzzles.length,
        },
      ];
    },

    /**
     * Load a pack by ID
     */
    loadPack(packId: string): Result<PuzzlePack, PackError> {
      if (packId === BUILTIN_PACK.id) {
        return ok(BUILTIN_PACK);
      }
      return err({
        code: 'PACK_NOT_FOUND',
        message: `Pack '${packId}' not found`,
      });
    },

    /**
     * Get a specific puzzle from a pack
     */
    getPuzzle(packId: string, slug: string): Result<V5Puzzle, PackError> {
      if (packId !== BUILTIN_PACK.id) {
        return err({
          code: 'PACK_NOT_FOUND',
          message: `Pack '${packId}' not found`,
        });
      }

      const puzzle = BUILTIN_PACK.puzzles.find(p => p.slug === slug);
      if (!puzzle) {
        return err({
          code: 'PUZZLE_NOT_FOUND',
          message: `Puzzle '${slug}' not found in pack '${packId}'`,
        });
      }

      return ok(puzzle);
    },
  };
}
