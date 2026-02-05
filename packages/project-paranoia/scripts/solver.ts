/**
 * Smart solver that makes optimal decisions
 * Used to verify game is fair (solver should win ~100%)
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState } from '../src/kernel/types.js';
import type { PlaceId, NPCId } from '../src/core/types.js';

const NUM_GAMES = parseInt(process.argv[2] || '30', 10);
const VERBOSE = process.argv.includes('--verbose');

interface GameResult {
    seed: number;
    outcome: string;
    days: number;
    cargo: number;
    interventions: number;
}

const results: GameResult[] = [];

console.log(`\n=== SMART SOLVER: ${NUM_GAMES} games ===\n`);

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1000 + i;
    const result = runGame(seed);
    results.push(result);

    if (VERBOSE || result.outcome !== 'SURVIVED') {
        console.log(`Seed ${seed}: ${result.outcome} (day ${result.days}, ${result.interventions} interventions)`);
    }
}

// Summary
const outcomes: Record<string, number> = {};
let totalInterventions = 0;
for (const r of results) {
    outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
    totalInterventions += r.interventions;
}

console.log('\n=== RESULTS ===');
for (const [outcome, count] of Object.entries(outcomes).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / NUM_GAMES) * 100).toFixed(0);
    console.log(`  ${outcome}: ${count} (${pct}%)`);
}
console.log(`\n  Avg interventions/game: ${(totalInterventions / NUM_GAMES).toFixed(1)}`);

// List failures for investigation
const failures = results.filter(r => r.outcome !== 'SURVIVED');
if (failures.length > 0) {
    console.log(`\n=== FAILURES (seeds to investigate) ===`);
    for (const f of failures.slice(0, 5)) {
        console.log(`  seed=${f.seed} ${f.outcome} day=${f.days}`);
    }
}

function runGame(seed: number): GameResult {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);

    let interventions = 0;

    while (!state.truth.ending) {
        // Solver makes decisions
        const commands = solverDecide(state);
        interventions += commands.length;

        // Step the game
        stepKernel(state, commands, rng);

        // Safety: don't run forever
        if (state.truth.tick > TICKS_PER_DAY * 10) {
            state.truth.ending = 'TIMEOUT';
        }
    }

    return {
        seed,
        outcome: state.truth.ending,
        days: state.truth.day,
        cargo: state.truth.totalCargo,
        interventions,
    };
}

function solverDecide(state: KernelState): Command[] {
    const commands: Command[] = [];
    const truth = state.truth;

    const specialist = truth.crew['specialist'];
    const roughneck = truth.crew['roughneck'];

    // Priority 0: Evacuate workers from hazardous rooms
    for (const [npcId, worker] of [['specialist', specialist], ['roughneck', roughneck]] as const) {
        if (!worker.alive) continue;
        const room = truth.rooms[worker.place];
        if (room && isHazardous(room)) {
            // Find a safe adjacent room to flee to
            const safeRoom = findSafeAdjacentRoom(truth, worker.place);
            if (safeRoom) {
                commands.push({ type: 'ORDER', target: npcId as NPCId, intent: 'move', place: safeRoom });
            }
        }
    }

    // Priority 1: Clear path blockages for workers (always, not just during shift)

    // Find what's blocking workers from reaching mines
    for (const worker of [specialist, roughneck]) {
        if (!worker.alive) continue;

        const path = getPathToMines(worker.place);
        for (const roomId of path) {
            const room = truth.rooms[roomId];
            if (!room) continue;

            // If room is on fire, vent it (if empty)
            if (room.onFire && !room.isVented) {
                const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
                if (occupants.length === 0) {
                    commands.push({ type: 'VENT', place: roomId as PlaceId });
                }
            }
        }
    }

    // During shift, try to order workers to mines if path is clear
    if (truth.window === 'W2') {
        if (specialist.alive && specialist.place !== 'mines') {
            const order = tryOrderToMines(state, 'specialist');
            if (order) commands.push(order);
        }
        if (roughneck.alive && roughneck.place !== 'mines') {
            const order = tryOrderToMines(state, 'roughneck');
            if (order) commands.push(order);
        }
    }

    // Priority 2: General hazard management
    let needsO2Recovery = false;
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        // Vent rooms on fire to extinguish (if no one inside)
        if (room.onFire && !room.isVented) {
            const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
            if (occupants.length === 0) {
                commands.push({ type: 'VENT', place: roomId as PlaceId });
            }
        }

        // Seal vented rooms that are clear (fire out, O2 depleted)
        if (room.isVented && !room.onFire && room.o2Level < 15) {
            commands.push({ type: 'SEAL', place: roomId as PlaceId });
        }

        // Check if any sealed room has low O2 blocking paths
        if (!room.isVented && !room.onFire && room.o2Level < 25) {
            // Check if this room is on a worker's path to mines
            for (const worker of [specialist, roughneck]) {
                if (!worker.alive) continue;
                const path = getPathToMines(worker.place);
                if (path.includes(roomId as PlaceId)) {
                    needsO2Recovery = true;
                    break;
                }
            }
        }
    }

    // Priority 3: Use PURGE_AIR to speed up O2 recovery if needed (and have power)
    if (needsO2Recovery && truth.station.power >= 50) {
        commands.push({ type: 'PURGE_AIR' });
    }

    // Deduplicate commands
    const seen = new Set<string>();
    return commands.filter(cmd => {
        const key = JSON.stringify(cmd);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function tryOrderToMines(state: KernelState, npcId: NPCId): Command | null {
    const npc = state.truth.crew[npcId];
    if (!npc.alive) return null;

    // Check if path to mines is blocked
    const pathToMines = getPathToMines(npc.place);
    const blockedRoom = pathToMines.find(roomId => isHazardous(state.truth.rooms[roomId]));

    if (blockedRoom) {
        // Path is blocked - find alternate safe room to wait
        // For now, just wait (don't order)
        return null;
    }

    // Path is clear - order to mines
    return { type: 'ORDER', target: npcId, intent: 'move', place: 'mines' };
}

function getPathToMines(from: PlaceId): PlaceId[] {
    // Simplified path - actual game uses BFS
    const paths: Record<PlaceId, PlaceId[]> = {
        dorms: ['mess', 'bridge', 'core', 'engineering', 'cargo', 'mines'],
        mess: ['bridge', 'core', 'engineering', 'cargo', 'mines'],
        medbay: ['mess', 'bridge', 'core', 'engineering', 'cargo', 'mines'],
        bridge: ['core', 'engineering', 'cargo', 'mines'],
        core: ['engineering', 'cargo', 'mines'],
        engineering: ['cargo', 'mines'],
        cargo: ['mines'],
        mines: [],
        airlock_a: ['cargo', 'mines'],
        airlock_b: ['cargo', 'mines'],
    };
    return paths[from] || [];
}

function getAdjacentRooms(place: PlaceId): PlaceId[] {
    const adjacency: Record<PlaceId, PlaceId[]> = {
        dorms: ['mess'],
        mess: ['dorms', 'medbay', 'bridge'],
        medbay: ['mess'],
        bridge: ['mess', 'core'],
        core: ['bridge', 'engineering'],
        engineering: ['core', 'cargo'],
        cargo: ['engineering', 'mines', 'airlock_a', 'airlock_b'],
        mines: ['cargo'],
        airlock_a: ['cargo'],
        airlock_b: ['cargo'],
    };
    return adjacency[place] || [];
}

function findSafeAdjacentRoom(truth: KernelState['truth'], from: PlaceId): PlaceId | null {
    const adjacent = getAdjacentRooms(from);
    for (const roomId of adjacent) {
        const room = truth.rooms[roomId];
        if (room && !isHazardous(room)) {
            return roomId;
        }
    }
    return null;
}

function isHazardous(room: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }): boolean {
    if (room.onFire) return true;
    if (room.isVented) return true;
    if (room.o2Level < 25) return true;
    if (room.temperature > 45) return true;
    if (room.radiation > CONFIG.radiationHazardThreshold) return true;
    return false;
}
