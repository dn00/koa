# Task 011: PWA Support

**Status:** backlog
**Assignee:** -
**Blocked By:** 010
**Phase:** Polish
**Complexity:** M
**Depends On:** 010
**Implements:** R9.1, R9.2, R9.3

---

## Objective

Add Progressive Web App support with service worker, offline gameplay, and app manifest.

---

## Context

V5 requires offline-first gameplay (I2 invariant). PWA support allows installation and offline play.

### Relevant Files
- `_process/context/v5-design-context.md` — I2 offline-first invariant

### Embedded Context

**Service Worker Strategy:**
```typescript
// Cache-first for assets, network-first for API
// Precache: HTML, CSS, JS, images
// Runtime cache: puzzle data
```

**App Manifest:**
```json
{
  "name": "Hot Shot Hypothesis",
  "short_name": "HSH",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#16213e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

---

## Acceptance Criteria

### AC-1: Service Worker Registration ← R9.1
- **Given:** App loads
- **When:** Service worker registers
- **Then:** SW active, caching works
- **Test Type:** integration

### AC-2: Offline Gameplay ← R9.2
- **Given:** App cached, device offline
- **When:** Player starts game
- **Then:** Game plays normally (no network required)
- **Test Type:** integration

### AC-3: App Manifest ← R9.3
- **Given:** Manifest configured
- **When:** User visits on mobile
- **Then:** "Add to Home Screen" prompt available
- **Test Type:** manual

### Edge Cases

#### EC-1: SW Update
- **Scenario:** New version deployed
- **Expected:** User notified, can refresh to update

---

## Scope

### In Scope
- Service worker with caching
- App manifest
- Offline detection
- Install prompt handling

### Out of Scope
- Push notifications
- Background sync

---

## Implementation Hints

1. Use `@vite-pwa/sveltekit` plugin
2. Precache static assets
3. Handle SW lifecycle events

---

## Definition of Done

- [ ] Service worker registers
- [ ] Offline gameplay works
- [ ] App installable
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
