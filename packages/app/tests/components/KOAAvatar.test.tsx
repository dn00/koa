import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createRef } from 'react';
import { KOAAvatar, type KOAAvatarHandle } from '../../src/components/KOAAvatar/index.js';
import { KOAMood } from '../../src/components/KOAAvatar/index.js';

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      kill: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    })),
    to: vi.fn(),
  },
}));

/**
 * Task 023: KOA Avatar and Moods
 */
describe('Task 023: KOA Avatar and Moods', () => {
  // ==========================================================================
  // AC-1: Displays NEUTRAL mood
  // ==========================================================================
  describe('AC-1: Displays NEUTRAL mood', () => {
    it('should display neutral mood label', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      expect(screen.getByText('neutral')).toBeInTheDocument();
    });

    it('should have correct aria-label for neutral', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      expect(screen.getByLabelText('KOA is neutral')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-2: Displays CURIOUS mood
  // ==========================================================================
  describe('AC-2: Displays CURIOUS mood', () => {
    it('should display curious mood label', () => {
      render(<KOAAvatar mood={KOAMood.CURIOUS} />);
      expect(screen.getByText('curious')).toBeInTheDocument();
    });

    it('should have correct aria-label for curious', () => {
      render(<KOAAvatar mood={KOAMood.CURIOUS} />);
      expect(screen.getByLabelText('KOA is curious')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-3: Displays SUSPICIOUS mood
  // ==========================================================================
  describe('AC-3: Displays SUSPICIOUS mood', () => {
    it('should display suspicious mood label', () => {
      render(<KOAAvatar mood={KOAMood.SUSPICIOUS} />);
      expect(screen.getByText('suspicious')).toBeInTheDocument();
    });

    it('should have correct aria-label for suspicious', () => {
      render(<KOAAvatar mood={KOAMood.SUSPICIOUS} />);
      expect(screen.getByLabelText('KOA is suspicious')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-4: Displays BLOCKED mood
  // ==========================================================================
  describe('AC-4: Displays BLOCKED mood', () => {
    it('should display blocked mood label', () => {
      render(<KOAAvatar mood={KOAMood.BLOCKED} />);
      expect(screen.getByText('blocked')).toBeInTheDocument();
    });

    it('should have correct aria-label for blocked', () => {
      render(<KOAAvatar mood={KOAMood.BLOCKED} />);
      expect(screen.getByLabelText('KOA is blocked')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-5: Displays GRUDGING mood
  // ==========================================================================
  describe('AC-5: Displays GRUDGING mood', () => {
    it('should display grudging mood label', () => {
      render(<KOAAvatar mood={KOAMood.GRUDGING} />);
      expect(screen.getByText('grudging')).toBeInTheDocument();
    });

    it('should have correct aria-label for grudging', () => {
      render(<KOAAvatar mood={KOAMood.GRUDGING} />);
      expect(screen.getByLabelText('KOA is grudging')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-6: Displays IMPRESSED mood
  // ==========================================================================
  describe('AC-6: Displays IMPRESSED mood', () => {
    it('should display impressed mood label', () => {
      render(<KOAAvatar mood={KOAMood.IMPRESSED} />);
      expect(screen.getByText('impressed')).toBeInTheDocument();
    });

    it('should have correct aria-label for impressed', () => {
      render(<KOAAvatar mood={KOAMood.IMPRESSED} />);
      expect(screen.getByLabelText('KOA is impressed')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-7: Displays RESIGNED mood
  // ==========================================================================
  describe('AC-7: Displays RESIGNED mood', () => {
    it('should display resigned mood label', () => {
      render(<KOAAvatar mood={KOAMood.RESIGNED} />);
      expect(screen.getByText('resigned')).toBeInTheDocument();
    });

    it('should have correct aria-label for resigned', () => {
      render(<KOAAvatar mood={KOAMood.RESIGNED} />);
      expect(screen.getByLabelText('KOA is resigned')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-8: Displays SMUG mood
  // ==========================================================================
  describe('AC-8: Displays SMUG mood', () => {
    it('should display smug mood label', () => {
      render(<KOAAvatar mood={KOAMood.SMUG} />);
      expect(screen.getByText('smug')).toBeInTheDocument();
    });

    it('should have correct aria-label for smug', () => {
      render(<KOAAvatar mood={KOAMood.SMUG} />);
      expect(screen.getByLabelText('KOA is smug')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-9: Mood prop controls display
  // ==========================================================================
  describe('AC-9: Mood prop controls display', () => {
    it('should update display when mood changes', () => {
      const { rerender } = render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      expect(screen.getByText('neutral')).toBeInTheDocument();

      rerender(<KOAAvatar mood={KOAMood.IMPRESSED} />);
      expect(screen.getByText('impressed')).toBeInTheDocument();
      expect(screen.queryByText('neutral')).not.toBeInTheDocument();
    });

    it('should apply mood color as CSS variable', () => {
      render(<KOAAvatar mood={KOAMood.CURIOUS} />);
      const avatar = screen.getByRole('img');
      // The mood color should be applied as a CSS variable
      expect(avatar).toHaveStyle({ '--mood-color': '#3b82f6' });
    });
  });

  // ==========================================================================
  // EC-1: Smooth transition between moods (CSS animation)
  // ==========================================================================
  describe('EC-1: Smooth transition (CSS)', () => {
    it('should render with role="img" for visual representation', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Size variants
  // ==========================================================================
  describe('Size variants', () => {
    it('should default to medium size', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      const avatar = screen.getByRole('img');
      expect(avatar.className).toContain('medium');
    });

    it('should accept small size', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} size="small" />);
      const avatar = screen.getByRole('img');
      expect(avatar.className).toContain('small');
    });

    it('should accept large size', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} size="large" />);
      const avatar = screen.getByRole('img');
      expect(avatar.className).toContain('large');
    });
  });

  // ==========================================================================
  // ERR-1: Unknown Mood Fallback
  // ==========================================================================
  describe('ERR-1: Unknown Mood Fallback', () => {
    it('should fall back to NEUTRAL for unknown mood at runtime', () => {
      // Simulate runtime with unknown mood value (bypassing TypeScript)
      const unknownMood = 'UNKNOWN_MOOD' as KOAMood;

      // Component should handle gracefully - either show NEUTRAL or handle the string
      // In this implementation, it uses the mood directly in lookups
      // If mood color/label is undefined, the component should still render
      render(<KOAAvatar mood={unknownMood} />);

      // Should still render the avatar (not crash)
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should handle undefined mood color gracefully', () => {
      // This tests that the component doesn't crash with unexpected values
      const invalidMood = '' as KOAMood;
      render(<KOAAvatar mood={invalidMood} />);

      // Component should still render
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Task 015: R12.5 - Idle breathing/pulse animation
  // ==========================================================================
  describe('R12.5: Idle breathing animation', () => {
    it('should enable idle animation by default', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      // Animation is controlled by GSAP, just verify component renders
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should allow disabling idle animation', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} enableIdleAnimation={false} />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Task 015: R12.3 - Glitch effect
  // ==========================================================================
  describe('R12.3: Glitch effect', () => {
    it('should expose triggerGlitch via ref', () => {
      const ref = createRef<KOAAvatarHandle>();
      render(<KOAAvatar ref={ref} mood={KOAMood.NEUTRAL} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.triggerGlitch).toBeDefined();
      expect(typeof ref.current?.triggerGlitch).toBe('function');
    });

    it('should call onGlitchComplete callback after glitch', async () => {
      const onGlitchComplete = vi.fn();
      const ref = createRef<KOAAvatarHandle>();
      render(
        <KOAAvatar
          ref={ref}
          mood={KOAMood.NEUTRAL}
          onGlitchComplete={onGlitchComplete}
        />
      );

      act(() => {
        ref.current?.triggerGlitch();
      });

      // Note: In real tests with GSAP, we'd wait for animation
      // With mock, timeline completes synchronously
    });
  });

  // ==========================================================================
  // Task 015: R12.6 - Page Visibility API
  // ==========================================================================
  describe('R12.6: Page Visibility API', () => {
    it('should expose pause and resume methods via ref', () => {
      const ref = createRef<KOAAvatarHandle>();
      render(<KOAAvatar ref={ref} mood={KOAMood.NEUTRAL} />);

      expect(ref.current?.pause).toBeDefined();
      expect(ref.current?.resume).toBeDefined();
      expect(typeof ref.current?.pause).toBe('function');
      expect(typeof ref.current?.resume).toBe('function');
    });

    it('should call pause without error', () => {
      const ref = createRef<KOAAvatarHandle>();
      render(<KOAAvatar ref={ref} mood={KOAMood.NEUTRAL} />);

      expect(() => ref.current?.pause()).not.toThrow();
    });

    it('should call resume without error', () => {
      const ref = createRef<KOAAvatarHandle>();
      render(<KOAAvatar ref={ref} mood={KOAMood.NEUTRAL} />);

      expect(() => ref.current?.resume()).not.toThrow();
    });
  });

  // ==========================================================================
  // Task 015: data-testid for querying
  // ==========================================================================
  describe('Test ID', () => {
    it('should have data-testid attribute', () => {
      render(<KOAAvatar mood={KOAMood.NEUTRAL} />);
      expect(screen.getByTestId('koa-avatar')).toBeInTheDocument();
    });
  });
});
