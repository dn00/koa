/**
 * Find dramatic seeds for playtesting.
 * Runs passive (no commands) simulations to find seeds with interesting crisis patterns.
 */
import { createInitialState } from '../src/kernel/state.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState } from '../src/kernel/types.js';
import type { NPCId } from '../src/core/types.js';

function calcSuspicion(state: KernelState): number {
    const alive = Object.values(state.truth.crew).filter(c => c.alive);
    if (alive.length === 0) return 0;
    let total = 0;
    for (const npc of alive) {
        const b = state.perception.beliefs[npc.id as NPCId];
        if (!b) continue;
        total += (b.tamperEvidence / 100) * 40 + (1 - b.motherReliable) * 35 + (b.rumors['mother_rogue'] ?? 0) * 25;
    }
    return total / alive.length;
}

interface SeedInfo {
    seed: number;
    outcome: string;
    peakSusp: number;
    fires: number;
    deaths: number;
    totalCargo: number;
    crisisTypes: Set<string>;
    score: number;
}

const results: SeedInfo[] = [];

for (let i = 0; i < 500; i++) {
    const seed = 1000 + i;
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);

    let peakSusp = 0;
    let fires = 0;
    let deaths = 0;
    const seenFires = new Set<string>();
    const crisisTypes = new Set<string>();

    while (!state.truth.ending && state.truth.tick < TICKS_PER_DAY * 4) {
        for (const [id, room] of Object.entries(state.truth.rooms)) {
            if (room.onFire && !seenFires.has(`${id}-${state.truth.tick}`)) {
                // Count unique fire starts
                const wasFireLastTick = seenFires.has(`${id}-${state.truth.tick - 1}`);
                if (!wasFireLastTick) fires++;
                seenFires.add(`${id}-${state.truth.tick}`);
            }
        }
        for (const arc of state.truth.arcs) {
            crisisTypes.add(arc.kind);
        }

        const susp = calcSuspicion(state);
        peakSusp = Math.max(peakSusp, susp);

        stepKernel(state, [], rng);
    }

    deaths = Object.values(state.truth.crew).filter(c => !c.alive).length;

    const score = fires * 8 + crisisTypes.size * 5 + Math.min(peakSusp, 50) + (deaths === 1 ? 10 : deaths > 1 ? 5 : 0);

    results.push({ seed, outcome: state.truth.ending || 'TIMEOUT', peakSusp, fires, deaths, totalCargo: state.truth.totalCargo, crisisTypes, score });
}

const good = results
    .filter(r => r.fires >= 2 && r.crisisTypes.size >= 2)
    .sort((a, b) => b.score - a.score);

console.log('Top 15 dramatic seeds for playtest:');
for (const r of good.slice(0, 15)) {
    console.log(`  seed ${r.seed}: ${r.outcome.padEnd(16)} fires=${r.fires} crises=[${[...r.crisisTypes].join(',')}] peakSusp=${r.peakSusp.toFixed(0)} deaths=${r.deaths} cargo=${r.totalCargo} score=${r.score.toFixed(0)}`);
}
