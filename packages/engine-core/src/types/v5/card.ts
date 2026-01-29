/**
 * V5 Card Types
 * CardId branded type and Card interface
 */

import type { EvidenceType } from './enums.js';

/**
 * Branded type for Card IDs.
 * Valid formats:
 * - Prefixed: "card_xxx" (e.g., "card_001", "card_photo-scan")
 * - Simple: lowercase alphanumeric with hyphens (e.g., "evidence-01", "photo-scan")
 */
export type CardId = string & { readonly __brand: 'CardId' };

/**
 * Type guard to validate CardId.
 * Returns true if:
 * - Starts with "card_" and rest is alphanumeric/hyphens
 * - OR is a simple lowercase alphanumeric-hyphen string
 *
 * @param id - String to validate
 * @returns True if valid CardId format
 */
export function isCardId(id: string): id is CardId {
  if (!id || id.length === 0) {
    return false;
  }

  // Card prefix pattern: card_ followed by alphanumeric and hyphens
  if (id.startsWith('card_')) {
    const suffix = id.slice(5);
    return suffix.length > 0 && /^[a-z0-9-]+$/.test(suffix);
  }

  // Simple pattern: lowercase alphanumeric with hyphens only
  return /^[a-z0-9-]+$/.test(id);
}

/**
 * Evidence card in the V5 game.
 * Cards have hidden truthiness (isLie) that affects scoring.
 */
export interface Card {
  /** Unique identifier for the card */
  readonly id: CardId;

  /** Strength value (1-5): Belief gain if truth */
  readonly strength: number;

  /** Type of evidence */
  readonly evidenceType: EvidenceType;

  /** Where the evidence was found/recorded */
  readonly location: string;

  /** Time the evidence relates to */
  readonly time: string;

  /** The evidence statement/claim */
  readonly claim: string;

  /** What the player says when submitting this card */
  readonly presentLine: string;

  /** Hidden from player: true if this card is a lie */
  readonly isLie: boolean;
}
