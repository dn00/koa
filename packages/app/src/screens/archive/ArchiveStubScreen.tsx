import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Archive screen placeholder
 * Will be replaced by actual implementation in future tasks
 */
export function ArchiveStubScreen(): ReactNode {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Archive</h1>
      <p>Coming soon...</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
