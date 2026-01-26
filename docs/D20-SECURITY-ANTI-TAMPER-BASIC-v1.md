# D20 — SECURITY & ANTI-TAMPER (BASIC) v1.md

**Status:** Draft v1.0 (Ship-blocking, Tiered)
**Owner:** Engineering (Platform)
**Last Updated:** 2026-01-25
**Purpose:** Define a practical, tiered security and anti-tamper approach for Life with AURA that preserves offline-first play while enabling trustworthy Daily runs and shareable proof. This doc focuses on *integrity*, *content authenticity*, and *replay verifiability*—not competitive anti-cheat.

---

## 0) Threat model (what we are defending against)

### In-scope threats (v1)

1. **Pack tampering:** user modifies protocol/incident/voice packs to make runs easier.
2. **Event log tampering:** user edits event stream to claim a win.
3. **Replay ambiguity:** mismatched packs/versions cause “same seed, different outcomes.”
4. **Client state corruption:** partial writes cause run to become unreplayable.

### Out-of-scope (v1)

* Preventing a determined user from cheating locally in Free Play (they own their device).
* Competitive leaderboard-grade anti-cheat.
* Protecting against compromised OS / rooted devices.
* Confidentiality of user secrets (we should avoid collecting them).

### Security philosophy

* **Fail-closed for content + replay:** if integrity checks fail, Daily is invalid and share proofs are marked “unverified.”
* **Tiered:** ship Tier 0 offline MVP; add Tier 1 verification for Daily and sharing; Tier 2 server verification optional later.

---

## 1) Integrity tiers (what ships when)

### Tier 0 — Offline MVP (ship-blocking baseline)

* Deterministic resolver and event-sourcing (D04A).
* Pack schema validation (D09) and local cache correctness.
* No cryptographic guarantees; best-effort corruption handling.

**Daily stance in Tier 0:** Daily can exist but is “best-effort” and not verifiable. Sharing is for fun only.

### Tier 1 — Verifiable Daily + Share Proofs (recommended soon after MVP)

* **Pack authenticity:** packs referenced by a manifest must match **content hashes**.
* **Event integrity:** per-event hash + chained hash (append-only audit chain).
* **Manifest binding:** run binds to a manifest that pins exact pack hashes.
* **Proof artifact:** share card includes chain head + manifest id.

**Daily stance in Tier 1:** Daily can be trusted *locally* and shareable as “verifiable replay” if recipient has same manifest/packs (or uses a server verifier later).

### Tier 2 — Server verification (later, optional)

* Server stores daily manifests and pack hashes and can verify a submitted run:

  * checks chain integrity
  * checks manifest authenticity
  * optionally replays deterministically

**Daily stance in Tier 2:** you can safely run a global leaderboard.

---

## 2) Pack authenticity and trust model

### 2.1 Content-addressing (Tier 0+)

All packs are immutable blobs identified by:

* `pack_id` (human identifier)
* `version` (semver)
* `pack_hash` = `sha256(canonical_pack_json_bytes)` (or canonical bytes of zip if packaged)

**Rule:** The hash is computed over a canonical representation, not pretty-printed JSON.

### 2.2 Manifest pinning (Tier 0+)

Daily/Free Play runs must bind to a `manifest_id` that lists exact pack hashes.

* A run is replayable iff its manifest pack hashes exist in local cache.

### 2.3 Pack signing (Tier 1 recommended)

To prevent users from installing arbitrary packs while claiming “official” Daily results:

* Each published pack includes:

  * `signature` over `(pack_id, version, pack_hash)` or over the full canonical bytes.
* Client embeds the public key for “official packs.”
* Client verifies signature before marking pack as `OFFICIAL`.

**Trust states**

* `OFFICIAL` (signature valid)
* `UNOFFICIAL` (user-sideloaded or signature missing/invalid)
* `INVALID` (schema fails or hash mismatch)

**Daily rule (Tier 1):**

* Daily manifests must reference **OFFICIAL** packs only.
* If any referenced pack is not OFFICIAL, Daily is marked `UNVERIFIED` and cannot submit to leaderboards (when those exist).

### 2.4 Pack transport

* Packs served via CDN with immutable URLs (include hash in URL path).
* Service worker caches by URL (CacheFirst).

---

## 3) Event log integrity (Tier 1)

### 3.1 Canonical event encoding (required)

Use canonical JSON encoding (D04A §4.1):

* UTF-8 bytes
* stable key ordering
* stable number formatting
* no whitespace significance

### 3.2 Event hash

For each event `E`:

* `event_hash = SHA-256(canonical_bytes(E))`

### 3.3 Chain hash (append-only)

* `chain_hash_0 = SHA-256("AURA_CHAIN_V1")` (domain-separated constant)
* `chain_hash_i = SHA-256(chain_hash_{i-1} || event_hash_i)`

Store `event_hash_i` and `chain_hash_i` alongside each event (D19).

**Rules**

* `seq` must be contiguous and used only for ordering.
* `ts` is excluded from mechanical logic but is included in canonical event bytes; if you include it, keep it stable.

  * Recommended: include `ts` but treat as optional and always present. Or omit entirely from canonical bytes. Pick one and lock it.

### 3.4 Detection vs prevention

This system does not *prevent* local modification; it makes it detectable.

* Any modification to an earlier event changes chain head hash.

---

## 4) Run proof artifacts (Tier 1)

### 4.1 Proof fields

When a run ends, compute and store:

* `manifest_id`
* `chain_head_hash` (hash at last event)
* `event_count`
* `run_id`
* `result` (win/loss), reason

### 4.2 Share card “verification badge”

* If `Tier 1 checks pass`:

  * show “VERIFIABLE” badge
* Else:

  * show “UNVERIFIED (LOCAL)” badge

### 4.3 Optional proof export

Allow exporting a compact proof bundle:

* `manifest_id`
* `chain_head_hash`
* `events` (full list) OR `event_hashes` (if replayer requires full events, include them)
* pack hashes list (from manifest)

This enables later server verification without requiring the user to have been online during the run.

---

## 5) Client-side tamper resistance (basic, not adversarial)

These measures reduce accidental corruption and casual cheating. They will not stop determined attackers.

### 5.1 Strict validation gates (Tier 0+)

* Reject invalid events (schema, seq, phase legality) before append (D04A §9).
* Reject packs that fail schema validation (D09).

### 5.2 Write-ahead logging (WAL) for events (Tier 0+)

To avoid partial writes corrupting a run:

* Append event to `events` table in a single transaction.
* Update `run_header.last_seq` only after event write succeeds.

### 5.3 Snapshots are non-authoritative (Tier 0+)

* Snapshots can be deleted and recomputed.
* Never accept a snapshot without matching replay.

### 5.4 Debug/developer modes

* Keep “developer tools” behind an internal flag, not a UI toggle in production builds.
* If you ship any debug toggles, they must mark runs as `UNVERIFIED`.

### 5.5 Obfuscation (optional, low priority)

* Minification and basic obfuscation is fine but not relied upon.
* Do not invest heavily here; integrity should come from Tier 1 hashing/signing.

---

## 6) Daily mode hardening (Tier 1 minimum)

### 6.1 Daily manifest source of truth

* Daily manifests published by your backend (D18) and cached by clients.
* Manifest must be signed (recommended):

  * `manifest_signature = sign(manifest_hash)`

### 6.2 Daily run constraints

* Standardized loadout rules enforced client-side *and* encoded in manifest:

  * `meta_perks_disabled = true`
  * `allowed_artifact_packs` list
* If client violates constraints (detected by validation rules during RUN_STARTED or DRAFT_PICKED):

  * mark run `UNVERIFIED`

### 6.3 Offline daily play

* If daily bundle is cached and signatures validate, daily can be played offline.
* If signatures cannot be checked (Tier 0), daily is playable but unverified.

---

## 7) Privacy and safety considerations

* Do not collect or transmit real “evidence” (photos, health data, etc.).
* Evidence in-game is fictional archetypes; only tags and IDs exist.
* Enhanced AURA (runtime LLM) should never receive:

  * user-entered personal info
  * raw logs
  * device identifiers beyond a random install ID (if needed)

---

## 8) Operational security (minimal)

### 8.1 Key management (Tier 1)

* Keep signing private key offline or in a secure KMS.
* Public key is embedded in client and rotated via app update or trusted manifest.

### 8.2 Revocation strategy

* If a pack is found broken/abusive:

  * publish a new manifest that stops referencing it
  * optionally publish a revocation list (small JSON) signed and fetched by client
* Client marks revoked packs as `OFFICIAL_REVOKED` but keeps them for replay of archived runs (with “unverified” badge if desired).

---

## 9) Acceptance criteria (v1)

Tier 0 (ship-blocking):

1. Event append is transactional and resilient; runs do not corrupt on crash.
2. Packs are validated before use; invalid packs fail-closed.
3. Runs bind to manifests and replay deterministically.

Tier 1 (recommended next milestone):
4. Client verifies pack hashes match manifest.
5. Client computes event hash chain and stores chain head.
6. Daily runs can be marked “VERIFIABLE” when official manifests/packs validate.