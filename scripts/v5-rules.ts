/**
 * V5 Rules — Micro-Daily Puzzle Engine Rules
 *
 * Configurable via GameConfig from v5-types.ts
 * Type Tax: repeat evidence type = penalty on next play
 * Objection: after T2, challenge last played card
 */

import type { Card, V5Puzzle, Tier, GameConfig, DialogueAxis, DialogueValence } from './v5-types.js';
import { DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG } from './v5-types.js';

// Re-export configs for convenience
export { DEFAULT_CONFIG, EASY_CONFIG, HARD_CONFIG };
export type { GameConfig };

// ============================================================================
// Scoring — Uses isLie (hidden truthiness)
// ============================================================================

export function scoreCard(
  card: Card,
  config: GameConfig,
  typeTaxActive: boolean
): { beliefChange: number; wasLie: boolean } {
  let beliefChange: number;
  const wasLie = card.isLie;

  if (wasLie) {
    beliefChange = config.scoring.lie(card.strength);
  } else {
    beliefChange = config.scoring.truth(card.strength);
  }

  // Apply type tax penalty if active
  if (typeTaxActive && config.typeTax.enabled) {
    beliefChange += config.typeTax.penalty;
  }

  return { beliefChange, wasLie };
}

// ============================================================================
// Type Tax — Repeat evidence type triggers penalty on next play
// ============================================================================

export function checkTypeTax(
  currentCard: Card,
  previousCard: Card | null,
  config: GameConfig
): boolean {
  if (!config.typeTax.enabled || !previousCard) {
    return false;
  }
  return currentCard.evidenceType === previousCard.evidenceType;
}

// ============================================================================
// Tier Calculation
// ============================================================================

export function getTier(belief: number, target: number, config: GameConfig): Tier {
  if (config.tiers.flawless(belief, target)) return 'FLAWLESS';
  if (config.tiers.cleared(belief, target)) return 'CLEARED';
  if (config.tiers.close(belief, target)) return 'CLOSE';
  return 'BUSTED';
}

// ============================================================================
// Objection (after T2)
// ============================================================================

export function shouldTriggerObjection(turnsPlayed: number, config: GameConfig): boolean {
  return config.objection.enabled && turnsPlayed === config.objection.afterTurn + 1;
}

export function resolveObjection(
  wasLie: boolean,
  choice: 'stood_by' | 'withdrawn',
  config: GameConfig
): number {
  if (choice === 'stood_by') {
    return wasLie ? config.objection.stoodByLie : config.objection.stoodByTruth;
  }
  return config.objection.withdrew;
}

// ============================================================================
// Axis Detection — What KOA notices about the play
// ============================================================================

function parseTime(t: string): number {
  const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1]!);
  const m = parseInt(match[2]!);
  const ampm = match[3]!.toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

export function detectAxis(
  currentCard: Card,
  played: Card[],
  wasLie: boolean,
  typeTaxApplied: boolean
): { axis: DialogueAxis; valence: DialogueValence; intensity: number } {
  // Lie revealed — contradiction axis
  if (wasLie) {
    return { axis: 'contradiction', valence: 'warning', intensity: 3 };
  }

  // Type tax triggered — channel reliance
  if (typeTaxApplied) {
    return { axis: 'channel_reliance', valence: 'suspicion', intensity: 2 };
  }

  // Check for location fixation
  const sameLocation = played.filter(c => c.location === currentCard.location);
  if (sameLocation.length >= 2) {
    return { axis: 'location_fixation', valence: 'suspicion', intensity: 2 };
  }

  // Check for timeline cluster (tight timestamps)
  const prevCard = played[played.length - 1];
  if (prevCard) {
    const timeDiff = Math.abs(parseTime(prevCard.time) - parseTime(currentCard.time));
    if (timeDiff <= 60) {
      return { axis: 'timeline', valence: 'praise', intensity: 2 };
    }
  }

  // Default: coherence (story holds together)
  return { axis: 'coherence', valence: 'neutral', intensity: played.length + 1 };
}

// ============================================================================
// Lie Lookup — Helper for checking if a card is a lie
// ============================================================================

export function isCardLie(cardId: string, puzzle: V5Puzzle): boolean {
  return puzzle.lies.some(l => l.cardId === cardId);
}

export function getLieInfo(cardId: string, puzzle: V5Puzzle) {
  return puzzle.lies.find(l => l.cardId === cardId) || null;
}
