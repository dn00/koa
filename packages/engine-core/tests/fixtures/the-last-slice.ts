/**
 * Test puzzle fixture: "The Last Slice"
 *
 * Normal difficulty. Resistance: 30. Turns: 4. 7 cards.
 * Tests trap cards, counters, refutations, corroboration, and concerns.
 */

import type {
  Puzzle,
  EvidenceCard,
  CardId,
  Concern,
  CounterEvidence,
} from '@hsh/engine-core';
import { ProofType, ConcernType, TrustTier } from '@hsh/engine-core';

// ============================================================================
// Cards
// ============================================================================

const card_doorbell: EvidenceCard = {
  id: 'card_doorbell' as CardId,
  power: 8,
  proves: [ProofType.IDENTITY],
  claims: { location: 'living room', timeRange: '1:50am-1:55am' },
  source: 'smart doorbell',
  refutes: 'counter_alibi',
  trustTier: TrustTier.VERIFIED,
};

const card_fitbit: EvidenceCard = {
  id: 'card_fitbit' as CardId,
  power: 6,
  proves: [ProofType.ALERTNESS],
  claims: { state: 'ASLEEP', timeRange: '1:30am-2:15am' },
  source: 'fitness tracker',
  trustTier: TrustTier.VERIFIED,
};

const card_thermostat: EvidenceCard = {
  id: 'card_thermostat' as CardId,
  power: 5,
  proves: [ProofType.LOCATION],
  claims: { location: 'living room', timeRange: '1:55am-2:05am' },
  source: 'smart thermostat',
  trustTier: TrustTier.PLAUSIBLE,
};

const card_phone_gps: EvidenceCard = {
  id: 'card_phone_gps' as CardId,
  power: 10,
  proves: [ProofType.LOCATION, ProofType.LIVENESS],
  claims: { location: 'living room', timeRange: '2:00am-2:10am' },
  source: 'phone GPS',
  trustTier: TrustTier.SKETCHY,
};

const card_speaker: EvidenceCard = {
  id: 'card_speaker' as CardId,
  power: 7,
  proves: [ProofType.INTENT],
  claims: { activity: 'asking about pizza', timeRange: '1:58am-2:03am' },
  source: 'smart speaker',
  trustTier: TrustTier.VERIFIED,
};

const card_security_cam: EvidenceCard = {
  id: 'card_security_cam' as CardId,
  power: 12,
  proves: [ProofType.IDENTITY, ProofType.LIVENESS],
  claims: { location: 'living room', timeRange: '2:05am-2:10am' },
  source: 'security camera',
  trustTier: TrustTier.VERIFIED,
};

const card_microwave: EvidenceCard = {
  id: 'card_microwave' as CardId,
  power: 4,
  proves: [ProofType.ALERTNESS],
  claims: { state: 'AWAKE', timeRange: '2:00am-2:05am' },
  source: 'smart microwave',
  trustTier: TrustTier.PLAUSIBLE,
};

// ============================================================================
// Counters
// ============================================================================

const counter_alibi: CounterEvidence = {
  id: 'counter_alibi',
  targets: ['card_security_cam' as CardId],
  refuted: false,
};

const counter_sleep: CounterEvidence = {
  id: 'counter_sleep',
  targets: ['card_fitbit' as CardId],
  refuted: false,
};

// ============================================================================
// Concerns
// ============================================================================

const concerns: readonly Concern[] = [
  {
    id: 'concern_identity',
    type: ConcernType.IDENTITY,
    requiredProof: ProofType.IDENTITY,
    addressed: false,
  },
  {
    id: 'concern_location',
    type: ConcernType.LOCATION,
    requiredProof: ProofType.LOCATION,
    addressed: false,
  },
  {
    id: 'concern_intent',
    type: ConcernType.INTENT,
    requiredProof: ProofType.INTENT,
    addressed: false,
  },
];

// ============================================================================
// Puzzle
// ============================================================================

const puzzle: Puzzle = {
  id: 'puzzle_the_last_slice',
  targetName: 'Alex',
  resistance: 30,
  concerns,
  counters: [counter_alibi, counter_sleep],
  dealtHand: [
    'card_doorbell' as CardId,
    'card_fitbit' as CardId,
    'card_thermostat' as CardId,
    'card_phone_gps' as CardId,
    'card_speaker' as CardId,
    'card_security_cam' as CardId,
    'card_microwave' as CardId,
  ],
  turns: 4,
};

// ============================================================================
// Card Map
// ============================================================================

const allCards = [
  card_doorbell,
  card_fitbit,
  card_thermostat,
  card_phone_gps,
  card_speaker,
  card_security_cam,
  card_microwave,
];

const cards = new Map<CardId, EvidenceCard>(
  allCards.map(c => [c.id, c]),
);

// ============================================================================
// Export
// ============================================================================

export const THE_LAST_SLICE = {
  puzzle,
  cards,
} as const;
