# D17 — CLIENT ARCHITECTURE (PWA) v1.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Engineering (Client)
**Last Updated:** 2026-01-25
**Purpose:** Specify the client architecture for an offline-first, mobile-first PWA implementation of Life with AURA. This doc defines the runtime modules, data flow, storage, pack loading/caching, rendering, performance budgets, and integration points to the minimal backend (D18) without making gameplay dependent on the network.

---

## 0) Goals and non-goals

### Goals

1. **Offline-first gameplay:** a user can play Free Play fully offline after initial cache; Daily requires cached “daily bundle” but can be played offline once cached.
2. **Deterministic mechanics:** all mechanical outcomes computed locally and replayable from event log (D04A).
3. **Instant feel:** mechanics update immediately; voice is non-blocking and usually pre-generated (D12/D16).
4. **Pack-serviced content:** incidents, protocols, artifacts/tools, and voice are loaded from versioned packs and validated before use (D08–D11).
5. **Safe updates:** pack updates never corrupt an in-progress run; runs bind to a manifest snapshot.

### Non-goals (v1)

* Competitive anti-cheat or authoritative server adjudication (defer to D20 tiers).
* Multiplayer or realtime sharing beyond a simple "share card" image/text.
* Full localization (en-US only, but keep string catalogs structured).

---

## 0A) Execution model: client-authoritative engine

The game engine executes **entirely in the browser** (PWA) for offline play and instant feedback.

### Where code runs

| Component | Runtime | Purpose |
|-----------|---------|---------|
| `engine-core` | Browser | Deterministic resolver, event log, state derivation |
| UI (React) | Browser | Screens, components, user interaction |
| Pack loader | Browser | Fetch, validate, cache packs |
| IndexedDB | Browser | Event persistence, snapshots, pack cache |

### SSR policy

* **SSR is NOT used for gameplay.** All mechanical resolution is client-side.
* SSR is optional and only for: marketing pages, SEO landing pages, account pages (if any)
* If SSR touches gameplay, you've broken offline-first.

---

## 0B) Monorepo structure (recommended)

```
/packages/engine-core   # Pure deterministic TS library (no DOM/Node APIs)
/apps/pwa               # React UI + IndexedDB + pack cache
/tools/pack-cli         # Node scripts using engine-core
/tools/py-kernel        # Python reference/oracle (optional, not shipped)
```

**Rule:** `engine-core` has zero dependencies on DOM, Node, or browser APIs. It must run identically in browser and Node for testing.

---

## 0C) Determinism requirements (engine-core)

1. **BigInt RNG only** - no floating-point math in core resolution
2. **Canonical JSON encoder** - required for hashing events/packs (sorted keys, compact separators)
3. **Event log is source of truth** - UI never mutates state directly
4. **No wall-clock dependence** - timestamps are logical tick-based
5. **Python parity** - until port complete, TS must match Python oracle on golden fixtures

---

## 1) Recommended stack (v1)

### Build/runtime

* **TypeScript + React** (mobile-first UI)
* **Vite** (fast dev iteration)
* **PWA layer:** Service Worker via **Workbox** (or Vite PWA plugin that uses Workbox)
* **State management:** **Zustand** (preferred for modular stores) or Redux Toolkit (acceptable if you prefer).
* **Routing:** React Router (or lightweight router)
* **Storage:** IndexedDB via **Dexie** (preferred) or idb-keyval + custom wrappers
* **Animation/FX:** CSS + canvas overlay (optional PixiJS for AURA glitch effects)

### Optional (later)

* Capacitor wrapper for app stores (keep PWA-first constraints)
* WebAssembly helpers for pack validation if needed (likely unnecessary v1)

---

## 2) High-level module architecture

Client is split into five layers:

1. **Domain Layer (Pure)**

   * Deterministic resolver (mechanics “physics”)
   * Pack schema validators
   * PRNG / seed handling
   * Event types + canonical encoding helpers

2. **Persistence Layer**

   * IndexedDB repositories (runs, events, snapshots, pack cache, settings)
   * Content-addressed pack storage
   * Telemetry queue

3. **Content Layer**

   * Pack loader + validator
   * Manifest resolver (Daily/Free Play)
   * Incident assembler (seeded composition using pack libraries)
   * Voice selector (OutcomeKey → bark id)

4. **Application Layer**

   * Run controller (start/resume/end)
   * Turn controller (compose action → append events → compute resolution)
   * UI adapters (derive view models from state)

5. **Presentation Layer**

   * Screens (Home, Run, Cache, Win/Loss, Codex)
   * Components (HUD, hand carousel, payload slots, transcript, “WHY?” sheet)
   * Feel system (D16) as renderer of event triggers

**Rule:** Domain Layer must have **no** access to network, time, or browser APIs.

---

## 3) Data flow (authoritative loop)

### 3.1 Event-sourced core (D04A)

* **Single source of truth:** append-only event log for a run.
* **Derived state:** computed by replaying events + applying deterministic transitions.

### 3.2 Runtime loop (per player action)

1. Player selects move + payload in UI.
2. Client constructs `ACTION_SUBMITTED` event (input).
3. Client calls deterministic resolver to compute outcome:

   * selects counter path
   * computes deltas
   * produces `MOVE_RESOLVED` with OutcomeKey
4. Client appends `MOVE_RESOLVED` to event log.
5. UI renders deltas instantly (bars/chips), then prints bark asynchronously.

**Important:** the event log must contain enough info to replay without re-running “search logic” differently later (include selected counter path id, deltas, and any tool transforms performed), per D04A §6.1.

---

## 4) Core client subsystems

## 4.1 RunController

Responsibilities:

* Start run (Daily/Free Play)
* Resume run from DB snapshot + events
* End run with reason
* Bind run to a manifest snapshot (pack versions)

Key API (conceptual):

* `startDaily(dailyId): RunId`
* `startFreePlay(seed?): RunId`
* `resume(runId): void`
* `end(runId, result, reason): void`

Rules:

* A run is always bound to a **content manifest** (manifest id + pack hashes/versions).
* If packs update mid-run, they do **not** affect current run.

---

## 4.2 TurnController

Responsibilities:

* Manage “turn start/end”
* Validate action composition (UI constraints)
* Append events in correct order
* Trigger audits and interstitials

Turn sequencing (v1):

* `TURN_STARTED` (optional stored; otherwise derived)
* `ACTION_SUBMITTED`
* `MOVE_RESOLVED`
* optional `AUDIT_TRIGGERED` / `AUDIT_RESOLVED`
* `TURN_ENDED` (optional stored)

Validation:

* Enforce move rules (slot counts, token availability, modifier constraints)
* Reject invalid actions with `ACTION_REJECTED` (append-only, no state mutation besides “rejection record”)

---

## 4.3 Deterministic Resolver (pure library)

Inputs:

* Current state (derived from event replay)
* Action (move + payload + target gate)
* Bound protocol pack ruleset
* Seeded RNG stream (if needed for deterministic selections)

Outputs:

* `selected_counter_path_id`
* deltas (lock strength, scrutiny)
* status effects
* `OutcomeKey` for voice selection

Constraints:

* No floating time; no network.
* All randomness must come from seeded PRNG and be explicitly recorded if it affects decisions.

---

## 4.4 PackLoader + PackCache

Responsibilities:

* Fetch packs (from CDN when online)
* Validate packs (schema + capability checks)
* Store packs content-addressed in IndexedDB/Cache Storage
* Provide `PackRegistry` to the game runtime

### 4.4.1 Engine capability registry

The client maintains an authoritative capability registry:

```typescript
const ENGINE_VERSION = "0.1.0";

const ENGINE_CAPABILITIES: readonly string[] = [
  // Core contract
  "pack.capabilities_contract_v1",

  // Gate capabilities
  "gate.timestamp_window_v1",
  "gate.counterpath_compose_v1",

  // Tool effect primitives
  "tool.effect_ops_v1",

  // Modifier capabilities
  "modifier.effect_ops_v1",
  "modifier.rate_limit_v1",
  "modifier.trust_cap_v1",

  // Daily/schedule capabilities
  "daily.schedule_v1",
  "daily.manifest_v1",

  // Voice capabilities
  "voice.outcomekey_v1",

  // RNG
  "rng_streams.v1"
] as const;

// Future capabilities (not yet implemented)
// "gate.counterpath_compose_v2"
// "anti_tamper.pack_signature_v1"
```

**Rule:** Capabilities are monotonic. Once added, they never change meaning. New behavior requires new capability IDs.

### 4.4.2 Pack load pipeline

```
fetch manifest
  → fetch packs (parallel)
  → for each pack:
      1. JSON parse
      2. Schema validation (D09)
      3. Hash integrity check
      4. Effect normalization (legacy → canonical)
      5. Capability compatibility check:
         - pack.min_engine_version <= ENGINE_VERSION
         - pack.capabilities_required ⊆ ENGINE_CAPABILITIES
      6. Optional: signature verification (D20 Tier 1+)
  → if all pass: install to cache
  → if any fail: reject pack, use fallback
```

Storage strategy:

* Packs stored by **content hash** (e.g., sha256 of canonical pack JSON) + metadata:

  * `pack_id`
  * `version`
  * `hash`
  * `size_bytes`
  * `installed_at`
  * `capabilities_required[]`
* Manifest references packs by (id, version, hash) to guarantee exact binding.

Fail-closed behavior:

* If pack invalid or capability unsupported, do not install; show degraded mode:

  * Free Play using last known good packs
  * Daily disabled until daily bundle cached

### 4.4.4 Remote flags integration

Client fetches `remote_flags.json` (D18 §14) on startup and periodically:

* If `fallback_to_last_known_good_daily=true` and today's daily fails:
  * Use Last Known Good daily from cache
  * If no LKG: generate Practice Daily (non-leaderboard)
* If `disable_pack_ids` contains a pack, fail-closed on that pack
* If `exclude_channels` set, filter daily selection accordingly
* If `disable_enhanced_voice=true`, skip LLM voice entirely

**Caching:** 5-15 min TTL; use stale flags if fetch fails.

### 4.4.3 Developer diagnostics (debug mode)

In development builds, expose a "Capabilities Debug" panel that shows:

* `ENGINE_VERSION`
* `ENGINE_CAPABILITIES[]`
* For each loaded pack:
  * `pack_id`, `version`
  * `capabilities_required[]`
  * `satisfied: true/false`
  * `missing_capabilities[]` if any

---

## 4.5 ManifestResolver (Daily/Free Play)

Daily:

* Loads a small “daily manifest” describing:

  * daily_id, date boundary
  * bound pack versions/hashes
  * seed
  * daily incident spec or references to incident templates

Free Play:

* Uses local pack registry, selects:

  * protocol pack = current default
  * incident templates from installed packs
  * generates seed locally

Rules:

* Daily mode uses **standardized loadout** (no meta perks).
* Daily run must store `daily_id` and `manifest_id` in `RUN_STARTED`.

---

## 4.6 VoiceSystem (pre-gen default)

Pipeline:

* Mechanic resolution emits `OutcomeKey` in `MOVE_RESOLVED`.
* Voice selector maps `OutcomeKey` → `(voice_pack_id, line_id)` based on:

  * event type
  * routine
  * gate id
  * outcome/pass/fail/escalate
  * scrutiny band
  * move

Runtime behavior:

* Pre-gen bark renders as soon as selector returns (local).
* Optional Enhanced line (if enabled) is requested asynchronously; never blocks.

Caching:

* Store only `line_id` (optional) and selected variant id for replay determinism.
* Do not store enhanced output as authoritative.

---

## 4.7 “Why?” Explainability Panel

Inputs:

* Last `MOVE_RESOLVED`
* Gate definition + selected counter path
* Payload tags/traits + trust tier
  Outputs:
* Human-readable deterministic explanation:

  * “Selected Path B: Verified + Sensor”
  * “Missing trait: Timestamped” (on fail)
  * “Scrutiny +1 due to Sketchy + Rewire”

Implementation note:

* Explanation is generated locally from structured data, not LLM.

---

## 4.8 Feel Engine (D16)

Responsibilities:

* Subscribe to event stream
* Emit feel triggers: animations, haptics, sfx
* Enforce timing: mechanics first, voice later

Implementation:

* Treat as a small event middleware:

  * `onActionCommit()`
  * `onResolutionDelta()`
  * `onAuditTriggered()`
  * `onCachePick()`

---

## 4.9 Telemetry Queue (non-blocking)

Responsibilities:

* Record key events (win/loss, gate usage, audit frequency)
* Store in local queue when offline
* Flush opportunistically when online

Rules:

* Never block gameplay.
* Respect user opt-out.
* Send only aggregated/anonymous event payloads (D22 defines schema).

---

## 5) Storage model (IndexedDB)

### 5.1 Tables (Dexie suggested)

* `runs`

  * `run_id` (PK)
  * `mode`, `daily_id?`, `manifest_id`, `seed`
  * `status` (active/ended)
  * `created_at`, `updated_at`
  * `snapshot_seq` (last snapshot event seq)
* `events`

  * `run_id` + `seq` (compound PK)
  * `event_json` (canonical)
  * `chain_hash?` (tiered)
* `snapshots`

  * `run_id` + `seq`
  * `state_json` (derived state snapshot)
* `packs`

  * `pack_hash` (PK)
  * `pack_id`, `version`, `bytes`, `installed_at`
  * `content_json` or pointer to CacheStorage entry
* `manifests`

  * `manifest_id` (PK)
  * `mode`, `daily_id?`
  * `pack_refs[]`
  * `seed`, `created_at`
* `settings`

  * `key`, `value`
* `telemetry_queue`

  * `id`, `payload`, `created_at`, `retry_count`

### 5.2 Snapshot strategy

* Write snapshot every **K=10** events (tunable)
* On resume:

  * load last snapshot
  * replay remaining events

---

## 6) Service worker caching strategy (Workbox)

### 6.1 Cache buckets

1. **App Shell Cache**

   * HTML, JS bundles, CSS, icons
   * Strategy: `StaleWhileRevalidate`
2. **Pack Cache**

   * Pack JSON blobs and small assets (icons, sfx)
   * Strategy: `CacheFirst` with versioned URLs
3. **Daily Bundle Cache**

   * Daily manifest + required packs
   * Strategy: `CacheFirst` with explicit “prefetch daily” step

### 6.2 Update rules

* On new app version:

  * install SW, activate
  * do not delete existing pack cache immediately (keep last known good)
* Packs are immutable once cached (by content hash URL).
* Daily bundle is immutable per day; new day fetches a new bundle.

### 6.3 Offline readiness UX

* Home screen shows:

  * “Offline Ready” if app shell + core packs present
  * “Daily Cached” if today’s daily bundle present

---

## 7) UI architecture (React)

### 7.1 Screen components

* `HomeScreen`
* `DailyDetailScreen`
* `RunStartScreen`
* `PlayScreen`
* `CacheScreen`
* `ActCompleteScreen`
* `RunWinScreen`
* `RunLossScreen`
* `CodexScreen`
* `SettingsScreen`
* `ArchiveScreen`

### 7.2 Shared UI components

* `HudLockStrength`
* `HudScrutiny`
* `GateChipRow`
* `RoutineChip`
* `Transcript`
* `HandCarousel`
* `PayloadSlots`
* `MoveRow`
* `PrimaryCommitButton`
* `WhySheet`
* `GateTooltipSheet`
* `AuditBanner`

### 7.3 State stores (suggested)

* `useAppStore` (connectivity, offline readiness, settings)
* `useContentStore` (installed packs, manifest, daily cache status)
* `useRunStore` (active run_id, derived state, last resolution)
* `useUiStore` (selected move, selected gate, payload slots, open sheets)

Rule:

* Keep derived mechanics state immutable/pure; UI store can be transient.

---

## 8) Performance budgets and profiling

### 8.1 Budgets

* First load interactive: < 2.5s on mid-tier mobile (cached)
* Commit → mechanics update: < 120ms
* Derived state recompute after event append: < 10ms typical (with snapshots)
* Pack validation (daily): < 150ms for small packs, < 500ms worst-case

### 8.2 Practices

* Memoize derived view models
* Avoid rerendering transcript on each micro-update (virtualize if needed)
* Use requestAnimationFrame for bar animations
* Keep audio decoding lazy-loaded

---

## 9) Error handling and fail-closed behavior

### 9.1 Pack failures

* If a required pack is missing/invalid:

  * block Daily start
  * allow Free Play only if core protocol + minimal incident templates exist
  * show “Restore content” action when online

### 9.2 Event append failures

* If an event fails validation:

  * do not append
  * show a soft error toast
  * keep state unchanged

### 9.3 Corrupted storage recovery

* If IndexedDB read fails:

  * offer “Reset Local Data” (explicit)
  * preserve packs if possible; otherwise re-download when online

---

## 10) Optional Enhanced AURA (runtime LLM) integration

### 10.1 Contract

* Enhanced AURA is a **decorator**:

  * input: OutcomeKey + local context (gate, move, short payload summary)
  * output: one optional “deluxe” line or hint
* Must be:

  * opt-in
  * non-blocking
  * discardable on timeout

### 10.2 Implementation

* Fire-and-forget request after `MOVE_RESOLVED`
* If response arrives:

  * append as a transcript line with a subtle badge
  * do not alter state
* If no response in 2.5s:

  * drop silently (or show nothing)

Privacy posture:

* Do not send raw user content (no actual photos/logs). Send only abstracted tags and ids.

---

## 11) Testing approach (client-side)

* Unit tests:

  * resolver determinism (golden fixtures)
  * pack validation
  * event replay equivalence
* Integration tests:

  * start run → play 3 incidents → win/loss
  * offline resume mid-run
  * daily bundle cache and play offline
* UI tests:

  * critical flows (PlayScreen commit)
  * WhySheet accuracy

(Full QA plan is D21; this section just defines client-local scope.)

---

## 12) Acceptance criteria (v1)

1. **Offline:** user can complete a Free Play run with no network after initial cache.
2. **Determinism:** two devices replaying the same event log + manifest produce identical state.
3. **Instant feel:** commit updates Lock Strength and Scrutiny within 120ms.
4. **Non-blocking voice:** gameplay continues with no dependency on bark generation or network.
5. **Safe updates:** a run in progress is not affected by new pack installs.
6. **Fail-closed content:** invalid packs never load; app degrades gracefully to last known good content.

