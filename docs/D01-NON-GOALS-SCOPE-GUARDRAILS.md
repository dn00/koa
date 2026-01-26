# D01 — NON-GOALS & SCOPE GUARDRAILS.md

**Status:** Draft v1.0 (Ship-blocking)
**Last Updated:** 2026-01-25
**Purpose:** Prevent scope drift and enforce the core pillars of Blueprint v0.2. This document is authoritative for what we will **not** build in v1, what is **deferred**, and what constraints must hold for the game to remain fun, fair, and shippable.

---

## 0) The “why” (scope philosophy)

Life with AURA succeeds only if it feels like a **real game loop** (replayable roguelite) with **deterministic fairness** and **instant feedback**, while using LLMs where players will accept them: **offline content generation** and **optional non-blocking voice**.

If we violate any of the guardrails below, we risk building:

* a brittle chatbot gimmick,
* a latency-ridden UX,
* a pay-to-win treadmill,
* or a content pipeline that cannot scale.

---

## 1) Pillar lock-in (must remain true)

These are **non-negotiable** in v1:

1. **Jailbreak fantasy, not improv**

   * The game is about **outsmarting policy gates** via constrained inputs (moves + artifacts + tools).
   * Not an “open-ended chat” where typing anything can win.

2. **Deterministic resolver**

   * All pass/fail outcomes are computed locally by a deterministic engine.
   * LLM output never changes game state.

3. **Instant feel**

   * Mechanical resolution is immediate.
   * Voice/narration is non-blocking and can be pre-generated.

4. **Systemic replayability**

   * Depth comes from draft variance, gate profiles, modifiers, and sequencing.
   * Not from writing or roleplay.

5. **Pack-serviced content**

   * Incidents/protocols/voice/tools ship as versioned packs.
   * Code changes are not required for most content changes.

---

## 2) v1 non-goals (explicitly out of scope)

### 2.1 Multiplayer and synchronous social

* No real-time multiplayer
* No co-op ladders, raids, shared runs
* No PvP, no leaderboards that require anti-cheat parity
* No live chat, guilds, clans, or shared inventories

> **Rationale:** Multiplayer multiplies engineering, anti-tamper, and UX complexity and will compromise deterministic simplicity.

### 2.2 LLM adjudication / “AI decides”

* No LLM-based pass/fail, scoring, or gate resolution
* No “freeform persuade the AI to win”
* No “LLM generates new mechanics rules mid-run”

> **Rationale:** Unfair outcomes, debugging failure, player backlash (“AI randomness”).

### 2.3 Runtime dependency on network

* The game must remain playable offline (after caching packs) without degraded mechanics.
* No required API calls per move/turn.

> **Rationale:** Latency kills game feel; offline-first is a core differentiator.

### 2.4 Direct integrations with personal data sources (v1)

* No Apple Health / Google Fit / Oura / Slack / Gmail ingestion
* No reading real sensor data from the user’s device
* No permissions-heavy “connect your life” onboarding

> **Rationale:** Privacy complexity, permission friction, store review risk, and content coupling.
> **v1 stance:** everything is **fictional artifacts** in-universe (proof cards), not real user data.

### 2.5 “Courtroom” skin and legal simulation

* No courtroom UI metaphors (judge, verdict, admissible, objection)
* No Ace Attorney mimicry in terminology

> **Rationale:** The fantasy is *smart-home jailbreak* and “proving the daemon wrong,” not litigation.

### 2.6 Open-world / life sim sprawl

* No farming, NPC courtship, housing decoration loops, crafting trees, etc.
* No “Grimhold-scale” world simulation in AURA v1

> **Rationale:** This undermines the tight daily/roguelite loop and explodes content demands.

### 2.7 Heavy 3D / custom engine requirements

* No requirement for Unity/Unreal or 3D assets for MVP.
* No complex physics or real-time animation systems beyond simple UI effects.

> **Rationale:** PWA-first iteration speed is a strategic advantage.

---

## 3) v1 scope guardrails (what we *will* build)

These define the **maximum** v1 scope. If something doesn’t fit here, it’s deferred.

### 3.1 Game modes

* **Free Play Runs (core):** unlimited procedurally assembled 3-incident ladders
* **Daily Featured Seed (overlay):** one seeded ladder/incident per day
* Daily mode disables meta power advantages (only cosmetics / standardized loadout)

### 3.2 Run structure

* 3 incidents per run: Act1 → Act2 → Boss
* Between acts: Cache/Shop upgrade screen (bounded)

### 3.3 Mechanics budget (keep it tight)

* **6 moves** max as specified in Blueprint v0.2:
  Inject, Flag, Rewire, Corroborate, Cycle, Exploit
* **Gate library:** start with ~10 gates
* **Boss modifiers:** start with ~6 modifiers
* **Artifacts:** ~30 archetypes
* **Tools:** enough to enable at least 3 viable build archetypes

### 3.4 Explainability requirement

Every resolution must be explainable from deterministic data:

* matched counter path
* requirements satisfied / missing
* deltas applied (gate strength, scrutiny)
* outcome key

No “because the AI said so.”

---

## 4) Hard constraints for LLM usage

### 4.1 Runtime default: no LLM required

* Voice lines come from **voice packs** keyed by `OutcomeKey`.
* If Enhanced AURA is enabled:

  * LLM response must be **post-resolution decoration**
  * must never block the UI
  * must have a deterministic fallback line if timeout/failure

### 4.2 Content pipeline: LLM allowed, but validated

LLMs may generate:

* incident template candidates
* bark libraries
* recap variants
* “patch note” flavor text

But:

* all packs must pass deterministic validation (solvability, dominance, pacing)
* LLM-generated content is never directly published without checks (and ideally curation)

---

## 5) Monetization guardrails (ship-blocking)

### 5.1 Red lines (do not cross)

* No pay-to-win
* No buying extra turns for Daily
* No buying audit immunity
* No selling VERIFIED high-power artifacts that trivialize gates

### 5.2 Allowed in v1

* Cosmetics (themes, orb skins, SFX packs)
* Archive access (play past dailies)
* Optional voice packs / enhanced voice subscription (cosmetic/narrative only)
* Optional content packs (new incidents/tools) **if** balance-validated

---

## 6) Content guardrails (avoid “content collapse”)

### 6.1 Artifact specificity rule

Avoid artifacts that are so specific they only fit one case (e.g., “Receipt at 11:04 PM for one pepperoni slice”).
Prefer **archetypes** with parameters:

* “Fast Food Receipt (timestamped)”
* “Workout Photo (self-reported, location: gym)”
* “Device Sensor Log (verified)”

### 6.2 Gate solvability rule

No gate or modifier may be published unless:

* at least one viable line exists given the act’s offer pools
* dominance heuristics indicate no single archetype solves the majority of variants

### 6.3 Tone rule

AURA can be smug, but not hateful or harassing. Keep it “daemon snark,” not abuse.

---

## 7) Engineering guardrails (v1 delivery)

### 7.1 Offline-first PWA posture

* PWA client runs deterministic resolver locally
* Uses IndexedDB for run logs and pack caches
* Backend (if any) is thin: manifest + pack hosting + optional telemetry

### 7.2 Reuse the kernel unless proven inadequate

* Default assumption: reuse the existing deterministic kernel/event-sourcing foundation
* Only rewrite if a specific requirement cannot be met with targeted adaptation

### 7.3 Performance budgets

* Resolution latency (mechanics): < 50ms device-local target
* UI must never block on network for turn resolution
* Pack load should be incremental and cacheable

---

## 8) “Stop-the-line” scope creep triggers

If any of these appear in a planning discussion, we pause and explicitly decide tradeoffs:

1. “Let players type anything and AURA figures it out”
2. “Let’s integrate real user data”
3. “We need multiplayer for virality”
4. “The LLM should decide whether the argument works”
5. “We should build a world / NPC sim around it”
6. “Let’s add crafting / meta power scaling”
7. “Make it a courtroom / Ace Attorney parody”

---

## 9) MVP definition check (what must exist before polish)

Before adding new features, v1 must have:

* 3-incident ladder playable end-to-end (Free Play + Daily overlay)
* deterministic resolver + event log
* 10 gates, 6 moves, 6 modifiers, 30 artifacts archetypes, tool set enabling multiple builds
* voice pack coverage for all key outcomes
* pack loading and validation (minimal but real)
* explainability panel (“why that worked”)
* loss state that is fun (Rap Sheet / daemon log recap)

---

## 10) Decision log (initial)

* Multiplayer: **deferred**
* LLM adjudication: **forbidden**
* Daily vs Balatro: **roguelite core + daily overlay**
* Tone: **jailbreak daemon**, not court
* Platform: **PWA-first**
* Monetization: **cosmetics + archive + optional voice/content**, no P2W

