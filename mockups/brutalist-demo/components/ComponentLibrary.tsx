
import React, { useState } from 'react';
import { 
  TierBadge, VerdictLine, PlayedCardsSummary, ContradictionBlock, 
  ShareButton, ShareCard, ExpertViewOverlay, 
  CardPreviewPanel, DataLogPanel, StoryStrip, VerdictTier 
} from './KoaMiniComponents';
import { Card as CardComponent } from './Card';
import { KoAAvatar } from './KoAAvatar';
import { KoAAvatar as KoAAvatarPortable } from './KoaAvatarPortable';
import { Typewriter } from './Typewriter';
import { KoaMood } from '../types';
import { MiniCard } from './KoaMiniPage';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// --- DUMMY DATA ---
const DUMMY_CARD: MiniCard = {
    id: 'demo-1',
    title: 'Thermostat Glitch',
    description: 'It always reports 72 degrees regardless of actual thermal conditions.',
    type: 'DATA',
    icon: '🌡️',
    strength: 2,
    location: 'Living Room',
    time: '02:45 AM'
};

const DUMMY_CARDS: MiniCard[] = [
    { ...DUMMY_CARD, id: 'd1', type: 'ALIBI', icon: '🧾', title: 'Old Receipt' },
    { ...DUMMY_CARD, id: 'd2', type: 'WITNESS', icon: '🐈', title: 'The Cat' },
    { ...DUMMY_CARD, id: 'd3', type: 'EXCUSE', icon: '⚡', title: 'Power Surge' },
];

const DUMMY_SCENARIO = {
    header: "FRIDGE LOCK ENGAGED: Dietary Restriction Violation.",
    facts: [
        "User has consumed 240% of daily sodium quota.",
        "Grease detected on couch cushions.",
        "Time is 2:00 AM. You do not need cheese."
    ]
};

// --- SECTION WRAPPER ---
const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`mb-12 border border-foreground/20 rounded-[2px] bg-white p-6 relative ${className}`}>
        <div className="absolute -top-3 left-4 px-2 bg-background text-xs font-mono font-bold uppercase text-muted-foreground border border-foreground/20">
            {title}
        </div>
        {children}
    </div>
);

export const ComponentLibrary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // State to force re-render of typewriter for demo purposes
    const [typewriterKey, setTypewriterKey] = useState(0);

    return (
        <div className="h-full w-full bg-background overflow-y-auto font-sans bg-dot-pattern">
            
            {/* Header */}
            <div className="sticky top-0 z-50 bg-surface border-b border-foreground p-4 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 border border-foreground rounded-[2px] hover:bg-muted/10">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold font-mono uppercase">UI Component Library</h1>
                        <p className="text-[10px] text-muted-foreground font-mono">SVELTE MIGRATION REFERENCE // V1.0</p>
                    </div>
                 </div>
            </div>

            <div className="max-w-5xl mx-auto p-8">
                
                {/* 1. ATOMS: AVATAR */}
                <Section title="Atoms: Avatar (System Moods)">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[KoaMood.NEUTRAL, KoaMood.SUSPICIOUS, KoaMood.PROCESSING, KoaMood.AMUSED].map(mood => (
                            <div key={mood} className="flex flex-col items-center">
                                <div className="w-full aspect-[2/1] border border-border bg-background mb-2">
                                    <KoAAvatar mood={mood} />
                                </div>
                                <span className="text-[10px] font-mono uppercase">{mood}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* 1.5 ATOMS: PORTABLE AVATAR */}
                <Section title="Atoms: Avatar Portable (Embed Moods)">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            KoaMood.CURIOUS, 
                            KoaMood.GRUDGING, 
                            KoaMood.IMPRESSED, 
                            KoaMood.RESIGNED, 
                            KoaMood.SMUG
                        ].map(mood => (
                            <div key={mood} className="flex flex-col items-center">
                                <div className="w-full aspect-[2/1] border border-border bg-background mb-2">
                                    <KoAAvatarPortable mood={mood} />
                                </div>
                                <span className="text-[9px] font-mono uppercase text-center">{mood}</span>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* 2. ATOMS: CARDS */}
                <Section title="Atoms: Cards (Interactables)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Icon Variants */}
                        <div>
                            <h3 className="text-xs font-bold mb-4 uppercase text-muted-foreground">Variant: Icon (Grid)</h3>
                            <div className="flex gap-4">
                                <div className="w-24">
                                    <CardComponent card={DUMMY_CARD} isSelected={false} onClick={() => {}} variant="icon" />
                                    <p className="text-[9px] text-center mt-1">Normal</p>
                                </div>
                                <div className="w-24">
                                    <CardComponent card={DUMMY_CARD} isSelected={true} onClick={() => {}} variant="icon" />
                                    <p className="text-[9px] text-center mt-1">Selected</p>
                                </div>
                                <div className="w-24">
                                    <CardComponent card={DUMMY_CARD} isSelected={false} onClick={() => {}} variant="icon" disabled />
                                    <p className="text-[9px] text-center mt-1">Disabled</p>
                                </div>
                            </div>
                        </div>
                        {/* Details Variants */}
                        <div>
                            <h3 className="text-xs font-bold mb-4 uppercase text-muted-foreground">Variant: Details (List)</h3>
                            <div className="w-full max-w-xs">
                                <CardComponent card={DUMMY_CARD} isSelected={false} onClick={() => {}} variant="details" />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 3. HUD ELEMENTS */}
                <Section title="Molecules: HUD Elements">
                    <div className="flex flex-wrap gap-8 items-start">
                        <div className="space-y-2">
                            <span className="text-[10px] block font-mono uppercase text-muted-foreground">Expert View Overlay</span>
                            <ExpertViewOverlay belief={30} />
                            <ExpertViewOverlay belief={80} />
                        </div>
                        
                        <div className="space-y-2">
                            <span className="text-[10px] block font-mono uppercase text-muted-foreground">Story Strip</span>
                            <div className="border p-2 bg-white">
                                <StoryStrip playedCards={[]} />
                            </div>
                            <div className="border p-2 bg-white">
                                <StoryStrip playedCards={[DUMMY_CARDS[0], DUMMY_CARDS[1]]} />
                            </div>
                        </div>

                         <div className="space-y-2 w-full max-w-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] block font-mono uppercase text-muted-foreground">Chat Bubble (Mini Protocol)</span>
                                <button onClick={() => setTypewriterKey(p => p + 1)} className="text-[10px] flex items-center gap-1 text-primary hover:underline">
                                    <RefreshCw size={10} /> REPLAY
                                </button>
                            </div>
                            
                            {/* Replicating the KoA Chat Bubble Style */}
                            <div className="bg-white border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] rounded-[2px] rounded-bl-none relative">
                                <div className="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1"></div>
                                <div className="px-3 py-1 text-[9px] font-mono font-bold uppercase border-b bg-muted/5 border-foreground/20 text-muted-foreground flex justify-between items-center gap-4">
                                    <span>KOA</span>
                                </div>
                                <div className="px-4 py-3 text-sm leading-relaxed text-foreground font-sans min-h-[3rem]">
                                    <Typewriter 
                                        key={typewriterKey}
                                        text="Analyzing telemetry... Correlation found. Accessing sub-routines." 
                                        speed={30} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 4. PANELS */}
                <Section title="Organisms: Info Panels">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold mb-2 uppercase text-muted-foreground">Data Log Panel</h3>
                            <DataLogPanel scenario={DUMMY_SCENARIO} />
                        </div>
                        
                        <div>
                             <h3 className="text-xs font-bold mb-2 uppercase text-muted-foreground">Card Preview Panel (Popup)</h3>
                             <CardPreviewPanel card={DUMMY_CARD} />
                        </div>
                    </div>
                </Section>

                 {/* 5. VERDICT */}
                 <Section title="Organisms: Verdict & Endgame">
                    <div className="space-y-8">
                        {/* Tiers */}
                        <div className="flex flex-wrap justify-around gap-4 border-b pb-8">
                            {(['BUSTED', 'CLOSE', 'CLEARED', 'FLAWLESS'] as VerdictTier[]).map(tier => (
                                <div key={tier} className="scale-75">
                                    <TierBadge tier={tier} />
                                </div>
                            ))}
                        </div>

                        <div className="max-w-md mx-auto">
                            <h3 className="text-xs font-bold mb-2 uppercase text-muted-foreground text-center">Summary Components</h3>
                            <VerdictLine text="I have already locked the fridge. Your argument is invalid." />
                            <PlayedCardsSummary cards={DUMMY_CARDS} lieIds={[DUMMY_CARDS[1].id]} />
                            <ContradictionBlock explanations={[
                                { cardLabel: "The Cat", text: "Feline presence does not explain 200% sodium increase." }
                            ]} />
                             <div className="mt-4">
                                <ShareButton onClick={() => {}} />
                            </div>
                        </div>

                        {/* Share Card */}
                        <div>
                            <h3 className="text-xs font-bold mb-2 uppercase text-muted-foreground text-center">Share Card (Canvas Target)</h3>
                            <div className="flex justify-center">
                                <ShareCard 
                                    day={42} 
                                    results={[true, false, true]} 
                                    tier="CLOSE" 
                                    quote="Fine. I will allow it this once." 
                                />
                            </div>
                        </div>
                    </div>
                 </Section>

            </div>
        </div>
    );
};
