/**
 * Task 001: NPC archetypeId Threading
 * Tests that archetypeId flows from cast config to runtime NPC objects.
 */
import { describe, test, expect } from 'vitest';
import { createRng } from '../src/kernel/rng.js';
import { createWorld, createWorldFromConfig, createWorldWithTopology } from '../src/world.js';
import { NPC_ARCHETYPES } from '../src/blueprints/cast/archetypes.js';
import type { NPC } from '../src/types.js';

describe('Task 001: NPC archetypeId Threading', () => {
    // AC-1: archetypeId preserved in createWorldFromConfig
    describe('AC-1: archetypeId preserved in createWorldFromConfig', () => {
        test('every NPC has a valid archetypeId matching the cast config', () => {
            const rng = createRng(42);
            const world = createWorldFromConfig(rng, 'share_house', 'roommates');

            // All NPCs should have archetypeId
            for (const npc of world.npcs) {
                expect(npc.archetypeId).toBeDefined();
                expect(typeof npc.archetypeId).toBe('string');
                expect(npc.archetypeId!.length).toBeGreaterThan(0);
            }

            // Specific mappings from ROOMMATES cast
            const byId = Object.fromEntries(world.npcs.map(n => [n.id, n]));
            expect(byId['alice'].archetypeId).toBe('workaholic');
            expect(byId['bob'].archetypeId).toBe('slacker');
            expect(byId['carol'].archetypeId).toBe('night_owl');
            expect(byId['dan'].archetypeId).toBe('early_bird');
            expect(byId['eve'].archetypeId).toBe('secretive');
        });
    });

    // AC-2: archetypeId preserved in createWorld (legacy)
    describe('AC-2: archetypeId preserved in createWorld (legacy)', () => {
        test('every NPC has an archetypeId mapped from legacy archetype strings', () => {
            const rng = createRng(42);
            const world = createWorld(rng);

            for (const npc of world.npcs) {
                expect(npc.archetypeId).toBeDefined();
                expect(typeof npc.archetypeId).toBe('string');
                expect(npc.archetypeId!.length).toBeGreaterThan(0);
            }
        });
    });

    // AC-3: Backward compatible
    describe('AC-3: NPC without archetypeId compiles', () => {
        test('NPC interface allows missing archetypeId', () => {
            // TypeScript would catch this at compile time, but we verify at runtime
            const npcWithout: NPC = {
                id: 'test',
                name: 'Test',
                role: 'tester',
                schedule: [],
            };
            expect(npcWithout.archetypeId).toBeUndefined();

            const npcWith: NPC = {
                id: 'test2',
                name: 'Test2',
                role: 'tester',
                schedule: [],
                archetypeId: 'workaholic',
            };
            expect(npcWith.archetypeId).toBe('workaholic');
        });
    });

    // EC-1: Archetype lookup
    describe('EC-1: NPC_ARCHETYPES[archetypeId] returns valid data', () => {
        test('all assigned archetypes exist in registry', () => {
            const rng = createRng(42);
            const world = createWorldFromConfig(rng, 'share_house', 'roommates');

            for (const npc of world.npcs) {
                expect(npc.archetypeId).toBeDefined();
                const archetype = NPC_ARCHETYPES[npc.archetypeId!];
                expect(archetype).toBeDefined();
                expect(archetype.id).toBe(npc.archetypeId);
                expect(archetype.witnessReliability).toBeGreaterThanOrEqual(0);
                expect(archetype.witnessReliability).toBeLessThanOrEqual(100);
            }
        });
    });

    // ERR-1: Missing archetypeId
    describe('ERR-1: Missing archetypeId graceful fallback', () => {
        test('NPC without archetypeId does not crash downstream lookups', () => {
            const npc: NPC = {
                id: 'test',
                name: 'Test',
                role: 'tester',
                schedule: [],
            };

            // Downstream code should use optional chaining
            const archetype = npc.archetypeId ? NPC_ARCHETYPES[npc.archetypeId] : undefined;
            expect(archetype).toBeUndefined();
        });
    });
});
