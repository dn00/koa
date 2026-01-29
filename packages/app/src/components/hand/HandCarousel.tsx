import type { ReactNode } from 'react';
import type { Card as EvidenceCardType, CardId } from '@hsh/engine-core';
import { EvidenceCard } from '../EvidenceCard/index.js';
import styles from './HandCarousel.module.css';

/**
 * Props for HandCarousel component
 */
export interface HandCarouselProps {
  /** Cards in hand */
  cards: readonly EvidenceCardType[];
  /** Currently selected card IDs */
  selected: readonly CardId[];
  /** Called when a card is selected/deselected */
  onSelect: (cardId: CardId) => void;
  /** Maximum number of cards that can be selected */
  maxSelect?: number;
}

/**
 * HandCarousel Component (Task 017)
 *
 * Displays the player's hand as a horizontally scrollable carousel.
 * AC-6: Hand displays 6 cards
 * AC-11: Mobile touch carousel
 */
export function HandCarousel({
  cards,
  selected,
  onSelect,
  maxSelect = 3,
}: HandCarouselProps): ReactNode {
  // Cast to CardId to handle branded type mismatch between V5 Card.id and props
  const handleCardClick = (cardId: string): void => {
    onSelect(cardId as CardId);
  };

  // Helper to check if a card is selected (handles branded type comparison)
  const isSelected = (cardId: string): boolean => {
    return (selected as readonly string[]).includes(cardId);
  };

  const isCardDisabled = (cardId: string): boolean => {
    // Disable if max selected and this card is not selected
    if (selected.length >= maxSelect && !isSelected(cardId)) {
      return true;
    }
    return false;
  };

  return (
    <div className={styles.container} data-testid="hand-carousel">
      <div className={styles.carousel}>
        {cards.map((card) => (
          <div key={card.id} className={styles.cardWrapper}>
            <EvidenceCard
              card={card}
              selected={isSelected(card.id)}
              disabled={isCardDisabled(card.id)}
              onClick={() => handleCardClick(card.id)}
            />
          </div>
        ))}
        {cards.length === 0 && (
          <div className={styles.empty}>No cards in hand</div>
        )}
      </div>
    </div>
  );
}
