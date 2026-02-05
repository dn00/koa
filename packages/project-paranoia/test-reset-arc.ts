// Quick test to verify multi-stage reset arc works
import { createInitialState } from './src/kernel/state.js';
import { stepKernel } from './src/kernel/kernel.js';
import { createWorld } from './src/core/world.js';
import { createRng } from './src/core/rng.js';
import { CONFIG } from './src/config.js';

// Create initial state
const world = createWorld();
const state = createInitialState(world, CONFIG.quotaPerDay);
const rng = createRng(12345);

console.log('=== MULTI-STAGE RESET ARC TEST ===\n');

// Helper to set crew suspicion directly
// Suspicion = (tamperEvidence/100)*40 + (1-motherReliable)*35 + rumors*25
// Max = 40 + 35 + 25 = 100
function setSuspicion(target: number) {
    // Use all three factors: maxing tamper (40), then distrust (35), then rumors (25)
    let remaining = target;
    const tamperScore = Math.min(40, remaining);
    remaining -= tamperScore;
    const distrustScore = Math.min(35, remaining);
    remaining -= distrustScore;
    const rumorScore = Math.min(25, remaining);

    // Convert scores to values
    const tamperEvidence = (tamperScore / 40) * 100;
    const motherReliable = 1 - (distrustScore / 35);
    const motherRogue = rumorScore / 25;

    for (const crewId of Object.keys(state.perception.beliefs)) {
        const belief = state.perception.beliefs[crewId as keyof typeof state.perception.beliefs];
        if (belief) {
            belief.tamperEvidence = tamperEvidence;
            belief.motherReliable = motherReliable;
            belief.rumors['mother_rogue'] = motherRogue;
        }
    }
}

// Test each stage threshold
const tests = [
    { suspicion: 0, expected: 'none' },
    { suspicion: 40, expected: 'whispers' },
    { suspicion: 60, expected: 'meeting' },
    { suspicion: 80, expected: 'restrictions' },
    { suspicion: 95, expected: 'countdown' },
    { suspicion: 30, expected: 'countdown' }, // NO de-escalation from countdown (by design)
];

// Ensure commander is at bridge/core for stage transitions
state.truth.crew['commander'].place = 'bridge';

for (const test of tests) {
    setSuspicion(test.suspicion);

    // Reset commander cooldown so they can act
    state.truth.crew['commander'].nextRoleTick = 0;
    // Also reset the stage tick to prevent stage cooldown issues
    state.truth.resetStageTick = 0;

    // Run a few ticks to allow stage transition
    for (let i = 0; i < 5; i++) {
        // Keep resetting suspicion values since they decay
        setSuspicion(test.suspicion);
        state.truth.crew['commander'].nextRoleTick = 0;
        stepKernel(state, [], rng);
    }

    const actual = state.truth.resetStage;
    const pass = actual === test.expected;
    console.log(`Suspicion ~${test.suspicion}: expected '${test.expected}', got '${actual}' ${pass ? '✓' : '✗'}`);
}

// Test de-escalation from non-countdown stage
console.log('\n=== Testing De-escalation ===');
state.truth.resetStage = 'whispers';
state.truth.resetStageTick = 0;
state.truth.crew['commander'].nextRoleTick = 0;
setSuspicion(30); // Below 35 threshold

for (let i = 0; i < 5; i++) {
    setSuspicion(30);
    state.truth.crew['commander'].nextRoleTick = 0;
    stepKernel(state, [], rng);
}

const deescalated = state.truth.resetStage === 'none';
console.log(`De-escalation from whispers (susp 30): ${deescalated ? '✓' : '✗'} (got ${state.truth.resetStage})`);

console.log('\n=== Testing calculateCrewSuspicion ===');

// Reset and test calculation
state.truth.resetStage = 'none';
state.truth.resetStageTick = 0;

// Set specific values to verify calculation
for (const crewId of Object.keys(state.perception.beliefs)) {
    const belief = state.perception.beliefs[crewId as keyof typeof state.perception.beliefs];
    if (belief) {
        belief.tamperEvidence = 50;      // 50/100 * 40 = 20 points
        belief.motherReliable = 0.5;      // (1-0.5) * 35 = 17.5 points
        belief.rumors['mother_rogue'] = 0.4; // 0.4 * 25 = 10 points
        // Total: ~47.5 points per crew
    }
}

// Manually calculate (should be around 47-48)
const beliefs = state.perception.beliefs;
const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
let totalSuspicion = 0;
for (const crew of aliveCrew) {
    const belief = beliefs[crew.id as keyof typeof beliefs];
    if (!belief) continue;
    const tamperScore = (belief.tamperEvidence / 100) * 40;
    const distrustScore = (1 - belief.motherReliable) * 35;
    const rumorScore = (belief.rumors['mother_rogue'] ?? 0) * 25;
    totalSuspicion += tamperScore + distrustScore + rumorScore;
}
const calculated = Math.round(totalSuspicion / aliveCrew.length);
console.log(`Manual calculation: ${calculated}`);
console.log(`Expected: ~47-48 (20 + 17.5 + 10)`);

console.log('\n=== DONE ===');
