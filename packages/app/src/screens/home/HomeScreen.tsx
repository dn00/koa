import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomeScreen.module.css';

/**
 * Props for HomeScreen component
 */
export interface HomeScreenProps {
  /** Whether there's an unfinished run to resume (stub for Task 015) */
  hasUnfinishedRun?: boolean;
  /** Whether the app is offline with no cached daily puzzle */
  isOfflineNoCached?: boolean;
}

/**
 * Home Screen - Main navigation hub (Task 016)
 *
 * AC-1: Renders with title and navigation buttons
 * AC-2: Play Daily button navigates to /daily
 * AC-3: Practice button shows "Coming soon" or navigates to stub
 * AC-4: Settings button navigates to /settings
 * AC-5: Archive button navigates to /archive
 * AC-6: Mobile-first layout with full-width, touch-friendly buttons
 * AC-7: Shows resume prompt when unfinished run exists
 * EC-1: Play Daily disabled when offline with no cached daily
 * EC-2: First launch - handled by default props
 */
export function HomeScreen({
  hasUnfinishedRun = false,
  isOfflineNoCached = false,
}: HomeScreenProps): ReactNode {
  const navigate = useNavigate();

  const handlePlayDaily = (): void => {
    navigate('/daily');
  };

  const handlePractice = (): void => {
    // AC-3: Practice is a stub - navigates to practice route which shows "Coming soon"
    navigate('/practice');
  };

  const handleSettings = (): void => {
    navigate('/settings');
  };

  const handleArchive = (): void => {
    navigate('/archive');
  };

  const handleResume = (): void => {
    navigate('/daily');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Home Smart Home</h1>

      <nav className={styles.nav}>
        {/* AC-2: Play Daily button */}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handlePlayDaily}
          disabled={isOfflineNoCached}
          aria-label={isOfflineNoCached ? 'Play Daily (unavailable offline)' : 'Play Daily'}
        >
          Play Daily
        </button>

        {/* AC-3: Practice button */}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handlePractice}
        >
          Practice
        </button>

        {/* AC-4: Settings button */}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleSettings}
        >
          Settings
        </button>

        {/* AC-5: Archive button */}
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleArchive}
        >
          Archive
        </button>
      </nav>

      {/* AC-7: Resume prompt when unfinished run exists */}
      {hasUnfinishedRun && (
        <div className={styles.resumePrompt}>
          <p>You have an unfinished puzzle!</p>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={handleResume}
          >
            Resume
          </button>
        </div>
      )}
    </div>
  );
}
