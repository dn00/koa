import type { ReactNode } from 'react';
import type { Card as EvidenceCardType } from '@hsh/engine-core';
import styles from './EvidenceCard.module.css';

/**
 * Props for EvidenceCard component
 */
export interface EvidenceCardProps {
  /** The evidence card data to display */
  card: EvidenceCardType;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether the card is disabled (can't be selected) */
  disabled?: boolean;
  /** Called when card is clicked */
  onClick?: () => void;
}

/**
 * Evidence Card Component (Task 018)
 *
 * Displays an evidence card with:
 * AC-1: Card name/location (V5: was source)
 * AC-2: Strength value (V5: was power)
 * AC-3: Evidence type (V5: replaces proves)
 * AC-4: Claim (V5: simplified from claims object)
 * AC-5: Selected state (visual highlight)
 * AC-6: Disabled state (grayed out, not clickable)
 * AC-7: onClick handler for selection
 * EC-1: Card with no claim shows placeholder
 * EC-2: Long text truncates gracefully
 *
 * TODO: V5 migration - Card fields updated:
 * - power -> strength
 * - source -> location
 * - claims (object) -> claim (string)
 * - proves -> DELETE (V5 has evidenceType instead)
 * - refutes -> DELETE (V5 has no counter-evidence)
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
    >
      {/* Header: Location and Strength */}
      <div className={styles.header}>
        <span className={styles.source} title={card.location ?? 'Unknown location'}>
          {card.location ?? 'Unknown'}
        </span>
        <span className={styles.power} aria-label={`Strength: ${card.strength}`}>
          {card.strength}
        </span>
      </div>

      {/* Evidence type (V5: replaces proves) */}
      <div className={styles.proves} aria-label="Evidence type">
        <span className={styles.proofChip}>
          {card.evidenceType}
        </span>
      </div>

      {/* Claim (V5: simplified from claims object) */}
      <div className={styles.claims} title={card.claim}>
        {card.claim || 'No claim'}
      </div>

      {/* TODO: V5 migration - refutes removed, V5 has no counter-evidence mechanic */}
    </div>
  );
}
