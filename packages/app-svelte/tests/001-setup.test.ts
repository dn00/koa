/**
 * Task 001: SvelteKit + GSAP Project Setup Tests
 *
 * Requirements:
 * - ACs: 6 (AC-1 through AC-6)
 * - ECs: 1 (EC-1)
 * - ERRs: 0
 * - Total: 7
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import fs from 'fs';
import path from 'path';

// Import components for testing
import Page from '../src/routes/+page.svelte';

const PKG_ROOT = path.resolve(__dirname, '..');

describe('AC-1: SvelteKit Project', () => {
	it('svelte.config.js exists', () => {
		const configPath = path.join(PKG_ROOT, 'svelte.config.js');
		expect(fs.existsSync(configPath)).toBe(true);
	});

	it('TypeScript strict mode enabled in tsconfig.json', () => {
		const tsconfigPath = path.join(PKG_ROOT, 'tsconfig.json');
		expect(fs.existsSync(tsconfigPath)).toBe(true);

		const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
		expect(tsconfig.compilerOptions.strict).toBe(true);
	});
});

describe('AC-2: GSAP Working', () => {
	it('can import gsap and create tween', async () => {
		const gsap = await import('gsap');
		expect(gsap.default).toBeDefined();
		expect(gsap.default.to).toBeDefined();

		// Test that gsap.to can be called
		const mockElement = document.createElement('div');
		const tween = gsap.default.to(mockElement, { x: 100, duration: 0.5 });
		expect(tween).toBeDefined();
	});

	it('GSAP tween can animate element in component', async () => {
		const { getByTestId } = render(Page);
		const box = getByTestId('gsap-box');
		const button = getByTestId('animate-button');

		expect(box).toBeInTheDocument();
		expect(button).toBeInTheDocument();

		// Trigger animation
		await button.click();
		await tick();

		// GSAP mock calls onComplete, so box should show "Animated!"
		expect(box.textContent).toBe('Animated!');
	});
});

describe('AC-3: Engine-Core V5 Imports', () => {
	it('can import Card type from @hsh/engine-core', async () => {
		const engineCore = await import('@hsh/engine-core');
		// Type exists if import succeeds
		expect(engineCore).toBeDefined();
	});

	it('can import GameState type from @hsh/engine-core', async () => {
		const engineCore = await import('@hsh/engine-core');
		expect(engineCore).toBeDefined();
	});

	it('can import V5Puzzle type from @hsh/engine-core', async () => {
		const engineCore = await import('@hsh/engine-core');
		expect(engineCore).toBeDefined();
	});

	it('page component uses V5 types without errors', () => {
		// If render succeeds, types are working
		const { container } = render(Page);
		expect(container).toBeDefined();
		expect(screen.getByText(/Types imported: Card, GameState, V5Puzzle/)).toBeInTheDocument();
	});
});

describe('AC-4: Vitest Configured', () => {
	it('vitest runs in jsdom environment', () => {
		// If we can access document, we're in jsdom
		expect(typeof document).toBe('object');
		expect(document.createElement).toBeDefined();
	});

	it('can test Svelte components with @testing-library/svelte', () => {
		const { container } = render(Page);
		expect(container).toBeInstanceOf(HTMLElement);
	});

	it('vite.config.ts has jsdom environment configured', () => {
		const viteConfigPath = path.join(PKG_ROOT, 'vite.config.ts');
		const viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
		expect(viteConfig).toContain("environment: 'jsdom'");
	});
});

describe('AC-5: CSS Tokens', () => {
	it('tokens.css file exists', () => {
		const tokensPath = path.join(PKG_ROOT, 'src/lib/styles/tokens.css');
		expect(fs.existsSync(tokensPath)).toBe(true);
	});

	it('tokens.css contains all D27 semantic tokens', () => {
		const tokensPath = path.join(PKG_ROOT, 'src/lib/styles/tokens.css');
		const tokensContent = fs.readFileSync(tokensPath, 'utf-8');

		// Background tokens
		expect(tokensContent).toContain('--bg-base');
		expect(tokensContent).toContain('--bg-panel');
		expect(tokensContent).toContain('--bg-card');

		// Text tokens
		expect(tokensContent).toContain('--text-primary');
		expect(tokensContent).toContain('--text-secondary');
		expect(tokensContent).toContain('--text-muted');

		// Accent tokens
		expect(tokensContent).toContain('--accent-calm');
		expect(tokensContent).toContain('--accent-warn');
		expect(tokensContent).toContain('--accent-danger');
		expect(tokensContent).toContain('--accent-info');

		// Border tokens
		expect(tokensContent).toContain('--border-default');
		expect(tokensContent).toContain('--border-strong');
		expect(tokensContent).toContain('--border-dashed');

		// Shadow tokens
		expect(tokensContent).toContain('--shadow-soft');
		expect(tokensContent).toContain('--shadow-raised');
	});

	it('tokens are imported in app layout', () => {
		const layoutPath = path.join(PKG_ROOT, 'src/routes/+layout.svelte');
		const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
		expect(layoutContent).toContain("import '$lib/styles/tokens.css'");
	});
});

describe('AC-6: SPA Mode', () => {
	it('adapter-static is configured in svelte.config.js', () => {
		const configPath = path.join(PKG_ROOT, 'svelte.config.js');
		const configContent = fs.readFileSync(configPath, 'utf-8');
		expect(configContent).toContain("import adapter from '@sveltejs/adapter-static'");
		expect(configContent).toContain('adapter(');
	});

	it('SSR is disabled in +layout.ts', () => {
		const layoutTsPath = path.join(PKG_ROOT, 'src/routes/+layout.ts');
		const layoutContent = fs.readFileSync(layoutTsPath, 'utf-8');
		expect(layoutContent).toContain('export const ssr = false');
	});

	it('fallback is configured for SPA routing', () => {
		const configPath = path.join(PKG_ROOT, 'svelte.config.js');
		const configContent = fs.readFileSync(configPath, 'utf-8');
		expect(configContent).toContain("fallback: 'index.html'");
	});
});

describe('EC-1: GSAP SSR', () => {
	it('GSAP not accessed during build/SSR (mocked in tests)', async () => {
		// In SPA mode with ssr: false, GSAP won't be called during SSR
		// This test verifies our mock setup works and GSAP can be used client-side

		// The +layout.ts disables SSR
		const layoutTsPath = path.join(PKG_ROOT, 'src/routes/+layout.ts');
		const layoutContent = fs.readFileSync(layoutTsPath, 'utf-8');
		expect(layoutContent).toContain('export const ssr = false');

		// Page component uses onMount for GSAP which only runs client-side
		const pagePath = path.join(PKG_ROOT, 'src/routes/+page.svelte');
		const pageContent = fs.readFileSync(pagePath, 'utf-8');
		expect(pageContent).toContain('onMount');

		// GSAP import works fine in browser/test environment
		const gsap = await import('gsap');
		expect(gsap.default).toBeDefined();
	});
});
