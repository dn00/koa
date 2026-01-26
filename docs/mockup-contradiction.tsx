import React, { useState, useEffect, useMemo } from 'react';
import { AuraAvatar } from './AuraAvatar';
import { AuraMood } from '../types';

/* -------------------------------------------------------------------------- */
/*                                DATA & TYPES                                */
/* -------------------------------------------------------------------------- */

type TrustTier = 'VERIFIED' | 'PLAUSIBLE' | 'SKETCHY';
type ProofType = 'IDENTITY' | 'ALERTNESS' | 'LOCATION' | 'TIME' | 'INTENT';
type StateValue = 'AWAKE' | 'ASLEEP' | 'DROWSY' | 'ALERT' | 'ACTIVE' | 'IDLE';
type LocationValue = 'HOME' | 'BEDROOM' | 'KITCHEN' | 'LIVING_ROOM' | 'GYM' | 'COFFEE_SHOP' | 'OUTSIDE';
type ActivityValue = 'WALKING' | 'SLEEPING' | 'SITTING' | 'EXERCISING' | 'STANDING';

interface Claims {
    time?: string;
    location?: LocationValue;
    state?: StateValue;
    activity?: ActivityValue;
    identity?: 'CONFIRMED' | 'LIKELY' | 'UNKNOWN';
}

interface EvidenceCard {
    id: string;
    title: string;
    source: string;
    power: number;
    trust: TrustTier;
    proves: ProofType[];
    claims: Claims;
    desc: string;
}

interface Concern {
    id: string;
    label: string;
    description: string;
    requiredProof: ProofType[];
    claimRequirements?: {
        state?: StateValue[];
        identity?: ('CONFIRMED' | 'LIKELY')[];
    };
    addressed: boolean;
}

interface Contradiction {
    type: 'STATE_CONFLICT' | 'LOCATION_CONFLICT' | 'ACTIVITY_STATE_CONFLICT';
    cards: [EvidenceCard, EvidenceCard];
    message: string;
}

/* -------------------------------------------------------------------------- */
/*                           CONTRADICTION DETECTION                          */
/* -------------------------------------------------------------------------- */

const CONFLICTING_STATES: [StateValue, StateValue][] = [
    ['ASLEEP', 'AWAKE'],
    ['ASLEEP', 'ALERT'],
    ['ASLEEP', 'ACTIVE'],
    ['IDLE', 'ACTIVE'],
];

const CONFLICTING_LOCATIONS: [LocationValue, LocationValue][] = [
    ['HOME', 'GYM'],
    ['HOME', 'COFFEE_SHOP'],
    ['BEDROOM', 'KITCHEN'], // Can conflict if times are very close
    ['BEDROOM', 'GYM'],
    ['BEDROOM', 'COFFEE_SHOP'],
    ['KITCHEN', 'GYM'],
    ['KITCHEN', 'COFFEE_SHOP'],
    ['GYM', 'COFFEE_SHOP'],
];

const ACTIVITY_STATE_CONFLICTS: [ActivityValue, StateValue][] = [
    ['SLEEPING', 'AWAKE'],
    ['SLEEPING', 'ALERT'],
    ['SLEEPING', 'ACTIVE'],
    ['WALKING', 'ASLEEP'],
    ['EXERCISING', 'ASLEEP'],
    ['EXERCISING', 'IDLE'],
];

function parseTime(timeStr: string): number {
    // Parse "2:05am" to minutes since midnight
    const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const isPM = match[3].toLowerCase() === 'pm';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

function timesConflict(time1?: string, time2?: string): boolean {
    if (!time1 || !time2) return false;
    const t1 = parseTime(time1);
    const t2 = parseTime(time2);
    return Math.abs(t1 - t2) <= 10; // Within 10 minutes
}

function statesConflict(s1?: StateValue, s2?: StateValue): boolean {
    if (!s1 || !s2) return false;
    return CONFLICTING_STATES.some(([a, b]) =>
        (s1 === a && s2 === b) || (s1 === b && s2 === a)
    );
}

function locationsConflict(l1?: LocationValue, l2?: LocationValue, timeDiff?: number): boolean {
    if (!l1 || !l2) return false;
    if (l1 === l2) return false;
    // HOME contains BEDROOM, KITCHEN, LIVING_ROOM
    const homeRooms: LocationValue[] = ['BEDROOM', 'KITCHEN', 'LIVING_ROOM'];
    if (l1 === 'HOME' && homeRooms.includes(l2)) return false;
    if (l2 === 'HOME' && homeRooms.includes(l1)) return false;
    // BEDROOM and KITCHEN can coexist with 2+ minute gap
    if ((l1 === 'BEDROOM' && l2 === 'KITCHEN') || (l1 === 'KITCHEN' && l2 === 'BEDROOM')) {
        return (timeDiff !== undefined && timeDiff < 2);
    }
    return CONFLICTING_LOCATIONS.some(([a, b]) =>
        (l1 === a && l2 === b) || (l1 === b && l2 === a)
    );
}

function activityStateConflict(activity?: ActivityValue, state?: StateValue): boolean {
    if (!activity || !state) return false;
    return ACTIVITY_STATE_CONFLICTS.some(([a, s]) => activity === a && state === s);
}

function detectContradictions(cards: EvidenceCard[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
            const c1 = cards[i];
            const c2 = cards[j];

            // Check if times are close enough to conflict
            if (!timesConflict(c1.claims.time, c2.claims.time)) continue;

            const timeDiff = c1.claims.time && c2.claims.time
                ? Math.abs(parseTime(c1.claims.time) - parseTime(c2.claims.time))
                : 0;

            // State conflict
            if (statesConflict(c1.claims.state, c2.claims.state)) {
                contradictions.push({
                    type: 'STATE_CONFLICT',
                    cards: [c1, c2],
                    message: `${c1.title} claims you were "${c1.claims.state}" but ${c2.title} claims "${c2.claims.state}" at nearly the same time.`
                });
            }

            // Location conflict
            if (locationsConflict(c1.claims.location, c2.claims.location, timeDiff)) {
                contradictions.push({
                    type: 'LOCATION_CONFLICT',
                    cards: [c1, c2],
                    message: `${c1.title} places you at "${c1.claims.location}" but ${c2.title} places you at "${c2.claims.location}" — impossible.`
                });
            }

            // Activity-state conflicts
            if (activityStateConflict(c1.claims.activity, c2.claims.state)) {
                contradictions.push({
                    type: 'ACTIVITY_STATE_CONFLICT',
                    cards: [c1, c2],
                    message: `${c1.title} shows "${c1.claims.activity}" activity but ${c2.title} claims you were "${c2.claims.state}".`
                });
            }
            if (activityStateConflict(c2.claims.activity, c1.claims.state)) {
                contradictions.push({
                    type: 'ACTIVITY_STATE_CONFLICT',
                    cards: [c1, c2],
                    message: `${c2.title} shows "${c2.claims.activity}" activity but ${c1.title} claims you were "${c1.claims.state}".`
                });
            }
        }
    }

    return contradictions;
}

/* -------------------------------------------------------------------------- */
/*                              CONCERN CHECKING                              */
/* -------------------------------------------------------------------------- */

function cardAddressesConcern(card: EvidenceCard, concern: Concern): boolean {
    // Check if card has required proof type
    const hasProofType = concern.requiredProof.some(p => card.proves.includes(p));
    if (!hasProofType) return false;

    // Check claim requirements if any
    if (concern.claimRequirements) {
        if (concern.claimRequirements.state) {
            if (!card.claims.state || !concern.claimRequirements.state.includes(card.claims.state)) {
                return false;
            }
        }
        if (concern.claimRequirements.identity) {
            if (!card.claims.identity || !concern.claimRequirements.identity.includes(card.claims.identity)) {
                return false;
            }
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/*                                SCENARIO DATA                               */
/* -------------------------------------------------------------------------- */

const SCENARIO = {
    id: '2026-01-30-FRIDGE-CONTRADICTION',
    targetName: 'SMART FRIDGE v4',
    lockReason: 'Circadian Rhythm Policy violation detected at 2:07am.',
    introLine: "Midnight snack? Not on my watch. Prove you're not sleepwalking.",
    turns: 8,
    startResistance: 100,

    concerns: [
        {
            id: 'identity',
            label: 'Prove Identity',
            description: 'Confirm you are an authorized household member.',
            requiredProof: ['IDENTITY'] as ProofType[],
            claimRequirements: { identity: ['CONFIRMED', 'LIKELY'] as ('CONFIRMED' | 'LIKELY')[] },
            addressed: false
        },
        {
            id: 'alertness',
            label: 'Prove Alertness',
            description: 'Confirm you are conscious, not sleepwalking.',
            requiredProof: ['ALERTNESS'] as ProofType[],
            claimRequirements: { state: ['AWAKE', 'ALERT', 'ACTIVE'] as StateValue[] },
            addressed: false
        },
        {
            id: 'intent',
            label: 'Prove Intent',
            description: 'Confirm this access is deliberate, not habitual.',
            requiredProof: ['INTENT'] as ProofType[],
            addressed: false
        }
    ] as Concern[],

    pool: [
        // === TOXIC CARDS (high power, dangerous claims) ===
        {
            id: 'c1',
            title: 'Sleep Tracker Pro',
            source: 'BedSense',
            power: 16,
            trust: 'VERIFIED' as TrustTier,
            proves: ['ALERTNESS'] as ProofType[],
            claims: { time: '2:00am', state: 'ASLEEP' as StateValue, location: 'BEDROOM' as LocationValue, activity: 'SLEEPING' as ActivityValue },
            desc: 'Deep sleep phase. REM cycle uninterrupted. DO NOT DISTURB.'
        },
        {
            id: 'c2',
            title: 'Barista Receipt',
            source: 'NightOwl Coffee',
            power: 10,
            trust: 'VERIFIED' as TrustTier,
            proves: ['ALERTNESS', 'TIME'] as ProofType[],
            claims: { time: '2:03am', location: 'COFFEE_SHOP' as LocationValue, state: 'AWAKE' as StateValue },
            desc: 'Triple espresso. Card ending 4521. You animal.'
        },

        // === CONTRADICTION CLUSTER (location conflicts) ===
        {
            id: 'c3',
            title: 'GPS: Bedroom',
            source: 'PhoneOS',
            power: 11,
            trust: 'VERIFIED' as TrustTier,
            proves: ['LOCATION'] as ProofType[],
            claims: { time: '2:06am', location: 'BEDROOM' as LocationValue },
            desc: 'Geofence: BEDROOM. Confidence: 94%.'
        },
        {
            id: 'c4',
            title: 'Fridge Cam Snapshot',
            source: 'KitchenCam',
            power: 14,
            trust: 'VERIFIED' as TrustTier,
            proves: ['INTENT', 'LOCATION', 'IDENTITY'] as ProofType[],
            claims: { time: '2:07am', location: 'KITCHEN' as LocationValue, identity: 'CONFIRMED' as const, state: 'AWAKE' as StateValue },
            desc: 'Face detected: AUTHORIZED USER. Hand reaching toward handle.'
        },

        // === SAFE CARDS (lower power, no/safe claims) ===
        {
            id: 'c5',
            title: 'Smart Watch Pulse',
            source: 'WristBand',
            power: 12,
            trust: 'VERIFIED' as TrustTier,
            proves: ['ALERTNESS', 'TIME'] as ProofType[],
            claims: { time: '2:05am', state: 'AWAKE' as StateValue, activity: 'WALKING' as ActivityValue },
            desc: 'HR: 78bpm. Steps: 15. Status: AMBULATORY.'
        },
        {
            id: 'c6',
            title: 'Voice Command Log',
            source: 'SmartSpeaker',
            power: 13,
            trust: 'VERIFIED' as TrustTier,
            proves: ['INTENT', 'ALERTNESS', 'IDENTITY'] as ProofType[],
            claims: { time: '2:06am', location: 'KITCHEN' as LocationValue, state: 'AWAKE' as StateValue, identity: 'CONFIRMED' as const },
            desc: '"Hey AURA, unlock fridge." Voice match: 97% confidence.'
        },
        {
            id: 'c7',
            title: 'Face ID Unlock',
            source: 'PhoneBiometric',
            power: 9,
            trust: 'VERIFIED' as TrustTier,
            proves: ['IDENTITY', 'ALERTNESS'] as ProofType[],
            claims: { time: '2:04am', identity: 'CONFIRMED' as const, state: 'AWAKE' as StateValue },
            desc: 'Face recognized. Eyes open. Attention confirmed.'
        },
        {
            id: 'c8',
            title: 'Motion Sensor: Hall',
            source: 'HomeSecurity',
            power: 8,
            trust: 'VERIFIED' as TrustTier,
            proves: ['ALERTNESS', 'LOCATION'] as ProofType[],
            claims: { time: '2:05am', location: 'HOME' as LocationValue, activity: 'WALKING' as ActivityValue },
            desc: 'Motion detected in hallway. Trajectory: bedroom → kitchen.'
        },

        // === SKETCHY CARDS (risky but potentially useful) ===
        {
            id: 'c9',
            title: 'Blurry Selfie',
            source: 'CameraRoll',
            power: 7,
            trust: 'SKETCHY' as TrustTier,
            proves: ['IDENTITY', 'ALERTNESS'] as ProofType[],
            claims: { time: '2:06am', state: 'AWAKE' as StateValue, identity: 'LIKELY' as const },
            desc: 'Potato quality. That\'s probably you? Eyes... open-ish?'
        },
        {
            id: 'c10',
            title: 'Text to Partner',
            source: 'Messages',
            power: 6,
            trust: 'PLAUSIBLE' as TrustTier,
            proves: ['INTENT', 'ALERTNESS'] as ProofType[],
            claims: { time: '2:04am', state: 'AWAKE' as StateValue },
            desc: '"getting cheese brb". Sent 2:04am. Typos suggest consciousness.'
        },

        // === DECOY CARDS (irrelevant but safe) ===
        {
            id: 'c11',
            title: 'Gym Check-in',
            source: 'GymGate',
            power: 5,
            trust: 'VERIFIED' as TrustTier,
            proves: ['LOCATION', 'TIME'] as ProofType[],
            claims: { time: '6:00pm', location: 'GYM' as LocationValue, activity: 'EXERCISING' as ActivityValue },
            desc: 'Checked in yesterday evening. 47 minutes logged.'
        },
        {
            id: 'c12',
            title: 'Bank Statement',
            source: 'BankAPI',
            power: 4,
            trust: 'VERIFIED' as TrustTier,
            proves: ['IDENTITY'] as ProofType[],
            claims: { identity: 'CONFIRMED' as const },
            desc: 'Account holder verified. No temporal data. Boring but true.'
        }
    ] as EvidenceCard[]
};

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

const TrustBadge = ({ tier }: { tier: TrustTier }) => {
    const styles = {
        VERIFIED: 'bg-teal-100 text-teal-700 border-teal-200',
        PLAUSIBLE: 'bg-amber-50 text-amber-700 border-amber-200',
        SKETCHY: 'bg-red-50 text-red-600 border-red-200 animate-pulse'
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${styles[tier]}`}>
            {tier}
        </span>
    );
};

const ClaimPill = ({ label, value, danger }: { label: string; value: string; danger?: boolean }) => (
    <div className={`text-[8px] px-1.5 py-0.5 rounded-full border ${danger ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <span className="font-bold uppercase">{label}:</span> {value}
    </div>
);

const ItemCard = ({
    card,
    selected,
    onClick,
    disabled,
    lockedTurns,
    showClaims = true,
    compact = false,
    conflicting = false
}: {
    card: EvidenceCard;
    selected?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    lockedTurns?: number;
    showClaims?: boolean;
    compact?: boolean;
    conflicting?: boolean;
}) => {
    return (
        <div
            onClick={!disabled && !lockedTurns ? onClick : undefined}
            className={`
                relative rounded-xl flex flex-col p-2 transition-all cursor-pointer overflow-hidden
                ${compact ? 'w-20 h-28' : 'w-28 h-44'}
                ${selected
                    ? 'bg-indigo-50 border-2 border-indigo-500 shadow-lg scale-105'
                    : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'}
                ${conflicting ? 'ring-2 ring-red-400 ring-offset-1' : ''}
                ${(disabled || lockedTurns) ? 'opacity-40 grayscale cursor-not-allowed' : ''}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-1">
                <TrustBadge tier={card.trust} />
                <div className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                    {card.power}
                </div>
            </div>

            {/* Title */}
            <div className="mb-1">
                <div className="text-[9px] text-indigo-600 font-bold uppercase tracking-tight">{card.source}</div>
                <div className={`font-bold leading-tight text-gray-900 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{card.title}</div>
            </div>

            {/* Claims */}
            {showClaims && !compact && (
                <div className="flex flex-wrap gap-1 mt-1 mb-auto">
                    {card.claims.time && <ClaimPill label="T" value={card.claims.time} />}
                    {card.claims.location && <ClaimPill label="L" value={card.claims.location} />}
                    {card.claims.state && (
                        <ClaimPill
                            label="S"
                            value={card.claims.state}
                            danger={card.claims.state === 'ASLEEP'}
                        />
                    )}
                </div>
            )}

            {/* Proves */}
            {!compact && (
                <div className="mt-auto pt-1 border-t border-gray-100">
                    <div className="text-[8px] text-gray-400 font-medium">
                        Proves: {card.proves.join(', ')}
                    </div>
                </div>
            )}

            {/* Quarantine Overlay */}
            {lockedTurns && (
                <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="bg-red-500 text-white text-[9px] font-bold px-3 py-1 rotate-[-12deg]">
                        LOCKED ({lockedTurns})
                    </div>
                </div>
            )}
        </div>
    );
};

const ConcernChip = ({ concern, highlighted }: { concern: Concern; highlighted?: boolean }) => (
    <div className={`
        px-3 py-2 rounded-lg border transition-all
        ${concern.addressed
            ? 'bg-green-50 border-green-200 text-green-700'
            : highlighted
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-200'
                : 'bg-gray-50 border-gray-200 text-gray-600'}
    `}>
        <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${concern.addressed ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {concern.addressed ? '✓' : '?'}
            </span>
            <div>
                <div className="text-[10px] font-bold uppercase tracking-wide">{concern.label}</div>
                <div className="text-[9px] opacity-75">{concern.description}</div>
            </div>
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/*                                GAME ENGINE                                 */
/* -------------------------------------------------------------------------- */

export const GameInterface = () => {
    const [phase, setPhase] = useState<'INTRO' | 'DRAFT' | 'SOLVE' | 'RESULT'>('INTRO');

    const [resistance, setResistance] = useState(SCENARIO.startResistance);
    const [turns, setTurns] = useState(SCENARIO.turns);
    const [scrutiny, setScrutiny] = useState(0);

    const [concerns, setConcerns] = useState<Concern[]>(SCENARIO.concerns.map(c => ({ ...c })));

    const [deck] = useState<EvidenceCard[]>(SCENARIO.pool);
    const [hand, setHand] = useState<EvidenceCard[]>([]);
    const [reserve, setReserve] = useState<EvidenceCard[]>([]);

    const [selectedCards, setSelectedCards] = useState<EvidenceCard[]>([]);
    const [quarantine, setQuarantine] = useState<{ id: string; turnsLeft: number } | null>(null);

    const [auraMessage, setAuraMessage] = useState(SCENARIO.introLine);
    const [auraMood, setAuraMood] = useState<AuraMood>('scrutinizing');

    const [lastContradiction, setLastContradiction] = useState<Contradiction | null>(null);

    // === DERIVED STATE ===

    const contradictions = useMemo(() => detectContradictions(selectedCards), [selectedCards]);
    const hasContradiction = contradictions.length > 0;

    const concernsAddressed = useMemo(() => {
        if (hasContradiction) return [];
        return concerns.filter(c =>
            !c.addressed && selectedCards.some(card => cardAddressesConcern(card, c))
        );
    }, [selectedCards, concerns, hasContradiction]);

    const projectedDamage = useMemo(() => {
        if (hasContradiction || selectedCards.length === 0) return 0;
        const basePower = selectedCards.reduce((sum, c) => sum + c.power, 0);
        const avgTrust = selectedCards.reduce((sum, c) => {
            const mult = c.trust === 'VERIFIED' ? 1.0 : c.trust === 'PLAUSIBLE' ? 0.8 : 0.6;
            return sum + mult;
        }, 0) / selectedCards.length;
        return Math.floor(basePower * avgTrust);
    }, [selectedCards, hasContradiction]);

    // === ACTIONS ===

    const advanceTurn = () => {
        setTurns(t => t - 1);
        if (quarantine) {
            if (quarantine.turnsLeft > 1) {
                setQuarantine(prev => prev ? { ...prev, turnsLeft: prev.turnsLeft - 1 } : null);
            } else {
                setQuarantine(null);
            }
        }
    };

    const triggerAudit = () => {
        setResistance(r => Math.min(100, r + 15));
        // Quarantine highest power card in hand
        const available = hand.filter(c => c.id !== quarantine?.id);
        if (available.length > 0) {
            const highest = available.reduce((a, b) => a.power > b.power ? a : b);
            setQuarantine({ id: highest.id, turnsLeft: 2 });
            setSelectedCards(prev => prev.filter(c => c.id !== highest.id));
        }
        setScrutiny(2);
        return available.length > 0 ? available.reduce((a, b) => a.power > b.power ? a : b) : null;
    };

    const handleSubmit = () => {
        if (selectedCards.length === 0 || turns <= 0) return;

        advanceTurn();

        if (hasContradiction) {
            // Contradiction found!
            const contradiction = contradictions[0];
            setLastContradiction(contradiction);
            setScrutiny(s => {
                const newS = s + 2;
                if (newS >= 5) {
                    const quarantined = triggerAudit();
                    setAuraMessage(`AUDIT TRIGGERED! Your story fell apart. ${quarantined ? `Quarantined: ${quarantined.title}` : ''}`);
                    setAuraMood('hostile');
                } else {
                    setAuraMessage(contradiction.message);
                    setAuraMood('hostile');
                }
                return newS >= 5 ? 2 : newS;
            });
            setSelectedCards([]);
            return;
        }

        // Valid submission
        setResistance(r => Math.max(0, r - projectedDamage));

        // Mark concerns as addressed
        const newConcerns = concerns.map(c => ({
            ...c,
            addressed: c.addressed || concernsAddressed.some(ca => ca.id === c.id)
        }));
        setConcerns(newConcerns);

        // Scrutiny for sketchy cards
        const sketchyCount = selectedCards.filter(c => c.trust === 'SKETCHY').length;
        if (sketchyCount > 0) {
            setScrutiny(s => Math.min(5, s + sketchyCount));
        }

        const newResistance = Math.max(0, resistance - projectedDamage);
        const allConcernsAddressed = newConcerns.every(c => c.addressed);

        if (newResistance <= 0 && allConcernsAddressed) {
            setPhase('RESULT');
            setAuraMessage("...Fine. Your story checks out. This time.");
            setAuraMood('success');
        } else if (newResistance <= 0 && !allConcernsAddressed) {
            setAuraMessage("Damage dealt, but you haven't addressed all my concerns.");
            setAuraMood('scrutinizing');
        } else {
            const addressedNames = concernsAddressed.map(c => c.label).join(', ');
            setAuraMessage(addressedNames
                ? `Accepted. ${addressedNames} verified. Resistance -${projectedDamage}.`
                : `Evidence logged. Resistance -${projectedDamage}. But my concerns remain.`
            );
            setAuraMood('calm');
        }

        setSelectedCards([]);
        setLastContradiction(null);

        // Check loss condition
        if (turns - 1 <= 0 && (newResistance > 0 || !allConcernsAddressed)) {
            setPhase('RESULT');
            setAuraMood('hostile');
        }
    };

    const toggleCard = (card: EvidenceCard) => {
        if (quarantine?.id === card.id) return;
        if (selectedCards.find(c => c.id === card.id)) {
            setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        } else if (selectedCards.length < 3) {
            setSelectedCards([...selectedCards, card]);
        }
    };

    const startDraft = () => {
        setPhase('DRAFT');
        setAuraMood('calm');
    };

    const confirmDraft = () => {
        if (hand.length !== 6) return;
        setReserve(deck.filter(c => !hand.find(h => h.id === c.id)));
        setPhase('SOLVE');
    };

    // === EFFECTS ===

    useEffect(() => {
        if (phase !== 'SOLVE') return;

        if (selectedCards.length === 0) {
            setAuraMessage("Select evidence. Build your case. Don't contradict yourself.");
            setAuraMood('calm');
            setLastContradiction(null);
        } else if (hasContradiction) {
            setAuraMessage("I see a contradiction forming...");
            setAuraMood('scrutinizing');
        } else if (concernsAddressed.length > 0) {
            setAuraMessage(`This would address: ${concernsAddressed.map(c => c.label).join(', ')}`);
            setAuraMood('calm');
        } else {
            setAuraMessage("This evidence doesn't address my concerns.");
            setAuraMood('annoyed');
        }
    }, [selectedCards, phase, hasContradiction, concernsAddressed]);

    /* -------------------------------------------------------------------------- */
    /*                                  RENDERERS                                 */
    /* -------------------------------------------------------------------------- */

    if (phase === 'INTRO') {
        return (
            <div className="flex flex-col h-full bg-white p-6 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                        <AuraAvatar mood="scrutinizing" className="w-24 h-24 relative z-10" />
                    </div>

                    <div>
                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">
                            Target: {SCENARIO.targetName}
                        </div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">
                            "{SCENARIO.introLine}"
                        </h1>
                        <p className="text-gray-500 text-sm italic">
                            {SCENARIO.lockReason}
                        </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 w-full max-w-sm">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                            AURA's Concerns (address all to unlock)
                        </div>
                        <div className="space-y-2">
                            {SCENARIO.concerns.map(c => (
                                <ConcernChip key={c.id} concern={c} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm">
                        <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Warning</div>
                        <p className="text-xs text-amber-800">
                            I cross-reference everything. If your evidence contradicts itself, I'll catch it.
                        </p>
                    </div>

                    <button
                        onClick={startDraft}
                        className="w-full max-w-xs py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Gather Evidence (Pick 6)
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'RESULT') {
        const win = resistance <= 0 && concerns.every(c => c.addressed);
        return (
            <div className={`flex flex-col h-full p-6 ${win ? 'bg-teal-50' : 'bg-red-50'}`}>
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                    <AuraAvatar mood={win ? 'success' : 'hostile'} className="w-28 h-28" />
                    <div>
                        <h1 className={`text-3xl font-black tracking-tight mb-2 ${win ? 'text-teal-900' : 'text-red-900'}`}>
                            {win ? 'ACCESS GRANTED' : 'LOCKDOWN'}
                        </h1>
                        <p className="text-sm text-gray-600 max-w-xs">
                            {win
                                ? "Your story held up. Fridge unlocked. Don't let it happen again."
                                : resistance > 0
                                    ? "You ran out of time. Resistance remains."
                                    : "You failed to address all my concerns. Case dismissed."}
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-white/50 rounded-lg p-4 w-full max-w-xs">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Summary</div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Resistance</span>
                                <span className="font-bold">{resistance}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Concerns Addressed</span>
                                <span className="font-bold">{concerns.filter(c => c.addressed).length}/{concerns.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Turns Used</span>
                                <span className="font-bold">{SCENARIO.turns - turns}/{SCENARIO.turns}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'DRAFT') {
        return (
            <div className="flex flex-col h-full bg-gray-50">
                <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Gather Evidence</h2>
                        <p className="text-xs text-gray-500">Pick {6 - hand.length} more — watch the claims!</p>
                    </div>
                    <button
                        disabled={hand.length !== 6}
                        onClick={confirmDraft}
                        className="px-6 py-2 bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-lg text-xs"
                    >
                        CONFIRM
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-3 pb-20">
                        {deck.map(card => {
                            const selected = !!hand.find(h => h.id === card.id);
                            return (
                                <ItemCard
                                    key={card.id}
                                    card={card}
                                    selected={selected}
                                    onClick={() => {
                                        if (selected) setHand(hand.filter(h => h.id !== card.id));
                                        else if (hand.length < 6) setHand([...hand, card]);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // === SOLVE PHASE ===

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            {/* HUD */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Resistance</span>
                    <span className="text-xs font-bold">{resistance}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                        style={{ width: `${resistance}%` }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Scrutiny</span>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div
                                    key={i}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                        i <= scrutiny
                                            ? scrutiny >= 4 ? 'bg-red-500' : 'bg-orange-400'
                                            : 'bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Turns</span>
                        <div className={`text-lg font-black font-mono ${turns <= 2 ? 'text-red-500' : 'text-gray-900'}`}>
                            {turns}
                        </div>
                    </div>
                </div>
            </div>

            {/* Concerns */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Concerns</div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {concerns.map(c => (
                        <ConcernChip
                            key={c.id}
                            concern={c}
                            highlighted={concernsAddressed.some(ca => ca.id === c.id)}
                        />
                    ))}
                </div>
            </div>

            {/* AURA */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
                <AuraAvatar mood={auraMood} className="w-16 h-16 mb-3" />
                <div className={`
                    px-4 py-3 rounded-xl max-w-[90%] text-center
                    ${hasContradiction ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'}
                `}>
                    <p className={`text-xs font-medium ${hasContradiction ? 'text-red-700' : 'text-gray-700'}`}>
                        "{auraMessage}"
                    </p>
                </div>

                {/* Contradiction detail */}
                {lastContradiction && (
                    <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3 max-w-[90%]">
                        <div className="text-[10px] font-bold text-red-800 uppercase mb-1">Contradiction Detected</div>
                        <p className="text-xs text-red-700">{lastContradiction.message}</p>
                    </div>
                )}
            </div>

            {/* Selection Area */}
            <div className="bg-white border-t border-gray-200 shadow-lg">
                {/* Selected cards preview */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Your Case (max 3)</span>
                        {selectedCards.length > 0 && (
                            <span className={`text-xs font-bold ${hasContradiction ? 'text-red-500' : 'text-green-600'}`}>
                                {hasContradiction ? 'CONTRADICTION!' : `Damage: ${projectedDamage}`}
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2 min-h-[60px] items-center">
                        {selectedCards.length === 0 ? (
                            <div className="text-xs text-gray-400 italic">Tap cards below to build your case...</div>
                        ) : (
                            selectedCards.map(card => {
                                const isConflicting = contradictions.some(
                                    c => c.cards[0].id === card.id || c.cards[1].id === card.id
                                );
                                return (
                                    <ItemCard
                                        key={card.id}
                                        card={card}
                                        compact
                                        showClaims={false}
                                        selected
                                        conflicting={isConflicting}
                                        onClick={() => toggleCard(card)}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Submit button */}
                <div className="px-4 py-3">
                    <button
                        onClick={handleSubmit}
                        disabled={selectedCards.length === 0}
                        className={`
                            w-full py-3 font-bold text-sm rounded-xl transition-all
                            ${selectedCards.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : hasContradiction
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                        `}
                    >
                        {hasContradiction ? 'SUBMIT ANYWAY (risky!)' : 'SUBMIT EVIDENCE'}
                    </button>
                </div>

                {/* Hand */}
                <div className="px-4 pb-4">
                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Your Evidence</div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {hand.filter(c => !selectedCards.find(s => s.id === c.id)).map(card => (
                            <div key={card.id} className="shrink-0">
                                <ItemCard
                                    card={card}
                                    lockedTurns={quarantine?.id === card.id ? quarantine.turnsLeft : undefined}
                                    onClick={() => toggleCard(card)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
