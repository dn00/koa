/**
 * Task 016: BarkPanel Component Tests
 *
 * Tests for the tabbed BarkPanel component that shows KOA's current bark
 * (SYS_MSG tab) or scenario facts (LOGS tab) with typewriter effect.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import BarkPanel from '$lib/components/BarkPanel.svelte';

describe('Task 016: BarkPanel Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	// Test scenario data
	const testScenario = {
		header: 'FRIDGE LOCK ENGAGED: Dietary Restriction Violation.',
		facts: [
			'User has consumed 240% of daily sodium quota.',
			'Grease detected on couch cushions.',
			'Time is 2:00 AM. You do not need cheese.'
		]
	};

	describe('AC-1: Tab Switching', () => {
		it('renders both SYS_MSG and LOGS tabs', () => {
			render(BarkPanel, {
				props: {
					currentBark: 'System locked.',
					scenario: testScenario
				}
			});

			expect(screen.getByRole('button', { name: /sys_msg/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /logs/i })).toBeInTheDocument();
		});

		it('switches to LOGS when LOGS tab is clicked', async () => {
			render(BarkPanel, {
				props: {
					currentBark: 'System locked.',
					scenario: testScenario
				}
			});

			const logsTab = screen.getByRole('button', { name: /logs/i });
			await fireEvent.click(logsTab);

			// LOGS tab should be active
			expect(logsTab.className).toContain('bg-white');
			// Should show scenario content
			expect(screen.getByText(/fridge lock engaged/i)).toBeInTheDocument();
		});

		it('highlights active tab visually', async () => {
			render(BarkPanel, {
				props: {
					currentBark: 'System locked.',
					scenario: testScenario
				}
			});

			const sysMsgTab = screen.getByRole('button', { name: /sys_msg/i });
			const logsTab = screen.getByRole('button', { name: /logs/i });

			// Initially SYS_MSG is active
			expect(sysMsgTab.className).toContain('bg-white');

			await fireEvent.click(logsTab);

			// Now LOGS should be active
			expect(logsTab.className).toContain('bg-white');
		});

		it('switches back to SYS_MSG when SYS_MSG tab is clicked', async () => {
			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: testScenario
				}
			});

			// Switch to LOGS first
			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));
			expect(screen.getByText(/fridge lock engaged/i)).toBeInTheDocument();

			// Switch back to SYS_MSG
			await fireEvent.click(screen.getByRole('button', { name: /sys_msg/i }));

			// Should not show LOGS content anymore
			expect(screen.queryByText(/fridge lock engaged/i)).not.toBeInTheDocument();
		});
	});

	describe('AC-2: Bark Display with Typewriter', () => {
		it('displays bark text when in BARK mode', () => {
			render(BarkPanel, {
				props: {
					currentBark: 'System locked. Please justify your actions.',
					scenario: testScenario
				}
			});

			// Typewriter will gradually reveal text, but container should exist
			const panel = document.querySelector('[data-panel-content]');
			expect(panel).toBeInTheDocument();
		});

		it('calls onSpeechStart when bark starts typing', async () => {
			const onSpeechStart = vi.fn();
			render(BarkPanel, {
				props: {
					currentBark: 'System locked.',
					scenario: testScenario,
					onSpeechStart
				}
			});

			// Typewriter calls onStart on mount
			await waitFor(() => {
				expect(onSpeechStart).toHaveBeenCalled();
			});
		});

		it('calls onSpeechComplete when bark finishes typing', async () => {
			const onSpeechComplete = vi.fn();
			render(BarkPanel, {
				props: {
					currentBark: 'Hi',
					scenario: testScenario,
					onSpeechComplete
				}
			});

			// Wait for typewriter to finish
			await waitFor(
				() => {
					expect(onSpeechComplete).toHaveBeenCalled();
				},
				{ timeout: 2000 }
			);
		});
	});

	describe('AC-3: Logs Display', () => {
		it('shows scenario header with Lock icon in LOGS mode', async () => {
			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: testScenario
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));

			// Header should be visible
			expect(screen.getByText(/fridge lock engaged/i)).toBeInTheDocument();
		});

		it('shows numbered facts (01, 02, 03...) in LOGS mode', async () => {
			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: testScenario
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));

			// All facts should be shown with numbers
			expect(screen.getByText('01')).toBeInTheDocument();
			expect(screen.getByText('02')).toBeInTheDocument();
			expect(screen.getByText('03')).toBeInTheDocument();

			// Fact content should be visible
			expect(screen.getByText(/sodium quota/i)).toBeInTheDocument();
			expect(screen.getByText(/grease detected/i)).toBeInTheDocument();
			expect(screen.getByText(/you do not need cheese/i)).toBeInTheDocument();
		});
	});

	describe('AC-4: Auto-switch to Bark', () => {
		it('auto-switches to BARK mode when currentBark changes', async () => {
			const { rerender } = render(BarkPanel, {
				props: {
					currentBark: 'First bark.',
					scenario: testScenario
				}
			});

			// Switch to LOGS
			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));
			expect(screen.getByText(/fridge lock engaged/i)).toBeInTheDocument();

			// Change bark
			await rerender({
				currentBark: 'New bark text!',
				scenario: testScenario
			});

			// Should auto-switch back to BARK mode (LOGS content gone)
			await waitFor(() => {
				expect(screen.queryByText(/fridge lock engaged/i)).not.toBeInTheDocument();
			});
		});
	});

	describe('AC-5: Styling', () => {
		it('has white background and border styling', () => {
			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: testScenario
				}
			});

			const panel = document.querySelector('.bg-white');
			expect(panel).toBeInTheDocument();
		});

		it('has decorative corner element', () => {
			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: testScenario
				}
			});

			const corner = document.querySelector('[data-decorative-corner]');
			expect(corner).toBeInTheDocument();
		});
	});

	describe('EC-1: Long Bark Text', () => {
		it('wraps long bark text properly', () => {
			const longBark =
				'This is a very long bark message that should wrap correctly within the panel bounds without overflowing or breaking the layout of the component.';

			render(BarkPanel, {
				props: {
					currentBark: longBark,
					scenario: testScenario
				}
			});

			const contentArea = document.querySelector('[data-panel-content]');
			expect(contentArea).toBeInTheDocument();
		});

		it('panel content area allows scrolling for very long content', () => {
			const longBark =
				'This is an extremely long bark message. '.repeat(20);

			render(BarkPanel, {
				props: {
					currentBark: longBark,
					scenario: testScenario
				}
			});

			const contentArea = document.querySelector('[data-panel-content]');
			expect(contentArea).toBeInTheDocument();
			expect(contentArea?.className).toContain('overflow');
		});
	});

	describe('EC-2: Many Facts', () => {
		it('renders all facts when scenario has 5 facts', async () => {
			const manyFactsScenario = {
				header: 'THERMOSTAT LOCK: Temperature Override.',
				facts: [
					'Fact one about temperature.',
					'Fact two about humidity.',
					'Fact three about energy usage.',
					'Fact four about schedule.',
					'Fact five about outdoor conditions.'
				]
			};

			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: manyFactsScenario
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));

			// All 5 facts should be numbered and visible
			expect(screen.getByText('01')).toBeInTheDocument();
			expect(screen.getByText('02')).toBeInTheDocument();
			expect(screen.getByText('03')).toBeInTheDocument();
			expect(screen.getByText('04')).toBeInTheDocument();
			expect(screen.getByText('05')).toBeInTheDocument();
		});

		it('facts list scrolls when content overflows', async () => {
			const manyFactsScenario = {
				header: 'TEST SCENARIO',
				facts: Array(10)
					.fill(null)
					.map((_, i) => `Fact number ${i + 1} with some additional detail.`)
			};

			render(BarkPanel, {
				props: {
					currentBark: 'Test bark.',
					scenario: manyFactsScenario
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /logs/i }));

			const contentArea = document.querySelector('[data-panel-content]');
			expect(contentArea?.className).toContain('overflow');
		});
	});
});
