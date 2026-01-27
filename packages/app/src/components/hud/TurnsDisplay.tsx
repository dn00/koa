import type { ReactNode } from 'react';
import styles from './TurnsDisplay.module.css';

/**
 * Props for TurnsDisplay component
 */
export interface TurnsDisplayProps {
  /** Turns remaining */
  turns: number;
}

/**
 * TurnsDisplay Component (Task 017)
 *
 * Displays turns remaining.
 * AC-5: Turns remaining
 */
export function TurnsDisplay({ turns }: TurnsDisplayProps): ReactNode {
  const isLow = turns <= 2;

  return (
    <div
      className={`${styles.container} ${isLow ? styles.low : ''}`}
      data-testid="turns-display"
      aria-label={`${turns} turns remaining`}
    >
      <span className={styles.label}>Turns</span>
      <span className={styles.value}>{turns}</span>
    </div>
  );
}
