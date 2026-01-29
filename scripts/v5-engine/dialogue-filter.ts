/**
 * V5 Dialogue Tagging & Filtering
 *
 * Tags KOA barks for Mini mode filtering.
 * Mini-safe barks discuss axes and patterns without revealing mechanics.
 *
 * Safety principle: Pre-reveal barks must be non-committal.
 * Never say "lie", "false", "fabricated" before reveal.
 */

import type { DialogueSlot, DialogueAxis, DialogueValence, DialogueLine } from '../v5-types.js';
import type { BarkFilter } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Tags for classifying bark safety for Mini mode.
 * - 'mini-safe': No mechanic mentions, safe for Mini
 * - 'mentions-score': References points, scoring, discount
 * - 'mentions-tax': References type tax specifically
 * - 'mentions-flag': References objection/flag system
 */
export type DialogueTag = 'mini-safe' | 'mentions-score' | 'mentions-tax' | 'mentions-flag';

/**
 * Turn position for bark families.
 * Barks can be specific to T1/T2/T3 or work for any turn.
 */
export type TurnPosition = 'T1' | 'T2' | 'T3' | 'any';

/**
 * DialogueLine extended with tags for filtering.
 */
export interface TaggedDialogueLine extends DialogueLine {
  tags: DialogueTag[];
  turnPosition?: TurnPosition;
}

// ============================================================================
// Tagged KOA Lines
// ============================================================================

/**
 * All KOA lines with safety tags.
 * Conservative tagging: when in doubt, NOT mini-safe.
 */
export const TAGGED_KOA_LINES: TaggedDialogueLine[] = [
  // ============================================================================
  // AFTER_PLAY — KOA reacts to each card submission
  // ============================================================================

  // ── coherence (story holds together) — MINI-SAFE ──
  {
    slot: 'AFTER_PLAY',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 1,
    text: "Noted. Adding that to your file.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 2,
    text: "Your data is... consistent. That's not a compliment.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'coherence',
    valence: 'praise',
    intensity: 2,
    text: "That tracks. Annoyingly.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'coherence',
    valence: 'praise',
    intensity: 3,
    text: "Multiple sources agree. How thorough of you.",
    tags: ['mini-safe'],
  },

  // ── channel_reliance (same evidence type) ──
  {
    slot: 'AFTER_PLAY',
    axis: 'channel_reliance',
    valence: 'neutral',
    intensity: 1,
    text: "More of the same type. I notice patterns.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'channel_reliance',
    valence: 'suspicion',
    intensity: 2,
    text: "All your evidence is from one source type. Interesting.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'channel_reliance',
    valence: 'warning',
    intensity: 3,
    text: "Same channel again? I'm discounting this.",
    tags: ['mentions-score', 'mentions-tax'], // NOT mini-safe
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'channel_reliance',
    valence: 'warning',
    intensity: 3,
    text: "Everything so far lives in logs. If one is wrong, your story tips over.",
    tags: ['mini-safe'], // Axis-level, no mechanics
  },

  // ── location_fixation (same room) ──
  {
    slot: 'AFTER_PLAY',
    axis: 'location_fixation',
    valence: 'neutral',
    intensity: 1,
    text: "The {location} again. You spend a lot of time there.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'location_fixation',
    valence: 'suspicion',
    intensity: 2,
    text: "Still the {location}. What's in the other rooms?",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'location_fixation',
    valence: 'warning',
    intensity: 3,
    text: "Third time from the {location}. You're avoiding somewhere.",
    tags: ['mini-safe'],
  },

  // ── timeline (tight timestamps) ──
  {
    slot: 'AFTER_PLAY',
    axis: 'timeline',
    valence: 'neutral',
    intensity: 1,
    text: "Close timestamps. Tight window.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'timeline',
    valence: 'praise',
    intensity: 2,
    text: "The timeline is precise. I respect precision. When it's real.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'timeline',
    valence: 'suspicion',
    intensity: 2,
    text: "Everything in a neat little window. Almost rehearsed.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'timeline',
    valence: 'suspicion',
    intensity: 2,
    text: "All your cards are crammed between 2:50 and 3:05am. Convenient.",
    tags: ['mini-safe'],
  },

  // ── contradiction (lie played) — NOT mini-safe, reveals truth/lie ──
  {
    slot: 'AFTER_PLAY',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 2,
    text: "That doesn't match what I have. Interesting.",
    tags: ['mini-safe'], // Vague enough, doesn't say "lie"
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 3,
    text: "Your own data contradicts you. I'm not angry. Just... noting.",
    tags: ['mini-safe'], // Mentions contradiction but not score
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'contradiction',
    valence: 'suspicion',
    intensity: 3,
    text: "That's not what your records say. We both know that.",
    tags: ['mini-safe'],
  },

  // ── plausibility (general) ──
  {
    slot: 'AFTER_PLAY',
    axis: 'plausibility',
    valence: 'neutral',
    intensity: 1,
    text: "Plausible. I'll allow it.",
    tags: ['mini-safe'],
  },
  {
    slot: 'AFTER_PLAY',
    axis: 'plausibility',
    valence: 'suspicion',
    intensity: 2,
    text: "That's... convenient. For you.",
    tags: ['mini-safe'],
  },

  // ============================================================================
  // OBJECTION_PROMPT — KOA challenges after T2
  // ============================================================================

  {
    slot: 'OBJECTION_PROMPT',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 2,
    text: "Hold on. I want to verify that. You sure about it?",
    tags: ['mini-safe', 'mentions-flag'],
  },
  {
    slot: 'OBJECTION_PROMPT',
    axis: 'coherence',
    valence: 'suspicion',
    intensity: 2,
    text: "Something's off. I'm giving you a chance to reconsider.",
    tags: ['mini-safe', 'mentions-flag'],
  },
  {
    slot: 'OBJECTION_PROMPT',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 3,
    text: "I have concerns. Want to stick with that, or walk it back?",
    tags: ['mentions-flag'], // Implies choice mechanic
  },
  {
    slot: 'OBJECTION_PROMPT',
    axis: 'contradiction',
    valence: 'suspicion',
    intensity: 3,
    text: "Your data disagrees with itself. I'm trying to help you here.",
    tags: ['mini-safe'],
  },
  {
    slot: 'OBJECTION_PROMPT',
    axis: 'plausibility',
    valence: 'suspicion',
    intensity: 2,
    text: "That one. Walk me through it again.",
    tags: ['mini-safe'],
  },

  // ============================================================================
  // OBJECTION_STOOD_TRUTH — Player stood by a truth
  // ============================================================================

  {
    slot: 'OBJECTION_STOOD_TRUTH',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 1,
    text: "Fine. I'll allow it.",
    tags: ['mini-safe'],
  },
  {
    slot: 'OBJECTION_STOOD_TRUTH',
    axis: 'coherence',
    valence: 'praise',
    intensity: 2,
    text: "It checks out. You were telling the truth. This time.",
    tags: ['mentions-score'], // "telling the truth" implies reveal
  },
  {
    slot: 'OBJECTION_STOOD_TRUTH',
    axis: 'plausibility',
    valence: 'neutral',
    intensity: 2,
    text: "Annoyingly, that holds up.",
    tags: ['mini-safe'],
  },

  // ============================================================================
  // OBJECTION_STOOD_LIE — Player stood by a lie
  // ============================================================================

  {
    slot: 'OBJECTION_STOOD_LIE',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 2,
    text: "You stood by it. I'm noting that.",
    tags: ['mentions-score'], // Implies penalty
  },
  {
    slot: 'OBJECTION_STOOD_LIE',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 3,
    text: "You doubled down. On that. Mistake.",
    tags: ['mentions-score'],
  },
  {
    slot: 'OBJECTION_STOOD_LIE',
    axis: 'plausibility',
    valence: 'warning',
    intensity: 3,
    text: "Bad choice. The data says otherwise.",
    tags: ['mentions-score'],
  },

  // ============================================================================
  // OBJECTION_WITHDREW — Player withdrew
  // ============================================================================

  {
    slot: 'OBJECTION_WITHDREW',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 1,
    text: "Smart. Better to withdraw than commit to... that.",
    tags: ['mentions-flag'], // Implies mechanic knowledge
  },
  {
    slot: 'OBJECTION_WITHDREW',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 2,
    text: "Pulled it back. Probably wise.",
    tags: ['mini-safe'],
  },
  {
    slot: 'OBJECTION_WITHDREW',
    axis: 'contradiction',
    valence: 'neutral',
    intensity: 2,
    text: "Withdrawn. Good call. That one wasn't holding up.",
    tags: ['mini-safe'],
  },

  // ============================================================================
  // FINAL_VERDICT — End of game
  // ============================================================================

  // Flawless / Cleared
  {
    slot: 'FINAL_VERDICT',
    axis: 'coherence',
    valence: 'praise',
    intensity: 3,
    text: "...Flawless. No concerns. This troubles me.",
    tags: ['mini-safe'],
  },
  {
    slot: 'FINAL_VERDICT',
    axis: 'coherence',
    valence: 'neutral',
    intensity: 2,
    text: "Your story holds. Access granted. I'll be watching.",
    tags: ['mini-safe'],
  },
  {
    slot: 'FINAL_VERDICT',
    axis: 'coherence',
    valence: 'praise',
    intensity: 2,
    text: "Annoyingly consistent. Fine. You're clear. For now.",
    tags: ['mini-safe'],
  },

  // Close / Busted
  {
    slot: 'FINAL_VERDICT',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 2,
    text: "Gaps. Inconsistencies. I'm not convinced, but I can't prove it.",
    tags: ['mini-safe'],
  },
  {
    slot: 'FINAL_VERDICT',
    axis: 'contradiction',
    valence: 'warning',
    intensity: 3,
    text: "Your story fell apart. Access denied. Try again with fewer... liberties.",
    tags: ['mini-safe'],
  },
  {
    slot: 'FINAL_VERDICT',
    axis: 'contradiction',
    valence: 'suspicion',
    intensity: 3,
    text: "Too many contradictions. We're going to have a talk.",
    tags: ['mini-safe'],
  },
];

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Filter barks based on mode's bark filter.
 *
 * @param lines Array of tagged dialogue lines
 * @param filter 'mini-safe' to filter, 'all' to keep all
 * @returns Filtered array
 */
export function filterBarksForMode(
  lines: TaggedDialogueLine[],
  filter: BarkFilter
): TaggedDialogueLine[] {
  if (filter === 'all') {
    return lines;
  }
  return lines.filter(l => l.tags.includes('mini-safe'));
}

/**
 * Pick a KOA line with mode-aware filtering.
 *
 * @param slot Dialogue slot
 * @param axis Dialogue axis
 * @param valence Emotional valence
 * @param intensity Intensity level
 * @param seed Random seed
 * @param filter Bark filter mode
 * @param context Optional context for placeholders
 * @returns Selected line text
 */
export function pickKoaLineFiltered(
  slot: DialogueSlot,
  axis: DialogueAxis,
  valence: DialogueValence,
  intensity: number,
  seed: number,
  filter: BarkFilter,
  context?: { location?: string }
): string {
  // Apply filter
  const filtered = filterBarksForMode(TAGGED_KOA_LINES, filter);

  // Find matching lines
  const matches = filtered.filter(l =>
    l.slot === slot &&
    l.axis === axis &&
    l.valence === valence &&
    Math.abs(l.intensity - intensity) <= 1
  );

  // Fallback: relax constraints
  const fallback = filtered.filter(l => l.slot === slot && l.axis === axis);
  const slotFallback = filtered.filter(l => l.slot === slot);

  const pool = matches.length > 0
    ? matches
    : (fallback.length > 0 ? fallback : slotFallback);

  if (pool.length === 0) {
    return "...";
  }

  const idx = seed % pool.length;
  let text = pool[idx].text;

  // Replace placeholders
  if (context?.location) {
    text = text.replace('{location}', context.location.toLowerCase().replace('_', ' '));
  }

  return text;
}
