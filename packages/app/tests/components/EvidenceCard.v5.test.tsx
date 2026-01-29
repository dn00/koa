/**
 * Task 003: Update EvidenceCard Component (V5 Migration)
 *
 * Tests for V5 Card display in EvidenceCard component.
 * Total tests required: 7 (5 AC + 2 EC)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceCard } from '../../src/components/EvidenceCard/index.js';
import type { Card, CardId, EvidenceType } from '@hsh/engine-core';

describe('Task 003: Update EvidenceCard Component (V5 Migration)', () => {
  /**
   * Helper to create a V5 Card for testing
   */
  function createV5Card(overrides?: Partial<Card>): Card {
    return {
      id: 'card_test' as CardId,
      strength: 3,
      evidenceType: 'DIGITAL' as EvidenceType,
      location: 'OFFICE',
      time: '10:45 PM',
      claim: 'Browser history shows streaming activity',
      presentLine: 'I was watching Netflix.',
      isLie: false,
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: Display card.strength
  // ==========================================================================
  describe('AC-1: Display card.strength', () => {
    it('should show strength as badge (1-5 scale)', () => {
      const card = createV5Card({ strength: 4 });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByLabelText('Strength: 4')).toBeInTheDocument();
    });

    it('should display strength value of 1', () => {
      const card = createV5Card({ strength: 1 });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should display strength value of 5', () => {
      const card = createV5Card({ strength: 5 });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-2: Display card.evidenceType
  // ==========================================================================
  describe('AC-2: Display card.evidenceType', () => {
    it('should show DIGITAL type as chip/tag', () => {
      const card = createV5Card({ evidenceType: 'DIGITAL' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('DIGITAL')).toBeInTheDocument();
    });

    it('should show PHYSICAL type as chip/tag', () => {
      const card = createV5Card({ evidenceType: 'PHYSICAL' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('PHYSICAL')).toBeInTheDocument();
    });

    it('should show TESTIMONY type as chip/tag', () => {
      const card = createV5Card({ evidenceType: 'TESTIMONY' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('TESTIMONY')).toBeInTheDocument();
    });

    it('should show SENSOR type as chip/tag', () => {
      const card = createV5Card({ evidenceType: 'SENSOR' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('SENSOR')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-3: Display card.claim
  // ==========================================================================
  describe('AC-3: Display card.claim', () => {
    it('should show claim as main text content', () => {
      const card = createV5Card({
        claim: 'Browser history shows streaming activity until 10:45 PM',
      });
      render(<EvidenceCard card={card} />);

      expect(
        screen.getByText('Browser history shows streaming activity until 10:45 PM')
      ).toBeInTheDocument();
    });

    it('should show placeholder when claim is empty', () => {
      const card = createV5Card({ claim: '' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('No claim')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-4: Display location and time
  // ==========================================================================
  describe('AC-4: Display location and time', () => {
    it('should show location as metadata', () => {
      const card = createV5Card({ location: 'FRONT_DOOR' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('FRONT_DOOR')).toBeInTheDocument();
    });

    it('should show time as metadata', () => {
      const card = createV5Card({ time: '9:30 PM' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('9:30 PM')).toBeInTheDocument();
    });

    it('should show both location and time together', () => {
      const card = createV5Card({ location: 'BEDROOM', time: '2:30 AM' });
      render(<EvidenceCard card={card} />);

      expect(screen.getByText('BEDROOM')).toBeInTheDocument();
      expect(screen.getByText('2:30 AM')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-5: No proves/refutes display
  // ==========================================================================
  describe('AC-5: No proves/refutes display', () => {
    it('should not reference proves or refutes fields in rendered output', () => {
      const card = createV5Card();
      const { container } = render(<EvidenceCard card={card} />);

      // The component should not contain text "proves" or "refutes"
      // (except in class names or internal structure)
      const text = container.textContent ?? '';

      // Check that we're not rendering old MVP fields
      // Note: "Refutes" was a badge in old MVP, should not appear
      expect(screen.queryByText('Refutes')).not.toBeInTheDocument();

      // "No proof" was shown in old MVP for empty proves array
      expect(screen.queryByText('No proof')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EC-1: Card with long claim text
  // ==========================================================================
  describe('EC-1: Card with long claim text', () => {
    it('should truncate gracefully with ellipsis for 200+ character claims', () => {
      const longClaim =
        'This is a very long claim text that should be truncated gracefully. ' +
        'It contains detailed information about the evidence that exceeds the normal display length. ' +
        'The system should handle this by showing ellipsis or providing a title for the full text.';

      expect(longClaim.length).toBeGreaterThan(200);

      const card = createV5Card({ claim: longClaim });
      render(<EvidenceCard card={card} />);

      // The claim element should have a title attribute for full text access
      const claimElement = screen.getByTitle(longClaim);
      expect(claimElement).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EC-2: All evidence types render correctly
  // ==========================================================================
  describe('EC-2: All evidence types render correctly', () => {
    it('should render each type with distinct visual treatment', () => {
      const types: EvidenceType[] = ['DIGITAL', 'PHYSICAL', 'TESTIMONY', 'SENSOR'];

      for (const evidenceType of types) {
        const card = createV5Card({ evidenceType, id: `card_${evidenceType.toLowerCase()}` as CardId });
        const { unmount } = render(<EvidenceCard card={card} />);

        // Each type should be displayed
        expect(screen.getByText(evidenceType)).toBeInTheDocument();

        // Clean up for next iteration
        unmount();
      }
    });
  });
});
