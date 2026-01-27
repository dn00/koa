import type { ReactNode } from 'react';
import type { CounterEvidence } from '@hsh/engine-core';
import styles from './CounterPanel.module.css';

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
