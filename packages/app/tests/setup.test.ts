import { describe, it, expect } from 'vitest';
import { ENGINE_VERSION, ok, err, type Result } from '@hsh/engine-core';

/**
 * Task 001: Monorepo Setup
 * Tests for app package and cross-package imports
 */
describe('Task 001: Monorepo Setup - app', () => {
  /**
   * AC-6: Cross-Package Import
   * Verify @hsh/engine-core can be imported from app
   */
  describe('AC-6: Cross-package import', () => {
    it('should import ENGINE_VERSION from @hsh/engine-core', () => {
      expect(ENGINE_VERSION).toBe('0.1.0');
    });

    it('should import and use Result type from @hsh/engine-core', () => {
      const success: Result<string> = ok('from engine-core');
      expect(success.ok).toBe(true);
      if (success.ok) {
        expect(success.value).toBe('from engine-core');
      }
    });

    it('should import err helper from @hsh/engine-core', () => {
      const failure: Result<never, string> = err('test error');
      expect(failure.ok).toBe(false);
      if (!failure.ok) {
        expect(failure.error).toBe('test error');
      }
    });
  });

  /**
   * EC-1: Path Alias Resolution
   * Verify @hsh/engine-core resolves correctly in tests (Vitest)
   */
  describe('EC-1: Path alias resolution', () => {
    it('should resolve @hsh/engine-core path alias', () => {
      // If this test runs without import errors, path alias works
      expect(typeof ENGINE_VERSION).toBe('string');
    });
  });
});
