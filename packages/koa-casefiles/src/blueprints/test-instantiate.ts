#!/usr/bin/env npx tsx
/**
 * Quick test of blueprint instantiation
 *
 * Run: npx tsx src/blueprints/test-instantiate.ts
 */

import { createRng } from '../kernel/rng.js';
import { createWorld } from '../world.js';
import { ALL_BLUEPRINTS, getBlueprintSummary } from './incidents/index.js';
import { instantiateCrimePlan, tryInstantiateAny } from './instantiate.js';
import { executeCrimePlan } from './executor.js';

console.log('=== Blueprint Instantiation Test ===\n');

// Show available blueprints
console.log('Available blueprints:');
const summary = getBlueprintSummary();
for (const [type, ids] of Object.entries(summary)) {
    if (ids.length > 0) {
        console.log(`  ${type}: ${ids.join(', ')}`);
    }
}
console.log();

// Test with multiple seeds
const testSeeds = [1, 2, 3, 42, 100, 1337];
let successCount = 0;
let totalAttempts = 0;

for (const seed of testSeeds) {
    const rng = createRng(seed);
    const world = createWorld(rng);

    console.log(`--- Seed ${seed} ---`);

    // Try each blueprint
    for (const blueprint of ALL_BLUEPRINTS) {
        totalAttempts++;
        const planRng = createRng(seed * 1000 + totalAttempts);
        const plan = instantiateCrimePlan(blueprint, world, planRng);

        if (plan) {
            successCount++;
            console.log(`  ✓ ${blueprint.id}`);
            console.log(`    Culprit: ${plan.culprit}`);
            console.log(`    Target Item: ${plan.targetItem}`);
            console.log(`    Crime Place: ${plan.crimePlace} → Hide: ${plan.hidePlace}`);
            console.log(`    Window: ${plan.crimeWindow}`);
            console.log(`    Method: ${plan.variantId}`);
            console.log(`    Steps: ${plan.resolvedSteps.length}`);

            // Execute and show event count
            const events = executeCrimePlan(plan, world, planRng);
            console.log(`    Events generated: ${events.length}`);

            // Show first few events
            for (const event of events.slice(0, 3)) {
                console.log(`      ${event.type} @ tick ${event.tick} (${event.window})`);
            }
            if (events.length > 3) {
                console.log(`      ... and ${events.length - 3} more`);
            }
        } else {
            console.log(`  ✗ ${blueprint.id} - could not instantiate`);
        }
    }
    console.log();
}

// Try the "any blueprint" helper
console.log('--- tryInstantiateAny test ---');
for (const seed of [7, 13, 21]) {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const result = tryInstantiateAny(ALL_BLUEPRINTS, world, rng);

    if (result) {
        console.log(`Seed ${seed}: Selected ${result.blueprint.id} (${result.blueprint.incidentType})`);
        console.log(`  Culprit: ${result.plan.culprit}, Method: ${result.plan.variantId}`);
    } else {
        console.log(`Seed ${seed}: No blueprint could be instantiated`);
    }
}

console.log(`\n=== Summary ===`);
console.log(`Success rate: ${successCount}/${totalAttempts} (${(successCount/totalAttempts*100).toFixed(1)}%)`);
