# D06 — CORE GAME LOOP UX (Screens + State Machine) v1

**Status:** Draft v0.1
**Owner:** Product / Client
**Last Updated:** 2026-01-25
**Purpose:** Define the player-facing loop and the client state machine for Life with AURA. This doc ensures the UX matches the deterministic core: instant mechanical feedback, non-blocking voice, offline-first operation, and a clear “outsmart / jailbreak the home AI” fantasy (not courtroom roleplay).

---

## 1) North-star experience (what the player feels)

* **Fantasy:** “My home AI is overconfident. I’m going to feed it proof, exploit its rules, and jailbreak my way to access.”
* **Session length:** Daily run ~8–15 minutes (Act1 → Act2 → Boss).
* **Texture:** Fast, tactile “tap-to-attach” proof moves + satisfying system feedback (meters, chips, unlock animations).
* **LLM role:** Generates sass and “system messages” as a **live daemon**—but gameplay never waits on it.

---

## 2) Primary screens (v1)

1. **Home / Daily Hub**
2. **Run Setup (Daily Brief)**
3. **Draft (Data Pack selection)**
4. **Run (Jailbreak Console)**
5. **Inter-Act Upgrade (Shop/Cache)**
6. **Results / Share (Run Recap)**
7. **Collection (Artifacts, Tools, Frames/Glossary)** (optional v1)

---

## 3) Home / Daily Hub

### 3.1 Components

* **Daily Tile:** “Today’s Lockdown” (date, theme, difficulty, streak)
* **Start Button:** “Jailbreak Today”
* **Offline indicator:** shows whether today’s packs are cached
* **Secondary:** Free Play, Settings, Codex

### 3.2 Daily binding UX

When online:

* fetch manifest + today’s DailySpec
* pre-cache required packs
  When offline:
* if cached DailySpec exists: play it
* else: offer Free Play (local)

---

## 4) Run Setup (Daily Brief)

### 4.1 Purpose

A 10–15 second “briefing” that explains the ladder without a tutorial wall.

### 4.2 Layout

* Top: AURA status orb + “Policy Mode” chip (e.g., STRICT VERIFY)
* Ladder list:

  * Act1: Target (TOASTER), one-line rule chip
  * Act2: Target (THERMOSTAT), one-line rule chip
  * Boss: Target (FRONT DOOR), boss rule chip (unknown/partially masked if desired)
* “Start Run” button

### 4.3 Copy rules (de-Ace Attorney)

Avoid: “trial,” “verdict,” “objection,” “guilty.”
Use: “audit,” “policy,” “gate,” “sync,” “access,” “daemon,” “proof,” “exploit,” “override.”

---

## 5) Draft (Data Pack selection)

### 5.1 Goal

Replace room-search tedium with a clean strategic draft.

### 5.2 Screen flow

* You are dealt **3 Data Packs** (from incident draft_offer_profile):

  * e.g., HEALTH LOGS, TRASH BIN, WORK SLACK
* Each Data Pack previews:

  * 2–4 potential artifacts/tools silhouettes (unknown specifics)
  * a risk badge (more sketchy, more verified)
* Player picks 1 pack → receives an offer set:

  * `offer_count` items shown, pick `pick_count`
* Repeat per act if configured (or only at start + between acts)

### 5.3 Offer UI

Each offer is a “card” with:

* Name and icon
* Tags (chips)
* Trust tier (badge)
* Base power (small number)
* “Why it matters” one-liner (derived from tags, not LLM)

### 5.4 Determinism and UX

Draft order and offers are deterministic from seed.
UI should show “Daily Seeded” subtly to build trust.

---

## 6) Run screen — “Jailbreak Console”

This is the main play surface.

### 6.1 Layout (mobile portrait)

**Zone A (Top ~25%) — Target + Gate(s)**

* Target device tile: FRIDGE/THERMOSTAT/etc.
* Gate chips (1–2): e.g., NO SELF REPORT, TIME HARDLINE
* Each gate shows a **Strength bar** (or “Lock strength”)
* Scrutiny indicator: “Noise” meter (LOW/MED/HIGH)

**Zone B (Middle ~35%) — Transcript**

* AURA messages appear as “System Daemon” lines
* Player messages appear as sent “payloads” with attached proof chips

**Zone C (Bottom ~40%) — Hand + Payload Builder**

* Hand: 5 artifacts (and tools shortcut)
* Payload builder slot(s):

  * If combos allowed: up to 2–3 slots
  * If boss blocks combos: only 1 slot
* Buttons:

  * “Attach” (tap a card to load into slot)
  * Tool button (opens tool drawer)
  * “Send” (executes action)

### 6.2 Input interaction (tap-to-attach)

* Tap an artifact → it snaps into Payload Slot 1
* Tap second artifact → Slot 2 (if allowed)
* Tap a tool → opens “Apply To…” picker (which artifact instance)
* Press Send → submits ACTION_SUBMITTED and immediately resolves mechanics (MOVE_RESOLVED)

### 6.3 Instant mechanics, delayed mouth (latency mask)

**T=0ms:** On Send:

* animation: “proof uploaded”
* gate strength bar updates instantly
* scrutiny meter updates instantly
* floating text: “Gate weakened (-35)”

**T=~500–1500ms:** AURA’s bark arrives:

* “Sync complete. Verified source accepted. Access narrowing.”
  If offline or LLM not used:
* select deterministic bark from voice pack (instant)

**Rule:** The run never waits for a network call.

### 6.4 “Why it worked” explainability panel

Tap the resolved payload bubble to open a small panel:

* Gate: NO SELF REPORT
* Matched path: Counter A
* Requirements satisfied:

  * trust tier VERIFIED ✓
  * tag Sensor ✓
* Applied deltas:

  * gate_strength -35
  * scrutiny -1
    This panel is derived from MOVE_RESOLVED; no LLM.

---

## 7) Phase/state machine (client)

### 7.1 High-level states

* `S0_HOME`
* `S1_DAILY_BRIEF`
* `S2_DRAFT`
* `S3_RUN_ACT`
* `S4_UPGRADE` (between acts)
* `S5_RESULTS`

### 7.2 Run sub-states

Within `S3_RUN_ACT`:

* `PHASE_TURN_START`
* `PHASE_PLAYER_INPUT`
* `PHASE_RESOLVE` (instant; local)
* `PHASE_RENDER_BARK` (async; optional)
* `PHASE_TURN_END`
* `PHASE_AUDIT` (if triggered)

### 7.3 Transitions

* Brief → Draft → Run Act1
* Act1 win → Upgrade → Draft (optional) → Act2
* Act2 win → Upgrade → Draft (optional) → Boss
* Boss win/loss → Results

All transitions are driven by authoritative events:

* `INCIDENT_ASSEMBLED`
* `DRAFT_OFFERED/PICKED`
* `MOVE_RESOLVED`
* `AUDIT_TRIGGERED/RESOLVED`
* `RUN_ENDED`

---

## 8) Results / Share

### 8.1 Results content

* “Access Granted” animation (ticket/receipt printer vibe)
* Streak update
* Run stats:

  * Turns used
  * Max scrutiny level
  * Audits triggered
  * Gate chips cleared (list)
* “Rap Sheet” / “Daemon Log” share card:

  * funniest 3 barks (from voice selection)
  * top 2 moves (proof uploaded)

### 8.2 Share format

Wordle-style share but not a clone:

* chips and bars, no legal terms
* example:

  * `FRIDGE 🔒 NO SELF REPORT ✅ TIME HARDLINE ✅`
  * `Scrutiny: MED`
  * `Turns: 8/9`

---

## 9) Onboarding (no text tutorial)

### 9.1 Unwinnable micro-moment

First launch:

* 30-second scripted “Router Lock”
* give one low-trust artifact → it fails
* show “Why it failed” panel automatically
* then grant one VERIFIED artifact → instant pass
  This teaches trust tiers and gates without exposition.

---

## 10) Replayability hooks surfaced in UX

* Daily seed + global conversation (everyone plays same ladder)
* Visible “Policy Mode” chip (today’s routine) to cue drafting strategy
* Codex entries unlocked:

  * new gates seen
  * new tools used
  * new “counter paths” discovered (explainability captures these)

---

## 11) Accessibility and device constraints

* One-hand use: all primary taps in bottom half
* Minimum 44px tap targets
* No dragging required
* Offline fallback voice always available via voice packs

---

## 12) Acceptance criteria (v1)

1. Core loop is playable start-to-finish offline after caching packs.
2. Mechanical feedback is always instant; voice never blocks resolution.
3. Player can understand outcomes via “Why it worked” panel without reading external docs.
4. UX vocabulary supports “jailbreak/outsmart” fantasy, not courtroom cosplay.
5. Session fits 8–15 minutes for Daily Ladder.
