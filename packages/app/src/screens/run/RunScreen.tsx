import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CardId } from '@hsh/engine-core';
import { useGameStore } from '../../stores/gameStore.js';
import {
  BeliefBar,
  TurnsDisplay,
} from '../../components/hud/index.js';
import { HandCarousel } from '../../components/hand/index.js';
import { StoryTimeline } from '../../components/story/index.js';
import { ObjectionPrompt } from '../../components/ObjectionPrompt/index.js';
import styles from './RunScreen.module.css';

/**
 * RunScreen Component (Task 004, Task 005)
 *
 * Main gameplay UI showing:
 * - BeliefBar with current belief and target
 * - TurnsDisplay showing turns played/total
 * - Hand carousel for card selection (1 card per turn in V5)
 * - Story timeline of played cards
 * - ObjectionPrompt after turn 2 (Task 005)
 *
 * V5 Changes:
 * - Single card selection per turn (not 1-3)
 * - BeliefBar replaces ResistanceBar
 * - Removed MVP-specific HUD elements
 * - Navigates to results after 3 turns
 */
export function RunScreen(): ReactNode {
  const navigate = useNavigate();

  // Game state from V5 store
  const gameState = useGameStore((s) => s.gameState);
  const currentPuzzle = useGameStore((s) => s.currentPuzzle);
  const currentConfig = useGameStore((s) => s.currentConfig);
  const playCard = useGameStore((s) => s.playCard);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const shouldShowObjection = useGameStore((s) => s.shouldShowObjection);
  const resolveObjection = useGameStore((s) => s.resolveObjection);

  // ERR-1: Redirect if no active game
  useEffect(() => {
    if (!gameState || !currentPuzzle) {
      navigate('/');
    }
  }, [gameState, currentPuzzle, navigate]);

  // AC-5: Navigate to results on game over
  useEffect(() => {
    if (gameState && isGameOver()) {
      navigate('/results');
    }
  }, [gameState, isGameOver, navigate]);

  // Don't render if no game state
  if (!gameState || !currentPuzzle) {
    return null;
  }

  // AC-3: Card selection plays card (single card per turn in V5)
  const handleCardSelect = useCallback((cardId: CardId) => {
    const result = playCard(cardId);
    if (!result.ok) {
      console.error('Failed to play card:', result.error.message);
    }
  }, [playCard]);

  // Task 005: Handle objection resolution
  const handleStandBy = useCallback(() => {
    const result = resolveObjection('stood_by');
    if (!result.ok) {
      console.error('Failed to resolve objection:', result.error.message);
    }
  }, [resolveObjection]);

  const handleWithdraw = useCallback(() => {
    const result = resolveObjection('withdrawn');
    if (!result.ok) {
      console.error('Failed to resolve objection:', result.error.message);
    }
  }, [resolveObjection]);

  // Task 005: Check if objection prompt should be shown
  const showObjection = shouldShowObjection();
  const challengedCard = gameState.played.length > 0
    ? gameState.played[gameState.played.length - 1]
    : null;

  // EC-1: Empty hand placeholder
  const handCards = gameState.hand;

  // AC-1: BeliefBar displays correctly
  const currentBelief = gameState.belief;
  const targetBelief = currentPuzzle.target;

  // AC-6: TurnsDisplay shows played/total
  const turnsPlayed = gameState.turnsPlayed;
  const turnsTotal = currentConfig.turnsPerGame;

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.hud} data-testid="run-hud">
        <div className={styles.hudTop}>
          {/* AC-1: BeliefBar shows belief vs target */}
          <BeliefBar
            current={currentBelief}
            target={targetBelief}
          />
        </div>
        <div className={styles.hudMiddle}>
          {/* AC-6: TurnsDisplay shows turns played/total */}
          <TurnsDisplay
            turnsPlayed={turnsPlayed}
            turnsTotal={turnsTotal}
          />
        </div>
      </div>

      {/* Story Timeline */}
      <StoryTimeline committed={gameState.played} />

      {/* Hand Carousel - AC-2, AC-3 */}
      {/* EC-1: HandCarousel handles empty hand with "No cards" placeholder */}
      <HandCarousel
        cards={handCards}
        selected={[]}
        onSelect={handleCardSelect}
        maxSelect={1}
      />

      {/* No submit button in V5 - cards are played immediately on selection */}

      {/* Task 005: Objection prompt after turn 2 */}
      {showObjection && (
        <ObjectionPrompt
          onStandBy={handleStandBy}
          onWithdraw={handleWithdraw}
          challengedCardTitle={challengedCard?.claim}
        />
      )}
    </div>
  );
}
