import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock SvelteKit navigation module
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	disableScrollHandling: vi.fn()
}));

// Mock GSAP for SSR-free testing
vi.mock('gsap', () => ({
	default: {
		to: vi.fn((_target, vars) => {
			// Simulate completion callback
			if (vars.onComplete) {
				vars.onComplete();
			}
			return { kill: vi.fn() };
		}),
		from: vi.fn(() => ({ kill: vi.fn() })),
		fromTo: vi.fn(() => ({ kill: vi.fn() })),
		set: vi.fn(),
		registerPlugin: vi.fn(),
		killTweensOf: vi.fn(),
		timeline: vi.fn(() => ({
			to: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			add: vi.fn().mockReturnThis(),
			play: vi.fn(),
			pause: vi.fn(),
			kill: vi.fn()
		}))
	},
	gsap: {
		to: vi.fn((_target, vars) => {
			if (vars.onComplete) {
				vars.onComplete();
			}
			return { kill: vi.fn() };
		}),
		from: vi.fn(() => ({ kill: vi.fn() })),
		fromTo: vi.fn(() => ({ kill: vi.fn() })),
		set: vi.fn(),
		registerPlugin: vi.fn(),
		killTweensOf: vi.fn(),
		timeline: vi.fn(() => ({
			to: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			add: vi.fn().mockReturnThis(),
			play: vi.fn(),
			pause: vi.fn(),
			kill: vi.fn()
		}))
	}
}));

// Mock @gsap/flip
vi.mock('@gsap/flip', () => ({
	Flip: {
		getState: vi.fn(() => ({})),
		from: vi.fn(() => ({ kill: vi.fn() })),
		to: vi.fn(() => ({ kill: vi.fn() })),
		fit: vi.fn()
	}
}));
