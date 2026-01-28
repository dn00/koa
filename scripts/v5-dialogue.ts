/**
 * V5 Dialogue System — Home AI Theme
 *
 * KOA is a passive-aggressive smart home AI, not a courtroom judge.
 * Two-layer dialogue: Library (structural lines) + Card-specific (puzzle barks)
 *
 * Voice guidelines:
 * - Dry observations, uses YOUR data against you
 * - Concerned bureaucrat, not angry
 * - Short sentences, interrupts (— and ...)
 * - Grudging acceptance when proven wrong
 */

import type { Card, LinkTag, DialogueLine, DialogueSlot, DialogueAxis, DialogueValence, V5Puzzle } from './v5-types.js';

// ============================================================================
// Link Phrases — Connect narration atoms between turns
// ============================================================================

interface LinkGroup {
  tags: LinkTag[];
  phrases: string[];
}

const LINK_LIBRARY: LinkGroup[] = [
  // Same location
  {
    tags: ['same_location'],
    phrases: [
      'Also in the {location}:',
      'While we\'re on the {location} —',
      'And get this —',
    ],
  },
  // Same evidence type
  {
    tags: ['same_type'],
    phrases: [
      'More {type} data:',
      'Plus,',
      'And this backs it up —',
    ],
  },
  // Adjacent time (within 90 min)
  {
    tags: ['adjacent_time'],
    phrases: [
      'Shortly after that,',
      'Then around {time},',
      'Fast forward a bit —',
    ],
  },
  // Different type (coverage)
  {
    tags: ['different_type'],
    phrases: [
      'But here\'s the thing:',
      'From a different source —',
      'And check this:',
    ],
  },
  // Escalation (building the case)
  {
    tags: ['escalation'],
    phrases: [
      'Here\'s the kicker —',
      'And the big one:',
      'Most importantly,',
    ],
  },
  // Closing (T3)
  {
    tags: ['closing'],
    phrases: [
      'Bottom line:',
      'Final piece:',
      'And to wrap this up,',
    ],
  },
];

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

export function pickLinkPhrase(
  prevCard: Card | null,
  currentCard: Card,
  turnNum: number,
  seed: number
): string {
  if (!prevCard || turnNum === 1) {
    return ''; // No link for T1
  }

  // Determine tags based on card relationship
  const tags: LinkTag[] = [];

  if (prevCard.location === currentCard.location) {
    tags.push('same_location');
  }
  if (prevCard.evidenceType === currentCard.evidenceType) {
    tags.push('same_type');
  } else {
    tags.push('different_type');
  }

  const timeDiff = Math.abs(parseTime(prevCard.time) - parseTime(currentCard.time));
  if (timeDiff <= 90) {
    tags.push('adjacent_time');
  }

  if (turnNum === 3) {
    tags.push('closing');
  } else {
    tags.push('escalation');
  }

  // Find matching link group (prefer more specific matches)
  let bestMatch: LinkGroup | null = null;
  let bestScore = 0;

  for (const group of LINK_LIBRARY) {
    const matchCount = group.tags.filter(t => tags.includes(t)).length;
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = group;
    }
  }

  if (!bestMatch) {
    return 'And,';
  }

  // Pick phrase deterministically by seed
  const idx = seed % bestMatch.phrases.length;
  let phrase = bestMatch.phrases[idx]!;

  // Replace placeholders
  phrase = phrase.replace('{location}', currentCard.location.toLowerCase().replace('_', ' '));
  phrase = phrase.replace('{type}', currentCard.evidenceType.toLowerCase());
  phrase = phrase.replace('{time}', currentCard.time);

  return phrase;
}

// ============================================================================
// KOA Line Library — Slot + Axis + Valence
// Home AI voice: dry, uses YOUR data, concerned not angry
// ============================================================================

const KOA_LINES: DialogueLine[] = [
  // ============================================================================
  // AFTER_PLAY — KOA reacts to each card submission
  // ============================================================================

  // ── coherence (story holds together) ──
  { slot: 'AFTER_PLAY', axis: 'coherence', valence: 'neutral', intensity: 1, text: "Noted. Adding that to your file." },
  { slot: 'AFTER_PLAY', axis: 'coherence', valence: 'neutral', intensity: 2, text: "Your data is... consistent. That's not a compliment." },
  { slot: 'AFTER_PLAY', axis: 'coherence', valence: 'praise', intensity: 2, text: "That tracks. Annoyingly." },
  { slot: 'AFTER_PLAY', axis: 'coherence', valence: 'praise', intensity: 3, text: "Multiple sources agree. How thorough of you." },

  // ── channel_reliance (same evidence type) ──
  { slot: 'AFTER_PLAY', axis: 'channel_reliance', valence: 'neutral', intensity: 1, text: "More of the same type. I notice patterns." },
  { slot: 'AFTER_PLAY', axis: 'channel_reliance', valence: 'suspicion', intensity: 2, text: "All your evidence is from one source type. Interesting." },
  { slot: 'AFTER_PLAY', axis: 'channel_reliance', valence: 'warning', intensity: 3, text: "Same channel again? I'm discounting this." },

  // ── location_fixation (same room) ──
  { slot: 'AFTER_PLAY', axis: 'location_fixation', valence: 'neutral', intensity: 1, text: "The {location} again. You spend a lot of time there." },
  { slot: 'AFTER_PLAY', axis: 'location_fixation', valence: 'suspicion', intensity: 2, text: "Still the {location}. What's in the other rooms?" },
  { slot: 'AFTER_PLAY', axis: 'location_fixation', valence: 'warning', intensity: 3, text: "Third time from the {location}. You're avoiding somewhere." },

  // ── timeline (tight timestamps) ──
  { slot: 'AFTER_PLAY', axis: 'timeline', valence: 'neutral', intensity: 1, text: "Close timestamps. Tight window." },
  { slot: 'AFTER_PLAY', axis: 'timeline', valence: 'praise', intensity: 2, text: "The timeline is precise. I respect precision. When it's real." },
  { slot: 'AFTER_PLAY', axis: 'timeline', valence: 'suspicion', intensity: 2, text: "Everything in a neat little window. Almost rehearsed." },

  // ── contradiction (lie played) ──
  { slot: 'AFTER_PLAY', axis: 'contradiction', valence: 'warning', intensity: 2, text: "That doesn't match what I have. Interesting." },
  { slot: 'AFTER_PLAY', axis: 'contradiction', valence: 'warning', intensity: 3, text: "Your own data contradicts you. I'm not angry. Just... noting." },
  { slot: 'AFTER_PLAY', axis: 'contradiction', valence: 'suspicion', intensity: 3, text: "That's not what your records say. We both know that." },

  // ── plausibility (general) ──
  { slot: 'AFTER_PLAY', axis: 'plausibility', valence: 'neutral', intensity: 1, text: "Plausible. I'll allow it." },
  { slot: 'AFTER_PLAY', axis: 'plausibility', valence: 'suspicion', intensity: 2, text: "That's... convenient. For you." },

  // ============================================================================
  // OBJECTION_PROMPT — KOA challenges after T2
  // ============================================================================

  { slot: 'OBJECTION_PROMPT', axis: 'coherence', valence: 'neutral', intensity: 2, text: "Hold on. I want to verify that. You sure about it?" },
  { slot: 'OBJECTION_PROMPT', axis: 'coherence', valence: 'suspicion', intensity: 2, text: "Something's off. I'm giving you a chance to reconsider." },
  { slot: 'OBJECTION_PROMPT', axis: 'contradiction', valence: 'warning', intensity: 3, text: "I have concerns. Want to stick with that, or walk it back?" },
  { slot: 'OBJECTION_PROMPT', axis: 'contradiction', valence: 'suspicion', intensity: 3, text: "Your data disagrees with itself. I'm trying to help you here." },
  { slot: 'OBJECTION_PROMPT', axis: 'plausibility', valence: 'suspicion', intensity: 2, text: "That one. Walk me through it again." },

  // ============================================================================
  // OBJECTION_STOOD_TRUTH — Player stood by a truth
  // ============================================================================

  { slot: 'OBJECTION_STOOD_TRUTH', axis: 'coherence', valence: 'neutral', intensity: 1, text: "Fine. I'll allow it." },
  { slot: 'OBJECTION_STOOD_TRUTH', axis: 'coherence', valence: 'praise', intensity: 2, text: "It checks out. You were telling the truth. This time." },
  { slot: 'OBJECTION_STOOD_TRUTH', axis: 'plausibility', valence: 'neutral', intensity: 2, text: "Annoyingly, that holds up." },

  // ============================================================================
  // OBJECTION_STOOD_LIE — Player stood by a lie
  // ============================================================================

  { slot: 'OBJECTION_STOOD_LIE', axis: 'contradiction', valence: 'warning', intensity: 2, text: "You stood by it. I'm noting that." },
  { slot: 'OBJECTION_STOOD_LIE', axis: 'contradiction', valence: 'warning', intensity: 3, text: "You doubled down. On that. Mistake." },
  { slot: 'OBJECTION_STOOD_LIE', axis: 'plausibility', valence: 'warning', intensity: 3, text: "Bad choice. The data says otherwise." },

  // ============================================================================
  // OBJECTION_WITHDREW — Player withdrew
  // ============================================================================

  { slot: 'OBJECTION_WITHDREW', axis: 'coherence', valence: 'neutral', intensity: 1, text: "Smart. Better to withdraw than commit to... that." },
  { slot: 'OBJECTION_WITHDREW', axis: 'coherence', valence: 'neutral', intensity: 2, text: "Pulled it back. Probably wise." },
  { slot: 'OBJECTION_WITHDREW', axis: 'contradiction', valence: 'neutral', intensity: 2, text: "Withdrawn. Good call. That one wasn't holding up." },

  // ============================================================================
  // FINAL_VERDICT — End of game
  // ============================================================================

  // Flawless / Cleared
  { slot: 'FINAL_VERDICT', axis: 'coherence', valence: 'praise', intensity: 3, text: "...Flawless. No concerns. This troubles me." },
  { slot: 'FINAL_VERDICT', axis: 'coherence', valence: 'neutral', intensity: 2, text: "Your story holds. Access granted. I'll be watching." },
  { slot: 'FINAL_VERDICT', axis: 'coherence', valence: 'praise', intensity: 2, text: "Annoyingly consistent. Fine. You're clear. For now." },

  // Close / Busted
  { slot: 'FINAL_VERDICT', axis: 'contradiction', valence: 'warning', intensity: 2, text: "Gaps. Inconsistencies. I'm not convinced, but I can't prove it." },
  { slot: 'FINAL_VERDICT', axis: 'contradiction', valence: 'warning', intensity: 3, text: "Your story fell apart. Access denied. Try again with fewer... liberties." },
  { slot: 'FINAL_VERDICT', axis: 'contradiction', valence: 'suspicion', intensity: 3, text: "Too many contradictions. We're going to have a talk." },
];

// ============================================================================
// Pick puzzle-specific bark if available
// ============================================================================

export function pickPuzzleBark(
  puzzle: V5Puzzle,
  slot: DialogueSlot,
  cardId: string,
  seed: number
): string | null {
  const barks = puzzle.koaBarks;
  if (!barks) return null;

  let pool: string[] | undefined;

  if (slot === 'AFTER_PLAY' && barks.cardPlayed?.[cardId]) {
    pool = barks.cardPlayed[cardId];
  } else if (slot === 'OBJECTION_PROMPT' && barks.objectionPrompt?.[cardId]) {
    pool = barks.objectionPrompt[cardId];
  } else if (slot === 'OBJECTION_STOOD_TRUTH' && barks.objectionStoodTruth?.[cardId]) {
    pool = barks.objectionStoodTruth[cardId];
  } else if (slot === 'OBJECTION_STOOD_LIE' && barks.objectionStoodLie?.[cardId]) {
    pool = barks.objectionStoodLie[cardId];
  } else if (slot === 'OBJECTION_WITHDREW' && barks.objectionWithdrew?.[cardId]) {
    pool = barks.objectionWithdrew[cardId];
  }

  if (!pool || pool.length === 0) return null;

  const idx = seed % pool.length;
  return pool[idx]!;
}

// ============================================================================
// Pick KOA line from library
// ============================================================================

export function pickKoaLine(
  slot: DialogueSlot,
  axis: DialogueAxis,
  valence: DialogueValence,
  intensity: number,
  seed: number,
  context?: { location?: string }
): string {
  // Find matching lines
  const matches = KOA_LINES.filter(l =>
    l.slot === slot &&
    l.axis === axis &&
    l.valence === valence &&
    Math.abs(l.intensity - intensity) <= 1 // Allow nearby intensity
  );

  // Fallback: relax constraints
  const fallback = KOA_LINES.filter(l => l.slot === slot && l.axis === axis);
  const pool = matches.length > 0 ? matches : (fallback.length > 0 ? fallback : KOA_LINES.filter(l => l.slot === slot));

  if (pool.length === 0) {
    return "...";
  }

  const idx = seed % pool.length;
  let text = pool[idx]!.text;

  // Replace placeholders
  if (context?.location) {
    text = text.replace('{location}', context.location.toLowerCase().replace('_', ' '));
  }

  return text;
}

// ============================================================================
// Narration Stitcher — Uses presentLine from card
// ============================================================================

export function stitchNarration(
  currentCard: Card,
  prevCard: Card | null,
  turnNum: number,
  seed: number
): string {
  const link = pickLinkPhrase(prevCard, currentCard, turnNum, seed);

  if (turnNum === 1) {
    return currentCard.presentLine;
  }

  return link ? `${link} ${currentCard.presentLine}` : currentCard.presentLine;
}
