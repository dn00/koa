# D24 — VERTICAL SLICE DoD (MVP) v2.0

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Product + Engineering
**Last Updated:** 2026-01-26
**Purpose:** Define the exact "Definition of Done" for the first shippable Vertical Slice of Life with AURA. This is the minimum coherent product that proves: (1) the Daily puzzle loop is fun and understandable, (2) the deterministic resolver is fair and debuggable, and (3) the pack-servicing model works in practice for daily content.

**Mode:** Option B — **Daily Draft** (single-incident, 5-minute puzzle) is MVP. Freeplay (3-incident ladder) is post-MVP.

---

## 0) MVP statement (what we are proving)

The Vertical Slice is complete when a new player can:

1. Play a **Daily Puzzle** (single-incident, ~5 minutes) that is consistent across devices (given same seed/manifest).
2. Draft 6 evidence cards from 12, use **SUBMIT** and **SCAN** to reduce Resistance to 0 before running out of turns.
3. Lose fairly, understand why via "WHY?" panel, and immediately want to retry.
4. Experience AURA as a **jailbreak opponent**: mocking and reacting—without affecting outcomes or causing latency.

**Daily MVP formula:** Single-incident puzzle, SUBMIT + SCAN only, Compliance = floor(Impact × resonance), Scrutiny 0-5, Audit at 5.

---

## 1) Scope boundaries (explicit non-goals)

### Not in MVP

* **Freeplay mode** (3-incident ladder, 6 moves, Ops Tokens) — deferred post-MVP.
* **Modifiers / Boss incidents** — Freeplay-only, deferred.
* **FLAG, REWIRE, CORROBORATE, EXPLOIT moves** — Freeplay-only, deferred.
* Multiplayer/social systems (deferred).
* Creator tools / user-generated packs (deferred).
* Global leaderboards with anti-cheat (Tier 2).
* Real-world data ingestion (no photos, no health data, no device sensor reads).
* Runtime LLM adjudication (forbidden). "Enhanced AURA" optional later.

### In MVP (minimum)

* **Daily mode:** single-incident puzzle with SUBMIT + SCAN only.
* **Draft:** Pick 6 of 12 evidence cards; remaining 6 become Reserve.
* **Compliance formula:** `floor(Impact × resonance)`, cap 30 per turn.
* **Scrutiny:** Integer 0-5, Audit at 5, Quarantine mechanic.
* Packs load from local + CDN and are validated.
* Pre-generated voice barks keyed by OutcomeKeys.

---

## 2) Functional requirements (MVP)

## 2.1 Core modes

### A) Daily Puzzle (MVP, required)

* One **seeded** incident per day.
* Single-incident puzzle (~5 minutes target).
* Daily binds to `manifest_id` and `daily_id`.
* Standardized loadout rules (no meta perks affecting daily).
* Same seed for everyone → same puzzle, fair comparison.

**Daily structure:**
1. **Lock phase:** Show target (e.g., "Fridge"), Resistance (e.g., 100), active Protocols
2. **Draft phase:** 12 cards shown, pick 6 → remaining 6 become Reserve
3. **Solve phase:** Use SUBMIT/SCAN to reduce Resistance to 0
4. **Result phase:** Win (ACCESS GRANTED) or Loss (ACCESS DENIED)

### B) Freeplay Runs (post-MVP, deferred)

* Unlimited runs with 3-incident ladder.
* 6 moves + Ops Tokens.
* Modifiers and Boss incidents.
* See D02, D05, D07 for preserved Freeplay mechanics.

---

## 2.2 Primary gameplay loop (required)

**Daily loop: Lock → Draft → Solve → Result**

### Lock phase
* Show target lock (e.g., "Fridge", "Front Door")
* Show initial Resistance (e.g., 100)
* Show active Protocols (1-2 for Daily)
* Show turn budget (7-9 turns)

### Draft phase
* Present 12 evidence cards
* Player picks 6 → these become hand
* Remaining 6 become Reserve (for SCAN)

### Solve phase (turn loop)
* Show Resistance bar, Scrutiny (0-5), Protocols
* Player selects 1-2 evidence cards
* Player chooses SUBMIT or SCAN
* **SUBMIT:** Resolve instantly, show Compliance, update Resistance
* **SCAN:** Swap cards from Reserve, +2 Scrutiny, costs 1 turn
* Show "WHY?" panel for move result

### Result phase
* Win: Resistance ≤ 0 → **ACCESS GRANTED**
* Loss: Turns exhausted → **ACCESS DENIED**
* Show par medal (Gold/Silver/Bronze based on turns used)
* Share card option

---

## 2.3 Deterministic resolver (required)

**Ship with Daily compliance formula:**

* **Resistance** (lock_strength) tracked per incident.
* **Scrutiny** tracked as integer 0-5.
* Protocol checks from a fixed library (Protocol Pack).
* Resolution is deterministic and recorded in MOVE_RESOLVED (D04A).

**Daily compliance formula:**
```
base_impact = sum(card.impact for each card in payload)
resonance = 1.5 if (two cards share tag in [TIME, LOCATION, WORK, PURCHASE, SENSOR, AUTHORITY]) else 1.0
compliance = floor(base_impact × resonance)
compliance = min(compliance, 30)  # per-turn cap
resistance_delta = -compliance
```

**Moves supported (Daily MVP):**

1. **SUBMIT** (internal: INJECT) — Send 1-2 evidence cards
2. **SCAN** (internal: CYCLE) — Swap cards from Reserve (+2 Scrutiny)

**Freeplay moves (post-MVP):** FLAG, REWIRE, CORROBORATE, EXPLOIT preserved for later.

**Must include:**

* A deterministic explanation payload for "WHY?" panel (not freeform).

---

## 2.4 Packs and servicing (required)

MVP must load and run using packs:

* **Protocol Pack** (gates, counter paths, modifiers, tuning)
* **Incident Pack** (templates, draft pools, rewards, act profiles)
* **Voice Pack** (barks keyed by OutcomeKeys)
* **Artifact/Tool Pack** (archetypes and tool transforms)

Pack loader must:

* validate schema
* fail-closed on invalid references
* pin run to manifest and prevent mid-run swap

---

## 2.5 AURA voice & latency (required)

* Voice lines are selected from Voice Pack using OutcomeKey (D12).
* Mechanics must render instantly (<=120ms p95) independent of voice.
* Voice text must never block input or animation.
* If a bark is missing:

  * fall back to generic tiered bark (never crash).

**Tone requirement (required):**

* No courtroom language in UI or barks (explicitly banned lexicon is in D15).

---

## 2.6 UX requirements (required)

Mobile-first UI must support:

**Screens**

1. Home (Play Daily / Practice / Settings / Archive)
2. Daily Start (lock target + protocols + start)
3. Draft Screen (12 cards → pick 6)
4. Run Screen (HUD + evidence carousel + SUBMIT/SCAN)
5. Outcome screen (ACCESS GRANTED / ACCESS DENIED) + recap
6. Archive view (recent Dailies)
7. Codex (discovered protocols) minimal

**Daily run UI components**

* Top HUD: lock name (e.g., "Fridge"), Resistance bar, Protocol chips, Scrutiny (0-5), Turn counter
* Middle: AURA presence (orb/lens), bark display
* Bottom: Evidence carousel (6 cards), Slot A / Slot B, SUBMIT button, SCAN button
* Expandable "WHY?" panel per turn outcome

**Daily-specific labels (D15 terminology):**

| Element | Label |
|---------|-------|
| Lock strength | **Resistance: {n}%** |
| Gate | **Protocol: {name}** |
| Primary action | **SUBMIT** |
| Secondary action | **SCAN** (+2 Scrutiny indicator) |
| Win | **ACCESS GRANTED** |
| Loss | **ACCESS DENIED** |

**Onboarding**

* Practice mode (sandbox with hints) or "fail once" micro-teach pattern.

---

## 2.7 Persistence and replay (required)

* Event log is authoritative (D04A).
* Resume mid-run after app restart.
* Archive last N runs (configurable).
* Run replay rehydrates state from event stream.

Tier 0 acceptable for MVP:

* hash chain optional (but recommended soon after).

---

## 2.8 Telemetry (required, minimal)

* Implement D22 minimal set:

  * RUN_STARTED
  * TURN_SUMMARY
  * RUN_ENDED_SUMMARY
  * (Optional sampled) PLAYED_PAYLOAD
* Telemetry is privacy-safe and opt-out supported.

---

## 3) Content requirements (MVP libraries)

## 3.1 Protocols (player term for gates)

Ship **10 protocols** for Daily mode:

* NO_SELF_REPORT
* TIMESTAMP_REQUIRED
* VERIFIED_SOURCE_ONLY
* RATE_LIMIT_REPEAT
* SINGLE_ATTACHMENT_ONLY
* AUTHORITY_REQUIRED
* LOCATION_REQUIRED
* SENSOR_DRIFT
* POLICY_LOCKDOWN
* CONSISTENCY_CHECK

Each protocol must have:

* Clear tag requirements for Daily mode
* Clear failure behavior (+Scrutiny on fail)
* At least 2 viable evidence families that can satisfy it

**Note:** Counter paths (detailed Freeplay mechanics) are hidden from Daily players; they just need to match protocol's required tags.

## 3.2 Modifiers / Boss modifiers (post-MVP)

**NOT in Daily MVP.** Preserved for Freeplay mode.

Ship **6 modifiers** post-MVP:
* Deep Verify, Narrow Channel, Rate Limit, Sensor Drift, Policy Lockdown, Timestamp Hardline

## 3.3 Evidence cards (player term for artifacts)

### Ship Minimum (Daily MVP)

* **20+ evidence cards** across families (Sensor, Purchase, Policy, Media, Work, Location)
* Each card has: `impact` (1-15), `tags`, `trust_tier`
* No tools required for Daily MVP (tools are Freeplay mechanic)

### Target v1.0 (Post-MVP expansion)

* **30+ evidence cards**
* **8+ tools** for Freeplay mode

**Requirement:** at least 3 distinct viable strategies exist in MVP content:

* Sensor/Verified strategy (high-trust, direct)
* Purchase/Timestamp strategy (combo with TIME tag)
* Location/Work strategy (context-based)

## 3.4 Daily incidents

### Ship Minimum

* **6 Daily incident templates** (varied difficulty)
* Each template: 1-2 protocols, 7-9 turns, single lock target
* At least 2 distinct lock targets (e.g., Fridge, Front Door)
* Each must be solvable with the draft pool

### Target v1.0

* **12+ Daily incident templates**
* At least 3 distinct lock targets
* Difficulty banding (Easy/Med/Hard)

## 3.5 Voice coverage

Ship:

* 1 Voice Pack with:
  * Intro lines for each lock type
  * Protocol-specific barks for SUBMIT pass/fail
  * Scrutiny escalation barks
  * Audit trigger bark
  * Win/Loss barks
  * Fallback tier coverage for all OutcomeKeys

---

## 4) Quality bars (hard acceptance criteria)

## 4.1 Determinism and fairness

* Given identical manifest + seed + action sequence:
  * outcomes match across devices/browsers
* Replay reconstructs identical Resistance/Scrutiny trajectories.
* No voice line affects mechanics.

## 4.2 Performance

* p95 time from SUBMIT tap → HUD delta render < 120ms on mid-tier mobile device.
* No frame drops during core loop; avoid blocking main thread.

## 4.3 Reliability

* No run corruption on crash; resume works.
* Pack validation fails closed and shows a user-friendly error for Daily if content invalid.

## 4.4 Clarity

* In usability test with 5 players:
  * at least 3 can explain:
    * what **Resistance** is (the number to reduce to 0)
    * what **Scrutiny** means (risk level 0-5)
    * why a **SUBMIT** passed/failed (via WHY? panel)
    * what **Resonance** does (combo bonus)

## 4.5 Fun proxy metrics (initial targets)

From internal playtests (n=20 sessions):

* Median Daily session length: 4–7 minutes
* Retry rate after loss: > 50%
* Dead-hand rate: < 8% of turns (no useful SUBMIT possible)
* Rage-quit due to confusion: < 10%

---

## 5) Engineering deliverables checklist

### Client (PWA)

* Pack loader + cache
* Run screen UI (HUD/log/hand/moves)
* Deterministic resolver integration
* Event log persistence + resume
* Archive + replay
* Settings (telemetry opt-out, reduced motion, enhanced voice placeholder)

### Content pipeline (minimum)

* Pack build scripts for:

  * protocol pack
  * incident pack
  * artifact/tool pack
  * voice pack
* Validation suite (D21):

  * schema
  * solvability
  * dominance heuristics (basic)
  * voice coverage

### Backend (minimum)

* CDN hosting for packs + manifests + daily index
* Telemetry ingest endpoint (optional for MVP, but recommended)

---

## 6) Exit criteria (what "Done" means)

The Vertical Slice is "Done" when:

1. A complete **Daily puzzle** (single-incident) is playable end-to-end on mobile PWA.
2. Daily can be fetched, cached, and played offline once cached.
3. **Draft** (pick 6 of 12) works and remaining cards become Reserve.
4. **SUBMIT** and **SCAN** resolve correctly with compliance formula.
5. **Scrutiny** (0-5) and **Audit** (at 5, quarantine) work correctly.
6. Packs can be updated via new manifest without shipping new client code.
7. Deterministic replay works and matches golden fixtures.
8. Voice is present, fast, and never blocks mechanics.
9. The test suite (D21) and minimal telemetry (D22) are running in CI.

---

## 7) Post-MVP next increments (explicitly staged)

After Daily MVP:

### Tier 1: Freeplay Mode
* **Freeplay runs** (3-incident ladder, 8-14 minutes)
* **6 moves:** INJECT, FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT
* **Ops Tokens** (3 per incident, spent on FLAG/EXPLOIT)
* **Modifiers** (6 modifiers from D07)
* **Boss incidents** with boss modifiers
* **Tools** (Freeplay mechanic, 5+ tools)
* **Shop/Cache** between acts

### Tier 2: Polish & Expansion
* Tier 1 verification (pack signing + hash chain) for Daily and sharing.
* Expanded incident themes, more protocols/modifiers.
* Enhanced AURA (opt-in runtime LLM) as non-blocking "deluxe barks."
* Social sharing refinements (still not multiplayer).
* Expanded Codex and progression tracking.

---

## 8) Option B scope freeze (Daily MVP)

This section supersedes earlier planning notes. **Option B** inverts the priority: **Daily is primary**, Freeplay is post-MVP.

### What makes Daily "solid" (and not shallow)

A puzzle game is "solid" when each puzzle produces:

* **meaningful choices** (which evidence to draft, when to SUBMIT vs SCAN)
* **forced adaptation** (protocols vary, draft pools vary)
* **learnable mastery** (player improves at reading protocols and combo-ing tags)

Daily achieves this with four interacting mechanics:

1. **Protocols** (explicit constraints to satisfy)
2. **Impact + Resonance** (combo system for compliance)
3. **Scrutiny** (push-your-luck; risk accumulates)
4. **Draft from 12** (variance and build direction)

### Daily content minimums for replayability

* **10 protocols** (varied tag requirements)
* **20+ evidence cards** (with clear Impact values and diverse tags)
* **6+ Daily incident templates** (varied difficulty)

With this, you get variance from:

* Protocol selection per Daily
* Draft pool composition
* Resonance opportunities
* Scrutiny management

### V1 retention (lightweight)

1. **Daily streak** (consecutive days played)
2. **Par medals** (Gold/Silver/Bronze based on turns used)
3. **Share card** (seed, protocols, winning payload, medal)
4. **Codex** (discovered protocols)

### Freeplay preserved for post-MVP

All Freeplay mechanics (6 moves, Ops Tokens, modifiers, bosses, tools) are **preserved in docs** but not shipped in MVP:

* D05 Part B (Freeplay moves + tokens)
* D07 (Modifiers library)
* D02 §4 (Freeplay run structure)
* D03 §10.2, §10.4 (Freeplay formulas)

---

## Concrete Daily MVP scope freeze

* **Mode:** Daily single-incident puzzle
* **Actions:** SUBMIT + SCAN only
* **Turn budget:** 7-9 turns
* **Formula:** `compliance = floor(Impact × resonance)`, cap 30
* **Scrutiny:** 0-5, Audit at 5, Quarantine 2 turns
* **Draft:** Pick 6 of 12, remainder = Reserve
* **Voice:** Pre-gen bark packs only
* **Meta:** Daily streak + par medals + share card + small codex

That is a complete product.
