import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CardId, Card } from '@hsh/engine-core';
import { useGameStore } from '../../stores/gameStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import {
  ResistanceBar,
  // TODO: V5 migration - ScrutinyIndicator removed (V5 has no scrutiny)
  // ScrutinyIndicator,
  // TODO: V5 migration - ConcernChip removed (V5 has no concerns)
  // ConcernChip,
  TurnsDisplay,
} from '../../components/hud/index.js';
import { HandCarousel } from '../../components/hand/index.js';
import { StoryTimeline } from '../../components/story/index.js';
// TODO: V5 migration - CounterPanel removed (V5 has no counter-evidence)
// import { CounterPanel } from '../../components/counter/index.js';
import styles from './RunScreen.module.css';

/**
 * RunScreen Component (Task 017)
 *
 * Main gameplay UI showing:
 * - HUD with belief score (V5: was resistance), turns
 * - Hand carousel for card selection
 * - Story timeline of committed cards
 * - Submit button
 *
 * TODO: V5 migration - Major changes needed:
 * - GameState has different fields (belief, hand, played, turnResults, etc.)
 * - No concerns mechanic
 * - No scrutiny mechanic
 * - No counter-evidence mechanic
 * - resistance -> belief (different concept)
 */
export function RunScreen(): ReactNode {
  const navigate = useNavigate();

  // Game state
  const runState = useGameStore((s) => s.runState);
  const dealtHand = useGameStore((s) => s.dealtHand);
  const submitCards = useGameStore((s) => s.submitCards);

  // Settings
  const counterVisibility = useSettingsStore((s) => s.counterVisibility);
  // Suppress unused variable warning
  void counterVisibility;

  // Local state for card selection
  const [selectedCards, setSelectedCards] = useState<CardId[]>([]);

  // ERR-1: Redirect if no active run
  useEffect(() => {
    if (!runState) {
      navigate('/');
    }
  }, [runState, navigate]);

  // Don't render if no run state
  if (!runState) {
    return null;
  }

  // TODO: V5 migration - concerns removed from V5
  // V5 has no concerns mechanic
  // const concerns: Concern[] = runState.puzzle.concerns.map((concern) => ({
  //   ...concern,
  //   addressed: runState.concernsAddressed.includes(concern.id),
  // }));

  // Handler for card selection
  const handleCardSelect = useCallback((cardId: CardId) => {
    setSelectedCards((prev) => {
      if ((prev as readonly string[]).includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, cardId];
    });
  }, []);

  // Handler for submit
  const handleSubmit = useCallback(() => {
    if (selectedCards.length === 0) return;

    // Find selected cards from dealt hand
    const cards = dealtHand.filter((c) => (selectedCards as readonly string[]).includes(c.id));
    if (cards.length === 0) return;

    // Calculate damage (V5: strength instead of power)
    const damage = cards.reduce((sum, c) => sum + c.strength, 0);

    submitCards([...cards], damage);
    setSelectedCards([]);
  }, [selectedCards, dealtHand, submitCards]);

  // Get cards not yet committed
  // V5 GameState: use 'played' instead of 'committedStory'
  const playedIds = runState.played.map((c: Card) => c.id);
  const handCards = dealtHand.filter(
    (card) => !(playedIds as readonly string[]).includes(card.id)
  );

  // V5 GameState fields: belief (not resistance), turnsPlayed (not turnsRemaining)
  // For now, display what we have
  const currentBelief = runState.belief;
  // TODO: V5 migration - target comes from puzzle, not available in GameState
  // For now, show current belief with a placeholder max
  const maxBelief = 100; // Placeholder - should come from puzzle.target
  const turnsPlayed = runState.turnsPlayed;
  // TODO: V5 migration - turnsRemaining not in GameState, needs puzzle context
  const turnsRemaining = 5 - turnsPlayed; // Placeholder - should come from game config

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.hud} data-testid="run-hud">
        <div className={styles.hudTop}>
          <ResistanceBar
            current={currentBelief}
            max={maxBelief}
          />
        </div>
        <div className={styles.hudMiddle}>
          {/* TODO: V5 migration - ScrutinyIndicator removed (V5 has no scrutiny) */}
          {/* <ScrutinyIndicator level={runState.scrutiny} /> */}
          <TurnsDisplay turns={turnsRemaining} />
        </div>
        <div className={styles.hudBottom}>
          {/* TODO: V5 migration - ConcernChip removed (V5 has no concerns) */}
          {/* {concerns.map((concern) => (
            <ConcernChip key={concern.id} concern={concern} />
          ))} */}
        </div>
      </div>

      {/* Story Timeline */}
      <StoryTimeline committed={runState.played} />

      {/* TODO: V5 migration - CounterPanel removed (V5 has no counter-evidence) */}
      {/* <CounterPanel
        counters={runState.puzzle.counters}
        visibility={counterVisibility}
      /> */}

      {/* Hand Carousel */}
      <HandCarousel
        cards={handCards}
        selected={selectedCards}
        onSelect={handleCardSelect}
        maxSelect={3}
      />

      {/* Submit Button */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={selectedCards.length === 0}
          aria-label={`Submit ${selectedCards.length} card${selectedCards.length !== 1 ? 's' : ''}`}
        >
          Submit ({selectedCards.length})
        </button>
      </div>
    </div>
  );
}
