# D08 — PACK SYSTEM OVERVIEW v2

**Status:** Draft v2.0
**Owner:** Content Platform / Runtime
**Last Updated:** 2026-01-26
**Purpose:** Define the pack system that services Home Smart Home: what packs are, how they are versioned, loaded, validated, and bound to daily/practice runs—while keeping gameplay deterministic and offline-first.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 1) Goals

1. **Ship content without app releases** (puzzles, evidence, counters, voice, tuning).
2. **Deterministic gameplay**: packs define rules and content; the resolver remains authoritative.
3. **Fail-closed**: invalid packs never partially apply.
4. **Offline-first**: packs are cacheable and usable without network after first fetch.
5. **Pre-generated content**: all 41 testimony combinations pre-computed per puzzle.
6. **Composable**: multiple packs can be active; layering rules are explicit.

---

## 2) Non-goals

* Marketplace/UGC moderation workflows (defer)
* Multiplayer pack synchronization (defer)
* Runtime LLM dependence (voice may be enhanced optionally; not required)
* Complex dependency resolution (keep v1 simple and explicit)

---

## 3) Pack types (D31-aligned)

### 3.1 Puzzle Pack (Daily Mode)

**New in v2.** Defines complete Daily puzzles:

* Concerns (KOA's proof requirements)
* Counter-evidence (KOA's challenges)
* Dealt hand (6 evidence/refutation cards)
* Pre-generated testimony for all 41 card combinations
* KOA's dialogue and mood transitions
* Resistance, turn budget, difficulty

**Principle:** Puzzles are complete, self-contained units ready for offline play.

### 3.2 Evidence Pack

Defines reusable templates:

* Evidence card archetypes (power, claims, proof types)
* Refutation card archetypes (what they nullify)
* Counter-evidence definitions
* Standard concerns (5 types)

**Used for:** Puzzle generation pipeline, template library.

### 3.3 Voice Pack

Defines KOA's **barks**, keyed by deterministic outcomes:

* OutcomeKey → list of lines (with selection policy)
* Mood state barks (8 states per D31)
* Opening monologues, victory/defeat lines
* Banned vocabulary lists and tone constraints ("jailbreak daemon," not "courtroom")

**Important:** Voice never changes mechanics; it only renders results.

### 3.4 Legacy Pack Types (Freeplay Mode)

Preserved for post-MVP Freeplay mode:

* **Protocol Pack**: Gates, counter-sets, modifiers, routines
* **Artifact/Tool Pack**: Artifacts with tags/traits/trust tiers, tools with effects
* **Incident Pack**: Scenario templates, draft pools, reward tables

---

## 4) D31 Content Structure

### 4.1 Pre-generated Testimony (41 combinations)

For a 6-card Daily hand, there are exactly 41 possible submission combinations:
- 6 single cards
- 15 two-card combinations
- 20 three-card combinations

Each combination has pre-generated:
- Player's implied testimony
- KOA's response dialogue
- Mechanical outcomes (damage, concerns, counters)
- KOA's mood state

### 4.2 Counter-Evidence Definitions

```json
{
  "counter_id": "counter.visual.SECURITY_CAMERA",
  "name": "Security Camera",
  "targets": ["IDENTITY", "LOCATION"],
  "claim": "No one detected at door 2:00-2:30am",
  "refutableBy": ["refutation.core.MAINTENANCE_LOG"]
}
```

### 4.3 Concern Definitions

```json
{
  "concern_id": "concern.core.ALERTNESS",
  "koaAsks": "Prove you're awake.",
  "requiredProof": ["ALERTNESS"],
  "stateRequirement": ["AWAKE", "ALERT", "ACTIVE"]
}
```

### 4.4 Evidence Card Definitions

```json
{
  "card_id": "evidence.core.FACE_ID",
  "name": "Face ID",
  "source": "Apple HomeKit",
  "power": 12,
  "proves": ["IDENTITY"],
  "claims": {
    "timeRange": ["2:05am", "2:10am"],
    "location": "KITCHEN",
    "state": "AWAKE"
  }
}
```

---

## 5) Mode-specific Pack Requirements

### 5.1 Daily Mode (MVP)

Daily mode requires:
- **Puzzle Pack**: Contains everything needed for the day
- **Voice Pack**: KOA's dialogue (can be shared across puzzles)

Daily mode does NOT require:
- Draft pools (cards are dealt, not drafted)
- Protocol/Gate definitions (uses Concerns instead)
- Tool definitions (no tools in Daily MVP)
- Incident templates (puzzle is pre-assembled)

### 5.2 Freeplay Mode (Post-MVP)

Freeplay mode requires all legacy pack types:
- Protocol Pack (gates, modifiers, routines)
- Incident Pack (templates, draft pools, rewards)
- Artifact/Tool Pack (cards with tags/traits)
- Voice Pack

---

## 6) Versioning and compatibility

### 6.1 Semantic versioning

Packs use SemVer: `MAJOR.MINOR.PATCH`

* **PATCH**: text fixes, tuning, additive bark lines
* **MINOR**: additive content (new cards/puzzles) without breaking changes
* **MAJOR**: breaking schema changes

### 6.2 Schema version

* v1.0: Legacy packs (gates, artifacts, incidents)
* v2.0: D31-aligned packs (puzzles, evidence, concerns, counters)

### 6.3 Backward compatibility

* v2 clients can load v1 packs for Freeplay mode
* v2 Daily mode requires v2 Puzzle packs
* Voice packs require terminology update (AURA→KOA)

---

## 7) Loading model (offline-first)

### 7.1 Manifest-driven

The backend publishes a **Manifest** that lists the recommended Pack Set per channel. The client:

* fetches manifest (short TTL),
* downloads missing pack versions,
* verifies integrity (sha256),
* caches packs in IndexedDB.

### 7.2 Daily binding

A DailySpec must bind to:

* a specific puzzle_id
* puzzle content hash
* voice pack version

This guarantees "today's daily" is stable and reproducible.

### 7.3 Pre-caching strategy

For Daily mode, cache:
* Today's puzzle pack
* Tomorrow's puzzle pack (if available)
* Active voice pack
* Last 7 days' puzzles (for replay)

---

## 8) Pack validation (high-level; detailed in D10)

### 8.1 Static validation (per pack)

* Schema conformance
* Unique IDs
* Valid enum values
* Forbidden vocabulary checks (voice pack)

### 8.2 D31-specific validation

* All 41 combinations have pre-generated content
* Concerns addressable with dealt hand
* Counter-evidence has valid refutableBy references
* Contradiction detection is consistent
* Solvability requirements met (D31)

---

## 9) Voice pack selection policy

Voice selection must not block mechanics.

**Policy:**

* Resolver produces combination_id from submitted cards
* Voice system looks up pre-generated dialogue for that combination
* If missing, fallback to mood-based generic bark
* KOA mood state derived from game state (D31)

---

## 10) Entitlements and packaging (monetization-ready)

### 10.1 Baseline packs

* Core voice pack (free)
* Weekly puzzles (free)
* Tutorial puzzles (free)

### 10.2 Premium options

* Alternate KOA voice packs (cosmetic)
* Extended puzzle archives
* Freeplay mode content (post-MVP)

**Fairness rule:** Daily puzzles are identical for all players.

---

## 11) Acceptance criteria (v1)

1. Client can load a Puzzle Pack and run fully offline after caching.
2. Invalid packs fail closed without corrupting cache.
3. DailySpec is reproducible: same puzzle → same outcomes.
4. Pack updates ship without client release.
5. All 41 testimony combinations have pre-generated content.
6. Voice packs can be swapped without affecting gameplay.

---

## 12) Terminology glossary

| Term | Definition |
|------|------------|
| **Engine** | The deterministic resolver runtime |
| **Client** | The PWA application (UI + engine + storage) |
| **Resolver** | Pure function computing outcomes from state + action + packs |
| **Puzzle Pack** | Complete Daily puzzle with pre-generated content |
| **Evidence Pack** | Reusable card template library |
| **Voice Pack** | KOA dialogue keyed by outcomes |
| **Manifest** | Document listing exact pack versions |
| **Daily** | Featured puzzle for a specific calendar date |
| **Freeplay** | Extended mode with 3-act runs (post-MVP) |
