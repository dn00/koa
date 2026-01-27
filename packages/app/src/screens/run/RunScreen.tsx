import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CardId, Concern } from '@hsh/engine-core';
import { useGameStore } from '../../stores/gameStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import {
  ResistanceBar,
  ScrutinyIndicator,
  ConcernChip,
  TurnsDisplay,
} from '../../components/hud/index.js';
import { HandCarousel } from '../../components/hand/index.js';
import { StoryTimeline } from '../../components/story/index.js';
import { CounterPanel } from '../../components/counter/index.js';
import styles from './RunScreen.module.css';

/**
 * RunScreen Component (Task 017)
 *
 * Main gameplay UI showing:
 * - HUD with resistance, scrutiny, concerns, turns
 * - Hand carousel for card selection
 * - Story timeline of committed cards
 * - Counter panel (visibility based on settings)
 * - Submit button
 */
export function RunScreen(): ReactNode {
  const navigate = useNavigate();

  // Game state
  const runState = useGameStore((s) => s.runState);
  const dealtHand = useGameStore((s) => s.dealtHand);
  const submitCards = useGameStore((s) => s.submitCards);

  // Settings
  const counterVisibility = useSettingsStore((s) => s.counterVisibility);

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

  // Compute concerns with addressed state from runState
  const concerns: Concern[] = runState.puzzle.concerns.map((concern) => ({
    ...concern,
    addressed: runState.concernsAddressed.includes(concern.id),
  }));

  // Handler for card selection
  const handleCardSelect = useCallback((cardId: CardId) => {
    setSelectedCards((prev) => {
      if (prev.includes(cardId)) {
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

    // Find selected cards
    const cards = dealtHand.filter((c) => selectedCards.includes(c.id));
    if (cards.length === 0) return;

    // Calculate damage (simplified - full calculation would use resolver)
    const damage = cards.reduce((sum, c) => sum + c.power, 0);

    submitCards([...cards], damage);
    setSelectedCards([]);
  }, [selectedCards, dealtHand, submitCards]);

  // Get cards not yet committed (filter out committed from dealt)
  const handCards = dealtHand.filter(
    (card) => !runState.committedStory.some((c) => c.id === card.id)
  );

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.hud} data-testid="run-hud">
        <div className={styles.hudTop}>
          <ResistanceBar
            current={runState.resistance}
            max={runState.puzzle.resistance}
          />
        </div>
        <div className={styles.hudMiddle}>
          <ScrutinyIndicator level={runState.scrutiny} />
          <TurnsDisplay turns={runState.turnsRemaining} />
        </div>
        <div className={styles.hudBottom}>
          {concerns.map((concern) => (
            <ConcernChip key={concern.id} concern={concern} />
          ))}
        </div>
      </div>

      {/* Story Timeline */}
      <StoryTimeline committed={runState.committedStory} />

      {/* Counter Panel */}
      <CounterPanel
        counters={runState.puzzle.counters}
        visibility={counterVisibility}
      />

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
