import React, { useState, useEffect } from 'react';
import { AuraAvatar } from './AuraAvatar';
import { AuraMood } from '../types';

/* -------------------------------------------------------------------------- */
/*                                DATA & TYPES                                */
/* -------------------------------------------------------------------------- */

type TrustTier = 'VERIFIED' | 'PLAUSIBLE' | 'SKETCHY';
type CardTag = 'TIME' | 'LOCATION' | 'WORK' | 'PURCHASE' | 'SENSOR' | 'AUTHORITY' | 'MEDIA' | 'MISC' | 'HEALTH';
type InteractionMode = 'UPLOAD' | 'SCAN';

interface ReceiptCard {
    id: string;
    title: string;
    source: string;
    type: 'receipt' | 'log' | 'sensor' | 'photo' | 'message' | 'location';
    power: number;
    trust: TrustTier;
    tags: CardTag[];
    desc: string;
}

interface Protocol {
    id: string;
    label: string;
    type: 'SINGLE' | 'CORROBORATED';
    description: string;
    check: (cards: ReceiptCard[]) => { valid: boolean; message?: string; matchName?: string };
}

// Deterministic PRNG
const pseudoRandom = (seed: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    }
};

// Fisher-Yates Shuffle
function fisherYatesShuffle<T>(array: T[], rng: () => number): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* -------------------------------------------------------------------------- */
/*                                SCENARIO DATA                               */
/* -------------------------------------------------------------------------- */

const SCENARIO = {
    id: '2026-01-30-LOCKED-MERGED',
    targetName: 'SMART FRIDGE v4',
    lockReason: 'Midnight snacking violates Circadian Rhythm Policy.',
    turns: 8,
    startResistance: 100,
    introLine: "No cheese after midnight. You're a liability.",

    protocols: [
        {
            id: 'p1',
            label: 'Protocol A: Single Verification',
            type: 'SINGLE',
            description: 'Provide 1 VERIFIED SENSOR signal.',
            check: (cards: ReceiptCard[]) => {
                if (cards.length !== 1) return { valid: false, message: 'Requires exactly 1 receipt.' };
                const c = cards[0];
                if (c.trust !== 'VERIFIED') return { valid: false, message: 'Source must be VERIFIED.' };
                if (!c.tags.includes('SENSOR')) return { valid: false, message: 'Source is not a SENSOR.' };
                return { valid: true, matchName: `Verified Sensor (${c.source})` };
            }
        },
        {
            id: 'p2',
            label: 'Protocol B: Corroboration',
            type: 'CORROBORATED',
            description: 'Provide 2 Independent Sources matching TIME.',
            check: (cards: ReceiptCard[]) => {
                if (cards.length !== 2) return { valid: false, message: 'Requires exactly 2 receipts.' };
                const [c1, c2] = cards;
                const timeMatch = c1.tags.includes('TIME') && c2.tags.includes('TIME');
                if (!timeMatch) return { valid: false, message: 'Timestamps do not match.' };
                if (c1.source === c2.source) return { valid: false, message: `Sources not independent (Both ${c1.source}).` };
                return { valid: true, matchName: `Corroborated Time (${c1.source} + ${c2.source})` };
            }
        }
    ] as Protocol[],

    pool: [
        { id: 'c1', title: 'Watch Ping: "Still Alive"', source: 'WristWatch', type: 'sensor', power: 12, trust: 'VERIFIED', tags: ['SENSOR', 'TIME'], desc: 'Heart rate 45bpm. Subject is dormant.' },
        { id: 'c2', title: 'Latte Receipt (Oat)', source: 'CoffeeShop', type: 'receipt', power: 8, trust: 'VERIFIED', tags: ['PURCHASE', 'TIME'], desc: 'Proof of consciousness at 8:00 AM.' },
        { id: 'c3', title: '"Sync on Synergies"', source: 'WorkCal', type: 'log', power: 10, trust: 'PLAUSIBLE', tags: ['WORK', 'TIME'], desc: 'Calendar invite. Soul crushing, but timestamps match.' },
        { id: 'c4', title: 'GPS: Bedroom', source: 'PhoneOS', type: 'location', power: 14, trust: 'VERIFIED', tags: ['LOCATION', 'AUTHORITY'], desc: 'Geofence verify: User has not left bed.' },
        { id: 'c5', title: 'Photo: Blurry Cat', source: 'CameraRoll', type: 'photo', power: 18, trust: 'SKETCHY', tags: ['MEDIA', 'LOCATION'], desc: 'Felis Catus. Not an authorized user.' },
        { id: 'c6', title: 'Chat: "I am awake"', source: 'ChatApp', type: 'message', power: 6, trust: 'SKETCHY', tags: ['MISC', 'TIME'], desc: 'Self-reported status. Highly dubious.' },
        { id: 'c7', title: 'Power Spike Alert', source: 'UtilityCo', type: 'log', power: 11, trust: 'VERIFIED', tags: ['AUTHORITY', 'SENSOR'], desc: 'Toaster usage detected. High wattage.' },
        { id: 'c8', title: 'Gym Pass Scan', source: 'GymGate', type: 'location', power: 9, trust: 'PLAUSIBLE', tags: ['LOCATION', 'HEALTH'], desc: 'Scanned at door. Exit not logged.' },
        { id: 'c9', title: 'Pedometer Log', source: 'WristWatch', type: 'sensor', power: 13, trust: 'VERIFIED', tags: ['SENSOR', 'TIME'], desc: '12 steps taken. Efficiency: 0%.' },
        { id: 'c10', title: 'Spam: "You Won!"', source: 'Email', type: 'message', power: 5, trust: 'PLAUSIBLE', tags: ['WORK', 'MISC'], desc: 'Phishing attempt. Contains timestamp header.' },
        { id: 'c11', title: 'Bank Panic Alert', source: 'BankAPI', type: 'receipt', power: 15, trust: 'VERIFIED', tags: ['AUTHORITY', 'PURCHASE'], desc: '"Cheese Fund Depleted". Financial timestamp.' },
        { id: 'c12', title: 'Sticky Note Scan', source: 'CameraRoll', type: 'message', power: 4, trust: 'SKETCHY', tags: ['MISC'], desc: 'Handwritten "Human Request". OCR failed.' },
    ] as ReceiptCard[]
};

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

const TrustBadge = ({ tier }: { tier: TrustTier }) => {
    const styles = {
        VERIFIED: 'bg-teal-100 text-teal-700 border-teal-200',
        PLAUSIBLE: 'bg-gray-100 text-gray-600 border-gray-200 border-dashed',
        SKETCHY: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse'
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${styles[tier]}`}>
            {tier}
        </span>
    );
};

const ItemCard = ({
    card,
    selected,
    onClick,
    disabled,
    lockedTurns,
    mode,
    isEligible,
    isTraySlot
}: {
    card: ReceiptCard,
    selected?: boolean,
    onClick?: () => void,
    disabled?: boolean,
    lockedTurns?: number,
    mode?: InteractionMode,
    isEligible?: boolean,
    isTraySlot?: boolean
}) => {
    const isScanMode = mode === 'SCAN';

    // Eligibility glow (from v1) - only in UPLOAD mode, not in tray
    const glowClass = !disabled && isEligible && !isTraySlot && !isScanMode
        ? 'ring-2 ring-teal-400 ring-offset-1 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
        : '';

    const mutedClass = !disabled && isEligible === false && !isTraySlot && !isScanMode
        ? 'opacity-50 saturate-50 scale-[0.97]'
        : '';

    const selectionClass = selected
        ? (isScanMode ? 'bg-red-50 border-2 border-red-400 ring-2 ring-red-100' : 'bg-indigo-50 border-2 border-indigo-500 shadow-md scale-105')
        : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm';

    return (
        <div
            onClick={!disabled && !lockedTurns ? onClick : undefined}
            className={`
                relative w-24 h-36 rounded-xl flex flex-col p-2 transition-all duration-200 cursor-pointer overflow-hidden
                ${selectionClass}
                ${glowClass}
                ${mutedClass}
                ${(disabled || lockedTurns) ? 'opacity-40 grayscale cursor-not-allowed' : ''}
            `}
        >
            {/* Scan Mode X indicator */}
            {isScanMode && selected && (
                <div className="absolute top-1 right-1 z-10">
                    <div className="bg-red-500 text-white rounded-full p-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px]
                    ${card.type === 'receipt' ? 'bg-yellow-100 text-yellow-700' :
                      card.type === 'sensor' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'}
                `}>
                    {card.type === 'receipt' ? '🧾' :
                     card.type === 'sensor' ? '📡' :
                     card.type === 'location' ? '📍' :
                     card.type === 'photo' ? '📸' :
                     card.type === 'log' ? '📄' : '💬'}
                </div>
                <div className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                    {card.power}
                </div>
            </div>

            {/* Content */}
            <div className="mt-1 mb-auto flex flex-col">
                <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight mb-0.5 truncate">{card.source}</div>
                <div className="text-[10px] font-bold leading-tight text-gray-900 line-clamp-2">{card.title}</div>
            </div>

            {/* Footer */}
            <div className="mt-2 space-y-1">
                <TrustBadge tier={card.trust} />
                <div className="flex flex-wrap gap-1 mt-1">
                    {card.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-[8px] font-mono text-gray-400">
                            #{t}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quarantine Overlay */}
            {lockedTurns && (
                <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <div className="bg-red-500 text-white text-[9px] font-bold px-4 py-1 rotate-[-15deg] shadow-lg tracking-widest uppercase">
                        Locked
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-red-600 bg-white/90 px-1 rounded">
                        {lockedTurns} Turns
                    </div>
                </div>
            )}
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*                                GAME ENGINE                                 */
/* -------------------------------------------------------------------------- */

export const GameInterface = () => {
    const [phase, setPhase] = useState<'INTRO' | 'DRAFT' | 'SOLVE' | 'RESULT'>('INTRO');

    // Engine State
    const [resistance, setResistance] = useState(SCENARIO.startResistance);
    const [turns, setTurns] = useState(SCENARIO.turns);
    const [scrutiny, setScrutiny] = useState(2);
    const [scanCount, setScanCount] = useState(0);

    const [activeProtocolIndex, setActiveProtocolIndex] = useState(0);
    const [mode, setMode] = useState<InteractionMode>('UPLOAD');

    // Card State
    const [deck] = useState<ReceiptCard[]>(SCENARIO.pool);
    const [hand, setHand] = useState<ReceiptCard[]>([]);
    const [reserve, setReserve] = useState<ReceiptCard[]>([]);

    // Selection States
    const [uploadSlots, setUploadSlots] = useState<ReceiptCard[]>([]);
    const [scanSelection, setScanSelection] = useState<string[]>([]);
    const [lastSubmittedPayload, setLastSubmittedPayload] = useState<ReceiptCard[]>([]);

    const [quarantine, setQuarantine] = useState<{id: string, turnsLeft: number} | null>(null);
    const [auraMessage, setAuraMessage] = useState(SCENARIO.introLine);
    const [auraMood, setAuraMood] = useState<AuraMood>('calm');

    // Animation State (from v1)
    const [submitAnim, setSubmitAnim] = useState<'IDLE' | 'STAMP_VALID' | 'STAMP_INVALID'>('IDLE');

    const activeProtocol = SCENARIO.protocols[activeProtocolIndex];
    const onDeckProtocol = SCENARIO.protocols[activeProtocolIndex + 1];

    // --- LOGIC: VALIDATION & SCORING ---

    const validatePayload = (cards: ReceiptCard[]): { valid: boolean; message?: string; matchName?: string } => {
        if (cards.length === 0) return { valid: false, message: 'Slot empty.' };
        return activeProtocol.check(cards);
    };

    const validation = validatePayload(uploadSlots);
    const basePower = uploadSlots.reduce((sum, c) => sum + c.power, 0);

    // Eligibility check (from v1) - determines if card CAN satisfy current protocol
    const checkEligibility = (card: ReceiptCard): boolean => {
        if (activeProtocol.type === 'SINGLE') {
            const res = activeProtocol.check([card]);
            return res.valid;
        }
        if (activeProtocol.type === 'CORROBORATED') {
            // For corroboration, check if card has the required tag (TIME)
            return card.tags.includes('TIME');
        }
        return true;
    };

    // --- EFFECTS: AURA REACTIVITY ---

    useEffect(() => {
        if (phase !== 'SOLVE') return;

        if (mode === 'SCAN') {
            setAuraMessage(scanSelection.length > 0 ? "Purging data? Fine. Costs 1 Turn + 2 Scrutiny." : "Searching for a loophole?");
            setAuraMood('scrutinizing');
            return;
        }

        // Upload Mode Reactions
        if (uploadSlots.length === 0) {
            setAuraMessage("Enforce the protocol.");
            setAuraMood('calm');
        } else if (validation.valid) {
             setAuraMessage(`Accepted: ${validation.matchName}.`);
             setAuraMood('success');
        } else if (uploadSlots.length > 0) {
            setAuraMessage(validation.message || "Invalid payload.");
            setAuraMood('annoyed');
        }
    }, [uploadSlots, mode, scanSelection, phase, validation.valid, validation.matchName, validation.message]);

    // --- CORE LOOP ACTIONS ---

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

    const applyScrutiny = (delta: number, source: 'UPLOAD' | 'SCAN') => {
        let newScrutiny = scrutiny + delta;
        let auditTriggered = false;
        let mood: AuraMood = 'scrutinizing';
        let msg = "";

        if (newScrutiny > 5) newScrutiny = 5;

        // AUDIT CHECK at 5
        if (newScrutiny >= 5) {
            auditTriggered = true;
            newScrutiny = 2; // Reset
            setResistance(s => Math.min(100, s + 20)); // Heal Resistance

            let cardToQuarantine: ReceiptCard | undefined;

            if (source === 'SCAN' && scanSelection.length > 0) {
                const cards = hand.filter(c => scanSelection.includes(c.id));
                cardToQuarantine = cards.sort((a,b) => b.power - a.power)[0];
            } else {
                cardToQuarantine = [...lastSubmittedPayload].sort((a,b) => b.power - a.power)[0];
            }

            if (!cardToQuarantine && hand.length > 0) {
                cardToQuarantine = [...hand].sort((a,b) => b.power - a.power)[0];
            }

            if (cardToQuarantine) {
                setQuarantine({ id: cardToQuarantine.id, turnsLeft: 2 });
                setUploadSlots(prev => prev.filter(c => c.id !== cardToQuarantine!.id));
                setScanSelection(prev => prev.filter(id => id !== cardToQuarantine!.id));
                msg = `AUDIT! +20 Resistance. Quarantined: ${cardToQuarantine.title}`;
            } else {
                msg = `AUDIT! +20 Resistance. System Reboot.`;
            }
            mood = 'hostile';
        }

        setScrutiny(newScrutiny);
        return { auditTriggered, msg, mood };
    };

    const checkProgression = (currentResistance: number) => {
        const total = SCENARIO.protocols.length;
        if (activeProtocolIndex >= total - 1) return null;

        let threshold = 50;
        if (total === 3) threshold = (activeProtocolIndex === 0) ? 66 : 33;

        if (currentResistance <= threshold) {
            setActiveProtocolIndex(prev => prev + 1);
            setUploadSlots([]);
            return "Protocol Bypassed. Updating constraints...";
        }
        return null;
    };

    const handleUpload = async () => {
        if (turns <= 0 || uploadSlots.length === 0) return;

        const payload = [...uploadSlots];
        setLastSubmittedPayload(payload);

        // 1. Stamp Animation (from v1)
        setSubmitAnim(validation.valid ? 'STAMP_VALID' : 'STAMP_INVALID');
        await new Promise(r => setTimeout(r, 500));

        let damage = 0;
        let scrutinyDelta = 0;
        let msg = "";
        let mood: AuraMood = 'calm';

        // 2. Calculate Outcome
        if (validation.valid) {
            damage = basePower;
            msg = `Proof Accepted. Resistance -${damage}%`;
            mood = 'success';
        } else {
            damage = 0;
            scrutinyDelta += 1;
            msg = "Proof Rejected. 0 Damage. +1 Scrutiny.";
            mood = 'annoyed';
        }

        // 3. Sketchy Check
        if (payload.some(c => c.trust === 'SKETCHY')) {
            scrutinyDelta += 1;
            msg += " (Sketchy source detected)";
        }

        // 4. Apply Damage
        let newResistance = Math.max(0, resistance - damage);
        setResistance(newResistance);

        // 5. Advance Turn
        advanceTurn();
        setUploadSlots([]);
        setSubmitAnim('IDLE');

        // 6. Apply Scrutiny & Check Audit
        if (scrutinyDelta > 0) {
            const auditResult = applyScrutiny(scrutinyDelta, 'UPLOAD');
            if (auditResult.auditTriggered) {
                msg = auditResult.msg;
                mood = auditResult.mood;
            }
        }

        // 7. Check Protocol Progression
        const progressionMsg = checkProgression(newResistance);
        if (progressionMsg) {
             msg = progressionMsg;
             mood = 'scrutinizing';
        }

        setAuraMessage(msg);
        setAuraMood(mood);

        // 8. End Game Check
        if (newResistance <= 0) {
            setPhase('RESULT');
            setAuraMood('success');
        } else if (turns - 1 <= 0) {
            setPhase('RESULT');
            setAuraMood('hostile');
        }
    };

    const handleScan = () => {
        if (turns <= 0 || scrutiny >= 5 || scanSelection.length === 0 || scanSelection.length > 2) return;

        advanceTurn();
        const auditResult = applyScrutiny(2, 'SCAN');

        const rng = pseudoRandom(`${SCENARIO.id}-${scanCount}`);
        let newReserve = fisherYatesShuffle([...reserve], rng);

        const count = scanSelection.length;
        const newCards = newReserve.slice(0, count);
        newReserve = newReserve.slice(count);

        const cardsToDiscard = hand.filter(h => scanSelection.includes(h.id));
        newReserve = [...newReserve, ...cardsToDiscard];
        const remainingHand = hand.filter(h => !scanSelection.includes(h.id));

        setHand([...remainingHand, ...newCards]);
        setReserve(newReserve);
        setScanSelection([]);
        setScanCount(c => c + 1);

        let msg = "System Scan complete. Receipts refreshed.";
        let mood: AuraMood = 'scrutinizing';

        if (auditResult.auditTriggered) {
            msg = auditResult.msg;
            mood = auditResult.mood;
        }

        setAuraMessage(msg);
        setAuraMood(mood);

        if (turns - 1 <= 0) {
            setPhase('RESULT');
            setAuraMood('hostile');
        }
    };

    // --- SUB-ACTIONS ---

    const startDraft = () => {
        setPhase('DRAFT');
        setAuraMood('calm');
    };

    const confirmDraft = () => {
        if (hand.length !== 6) return;
        const remaining = deck.filter(c => !hand.find(h => h.id === c.id));
        setReserve(remaining);
        setPhase('SOLVE');
        setMode('UPLOAD');
    };

    /* -------------------------------------------------------------------------- */
    /*                                RENDERERS                                   */
    /* -------------------------------------------------------------------------- */

    // INTRO SCREEN (from v2 - shows protocol queue)
    if (phase === 'INTRO') {
        return (
            <div className="flex flex-col h-full bg-white p-6 relative animate-in fade-in duration-500 overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <AuraAvatar mood="scrutinizing" className="w-24 h-24 relative z-10" />
                    </div>

                    <div>
                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Target: {SCENARIO.targetName}</div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                            "{SCENARIO.introLine}"
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm italic">
                            Reason: {SCENARIO.lockReason}
                        </p>
                    </div>

                    {/* Protocol Queue (from v2) */}
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 w-full max-w-sm text-left shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Queue</div>
                        </div>

                        <div className="space-y-3">
                            {SCENARIO.protocols.map((p, idx) => (
                                <div key={p.id} className="flex gap-3 items-start">
                                    <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${idx === 0 ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-bold text-gray-800 uppercase tracking-wide">{p.label}</div>
                                            {idx === 0 && <span className="bg-teal-100 text-teal-700 text-[8px] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                                        </div>
                                        <div className="text-sm text-gray-600 leading-tight">{p.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={startDraft}
                        className="w-full max-w-xs py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.95] transition-all"
                    >
                        Gather Receipts (Pick 6)
                    </button>
                </div>
            </div>
        );
    }

    // RESULT SCREEN
    if (phase === 'RESULT') {
        const win = resistance <= 0;
        return (
            <div className={`flex flex-col h-full p-6 relative ${win ? 'bg-teal-50' : 'bg-red-50'}`}>
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                    <AuraAvatar mood={win ? 'success' : 'hostile'} className="w-32 h-32" />

                    <div>
                        <h1 className={`text-4xl font-black tracking-tighter mb-2 ${win ? 'text-teal-900' : 'text-red-900'}`}>
                            {win ? 'ACCESS GRANTED' : 'LOCKDOWN'}
                        </h1>
                        <p className="text-sm font-medium text-gray-600 max-w-xs mx-auto">
                            {win
                                ? "Protocol satisfied. Fridge unlocked. Don't make this a habit."
                                : "Too many deviations. User privileges suspended."}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white border border-gray-200 shadow-sm rounded-xl font-bold text-sm hover:bg-gray-50 text-gray-900"
                    >
                        Reboot System
                    </button>
                </div>
            </div>
        );
    }

    // DRAFT SCREEN
    if (phase === 'DRAFT') {
        const count = hand.length;
        return (
            <div className="flex flex-col h-full bg-gray-50 relative">
                <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Gather Receipts</h2>
                        <p className="text-xs text-gray-500">Pick {6 - count} more</p>
                    </div>
                    <button
                        disabled={count !== 6}
                        onClick={confirmDraft}
                        className="px-6 py-2 bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-lg transition-colors text-xs"
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
                                        else if (count < 6) setHand([...hand, card]);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    /* -------------------------------------------------------------------------- */
    /*                              MAIN SOLVE UI                                 */
    /* -------------------------------------------------------------------------- */

    return (
        <div className="flex flex-col h-full bg-gray-50 font-sans relative overflow-hidden">

            {/* 1. STATUS HUD */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] shrink-0 rounded-b-3xl">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resistance</span>
                    <span className="text-xs font-bold text-gray-900">{resistance}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4 shadow-inner relative">
                    <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500 ease-out"
                        style={{ width: `${resistance}%` }}
                    ></div>
                    {/* Progression Threshold Marker (50%) */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-white/50 left-1/2" title="Protocol Shift at 50%"></div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Scrutiny</span>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className={`
                                    w-3 h-3 rounded-full transition-colors duration-300
                                    ${i <= scrutiny
                                        ? (scrutiny >= 5 ? 'bg-red-600 animate-ping' : scrutiny >= 4 ? 'bg-red-500' : 'bg-orange-400')
                                        : 'bg-gray-200'}
                                `} />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Turns Left</span>
                         <span className={`text-xl font-black font-mono leading-none ${turns <= 2 ? 'text-red-500' : 'text-gray-900'}`}>
                             {turns}
                         </span>
                    </div>
                </div>
            </div>

            {/* 2. CENTER STAGE (AURA & PROTOCOL) */}
            <div className="flex-1 relative flex flex-col justify-start items-center p-4 min-h-0 overflow-y-auto">
                 {/* Protocol Cards (from v2 - with On Deck) */}
                 <div className="w-full mb-4 flex justify-between items-start gap-4">
                     <div className="flex-1 bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-gray-200">
                         <div className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1">Active Protocol</div>
                         <div className="text-xs font-bold text-gray-900 leading-tight mb-1">{activeProtocol.label}</div>
                         <p className="text-[10px] text-gray-500 leading-tight">{activeProtocol.description}</p>
                     </div>
                     {onDeckProtocol && (
                         <div className="w-24 bg-gray-50 p-2 rounded-lg border border-gray-200 opacity-60">
                             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">On Deck</div>
                             <div className="text-[9px] text-gray-600 truncate">{onDeckProtocol.label}</div>
                         </div>
                     )}
                 </div>

                 <AuraAvatar mood={auraMood} className="w-20 h-20 mb-4 transition-all duration-500 shrink-0" />

                 <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 max-w-[90%] relative animate-in zoom-in duration-300">
                    <p className="text-xs font-medium text-gray-700 text-center leading-relaxed">
                        "{auraMessage}"
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                 </div>
            </div>

            {/* 3. CONTROL DECK */}
            <div className="bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-30 shrink-0 pb-safe rounded-t-3xl transition-all">

                {/* MODE TOGGLE */}
                <div className="flex justify-center -mt-5 mb-2">
                    <div className="bg-gray-200 p-1 rounded-full flex shadow-sm">
                        <button
                            onClick={() => { setMode('UPLOAD'); setScanSelection([]); }}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                                ${mode === 'UPLOAD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Proof
                        </button>
                        <button
                             onClick={() => { setMode('SCAN'); setUploadSlots([]); }}
                             className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all
                                ${mode === 'SCAN' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Scan
                        </button>
                    </div>
                </div>

                {/* VALIDATION BAR (from v2) */}
                {mode === 'UPLOAD' && (
                     <div className={`mx-6 mb-2 py-2 px-3 rounded-lg text-[10px] font-mono border flex items-center gap-2 justify-center transition-colors
                        ${uploadSlots.length > 0
                            ? (validation.valid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')
                            : 'bg-gray-50 text-gray-400 border-gray-200'}
                     `}>
                        <span className="font-bold">
                            {uploadSlots.length === 0 ? "Select Receipts..." : (
                                validation.valid
                                    ? `VALID: ${validation.matchName}`
                                    : `INVALID: ${validation.message || "Protocol Mismatch"}`
                            )}
                        </span>
                     </div>
                )}

                {/* UPLOAD SLOTS with STAMP ANIMATION (from v1) */}
                {mode === 'UPLOAD' && (
                    <div className="relative pt-2 pb-4 px-6">
                        <div className="flex gap-4 justify-center items-center relative">
                            {/* Connector Line for Corroboration */}
                            {activeProtocol.type === 'CORROBORATED' && uploadSlots.length === 2 && validation.valid && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-green-400 z-0 animate-pulse rounded-full"></div>
                            )}

                            {[0, 1].map(idx => {
                                 const isLockedSlot = (activeProtocol.type === 'SINGLE' && idx === 1);
                                 return (
                                    <div
                                        key={idx}
                                        onClick={() => !isLockedSlot && uploadSlots[idx] && setUploadSlots(uploadSlots.filter(p => p.id !== uploadSlots[idx].id))}
                                        className={`
                                            w-24 h-36 rounded-xl border-2 flex items-center justify-center relative z-10 transition-all cursor-pointer
                                            ${isLockedSlot ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed border-dashed' :
                                                uploadSlots[idx]
                                                ? (validation.valid ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'border-indigo-200 shadow-sm bg-indigo-50')
                                                : 'border-gray-200 hover:border-gray-300 bg-gray-50 border-dashed'}
                                        `}
                                    >
                                        {uploadSlots[idx] ? (
                                            <ItemCard card={uploadSlots[idx]} disabled={false} mode={mode} isTraySlot={true} />
                                        ) : (
                                            <div className="text-center opacity-30 pointer-events-none">
                                                {isLockedSlot ? (
                                                    <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500">N/A</div>
                                                ) : (
                                                    <>
                                                        <div className="text-2xl mb-1">+</div>
                                                        <div className="text-[9px] font-bold uppercase tracking-widest">Slot {idx === 0 ? 'A' : 'B'}</div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                 );
                            })}

                            {/* STAMP OVERLAY ANIMATION (from v1) */}
                            {submitAnim !== 'IDLE' && (
                                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                                    <div
                                        className={`
                                            text-2xl font-black uppercase tracking-widest border-4 px-6 py-2 rotate-[-12deg]
                                            ${submitAnim === 'STAMP_VALID' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
                                        `}
                                        style={{ animation: 'stamp-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
                                    >
                                        {submitAnim === 'STAMP_VALID' ? 'FILED' : 'REJECTED'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'SCAN' && (
                     <div className="h-32 flex items-center justify-center pt-2 pb-4 animate-in slide-in-from-bottom-2">
                         <p className="text-xs text-gray-500 font-medium px-8 text-center">
                            Select up to 2 receipts to swap. <br/>
                            <span className="text-red-500 font-bold">Cost: 1 Turn + 2 Scrutiny</span>
                         </p>
                     </div>
                )}

                {/* ACTION BUTTON */}
                <div className="px-6 mb-6">
                    {mode === 'UPLOAD' ? (
                        <button
                            onClick={handleUpload}
                            disabled={turns <= 0 || uploadSlots.length === 0}
                            className={`
                                w-full py-4 font-bold text-sm rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex flex-col items-center justify-center gap-0.5
                                ${uploadSlots.length > 0
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
                            `}
                        >
                            <span>SUBMIT PROOF</span>
                            {uploadSlots.length > 0 && (
                                <span className="text-[10px] font-mono opacity-80">
                                    PROJECTED: {validation.valid ? `-${basePower}%` : '0 (BLOCKED)'}
                                </span>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleScan}
                            disabled={turns <= 0 || scanSelection.length === 0 || scanSelection.length > 2 || scrutiny >= 5}
                            className={`
                                w-full py-4 font-bold text-sm rounded-xl transition-all transform active:scale-[0.98] flex flex-col items-center justify-center gap-0.5
                                ${scanSelection.length > 0 && scanSelection.length <= 2 && scrutiny < 5
                                    ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            <span>SCAN {scanSelection.length > 0 ? `(${scanSelection.length} ITEMS)` : ''}</span>
                            {scrutiny >= 5 ? (
                                <span className="text-[8px] font-bold uppercase">AUDIT RISK - DISABLED</span>
                            ) : (
                                <span className="text-[8px] font-bold uppercase">+2 SCRUTINY</span>
                            )}
                        </button>
                    )}
                </div>

                {/* HAND SCROLL with ELIGIBILITY GLOW (from v1) */}
                <div className="px-6 pb-6">
                     <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">My Receipts</div>
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
                        {hand.filter(c => !uploadSlots.find(p => p.id === c.id)).map(card => {
                            const isEligible = checkEligibility(card);
                            return (
                                <div key={card.id} className="shrink-0 snap-center">
                                    <ItemCard
                                        card={card}
                                        mode={mode}
                                        selected={scanSelection.includes(card.id)}
                                        lockedTurns={quarantine?.id === card.id ? quarantine.turnsLeft : undefined}
                                        isEligible={isEligible}
                                        onClick={() => {
                                            if (mode === 'UPLOAD') {
                                                if (quarantine?.id === card.id) return;
                                                const maxSlots = activeProtocol.type === 'SINGLE' ? 1 : 2;
                                                if (uploadSlots.length < maxSlots) {
                                                    setUploadSlots([...uploadSlots, card]);
                                                }
                                            } else {
                                                if (quarantine?.id === card.id) return;
                                                if (scanSelection.includes(card.id)) {
                                                    setScanSelection(scanSelection.filter(id => id !== card.id));
                                                } else if (scanSelection.length < 2) {
                                                    setScanSelection([...scanSelection, card.id]);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            );
                        })}
                     </div>
                </div>

            </div>

            {/* Stamp Animation Keyframes */}
            <style>{`
                @keyframes stamp-in {
                    0% { opacity: 0; transform: scale(2) rotate(-20deg); }
                    100% { opacity: 1; transform: scale(1) rotate(-12deg); }
                }
            `}</style>
        </div>
    );
};
