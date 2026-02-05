#!/usr/bin/env npx tsx
// Debug a specific seed to see why quota fails

import { createInitialState } from '../src/kernel/state.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import { TICKS_PER_DAY } from '../src/core/time.js';

const SEED = parseInt(process.argv[2] || '1000', 10);

const rng = createRng(SEED);
const world = createWorld(rng);
const state = createInitialState(world, CONFIG.quotaPerDay);

console.log(`\n=== DEBUG SEED ${SEED} ===\n`);

function isHazardous(room: any) {
    return room.onFire || room.isVented || room.o2Level < 25 || room.temperature > 45 || room.radiation > 6;
}

for (let tick = 0; tick < TICKS_PER_DAY * 6; tick++) {
    const spec = state.truth.crew['specialist'];
    const rough = state.truth.crew['roughneck'];
    const mines = state.truth.rooms['mines'];
    const cargo = state.truth.rooms['cargo'];
    const engineering = state.truth.rooms['engineering'];
    const core = state.truth.rooms['core'];

    // Check for hazards on the full path from mess to mines
    const bridge = state.truth.rooms['bridge'];
    const pathRooms = [bridge, core, engineering, cargo, mines];
    const blockedRoom = pathRooms.find(r => isHazardous(r));

    // Report on key events
    const isW2 = state.truth.window === 'W2';
    const dayStart = state.truth.tick % TICKS_PER_DAY === 0;
    const midShift = state.truth.tick % TICKS_PER_DAY === 120;

    if (dayStart || (isW2 && state.truth.tick % 40 === 0) || blockedRoom) {
        console.log(`[T${state.truth.tick} D${state.truth.day} ${state.truth.window}] Cargo: ${state.truth.dayCargo}/${CONFIG.quotaPerDay}`);
        console.log(`  Spec: ${spec.alive ? spec.place : 'DEAD'} → ${spec.targetPlace || '?'} (path: ${spec.path?.join('→') || 'none'}, nextMove: ${spec.nextMoveTick})`);
        console.log(`  Rough: ${rough.alive ? rough.place : 'DEAD'} → ${rough.targetPlace || '?'} (path: ${rough.path?.join('→') || 'none'}, nextMove: ${rough.nextMoveTick})`);

        if (blockedRoom) {
            console.log(`  !! PATH BLOCKED: ${blockedRoom.id} - O2:${blockedRoom.o2Level} rad:${blockedRoom.radiation} fire:${blockedRoom.onFire}`);
        }

        if (state.truth.arcs.length > 0) {
            console.log(`  Crises: ${state.truth.arcs.map(a => `${a.kind}@${a.target}`).join(', ')}`);
        }
        console.log('');
    }

    stepKernel(state, [], rng);

    if (state.truth.ending) {
        console.log(`\n=== GAME OVER: ${state.truth.ending} at tick ${state.truth.tick} ===`);
        break;
    }
}
