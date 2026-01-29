import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tier } from '@hsh/engine-core';
import { useGameStore } from '../../stores/gameStore.js';
import styles from './ResultScreen.module.css';

// Suppress unused variable - Tier will be used once V5 win detection is implemented
void (undefined as unknown as Tier);

// TODO: V5 migration - GameEvent no longer exists, win/loss determined differently in V5

/**
 * Loss reason messages
 */
const LOSS_REASONS: Record<string, string> = {
  turns_exhausted: 'Access window closed',
  scrutiny: "KOA is convinced you're lying",
};

/**
 * Get the loss reason from the last event
 * TODO: V5 migration - Remove event sourcing, determine from GameState
 */
function getLossReason(events: readonly unknown[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i] as { type?: string; payload?: { reason?: string } } | null;
    if (event && event.type === 'RUN_ENDED') {
      if (event.payload?.reason) {
        return event.payload.reason;
      }
    }
  }
  return undefined;
}

/**
 * ScoreRecap Component
 *
 * TODO: V5 migration - Update to show V5 stats:
 * - turnsPlayed (not turnsUsed based on turnsRemaining)
 * - belief score (not damage/resistance)
 * - lies detected/avoided
 * - Remove concerns and scrutiny
 */
function ScoreRecap({
  turnsUsed,
  totalDamage,
  concernsAddressed,
  scrutiny,
}: {
  turnsUsed: number;
  totalDamage: number;
  concernsAddressed: number;
  scrutiny: number;
}): ReactNode {
  return (
    <div className={styles.scoreRecap} data-testid="score-recap">
      <h3 className={styles.recapTitle}>Game Summary</h3>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Turns Used</span>
          <span className={styles.statValue}>{turnsUsed}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Belief</span>
          <span className={styles.statValue}>{totalDamage}</span>
        </div>
        {/* TODO: V5 migration - concerns removed from V5 */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Concerns Addressed</span>
          <span className={styles.statValue}>{concernsAddressed}</span>
        </div>
        {/* TODO: V5 migration - scrutiny removed from V5 */}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Final Scrutiny</span>
          <span className={styles.statValue}>{scrutiny}/5</span>
        </div>
      </div>
    </div>
  );
}

/**
 * CelebrationAnimation Component
 */
function CelebrationAnimation(): ReactNode {
  return (
    <div className={styles.celebration} data-testid="celebration" aria-hidden="true">
      <span className={styles.confetti}>&#127881;</span>
      <span className={styles.confetti}>&#127882;</span>
      <span className={styles.confetti}>&#127881;</span>
    </div>
  );
}

/**
 * ResultScreen Component (Task 020)
 *
 * Post-game UI showing:
 * - Win/loss state
 * - Score recap
 * - Navigation buttons
 * - Win celebration animation
 *
 * TODO: V5 migration - Major changes needed:
 * - GameState has different fields (belief, turnsPlayed, turnResults)
 * - Win/loss determined by belief vs target (from puzzle)
 * - No concerns or scrutiny in V5
 * - Tier determines final verdict (FLAWLESS, CLEARED, CLOSE, BUSTED)
 */
export function ResultScreen(): ReactNode {
  const navigate = useNavigate();

  // Game state
  const runState = useGameStore((s) => s.runState);
  const events = useGameStore((s) => s.events);
  const reset = useGameStore((s) => s.reset);

  // Redirect if no run state
  useEffect(() => {
    if (!runState) {
      navigate('/');
    }
  }, [runState, navigate]);

  // Handlers
  const handlePlayAgain = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

  const handleArchive = useCallback(() => {
    navigate('/archive');
  }, [navigate]);

  const handleShare = useCallback(() => {
    // Stub for share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Home Smart Home',
        text: 'I just played Home Smart Home!',
      }).catch(() => {
        // Ignore share errors
      });
    }
  }, []);

  // Don't render if no run state
  if (!runState) {
    return null;
  }

  // Determine win/loss from events
  const lossReason = getLossReason(events);

  // Check if this was actually a win (runState would show the result)
  // TODO: V5 migration - Use Tier and belief vs target to determine win
  const lastEvent = events[events.length - 1] as { type?: string; payload?: { status?: string } } | null;
  const actuallyWon = lastEvent?.type === 'RUN_ENDED' &&
    lastEvent.payload?.status === 'victory';

  // Calculate stats from V5 GameState
  // V5 has: belief, turnsPlayed, turnResults, played, hand, objection
  const turnsUsed = runState.turnsPlayed;
  const totalBelief = runState.belief;

  // TODO: V5 migration - These don't exist in V5 GameState, show placeholders
  // concerns and scrutiny removed from V5
  const concernsAddressed = 0; // Placeholder - V5 has no concerns
  const scrutiny = 0; // Placeholder - V5 has no scrutiny

  const isPerfect = actuallyWon && scrutiny === 0;

  // Get display loss reason
  const displayLossReason = lossReason ? LOSS_REASONS[lossReason] || lossReason : '';

  return (
    <div
      className={`${styles.container} ${actuallyWon ? styles.win : styles.loss}`}
      data-testid="result-screen"
      data-result={actuallyWon ? 'win' : 'loss'}
    >
      {/* Win celebration */}
      {actuallyWon && <CelebrationAnimation />}

      {/* Title */}
      <h1 className={styles.title}>
        {actuallyWon ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
      </h1>

      {/* Loss reason */}
      {!actuallyWon && displayLossReason && (
        <p className={styles.lossReason} data-testid="loss-reason">
          {displayLossReason}
        </p>
      )}

      {/* Perfect run indicator */}
      {isPerfect && (
        <div className={styles.perfect} data-testid="perfect-indicator">
          Perfect Run!
        </div>
      )}

      {/* Score recap */}
      <ScoreRecap
        turnsUsed={turnsUsed}
        totalDamage={totalBelief}
        concernsAddressed={concernsAddressed}
        scrutiny={scrutiny}
      />

      {/* Navigation */}
      <nav className={styles.nav}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleShare}
          aria-label="Share result"
        >
          Share
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handlePlayAgain}
          aria-label="Play again"
        >
          Play Again
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleArchive}
          aria-label="View archive"
        >
          Archive
        </button>
      </nav>
    </div>
  );
}
