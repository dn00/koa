import type { ReactNode } from 'react';
import styles from './BeliefBar.module.css';

/**
 * Props for BeliefBar component.
 * V5 displays belief score progress toward target.
 */
export interface BeliefBarProps {
  /** Current belief score */
  current: number;
  /** Target belief score to win */
  target: number;
}

/**
 * BeliefBar Component (Task 004)
 *
 * Displays the player's belief score as a progress bar toward target.
 * AC-1: Shows current/target belief progress.
 * R6.1: Visual indicator of belief vs target.
 * R6.3: Replaces ResistanceBar concept.
 */
export function BeliefBar({ current, target }: BeliefBarProps): ReactNode {
  // Calculate percentage (capped at 100%)
  const percentage = Math.max(0, Math.min(100, (current / target) * 100));

  // Determine visual state based on proximity to target
  const isWinning = current >= target;
  const isClose = current >= target - 5 && current < target;

  return (
    <div className={styles.container} data-testid="belief-bar">
      <div className={styles.label}>
        <span className={styles.labelText}>Belief</span>
        <span className={styles.values}>
          <span className={styles.current}>{current}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.target}>{target}</span>
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`Belief: ${current} of ${target}`}
      >
        <div
          className={`${styles.fill} ${isWinning ? styles.winning : ''} ${isClose ? styles.close : ''}`}
          style={{ width: `${percentage}%` }}
        />
        <div className={styles.targetMarker} style={{ left: '100%' }} />
      </div>
    </div>
  );
}
