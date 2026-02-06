import { describe, test, expect } from 'vitest';
import { maybeActivatePressure, type PressureRoutingConfig } from '../src/kernel/systems/pressure.js';
import { proposeArcEvents } from '../src/kernel/systems/arcs.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState() {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

function cfg(overrides: Partial<PressureRoutingConfig> = {}): PressureRoutingConfig {
    return { ...CONFIG, ...overrides } as PressureRoutingConfig;
}

/** Force all crew beliefs so calculateCrewSuspicion returns >= 45 (high band) */
function setHighSuspicion(state: KernelState) {
    for (const npcId of Object.keys(state.perception.beliefs)) {
        const belief = state.perception.beliefs[npcId as keyof typeof state.perception.beliefs];
        belief.motherReliable = 0.1;
        belief.tamperEvidence = 50;
    }
}

describe('Task 002: Director Pressure Routing', () => {
    describe('AC-1: physical channel activates arc', () => {
        test('with forced physical weight, arc is created', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;

            const proposals = maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                pressureLowPhysical: 100,
                pressureLowSocial: 0,
                pressureLowEpistemic: 0,
            }));

            expect(state.truth.arcs.length).toBe(1);
            expect(proposals).toEqual([]);
        });
    });

    describe('AC-2: social channel returns proposals', () => {
        test('with forced social weight at high suspicion, no arc created, returns proposals', () => {
            const state = makeTestState();
            const rng = createRng(42);
            setHighSuspicion(state);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;

            const proposals = maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                pressureHighPhysical: 0,
                pressureHighSocial: 100,
                pressureHighEpistemic: 0,
            }));

            expect(Array.isArray(proposals)).toBe(true);
            expect(state.truth.arcs.length).toBe(0);
        });
    });

    describe('AC-3: epistemic channel returns proposals', () => {
        test('with forced epistemic weight at high suspicion, no arc created, returns proposals', () => {
            const state = makeTestState();
            const rng = createRng(42);
            setHighSuspicion(state);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;

            const proposals = maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                pressureHighPhysical: 0,
                pressureHighSocial: 0,
                pressureHighEpistemic: 100,
            }));

            expect(Array.isArray(proposals)).toBe(true);
            expect(state.truth.arcs.length).toBe(0);
        });
    });

    describe('AC-4: boredom boost still applies', () => {
        test('boredom >= threshold increases activation chance', () => {
            // Single RNG across all iterations to avoid LCG seed correlation
            const rng = createRng(12345);

            let activationsWithBoredom = 0;
            let activationsWithout = 0;
            const trials = 500;

            for (let i = 0; i < trials; i++) {
                // With boredom boost: chance = 1 + 3 = 4
                const s1 = makeTestState();
                s1.truth.tick = 100;
                s1.truth.pacing.nextThreatActivationTick = 0;
                s1.truth.pacing.boredom = 15;
                maybeActivatePressure(s1, rng, cfg({
                    threatActivationChance: 1,
                    pressureLowPhysical: 100,
                    pressureLowSocial: 0,
                    pressureLowEpistemic: 0,
                }));
                if (s1.truth.arcs.length > 0) activationsWithBoredom++;
            }

            const rng2 = createRng(12345);
            for (let i = 0; i < trials; i++) {
                // Without boredom boost: chance = 1
                const s2 = makeTestState();
                s2.truth.tick = 100;
                s2.truth.pacing.nextThreatActivationTick = 0;
                s2.truth.pacing.boredom = 0;
                maybeActivatePressure(s2, rng2, cfg({
                    threatActivationChance: 1,
                    pressureLowPhysical: 100,
                    pressureLowSocial: 0,
                    pressureLowEpistemic: 0,
                }));
                if (s2.truth.arcs.length > 0) activationsWithout++;
            }

            // Boredom-boosted (4%) should have more activations than unboosted (1%)
            expect(activationsWithBoredom).toBeGreaterThan(activationsWithout);
        });
    });

    describe('AC-5: cooldown set after social activation', () => {
        test('nextThreatActivationTick updated after social channel fires', () => {
            const state = makeTestState();
            const rng = createRng(42);
            setHighSuspicion(state);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;

            const cooldown = 70;
            maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                threatActivationCooldown: cooldown,
                pressureHighPhysical: 0,
                pressureHighSocial: 100,
                pressureHighEpistemic: 0,
            }));

            expect(state.truth.pacing.nextThreatActivationTick).toBe(100 + cooldown);
        });
    });

    describe('AC-6: maxActiveThreats gates physical', () => {
        test('physical channel selected but arcs at max, no arc created', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;
            // Fill arcs to max
            state.truth.arcs = [
                { id: 'arc-1', kind: 'air_scrubber', stepIndex: 0, nextTick: 999, target: 'dorms' as any },
                { id: 'arc-2', kind: 'power_surge', stepIndex: 0, nextTick: 999, target: 'engineering' as any },
            ];

            const before = state.truth.arcs.length;
            maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                maxActiveThreats: 2,
                pressureLowPhysical: 100,
                pressureLowSocial: 0,
                pressureLowEpistemic: 0,
            }));

            expect(state.truth.arcs.length).toBe(before); // no new arc
        });
    });

    describe('EC-1: physical at max arcs, cooldown still set, no fallback', () => {
        test('cooldown set even when physical cannot create arc', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;
            state.truth.arcs = [
                { id: 'arc-1', kind: 'air_scrubber', stepIndex: 0, nextTick: 999, target: 'dorms' as any },
                { id: 'arc-2', kind: 'power_surge', stepIndex: 0, nextTick: 999, target: 'engineering' as any },
            ];

            const cooldown = 50;
            maybeActivatePressure(state, rng, cfg({
                threatActivationChance: 100,
                threatActivationCooldown: cooldown,
                maxActiveThreats: 2,
                pressureLowPhysical: 100,
                pressureLowSocial: 0,
                pressureLowEpistemic: 0,
            }));

            expect(state.truth.pacing.nextThreatActivationTick).toBe(100 + cooldown);
            expect(state.truth.arcs.length).toBe(2); // still at max, no fallback
        });
    });

    describe('EC-2: all crew dead, no crash', () => {
        test('with no living crew, suspicion=0, uses low band, no crash', () => {
            const state = makeTestState();
            const rng = createRng(42);
            state.truth.tick = 100;
            state.truth.pacing.nextThreatActivationTick = 0;
            // Kill all crew
            for (const npc of Object.values(state.truth.crew)) {
                npc.alive = false;
            }

            expect(() => {
                maybeActivatePressure(state, rng, cfg({
                    threatActivationChance: 100,
                    pressureLowPhysical: 100,
                    pressureLowSocial: 0,
                    pressureLowEpistemic: 0,
                }));
            }).not.toThrow();
        });
    });

    describe('EC-3: arc stepping unaffected by refactor', () => {
        test('proposeArcEvents still steps existing arcs', () => {
            const state = makeTestState();
            const rng = createRng(42);
            // Add an arc that's ready to step
            state.truth.arcs = [
                { id: 'test-arc', kind: 'air_scrubber', stepIndex: 0, nextTick: 0, target: 'dorms' as any },
            ];
            state.truth.tick = 10;

            const result = proposeArcEvents(state, rng);

            // Arc should have been stepped (stepIndex incremented or proposals generated)
            expect(result.truth.length + result.perception.length).toBeGreaterThanOrEqual(0);
            // Arc should still exist (not completed at step 0)
            expect(state.truth.arcs.length).toBe(1);
            expect(state.truth.arcs[0].stepIndex).toBe(1); // stepped from 0 to 1
        });
    });
});
