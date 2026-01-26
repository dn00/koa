import React, { useState, useMemo } from 'react';

/* ==========================================================================
   D31 v1.7 MOCKUP — ADVERSARIAL TESTIMONY DESIGN

   Core mechanics:
   - No draft: player is dealt 6 cards
   - AURA has visible counter-evidence
   - Cards have claims (time, location, state)
   - Contradictions: MINOR (+1 scrutiny) vs MAJOR (blocked)
   - Refutation cards nullify counters
   - Corroboration bonus for matching claims
   - Scrutiny 5 = immediate loss
   - Progressive disclosure (Minimal vs Full Stats)
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type ProofType = 'IDENTITY' | 'ALERTNESS' | 'INTENT' | 'LOCATION' | 'LIVENESS';
type LocationValue = 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'GYM' | 'WORK' | 'COFFEE_SHOP';
type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';
type TrustTier = 'VERIFIED' | 'PLAUSIBLE' | 'SKETCHY';

type AuraMood =
  | 'NEUTRAL'
  | 'CURIOUS'
  | 'SUSPICIOUS'
  | 'BLOCKED'
  | 'GRUDGING'
  | 'IMPRESSED'
  | 'RESIGNED'
  | 'DEFEATED'
  | 'SMUG';

interface EvidenceCard {
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

interface CounterEvidence {
  id: string;
  name: string;
  targets: ProofType[];
  claim: string;
  refutableBy: string[];
  refuted: boolean;
}

interface Concern {
  id: string;
  auraAsks: string;
  requiredProof: ProofType[];
  stateRequirement?: StateValue[];
  addressed: boolean;
}

interface ContradictionResult {
  severity: 'NONE' | 'MINOR' | 'MAJOR';
  message: string;
  cards: [string, string];
}

/* -------------------------------------------------------------------------- */
/*                              SCENARIO DATA                                 */
/* -------------------------------------------------------------------------- */

const SCENARIO = {
  id: '2026-01-26-FRIDGE',
  targetName: 'SMART FRIDGE v4',
  lockReason: "It's 2am. Midnight snacking violates Circadian Rhythm Policy.",
  auraOpening: "It's 2:14am. You're standing in front of your refrigerator. Again. Prove you're you. Prove you're awake. Prove you meant to do this.",
  resistance: 35,
  turns: 6,

  concerns: [
    { id: 'c1', auraAsks: "Prove you're you.", requiredProof: ['IDENTITY'], addressed: false },
    { id: 'c2', auraAsks: "Prove you're awake.", requiredProof: ['ALERTNESS'], stateRequirement: ['AWAKE', 'ALERT', 'ACTIVE'], addressed: false },
    { id: 'c3', auraAsks: "Prove you meant to do this.", requiredProof: ['INTENT'], addressed: false },
  ] as Concern[],

  counters: [
    {
      id: 'counter-camera',
      name: 'Security Camera',
      targets: ['IDENTITY'],
      claim: "No one detected at door 2:07am",
      refutableBy: ['maintenance-log'],
      refuted: false
    },
    {
      id: 'counter-sleep',
      name: 'Sleep Data Sync',
      targets: ['ALERTNESS'],
      claim: "User in REM sleep until 2:30am",
      refutableBy: ['noise-complaint'],
      refuted: false
    },
  ] as CounterEvidence[],

  // Dealt hand (same for all players today)
  hand: [
    {
      id: 'face-id',
      name: 'Face ID — Front Door',
      source: 'Apple HomeKit',
      power: 12,
      trust: 'VERIFIED',
      proves: ['IDENTITY'],
      claims: { timeRange: ['2:05am', '2:10am'], location: 'KITCHEN', state: 'AWAKE' },
      flavor: 'Biometric match: 99.7% confidence'
    },
    {
      id: 'smart-watch',
      name: 'Smart Watch',
      source: 'WristOS',
      power: 11,
      trust: 'VERIFIED',
      proves: ['ALERTNESS'],
      claims: { timeRange: ['2:00am', '2:15am'], state: 'AWAKE' },
      flavor: 'Heart rate 78bpm. 15 steps in last 5 minutes.'
    },
    {
      id: 'voice-log',
      name: 'Kitchen Voice Log',
      source: 'Echo Hub',
      power: 10,
      trust: 'VERIFIED',
      proves: ['INTENT'],
      claims: { timeRange: ['2:05am', '2:12am'], location: 'KITCHEN', state: 'AWAKE' },
      flavor: 'Voice command detected: "Open fridge"'
    },
    {
      id: 'maintenance-log',
      name: 'Maintenance Log',
      source: 'HomeSec',
      power: 5,
      trust: 'VERIFIED',
      proves: [],
      claims: { timeRange: ['2:00am', '2:30am'] },
      flavor: 'Camera offline 2:00-2:30am — firmware update',
      refutes: 'counter-camera'
    },
    {
      id: 'noise-complaint',
      name: 'Noise Complaint',
      source: 'BuildingMgmt',
      power: 6,
      trust: 'PLAUSIBLE',
      proves: [],
      claims: { timeRange: ['2:05am', '2:10am'] },
      flavor: 'Mrs. Henderson in 4B reported footsteps at 2:05am',
      refutes: 'counter-sleep'
    },
    {
      id: 'gym-wristband',
      name: 'Gym Wristband',
      source: 'FitClub',
      power: 14,
      trust: 'VERIFIED',
      proves: ['ALERTNESS'],
      claims: { timeRange: ['2:00am', '2:20am'], location: 'GYM', state: 'ACTIVE' },
      flavor: 'Workout session logged. Calories: 0.'
    },
  ] as EvidenceCard[],
};

/* -------------------------------------------------------------------------- */
/*                           GAME LOGIC HELPERS                               */
/* -------------------------------------------------------------------------- */

function checkContradiction(
  newCard: EvidenceCard,
  committedStory: EvidenceCard[]
): ContradictionResult | null {
  for (const committed of committedStory) {
    // Skip cards with no claims
    if (!newCard.claims.location && !newCard.claims.state) continue;
    if (!committed.claims.location && !committed.claims.state) continue;

    // Check location conflict
    if (newCard.claims.location && committed.claims.location) {
      if (newCard.claims.location !== committed.claims.location) {
        // Different locations - check if they're incompatible
        const loc1 = newCard.claims.location;
        const loc2 = committed.claims.location;

        // HOME locations vs outside locations
        const homeLocations: LocationValue[] = ['HOME', 'BEDROOM', 'KITCHEN', 'LIVING_ROOM'];
        const outsideLocations: LocationValue[] = ['GYM', 'WORK', 'COFFEE_SHOP'];

        const loc1IsHome = homeLocations.includes(loc1);
        const loc2IsHome = homeLocations.includes(loc2);

        if (loc1IsHome !== loc2IsHome) {
          // One is home, one is outside = MAJOR
          return {
            severity: 'MAJOR',
            message: `You can't be at ${loc1} AND ${loc2} at the same time.`,
            cards: [newCard.id, committed.id]
          };
        }

        // Both home but different rooms - could be MINOR if tight timing
        if (loc1IsHome && loc2IsHome && loc1 !== loc2) {
          // For simplicity, allow different rooms (could add time-based logic)
        }
      }
    }

    // Check state conflict
    if (newCard.claims.state && committed.claims.state) {
      const s1 = newCard.claims.state;
      const s2 = committed.claims.state;

      if ((s1 === 'ASLEEP' && s2 === 'AWAKE') || (s1 === 'AWAKE' && s2 === 'ASLEEP')) {
        // For simplicity, treat as MINOR (would need time gap logic for full impl)
        return {
          severity: 'MINOR',
          message: `${committed.name} claims ${s2}, but ${newCard.name} claims ${s1}. That's suspicious.`,
          cards: [newCard.id, committed.id]
        };
      }
    }
  }

  return null;
}

function hasCorroboration(cards: EvidenceCard[]): { has: boolean; type?: string } {
  if (cards.length < 2) return { has: false };

  const locations = cards.map(c => c.claims.location).filter(Boolean);
  const states = cards.map(c => c.claims.state).filter(Boolean);

  // Check for duplicate locations
  const locSet = new Set(locations);
  if (locations.length > 1 && locSet.size < locations.length) {
    return { has: true, type: 'LOCATION' };
  }

  // Check for duplicate states
  const stateSet = new Set(states);
  if (states.length > 1 && stateSet.size < states.length) {
    return { has: true, type: 'STATE' };
  }

  return { has: false };
}

function calculateDamage(
  cards: EvidenceCard[],
  activeCounter: CounterEvidence | null
): { total: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let total = 0;

  for (const card of cards) {
    let cardDamage = card.power;

    // Check if this card is contested
    if (activeCounter && !activeCounter.refuted) {
      const isTargeted = card.proves.some(p => activeCounter.targets.includes(p));
      if (isTargeted) {
        cardDamage = Math.ceil(cardDamage * 0.5);
        breakdown.push(`${card.name}: ${card.power} → ${cardDamage} (contested)`);
      } else {
        breakdown.push(`${card.name}: ${cardDamage}`);
      }
    } else {
      breakdown.push(`${card.name}: ${cardDamage}`);
    }

    total += cardDamage;
  }

  // Corroboration bonus
  const corr = hasCorroboration(cards);
  if (corr.has) {
    const bonus = Math.ceil(total * 0.25);
    total = total + bonus;
    breakdown.push(`Corroboration (${corr.type}): +${bonus}`);
  }

  return { total, breakdown };
}

/* -------------------------------------------------------------------------- */
/*                              SUB-COMPONENTS                                */
/* -------------------------------------------------------------------------- */

const AuraAvatar = ({ mood, size = 'md' }: { mood: AuraMood; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  };

  const moodColors: Record<AuraMood, string> = {
    NEUTRAL: 'bg-gradient-to-br from-indigo-400 to-purple-500',
    CURIOUS: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    SUSPICIOUS: 'bg-gradient-to-br from-orange-400 to-amber-500',
    BLOCKED: 'bg-gradient-to-br from-red-500 to-rose-600',
    GRUDGING: 'bg-gradient-to-br from-gray-400 to-slate-500',
    IMPRESSED: 'bg-gradient-to-br from-teal-400 to-emerald-500',
    RESIGNED: 'bg-gradient-to-br from-gray-500 to-slate-600 opacity-60',
    DEFEATED: 'bg-gradient-to-br from-teal-500 to-green-600',
    SMUG: 'bg-gradient-to-br from-red-400 to-rose-500',
  };

  const moodEmoji: Record<AuraMood, string> = {
    NEUTRAL: '👁️',
    CURIOUS: '🔍',
    SUSPICIOUS: '🤨',
    BLOCKED: '🚫',
    GRUDGING: '😒',
    IMPRESSED: '😮',
    RESIGNED: '😔',
    DEFEATED: '😤',
    SMUG: '😏',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${moodColors[mood]} flex items-center justify-center shadow-lg transition-all duration-300`}>
      <span className="text-2xl">{moodEmoji[mood]}</span>
    </div>
  );
};

const ConcernChip = ({ concern }: { concern: Concern }) => (
  <div className={`
    px-3 py-1.5 rounded-full text-xs font-medium transition-all
    ${concern.addressed
      ? 'bg-green-100 text-green-700 border border-green-200'
      : 'bg-gray-100 text-gray-600 border border-gray-200'}
  `}>
    {concern.addressed ? '✓' : '○'} {concern.auraAsks}
  </div>
);

const CounterCard = ({ counter, onRefute }: { counter: CounterEvidence; onRefute?: () => void }) => (
  <div className={`
    p-3 rounded-lg border text-xs transition-all
    ${counter.refuted
      ? 'bg-gray-50 border-gray-200 opacity-50 line-through'
      : 'bg-red-50 border-red-200'}
  `}>
    <div className="flex items-center gap-2 mb-1">
      <span className="text-red-500">⚠️</span>
      <span className="font-bold text-gray-800">{counter.name}</span>
      {counter.refuted && <span className="text-green-600 font-bold">REFUTED</span>}
    </div>
    <p className="text-gray-600 italic">"{counter.claim}"</p>
    <p className="text-gray-400 mt-1">Challenges: {counter.targets.join(', ')}</p>
  </div>
);

const EvidenceCardComponent = ({
  card,
  selected,
  onClick,
  disabled,
  showWarning,
  warningType,
  showStats
}: {
  card: EvidenceCard;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showWarning?: boolean;
  warningType?: 'MINOR' | 'MAJOR';
  showStats: boolean;
}) => {
  const getPowerDisplay = () => {
    if (showStats) return card.power.toString();
    // Stars for minimal mode
    if (card.power >= 14) return '⭐⭐⭐';
    if (card.power >= 10) return '⭐⭐';
    return '⭐';
  };

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative w-28 p-3 rounded-xl border-2 transition-all cursor-pointer
        ${selected
          ? 'bg-indigo-50 border-indigo-500 shadow-lg scale-105'
          : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${showWarning ? (warningType === 'MAJOR' ? 'ring-2 ring-red-500' : 'ring-2 ring-yellow-500') : ''}
      `}
    >
      {/* Warning badge */}
      {showWarning && (
        <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold
          ${warningType === 'MAJOR' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
          {warningType === 'MAJOR' ? '⛔' : '⚠️'}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-mono font-bold ${showStats ? 'bg-gray-100 px-1.5 py-0.5 rounded' : ''}`}>
          {getPowerDisplay()}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase
          ${card.trust === 'VERIFIED' ? 'bg-teal-100 text-teal-700' :
            card.trust === 'PLAUSIBLE' ? 'bg-gray-100 text-gray-600' :
            'bg-orange-100 text-orange-700'}`}>
          {card.trust}
        </span>
      </div>

      {/* Name */}
      <div className="text-[11px] font-bold text-gray-900 leading-tight mb-1">
        {card.name}
      </div>

      {/* Source */}
      <div className="text-[10px] text-indigo-600 font-medium mb-2">
        {card.source}
      </div>

      {/* Claims */}
      <div className="flex flex-wrap gap-1 mb-2">
        {card.claims.location && (
          <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
            📍 {card.claims.location}
          </span>
        )}
        {card.claims.state && (
          <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
            👁️ {card.claims.state}
          </span>
        )}
      </div>

      {/* Proves */}
      {card.proves.length > 0 && (
        <div className="text-[9px] text-gray-500">
          Proves: {card.proves.join(', ')}
        </div>
      )}

      {/* Refutes */}
      {card.refutes && (
        <div className="text-[9px] text-green-600 font-medium mt-1">
          ✓ Can refute counter
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export const GameInterfaceD31 = () => {
  // Game state
  const [phase, setPhase] = useState<'INTRO' | 'SOLVE' | 'RESULT'>('INTRO');
  const [resistance, setResistance] = useState(SCENARIO.resistance);
  const [turnsLeft, setTurnsLeft] = useState(SCENARIO.turns);
  const [scrutiny, setScrutiny] = useState(0);

  // Card state
  const [hand, setHand] = useState<EvidenceCard[]>(SCENARIO.hand);
  const [committedStory, setCommittedStory] = useState<EvidenceCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<EvidenceCard[]>([]);

  // Counter state
  const [counters, setCounters] = useState<CounterEvidence[]>(SCENARIO.counters);
  const [concerns, setConcerns] = useState<Concern[]>(SCENARIO.concerns);

  // UI state
  const [showStats, setShowStats] = useState(false);
  const [auraMood, setAuraMood] = useState<AuraMood>('NEUTRAL');
  const [auraMessage, setAuraMessage] = useState(SCENARIO.auraOpening);

  // Computed values
  const activeCounter = useMemo(() => {
    // Find first unrefuted counter that targets any selected card's proof type
    for (const card of selectedCards) {
      for (const counter of counters) {
        if (!counter.refuted && counter.targets.some(t => card.proves.includes(t))) {
          return counter;
        }
      }
    }
    return null;
  }, [selectedCards, counters]);

  const contradictionWarning = useMemo(() => {
    for (const card of selectedCards) {
      const result = checkContradiction(card, committedStory);
      if (result) return result;
    }
    return null;
  }, [selectedCards, committedStory]);

  const damage = useMemo(() => {
    if (selectedCards.length === 0) return { total: 0, breakdown: [] };
    if (contradictionWarning?.severity === 'MAJOR') return { total: 0, breakdown: ['BLOCKED'] };
    return calculateDamage(selectedCards, activeCounter);
  }, [selectedCards, activeCounter, contradictionWarning]);

  const corroboration = useMemo(() => hasCorroboration(selectedCards), [selectedCards]);

  // Actions
  const handleCardSelect = (card: EvidenceCard) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const handleSubmit = () => {
    if (selectedCards.length === 0) return;
    if (contradictionWarning?.severity === 'MAJOR') return;

    let newScrutiny = scrutiny;

    // MINOR contradiction adds scrutiny
    if (contradictionWarning?.severity === 'MINOR') {
      newScrutiny += 1;
    }

    // SKETCHY cards add scrutiny
    if (selectedCards.some(c => c.trust === 'SKETCHY')) {
      newScrutiny += 1;
    }

    // Check for scrutiny loss
    if (newScrutiny >= 5) {
      setScrutiny(5);
      setAuraMood('SMUG');
      setAuraMessage("Your story fell apart under scrutiny. Too many inconsistencies. Access denied.");
      setPhase('RESULT');
      return;
    }

    setScrutiny(newScrutiny);

    // Apply damage
    const newResistance = Math.max(0, resistance - damage.total);
    setResistance(newResistance);

    // Check for refutation
    const refutationCard = selectedCards.find(c => c.refutes);
    if (refutationCard) {
      setCounters(counters.map(counter =>
        counter.id === refutationCard.refutes
          ? { ...counter, refuted: true }
          : counter
      ));
      setAuraMood('GRUDGING');
      setAuraMessage("...How convenient. Fine. I'll allow it.");
    } else if (activeCounter) {
      setAuraMood('SUSPICIOUS');
      setAuraMessage(`My ${activeCounter.name} says otherwise. Your evidence carries less weight.`);
    } else if (corroboration.has) {
      setAuraMood('IMPRESSED');
      setAuraMessage("Your evidence aligns. Annoyingly consistent.");
    } else {
      setAuraMood('NEUTRAL');
      setAuraMessage("Noted.");
    }

    // Update concerns
    const newConcerns = concerns.map(concern => {
      if (concern.addressed) return concern;

      const addressed = selectedCards.some(card => {
        const provesMatch = card.proves.some(p => concern.requiredProof.includes(p));
        if (!provesMatch) return false;

        if (concern.stateRequirement) {
          return card.claims.state && concern.stateRequirement.includes(card.claims.state);
        }
        return true;
      });

      return { ...concern, addressed: addressed || concern.addressed };
    });
    setConcerns(newConcerns);

    // Move cards to committed story
    setCommittedStory([...committedStory, ...selectedCards]);
    setHand(hand.filter(c => !selectedCards.find(s => s.id === c.id)));
    setSelectedCards([]);

    // Advance turn
    const newTurnsLeft = turnsLeft - 1;
    setTurnsLeft(newTurnsLeft);

    // Check win/lose
    const allConcernsAddressed = newConcerns.every(c => c.addressed);

    if (newResistance <= 0 && allConcernsAddressed) {
      setAuraMood('DEFEATED');
      setAuraMessage("Your story is... consistent. Annoyingly so. Access granted.");
      setPhase('RESULT');
    } else if (newTurnsLeft <= 0) {
      setAuraMood('SMUG');
      setAuraMessage("Time's up. Your story had gaps. The fridge remains locked.");
      setPhase('RESULT');
    }
  };

  // Render: INTRO
  if (phase === 'INTRO') {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <AuraAvatar mood="SUSPICIOUS" size="lg" />

          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
              TARGET: {SCENARIO.targetName}
            </div>
            <p className="text-lg font-medium text-gray-300 max-w-sm leading-relaxed">
              "{SCENARIO.auraOpening}"
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl w-full max-w-sm">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              AURA's Challenges
            </div>
            <div className="space-y-2">
              {SCENARIO.counters.map(counter => (
                <div key={counter.id} className="text-sm text-red-400">
                  ⚠️ {counter.name}: "{counter.claim}"
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('SOLVE')}
            className="w-full max-w-sm py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Build Your Case
          </button>
        </div>
      </div>
    );
  }

  // Render: RESULT
  if (phase === 'RESULT') {
    const win = resistance <= 0 && concerns.every(c => c.addressed);

    return (
      <div className={`flex flex-col h-screen p-6 ${win ? 'bg-teal-900' : 'bg-red-900'} text-white`}>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <AuraAvatar mood={win ? 'DEFEATED' : 'SMUG'} size="lg" />

          <div>
            <h1 className="text-3xl font-black mb-2">
              {win ? 'ACCESS GRANTED' : 'LOCKDOWN'}
            </h1>
            <p className="text-gray-300">
              {win
                ? "Enjoy your midnight snack. I'll be watching."
                : "The fridge remains locked. Try again tomorrow."}
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-xl w-full max-w-sm">
            <div className="text-sm space-y-1">
              <div>Turns used: {SCENARIO.turns - turnsLeft}/{SCENARIO.turns}</div>
              <div>Scrutiny: {scrutiny}/5</div>
              <div>Concerns: {concerns.filter(c => c.addressed).length}/{concerns.length}</div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/20 rounded-xl font-bold hover:bg-white/30 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Render: SOLVE
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header HUD */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        {/* Resistance Bar */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Resistance</span>
          <span className="text-xs font-bold">{showStats ? `${resistance}/${SCENARIO.resistance}` : ''}</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
            style={{ width: `${(resistance / SCENARIO.resistance) * 100}%` }}
          />
        </div>

        {/* Concerns */}
        <div className="flex flex-wrap gap-2 mb-3">
          {concerns.map(concern => (
            <ConcernChip key={concern.id} concern={concern} />
          ))}
        </div>

        {/* Stats row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Scrutiny:</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= scrutiny ? 'bg-orange-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
          <div className="text-sm font-bold">
            {turnsLeft} turns left
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-xs text-indigo-600 font-medium"
          >
            {showStats ? 'Minimal' : 'Stats'}
          </button>
        </div>
      </div>

      {/* AURA Section */}
      <div className="flex flex-col items-center p-4">
        <AuraAvatar mood={auraMood} size="md" />
        <div className="bg-white mt-3 px-4 py-2 rounded-xl shadow-sm border border-gray-200 max-w-xs">
          <p className="text-sm text-gray-700 text-center">"{auraMessage}"</p>
        </div>
      </div>

      {/* Counters */}
      <div className="px-4 mb-4">
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">AURA's Counter-Evidence</div>
        <div className="space-y-2">
          {counters.map(counter => (
            <CounterCard key={counter.id} counter={counter} />
          ))}
        </div>
      </div>

      {/* Contradiction Warning */}
      {contradictionWarning && (
        <div className={`mx-4 mb-4 p-3 rounded-lg border-2 ${
          contradictionWarning.severity === 'MAJOR'
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'bg-yellow-50 border-yellow-300 text-yellow-700'
        }`}>
          <div className="font-bold text-sm mb-1">
            {contradictionWarning.severity === 'MAJOR' ? '⛔ IMPOSSIBLE' : '⚠️ SUSPICIOUS'}
          </div>
          <p className="text-sm">{contradictionWarning.message}</p>
          {contradictionWarning.severity === 'MINOR' && (
            <p className="text-xs mt-1 opacity-75">Proceeding will add +1 scrutiny</p>
          )}
        </div>
      )}

      {/* Corroboration indicator */}
      {corroboration.has && !contradictionWarning && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700">
          <div className="font-bold text-sm">✨ Stories Align!</div>
          <p className="text-xs">Cards corroborate on {corroboration.type}. +25% damage bonus.</p>
        </div>
      )}

      {/* Selection Preview */}
      {selectedCards.length > 0 && (
        <div className="mx-4 mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-indigo-700">
              Projected damage: {showStats ? damage.total : (damage.total > 0 ? '●'.repeat(Math.min(5, Math.ceil(damage.total / 10))) : '0')}
            </span>
            {activeCounter && !activeCounter.refuted && (
              <span className="text-xs text-orange-600">⚠️ Contested by {activeCounter.name}</span>
            )}
          </div>
          {showStats && (
            <div className="text-xs text-gray-600 mt-1">
              {damage.breakdown.join(' | ')}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="px-4 mb-4">
        <button
          onClick={handleSubmit}
          disabled={selectedCards.length === 0 || contradictionWarning?.severity === 'MAJOR'}
          className={`
            w-full py-4 rounded-xl font-bold transition-all
            ${selectedCards.length > 0 && contradictionWarning?.severity !== 'MAJOR'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {contradictionWarning?.severity === 'MAJOR'
            ? 'BLOCKED — Resolve Contradiction'
            : `SUBMIT EVIDENCE (${selectedCards.length})`}
        </button>
      </div>

      {/* Hand */}
      <div className="flex-1 bg-white border-t border-gray-200 p-4 overflow-y-auto">
        <div className="text-xs font-bold text-gray-500 uppercase mb-3">Your Evidence</div>
        <div className="flex flex-wrap gap-3 justify-center">
          {hand.map(card => {
            const isSelected = selectedCards.find(c => c.id === card.id);
            const wouldContradict = !isSelected && checkContradiction(card, committedStory);

            return (
              <EvidenceCardComponent
                key={card.id}
                card={card}
                selected={!!isSelected}
                onClick={() => handleCardSelect(card)}
                showStats={showStats}
                showWarning={!!wouldContradict}
                warningType={wouldContradict?.severity}
              />
            );
          })}
        </div>

        {/* Committed Story */}
        {committedStory.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2">Your Committed Story</div>
            <div className="flex flex-wrap gap-2">
              {committedStory.map(card => (
                <div key={card.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {card.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameInterfaceD31;
