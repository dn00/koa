/**
 * System-Level KOA Barks
 *
 * Global responses for game mechanics (type tax, etc.) that work across all puzzles.
 * These are KOA's snarky commentary on player behavior, not puzzle-specific content.
 *
 * NOTE: As of the Expression-Based Penalty Feedback System (see koa-mini-spec.md §6.4),
 * type tax feedback is handled via:
 * - KOA's expression/mood during gameplay (DISAPPOINTED)
 * - Hints on the verdict screen
 *
 * These barks are kept for potential future use (e.g., tutorial, advanced mode tooltips)
 * but are NOT used during normal gameplay to avoid awkward bark combinations.
 */

/**
 * Type tax barks - triggered when player plays same evidence type consecutively.
 * {type} is replaced with the evidence type (e.g., "DIGITAL", "SENSOR").
 */
export const TYPE_TAX_BARKS: readonly string[] = [
  "Oh good, more {type}. I was worried you'd surprise me.",
  "{type} again? Did your other evidence call in sick?",
  "Two {type} in a row. Bold strategy. Wrong, but bold.",
  "Ah yes, the classic '{type} twice' defense. Historic failure rate.",
  "I'm sensing a theme. Unfortunately, so is my credibility algorithm.",
  "{type}, {type}... are we doing a bit?",
  "Same type, same problem. My interest is declining.",
  "You know there are other evidence types, right? Just checking.",
  "Repetition doesn't make it more true. I checked.",
  "Déjà vu. And not the fun kind.",
  "Copy-paste defense. Noted and penalized.",
  "I admire the commitment to monotony.",
  "One-trick pony detected. Adjusting expectations.",
  "Evidence diversity: failing. Just like this defense.",
  "Recycling is great for the planet. Less great for alibis.",
  "My pattern recognition is tingling. That's not a compliment.",
];

/**
 * Pick a random bark from the array, replacing {type} placeholder.
 *
 * @param barks - Array of bark templates
 * @param evidenceType - The evidence type to insert
 * @param seed - Optional seed for deterministic selection
 * @returns Formatted bark string
 */
export function pickTypeTaxBark(
  evidenceType: string,
  seed?: number
): string {
  const index = seed !== undefined
    ? Math.abs(seed) % TYPE_TAX_BARKS.length
    : Math.floor(Math.random() * TYPE_TAX_BARKS.length);

  const bark = TYPE_TAX_BARKS[index] ?? TYPE_TAX_BARKS[0]!;
  return bark.replace(/\{type\}/g, evidenceType);
}

/**
 * All system barks for export.
 * Organized by trigger type for easy access.
 */
export const SYSTEM_BARKS = {
  typeTax: TYPE_TAX_BARKS,
} as const;
