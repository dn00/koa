import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				hmr: false
			}
		})
	],
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname,
			$stores: new URL('./src/lib/stores', import.meta.url).pathname,
			$services: new URL('./src/lib/services', import.meta.url).pathname,
			$components: new URL('./src/lib/components', import.meta.url).pathname,
			'$app/navigation': new URL('./tests/__mocks__/$app/navigation.ts', import.meta.url).pathname
		}
	},
	resolve: {
		conditions: ['browser']
	}
});
