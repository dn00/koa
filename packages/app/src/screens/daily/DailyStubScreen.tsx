import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Daily puzzle screen placeholder
 * Will be replaced by actual implementation in future tasks
 */
export function DailyStubScreen(): ReactNode {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Daily Puzzle</h1>
      <p>Coming soon...</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
