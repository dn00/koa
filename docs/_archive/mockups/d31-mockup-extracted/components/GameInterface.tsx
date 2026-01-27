import React, { useState, useMemo } from 'react';
import { ShieldCheck, AlertCircle, BarChart2, RotateCcw, Lock, Unlock } from 'lucide-react';
import { SCENARIO } from '../constants';
import { EvidenceCard, CounterEvidence, Concern, AuraMood } from '../types';
import { checkContradiction, calculateDamage, hasCorroboration } from '../utils';
import AuraAvatar from './AuraAvatar';
import CounterCard from './CounterCard';
import EvidenceCardComponent from './EvidenceCard';

const ConcernChip: React.FC<{ concern: Concern }> = ({ concern }) => (
  <div className={`
    px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all flex items-center gap-2
    ${concern.addressed
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm'
      : 'bg-white text-gray-400 border-gray-200 border-dashed'}
  `}>
    {concern.addressed ? <ShieldCheck className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border-2 border-gray-300" />}
    {concern.auraAsks}
  </div>
);

const GameInterface: React.FC = () => {
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

    // Check for refutation FIRST to apply to current state if needed
    // In this model, refuting marks the counter as refuted for future calculation, 
    // but we can also flavor it as "Saving the turn"
    const refutationCard = selectedCards.find(c => c.refutes);
    let updatedCounters = [...counters];
    
    if (refutationCard) {
      updatedCounters = counters.map(counter =>
        counter.id === refutationCard.refutes
          ? { ...counter, refuted: true }
          : counter
      );
      setCounters(updatedCounters);
    }

    // Recalculate damage with the potentially newly refuted counter for THIS turn
    // (If we refuted the active counter in this turn, it shouldn't penalty us)
    // We do a quick check to see if the activeCounter is the one we just refuted
    const effectiveActiveCounter = activeCounter && refutationCard?.refutes === activeCounter.id ? null : activeCounter;
    
    const finalDamageCalc = calculateDamage(selectedCards, effectiveActiveCounter);
    
    // Apply damage
    const newResistance = Math.max(0, resistance - finalDamageCalc.total);
    setResistance(newResistance);

    // Mood Logic
    if (refutationCard) {
      setAuraMood('GRUDGING');
      setAuraMessage("...How convenient. Fine. I'll allow it.");
    } else if (effectiveActiveCounter) {
      setAuraMood('SUSPICIOUS');
      setAuraMessage(`My ${effectiveActiveCounter.name} says otherwise. Your evidence carries less weight.`);
    } else if (corroboration.has) {
      setAuraMood('IMPRESSED');
      setAuraMessage("Your evidence aligns. Annoyingly consistent.");
    } else if (contradictionWarning?.severity === 'MINOR') {
      setAuraMood('SUSPICIOUS');
      setAuraMessage("I'll accept that, but it's sloppy.");
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
      <div className="flex flex-col h-screen bg-slate-900 text-white p-6 relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50 pointer-events-none"></div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 z-10 max-w-md mx-auto">
          <AuraAvatar mood="SUSPICIOUS" size="lg" />

          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-[0.2em] mb-3 animate-pulse">
              System Locked: {SCENARIO.targetName}
            </div>
            <p className="text-xl font-medium text-slate-200 leading-relaxed font-mono">
              "{SCENARIO.auraOpening}"
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full shadow-2xl">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <AlertCircle className="w-3 h-3" /> AURA's Challenges
            </div>
            <div className="space-y-3">
              {SCENARIO.counters.map(counter => (
                <div key={counter.id} className="text-sm text-red-300 bg-red-900/20 p-2 rounded border border-red-500/20">
                  "{counter.claim}"
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('SOLVE')}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2"
          >
             BUILD YOUR ALIBI
          </button>
        </div>
      </div>
    );
  }

  // Render: RESULT
  if (phase === 'RESULT') {
    const win = resistance <= 0 && concerns.every(c => c.addressed);

    return (
      <div className={`flex flex-col h-screen p-6 ${win ? 'bg-emerald-950' : 'bg-rose-950'} text-white relative overflow-hidden`}>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 z-10">
          <AuraAvatar mood={win ? 'DEFEATED' : 'SMUG'} size="lg" />

          <div>
            <div className="flex items-center justify-center gap-2 mb-4">
              {win ? <Unlock className="w-8 h-8 text-emerald-400" /> : <Lock className="w-8 h-8 text-rose-400" />}
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tight">
              {win ? 'ACCESS GRANTED' : 'LOCKDOWN INITIATED'}
            </h1>
            <p className="text-lg text-white/80 max-w-md mx-auto font-mono">
              {win
                ? "Enjoy your midnight snack. I'll be watching."
                : "The fridge remains locked. Try again tomorrow."}
            </p>
          </div>

          <div className="bg-black/20 p-6 rounded-2xl w-full max-w-sm backdrop-blur-sm border border-white/10">
            <div className="text-sm space-y-3 font-mono">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Turns Used</span>
                <span className="font-bold">{SCENARIO.turns - turnsLeft} / {SCENARIO.turns}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Scrutiny</span>
                <span className={`${scrutiny > 0 ? 'text-orange-400' : 'text-emerald-400'} font-bold`}>{scrutiny}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Concerns Met</span>
                <span className="font-bold">{concerns.filter(c => c.addressed).length} / {concerns.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
        </div>
      </div>
    );
  }

  // Render: SOLVE
  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Header HUD */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm z-20 shrink-0">
        {/* Top Row: Resistance & Stats Toggle */}
        <div className="flex justify-between items-end mb-2">
          <div className="flex-1 mr-4">
             <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resistance</span>
              <span className="text-[10px] font-mono text-slate-600">{showStats ? `${resistance}/${SCENARIO.resistance}` : ''}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-700 ease-out"
                style={{ width: `${(resistance / SCENARIO.resistance) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>

        {/* Concerns */}
        <div className="flex flex-wrap gap-2 mb-3">
          {concerns.map(concern => (
            <ConcernChip key={concern.id} concern={concern} />
          ))}
        </div>

        {/* Scrutiny & Turns */}
        <div className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-500 uppercase">Scrutiny</span>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${i <= scrutiny ? 'bg-orange-500 shadow-sm' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
          <div className="font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {turnsLeft} TURNS LEFT
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 pb-32"> {/* Padding bottom for fixed hand */}
        <div className="max-w-md mx-auto w-full p-4 space-y-6">
          
          {/* AURA Section */}
          <div className="flex flex-col items-center">
            <AuraAvatar mood={auraMood} size="md" />
            <div className="mt-4 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 text-center relative max-w-[280px]">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200 transform rotate-45"></div>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">"{auraMessage}"</p>
            </div>
          </div>

          {/* Counters */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Counter-Evidence</div>
            <div className="grid gap-2">
              {counters.map(counter => (
                <CounterCard key={counter.id} counter={counter} />
              ))}
            </div>
          </div>

          {/* Interaction Zone: Warnings & Previews */}
          <div className="min-h-[80px]">
            {contradictionWarning && (
              <div className={`p-4 rounded-xl border-2 animate-in slide-in-from-bottom-2 fade-in duration-300 ${
                contradictionWarning.severity === 'MAJOR'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <div className="flex items-start gap-3">
                   <div className={`p-2 rounded-full shrink-0 ${contradictionWarning.severity === 'MAJOR' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                     <AlertCircle className="w-5 h-5" />
                   </div>
                   <div>
                      <div className="font-bold text-sm uppercase tracking-wide mb-1">
                        {contradictionWarning.severity === 'MAJOR' ? 'Contradiction Detected' : 'Suspicious Timeline'}
                      </div>
                      <p className="text-sm leading-relaxed opacity-90">{contradictionWarning.message}</p>
                      {contradictionWarning.severity === 'MINOR' && (
                        <p className="text-xs mt-2 font-bold bg-yellow-100/50 px-2 py-1 rounded w-fit">+1 Scrutiny penalty applied</p>
                      )}
                   </div>
                </div>
              </div>
            )}

            {/* Corroboration Success */}
            {corroboration.has && !contradictionWarning && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  Stories Align
                </div>
                <p className="text-xs opacity-80">Evidence corroborates on {corroboration.type}. <strong>+25% Damage Bonus.</strong></p>
              </div>
            )}
             
            {/* Damage Preview */}
            {selectedCards.length > 0 && !contradictionWarning && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Projected Impact</span>
                         <div className="flex items-center gap-2">
                             {activeCounter && activeCounter.id !== selectedCards.find(c => c.refutes)?.refutes && !activeCounter.refuted && (
                                <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">CONTESTED</span>
                             )}
                             <span className="font-bold font-mono text-lg text-indigo-600">{damage.total}</span>
                         </div>
                    </div>
                    {showStats && (
                        <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-100 pt-2 space-y-1 font-mono">
                            {damage.breakdown.map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Section: Hand & Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        {/* Submit Button Floating above hand */}
        <div className="absolute -top-6 left-0 right-0 flex justify-center px-4 pointer-events-none">
             <button
                onClick={handleSubmit}
                disabled={selectedCards.length === 0 || contradictionWarning?.severity === 'MAJOR'}
                className={`
                    pointer-events-auto shadow-xl transform transition-all active:scale-95
                    px-8 py-3 rounded-full font-bold text-sm tracking-wide uppercase flex items-center gap-2
                    ${selectedCards.length > 0 && contradictionWarning?.severity !== 'MAJOR'
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-1'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                `}
            >
                {contradictionWarning?.severity === 'MAJOR'
                ? 'Resolve Conflict'
                : selectedCards.length === 0 
                    ? 'Select Evidence' 
                    : 'Submit Testimony'}
            </button>
        </div>

        {/* Card Scroll Area */}
        <div className="pt-8 pb-6 px-4 overflow-x-auto">
            <div className="flex gap-3 min-w-max mx-auto px-2">
            {hand.map(card => {
                const isSelected = !!selectedCards.find(c => c.id === card.id);
                // Check if adding this card creates a contradiction
                const tempSelection = isSelected ? [] : [card]; // Simple check, real app needs robust "what if" check
                const wouldContradict = !isSelected && checkContradiction(card, committedStory);

                return (
                <EvidenceCardComponent
                    key={card.id}
                    card={card}
                    selected={isSelected}
                    onClick={() => handleCardSelect(card)}
                    showStats={showStats}
                    showWarning={!!wouldContradict}
                    warningType={wouldContradict?.severity}
                    disabled={selectedCards.length >= 3 && !isSelected}
                />
                );
            })}
            </div>
        </div>
        
        {/* Committed Story (Tiny visualization) */}
        {committedStory.length > 0 && (
            <div className="px-4 pb-2 text-[10px] text-slate-300 flex gap-1 justify-center overflow-hidden">
                {committedStory.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default GameInterface;