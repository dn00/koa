# Task 014: Service Worker and Pack Caching

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content System
**Complexity:** M
**Depends On:** 012, 013
**Implements:** R10.4, R12.1, R12.2

---

## Objective

Implement Service Worker for app shell caching and pack caching. Packs are cached by content hash and served offline. The app works fully offline after initial load.

---

## Context

The PWA must work offline after first visit. The Service Worker caches the app shell and pack files. Packs are content-addressed (keyed by SHA256 hash) for efficient caching.

### Relevant Files
- `packages/app/public/sw.js` (to create)
- `packages/app/src/services/pack-loader.ts` (to create)

### Embedded Context

**Caching Strategy (from ARCHITECTURE.md):**
| Content Type | Strategy | TTL |
|--------------|----------|-----|
| App shell (HTML, JS, CSS) | StaleWhileRevalidate | - |
| Packs (JSON) | CacheFirst | Immutable (by hash) |
| Daily manifest | NetworkFirst | 24h |

**Pack Loading Flow:**
1. Fetch manifest from CDN (or use cached)
2. For each pack: check cache by hash → if missing: fetch, validate, cache
3. Bind run to manifest + pack hashes
4. Packs immutable for duration of run

**Invariant I2 - Offline-First:**
- Core gameplay works without network
- Packs load from cache if available

**Source Docs:**
- `docs/D17-CLIENT-ARCHITECTURE.md` - PWA architecture
- `_process/project/ARCHITECTURE.md` - Caching strategy

---

## Acceptance Criteria

### AC-1: Service Worker Registration <- R12.1
- **Given:** App loads
- **When:** Service Worker registers
- **Then:** SW is active, controlling page
- **Test Type:** integration

### AC-2: App Shell Cached <- R12.1
- **Given:** SW active
- **When:** App assets requested
- **Then:** HTML, JS, CSS cached and served offline
- **Test Type:** integration

### AC-3: Pack Loader Fetches <- R10.4
- **Given:** Pack not cached
- **When:** loadPack(packId, hash) is called
- **Then:** Fetches from CDN, validates, caches
- **Test Type:** integration

### AC-4: Pack Cached by Hash <- R10.4
- **Given:** Pack fetched with hash abc123
- **When:** Same hash requested again
- **Then:** Served from cache (no network)
- **Test Type:** integration

### AC-5: Hash Mismatch Fails <- R10.4
- **Given:** Fetched pack has different hash than expected
- **When:** Validation runs
- **Then:** Returns error, pack not cached
- **Test Type:** unit

### AC-6: Manifest Fetch <- R10.4
- **Given:** Daily needs manifest
- **When:** fetchManifest(dailyId) is called
- **Then:** Fetches manifest, returns pack hashes
- **Test Type:** integration

### AC-7: Offline Pack Load <- R12.2
- **Given:** Pack cached, network offline
- **When:** loadPack called
- **Then:** Returns cached pack
- **Test Type:** integration

### AC-8: Validate On Load <- R10.3
- **Given:** Pack fetched from network
- **When:** Pack loaded
- **Then:** Schema + reference validation runs before caching
- **Test Type:** integration

### AC-9: Cache Cleanup <- R10.4
- **Given:** Old packs cached
- **When:** Cleanup runs (manual or scheduled)
- **Then:** Packs not in recent manifests are removed
- **Test Type:** unit

### Edge Cases

#### EC-1: Network Timeout
- **Scenario:** CDN slow to respond
- **Expected:** Return cached version if available, timeout error if not

#### EC-2: Partial Cache
- **Scenario:** Some packs cached, some not, offline
- **Expected:** Error: missing pack IDs listed

### Error Cases

#### ERR-1: Pack Not Found (404)
- **When:** CDN returns 404
- **Then:** Return error with pack ID
- **Error Message:** "Pack 'xyz' not found on CDN"

#### ERR-2: Validation Failed
- **When:** Downloaded pack fails validation
- **Then:** Return error, don't cache
- **Error Message:** "Pack validation failed: {errors}"

---

## Scope

### In Scope
- Service Worker with Workbox or manual implementation
- App shell caching (StaleWhileRevalidate)
- Pack caching (CacheFirst by hash)
- Manifest fetching (NetworkFirst)
- PackLoader service
- Hash verification
- Integration with validation (Task 012)
- Integration with IndexedDB (Task 013)

### Out of Scope
- Actual CDN setup (mock for dev)
- Push notifications
- Background sync

---

## Implementation Hints

```typescript
// pack-loader.ts
import { validatePack } from '@aura/engine-core';
import { db } from './persistence';

const CDN_BASE = import.meta.env.VITE_CDN_URL || '/packs';

export async function loadPack(
  packId: string,
  expectedHash: string
): Promise<Result<PuzzlePack, PackError>> {
  // Check IndexedDB cache first
  const cached = await db.packs.get(expectedHash);
  if (cached) {
    return { ok: true, value: cached.data as PuzzlePack };
  }

  // Fetch from CDN
  try {
    const response = await fetch(`${CDN_BASE}/${packId}.json`);
    if (!response.ok) {
      return { ok: false, error: new PackError(`Pack ${packId} not found`) };
    }

    const json = await response.json();

    // Verify hash
    const actualHash = await computeHash(json);
    if (actualHash !== expectedHash) {
      return { ok: false, error: new PackError('Hash mismatch') };
    }

    // Validate
    const validated = validatePack(json);
    if (!validated.ok) {
      return { ok: false, error: new PackError('Validation failed') };
    }

    // Cache
    await db.packs.put({
      hash: expectedHash,
      type: 'puzzle',
      data: validated.value,
      cached_at: Date.now(),
    });

    return { ok: true, value: validated.value };
  } catch (e) {
    return { ok: false, error: new PackError(`Fetch failed: ${e}`) };
  }
}
```

```javascript
// sw.js (simplified)
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Packs: CacheFirst (immutable by hash)
registerRoute(
  ({ url }) => url.pathname.startsWith('/packs/'),
  new CacheFirst({ cacheName: 'packs' })
);

// Manifest: NetworkFirst with fallback
registerRoute(
  ({ url }) => url.pathname.includes('manifest'),
  new NetworkFirst({ cacheName: 'manifests' })
);
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Offline support is core to PWA promise.
**Decisions:**
- Use Workbox for SW (less boilerplate)
- Double-store packs: Cache API (SW) + IndexedDB (app access)
- Hash verification before caching
**Questions for Implementer:**
- Workbox vs manual SW?
- How to test offline scenarios in Vitest?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
| AC-9 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
