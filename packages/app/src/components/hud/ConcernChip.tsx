import type { ReactNode } from 'react';
import type { Concern } from '@hsh/engine-core';
import styles from './ConcernChip.module.css';

/**
 * Props for ConcernChip component
 */
export interface ConcernChipProps {
  /** The concern to display */
  concern: Concern;
}

/**
 * ConcernChip Component (Task 017)
 *
 * Displays a single concern chip.
 * AC-4: Concerns with addressed state
 */
export function ConcernChip({ concern }: ConcernChipProps): ReactNode {
  return (
    <div
      className={`${styles.chip} ${concern.addressed ? styles.addressed : ''}`}
      data-testid="concern-chip"
      data-addressed={concern.addressed}
      aria-label={`${concern.type}${concern.addressed ? ' (addressed)' : ''}`}
    >
      <span className={styles.type}>{concern.type}</span>
      {concern.addressed && <span className={styles.check}>&#10003;</span>}
    </div>
  );
}
