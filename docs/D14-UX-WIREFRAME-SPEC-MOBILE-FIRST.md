# D14 — UX WIREFRAME SPEC (MOBILE-FIRST).md

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Product / UX
**Last Updated:** 2026-01-26
**Purpose:** Define the complete mobile-first UX for Home Smart Home: screen flows, core components, interaction rules, and the "instant mechanics + non-blocking voice" cadence. This is a wireframe spec in words with component inventory and acceptance criteria.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 0) UX principles (non-negotiable)

1. **One-thumb playable:** primary actions reachable; no drag-and-drop required.
2. **Constraints create strategy:** player assembles evidence to build a story.
3. **Instant mechanics:** resistance/scrutiny update immediately on press.
4. **Voice is decoration:** barks may arrive later; never blocks the next action.
5. **Explainability always available:** "Why did that work?" is always one tap away.
6. **Offline-first:** daily + practice must be playable without network (with cached puzzle).
7. **No draft phase:** players are dealt 6 cards immediately (D31).

---

## 1) Global navigation model

### Primary nav (Daily mode)

* **Home** (daily + practice)
* **Play** (active puzzle)
* **Codex** (learned concerns, counter types)
* **Settings** (display modes, voice packs)

### Single-session behavior

* If a puzzle is active, app launches directly into **Play** with a "Resume" banner.

---

## 2) Core screens (wireframe-level)

**Daily mode screens:**
- S00 — Splash / Boot
- S01 — Home
- S02 — Daily Details (pre-run)
- S03 — Play Screen (main loop)
- S04 — Win Screen
- S05 — Lose Screen
- S06 — Codex
- S07 — Settings

**Removed from Daily mode (per D31):**
- Draft screen (no card selection)
- Act ladder overview (single puzzle, not 3 acts)
- Cache/Shop (Freeplay only)
- Audit interstitial (scrutiny 5 = instant loss)
- 6-move row (Daily uses SUBMIT only)

---

## S00 — Splash / Boot

**Goal:** load puzzle, determine offline readiness.

Components:

* Loading bar ("Syncing puzzle...")
* Status chips: `Offline Ready`, `Daily Cached`
* "Resume Puzzle" (if active)

Rules:

* If no network: proceed using cached puzzle; if missing, offer "Practice" only.

---

## S01 — Home

**Goal:** choose Daily or Practice, view streak.

Layout:

* Top: **Streak** + "Today's puzzle" card
* Primary CTA: **Play Daily**
* Secondary CTA: **Practice** (tutorial/sandbox)
* Tertiary: Codex, Settings

Daily card:

* Device being locked: "SMART FRIDGE"
* Theme line: "Midnight Snacking"
* Badges: "Same puzzle for everyone" / "5 minutes"

Practice card:

* "Learn the mechanics • Offline"

---

## S02 — Daily Details (pre-run)

**Goal:** show puzzle parameters, KOA's opening.

Components:

* KOA avatar (NEUTRAL state)
* KOA's opening monologue: "It's 2am. You're at your fridge. Again..."
* Device being locked + lock reason
* **Concerns** (KOA's voice): "Prove you're you. Prove you're awake. Prove you meant to do this."
* **Counter preview** (FULL mode): "KOA will challenge: Security Camera, Sleep Data"
* **Resistance:** 40 | **Turns:** 6
* CTA: **Start**
* Toggle: Settings icon (Minimal/Full Stats)

---

## S03 — Play Screen (the core loop)

**Goal:** Submit evidence, build story, convince KOA. One-thumb.

### Region A — Top HUD (sticky, ~25%)

**A1 — KOA Panel**
* KOA avatar showing mood state (8 states per D31)
* KOA's current dialogue (auto-scrolls)
* Mood indicator subtle glow/animation

**A2 — Concerns Row**
* Concern chips showing KOA's questions as checkable phrases
* Format: **[You're you ✓] [Awake ○] [Meant it ○]**
* Tap chip → tooltip with required proof type

**A3 — Progress Bar**
* Resistance bar (Minimal mode) OR Resistance: 12/40 (Full Stats mode)
* Turn counter: "Turn 3 / 6"

### Region B — Middle Panel (~35%)

**B1 — Counter-Evidence Panel** (FULL mode)
* Header: "KOA will challenge:"
* List of visible counters:
  ```
  📷 Security Camera → targets "You're you"
     "No one at door 2:07am"
     Refutable by: Maintenance Log, Blind Spot Report

  😴 Sleep Data → targets "Awake"
     "User asleep until 2:30am"
     Refutable by: Noise Complaint, Alarm Log
  ```
* Counters marked "SPENT" when refuted (strikethrough)

**B2 — Committed Story Timeline**
* Header: "Your Story:"
* Visual timeline of submitted evidence:
  ```
  1:00am     2:00     2:05  2:10     2:15
    |         |        |     |        |
              [===SMART WATCH (AWAKE)===]
                   [FACE ID]
                   [VOICE LOG]
  ```
* Each entry shows: card name, time range, claims (location, state)
* Tap entry → card details

### Region C — Bottom Panel (~40%)

**C1 — Hand Area**
* 6 evidence cards (dealt, not drafted)
* Horizontal scroll if needed
* Selected cards elevate and highlight

**C2 — Card Display (each card)**
* Minimal mode:
  ```
  ┌─────────────────────┐
  │  ⭐⭐⭐              │  ← Relative strength
  │  FACE ID            │
  │  📍 Kitchen  👁️ Awake│  ← Claims as icons
  │  "Proves you're you"│  ← Natural language
  └─────────────────────┘
  ```
* Full Stats mode:
  ```
  ┌─────────────────────┐
  │  Power: 12          │
  │  FACE ID            │
  │  IDENTITY • KITCHEN │
  │  2:05-2:10am AWAKE  │
  │  Triggers: Camera   │
  └─────────────────────┘
  ```

**C3 — Selection Preview** (appears when cards selected)
* Concerns this addresses
* Counter that will trigger (if any)
* Corroboration indicator (if cards share claims)
* Contradiction warning (MINOR/MAJOR)
* Projected damage

**C4 — Action Buttons**
* Primary: **SUBMIT** (big button)
* Secondary: **WHY?** (explain last turn)
* Tertiary: Settings icon (quick toggle)

### Interaction model

* **Tap card:** Select (highlight, elevate)
* **Tap selected card:** Deselect
* **Select up to 3 cards:** Multi-card submission allowed
* **Long-press card:** Show full details sheet
* **Press SUBMIT:** Execute turn, resolve mechanics
* **Long-press KOA avatar:** Quick toggle Minimal/Full Stats

---

## S03a — Contradiction Warning Modal

**Goal:** Warn player before problematic submission.

### MINOR Contradiction (yellow)

```
┌─────────────────────────────────────┐
│  ⚠️ SUSPICIOUS                       │
│                                      │
│  Sleep Tracker claims ASLEEP @ 2:00am│
│  Your story has AWAKE @ 2:08am       │
│  (from Smart Watch)                  │
│                                      │
│  This is possible but suspicious.    │
│  +1 Scrutiny                         │
│                                      │
│  [DESELECT]     [SUBMIT ANYWAY]      │
└─────────────────────────────────────┘
```

### MAJOR Contradiction (red)

```
┌─────────────────────────────────────┐
│  ⛔ IMPOSSIBLE                       │
│                                      │
│  Gym Wristband claims GYM @ 2:00am   │
│  Your story has KITCHEN @ 2:05am    │
│  (from Face ID)                      │
│                                      │
│  You can't be in two places at once. │
│                                      │
│  [DESELECT]     [BLOCKED]            │
└─────────────────────────────────────┘
```

---

## S03b — Corroboration Indicator

**Goal:** Show when cards share claims for bonus damage.

When 2+ selected cards share a claim:

```
┌─────────────┐         ┌─────────────┐
│  Face ID    │─────────│  Voice Log  │
│  🏠 KITCHEN │  MATCH  │  🏠 KITCHEN │
│  👁️ AWAKE   │─────────│  👁️ AWAKE   │
└─────────────┘         └─────────────┘
        ✨ Stories Align: +25% damage
```

Visual options:
- Glowing line connecting matching claim icons
- Shared claims pulse/highlight
- "Stories align" badge appears

---

## S03c — Resolution Feedback

**Goal:** Instant mechanical feedback, delayed voice.

**On SUBMIT (T=0ms):**
* Cards animate into "Your Story"
* Resistance bar animates down
* Concern chips update (check marks appear)
* Floating text: "Resistance -12" or "Contested: -6"
* If counter triggered: Counter card animates in

**KOA Response (T=500-1500ms):**
* Pre-generated dialogue for this card combination
* KOA mood state updates
* Example: "Your face. At the door. At 2:07am. My camera saw no one."

**Refutation success:**
* Counter marked "SPENT" with strikethrough
* Damage restored indicator: "+6 restored"
* KOA (grudging): "...Fine. I'll allow it."

---

## S03d — KOA Mood States

KOA's avatar communicates game state:

| State | Visual | Trigger |
|-------|--------|---------|
| NEUTRAL | Default orb | Game start |
| CURIOUS | Eye track, lean | Selecting cards |
| SUSPICIOUS | Orange glow, narrowed | MINOR contradiction |
| BLOCKED | Red pulse, shake | MAJOR contradiction |
| GRUDGING | Eye roll, deflation | Counter refuted |
| IMPRESSED | Subtle surprise | Clean submission |
| RESIGNED | Pitying, dim | Player struggling |
| SMUG | Knowing look | Player lost |

---

## S04 — Win Screen

**Goal:** Celebrate victory, shareable result.

Components:

* **"ACCESS GRANTED"** animation (unlock visual)
* KOA defeat line: "Your story is... consistent. Annoyingly so."
* Concerns: All checked ✓
* Resistance bar: Depleted → 0

**Stats:**
* Turns used: 4/6
* Damage dealt: 52
* Contradictions: 0 (Perfect!)
* Counters refuted: 2/2
* Scrutiny: 0/5

**Share card:**
```
HOME SMART HOME — Daily #42
🧊 SMART FRIDGE

[You're you ✓] [Awake ✓] [Meant it ✓]

Resistance: ████████░░ → ░░░░░░░░░░
Scrutiny: ⚪⚪⚪⚪⚪ (0/5)
Turns: 4/6

ACCESS GRANTED ✅
```

**CTAs:**
* **Share** (copy/image)
* **Play Again** (practice)
* **Home**

---

## S05 — Lose Screen

**Goal:** Explain failure, encourage retry.

### Loss: Turns Exhausted

* **"ACCESS DENIED"**
* KOA: "Time's up. Your story had gaps."
* Remaining resistance shown
* Unaddressed concerns highlighted

### Loss: Scrutiny 5

* **"SCRUTINY OVERLOAD"**
* KOA: "Your story fell apart under scrutiny. Too many inconsistencies."
* Scrutiny meter: 🔴🔴🔴🔴🔴

**What went wrong:**
* Key contradictions that cost scrutiny
* Suggested alternative approach (non-authoritative)

**CTAs:**
* **Try Again** (immediate restart)
* **Home**

---

## S06 — Codex

**Goal:** Depth retention; teach without tutorial walls.

Tabs:

* **Concerns** — 5 standard concerns with proof requirements
* **Counters** — Counter types encountered with refutation hints
* **Evidence** — Card archetypes with claim patterns
* **Strategies** — Discovered winning approaches

Each entry:

* Plain-language description
* Example from a past puzzle
* "What beats this" hints (unlocks as discovered)

---

## S07 — Settings

**Display Toggles:**
* **Minimal UI** (default) — Stars, bars, mood
* **Full Stats** — Numbers, percentages, formulas

**Counter Visibility:**
* **FULL** (default) — See all counters from start
* **HIDDEN** — Counters revealed when triggered

**Voice & Sound:**
* KOA voice pack selection
* Sound effects on/off
* Haptics on/off

**Account:**
* Offline cache status
* Data/telemetry opt-in

---

## 3) Onboarding (KOA teaches)

### 3.1 Day 1 Tutorial

No text walls. KOA guides through dialogue.

**Turn 1:** "Submit evidence to reduce my resistance."
* Player selects any card, submits
* KOA: "That got through. But I have concerns..."

**Turn 2:** "I challenge your evidence."
* KOA plays counter
* KOA: "My camera says no one was there."
* Player sees 50% penalty applied

**Turn 3:** "Explain my objections away."
* Player finds refutation card
* KOA: "...The camera was updating. Fine."

**Turns 4-6:** Normal play to victory

### 3.2 Tutorial Week (per D31)

| Day | Mechanics | Focus |
|-----|-----------|-------|
| 1 | Submit → win | Core loop |
| 2 | + MAJOR contradictions | Read claims |
| 3 | + KOA counter (1) | Challenge/response |
| 4 | + Refutation | Nullify counters |
| 5 | + Corroboration | Claim synergies |
| 6 | + MINOR + scrutiny | Full system |
| 7 | Full puzzle | Ready |

---

## 4) Accessibility & ergonomics

* All core actions reachable in bottom 50% of screen
* Minimum 44px tap targets
* No drag-and-drop required
* Long-press for detailed info
* Motion reduction toggle
* Color-blind friendly: don't rely only on red/green
  - MINOR: yellow + ⚠️ icon
  - MAJOR: red + ⛔ icon + shake animation

---

## 5) UX acceptance criteria (v1)

1. Player can complete a daily puzzle without typing anything.
2. Player always understands:
   * what concerns remain
   * what counters threaten
   * what happened (WHY panel)
3. No gameplay action waits on network.
4. KOA lines never contain courtroom jargon (validated via D15).
5. A puzzle can be played fully offline after caching.
6. No draft screen — 6 cards dealt immediately.
7. Contradiction warnings appear BEFORE submission.
8. Corroboration bonus shows visual connection between cards.
9. KOA mood states (8) visible and intuitive.
10. Display mode toggle accessible mid-game.
