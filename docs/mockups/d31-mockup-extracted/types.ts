export type ProofType = 'IDENTITY' | 'ALERTNESS' | 'INTENT' | 'LOCATION' | 'LIVENESS';
export type LocationValue = 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'GYM' | 'WORK' | 'COFFEE_SHOP';
export type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';
export type TrustTier = 'VERIFIED' | 'PLAUSIBLE' | 'SKETCHY';

export type AuraMood =
  | 'NEUTRAL'
  | 'CURIOUS'
  | 'SUSPICIOUS'
  | 'BLOCKED'
  | 'GRUDGING'
  | 'IMPRESSED'
  | 'RESIGNED'
  | 'DEFEATED'
  | 'SMUG';

export interface EvidenceCard {
  id: string;
  name: string;
  source: string;
  power: number;
  trust: TrustTier;
  proves: ProofType[];
  claims: {
    timeRange: [string, string];
    location?: LocationValue;
    state?: StateValue;
  };
  flavor: string;
  refutes?: string; // Counter ID this card can refute
}

export interface CounterEvidence {
  id: string;
  name: string;
  targets: ProofType[];
  claim: string;
  refutableBy: string[];
  refuted: boolean;
}

export interface Concern {
  id: string;
  auraAsks: string;
  requiredProof: ProofType[];
  stateRequirement?: StateValue[];
  addressed: boolean;
}

export interface ContradictionResult {
  severity: 'NONE' | 'MINOR' | 'MAJOR';
  message: string;
  cards: [string, string];
}

export interface DamageResult {
  total: number;
  breakdown: string[];
}

export interface CorroborationResult {
  has: boolean;
  type?: string;
}