/**
 * Pack loader service for fetching and caching puzzle packs.
 * Task 014: Service Worker and Pack Caching
 *
 * Handles:
 * - Fetching packs with SHA256 hash verification
 * - Caching packs in IndexedDB
 * - Serving cached packs offline
 * - Manifest fetching for daily challenges
 */

import type { Result } from '@hsh/engine-core';
import { ok, err } from '@hsh/engine-core';
import { db } from './db.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Pack load error codes.
 */
export type PackLoadErrorCode =
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'HASH_MISMATCH'
  | 'VALIDATION_FAILED';

/**
 * Pack load error.
 */
export interface PackLoadError {
  code: PackLoadErrorCode;
  message: string;
}

/**
 * Manifest error codes.
 */
export type ManifestErrorCode = 'NOT_FOUND' | 'NETWORK_ERROR' | 'INVALID';

/**
 * Manifest error.
 */
export interface ManifestError {
  code: ManifestErrorCode;
  message: string;
}

/**
 * Daily challenge manifest.
 */
export interface Manifest {
  dailyId: string;
  packId: string;
  packHash: string;
  puzzleIndex: number;
}

/**
 * Pack loader interface.
 */
export interface PackLoader {
  fetchPack(packId: string, expectedHash: string): Promise<Result<unknown, PackLoadError>>;
  fetchManifest(dailyId: string): Promise<Result<Manifest, ManifestError>>;
  isPackCached(packId: string): Promise<boolean>;
  cleanupOldPacks(maxAgeDays: number): Promise<void>;
}

// ============================================================================
// Configuration
// ============================================================================

const PACK_API_BASE = '/api/packs';
const MANIFEST_API_BASE = '/api/manifest';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert ArrayBuffer to hex string.
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate SHA256 hash of a string.
 */
async function calculateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToHex(hashBuffer);
}

/**
 * Validate pack JSON structure.
 * Basic validation - checks if it's valid JSON.
 */
function validatePackData(text: string): Result<unknown, PackLoadError> {
  try {
    const data = JSON.parse(text);
    return ok(data);
  } catch {
    return err({
      code: 'VALIDATION_FAILED',
      message: 'Invalid JSON in pack data',
    });
  }
}

// ============================================================================
// Pack Loader Implementation
// ============================================================================

/**
 * Create a pack loader instance.
 */
export function createPackLoader(): PackLoader {
  return {
    /**
     * Fetch a pack by ID with hash verification.
     *
     * AC-3: Fetches, validates, caches
     * AC-4: Serves cached packs by hash
     * AC-5: Hash mismatch detection
     * AC-7: Offline load from cache
     * AC-8: Schema validation before caching
     */
    async fetchPack(
      packId: string,
      expectedHash: string
    ): Promise<Result<unknown, PackLoadError>> {
      // AC-4: Check cache first
      const cached = await db.packs.get(packId);
      if (cached) {
        return ok(cached.data);
      }

      // Fetch from network
      let response: Response;
      let packText: string;

      try {
        response = await fetch(`${PACK_API_BASE}/${packId}`);
      } catch {
        // AC-7: Network error (offline)
        return err({
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch pack: network error',
        });
      }

      // ERR-1: Pack not found
      if (!response.ok) {
        if (response.status === 404) {
          return err({
            code: 'NOT_FOUND',
            message: `Pack not found: ${packId}`,
          });
        }
        return err({
          code: 'NETWORK_ERROR',
          message: `HTTP error: ${response.status}`,
        });
      }

      try {
        packText = await response.text();
      } catch {
        return err({
          code: 'NETWORK_ERROR',
          message: 'Failed to read pack response',
        });
      }

      // AC-8: Validate JSON before anything else
      const validationResult = validatePackData(packText);
      if (!validationResult.ok) {
        return validationResult;
      }

      // AC-5: Verify hash
      const actualHash = await calculateHash(packText);
      if (actualHash !== expectedHash) {
        return err({
          code: 'HASH_MISMATCH',
          message: `Hash mismatch: expected ${expectedHash}, got ${actualHash}`,
        });
      }

      // AC-3: Cache the validated pack
      await db.packs.put({
        id: packId,
        data: validationResult.value,
        cachedAt: Date.now(),
      });

      return ok(validationResult.value);
    },

    /**
     * Fetch manifest for a daily challenge.
     *
     * AC-6: Manifest fetching with daily ID
     */
    async fetchManifest(dailyId: string): Promise<Result<Manifest, ManifestError>> {
      try {
        const response = await fetch(`${MANIFEST_API_BASE}/${dailyId}`);

        if (!response.ok) {
          if (response.status === 404) {
            return err({
              code: 'NOT_FOUND',
              message: `Manifest not found for: ${dailyId}`,
            });
          }
          return err({
            code: 'NETWORK_ERROR',
            message: `HTTP error: ${response.status}`,
          });
        }

        const manifest = await response.json();
        return ok(manifest as Manifest);
      } catch {
        return err({
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch manifest',
        });
      }
    },

    /**
     * Check if a pack is cached.
     */
    async isPackCached(packId: string): Promise<boolean> {
      const pack = await db.packs.get(packId);
      return pack !== undefined;
    },

    /**
     * Clean up old packs from cache.
     *
     * AC-9: Cache cleanup
     */
    async cleanupOldPacks(maxAgeDays: number): Promise<void> {
      const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
      const oldPacks = await db.packs.where('cachedAt').below(cutoff).toArray();

      for (const pack of oldPacks) {
        await db.packs.delete(pack.id);
      }
    },
  };
}

// ============================================================================
// Service Worker Registration
// ============================================================================

/**
 * Register the service worker.
 *
 * AC-1: SW registers and controls page
 * AC-2: App shell cached/served offline
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

// ============================================================================
// Singleton
// ============================================================================

let packLoaderInstance: PackLoader | null = null;

/**
 * Get the pack loader singleton.
 */
export function getPackLoader(): PackLoader {
  if (!packLoaderInstance) {
    packLoaderInstance = createPackLoader();
  }
  return packLoaderInstance;
}
