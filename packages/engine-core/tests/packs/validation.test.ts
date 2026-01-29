import { describe, it, expect } from 'vitest';
import { validatePack } from '../../src/packs/validation.js';
import type {
  PuzzlePack,
  PuzzlePackManifest,
  PackLoader,
  PackError,
  ValidationError,
} from '../../src/packs/types.js';
import type { V5Puzzle, Card, CardId } from '../../src/types/v5/index.js';

/**
 * Task 008: Pack Types & Validation
 * Tests for PuzzlePack, PackLoader, validatePack
 */
describe('Task 008: Pack Types & Validation', () => {
  // Helper to create a valid minimal puzzle
  function createPuzzle(slug: string): V5Puzzle {
    const card: Card = {
      id: `card_${slug}` as CardId,
      strength: 3,
      evidenceType: 'DIGITAL',
      location: 'Test Location',
      time: '10:00 AM',
      claim: 'Test claim',
      presentLine: 'Test present line',
      isLie: false,
    };

    return {
      slug,
      name: `Puzzle ${slug}`,
      scenario: 'Test scenario',
      knownFacts: ['Fact 1', 'Fact 2'],
      openingLine: 'KOA: Hello',
      target: 50,
      cards: [card],
      lies: [],
      verdicts: {
        flawless: 'Flawless!',
        cleared: 'Cleared.',
        close: 'Close.',
        busted: 'Busted.',
      },
      koaBarks: {},
    };
  }

  // Helper to create a valid pack
  function createValidPack(overrides: Partial<PuzzlePack> = {}): PuzzlePack {
    return {
      version: '1.0.0',
      id: 'test-pack',
      name: 'Test Pack',
      puzzles: [createPuzzle('puzzle-1')],
      ...overrides,
    };
  }

  // ==========================================================================
  // AC-1: PuzzlePack Interface
  // ==========================================================================
  describe('AC-1: PuzzlePack Interface', () => {
    it('should have version (string), id (string), name (string), puzzles (V5Puzzle[])', () => {
      const pack: PuzzlePack = {
        version: '1.0.0',
        id: 'my-pack',
        name: 'My Pack',
        puzzles: [createPuzzle('test')],
      };

      expect(typeof pack.version).toBe('string');
      expect(typeof pack.id).toBe('string');
      expect(typeof pack.name).toBe('string');
      expect(Array.isArray(pack.puzzles)).toBe(true);
    });

    it('should allow multiple puzzles in the pack', () => {
      const pack: PuzzlePack = {
        version: '2.0.0',
        id: 'multi-pack',
        name: 'Multi Pack',
        puzzles: [createPuzzle('puzzle-1'), createPuzzle('puzzle-2'), createPuzzle('puzzle-3')],
      };

      expect(pack.puzzles).toHaveLength(3);
    });
  });

  // ==========================================================================
  // AC-2: PackLoader Interface
  // ==========================================================================
  describe('AC-2: PackLoader Interface', () => {
    it('should have listPacks(): PuzzlePackManifest[], loadPack(id): Result, getPuzzle(packId, slug): Result', () => {
      // Create a mock PackLoader to verify interface
      const loader: PackLoader = {
        listPacks(): PuzzlePackManifest[] {
          return [
            {
              packId: 'test',
              version: '1.0.0',
              puzzleCount: 1,
            },
          ];
        },

        loadPack(packId: string) {
          if (packId === 'test') {
            return { ok: true as const, value: createValidPack() };
          }
          return {
            ok: false as const,
            error: { code: 'PACK_NOT_FOUND' as const, message: 'Not found' },
          };
        },

        getPuzzle(packId: string, slug: string) {
          if (packId === 'test' && slug === 'puzzle-1') {
            return { ok: true as const, value: createPuzzle('puzzle-1') };
          }
          return {
            ok: false as const,
            error: { code: 'PUZZLE_NOT_FOUND' as const, message: 'Not found' },
          };
        },
      };

      // Verify method signatures
      const packs = loader.listPacks();
      expect(Array.isArray(packs)).toBe(true);
      expect(packs[0]?.packId).toBe('test');

      const loadResult = loader.loadPack('test');
      expect(loadResult.ok).toBe(true);

      const puzzleResult = loader.getPuzzle('test', 'puzzle-1');
      expect(puzzleResult.ok).toBe(true);
    });

    it('should return PackError for not found cases', () => {
      const loader: PackLoader = {
        listPacks: () => [],
        loadPack: () => ({
          ok: false as const,
          error: { code: 'PACK_NOT_FOUND' as const, message: 'Pack not found' } as PackError,
        }),
        getPuzzle: () => ({
          ok: false as const,
          error: { code: 'PUZZLE_NOT_FOUND' as const, message: 'Puzzle not found' } as PackError,
        }),
      };

      const loadResult = loader.loadPack('nonexistent');
      expect(loadResult.ok).toBe(false);
      if (!loadResult.ok) {
        expect(loadResult.error.code).toBe('PACK_NOT_FOUND');
      }

      const puzzleResult = loader.getPuzzle('test', 'nonexistent');
      expect(puzzleResult.ok).toBe(false);
      if (!puzzleResult.ok) {
        expect(puzzleResult.error.code).toBe('PUZZLE_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // AC-3: validatePack Accepts Valid Pack
  // ==========================================================================
  describe('AC-3: validatePack Accepts Valid Pack', () => {
    it('should return Result with ok=true for valid pack', () => {
      const pack = createValidPack();
      const result = validatePack(pack);
      expect(result.ok).toBe(true);
    });

    it('should return the validated pack as value', () => {
      const pack = createValidPack();
      const result = validatePack(pack);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(pack);
        expect(result.value.id).toBe('test-pack');
      }
    });

    it('should accept pack with all required fields', () => {
      const pack: PuzzlePack = {
        version: '1.2.3',
        id: 'complete-pack',
        name: 'Complete Pack',
        puzzles: [createPuzzle('p1'), createPuzzle('p2')],
      };

      const result = validatePack(pack);
      expect(result.ok).toBe(true);
    });
  });

  // ==========================================================================
  // AC-4: validatePack Rejects Invalid Pack
  // ==========================================================================
  describe('AC-4: validatePack Rejects Invalid Pack', () => {
    it('should return Result with ok=false for object missing required fields', () => {
      const invalidPack = { version: '1.0.0' }; // Missing id, name, puzzles
      const result = validatePack(invalidPack);
      expect(result.ok).toBe(false);
    });

    it('should return error array with ValidationError objects', () => {
      const invalidPack = { version: '1.0.0' }; // Missing id, name, puzzles
      const result = validatePack(invalidPack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(Array.isArray(result.error)).toBe(true);
        expect(result.error.length).toBeGreaterThan(0);
        result.error.forEach((err: ValidationError) => {
          expect(typeof err.field).toBe('string');
          expect(typeof err.message).toBe('string');
        });
      }
    });
  });

  // ==========================================================================
  // EC-1: validatePack with null input
  // ==========================================================================
  describe('EC-1: validatePack with null input', () => {
    it('should return error with "Pack must not be null or undefined" for null', () => {
      const result = validatePack(null);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e: ValidationError) => e.message.includes('null or undefined'))).toBe(true);
      }
    });

    it('should return error for undefined', () => {
      const result = validatePack(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((e: ValidationError) => e.message.includes('null or undefined'))).toBe(true);
      }
    });
  });

  // ==========================================================================
  // EC-2: validatePack with empty puzzles array
  // ==========================================================================
  describe('EC-2: validatePack with empty puzzles array', () => {
    it('should return ok=true for pack with empty puzzles array', () => {
      const pack = createValidPack({ puzzles: [] });
      const result = validatePack(pack);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.puzzles).toEqual([]);
      }
    });
  });

  // ==========================================================================
  // ERR-1: validatePack missing id field
  // ==========================================================================
  describe('ERR-1: validatePack missing id field', () => {
    it('should return validation error for id field with message "id must be a string"', () => {
      const pack = { version: '1.0.0', name: 'Test', puzzles: [] };
      const result = validatePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const idError = result.error.find((e: ValidationError) => e.field === 'id');
        expect(idError).toBeDefined();
        expect(idError?.message).toBe('id must be a string');
      }
    });

    it('should return error when id is a number instead of string', () => {
      const pack = { version: '1.0.0', id: 123, name: 'Test', puzzles: [] };
      const result = validatePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const idError = result.error.find((e: ValidationError) => e.field === 'id');
        expect(idError).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // ERR-2: validatePack wrong type for puzzles
  // ==========================================================================
  describe('ERR-2: validatePack wrong type for puzzles', () => {
    it('should return validation error for puzzles field with message "puzzles must be an array"', () => {
      const pack = { version: '1.0.0', id: 'test', name: 'Test', puzzles: 'not an array' };
      const result = validatePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const puzzlesError = result.error.find((e: ValidationError) => e.field === 'puzzles');
        expect(puzzlesError).toBeDefined();
        expect(puzzlesError?.message).toBe('puzzles must be an array');
      }
    });

    it('should return error when puzzles is an object instead of array', () => {
      const pack = { version: '1.0.0', id: 'test', name: 'Test', puzzles: {} };
      const result = validatePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const puzzlesError = result.error.find((e: ValidationError) => e.field === 'puzzles');
        expect(puzzlesError).toBeDefined();
      }
    });

    it('should return error when puzzles is null', () => {
      const pack = { version: '1.0.0', id: 'test', name: 'Test', puzzles: null };
      const result = validatePack(pack);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const puzzlesError = result.error.find((e: ValidationError) => e.field === 'puzzles');
        expect(puzzlesError).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Additional: Type exports
  // ==========================================================================
  describe('Type exports', () => {
    it('should export all required types', () => {
      // Verify types exist by using them
      const manifest: PuzzlePackManifest = {
        packId: 'test',
        version: '1.0.0',
        puzzleCount: 5,
        hash: 'abc123',
      };
      expect(manifest.packId).toBe('test');

      const packError: PackError = {
        code: 'LOAD_ERROR',
        message: 'Failed to load',
      };
      expect(packError.code).toBe('LOAD_ERROR');

      const validationError: ValidationError = {
        field: 'test',
        message: 'Test error',
      };
      expect(validationError.field).toBe('test');
    });
  });
});
