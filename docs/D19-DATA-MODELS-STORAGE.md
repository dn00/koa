# D19 — DATA MODELS & STORAGE.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Engineering (Runtime/Persistence)
**Last Updated:** 2026-01-25
**Purpose:** Define the canonical client-side data models and storage layout for Life with AURA (offline-first PWA). This document formalizes schemas for runs, event logs, derived snapshots, pack cache, manifests, codex/unlocks, settings, archive, and migration/versioning rules. It aligns with the event model in D04A and the client architecture in D17.

---

## 0) Principles

1. **Event-sourced truth:** Mechanical truth is the event stream; derived state is a cache.
2. **Content-addressed packs:** Packs are stored by hash; manifests bind a run to specific hashes.
3. **Fail-closed replay:** If an event stream or binding cannot replay, the run is marked invalid and not resumed.
4. **Offline durability:** All gameplay-critical data lives locally (IndexedDB). Network is an enhancement.
5. **Forward compatibility:** Schema version fields are mandatory. Migrations are explicit.

---

## 1) Storage technology and layout

### 1.1 Primary store

* **IndexedDB** via Dexie (preferred) or equivalent.
* One database: `aura_pwa_v1`

### 1.2 Secondary stores

* **Cache Storage** (Service Worker) for large immutable pack payloads and assets (SFX, icons).
* Optional: `localStorage` for a single “last_run_id” pointer (non-critical).

### 1.3 Data partitioning

Partition by `run_id` for:

* events
* snapshots
* per-run telemetry
* run-local derived artifacts (e.g., assembled incident instance)

---

## 2) Versioning strategy

### 2.1 Client schema version

* Database schema version: `db_schema_v` (Dexie version)
* Stored in DB metadata table.

### 2.2 Domain schema versions

Each record includes:

* `v`: record schema version (integer)

### 2.3 Immutable vs mutable records

* Immutable:

  * events
  * manifests (once used)
  * pack content blobs (by hash)
* Mutable:

  * run header (status updates)
  * snapshots (append-only; latest pointer changes)
  * settings
  * codex/unlocks
  * telemetry queue (retry counts)

---

## 3) Core entities and schemas

All schemas below are normative. Field names are canonical and must match persisted keys.

## 3.1 RunHeader (runs table)

Represents the “index” for a run and its binding.

```json
{
  "v": 1,
  "run_id": "uuid",
  "status": "ACTIVE|ENDED|INVALID",
  "mode": "DAILY|FREEPLAY",
  "seed": "int64_or_string",
  "created_at": 1737840000,
  "updated_at": 1737840123,

  "binding": {
    "manifest_id": "manifest_2026-01-25_daily",
    "protocol_pack_hashes": ["sha256:..."],
    "incident_pack_hashes": ["sha256:..."],
    "artifact_pack_hashes": ["sha256:..."],
    "voice_pack_hashes": ["sha256:..."]
  },

  "daily": {
    "daily_id": "daily_2026-01-25",
    "date": "2026-01-25"
  },

  "progress": {
    "act_profile": "ACT1|ACT2|LOCKDOWN",
    "incident_id": "inc_...",
    "turn_index": 3,
    "turn_limit": 9
  },

  "result": {
    "outcome": "WIN|LOSS",
    "reason": "TURN_LIMIT|AUDIT_FAIL|PLAYER_QUIT|...",
    "ended_at": 1737840999
  },

  "pointers": {
    "last_seq": 42,
    "last_snapshot_seq": 40
  }
}
```

**Rules**

* `binding.manifest_id` is mandatory for all modes.
* `daily` object is present iff `mode=DAILY`.
* `status=INVALID` means replay failed; UI should offer “Archive + details,” not resume.

---

## 3.2 EventRecord (events table)

Matches D04A canonical envelope and stores canonical JSON (or structured fields + canonical serialization).

Option A (store canonical JSON blob):

```json
{
  "run_id": "uuid",
  "seq": 12,
  "v": 1,
  "event_json": "{...canonical json string...}",
  "event_hash": "sha256:..",
  "chain_hash": "sha256:.."
}
```

Option B (store structured for queries + canonical json for hash):

```json
{
  "run_id": "uuid",
  "seq": 12,
  "v": 1,
  "type": "MOVE_RESOLVED",
  "ts": 1737840000,
  "data": { },
  "event_hash": "sha256:..",
  "chain_hash": "sha256:.."
}
```

**Rules**

* `seq` is contiguous; no gaps.
* `event_hash/chain_hash` are optional Tier 0; required Tier 1+ (D20).
* The canonical JSON encoding used for hashing must be identical across platforms.

---

## 3.3 SnapshotRecord (snapshots table)

Caches derived state for fast resume.

```json
{
  "v": 1,
  "run_id": "uuid",
  "seq": 40,
  "created_at": 1737840500,
  "state_json": { "derived_state": "..." }
}
```

**Rules**

* Snapshot is a pure cache; must be discardable.
* Snapshot `seq` must correspond to an existing event seq.
* On resume: load latest snapshot and replay remaining events.

---

## 3.4 Manifest (manifests table)

Binds runs to exact content versions/hashes. Manifests are immutable once referenced by any run.

```json
{
  "v": 1,
  "manifest_id": "manifest_2026-01-25_daily",
  "mode": "DAILY|FREEPLAY",
  "created_at": 1737840000,

  "seed": "int64_or_string",

  "pack_refs": [
    { "pack_id": "protocol.core", "version": "1.0.0", "hash": "sha256:..." },
    { "pack_id": "incident.core", "version": "1.0.0", "hash": "sha256:..." },
    { "pack_id": "artifact.core", "version": "1.0.0", "hash": "sha256:..." },
    { "pack_id": "voice.core.en", "version": "1.0.0", "hash": "sha256:..." }
  ],

  "daily": {
    "daily_id": "daily_2026-01-25",
    "date": "2026-01-25"
  },

  "constraints": {
    "daily_standard_loadout": true,
    "meta_perks_disabled": true
  }
}
```

**Rules**

* Manifests must be fully resolvable offline if packs are installed.
* Daily manifests must not be mutated after publication; new manifest = new day.

---

## 3.5 PackIndex (packs table)

Metadata for installed packs. Pack content stored in IndexedDB or Cache Storage.

```json
{
  "v": 1,
  "pack_hash": "sha256:...",
  "pack_id": "protocol.core",
  "version": "1.0.0",
  "kind": "PROTOCOL|INCIDENT|ARTIFACT|VOICE",
  "installed_at": 1737840000,
  "bytes": 24512,
  "source": "CDN|SIDeload",
  "status": "INSTALLED|INVALID|EVICTED",
  "content_pointer": {
    "store": "IDB|CACHE",
    "key": "sha256:..."
  }
}
```

**Rules**

* `pack_hash` is the primary key; content-addressed.
* Pack eviction (storage pressure) is allowed only for packs not referenced by:

  * active run
  * any archived run with “replayable” flag set

---

## 3.6 DailyCacheStatus (daily_cache table, optional)

Tracks whether today’s daily is available offline.

```json
{
  "v": 1,
  "daily_id": "daily_2026-01-25",
  "date": "2026-01-25",
  "manifest_id": "manifest_2026-01-25_daily",
  "cached_at": 1737840000,
  "status": "READY|PARTIAL|MISSING",
  "missing_pack_hashes": []
}
```

---

## 3.7 CodexUnlocks (codex table)

Captures player mastery without power creep.

```json
{
  "v": 1,
  "player_id": "local",
  "unlocks": {
    "gates_seen": { "gate.core.NO_SELF_REPORT": 7 },
    "counter_paths_discovered": {
      "gate.core.NO_SELF_REPORT:pathA": true,
      "gate.core.TIMESTAMP_REQUIRED:pathC": true
    },
    "artifacts_unlocked": { "artifact.core.METADATA_SCRAPER": true },
    "tools_unlocked": { "tool.core.CORROBORATOR": true },
    "voice_packs_owned": { "voice.pack.sass.v1": true }
  },
  "updated_at": 1737840555
}
```

**Rules**

* Codex does not increase raw damage; it increases options/content variety.
* Daily mode may ignore codex unlocks for standardized loadout.

---

## 3.8 PlayerSettings (settings table)

```json
{
  "v": 1,
  "key": "enhanced_aura_enabled",
  "value": false,
  "updated_at": 1737840000
}
```

Recommended setting keys (v1):

* `enhanced_aura_enabled` (bool)
* `telemetry_opt_out` (bool)
* `haptics_enabled` (bool)
* `sfx_volume` (0–1)
* `voice_volume` (0–1)
* `reduce_motion` (bool)
* `last_active_run_id` (string)

---

## 3.9 ArchiveEntry (archive table)

Stores end-of-run summary for browsing without replay.

```json
{
  "v": 1,
  "run_id": "uuid",
  "ended_at": 1737840999,
  "mode": "DAILY|FREEPLAY",
  "manifest_id": "manifest_...",
  "result": "WIN|LOSS",
  "reason": "TURN_LIMIT|AUDIT_FAIL|...",
  "stats": {
    "turns": 9,
    "audits": 2,
    "scrutiny_max": "HIGH",
    "gates_cleared": 3
  },
  "share_card": {
    "title": "ACCESS DENIED",
    "summary_line": "Audit Heat: HIGH • Turns: 9 • Gate: No Self-Report",
    "seed": "..."
  }
}
```

**Rules**

* Archive entries must be readable even if packs are evicted later.
* Archive does not require replay; it’s a summary.

---

## 3.10 TelemetryQueueItem (telemetry_queue table)

```json
{
  "v": 1,
  "id": "uuid",
  "created_at": 1737840000,
  "retry_count": 0,
  "next_retry_at": 1737840300,
  "payload": {
    "event": "RUN_ENDED",
    "run_id": "uuid",
    "mode": "DAILY",
    "manifest_id": "manifest_...",
    "stats": { }
  }
}
```

**Rules**

* Never store raw player text or sensitive content.
* Payloads should be small, structured, and anonymized (D22).

---

## 4) Indexes and query patterns

### 4.1 Required indexes

* `events`: compound index `(run_id, seq)` for ordered replay
* `runs`: index on `status`, `updated_at` for resume
* `archive`: index on `ended_at` for timeline
* `packs`: index on `pack_id`, `version` for browsing installed packs
* `telemetry_queue`: index on `next_retry_at`

### 4.2 Common queries

* Resume:

  * find latest `runs` where `status=ACTIVE` order by `updated_at desc`
  * load snapshot for run
  * load events after snapshot seq
* Daily availability:

  * read `daily_cache` for today’s `daily_id`
* Pack purge:

  * find packs not referenced by any `manifest_id` used in archive or active run

---

## 5) Migration and compatibility rules

### 5.1 DB schema migrations

* Use Dexie version bumps.
* Migrations must be:

  * additive where possible
  * non-destructive for `events` and `manifests`
* If a destructive change is unavoidable:

  * export archive summaries first
  * then rebuild DB

### 5.2 Event schema immutability

* Event envelope `v` is immutable; changes create a new `v=2`.
* Client must continue to replay old event streams or mark them `INVALID` with explanation.

### 5.3 Pack schema evolution

* Packs have their own `pack_schema_v`.
* New client must support old pack schema within a compatibility window (e.g., last 2 minor versions).
* Pack validator must reject unknown major versions.

---

## 6) Integrity and replay verification (tiered)

### Tier 0 (MVP offline)

* No hash chaining required.
* Trust local data, but validate structure and seq continuity.

### Tier 1 (share/verification)

* Store `event_hash` and `chain_hash` per event (D04A).
* Store manifest hash and pack hashes.
* On replay:

  * verify chain
  * verify manifest pack hashes exist and match installed pack contents

### Tier 2 (server verification later)

* Server can request:

  * manifest_id
  * event chain head hash
  * optionally full event stream for verification

---

## 7) Storage pressure and eviction policy

### 7.1 Priorities

1. Keep app shell cached (SW)
2. Keep packs referenced by:

   * active run manifests
   * last N archived runs marked “replayable”
3. Evict oldest unreferenced packs

### 7.2 Replayability flag

* Archive entries can specify:

  * `replayable=true` only if packs are retained
* If a pack is evicted later, set `replayable=false` and keep summary.

---

## 8) Security/privacy posture (local data)

* Do not store:

  * personal real-world data (photos, actual health data)
  * any user-entered freeform text beyond short optional “notes” if you add them (not needed v1)
* If Enhanced AURA is enabled:

  * store only the toggle and minimal request metadata (no prompts/responses required)

---

## 9) Acceptance criteria (v1)

1. An `ACTIVE` run resumes reliably from snapshot + events after an app restart.
2. Events and manifests are immutable and replay deterministically.
3. Packs are content-addressed by hash and can be evicted safely without breaking active runs.
4. Archive view is available without replay or pack presence.
5. Migration does not destroy event logs unless explicitly reset by the user.

