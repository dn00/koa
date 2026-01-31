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
 * - inferential: Requires inference to detect (e.g., app use requires phone activity)
 * - relational: Conflicts with another card or piece of evidence
 *
 * Legacy types (deprecated, removed in v1 Lite):
 * - direct_contradiction: Directly contradicts a known fact
 * - self_incriminating: Evidence that hurts the player's own case
 * - implausible_timeline: Physically impossible given other known facts
 */
export type LieType =
  | 'inferential'
  | 'relational'
  // Legacy types (deprecated, will be removed after Task 801)
  | 'direct_contradiction'
  | 'self_incriminating'
  | 'implausible_timeline';

// ============================================================================
// v1 Lite Axis Types
// ============================================================================

/**
 * How the evidence was obtained/controlled.
 */
export type ControlPath = 'manual' | 'automation' | 'remote' | 'unknown';

/**
 * What kind of claim the evidence makes.
 */
export type ClaimShape = 'absence' | 'positive' | 'attribution' | 'integrity';

/**
 * The underlying data source for independence computation.
 * Keep this list small and consistent - no creative strings.
 */
export type SignalRoot =
  | 'koa_cloud'
  | 'phone_os'
  | 'router_net'
  | 'device_firmware'
  | 'camera_storage'
  | 'wearable_health'
  | 'human_partner'
  | 'human_neighbor'
  | 'human_self'
  | 'receipt_photo'
  | 'unknown';

/**
 * Why a lie is tempting from an axis perspective.
 */
export type TrapAxis =
  | 'coverage'      // Lie patches a coverage gap
  | 'independence'  // Lie adds source diversity
  | 'control_path'  // Lie offers convenient automation/remote alibi
  | 'claim_shape';  // Lie uses seductive absence/integrity claim

/**
 * Groups of related signal roots for independence computation.
 * Same group = related but not identical.
 * Same root = strongly correlated (single point of failure).
 */
export type SignalRootGroup = 'cloud' | 'device' | 'network' | 'human' | 'physical' | 'unknown';
