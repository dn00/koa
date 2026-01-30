
import React, { useState, useEffect, useRef } from 'react';
import { 
  StoryStrip, 
  TierBadge, VerdictLine, PlayedCardsSummary, ContradictionBlock, 
  ShareButton, ShareCard, TutorialOverlay, 
  ExpertViewOverlay, VerdictTier, Mode,
  EvidenceComparisonView, CardPreviewPanel, IncidentLogModal, DataLogPanel
} from './KoaMiniComponents';
import { KoAAvatar } from './KoaAvatarPortable';
import { Card as CardComponent } from './Card';
import { Typewriter } from './Typewriter';
import { KoaMood, Card } from '../types';
import { DECK } from '../constants';
import { LogOut, ArrowLeft, FolderOpen, Activity, Play, FileText, ArrowDown } from 'lucide-react';

// --- LOCAL GAME DATA (Offline Mode) ---

export interface MiniCard extends Card {
    strength: 1 | 2 | 3;
}

interface MiniLog {
    id: string;
    speaker: 'KOA' | 'PLAYER';
    text?: string;
    card?: MiniCard;
    timestamp: Date;
}

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

export const KoaMiniPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // Game State
    const [step, setStep] = useState<'READING' | 'PICKING' | 'VERDICT' | 'SHARE'>('READING');
    const [currentScenario, setCurrentScenario] = useState(LOCAL_SCENARIOS[0]);
    const [availableCards, setAvailableCards] = useState<MiniCard[]>([]);
    
    const [playedCards, setPlayedCards] = useState<MiniCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null); // For single click selection
    const [focusedCard, setFocusedCard] = useState<MiniCard | null>(null); // For hover details
    
    // Chat Log State
    const [chatLogs, setChatLogs] = useState<MiniLog[]>([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    const [mode, setMode] = useState<Mode>('expert');
    const [showIncidentLog, setShowIncidentLog] = useState(false);

    // Animation & Dialogue State
    const [isSpeaking, setIsSpeaking] = useState(false);

    const [verdictData, setVerdictData] = useState<{ tier: VerdictTier, quote: string, lieIds: string[] } | null>(null);

    // Refs
    const gridRef = useRef<HTMLDivElement>(null);
    const exitRef = useRef<HTMLButtonElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shouldAutoScrollRef = useRef(true);

    // INIT
    useEffect(() => {
        const scenario = LOCAL_SCENARIOS[Math.floor(Math.random() * LOCAL_SCENARIOS.length)];
        setCurrentScenario(scenario);
        setAvailableCards(dealCards());
        
        // Initial Greeting Log
        addLog('KOA', "Access denied. Review the logs. You know what you did.");

        return () => {
            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        };
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (shouldAutoScrollRef.current && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatLogs]);

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShowScrollButton(!isNearBottom);
            shouldAutoScrollRef.current = isNearBottom;
        }
    };

    const scrollToBottom = () => {
        shouldAutoScrollRef.current = true;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const addLog = (speaker: 'KOA' | 'PLAYER', text?: string, card?: MiniCard) => {
        setChatLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            speaker,
            text,
            card,
            timestamp: new Date()
        }]);
    };
    
    // --- ACTIONS ---

    // Focus Handlers
    const handleCardFocus = (card: MiniCard) => {
        // Immediate focus (no delay on open)
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        setFocusedCard(card);
    };

    const handleCardBlur = () => {
        // Delayed blur (keep delay on close)
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = setTimeout(() => {
            setFocusedCard(null);
        }, 100); 
    };

    const handleCardClick = (id: string) => {
        if (step !== 'PICKING') return;
        // Toggle selection for playing
        if (selectedCardId === id) {
            setSelectedCardId(null);
        } else {
            setSelectedCardId(id);
        }
    };

    const playSelectedCard = () => {
        if (!selectedCardId) return;
        
        // Clear focus immediately to prevent popup ghosting
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        setFocusedCard(null);

        const card = availableCards.find(c => c.id === selectedCardId);
        if (card) {
            const newPlayed = [...playedCards, card];
            setPlayedCards(newPlayed);
            setSelectedCardId(null);

            // 1. Add Player Card to Chat
            addLog('PLAYER', undefined, card);

            // 2. Generate KoA Response
            setTimeout(() => {
                const response = getKoAResponse(card, newPlayed.length);
                addLog('KOA', response);
                
                // 3. Check for completion
                if (newPlayed.length === 3) {
                     // Wait for reading then trigger verdict
                     evaluateLocalVerdict(newPlayed);
                     setTimeout(() => setStep('VERDICT'), 2000);
                }
            }, 600);
        }
    };

    const getKoAResponse = (card: MiniCard, count: number) => {
        const phrases = [
            `That... is unlikely given the timestamp.`,
            `Indexing "${card.title}" into the validation queue.`,
            `I am skeptical of that variable.`,
            `Comparing to sensor data...`,
            `Noted. Proceed.`
        ];
        
        if (count === 3) return "Override sequence received. Calculating probability of truth...";
        if (count === 2) return `Correlation analysis running. One more variable required.`;
        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    const handleStart = () => {
        setStep('PICKING');
        addLog('KOA', "Override sequence initiated. Explain yourself.");
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

    // --- SHARE VIEW ---
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
                        <button onClick={() => setStep('MENU' as any)} className="w-full py-3 bg-surface border-2 border-foreground font-mono font-bold uppercase shadow-brutal hover:translate-y-0.5 transition-all">Back to Menu</button>
                    </div>
                 </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden font-sans">
            
            {/* BACKGROUND LAYERS */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/20 to-background/80"></div>
                <div className="absolute inset-0 scanlines opacity-50"></div>
            </div>

            {/* --- FLOATING CONTROLS (Z-20: Below Dim Layer) --- */}
            <div className="absolute top-2 left-2 z-20">
                 <button 
                    ref={exitRef}
                    onClick={onBack} 
                    className="h-8 w-8 flex items-center justify-center bg-surface border-2 border-foreground rounded-[2px] shadow-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                    <ArrowLeft size={16} className="text-foreground" />
                 </button>
            </div>

             {/* --- FLOATING CONTROLS (Z-20: Below Dim Layer) --- */}
             <div className="absolute top-2 right-2 z-20">
                 {/* Only show Expert/Stats view after reading phase */}
                 {step !== 'READING' && <ExpertViewOverlay belief={65 - (playedCards.length * 15)} />}
            </div>

            {/* --- MAIN CENTRAL STAGE (Z-10) --- */}
            <div className="flex-1 relative z-10 overflow-hidden">
                
                {/* 1. INITIAL READING PHASE */}
                {step === 'READING' ? (
                    <EvidenceComparisonView 
                        scenario={currentScenario} 
                        card={null}
                    />
                ) : (
                    /* 2. MAIN INTERACTION (Chat + Avatar) */
                    <div className="h-full flex flex-col pt-4 relative">
                        
                        {/* Avatar */}
                        <div className="shrink-0 flex flex-col items-center justify-center relative min-h-[120px] z-10 pb-2">
                            <div className="w-[70%] max-w-[220px] aspect-[2/1] relative transition-all duration-500">
                                <KoAAvatar mood={getKoaMood()} isSpeaking={isSpeaking} />
                            </div>
                        </div>

                        {/* Chat Log - Added mask for smooth scrolling transition */}
                        <div 
                            className="flex-1 overflow-y-auto px-4 py-2 space-y-4 scrollbar-hide z-10 pb-4" 
                            ref={chatContainerRef}
                            onScroll={handleScroll}
                            style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 32px)' }}
                        >
                            {chatLogs.map((log) => {
                                const isKoa = log.speaker === 'KOA';
                                if (isKoa) {
                                    return (
                                        <div key={log.id} className="flex justify-start animate-in slide-in-from-left-2 fade-in duration-300">
                                            <div className="max-w-[85%] bg-white border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] rounded-[2px] rounded-bl-none relative">
                                                <div className="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1"></div>
                                                <div className="px-3 py-1 text-[9px] font-mono font-bold uppercase border-b bg-muted/5 border-foreground/20 text-muted-foreground flex justify-between items-center gap-4">
                                                    <span>KOA</span>
                                                </div>
                                                <div className="px-4 py-3 text-sm leading-relaxed text-foreground font-sans min-h-[3rem]">
                                                    {log === chatLogs[chatLogs.length - 1] ? (
                                                        <Typewriter 
                                                            text={log.text || ''} 
                                                            speed={20} 
                                                            onStart={() => setIsSpeaking(true)}
                                                            onComplete={() => {
                                                                setIsSpeaking(false);
                                                                if (shouldAutoScrollRef.current) scrollToBottom();
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>{log.text}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={log.id} className="flex justify-end animate-in slide-in-from-right-2 fade-in duration-300">
                                            <div className="max-w-[85%] w-full md:w-auto min-w-[200px] bg-surface border border-foreground shadow-brutal rounded-[2px] rounded-br-none relative overflow-hidden group pointer-events-none">
                                                <div className="px-3 py-1.5 bg-foreground text-surface text-[9px] font-mono font-bold uppercase flex justify-between items-center">
                                                    <span>YOU SENT: {log.card?.id}</span>
                                                </div>
                                                {log.card && (
                                                    <div className="p-0">
                                                         <CardComponent 
                                                            card={log.card} 
                                                            isSelected={false} 
                                                            onClick={() => {}} 
                                                            variant="details" 
                                                            disabled={false} 
                                                         />
                                                         <style>{`.group .shadow-brutal { box-shadow: none !important; border: none !important; }`}</style>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                            <div ref={bottomRef} />
                        </div>
                        
                        {/* Floating Scroll Button */}
                        {showScrollButton && (
                             <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                                <button
                                    onClick={scrollToBottom}
                                    className="pointer-events-auto bg-primary text-white p-2 rounded-full shadow-brutal border-2 border-foreground hover:translate-y-1 active:translate-y-2 transition-all animate-bounce"
                                >
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* DIMMING LAYER (Root Z-40) */}
            <div 
                className={`absolute inset-0 bg-black/60 z-40 transition-opacity duration-300 pointer-events-none ${focusedCard ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* POPUPS (Root Z-60) - Justified Start (Top) */}
            {focusedCard && step !== 'READING' && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-start gap-4 pointer-events-none pt-16 px-4">
                     {/* Top: Scenario Data */}
                     <div className="w-full max-w-md animate-in slide-in-from-top-2 fade-in duration-200">
                        <DataLogPanel scenario={currentScenario} />
                     </div>
                     
                     {/* Bottom: Card Preview */}
                     <div className="w-full max-w-md animate-in slide-in-from-top-4 fade-in duration-200">
                        <CardPreviewPanel card={focusedCard} />
                     </div>
                </div>
            )}

            {/* --- INCIDENT LOG MODAL --- */}
            {showIncidentLog && (
                <IncidentLogModal 
                    scenario={currentScenario} 
                    onClose={() => setShowIncidentLog(false)} 
                />
            )}

            {/* --- VERDICT VIEW OVERRIDE --- */}
            {step === 'VERDICT' && verdictData && (
                <div className="absolute inset-0 bg-background/95 z-40 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-10 px-4">
                        <TierBadge tier={verdictData.tier} />
                        <VerdictLine text={verdictData.quote} />
                        <PlayedCardsSummary cards={playedCards} lieIds={verdictData.lieIds} />
                        
                        {verdictData.lieIds.length > 0 && (
                        <ContradictionBlock explanations={[{ 
                            cardLabel: playedCards.find(c => verdictData.lieIds.includes(c.id))?.title || 'Evidence', 
                            text: "Contradicts established baseline data." 
                        }]} />
                    )}
                    <div className="mt-8">
                        <ShareButton onClick={() => setStep('SHARE')} />
                    </div>
                </div>
            )}

            {/* --- BOTTOM GRID (Z-50: Above Dim Layer) --- */}
            {step !== 'VERDICT' && (
                <div className="shrink-0 bg-surface border-t-2 border-foreground z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] pb-safe" ref={gridRef}>
                    {step === 'READING' ? (
                        <div className="p-6 text-center">
                            <p className="text-xs font-mono text-muted-foreground mb-4">ACCESS DENIED: MANUAL OVERRIDE REQUIRED</p>
                            <button 
                                onClick={handleStart}
                                className="w-full max-w-xs py-3 bg-primary text-white font-mono font-bold uppercase rounded-[2px] shadow-brutal hover:translate-y-[-2px] transition-all border-2 border-foreground"
                            >
                                Init Override
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Status Bar */}
                            <div className="flex justify-between items-center px-4 py-2 border-b border-foreground/10 bg-muted/5">
                                <StoryStrip playedCards={playedCards} />
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowIncidentLog(true)}
                                        className="px-3 py-2 font-mono font-bold text-[10px] uppercase rounded-[2px] border-2 border-foreground bg-surface text-foreground shadow-sm hover:shadow-brutal transition-all flex items-center gap-2"
                                    >
                                        <FileText size={14} /> <span className="hidden sm:inline">SYSTEM LOGS</span>
                                    </button>
                                    
                                    <button 
                                        onClick={playSelectedCard}
                                        disabled={!selectedCardId}
                                        className={`
                                            px-6 py-2 font-mono font-bold text-xs uppercase rounded-[2px] border-2 transition-all flex items-center gap-2
                                            ${selectedCardId 
                                                ? 'bg-foreground text-surface border-foreground shadow-brutal hover:-translate-y-0.5 active:translate-y-0' 
                                                : 'bg-transparent text-muted-foreground border-border cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        PLAY <Play size={10} fill="currentColor" />
                                    </button>
                                </div>
                            </div>

                            {/* Card Grid - Non-scrollable */}
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-2 max-w-4xl mx-auto">
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
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
