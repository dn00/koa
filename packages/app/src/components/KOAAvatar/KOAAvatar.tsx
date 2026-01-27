import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import type { ReactNode, ForwardedRef } from 'react';
import { gsap } from 'gsap';
import { KOAMood } from '@hsh/engine-core';
import styles from './KOAAvatar.module.css';

/**
 * Props for KOAAvatar component
 */
export interface KOAAvatarProps {
  /** Current mood state */
  mood: KOAMood;
  /** Optional size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to enable idle animation (default: true) */
  enableIdleAnimation?: boolean;
  /** Callback when glitch animation completes */
  onGlitchComplete?: () => void;
}

/**
 * Imperative handle for triggering effects
 */
export interface KOAAvatarHandle {
  /** Trigger glitch effect (for audit, critical hit, scrutiny threshold) */
  triggerGlitch: () => void;
  /** Pause all animations */
  pause: () => void;
  /** Resume all animations */
  resume: () => void;
}

/**
 * Color mappings for each mood state
 */
const moodColors: Record<KOAMood, string> = {
  NEUTRAL: '#6b7280', // gray
  CURIOUS: '#3b82f6', // blue
  SUSPICIOUS: '#f59e0b', // amber
  BLOCKED: '#ef4444', // red
  GRUDGING: '#8b5cf6', // purple
  IMPRESSED: '#10b981', // green
  RESIGNED: '#6366f1', // indigo
  SMUG: '#ec4899', // pink
};

/**
 * Display labels for each mood (lowercase for display)
 */
const moodLabels: Record<KOAMood, string> = {
  NEUTRAL: 'neutral',
  CURIOUS: 'curious',
  SUSPICIOUS: 'suspicious',
  BLOCKED: 'blocked',
  GRUDGING: 'grudging',
  IMPRESSED: 'impressed',
  RESIGNED: 'resigned',
  SMUG: 'smug',
};

/**
 * KOA Avatar Component (Task 023 + Task 015 enhancements)
 *
 * Displays KOA's mood state visually with:
 * AC-1: NEUTRAL mood - default state
 * AC-2: CURIOUS mood - player selecting
 * AC-3: SUSPICIOUS mood - after MINOR contradiction
 * AC-4: BLOCKED mood - MAJOR contradiction
 * AC-5: GRUDGING mood - after refutation
 * AC-6: IMPRESSED mood - clean submission
 * AC-7: RESIGNED mood - scrutiny 4
 * AC-8: SMUG mood - player lost
 * AC-9: Mood prop controls display
 * EC-1: Smooth transition between moods (CSS animation)
 * ERR-1: Unknown mood falls back to NEUTRAL
 *
 * Task 015 additions:
 * R12.5: Idle breathing/pulse animation (continuous, GSAP-controlled)
 * R12.3: Glitch effect on audit/critical hit/scrutiny threshold
 * R12.4: Glitch never impedes readability
 * R12.6: Page Visibility API - pause when hidden
 */
function KOAAvatarInner(
  {
    mood,
    size = 'medium',
    enableIdleAnimation = true,
    onGlitchComplete,
  }: KOAAvatarProps,
  ref: ForwardedRef<KOAAvatarHandle>
): ReactNode {
  const orbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const idleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const isGlitchingRef = useRef(false);

  // ERR-1: Fall back to NEUTRAL for unknown moods at runtime
  const safeMood = moodColors[mood] ? mood : KOAMood.NEUTRAL;
  const moodColor = moodColors[safeMood];
  const moodLabel = moodLabels[safeMood];

  // Create idle breathing animation
  useEffect(() => {
    if (!enableIdleAnimation || !orbRef.current || !glowRef.current) return;

    // Create idle breathing timeline
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    tl.to(
      orbRef.current,
      {
        scale: 1.02,
        duration: 1.5,
        ease: 'sine.inOut',
      },
      0
    );

    tl.to(
      glowRef.current,
      {
        opacity: 0.6,
        scale: 1.08,
        duration: 1.5,
        ease: 'sine.inOut',
      },
      0
    );

    idleTimelineRef.current = tl;

    return () => {
      tl.kill();
      idleTimelineRef.current = null;
    };
  }, [enableIdleAnimation]);

  // Page Visibility API - pause when hidden (R12.6)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        idleTimelineRef.current?.pause();
      } else {
        idleTimelineRef.current?.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Trigger glitch effect (R12.3)
  const triggerGlitch = useCallback(() => {
    if (isGlitchingRef.current || !coreRef.current || !glowRef.current) return;

    isGlitchingRef.current = true;

    // Pause idle animation during glitch
    idleTimelineRef.current?.pause();

    const glitchTl = gsap.timeline({
      onComplete: () => {
        isGlitchingRef.current = false;
        idleTimelineRef.current?.resume();
        onGlitchComplete?.();
      },
    });

    // Brief chromatic aberration effect (R12.4: never impedes readability)
    glitchTl
      .to(
        coreRef.current,
        {
          filter: 'hue-rotate(90deg) saturate(2)',
          duration: 0.05,
          ease: 'none',
        },
        0
      )
      .to(
        coreRef.current,
        {
          filter: 'hue-rotate(-90deg) saturate(2)',
          duration: 0.05,
          ease: 'none',
        },
        0.05
      )
      .to(
        coreRef.current,
        {
          filter: 'hue-rotate(45deg) saturate(1.5)',
          duration: 0.05,
          ease: 'none',
        },
        0.1
      )
      .to(
        coreRef.current,
        {
          filter: 'none',
          duration: 0.1,
          ease: 'power2.out',
        },
        0.15
      );

    // Rapid scale jitter
    glitchTl
      .to(
        coreRef.current,
        {
          scale: 1.1,
          duration: 0.03,
          ease: 'none',
        },
        0
      )
      .to(
        coreRef.current,
        {
          scale: 0.95,
          duration: 0.03,
          ease: 'none',
        },
        0.03
      )
      .to(
        coreRef.current,
        {
          scale: 1.05,
          duration: 0.03,
          ease: 'none',
        },
        0.06
      )
      .to(
        coreRef.current,
        {
          scale: 1,
          duration: 0.1,
          ease: 'power2.out',
        },
        0.09
      );

    // Glow flash
    glitchTl.to(
      glowRef.current,
      {
        opacity: 1,
        scale: 1.3,
        duration: 0.1,
        ease: 'power2.out',
      },
      0
    ).to(
      glowRef.current,
      {
        opacity: 0.4,
        scale: 1,
        duration: 0.15,
        ease: 'power2.out',
      },
      0.1
    );
  }, [onGlitchComplete]);

  // Pause/resume functions
  const pause = useCallback(() => {
    idleTimelineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (!isGlitchingRef.current) {
      idleTimelineRef.current?.resume();
    }
  }, []);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    triggerGlitch,
    pause,
    resume,
  }), [triggerGlitch, pause, resume]);

  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ '--mood-color': moodColor } as React.CSSProperties}
      aria-label={`KOA is ${moodLabel}`}
      role="img"
      data-testid="koa-avatar"
    >
      <div ref={orbRef} className={styles.orb}>
        <div ref={glowRef} className={styles.glow} />
        <div ref={coreRef} className={styles.core} />
      </div>
      <span className={styles.moodLabel}>{moodLabel}</span>
    </div>
  );
}

export const KOAAvatar = forwardRef(KOAAvatarInner);
