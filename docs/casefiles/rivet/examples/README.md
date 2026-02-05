# RIVET Examples

Scripts and tools for testing, tuning, and analyzing RIVET-based games.

## Available Examples

### balance-tuner.ts

Automated game balancing through parameter sweeps and grid search.

**What it does:**
- Defines tunable parameters (vision range, speed, difficulty, etc.)
- Defines AI policies that play the game automatically
- Runs batches of simulations with different configs
- Finds configurations that hit target win rates (e.g., 30-50%)

**Key patterns:**
- `TuningConfig` - Parameters you want to tune
- `Policy` - Automated player that makes decisions
- `runBatch()` - Run N simulations, aggregate metrics
- `sweepParameter()` - Test one parameter at multiple values
- `gridSearch()` - Test combinations to find optimal config

**Usage:**
```bash
npx tsx examples/balance-tuner.ts --sweep     # Test each parameter individually
npx tsx examples/balance-tuner.ts --grid      # Search parameter combinations
npx tsx examples/balance-tuner.ts --analyze   # Deep dive on current config
```

**When to use:**
- Before release: find balanced difficulty
- After adding features: check if balance broke
- During development: rapid iteration on feel

---

### emergence-tester.ts

Tests whether complex behaviors emerge from simple rules.

**What it does:**
- Runs simulations and collects cross-system metrics
- Checks for correlations (does economy affect NPC stress? does stress affect social dynamics?)
- Identifies when emergence is/isn't happening
- Suggests tuning when systems are too isolated

**Key patterns:**
- `EmergenceMetrics` - Metrics that indicate system interaction
- `correlations` - Track cross-system effects
- `checkEmergence()` - Analyze whether systems are actually connected

**Usage:**
```bash
npx tsx examples/emergence-tester.ts
```

**When to use:**
- After building multiple systems: verify they interact
- When game feels "dead": diagnose isolated systems
- When tuning: ensure changes don't break emergence

---

## Writing Your Own Scripts

### Basic Structure

```typescript
import { createKernel } from '../src/core/kernel.js';
import { YourState, YourEvent } from '../src/types.js';

// 1. Initialize kernel
const kernel = createKernel<YourState, YourEvent>();

// 2. Run simulation
let state = kernel.init(yourConfig, seed);
while (!isGameOver(state)) {
  const { state: newState, events } = kernel.step(state);
  state = newState;
  // Collect metrics from events
}

// 3. Analyze results
console.log(extractMetrics(state));
```

### Tips

1. **Use deterministic seeds** - Same seed = same results. Use for reproducibility.

2. **Run many simulations** - 50-100 runs gives statistical confidence.

3. **Measure what matters** - Win rate is obvious. Recovery rate (comeback potential) is often more important for fun.

4. **Check cross-system effects** - A game with 5 isolated systems isn't emergent. Look for cascades.

5. **Visual output helps** - ASCII progress bars make parameter sweeps readable.

6. **Output configs as code** - When you find good values, print them copy-pasteable.

---

## Adapting to Your Game

These examples use placeholder simulation code. To use them:

1. Replace `runSimulation()` with your actual kernel initialization and step loop
2. Update `TuningConfig` with your game's tunable parameters
3. Update metric extraction to pull from your state shape
4. Adjust policies to make decisions based on your state

The patterns (batch running, parameter sweeps, emergence checking) work for any RIVET-based game.
