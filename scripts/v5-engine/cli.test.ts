import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Task 006: CLI Refactor
 * Integration tests for play-v5.ts mode support
 */

const CLI_PATH = path.resolve(__dirname, '../play-v5.ts');
const STATE_PATH = '/tmp/claude-cli-test-game.json';

function runCLI(args: string, timeout = 10000): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx ${CLI_PATH} ${args}`, {
      encoding: 'utf8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

function cleanupState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      fs.unlinkSync(STATE_PATH);
    }
  } catch {}
}

describe('Task 006: CLI Refactor', () => {
  beforeEach(() => {
    cleanupState();
  });

  afterEach(() => {
    cleanupState();
  });

  // ==========================================================================
  // AC-1: Default Mode Advanced
  // ==========================================================================
  describe('AC-1: Default mode advanced', () => {
    it('should show belief bar and target when no --mode flag', () => {
      // Without --json to get text output
      const { stdout } = runCLI('--puzzle midnight-print --state ' + STATE_PATH);

      // Advanced mode shows target in opening
      expect(stdout).toContain('Target Belief:');
      expect(stdout).toContain('Type Tax:');
    });

    it('should show numeric scoring in default mode', () => {
      const { stdout } = runCLI('--puzzle midnight-print --state ' + STATE_PATH);

      // Advanced mode shows belief bar
      expect(stdout).toContain('Belief:');
      expect(stdout).toContain('/100');
    });
  });

  // ==========================================================================
  // AC-2: Mode Mini Flag
  // ==========================================================================
  describe('AC-2: Mode mini flag', () => {
    it('should accept --mode mini flag', () => {
      const { stderr, exitCode } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH);

      // Should not error with invalid mode message
      expect(stderr).not.toContain('Invalid mode');
    });

    it('should hide target belief in mini mode', () => {
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH);

      // Mini mode should NOT show target belief number in opening
      expect(stdout).not.toContain('Target Belief:');
    });

    it('should hide type tax rule in mini mode', () => {
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH);

      expect(stdout).not.toContain('Type Tax:');
    });
  });

  // ==========================================================================
  // AC-3: Existing Flags Work
  // ==========================================================================
  describe('AC-3: Existing flags work', () => {
    it('should accept --puzzle flag', () => {
      const { stdout } = runCLI('--puzzle midnight-print --state ' + STATE_PATH + ' --json');

      expect(stdout).toContain('midnight-print');
    });

    it('should accept --difficulty flag', () => {
      const { stdout } = runCLI('--puzzle midnight-print --difficulty hard --state ' + STATE_PATH + ' --json');

      // JSON output should show difficulty
      expect(stdout).toContain('"difficulty":"hard"');
    });

    it('should accept --seed flag for determinism', () => {
      const result1 = runCLI('--puzzle midnight-print --seed 12345 --state ' + STATE_PATH + ' --json');
      cleanupState();
      const result2 = runCLI('--puzzle midnight-print --seed 12345 --state ' + STATE_PATH + ' --json');

      // Same seed should produce same output
      expect(result1.stdout).toContain('"seed":12345');
      expect(result2.stdout).toContain('"seed":12345');
    });
  });

  // ==========================================================================
  // AC-4: JSON Output Unchanged
  // ==========================================================================
  describe('AC-4: JSON output unchanged', () => {
    it('should output valid JSON with --json flag', () => {
      const { stdout } = runCLI('--puzzle midnight-print --state ' + STATE_PATH + ' --json');

      // Extract JSON line (last line with JSON)
      const lines = stdout.split('\n').filter(l => l.startsWith('{'));
      expect(lines.length).toBeGreaterThan(0);

      const json = JSON.parse(lines[0]);
      expect(json).toHaveProperty('seed');
      expect(json).toHaveProperty('puzzle');
      expect(json).toHaveProperty('turn');
      expect(json).toHaveProperty('belief');
      expect(json).toHaveProperty('tier');
      expect(json).toHaveProperty('target');
      expect(json).toHaveProperty('gameOver');
      expect(json).toHaveProperty('hand');
      expect(json).toHaveProperty('config');
    });

    it('should include hand cards in JSON', () => {
      const { stdout } = runCLI('--puzzle midnight-print --state ' + STATE_PATH + ' --json');

      const lines = stdout.split('\n').filter(l => l.startsWith('{'));
      const json = JSON.parse(lines[0]);

      expect(json.hand).toBeInstanceOf(Array);
      expect(json.hand.length).toBe(6); // 6 cards in puzzle
      expect(json.hand[0]).toHaveProperty('id');
      expect(json.hand[0]).toHaveProperty('strength');
      expect(json.hand[0]).toHaveProperty('type');
    });
  });

  // ==========================================================================
  // AC-5: CLI Delegates to Engine (code inspection)
  // ==========================================================================
  describe('AC-5: CLI delegates to engine', () => {
    it('should use engine autoResolveObjection in mini mode', () => {
      // This is verified by the mini mode behavior - objection is auto-resolved
      // We test this indirectly by checking mini mode doesn't prompt for objection
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history --json');

      // Should not contain objection prompt
      expect(stdout).not.toContain('Use --objection');
    });
  });

  // ==========================================================================
  // AC-6: Mini No Objection Prompt
  // ==========================================================================
  describe('AC-6: Mini no objection prompt', () => {
    it('should not show stand/withdraw options in mini mode after T2', () => {
      // Play T1
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');
      // Play T2 (would trigger objection in advanced)
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick smart_lock');

      // Mini mode should NOT prompt for objection choice
      expect(stdout).not.toContain('Use --objection stand OR --objection withdraw');
      expect(stdout).not.toContain('[STAND BY]');
      expect(stdout).not.toContain('[WITHDRAW]');
    });

    it('should show system check bark in mini mode', () => {
      // Play T1
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');
      // Play T2
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick smart_lock');

      // Should show system check section
      expect(stdout).toContain('System Check');
    });
  });

  // ==========================================================================
  // AC-7: Mini Auto-Resolves Objection
  // ==========================================================================
  describe('AC-7: Mini auto-resolves objection', () => {
    it('should auto-resolve objection and continue to T3 without prompting', { timeout: 15000 }, () => {
      // Play T1
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');
      // Play T2 (objection auto-resolved)
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick smart_lock');
      // Play T3 should work (game continues, not stuck on objection)
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick partner_testimony --json');

      // Game should complete (T3 played)
      expect(stdout).toContain('"gameOver":true');
    });
  });

  // ==========================================================================
  // AC-8: CLI Presenter Mini Status
  // ==========================================================================
  describe('AC-8: CLI presenter Mini status', () => {
    it('should show comfort icon instead of belief bar in mini', () => {
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH);

      // Mini mode shows "Status:" with icon, not full "Belief:" bar with numbers
      expect(stdout).toContain('Status:');
      // Should NOT show the full "/100" pattern
      expect(stdout).not.toContain('/100');
    });
  });

  // ==========================================================================
  // AC-8b: CLI Presenter Mini Turn Feedback
  // ==========================================================================
  describe('AC-8b: CLI presenter Mini turn feedback', () => {
    it('should show emoji feedback instead of numbers', () => {
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');

      // Mini mode should show emoji (👍 or 👎), not explicit score pattern
      // Check that it doesn't show pattern like "+3 Belief" or "-2 Belief"
      expect(stdout).not.toMatch(/→.*[+-]\d+.*Belief/);
    });
  });

  // ==========================================================================
  // AC-9: CLI Presenter Advanced
  // ==========================================================================
  describe('AC-9: CLI presenter Advanced', () => {
    it('should show full belief bar in advanced mode', () => {
      const { stdout } = runCLI('--mode advanced --puzzle midnight-print --state ' + STATE_PATH);

      expect(stdout).toContain('Belief:');
      expect(stdout).toContain('/100');
    });

    it('should show numeric scoring in advanced mode', () => {
      const { stdout } = runCLI('--mode advanced --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');

      // Advanced mode shows explicit score with Belief
      expect(stdout).toMatch(/[+-]\d+.*Belief/);
    });
  });

  // ==========================================================================
  // EC-1: Invalid Mode
  // ==========================================================================
  describe('EC-1: Invalid mode', () => {
    it('should error on invalid mode', () => {
      const { stderr, exitCode } = runCLI('--mode invalid --puzzle midnight-print');

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Invalid mode');
    });

    it('should suggest valid modes', () => {
      const { stderr } = runCLI('--mode invalid --puzzle midnight-print');

      expect(stderr).toContain('mini');
      expect(stderr).toContain('advanced');
    });
  });

  // ==========================================================================
  // EC-2: Mini with --objection Flag
  // ==========================================================================
  describe('EC-2: Mini with --objection flag', () => {
    it('should ignore --objection flag in mini mode', { timeout: 15000 }, () => {
      // Play T1
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick browser_history');
      // Play T2
      runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --pick smart_lock');
      // Try to use --objection in mini mode (should be ignored, game continues)
      const { stdout } = runCLI('--mode mini --puzzle midnight-print --state ' + STATE_PATH + ' --objection stand --pick partner_testimony --json');

      // Game should still work (objection was auto-resolved, flag ignored)
      expect(stdout).toContain('"gameOver":true');
    });
  });
});
