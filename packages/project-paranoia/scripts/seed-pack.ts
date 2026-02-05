import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { TICKS_PER_HOUR } from '../src/core/time.js';
import { CONFIG } from '../src/config.js';
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel } from '../src/kernel/kernel.js';

const args = process.argv.slice(2);
const seeds = Number(getArg('--seeds', '12'));
const ticks = Number(getArg('--ticks', '240'));
const fastStart = args.includes('--fast-start');
const startSeed = Number(getArg('--start', '100'));

const results: Record<string, number> = {};
let totalCargo = 0;
let totalAlive = 0;

for (let i = 0; i < seeds; i++) {
    const seed = startSeed + i;
    const rng = createRng(seed);
    const world = createWorld(rng);
    let state = createInitialState(world, CONFIG.quotaPerDay);
    if (fastStart) {
        state.truth.tick = TICKS_PER_HOUR * 8 - 1;
    }

    for (let t = 0; t < ticks && !state.truth.ending; t++) {
        state = stepKernel(state, [], rng).state;
    }

    const alive = Object.values(state.truth.crew).filter(c => c.alive).length;
    const ending = state.truth.ending ?? 'NONE';
    results[ending] = (results[ending] ?? 0) + 1;
    totalCargo += state.truth.totalCargo;
    totalAlive += alive;
}

const avgCargo = round(totalCargo / seeds);
const avgAlive = round(totalAlive / seeds);

console.log(`Seed pack: ${seeds} runs @ ${ticks} ticks (start ${startSeed})`);
console.log(`Avg cargo: ${avgCargo}`);
console.log(`Avg alive: ${avgAlive}`);
console.log(`Endings:`);
for (const [ending, count] of Object.entries(results)) {
    console.log(`- ${ending}: ${count}`);
}

function getArg(flag: string, fallback: string): string {
    const found = args.find(arg => arg.startsWith(`${flag}=`));
    if (!found) return fallback;
    return found.split('=')[1] ?? fallback;
}

function round(value: number): number {
    return Math.round(value * 10) / 10;
}
