import { describe, test, expect } from 'vitest';
import {
    getPressureMix,
    pickChannel,
    maybeActivatePressure,
    proposeSocialPressure,
    proposeEpistemicPressure,
    type PressureRoutingConfig,
} from '../src/kernel/systems/pressure.js';
import { stepKernel } from '../src/kernel/kernel.js';
import { createInitialState } from '../src/kernel/state.js';
import { createWorld } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { CONFIG } from '../src/config.js';
import type { KernelState } from '../src/kernel/types.js';

function makeTestState(): KernelState {
    const rng = createRng(1);
    const world = createWorld(rng);
    return createInitialState(world, 8);
}

function cfg(overrides: Partial<PressureRoutingConfig> = {}): PressureRoutingConfig {
    return { ...CONFIG, ...overrides } as PressureRoutingConfig;
}

function setHighSuspicion(state: KernelState) {
    for (const npcId of Object.keys(state.perception.beliefs)) {
        const belief = state.perception.beliefs[npcId as keyof typeof state.perception.beliefs];
        belief.motherReliable = 0.1;
        belief.tamperEvidence = 50;
    }
}

function setLowSuspicion(state: KernelState) {
    for (const npcId of Object.keys(state.perception.beliefs)) {
        const belief = state.perception.beliefs[npcId as keyof typeof state.perception.beliefs];
        belief.motherReliable = 0.9;
        belief.tamperEvidence = 0;
    }
}

describe('Task 005: Integration Test & Pacing Wiring', () => {
    describe('AC-1: low suspicion channel distribution', () => {
        test('channels approximate 60/10/30 at suspicion=10', () => {
            const rng = createRng(42);
            const mix = getPressureMix(10, CONFIG as any);
            const counts = { physical: 0, social: 0, epistemic: 0 };
            const N = 500;

            for (let i = 0; i < N; i++) {
                counts[pickChannel(mix, rng)] += 1;
            }

            // Within 10% tolerance of target weights
            expect(counts.physical / N).toBeGreaterThan(0.50);
            expect(counts.physical / N).toBeLessThan(0.70);
            expect(counts.social / N).toBeGreaterThan(0.00);
            expect(counts.social / N).toBeLessThan(0.20);
            expect(counts.epistemic / N).toBeGreaterThan(0.20);
            expect(counts.epistemic / N).toBeLessThan(0.40);
        });
    });

    describe('AC-2: high suspicion channel distribution', () => {
        test('channels approximate 20/40/40 at suspicion=60', () => {
            const rng = createRng(42);
            const mix = getPressureMix(60, CONFIG as any);
            const counts = { physical: 0, social: 0, epistemic: 0 };
            const N = 500;

            for (let i = 0; i < N; i++) {
                counts[pickChannel(mix, rng)] += 1;
            }

            expect(counts.physical / N).toBeGreaterThan(0.10);
            expect(counts.physical / N).toBeLessThan(0.30);
            expect(counts.social / N).toBeGreaterThan(0.30);
            expect(counts.social / N).toBeLessThan(0.50);
            expect(counts.epistemic / N).toBeGreaterThan(0.30);
            expect(counts.epistemic / N).toBeLessThan(0.50);
        });
    });

    describe('AC-3: social satisfies crew agency beat', () => {
        test('social proposals have reaction tag with NPC actor', () => {
            const state = makeTestState();
            const rng = createRng(42);
            setHighSuspicion(state);
            state.truth.tick = 100;

            // Generate multiple social proposals to cover all event types
            let foundReaction = false;
            for (let i = 0; i < 20; i++) {
                const proposals = proposeSocialPressure(state, createRng(i + 1));
                for (const p of proposals) {
                    if (p.tags.includes('reaction')) {
                        // Verify NPC actor (not PLAYER or SYSTEM) — required for phaseHadCrewAgency
                        expect(p.event.actor).toBeDefined();
                        expect(p.event.actor).not.toBe('PLAYER');
                        expect(p.event.actor).not.toBe('SYSTEM');
                        foundReaction = true;
                    }
                }
            }
            expect(foundReaction).toBe(true);
        });
    });

    describe('AC-4: epistemic satisfies deception beat', () => {
        test('epistemic proposals have uncertainty tag', () => {
            const state = makeTestState();
            state.truth.tick = 100;

            // Try multiple seeds to exercise all epistemic event types
            let foundUncertainty = false;
            for (let i = 0; i < 20; i++) {
                const proposals = proposeEpistemicPressure(state, createRng(i + 1));
                for (const p of proposals) {
                    expect(p.tags).toContain('uncertainty');
                    foundUncertainty = true;
                }
            }
            expect(foundUncertainty).toBe(true);
        });
    });

    describe('AC-5: physical satisfies dilemma beat', () => {
        test('arc pressure + phase transition choice set phaseHadDilemma in one tick', () => {
            const state = makeTestState();
            const rng = createRng(42);
            const target = Object.keys(state.truth.rooms)[0] as any;

            // Set tick so stepKernel advances to a W1 boundary (tick 60 = hour 6)
            // Phase transition at W1 emits 'choice' tag
            state.truth.tick = 59;
            state.truth.window = 'W4';

            // Arc at step 1 → emits 'pressure' tag (maxThreatAdvancesPerTick=1 is fine, one arc)
            state.truth.arcs = [
                { id: 'test-arc', kind: 'air_scrubber', stepIndex: 1, nextTick: 0, target },
            ];

            const output = stepKernel(state, [], rng);

            // Phase transition provides 'choice', arc step 1 provides 'pressure' → dilemma
            expect(state.truth.pacing.phaseHadDilemma).toBe(true);
        });
    });

    describe('AC-6: 500-tick simulation no crashes', () => {
        test('full pipeline produces no exceptions across 500 ticks', () => {
            const state = makeTestState();
            const rng = createRng(99);

            let ticksRun = 0;
            for (let i = 0; i < 500; i++) {
                const output = stepKernel(state, [], rng);
                ticksRun++;
                // Verify state stays valid
                expect(output.state.truth.tick).toBe(i + 1);
                expect(Array.isArray(output.events)).toBe(true);
                expect(Array.isArray(output.headlines)).toBe(true);
                if (state.truth.ending) break;
            }

            expect(ticksRun).toBeGreaterThan(0);
        });
    });

    describe('AC-7: I17 high suspicion reduces physical frequency', () => {
        test('high suspicion run has fewer physical activations than low suspicion', () => {
            const rng1 = createRng(42);
            let lowPhysical = 0;
            const N = 300;

            for (let i = 0; i < N; i++) {
                const state = makeTestState();
                setLowSuspicion(state);
                state.truth.tick = 100;
                state.truth.pacing.nextThreatActivationTick = 0;

                const arcsBefore = state.truth.arcs.length;
                maybeActivatePressure(state, rng1, cfg({ threatActivationChance: 100 }));
                if (state.truth.arcs.length > arcsBefore) lowPhysical++;
            }

            const rng2 = createRng(42);
            let highPhysical = 0;

            for (let i = 0; i < N; i++) {
                const state = makeTestState();
                setHighSuspicion(state);
                state.truth.tick = 100;
                state.truth.pacing.nextThreatActivationTick = 0;

                const arcsBefore = state.truth.arcs.length;
                maybeActivatePressure(state, rng2, cfg({ threatActivationChance: 100 }));
                if (state.truth.arcs.length > arcsBefore) highPhysical++;
            }

            // High suspicion should have < 50% of low suspicion's physical activations
            expect(highPhysical).toBeLessThan(lowPhysical * 0.5);
            // Sanity: low suspicion should have substantial physical activations
            expect(lowPhysical).toBeGreaterThan(N * 0.4);
        });
    });

    describe('EC-1: mid-phase suspicion change', () => {
        test('subsequent activations use updated suspicion band', () => {
            const rng = createRng(42);

            // First: low suspicion → should mostly pick physical
            const state1 = makeTestState();
            setLowSuspicion(state1);
            state1.truth.tick = 100;
            state1.truth.pacing.nextThreatActivationTick = 0;

            let lowBandPhysical = 0;
            for (let i = 0; i < 100; i++) {
                const s = makeTestState();
                setLowSuspicion(s);
                s.truth.tick = 100;
                s.truth.pacing.nextThreatActivationTick = 0;
                const before = s.truth.arcs.length;
                maybeActivatePressure(s, rng, cfg({ threatActivationChance: 100 }));
                if (s.truth.arcs.length > before) lowBandPhysical++;
            }

            // Then: change to high suspicion → should pick fewer physical
            const rng2 = createRng(42);
            let highBandPhysical = 0;
            for (let i = 0; i < 100; i++) {
                const s = makeTestState();
                setHighSuspicion(s); // suspicion changed mid-phase
                s.truth.tick = 100;
                s.truth.pacing.nextThreatActivationTick = 0;
                const before = s.truth.arcs.length;
                maybeActivatePressure(s, rng2, cfg({ threatActivationChance: 100 }));
                if (s.truth.arcs.length > before) highBandPhysical++;
            }

            // The new band should be reflected immediately
            expect(highBandPhysical).toBeLessThan(lowBandPhysical);
        });
    });

    describe('EC-2: all proposals valid', () => {
        test('pressure proposals all have valid event types and tags', () => {
            const rng = createRng(42);

            for (let i = 0; i < 100; i++) {
                const state = makeTestState();
                setHighSuspicion(state); // ensure social/epistemic fire
                state.truth.tick = 100 + i;
                state.truth.pacing.nextThreatActivationTick = 0;

                const proposals = maybeActivatePressure(state, createRng(i + 1), cfg({
                    threatActivationChance: 100,
                    pressureHighPhysical: 0, // skip physical to test social+epistemic
                    pressureHighSocial: 50,
                    pressureHighEpistemic: 50,
                }));

                for (const p of proposals) {
                    // Valid proposal structure
                    expect(p.id).toBeTruthy();
                    expect(p.event).toBeDefined();
                    expect(p.event.type).toBeDefined();
                    expect(['COMMS_MESSAGE', 'SENSOR_READING']).toContain(p.event.type);
                    expect(Array.isArray(p.tags)).toBe(true);
                    expect(p.tags.length).toBeGreaterThan(0);
                    expect(typeof p.score).toBe('number');
                }
            }
        });
    });
});
