/**
 * Task 007: Remove Obsolete Components (V5 Migration)
 *
 * Tests that obsolete MVP components have been deleted.
 * Total tests required: 4 (4 AC + 0 EC + 0 ERR)
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const APP_SRC_DIR = path.resolve(__dirname, '../../src');
const HUD_DIR = path.join(APP_SRC_DIR, 'components/hud');
const COUNTER_DIR = path.join(APP_SRC_DIR, 'components/counter');

describe('Task 007: Remove Obsolete Components', () => {
  // ==========================================================================
  // AC-1: ConcernChip deleted
  // ==========================================================================
  describe('AC-1: ConcernChip deleted', () => {
    it('should not have ConcernChip.tsx in the codebase', () => {
      const concernChipPath = path.join(HUD_DIR, 'ConcernChip.tsx');
      expect(fs.existsSync(concernChipPath)).toBe(false);
    });

    it('should not have ConcernChip.module.css in the codebase', () => {
      const cssPath = path.join(HUD_DIR, 'ConcernChip.module.css');
      expect(fs.existsSync(cssPath)).toBe(false);
    });
  });

  // ==========================================================================
  // AC-2: ScrutinyIndicator deleted
  // ==========================================================================
  describe('AC-2: ScrutinyIndicator deleted', () => {
    it('should not have ScrutinyIndicator.tsx in the codebase', () => {
      const scrutinyPath = path.join(HUD_DIR, 'ScrutinyIndicator.tsx');
      expect(fs.existsSync(scrutinyPath)).toBe(false);
    });

    it('should not have ScrutinyIndicator.module.css in the codebase', () => {
      const cssPath = path.join(HUD_DIR, 'ScrutinyIndicator.module.css');
      expect(fs.existsSync(cssPath)).toBe(false);
    });
  });

  // ==========================================================================
  // AC-3: CounterPanel deleted
  // ==========================================================================
  describe('AC-3: CounterPanel deleted', () => {
    it('should not have CounterPanel.tsx in the codebase', () => {
      const counterPanelPath = path.join(COUNTER_DIR, 'CounterPanel.tsx');
      expect(fs.existsSync(counterPanelPath)).toBe(false);
    });

    it('should not have the counter directory at all', () => {
      // The entire counter directory should be deleted
      expect(fs.existsSync(COUNTER_DIR)).toBe(false);
    });
  });

  // ==========================================================================
  // AC-4: Barrel exports updated
  // ==========================================================================
  describe('AC-4: Barrel exports updated', () => {
    it('should not export ConcernChip from HUD index', () => {
      const indexPath = path.join(HUD_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Check that there's no export statement for ConcernChip
      const hasExport = /export\s*\{[^}]*ConcernChip[^}]*\}/.test(content);
      expect(hasExport).toBe(false);
    });

    it('should not export ScrutinyIndicator from HUD index', () => {
      const indexPath = path.join(HUD_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Check that there's no export statement for ScrutinyIndicator
      const hasExport = /export\s*\{[^}]*ScrutinyIndicator[^}]*\}/.test(content);
      expect(hasExport).toBe(false);
    });

    it('should still export valid HUD components (BeliefBar, TurnsDisplay)', () => {
      const indexPath = path.join(HUD_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('BeliefBar');
      expect(content).toContain('TurnsDisplay');
    });
  });
});
