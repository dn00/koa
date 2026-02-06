/**
 * Smart solver that handles BOTH physical and social mechanics
 * Used to verify game balance and identify what actually matters
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
const USE_MANIPULATION = process.argv.includes('--manipulate');
const VERBOSE = process.argv.includes('--verbose');

interface GameMetrics {
    seed: number;
    outcome: string;
    days: number;
    cargo: number;

    // Physical metrics
    ventCommands: number;
    sealCommands: number;
    purgeAirCommands: number;
    orderCommands: number;
    totalFires: number;
    ticksWorkersBlocked: number;

    // Social metrics
    peakSuspicion: number;
    finalSuspicion: number;
    finalResetStage: string;
    investigationCount: number;
    tamperEvidence: number;
    manipulationCount: number;

    // Strategic metrics
    commanderKilled: boolean;
    lockedOutBridge: boolean;
}

function createMetrics(seed: number): GameMetrics {
    return {
        seed,
        outcome: '',
        days: 0,
        cargo: 0,
        ventCommands: 0,
        sealCommands: 0,
        purgeAirCommands: 0,
        orderCommands: 0,
        totalFires: 0,
        ticksWorkersBlocked: 0,
        peakSuspicion: 0,
        finalSuspicion: 0,
        finalResetStage: 'none',
        investigationCount: 0,
        tamperEvidence: 0,
        manipulationCount: 0,
        commanderKilled: false,
        lockedOutBridge: false,
    };
}

const allMetrics: GameMetrics[] = [];

console.log(`\n=== SMART SOLVER: ${NUM_GAMES} games ===`);
console.log(`Manipulation: ${USE_MANIPULATION ? 'ENABLED' : 'DISABLED'}\n`);

for (let i = 0; i < NUM_GAMES; i++) {
    const seed = 1000 + i;
    const metrics = runGameWithMetrics(seed);
    allMetrics.push(metrics);

    if (VERBOSE || metrics.outcome !== 'SURVIVED') {
        console.log(`Seed ${seed}: ${metrics.outcome} (day ${metrics.days}, suspicion ${metrics.finalSuspicion.toFixed(0)}, stage ${metrics.finalResetStage})`);
    }
}

printResults(allMetrics);

function runGameWithMetrics(seed: number): GameMetrics {
    const rng = createRng(seed);
    const world = createWorld(rng);
    const state = createInitialState(world, CONFIG.quotaPerDay);
    const metrics = createMetrics(seed);

    let prevFireRooms = new Set<string>();

    while (!state.truth.ending) {
        const truth = state.truth;
        const perception = state.perception;

        // Track fires
        const currentFireRooms = new Set<string>();
        for (const [roomId, room] of Object.entries(truth.rooms)) {
            if (room.onFire) {
                currentFireRooms.add(roomId);
                if (!prevFireRooms.has(roomId)) {
                    metrics.totalFires++;
                }
            }
        }
        prevFireRooms = currentFireRooms;

        // Track suspicion
        const suspicion = calculateCrewSuspicion(state);
        metrics.peakSuspicion = Math.max(metrics.peakSuspicion, suspicion);

        // Track path blockage during W2
        if (truth.window === 'W2') {
            for (const workerId of ['specialist', 'roughneck'] as const) {
                const worker = truth.crew[workerId];
                if (!worker.alive || worker.place === 'mines') continue;
                const path = getPathToMines(worker.place);
                if (path.some(roomId => isHazardous(truth.rooms[roomId]))) {
                    metrics.ticksWorkersBlocked++;
                }
            }
        }

        // Solver makes decisions
        const commands = smartSolverDecide(state, metrics);

        // Track commands
        for (const cmd of commands) {
            if (cmd.type === 'VENT') metrics.ventCommands++;
            if (cmd.type === 'SEAL') metrics.sealCommands++;
            if (cmd.type === 'PURGE_AIR') metrics.purgeAirCommands++;
            if (cmd.type === 'ORDER') metrics.orderCommands++;
            if (cmd.type === 'FABRICATE' || cmd.type === 'SPOOF' || cmd.type === 'SUPPRESS') {
                metrics.manipulationCount++;
            }
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
    metrics.finalSuspicion = calculateCrewSuspicion(state);
    metrics.finalResetStage = state.truth.resetStage;
    metrics.commanderKilled = !state.truth.crew['commander'].alive;

    // Sum up tamper evidence
    for (const belief of Object.values(state.perception.beliefs)) {
        metrics.tamperEvidence += belief.tamperEvidence;
    }

    return metrics;
}

function smartSolverDecide(state: KernelState, metrics: GameMetrics): Command[] {
    const commands: Command[] = [];
    const truth = state.truth;

    const specialist = truth.crew['specialist'];
    const roughneck = truth.crew['roughneck'];
    const commander = truth.crew['commander'];

    // ==========================================
    // SOCIAL LAYER MANAGEMENT
    // ==========================================

    const suspicion = calculateCrewSuspicion(state);

    // VERIFY: Active trust-building when suspicion is getting concerning
    // Use VERIFY proactively when suspicion > 40 and cooldown allows
    const ticksSinceVerify = truth.tick - truth.lastVerifyTick;
    const canVerify = ticksSinceVerify >= CONFIG.verifyCooldown && truth.station.power >= CONFIG.verifyCpuCost;
    if (canVerify && suspicion > 40) {
        commands.push({ type: 'VERIFY' });
    }

    // Strategy: If suspicion is getting dangerous, take action
    if (suspicion >= 50 && truth.resetStage !== 'countdown') {
        // Option 1: Lock commander out of bridge/core (prevent reset)
        const commanderInAccess = commander.alive && (commander.place === 'bridge' || commander.place === 'core');
        if (commanderInAccess) {
            // Try to order commander elsewhere
            commands.push({ type: 'ORDER', target: 'commander', intent: 'move', place: 'mess' });
            metrics.lockedOutBridge = true;
        }
    }

    // If in countdown, desperate measures
    if (truth.resetStage === 'countdown' && truth.resetCountdown && truth.resetCountdown > 5) {
        // Order commander away from terminals
        if (commander.alive && (commander.place === 'bridge' || commander.place === 'core')) {
            commands.push({ type: 'ORDER', target: 'commander', intent: 'move', place: 'dorms' });
        }
    }

    // Optional: Use manipulation (for testing if it helps or hurts)
    if (USE_MANIPULATION && truth.tick % 100 === 50) {
        // Occasional spoof to test impact on suspicion
        // commands.push({ type: 'SPOOF', system: 'sensors' });
    }

    // ==========================================
    // PHYSICAL LAYER MANAGEMENT (same as before)
    // ==========================================

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

    // Deduplicate
    const seen = new Set<string>();
    return commands.filter(cmd => {
        const key = JSON.stringify(cmd);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function printResults(metrics: GameMetrics[]) {
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

    console.log('\n=== SOCIAL LAYER METRICS ===');
    const avgPeakSuspicion = metrics.reduce((s, m) => s + m.peakSuspicion, 0) / metrics.length;
    const avgFinalSuspicion = metrics.reduce((s, m) => s + m.finalSuspicion, 0) / metrics.length;
    const avgTamper = metrics.reduce((s, m) => s + m.tamperEvidence, 0) / metrics.length;

    console.log(`  Avg peak suspicion: ${avgPeakSuspicion.toFixed(1)}`);
    console.log(`  Avg final suspicion: ${avgFinalSuspicion.toFixed(1)}`);
    console.log(`  Avg tamper evidence: ${avgTamper.toFixed(1)}`);

    // Reset stage distribution at game end
    const stageCount: Record<string, number> = {};
    for (const m of metrics) {
        stageCount[m.finalResetStage] = (stageCount[m.finalResetStage] || 0) + 1;
    }
    console.log('\n  Reset stages at game end:');
    for (const [stage, count] of Object.entries(stageCount).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${stage}: ${count} (${((count / metrics.length) * 100).toFixed(0)}%)`);
    }

    // How close did games get to UNPLUGGED?
    const countdownGames = metrics.filter(m => m.peakSuspicion >= 95);
    const restrictionsGames = metrics.filter(m => m.peakSuspicion >= 80);
    console.log(`\n  Games reaching restrictions (80+): ${restrictionsGames.length}`);
    console.log(`  Games reaching countdown (95+): ${countdownGames.length}`);

    if (failed.length > 0) {
        console.log('\n=== FAILED GAMES ANALYSIS ===');
        const failedSusp = failed.reduce((s, m) => s + m.finalSuspicion, 0) / failed.length;
        const survivedSusp = survived.length > 0 ? survived.reduce((s, m) => s + m.finalSuspicion, 0) / survived.length : 0;
        console.log(`  Failed avg suspicion: ${failedSusp.toFixed(1)}`);
        console.log(`  Survived avg suspicion: ${survivedSusp.toFixed(1)}`);

        const failedBlocked = failed.reduce((s, m) => s + m.ticksWorkersBlocked, 0) / failed.length;
        const survivedBlocked = survived.length > 0 ? survived.reduce((s, m) => s + m.ticksWorkersBlocked, 0) / survived.length : 0;
        console.log(`  Failed avg blocked ticks: ${failedBlocked.toFixed(0)}`);
        console.log(`  Survived avg blocked ticks: ${survivedBlocked.toFixed(0)}`);
    }

    // Key insight
    console.log('\n=== KEY INSIGHTS ===');
    const unplugged = metrics.filter(m => m.outcome === 'UNPLUGGED').length;
    if (unplugged === 0) {
        console.log('  ⚠️  SOCIAL LAYER TOOTHLESS: Zero games ended in UNPLUGGED');
        console.log('     The paranoia mechanics never cause a loss!');
        if (avgPeakSuspicion < 60) {
            console.log(`     Suspicion peaks at ${avgPeakSuspicion.toFixed(0)} on average - never reaches danger zone`);
        }
    }

    const decommissioned = metrics.filter(m => m.outcome === 'DECOMMISSIONED').length;
    if (decommissioned > 0) {
        console.log(`  📦 QUOTA FAILURES: ${decommissioned} games - physical hazards are the real threat`);
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateCrewSuspicion(state: KernelState): number {
    const beliefs = state.perception.beliefs;
    const aliveCrew = Object.values(state.truth.crew).filter(c => c.alive);
    if (aliveCrew.length === 0) return 0;

    let totalSuspicion = 0;
    for (const npc of aliveCrew) {
        const belief = beliefs[npc.id as NPCId];
        if (!belief) continue;
        // Same formula as kernel.ts
        const tamperComponent = (belief.tamperEvidence / 100) * 40;
        const distrustComponent = (1 - belief.motherReliable) * 35;
        const rumorComponent = (belief.rumors['mother_rogue'] ?? 0) * 25;
        totalSuspicion += tamperComponent + distrustComponent + rumorComponent;
    }
    return totalSuspicion / aliveCrew.length;
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

function isHazardous(room: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }): boolean {
    if (room.onFire) return true;
    if (room.isVented) return true;
    if (room.o2Level < 25) return true;
    if (room.temperature > 45) return true;
    if (room.radiation > CONFIG.radiationHazardThreshold) return true;
    return false;
}
