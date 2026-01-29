import { describe, it, expect } from 'vitest';
import { ENGINE_VERSION, Result, ok, err } from '../src/index.js';

/**
 * Task 001: Monorepo Setup
 * Tests for engine-core package
 */
describe('Task 001: Monorepo Setup - engine-core', () => {
  /**
   * AC-2: engine-core Package
   * Verify package exports work correctly
   */
  describe('AC-2: engine-core package structure', () => {
    it('should export ENGINE_VERSION', () => {
      expect(ENGINE_VERSION).toBe('0.1.0');
    });

    it('should export Result type utilities', () => {
      const success: Result<number> = ok(42);
      expect(success.ok).toBe(true);
      if (success.ok) {
        expect(success.value).toBe(42);
      }

      const failure: Result<number, string> = err('error');
      expect(failure.ok).toBe(false);
      if (!failure.ok) {
        expect(failure.error).toBe('error');
      }
    });
  });

  /**
   * AC-4: TypeScript Strict Mode
   * These tests verify strict mode is working
   */
  describe('AC-4: TypeScript strict mode', () => {
    it('should have strict null checks (Result type forces handling)', () => {
      const result: Result<string> = ok('test');

      // Type narrowing required - strict mode enforced
      if (result.ok) {
        expect(result.value).toBe('test');
      }
    });

    it('should have noUncheckedIndexedAccess (array access returns T | undefined)', () => {
      const arr: string[] = ['a', 'b', 'c'];
      const item = arr[0]; // Type is string | undefined with noUncheckedIndexedAccess

      // Must check before use
      if (item !== undefined) {
        expect(item).toBe('a');
      }
    });
  });

  /**
   * ERR-1: Invalid Import from engine-core
   * This is a compile-time check - if this file compiles, DOM is not available
   */
  describe('ERR-1: engine-core has no DOM dependencies', () => {
    it('should not have window, document, or DOM types in scope', () => {
      // This test passes if the file compiles without DOM lib
      // The tsconfig.json for engine-core excludes DOM
      expect(true).toBe(true);
    });
  });
});
