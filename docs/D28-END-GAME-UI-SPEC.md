# D28 — END-GAME UI SPEC v1 (Mobile-First PWA)

**Status:** Draft v1.1
**Owner:** UX / Engineering
**Last Updated:** 2026-01-26
**Purpose:** Define the production-stable UI spec for Life with AURA's core run experience, including AURA presence rendering, action model, and mode-specific UI considerations.

---

## 0) UI design goals (non-negotiable)

1. **One primary action per turn** (commit), everything else is selection/config.
2. **Instant mechanical feedback** (bars/meter/log update immediately from resolver output).
3. **Explainability on demand** ("why" is always one tap away, never forced).
4. **Data-driven rendering** (new protocols/cards via JSON packs should "just appear").
5. **Low cognitive load** (no "six buttons with jargon" as the core loop).

---

## 0.1) Mode-specific UI

| Element | Daily (MVP) | Freeplay (Post-MVP) |
|---------|-------------|---------------------|
| Primary button | **SUBMIT** | **INJECT** |
| Secondary button | **SCAN** | **CYCLE** |
| Ops Strip | Hidden | Visible (FLAG/REWIRE/EXPLOIT) |
| Ops Tokens | Hidden | Visible (count of 3) |
| Terminology | Player terms | Internal terms |

This spec describes **Daily UI** as the primary target. Freeplay UI notes are in §12.

---

## 1) The core "Run Screen" layout (this is the whole game)

The run screen is stable and never redesigns; everything else is a wrapper around it.

### A) Top HUD (always visible; ~15% height)

**Left:** Target + progress

* **Target label** (e.g., `FRIDGE`)
* **Resistance Bar** (100→0) with numeric %
* **Turn indicator**: `Turn 3 / 8`

**Right:** Pressure

* **Scrutiny meter** (5-pip bar; fills left-to-right)
* Optional tiny icon for "Daily Seed" mode

**Below HUD (chips row):**

* **Active Protocol chips** (tap for details)
* **Modifier chip** (if active, rare)

**Interaction rule:**

* Chips are *information first*. Tap opens a **Protocol Detail Sheet** (see §3).

---

### B) AURA Monitor Region (~10% height, between HUD and Transcript)

#### AURA Presence: "Interface Entity" (Not a Character)

**Goal:** Provide a strong, iconic AURA "presence" without drifting into character/VN framing (courtroom vibes) or creating a large art burden.

**Rule:** AURA visuals are a **pure rendering of deterministic state**. They must not introduce ambiguity or imply LLM adjudication.

##### B1. Default Rendering: "Orb / Lens" (Recommended)

AURA is rendered as a single abstract object with stateful animation:

* **Form:** Orb, lens, or ring (single entity, centered)
* **State layers:**

  1. **Core** (idle pulse / damage jitter)
  2. **Scan layer** (sweep line / reticle)
  3. **Protocol glyph orbit** (small chips/icons orbiting for active protocols)
  4. **Audit ring** (locks into place during audit)

This is intentionally "home AI daemon / OS subsystem," not "person talking."

##### B2. Alternatives (Supported as Skins, Not Default)

* **Status Panel Only:** No entity, just "AURA / ENFORCEMENT" pane with waveform + system flags.
* **Skins (cosmetic only):** iOS-minimal, Retro CRT, Corporate HR, Cyber-daemon, etc. Skins may alter shaders/texture but cannot change semantics.

##### B3. State Mapping (Authoritative Inputs)

AURA Presence state is derived from these **authoritative** fields only:

* `scrutiny: 0-5`
* `audit_active: boolean`
* `active_gates[]: GateId[]`
* optional: `last_resolution.outcome: PASS | FAIL | CLEARED`

**No other input** may influence the AURA visual state (especially not freeform text).

##### B4. Presence States (v1 required)

Define a small enum for the renderer:

* `IDLE` — no scan, soft pulse
* `SCAN` — sweep line / reticle active (default when awaiting input)
* `LOCKDOWN` — tighter ring + sharper edges (high scrutiny)
* `AUDIT_ACTIVE` — ring locks + periodic scan burst
* `DAMAGED` — brief glitch/jitter on successful resolution (Resistance reduced)
* `REJECT` — sharp "error" flicker when action rejected

**Timing rule:** resolution feedback is immediate; AURA animation reacts instantly to resolution, and any bark text follows non-blocking.

##### B5. Copy / Bark Placement (Avoids "Ace Attorney")

In the monitor region, show **System Prompt** + optional **Flavor Bark**:

1. **System Prompt (always shown, deterministic phrasing):**

* Examples:

  * `PROTOCOL: NO_SELF_REPORT — verified source required`
  * `SCRUTINY: 3/5 — audit risk rising`
  * `AUDIT ACTIVE — next submit constrained`

2. **Flavor Bark (optional, from Voice Pack):**

* Short, snide, but no courtroom words.
* Must be selectable from `OutcomeKey` only.

**Banned terms for this region:** "Objection", "Verdict", "Cross-examination", "Court record", "Inadmissible".

##### B6. Asset Requirements (Solo-dev feasible)

* **MVP:** SVG (core) + CSS animation
* **Enhanced:** optional canvas/Pixi shader layer later
* Must degrade gracefully on low-end devices:

  * reduce scan effects, disable glitch shader, keep core pulse + glyphs

##### B7. Implementation Notes

Component naming for future-proofing:

* `AuraAvatar` → `AuraDaemonPresence`
* prop `mood` → `presence_state: AuraPresenceState`
* always pass state derived from engine:

  * `presence_state = audit_active ? AUDIT_ACTIVE : awaiting_input ? SCAN : IDLE`
  * on resolution success → briefly set `DAMAGED` for 250–400ms

---

### C) Middle: Transcript Feed (scrollable; ~30–40% height)

This is not a chat. It's an **audit log UI** that *reads like* a chat.

Each turn produces 2–3 **Transcript Cards**:

1. **AURA Prompt Card** (what constraint is active / what's being challenged)
2. **Payload Card** (what the player submitted—compact structured summary)
3. **Outcome Card** (PASS/FAIL + deltas)

Each Transcript Card has:

* **One-line headline**
* **Small structured metadata row** (Protocol, Scrutiny change, Compliance)
* Optional **flavor bark** (pre-gen voice line)
* **"WHY" affordance** (tap expands to deterministic explanation)

**Critical:** Transcript cards render from deterministic events. The UI is replayable and consistent.

---

### D) Bottom: Action Builder (persistent; ~40–50% height)

This is the "controller." It should feel like a cockpit, not a menu.

#### D1) Payload Staging (top of bottom sheet)

* **Two slots** (A / B) that accept cards
* Optional "link" indicator between slots (shows Resonance bonus)
* Tap card in slot to remove; long-press opens full detail

**Drag-and-drop** is ideal; must also support **tap-to-add** for accessibility.

#### D2) Evidence Carousel

* Shows the player's **6 Evidence cards** (drafted loadout)
* Quarantined cards show "locked" overlay with turn count
* Swipe to see all cards; tap to select into payload slot

#### D3) Primary commit controls (Daily)

Two buttons:

* **SCAN** (secondary): refreshes evidence from reserve
  * Label: "SCAN" with "+2 Scrutiny" indicator
  * Disabled if Scrutiny = 5 or SCAN limit reached
* **SUBMIT** (primary): commits the turn
  * Label: "SUBMIT"
  * Sub-label shows preview: "Compliance: ~22" or "Protocol: likely pass"

**Resonance indicator:** When 2 cards share a resonance tag, show "Resonance: 1.5x" near SUBMIT button.

---

## 2) Action Model UI: Daily (Simple)

Daily mode has the simplest possible action model:

1. Player **slots 1–2 cards** into payload
2. Player presses **SUBMIT**
3. Resolver evaluates protocol satisfaction and calculates compliance

No move selection. No toggles. No tokens.

**Alternative action:** Player can press **SCAN** instead of SUBMIT (costs turn + scrutiny).

---

## 3) Protocol Detail Sheet (tap any protocol chip)

This is the most important UX element because it makes the game learnable without a tutorial dump.

### Protocol Detail Sheet sections

1. **What this protocol forbids** (human readable)
2. **How to beat it** (2–4 counter paths shown as patterns)

   * Show as "recipes," not formulas:

     * `Verified Sensor` OR `Verified Authority` OR `Purchase + Timestamped`
3. **What will fail** (common invalids)
4. **Current evidence hints** (purely deterministic)

   * Example: "You currently hold 1 card that can satisfy Path B"

This sheet externalizes the rules without relying on LLM interpretation.

---

## 4) Card UI (end-game scalable)

Cards must support *hundreds* of archetypes over time without redoing the UI.

### Card front (compact)

* Title
* **Impact number** (visible, prominent)
* Trust tier badge (VERIFIED / PLAUSIBLE / SKETCHY)
* 1–2 key tags as small chips/icons (e.g., `SENSOR`, `PURCHASE`, `TIME`)
* Tiny trait markers (timestamped/editable/corroboratable)

### Card back (detail modal / sheet)

* Full tag list
* Traits + what they do mechanically
* Source provenance line
* "Resonance hooks" (what tags enable resonance)
* Deterministic preview text:

  * "Counts as VERIFIED SENSOR for `NO_SELF_REPORT`"

**Important:** never require unique art per card to ship. Use:

* clean iconography
* subtle "source textures" (receipt paper, OS log, sensor trace)
* optional AI-generated art later as cosmetics

---

## 5) Draft screen (Daily-specific)

### 5.1 Layout

* Top: Target + Protocol chips (what you're solving for)
* Middle: **12 cards** displayed in grid or carousel
* Bottom: **6 slots** for your picks + "Start" button

### 5.2 Interaction

* Tap card to select (moves to slot)
* Tap slot to deselect (returns card)
* "Start" enabled when 6 cards selected

### 5.3 Hints (optional, for accessibility)

* Show which cards satisfy which protocol paths
* Show potential resonance pairs
* These are deterministic UI assists, not LLM-generated

---

## 6) Result screen (Daily)

### 6.1 Win screen

* Large "ACCESS GRANTED" header
* Target unlocked animation (device opens)
* Stats summary:
  * Turns used / total
  * Par medal (Gold/Silver/Bronze)
  * Scrutiny peak
  * Audits triggered
* **Share button** → generates share card

### 6.2 Loss screen

* "ACCESS DENIED" header
* Stats summary (same as win)
* "Retry" button
* Share card still generated (shows progress made)

### 6.3 Share card format

```
AURA Daily • 2026-01-26
FRIDGE unlocked
⭐⭐⭐ Gold (4 turns left)
Scrutiny peak: 3/5
No audits triggered
```

---

## 7) Home screen (mode selection)

### Home layout

* **Daily** — primary (shows today's target)
* **Practice** — secondary (tutorial/sandbox)
* **Codex** — completion tracking
* **Settings**

### Daily card

* Shows target device
* Shows protocol count
* Shows "First clear" or "Best: Gold"
* One-tap "Start Daily"

---

## 8) Latency + voice handling (UI-level rules)

* Mechanics update at T=0 from deterministic resolver output.
* Voice line renders at T=0 as **pre-gen bark** selected by `OutcomeKey`.
* If "Enhanced Voice" is enabled, show the deluxe line **as an edit** that arrives later:

  * The transcript card can "upgrade" its flavor line without changing any numbers.
* Never block SUBMIT on voice.

---

## 9) What to avoid in the UI (production warnings)

1. **No move selection in Daily.**
   * Daily has SUBMIT and SCAN. That's it.
   * Don't show FLAG/REWIRE/EXPLOIT toggles.

2. **No Ops Tokens display in Daily.**
   * Tokens don't exist in Daily mode.

3. **Use player terminology in Daily.**
   * "Resistance" not "Gate Strength"
   * "Protocol" not "Gate"
   * "Submit" not "Inject"
   * "Scan" not "Cycle"

4. **Protocol targeting must be clear.**
   * If multiple protocols are active, show which one the current payload addresses.

---

## 10) SCAN economy (simple counter)

SCAN is implemented as:

* Button label: "SCAN" with cost indicator (+2 Scrutiny)
* Show remaining uses: `Scans: 1 left` (typical max: 2)
* When scans exhausted, button disabled with tooltip "No scans remaining"

---

## 11) Deterministic Explainability Panel

Add a persistent affordance (one tap away from any outcome):

* "Why did that work?" expands a panel showing:

  * Protocol(s) checked
  * Counter-path selected
  * Which tags/traits satisfied which requirement
  * Compliance calculation breakdown
  * Deltas (Resistance change, Scrutiny change)
  * Any audit triggers

This is what makes the game feel "real" and not LLM fluff.

---

## 12) Freeplay UI notes (Post-MVP)

When Freeplay mode ships:

### 12.1 Additional elements

* **Ops Tokens display** in top HUD (e.g., `3`)
* **Ops Strip** in action builder (FLAG, REWIRE, EXPLOIT toggles)
* **Act indicator** (e.g., `Act 2 / 3`)
* **Gate Strength bars** (multiple gates)

### 12.2 Terminology switch

Freeplay uses internal terms:
* "Gate Strength" instead of "Resistance"
* "Gate" instead of "Protocol"
* "Inject" instead of "Submit"
* "Cycle" instead of "Scan"

### 12.3 Between-act screens

* Cache/Shop screen with reward selection
* Simple layout: pick 1 of 3 rewards, continue

---

## 13) Daily Fairness Lock Indicator

In Daily mode, display:

* `Daily Seed ID`
* `Manifest ID` (or content snapshot hash)
* `Standard Loadout` badge (meta perks disabled)

This prevents player distrust when outcomes feel tight.

---

## 14) Offline / Pack Integrity Indicators (PWA reality)

Add small but critical indicators:

* Offline/Online badge (non-intrusive)
* Pack integrity status:

  * `PACKS VERIFIED`
  * `PACKS STALE` (safe but warn)
  * `PACKS INVALID` (fail-closed; cannot start Daily)

---

## 15) Latency Strategy (UI contract)

Even if you later add Enhanced AURA:

* UI must never block "SUBMIT" resolution on LLM.
* Flavor bark can arrive late and append to transcript with a subtle "(late)" marker if needed.
