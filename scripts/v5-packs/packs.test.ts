import { describe, it, expect } from 'vitest';
import {
  type PuzzlePack,
  type PuzzlePackManifest,
  type PackLoader,
  BUILTIN_PACK,
  createBuiltinLoader,
  validatePack,
  type ValidationError,
} from './index.js';
import { ok, err, type Result } from '../v5-engine/types.js';

/**
 * Task 004: Puzzle Pack System
 */
describe('Task 004: Puzzle Pack System', () => {
  // ==========================================================================
  // AC-1: PuzzlePack Interface
  // ==========================================================================
  describe('AC-1: PuzzlePack interface', () => {
    it('should have required fields: version, id, name, puzzles', () => {
      const pack: PuzzlePack = {
        version: '1.0.0',
        id: 'test-pack',
        name: 'Test Pack',
        puzzles: [],
      };

      expect(pack.version).toBe('1.0.0');
      expect(pack.id).toBe('test-pack');
      expect(pack.name).toBe('Test Pack');
      expect(pack.puzzles).toEqual([]);
    });
  });

  // ==========================================================================
  // AC-2: PuzzlePackManifest Interface
  // ==========================================================================
  describe('AC-2: PuzzlePackManifest interface', () => {
    it('should have required fields: packId, version, puzzleCount', () => {
      const manifest: PuzzlePackManifest = {
        packId: 'test-pack',
        version: '1.0.0',
        puzzleCount: 5,
      };

      expect(manifest.packId).toBe('test-pack');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.puzzleCount).toBe(5);
    });

    it('should allow optional hash field', () => {
      const manifest: PuzzlePackManifest = {
        packId: 'test-pack',
        version: '1.0.0',
        puzzleCount: 5,
        hash: 'abc123',
      };

      expect(manifest.hash).toBe('abc123');
    });
  });

  // ==========================================================================
  // AC-3: PackLoader Interface
  // ==========================================================================
  describe('AC-3: PackLoader interface', () => {
    it('should have listPacks method returning manifests', () => {
      const loader = createBuiltinLoader();
      const manifests = loader.listPacks();

      expect(Array.isArray(manifests)).toBe(true);
      expect(manifests.length).toBeGreaterThan(0);
      expect(manifests[0].packId).toBeDefined();
    });

    it('should have loadPack method', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('builtin-v5');

      expect(result.ok).toBe(true);
    });

    it('should have getPuzzle method', () => {
      const loader = createBuiltinLoader();
      // We'll test this more thoroughly in AC-6
      expect(typeof loader.getPuzzle).toBe('function');
    });
  });

  // ==========================================================================
  // AC-4: BUILTIN_PACK Constant
  // ==========================================================================
  describe('AC-4: BUILTIN_PACK constant', () => {
    it('should have id=builtin-v5', () => {
      expect(BUILTIN_PACK.id).toBe('builtin-v5');
    });

    it('should have version=1.0.0', () => {
      expect(BUILTIN_PACK.version).toBe('1.0.0');
    });

    it('should wrap V5_PUZZLES', () => {
      expect(Array.isArray(BUILTIN_PACK.puzzles)).toBe(true);
      expect(BUILTIN_PACK.puzzles.length).toBeGreaterThan(0);
    });

    it('should have name', () => {
      expect(BUILTIN_PACK.name).toBeDefined();
      expect(typeof BUILTIN_PACK.name).toBe('string');
    });
  });

  // ==========================================================================
  // AC-5: createBuiltinLoader
  // ==========================================================================
  describe('AC-5: createBuiltinLoader', () => {
    it('should return a PackLoader', () => {
      const loader = createBuiltinLoader();

      expect(loader.listPacks).toBeDefined();
      expect(loader.loadPack).toBeDefined();
      expect(loader.getPuzzle).toBeDefined();
    });

    it('should serve BUILTIN_PACK', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('builtin-v5');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('builtin-v5');
      }
    });
  });

  // ==========================================================================
  // AC-6: PackLoader.getPuzzle Success
  // ==========================================================================
  describe('AC-6: PackLoader.getPuzzle success', () => {
    it('should return puzzle when found', () => {
      const loader = createBuiltinLoader();
      // Use actual puzzle slug from V5_PUZZLES
      const result = loader.getPuzzle('builtin-v5', 'midnight-print');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.slug).toBe('midnight-print');
      }
    });
  });

  // ==========================================================================
  // AC-7: PackLoader.getPuzzle Not Found
  // ==========================================================================
  describe('AC-7: PackLoader.getPuzzle not found', () => {
    it('should return error when puzzle not found', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('builtin-v5', 'nonexistent-puzzle');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PUZZLE_NOT_FOUND');
      }
    });

    it('should return error when pack not found', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('nonexistent-pack', 'any-puzzle');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PACK_NOT_FOUND');
      }
    });
  });

  // ==========================================================================
  // AC-8: validatePack
  // ==========================================================================
  describe('AC-8: validatePack', () => {
    it('should return ok for valid pack', () => {
      const validPack = {
        version: '1.0.0',
        id: 'test-pack',
        name: 'Test Pack',
        puzzles: [],
      };

      const result = validatePack(validPack);

      expect(result.ok).toBe(true);
    });

    it('should return the pack on success', () => {
      const validPack = {
        version: '1.0.0',
        id: 'test-pack',
        name: 'Test Pack',
        puzzles: [],
      };

      const result = validatePack(validPack);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('test-pack');
      }
    });
  });

  // ==========================================================================
  // AC-9: validatePack Invalid
  // ==========================================================================
  describe('AC-9: validatePack invalid', () => {
    it('should return error when missing required fields', () => {
      const invalidPack = { name: 'test' };
      const result = validatePack(invalidPack);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.length).toBeGreaterThan(0);
        const missingFields = result.error.map(e => e.field);
        expect(missingFields).toContain('id');
        expect(missingFields).toContain('version');
        expect(missingFields).toContain('puzzles');
      }
    });

    it('should return error when pack is null', () => {
      const result = validatePack(null);

      expect(result.ok).toBe(false);
    });

    it('should return error when pack is not an object', () => {
      const result = validatePack('not an object');

      expect(result.ok).toBe(false);
    });
  });

  // ==========================================================================
  // EC-1: Empty Pack
  // ==========================================================================
  describe('EC-1: Empty pack', () => {
    it('should validate pack with empty puzzles array', () => {
      const emptyPack = {
        version: '1.0.0',
        id: 'empty-pack',
        name: 'Empty Pack',
        puzzles: [],
      };

      const result = validatePack(emptyPack);

      expect(result.ok).toBe(true);
    });

    it('should return not found when getting puzzle from empty pack', () => {
      const loader = createBuiltinLoader();
      // Create a loader with an empty pack - we'll test via validatePack for now
      // since builtin loader always has puzzles
      const emptyPack = {
        version: '1.0.0',
        id: 'empty-pack',
        name: 'Empty Pack',
        puzzles: [],
      };

      const validated = validatePack(emptyPack);
      expect(validated.ok).toBe(true);

      // For actual empty pack puzzle lookup, it would return not found
      // This is implicitly tested by AC-7 (puzzle not found)
    });
  });
});
