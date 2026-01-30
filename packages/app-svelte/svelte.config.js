import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			$lib: './src/lib',
			$stores: './src/lib/stores',
			$services: './src/lib/services',
			$components: './src/lib/components'
		}
	}
};

export default config;
