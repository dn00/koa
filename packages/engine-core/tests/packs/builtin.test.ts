/**
 * Tests for Task 009: Builtin Pack & Loader
 *
 * Test count verification:
 * - 3 ACs + 1 EC + 1 ERR = 5 test blocks
 */

import { describe, it, expect } from 'vitest';
import {
  BUILTIN_PACK,
  createBuiltinLoader,
  type PackLoader,
} from '../../src/packs/index.js';
import { validatePack } from '../../src/packs/validation.js';

describe('Task 009: Builtin Pack & Loader', () => {
  describe('AC-1: BUILTIN_PACK Exported', () => {
    it('should have id "builtin-v5"', () => {
      expect(BUILTIN_PACK.id).toBe('builtin-v5');
    });

    it('should have version "1.0.0"', () => {
      expect(BUILTIN_PACK.version).toBe('1.0.0');
    });

    it('should have name "V5 Core Puzzles"', () => {
      expect(BUILTIN_PACK.name).toBe('V5 Core Puzzles');
    });

    it('should have puzzles array', () => {
      expect(Array.isArray(BUILTIN_PACK.puzzles)).toBe(true);
      expect(BUILTIN_PACK.puzzles.length).toBeGreaterThan(0);
    });

    it('should validate via validatePack', () => {
      const result = validatePack(BUILTIN_PACK);
      expect(result.ok).toBe(true);
    });
  });

  describe('AC-2: createBuiltinLoader Returns PackLoader', () => {
    it('should return object with listPacks method', () => {
      const loader = createBuiltinLoader();
      expect(typeof loader.listPacks).toBe('function');
    });

    it('should return object with loadPack method', () => {
      const loader = createBuiltinLoader();
      expect(typeof loader.loadPack).toBe('function');
    });

    it('should return object with getPuzzle method', () => {
      const loader = createBuiltinLoader();
      expect(typeof loader.getPuzzle).toBe('function');
    });
  });

  describe('AC-3: Builtin Loader listPacks Returns Manifest', () => {
    it('should return array with one manifest', () => {
      const loader = createBuiltinLoader();
      const manifests = loader.listPacks();
      expect(manifests).toHaveLength(1);
    });

    it('should have manifest for builtin-v5', () => {
      const loader = createBuiltinLoader();
      const manifests = loader.listPacks();
      expect(manifests[0].id).toBe('builtin-v5');
    });

    it('should include pack metadata in manifest', () => {
      const loader = createBuiltinLoader();
      const manifests = loader.listPacks();
      expect(manifests[0].name).toBe('V5 Core Puzzles');
      expect(manifests[0].version).toBe('1.0.0');
    });

    it('should include puzzle count in manifest', () => {
      const loader = createBuiltinLoader();
      const manifests = loader.listPacks();
      expect(manifests[0].puzzleCount).toBe(BUILTIN_PACK.puzzles.length);
    });
  });

  describe('EC-1: getPuzzle with non-existent slug', () => {
    it('should return Result with ok=false for non-existent slug', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('builtin-v5', 'non-existent-slug');
      expect(result.ok).toBe(false);
    });

    it('should return error with code PUZZLE_NOT_FOUND', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('builtin-v5', 'non-existent-slug');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PUZZLE_NOT_FOUND');
      }
    });

    it('should include slug in error message', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('builtin-v5', 'non-existent-slug');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('non-existent-slug');
      }
    });
  });

  describe('ERR-1: loadPack with wrong packId', () => {
    it('should return Result with ok=false', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('wrong-id');
      expect(result.ok).toBe(false);
    });

    it('should return error with code PACK_NOT_FOUND', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('wrong-id');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PACK_NOT_FOUND');
      }
    });

    it('should have message "Pack \'wrong-id\' not found"', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('wrong-id');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Pack 'wrong-id' not found");
      }
    });
  });

  describe('Additional: loadPack with correct packId', () => {
    it('should return Result with ok=true for builtin-v5', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('builtin-v5');
      expect(result.ok).toBe(true);
    });

    it('should return the BUILTIN_PACK', () => {
      const loader = createBuiltinLoader();
      const result = loader.loadPack('builtin-v5');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(BUILTIN_PACK);
      }
    });
  });

  describe('Additional: getPuzzle with valid slug', () => {
    it('should return puzzle when slug exists', () => {
      const loader = createBuiltinLoader();
      // Use first puzzle's slug
      const firstPuzzle = BUILTIN_PACK.puzzles[0];
      const result = loader.getPuzzle('builtin-v5', firstPuzzle.slug);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.slug).toBe(firstPuzzle.slug);
      }
    });

    it('should return PACK_NOT_FOUND for wrong packId when getting puzzle', () => {
      const loader = createBuiltinLoader();
      const result = loader.getPuzzle('wrong-pack', 'any-slug');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('PACK_NOT_FOUND');
      }
    });
  });
});
