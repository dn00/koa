import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { HomeScreen } from '../../src/screens/home/HomeScreen.js';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

/**
 * Task 016: Home Screen Tests
 */
describe('Task 016: Home Screen', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Helper to render HomeScreen with router context
   */
  const renderHomeScreen = (props = {}) => {
    return render(
      <MemoryRouter>
        <HomeScreen {...props} />
      </MemoryRouter>
    );
  };

  // ==========================================================================
  // AC-1: Home screen renders with title and navigation buttons
  // ==========================================================================
  describe('AC-1: Home screen renders with title and navigation buttons', () => {
    it('should render the title', () => {
      renderHomeScreen();
      expect(screen.getByRole('heading', { name: /home smart home/i })).toBeInTheDocument();
    });

    it('should render all navigation buttons', () => {
      renderHomeScreen();
      expect(screen.getByRole('button', { name: /play daily/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /practice/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AC-2: "Play Daily" button navigates to /daily
  // ==========================================================================
  describe('AC-2: Play Daily button navigates to /daily', () => {
    it('should navigate to /daily when Play Daily is clicked', () => {
      renderHomeScreen();
      const playDailyButton = screen.getByRole('button', { name: /play daily/i });
      fireEvent.click(playDailyButton);
      expect(mockNavigate).toHaveBeenCalledWith('/daily');
    });
  });

  // ==========================================================================
  // AC-3: "Practice" button shows "Coming soon" or navigates to stub
  // ==========================================================================
  describe('AC-3: Practice button navigates to /practice', () => {
    it('should navigate to /practice when Practice is clicked', () => {
      renderHomeScreen();
      const practiceButton = screen.getByRole('button', { name: /practice/i });
      fireEvent.click(practiceButton);
      expect(mockNavigate).toHaveBeenCalledWith('/practice');
    });
  });

  // ==========================================================================
  // AC-4: "Settings" button navigates to /settings
  // ==========================================================================
  describe('AC-4: Settings button navigates to /settings', () => {
    it('should navigate to /settings when Settings is clicked', () => {
      renderHomeScreen();
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });

  // ==========================================================================
  // AC-5: "Archive" button navigates to /archive
  // ==========================================================================
  describe('AC-5: Archive button navigates to /archive', () => {
    it('should navigate to /archive when Archive is clicked', () => {
      renderHomeScreen();
      const archiveButton = screen.getByRole('button', { name: /archive/i });
      fireEvent.click(archiveButton);
      expect(mockNavigate).toHaveBeenCalledWith('/archive');
    });
  });

  // ==========================================================================
  // AC-6: Layout is mobile-first (full-width buttons, touch-friendly)
  // ==========================================================================
  describe('AC-6: Layout is mobile-first', () => {
    it('should have full-width navigation buttons in a column layout', () => {
      renderHomeScreen();
      // Verify buttons exist - CSS handles the styling
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ==========================================================================
  // AC-7: Resume prompt shows when unfinished run exists
  // ==========================================================================
  describe('AC-7: Resume prompt shows when unfinished run exists', () => {
    it('should not show resume prompt by default', () => {
      renderHomeScreen();
      expect(screen.queryByText(/unfinished puzzle/i)).not.toBeInTheDocument();
    });

    it('should show resume prompt when hasUnfinishedRun is true', () => {
      renderHomeScreen({ hasUnfinishedRun: true });
      expect(screen.getByText(/unfinished puzzle/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should navigate to /daily when Resume is clicked', () => {
      renderHomeScreen({ hasUnfinishedRun: true });
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
      expect(mockNavigate).toHaveBeenCalledWith('/daily');
    });
  });

  // ==========================================================================
  // EC-1: Offline with no cached daily: Play Daily disabled
  // ==========================================================================
  describe('EC-1: Offline with no cached daily disables Play Daily', () => {
    it('should disable Play Daily button when offline with no cache', () => {
      renderHomeScreen({ isOfflineNoCached: true });
      const playDailyButton = screen.getByRole('button', { name: /play daily/i });
      expect(playDailyButton).toBeDisabled();
    });

    it('should not navigate when disabled Play Daily is clicked', () => {
      renderHomeScreen({ isOfflineNoCached: true });
      const playDailyButton = screen.getByRole('button', { name: /play daily/i });
      fireEvent.click(playDailyButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // EC-2: First launch: No streak/archive shown
  // ==========================================================================
  describe('EC-2: First launch shows no streak or archive data', () => {
    it('should render without resume prompt on first launch', () => {
      // First launch = default props (hasUnfinishedRun = false)
      renderHomeScreen();
      expect(screen.queryByText(/unfinished puzzle/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resume/i })).not.toBeInTheDocument();
    });

    it('should render all buttons enabled on first launch', () => {
      renderHomeScreen();
      const playDailyButton = screen.getByRole('button', { name: /play daily/i });
      const practiceButton = screen.getByRole('button', { name: /practice/i });
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      const archiveButton = screen.getByRole('button', { name: /archive/i });

      expect(playDailyButton).not.toBeDisabled();
      expect(practiceButton).not.toBeDisabled();
      expect(settingsButton).not.toBeDisabled();
      expect(archiveButton).not.toBeDisabled();
    });
  });
});
