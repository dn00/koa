/**
 * RIVET Example: Balance Tuner
 *
 * Demonstrates how to use the deterministic kernel for automated game balancing.
 * Runs many simulations with different parameters to find optimal configurations.
 *
 * Key patterns:
 * 1. Define tunable parameters as a config object
 * 2. Define AI policies that play the game automatically
 * 3. Run batches of simulations, collect metrics
 * 4. Sweep parameters to find balanced configs
 *
 * Original: auto-heist/src/balance-tuner.ts
 *
 * Usage:
 *   npx tsx examples/balance-tuner.ts --sweep     # Parameter sweeps
 *   npx tsx examples/balance-tuner.ts --grid      # Grid search
 *   npx tsx examples/balance-tuner.ts --analyze   # Analyze current config
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parameters you want to tune. Pull from your game's config.
 */
interface TuningConfig {
  // Example parameters - replace with your game's tunable values
  enemyVisionRange: number;
  playerSpeed: number;
  resourceSpawnRate: number;
  difficultyMultiplier: number;
}

/**
 * Metrics collected from a single simulation run.
 */
interface RunResult {
  outcome: 'WIN' | 'LOSE' | 'TIMEOUT';
  ticks: number;
  score: number;
  // Add game-specific metrics
  resourcesCollected: number;
  damagesTaken: number;
  closeCalls: number;  // Times nearly lost but recovered
}

/**
 * Aggregated metrics from a batch of runs.
 */
interface BatchResult {
  config: TuningConfig;
  runs: number;
  winRate: number;
  avgTicks: number;
  avgScore: number;
  recoveryRate: number;  // % of close calls that still won
}

// ============================================================================
// POLICIES - Automated players for testing
// ============================================================================

/**
 * A policy is an automated player that makes decisions based on game state.
 * Use policies to test different playstyles against your config.
 */
type Policy<TState> = (state: TState) => string | null;  // Returns action or null

const policies = {
  /**
   * Aggressive policy - takes risks, prioritizes speed
   */
  aggressive: (state: unknown) => {
    // Example: always rush toward objective
    // Replace with your game's state inspection
    return 'MOVE_FORWARD';
  },

  /**
   * Cautious policy - avoids danger, prioritizes safety
   */
  cautious: (state: unknown) => {
    // Example: avoid enemies, take safe routes
    return 'WAIT';
  },

  /**
   * Balanced policy - adapts to situation
   */
  balanced: (state: unknown) => {
    // Example: aggressive when safe, cautious when threatened
    return 'MOVE_FORWARD';
  },

  /**
   * Random policy - baseline for comparison
   */
  random: (state: unknown) => {
    const actions = ['MOVE_FORWARD', 'MOVE_BACK', 'WAIT', 'ATTACK'];
    return actions[Math.floor(Math.random() * actions.length)];
  },
};

// ============================================================================
// SIMULATION
// ============================================================================

/**
 * Run a single simulation with the given config and policy.
 *
 * Replace this with your actual kernel initialization and step loop.
 */
function runSimulation(
  config: TuningConfig,
  policy: Policy<unknown>,
  seed: string
): RunResult {
  // Example structure - replace with your kernel
  //
  // const kernel = createYourKernel();
  // let state = kernel.init(config, seed);
  //
  // while (!isGameOver(state) && state.tick < MAX_TICKS) {
  //   const action = policy(state);
  //   if (action) {
  //     state = kernel.applyAction(state, action);
  //   }
  //   state = kernel.step(state);
  // }
  //
  // return extractMetrics(state);

  // Placeholder for demonstration
  return {
    outcome: Math.random() > 0.5 ? 'WIN' : 'LOSE',
    ticks: Math.floor(Math.random() * 1000),
    score: Math.floor(Math.random() * 10000),
    resourcesCollected: Math.floor(Math.random() * 100),
    damagesTaken: Math.floor(Math.random() * 50),
    closeCalls: Math.floor(Math.random() * 5),
  };
}

/**
 * Run a batch of simulations and aggregate metrics.
 */
function runBatch(
  config: TuningConfig,
  policy: Policy<unknown>,
  runs: number
): BatchResult {
  let wins = 0;
  let totalTicks = 0;
  let totalScore = 0;
  let closeCalls = 0;
  let closeCallWins = 0;

  for (let i = 0; i < runs; i++) {
    const seed = `tune-${Date.now()}-${i}`;
    const result = runSimulation(config, policy, seed);

    if (result.outcome === 'WIN') wins++;
    totalTicks += result.ticks;
    totalScore += result.score;

    if (result.closeCalls > 0) {
      closeCalls++;
      if (result.outcome === 'WIN') closeCallWins++;
    }
  }

  return {
    config,
    runs,
    winRate: wins / runs,
    avgTicks: totalTicks / runs,
    avgScore: totalScore / runs,
    recoveryRate: closeCalls > 0 ? closeCallWins / closeCalls : 0,
  };
}

// ============================================================================
// SWEEPS - Test one parameter at a time
// ============================================================================

interface Sweep {
  name: string;
  param: keyof TuningConfig;
  values: number[];
}

const SWEEPS: Sweep[] = [
  { name: 'Enemy Vision', param: 'enemyVisionRange', values: [3, 4, 5, 6, 7] },
  { name: 'Player Speed', param: 'playerSpeed', values: [1, 2, 3, 4] },
  { name: 'Resource Spawn', param: 'resourceSpawnRate', values: [5, 10, 15, 20] },
  { name: 'Difficulty', param: 'difficultyMultiplier', values: [0.5, 1.0, 1.5, 2.0] },
];

const DEFAULT_CONFIG: TuningConfig = {
  enemyVisionRange: 5,
  playerSpeed: 2,
  resourceSpawnRate: 10,
  difficultyMultiplier: 1.0,
};

function sweepParameter(
  sweep: Sweep,
  policy: Policy<unknown>,
  runsPerConfig: number
): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SWEEP: ${sweep.name} (${sweep.param})`);
  console.log('═'.repeat(60));

  for (const value of sweep.values) {
    const config = { ...DEFAULT_CONFIG, [sweep.param]: value };
    const result = runBatch(config, policy, runsPerConfig);

    // Visual bar for win rate
    const winBar = '█'.repeat(Math.round(result.winRate * 20)) +
                   '░'.repeat(20 - Math.round(result.winRate * 20));

    console.log(
      `  ${String(value).padStart(4)} │ ${winBar} │ ` +
      `${(result.winRate * 100).toFixed(0).padStart(3)}% win │ ` +
      `${result.avgTicks.toFixed(0).padStart(4)} ticks │ ` +
      `${result.avgScore.toFixed(0).padStart(5)} score`
    );
  }
}

// ============================================================================
// GRID SEARCH - Test combinations of parameters
// ============================================================================

function gridSearch(
  policy: Policy<unknown>,
  runsPerConfig: number
): void {
  console.log('\n' + '═'.repeat(60));
  console.log('GRID SEARCH: Finding balanced configuration');
  console.log('═'.repeat(60));

  const results: BatchResult[] = [];

  // Define search space - smaller set for grid search
  const visionValues = [4, 5, 6];
  const speedValues = [2, 3];
  const difficultyValues = [0.8, 1.0, 1.2];

  let tested = 0;
  const total = visionValues.length * speedValues.length * difficultyValues.length;

  for (const vision of visionValues) {
    for (const speed of speedValues) {
      for (const difficulty of difficultyValues) {
        tested++;
        process.stdout.write(`\r  Testing ${tested}/${total}...`);

        const config: TuningConfig = {
          ...DEFAULT_CONFIG,
          enemyVisionRange: vision,
          playerSpeed: speed,
          difficultyMultiplier: difficulty,
        };

        const result = runBatch(config, policy, runsPerConfig);
        results.push(result);
      }
    }
  }

  console.log('\n');

  // Filter to balanced configs (target: 30-50% win rate)
  const TARGET_WIN_RATE = 0.40;
  const balanced = results
    .filter(r => r.winRate >= 0.25 && r.winRate <= 0.55)
    .sort((a, b) =>
      Math.abs(a.winRate - TARGET_WIN_RATE) - Math.abs(b.winRate - TARGET_WIN_RATE)
    );

  console.log('TOP 5 BALANCED CONFIGURATIONS:');
  console.log('─'.repeat(60));

  for (let i = 0; i < Math.min(5, balanced.length); i++) {
    const r = balanced[i];
    console.log(`\n  #${i + 1}: ${(r.winRate * 100).toFixed(0)}% win rate`);
    console.log(`      Vision: ${r.config.enemyVisionRange}, Speed: ${r.config.playerSpeed}, Difficulty: ${r.config.difficultyMultiplier}`);
    console.log(`      Avg ticks: ${r.avgTicks.toFixed(0)}, Recovery: ${(r.recoveryRate * 100).toFixed(0)}%`);
  }

  // Output best config as code
  if (balanced.length > 0) {
    const best = balanced[0];
    console.log('\n' + '─'.repeat(60));
    console.log('RECOMMENDED CONFIG:');
    console.log(`
export const BALANCED_CONFIG = {
  enemyVisionRange: ${best.config.enemyVisionRange},
  playerSpeed: ${best.config.playerSpeed},
  resourceSpawnRate: ${best.config.resourceSpawnRate},
  difficultyMultiplier: ${best.config.difficultyMultiplier},
};
`);
  }
}

// ============================================================================
// ANALYSIS - Deep dive on current config
// ============================================================================

function analyzeConfig(
  policy: Policy<unknown>,
  runs: number
): void {
  console.log('\n' + '═'.repeat(60));
  console.log('CURRENT CONFIG ANALYSIS');
  console.log('═'.repeat(60));

  const result = runBatch(DEFAULT_CONFIG, policy, runs);

  console.log('\n1. OUTCOMES');
  console.log('─'.repeat(40));
  console.log(`   Win rate: ${(result.winRate * 100).toFixed(1)}%`);
  console.log(`   Avg ticks: ${result.avgTicks.toFixed(1)}`);
  console.log(`   Avg score: ${result.avgScore.toFixed(1)}`);

  console.log('\n2. RECOVERY');
  console.log('─'.repeat(40));
  console.log(`   Recovery rate: ${(result.recoveryRate * 100).toFixed(1)}%`);

  console.log('\n3. VERDICT');
  console.log('─'.repeat(40));

  const issues: string[] = [];
  if (result.winRate > 0.60) issues.push('Too easy - increase difficulty');
  if (result.winRate < 0.20) issues.push('Too hard - decrease difficulty');
  if (result.recoveryRate < 0.10) issues.push('Low recovery - add comeback mechanics');
  if (result.avgTicks < 100) issues.push('Games too short - slow down');
  if (result.avgTicks > 500) issues.push('Games too long - speed up');

  if (issues.length === 0) {
    console.log('   ✓ Configuration looks balanced!');
  } else {
    console.log('   Issues found:');
    for (const issue of issues) {
      console.log(`   - ${issue}`);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const runsPerConfig = 50;
  const policy = policies.balanced;

  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + '        RIVET BALANCE TUNER EXAMPLE        '.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  if (args.includes('--sweep')) {
    for (const sweep of SWEEPS) {
      sweepParameter(sweep, policy, runsPerConfig);
    }
  } else if (args.includes('--analyze')) {
    analyzeConfig(policy, runsPerConfig);
  } else {
    // Default: grid search
    gridSearch(policy, runsPerConfig);
  }
}

main().catch(console.error);
