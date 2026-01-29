// TODO: V5 migration - DELETE this file in Task 007
// V5 has no scrutiny mechanic; this component is obsolete

import type { ReactNode } from 'react';
// TODO: V5 migration - Scrutiny type removed from engine-core (was from @hsh/engine-core)
import styles from './ScrutinyIndicator.module.css';

// Local placeholder type until file is deleted
type Scrutiny = number;

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
 * @deprecated V5 migration - This component will be deleted in Task 007
 * V5 has no scrutiny mechanic.
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
