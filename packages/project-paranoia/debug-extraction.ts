// Debug: Track worker positions and extraction through Day 1-2
import { createInitialState } from './src/kernel/state.js';
import { stepKernel } from './src/kernel/kernel.js';
import { createWorld } from './src/core/world.js';
import { createRng } from './src/core/rng.js';
import { CONFIG } from './src/config.js';
import { TICKS_PER_DAY } from './src/core/time.js';

const world = createWorld(createRng(123));
const state = createInitialState(world, CONFIG.quotaPerDay);
const rng = createRng(123);

console.log('=== EXTRACTION DEBUG ===\n');
console.log(`Quota: ${CONFIG.quotaPerDay}/day, Yield interval: ${CONFIG.yieldInterval} ticks`);
console.log(`Ticks per day: ${TICKS_PER_DAY}\n`);

// Track extraction events and worker positions
let lastWorkerReport = -100;

for (let i = 0; i < TICKS_PER_DAY * 2 + 10; i++) {
    const tick = state.truth.tick;
    const day = state.truth.day;
    const window = state.truth.window;

    const specialist = state.truth.crew['specialist'];
    const roughneck = state.truth.crew['roughneck'];
    const mines = state.truth.rooms['mines'];

    // Report worker positions every 20 ticks during W2, or on key events
    const isW2 = window === 'W2';
    const shouldReport = (isW2 && tick - lastWorkerReport >= 20) || tick % TICKS_PER_DAY === 0;

    if (shouldReport && tick > 0) {
        lastWorkerReport = tick;
        console.log(`[Tick ${tick} Day ${day} ${window}] Cargo: ${state.truth.dayCargo}/${CONFIG.quotaPerDay}`);
        console.log(`  Specialist: ${specialist.alive ? specialist.place : 'DEAD'} (target: ${specialist.targetPlace || 'none'})`);
        console.log(`  Roughneck: ${roughneck.alive ? roughneck.place : 'DEAD'} (target: ${roughneck.targetPlace || 'none'})`);
        console.log(`  Mines: O2=${mines.o2Level}%, rad=${mines.radiation}, fire=${mines.onFire}`);

        // Check active arcs
        if (state.truth.arcs.length > 0) {
            console.log(`  Active crises: ${state.truth.arcs.map(a => `${a.kind}@${a.target}`).join(', ')}`);
        }
        console.log('');
    }

    // Run the kernel
    const result = stepKernel(state, [], rng);

    // Check for extraction events
    for (const event of result.events) {
        if (event.type === 'CARGO_YIELD') {
            console.log(`  >> YIELD: +${event.data?.amount} cargo by ${event.actor} at ${event.place}`);
        }
    }

    // Check for ending
    if (state.truth.ending) {
        console.log(`\n=== GAME ENDED: ${state.truth.ending} at tick ${tick} ===`);
        console.log(`Final cargo: Day ${day} = ${state.truth.dayCargo}/${CONFIG.quotaPerDay}`);
        break;
    }
}

console.log('\n=== DEBUG COMPLETE ===');
