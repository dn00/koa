# D23 — RELEASE & VERSIONING POLICY.md

**Status:** Draft v1.0 (Ship-blocking for pack-serviced game)
**Owner:** Engineering (Release) + Content Ops
**Last Updated:** 2026-01-25
**Purpose:** Define strict versioning and release policies for a pack-serviced, offline-first game. This includes semantic versioning for packs, manifest lifecycles, daily publishing workflows, compatibility rules between client and packs, rollback strategies, deprecation policies, and how we preserve determinism and replayability across updates.

---

## 0) Definitions

* **Client**: the PWA application binary (HTML/JS bundle + service worker).
* **Pack**: versioned content blob (Protocol, Incident, Voice, Artifact/Tool).
* **Manifest**: immutable mapping of “official content set” → exact pack hashes/versions.
* **Daily**: a featured seed + manifest binding for a date.
* **Compatibility window**: range of client versions that must support a manifest for replay.

---

## 1) Non-negotiable invariants

1. **Runs bind to a manifest** (or explicit pack hash list) at RUN_STARTED (D04A Event Model).
2. **Manifests are immutable** once published (except explicit “revision” rules).
3. **Packs are immutable** once published (content-addressed by hash).
4. **Determinism over convenience:** never “hot swap” mechanics mid-run.
5. **Fail-closed loading:** if pack validation or signature verification fails (Tier 1), treat content as unverified/unplayable for Daily.

---

## 2) Semantic versioning rules

### 2.1 Client semver

Client uses semver: `MAJOR.MINOR.PATCH`

* **MAJOR**: breaking changes to event schema, replay format, pack schema contracts, or resolver behavior that would invalidate old runs without migration.
* **MINOR**: backward-compatible feature additions (new screens, new telemetry fields, new non-breaking pack handling).
* **PATCH**: bug fixes, performance fixes, UI polish.

**Rule:** Any change that alters deterministic outcomes for the same (manifest + event stream) is a **MAJOR** unless it is confined to new pack versions and old manifests are preserved.

### 2.2 Pack semver (per pack type)

Each pack is versioned: `pack_version = MAJOR.MINOR.PATCH`

**Protocol Pack**

* **MAJOR**: changes semantics of gate resolution, counter-path selection rules, or move physics that would alter outcomes for existing runs bound to older protocol versions.
* **MINOR**: adds new gates/modifiers/moves *without changing existing ones*; tuning changes that only affect new incidents referencing new values (be careful: tuning can still change outcomes—see §2.4).
* **PATCH**: typo fixes, metadata fixes, voice keys, documentation.

**Incident Pack**

* **MAJOR**: breaks schema compatibility, changes incident assembly meaningfully (e.g., act profiles redefined).
* **MINOR**: adds new templates, new reward tables, new draft pools.
* **PATCH**: fixes obvious errors (wrong IDs, missing references) without changing intended difficulty for existing templates (prefer to bump MINOR if in doubt).

**Voice Pack**

* **MAJOR**: changes OutcomeKey schema or selection algorithm assumptions.
* **MINOR**: adds new bark sets/coverage.
* **PATCH**: fixes typos, removes repeats.

**Artifact/Tool Pack**

* **MAJOR**: changes meaning of existing archetypes or tool transforms in a way that affects resolver outcomes.
* **MINOR**: adds new archetypes/tools.
* **PATCH**: metadata/copy fixes.

### 2.3 Manifest versioning

Manifests are immutable documents with:

* `manifest_id` (unique)
* `created_at`
* `compat_client_min`, `compat_client_max` (optional)
* `pack_refs[]` referencing exact hashes

Manifests can optionally be labeled:

* `channel`: `daily|stable|beta`

**Rule:** Changing any referenced pack hash creates a **new manifest**.

### 2.4 Tuning changes and “semantic breaks”

Even “just tuning” (gate strength values, scrutiny deltas) changes outcomes. Therefore:

* tuning changes must occur in **new pack versions** and only apply to **new manifests** and **new runs**.
* old manifests remain replayable by caching their referenced pack hashes.

---

## 3) Compatibility model

### 3.1 Backward compatibility tiers

* **Tier A (Required):** Client can replay any run whose manifest references packs still available in cache or fetchable from CDN.
* **Tier B (Recommended):** Client can also validate Tier 1 signatures for official packs/manifests.

### 3.2 Compatibility contracts

Client must support:

* Event schema versions `v=1` (D04A)
* Pack schema versions `v=1` (D09)
* OutcomeKey schema version `v=1` (D12)

If you need to change schemas:

* introduce `v=2` alongside `v=1` support for at least one client major.
* provide a migration tool only if absolutely necessary.

### 3.3 Cache retention policy for replay

To ensure replay of past dailies:

* Keep at least **N days** of daily manifests and packs cached locally (configurable):

  * free tier: N = 7
  * paid: N = 365 (or unlimited if storage allows)

On eviction:

* Never evict packs referenced by:

  * active runs
  * archived runs within retention window

---

## 4) Release channels and cadence

### 4.1 Channels

* **Stable:** default; receives tested packs and client builds.
* **Beta:** optional; receives experimental packs and client features.

### 4.2 Cadence (suggested)

* Client releases: weekly or biweekly.
* Pack releases: continuous; daily manifests published daily; new packs weekly.

**Rule:** Daily should be produced from the **Stable** channel pack set.

---

## 5) Daily publishing workflow (operational)

### 5.1 Inputs

* Daily date: `YYYY-MM-DD` (timezone pinned; e.g., America/Los_Angeles).
* Daily seed: deterministic integer/string.
* Daily manifest: pins exact pack hashes.

### 5.2 Build steps (every day)

1. **Select content inputs**

   * choose incident templates allowed for daily
   * choose protocol pack version
   * choose voice pack version
2. **Assemble candidate daily**

   * run incident generator with the seed (D11)
3. **Validate**

   * schema validation of all referenced packs
   * solvability checks (D10/D21)
   * pacing checks (audit frequency estimates)
   * voice coverage checks (D12)
4. **Publish**

   * upload packs (if not already)
   * publish manifest `manifest_daily_YYYY-MM-DD_v1`
   * publish daily pointer:

     * `daily_index.json` mapping date → manifest_id + seed + metadata
5. **Smoke test**

   * replay golden scripted plan
   * verify chain hashing if Tier 1 enabled

### 5.3 Daily immutability and revisions

Preferred: **no revisions.** If a daily is broken:

* Post an in-app banner acknowledging issue.
* Fix tomorrow.

If a revision is unavoidable:

* Publish a new manifest with a revision suffix:

  * `manifest_daily_2026-01-25_r2`
* Update daily index to point to r2.
* Client must display:

  * “Daily revised (r2)” for transparency
* Leaderboards (if any) should not mix r1 and r2; treat as separate.

---

## 6) Rollback and hotfix strategy

### 6.1 Pack rollback

Since packs are immutable:

* rollback is just “publish a new manifest referencing earlier pack hashes.”

### 6.2 Client rollback

For PWA:

* Service worker can pin to a previous version if you maintain release snapshots.
* Prefer forward fixes, not rollbacks.
* If rollback is necessary:

  * keep prior build available on CDN with immutable version path
  * ensure cache invalidation is safe and does not break offline runs in progress

### 6.3 Emergency kill switch

If a pack is corrupt or malicious:

* publish a signed **revocation list** (Tier 1) that marks certain pack hashes revoked.
* client refuses to treat revoked packs as OFFICIAL for new dailies.
* do not delete immediately; preserve for archived replay with “unverified” badge if needed.

---

## 7) Deprecation policy

### 7.1 Pack deprecation

A pack version may be deprecated but not deleted.

* Mark deprecated in manifest metadata or a registry file:

  * `deprecated_since`, `replacement`, `reason`

### 7.2 Support window

* Dailies: support replay for at least 30 days (free) and 365 days (paid) if promised.
* Protocol pack major versions: support for 1 major back (e.g., v1 and v2 concurrently) during migration period.

### 7.3 Schema field deprecation policy

For JSON schema fields (e.g., `requires.capabilities` → `requires.capabilities_required`):

1. **Deprecation announcement:** Mark field as deprecated in docs with target removal version
2. **Warning period:** Emit validation warning (non-fatal) when deprecated field is used
3. **Dual support:** Support both old and new field names for at least 2 minor versions
4. **Removal:** Remove deprecated field only on schema major version bump (e.g., schema_version 1.0 → 2.0)

**Current deprecations:**

| Deprecated Field | Replacement | Deprecated Since | Remove In |
|------------------|-------------|------------------|-----------|
| `requires.capabilities` | `requires.capabilities_required` | v1.0 | schema v2.0 |

---

## 8) Determinism drift prevention

### 8.1 Replay compatibility rule

MOVE_RESOLVED events must be self-contained for replay:

* Contains `selected_counter_path_id`, `deltas`, `effects[]`
* Replay engine applies effects directly without recomputation
* No RNG calls during replay (all randomness captured in events)

### 8.2 Breaking change definition

A change is **breaking** if:

* Same (manifest + seed + action stream) produces different event hashes
* Replay of old event stream fails or produces different state
* Pack schema change invalidates existing packs

### 8.3 Breaking change policy

Breaking changes require:

1. Client major version bump
2. Event schema version bump
3. Migration path documented
4. Old fixtures preserved for regression testing
5. Announcement in release notes

### 8.4 Golden fixture regression

* CI must run golden replay fixtures on every build
* Any hash mismatch is a build failure
* New client versions must pass all historical fixtures (within supported schema versions)

---

## 8) Version pinning rules (engineering)

### 8.1 Run binding

RUN_STARTED must record:

* manifest_id (preferred)
* or explicit pack hash list (fallback)
* seed, mode, daily_id/date if daily

### 8.2 Mid-run pack updates

Client may download new packs while a run is active, but:

* the active run uses only packs referenced by its manifest.
* new packs apply only to new runs.

---

## 9) Documentation and traceability

For each release (client or pack set):

* publish a “Release Note” record with:

  * version(s)
  * manifest_ids affected
  * notable balancing changes
  * any migration notes
  * QA status (solvability pass, dominance pass, voice coverage pass)

For dailies:

* store a compact “daily build report”:

  * date, seed, manifest_id
  * validation suite results
  * intended difficulty band

---

## 10) Content lifecycle, promotion, and immutability

### 10.1 Lifecycle states (normative)

| State | Description |
|-------|-------------|
| `STAGING` | Internal development; never player-facing |
| `RELEASE_CANDIDATE` | Internally validated, eligible for scheduling |
| `FEATURED_DAILY` | Front door daily experience |
| `EVERGREEN` | Proven content, available in freeplay pool |
| `RETIRED` | No longer scheduled; still replayable if referenced by old manifest |

### 10.2 Immutability rules

* **Daily manifests are immutable once published.**
* Weekly schedule is mutable (can be superseded by override).
* Packs are immutable by version.

### 10.3 Promotion rules

New content moves through states:

```
STAGING → RELEASE_CANDIDATE → FEATURED_DAILY → EVERGREEN
                                     ↓
                                 RETIRED
```

* `STAGING → RELEASE_CANDIDATE`: after internal validation (D10 Stage C passes)
* `RELEASE_CANDIDATE → FEATURED_DAILY`: when scheduled in weekly batch
* `FEATURED_DAILY → EVERGREEN`: only after telemetry thresholds met (D22)
* `EVERGREEN → RETIRED`: manual decision, content removed from scheduling pool

### 10.4 Promotion to Evergreen thresholds (reference D22)

A daily must meet these metrics over 7+ days of play data to promote:

| Metric | Threshold |
|--------|-----------|
| Boss win rate | 25-55% |
| Dominance (top family) | < 55% |
| Dead-hand rate | < 8% |
| Median runtime | 8-14 min overall |

### 10.5 One-new-concept constraint

Re-assert from D11:

> A weekly schedule may introduce **at most one** new concept.
> A "new concept" is one of: a new Gate, a new Modifier, a new Artifact/Tool family (4-12 archetypes), or a new Theme/Subtheme.

---

## 11) Acceptance criteria (v1)

1. Manifests are immutable and content-addressed by exact pack hashes.
2. Client binds each run to a manifest and never changes it mid-run.
3. Daily publishing pipeline produces a manifest + seed with solvability and voice coverage checks passing.
4. Rollback is possible by publishing a new manifest referencing earlier pack hashes.
5. Client versioning and pack versioning rules prevent accidental determinism breaks.
6. Content follows lifecycle states and can only reach FEATURED_DAILY from RELEASE_CANDIDATE.
7. At most one new concept is introduced per week.
