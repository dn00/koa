import { createBrowserRouter } from 'react-router-dom';
import { HomeScreen } from './screens/home/index.js';
import { DailyStubScreen } from './screens/daily/DailyStubScreen.js';
import { PracticeStubScreen } from './screens/practice/PracticeStubScreen.js';
import { SettingsStubScreen } from './screens/settings/SettingsStubScreen.js';
import { ArchiveStubScreen } from './screens/archive/ArchiveStubScreen.js';

/**
 * Application router configuration
 *
 * Routes:
 * - / : Home screen (Task 016)
 * - /daily : Daily puzzle (stub)
 * - /practice : Practice mode (stub)
 * - /settings : Settings (stub)
 * - /archive : Archive (stub)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeScreen />,
  },
  {
    path: '/daily',
    element: <DailyStubScreen />,
  },
  {
    path: '/practice',
    element: <PracticeStubScreen />,
  },
  {
    path: '/settings',
    element: <SettingsStubScreen />,
  },
  {
    path: '/archive',
    element: <ArchiveStubScreen />,
  },
]);
