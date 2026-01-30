
import React, { useState, useEffect, useId } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---

export enum KoaMood {
  NEUTRAL = 'NEUTRAL',
  SUSPICIOUS = 'SUSPICIOUS',
  DISAPPOINTED = 'DISAPPOINTED',
  AMUSED = 'AMUSED',
  WATCHING = 'WATCHING',
  PROCESSING = 'PROCESSING',
  GLITCH = 'GLITCH',
  SLEEPY = 'SLEEPY',
  ANGRY = 'ANGRY',
  ACCEPTING = 'ACCEPTING',
  CURIOUS = 'CURIOUS',
  GRUDGING = 'GRUDGING',
  IMPRESSED = 'IMPRESSED',
  RESIGNED = 'RESIGNED',
  SMUG = 'SMUG'
}

export interface KoaSkin {
  id: string;
  name: string;
  bodyFill: string;
  bodyStroke: string;
  faceplateFill: string;
  faceplateStroke: string;
  texture?: 'none' | 'grid' | 'lines' | 'dots' | 'carbon' | 'spikes' | 'technical';
  borderStyle?: 'simple' | 'thick' | 'double' | 'dashed' | 'offset' | 'tech' | 'glow' | 'serrated';
}

export interface AvatarExpression {
  lidTop: number;       
  lidBottom: number;    
  lidAngle: number;     
  pupilScale: number;   
  lidCurveTop?: number; 
  lidCurveBottom?: number;
}

export interface KoAAvatarProps {
  mood?: KoaMood | string;
  skin?: KoaSkin;
  expressionOverride?: Partial<AvatarExpression>;
  isSpeaking?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string; // Optional for external styling if needed
}

// --- CONSTANTS ---

export const PRIME_SKIN: KoaSkin = {
    id: 'brutalist-v2-portable',
    name: 'SYS.V2.0',
    bodyFill: '#F9FAFB', // Off-White
    bodyStroke: '#2D3142', // Charcoal
    faceplateFill: '#2D3142', // Charcoal
    faceplateStroke: '#E07A5F', // Coral
    texture: 'technical',
    borderStyle: 'simple'
};

const MOOD_EXPRESSIONS: Record<string, AvatarExpression> = {
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
  
  // New Moods
  [KoaMood.CURIOUS]:      { lidTop: -8, lidBottom: -5, lidAngle: 2,  pupilScale: 1.15, lidCurveTop: 15, lidCurveBottom: 15 },
  [KoaMood.GRUDGING]:     { lidTop: 20, lidBottom: 10, lidAngle: 0,  pupilScale: 0.9,  lidCurveTop: 5,  lidCurveBottom: 5 },
  [KoaMood.IMPRESSED]:    { lidTop: -5, lidBottom: 20, lidAngle: 0,  pupilScale: 1.25, lidCurveTop: 20, lidCurveBottom: -15 },
  [KoaMood.RESIGNED]:     { lidTop: 45, lidBottom: 10, lidAngle: -2, pupilScale: 0.85, lidCurveTop: 10, lidCurveBottom: 10 },
  [KoaMood.SMUG]:         { lidTop: 15, lidBottom: 35, lidAngle: -8, pupilScale: 1.0,  lidCurveTop: 5,  lidCurveBottom: -20 },
};

const MOOD_COLORS: Record<string, { main: string, pupil: string }> = {
  [KoaMood.NEUTRAL]:      { main: '#E07A5F', pupil: '#FFFFFF' }, // Coral (Default)
  [KoaMood.WATCHING]:     { main: '#3b82f6', pupil: '#FFFFFF' }, // Blue
  [KoaMood.SUSPICIOUS]:   { main: '#f59e0b', pupil: '#FFFFFF' }, // Amber
  [KoaMood.DISAPPOINTED]: { main: '#64748b', pupil: '#FFFFFF' }, // Slate
  [KoaMood.AMUSED]:       { main: '#10b981', pupil: '#FFFFFF' }, // Emerald
  [KoaMood.SLEEPY]:       { main: '#6366f1', pupil: '#FFFFFF' }, // Indigo
  [KoaMood.ANGRY]:        { main: '#ef4444', pupil: '#FFFFFF' }, // Red
  [KoaMood.GLITCH]:       { main: '#d946ef', pupil: '#FFFFFF' }, // Fuchsia
  [KoaMood.PROCESSING]:   { main: '#8b5cf6', pupil: '#FFFFFF' }, // Violet
  [KoaMood.ACCEPTING]:    { main: '#14b8a6', pupil: '#FFFFFF' }, // Teal
  
  // New Mood Colors
  [KoaMood.CURIOUS]:      { main: '#E07A5F', pupil: '#FFFFFF' }, // Coral (Default)
  [KoaMood.GRUDGING]:     { main: '#E07A5F', pupil: '#FFFFFF' }, // Coral (Default)
  [KoaMood.IMPRESSED]:    { main: '#fbbf24', pupil: '#FFFFFF' }, // Amber-400 (Gold)
  [KoaMood.RESIGNED]:     { main: '#94a3b8', pupil: '#FFFFFF' }, // Slate-400
  [KoaMood.SMUG]:         { main: '#E07A5F', pupil: '#FFFFFF' }, // Coral (Default)
};

// --- COMPONENT ---

export const KoAAvatar: React.FC<KoAAvatarProps> = ({ 
  mood = KoaMood.NEUTRAL, 
  skin = PRIME_SKIN, 
  expressionOverride,
  isSpeaking = false,
  width = '100%',
  height = '100%',
  className = ''
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [irisRotation, setIrisRotation] = useState(0);
  const [innerRingRotation, setInnerRingRotation] = useState(0);
  const uid = useId();

  // Made slightly faster (40s+) than previous version
  const [idleSpin] = useState(() => ({
    duration: 40 + Math.random() * 20,
    direction: Math.random() > 0.5 ? 'normal' : 'reverse'
  }));

  // Blink Loop
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

  // Iris Rotation
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

  // Inner Ring Rotation
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
  const isScanning = isProcessing || mood === KoaMood.SUSPICIOUS;
  const borderStyle = skin.borderStyle || 'simple';

  // --- BRUTALIST STYLE ENFORCED ---
  // Active color comes from mood, but pupil is always white for that flat/tech look
  const activeColor = colors.main;
  const pupilColor = '#FFFFFF';

  // Geometry
  const LENS_RADIUS = 21.5; 
  const LID_RADIUS = 31;  
  const LENS_CENTER_X = 100;
  const LENS_CENTER_Y = 52; // Shifted down 2px from 50
  
  const RING_RADIUS = 23; 
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; 
  const RING_WEIGHTS = [4, 2, 2, 7]; 
  const RING_GAP_PX = 10; 
  const totalWeight = RING_WEIGHTS.reduce((sum, w) => sum + w, 0);
  const availableDashSpace = RING_CIRCUMFERENCE - (RING_WEIGHTS.length * RING_GAP_PX);
  const weightUnit = availableDashSpace / totalWeight;
  const ringDashArray = RING_WEIGHTS.map(w => `${w * weightUnit} ${RING_GAP_PX}`).join(' ');

  const mapLidPos = (p: number) => ((p / 100) * (LID_RADIUS * 2)) - LID_RADIUS;
  
  const rawTop = isBlinking ? 50 : exp.lidTop;
  const rawBottom = isBlinking ? 50 : exp.lidBottom;

  let lidY_Top = mapLidPos(rawTop);
  let lidY_Bottom = LID_RADIUS - ((rawBottom / 100) * (LID_RADIUS * 2));

  const CURVE_SCALE = 0.5;
  let cTop = (exp.lidCurveTop ?? 12) * CURVE_SCALE;
  let cBot = (exp.lidCurveBottom ?? 12) * CURVE_SCALE;

  const gap = lidY_Bottom - lidY_Top;
  if (gap <= 0) {
    const mid = (lidY_Top + lidY_Bottom) / 2;
    lidY_Top = mid;
    lidY_Bottom = mid;
    cTop = 0;
    cBot = 0;
  } else if (gap < 10) {
     const dampener = gap / 10; 
     cTop *= dampener;
     cBot *= dampener;
  }

  const BUFFER = LID_RADIUS + 10; 
  const topLidPath = `M ${-BUFFER} ${-BUFFER} L ${BUFFER} ${-BUFFER} L ${BUFFER} ${lidY_Top + cTop} Q 0 ${lidY_Top - cTop} ${-BUFFER} ${lidY_Top + cTop} Z`;
  const bottomLidPath = `M ${-BUFFER} ${BUFFER} L ${BUFFER} ${BUFFER} L ${BUFFER} ${lidY_Bottom - cBot} Q 0 ${lidY_Bottom + cBot} ${-BUFFER} ${lidY_Bottom - cBot} Z`;
  
  // UPDATED PATHS:
  // bodyPath: Rounder "cute" corners (137/96 control points)
  const bodyPath = `M 100 4 C 128 4 148 22 148 50 C 148 84 137 96 100 96 C 63 96 52 84 52 50 C 52 22 72 4 100 4 Z`;
  // screenPath: Shifted +2px down (Y: 15->17, 50->52, 85->87)
  const screenPath = `M 100 17 C 127 17 135 25 135 52 C 135 79 127 87 100 87 C 73 87 65 79 65 52 C 65 25 73 17 100 17 Z`;
  
  // techPath: Kept inside boundary
  const techPath = `M 68 6 L 56 6 L 56 26 M 132 6 L 144 6 L 144 26 M 144 74 L 144 94 L 132 94 M 68 94 L 56 94 L 56 74`;

  const textureOpacity = skin.texture === 'technical' ? 0.6 : (skin.id === 'melon' ? 0.5 : (skin.texture === 'grid' || skin.texture === 'spikes' ? 0.3 : 0.15));
  const textureFill = skin.id === 'blueprint' || skin.id === 'neon' ? '#ffffff' : '#000000';
  const hasTexture = skin.texture && skin.texture !== 'none';

  // --- TRANSITION STYLES ---
  // Faster snap (0.3s) for mood changes, instant snap (0.1s) for blinking
  const TRANSITION_BEZIER = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const lidDuration = isBlinking ? '0.1s' : '0.3s';
  const colorDuration = '0.3s';
  
  const transitionStyle = { transition: `all ${colorDuration} ${TRANSITION_BEZIER}` };
  const pathTransitionStyle = { 
    transition: `d ${lidDuration} ${TRANSITION_BEZIER}, fill ${colorDuration} ${TRANSITION_BEZIER}, stroke ${colorDuration} ${TRANSITION_BEZIER}` 
  };
  const transformTransitionStyle = { 
    transition: `transform ${colorDuration} ${TRANSITION_BEZIER}` 
  };

  return (
    <div style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={className}>
      <style>{`
        @keyframes koa-chuckle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes koa-spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes koa-pulse-talk { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes koa-scan { 0% { opacity: 0; transform: translateY(-10px); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateY(10px); } }
        /* Removed drift, now static */
        @keyframes koa-autofocus { 
            0% { transform: scale(1); opacity: 0.8; } 
            1% { transform: scale(0.85); opacity: 1; } 
            2% { transform: scale(1.08); opacity: 0.8; } 
            3% { transform: scale(0.96); opacity: 1; } 
            4% { transform: scale(1); opacity: 0.8; } 
            100% { transform: scale(1); opacity: 0.8; } 
        }
      `}</style>
      
      <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          {/* Filters are removed for brutalist flat look, but defined empty to avoid reference errors if any */}
          <clipPath id={`koa-lens-clip-${uid}`}><circle cx="0" cy="0" r={LENS_RADIUS} /></clipPath>
          <clipPath id={`koa-lid-clip-${uid}`}><circle cx="0" cy="0" r={LID_RADIUS} /></clipPath>

          <pattern id={`koa-pattern-grid-${uid}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
             <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <pattern id={`koa-pattern-lines-${uid}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
             <rect x="0" y="0" width="2" height="4" fill="currentColor" />
          </pattern>
          <pattern id={`koa-pattern-dots-${uid}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
             <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
          </pattern>
          <pattern id={`koa-pattern-carbon-${uid}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
             <rect x="0" y="0" width="4" height="4" fill="currentColor" />
             <rect x="4" y="4" width="4" height="4" fill="currentColor" />
          </pattern>
          <pattern id={`koa-pattern-spikes-${uid}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
             <path d="M 4 0.5 L 7.5 7.5 L 0.5 7.5 Z" fill="currentColor" />
          </pattern>
          <pattern id={`koa-pattern-technical-${uid}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 2 0 L 0 0 L 0 2" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 18 0 L 20 0 L 20 2" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 0 18 L 0 20 L 2 20" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M 18 20 L 20 20 L 20 18" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="9.5" y="9.5" width="1" height="1" fill="currentColor" />
          </pattern>
        </defs>

        {/* Ground Shadow - Brutalist Solid */}
        <ellipse cx="103" cy="120" rx="43" ry="4" fill="#2D3142" opacity="1" />

        <g style={{ animation: isLaughing ? 'koa-chuckle 0.4s ease-in-out infinite' : 'none' }}>
           
           {/* BODY - Brutalist Default */}
           <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="2" style={transitionStyle} />
           
           {/* TEXTURE - Applied to Body */}
           {hasTexture && (
              <path 
                d={bodyPath} 
                fill={`url(#koa-pattern-${skin.texture}-${uid})`} 
                opacity={textureOpacity}
                color={textureFill}
                style={{ pointerEvents: 'none', transition: `opacity ${colorDuration} ease, color ${colorDuration} ease` }}
              />
           )}

           {/* FACEPLATE */}
           <path d={screenPath} fill={skin.faceplateFill} stroke={skin.faceplateStroke} strokeWidth="3" style={transitionStyle} />

           {/* LENS */}
           <g transform={`translate(${LENS_CENTER_X}, ${LENS_CENTER_Y})`}>
              <g clipPath={`url(#koa-lens-clip-${uid})`}>
                 <rect x={-LENS_RADIUS} y={-LENS_RADIUS} width={LENS_RADIUS*2} height={LENS_RADIUS*2} fill={skin.faceplateFill} />
                 
                 {/* Iris Background / Tint - Flat opacity for color hint */}
                 <circle cx="0" cy="0" r={LENS_RADIUS} fill={activeColor} opacity="0.1" style={transitionStyle} />

                 {/* PUPIL & IRIS */}
                 {isProcessing ? (
                    <g>
                        <circle cx="0" cy="0" r="16" fill="none" stroke={activeColor} strokeWidth="2.5" strokeDasharray="12 18" strokeLinecap="round" style={transitionStyle}>
                            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <g transform={`scale(${exp.pupilScale})`} style={transformTransitionStyle}>
                          <rect x="-5" y="-5" width="10" height="10" fill={pupilColor} style={transitionStyle}>
                             <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />
                             <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.8s" repeatCount="indefinite" />
                          </rect>
                        </g>
                    </g>
                 ) : (
                    <g>
                         {/* INNER RING with AUTOFOCUS effect */}
                         <g style={{ transform: `rotate(${innerRingRotation}deg)`, transition: `transform 1.5s ${TRANSITION_BEZIER}` }}>
                            <circle cx="0" cy="0" r="12" fill="none" stroke={activeColor} strokeWidth="1.2" strokeDasharray="3.14 3.14" strokeLinecap="round" 
                                style={{...transitionStyle, animation: 'koa-autofocus 8s linear infinite'}} />
                        </g>
                        <g>
                            {!isGlitch && (
                                <animateTransform attributeName="transform" type="scale" values="0.92; 1.05; 0.92" dur="4s" repeatCount="indefinite" additive="sum" />
                            )}
                            <g transform={`scale(${exp.pupilScale})`} style={transformTransitionStyle}>
                              {mood === KoaMood.ANGRY ? (
                                  <rect x="-8" y="-8" width="16" height="16" fill={pupilColor} transform="rotate(45)" style={{ ...transitionStyle, animation: isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none' }} />
                              ) : isGlitch ? (
                                  <rect x="-8" y="-8" width="16" height="16" fill={pupilColor} style={transitionStyle}>
                                      <animateTransform attributeName="transform" type="translate" values="-1 0; 1 0; -1 0" dur="0.1s" repeatCount="indefinite" />
                                  </rect>
                              ) : (
                                  <circle cx="0" cy="0" r="7" fill={pupilColor} style={{ ...transitionStyle, animation: isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none' }} />
                              )}
                            </g>
                        </g>
                    </g>
                 )}

                 {isScanning && (
                   <rect x={-LENS_RADIUS} y="-2" width={LENS_RADIUS*2} height="4" fill={activeColor} opacity="0.6" style={{ ...transitionStyle, animation: 'koa-scan 2s linear infinite' }} />
                 )}
              </g>

              {/* RING */}
              <g style={{ transform: `rotate(${irisRotation}deg)`, transition: `transform 1.2s ${TRANSITION_BEZIER}` }}>
                   <g style={{ animation: `koa-spin-slow ${idleSpin.duration}s linear infinite`, transformOrigin: '0 0', animationDirection: idleSpin.direction as any }}>
                        <circle cx="0" cy="0" r={RING_RADIUS} fill="none" stroke={activeColor} strokeWidth="2.6" strokeOpacity="1" strokeDasharray={ringDashArray} strokeLinecap="square"
                            style={transitionStyle} />
                   </g>
              </g>

              {/* LIDS */}
              <g clipPath={`url(#koa-lid-clip-${uid})`} transform={`rotate(${exp.lidAngle})`} style={transformTransitionStyle}>
                 <path d={topLidPath} fill={skin.faceplateFill} style={pathTransitionStyle} />
                 <path d={bottomLidPath} fill={skin.faceplateFill} style={pathTransitionStyle} />
                 {hasTexture && (
                    <>
                        <path d={topLidPath} fill={`url(#koa-pattern-${skin.texture}-${uid})`} opacity={textureOpacity} color={textureFill} style={{ pointerEvents: 'none', transition: `d ${lidDuration} ${TRANSITION_BEZIER}, opacity ${colorDuration} ease` }} />
                        <path d={bottomLidPath} fill={`url(#koa-pattern-${skin.texture}-${uid})`} opacity={textureOpacity} color={textureFill} style={{ pointerEvents: 'none', transition: `d ${lidDuration} ${TRANSITION_BEZIER}, opacity ${colorDuration} ease` }} />
                    </>
                 )}
                 <path d={topLidPath} fill="none" stroke={activeColor} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#koa-lid-clip-${uid})`} style={pathTransitionStyle} />
                 <path d={bottomLidPath} fill="none" stroke={activeColor} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#koa-lid-clip-${uid})`} style={pathTransitionStyle} />
              </g>

              {mood === KoaMood.SLEEPY && (
                <g fill={activeColor} style={transitionStyle}>
                   <text x="5" y="-10" fontSize="12" fontFamily="monospace">Z<animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" /></text>
                   <text x="15" y="-18" fontSize="10" fontFamily="monospace">z<animate attributeName="opacity" values="0;1;0" dur="2s" begin="0.5s" repeatCount="indefinite" /></text>
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
    KoaAvatarPortable: {
      render: (elementId: string, props?: KoAAvatarProps) => { unmount: () => void; update: (props: KoAAvatarProps) => void };
      Component: typeof KoAAvatar;
    };
  }
}

if (typeof window !== 'undefined') {
  window.KoaAvatarPortable = {
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
