/**
 * Final Audit + Ceiling Bark Templates
 *
 * Used on the Result screen for Final Audit panel and ceiling explanations.
 */

import type { ConcernKey } from './suspicion-barks.js';

// ============================================================================
// Final Audit Line Templates
// ============================================================================

/**
 * Coverage check line.
 */
export const coverageLines = {
  complete: "Facts addressed: \u2705 Complete",
  gap: "Facts addressed: \u26a0\ufe0f Gap",
} as const;

/**
 * Independence check line.
 */
export const independenceLines = {
  diverse: "Source diversity: \u2705 Varied",
  correlated: "Source diversity: \u26a0\ufe0f Correlated",
} as const;

/**
 * Concern check line.
 * Uses "After my warning" for actual concerns, "Concern" for no_concern.
 */
export const concernLines = {
  diversified: "After my warning: \u2705 Diversified",
  doubled_down: "After my warning: \u26a0\ufe0f Doubled down",
  balanced: "Concern: \u2705 Balanced",  // Used when no_concern
} as const;

/**
 * Get the appropriate concern line.
 */
export function getConcernLine(concernHit: boolean, noConcern: boolean): string {
  if (noConcern) return concernLines.balanced;
  return concernHit ? concernLines.doubled_down : concernLines.diversified;
}

// ============================================================================
// Ceiling Explanation Templates
// ============================================================================

export type CeilingBlocker = 'concern' | 'correlation' | 'both';

/**
 * Ceiling explanations for CLEARED-not-FLAWLESS.
 * Shown on Result screen when player got all truths but not FLAWLESS.
 */
export const ceilingExplanations: Record<CeilingBlocker, string> = {
  concern: "Your story checks out. But you leaned hard on {dimension} after I flagged it. No gold star.",
  correlation: "Your story checks out. But your sources all trace back to the same place. Noted.",
  both: "Your story checks out. But you doubled down AND your sources overlap. I'm watching you.",
};

/**
 * Dimension labels for ceiling explanation interpolation.
 */
export const concernDimensionLabels: Record<string, string> = {
  same_system: "the same system",
  automation_heavy: "automation",
  manual_heavy: "manual actions",
  remote_heavy: "remote access",
  absence_heavy: "absence claims",
  attribution_heavy: "blame patterns",
  integrity_heavy: "integrity claims",
  all_digital: "device logs",
  all_sensor: "sensor data",
  all_testimony: "human testimony",
  all_physical: "physical evidence",
};

/**
 * Get the ceiling explanation with dimension interpolated.
 */
export function getCeilingExplanation(
  blocker: CeilingBlocker,
  concernKey?: ConcernKey | string
): string {
  const template = ceilingExplanations[blocker];
  if (blocker === 'concern' && concernKey) {
    const dimension = concernDimensionLabels[concernKey] || concernKey;
    return template.replace('{dimension}', dimension);
  }
  return template;
}
