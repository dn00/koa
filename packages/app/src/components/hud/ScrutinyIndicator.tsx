import type { ReactNode } from 'react';
import type { Scrutiny } from '@hsh/engine-core';
import styles from './ScrutinyIndicator.module.css';

/**
 * Props for ScrutinyIndicator component
 */
export interface ScrutinyIndicatorProps {
  /** Current scrutiny level (0-5) */
  level: Scrutiny;
}

/**
 * ScrutinyIndicator Component (Task 017)
 *
 * Displays KOA's scrutiny level.
 * AC-3: Scrutiny indicator
 * EC-3: Warning at scrutiny 4
 */
export function ScrutinyIndicator({ level }: ScrutinyIndicatorProps): ReactNode {
  const isWarning = level >= 4;

  return (
    <div
      className={`${styles.container} ${isWarning ? styles.warning : ''}`}
      data-testid="scrutiny-indicator"
      data-warning={isWarning}
      aria-label={`Scrutiny: ${level} of 5${isWarning ? ' - Warning!' : ''}`}
    >
      <span className={styles.label}>Scrutiny</span>
      <span className={styles.value}>
        {level} / 5
      </span>
    </div>
  );
}
