import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Task 001: Monorepo Setup
 * Configuration validation tests
 */
describe('Task 001: Monorepo Setup - Configuration', () => {
  const rootDir = join(import.meta.dirname, '../../..');
  const engineCoreDir = join(import.meta.dirname, '..');
  const appDir = join(import.meta.dirname, '../../app');

  /**
   * AC-1: Monorepo Root Configuration
   * Verify root package.json has workspaces
   */
  describe('AC-1: Monorepo root configuration', () => {
    it('should have root package.json with workspaces', () => {
      const pkgPath = join(rootDir, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.workspaces).toEqual(['packages/*']);
    });

    it('should have root tsconfig.json with references', () => {
      const tsconfigPath = join(rootDir, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.references).toContainEqual({ path: './packages/engine-core' });
      expect(tsconfig.references).toContainEqual({ path: './packages/app' });
    });
  });

  /**
   * AC-2: engine-core Package
   * Verify package structure
   */
  describe('AC-2: engine-core package', () => {
    it('should have package.json with correct name', () => {
      const pkgPath = join(engineCoreDir, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('@hsh/engine-core');
    });

    it('should have tsconfig.json', () => {
      const tsconfigPath = join(engineCoreDir, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
    });

    it('should have src/index.ts', () => {
      const indexPath = join(engineCoreDir, 'src/index.ts');
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should have tests directory', () => {
      const testsPath = join(engineCoreDir, 'tests');
      expect(existsSync(testsPath)).toBe(true);
    });
  });

  /**
   * AC-3: app Package
   * Verify package structure
   */
  describe('AC-3: app package', () => {
    it('should have package.json with correct name', () => {
      const pkgPath = join(appDir, 'package.json');
      expect(existsSync(pkgPath)).toBe(true);

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('@hsh/app');
    });

    it('should have vite.config.ts', () => {
      const vitePath = join(appDir, 'vite.config.ts');
      expect(existsSync(vitePath)).toBe(true);
    });

    it('should have src/main.tsx', () => {
      const mainPath = join(appDir, 'src/main.tsx');
      expect(existsSync(mainPath)).toBe(true);
    });

    it('should have public directory', () => {
      const publicPath = join(appDir, 'public');
      expect(existsSync(publicPath)).toBe(true);
    });

    it('should depend on @hsh/engine-core', () => {
      const pkgPath = join(appDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.dependencies['@hsh/engine-core']).toBe('*');
    });
  });

  /**
   * AC-4: TypeScript Strict Mode
   * Verify strict mode is enabled
   */
  describe('AC-4: TypeScript strict mode', () => {
    it('should have strict mode in tsconfig.base.json', () => {
      const tsconfigPath = join(rootDir, 'tsconfig.base.json');
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
      expect(tsconfig.compilerOptions.noImplicitReturns).toBe(true);
      expect(tsconfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
    });
  });

  /**
   * AC-5: Vitest Configured
   * Verify vitest config exists
   */
  describe('AC-5: Vitest configured', () => {
    it('should have vitest.config.ts at root', () => {
      const vitestPath = join(rootDir, 'vitest.config.ts');
      expect(existsSync(vitestPath)).toBe(true);
    });

    it('should have test script in root package.json', () => {
      const pkgPath = join(rootDir, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      expect(pkg.scripts.test).toBeDefined();
    });
  });
});
