import { describe, test, expect } from 'vitest';
import { proposeEpistemicPressure } from '../src/kernel/systems/pressure.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import type { KernelState, NPCId } from '../src/kernel/types.js';

function makeTestState() {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

function makeSuspicious(state: KernelState, npcId: NPCId, motherReliable = 0.3) {
    const belief = state.perception.beliefs[npcId];
    if (belief) belief.motherReliable = motherReliable;
}

describe('Task 004: Epistemic Event Generators', () => {
    describe('AC-1: sensor_conflict creates low-confidence SENSOR_READING', () => {
        test('generates SENSOR_READING with confidence < 0.6 and conflict message', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'SENSOR_READING') {
                        const reading = (p.event.data as any)?.reading;
                        expect(reading.confidence).toBeLessThan(0.6);
                        expect(
                            reading.message.toLowerCase().includes('conflict') ||
                            reading.message.toLowerCase().includes('inconsistent') ||
                            reading.message.toLowerCase().includes('discrepancy') ||
                            reading.message.toLowerCase().includes('contradicts')
                        ).toBe(true);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-2: sensor_conflict creates ActiveDoubt', () => {
        test('doubt deferred in event.data with severity 1, resolved=false', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'SENSOR_READING') {
                        const doubt = (p.event.data as any)?.pressureDoubt;
                        if (doubt && doubt.severity === 1 && !doubt.resolved && doubt.createdTick === 50) {
                            expect(doubt.topic).toBeTruthy();
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-3: audit_prompt creates broadcast COMMS_MESSAGE', () => {
        test('audit_prompt generates broadcast from suspicious crew about checking logs', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                makeSuspicious(state, 'engineer');
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'COMMS_MESSAGE') {
                        const msg = (p.event.data as any)?.message;
                        if (msg?.kind === 'broadcast' && (
                            msg?.text?.toLowerCase().includes('log') ||
                            msg?.text?.toLowerCase().includes('check') ||
                            msg?.text?.toLowerCase().includes('audit') ||
                            msg?.text?.toLowerCase().includes('look')
                        )) {
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-4: audit_prompt creates ActiveDoubt with severity 2', () => {
        test('doubt deferred in event.data with severity 2', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                makeSuspicious(state, 'engineer');
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);

                for (const p of proposals) {
                    const doubt = (p.event.data as any)?.pressureDoubt;
                    if (doubt && doubt.severity === 2 && !doubt.resolved && doubt.createdTick === 50) {
                        expect(doubt.topic).toBeTruthy();
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-5: doubt_voiced creates log COMMS_MESSAGE', () => {
        test('doubt_voiced uses kind=log with doubt text', () => {
            const rng = createRng(42);
            let found = false;
            for (let i = 0; i < 50; i++) {
                const state = makeTestState();
                state.truth.tick = 50;
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'COMMS_MESSAGE') {
                        const msg = (p.event.data as any)?.message;
                        if (msg?.kind === 'log') {
                            expect(msg.text).toBeTruthy();
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-6: doubt_voiced applies +3 suspicion', () => {
        test('proposal carries deferred suspicion change with delta +3', () => {
            const rng = createRng(42);
            let found = false;
            for (let i = 0; i < 50; i++) {
                const state = makeTestState();
                state.truth.tick = 50;
                const proposals = proposeEpistemicPressure(state, rng);

                for (const p of proposals) {
                    const ps = (p.event.data as any)?.pressureSuspicion;
                    if (ps && ps.reason === 'DOUBT_VOICED' && ps.delta === 3) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('AC-7: epistemic events have uncertainty tag', () => {
        test('all epistemic proposals include uncertainty tag', () => {
            let checked = 0;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                makeSuspicious(state, 'engineer');
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    expect(p.tags).toContain('uncertainty');
                    checked++;
                }
            }
            expect(checked).toBeGreaterThan(0);
        });
    });

    describe('EC-1: sensor_conflict with crew in one room', () => {
        test('sensor_conflict still generates when all crew in same room', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                // Move all crew to same room
                for (const npc of Object.values(state.truth.crew)) {
                    npc.place = 'bridge' as any;
                }
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'SENSOR_READING') {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('EC-2: sensor_conflict during blackout', () => {
        test('sensor_conflict still generates during blackout', () => {
            let found = false;
            for (let seed = 0; seed < 50; seed++) {
                const state = makeTestState();
                state.truth.tick = 50;
                state.truth.station.blackoutTicks = 10;
                const rng = createRng(seed);
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    if (p.event.type === 'SENSOR_READING') {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            expect(found).toBe(true);
        });
    });

    describe('EC-3: doubt phrases vary across calls', () => {
        test('at least 4 distinct doubt phrases across multiple generations', () => {
            const phrases = new Set<string>();
            const rng = createRng(42);
            for (let i = 0; i < 100; i++) {
                const state = makeTestState();
                state.truth.tick = 50;
                const proposals = proposeEpistemicPressure(state, rng);
                for (const p of proposals) {
                    const msg = (p.event.data as any)?.message;
                    if (msg?.kind === 'log') {
                        phrases.add(msg.text);
                    }
                }
            }
            expect(phrases.size).toBeGreaterThanOrEqual(4);
        });
    });
});
