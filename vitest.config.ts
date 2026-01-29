import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['packages/*/tests/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/index.ts'],
    },
    environmentMatchGlobs: [
      // Use jsdom for app package React tests
      ['packages/app/tests/**/*.test.tsx', 'jsdom'],
    ],
    setupFiles: ['./packages/app/tests/setup.tsx'],
  },
  resolve: {
    alias: {
      '@hsh/engine-core': new URL('./packages/engine-core/src', import.meta.url).pathname,
      '@hsh/app': new URL('./packages/app/src', import.meta.url).pathname,
    },
  },
});
