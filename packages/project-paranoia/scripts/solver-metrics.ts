/**
 * Instrumented solver that collects detailed metrics for game balance tuning
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState } from '../src/kernel/types.js';
import type { PlaceId, NPCId } from '../src/core/types.js';

const NUM_GAMES = parseInt(process.argv[2] || '100', 10);

interface GameMetrics {
    seed: number;
    outcome: string;
    days: number;
    cargo: number;

    // Intervention metrics
    totalInterventions: number;
    ventCommands: number;
    sealCommands: number;
    purgeAirCommands: number;
    orderCommands: number;

    // Timing metrics
    ticksWorkersBlocked: number;
    ticksInHazard: number;
    ticksInMines: number;

    // Crisis metrics
    totalFires: number;
    totalRadiationEvents: number;
    simultaneousCrises: number; // max active at once

    // Room metrics
    roomsOnFire: Set<PlaceId>;
    minesFireTicks: number;

    // Failure analysis
    failureReason?: string;
    quotaShortfall?: number;
    deathCount: number;
}

function createMetrics(seed: number): GameMetrics {
    return {
        seed,
        outcome: '',
        days: 0,
        cargo: 0,
        totalInterventions: 0,
        ventCommands: 0,
        sealCommands: 0,
        purgeAirCommands: 0,
        orderCommands: 0,
        ticksWorkersBlocked: 0,
        ticksInHazard: 0,
        ticksInMines: 0,
        totalFires: 0,
        totalRadiationEvents: 0,
        simultaneousCrises: 0,
        roomsOnFire: new Set(),
        minesFireTicks: 0,
        deathCount: 0,
    };
}

const allMetrics: GameMetrics[] = [];

console.log(`\n=== INSTRUMENTED SOLVER: ${NUM_GAMES} games ===\n`);

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1000 + i;
    const metrics = runGameWithMetrics(seed);
    allMetrics.push(metrics);

    if (metrics.outcome !== 'SURVIVED') {
        console.log(`Seed ${seed}: ${metrics.outcome} - ${metrics.failureReason || 'unknown'}`);
    }
}

// Aggregate metrics
printAggregateMetrics(allMetrics);

function runGameWithMetrics(seed: number): GameMetrics {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);
    const metrics = createMetrics(seed);

    let prevFireRooms = new Set<string>();

    while (!state.truth.ending) {
        const truth = state.truth;

        // Track current hazard state
        const currentFireRooms = new Set<string>();
        let activeHazardCount = 0;

        for (const [roomId, room] of Object.entries(truth.rooms)) {
            if (room.onFire) {
                currentFireRooms.add(roomId);
                metrics.roomsOnFire.add(roomId as PlaceId);
                activeHazardCount++;

                if (roomId === 'mines') metrics.minesFireTicks++;

                // Track new fires
                if (!prevFireRooms.has(roomId)) {
                    metrics.totalFires++;
                }
            }
            if (room.radiation > CONFIG.radiationHazardThreshold) {
                activeHazardCount++;
            }
        }

        metrics.simultaneousCrises = Math.max(metrics.simultaneousCrises, activeHazardCount);
        prevFireRooms = currentFireRooms;

        // Track worker state
        const specialist = truth.crew['specialist'];
        const roughneck = truth.crew['roughneck'];

        for (const worker of [specialist, roughneck]) {
            if (!worker.alive) continue;

            const room = truth.rooms[worker.place];
            if (isHazardous(room)) {
                metrics.ticksInHazard++;
            }

            if (worker.place === 'mines') {
                metrics.ticksInMines++;
            }

            // Check if blocked from reaching mines during W2
            if (truth.window === 'W2' && worker.place !== 'mines') {
                const path = getPathToMines(worker.place);
                const blocked = path.some(roomId => isHazardous(truth.rooms[roomId]));
                if (blocked) {
                    metrics.ticksWorkersBlocked++;
                }
            }
        }

        // Solver makes decisions
        const commands = solverDecide(state);

        // Track command types
        for (const cmd of commands) {
            metrics.totalInterventions++;
            if (cmd.type === 'VENT') metrics.ventCommands++;
            if (cmd.type === 'SEAL') metrics.sealCommands++;
            if (cmd.type === 'PURGE_AIR') metrics.purgeAirCommands++;
            if (cmd.type === 'ORDER') metrics.orderCommands++;
        }

        stepKernel(state, commands, rng);

        if (state.truth.tick > TICKS_PER_DAY * 10) {
            state.truth.ending = 'TIMEOUT';
        }
    }

    // Final metrics
    metrics.outcome = state.truth.ending;
    metrics.days = state.truth.day;
    metrics.cargo = state.truth.totalCargo;
    metrics.deathCount = Object.values(state.truth.crew).filter(c => !c.alive).length;

    // Analyze failure reason
    if (metrics.outcome === 'DECOMMISSIONED') {
        const quotaNeeded = CONFIG.quotaPerDay * CONFIG.winDays;
        if (metrics.cargo < quotaNeeded) {
            metrics.failureReason = `quota miss (${metrics.cargo}/${quotaNeeded})`;
            metrics.quotaShortfall = quotaNeeded - metrics.cargo;
        }
    } else if (metrics.outcome === 'MELTDOWN') {
        metrics.failureReason = 'reactor meltdown';
    } else if (metrics.outcome === 'MUTINY') {
        metrics.failureReason = 'crew mutiny';
    }

    return metrics;
}

function printAggregateMetrics(metrics: GameMetrics[]) {
    const survived = metrics.filter(m => m.outcome === 'SURVIVED');
    const failed = metrics.filter(m => m.outcome !== 'SURVIVED');

    console.log('\n=== OUTCOMES ===');
    const outcomes: Record<string, number> = {};
    for (const m of metrics) {
        outcomes[m.outcome] = (outcomes[m.outcome] || 0) + 1;
    }
    for (const [outcome, count] of Object.entries(outcomes).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${outcome}: ${count} (${((count / metrics.length) * 100).toFixed(1)}%)`);
    }

    console.log('\n=== INTERVENTION BREAKDOWN ===');
    const totals = metrics.reduce((acc, m) => ({
        vent: acc.vent + m.ventCommands,
        seal: acc.seal + m.sealCommands,
        purge: acc.purge + m.purgeAirCommands,
        order: acc.order + m.orderCommands,
        total: acc.total + m.totalInterventions,
    }), { vent: 0, seal: 0, purge: 0, order: 0, total: 0 });

    console.log(`  VENT: ${(totals.vent / metrics.length).toFixed(1)}/game (${((totals.vent / totals.total) * 100).toFixed(0)}%)`);
    console.log(`  SEAL: ${(totals.seal / metrics.length).toFixed(1)}/game (${((totals.seal / totals.total) * 100).toFixed(0)}%)`);
    console.log(`  PURGE_AIR: ${(totals.purge / metrics.length).toFixed(1)}/game (${((totals.purge / totals.total) * 100).toFixed(0)}%)`);
    console.log(`  ORDER: ${(totals.order / metrics.length).toFixed(1)}/game (${((totals.order / totals.total) * 100).toFixed(0)}%)`);

    console.log('\n=== CRISIS METRICS ===');
    const avgFires = metrics.reduce((s, m) => s + m.totalFires, 0) / metrics.length;
    const avgSimultaneous = metrics.reduce((s, m) => s + m.simultaneousCrises, 0) / metrics.length;
    const minesFireGames = metrics.filter(m => m.minesFireTicks > 0).length;
    const avgMinesFireTicks = metrics.reduce((s, m) => s + m.minesFireTicks, 0) / metrics.length;

    console.log(`  Avg fires/game: ${avgFires.toFixed(1)}`);
    console.log(`  Avg max simultaneous hazards: ${avgSimultaneous.toFixed(1)}`);
    console.log(`  Games with mines fire: ${minesFireGames} (${((minesFireGames / metrics.length) * 100).toFixed(0)}%)`);
    console.log(`  Avg mines fire ticks: ${avgMinesFireTicks.toFixed(1)}`);

    console.log('\n=== WORKER EFFICIENCY ===');
    const avgBlocked = metrics.reduce((s, m) => s + m.ticksWorkersBlocked, 0) / metrics.length;
    const avgInMines = metrics.reduce((s, m) => s + m.ticksInMines, 0) / metrics.length;
    const avgInHazard = metrics.reduce((s, m) => s + m.ticksInHazard, 0) / metrics.length;
    const totalW2Ticks = TICKS_PER_DAY * 0.4 * CONFIG.winDays * 2; // 2 workers

    console.log(`  Avg ticks workers blocked: ${avgBlocked.toFixed(0)} (${((avgBlocked / totalW2Ticks) * 100).toFixed(1)}% of shift)`);
    console.log(`  Avg ticks in mines: ${avgInMines.toFixed(0)}`);
    console.log(`  Avg ticks in hazard: ${avgInHazard.toFixed(1)}`);

    if (failed.length > 0) {
        console.log('\n=== FAILURE ANALYSIS ===');

        // Quota shortfalls
        const quotaMisses = failed.filter(m => m.quotaShortfall);
        if (quotaMisses.length > 0) {
            const avgShortfall = quotaMisses.reduce((s, m) => s + (m.quotaShortfall || 0), 0) / quotaMisses.length;
            console.log(`  Quota misses: ${quotaMisses.length}, avg shortfall: ${avgShortfall.toFixed(1)}`);
        }

        // Compare failed vs survived
        const failedAvgBlocked = failed.reduce((s, m) => s + m.ticksWorkersBlocked, 0) / failed.length;
        const survivedAvgBlocked = survived.length > 0
            ? survived.reduce((s, m) => s + m.ticksWorkersBlocked, 0) / survived.length
            : 0;

        console.log(`  Failed games avg blocked ticks: ${failedAvgBlocked.toFixed(0)}`);
        console.log(`  Survived games avg blocked ticks: ${survivedAvgBlocked.toFixed(0)}`);

        const failedMinesFire = failed.filter(m => m.minesFireTicks > 0).length;
        console.log(`  Failed games with mines fire: ${failedMinesFire}/${failed.length}`);
    }

    // Room fire frequency
    console.log('\n=== FIRE FREQUENCY BY ROOM ===');
    const roomFireCounts: Record<string, number> = {};
    for (const m of metrics) {
        for (const room of m.roomsOnFire) {
            roomFireCounts[room] = (roomFireCounts[room] || 0) + 1;
        }
    }
    for (const [room, count] of Object.entries(roomFireCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${room}: ${count} games (${((count / metrics.length) * 100).toFixed(0)}%)`);
    }
}

// Solver logic (same as solver.ts)
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
            const safeRoom = findSafeAdjacentRoom(truth, worker.place);
            if (safeRoom) {
                commands.push({ type: 'ORDER', target: npcId as NPCId, intent: 'move', place: safeRoom });
            }
        }
    }

    // Priority 1: Clear path blockages
    for (const worker of [specialist, roughneck]) {
        if (!worker.alive) continue;
        const path = getPathToMines(worker.place);
        for (const roomId of path) {
            const room = truth.rooms[roomId];
            if (!room) continue;
            if (room.onFire && !room.isVented) {
                const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
                if (occupants.length === 0) {
                    commands.push({ type: 'VENT', place: roomId as PlaceId });
                }
            }
        }
    }

    // During shift, order workers to mines
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

    // Hazard management
    let needsO2Recovery = false;
    for (const [roomId, room] of Object.entries(truth.rooms)) {
        if (room.onFire && !room.isVented) {
            const occupants = Object.values(truth.crew).filter(c => c.alive && c.place === roomId);
            if (occupants.length === 0) {
                commands.push({ type: 'VENT', place: roomId as PlaceId });
            }
        }
        if (room.isVented && !room.onFire && room.o2Level < 15) {
            commands.push({ type: 'SEAL', place: roomId as PlaceId });
        }
        if (!room.isVented && !room.onFire && room.o2Level < 25) {
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

    if (needsO2Recovery && truth.station.power >= 50) {
        commands.push({ type: 'PURGE_AIR' });
    }

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
    const pathToMines = getPathToMines(npc.place);
    const blockedRoom = pathToMines.find(roomId => isHazardous(state.truth.rooms[roomId]));
    if (blockedRoom) return null;
    return { type: 'ORDER', target: npcId, intent: 'move', place: 'mines' };
}

function getPathToMines(from: PlaceId): PlaceId[] {
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
