import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceCard } from '../../src/components/EvidenceCard/index.js';
import type { EvidenceCard as EvidenceCardType, CardId } from '@hsh/engine-core';
import { ProofType } from '@hsh/engine-core';

/**
 * Task 018: Evidence Card Component
 */
describe('Task 018: Evidence Card Component', () => {
  // Helper to create a test card
  function createCard(overrides?: Partial<EvidenceCardType>): EvidenceCardType {
    return {
      id: 'card_test' as CardId,
      power: 3,
      proves: [ProofType.IDENTITY],
      claims: { location: 'living room' },
      source: 'Smart Doorbell',
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: Displays card name/source
  // ==========================================================================
  describe('AC-1: Displays card name/source', () => {
    it('should display the card source', () => {
      const card = createCard({ source: 'Smart Thermostat' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('Smart Thermostat')).toBeInTheDocument();
    });

    it('should display "Unknown" when source is not provided', () => {
      const card = createCard({ source: undefined });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-2: Displays power value
  // ==========================================================================
  describe('AC-2: Displays power value', () => {
    it('should display the power value', () => {
      const card = createCard({ power: 5 });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should have aria-label for power', () => {
      const card = createCard({ power: 3 });
      render(<EvidenceCard card={card} />);

      expect(screen.getByLabelText('Power: 3')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-3: Displays proof types
  // ==========================================================================
  describe('AC-3: Displays proof types', () => {
    it('should display proof type chips', () => {
      const card = createCard({ proves: [ProofType.IDENTITY, ProofType.LOCATION] });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('IDENTITY')).toBeInTheDocument();
      expect(screen.getByText('LOCATION')).toBeInTheDocument();
    });

    it('should show "No proof" when proves is empty', () => {
      const card = createCard({ proves: [] });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('No proof')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-4: Displays claims
  // ==========================================================================
  describe('AC-4: Displays claims', () => {
    it('should display location claim', () => {
      const card = createCard({ claims: { location: 'kitchen' } });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('kitchen')).toBeInTheDocument();
    });

    it('should display multiple claims separated by |', () => {
      const card = createCard({
        claims: { location: 'bedroom', state: 'asleep', timeRange: '2:00am-6:00am' },
      });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('bedroom | asleep | 2:00am-6:00am')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-5: Supports selected state
  // ==========================================================================
  describe('AC-5: Supports selected state', () => {
    it('should have aria-pressed when selected', () => {
      const card = createCard();
      render(<EvidenceCard card={card} selected />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have aria-pressed=false when not selected', () => {
      const card = createCard();
      render(<EvidenceCard card={card} selected={false} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ==========================================================================
  // AC-6: Supports disabled state
  // ==========================================================================
  describe('AC-6: Supports disabled state', () => {
    it('should have aria-disabled when disabled', () => {
      const card = createCard();
      render(<EvidenceCard card={card} disabled />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not call onClick when disabled', () => {
      const card = createCard();
      const handleClick = vi.fn();
      render(<EvidenceCard card={card} disabled onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have tabIndex -1 when disabled', () => {
      const card = createCard();
      render(<EvidenceCard card={card} disabled />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('tabIndex', '-1');
    });
  });

  // ==========================================================================
  // AC-7: onClick handler for selection
  // ==========================================================================
  describe('AC-7: onClick handler for selection', () => {
    it('should call onClick when clicked', () => {
      const card = createCard();
      const handleClick = vi.fn();
      render(<EvidenceCard card={card} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Enter key', () => {
      const card = createCard();
      const handleClick = vi.fn();
      render(<EvidenceCard card={card} onClick={handleClick} />);

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick on Space key', () => {
      const card = createCard();
      const handleClick = vi.fn();
      render(<EvidenceCard card={card} onClick={handleClick} />);

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // EC-1: Card with no claims shows placeholder
  // ==========================================================================
  describe('EC-1: Card with no claims shows placeholder', () => {
    it('should show "No claims" when claims object is empty', () => {
      const card = createCard({ claims: {} });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('No claims')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EC-2: Long text truncates gracefully
  // ==========================================================================
  describe('EC-2: Long text truncates gracefully', () => {
    it('should have title attribute for truncated source', () => {
      const longSource = 'Very Long Smart Device Name That Should Truncate';
      const card = createCard({ source: longSource });
      render(<EvidenceCard card={card} />);

      const sourceElement = screen.getByText(longSource);
      expect(sourceElement).toHaveAttribute('title', longSource);
    });

    it('should have title attribute for truncated claims', () => {
      const card = createCard({
        claims: {
          location: 'A very long location name',
          state: 'some state',
          activity: 'some activity',
          timeRange: '1:00am-2:00am',
        },
      });
      render(<EvidenceCard card={card} />);

      const claimsText = 'A very long location name | some state | some activity | 1:00am-2:00am';
      expect(screen.getByTitle(claimsText)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-7: Refutation Badge
  // ==========================================================================
  describe('AC-7: Refutation Badge', () => {
    it('should display refutation badge when card has refutes property', () => {
      const card = createCard({ refutes: 'counter_1' as any });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('Refutes')).toBeInTheDocument();
    });

    it('should have aria-label for refutation badge', () => {
      const card = createCard({ refutes: 'counter_1' as any });
      render(<EvidenceCard card={card} />);

      expect(screen.getByLabelText('Can refute counter-evidence')).toBeInTheDocument();
    });

    it('should not display refutation badge when card has no refutes property', () => {
      const card = createCard({ refutes: undefined });
      render(<EvidenceCard card={card} />);

      expect(screen.queryByText('Refutes')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-8: Touch-Friendly Size (visual test - verify structure)
  // ==========================================================================
  describe('AC-8: Touch-Friendly Size', () => {
    it('should be a button element for accessibility', () => {
      const card = createCard();
      render(<EvidenceCard card={card} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toBeInTheDocument();
    });

    it('should have proper tabIndex for keyboard navigation', () => {
      const card = createCard();
      render(<EvidenceCard card={card} />);

      const cardElement = screen.getByRole('button');
      expect(cardElement).toHaveAttribute('tabIndex', '0');
    });
  });
});
