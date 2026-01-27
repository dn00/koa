import type { ReactNode } from 'react';
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
 * KOA Avatar Component (Task 023)
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
 */
export function KOAAvatar({ mood, size = 'medium' }: KOAAvatarProps): ReactNode {
  // ERR-1: Fall back to NEUTRAL for unknown moods at runtime
  const safeMood = moodColors[mood] ? mood : KOAMood.NEUTRAL;
  const moodColor = moodColors[safeMood];
  const moodLabel = moodLabels[safeMood];

  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ '--mood-color': moodColor } as React.CSSProperties}
      aria-label={`KOA is ${moodLabel}`}
      role="img"
    >
      <div className={styles.orb}>
        <div className={styles.glow} />
        <div className={styles.core} />
      </div>
      <span className={styles.moodLabel}>{moodLabel}</span>
    </div>
  );
}
