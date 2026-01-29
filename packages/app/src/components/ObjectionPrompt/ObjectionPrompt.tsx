/**
 * ObjectionPrompt Component (Task 005)
 *
 * Displays the objection prompt UI after turn 2.
 * Allows player to Stand By or Withdraw their last card.
 *
 * V5 Objection Mechanic:
 * - After turn 2, KOA challenges the last played card
 * - Stand By: +2 if truth, -4 if lie
 * - Withdraw: -2 regardless
 */

import type { ReactNode } from 'react';
import styles from './ObjectionPrompt.module.css';

/**
 * Props for ObjectionPrompt component
 */
export interface ObjectionPromptProps {
  /** Callback when player chooses to stand by their card */
  readonly onStandBy: () => void;

  /** Callback when player chooses to withdraw their card */
  readonly onWithdraw: () => void;

  /** Optional challenged card title for display */
  readonly challengedCardTitle?: string;
}

/**
 * ObjectionPrompt Component
 *
 * Renders an overlay/modal prompting the player to choose
 * whether to stand by or withdraw their last played card.
 *
 * AC-1: Appears after turn 2 when shouldTriggerObjection is true
 * AC-2: Stand By option calls onStandBy callback
 * AC-3: Withdraw option calls onWithdraw callback
 */
export function ObjectionPrompt({
  onStandBy,
  onWithdraw,
  challengedCardTitle,
}: ObjectionPromptProps): ReactNode {
  return (
    <div
      className={styles.overlay}
      data-testid="objection-prompt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="objection-title"
    >
      <div className={styles.modal}>
        {/* KOA Challenge Header */}
        <div className={styles.header}>
          <span className={styles.koaIcon} aria-hidden="true">
            &#129302;
          </span>
          <h2 id="objection-title" className={styles.title}>
            KOA Challenges Your Claim
          </h2>
        </div>

        {/* Challenge Description */}
        <div className={styles.content}>
          <p className={styles.description}>
            KOA is suspicious about your last claim
            {challengedCardTitle ? `: "${challengedCardTitle}"` : ''}.
          </p>
          <p className={styles.question}>How do you respond?</p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.standByButton}`}
            onClick={onStandBy}
            aria-label="Stand By your claim"
          >
            <span className={styles.buttonIcon}>&#9989;</span>
            <span className={styles.buttonText}>Stand By</span>
            <span className={styles.buttonHint}>
              +2 if truth, -4 if lie
            </span>
          </button>

          <button
            type="button"
            className={`${styles.button} ${styles.withdrawButton}`}
            onClick={onWithdraw}
            aria-label="Withdraw your claim"
          >
            <span className={styles.buttonIcon}>&#10060;</span>
            <span className={styles.buttonText}>Withdraw</span>
            <span className={styles.buttonHint}>
              -2 regardless
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
