/**
 * RIVET Example: Emergence Tester
 *
 * Demonstrates how to test emergent behavior in simulation games.
 * Runs simulations and measures whether complex behaviors emerge from simple rules.
 *
 * Key patterns:
 * 1. Define metrics that indicate emergence (not just outcomes)
 * 2. Run simulations and track system interactions
 * 3. Look for correlations between systems (economy → NPC stress → social dynamics)
 * 4. Identify when emergence is/isn't happening
 *
 * Original: packages/server/scripts/test-rumor-emergence.ts
 *
 * Usage:
 *   npx tsx examples/emergence-tester.ts
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Metrics that indicate emergent behavior.
 * These go beyond simple win/lose to measure system interactions.
 */
interface EmergenceMetrics {
  worldId: string;
  totalTicks: number;
  eventsGenerated: number;

  // System A: Economy
  resources: Record<string, number>;
  resourceDeltas: Record<string, number>;  // Change from initial

  // System B: NPCs
  npcStates: {
    healthy: number;
    stressed: number;
    critical: number;
  };
  npcLocations: Record<string, number>;

  // System C: Social
  relationships: {
    min: number;
    max: number;
    avg: number;
    spread: number;  // Indicates divergence
  };

  // System D: Information (e.g., rumors, alerts)
  activeInfoUnits: number;
  infoByType: Record<string, number>;

  // Cross-system indicators
  correlations: {
    economyToStress: number;    // -1 to 1: does low resources cause stress?
    stressToSocial: number;     // -1 to 1: does stress affect relationships?
    infoToLocation: number;     // -1 to 1: does info affect NPC movement?
  };
}

// ============================================================================
// SIMULATION RUNNER
// ============================================================================

/**
 * Run a simulation and collect emergence metrics.
 *
 * Replace with your actual kernel initialization and stepping.
 */
async function runSimulation(
  worldId: string,
  ticks: number
): Promise<EmergenceMetrics> {
  // Example structure - replace with your kernel
  //
  // const kernel = createYourKernel();
  // let state = kernel.init(worldId);
  //
  // for (let t = 0; t < ticks; t++) {
  //   state = kernel.step(state);
  // }
  //
  // return extractEmergenceMetrics(state);

  // Placeholder for demonstration
  const resourceDelta = Math.random() * 100 - 50;  // -50 to +50
  const criticalNpcs = resourceDelta < -20 ? Math.floor(Math.random() * 5) : 0;
  const relationshipSpread = criticalNpcs > 2 ? 30 + Math.random() * 20 : Math.random() * 15;

  return {
    worldId,
    totalTicks: ticks,
    eventsGenerated: Math.floor(Math.random() * 500),

    resources: {
      food: 100 + resourceDelta,
      wood: 50 + Math.random() * 20,
      stone: 30 + Math.random() * 10,
    },
    resourceDeltas: {
      food: resourceDelta,
      wood: Math.random() * 20 - 10,
      stone: Math.random() * 10 - 5,
    },

    npcStates: {
      healthy: 10 - criticalNpcs - Math.floor(Math.random() * 3),
      stressed: Math.floor(Math.random() * 3),
      critical: criticalNpcs,
    },
    npcLocations: {
      'farm': 3 + Math.floor(Math.random() * 3),
      'workshop': 2 + Math.floor(Math.random() * 2),
      'home': 5 + Math.floor(Math.random() * 3),
    },

    relationships: {
      min: 50 - relationshipSpread / 2,
      max: 50 + relationshipSpread / 2,
      avg: 50,
      spread: relationshipSpread,
    },

    activeInfoUnits: Math.floor(Math.random() * 10),
    infoByType: {
      'positive': Math.floor(Math.random() * 5),
      'negative': criticalNpcs > 0 ? Math.floor(Math.random() * 5) + 1 : 0,
    },

    correlations: {
      economyToStress: resourceDelta < -20 && criticalNpcs > 0 ? -0.7 : 0.1,
      stressToSocial: criticalNpcs > 2 && relationshipSpread > 20 ? -0.5 : 0.0,
      infoToLocation: 0.2,
    },
  };
}

// ============================================================================
// ANALYSIS
// ============================================================================

/**
 * Aggregate metrics across multiple runs.
 */
function aggregateMetrics(results: EmergenceMetrics[]): void {
  console.log('\n=== AGGREGATE METRICS ===\n');

  const avg = <K extends keyof EmergenceMetrics>(key: K) =>
    results.reduce((s, r) => s + (r[key] as number), 0) / results.length;

  console.log(`Avg events: ${avg('eventsGenerated').toFixed(0)}`);
  console.log(`Avg active info: ${avg('activeInfoUnits').toFixed(1)}`);

  // Aggregate resources
  const avgDeltas: Record<string, number> = {};
  for (const r of results) {
    for (const [k, v] of Object.entries(r.resourceDeltas)) {
      avgDeltas[k] = (avgDeltas[k] ?? 0) + v / results.length;
    }
  }
  console.log(`\nAvg resource deltas: ${JSON.stringify(
    Object.fromEntries(Object.entries(avgDeltas).map(([k, v]) => [k, Math.round(v)]))
  )}`);

  // Aggregate NPC states
  const totalStates = { healthy: 0, stressed: 0, critical: 0 };
  for (const r of results) {
    totalStates.healthy += r.npcStates.healthy;
    totalStates.stressed += r.npcStates.stressed;
    totalStates.critical += r.npcStates.critical;
  }
  console.log(`NPC states total: ${JSON.stringify(totalStates)}`);

  // Aggregate relationships
  const avgRelSpread = results.reduce((s, r) => s + r.relationships.spread, 0) / results.length;
  console.log(`Avg relationship spread: ${avgRelSpread.toFixed(1)}`);
}

/**
 * Check for emergence indicators.
 */
function checkEmergence(results: EmergenceMetrics[]): void {
  console.log('\n=== EMERGENCE INDICATORS ===\n');

  // 1. Economy → NPC Stress cascade
  console.log('1. ECONOMY → NPC STRESS');
  const lowResourceRuns = results.filter(r => r.resourceDeltas.food < -20);
  const highStressInLowResource = lowResourceRuns.filter(r => r.npcStates.critical > 0);
  const cascadeRate = lowResourceRuns.length > 0
    ? highStressInLowResource.length / lowResourceRuns.length
    : 0;

  console.log(`   Low resource runs: ${lowResourceRuns.length}/${results.length}`);
  console.log(`   Of those, high stress: ${highStressInLowResource.length}`);
  console.log(`   Cascade rate: ${(cascadeRate * 100).toFixed(0)}%`);

  if (cascadeRate > 0.5) {
    console.log('   ✓ Economy affects NPC stress (emergence detected)');
  } else if (cascadeRate > 0.2) {
    console.log('   ~ Weak correlation - may need tuning');
  } else {
    console.log('   ⚠️ No correlation - systems not connected');
  }

  // 2. Stress → Social dynamics
  console.log('\n2. STRESS → SOCIAL DYNAMICS');
  const highStressRuns = results.filter(r => r.npcStates.critical >= 2);
  const socialChangeInStress = highStressRuns.filter(r => r.relationships.spread > 20);
  const socialCascadeRate = highStressRuns.length > 0
    ? socialChangeInStress.length / highStressRuns.length
    : 0;

  console.log(`   High stress runs: ${highStressRuns.length}/${results.length}`);
  console.log(`   Of those, social change: ${socialChangeInStress.length}`);
  console.log(`   Cascade rate: ${(socialCascadeRate * 100).toFixed(0)}%`);

  if (socialCascadeRate > 0.5) {
    console.log('   ✓ Stress affects relationships (emergence detected)');
  } else if (socialCascadeRate > 0.2) {
    console.log('   ~ Weak correlation - may need tuning');
  } else {
    console.log('   ⚠️ No correlation - systems not connected');
  }

  // 3. Information spread
  console.log('\n3. INFORMATION DYNAMICS');
  const avgNegativeInfo = results.reduce((s, r) =>
    s + (r.infoByType.negative ?? 0), 0) / results.length;
  const avgPositiveInfo = results.reduce((s, r) =>
    s + (r.infoByType.positive ?? 0), 0) / results.length;

  console.log(`   Avg positive info: ${avgPositiveInfo.toFixed(1)}`);
  console.log(`   Avg negative info: ${avgNegativeInfo.toFixed(1)}`);

  if (avgNegativeInfo > 0.5 && avgPositiveInfo > 0.5) {
    console.log('   ✓ Both info types spreading (balanced dynamics)');
  } else if (avgNegativeInfo > 0.5 || avgPositiveInfo > 0.5) {
    console.log('   ~ One-sided info spread - check spawning rules');
  } else {
    console.log('   ⚠️ Little info activity - check propagation');
  }

  // 4. Overall emergence score
  console.log('\n4. OVERALL EMERGENCE');
  const avgRelationshipSpread = results.reduce((s, r) =>
    s + r.relationships.spread, 0) / results.length;

  if (avgRelationshipSpread > 25 && cascadeRate > 0.3 && socialCascadeRate > 0.3) {
    console.log('   ✓✓ Strong emergence - systems interacting meaningfully');
  } else if (avgRelationshipSpread > 15 || cascadeRate > 0.2) {
    console.log('   ✓ Moderate emergence - some system interaction');
  } else {
    console.log('   ⚠️ Weak emergence - systems may be too isolated');
    console.log('   Consider: stronger cross-system effects, longer simulations');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const numRuns = 10;
  const ticksPerRun = 24 * 14;  // 14 "days" worth

  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + '       RIVET EMERGENCE TESTER EXAMPLE       '.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  console.log(`\nRunning ${numRuns} simulations, ${ticksPerRun} ticks each...\n`);

  const results: EmergenceMetrics[] = [];

  for (let i = 0; i < numRuns; i++) {
    const worldId = `emergence-test-${Date.now()}-${i}`;
    console.log(`Run ${i + 1}/${numRuns}: ${worldId}`);

    try {
      const metrics = await runSimulation(worldId, ticksPerRun);
      results.push(metrics);

      console.log(`  Events: ${metrics.eventsGenerated}`);
      console.log(`  Resources: food=${metrics.resourceDeltas.food.toFixed(0)}`);
      console.log(`  NPCs: ${JSON.stringify(metrics.npcStates)}`);
      console.log(`  Relationships: spread=${metrics.relationships.spread.toFixed(0)}`);
      console.log();
    } catch (err) {
      console.error(`  Error: ${(err as Error).message}`);
    }
  }

  aggregateMetrics(results);
  checkEmergence(results);
}

main().catch(console.error);
