import type { ReactNode } from 'react';
import type { Card as EvidenceCardType } from '@hsh/engine-core';
import styles from './StoryTimeline.module.css';

/**
 * Props for StoryTimeline component
 */
export interface StoryTimelineProps {
  /** Cards committed to the story */
  committed: readonly EvidenceCardType[];
}

/**
 * StoryTimeline Component (Task 017)
 *
 * Displays the committed story as a timeline.
 * AC-7: Committed story timeline
 */
export function StoryTimeline({ committed }: StoryTimelineProps): ReactNode {
  return (
    <div className={styles.container} data-testid="story-timeline">
      <h3 className={styles.title}>Your Story</h3>
      {committed.length === 0 ? (
        <div className={styles.empty}>No evidence presented yet</div>
      ) : (
        <div className={styles.timeline}>
          {committed.map((card, index) => (
            <div key={card.id} className={styles.entry}>
              <div className={styles.marker}>
                <span className={styles.number}>{index + 1}</span>
              </div>
              <div className={styles.content}>
                <span className={styles.source}>{card.source ?? 'Evidence'}</span>
                <span className={styles.power}>+{card.power}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
