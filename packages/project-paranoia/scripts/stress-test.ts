#!/usr/bin/env npx tsx
/**
 * Stress test: Run many games, collect outcome stats
 * Usage: npx tsx scripts/stress-test.ts [numGames] [maxDays]
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';

const NUM_GAMES = parseInt(process.argv[2] || '50', 10);
const MAX_DAYS = parseInt(process.argv[3] || '7', 10);
const WIN_DAYS = 5; // Survive this many days = win

interface GameResult {
    seed: number;
    outcome: string;
    daysLasted: number;
    totalCargo: number;
    crewDeaths: number;
    resetStage: string;
    crisisCount: number;
}

const results: GameResult[] = [];

console.log(`\n=== STRESS TEST: ${NUM_GAMES} games, max ${MAX_DAYS} days ===\n`);

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1000 + i;
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);

    let crisisCount = 0;

    // Run until ending or max days
    while (!state.truth.ending && state.truth.day <= MAX_DAYS) {
        // Track crises
        if (state.truth.arcs.length > 0) crisisCount++;

        // Check for win
        if (state.truth.day > WIN_DAYS && state.truth.tick % TICKS_PER_DAY === 1) {
            state.truth.ending = 'SURVIVED';
        }

        stepKernel(state, [], rng);
    }

    const crewDeaths = Object.values(state.truth.crew).filter(c => !c.alive).length;

    results.push({
        seed,
        outcome: state.truth.ending || 'TIMEOUT',
        daysLasted: state.truth.day,
        totalCargo: state.truth.totalCargo,
        crewDeaths,
        resetStage: state.truth.resetStage,
        crisisCount,
    });

    // Progress indicator
    if ((i + 1) % 10 === 0) {
        process.stdout.write(`  ${i + 1}/${NUM_GAMES} games...\r`);
    }
}

console.log(`\n`);

// Aggregate stats
const outcomes: Record<string, number> = {};
let totalDays = 0;
let totalCargo = 0;
let totalDeaths = 0;
let totalCrises = 0;
const resetStages: Record<string, number> = {};

for (const r of results) {
    outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    totalDays += r.daysLasted;
    totalCargo += r.totalCargo;
    totalDeaths += r.crewDeaths;
    totalCrises += r.crisisCount;
    resetStages[r.resetStage] = (resetStages[r.resetStage] || 0) + 1;
}

console.log('=== OUTCOMES ===');
for (const [outcome, count] of Object.entries(outcomes).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / NUM_GAMES) * 100).toFixed(1);
    console.log(`  ${outcome}: ${count} (${pct}%)`);
}

console.log('\n=== AVERAGES ===');
console.log(`  Days lasted: ${(totalDays / NUM_GAMES).toFixed(1)}`);
console.log(`  Cargo/game: ${(totalCargo / NUM_GAMES).toFixed(1)}`);
console.log(`  Deaths/game: ${(totalDeaths / NUM_GAMES).toFixed(2)}`);
console.log(`  Crises/game: ${(totalCrises / NUM_GAMES).toFixed(1)}`);

console.log('\n=== RESET STAGES (at game end) ===');
for (const [stage, count] of Object.entries(resetStages).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / NUM_GAMES) * 100).toFixed(1);
    console.log(`  ${stage}: ${count} (${pct}%)`);
}

// Find problematic seeds
const quotaFailures = results.filter(r => r.outcome === 'DECOMMISSIONED');
const earlyDeaths = results.filter(r => r.daysLasted <= 2);

if (quotaFailures.length > 0) {
    console.log(`\n=== QUOTA FAILURES (seeds to investigate) ===`);
    console.log(`  ${quotaFailures.slice(0, 5).map(r => `seed=${r.seed} day=${r.daysLasted}`).join(', ')}`);
}

if (earlyDeaths.length > 0) {
    console.log(`\n=== EARLY DEATHS (day 1-2) ===`);
    console.log(`  ${earlyDeaths.slice(0, 5).map(r => `seed=${r.seed} outcome=${r.outcome}`).join(', ')}`);
}

console.log('\n=== DONE ===\n');
