# D00 — BLUEPRINT v0.2

**Status:** Canonical (ship-blocking north star)
**Owner:** Product / Game Design
**Last Updated:** 2026-01-25

Below is an updated, cohesive **Blueprint v0.2** that incorporates the key pivots we agreed on:

* **Not “court.”** The fantasy is **smart-home jailbreak / proving the home AI wrong**.
* **Roguelite core** (runs you can binge) with an optional **Daily Featured Seed** overlay.
* **Deterministic resolver** for fairness + instant feedback.
* **AURA voice via Packs** (pre-generated barks) to eliminate latency; optional live LLM for “enhanced voice” only.
* **Pack-first servicing** (incidents, protocols, voice, tools) so the game can ship and evolve without constant code changes.

---

# Life with AURA — Blueprint v0.2 (Jailbreak Roguelite)

## 0) One-sentence pitch

A tactical roguelite where you **jailbreak your smart home’s policy gates** by assembling **payloads** (artifacts + moves) to satisfy or bypass constraints, while AURA mocks you like a smug enforcement daemon.

---

## 1) Core pillars

1. **Jailbreak fantasy, not improv:** player choices are constrained and strategic; no “type anything” drift.
2. **Deterministic fairness:** resolver decides outcomes; AURA’s voice never changes results.
3. **Instant feel:** mechanics resolve immediately; voice lines are non-blocking (pre-gen by default).
4. **Systemic replayability:** variance from draft offers + gate profiles + boss modifiers + tactical move sequencing.
5. **Pack-serviced content:** incidents, protocols, voice, tools shipped as versioned packs.

---

## 2) Modes (do both, but build core as roguelite)

### A) Free Play Runs (core)

* Unlimited runs
* Procedural/collage generation from templates
* 3-incident ladder (Act 1 → Act 2 → Boss) in v1

### B) Daily Featured Incident (format overlay)

* One seeded incident per day (or seeded 3-incident mini-run later)
* Same seed for everyone
* Fairness rules: standardized loadout (no meta perks affecting daily)

This resolves the “daily vs Balatro” decision: roguelite core + daily wrapper.

---

## 3) Run structure (v1)

A run is a **3-incident ladder**:

**Act 1 (Warm-up)**

* 1–2 Gates active
* Turn budget: 7–9
* Lower scrutiny escalation

**Act 2 (Escalation)**

* 2 Gates active
* Turn budget: 7–9
* One modifier (e.g., stricter timestamps)

**Boss (Lockdown)**

* 2–3 Gates active
* Turn budget: 8–10
* Boss modifier (forces adaptation)

Between acts: **Cache/Shop** where you add/upgrade artifacts/tools.

---

## 4) Primary player loop (the “verb loop”)

**Recon → Build → Inject → Adapt**

* **Recon:** read active gates + AURA routine + current claim pressure
* **Build:** choose a Move + attach up to 2 artifacts (payload)
* **Inject:** resolve instantly (gate strength drops or rebounds)
* **Adapt:** manage scrutiny risk, pivot when AURA escalates

---

## 5) Deterministic “physics” model

### 5.1 State variables (visible)

* **Gate Strength** (100 → 0): the lock’s resistance (win condition per incident)
* **Scrutiny** (Low/Med/High): audit pressure (push-your-luck meter)
* **Active Gates** (chips): constraints currently enforced (e.g., `TIMESTAMP_REQUIRED`)
* **Routine** (chip): AURA behavior profile (affects claim weights, not fairness)

### 5.2 Artifact (card) model

Each artifact has:

* **Tags:** e.g., Sensor, Purchase, Policy, Location, Time, Media, Work, Mood
* **Trust Tier:** Verified / Plausible / Sketchy (visible)
* **Traits:** Timestamped, Editable, Corroboratable, SourceTrusted, etc.
* **Base Power:** 1–10
* **Source:** e.g., “Apple Health”, “Receipt Hash”, “Screenshot”

### 5.3 Gate / Claim model (the important part)

AURA applies **Gate Checks** (and pressure claims) that are always explicit and from a fixed library.

Each **Gate** has:

* an ID (e.g., `NO_SELF_REPORT`)
* a **counter-set list** (2–4 valid paths)
* penalties for failing

**Example: `NO_SELF_REPORT` counter paths**

* Path A: (Verified AND Sensor)
* Path B: (Verified AND Authority)
* Path C: (Plausible AND Purchase AND Timestamped) + (Tool: Corroborate)

This ensures multiple builds can win.

### 5.4 Resolution output (always deterministic)

On Inject:

* **ΔGateStrength**
* **ΔScrutiny**
* status effects: “Deep Verify next turn”, “Rate-limit repeats”, etc.
* a compact **OutcomeKey** for voice line selection (see voice packs)

---

## 6) Move set (v1, 6 moves)

Same mechanics, jailbreak naming:

1. **Inject** (play 1–2 artifacts)
2. **Flag** (force AURA to narrow the active gate; costs token)
3. **Rewire** (reinterpret tags; flexible but lower impact)
4. **Corroborate** (upgrade trust tier using tool/anchor)
5. **Cycle** (discard/draw; increases scrutiny slightly)
6. **Exploit** (policy exploit; strong but increases scrutiny)

This gives real decision density without bloating UI.

---

## 7) Difficulty and scaling (within runs)

Difficulty increases by:

* more gates (1 → 2 → 3)
* stricter counter-sets (Plausible stops passing on later acts)
* higher scrutiny sensitivity (sketchy raises scrutiny more)
* boss modifiers (see below)

### Boss modifier library (v1: ship 6)

* **Deep Verify:** Sketchy artifacts auto-bump scrutiny
* **Narrow Channel:** you may attach only 1 artifact per Inject
* **Rate Limit:** cannot play same archetype twice in a row
* **Sensor Drift:** Sensor tags require corroboration to count as Verified
* **Policy Lockdown:** Exploit costs 1 token
* **Timestamp Hardline:** only Timestamped artifacts satisfy time gates

---

## 8) Meta progression (across runs) that won’t break fairness

Persist only **variety and mastery**, not raw power:

* unlock new **artifact archetypes** (more options)
* unlock new **tools** (new lines, not higher numbers)
* unlock new **incident templates** (content)
* unlock cosmetics/voice packs
* Codex: shows discovered counter paths and gate behaviors

**No permanent +damage.** For Daily mode, disable meta perks or standardize the loadout.

---

## 9) Pack system (servicing model)

### 9.1 Pack types

1. **Protocol Pack**

* Gate library, counter-sets, tuning knobs, boss modifiers

2. **Incident Pack**

* Template(s) for lock events: targets, gate combos, weights, offered data packs, rewards

3. **Voice Pack**

* Pre-generated bark libraries keyed by OutcomeKeys, plus intro/recap lines

4. **Artifact/Tool Pack**

* New archetypes, new tools, new synergy rules (still deterministic)

### 9.2 Pack validation (mandatory)

Before publishing:

* solvability check (at least one viable line exists given offered packs)
* anti-dominance heuristics (no single archetype solves >X% of incident variants)
* pacing checks (audit frequency not oppressive)
* size/latency constraints

This is what keeps it “solid.”

---

## 10) LLM usage plan that players accept

### Runtime default (no live AI required)

* Resolver is local/deterministic
* AURA voice uses **pre-generated voice packs**
* Instant “mechanics bark” + post-resolve bark selection (0–50ms)

### Optional Enhanced AURA (opt-in)

* live LLM produces “deluxe” line or hint
* never blocks gameplay
* never changes outcomes
* can be disabled permanently

### Offline LLM (your content pipeline)

* generate incident template candidates
* generate voice pack barks
* generate recap variants
* generate “patch notes” flavor (not mechanics)

---

## 11) UI blueprint (mobile-first)

### Top HUD

* Lock name + **Gate Strength**
* **Scrutiny** indicator
* Active Gates chips
* Routine chip (Skeptic/Bureaucrat/Martyr—but renamed: “Strict Verify”, “Policy Daemon”, “Human Factors”)

### Middle

* Log stream (console-like chat)
* Each turn inserts:

  * AURA gate bark (pre-gen)
  * Your payload summary (auto-generated)
  * Outcome bark (pre-gen)

### Bottom

* Hand carousel (artifacts)
* Move row (6)
* 2 artifact slots
* **INJECT** button
* “Why did that work?” expandable panel (deterministic explanation)

---

## 12) Tech delivery recommendation

**Web-first PWA** (React/TS) with optional Pixi/canvas for AURA glitch effects.
Service packs from CDN. Wrap later for stores via Capacitor if desired.

This is the highest-iteration, lowest-friction path for a UI-driven game.

---

## 13) Monetization (aligned with fairness + AI sentiment)

* **Free**: Daily featured incident + limited archive
* **One-time unlock**: full archive + “classic incident pack”
* **Cosmetics/voice packs**: safe monetization
* **Subscription (later)**: weekly content drops + Enhanced AURA voice (opt-in) + creator tools

No pay-to-win; no buying retries in Daily.

---

# MVP (Vertical Slice) — what to build first

A single 3-incident run with:

* 10 gates total in library
* 3 routines
* 6 moves
* 30 artifact archetypes
* 6 boss modifiers
* 1 voice pack with pre-gen barks for common outcome keys
* pack loader + validator (minimal)
* full mobile UI loop + instant mechanics

**Success criterion:** players can lose, understand why, and immediately want “one more run.”

---

# Appendix: Minimal schemas (enough to implement)

### OutcomeKey (voice selection)

* `event`: CLAIM_APPLIED | RESOLVE | SCRUTINY_UP | SCRUTINY_DOWN | HINT
* `routine`: STRICT_VERIFY | POLICY_DAEMON | HUMAN_FACTORS
* `gate`: NO_SELF_REPORT | TIMESTAMP_REQUIRED | …
* `outcome`: PASS | FAIL | ESCALATE | CLEARED
* `scrutiny`: LOW | MED | HIGH
* `move`: INJECT | FLAG | REWIRE | CORROBORATE | CYCLE | EXPLOIT

### IncidentSpec (template)

* `lock_id`, `theme`, `act` (1/2/BOSS)
* `gates[]` + weights
* `routine_weights{...}`
* `draft_packs[]`
* `turn_budget`
* `boss_modifier?`
* `reward_table`
