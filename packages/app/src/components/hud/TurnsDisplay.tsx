import type { ReactNode } from 'react';
import styles from './TurnsDisplay.module.css';

/**
 * Props for TurnsDisplay component.
 * V5 shows turns played vs total turns.
 */
export interface TurnsDisplayProps {
  /** Number of turns played */
  turnsPlayed: number;
  /** Total turns in the game */
  turnsTotal: number;
}

/**
 * TurnsDisplay Component (Task 004)
 *
 * Displays turns played vs total turns.
 * AC-6: TurnsDisplay shows played/total.
 * R6.2: Shows turnsPlayed vs config.turnsPerGame.
 */
export function TurnsDisplay({ turnsPlayed, turnsTotal }: TurnsDisplayProps): ReactNode {
  const isLast = turnsPlayed >= turnsTotal - 1;

  return (
    <div
      className={`${styles.container} ${isLast ? styles.low : ''}`}
      data-testid="turns-display"
      aria-label={`Turn ${turnsPlayed + 1} of ${turnsTotal}`}
    >
      <span className={styles.label}>Turn</span>
      <span className={styles.value}>{turnsPlayed + 1}/{turnsTotal}</span>
    </div>
  );
}
