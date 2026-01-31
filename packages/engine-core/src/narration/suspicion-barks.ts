/**
 * T2 Suspicion Bark Templates
 *
 * Shown after the sequence bark on Turn 2.
 * Must be non-eliminative: only reference dimension labels, never card names or facts.
 *
 * Voice: KOA is terse, observational, slightly ominous. Lets statements hang.
 * No explanations, no subtitles - just the observation.
 */

import type { ConcernKey } from '../resolver/v5/concern.js';

// Re-export ConcernKey for consumers of this module
export type { ConcernKey } from '../resolver/v5/concern.js';

/**
 * T2 suspicion lines by concern key.
 * Shown after sequence bark completes.
 * Must only reference dimension labels, never card names or facts.
 */
export const suspicionLines: Record<ConcernKey, string> = {
  same_system: "Same system vouching twice. Interesting.",
  automation_heavy: "Lot of automation doing the work for you.",
  manual_heavy: "Two manual actions. Interesting commitment.",
  remote_heavy: "Everything happening remotely. Convenient.",
  absence_heavy: "Two stories about what didn't happen.",
  attribution_heavy: "Blaming a lot of other things tonight.",
  integrity_heavy: "Two claims about system integrity. Noted.",
  all_digital: "All device logs so far. Where are the humans?",
  all_sensor: "Your sensors have opinions tonight.",
  all_testimony: "Humans agreeing with humans. Cozy.",
  all_physical: "Lot of physical evidence. Hands-on night.",
  no_concern: "At least you're mixing your sources.",  // Not displayed, but kept for type completeness
};

/**
 * Get the T2 suspicion text.
 */
export function getSuspicionText(concernKey: ConcernKey): { line: string; subtitle: string | null } {
  return {
    line: suspicionLines[concernKey],
    subtitle: null,  // Subtitles removed - KOA doesn't explain itself
  };
}
