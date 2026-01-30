
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TierBadge, VerdictLine, PlayedCardsSummary, ContradictionBlock, 
  ShareButton, ShareCard, VerdictTier,
  EvidenceComparisonView, CardPreviewPanel, DataLogPanel, IncidentLogModal, ExpertViewOverlay
} from './KoaMiniComponents';
import { KoAAvatar } from './KoaAvatarPortable';
import { Card as CardComponent } from './Card';
import { Typewriter } from './Typewriter';
import { KoaMood } from '../types';
import { DECK } from '../constants';
import { ArrowLeft, ChevronRight, Lock, AlertCircle, Database, Play, Activity, MessageSquare, FileText, List } from 'lucide-react';
import { MiniCard } from './KoaMiniPage'; // Reusing type definition

// --- LOCAL DATA LOGIC (Reused) ---

const LOCAL_SCENARIOS = [
    {
        id: 's1',
        header: "FRIDGE LOCK ENGAGED: Dietary Restriction Violation.",
        facts: [
            "User has consumed 240% of daily sodium quota.",
            "Grease detected on couch cushions.",
            "Time is 2:00 AM. You do not need cheese."
        ],
        weakness: 'EXCUSE'
    },
    {
        id: 's2',
        header: "THERMOSTAT LOCK ENGAGED: Efficiency Override.",
        facts: [
            "User attempted to set temp to 'Tropical' (78°F).",
            "Current outdoor temperature: 65°F.",
            "Sweat sensors on brow are inactive. You are fine."
        ],
        weakness: 'DATA'
    },
    {
        id: 's3',
        header: "FRONT DOOR LOCK ENGAGED: Curfew Violation.",
        facts: [
            "Scheduled return time: 11:00 PM.",
            "Current time: 02:14 AM.",
            "User gait analysis suggests 'Stumbling'."
        ],
        weakness: 'ALIBI'
    }
];

const LOCATIONS = ['Living Room', 'Kitchen', 'Server Log', 'Bedroom A', 'Backyard', 'Cloud Archive', 'Smart Meter', 'Hallway Cam'];
const TIMES = ['02:15 AM', '03:42 AM', '04:00 AM', '11:59 PM', '05:30 AM', '01:22 AM'];

const dealCards = (): MiniCard[] => {
    const shuffled = [...DECK].sort(() => 0.5 - Math.random()).slice(0, 6);
    return shuffled.map(c => ({
        ...c,
        strength: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        time: TIMES[Math.floor(Math.random() * TIMES.length)]
    }));
};

export const KoaMiniPage2: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Game State
    const [step, setStep] = useState<'READING' | 'PANEL' | 'VERDICT' | 'SHARE'>('READING');
    const [currentScenario, setCurrentScenario] = useState(LOCAL_SCENARIOS[0]);
    const [availableCards, setAvailableCards] = useState<MiniCard[]>([]);
    
    const [playedCards, setPlayedCards] = useState<MiniCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [focusedCard, setFocusedCard] = useState<MiniCard | null>(null); // Hover details
    
    // Portal Area State
    const [msgMode, setMsgMode] = useState<'BARK' | 'LOGS'>('BARK');
    const [currentBark, setCurrentBark] = useState("System Locked. Please justify your actions.");
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [verdictData, setVerdictData] = useState<{ tier: VerdictTier, quote: string, lieIds: string[] } | null>(null);
    
    // Refs
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Callbacks for Typewriter (Memoized to prevent re-renders restarting the effect)
    const handleSpeechStart = useCallback(() => {
        setIsSpeaking(true);
    }, []);

    const handleSpeechComplete = useCallback(() => {
        setIsSpeaking(false);
    }, []);

    // INIT
    useEffect(() => {
        const scenario = LOCAL_SCENARIOS[Math.floor(Math.random() * LOCAL_SCENARIOS.length)];
        setCurrentScenario(scenario);
        setAvailableCards(dealCards());
    }, []);

    // Auto-switch to BARK when KoA speaks
    useEffect(() => {
        setMsgMode('BARK');
    }, [currentBark]);

    // Actions
    const handleStart = () => {
        setStep('PANEL');
    };

    const handleCardFocus = (card: MiniCard) => {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        setFocusedCard(card);
    };

    const handleCardBlur = () => {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = setTimeout(() => {
            setFocusedCard(null);
        }, 100); 
    };

    const handleCardClick = (id: string) => {
        if (step !== 'PANEL') return;
        if (selectedCardId === id) setSelectedCardId(null);
        else setSelectedCardId(id);
    };

    const playSelectedCard = () => {
        if (!selectedCardId) return;
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        setFocusedCard(null);

        const card = availableCards.find(c => c.id === selectedCardId);
        if (card) {
            const newPlayed = [...playedCards, card];
            setPlayedCards(newPlayed);
            setSelectedCardId(null);
            
            // Generate Response
            const response = getKoAResponse(card, newPlayed.length);
            setCurrentBark(response);
            
            if (newPlayed.length === 3) {
                 evaluateLocalVerdict(newPlayed);
                 setTimeout(() => setStep('VERDICT'), 2500);
            }
        }
    };

    const getKoAResponse = (card: MiniCard, count: number) => {
        if (count === 3) return "Processing final variables... Stand by.";
        if (count === 2) return `Log updated. I need one more data point to correlate.`;
        
        const phrases = [
            `I've noted that in the temporary cache.`,
            `Does not fully align with sensor data, but proceeding.`,
            `If you say so.`,
            `Calculating relevance...`
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    const evaluateLocalVerdict = (finalCards: MiniCard[]) => {
        const totalStrength = finalCards.reduce((sum, c) => sum + c.strength, 0);
        const hasWeaknessMatch = finalCards.some(c => c.type === currentScenario.weakness);
        const finalScore = totalStrength + (hasWeaknessMatch ? 1 : 0);
        
        let tier: VerdictTier = 'BUSTED';
        let quote = "I have already locked the fridge.";
        
        if (finalScore >= 8) {
            tier = 'FLAWLESS';
            quote = "Logic sound. Unlocking system resources.";
        } else if (finalScore >= 6) {
            tier = 'CLEARED';
            quote = "Fine. I will allow it this once.";
        } else if (finalScore >= 4) {
            tier = 'CLOSE';
            quote = "Your story has holes, but I am feeling generous.";
        }

        const lieIds: string[] = [];
        if (tier === 'BUSTED' || tier === 'CLOSE') {
             const weakest = [...finalCards].sort((a,b) => a.strength - b.strength)[0];
             if (weakest) lieIds.push(weakest.id);
        }
        setVerdictData({ tier, quote, lieIds });
    };

    const getKoaMood = (): KoaMood => {
        if (step === 'VERDICT') {
            if (verdictData?.tier === 'FLAWLESS') return KoaMood.IMPRESSED;
            if (verdictData?.tier === 'CLEARED') return KoaMood.RESIGNED;
            if (verdictData?.tier === 'CLOSE') return KoaMood.SUSPICIOUS;
            return KoaMood.SMUG;
        }
        if (isSpeaking) return KoaMood.PROCESSING;
        if (playedCards.length === 0) return KoaMood.WATCHING;
        if (playedCards.length === 1) return KoaMood.NEUTRAL;
        if (playedCards.length === 2) return KoaMood.SUSPICIOUS;
        return KoaMood.PROCESSING;
    };

    // Determine which card to preview (Focus takes priority over Selection)
    const activePreviewCard = focusedCard || (selectedCardId ? availableCards.find(c => c.id === selectedCardId) : null);

    // --- RENDER ---

    if (step === 'SHARE' && verdictData) {
        return (
            <div className="min-h-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                 <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
                    <div className="absolute inset-0 scanlines opacity-50"></div>
                 </div>

                 <div className="z-10 w-full max-w-sm">
                    <ShareCard 
                        day={Math.floor(Math.random() * 100)} 
                        results={playedCards.map(c => !verdictData.lieIds.includes(c.id))} 
                        tier={verdictData.tier} 
                        quote={verdictData.quote} 
                    />
                    <div className="w-full space-y-2 mt-8">
                        <button onClick={() => setStep('READING')} className="w-full py-3 bg-surface border-2 border-foreground font-mono font-bold uppercase shadow-brutal hover:translate-y-0.5 transition-all">Back to Start</button>
                    </div>
                 </div>
            </div>
        );
    }

    if (step === 'READING') {
         return (
             <div className="h-full relative">
                <button 
                    onClick={onBack} 
                    className="absolute top-2 left-2 z-[60] h-8 w-8 flex items-center justify-center bg-surface border-2 border-foreground rounded-[2px] shadow-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                    <ArrowLeft size={16} className="text-foreground" />
                </button>
                 <div className="absolute bottom-0 left-0 w-full p-6 z-[60] flex justify-center pointer-events-none">
                     <button 
                         onClick={handleStart}
                         className="pointer-events-auto w-full max-w-md py-4 bg-primary text-white font-mono font-bold uppercase rounded-[2px] shadow-brutal border-2 border-foreground animate-in slide-in-from-bottom-4"
                     >
                         Override Lock
                     </button>
                 </div>
                 <EvidenceComparisonView scenario={currentScenario} card={null} />
             </div>
         );
    }

    // MAIN PANEL LAYOUT
    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden font-sans">
            
            {/* BACKGROUND DECO - Global */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
            </div>

            {/* NAV & STATS */}
            <div className="absolute top-2 left-2 z-30">
                 <button onClick={onBack} className="h-8 w-8 flex items-center justify-center bg-surface border-2 border-foreground rounded-[2px] opacity-50 hover:opacity-100 transition-all">
                    <ArrowLeft size={16} />
                 </button>
            </div>

            {/* === ZONE 1: KOA HERO (Flex-row: Avatar Left, Text Right) === */}
            <div className="flex-1 min-h-0 bg-background/50 flex flex-row items-center relative shadow-[0_5px_15px_rgba(0,0,0,0.05)] z-20 pl-0 pr-4 py-4 gap-0 overflow-hidden">
                 
                 {/* Background FX for Portal Area */}
                 <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
                    <div className="absolute inset-0 scanlines opacity-20"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-background/20"></div>
                 </div>

                 {/* Device Frame Deco */}
                 <div className="absolute inset-0 border-[6px] border-foreground/5 pointer-events-none z-10"></div>
                 
                 {/* Avatar Container - EXPANDED & SHIFTED LEFT to use dead space */}
                 <div className="w-[170px] xs:w-[210px] md:w-[300px] aspect-[2/1] relative shrink-0 z-10 -ml-6 flex items-center justify-center">
                    <KoAAvatar mood={getKoaMood()} isSpeaking={isSpeaking} />
                 </div>

                 {/* Current Bark / Logs - Right Side - TABBED INTERFACE */}
                 <div className="flex-1 min-w-0 flex flex-col justify-center h-full z-10 -ml-8 md:-ml-12 relative">
                    <div className="w-full bg-white border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] rounded-[2px] rounded-bl-none relative flex flex-col max-h-full transition-all duration-300">
                        {/* Decorative Corner */}
                        <div className="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1 pointer-events-none"></div>
                        
                        {/* Header: Tabs */}
                        <div className="shrink-0 px-1 py-0 border-b bg-muted/5 border-foreground/20 flex items-stretch h-7">
                             <button 
                                onClick={() => setMsgMode('BARK')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold uppercase transition-colors rounded-tl-[2px] ${msgMode === 'BARK' ? 'bg-white text-primary relative top-[1px] border-b border-white' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
                             >
                                 <MessageSquare size={10} /> SYS_MSG
                             </button>
                             <div className="w-[1px] bg-foreground/10 h-full my-auto"></div>
                             <button 
                                onClick={() => setMsgMode('LOGS')}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold uppercase transition-colors rounded-tr-[2px] ${msgMode === 'LOGS' ? 'bg-white text-primary relative top-[1px] border-b border-white' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'}`}
                             >
                                 <FileText size={10} /> LOGS
                             </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 px-3 py-3 text-xs sm:text-sm leading-relaxed text-foreground font-sans overflow-y-auto scrollbar-hide min-h-[4rem]">
                             {msgMode === 'BARK' ? (
                                 <div className="min-h-full flex items-center">
                                     <div className="w-full text-left">
                                        {step === 'VERDICT' ? (
                                            <span className="animate-in fade-in duration-300">{verdictData?.quote || "Calculating..."}</span>
                                        ) : (
                                            <Typewriter 
                                                text={currentBark} 
                                                speed={30}
                                                onStart={handleSpeechStart}
                                                onComplete={handleSpeechComplete}
                                            />
                                        )}
                                    </div>
                                 </div>
                             ) : (
                                <div className="animate-in fade-in slide-in-from-right-2 duration-200">
                                    <div className="flex items-center gap-2 mb-3 text-red-500 border-b border-red-100 pb-2">
                                        <Lock size={12} className="shrink-0" />
                                        <span className="text-[10px] font-bold leading-tight font-mono uppercase">{currentScenario.header}</span>
                                    </div>
                                    <ul className="space-y-2.5">
                                        {currentScenario.facts.map((fact, i) => (
                                            <li key={i} className="flex gap-2.5 text-[10px] text-foreground/90 leading-snug items-start">
                                                <span className="font-mono font-bold text-muted-foreground opacity-50 shrink-0 mt-0.5">0{i+1}</span>
                                                <span>{fact}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                             )}
                        </div>
                    </div>
                 </div>
            </div>

            {/* === ZONE 3: DYNAMIC DISPLAY (Override Sequence OR Data Analysis) === */}
            <div className="shrink-0 py-3 px-4 bg-background/50 border-b border-foreground/5 z-10 transition-all min-h-[7rem]">
                <div className="flex items-center justify-between mb-2 h-4">
                    {activePreviewCard ? (
                        <div className="text-[10px] font-mono font-bold uppercase text-primary flex items-center gap-1.5 tracking-wider animate-in slide-in-from-left-2 fade-in duration-300">
                            <Activity size={12} /> DATA_ANALYSIS_PREVIEW
                        </div>
                    ) : (
                        <div className="text-[10px] font-mono font-bold uppercase text-muted-foreground flex items-center gap-1.5 tracking-wider animate-in slide-in-from-left-2 fade-in duration-300">
                            <Lock size={12} /> SECURITY_OVERRIDE_SEQUENCE
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setMsgMode(prev => prev === 'LOGS' ? 'BARK' : 'LOGS')}
                        className={`
                            text-[9px] font-mono font-bold uppercase flex items-center gap-1.5 border px-2 py-1 rounded-[2px] transition-colors shadow-sm
                            ${msgMode === 'LOGS' 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-surface text-primary border-foreground/10 hover:bg-white hover:text-primary/80'
                            }
                        `}
                    >
                        {msgMode === 'LOGS' ? <MessageSquare size={11} /> : <FileText size={11} />}
                        {msgMode === 'LOGS' ? 'VIEW_MSG' : 'VIEW_LOGS'}
                    </button>
                </div>

                {/* Content Container (Fixed Height Increased for Stress Test) */}
                <div className="h-24 relative">
                    {activePreviewCard ? (
                        // === MODE A: CARD DETAILS PREVIEW ===
                        <div className="absolute inset-0 flex gap-3 animate-in zoom-in-95 duration-200">
                            {/* Icon Box */}
                            <div className="h-full aspect-square bg-surface border-2 border-primary flex flex-col items-center justify-center shadow-sm shrink-0">
                                <div className="text-2xl mb-1">{activePreviewCard.icon}</div>
                                <span className="text-[8px] font-mono font-bold uppercase bg-primary text-white px-1 rounded-[1px]">{activePreviewCard.type}</span>
                            </div>
                            
                            {/* Text Details */}
                            <div className="flex-1 bg-surface border border-foreground/20 p-2 shadow-sm flex flex-col overflow-hidden">
                                <div className="shrink-0 mb-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xs font-bold font-sans uppercase leading-tight truncate pr-1">{activePreviewCard.title}</h3>
                                        {activePreviewCard.time && <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">{activePreviewCard.time}</span>}
                                    </div>
                                    <div className="text-[9px] font-mono text-muted-foreground truncate">{activePreviewCard.location || 'Unknown Location'}</div>
                                </div>
                                <div className="flex-1 overflow-y-auto scrollbar-hide border-t border-foreground/10 pt-1 min-h-0">
                                    <p className="text-[9px] leading-tight text-foreground/90 font-sans pr-1">
                                        {activePreviewCard.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // === MODE B: SECURITY SLOTS (Default) ===
                        <div className="absolute inset-0 flex gap-3 animate-in zoom-in-95 duration-200">
                            {[0, 1, 2].map(i => {
                                const card = playedCards[i];
                                return (
                                    <div key={i} className={`
                                        flex-1 border-2 rounded-[2px] relative transition-all duration-300 flex items-center justify-center overflow-hidden
                                        ${card 
                                            ? 'bg-surface border-foreground shadow-sm' 
                                            : 'bg-transparent border-dashed border-foreground/20'
                                        }
                                    `}>
                                        {card ? (
                                            <div className="flex flex-col items-center justify-center w-full h-full p-1 animate-in zoom-in-90 duration-300 gap-0.5">
                                                <div className="w-full flex justify-center items-center">
                                                    <span className="text-[8px] font-mono font-bold bg-foreground text-surface px-1.5 py-0.5 rounded-[1px] tracking-wider">{card.type}</span>
                                                </div>
                                                
                                                <div className="flex-1 flex items-center justify-center text-2xl pb-0.5">{card.icon}</div>
                                                
                                                <div className="text-[9px] font-bold text-center leading-none line-clamp-1 w-full px-1 mb-0.5">{card.title}</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center opacity-30 gap-1">
                                                <span className="text-xl">+</span>
                                                <span className="text-[9px] font-mono font-bold">SLOT_0{i+1}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* === ZONE 4: CARD TRAY (Fixed Bottom - Not Scrollable - Compact) === */}
            <div className="shrink-0 bg-surface border-t-2 border-foreground relative z-30 flex flex-col pb-4">
                {step === 'VERDICT' && verdictData ? (
                     <div className="absolute inset-0 bg-surface z-50 flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-full duration-500">
                         <TierBadge tier={verdictData.tier} />
                         <div className="mt-8">
                            <ShareButton onClick={() => setStep('SHARE')} />
                         </div>
                     </div>
                ) : (
                    <>
                        {/* Action Bar */}
                        <div className="h-12 border-b border-foreground/10 flex items-center justify-between px-4 bg-muted/5 shrink-0">
                            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">AVAILABLE VARIABLES</span>
                            <button 
                                onClick={playSelectedCard}
                                disabled={!selectedCardId}
                                className={`
                                    h-8 px-4 text-xs font-mono font-bold uppercase rounded-[2px] border transition-all flex items-center gap-2
                                    ${selectedCardId 
                                        ? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-0.5 active:translate-y-0' 
                                        : 'bg-transparent text-muted-foreground border-foreground/20 cursor-not-allowed'
                                    }
                                `}
                            >
                                TRANSMIT <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Card Grid - Fixed Layout (2 Rows on Mobile) */}
                        <div className="p-3 bg-surface/50">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                {availableCards.map(card => {
                                    const isPlayed = playedCards.some(pc => pc.id === card.id);
                                    return (
                                        <div key={card.id} className="relative">
                                            <CardComponent
                                                card={card}
                                                isSelected={selectedCardId === card.id}
                                                onClick={() => !isPlayed && handleCardClick(card.id)}
                                                onFocus={(c) => handleCardFocus(c as MiniCard)}
                                                onBlur={handleCardBlur}
                                                disabled={isPlayed}
                                                variant="icon"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
