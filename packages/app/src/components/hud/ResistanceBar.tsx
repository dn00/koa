import type { ReactNode } from 'react';
import styles from './ResistanceBar.module.css';

/**
 * Props for ResistanceBar component
 */
export interface ResistanceBarProps {
  /** Current resistance value */
  current: number;
  /** Maximum resistance value */
  max: number;
}

/**
 * ResistanceBar Component (Task 017)
 *
 * Displays the target's resistance as a progress bar.
 * AC-2: Resistance with progress bar
 */
export function ResistanceBar({ current, max }: ResistanceBarProps): ReactNode {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className={styles.container} data-testid="resistance-bar">
      <div className={styles.label}>
        <span className={styles.labelText}>Resistance</span>
        <span className={styles.value}>{current}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`Resistance: ${current} of ${max}`}
      >
        <div
          className={styles.fill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
