import type { ReactNode } from 'react';
import type { EvidenceCard as EvidenceCardType } from '@hsh/engine-core';
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
 * Format claims for display.
 */
function formatClaims(claims: EvidenceCardType['claims']): string {
  const parts: string[] = [];

  if (claims.location) {
    parts.push(claims.location);
  }
  if (claims.state) {
    parts.push(claims.state);
  }
  if (claims.activity) {
    parts.push(claims.activity);
  }
  if (claims.timeRange) {
    parts.push(claims.timeRange);
  }

  return parts.length > 0 ? parts.join(' | ') : 'No claims';
}

/**
 * Evidence Card Component (Task 018)
 *
 * Displays an evidence card with:
 * AC-1: Card name/source
 * AC-2: Power value (number badge)
 * AC-3: Proof types (chip/tag for each)
 * AC-4: Claims (location, state, time)
 * AC-5: Selected state (visual highlight)
 * AC-6: Disabled state (grayed out, not clickable)
 * AC-7: onClick handler for selection
 * EC-1: Card with no claims shows placeholder
 * EC-2: Long text truncates gracefully
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
      {/* Header: Source and Power */}
      <div className={styles.header}>
        <span className={styles.source} title={card.source ?? 'Unknown source'}>
          {card.source ?? 'Unknown'}
        </span>
        <span className={styles.power} aria-label={`Power: ${card.power}`}>
          {card.power}
        </span>
      </div>

      {/* Proof types */}
      <div className={styles.proves} aria-label="Proof types">
        {card.proves.length > 0 ? (
          card.proves.map((proof) => (
            <span key={proof} className={styles.proofChip}>
              {proof}
            </span>
          ))
        ) : (
          <span className={styles.noProof}>No proof</span>
        )}
      </div>

      {/* Claims */}
      <div className={styles.claims} title={formatClaims(card.claims)}>
        {formatClaims(card.claims)}
      </div>

      {/* AC-7: Refutation badge when card can refute counters */}
      {card.refutes && (
        <div className={styles.refuteBadge} aria-label="Can refute counter-evidence">
          Refutes
        </div>
      )}
    </div>
  );
}
