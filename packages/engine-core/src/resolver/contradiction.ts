/**
 * Contradiction detection for evidence submissions.
 * Task 004: Contradiction Detection
 *
 * Detects MINOR and MAJOR contradictions between cards based on claims.
 */

import type { EvidenceCard, CardId } from '../types/index.js';
import { ContradictionSeverity } from '../types/index.js';

/**
 * Result of contradiction check between two cards.
 */
export interface ContradictionResult {
  readonly severity: ContradictionSeverity;
  readonly type: 'STATE_CONFLICT' | 'LOCATION_CONFLICT';
  readonly card1Id: CardId;
  readonly card2Id: CardId;
  readonly description: string;
}

/**
 * Parsed time in minutes from midnight.
 */
interface ParsedTime {
  readonly minutes: number;
}

/**
 * Parsed time range.
 */
interface ParsedTimeRange {
  readonly start: number; // minutes from midnight
  readonly end: number; // minutes from midnight
}

/**
 * Parse a time string like "2:05am" or "14:30" to minutes from midnight.
 * Uses integer math only (Invariant I1).
 */
export function parseTime(timeStr: string): ParsedTime | null {
  // Handle "HH:MMam/pm" format
  const match12 = timeStr.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (match12) {
    const [, hourStr, minStr, period] = match12;
    let hours = parseInt(hourStr!, 10);
    const mins = parseInt(minStr!, 10);

    if (hours < 1 || hours > 12 || mins < 0 || mins > 59) {
      return null;
    }

    // Convert to 24h
    if (period!.toLowerCase() === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period!.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }

    return { minutes: hours * 60 + mins };
  }

  // Handle "HH:MM" 24h format
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const [, hourStr, minStr] = match24;
    const hours = parseInt(hourStr!, 10);
    const mins = parseInt(minStr!, 10);

    if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
      return null;
    }

    return { minutes: hours * 60 + mins };
  }

  return null;
}

/**
 * Parse a time range string like "2:05am-2:10am" to start/end minutes.
 */
export function parseTimeRange(rangeStr: string): ParsedTimeRange | null {
  const parts = rangeStr.split('-');
  if (parts.length !== 2) {
    return null;
  }

  const start = parseTime(parts[0]!.trim());
  const end = parseTime(parts[1]!.trim());

  if (!start || !end) {
    return null;
  }

  return { start: start.minutes, end: end.minutes };
}

/**
 * Calculate the gap in minutes between the end of range1 and start of range2.
 * Returns the minimum gap regardless of order.
 * Uses integer math only.
 */
export function getTimeGapMinutes(range1: ParsedTimeRange, range2: ParsedTimeRange): number {
  // Gap from range1.end to range2.start
  const gap1 = range2.start - range1.end;
  // Gap from range2.end to range1.start
  const gap2 = range1.start - range2.end;

  // If ranges overlap, gap is 0
  if (gap1 < 0 && gap2 < 0) {
    return 0;
  }

  // Return the minimum positive gap
  if (gap1 >= 0 && gap2 >= 0) {
    return Math.min(gap1, gap2);
  }

  return gap1 >= 0 ? gap1 : gap2;
}

/**
 * Conflicting state pairs and their time thresholds.
 * [state1, state2, majorThresholdMins, minorThresholdMins]
 */
const STATE_CONFLICTS: readonly [string, string, number, number][] = [
  // ASLEEP→AWAKE: <3min = MAJOR, 3-10min = MINOR
  ['ASLEEP', 'AWAKE', 3, 10],
  ['ASLEEP', 'ALERT', 3, 10],
  ['ASLEEP', 'ACTIVE', 3, 10],
];

/**
 * Location conflict thresholds.
 * Travel times in minutes for different location pairs.
 * [major threshold, minor threshold]
 */
const LOCATION_THRESHOLDS = {
  // Same building different rooms: <1min (30sec rounded) = MAJOR
  ADJACENT_ROOMS: { major: 1, minor: 2 },
  // HOME→GYM: <20min = MAJOR, 20-30min = MINOR
  HOME_GYM: { major: 20, minor: 30 },
  // Default for far locations
  DEFAULT: { major: 20, minor: 30 },
} as const;

/**
 * Adjacent room pairs (same building).
 */
const ADJACENT_ROOMS = new Set([
  'living room|kitchen',
  'living room|bedroom',
  'kitchen|bedroom',
  'bathroom|bedroom',
  'bathroom|hallway',
  'hallway|living room',
]);

/**
 * Check if two locations are adjacent rooms.
 */
function areAdjacentRooms(loc1: string, loc2: string): boolean {
  const key1 = `${loc1.toLowerCase()}|${loc2.toLowerCase()}`;
  const key2 = `${loc2.toLowerCase()}|${loc1.toLowerCase()}`;
  return ADJACENT_ROOMS.has(key1) || ADJACENT_ROOMS.has(key2);
}

/**
 * Check if locations suggest home-to-gym travel.
 */
function isHomeGymTravel(loc1: string, loc2: string): boolean {
  const l1 = loc1.toLowerCase();
  const l2 = loc2.toLowerCase();
  const homeLocations = ['home', 'living room', 'kitchen', 'bedroom', 'bathroom'];
  const gymLocations = ['gym', 'fitness center'];

  const isHome1 = homeLocations.some((h) => l1.includes(h));
  const isGym1 = gymLocations.some((g) => l1.includes(g));
  const isHome2 = homeLocations.some((h) => l2.includes(h));
  const isGym2 = gymLocations.some((g) => l2.includes(g));

  return (isHome1 && isGym2) || (isGym1 && isHome2);
}

/**
 * Check for state conflict between two cards.
 */
function checkStateConflict(
  card1: EvidenceCard,
  card2: EvidenceCard
): ContradictionResult | null {
  const state1 = card1.claims.state?.toUpperCase();
  const state2 = card2.claims.state?.toUpperCase();

  if (!state1 || !state2 || state1 === state2) {
    return null;
  }

  const time1 = card1.claims.timeRange ? parseTimeRange(card1.claims.timeRange) : null;
  const time2 = card2.claims.timeRange ? parseTimeRange(card2.claims.timeRange) : null;

  if (!time1 || !time2) {
    return null;
  }

  const gap = getTimeGapMinutes(time1, time2);

  // Check each state conflict pair
  for (const [s1, s2, majorThreshold, minorThreshold] of STATE_CONFLICTS) {
    const isConflict =
      (state1 === s1 && state2 === s2) || (state1 === s2 && state2 === s1);

    if (isConflict) {
      if (gap < majorThreshold) {
        return {
          severity: ContradictionSeverity.MAJOR,
          type: 'STATE_CONFLICT',
          card1Id: card1.id,
          card2Id: card2.id,
          description: `${state1} to ${state2} in ${gap} minutes is impossible`,
        };
      } else if (gap <= minorThreshold) {
        return {
          severity: ContradictionSeverity.MINOR,
          type: 'STATE_CONFLICT',
          card1Id: card1.id,
          card2Id: card2.id,
          description: `${state1} to ${state2} in ${gap} minutes is suspicious`,
        };
      }
    }
  }

  return null;
}

/**
 * Check for location conflict between two cards.
 */
function checkLocationConflict(
  card1: EvidenceCard,
  card2: EvidenceCard
): ContradictionResult | null {
  const loc1 = card1.claims.location;
  const loc2 = card2.claims.location;

  if (!loc1 || !loc2 || loc1.toLowerCase() === loc2.toLowerCase()) {
    return null;
  }

  const time1 = card1.claims.timeRange ? parseTimeRange(card1.claims.timeRange) : null;
  const time2 = card2.claims.timeRange ? parseTimeRange(card2.claims.timeRange) : null;

  if (!time1 || !time2) {
    return null;
  }

  const gap = getTimeGapMinutes(time1, time2);

  // Determine thresholds based on location pair
  let thresholds: { major: number; minor: number };

  if (areAdjacentRooms(loc1, loc2)) {
    thresholds = LOCATION_THRESHOLDS.ADJACENT_ROOMS;
  } else if (isHomeGymTravel(loc1, loc2)) {
    thresholds = LOCATION_THRESHOLDS.HOME_GYM;
  } else {
    thresholds = LOCATION_THRESHOLDS.DEFAULT;
  }

  if (gap < thresholds.major) {
    return {
      severity: ContradictionSeverity.MAJOR,
      type: 'LOCATION_CONFLICT',
      card1Id: card1.id,
      card2Id: card2.id,
      description: `Travel from ${loc1} to ${loc2} in ${gap} minutes is impossible`,
    };
  } else if (gap <= thresholds.minor) {
    return {
      severity: ContradictionSeverity.MINOR,
      type: 'LOCATION_CONFLICT',
      card1Id: card1.id,
      card2Id: card2.id,
      description: `Travel from ${loc1} to ${loc2} in ${gap} minutes is suspicious`,
    };
  }

  return null;
}

/**
 * Check for contradictions between a pair of cards.
 * Returns the most severe contradiction found.
 */
function checkPairContradiction(
  card1: EvidenceCard,
  card2: EvidenceCard
): ContradictionResult | null {
  // Check state conflict first (potentially more severe)
  const stateResult = checkStateConflict(card1, card2);
  if (stateResult) {
    return stateResult;
  }

  // Check location conflict
  const locationResult = checkLocationConflict(card1, card2);
  if (locationResult) {
    return locationResult;
  }

  return null;
}

/**
 * Check for contradictions between a new card and committed story.
 *
 * AC-1: ASLEEP→AWAKE in <3min = MAJOR
 * AC-2: ASLEEP→AWAKE in 3-10min = MINOR
 * AC-3: ASLEEP→AWAKE in >10min = NONE
 * AC-4: HOME→GYM in <20min = MAJOR
 * AC-5: HOME→GYM in 20-30min = MINOR
 * AC-6: Adjacent rooms <30sec = MAJOR
 * AC-7: Return ContradictionSeverity
 * EC-1: Cards with no overlapping claims = NONE
 * EC-2: Same location, different times = NONE
 *
 * @param newCard - The card being submitted
 * @param committedStory - Cards already committed to the story
 * @returns The most severe contradiction found, or null if none
 */
export function detectContradictions(
  newCard: EvidenceCard,
  committedStory: readonly EvidenceCard[]
): ContradictionResult | null {
  let mostSevere: ContradictionResult | null = null;

  for (const committed of committedStory) {
    const result = checkPairContradiction(newCard, committed);
    if (result) {
      // MAJOR is worse than MINOR
      if (!mostSevere || result.severity === ContradictionSeverity.MAJOR) {
        mostSevere = result;
      }
      // If we found MAJOR, no need to continue
      if (result.severity === ContradictionSeverity.MAJOR) {
        break;
      }
    }
  }

  return mostSevere;
}
