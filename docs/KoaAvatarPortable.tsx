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
  texture?: 'none' | 'grid' | 'lines' | 'dots' | 'carbon' | 'spikes';
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
    id: 'prime',
    name: 'Prime Edition',
    bodyFill: '#0f172a', // Slate 900
    bodyStroke: '#334155', // Slate 700
    faceplateFill: '#000000', // Pitch Black
    faceplateStroke: '#1e293b', // Slate 800
    texture: 'none',
    borderStyle: 'tech'
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
  [KoaMood.NEUTRAL]:      { main: '#06b6d4', pupil: '#cffafe' },
  [KoaMood.WATCHING]:     { main: '#3b82f6', pupil: '#dbeafe' },
  [KoaMood.SUSPICIOUS]:   { main: '#f59e0b', pupil: '#fffbeb' },
  [KoaMood.DISAPPOINTED]: { main: '#64748b', pupil: '#e2e8f0' },
  [KoaMood.AMUSED]:       { main: '#10b981', pupil: '#d1fae5' },
  [KoaMood.SLEEPY]:       { main: '#6366f1', pupil: '#e0e7ff' },
  [KoaMood.ANGRY]:        { main: '#ef4444', pupil: '#fee2e2' },
  [KoaMood.GLITCH]:       { main: '#d946ef', pupil: '#fae8ff' },
  [KoaMood.PROCESSING]:   { main: '#8b5cf6', pupil: '#ede9fe' },
  [KoaMood.ACCEPTING]:    { main: '#14b8a6', pupil: '#ccfbf1' },
  
  // New Mood Colors
  [KoaMood.CURIOUS]:      { main: '#2dd4bf', pupil: '#ccfbf1' }, // Teal-400
  [KoaMood.GRUDGING]:     { main: '#ea580c', pupil: '#ffedd5' }, // Orange-600
  [KoaMood.IMPRESSED]:    { main: '#fbbf24', pupil: '#fffbeb' }, // Amber-400 (Gold)
  [KoaMood.RESIGNED]:     { main: '#94a3b8', pupil: '#f1f5f9' }, // Slate-400
  [KoaMood.SMUG]:         { main: '#c026d3', pupil: '#fae8ff' }, // Fuchsia-600
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

  // Geometry
  const LENS_RADIUS = 21.5; 
  const LID_RADIUS = 31;  
  const LENS_CENTER_X = 100;
  const LENS_CENTER_Y = 50; 
  
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
  const bodyPath = `M 100 8 C 132 8 142 18 142 50 C 142 82 132 92 100 92 C 68 92 58 82 58 50 C 58 18 68 8 100 8 Z`;
  const screenPath = `M 100 15 C 127 15 135 23 135 50 C 135 77 127 85 100 85 C 73 85 65 77 65 50 C 65 23 73 15 100 15 Z`;
  const techPath = `M 70 4 L 54 4 L 54 24 M 130 4 L 146 4 L 146 24 M 146 76 L 146 96 L 130 96 M 70 96 L 54 96 L 54 76`;

  const textureOpacity = skin.id === 'melon' ? 0.5 : (skin.texture === 'grid' || skin.texture === 'spikes' ? 0.3 : 0.15);
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
          <filter id={`koa-glow-soft-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`koa-glow-strong-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="6" result="coloredBlur" />
             <feMerge>
               <feMergeNode in="coloredBlur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
          </filter>
          <filter id={`koa-border-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="3" result="coloredBlur" />
             <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
             </feMerge>
          </filter>

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
        </defs>

        <ellipse cx="100" cy="96" rx="40" ry="4" fill="black" opacity="0.3" filter={`url(#koa-glow-soft-${uid})`} style={transitionStyle} />

        <g style={{ animation: isLaughing ? 'koa-chuckle 0.4s ease-in-out infinite' : 'none' }}>
           
           {/* BODY */}
           {borderStyle === 'double' ? (
              <g style={transitionStyle}>
                <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="8" style={transitionStyle} />
                <path d={bodyPath} fill="none" stroke={skin.bodyFill} strokeWidth="4" style={transitionStyle} />
                <path d={bodyPath} fill="none" stroke={skin.bodyStroke} strokeWidth="1" style={transitionStyle} />
              </g>
           ) : borderStyle === 'dashed' ? (
              <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="3" strokeDasharray="10 6" strokeLinecap="round" style={transitionStyle} />
           ) : borderStyle === 'thick' ? (
              <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="8" style={transitionStyle} />
           ) : borderStyle === 'offset' ? (
              <g style={transitionStyle}>
                <path d={bodyPath} fill={skin.bodyStroke} stroke="none" transform="translate(6, 6)" opacity="0.4" style={transitionStyle} />
                <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="3" style={transitionStyle} />
              </g>
           ) : borderStyle === 'tech' ? (
              <g style={transitionStyle}>
                <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="1.5" strokeOpacity="0.8" style={transitionStyle} />
                <path d={techPath} fill="none" stroke={skin.bodyStroke} strokeWidth="2.5" strokeLinecap="square" style={transitionStyle} />
              </g>
           ) : borderStyle === 'glow' ? (
              <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="3" filter={`url(#koa-border-glow-${uid})`} style={transitionStyle} />
           ) : borderStyle === 'serrated' ? (
              <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="3" strokeDasharray="3 3" strokeLinejoin="miter" style={transitionStyle} />
           ) : (
              <path d={bodyPath} fill={skin.bodyFill} stroke={skin.bodyStroke} strokeWidth="4" style={transitionStyle} />
           )}
           
           {/* FACEPLATE */}
           <path d={screenPath} fill={skin.faceplateFill} stroke={skin.faceplateStroke} strokeWidth="1.5" style={transitionStyle} />

           {/* TEXTURE */}
           {hasTexture && (
              <path 
                d={screenPath} 
                fill={`url(#koa-pattern-${skin.texture}-${uid})`} 
                opacity={textureOpacity}
                color={textureFill}
                style={{ pointerEvents: 'none', transition: `opacity ${colorDuration} ease, color ${colorDuration} ease` }}
              />
           )}

           {/* LENS */}
           <g transform={`translate(${LENS_CENTER_X}, ${LENS_CENTER_Y})`}>
              <g clipPath={`url(#koa-lens-clip-${uid})`}>
                 <rect x={-LENS_RADIUS} y={-LENS_RADIUS} width={LENS_RADIUS*2} height={LENS_RADIUS*2} fill="#000" />
                 <circle cx="0" cy="0" r={LENS_RADIUS} fill={colors.main} opacity="0.2" style={transitionStyle} />

                 {/* PUPIL & IRIS */}
                 {isProcessing ? (
                    <g>
                        <circle cx="0" cy="0" r="16" fill="none" stroke={colors.main} strokeWidth="2.5" strokeDasharray="12 18" strokeLinecap="round" style={transitionStyle}>
                            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <g transform={`scale(${exp.pupilScale})`} style={transformTransitionStyle}>
                          <rect x="-5" y="-5" width="10" height="10" fill={colors.pupil} filter={`url(#koa-glow-soft-${uid})`} style={transitionStyle}>
                             <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="1s" repeatCount="indefinite" />
                             <animate attributeName="opacity" values="0.4; 1; 0.4" dur="0.8s" repeatCount="indefinite" />
                          </rect>
                        </g>
                    </g>
                 ) : (
                    <g>
                         {/* INNER RING with AUTOFOCUS effect */}
                         <g style={{ transform: `rotate(${innerRingRotation}deg)`, transition: `transform 1.5s ${TRANSITION_BEZIER}` }}>
                            <circle cx="0" cy="0" r="12" fill="none" stroke={colors.main} strokeWidth="1.2" strokeDasharray="3.14 3.14" strokeLinecap="round" 
                                style={{...transitionStyle, animation: 'koa-autofocus 8s linear infinite'}} />
                        </g>
                        <g>
                            {!isGlitch && (
                                <animateTransform attributeName="transform" type="scale" values="0.92; 1.05; 0.92" dur="4s" repeatCount="indefinite" additive="sum" />
                            )}
                            <g transform={`scale(${exp.pupilScale})`} style={transformTransitionStyle}>
                              {mood === KoaMood.ANGRY ? (
                                  <rect x="-8" y="-8" width="16" height="16" fill={colors.pupil} transform="rotate(45)" filter={`url(#koa-glow-strong-${uid})`} style={{ ...transitionStyle, animation: isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none' }} />
                              ) : isGlitch ? (
                                  <rect x="-8" y="-8" width="16" height="16" fill={colors.pupil} filter={`url(#koa-glow-soft-${uid})`} style={transitionStyle}>
                                      <animateTransform attributeName="transform" type="translate" values="-1 0; 1 0; -1 0" dur="0.1s" repeatCount="indefinite" />
                                  </rect>
                              ) : (
                                  <circle cx="0" cy="0" r="7" fill={colors.pupil} filter={`url(#koa-glow-soft-${uid})`} style={{ ...transitionStyle, animation: isSpeaking ? 'koa-pulse-talk 0.2s ease-in-out infinite' : 'none' }} />
                              )}
                            </g>
                        </g>
                    </g>
                 )}

                 {isScanning && (
                   <rect x={-LENS_RADIUS} y="-2" width={LENS_RADIUS*2} height="4" fill={colors.main} opacity="0.6" style={{ ...transitionStyle, animation: 'koa-scan 2s linear infinite' }} filter={`url(#koa-glow-soft-${uid})`} />
                 )}
              </g>

              {/* RING */}
              <g style={{ transform: `rotate(${irisRotation}deg)`, transition: `transform 1.2s ${TRANSITION_BEZIER}` }}>
                   <g style={{ animation: `koa-spin-slow ${idleSpin.duration}s linear infinite`, transformOrigin: '0 0', animationDirection: idleSpin.direction as any }}>
                        <circle cx="0" cy="0" r={RING_RADIUS} fill="none" stroke={colors.main} strokeWidth="2.6" strokeOpacity="0.5" strokeDasharray={ringDashArray} strokeLinecap="round"
                            filter={mood === KoaMood.ANGRY || mood === KoaMood.SUSPICIOUS ? `url(#koa-glow-strong-${uid})` : ""} style={transitionStyle} />
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
                 <path d={topLidPath} fill="none" stroke={colors.main} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#koa-lid-clip-${uid})`} style={pathTransitionStyle} />
                 <path d={bottomLidPath} fill="none" stroke={colors.main} strokeWidth="1" strokeOpacity="0.6" clipPath={`url(#koa-lid-clip-${uid})`} style={pathTransitionStyle} />
              </g>

              {mood === KoaMood.SLEEPY && (
                <g fill={colors.main} style={transitionStyle}>
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