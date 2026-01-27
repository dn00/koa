import type { ReactNode } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.js';

/**
 * Main App component
 * Uses react-router-dom for navigation (Task 016)
 */
export function App(): ReactNode {
  return <RouterProvider router={router} />;
}
