# Architecture

**Last Updated:** 2026-01-26
**Status:** Discovery
**Canonical Reference:** docs/D17-CLIENT-ARCHITECTURE.md

---

## Overview

Home Smart Home is a **daily puzzle game** built as a mobile-first PWA. The architecture prioritizes:

1. **Determinism** - Same inputs always produce same outputs
2. **Offline-first** - Core gameplay works without network
3. **Instant feel** - Mechanical resolution <120ms
4. **Testability** - Pure domain logic with no side effects

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Structure | Monorepo (workspaces) | `packages/engine-core`, `packages/app` |
| Language | TypeScript | Strict mode, no `any` |
| Frontend | React + Vite | PWA with Service Worker |
| State | Zustand | Event-sourced, derived state |
| Storage | IndexedDB (Dexie) | Runs, events, packs, settings |
| Caching | Service Worker + Cache API | Offline pack storage |
| Testing | Vitest | Shared config across packages |
| Backend | Static CDN | Packs, manifests, daily index |

---

## Monorepo Structure

```
aura/
├── packages/
│   ├── engine-core/          # Pure TypeScript, no DOM
│   │   ├── src/
│   │   │   ├── types/        # Domain types (EvidenceCard, Concern, etc.)
│   │   │   ├── resolver/     # Deterministic resolver
│   │   │   ├── validation/   # Pack and state validation
│   │   │   └── index.ts      # Barrel export
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── app/                  # React PWA
│       ├── src/
│       │   ├── screens/      # Home, Run, Results
│       │   ├── components/   # UI components
│       │   ├── stores/       # Zustand stores
│       │   ├── services/     # PackLoader, persistence
│       │   └── main.tsx
│       ├── public/
│       └── package.json
│
├── docs/                     # Game design docs
├── _process/                 # Development workflow
├── package.json              # Root workspace config
└── vitest.config.ts          # Shared test config
```

---

## Component Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  React screens, UI components, animations, KOA avatar            │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  RunController, TurnController, game flow orchestration          │
├─────────────────────────────────────────────────────────────────┤
│                    CONTENT LAYER                                 │
│  PackLoader, ManifestResolver, VoiceSelector                     │
├─────────────────────────────────────────────────────────────────┤
│                    PERSISTENCE LAYER                             │
│  IndexedDB repos, Service Worker cache, event log                │
├─────────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER (engine-core)                    │
│  Deterministic resolver, validators, pure types                  │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

**Presentation** - React components, no business logic
- Screens: Home, DailyBrief, Run, Results
- Components: HUD, EvidenceCard, ConcernChip, KOAAvatar
- Purely renders state, dispatches actions

**Application** - Orchestrates gameplay
- RunController: manages run lifecycle
- TurnController: handles per-turn logic
- Coordinates between UI, resolver, and persistence

**Content** - Loads and manages packs
- PackLoader: fetch, validate, cache packs
- ManifestResolver: daily puzzle binding
- VoiceSelector: bark selection by OutcomeKey

**Persistence** - All storage concerns
- IndexedDB: runs, events, settings, pack index
- Service Worker: offline pack cache
- Event log: append-only source of truth

**Domain (engine-core)** - Pure game logic
- Types: EvidenceCard, Concern, Counter, etc.
- Resolver: damage, contradictions, concerns
- Validators: pack validation, state validation
- **No DOM, no network, no side effects**

---

## Data Flow

### Per-Turn Flow

```
1. Player selects 1-3 cards
        ↓
2. UI calls TurnController.preview(cards)
        ↓
3. TurnController calls resolver.preview(state, cards)
        ↓
4. Resolver returns preview (damage, concerns, contradictions)
        ↓
5. UI shows preview, player confirms
        ↓
6. TurnController calls resolver.resolve(state, cards)
        ↓
7. Resolver returns MOVE_RESOLVED event
        ↓
8. Event appended to log (IndexedDB)
        ↓
9. State derived from event log
        ↓
10. UI renders new state (<120ms total)
        ↓
11. Voice selected asynchronously (non-blocking)
```

### Pack Loading Flow

```
1. App startup / daily refresh
        ↓
2. Fetch manifest from CDN (or use cached)
        ↓
3. For each pack in manifest:
   - Check cache by sha256 hash
   - If missing: fetch, validate, cache
        ↓
4. Bind run to manifest + pack hashes
        ↓
5. Packs immutable for duration of run
```

---

## Key Modules

| Module | Package | Responsibility |
|--------|---------|----------------|
| `types/` | engine-core | Domain types and enums |
| `resolver/` | engine-core | Damage, contradictions, concerns |
| `validation/` | engine-core | Pack and state validation |
| `stores/` | app | Zustand state stores |
| `services/pack-loader` | app | Pack fetching and caching |
| `services/persistence` | app | IndexedDB operations |
| `screens/` | app | React page components |
| `components/` | app | Reusable UI components |

---

## State Management

### Event-Sourced Model

```typescript
// Event log is source of truth
interface RunEvent {
  event_id: string;
  event_type: EventType;
  tick_id: number;
  payload: unknown;
  timestamp: number;
}

// State is derived by replaying events
function deriveState(events: RunEvent[]): RunState {
  return events.reduce(applyEvent, initialState);
}
```

### Zustand Store Structure

```typescript
// Main game store
interface GameStore {
  // Derived state
  runState: RunState | null;

  // Actions
  startRun: (dailyId: string) => Promise<void>;
  submitCards: (cardIds: string[]) => Promise<void>;

  // Event log access
  getEventLog: () => RunEvent[];
}

// Settings store (separate)
interface SettingsStore {
  counterVisibility: 'full' | 'hidden';
  statsMode: 'minimal' | 'full';
  telemetryOptOut: boolean;
}
```

---

## Offline Strategy

### Service Worker Caching

| Content Type | Strategy | TTL |
|--------------|----------|-----|
| App shell (HTML, JS, CSS) | StaleWhileRevalidate | - |
| Packs (JSON) | CacheFirst | Immutable (by hash) |
| Daily manifest | NetworkFirst | 24h |

### Resume Support

1. Run state persisted after each turn
2. On resume: load last snapshot + replay remaining events
3. Snapshot every K=10 events for performance

---

## Performance Budgets

| Metric | Target |
|--------|--------|
| First load (cached) | < 2.5s on mid-tier mobile |
| Submit → UI update | < 120ms |
| Pack validation | < 150ms (typical), < 500ms (worst) |
| Derived state recompute | < 10ms (with snapshots) |

---

## Security Considerations

- **No secrets in packs** - All pack content is public
- **No LLM adjudication** - Game outcomes are deterministic
- **Pack validation** - Fail-closed on invalid content
- **Content-addressed packs** - SHA256 hash verification

---

---

## Python Kernel Reference

The Python kernel in `docs/source-files/kernel/` provides architectural patterns:

| File | Pattern | Use In engine-core |
|------|---------|-------------------|
| `types.py` | NewType IDs, frozen dataclasses | Type-safe IDs, immutable domain types |
| `state.py` | State with `snapshot_hash()` | Deterministic state hashing |
| `tick.py` | Pure `(state, action) → (state, events)` | Resolver as pure function |
| `events.py` | Event types, hash chain | Event-sourced truth |
| `hash.py` | `canonical_json()`, `compute_hash()` | Reproducible hashing |
| `rng.py` | Seeded RNG | Deterministic randomness |

**Note:** Types and game logic differ (D31 vs escape room), but patterns are reusable.

---

## References

- `docs/D17-CLIENT-ARCHITECTURE.md` - Full PWA architecture spec
- `docs/D18-BACKEND-MINIMUM.md` - Backend API contracts
- `docs/D19-DATA-MODELS-STORAGE.md` - Persistence details
- `docs/D04A-GAME-STATE-EVENT-MODEL.md` - Event types and state model
- `docs/source-files/kernel/` - Python reference implementation
