# D18 — BACKEND MINIMUM (Packs + Daily Seed) v1

**Status:** Draft v0.1
**Owner:** Backend / Live Ops
**Last Updated:** 2026-01-25
**Purpose:** Specify the minimal service layer to support an offline-first PWA with daily featured content, pack delivery, and optional telemetry—without turning the game into a heavy live service.

---

## 0) Kernel decision context

> **Note:** We are **not throwing away the kernel**. We are **reclassifying it** as the canonical determinism "reference implementation" (event log, hash/state hashing patterns, replay fixtures, pack validation harness). The runtime resolver is ported to TypeScript for the PWA. The kernel can optionally be reused server-side later for verification and content pipeline.

---

## 0A) Backend role: distribution, not adjudication

The backend serves content; it does NOT adjudicate gameplay.

| Backend provides | Backend does NOT provide |
|------------------|--------------------------|
| Pack manifests (JSON) | Game state computation |
| Pack files (CDN) | Move resolution |
| Daily schedule | Real-time multiplayer sync |
| Optional telemetry endpoint | SSR gameplay service |
| Optional auth/account (later) | Authoritative adjudication |

**Explicit rule:** No SSR gameplay service. All resolution is client-side. If the server ever computes game outcomes, you've broken the offline-first contract.

---

## 1) Goals

1. **Offline-first gameplay:** core loop runs entirely on-device; backend never blocks a turn.
2. **Daily featured experience:** one deterministic “Daily Featured Incident” (or mini-run) per calendar day.
3. **Pack-serviced content:** deliver/update content and tuning via versioned Packs.
4. **Safe rollout:** allow staged pack releases and emergency rollback.
5. **Monetization-ready:** enable “free daily + paid archive/packs” without requiring complicated backend at launch.

---

## 2) Non-goals

* Real-time multiplayer, matchmaking, chat, live PvP
* Server-side adjudication of outcomes (v1)
* Anti-cheat / secure leaderboards (defer until competitive modes)
* Always-online accounts requirement (optional; not required for v1)
* Runtime LLM calls required for core gameplay

---

## 3) High-level architecture

**Client (PWA)**

* Deterministic resolver (TypeScript)
* Pack cache (IndexedDB)
* Manifest polling (lightweight)
* Daily endpoint fetch (lightweight)
* Optional telemetry POST (fire-and-forget)

**Backend (Minimum)**

* **CDN** for pack files (static JSON assets)
* **Manifest API** (current recommended pack set and metadata)
* **Daily API** (returns daily seed + incident selection + pack binding)
* **Telemetry API** (optional; batch ingest)

This is intentionally “thin service”: the backend distributes content and scheduling, not gameplay.

---

## 4) Content delivery model

### 4.1 Pack hosting

All pack files are static and served from a CDN.

**URL layout (recommended):**

* `/packs/{pack_type}/{pack_id}/{version}.json`
* Examples:

  * `/packs/protocol/protocol-core/1.0.3.json`
  * `/packs/incident/incident-kitchen/0.4.1.json`
  * `/packs/voice/voice-default/0.2.0.json`
  * `/packs/artifacts/artifacts-core/0.6.0.json`

**Client caching rules:**

* Pack files: cache long (e.g., 30–180 days), immutable versions.
* Use `Cache-Control: public, max-age=31536000, immutable` for versioned assets.

### 4.2 Pack manifest

The manifest is the authoritative “what to load” list.

**Manifest responsibilities:**

* Specifies the currently recommended pack set.
* Supports staged rollout (channels).
* Supports rollback by moving the “current” pointer.

**Manifest caching:**

* Short TTL (e.g., 5–15 minutes) + ETag.
* Client uses “stale-while-revalidate” behavior: keep last-known-good if fetch fails.

---

## 5) Daily featured content model

### 5.1 Daily binding rules

The daily featured experience must bind:

* **date** (America/Los_Angeles canonical day boundary unless otherwise specified)
* **daily_id** (a stable identifier)
* **seed**
* **incident/run spec reference** (template id or incident id)
* **required pack manifest version / pack set hash**

This ensures that “today’s daily” is reproducible and not affected by later pack updates unless you explicitly choose to.

### 5.2 Daily generation approach

Two acceptable strategies:

**A) Precomputed daily schedule (recommended for control)**

* Each day is curated: {daily_id, incident_id, seed, pack_manifest_id}
* Stored in backend (small table) and returned by the Daily API.
* Pros: maximum control, easy to avoid bad dailies, easy to theme.
* Cons: requires ops pipeline to publish daily entries.

**B) Deterministic derived daily (acceptable fallback)**

* daily_id computed from date.
* seed computed as HMAC(date, server_secret) truncated.
* incident chosen by deterministic selection from a curated pool.
* Pros: minimal ops overhead.
* Cons: harder to guarantee quality and avoid pathological combinations.

**Recommendation:** Start with (A). You can still generate entries automatically, but you approve/publish the schedule.

### 5.3 Offline behavior

If the Daily endpoint is unavailable:

* Client uses cached last successful DailySpec for that date if present.
* If none: fall back to Free Play runs (procedural) using locally cached packs.

---

## 6) API specification (v1)

### 6.1 GET Manifest

`GET /api/v1/manifest?channel=stable`

**Response:**

* `manifest_id` (string)
* `channel` (stable/beta)
* `created_at`
* `packs[]`: list of `{pack_type, pack_id, version, url, sha256}`
* `min_client_version` (optional)
* `rollout` (optional: percentage or cohort tags)

**Client behavior:**

* Fetch on app start and then periodically (e.g., every 6–12 hours).
* If fetch fails: keep last cached manifest.

### 6.2 GET Daily

`GET /api/v1/daily?date=YYYY-MM-DD&channel=stable`

**Response (DailySpec):**

* `date`
* `daily_id`
* `seed` (string or int64)
* `mode`: `DAILY_INCIDENT` | `DAILY_MINIRUN` (if you expand later)
* `incident_ref` (id or template ref)
* `bound_manifest_id`
* `pack_overrides` (optional; rare hotfix)
* `valid_from`, `valid_until`
* `ruleset_version` (optional: protocol version lock)

**Client behavior:**

* Resolve date in America/Los_Angeles (or use server-provided canonical date if client timezone differs).
* If daily spec is fetched, cache it with the day key.
* If daily spec changes mid-day (should be rare), treat it as a new daily_id; preserve old cached one for users who started.

### 6.3 GET Pack file

Served from CDN (not the API), using the URL provided in the manifest.

### 6.4 POST Telemetry (optional)

`POST /api/v1/telemetry`

**Payload:**

* `client_id` (random UUID, stored locally; not PII)
* `session_id`
* `events[]` (batched):

  * `event_name`
  * `ts`
  * `daily_id` / `run_id`
  * minimal fields (e.g., win/loss, turns, max_scrutiny, audit_count, dead_hand_count)
* `manifest_id`

**Constraints:**

* Must be safe to drop (fire-and-forget).
* Never required for gameplay.

---

## 7) Versioning and rollout strategy

### 7.1 Semantic versioning policy

* Packs use semantic versioning.
* Manifest references exact versions; pack files are immutable once published.

### 7.2 Release channels

* `stable` default
* `beta` optional (for internal testing)

### 7.3 Rollback

Rollback is achieved by repointing the manifest to prior versions (no client update needed).

### 7.4 Hotfixes

If a daily incident is broken:

* Prefer issuing a **new daily_id** rather than mutating the existing one.
* If mutation is unavoidable, include `pack_overrides` for the day and mark the old as deprecated.

---

## 8) Monetization integration (v1-ready)

The backend minimum does not need to do payments at first.

### 8.1 Entitlements model (client-first)

Entitlements can be local (for web) or platform-managed later (App Store / Play Store).

**Entitlement flags:**

* `archive_access` (boolean)
* `pack_entitlements[]` (list of pack_ids unlocked)
* `cosmetics_entitlements[]`

### 8.2 Content gating rules

* Free users: access Daily + base packs from stable manifest.
* Paid unlock: enables archive endpoints/features client-side (no backend required).
* Subscription (later): manifest can include subscriber-only packs; client only loads them if entitlement present.

**Important:** Do not make the daily dependent on entitlements. Daily is acquisition and habit.

---

## 9) Security posture (minimum viable)

For v1 offline-first without competitive leaderboards:

* Pack files include `sha256` in manifest; client verifies after download.
* Manifest served over HTTPS with ETag and caching.
* No requirement for signed run logs in v1.

**Later (when competitive/leaderboards):**

* Add pack signing (public key verification).
* Add server recomputation of runs for score validation.

---

## 10) Operational requirements

* CDN with cache invalidation capabilities (for manifest only; packs are immutable).
* Simple config store or DB table for:

  * manifest versions per channel
  * daily schedule entries (date → DailySpec)
* Observability:

  * daily endpoint success rate
  * manifest fetch success rate
  * pack CDN 404 rate

---

## 11) MVP acceptance criteria

1. Fresh install can play Free Play without any network after first load (cached baseline packs).
2. With network, client receives DailySpec for the current day and can play it.
3. Updating the manifest updates packs without requiring a client release.
4. If the daily endpoint is down, client gracefully falls back to cached daily or Free Play.
5. Telemetry (if enabled) never blocks gameplay and can be fully disabled.

---

## 12) Implications for kernel usage (explicit)

* The Python kernel remains in-repo as:

  * a deterministic reference implementation for fixtures,
  * a pack validator/harness,
  * and a future server verifier (if/when needed).
* The shipped PWA runtime is TypeScript-first for responsiveness and offline play.
* Therefore, we do **not** require tamper-evident hash chaining for v1, but we maintain deterministic specs so we can add verification later without redesign.

---

## 13) Daily content delivery (weekly schedules)

### 13.1 Endpoints / CDN paths

| Path | Purpose |
|------|---------|
| `/daily/schedules/week-YYYY-MM-DD.json` | Weekly schedule (7 days) |
| `/daily/schedules/override.json` | Hotfix override schedule (rare) |
| `/daily/manifests/daily-YYYY-MM-DD.vN.json` | Immutable daily manifest |
| `/content/manifests/content-manifest-*.json` | Content pack manifest |
| `/packs/<pack_id>/<version>/pack.zip` | Pack bundle |

### 13.2 Caching rules

| Asset | Cache Policy |
|-------|--------------|
| Weekly schedule | 6-24h, revalidate with ETag |
| Daily manifest | Long (immutable by version) |
| Packs | Long (immutable by version) |
| Override schedule | 5-15 min (check frequently) |

### 13.3 Prefetch strategy (PWA)

On first open of the week:

1. Fetch `weekly_schedule.json`
2. Fetch today's `daily_manifest.json`
3. Fetch next 2 days' daily manifests
4. Fetch all referenced packs not in cache

Keep a **Last Known Good Schedule** in IndexedDB:

* If network fails, use cached schedule
* If today's daily is missing, fall back to Free Play

### 13.4 Hotfix mechanism (rare)

Support an **override schedule** at a stable URL:

* `/daily/schedules/override.json`

```json
{
  "enabled": true,
  "reason": "Unsolvable daily detected",
  "affected_dates": ["2026-02-05"],
  "overrides": {
    "2026-02-05": {
      "daily_manifest_id": "daily-2026-02-05.v2",
      "revision": 2
    }
  }
}
```

If `override.enabled=true`, client uses the override manifest for matching dates.

**Rule:** Hotfix affects **new starts** only. Existing runs remain bound to their original manifest.

---

## 14) Remote flags / Safe mode

A lightweight **remote_flags.json** allows ops to disable features or trigger fallbacks without a client release.

### 14.1 Endpoint

* `/config/remote_flags.json`
* Caching: 5-15 min TTL, stale-while-revalidate

### 14.2 Schema

```json
{
  "v": 1,
  "issued_at": "2026-01-25T21:00:00Z",
  "ttl_seconds": 21600,
  "flags": {
    "disable_enhanced_voice": false,
    "exclude_channels": [],
    "disable_pack_ids": [],
    "fallback_to_last_known_good_daily": false,
    "disable_daily_override": false
  }
}
```

### 14.3 Flag definitions

| Flag | Type | Effect |
|------|------|--------|
| `disable_enhanced_voice` | bool | Disable runtime LLM voice; use pre-gen only |
| `exclude_channels` | string[] | Exclude channels from daily selection (e.g., `["RELEASE_CANDIDATE"]`) |
| `disable_pack_ids` | string[] | Fail-closed on specific pack id@version |
| `fallback_to_last_known_good_daily` | bool | If today's daily fails, use cached LKG |
| `disable_daily_override` | bool | Ignore override schedule even if present |

### 14.4 Client behavior (normative)

* If `fallback_to_last_known_good_daily=true` and today's daily manifest fails fetch/validate:
  * Load **Last Known Good** daily manifest from cache
  * If no LKG exists, generate deterministic **Practice Daily** (same seed derivation, non-leaderboard)
* If `exclude_channels` includes a channel, daily selection ignores dailies marked with that channel
* If `disable_pack_ids` contains a pack id/version, pack loader fails closed on that pack and excludes any manifest requiring it
* If `disable_daily_override=true`, ignore override schedule

**Acceptance:** One bad pack/schedule cannot brick the app.

---

If you want, the next doc in the sequence that naturally follows D18 is **D08 (Pack System Overview)** or **D09 (Pack Schemas JSON v1)**, because D18 assumes manifests and pack files exist.
