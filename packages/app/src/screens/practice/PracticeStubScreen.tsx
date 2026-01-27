import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Practice mode screen placeholder (AC-3)
 * Shows "Coming soon" message
 */
export function PracticeStubScreen(): ReactNode {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Practice Mode</h1>
      <p>Coming soon...</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
