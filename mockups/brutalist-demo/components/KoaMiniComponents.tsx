
import React from 'react';
import { 
  ShieldAlert, Check, X, Star, Share2, 
  Settings, Info, Zap, Lock, Unlock,
  HelpCircle, AlertTriangle, Eye, ArrowRight, FolderOpen, Scale, Activity, FileText, Play
} from 'lucide-react';
import { MiniCard } from './KoaMiniPage';
import { Card as CardComponent } from './Card';

// --- TYPES ---
export type VerdictTier = 'BUSTED' | 'CLOSE' | 'CLEARED' | 'FLAWLESS';
export type Mode = 'mini' | 'expert';

// --- NEW: COMPACT CARD PREVIEW (Floating HUD) ---
export const CardPreviewPanel: React.FC<{ card: MiniCard }> = ({ card }) => (
    <div className="bg-surface border-2 border-primary shadow-brutal-lg p-3 flex flex-col gap-2 max-w-md mx-auto relative group">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-primary/20 clip-corner"></div>
        
        <div className="flex justify-between items-start">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 flex items-center justify-center bg-muted/10 border border-foreground/10 rounded-[2px] text-xl">
                    {card.icon}
                 </div>
                 <div>
                     <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono font-bold uppercase bg-primary text-white px-1.5 rounded-[1px]">{card.type}</span>
                        {card.location && <span className="text-[9px] font-mono text-muted-foreground uppercase">{card.location}</span>}
                     </div>
                     <div className="text-sm font-bold leading-none font-sans text-foreground">{card.title}</div>
                 </div>
             </div>
             <div className="text-[10px] font-mono font-bold bg-muted/10 px-1.5 py-0.5 rounded-[1px] border border-transparent">
                {card.time || '--:--'}
             </div>
        </div>
        <div className="text-xs font-mono opacity-90 leading-relaxed border-t border-dashed border-foreground/20 pt-2 text-foreground/80">
            {card.description}
        </div>
    </div>
);

// --- NEW: DATA LOG PANEL (Reusable) ---
export const DataLogPanel: React.FC<{ 
    scenario: { header: string, facts: string[] },
    className?: string,
    onClose?: () => void
}> = ({ scenario, className, onClose }) => (
    <div className={`bg-surface border-2 border-foreground shadow-brutal-lg flex flex-col relative z-10 rounded-[2px] overflow-hidden ${className}`}>
         {/* Header */}
         <div className="flex justify-between items-center px-4 py-2 border-b-2 border-foreground bg-muted/5 shrink-0">
            <div className="flex items-center gap-2">
                <FileText size={14} />
                <h2 className="font-mono font-bold uppercase text-xs">System Logs</h2>
            </div>
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="w-5 h-5 flex items-center justify-center hover:bg-foreground/10 rounded-[2px] transition-colors"
                >
                    <X size={14} />
                </button>
            )}
         </div>

         {/* Body */}
         <div className="p-4 bg-surface">
             <div className="flex items-start gap-3 mb-4 bg-red-50/50 p-2 border border-red-100 rounded-[2px]">
                 <Lock className="text-red-500 shrink-0 mt-0.5" size={16} />
                 <div>
                     <div className="text-[8px] font-mono font-bold text-red-500 uppercase mb-0.5">Lockout Reason</div>
                     <p className="text-sm font-bold leading-tight text-foreground">{scenario.header}</p>
                 </div>
             </div>
             <div>
                 <ul className="space-y-2">
                    {scenario.facts.map((fact, i) => (
                        <li key={i} className="flex gap-2 text-[11px] font-sans text-foreground bg-muted/5 p-2 rounded-[2px] border-l-2 border-foreground group hover:bg-muted/10 transition-colors">
                            <span className="font-mono font-bold opacity-40">0{i+1}</span>
                            <span>{fact}</span>
                        </li>
                    ))}
                 </ul>
             </div>
         </div>
         
         {/* Optional Footer for Modal version */}
         {onClose && (
            <div className="p-2 border-t border-foreground/10 bg-muted/5 text-center shrink-0">
                <button onClick={onClose} className="text-[10px] font-mono font-bold uppercase text-primary hover:underline">
                    Close Log
                </button>
            </div>
         )}
    </div>
);

// --- NEW: INCIDENT LOG MODAL (Wrapper) ---
export const IncidentLogModal: React.FC<{ scenario: { header: string, facts: string[] }, onClose: () => void }> = ({ scenario, onClose }) => (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop with Blur */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" 
            onClick={onClose}
        ></div>
        
        {/* Modal Content */}
        <div className="w-full max-w-md max-h-[80%] animate-in zoom-in-95 duration-200">
             <DataLogPanel scenario={scenario} onClose={onClose} />
        </div>
    </div>
);

// --- 1. EVIDENCE COMPARISON VIEW (Refactored for Reading Mode) ---
export const EvidenceComparisonView: React.FC<{ 
    scenario: { header: string, facts: string[] }; 
    card?: MiniCard | null;
}> = ({ scenario, card }) => (
    <div className="h-full w-full flex flex-col bg-surface/95 p-0 animate-in fade-in duration-200 overflow-hidden relative z-50">
        
        {/* TOP: LOCKOUT REPORT - Takes flex-1 to fill space */}
        <div className="flex-1 bg-surface border-b-2 border-foreground shadow-sm flex flex-col relative group overflow-hidden min-h-0">
            <div className="bg-foreground text-surface px-4 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Lock size={14} className="text-red-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">ACCESS_DENIED</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                 <div className="mb-6 pb-4 border-b border-foreground/10">
                     <p className="text-lg font-bold text-foreground leading-snug">{scenario.header}</p>
                 </div>

                 <div>
                     <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase mb-3">SENSOR LOGS</h3>
                     <ul className="space-y-3">
                        {scenario.facts.map((fact, i) => (
                            <li key={i} className="flex gap-3 text-sm font-mono text-foreground bg-muted/5 p-3 rounded-[1px] border-l-4 border-foreground/20">
                                <span className="font-bold opacity-50 text-xs">0{i+1}</span>
                                <span className="leading-snug">{fact}</span>
                            </li>
                        ))}
                     </ul>
                 </div>
            </div>
        </div>

        {/* BOTTOM: INSTRUCTIONS - Fixed/Shrinkable so it doesn't block report */}
        <div className="flex-none bg-muted/5 flex flex-col p-6 border-t-2 border-foreground/5 relative">
            <div className="flex items-center gap-2 mb-4 opacity-70">
                <Info size={14} className="text-foreground" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">OVERRIDE_WIZARD</span>
            </div>

            <div className="grid gap-3 max-w-lg mx-auto w-full">
                {/* Step 1 */}
                <div className="flex gap-3 items-center group">
                    <div className="w-6 h-6 rounded-[2px] bg-surface border-2 border-foreground flex items-center justify-center shrink-0 text-[10px] font-bold">01</div>
                    <p className="text-xs text-muted-foreground leading-tight"><strong className="text-foreground">Analyze Telemetry.</strong> Why is the system flagging you?</p>
                </div>

                 {/* Step 2 */}
                 <div className="flex gap-3 items-center group">
                    <div className="w-6 h-6 rounded-[2px] bg-surface border-2 border-foreground flex items-center justify-center shrink-0 text-[10px] font-bold">02</div>
                    <p className="text-xs text-muted-foreground leading-tight"><strong className="text-foreground">Input Variables.</strong> Submit 3 data points to recontextualize the event.</p>
                </div>

                 {/* Step 3 */}
                 <div className="flex gap-3 items-center group">
                    <div className="w-6 h-6 rounded-[2px] bg-surface border-2 border-foreground flex items-center justify-center shrink-0 text-[10px] font-bold">03</div>
                    <p className="text-xs text-muted-foreground leading-tight"><strong className="text-foreground">Execute Override.</strong> If correlation is within tolerance, access is restored.</p>
                </div>
            </div>
            
            <div className="mt-4 pt-2 text-center border-t border-dashed border-foreground/20">
                <div className="inline-block text-[9px] font-mono text-muted-foreground px-2 py-1 rounded-[2px]">
                    WAITING_FOR_INPUT...
                </div>
            </div>
        </div>
    </div>
);

// --- 2. GAME SCREEN COMPONENTS ---

// 2.5 StoryStrip - Tiny indicators for the header
export const StoryStrip: React.FC<{ playedCards: MiniCard[] }> = ({ playedCards }) => (
  <div className="flex items-center gap-1">
     <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase mr-2 tracking-wider hidden sm:block">SEQUENCE</span>
     {[0, 1, 2].map((i) => {
         const card = playedCards[i];
         const isCurrent = i === playedCards.length;
         return (
             <div key={i} className={`
                w-8 h-8 border rounded-[1px] flex items-center justify-center transition-all 
                ${card 
                    ? 'bg-foreground border-foreground text-surface' 
                    : isCurrent 
                        ? 'bg-primary/10 border-primary animate-pulse' 
                        : 'bg-transparent border-foreground/20'
                }
             `}>
                 {card 
                    ? <span className="text-[10px]">{card.icon}</span> 
                    : <span className={`text-[8px] font-mono ${isCurrent ? 'text-primary' : 'opacity-20'}`}>0{i+1}</span>
                 }
             </div>
         )
     })}
  </div>
);

// --- 3. VERDICT COMPONENTS (Kept mostly same) ---

export const TierBadge: React.FC<{ tier: VerdictTier }> = ({ tier }) => {
    // Map internal VerdictTier to Display Compliance Text
    const tierDisplay = {
        'BUSTED': 'LOCKOUT ACTIVE',
        'CLOSE': 'SYSTEM MONITORING',
        'CLEARED': 'ACCESS RESTORED',
        'FLAWLESS': 'ADMIN BYPASS'
    }[tier];

    return (
        <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-500">
            <div className={`w-20 h-20 rounded-full border-4 border-foreground shadow-brutal-lg flex items-center justify-center text-white mb-3 ${tier === 'BUSTED' ? 'bg-red-500' : tier === 'CLOSE' ? 'bg-yellow-500' : tier === 'CLEARED' ? 'bg-green-500' : 'bg-yellow-400'}`}>
            {tier === 'BUSTED' ? <Lock size={32} /> : tier === 'CLOSE' ? <AlertTriangle size={32} /> : tier === 'CLEARED' ? <Unlock size={32} /> : <Star size={32} fill="currentColor" />}
            </div>
            <h1 className="text-3xl font-black font-mono uppercase tracking-tighter text-foreground text-center leading-none">{tierDisplay}</h1>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground mt-2">SYSTEM STATUS</p>
        </div>
    );
};

export const VerdictLine: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center px-6 mb-6">
    <p className="font-mono text-sm text-foreground/80 italic">"{text}"</p>
  </div>
);

export const PlayedCardsSummary: React.FC<{ cards: MiniCard[]; lieIds: string[] }> = ({ cards, lieIds }) => (
  <div className="px-4 mb-6">
    <div className="grid grid-cols-3 gap-2">
      {cards.map(card => (
        <div key={card.id} className="relative aspect-square bg-surface border-2 border-foreground flex flex-col items-center justify-center p-2 rounded-[2px] shadow-sm">
             <div className="text-2xl mb-1">{card.icon}</div>
             <div className="text-[8px] font-mono font-bold uppercase text-center leading-none line-clamp-2">{card.title}</div>
             <div className={`absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border border-white text-white text-[10px] ${lieIds.includes(card.id) ? 'bg-red-500' : 'bg-green-500'}`}>
                  {lieIds.includes(card.id) ? <X size={10} /> : <Check size={10} />}
             </div>
        </div>
      ))}
    </div>
  </div>
);

export const ContradictionBlock: React.FC<{ explanations: { cardLabel: string, text: string }[] }> = ({ explanations }) => (
  <div className="mx-4 bg-red-50 border-2 border-red-900 p-4 rounded-[2px] mb-6 shadow-sm">
      <h3 className="text-[10px] font-mono font-bold text-red-900 uppercase tracking-widest mb-3 border-b border-red-200 pb-2">
        LOGIC FAILURES DETECTED
      </h3>
      <ul className="space-y-3">
        {explanations.map((exp, i) => (
           <li key={i} className="text-xs font-sans text-red-900 flex gap-2">
              <span className="font-mono font-bold bg-white px-1 border border-red-200 rounded-[2px] h-fit whitespace-nowrap">{exp.cardLabel}</span>
              <span className="opacity-90">{exp.text}</span>
           </li>
        ))}
      </ul>
  </div>
);

export const ShareButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="w-full bg-foreground text-surface font-mono font-bold uppercase py-4 rounded-[2px] shadow-brutal hover:translate-y-0.5 hover:shadow-brutal-hover active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
    <Share2 size={18} /> Share Report
  </button>
);

export const ShareCard: React.FC<{ day: number; results: boolean[]; tier: VerdictTier; quote: string }> = ({ day, results, tier, quote }) => {
    const tierDisplay = {
        'BUSTED': 'LOCKED',
        'CLOSE': 'PROBATION',
        'CLEARED': 'UNLOCKED',
        'FLAWLESS': 'OPTIMAL'
    }[tier];

    return (
        <div className="bg-surface p-6 border-4 border-foreground shadow-brutal-lg max-w-xs mx-auto my-8">
            <div className="flex justify-between items-end border-b-2 border-foreground pb-2 mb-4">
                <div><div className="text-[10px] font-mono font-bold text-muted-foreground uppercase">KOA MINI</div><div className="text-xl font-bold font-mono">DAY {day}</div></div>
                <div className={`px-2 py-0.5 text-[8px] font-bold text-white uppercase rounded-[2px] ${tier === 'BUSTED' ? 'bg-red-500' : 'bg-green-500'}`}>{tierDisplay}</div>
            </div>
            <div className="flex justify-center gap-3 text-2xl mb-4 py-2 bg-background border border-foreground/20 rounded-[2px]">{results.map((r, i) => <span key={i}>{r ? '✅' : '❌'}</span>)}</div>
            <p className="font-mono text-xs italic text-center opacity-80 border-t border-foreground/10 pt-4">"{quote}"</p>
        </div>
    );
};

// --- TUTORIAL & OTHER ---
export const TutorialOverlay: React.FC<{ text: string; onNext: () => void; targetRect?: DOMRect }> = ({ text, onNext, targetRect }) => (
    <div className="hidden"></div> 
);

export const ExpertViewOverlay: React.FC<{ belief: number }> = ({ belief }) => (
    <div className="w-32 animate-in fade-in duration-500">
        <div className="bg-surface/90 border border-foreground/50 p-2 rounded-[2px] shadow-sm backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] font-mono font-bold uppercase text-muted-foreground">UNLOCK PROBABILITY</span>
                <span className="text-[8px] font-mono font-bold text-primary">{Math.max(0, Math.min(100, 100 - belief))}%</span>
            </div>
            <div className="w-full h-1.5 bg-background border border-foreground/20 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-red-500 to-green-400 transition-all duration-500" 
                    style={{ width: `${Math.max(0, Math.min(100, 100 - belief))}%` }} 
                ></div>
            </div>
        </div>
    </div>
);

// Deprecated components included to prevent breakages if referenced
export const LongTermCommentaryBanner: React.FC<any> = () => null;
export const CaseFileOverlay: React.FC<any> = () => null;
export const KnownFactsList: React.FC<any> = () => null;
export const ScenarioHeader: React.FC<any> = () => null;
export const ProgressIndicator: React.FC<any> = () => null;
export const ModeToggle: React.FC<any> = () => null;
