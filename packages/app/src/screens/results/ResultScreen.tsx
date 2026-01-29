/**
 * ResultScreen Component (Task 008 - V5 Migration)
 *
 * Post-game UI showing V5 verdict data:
 * - Tier (FLAWLESS, CLEARED, CLOSE, BUSTED) instead of WON/LOST
 * - Belief score vs target
 * - Played cards with lie reveal
 * - KOA verdict line
 *
 * V5 Changes:
 * - No concerns or scrutiny mechanics
 * - Tier-based outcome system
 * - VerdictData from engine
 */

import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VerdictData, Tier } from '@hsh/engine-core';
import { useGameStore } from '../../stores/gameStore.js';
import styles from './ResultScreen.module.css';

/**
 * Props for ResultScreen component
 */
interface ResultScreenProps {
  /** Optional test verdict for testing edge cases */
  readonly testVerdict?: VerdictData;
}

/**
 * Map tier to display title
 */
const TIER_TITLES: Record<Tier, string> = {
  FLAWLESS: 'FLAWLESS VICTORY',
  CLEARED: 'ACCESS GRANTED',
  CLOSE: 'CLOSE CALL',
  BUSTED: 'ACCESS DENIED',
};

/**
 * Map tier to whether it's a "win"
 */
const TIER_IS_WIN: Record<Tier, boolean> = {
  FLAWLESS: true,
  CLEARED: true,
  CLOSE: false,
  BUSTED: false,
};

/**
 * PlayedCardItem Component
 *
 * Displays a single played card with lie reveal indicator.
 */
function PlayedCardItem({
  card,
  wasLie,
  index,
}: {
  card: { readonly claim: string };
  wasLie: boolean;
  index: number;
}): ReactNode {
  return (
    <div
      className={`${styles.playedCard} ${wasLie ? styles.lieCard : styles.truthCard}`}
      data-testid={`played-card-${index}`}
      data-was-lie={wasLie}
    >
      <span className={styles.cardTitle}>{card.claim}</span>
      <span className={styles.cardIndicator}>
        {wasLie ? 'LIE' : 'TRUTH'}
      </span>
    </div>
  );
}

/**
 * PlayedCardsSection Component
 *
 * Displays all played cards with lie reveal.
 * AC-3: Display played cards with lie reveal
 * EC-1: No played cards shows appropriate message
 */
function PlayedCardsSection({
  playedCards,
}: {
  playedCards: VerdictData['playedCards'];
}): ReactNode {
  if (playedCards.length === 0) {
    return (
      <div className={styles.playedCards} data-testid="played-cards">
        <h3 className={styles.sectionTitle}>Your Claims</h3>
        <p className={styles.noCards} data-testid="no-cards-message">
          No claims were made.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.playedCards} data-testid="played-cards">
      <h3 className={styles.sectionTitle}>Your Claims</h3>
      <div className={styles.cardsList}>
        {playedCards.map((item, index) => (
          <PlayedCardItem
            key={item.card.id}
            card={item.card}
            wasLie={item.wasLie}
            index={index}
          />
        ))}
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
 * ResultScreen Component
 *
 * V5 Results screen showing:
 * - AC-1: Tier (FLAWLESS, CLEARED, CLOSE, BUSTED)
 * - AC-2: Belief score vs target
 * - AC-3: Played cards with lie reveal
 * - AC-4: KOA verdict line
 * - EC-1: Empty playedCards handling
 */
export function ResultScreen({ testVerdict }: ResultScreenProps): ReactNode {
  const navigate = useNavigate();

  // V5 game state
  const gameState = useGameStore((s) => s.gameState);
  const getVerdict = useGameStore((s) => s.getVerdict);
  const reset = useGameStore((s) => s.reset);

  // Get verdict (from store or test prop)
  const verdict = testVerdict ?? getVerdict();

  // Redirect if no game state (unless we have a test verdict)
  useEffect(() => {
    if (!gameState && !testVerdict) {
      navigate('/');
    }
  }, [gameState, testVerdict, navigate]);

  // Handlers
  const handlePlayAgain = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

  const handleArchive = useCallback(() => {
    navigate('/archive');
  }, [navigate]);

  const handleShare = useCallback(() => {
    if (navigator.share && verdict) {
      navigator.share({
        title: 'Home Smart Home',
        text: `I achieved ${verdict.tier} with ${verdict.beliefFinal}/${verdict.beliefTarget} belief!`,
      }).catch(() => {
        // Ignore share errors
      });
    }
  }, [verdict]);

  // Don't render if no verdict
  if (!verdict) {
    return null;
  }

  const isWin = TIER_IS_WIN[verdict.tier];
  const title = TIER_TITLES[verdict.tier];

  return (
    <div
      className={`${styles.container} ${isWin ? styles.win : styles.loss}`}
      data-testid="result-screen"
      data-result={isWin ? 'win' : 'loss'}
    >
      {/* Win celebration */}
      {isWin && <CelebrationAnimation />}

      {/* AC-1: Tier display */}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.tierBadge} data-testid="verdict-tier">
        {verdict.tier}
      </div>

      {/* AC-4: KOA verdict line */}
      <p className={styles.koaLine} data-testid="koa-verdict-line">
        {verdict.koaLine}
      </p>

      {/* AC-2: Belief score vs target */}
      <div className={styles.beliefScore} data-testid="belief-score">
        <span className={styles.beliefLabel}>Final Belief</span>
        <span className={styles.beliefValue}>
          {verdict.beliefFinal} / {verdict.beliefTarget}
        </span>
      </div>

      {/* AC-3, EC-1: Played cards with lie reveal */}
      <PlayedCardsSection playedCards={verdict.playedCards} />

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
