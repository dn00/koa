import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Settings screen placeholder
 * Will be replaced by actual implementation in future tasks
 */
export function SettingsStubScreen(): ReactNode {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Settings</h1>
      <p>Coming soon...</p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}
