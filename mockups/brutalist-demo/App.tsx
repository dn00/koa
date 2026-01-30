
import React, { useState, useEffect, useRef } from 'react';
import { generateScenario, evaluateDefense } from './services/geminiService';
import { KoAAvatar, MOOD_EXPRESSIONS } from './components/KoAAvatar';
import { Card as CardComponent } from './components/Card';
import { Typewriter } from './components/Typewriter';
import { KoaMiniPage } from './components/KoaMiniPage'; 
import { ComponentLibrary } from './components/ComponentLibrary'; // Import ComponentLibrary
import { DECK, KOA_SKINS } from './constants';
import { GameState, KoaMood, ChatLog, Scenario, Card, AvatarExpression, KoaSkin } from './types';
import { Lock, Unlock, ShieldAlert, Activity, ArrowDown } from 'lucide-react';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [mood, setMood] = useState<KoaMood>(KoaMood.NEUTRAL);
  const [skin, setSkin] = useState<KoaSkin>(KOA_SKINS[0]); // Current equipped skin
  const [scenario, setScenario] = useState<Scenario | null>(null);
  
  const [logs, setLogs] = useState<ChatLog[]>([]);
  
  const [hand, setHand] = useState<Card[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [focusedCard, setFocusedCard] = useState<Card | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Game Logic State
  const [turn, setTurn] = useState(0);
  const MAX_TURNS = 3;
  
  // Gallery/Lab State
  const [labMood, setLabMood] = useState<KoaMood>(KoaMood.NEUTRAL);
  const [labExp, setLabExp] = useState<AvatarExpression>({ ...MOOD_EXPRESSIONS[KoaMood.NEUTRAL] });
  const [labSkin, setLabSkin] = useState<KoaSkin>(KOA_SKINS[0]); // Preview skin in lab
  const [labIsSpeaking, setLabIsSpeaking] = useState(false);
  
  // Chat Scrolling State
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Track if we should auto-scroll on next render
  const shouldAutoScrollRef = useRef(true);

  // Auto-scroll logic
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
        scrollToBottom();
    }
  }, [logs]);

  // Sync lab skin when opening gallery
  useEffect(() => {
    if (gameState === GameState.GALLERY) {
        setLabSkin(skin);
    }
  }, [gameState, skin]);

  const scrollToBottom = () => {
    // Small timeout ensures the DOM has updated with the new message height
    setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
        
        // Update our auto-scroll preference based on user position
        // If user scrolls up, disable auto-scroll
        // If user is at bottom, enable auto-scroll
        shouldAutoScrollRef.current = isNearBottom;
    }
  };

  const startGame = async () => {
    setGameState(GameState.LOADING);
    setMood(KoaMood.PROCESSING);
    setTurn(0);
    
    // Draw 6 random cards
    const shuffled = [...DECK].sort(() => 0.5 - Math.random());
    setHand(shuffled.slice(0, 6));
    
    // Generate Scenario
    const newScenario = await generateScenario();
    setScenario(newScenario);
    
    // Populate logs with prototype history (3 messages)
    setLogs([
      {
        speaker: 'KOA',
        text: "System check complete. analyzing prior behavioral anomalies...",
        mood: KoaMood.WATCHING
      },
      {
        speaker: 'PLAYER',
        text: "[Ghost]: It wasn't me! The house is clearly haunted.",
      },
      {
        speaker: 'KOA',
        text: `Negative. Ectoplasm sensors read zero. \n\nReviewing current household telemetry: ${newScenario.anomaly} ${newScenario.sensorData}`,
        mood: KoaMood.SUSPICIOUS
      }
    ]);
    
    // Reset scroll state for new game
    shouldAutoScrollRef.current = true;
    
    setMood(KoaMood.SUSPICIOUS);
    setGameState(GameState.PLAYING);
  };

  const handleCardClick = (id: string) => {
    if (selectedCardIds.includes(id)) {
      setSelectedCardIds(selectedCardIds.filter(cid => cid !== id));
    } else {
      if (selectedCardIds.length < 3) {
        setSelectedCardIds([...selectedCardIds, id]);
      }
    }
  };

  const submitDefense = async () => {
    if (selectedCardIds.length === 0 || !scenario) return;

    setIsEvaluating(true);
    setMood(KoaMood.PROCESSING);

    // Add player move to log with rich detail
    const selectedCards = hand.filter(c => selectedCardIds.includes(c.id));
    // Richer log format: "[Title]: Description"
    const playerText = selectedCards.map(c => `[${c.title}]: ${c.description}`).join('\n+ ');
    
    // Force scroll when player submits
    shouldAutoScrollRef.current = true;
    
    const newLogs = [...logs, { speaker: 'PLAYER', text: playerText } as ChatLog];
    setLogs(newLogs);

    // Increment turn
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    // Get Gemini Response
    const result = await evaluateDefense(scenario, selectedCards, newLogs.map(l => l.text));
    
    // Create all 3 messages immediately
    const koaResponseLogs: ChatLog[] = result.narrativeSections.map((text, index) => ({
        speaker: 'KOA',
        text: text,
        // Only set the specific mood on the final message
        mood: index === result.narrativeSections.length - 1 ? result.mood : undefined 
    }));
    
    // Add all messages to the log at once
    setLogs(prev => [...prev, ...koaResponseLogs]);
    
    // Update avatar mood immediately to the result mood
    setMood(result.mood);

    setIsEvaluating(false);
    setSelectedCardIds([]);

    // Check Verdict or Max Turns
    // We wait a bit for the user to read (Typewriter on last message will take some time)
    const readingTime = 4000; 

    if (result.verdict === 'WIN') {
      setTimeout(() => setGameState(GameState.GAME_OVER), readingTime);
    } else if (result.verdict === 'LOSS' || nextTurn >= MAX_TURNS) {
      setTimeout(() => {
        if (result.verdict !== 'WIN') setMood(KoaMood.DISAPPOINTED);
        setGameState(GameState.GAME_OVER);
      }, readingTime);
    } else {
        // Continue but remove used cards
        setHand(prev => prev.filter(c => !selectedCards.find(sc => sc.id === c.id)));
    }
  };

  // Lab Helper
  const handlePresetChange = (newMood: KoaMood) => {
      setLabMood(newMood);
      // Ensure we spread the object to create a new reference, forcing React to update sliders
      if (MOOD_EXPRESSIONS[newMood]) {
        setLabExp({ ...MOOD_EXPRESSIONS[newMood] });
      }
  };

  const equipSkin = (newSkin: KoaSkin) => {
      setSkin(newSkin);
      setLabSkin(newSkin);
  };

  const randomizeLabExpression = () => {
      setLabExp({
          lidTop: Math.floor(Math.random() * 80) - 20,
          lidBottom: Math.floor(Math.random() * 80) - 20,
          lidAngle: Math.floor(Math.random() * 60) - 30,
          pupilScale: parseFloat((0.4 + Math.random() * 1.2).toFixed(1)),
          lidCurveTop: Math.floor(Math.random() * 60) - 30,
          lidCurveBottom: Math.floor(Math.random() * 60) - 30,
      });
      setLabMood(KoaMood.NEUTRAL); // Reset mood selector to indicate custom
  };

  const isShake = mood === KoaMood.ANGRY || (gameState === GameState.GAME_OVER && mood === KoaMood.DISAPPOINTED);

  // --- NEW VIEWS ---
  if (gameState === GameState.KOA_MINI) {
    return <KoaMiniPage onBack={() => setGameState(GameState.MENU)} />;
  }

  if (gameState === GameState.LIBRARY) {
    return <ComponentLibrary onBack={() => setGameState(GameState.MENU)} />;
  }

  // --- VIEWS ---

  if (gameState === GameState.MENU) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-background relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#2D3142 1px, transparent 1px), linear-gradient(90deg, #2D3142 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="z-10 bg-surface border-2 border-foreground shadow-brutal-lg p-8 max-w-sm w-full relative">
          <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-muted-foreground">SYS.INIT.V2</div>
          <div className="flex justify-center mb-8">
             <div className="w-32 h-32 relative">
                <KoAAvatar mood={KoaMood.WATCHING} skin={skin} />
             </div>
          </div>
          
          <h1 className="text-3xl font-sans font-bold text-foreground mb-2 tracking-tight text-center">
            Home Smart Home
          </h1>
          <p className="font-mono text-xs text-muted-foreground mb-8 text-center uppercase tracking-widest border-b border-border pb-4">
            Domestic Compliance Suite
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={startGame}
              className="w-full py-4 bg-primary text-white font-mono font-bold uppercase rounded-[2px] shadow-brutal hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all border-2 border-foreground"
            >
              Start Shift
            </button>
            <div className="flex gap-3">
                <button 
                onClick={() => setGameState(GameState.GALLERY)}
                className="flex-1 py-4 bg-surface text-foreground font-mono font-bold uppercase rounded-[2px] shadow-brutal border-2 border-foreground hover:bg-background active:translate-y-0 active:shadow-none transition-all"
                >
                Diagnostics
                </button>
                <button 
                onClick={() => setGameState(GameState.KOA_MINI)}
                className="flex-1 py-4 bg-surface text-foreground font-mono font-bold uppercase rounded-[2px] shadow-brutal border-2 border-foreground hover:bg-background active:translate-y-0 active:shadow-none transition-all"
                >
                Mini Protocol
                </button>
            </div>
            {/* Component Library Button */}
             <button 
                onClick={() => setGameState(GameState.LIBRARY)}
                className="w-full py-2 bg-muted/10 text-muted-foreground font-mono font-bold text-[10px] uppercase rounded-[2px] border border-transparent hover:border-foreground hover:text-foreground transition-all"
            >
                UI Component Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GALLERY) {
    return (
      <div className="flex h-full bg-background overflow-hidden font-sans">
        {/* Sidebar Controls */}
        <div className="w-80 border-r border-border bg-surface flex flex-col h-full shadow-brutal z-10 overflow-y-auto">
            <div className="p-4 border-b border-border bg-background/50">
                <button onClick={() => setGameState(GameState.MENU)} className="text-xs font-mono font-bold uppercase text-muted-foreground hover:text-primary mb-2 flex items-center gap-1">
                    ← Return
                </button>
                <h2 className="text-xl font-bold text-foreground">Diagnostics Lab</h2>
            </div>
            
            <div className="p-6 space-y-8">
                 {/* PRESETS */}
                 <div className="space-y-3">
                     <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">Mood Simulation</label>
                     <div className="relative">
                        <select 
                          value={labMood} 
                          onChange={(e) => handlePresetChange(e.target.value as KoaMood)}
                          className="w-full bg-background border border-foreground rounded-[2px] px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-brutal active:shadow-none active:translate-y-[2px] transition-all"
                        >
                          {Object.values(KoaMood).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-[10px]">▼</div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                             onClick={randomizeLabExpression}
                             className="flex-1 py-2 text-xs font-mono border border-foreground rounded-[2px] hover:bg-background"
                        >
                             RND_VARS
                        </button>
                        <button 
                             onClick={() => setLabIsSpeaking(!labIsSpeaking)}
                             className={`flex-1 py-2 text-xs font-mono border border-foreground rounded-[2px] transition-colors ${labIsSpeaking ? 'bg-primary text-white' : 'hover:bg-background'}`}
                        >
                             {labIsSpeaking ? 'VOCAL_ON' : 'VOCAL_OFF'}
                        </button>
                     </div>
                 </div>

                 {/* SLIDERS */}
                 <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-border pb-1">
                        <label className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Manual Override</label>
                      </div>
                      {[
                        { label: "Lid: Upper", val: labExp.lidTop, max: 100, min: -20, set: (v:number) => setLabExp({...labExp, lidTop: v}) },
                        { label: "Lid: Lower", val: labExp.lidBottom, max: 100, min: -20, set: (v:number) => setLabExp({...labExp, lidBottom: v}) },
                        { label: "Curve: Top", val: labExp.lidCurveTop ?? 12, min: -40, max: 40, set: (v:number) => setLabExp({...labExp, lidCurveTop: v}) },
                        { label: "Curve: Btm", val: labExp.lidCurveBottom ?? 12, min: -40, max: 40, set: (v:number) => setLabExp({...labExp, lidCurveBottom: v}) },
                        { label: "Rotation", val: labExp.lidAngle, min: -45, max: 45, set: (v:number) => setLabExp({...labExp, lidAngle: v}) },
                        { label: "Pupil", val: labExp.pupilScale * 10, min: 2, max: 20, set: (v:number) => setLabExp({...labExp, pupilScale: v / 10}) },
                      ].map((ctrl, i) => (
                        <div key={i} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                             <span>{ctrl.label}</span>
                             <span className="text-foreground">{ctrl.label === 'Pupil' ? (ctrl.val/10).toFixed(1) : ctrl.val}</span>
                           </div>
                           <input 
                             type="range" min={ctrl.min || 0} max={ctrl.max} 
                             value={ctrl.val} 
                             onChange={(e) => ctrl.set(parseInt(e.target.value))}
                             className="w-full h-1 bg-border rounded-none appearance-none cursor-pointer accent-primary"
                           />
                        </div>
                      ))}
                 </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-grid-technical relative">
           {/* Preview Area */}
           <div className="flex-none p-8 flex justify-center items-center min-h-[400px] border-b border-border bg-background">
               <div className="bg-surface border-2 border-foreground shadow-brutal-lg p-2 w-full max-w-[400px]">
                   <div className="w-full aspect-[2/1] relative bg-background border border-border">
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground z-10">CAM_01</div>
                        {/* We use a key here to force re-render when mood changes to reset internal animations */}
                        <KoAAvatar 
                            key={`${labMood}-${labSkin.id}`} 
                            mood={labMood} 
                            expressionOverride={labExp} 
                            skin={labSkin} 
                            isSpeaking={labIsSpeaking}
                        />
                   </div>
                   <div className="flex justify-between items-center mt-2 px-1">
                       <span className="text-[10px] font-mono font-bold uppercase">{labSkin.name}</span>
                       <span className="text-[10px] font-mono text-muted-foreground">{labMood}</span>
                   </div>
               </div>
           </div>

           {/* Skins Grid */}
           <div className="p-8">
               <h3 className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-6">Available Chassis</h3>
               <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {KOA_SKINS.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => equipSkin(s)}
                        className={`
                            group flex flex-col bg-surface border-2 transition-all duration-200 p-3
                            ${skin.id === s.id 
                                ? 'border-primary shadow-brutal translate-x-[-2px] translate-y-[-2px]' 
                                : 'border-foreground hover:shadow-brutal-hover hover:-translate-y-1'
                            }
                        `}
                    >
                        <div className="w-full aspect-[2/1] bg-background mb-3 border border-border flex items-center justify-center overflow-hidden">
                             <div className="w-full h-full scale-75">
                                 <KoAAvatar mood={KoaMood.NEUTRAL} skin={s} />
                             </div>
                        </div>
                        <div className="flex justify-between items-center w-full">
                            <span className={`text-xs font-mono font-bold uppercase ${skin.id === s.id ? 'text-primary' : 'text-foreground'}`}>
                                {s.name}
                            </span>
                            {skin.id === s.id && <div className="w-2 h-2 bg-primary"></div>}
                        </div>
                    </button>
                 ))}
               </div>
           </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    const isWin = mood === KoaMood.ACCEPTING || mood === KoaMood.AMUSED || mood === KoaMood.GLITCH;
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background bg-grid-technical">
             <div className="bg-surface border-2 border-foreground shadow-brutal-lg p-8 w-full max-w-md">
                 <div className="w-48 h-24 mx-auto mb-8">
                    <KoAAvatar mood={isWin ? KoaMood.AMUSED : KoaMood.DISAPPOINTED} skin={skin} />
                </div>
                <h2 className={`text-2xl font-bold mb-2 font-mono uppercase ${isWin ? 'text-secondary' : 'text-primary'}`}>
                    {isWin ? "Anomaly Authorized" : "Compliance Failure"}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed font-sans border-t border-b border-border py-4 my-6">
                    {isWin 
                        ? "KoA has updated your lifestyle profile. Proceed with caution." 
                        : "Smart lock privileges suspended. Please manually operate your doors."}
                </p>
                <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="w-full py-3 bg-foreground text-surface hover:bg-foreground/90 font-mono font-bold uppercase tracking-wider rounded-[2px]"
                >
                    Reboot System
                </button>
            </div>
        </div>
    )
  }

  // PLAYING & LOADING
  return (
    <div className={`flex flex-col h-full bg-background font-sans ${isShake ? 'animate-shake' : ''} overflow-hidden relative`}>
      
      {/* BACKGROUND LAYERS */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {/* Dotted Grid */}
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.15]"></div>
          {/* Vignette (Soft edges to focus center) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-background/20 to-background/80"></div>
          {/* Scanlines */}
          <div className="absolute inset-0 scanlines opacity-50"></div>
      </div>

      {/* --- HUD OVERLAY --- */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        
        {/* Left: System Status (Dimmed) */}
        <div className="bg-surface/80 backdrop-blur-sm border border-foreground/20 rounded-[2px] p-1.5 flex flex-col items-start gap-1 pointer-events-auto transition-all">
             <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${mood === KoaMood.SUSPICIOUS || mood === KoaMood.ANGRY ? 'bg-primary' : 'bg-secondary'}`} />
                 <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
             </div>
             <div className="flex items-center gap-1.5 opacity-80">
                 {mood === KoaMood.ACCEPTING || mood === KoaMood.AMUSED ? <Unlock size={14} className="text-foreground" /> : <Lock size={14} className="text-foreground" />}
                 <span className="font-bold text-xs tracking-tight text-foreground">
                    {mood === KoaMood.ACCEPTING || mood === KoaMood.AMUSED ? 'UNLOCKED' : 'LOCKED'}
                 </span>
             </div>
        </div>

        {/* Right: Attempts/Turns (Dimmed) */}
        <div className="bg-surface/80 backdrop-blur-sm border border-foreground/20 rounded-[2px] p-1.5 flex flex-col items-end gap-1 pointer-events-auto">
             <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Attempts</span>
             <div className="flex gap-1">
                {[...Array(MAX_TURNS)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`
                            w-3 h-3 rounded-[1px] border transition-all duration-300
                            ${i < turn 
                                ? 'bg-foreground border-foreground opacity-20' // Used (very dim)
                                : i === turn 
                                    ? 'bg-primary border-primary' // Active (pop)
                                    : 'bg-transparent border-foreground/30' // Future (dim outline)
                            }
                        `}
                    />
                ))}
             </div>
        </div>
      </div>

      {/* --- KOA AVATAR STAGE (CENTERED, NO CONTAINER) --- */}
      <div className="flex-none pt-8 pb-2 z-10 relative flex flex-col items-center justify-end">
         
         {/* The Avatar - Floating, no container */}
         <div className="w-full max-w-[320px] md:max-w-[400px] aspect-[2/1] relative">
             <KoAAvatar mood={mood} skin={skin} isSpeaking={isSpeaking} />
         </div>

      </div>

      {/* DIALOGUE PANEL (CHAT LOG or DETAIL OVERLAY) */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* BACKGROUND CHAT LOGS */}
        <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide z-10"
        >
            {gameState === GameState.LOADING && (
               <div className="text-center font-mono text-xs text-muted-foreground mt-10 animate-pulse">ESTABLISHING_UPLINK...</div>
            )}

            <div className="max-w-2xl mx-auto space-y-6 pb-24">
                {logs.map((log, idx) => {
                    const isLast = idx === logs.length - 1;
                    const isKoa = log.speaker === 'KOA';
                    return (
                    <div key={idx} className={`flex ${!isKoa ? 'justify-end' : 'justify-start'}`}>
                        <div 
                        className={`
                            max-w-[85%] border shadow-sm relative group
                            ${!isKoa 
                            ? 'bg-surface border-foreground rounded-[2px] rounded-br-none shadow-brutal mr-1' 
                            : 'bg-white border-foreground rounded-[2px] rounded-bl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ml-1'
                            }
                        `}
                        >
                            {/* Decorative Corner */}
                            <div className={`absolute w-2 h-2 border-t border-l border-foreground/20 top-1 ${isKoa ? 'left-1' : 'right-1 rotate-90'}`}></div>

                            {/* Label */}
                            <div className={`px-3 py-1 text-[9px] font-mono font-bold uppercase border-b flex justify-between items-center ${!isKoa ? 'bg-muted/5 border-foreground text-foreground' : 'bg-muted/5 border-foreground/20 text-muted-foreground'}`}>
                                <span>{log.speaker}</span>
                                {isKoa && <span className="text-[8px] opacity-50">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                            </div>
                            
                            <div className="px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                                {isLast && isKoa ? (
                                    <Typewriter 
                                        text={log.text} 
                                        speed={20} 
                                        onStart={() => setIsSpeaking(true)}
                                        onComplete={() => {
                                          setIsSpeaking(false);
                                          // Update scroll check after typing finishes as height changes
                                          handleScroll(); 
                                          if (shouldAutoScrollRef.current) scrollToBottom();
                                        }} 
                                    />
                                ) : (
                                    log.text
                                )}
                            </div>
                        </div>
                    </div>
                    );
                })}
                {/* Scroll Anchor */}
                <div ref={bottomRef} />
            </div>
        </div>
        
        {/* Floating Scroll Down Button */}
        {showScrollButton && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-40 pointer-events-none">
                <button
                    onClick={() => {
                        shouldAutoScrollRef.current = true;
                        scrollToBottom();
                    }}
                    className="pointer-events-auto bg-primary text-white p-2 rounded-full shadow-brutal border-2 border-foreground hover:translate-y-1 active:translate-y-2 transition-all animate-bounce"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown size={20} />
                </button>
            </div>
        )}

        {/* CARD DETAIL OVERLAY (FADE IN) */}
        {focusedCard && (
            <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-surface border-2 border-primary shadow-brutal-lg p-6 relative">
                     <div className="absolute -top-3 left-4 bg-background px-2 border border-primary text-primary text-xs font-mono font-bold uppercase tracking-wider">
                        EVIDENCE_ANALYSIS
                     </div>
                     
                     <div className="flex gap-4 mb-6">
                         <div className="w-16 h-16 bg-primary text-white text-3xl flex items-center justify-center border-2 border-foreground rounded-[2px] shadow-brutal">
                             {focusedCard.icon}
                         </div>
                         <div className="flex-1">
                             <div className="text-[10px] font-mono font-bold text-muted-foreground mb-1 uppercase">
                                 TYPE: {focusedCard.type}
                             </div>
                             <h2 className="text-xl font-bold font-sans leading-tight text-foreground">
                                 {focusedCard.title}
                             </h2>
                         </div>
                     </div>
                     
                     <div className="font-mono text-sm leading-relaxed text-foreground border-t border-border pt-4">
                         {focusedCard.description}
                     </div>

                     <div className="mt-6 flex gap-2">
                        {/* Fake telemetry for flavor */}
                         <div className="h-1 bg-border flex-1 rounded-full overflow-hidden">
                             <div className="h-full bg-primary w-[70%]"></div>
                         </div>
                         <div className="text-[9px] font-mono text-muted-foreground">RELEVANCE: 70%</div>
                     </div>
                </div>
            </div>
        )}
      </div>

      {/* GRID HAND AREA */}
      <div className="flex-none bg-surface border-t-2 border-foreground p-2 z-30 shadow-[0_-5px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
            {/* TOOLBAR */}
            <div className="flex justify-between items-center mb-1 pb-1 border-b border-border">
                <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    EVIDENCE BUFFER ({selectedCardIds.length}/3)
                </span>
                <button 
                    onClick={submitDefense}
                    disabled={selectedCardIds.length === 0 || isEvaluating}
                    className={`
                        px-3 py-1 font-mono font-bold text-[10px] uppercase rounded-[2px] transition-all border-2
                        ${selectedCardIds.length > 0 && !isEvaluating
                            ? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none' 
                            : 'bg-background text-muted-foreground border-border cursor-not-allowed'
                        }
                    `}
                >
                    {isEvaluating ? 'PROCESSING...' : 'SUBMIT'}
                </button>
            </div>

            {/* GRID OF CARDS (3 cols mobile, 6 cols desktop) */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {hand.map(card => (
                    <CardComponent 
                        key={card.id}
                        card={card}
                        isSelected={selectedCardIds.includes(card.id)}
                        onClick={() => handleCardClick(card.id)}
                        onFocus={setFocusedCard}
                        onBlur={() => setFocusedCard(null)}
                        disabled={isEvaluating}
                    />
                ))}
                {/* Fill empty slots visually if needed, though usually not required for this design */}
                {hand.length === 0 && gameState === GameState.PLAYING && (
                    <div className="col-span-3 md:col-span-6 text-center text-muted-foreground font-mono text-xs py-8 border-2 border-dashed border-border opacity-50">
                        BUFFER_EMPTY
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
