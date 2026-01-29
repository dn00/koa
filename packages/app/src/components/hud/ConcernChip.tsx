// TODO: V5 migration - DELETE this file in Task 007
// V5 has no concerns mechanic; this component is obsolete

import type { ReactNode } from 'react';
// TODO: V5 migration - Concern type removed from engine-core (was from @hsh/engine-core)
import styles from './ConcernChip.module.css';

// Local placeholder type until file is deleted
interface Concern {
  id: string;
  type: string;
  addressed: boolean;
}

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
 * @deprecated V5 migration - This component will be deleted in Task 007
 * V5 has no concerns mechanic.
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
