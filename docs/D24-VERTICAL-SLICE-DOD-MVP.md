# D24 — VERTICAL SLICE DoD (MVP) v3.0

**Status:** Draft v3.0 (Ship-blocking)
**Owner:** Product + Engineering
**Last Updated:** 2026-01-26
**Purpose:** Define the exact "Definition of Done" for the first shippable Vertical Slice of Home Smart Home. This is the minimum coherent product that proves: (1) the Daily puzzle loop is fun and understandable, (2) the deterministic resolver is fair and debuggable, and (3) the adversarial testimony design works in practice.
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) MVP statement (what we are proving)

The Vertical Slice is complete when a new player can:

1. Play a **Daily Puzzle** (single-puzzle, ~5 minutes) that is consistent across devices (given same seed/manifest).
2. Be DEALT 6 evidence cards (no draft), use **SUBMIT** to reduce Resistance to 0 AND address all concerns before running out of turns.
3. Experience KOA as an **active adversary** who plays counter-evidence, creating tactical decisions.
4. Lose fairly, understand why via the committed story and contradiction system, and immediately want to retry.

**Daily MVP formula:** Single-puzzle, SUBMIT only, Power-based damage with contested penalty and corroboration bonus, Concerns system, Scrutiny 0-5 (5 = instant loss).

---

## 1) Scope boundaries (explicit non-goals)

### Not in MVP

* **Freeplay mode** (multi-puzzle ladder, extended moves, Ops Tokens) — deferred post-MVP.
* **Draft phase** — removed. Players are dealt 6 cards.
* **SCAN action** — removed. No reserve pool.
* **Audit penalty system** — replaced by Scrutiny 5 = instant loss.
* Modifiers / Boss incidents — Freeplay-only.
* FLAG, REWIRE, CORROBORATE, EXPLOIT moves — Freeplay-only.
* Multiplayer/social systems (deferred).
* Creator tools / user-generated packs (deferred).
* Global leaderboards with anti-cheat (Tier 2).
* Real-world data ingestion (no photos, no health data, no device sensor reads).
* Runtime LLM adjudication (forbidden). "Enhanced KOA" optional later.

### In MVP (minimum)

* **Daily mode:** single-puzzle with SUBMIT only.
* **Dealt hand:** 6 cards, same for all players (no selection).
* **Concerns system:** 2-4 proof requirements per puzzle.
* **Counter-evidence:** KOA's challenges, visible or hidden.
* **Refutation:** Cards that nullify counters.
* **Contradiction system:** MINOR (+1 scrutiny) / MAJOR (blocked).
* **Damage formula:** Power + contested penalty + corroboration bonus.
* **Scrutiny:** Integer 0-5, instant loss at 5.
* Packs load from local + CDN and are validated.
* Pre-generated voice barks keyed by OutcomeKeys.

---

## 2) Functional requirements (MVP)

## 2.1 Core modes

### A) Daily Puzzle (MVP, required)

* One **seeded** puzzle per day.
* Single-puzzle (~5 minutes target).
* Daily binds to `manifest_id` and `daily_id`.
* Standardized loadout rules (no meta perks affecting daily).
* Same seed for everyone → same puzzle, fair comparison.
* **Same 6 dealt cards for everyone.**

**Daily structure:**
1. **Lock phase:** Show target (e.g., "Fridge"), Resistance, Concerns, Turns, KOA's counter-evidence
2. **Solve phase:** Use SUBMIT to reduce Resistance to 0 AND address all concerns
3. **Result phase:** Win (ACCESS GRANTED) or Loss (ACCESS DENIED)

**Note:** No draft phase. Puzzle is in the PLAY, not card selection.

### B) Freeplay Runs (post-MVP, deferred)

* Unlimited runs with multi-puzzle ladder.
* Extended moves + Ops Tokens.
* See D02, D05 for preserved Freeplay mechanics.

---

## 2.2 Primary gameplay loop (required)

**Daily loop: Lock → Solve → Result**

### Lock phase
* Show target lock (e.g., "Fridge", "Front Door")
* Show initial Resistance (e.g., 35)
* Show Concerns (2-4 proof requirements)
* Show turn budget (6 turns)
* Show KOA's counter-evidence (in FULL mode)
* Show dealt hand (6 cards)

### Solve phase (turn loop)
* Show Resistance bar, Scrutiny (0-5), Concerns status
* Player selects 1-3 evidence cards
* System shows preview: damage, concerns addressed, contradictions, KOA's response
* Player confirms SUBMIT
* **Resolution:** Cards checked, counter applied, damage calculated, cards added to committed story
* Show "WHY?" panel for move result

### Result phase
* Win: Resistance ≤ 0 AND all concerns addressed → **ACCESS GRANTED**
* Loss: Turns exhausted OR Scrutiny 5 → **ACCESS DENIED**
* Show score (turns used, power dealt, contradictions, counters refuted)
* Share card option

---

## 2.3 Deterministic resolver (required)

**Ship with D31 damage formula:**

* **Resistance** tracked per puzzle.
* **Scrutiny** tracked as integer 0-5.
* **Concerns** tracked as proof requirements.
* Resolution is deterministic and recorded in event log.

**Daily damage formula:**
```
for each card in submission:
    card_damage = card.power
    if counter targets this card's proof type AND not refuted:
        card_damage = ceil(card_damage * 0.5)  # 50% contested
    total += card_damage

if 2+ cards share claim (location/state/activity):
    total = ceil(total * 1.25)  # 25% corroboration

resistance -= total
```

**Contradiction system:**
* MINOR: +1 scrutiny, allowed
* MAJOR: blocked, can't submit

**Moves supported (Daily MVP):**
* **SUBMIT** — Send 1-3 evidence cards

**Must include:**
* A deterministic explanation payload for "WHY?" panel (not freeform).

---

## 2.4 Packs and servicing (required)

MVP must load and run using packs:

* **Puzzle Pack** (scenarios, cards, counters, concerns)
* **Voice Pack** (barks keyed by OutcomeKeys)

Pack loader must:
* validate schema
* fail-closed on invalid references
* pin run to manifest and prevent mid-run swap

---

## 2.5 KOA voice & latency (required)

* Voice lines are selected from Voice Pack using OutcomeKey (D12).
* Mechanics must render instantly (<=120ms p95) independent of voice.
* Voice text must never block input or animation.
* If a bark is missing: fall back to generic tiered bark (never crash).

**Tone requirement (required):**
* Passive-aggressive bureaucrat meets wellness influencer parody.
* Dry, observational, uses your data against you.
* No courtroom language (explicitly banned lexicon is in D15).

---

## 2.6 UX requirements (required)

Mobile-first UI must support:

**Screens**

1. Home (Play Daily / Practice / Settings / Archive)
2. Daily Start (lock target + concerns + counters + start)
3. Run Screen (HUD + evidence carousel + SUBMIT)
4. Outcome screen (ACCESS GRANTED / ACCESS DENIED) + recap
5. Archive view (recent Dailies)

**Daily run UI components**

* Top HUD: lock name, Resistance bar, Concerns chips, Scrutiny (0-5), Turn counter
* KOA area: KOA presence (orb/lens), mood indicator, bark display
* Counter area: KOA's counter-evidence (in FULL mode)
* Story area: Committed story timeline
* Bottom: Evidence carousel (6 cards), SUBMIT button
* Expandable "WHY?" panel per turn outcome
* Contradiction warning (MINOR: yellow, MAJOR: red)
* Corroboration indicator when cards share claims

**Daily-specific labels (D15 terminology):**

| Element | Label |
|---------|-------|
| Lock strength | **Resistance: {n}** |
| Proof requirement | **Concern: {type}** |
| Primary action | **SUBMIT** |
| Win | **ACCESS GRANTED** |
| Loss | **ACCESS DENIED** |

**Onboarding**

* Tutorial week (5-7 days of graduated complexity)
* Practice mode (sandbox with hints)

---

## 2.7 Persistence and replay (required)

* Event log is authoritative.
* Resume mid-run after app restart.
* Archive last N runs (configurable).
* Run replay rehydrates state from event stream.

---

## 2.8 Telemetry (required, minimal)

* Implement D22 minimal set:
  * RUN_STARTED
  * TURN_SUMMARY
  * RUN_ENDED_SUMMARY
* Telemetry is privacy-safe and opt-out supported.

---

## 3) Content requirements (MVP libraries)

## 3.1 Concerns

Ship **5 concern types** for Daily mode:

* IDENTITY — "Prove you're you."
* ALERTNESS — "Prove you're awake."
* INTENT — "Prove you meant to do this."
* LOCATION — "Prove you're actually home."
* LIVENESS — "Prove you're not a photo."

## 3.2 Counter-evidence

Ship **6+ counter types** with refutableBy relationships:

* Security Camera → refutable by Maintenance Log, Blind Spot Report
* Sleep Data Sync → refutable by Noise Complaint, Alarm Log
* GPS History → refutable by Phone Left Behind, GPS Spoof Report
* Social Check-in → refutable by Misattributed Tag, Left Early Receipt
* Health App → refutable by Manual Override, Faulty Sensor Report
* Biometric Mismatch → refutable by Twin Verification, Makeup Removal

## 3.3 Evidence cards

### Ship Minimum (Daily MVP)

* **30+ evidence cards** across proof types
* Each card has: `power`, `proves`, `claims`, `source`
* Include refutation cards that nullify counters

### Target v1.0

* **41 cards** (enough for all submission combinations)
* Pre-generated testimony for all card combinations

**Requirement:** at least 2 distinct viable strategies per puzzle.

## 3.4 Daily puzzles

### Ship Minimum

* **7 Daily puzzle templates** (one per difficulty level)
* Each puzzle: 2-4 concerns, 2-3 counters, 6 dealt cards
* At least 3 distinct lock targets (Fridge, Front Door, Thermostat)

### Target v1.0

* **12+ Daily puzzle templates**
* Weekly rotation (varied puzzle types)
* Difficulty banding (Tutorial through Expert)

## 3.5 Voice coverage

Ship:

* 1 Voice Pack with:
  * Intro lines for each lock type
  * Counter dialogue (per counter type)
  * Refutation responses (grudging acceptance)
  * Contradiction warnings (MINOR: explain why suspicious, MAJOR: blocked)
  * Corroboration acknowledgment
  * Win/Loss barks
  * 8 mood states: NEUTRAL, CURIOUS, SUSPICIOUS, BLOCKED, GRUDGING, IMPRESSED, RESIGNED, SMUG
  * Fallback tier coverage for all OutcomeKeys

---

## 4) Quality bars (hard acceptance criteria)

## 4.1 Determinism and fairness

* Given identical manifest + seed + action sequence:
  * outcomes match across devices/browsers
* Replay reconstructs identical Resistance/Scrutiny/Story trajectories.
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
    * what **Concerns** are (proof requirements)
    * how **Counter-Evidence** works (KOA challenges, 50% penalty)
    * how **Refutation** works (nullifies counters)
    * what **Contradictions** do (MINOR = scrutiny, MAJOR = blocked)
    * what **Corroboration** does (bonus when cards agree)

## 4.5 Fun proxy metrics (initial targets)

From internal playtests (n=20 sessions):

* Median Daily session length: 4–7 minutes
* Retry rate after loss: > 50%
* Win rate on Normal: 60-80%
* Rage-quit due to confusion: < 10%
* "Would play again tomorrow": > 70%

---

## 5) Engineering deliverables checklist

### Client (PWA)

* Pack loader + cache
* Run screen UI (HUD/story/hand/submit)
* Deterministic resolver integration
* Contradiction detection and warning
* Corroboration detection and display
* Event log persistence + resume
* Archive + replay
* Settings (telemetry opt-out, counter visibility toggle, minimal/full stats)

### Content pipeline (minimum)

* Pack build scripts for:
  * puzzle pack
  * voice pack
* Validation suite (D21):
  * schema
  * solvability (all concerns addressable, main path wins by 10+)
  * contradiction safety (no forced MAJOR contradictions)
  * voice coverage

### Backend (minimum)

* CDN hosting for packs + manifests + daily index
* Telemetry ingest endpoint (optional for MVP, but recommended)

---

## 6) Exit criteria (what "Done" means)

The Vertical Slice is "Done" when:

1. A complete **Daily puzzle** (single-puzzle) is playable end-to-end on mobile PWA.
2. Daily can be fetched, cached, and played offline once cached.
3. **Dealt hand** works (6 cards, no draft, same for all players).
4. **SUBMIT** resolves correctly with damage formula (power, contested, corroboration).
5. **Concerns** track correctly (all must be addressed to win).
6. **Counter-evidence** triggers correctly and applies contested penalty.
7. **Refutation** works correctly (nullifies counter, restores damage).
8. **Contradictions** detect correctly (MINOR: +1 scrutiny, MAJOR: blocked).
9. **Scrutiny 5** triggers instant loss.
10. **Corroboration bonus** applies when cards share claims.
11. Packs can be updated via new manifest without shipping new client code.
12. Deterministic replay works and matches golden fixtures.
13. Voice is present, fast, and never blocks mechanics.
14. The test suite and minimal telemetry are running in CI.

---

## 7) Post-MVP next increments (explicitly staged)

After Daily MVP:

### Tier 1: Freeplay Mode
* **Freeplay runs** (multi-puzzle ladder, 8-14 minutes)
* **Extended moves:** FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT
* **Ops Tokens** (3 per puzzle, spent on FLAG/EXPLOIT)
* **Shop/Cache** between acts

### Tier 2: Polish & Expansion
* Pack signing + hash chain for Daily and sharing.
* Expanded puzzle themes, more counters.
* Enhanced KOA (opt-in runtime LLM) as non-blocking "deluxe barks."
* Social sharing refinements.
* Weekly leaderboards.

---

## 8) Concrete Daily MVP scope freeze

* **Mode:** Daily single-puzzle
* **Actions:** SUBMIT only (1-3 cards per turn)
* **Turn budget:** 6 turns (Normal)
* **Formula:** Power + 50% contested penalty + 25% corroboration bonus
* **Win condition:** Resistance ≤ 0 AND all concerns addressed
* **Loss conditions:** Turns exhausted OR Scrutiny 5
* **Cards:** 6 dealt (same for all players)
* **Concerns:** 2-4 per puzzle
* **Counters:** 2-3 per puzzle
* **Voice:** Pre-gen bark packs only
* **Meta:** Daily streak + score sharing

That is a complete product.
