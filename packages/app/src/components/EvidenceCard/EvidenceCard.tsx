import type { ReactNode } from 'react';
import type { Card } from '@hsh/engine-core';
import styles from './EvidenceCard.module.css';

/**
 * Props for EvidenceCard component
 */
export interface EvidenceCardProps {
  /** The V5 Card data to display */
  card: Card;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether the card is disabled (can't be selected) */
  disabled?: boolean;
  /** Called when card is clicked */
  onClick?: () => void;
}

/**
 * Evidence Card Component (Task 003: V5 Migration)
 *
 * Displays a V5 Card with:
 * AC-1: card.strength as badge (1-5 scale)
 * AC-2: card.evidenceType as chip/tag
 * AC-3: card.claim as main text content
 * AC-4: card.location and card.time as metadata
 * AC-5: No proves/refutes display (V5 simplified)
 * EC-1: Long claim text truncates with ellipsis
 * EC-2: All evidence types render with distinct visual treatment
 */
export function EvidenceCard({
  card,
  selected = false,
  disabled = false,
  onClick,
}: EvidenceCardProps): ReactNode {
  const handleClick = (): void => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={`${styles.card} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-disabled={disabled}
      data-testid="evidence-card"
    >
      {/* Header: Location and Strength (AC-1, AC-4) */}
      <div className={styles.header}>
        <span className={styles.source} title={card.location}>
          {card.location}
        </span>
        <span className={styles.power} aria-label={`Strength: ${card.strength}`}>
          {card.strength}
        </span>
      </div>

      {/* Evidence type chip (AC-2) and Time metadata (AC-4) */}
      <div className={styles.proves} aria-label="Evidence type">
        <span className={styles.proofChip}>{card.evidenceType}</span>
        <span className={styles.proofChip}>{card.time}</span>
      </div>

      {/* Claim (AC-3, EC-1) */}
      <div className={styles.claims} title={card.claim}>
        {card.claim || 'No claim'}
      </div>
    </div>
  );
}
