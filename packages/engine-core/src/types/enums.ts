/**
 * Enum-like constants using `as const` for better tree-shaking.
 */

/**
 * Types of proof that evidence can provide.
 * AC-1: IDENTITY, ALERTNESS, INTENT, LOCATION, LIVENESS
 */
export const ProofType = {
  IDENTITY: 'IDENTITY',
  ALERTNESS: 'ALERTNESS',
  INTENT: 'INTENT',
  LOCATION: 'LOCATION',
  LIVENESS: 'LIVENESS',
} as const;

export type ProofType = (typeof ProofType)[keyof typeof ProofType];

/**
 * Types of concerns that KOA can raise.
 * AC-6: Matches ProofType values
 */
export const ConcernType = {
  IDENTITY: 'IDENTITY',
  ALERTNESS: 'ALERTNESS',
  INTENT: 'INTENT',
  LOCATION: 'LOCATION',
  LIVENESS: 'LIVENESS',
} as const;

export type ConcernType = (typeof ConcernType)[keyof typeof ConcernType];

/**
 * AC-9: KOA's mood states that influence dialogue.
 */
export const KOAMood = {
  NEUTRAL: 'NEUTRAL',
  CURIOUS: 'CURIOUS',
  SUSPICIOUS: 'SUSPICIOUS',
  BLOCKED: 'BLOCKED',
  GRUDGING: 'GRUDGING',
  IMPRESSED: 'IMPRESSED',
  RESIGNED: 'RESIGNED',
  SMUG: 'SMUG',
} as const;

export type KOAMood = (typeof KOAMood)[keyof typeof KOAMood];

/**
 * Severity levels for contradictions in the player's story.
 */
export const ContradictionSeverity = {
  MINOR: 'MINOR',
  MAJOR: 'MAJOR',
  CRITICAL: 'CRITICAL',
} as const;

export type ContradictionSeverity =
  (typeof ContradictionSeverity)[keyof typeof ContradictionSeverity];
