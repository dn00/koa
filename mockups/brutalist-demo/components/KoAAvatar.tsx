
import React, { useState, useEffect, useId } from 'react';
import ReactDOM from 'react-dom/client';
import { KoaMood, AvatarExpression, KoaSkin } from '../types';
import { KOA_SKINS } from '../constants';

interface KoAAvatarProps {
  mood?: KoaMood | string;
  skin?: KoaSkin;
  className?: string;
  expressionOverride?: Partial<AvatarExpression>; // The "Knobs"
  isSpeaking?: boolean;
  width?: number | string;
  height?: number | string;
}

// Default expressions for each mood
export const MOOD_EXPRESSIONS: Record<string, AvatarExpression> = {
  [KoaMood.NEUTRAL]:      { lidTop: -2, lidBottom: -2, lidAngle: 0,  pupilScale: 1.0, lidCurveTop: 12, lidCurveBottom: 12 }, 
  [KoaMood.WATCHING]:     { lidTop: -5, lidBottom: -5, lidAngle: 0,  pupilScale: 1.3, lidCurveTop: 14, lidCurveBottom: 14 }, 
  [KoaMood.SUSPICIOUS]:   { lidTop: 40, lidBottom: 35, lidAngle: 0,  pupilScale: 0.6, lidCurveTop: 2,  lidCurveBottom: 2 }, 
  [KoaMood.DISAPPOINTED]: { lidTop: 55, lidBottom: 0,  lidAngle: 0,  pupilScale: 0.8, lidCurveTop: 8,  lidCurveBottom: 10 }, 
  [KoaMood.AMUSED]:       { lidTop: 5,  lidBottom: 40, lidAngle: 0,  pupilScale: 1.1, lidCurveTop: 25, lidCurveBottom: -25 }, 
  [KoaMood.SLEEPY]:       { lidTop: 45, lidBottom: 45, lidAngle: 0,  pupilScale: 0.5, lidCurveTop: 12, lidCurveBottom: 12 }, 
  [KoaMood.ANGRY]:        { lidTop: 25, lidBottom: 25, lidAngle: 15, pupilScale: 1.0, lidCurveTop: -5, lidCurveBottom: 5 }, 
  [KoaMood.GLITCH]:       { lidTop: 10, lidBottom: 10, lidAngle: -5, pupilScale: 0.8, lidCurveTop: 10, lidCurveBottom: 10 }, 
  [KoaMood.PROCESSING]:   { lidTop: 0,  lidBottom: 0,  lidAngle: 0,  pupilScale: 1.0, lidCurveTop: 12, lidCurveBottom: 12 }, 
  [KoaMood.ACCEPTING]:    { lidTop: 0,  lidBottom: 15, lidAngle: 0,  pupilScale: 1.2, lidCurveTop: 16, lidCurveBottom: 16 }, 
  
  // New Moods (Portable)
  [KoaMood.CURIOUS]:      { lidTop: -8, lidBottom: -5, lidAngle: 2,  pupilScale: 1.15, lidCurveTop: 15, lidCurveBottom: 15 },
  [KoaMood.GRUDGING]:     { lidTop: 20, lidBottom: 10, lidAngle: 0,  pupilScale: 0.9,  lidCurveTop: 5,  lidCurveBottom: 5 },
  [KoaMood.IMPRESSED]:    { lidTop: -5, lidBottom: 20, lidAngle: 0,  pupilScale: 1.25, lidCurveTop: 20, lidCurveBottom: -15 },
  [KoaMood.RESIGNED]:     { lidTop: 45, lidBottom: 10, lidAngle: -2, pupilScale: 0.85, lidCurveTop: 10, lidCurveBottom: 10 },
  [KoaMood.SMUG]:         { lidTop: 15, lidBottom: 35, lidAngle: -8, pupilScale: 1.0,  lidCurveTop: 5,  lidCurveBottom: -20 },
};

// Color Palette for Moods (Eye Colors)
const MOOD_COLORS: Record<string, { main: string, pupil: string }> = {
  [KoaMood.NEUTRAL]:      { main: '#06b6d4', pupil: '#cffafe' }, // Cyan
  [KoaMood.WATCHING]:     { main: '#3b82f6', pupil: '#dbeafe' }, // Blue
  [KoaMood.SUSPICIOUS]:   { main: '#f59e0b', pupil: '#fffbeb' }, // Amber
  [KoaMood.DISAPPOINTED]: { main: '#64748b', pupil: '#e2e8f0' }, // Dim Slate
  [KoaMood.AMUSED]:       { main: '#10b981', pupil: '#d1fae5' }, // Emerald
  [KoaMood.SLEEPY]:       { main: '#6366f1', pupil: '#e0e7ff' }, // Indigo
  [KoaMood.ANGRY]:        { main: '#ef4444', pupil: '#fee2e2' }, // Red
  [KoaMood.GLITCH]:       { main: '#d946ef', pupil: '#fae8ff' }, // Fuchsia
  [KoaMood.PROCESSING]:   { main: '#8b5cf6', pupil: '#ede9fe' }, // Violet
  [KoaMood.ACCEPTING]:    { main: '#14b8a6', pupil: '#ccfbf1' }, // Teal
  
  // New Mood Colors
  [KoaMood.CURIOUS]:      { main: '#2dd4bf', pupil: '#ccfbf1' }, // Teal-400
  [KoaMood.GRUDGING]:     { main: '#ea580c', pupil: '#ffedd5' }, // Orange-600
  [KoaMood.IMPRESSED]:    { main: '#fbbf24', pupil: '#fffbeb' }, // Amber-400 (Gold)
  [KoaMood.RESIGNED]:     { main: '#94a3b8', pupil: '#f1f5f9' }, // Slate-400
  [KoaMood.SMUG]:         { main: '#c026d3', pupil: '#fae8ff' }, // Fuchsia-600
};

export const KoAAvatar: React.FC<KoAAvatarProps> = ({ 
  mood = KoaMood.NEUTRAL, 
  skin = KOA_SKINS[0], 
  className = '', 
  expressionOverride,
  isSpeaking = false,
  width = '100%',
  height = '100%'
}) => {
  // --- STATE ---
  const [isBlinking, setIsBlinking] = useState(false);
  const [irisRotation, setIrisRotation] = useState(0);
  const [innerRingRotation, setInnerRingRotation] = useState(0);
  const uid = useId();

  // Randomize start direction and speed for that "alive" feel
  const [idleSpin] = useState(() => ({
    duration: 30 + Math.random() * 20, // 30-50s
    direction: Math.random() > 0.5 ? 'normal' : 'reverse'
  }));

  // 1. Blink Loop
  useEffect(() => {
    if (mood === KoaMood.SLEEPY || mood === KoaMood.GLITCH || mood === KoaMood.PROCESSING) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const nextBlinkTime = Math.random() * 4000 + 2000;
      timeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        scheduleBlink();
      }, nextBlinkTime);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, [mood]);

  // 2. Idle Iris Rotation (The "Fast" Mechanical Snaps)
  useEffect(() => {
    if (mood === KoaMood.GLITCH || mood === KoaMood.PROCESSING) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleRotation = () => {
        const nextTime = Math.random() * 4000 + 1500; 
        timeout = setTimeout(() => {
            const spin = [-180, -90, -45, 45, 90, 180][Math.floor(Math.random() * 6)];
            setIrisRotation(prev => prev + spin);
            scheduleRotation();
        }, nextTime);
    };
    scheduleRotation();
    return () => clearTimeout(timeout);
  }, [mood]);

  // 3. Inner Ring Rotation
  useEffect(() => {
    if (mood === KoaMood.GLITCH || mood === KoaMood.PROCESSING) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleInnerRotation = () => {
        const nextTime = Math.random() * 3000 + 1000; 
        timeout = setTimeout(() => {
            const spin = [-90, -45, 45, 90][Math.floor(Math.random() * 4)];
            setInnerRingRotation(prev => prev + spin);
            scheduleInnerRotation();
        }, nextTime);
    };
    scheduleInnerRotation();
    return () => clearTimeout(timeout);
  }, [mood]);

  // --- RENDER PREP ---

  // 1. Resolve Expression
  const defaultExp = MOOD_EXPRESSIONS[mood] || MOOD_EXPRESSIONS[KoaMood.NEUTRAL];
  const exp: AvatarExpression = {
    lidTop: expressionOverride?.lidTop ?? defaultExp.lidTop,
    lidBottom: expressionOverride?.lidBottom ?? defaultExp.lidBottom,
    lidAngle: expressionOverride?.lidAngle ?? defaultExp.lidAngle,
    pupilScale: expressionOverride?.pupilScale ?? defaultExp.pupilScale,
    lidCurveTop: expressionOverride?.lidCurveTop ?? defaultExp.lidCurveTop ?? 12,
    lidCurveBottom: expressionOverride?.lidCurveBottom ?? defaultExp.lidCurveBottom ?? 12,
  };

  const colors = MOOD_COLORS[mood] || MOOD_COLORS[KoaMood.NEUTRAL];
  const isProcessing = mood === KoaMood.PROCESSING;
  const isGlitch = mood === KoaMood.GLITCH;
  const isLaughing = mood === KoaMood.AMUSED;
  const isSleepy = mood === KoaMood.SLEEPY;
  const isScanning = isProcessing || mood === KoaMood.SUSPICIOUS;
  const isBrutalist = skin.id === 'brutalist-v2';

  // Override eye colors for brutalist skin to match Coral/Sage/Charcoal theme
  const activeColor = isBrutalist ? '#E07A5F' : colors.main;
  const pupilColor = isBrutalist ? '#FFFFFF' : colors.pupil;

  // --- GEOMETRY: FLOATING LENS ARCHITECTURE ---
  
  // Lens Configuration
  const LENS_RADIUS = 22; // Inner glass
  const LID_RADIUS = 32;  // Outer eyelids (covers the ring and more of screen)
  const LENS_CENTER_X = 100;
  const LENS_CENTER_Y = 50;
  
  // Ring Math for Perfect Gaps
  const RING_RADIUS = 23;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; 
  const RING_SEGMENTS = 3; 
  const RING_GAP_PX = 14.5; // Visual size of the gap in px
  const RING_DASH_PX = (RING_CIRCUMFERENCE / RING_SEGMENTS) - RING_GAP_PX;

  // Map 0-100% inputs to Local Coordinate Space (-R to +R) using LID_RADIUS
  // This ensures 100% closed fully covers the outer radius
  const mapLidPos = (p: number) => ((p / 100) * (LID_RADIUS * 2)) - LID_RADIUS;
  
  // Lid positions relative to Lens Center (0,0)
  const lidY_Top = mapLidPos(isBlinking ? 50 : exp.lidTop);
  const lidY_Bottom = LID_RADIUS - (( (isBlinking ? 50 : exp.lidBottom) / 100) * (LID_RADIUS * 2));

  // Curve scaling
  const CURVE_SCALE = 0.5;
  const cTop = (exp.lidCurveTop ?? 12) * CURVE_SCALE;
  const cBot = (exp.lidCurveBottom ?? 12) * CURVE_SCALE;

  // Lid Path Generation
  const BUFFER = LID_RADIUS + 10; // Ensure coverage outside the clip circle
  
  // Top Lid
  const tlY = lidY_Top;
  const topLidPath = `
    M ${-BUFFER} ${-BUFFER} 
    L ${BUFFER} ${-BUFFER} 
    L ${BUFFER} ${tlY + cTop} 
    Q 0 ${tlY - cTop} ${-BUFFER} ${tlY + cTop} 
    Z`;

  // Bottom Lid
  const blY = lidY_Bottom;
  const bottomLidPath = `
    M ${-BUFFER} ${BUFFER} 
    L ${BUFFER} ${BUFFER} 
    L ${BUFFER} ${blY - cBot} 
    Q 0 ${blY + cBot} ${-BUFFER} ${blY - cBot} 
    Z`;

  // Outer Bodies
  const squirclePath = `M 100 10 C 128 10 140 22 140 55 C 140 86 144 94 100 94 C 56 94 60 86 60 55 C 60 22 72 10 100 10 Z`;
  const screenPath = `M 100 16 C 126 16 134 24 134 50 C 134 76 126 84 100 84 C 74 84 66 76 66 50 C 66 24 74 16 100 16 Z`;

  // Reusable Pupil
  const PupilGroup = (
    <g transform={`scale(${exp.pupilScale})`}>
        {mood === KoaMood.ANGRY ? (
            <rect x="-8" y="-8" width="16" height="16" fill={pupilColor} transform="rotate(45)" filter={!isBrutalist ? `url(#glow-strong-${uid})` : ''} 
             className={isSpeaking ? "animate-talk" : ""} 
            />
        ) : isGlitch ? (
            <rect x="-8" y="-8" width="16" height="16" fill={pupilColor} filter={!isBrutalist ? `url(#glow-soft-${uid})` : ''}>
                <animateTransform attributeName="transform" type="translate" values="-1 0; 1 0; -1 0" dur="0.1s" repeatCount="indefinite" />
            </rect>
        ) : isProcessing ? (
            <rect x="-5" y="-5" width="10" height="10" fill={pupilColor} filter={!isBrutalist ? `url(#glow-soft-${uid})` : ''}>
                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.8s" repeatCount="indefinite" />
            </rect>
        ) : (
            <circle 
              cx="0" cy="0" r="7" fill={pupilColor} filter={!isBrutalist ? `url(#glow-soft-${uid})` : ''}
              className={isSpeaking ? "animate-talk" : ""}
            ></circle>
        )}
    </g>
  );

  return (
    <div className={className} style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
       {/* ANIMATION STYLES */}
       <style>{`
        @keyframes chuckle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
        @keyframes gloss-scan {
            0%, 100% { opacity: 0.15; transform: translateY(0); }
            50% { opacity: 0.5; transform: translateY(1px); }
        }
        @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .animate-chuckle { animation: chuckle 0.4s ease-in-out infinite; }
        .animate-gloss-scan { animation: gloss-scan 2s ease-in-out infinite; }
      `}</style>

      <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }} className={!isBrutalist ? 'drop-shadow-2xl' : ''}>
        <defs>
          <filter id={`glow-soft-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`glow-strong-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="6" result="coloredBlur" />
             <feMerge>
               <feMergeNode in="coloredBlur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
          </filter>

          {/* DEPTH GRADIENTS */}
          <radialGradient id={`iris-depth-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="40%" stopColor={activeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          
          <linearGradient id={`lens-gloss-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0.05" />
          </linearGradient>

          <clipPath id={`screen-clip-${uid}`}>
            <path d={screenPath} />
          </clipPath>
          <clipPath id={`lens-clip-${uid}`}>
             <circle cx="0" cy="0" r={LENS_RADIUS} />
          </clipPath>
          <clipPath id={`lid-clip-${uid}`}>
             <circle cx="0" cy="0" r={LID_RADIUS} />
          </clipPath>

          {/* --- TEXTURE PATTERNS --- */}
          <pattern id={`pattern-grid-${uid}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
             <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <pattern id={`pattern-lines-${uid}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
             <rect x="0" y="0" width="2" height="4" fill="currentColor" />
          </pattern>
          <pattern id={`pattern-dots-${uid}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
             <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          </pattern>
          <pattern id={`pattern-carbon-${uid}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
             <rect x="0" y="0" width="4" height="4" fill="currentColor" />
             <rect x="4" y="4" width="4" height="4" fill="currentColor" />
          </pattern>
          <pattern id={`pattern-technical-${uid}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            {/* Crosshair corners */}
            <path d="M 2 0 L 0 0 L 0 2" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 18 0 L 20 0 L 20 2" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 0 18 L 0 20 L 2 20" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 18 20 L 20 20 L 20 18" fill="none" stroke="currentColor" strokeWidth="1" />
            {/* Center dot */}
            <rect x="9.5" y="9.5" width="1" height="1" fill="currentColor" />
          </pattern>
        </defs>

        {/* Ground Shadow */}
        {!isBrutalist && (
             <ellipse cx="100" cy="98" rx="42" ry="4" fill="black" opacity="0.3" filter={`url(#glow-soft-${uid})`} />
        )}
        {isBrutalist && (
             <ellipse cx="103" cy="101" rx="42" ry="4" fill="#2D3142" opacity="1" />
        )}

        {/* --- MAIN CHASSIS --- */}
        <g className={isLaughing ? "animate-chuckle" : ""}>
           {/* 1. Body */}
           <path d={squirclePath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth={2} className={isBrutalist ? "shadow-brutal" : ""} />
           
           {/* 2. Texture Overlay */}
           {skin.texture && skin.texture !== 'none' && (
              <path 
                d={squirclePath} 
                fill={`url(#pattern-${skin.texture}-${uid})`} 
                opacity={skin.texture === 'grid' ? 0.3 : skin.texture === 'technical' ? 0.6 : 0.15}
                className={skin.id === 'blueprint' || skin.id === 'neon' ? 'text-white' : 'text-foreground'}
                style={{ pointerEvents: 'none' }}
              />
           )}

           {/* 3. Faceplate (Screen Background) */}
           <path d={screenPath} fill={skin.faceplateFill} stroke={skin.faceplateStroke} strokeWidth="3" />

           {/* --- LENS ASSEMBLY --- */}
           <g transform={`translate(${LENS_CENTER_X}, ${LENS_CENTER_Y})`}>
              
              {/* LAYER 1: INTERNAL LENS (The Eye Itself) */}
              <g clipPath={`url(#lens-clip-${uid})`}>
                 {/* The Void */}
                 <rect x={-LENS_RADIUS} y={-LENS_RADIUS} width={LENS_RADIUS*2} height={LENS_RADIUS*2} fill={skin.faceplateFill} />
                 
                 {/* Iris Tint (Backing with Depth Gradient) */}
                 {!isBrutalist && <circle cx="0" cy="0" r={LENS_RADIUS} fill={`url(#iris-depth-${uid})`} />}
                 {isBrutalist && <circle cx="0" cy="0" r={LENS_RADIUS} fill={activeColor} opacity="0.1" />}

                 {/* Internal Mechanisms (Focus Ring / Pupil) */}
                 {isProcessing ? (
                    <g>
                        <circle cx="0" cy="0" r="16" fill="none" stroke={activeColor} strokeWidth="2.5" strokeDasharray="12 18" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        {PupilGroup}
                    </g>
                 ) : (
                    <g>
                        {/* Inner Focus Ring */}
                         <g 
                            style={{ 
                                transform: `rotate(${innerRingRotation}deg)`, 
                                transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }}
                        >
                            <circle 
                                cx="0" cy="0" r="12" fill="none" stroke={activeColor} 
                                strokeWidth="1.2" strokeDasharray="3.14 3.14" strokeLinecap="round" 
                            />
                        </g>
                        
                        {/* Pupil */}
                        <g>
                            {!isGlitch && (
                                <animateTransform 
                                    attributeName="transform" type="scale" values="0.92; 1.05; 0.92" 
                                    dur="4s" repeatCount="indefinite" additive="sum"
                                />
                            )}
                            {PupilGroup}
                        </g>
                    </g>
                 )}

                 {/* Scan Line Effect for Processing/Suspicious */}
                 {isScanning && (
                   <rect x={-LENS_RADIUS} y="-2" width={LENS_RADIUS*2} height="4" fill={activeColor} opacity="0.6" className="animate-scan" filter={!isBrutalist ? `url(#glow-soft-${uid})` : ''} />
                 )}
                 
                 {/* Glass Gloss (Stays on the lens surface, under the lids/ring) */}
                 {!isBrutalist && (
                     <circle cx="0" cy="0" r={LENS_RADIUS} fill={`url(#lens-gloss-${uid})`} opacity="0.15" style={{pointerEvents:'none'}} />
                 )}
              </g>

              {/* LAYER 2: ROTATING OUTER RING (HUD/Mount) - Behind Lids */}
              {/* Outer Group: Handles fast mechanical snaps via state `irisRotation` */}
              <g 
                  style={{ 
                      transform: `rotate(${irisRotation}deg)`, 
                      transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
              >
                   {/* Inner Group: Handles slow continuous idle rotation via CSS animation */}
                   <g style={{ 
                        animation: `spin-slow ${idleSpin.duration}s linear infinite`, 
                        transformOrigin: '0 0', // Centered in parent which is translated to lens center
                        animationDirection: idleSpin.direction as any
                   }}>
                        {/* Clean HUD Ring: Single circle with mathematically perfect gaps. No backing ring. */}
                        <circle 
                            cx="0" cy="0" r={RING_RADIUS} 
                            fill="none" 
                            stroke={activeColor} 
                            strokeWidth="2.6" 
                            strokeOpacity={isBrutalist ? 1 : 0.5}
                            strokeDasharray={`${RING_DASH_PX} ${RING_GAP_PX}`} 
                            strokeLinecap={isBrutalist ? "square" : "round"}
                            filter={(!isBrutalist && (mood === KoaMood.ANGRY || mood === KoaMood.SUSPICIOUS)) ? `url(#glow-strong-${uid})` : ""}
                        />
                   </g>
              </g>

              {/* LAYER 3: APERTURE BLADES (Eyelids) - ON TOP 
                  Clipped to LID_RADIUS (32) to cover the ring when closed 
              */}
              <g clipPath={`url(#lid-clip-${uid})`} transform={`rotate(${exp.lidAngle})`}>
                 <path d={topLidPath} fill={skin.faceplateFill} className="transition-all duration-150 ease-out" />
                 <path d={bottomLidPath} fill={skin.faceplateFill} className="transition-all duration-150 ease-out" />
                 
                 {/* Rim Light */}
                 <path d={topLidPath} fill="none" stroke={activeColor} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#lid-clip-${uid})`} />
                 <path d={bottomLidPath} fill="none" stroke={activeColor} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#lid-clip-${uid})`} />
              </g>

              {/* LAYER 4: FLOATING ELEMENTS (Zzz) - Topmost */}
              {mood === KoaMood.SLEEPY && (
                <g fill={activeColor} className="animate-pulse">
                  <text x="5" y="-10" fontSize="12" fontFamily="monospace">Z</text>
                  <text x="15" y="-18" fontSize="10" fontFamily="monospace">z</text>
                </g>
              )}

           </g>
        </g>
      </svg>
    </div>
  );
};

// --- PORTABLE MOUNTING INTERFACE ---

// Define global interface for TS
declare global {
  interface Window {
    KoaAvatar: {
      render: (elementId: string, props?: KoAAvatarProps) => { unmount: () => void; update: (props: KoAAvatarProps) => void };
      Component: typeof KoAAvatar;
    };
  }
}

if (typeof window !== 'undefined') {
  window.KoaAvatar = {
    render: (elementId: string, props: KoAAvatarProps = {}) => {
      const el = document.getElementById(elementId);
      if (!el) {
        console.error(`KoaAvatar: Element with id '${elementId}' not found.`);
        return { unmount: () => {}, update: () => {} };
      }
      
      const root = ReactDOM.createRoot(el);
      root.render(React.createElement(KoAAvatar, props));
      
      return {
        unmount: () => root.unmount(),
        update: (newProps: KoAAvatarProps) => root.render(React.createElement(KoAAvatar, { ...props, ...newProps }))
      };
    },
    Component: KoAAvatar
  };
}
