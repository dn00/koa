/**
 * V5 Enum Types
 * Evidence types, tiers, and lie classifications
 */

/**
 * Evidence type for cards.
 * Each type has different implications for KOA's analysis.
 */
export type EvidenceType = 'DIGITAL' | 'PHYSICAL' | 'TESTIMONY' | 'SENSOR';

/**
 * Tier classifications for game outcomes.
 * Determines the final verdict based on belief score vs target.
 */
export type Tier = 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';

/**
 * Lie classification for content constraints.
 * - direct_contradiction: Directly contradicts a known fact
 * - relational: Conflicts with another card or piece of evidence
 */
export type LieType = 'direct_contradiction' | 'relational';
