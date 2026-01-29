// TODO: V5 migration - DELETE this file in Task 007
// V5 has no counter-evidence mechanic; this component is obsolete

import type { ReactNode } from 'react';
// TODO: V5 migration - CounterEvidence type removed from engine-core (was from @hsh/engine-core)
import styles from './CounterPanel.module.css';

// Local placeholder type until file is deleted
interface CounterEvidence {
  id: string;
  refuted: boolean;
  targets: string[];
}

/**
 * Counter visibility options
 */
type CounterVisibility = 'always' | 'hover' | 'never';

/**
 * Props for CounterPanel component
 */
export interface CounterPanelProps {
  /** Counter-evidence in play */
  counters: readonly CounterEvidence[];
  /** Visibility setting */
  visibility: CounterVisibility;
}

/**
 * CounterPanel Component (Task 017)
 *
 * @deprecated V5 migration - This component will be deleted in Task 007
 * V5 has no counter-evidence mechanic.
 *
 * Displays counter-evidence panel.
 * AC-8: Counter panel visible (FULL)
 * AC-9: Counter panel hidden (HIDDEN)
 */
export function CounterPanel({ counters, visibility }: CounterPanelProps): ReactNode {
  const activeCounters = counters.filter((c) => !c.refuted);

  return (
    <div
      className={`${styles.container} ${styles[visibility]}`}
      data-testid="counter-panel"
      data-visibility={visibility}
      aria-label={`${activeCounters.length} active counter-evidence`}
    >
      <h3 className={styles.title}>Counter-Evidence</h3>
      {visibility === 'never' ? (
        <div className={styles.hidden}>Hidden</div>
      ) : activeCounters.length === 0 ? (
        <div className={styles.empty}>No active counters</div>
      ) : (
        <div className={styles.list}>
          {activeCounters.map((counter) => (
            <div key={counter.id} className={styles.counter}>
              <span className={styles.counterId}>{counter.id}</span>
              <span className={styles.targets}>
                Targets: {counter.targets.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
