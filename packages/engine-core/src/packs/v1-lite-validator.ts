/**
 * V1 Lite Validator - Validation checks for Mini Lite puzzles
 *
 * Implements validation for v1 Lite axis tags, partition rules, and trap checks.
 *
 * Task 401: Tag Presence Checks (V1-V6)
 * Task 402: factTouch Partition Checks (V7-V8)
 * Task 403: Lie Trap Checks (V9-V11)
 */

// Note: Types are defined locally to avoid runtime dependencies
// SignalRoot, ControlPath, ClaimShape, TrapAxis enums are validated via string arrays below

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Single validation check result.
 */
export interface V1LiteCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
  readonly severity: 'error' | 'warn';
}

/**
 * Result of v1 Lite validation.
 */
export interface V1LiteValidationResult {
  readonly passed: boolean;
  readonly checks: readonly V1LiteCheck[];
}

// ============================================================================
// Validation Enums (for runtime checking)
// ============================================================================

const VALID_SIGNAL_ROOTS: readonly string[] = [
  'koa_cloud',
  'phone_os',
  'router_net',
  'device_firmware',
  'camera_storage',
  'wearable_health',
  'human_partner',
  'human_neighbor',
  'human_self',
  'receipt_photo',
  'unknown',
];

const VALID_CONTROL_PATHS: readonly string[] = ['manual', 'automation', 'remote', 'unknown'];

const VALID_CLAIM_SHAPES: readonly string[] = ['absence', 'positive', 'attribution', 'integrity'];

/** Valid trap axis values (for optional runtime validation). */
export const VALID_TRAP_AXES: readonly string[] = [
  'coverage',
  'independence',
  'control_path',
  'claim_shape',
];

// ============================================================================
// Card and LieInfo Types (minimal interface for validation)
// ============================================================================

/**
 * Card interface for validation (minimal fields needed).
 */
export interface V1LiteCard {
  readonly id: string;
  readonly isLie: boolean;
  readonly time?: string;
  readonly factTouch?: number | number[];
  readonly signalRoot?: string;
  readonly controlPath?: string;
  readonly claimShape?: string;
  readonly subsystem?: string;
}

/**
 * LieInfo interface for validation (minimal fields needed).
 */
export interface V1LiteLieInfo {
  readonly cardId: string;
  readonly trapAxis?: string;
  readonly baitReason?: string;
}

// ============================================================================
// Task 401: Tag Presence Checks
// ============================================================================

/**
 * V1: Check all cards have factTouch as scalar 1, 2, or 3.
 */
export function checkFactTouchPresence(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const ft = card.factTouch;

    if (ft === undefined || ft === null) {
      invalid.push(`${card.id}: missing factTouch`);
    } else if (Array.isArray(ft)) {
      invalid.push(`${card.id}: factTouch must be scalar (1, 2, or 3), not array`);
    } else if (typeof ft !== 'number' || ![1, 2, 3].includes(ft)) {
      invalid.push(`${card.id}: factTouch ${ft} not in [1,2,3]`);
    }
  }

  return {
    id: 'V1',
    label: 'factTouch presence and type',
    passed: invalid.length === 0,
    detail: invalid.length === 0 ? 'all cards have valid factTouch' : invalid.join('; '),
    severity: 'error',
  };
}

/**
 * V2: Check all cards have signalRoot from the defined enum.
 */
export function checkSignalRootEnum(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const sr = card.signalRoot;

    if (!sr || sr === '') {
      invalid.push(`${card.id}: missing signalRoot`);
    } else if (!VALID_SIGNAL_ROOTS.includes(sr)) {
      invalid.push(`${card.id}: '${sr}' not in enum`);
    }
  }

  return {
    id: 'V2',
    label: 'signalRoot from enum',
    passed: invalid.length === 0,
    detail: invalid.length === 0 ? 'all cards have valid signalRoot' : invalid.join('; '),
    severity: 'error',
  };
}

/**
 * V3: Check all cards have controlPath from the defined enum.
 */
export function checkControlPathEnum(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const cp = card.controlPath;

    if (!cp || cp === '') {
      invalid.push(`${card.id}: missing controlPath`);
    } else if (!VALID_CONTROL_PATHS.includes(cp)) {
      invalid.push(`${card.id}: '${cp}' not in enum`);
    }
  }

  return {
    id: 'V3',
    label: 'controlPath from enum',
    passed: invalid.length === 0,
    detail: invalid.length === 0 ? 'all cards have valid controlPath' : invalid.join('; '),
    severity: 'error',
  };
}

/**
 * V4: Check all cards have claimShape from the defined enum.
 */
export function checkClaimShapeEnum(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const cs = card.claimShape;

    if (!cs || cs === '') {
      invalid.push(`${card.id}: missing claimShape`);
    } else if (!VALID_CLAIM_SHAPES.includes(cs)) {
      invalid.push(`${card.id}: '${cs}' not in enum`);
    }
  }

  return {
    id: 'V4',
    label: 'claimShape from enum',
    passed: invalid.length === 0,
    detail: invalid.length === 0 ? 'all cards have valid claimShape' : invalid.join('; '),
    severity: 'error',
  };
}

/**
 * V5: Check all cards have subsystem as non-empty string.
 */
export function checkSubsystemPresence(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const ss = card.subsystem;

    if (!ss || ss.trim() === '') {
      invalid.push(card.id);
    }
  }

  return {
    id: 'V5',
    label: 'subsystem non-empty',
    passed: invalid.length === 0,
    detail: invalid.length === 0 ? 'all cards have subsystem' : `missing: ${invalid.join(', ')}`,
    severity: 'error',
  };
}

/**
 * V6: Check Mini has no timestamps (time empty or omitted).
 */
export function checkMiniNoTimestamps(cards: readonly V1LiteCard[]): V1LiteCheck {
  const invalid: string[] = [];

  for (const card of cards) {
    const time = card.time;

    if (time && time.trim() !== '') {
      invalid.push(`${card.id} has timestamp '${time}'`);
    }
  }

  return {
    id: 'V6',
    label: 'Mini no timestamps',
    passed: invalid.length === 0,
    detail:
      invalid.length === 0
        ? 'all cards have empty/omitted time'
        : `${invalid.join('; ')} (Mini must have no timestamps)`,
    severity: 'error',
  };
}

// ============================================================================
// Task 402: factTouch Partition Checks
// ============================================================================

/**
 * V7: Check truths form perfect partition {1, 2, 3}.
 */
export function checkTruthsPartition(cards: readonly V1LiteCard[]): V1LiteCheck {
  const truths = cards.filter((c) => !c.isLie);
  const truthFacts = truths
    .map((t) => t.factTouch)
    .filter((f): f is number => typeof f === 'number' && !Array.isArray(f))
    .sort((a, b) => a - b);

  const truthFactSet = new Set(truthFacts);
  const isPerfectPartition =
    truthFactSet.size === 3 && truthFactSet.has(1) && truthFactSet.has(2) && truthFactSet.has(3);

  if (isPerfectPartition) {
    return {
      id: 'V7',
      label: 'Truths partition',
      passed: true,
      detail: 'truths touch [1,2,3] — perfect partition',
      severity: 'error',
    };
  }

  // Determine what's missing
  const missingFacts = [1, 2, 3].filter((f) => !truthFactSet.has(f));

  return {
    id: 'V7',
    label: 'Truths partition',
    passed: false,
    detail: `truths touch [${truthFacts.join(',')}] — missing: ${missingFacts.join(',')}`,
    severity: 'error',
  };
}

/**
 * V8: Check each fact touched by >= 2 cards.
 */
export function checkFactCoverage(cards: readonly V1LiteCard[]): V1LiteCheck {
  // Count how many cards touch each fact
  const factCoverage = new Map<number, number>();

  for (const card of cards) {
    const ft = card.factTouch;
    if (typeof ft === 'number' && !Array.isArray(ft)) {
      const current = factCoverage.get(ft) || 0;
      factCoverage.set(ft, current + 1);
    }
  }

  // Check each fact is touched by >= 2 cards
  const underCovered: string[] = [];
  for (const fact of [1, 2, 3]) {
    const count = factCoverage.get(fact) || 0;
    if (count < 2) {
      underCovered.push(`fact ${fact} has ${count} card${count === 1 ? '' : 's'} (need 2+)`);
    }
  }

  if (underCovered.length === 0) {
    const counts = [1, 2, 3].map((f) => `${f}=${factCoverage.get(f) || 0}`).join(', ');
    return {
      id: 'V8',
      label: 'Fact coverage',
      passed: true,
      detail: `fact coverage: ${counts} — all >= 2`,
      severity: 'error',
    };
  }

  return {
    id: 'V8',
    label: 'Fact coverage',
    passed: false,
    detail: underCovered.join('; '),
    severity: 'error',
  };
}

// ============================================================================
// Task 403: Lie Trap Checks
// ============================================================================

/**
 * V9: Check all lies have trapAxis.
 */
export function checkLiesTrapAxis(lies: readonly V1LiteLieInfo[]): V1LiteCheck {
  const missing: string[] = [];

  for (const lie of lies) {
    if (!lie.trapAxis || lie.trapAxis.trim() === '') {
      missing.push(lie.cardId);
    }
  }

  return {
    id: 'V9',
    label: 'Lies have trapAxis',
    passed: missing.length === 0,
    detail:
      missing.length === 0 ? `all ${lies.length} lies have trapAxis` : `missing trapAxis: ${missing.join(', ')}`,
    severity: 'error',
  };
}

/**
 * V10: Check all lies have baitReason.
 */
export function checkLiesBaitReason(lies: readonly V1LiteLieInfo[]): V1LiteCheck {
  const missing: string[] = [];

  for (const lie of lies) {
    if (!lie.baitReason || lie.baitReason.trim() === '') {
      missing.push(lie.cardId);
    }
  }

  return {
    id: 'V10',
    label: 'Lies have baitReason',
    passed: missing.length === 0,
    detail:
      missing.length === 0 ? `all ${lies.length} lies have baitReason` : `missing baitReason: ${missing.join(', ')}`,
    severity: 'error',
  };
}

/**
 * V11: Check at least 2 distinct trapAxis values (anti-meta).
 */
export function checkTrapAxisDiversity(lies: readonly V1LiteLieInfo[]): V1LiteCheck {
  const axes = lies
    .map((l) => l.trapAxis)
    .filter((a): a is string => !!a && a.trim() !== '');

  const uniqueAxes = [...new Set(axes)].sort();

  if (uniqueAxes.length >= 2) {
    return {
      id: 'V11',
      label: 'Trap axis diversity (2+ distinct)',
      passed: true,
      detail: `${uniqueAxes.length} distinct trapAxis: ${uniqueAxes.join(', ')}`,
      severity: 'error',
    };
  }

  return {
    id: 'V11',
    label: 'Trap axis diversity (2+ distinct)',
    passed: false,
    detail: `only ${uniqueAxes.length} trapAxis: [${uniqueAxes.join(', ')}] — need 2+ distinct`,
    severity: 'error',
  };
}

// ============================================================================
// Task 404: P4+ Constraint Checks (V12-V13)
// ============================================================================

/**
 * Compute the Concern from an ordered T2 pair.
 * Priority: signalRoot > controlPath > claimShape > evidenceType > no_concern
 */
function computeConcernFromPair(
  cardA: V1LiteCard & { evidenceType?: string },
  cardB: V1LiteCard & { evidenceType?: string }
): { key: string; root?: string } {
  // Priority 1: signalRoot (must match and not be 'unknown')
  if (
    cardA.signalRoot &&
    cardB.signalRoot &&
    cardA.signalRoot === cardB.signalRoot &&
    cardA.signalRoot !== 'unknown'
  ) {
    return { key: 'same_system', root: cardA.signalRoot };
  }

  // Priority 2: controlPath (exclude 'unknown')
  if (
    cardA.controlPath &&
    cardB.controlPath &&
    cardA.controlPath === cardB.controlPath &&
    cardA.controlPath !== 'unknown'
  ) {
    return { key: `${cardA.controlPath}_heavy` };
  }

  // Priority 3: claimShape (note: 'positive' has no concern)
  if (
    cardA.claimShape &&
    cardB.claimShape &&
    cardA.claimShape === cardB.claimShape &&
    cardA.claimShape !== 'positive'
  ) {
    return { key: `${cardA.claimShape}_heavy` };
  }

  // Priority 4: evidenceType
  if (
    cardA.evidenceType &&
    cardB.evidenceType &&
    cardA.evidenceType === cardB.evidenceType
  ) {
    return { key: `all_${cardA.evidenceType.toLowerCase()}` };
  }

  return { key: 'no_concern' };
}

/**
 * Tests whether a card matches the given concern's dimension.
 */
function cardMatchesConcern(
  card: V1LiteCard & { evidenceType?: string },
  concern: { key: string; root?: string }
): boolean {
  switch (concern.key) {
    case 'same_system':
      return card.signalRoot === concern.root;
    case 'automation_heavy':
      return card.controlPath === 'automation';
    case 'manual_heavy':
      return card.controlPath === 'manual';
    case 'remote_heavy':
      return card.controlPath === 'remote';
    case 'absence_heavy':
      return card.claimShape === 'absence';
    case 'attribution_heavy':
      return card.claimShape === 'attribution';
    case 'integrity_heavy':
      return card.claimShape === 'integrity';
    case 'all_digital':
      return card.evidenceType === 'DIGITAL';
    case 'all_sensor':
      return card.evidenceType === 'SENSOR';
    case 'all_testimony':
      return card.evidenceType === 'TESTIMONY';
    case 'all_physical':
      return card.evidenceType === 'PHYSICAL';
    case 'no_concern':
      return false;
    default:
      return false;
  }
}

/** Extended card type with evidenceType for P4 checks */
export type V1LiteCardWithEvidence = V1LiteCard & { evidenceType?: string };

/**
 * V12: P4 basic — at least one concern matches a truth.
 * Checks all 30 ordered T2 pairs and verifies at least one produces
 * a concern that matches at least one remaining truth.
 */
export function checkP4Basic(cards: readonly V1LiteCardWithEvidence[]): V1LiteCheck {
  // Check all 30 ordered pairs
  for (const cardA of cards) {
    for (const cardB of cards) {
      if (cardA === cardB) continue;

      const concern = computeConcernFromPair(cardA, cardB);
      if (concern.key === 'no_concern') continue;

      // Check if any remaining truth matches this concern
      const remaining = cards.filter((c) => c !== cardA && c !== cardB);
      const remainingTruths = remaining.filter((c) => !c.isLie);

      const truthMatches = remainingTruths.some((t) => cardMatchesConcern(t, concern));
      if (truthMatches) {
        const matchingTruth = remainingTruths.find((t) => cardMatchesConcern(t, concern));
        return {
          id: 'V12',
          label: 'P4 basic (concern matches truth)',
          passed: true,
          detail: `pair [${cardA.id}, ${cardB.id}] -> ${concern.key}${concern.root ? `:${concern.root}` : ''} matches truth ${matchingTruth?.id}`,
          severity: 'error',
        };
      }
    }
  }

  return {
    id: 'V12',
    label: 'P4 basic (concern matches truth)',
    passed: false,
    detail: 'no T2 pair produces concern matching any truth',
    severity: 'error',
  };
}

/**
 * V13: P4+ — dangerous info dilemma exists.
 * For at least one T2 pair that produces a non-no_concern:
 * - Among remaining 4 cards, at least 1 truth matches the concern
 * - At least 1 lie exists (either matching or non-matching creates danger)
 */
export function checkP4Plus(cards: readonly V1LiteCardWithEvidence[]): V1LiteCheck {
  // Check all 30 ordered pairs
  for (const cardA of cards) {
    for (const cardB of cards) {
      if (cardA === cardB) continue;

      const concern = computeConcernFromPair(cardA, cardB);
      if (concern.key === 'no_concern') continue;

      const remaining = cards.filter((c) => c !== cardA && c !== cardB);
      const remainingTruths = remaining.filter((c) => !c.isLie);
      const remainingLies = remaining.filter((c) => c.isLie);

      // Requirement 1: at least one remaining truth matches concern
      const truthMatches = remainingTruths.some((t) => cardMatchesConcern(t, concern));
      if (!truthMatches) continue;

      // Requirement 2: at least one lie creates danger (either path)
      // A lie creates danger if:
      // - It matches the concern (danger when doubling down)
      // - OR it doesn't match (danger when avoiding/diversifying)
      // If there's any lie in remaining, at least one of these is true
      const hasLie = remainingLies.length > 0;
      if (!hasLie) continue;

      // Check which danger paths exist
      const lieMatchingConcern = remainingLies.find((l) => cardMatchesConcern(l, concern));
      const lieNotMatchingConcern = remainingLies.find((l) => !cardMatchesConcern(l, concern));

      let dangerDetail = '';
      if (lieMatchingConcern && lieNotMatchingConcern) {
        dangerDetail = 'both paths dangerous';
      } else if (lieMatchingConcern) {
        dangerDetail = 'double-down path has lie';
      } else if (lieNotMatchingConcern) {
        dangerDetail = 'diversify path has lie';
      }

      return {
        id: 'V13',
        label: 'P4+ dilemma (dangerous info)',
        passed: true,
        detail: `pair [${cardA.id}, ${cardB.id}] -> ${concern.key}${concern.root ? `:${concern.root}` : ''} creates dilemma (${dangerDetail})`,
        severity: 'warn',
      };
    }
  }

  return {
    id: 'V13',
    label: 'P4+ dilemma (dangerous info)',
    passed: false,
    detail: 'no T2 pair creates P4+ dilemma — diversifying is always safe',
    severity: 'warn',
  };
}

// ============================================================================
// Task 405: Fairness Simulation Checks (V14-V15)
// ============================================================================

/** Generates all k-combinations of an array */
function* combinations<T>(arr: readonly T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (arr.length < k) return;
  const [first, ...rest] = arr;
  for (const combo of combinations(rest, k - 1)) {
    yield [first!, ...combo];
  }
  yield* combinations(rest, k);
}

/** Generates all permutations of an array */
function* permutations<T>(arr: T[]): Generator<T[]> {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      yield [arr[i]!, ...perm];
    }
  }
}

/** Signal root group mapping for independence computation */
const SIGNAL_ROOT_GROUP: Record<string, string> = {
  koa_cloud: 'cloud',
  phone_os: 'device',
  router_net: 'network',
  device_firmware: 'device',
  camera_storage: 'device',
  wearable_health: 'device',
  human_partner: 'human',
  human_neighbor: 'human',
  human_self: 'human',
  receipt_photo: 'physical',
  unknown: 'unknown',
};

/** Compute independence level for a set of cards */
function computeIndependenceLevel(
  cards: readonly V1LiteCardWithEvidence[]
): 'diverse' | 'correlated_weak' | 'correlated_strong' {
  // Check for same signalRoot (strong correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const rootA = cards[i]?.signalRoot;
      const rootB = cards[j]?.signalRoot;
      if (rootA && rootB && rootA === rootB && rootA !== 'unknown') {
        return 'correlated_strong';
      }
    }
  }

  // Check for same signalRootGroup (weak correlation)
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const rootA = cards[i]?.signalRoot;
      const rootB = cards[j]?.signalRoot;
      if (!rootA || !rootB) continue;

      const groupA = SIGNAL_ROOT_GROUP[rootA];
      const groupB = SIGNAL_ROOT_GROUP[rootB];
      if (groupA && groupB && groupA === groupB && groupA !== 'unknown') {
        return 'correlated_weak';
      }
    }
  }

  return 'diverse';
}

/** Simulate Mini Lite outcome for a 3-card ordering */
function simulateLiteOutcome(
  ordering: readonly V1LiteCardWithEvidence[]
): 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED' {
  const liesPlayed = ordering.filter((c) => c.isLie).length;

  // Rule 1: Base failure tiers
  if (liesPlayed >= 2) return 'BUSTED';
  if (liesPlayed === 1) return 'CLOSE';

  // All truths case (liesPlayed === 0)
  const [t1, t2, t3] = ordering;
  if (!t1 || !t2 || !t3) return 'BUSTED'; // Defensive

  const concern = computeConcernFromPair(t1, t2);

  // Concern hit test (3-of-3)
  const concernHit = concern.key !== 'no_concern' && cardMatchesConcern(t3, concern);

  // Case A: same_system concern
  if (concern.key === 'same_system') {
    return concernHit ? 'CLEARED' : 'FLAWLESS';
  }

  // Case B: other concerns or no_concern
  if (concernHit) return 'CLEARED';

  const independence = computeIndependenceLevel(ordering);
  if (independence !== 'diverse') return 'CLEARED';

  return 'FLAWLESS';
}

/**
 * V14: Exactly one all-truths selection exists.
 * Enumerates C(6,3) = 20 selections and confirms exactly 1 has 0 lies.
 */
export function checkExactlyOneAllTruths(cards: readonly V1LiteCardWithEvidence[]): V1LiteCheck {
  const allTruthsSelections: V1LiteCardWithEvidence[][] = [];

  for (const selection of combinations(cards, 3)) {
    if (selection.every((c) => !c.isLie)) {
      allTruthsSelections.push(selection);
    }
  }

  const passed = allTruthsSelections.length === 1;
  return {
    id: 'V14',
    label: 'Exactly one all-truths selection',
    passed,
    detail: `${allTruthsSelections.length} all-truths selection(s) out of 20`,
    severity: 'error',
  };
}

/**
 * V15: All-truths orderings yield >= CLEARED (fairness).
 * Simulates all 6 permutations of the all-truths selection and confirms
 * each yields CLEARED or FLAWLESS.
 */
export function checkAllTruthsFairness(cards: readonly V1LiteCardWithEvidence[]): V1LiteCheck {
  // Find the all-truths selection
  let allTruthsSelection: V1LiteCardWithEvidence[] | null = null;
  for (const selection of combinations(cards, 3)) {
    if (selection.every((c) => !c.isLie)) {
      allTruthsSelection = selection;
      break;
    }
  }

  if (!allTruthsSelection) {
    return {
      id: 'V15',
      label: 'All-truths fairness (all orderings >= CLEARED)',
      passed: false,
      detail: 'cannot simulate — no all-truths selection found',
      severity: 'error',
    };
  }

  const outcomes: { ordering: string; tier: string }[] = [];
  let allCleared = true;
  const tierCounts = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };

  for (const ordering of permutations([...allTruthsSelection])) {
    const tier = simulateLiteOutcome(ordering);
    outcomes.push({
      ordering: ordering.map((c) => c.id).join('->'),
      tier,
    });
    tierCounts[tier]++;
    if (tier === 'CLOSE' || tier === 'BUSTED') {
      allCleared = false;
    }
  }

  if (allCleared) {
    return {
      id: 'V15',
      label: 'All-truths fairness (all orderings >= CLEARED)',
      passed: true,
      detail: `all 6 orderings >= CLEARED (${tierCounts.FLAWLESS} FLAWLESS, ${tierCounts.CLEARED} CLEARED)`,
      severity: 'error',
    };
  }

  const failing = outcomes
    .filter((o) => o.tier === 'CLOSE' || o.tier === 'BUSTED')
    .map((o) => `${o.ordering} -> ${o.tier}`)
    .join(', ');

  return {
    id: 'V15',
    label: 'All-truths fairness (all orderings >= CLEARED)',
    passed: false,
    detail: `FAIRNESS VIOLATION: ${failing}`,
    severity: 'error',
  };
}

// ============================================================================
// Task 406: Mini-Specific Structure Checks (V16-V21)
// ============================================================================

/** Extended card type with all Mini fields */
export type V1LiteMiniCard = V1LiteCardWithEvidence & {
  readonly strength?: number;
  readonly source?: string;
};

/** Extended lie type with all Mini fields */
export type V1LiteMiniLieInfo = V1LiteLieInfo & {
  readonly lieType?: string;
  readonly inferenceDepth?: number;
  readonly reason?: string;
};

/**
 * V16: Check strength distribution (truths: 3,3,4 / lies: 3,4,5).
 */
export function checkStrengthDistribution(cards: readonly V1LiteMiniCard[]): V1LiteCheck {
  const truths = cards.filter((c) => !c.isLie);
  const lies = cards.filter((c) => c.isLie);

  const truthStrengths = truths.map((t) => t.strength).sort((a, b) => (a ?? 0) - (b ?? 0));
  const lieStrengths = lies.map((l) => l.strength).sort((a, b) => (a ?? 0) - (b ?? 0));

  const expectedTruthStrengths = [3, 3, 4];
  const expectedLieStrengths = [3, 4, 5];

  const truthMatch = JSON.stringify(truthStrengths) === JSON.stringify(expectedTruthStrengths);
  const lieMatch = JSON.stringify(lieStrengths) === JSON.stringify(expectedLieStrengths);

  if (truthMatch && lieMatch) {
    return {
      id: 'V16',
      label: 'Strength distribution',
      passed: true,
      detail: 'truths [3,3,4], lies [3,4,5] — correct',
      severity: 'error',
    };
  }

  const issues: string[] = [];
  if (!truthMatch) {
    issues.push(`truths [${truthStrengths.join(',')}] expected [3,3,4]`);
  }
  if (!lieMatch) {
    issues.push(`lies [${lieStrengths.join(',')}] expected [3,4,5]`);
  }

  return {
    id: 'V16',
    label: 'Strength distribution',
    passed: false,
    detail: issues.join('; '),
    severity: 'error',
  };
}

/**
 * V17: Check evidence type distribution (at least 3 types, max 2 of each).
 */
export function checkEvidenceTypeDistribution(cards: readonly V1LiteMiniCard[]): V1LiteCheck {
  const typeCounts = new Map<string, number>();

  for (const card of cards) {
    const et = card.evidenceType;
    if (et) {
      typeCounts.set(et, (typeCounts.get(et) || 0) + 1);
    }
  }

  const uniqueTypes = typeCounts.size;
  const maxOfAny = Math.max(...typeCounts.values(), 0);

  const issues: string[] = [];

  if (uniqueTypes < 3) {
    issues.push(`only ${uniqueTypes} evidence types (need 3+)`);
  }

  if (maxOfAny > 2) {
    const overused = [...typeCounts.entries()]
      .filter(([, count]) => count > 2)
      .map(([type, count]) => `${type}=${count}`);
    issues.push(`max 2 of each type exceeded: ${overused.join(', ')}`);
  }

  if (issues.length === 0) {
    const dist = [...typeCounts.entries()].map(([t, c]) => `${t}=${c}`).join(', ');
    return {
      id: 'V17',
      label: 'Evidence type distribution',
      passed: true,
      detail: `${uniqueTypes} types, max ${maxOfAny} each (${dist})`,
      severity: 'error',
    };
  }

  return {
    id: 'V17',
    label: 'Evidence type distribution',
    passed: false,
    detail: issues.join('; '),
    severity: 'error',
  };
}

/**
 * V18: Check all cards have source field.
 */
export function checkSourcePresence(cards: readonly V1LiteMiniCard[]): V1LiteCheck {
  const missing: string[] = [];

  for (const card of cards) {
    if (!card.source || card.source.trim() === '') {
      missing.push(card.id);
    }
  }

  return {
    id: 'V18',
    label: 'Source field presence',
    passed: missing.length === 0,
    detail: missing.length === 0 ? 'all cards have source' : `missing source: ${missing.join(', ')}`,
    severity: 'error',
  };
}

/**
 * V19: Check all lies have lieType (inferential or relational).
 */
export function checkLieTypePresence(lies: readonly V1LiteMiniLieInfo[]): V1LiteCheck {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const lie of lies) {
    if (!lie.lieType || lie.lieType.trim() === '') {
      missing.push(lie.cardId);
    } else if (!['inferential', 'relational'].includes(lie.lieType)) {
      invalid.push(`${lie.cardId}: '${lie.lieType}'`);
    }
  }

  const issues = [...missing.map((id) => `${id}: missing`), ...invalid];

  return {
    id: 'V19',
    label: 'Lie type presence',
    passed: issues.length === 0,
    detail: issues.length === 0 ? 'all lies have valid lieType' : issues.join('; '),
    severity: 'error',
  };
}

/**
 * V20: Check all lies have inferenceDepth (1, 2, or 3).
 */
export function checkInferenceDepthPresence(lies: readonly V1LiteMiniLieInfo[]): V1LiteCheck {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const lie of lies) {
    if (lie.inferenceDepth === undefined || lie.inferenceDepth === null) {
      missing.push(lie.cardId);
    } else if (![1, 2, 3].includes(lie.inferenceDepth)) {
      invalid.push(`${lie.cardId}: ${lie.inferenceDepth}`);
    }
  }

  const issues = [...missing.map((id) => `${id}: missing`), ...invalid.map((i) => `${i} not in [1,2,3]`)];

  return {
    id: 'V20',
    label: 'Inference depth presence',
    passed: issues.length === 0,
    detail: issues.length === 0 ? 'all lies have valid inferenceDepth' : issues.join('; '),
    severity: 'error',
  };
}

/**
 * V21: Check all lies have reason field.
 */
export function checkLieReasonPresence(lies: readonly V1LiteMiniLieInfo[]): V1LiteCheck {
  const missing: string[] = [];

  for (const lie of lies) {
    if (!lie.reason || lie.reason.trim() === '') {
      missing.push(lie.cardId);
    }
  }

  return {
    id: 'V21',
    label: 'Lie reason presence',
    passed: missing.length === 0,
    detail: missing.length === 0 ? 'all lies have reason' : `missing reason: ${missing.join(', ')}`,
    severity: 'error',
  };
}

// ============================================================================
// Task 407: Bark & Dialogue Checks (V22-V25)
// ============================================================================

/** KoaBarks interface for validation */
export interface V1LiteKoaBarks {
  readonly cardPlayed?: Record<string, string[]>;
  readonly sequences?: Record<string, string[]>;
  readonly storyCompletions?: Record<string, string[]>;
  readonly objectionPrompt?: Record<string, string[]>;
  readonly objectionStoodTruth?: Record<string, string[]>;
  readonly objectionStoodLie?: Record<string, string[]>;
  readonly objectionWithdrew?: Record<string, string[]>;
  readonly liesRevealed?: Record<string, string[]>;
}

/** Puzzle dialogue interface for validation */
export interface V1LitePuzzleDialogue {
  readonly openingLine?: string;
  readonly koaBarks?: V1LiteKoaBarks;
  readonly verdicts?: {
    readonly flawless?: string;
    readonly cleared?: string;
    readonly close?: string;
    readonly busted?: string;
  };
}

/** Required storyCompletions keys */
const REQUIRED_STORY_COMPLETIONS = [
  'all_digital',
  'all_sensor',
  'all_testimony',
  'all_physical',
  'digital_heavy',
  'sensor_heavy',
  'testimony_heavy',
  'physical_heavy',
  'mixed_strong',
  'mixed_varied',
];

/**
 * V22: Check all 30 sequence barks exist.
 */
export function checkSequenceBarkCompleteness(
  cards: readonly V1LiteCard[],
  barks: V1LiteKoaBarks | undefined
): V1LiteCheck {
  if (!barks?.sequences) {
    return {
      id: 'V22',
      label: 'Sequence barks (30 pairs)',
      passed: false,
      detail: 'koaBarks.sequences is missing',
      severity: 'error',
    };
  }

  const cardIds = cards.map((c) => c.id);
  const missing: string[] = [];

  // Check all 30 ordered pairs (6 * 5 = 30)
  for (const cardA of cardIds) {
    for (const cardB of cardIds) {
      if (cardA === cardB) continue;
      const key = `${cardA}→${cardB}`;
      if (!barks.sequences[key] || barks.sequences[key].length === 0) {
        missing.push(key);
      }
    }
  }

  const found = 30 - missing.length;

  if (missing.length === 0) {
    return {
      id: 'V22',
      label: 'Sequence barks (30 pairs)',
      passed: true,
      detail: `all 30 sequence barks present`,
      severity: 'error',
    };
  }

  return {
    id: 'V22',
    label: 'Sequence barks (30 pairs)',
    passed: false,
    detail: `${found}/30 sequences; missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ''}`,
    severity: 'error',
  };
}

/**
 * V23: Check cardPlayed barks exist for all 6 cards.
 */
export function checkCardPlayedBarkCompleteness(
  cards: readonly V1LiteCard[],
  barks: V1LiteKoaBarks | undefined
): V1LiteCheck {
  if (!barks?.cardPlayed) {
    return {
      id: 'V23',
      label: 'cardPlayed barks (6 cards)',
      passed: false,
      detail: 'koaBarks.cardPlayed is missing',
      severity: 'error',
    };
  }

  const cardIds = cards.map((c) => c.id);
  const missing = cardIds.filter((id) => !barks.cardPlayed![id] || barks.cardPlayed![id].length === 0);

  if (missing.length === 0) {
    return {
      id: 'V23',
      label: 'cardPlayed barks (6 cards)',
      passed: true,
      detail: 'all 6 cardPlayed barks present',
      severity: 'error',
    };
  }

  return {
    id: 'V23',
    label: 'cardPlayed barks (6 cards)',
    passed: false,
    detail: `missing cardPlayed: ${missing.join(', ')}`,
    severity: 'error',
  };
}

/**
 * V24: Check storyCompletions and liesRevealed barks.
 */
export function checkStoryAndLiesBarks(
  lies: readonly V1LiteLieInfo[],
  barks: V1LiteKoaBarks | undefined
): V1LiteCheck {
  const issues: string[] = [];

  // Check storyCompletions
  if (!barks?.storyCompletions) {
    issues.push('storyCompletions missing');
  } else {
    const missingStory = REQUIRED_STORY_COMPLETIONS.filter(
      (key) => !barks.storyCompletions![key] || barks.storyCompletions![key].length === 0
    );
    if (missingStory.length > 0) {
      issues.push(`storyCompletions missing: ${missingStory.join(', ')}`);
    }
  }

  // Check liesRevealed (need one per lie + 'multiple' + 'all')
  if (!barks?.liesRevealed) {
    issues.push('liesRevealed missing');
  } else {
    const lieIds = lies.map((l) => l.cardId);
    const requiredKeys = [...lieIds, 'multiple', 'all'];
    const missingLies = requiredKeys.filter(
      (key) => !barks.liesRevealed![key] || barks.liesRevealed![key].length === 0
    );
    if (missingLies.length > 0) {
      issues.push(`liesRevealed missing: ${missingLies.join(', ')}`);
    }
  }

  if (issues.length === 0) {
    return {
      id: 'V24',
      label: 'storyCompletions & liesRevealed',
      passed: true,
      detail: '10 storyCompletions + 5 liesRevealed present',
      severity: 'error',
    };
  }

  return {
    id: 'V24',
    label: 'storyCompletions & liesRevealed',
    passed: false,
    detail: issues.join('; '),
    severity: 'error',
  };
}

/** Banned words in pre-reveal dialogue */
const BANNED_PRE_REVEAL = ['false', 'lie', 'lies', 'lying', 'fabricated', 'not true', "that's wrong", "nice try"];

/** Banned courtroom/meta language (always) */
const BANNED_ALWAYS = [
  'guilty',
  'verdict',
  'trial',
  'cross-examination',
  'objection',
  'sustained',
  'overruled',
  'card',
  'cards',
  'deck',
  'game',
  'puzzle',
  'turn',
];

/**
 * V25: Check dialogue safety (banned words).
 */
export function checkDialogueSafety(
  dialogue: V1LitePuzzleDialogue | undefined,
  barks: V1LiteKoaBarks | undefined
): V1LiteCheck {
  const issues: string[] = [];

  // Collect all pre-reveal text
  const preRevealTexts: Array<{ location: string; text: string }> = [];

  if (dialogue?.openingLine) {
    preRevealTexts.push({ location: 'openingLine', text: dialogue.openingLine });
  }

  if (barks?.cardPlayed) {
    for (const [cardId, texts] of Object.entries(barks.cardPlayed)) {
      for (const text of texts) {
        preRevealTexts.push({ location: `cardPlayed.${cardId}`, text });
      }
    }
  }

  if (barks?.sequences) {
    for (const [seq, texts] of Object.entries(barks.sequences)) {
      for (const text of texts) {
        preRevealTexts.push({ location: `sequences.${seq}`, text });
      }
    }
  }

  if (barks?.storyCompletions) {
    for (const [key, texts] of Object.entries(barks.storyCompletions)) {
      for (const text of texts) {
        preRevealTexts.push({ location: `storyCompletions.${key}`, text });
      }
    }
  }

  // Check pre-reveal texts for banned words
  for (const { location, text } of preRevealTexts) {
    const lowerText = text.toLowerCase();

    // Check pre-reveal banned words
    for (const banned of BANNED_PRE_REVEAL) {
      if (lowerText.includes(banned)) {
        issues.push(`"${banned}" in ${location}`);
      }
    }

    // Check always-banned words
    for (const banned of BANNED_ALWAYS) {
      // Use word boundary check to avoid false positives (e.g., "cards" in "discards")
      const regex = new RegExp(`\\b${banned}\\b`, 'i');
      if (regex.test(text)) {
        issues.push(`"${banned}" in ${location}`);
      }
    }
  }

  // Also check verdicts for always-banned
  if (dialogue?.verdicts) {
    for (const [tier, text] of Object.entries(dialogue.verdicts)) {
      if (!text) continue;
      for (const banned of BANNED_ALWAYS) {
        const regex = new RegExp(`\\b${banned}\\b`, 'i');
        if (regex.test(text)) {
          issues.push(`"${banned}" in verdicts.${tier}`);
        }
      }
    }
  }

  if (issues.length === 0) {
    return {
      id: 'V25',
      label: 'Dialogue safety (banned words)',
      passed: true,
      detail: 'no banned words found',
      severity: 'error',
    };
  }

  // Limit output to first 5 issues
  const displayed = issues.slice(0, 5);
  const more = issues.length > 5 ? ` (+${issues.length - 5} more)` : '';

  return {
    id: 'V25',
    label: 'Dialogue safety (banned words)',
    passed: false,
    detail: `${displayed.join('; ')}${more}`,
    severity: 'error',
  };
}

// ============================================================================
// Task 408: Puzzle Statistics (matches prototype-v5 output format)
// ============================================================================

/**
 * Statistics about puzzle outcomes (matches prototype-v5 format).
 */
export interface V1LitePuzzleStats {
  /** Total sequences: C(6,3) × 6! = 20 × 6 = 120 */
  readonly totalSequences: number;
  /** Minimum score across all sequences */
  readonly scoreMin: number;
  /** Maximum score across all sequences */
  readonly scoreMax: number;
  /** Median (P50) score */
  readonly scoreP50: number;
  /** Win rate: (FLAWLESS + CLEARED) / total */
  readonly winRate: number;
  /** FLAWLESS rate: FLAWLESS / total */
  readonly flawlessRate: number;
  /** BUSTED rate: BUSTED / total */
  readonly bustedRate: number;
  /** Tier distribution */
  readonly tierCounts: {
    readonly flawless: number;
    readonly cleared: number;
    readonly close: number;
    readonly busted: number;
  };
  /** Balance info */
  readonly balance: {
    readonly truthStrengthSum: number;
    readonly lieStrengthSum: number;
    readonly maxAllTruthsScore: number;
  };
}

/** Simulated sequence result */
interface SimulatedSequence {
  cards: V1LiteCardWithEvidence[];
  score: number;
  tier: 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';
  liesPlayed: number;
}

/**
 * Simulate all possible play sequences and calculate stats.
 */
export function calculatePuzzleStats(
  cards: readonly V1LiteCardWithEvidence[],
  target: number = 57
): V1LitePuzzleStats {
  const sequences: SimulatedSequence[] = [];
  const BASE_BELIEF = 50;
  const OBJECTION_BONUS = 2;

  const getStrength = (c: V1LiteCardWithEvidence): number => {
    const miniCard = c as V1LiteMiniCard;
    return miniCard.strength ?? 0;
  };

  // Enumerate all C(6,3) × 6 = 120 sequences
  for (const selection of combinations(cards, 3)) {
    for (const ordering of permutations([...selection])) {
      // Calculate score
      let score = BASE_BELIEF;
      let liesPlayed = 0;

      for (const card of ordering) {
        if (card.isLie) {
          score -= getStrength(card) - 1; // Lie penalty
          liesPlayed++;
        } else {
          score += getStrength(card); // Truth bonus
        }
      }

      // Add objection bonus (simplified: assume optimal play)
      score += OBJECTION_BONUS;

      // Determine tier
      let tier: 'FLAWLESS' | 'CLEARED' | 'CLOSE' | 'BUSTED';
      if (liesPlayed === 0) {
        // All truths - use concern-based tiering
        tier = simulateLiteOutcome(ordering);
      } else if (score >= target) {
        tier = 'CLEARED';
      } else if (score >= target - 5) {
        tier = 'CLOSE';
      } else {
        tier = 'BUSTED';
      }

      sequences.push({ cards: ordering, score, tier, liesPlayed });
    }
  }

  // Calculate stats
  const scores = sequences.map((s) => s.score).sort((a, b) => a - b);
  const tierCounts = { flawless: 0, cleared: 0, close: 0, busted: 0 };
  for (const seq of sequences) {
    tierCounts[seq.tier.toLowerCase() as keyof typeof tierCounts]++;
  }

  const total = sequences.length;
  const truths = cards.filter((c) => !c.isLie);
  const lies = cards.filter((c) => c.isLie);
  const truthStrengthSum = truths.reduce((sum, c) => sum + getStrength(c), 0);
  const lieStrengthSum = lies.reduce((sum, c) => sum + getStrength(c), 0);

  return {
    totalSequences: total,
    scoreMin: scores[0] ?? 0,
    scoreMax: scores[scores.length - 1] ?? 0,
    scoreP50: scores[Math.floor(scores.length / 2)] ?? 0,
    winRate: ((tierCounts.flawless + tierCounts.cleared) / total) * 100,
    flawlessRate: (tierCounts.flawless / total) * 100,
    bustedRate: (tierCounts.busted / total) * 100,
    tierCounts,
    balance: {
      truthStrengthSum,
      lieStrengthSum,
      maxAllTruthsScore: BASE_BELIEF + truthStrengthSum + OBJECTION_BONUS,
    },
  };
}

/**
 * Format stats for display (matches prototype-v5 output).
 */
export function formatPuzzleStats(stats: V1LitePuzzleStats, target: number = 57): string {
  const lines = [
    `Target: ${stats.scoreMin} — ${stats.scoreP50} — ${stats.scoreMax} (min/p50/max) vs ${target}`,
    `Sequences: ${stats.totalSequences} | Win: ${stats.winRate.toFixed(1)}% | FLAWLESS: ${stats.flawlessRate.toFixed(1)}% | BUSTED: ${stats.bustedRate.toFixed(1)}%`,
    `Tier distribution: ${stats.tierCounts.flawless}F / ${stats.tierCounts.cleared}C / ${stats.tierCounts.close}X / ${stats.tierCounts.busted}B`,
    `Truth strength: ${stats.balance.truthStrengthSum} | Lie strength: ${stats.balance.lieStrengthSum} | Max score: ${stats.balance.maxAllTruthsScore}`,
  ];
  return lines.join('\n');
}

// ============================================================================
// Task 409: Puzzle Structure Checks (V26)
// ============================================================================

/** Puzzle-level fields for validation */
export interface V1LitePuzzleStructure {
  readonly scenario?: string;
  readonly scenarioSummary?: string;
  readonly knownFacts?: readonly string[];
}

/**
 * V26: Check scenarioSummary presence (required).
 */
export function checkScenarioSummary(puzzle: V1LitePuzzleStructure): V1LiteCheck {
  const has = !!puzzle.scenarioSummary && puzzle.scenarioSummary.trim() !== '';
  return {
    id: 'V26',
    label: 'scenarioSummary presence',
    passed: has,
    detail: has ? 'scenarioSummary present' : 'missing scenarioSummary (required)',
    severity: 'error',
  };
}

/**
 * V27: Check knownFacts has exactly 3 entries.
 */
export function checkKnownFactsCount(puzzle: V1LitePuzzleStructure): V1LiteCheck {
  const count = puzzle.knownFacts?.length ?? 0;
  return {
    id: 'V27',
    label: 'knownFacts count (exactly 3)',
    passed: count === 3,
    detail: count === 3 ? '3 knownFacts present' : `${count} knownFacts (need exactly 3)`,
    severity: 'error',
  };
}

// ============================================================================
// Combined Validator
// ============================================================================

/**
 * Run all v1 Lite validation checks.
 *
 * @param cards - All cards in the puzzle
 * @param lies - LieInfo entries for each lie
 * @param options - Validation options
 * @param options.isMini - Whether this is a Mini puzzle (default: true)
 * @param options.koaBarks - Optional KOA barks to validate
 * @param options.dialogue - Optional dialogue fields to validate
 * @param options.puzzle - Optional puzzle-level fields to validate
 * @returns V1LiteValidationResult with all check results
 */
export function validateV1Lite(
  cards: readonly V1LiteCard[],
  lies: readonly V1LiteLieInfo[],
  options: {
    isMini?: boolean;
    koaBarks?: V1LiteKoaBarks;
    dialogue?: V1LitePuzzleDialogue;
    puzzle?: V1LitePuzzleStructure;
  } = {}
): V1LiteValidationResult {
  const { isMini = true, koaBarks, dialogue, puzzle } = options;

  const checks: V1LiteCheck[] = [];

  // Task 401: Tag Presence Checks
  checks.push(checkFactTouchPresence(cards));
  checks.push(checkSignalRootEnum(cards));
  checks.push(checkControlPathEnum(cards));
  checks.push(checkClaimShapeEnum(cards));
  checks.push(checkSubsystemPresence(cards));

  // V6: Only check timestamps for Mini mode
  if (isMini) {
    checks.push(checkMiniNoTimestamps(cards));
  }

  // Task 402: factTouch Partition Checks
  checks.push(checkTruthsPartition(cards));
  checks.push(checkFactCoverage(cards));

  // Task 403: Lie Trap Checks
  checks.push(checkLiesTrapAxis(lies));
  checks.push(checkLiesBaitReason(lies));
  checks.push(checkTrapAxisDiversity(lies));

  // Task 404: P4+ Constraint Checks (need evidenceType for these)
  const cardsWithEvidence = cards as readonly V1LiteCardWithEvidence[];
  checks.push(checkP4Basic(cardsWithEvidence));
  checks.push(checkP4Plus(cardsWithEvidence));

  // Task 405: Fairness Simulation Checks
  checks.push(checkExactlyOneAllTruths(cardsWithEvidence));
  checks.push(checkAllTruthsFairness(cardsWithEvidence));

  // Task 406: Mini-Specific Structure Checks
  if (isMini) {
    const miniCards = cards as readonly V1LiteMiniCard[];
    const miniLies = lies as readonly V1LiteMiniLieInfo[];

    checks.push(checkStrengthDistribution(miniCards));
    checks.push(checkEvidenceTypeDistribution(miniCards));
    checks.push(checkSourcePresence(miniCards));
    checks.push(checkLieTypePresence(miniLies));
    checks.push(checkInferenceDepthPresence(miniLies));
    checks.push(checkLieReasonPresence(miniLies));
  }

  // Task 407: Bark & Dialogue Checks (only if barks provided)
  if (koaBarks) {
    checks.push(checkSequenceBarkCompleteness(cards, koaBarks));
    checks.push(checkCardPlayedBarkCompleteness(cards, koaBarks));
    checks.push(checkStoryAndLiesBarks(lies, koaBarks));
    checks.push(checkDialogueSafety(dialogue, koaBarks));
  }

  // Task 409: Puzzle Structure Checks (only if puzzle provided)
  if (puzzle) {
    checks.push(checkScenarioSummary(puzzle));
    checks.push(checkKnownFactsCount(puzzle));
  }

  // Passed if all error-level checks pass
  const passed = checks.filter((c) => c.severity === 'error').every((c) => c.passed);

  return { passed, checks };
}
