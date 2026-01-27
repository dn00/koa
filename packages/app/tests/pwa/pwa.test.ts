/**
 * Tests for Task 014: PWA Support
 *
 * Verifies PWA configuration and service worker.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const publicDir = path.resolve(__dirname, '../../public');
const rootDir = path.resolve(__dirname, '../..');

describe('Task 014: PWA Support', () => {
  // ==========================================================================
  // AC-1: manifest.json exists with required fields
  // ==========================================================================
  describe('AC-1: manifest.json exists with required fields', () => {
    let manifest: Record<string, unknown>;

    beforeEach(() => {
      const manifestPath = path.join(publicDir, 'manifest.json');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(content);
    });

    it('should have name field', () => {
      expect(manifest.name).toBe('Home Smart Home');
    });

    it('should have short_name field', () => {
      expect(manifest.short_name).toBe('HSH');
    });

    it('should have start_url field', () => {
      expect(manifest.start_url).toBe('/');
    });

    it('should have display mode standalone', () => {
      expect(manifest.display).toBe('standalone');
    });

    it('should have background_color', () => {
      expect(manifest.background_color).toBeDefined();
    });

    it('should have theme_color', () => {
      expect(manifest.theme_color).toBeDefined();
    });
  });

  // ==========================================================================
  // AC-2: Icons configured for PWA
  // ==========================================================================
  describe('AC-2: Icons configured for PWA', () => {
    let manifest: Record<string, unknown>;

    beforeEach(() => {
      const manifestPath = path.join(publicDir, 'manifest.json');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(content);
    });

    it('should have icons array', () => {
      expect(Array.isArray(manifest.icons)).toBe(true);
    });

    it('should have 192x192 icon', () => {
      const icons = manifest.icons as Array<{ sizes: string }>;
      const icon192 = icons.find((i) => i.sizes === '192x192');
      expect(icon192).toBeDefined();
    });

    it('should have 512x512 icon', () => {
      const icons = manifest.icons as Array<{ sizes: string }>;
      const icon512 = icons.find((i) => i.sizes === '512x512');
      expect(icon512).toBeDefined();
    });
  });

  // ==========================================================================
  // AC-3: Service worker file exists
  // ==========================================================================
  describe('AC-3: Service worker file exists', () => {
    it('should have sw.js in public directory', () => {
      const swPath = path.join(publicDir, 'sw.js');
      expect(fs.existsSync(swPath)).toBe(true);
    });

    it('should contain install event handler', () => {
      const swPath = path.join(publicDir, 'sw.js');
      const content = fs.readFileSync(swPath, 'utf-8');
      expect(content).toContain("addEventListener('install'");
    });

    it('should contain fetch event handler', () => {
      const swPath = path.join(publicDir, 'sw.js');
      const content = fs.readFileSync(swPath, 'utf-8');
      expect(content).toContain("addEventListener('fetch'");
    });

    it('should contain activate event handler', () => {
      const swPath = path.join(publicDir, 'sw.js');
      const content = fs.readFileSync(swPath, 'utf-8');
      expect(content).toContain("addEventListener('activate'");
    });
  });

  // ==========================================================================
  // AC-4: index.html has PWA meta tags
  // ==========================================================================
  describe('AC-4: index.html has PWA meta tags', () => {
    let indexHtml: string;

    beforeEach(() => {
      const indexPath = path.join(rootDir, 'index.html');
      indexHtml = fs.readFileSync(indexPath, 'utf-8');
    });

    it('should have manifest link', () => {
      expect(indexHtml).toContain('rel="manifest"');
    });

    it('should have theme-color meta tag', () => {
      expect(indexHtml).toContain('name="theme-color"');
    });

    it('should have apple-mobile-web-app-capable meta tag', () => {
      expect(indexHtml).toContain('name="apple-mobile-web-app-capable"');
    });

    it('should have viewport meta tag with viewport-fit', () => {
      expect(indexHtml).toContain('viewport-fit=cover');
    });
  });

  // ==========================================================================
  // AC-5: Service worker registration in main.tsx
  // ==========================================================================
  describe('AC-5: Service worker registration', () => {
    it('should register service worker in main.tsx', () => {
      const mainPath = path.join(rootDir, 'src/main.tsx');
      const content = fs.readFileSync(mainPath, 'utf-8');
      expect(content).toContain('serviceWorker');
      expect(content).toContain("register('/sw.js')");
    });

    it('should only register in production', () => {
      const mainPath = path.join(rootDir, 'src/main.tsx');
      const content = fs.readFileSync(mainPath, 'utf-8');
      expect(content).toContain('import.meta.env.PROD');
    });
  });

  // ==========================================================================
  // EC-1: Graceful degradation without service worker support
  // ==========================================================================
  describe('EC-1: Graceful degradation', () => {
    it('should check for serviceWorker support before registering', () => {
      const mainPath = path.join(rootDir, 'src/main.tsx');
      const content = fs.readFileSync(mainPath, 'utf-8');
      expect(content).toContain("'serviceWorker' in navigator");
    });
  });

  // ==========================================================================
  // EC-2: Caching strategies in service worker
  // ==========================================================================
  describe('EC-2: Caching strategies', () => {
    let swContent: string;

    beforeEach(() => {
      const swPath = path.join(publicDir, 'sw.js');
      swContent = fs.readFileSync(swPath, 'utf-8');
    });

    it('should implement stale-while-revalidate for app shell', () => {
      expect(swContent).toContain('staleWhileRevalidateStrategy');
    });

    it('should implement network-first for API/manifest', () => {
      expect(swContent).toContain('networkFirstStrategy');
    });

    it('should implement cache-first for packs', () => {
      expect(swContent).toContain('cacheFirstStrategy');
    });
  });
});
