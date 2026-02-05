/**
 * Debug solver for a specific seed
 */

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel, type Command } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';
import type { KernelState } from '../src/kernel/types.js';
import type { PlaceId, NPCId } from '../src/core/types.js';

const SEED = parseInt(process.argv[2] || '1030', 10);

const rng = createRng(SEED);
const world = createWorld(rng);
const state = createInitialState(world, CONFIG.quotaPerDay);

console.log(`\n=== DEBUG SOLVER SEED ${SEED} ===\n`);

while (!state.truth.ending) {
    const tick = state.truth.tick;
    const truth = state.truth;

    // Check for fires
    const fires = Object.entries(truth.rooms).filter(([_, r]) => r.onFire).map(([id, _]) => id);
    const blocked = Object.entries(truth.rooms).filter(([_, r]) => isHazardous(r)).map(([id, _]) => id);

    // Solver decides
    const commands = solverDecide(state);

    // Log important events
    const isW2Start = tick >= 1040 && tick <= 1055;
    if (fires.length > 0 || commands.length > 0 || tick % 240 === 0 || isW2Start) {
        const mess = truth.rooms['mess'];
        console.log(`[T${tick} D${truth.day} ${truth.window}] Cargo: ${truth.dayCargo}/${CONFIG.quotaPerDay} | Power:${truth.station.power} | Mess O2:${mess.o2Level}`);
        if (fires.length > 0) console.log(`  FIRES: ${fires.join(', ')}`);
        if (blocked.length > 0) console.log(`  BLOCKED: ${blocked.join(', ')}`);
        if (commands.length > 0) console.log(`  COMMANDS: ${commands.map(c => JSON.stringify(c)).join(', ')}`);

        const spec = truth.crew['specialist'];
        const rough = truth.crew['roughneck'];
        // Check why orders might not issue
        if (truth.window === 'W2' && commands.length === 0) {
            const specPath = getPathToMines(spec.place);
            const specBlocked = specPath.find(roomId => isHazardous(truth.rooms[roomId]));
            console.log(`  NO ORDERS! Spec at ${spec.place}, path blocked by: ${specBlocked || 'NONE'}`);
            if (specBlocked) {
                const r = truth.rooms[specBlocked];
                console.log(`    ${specBlocked}: O2=${r.o2Level} temp=${r.temperature} rad=${r.radiation} vented=${r.isVented} fire=${r.onFire}`);
            }
        }
        console.log(`  Spec: ${spec.place}, Rough: ${rough.place}`);
        console.log('');
    }

    stepKernel(state, commands, rng);

    if (state.truth.tick > TICKS_PER_DAY * 6) {
        state.truth.ending = 'TIMEOUT';
    }
}

console.log(`\n=== RESULT: ${state.truth.ending} ===\n`);

function solverDecide(state: KernelState): Command[] {
    const commands: Command[] = [];
    const truth = state.truth;

    const specialist = truth.crew['specialist'];
    const roughneck = truth.crew['roughneck'];

    // Find what's blocking workers from reaching mines
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
        // Check if any sealed room has low O2 blocking paths
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

    // Use PURGE_AIR to speed up O2 recovery if needed
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

function isHazardous(room: { o2Level: number; temperature: number; radiation: number; isVented: boolean; onFire: boolean }): boolean {
    if (room.onFire) return true;
    if (room.isVented) return true;
    if (room.o2Level < 25) return true;
    if (room.temperature > 45) return true;
    if (room.radiation > CONFIG.radiationHazardThreshold) return true;
    return false;
}
