# D14 — UX WIREFRAME SPEC (MOBILE-FIRST).md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Product / UX
**Last Updated:** 2026-01-25
**Purpose:** Define the complete mobile-first UX for Life with AURA: screen flows, core components, interaction rules, and the “instant mechanics + non-blocking voice” cadence. This is a wireframe spec in words with component inventory and acceptance criteria.

---

## 0) UX principles (non-negotiable)

1. **One-thumb playable:** primary actions reachable; no drag-and-drop required.
2. **Constraints create strategy:** player never types “anything”; they assemble payloads.
3. **Instant mechanics:** gate strength/scrutiny update immediately on press.
4. **Voice is decoration:** barks may arrive later; never blocks the next action.
5. **Explainability always available:** “Why did that work?” is always one tap away.
6. **Offline-first:** daily + free play must be playable without network (with cached packs).

---

## 1) Global navigation model

### Primary nav

* **Home** (modes + daily)
* **Play** (active run)
* **Codex** (learned gates, paths, archetypes)
* **Locker** (cosmetics/voice packs/settings)
* **Archive** (past dailies if unlocked)

### Single-session behavior

* If a run is active, app launches directly into **Play** with a “Resume Run” banner.

---

## 2) Core screens (wireframe-level)

## S00 — Splash / Boot

**Goal:** load packs, determine offline readiness, resume last run.

Components:

* Loading bar (“Syncing packs…”)
* Status chips: `Offline Ready`, `Daily Cached`, `Enhanced AURA Off/On`
* “Resume Run” (if active)

Rules:

* If no network: proceed using cached packs; if missing essentials, show fallback message and offer “Free Play (Local)” only.

---

## S01 — Home

**Goal:** choose Daily or Free Play, view streak, see today’s theme.

Layout:

* Top: **Streak** + “Today’s featured seed” card
* Primary CTA: **Play Daily**
* Secondary CTA: **Free Play**
* Tertiary: Archive (if unlocked), Codex, Settings

Daily card:

* Short theme line: “Midnight Fridge Lockdown”
* Badges: “Same seed for everyone” / “No meta perks”

Free play card:

* “Unlimited runs • offline”

---

## S02 — Daily Details (pre-run)

**Goal:** show what daily is (no heavy tutorial), confirm start.

Components:

* “Today’s lock target” + theme
* “Rules” chips:

  * “Standardized loadout”
  * “3 incidents”
  * “Attempts: unlimited” (or limited if you choose later)
* CTA: **Start Daily**
* Secondary: “How Daily Works” (1-sheet modal)

---

## S03 — Run Start (Act ladder overview)

**Goal:** orient the player to the 3-incident ladder and their current kit.

Layout:

* Top: Ladder (Act1 → Act2 → Boss)
* Middle: Current **starter deck preview** (6–10 archetype cards)
* Bottom: CTA **Enter Act 1**

Optional: “Skip intro next time” toggle after first play.

---

## S04 — Incident Intro (Act N)

**Goal:** reveal the lock, active gates, routine, and turn budget.

Layout (top-to-bottom):

1. **Lock Header**

   * Lock name: “FRIDGE: Night Protocol”
   * Gate Strength bar (e.g., 100 → 0)
2. **Constraint Row**

   * Active Gates chips (remember: clear jargon; no “court”)
   * Routine chip (e.g., “Strict Verify”)
   * Modifier chip (if any)
3. **Turn Budget**

   * “Turns left: 9”
4. CTA: **Begin**

AURA Intro Bark:

* Plays instantly from voice pack (RUN_START / GATE_APPLIED).

---

## S05 — Play Screen (the core loop)

**Goal:** Recon → Build → Inject → Adapt, one-thumb.

### Region A — Top HUD (sticky)

* Lock Target + Gate Strength bar
* Scrutiny indicator (Low/Med/High) with tooltip
* Active Gates chips (tap = short description + counter paths summary)
* Routine chip (tap = what it tends to value; *never* mechanics override)

### Region B — Stream (middle)

A vertical transcript styled like a system chat/log:

* AURA barks
* Player “payload” summaries (auto-generated)
* Outcome barks
* Audit events (system notices)
* Recap of deltas (compact)

Each turn, stream inserts:

1. AURA “pressure” bark (optional)
2. Player payload bubble (generated)
3. Outcome bubble (pre-gen bark)
4. Optional Enhanced overlay (if enabled)

### Region C — Builder Panel (bottom, primary interaction)

**C1 Move Row (6 moves)**

* Inject
* Flag
* Rewire
* Corroborate
* Cycle
* Exploit

Move tap:

* selects move
* highlights relevant affordances (artifact slots/tool slot)
* shows move tooltip on long-press

**C2 Payload Slots**

* Slot 1: Artifact
* Slot 2: Artifact
* Slot 3 (conditional): Tool / Anchor (only for some moves)

Behavior:

* Tap an artifact card in hand → fills next empty slot.
* Tap a filled slot → remove.
* Slot limits: typically 2 artifacts; some modifiers reduce to 1.

**C3 Hand Carousel**

* Horizontal carousel of artifact cards (5–8 visible)
* Each card shows:

  * Archetype icon
  * Trust tier badge (Verified/Plausible/Sketchy)
  * 2–3 tags chips
  * “Timestamped” icon if applicable

Card tap: select into payload
Card long-press: details sheet (full tags/traits + “where it’s strong” hints)

**C4 Primary CTA**

* Big button: **INJECT** (label changes by selected move)
* Disabled state shows why (“Select a move”, “Choose a target gate”, etc.)

**C5 Explain panel**

* Small “WHY?” button
* Opens bottom sheet: deterministic explanation of last resolution.

### Target selection (for gates)

If multiple gate instances are active:

* After selecting a move, the gate chips become selectable
* Player taps one gate chip to target
* Selection is persistent until changed

---

## S06 — Resolution (micro-feedback + bark)

**Goal:** feel instant; avoid latency.

On press:

* T=0ms: Gate Strength bar animates down/up; Scrutiny animates; small delta numbers optional.
* T=150–600ms: Outcome bark appears in stream with typing animation.
* If Enhanced enabled:

  * pre-gen bark always shows
  * enhanced overlay can append later (marked “deluxe” subtly)

---

## S07 — Audit Interstitial

**Goal:** signal push-your-luck consequence clearly; keep action.

Trigger:

* When AUDIT_TRIGGERED is emitted.

UI:

* Banner in stream: “AUDIT PROTOCOL: Corroboration Lock (2 turns)”
* HUD adds an “Audit” chip with timer

Effect presentation:

* Greyed-out moves or slot constraints visually updated (e.g., Rewire disabled)
* “What changed?” link opens a simple explanation sheet.

---

## S08 — Between Acts (Cache/Shop)

**Goal:** keep run length 10–15 minutes; provide meaningful choices.

Layout:

* Title: “CACHE FOUND”
* Currency (credits)
* Offer cards (3–5) with pick count
* Categories:

  * New artifact archetype
  * New tool
  * Upgrade an existing archetype (adds trait, not raw power)
* CTA: “Continue to Act 2”

Rules:

* Avoid analysis paralysis: show 3 offers, pick 1 (v1).
* “View deck” drawer for current kit.

---

## S09 — Act Complete

**Goal:** celebrate progress, show why it worked.

Components:

* “LOCK WEAKENED” animation
* Summary chips:

  * Gates cleared
  * Max scrutiny reached
  * Key counter path discovered (if new)
* CTA:

  * “Proceed”
  * “View Recap” (short)

---

## S10 — Run Win

**Goal:** shareable result without being Wordle-clone.

Components:

* “HOUSE UNLOCKED”
* Run recap: 3 incidents outcome, max scrutiny, turns used
* “New Codex Entries” (if any)
* CTA:

  * “Play Again” (Free Play)
  * “Share Run Card” (image/clipboard summary)
  * “Play Daily” (if this was free play)

Share card content:

* lock targets beaten
* icons for key gates + modifiers encountered
* *no* specific “wordle grid”; keep unique.

---

## S11 — Run Loss

**Goal:** failing forward, immediate re-entry.

Components:

* “LOCKDOWN HELD”
* Failure reason: “Turn budget exhausted” / “Audit failed”
* “What you learned”:

  * Gate behaviors discovered
  * Suggested counter path family (non-authoritative)
* CTA:

  * “Retry” (immediate)
  * “Free Play” (if daily locked by attempt count; v1 unlimited)

---

## S12 — Codex

**Goal:** depth retention; teach without tutorial walls.

Tabs:

* Gates
* Modifiers
* Moves
* Archetypes
* “Discovered Paths” (counter paths)

Each Gate page:

* Plain-language description
* Known counter families (unlocks as discovered)
* Example payloads (templated, not player-specific)

---

## S13 — Settings / Locker

Key toggles:

* Enhanced AURA (off by default)
* Profanity tier
* Haptics / sound
* Offline cache status
* Data/telemetry opt-in

Voice pack selection:

* “Default daemon”
* Cosmetic packs (no mechanical differences)

---

## S14 — Archive (monetization hook)

* Past dailies list (dates + themes)
* Locked items show “Unlock Archive” (one-time purchase)

Offline:

* archive entries available only if previously cached.

---

## 3) Onboarding (no heavy tutorial)

### 3.1 First-run sequence

* A 45–60 second “guided Act 1”:

  * player selects a move
  * selects one artifact
  * sees immediate gate strength change
  * opens “WHY?” once

### 3.2 “Unwinnable micro-loss” (optional)

If used, keep it gentle:

* first interaction fails due to self-report gate
* then you grant a verified artifact and they succeed immediately

---

## 4) Accessibility & ergonomics

* All core actions reachable in bottom 50% of screen
* Large tap targets for chips
* Motion reduction toggle
* Color-blind friendly: do not rely only on red/green for scrutiny

---

## 5) UX acceptance criteria (v1)

1. Player can complete a full 3-incident run without typing anything.
2. Player always understands:

   * what gates are active
   * what move they are using
   * what happened (WHY panel)
3. No gameplay action waits on network.
4. AURA lines never contain courtroom jargon (validated via D15).
5. A run can be played fully offline after first pack cache.

