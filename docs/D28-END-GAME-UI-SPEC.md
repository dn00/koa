# D28 — END-GAME UI SPEC v2 (Mobile-First PWA)

**Status:** Draft v2.0
**Owner:** UX / Engineering
**Last Updated:** 2026-01-26
**Purpose:** Define the production-stable UI spec for Home Smart Home's core run experience, including KOA presence rendering, action model, and mode-specific UI considerations.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 0) UI design goals (non-negotiable)

1. **One primary action per turn** (SUBMIT), everything else is selection/config.
2. **Instant mechanical feedback** (bars/meter/log update immediately from resolver output).
3. **Explainability on demand** ("why" is always one tap away, never forced).
4. **Data-driven rendering** (new puzzles/cards via JSON packs should "just appear").
5. **Low cognitive load** (no "six buttons with jargon" as the core loop).

---

## 0.1) Mode-specific UI

| Element | Daily (MVP) | Freeplay (Post-MVP) |
|---------|-------------|---------------------|
| Primary button | **SUBMIT** | **INJECT** |
| Ops Strip | Hidden | Visible (FLAG/REWIRE/EXPLOIT) |
| Ops Tokens | Hidden | Visible (count of 3) |
| Terminology | Player terms | Internal terms |
| Counter visibility | FULL/HIDDEN toggle | Always visible |
| Draft | None (dealt 6 cards) | Draft from pool |

**Removed from Daily (per D31):**
- SCAN button (no reserve mechanic)
- Draft screen (players dealt 6 cards)
- Audit interstitial (scrutiny 5 = instant loss)

This spec describes **Daily UI** as the primary target. Freeplay UI notes are in §12.

---

## 1) The core "Run Screen" layout (this is the whole game)

The run screen is stable and never redesigns; everything else is a wrapper around it.

### A) Top HUD (always visible; ~15% height)

**Left:** Target + progress

* **Target label** (e.g., `SMART FRIDGE`)
* **Resistance Bar** (40→0) with optional numeric (Full Stats mode)
* **Turn indicator**: `Turn 3 / 6`

**Right:** KOA status

* **KOA avatar** showing mood state (8 states per D31)
* **Scrutiny indicator** (via KOA mood, or 5-pip bar in Full Stats mode)

**Below HUD (concerns row):**

* **Concern chips** as KOA's voice: **[You're you ✓] [Awake ○] [Meant it ○]**
* Tap chip → shows required proof type and status

**Interaction rule:**

* Chips are *information first*. Tap opens a **Concern Detail Sheet** (see §3).

---

### B) KOA Monitor Region (~10% height, between HUD and Transcript)

#### KOA Presence: "Interface Entity" (Not a Character)

**Goal:** Provide a strong, iconic KOA "presence" without drifting into character/VN framing (courtroom vibes) or creating a large art burden.

**Rule:** KOA visuals are a **pure rendering of deterministic state**. They must not introduce ambiguity or imply LLM adjudication.

##### B1. Default Rendering: "Orb / Lens" (Recommended)

KOA is rendered as a single abstract object with stateful animation:

* **Form:** Orb, lens, or ring (single entity, centered)
* **State layers:**
  1. **Core** (idle pulse / damage jitter)
  2. **Scan layer** (sweep line / reticle when selecting)
  3. **Concern glyph orbit** (small chips/icons orbiting for active concerns)
  4. **Challenge indicator** (when counter will trigger)

This is intentionally "home AI daemon / OS subsystem," not "person talking."

##### B2. Alternatives (Supported as Skins, Not Default)

* **Status Panel Only:** No entity, just "KOA / ENFORCEMENT" pane with waveform + system flags.
* **Skins (cosmetic only):** iOS-minimal, Retro CRT, Corporate HR, Cyber-daemon, etc. Skins may alter shaders/texture but cannot change semantics.

##### B3. State Mapping (Authoritative Inputs)

KOA Presence state is derived from these **authoritative** fields only:

* `scrutiny: 0-5`
* `resistance: number`
* `concerns_addressed: ConcernId[]`
* `active_counters[]: CounterId[]`
* `counters_refuted[]: CounterId[]`
* optional: `last_resolution.outcome: PASS | CONTESTED | BLOCKED`

**No other input** may influence the KOA visual state (especially not freeform text).

##### B4. Presence States (8 required per D31)

| State | Internal ID | When Triggered | Visual |
|-------|-------------|----------------|--------|
| Neutral | `NEUTRAL` | Game start, no issues | Default orb, soft pulse |
| Curious | `CURIOUS` | Player selecting cards | Slight lean, eye track |
| Suspicious | `SUSPICIOUS` | MINOR contradiction detected | Orange glow, narrowed eyes |
| Blocked | `BLOCKED` | MAJOR contradiction | Red pulse, shake |
| Grudging | `GRUDGING` | Counter refuted | Eye roll, deflation |
| Impressed | `IMPRESSED` | Clean submission | Subtle surprise |
| Resigned | `RESIGNED` | Player mathematically struggling | Pitying look, dim glow |
| Smug | `SMUG` | Player lost | Knowing look |

**Timing rule:** Resolution feedback is immediate; KOA animation reacts instantly to resolution, and any bark text follows non-blocking.

##### B5. Copy / Bark Placement (Avoids "Ace Attorney")

In the monitor region, show **KOA Dialogue** from pre-generated content:

1. **System info (always shown, deterministic):**
   * `Resistance: 25 | Turn 3/6`
   * `Concerns: 2/3 addressed`

2. **KOA dialogue (from puzzle content):**
   * Opening: "It's 2am. You're at your fridge. Again."
   * Counter: "My camera says no one was there. Your face says otherwise."
   * Refutation: "...The camera was updating. How convenient."

**Banned terms for this region:** "Objection", "Verdict", "Cross-examination", "Court record", "Inadmissible".

##### B6. Asset Requirements (Solo-dev feasible)

* **MVP:** SVG (core) + CSS animation
* **Enhanced:** optional canvas/Pixi shader layer later
* Must degrade gracefully on low-end devices:
  * reduce scan effects, disable glitch shader, keep core pulse + mood indication

##### B7. Implementation Notes

Component naming:

* `AuraAvatar` → `KoaDaemonPresence`
* prop `mood` → `presence_state: KoaPresenceState`
* always pass state derived from engine:
  * `presence_state = getMoodFromGameState(gameState)`
  * on resolution success → briefly set `IMPRESSED` or `GRUDGING` for 250–400ms

---

### C) Middle: Counter-Evidence + Story Panel (~30–40% height)

This is not a chat. It's an **evidence display** showing the adversarial dynamic.

#### C1) Counter-Evidence Panel (FULL mode)

Header: "KOA will challenge:"

List of visible counters:
```
📷 Security Camera → targets "You're you"
   "No one at door 2:07am"
   Refutable by: Maintenance Log

😴 Sleep Data → targets "Awake"
   "User asleep until 2:30am"
   Refutable by: Noise Complaint
```

* Counters marked "SPENT" when refuted (strikethrough + checkmark)
* In HIDDEN mode: shows "? counters hidden" until triggered

#### C2) Committed Story Timeline

Header: "Your Story:"

Visual timeline of submitted evidence:
```
1:00am     2:00     2:05  2:10     2:15
  |         |        |     |        |
            [===SMART WATCH (AWAKE)===]
                 [FACE ID (KITCHEN)]
                 [VOICE LOG (KITCHEN)]
```

* Each entry shows: card name, time range, claims
* Tap entry → card details + contribution to damage

#### C3) Turn Transcript (optional view)

Toggle to show turn-by-turn log:

1. **Turn 1:** Face ID submitted → Contested (Camera) → 6 damage
2. **Turn 2:** Maintenance Log → Refuted Camera → +6 restored → 11 total

---

### D) Bottom: Action Builder (persistent; ~40–50% height)

This is the "controller." It should feel like a cockpit, not a menu.

#### D1) Evidence Hand

* Shows the player's **6 Evidence cards** (dealt, not drafted)
* Selected cards elevate and highlight
* Tap to select (up to 3), tap again to deselect
* Long-press for full card details

#### D2) Selection Preview

When cards are selected, show:

* **Concerns addressed:** IDENTITY, INTENT
* **Counter triggered:** "KOA will challenge: Security Camera"
* **Corroboration:** "Stories Align: +25%" (if applicable)
* **Contradiction:** "⚠️ SUSPICIOUS (+1 Scrutiny)" or "⛔ IMPOSSIBLE (Blocked)"
* **Damage preview:** "~17 damage" or "Contested: ~8"

#### D3) Primary commit controls (Daily)

Single primary button:

* **SUBMIT** (primary): commits the turn
  * Label: "SUBMIT"
  * Sub-label shows preview in Full Stats mode
  * Disabled with message if MAJOR contradiction detected

**Removed from Daily (per D31):**
* No SCAN button (no reserve mechanic)
* No secondary actions

#### D4) Corroboration Indicator

When 2+ selected cards share claims:
```
┌─────────────┐         ┌─────────────┐
│  Face ID    │─────────│  Voice Log  │
│  🏠 KITCHEN │  MATCH  │  🏠 KITCHEN │
└─────────────┘         └─────────────┘
      ✨ Stories Align: +25% damage
```

---

## 2) Action Model UI: Daily (Simple)

Daily mode has the simplest possible action model:

1. Player **selects 1–3 cards** from hand
2. Player sees **preview** (concerns, counters, contradictions, damage)
3. Player presses **SUBMIT**
4. Resolver evaluates and applies mechanics instantly

No move selection. No toggles. No tokens. No SCAN.

---

## 3) Concern Detail Sheet (tap any concern chip)

This makes the game learnable without a tutorial dump.

### Concern Detail Sheet sections

1. **What KOA asks** (human readable)
   * "Prove you're you."

2. **What satisfies it** (proof types)
   * Requires: IDENTITY proof type
   * Cards in hand that prove this: Face ID, Biometric Log

3. **Current status**
   * ✓ Addressed (if satisfied)
   * ○ Not yet addressed

4. **Counter threats**
   * "Security Camera challenges IDENTITY evidence"

---

## 4) Card UI (end-game scalable)

Cards must support *hundreds* of archetypes over time without redoing the UI.

### Card front (Minimal mode)

* Title
* **Power indicator** (⭐⭐⭐ stars)
* Claims as icons (🏠 Kitchen, 👁️ Awake)
* "Proves you're you" (natural language)

### Card front (Full Stats mode)

* Title
* **Power: 12** (exact number)
* Proof type: IDENTITY
* Time range: 2:05-2:10am
* Claims: KITCHEN, AWAKE
* Counter trigger warning: "Triggers: Camera"

### Card back (detail modal / sheet)

* Full claims breakdown
* Time range visualization
* Proof types
* "Will trigger counter: Security Camera"
* Refutes (if refutation card): "Nullifies: Security Camera"

**Important:** never require unique art per card to ship. Use:

* clean iconography
* subtle "source textures" (receipt paper, OS log, sensor trace)
* optional AI-generated art later as cosmetics

---

## 5) Contradiction Warning UI

### 5.1 MINOR Contradiction (yellow)

Appears when selected cards conflict with committed story (recoverable):

```
┌─────────────────────────────────────┐
│  ⚠️ SUSPICIOUS                       │
│                                      │
│  Sleep Tracker claims ASLEEP @ 2:00am│
│  Your story has AWAKE @ 2:08am       │
│                                      │
│  KOA: "That's... medically           │
│        impressive." (+1 Scrutiny)    │
│                                      │
│  [DESELECT]     [SUBMIT ANYWAY]      │
└─────────────────────────────────────┘
```

### 5.2 MAJOR Contradiction (red)

Appears when selected cards logically impossible:

```
┌─────────────────────────────────────┐
│  ⛔ IMPOSSIBLE                       │
│                                      │
│  Gym Wristband claims GYM @ 2:00am   │
│  Your story has KITCHEN @ 2:05am     │
│                                      │
│  KOA: "You can't be in two places    │
│        at once."                     │
│                                      │
│  [DESELECT]     [BLOCKED]            │
└─────────────────────────────────────┘
```

---

## 6) Result screen (Daily)

### 6.1 Win screen

* Large "ACCESS GRANTED" header
* KOA defeat line: "Your story is... consistent. Annoyingly so."
* Target unlocked animation (device opens)
* Concerns: All checked ✓

**Stats summary:**
* Turns used: 4/6
* Damage dealt: 52
* Contradictions: 0 (Perfect!)
* Counters refuted: 2/2
* Scrutiny: 0/5

**Share button** → generates share card

### 6.2 Loss screen (Turns exhausted)

* "ACCESS DENIED" header
* KOA: "Time's up. Your story had gaps."
* Remaining resistance shown
* Unaddressed concerns highlighted

### 6.3 Loss screen (Scrutiny 5)

* "SCRUTINY OVERLOAD" header
* KOA: "Your story fell apart under scrutiny."
* Scrutiny meter: 🔴🔴🔴🔴🔴 (5/5)
* Key contradictions that cost scrutiny listed

### 6.4 Share card format

```
HOME SMART HOME — Daily #42
🧊 SMART FRIDGE

[You're you ✓] [Awake ✓] [Meant it ✓]

Resistance: ████████░░ → ░░░░░░░░░░
Scrutiny: ⚪⚪⚪⚪⚪ (0/5)
Turns: 4/6

ACCESS GRANTED ✅
```

---

## 7) Home screen (mode selection)

### Home layout

* **Daily** — primary (shows today's target)
* **Practice** — secondary (tutorial/sandbox)
* **Codex** — completion tracking
* **Settings** — display modes, voice packs

### Daily card

* Shows target device + theme
* Shows KOA's opening line preview
* Shows "Best: 4 turns" or "Not yet cleared"
* One-tap "Play Daily"

---

## 8) Latency + voice handling (UI-level rules)

* Mechanics update at T=0 from deterministic resolver output.
* KOA dialogue renders at T=0 as **pre-generated content** from puzzle pack.
* All 41 card combinations have pre-generated dialogue.
* Never block SUBMIT on voice or network.

---

## 9) What to avoid in the UI (production warnings)

1. **No SCAN button in Daily.**
   * Daily has SUBMIT only.
   * No reserve, no refresh mechanic.

2. **No Draft screen in Daily.**
   * Players are dealt 6 cards immediately.
   * No card selection phase.

3. **No Audit interstitial in Daily.**
   * Scrutiny 5 = instant loss.
   * No audit recovery phase.

4. **No Ops Tokens display in Daily.**
   * Tokens don't exist in Daily mode.

5. **Use player terminology in Daily.**
   * "Resistance" not "Gate Strength"
   * "Concern" not "Gate"
   * "Submit" not "Inject"
   * "Your Story" not "Committed Testimony"

6. **Counter visibility must be toggleable.**
   * FULL mode: All counters visible from start
   * HIDDEN mode: Counters revealed when triggered

---

## 10) Progressive Disclosure UI

### 10.1 Minimal Mode (default)

* Card power: ⭐⭐⭐ stars
* Resistance: bar only
* Scrutiny: KOA mood only
* Damage: "That got through" not numbers

### 10.2 Full Stats Mode (toggle)

* Card power: exact numbers
* Resistance: bar + "25/40"
* Scrutiny: "2/5" meter
* Damage: floating numbers, formula visible

### 10.3 Toggle access

* Settings icon always visible on run screen
* Long-press KOA avatar = quick toggle
* Changes apply immediately
* Preference persists across sessions

---

## 11) Deterministic Explainability Panel

Add a persistent affordance (one tap away from any outcome):

* "WHY?" button opens panel showing:
  * Concerns checked
  * Damage calculation breakdown
  * Counter status (contested/refuted)
  * Corroboration bonus applied
  * Scrutiny changes
  * What was added to "Your Story"

This is what makes the game feel "real" and not LLM fluff.

---

## 12) Freeplay UI notes (Post-MVP)

When Freeplay mode ships:

### 12.1 Additional elements

* **Draft screen** (pick from pool)
* **Ops Tokens display** in top HUD
* **Ops Strip** in action builder (FLAG, REWIRE, EXPLOIT)
* **Act indicator** (e.g., `Act 2 / 3`)
* **Multiple Gates** (not just Concerns)
* **SCAN/Cycle** mechanic

### 12.2 Terminology switch

Freeplay uses internal terms:
* "Gate Strength" instead of "Resistance"
* "Gate" instead of "Concern"
* "Inject" instead of "Submit"
* "Cycle" instead of "Scan"

### 12.3 Between-act screens

* Cache/Shop screen with reward selection
* Simple layout: pick 1 of 3 rewards, continue

---

## 13) Daily Fairness Lock Indicator

In Daily mode, display:

* `Daily Seed ID`
* `Puzzle ID` (content snapshot)
* `Same cards for everyone` badge

This prevents player distrust when outcomes feel tight.

---

## 14) Offline / Pack Integrity Indicators (PWA reality)

Add small but critical indicators:

* Offline/Online badge (non-intrusive)
* Puzzle cache status:
  * `PUZZLE CACHED`
  * `PUZZLE STALE` (safe but warn)
  * `PUZZLE MISSING` (fail-closed; cannot start Daily)

---

## 15) Latency Strategy (UI contract)

* UI must never block "SUBMIT" resolution on network.
* All dialogue is pre-generated per puzzle.
* Mechanics are deterministic and instant.
