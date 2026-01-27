import type { ReactNode } from 'react';
import { ENGINE_VERSION, type Result, ok } from '@hsh/engine-core';

/**
 * Main App component
 * Placeholder for Task 016+
 */
export function App(): ReactNode {
  // Verify cross-package import works
  const testResult: Result<string> = ok('Hello from engine-core');

  return (
    <div>
      <h1>Home Smart Home</h1>
      <p>Engine version: {ENGINE_VERSION}</p>
      <p>Test result: {testResult.ok ? testResult.value : 'Error'}</p>
    </div>
  );
}
