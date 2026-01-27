# D06 — CORE GAME LOOP UX (Screens + State Machine) v2

**Status:** Draft v2.0
**Owner:** Product / Client
**Last Updated:** 2026-01-26
**Purpose:** Define the player-facing loop and the client state machine for Home Smart Home. This doc ensures the UX matches the deterministic core (D31 Adversarial Testimony design): instant mechanical feedback, non-blocking voice, offline-first operation, and a clear "outsmart / jailbreak the home AI" fantasy (not courtroom roleplay).

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics.

---

## 1) North-star experience (what the player feels)

* **Fantasy:** "My home AI is overconfident. I'm going to build an airtight story with evidence while KOA cross-examines every claim."
* **Session length:** Daily puzzle ~5–10 minutes.
* **Texture:** Fast, tactile "tap-to-select" evidence moves + satisfying system feedback (resistance bar, concern chips, KOA mood).
* **LLM role:** Pre-generates puzzle content (evidence, counters, dialogue). Gameplay never waits on network.

---

## 2) Primary screens (v1)

1. **Home / Daily Hub**
2. **Run Setup (Daily Brief)**
3. **Run (Jailbreak Console)** — main play surface
4. **Results / Share (Run Recap)**
5. **Collection (Artifacts, Tools, Glossary)** (optional v1)

**Removed from Daily mode (per D31):**
- Draft screen (players are dealt 6 cards)
- Inter-Act Upgrade/Shop (Freeplay-only)
- Audit interstitial (scrutiny 5 = instant loss)

---

## 3) Home / Daily Hub

### 3.1 Components

* **Daily Tile:** "Today's Lock" (date, device, difficulty, streak)
* **Start Button:** "Play Daily"
* **Offline indicator:** shows whether today's puzzle is cached
* **Secondary:** Practice, Settings, Codex

### 3.2 Daily binding UX

When online:
* fetch manifest + today's DailySpec
* pre-cache puzzle (6 cards, counters, all 41 testimony combinations)

When offline:
* if cached DailySpec exists: play it
* else: offer Practice mode (local tutorial puzzles)

---

## 4) Run Setup (Daily Brief)

### 4.1 Purpose

A 5–10 second "briefing" that shows today's puzzle parameters.

### 4.2 Layout

* Top: KOA status orb (NEUTRAL state) + device being locked
* KOA's opening monologue: "It's 2am. You're at your fridge. Again..."
* Concerns panel: KOA's questions ("Prove you're you. Prove you're awake. Prove you meant to do this.")
* Counter preview (FULL mode): "KOA will challenge: Security Camera, Sleep Data"
* Difficulty indicator: Resistance value, Turn budget
* "Start" button

### 4.3 Copy rules (de-Ace Attorney)

Avoid: "trial," "verdict," "objection," "guilty," "testimony" (in UI).
Use: "prove," "concern," "challenge," "evidence," "story," "disputed," "suspicious."

---

## 5) Run screen — "Jailbreak Console"

This is the main play surface. **No draft phase** — player is dealt 6 cards immediately.

### 5.1 Layout (mobile portrait)

**Zone A (Top ~30%) — KOA + Concerns + Resistance**

* KOA avatar: Shows one of 8 mood states (see §5.6)
* KOA's voice: Current dialogue or concern statement
* Concern chips (3-4): e.g., **[You're you ✓] [Awake ○] [Meant it ○]**
* Resistance bar: Visual progress (Minimal mode) or number (Full Stats mode)
* Turn counter: "Turn {n} / {total}"

**Zone B (Middle ~30%) — Counter-Evidence + Committed Story**

* Counter panel (FULL mode): "KOA will challenge:" with visible counters
  - Each counter shows: name, what it targets, refutableBy hint
  - Counters marked "spent" when refuted
* Committed Story timeline: "Your Story:" with submitted evidence
  - Shows time ranges, locations, states claimed
  - Visual timeline representation (optional)

**Zone C (Bottom ~40%) — Hand + Selection**

* Hand: 6 evidence cards (dealt, no draft)
* Selected cards highlight (1-3 card selection)
* Preview panel (appears on selection):
  - Concerns this addresses
  - Counter that will trigger (if any)
  - Contradiction warning (MINOR/MAJOR)
  - Corroboration indicator (if cards share claims)
  - Projected damage
* Buttons:
  - "SUBMIT" (primary action)
  - "WHY?" (explain panel)
  - Settings icon (toggle Minimal/Full Stats)

### 5.2 Input interaction (tap-to-select)

* Tap card → selected (highlight, moves slightly up)
* Tap selected card → deselected
* Select up to 3 cards per submission
* Long-press card → show full card details (stats, claims, time range)
* Press SUBMIT → submits cards and resolves mechanics (MOVE_RESOLVED)

### 5.3 Instant mechanics, delayed voice (latency mask)

**T=0ms:** On SUBMIT:
* animation: "evidence submitted"
* resistance bar updates instantly
* concern chips update (check marks)
* scrutiny indicator updates
* floating text: "Resistance -12" or "Contested: -6"

**T=~500–1500ms:** KOA's contextual response:
* Pre-generated dialogue for this card combination
* Mood state updates based on outcome

**Rule:** The run never waits for a network call. All dialogue is pre-generated.

### 5.4 Counter-Evidence flow

When player submits evidence that triggers a counter:

1. **Preview (before SUBMIT):** "KOA will challenge: Security Camera"
2. **On SUBMIT:** KOA's counter-evidence animates in
3. **KOA speaks:** "My front door camera saw no one at 2:07am..."
4. **Damage applied:** 50% penalty per contested card
5. **Counter marked active:** Shows "Contesting IDENTITY"

When player refutes a counter (submits refutation card):

1. **On SUBMIT:** Refutation card animates
2. **Counter nullified:** Visual "spent" indicator
3. **KOA speaks (grudging):** "...The camera was updating. Fine."
4. **Damage restored:** Missing 50% from previous evidence restored retroactively

### 5.5 Contradiction warnings (pre-submission)

**MINOR contradiction warning (yellow):**
```
⚠️ SUSPICIOUS
Sleep Tracker claims ASLEEP @ 2:00am
Your story has AWAKE @ 2:08am (Smart Watch)
This is possible but KOA will note it. (+1 scrutiny)

[DESELECT]  [SUBMIT ANYWAY]
```

**MAJOR contradiction warning (red):**
```
⛔ IMPOSSIBLE
Gym Wristband claims GYM @ 2:00am
Your story has KITCHEN @ 2:05am (Face ID)
You can't be in two places at once.

[DESELECT]  [SUBMIT BLOCKED]
```

### 5.6 KOA Mood States (visual feedback)

| State | When | Visual |
|-------|------|--------|
| NEUTRAL | Game start | Default orb |
| CURIOUS | Player selecting | Eye track, lean |
| SUSPICIOUS | MINOR contradiction | Orange glow, narrowed eyes |
| BLOCKED | MAJOR contradiction | Red pulse, shake |
| GRUDGING | Counter refuted | Eye roll, deflation |
| IMPRESSED | Clean submission | Subtle surprise |
| RESIGNED | Player struggling | Pitying look, dim |
| SMUG | Player lost | Knowing look |

### 5.7 Corroboration visual feedback

When 2+ selected cards share a claim (triggering +25% bonus):
```
┌─────────────┐         ┌─────────────┐
│  Face ID    │─────────│  Voice Log  │
│  🏠 KITCHEN │  MATCH  │  🏠 KITCHEN │
│  👁️ AWAKE   │─────────│  👁️ AWAKE   │
└─────────────┘         └─────────────┘
      ✨ Stories Align: +25% damage
```

### 5.8 "Why it worked" explainability panel

Tap the resolved submission or WHY? button:

* **Concerns addressed:** IDENTITY ✓, INTENT ✓
* **Damage dealt:** 17 (base 12 + corroboration bonus)
* **Counter status:** "Security Camera: CONTESTED (50%)" or "REFUTED"
* **Your Story updated:** Shows new committed evidence on timeline
* **Scrutiny:** 2/5 (if MINOR contradictions)

This panel is derived from MOVE_RESOLVED; no LLM needed.

---

## 6) Phase/state machine (client)

### 6.1 High-level states

* `S0_HOME`
* `S1_DAILY_BRIEF`
* `S2_RUN` — main play
* `S3_RESULTS`

**Removed states (per D31):**
- `S_DRAFT` — no draft in Daily
- `S_UPGRADE` — Freeplay only
- `S_AUDIT` — scrutiny 5 = instant loss

### 6.2 Run sub-states

Within `S2_RUN`:

* `PHASE_TURN_START` — reset selection, show turn indicator
* `PHASE_PLAYER_INPUT` — selecting 1-3 cards, previewing
* `PHASE_PREVIEW` — show projected outcome, contradiction warnings
* `PHASE_RESOLVE` (instant; local) — apply mechanics
* `PHASE_RENDER_RESPONSE` — KOA's dialogue, mood update
* `PHASE_TURN_END` — check win/lose conditions
* `PHASE_WIN` — resistance ≤ 0 AND all concerns addressed
* `PHASE_LOSE_TURNS` — turns exhausted
* `PHASE_LOSE_SCRUTINY` — scrutiny = 5

### 6.3 Transitions

* Home → Brief → Run
* Run win → Results
* Run lose (turns or scrutiny) → Results

All transitions are driven by authoritative events:
* `PUZZLE_LOADED`
* `CARDS_DEALT`
* `MOVE_RESOLVED`
* `COUNTER_EVIDENCE_PLAYED`
* `COUNTER_EVIDENCE_REFUTED`
* `CONTRADICTION_DETECTED`
* `CONCERN_ADDRESSED`
* `CORROBORATION_TRIGGERED`
* `RUN_ENDED`

---

## 7) Results / Share

### 7.1 Results content

**Win: "ACCESS GRANTED"**
* KOA's defeat line: "Your story is... consistent. Annoyingly so."
* Resistance bar: depleted animation
* Concerns: all checked

**Lose: "ACCESS DENIED"**
* KOA's victory line (varies by loss type):
  - Turns exhausted: "Time's up. Your story had gaps."
  - Scrutiny 5: "Your story fell apart under scrutiny."

**Run stats:**
* Turns used / budget
* Total damage dealt
* Contradictions triggered (0 = perfect)
* Counters refuted
* Scrutiny accumulated

**KOA's memorable moments:**
* 2-3 best dialogue lines from the run
* Specific callbacks to player's plays

### 7.2 Share format

Wordle-style share but not a clone:

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

## 8) Onboarding (learn-by-doing)

### 8.1 Day 1 Tutorial (KOA teaches)

No text tutorial walls. KOA teaches through dialogue.

**Turn 1:** "Submit evidence to reduce my resistance."
* Player submits any card
* KOA: "That got through. But I have concerns..."

**Turn 2:** "I have challenges."
* KOA plays counter-evidence
* KOA: "My camera says no one was there. Convince me."

**Turn 3:** "Explain my objections away."
* Player plays refutation
* KOA: "...Fine. I'll allow it."

**Turn 4-6:** Normal play

### 8.2 Difficulty progression (Tutorial week per D31)

| Day | Mechanics | Complexity |
|-----|-----------|------------|
| 1 | Submit → reduce resistance → win | Core loop |
| 2 | + Contradictions (MAJOR only) | Read claims |
| 3 | + KOA counter (just 1) | Attack/defense |
| 4 | + Refutation | Nullify counters |
| 5 | + Corroboration | Synergies |
| 6 | + MINOR contradictions + scrutiny | Full system |
| 7 | Full puzzle | Ready for rotation |

---

## 9) Display modes (Progressive Disclosure)

### 9.1 Minimal Mode (default)

* Card power: ⭐⭐⭐ stars instead of numbers
* Resistance: bar only, no number
* Scrutiny: KOA's mood only
* Damage: "That got through" vs numbers

### 9.2 Full Stats Mode (toggle)

* Card power: exact numbers
* Resistance: bar + number (35/50)
* Scrutiny: 2/5 meter
* Damage: floating numbers, formula visible

### 9.3 Toggle access

* Settings icon always visible on run screen
* Long-press KOA avatar = quick toggle
* Changes apply immediately (no restart)
* Preference persists across sessions

---

## 10) Counter visibility modes

### 10.1 FULL mode (default)

* All counters visible from turn 1
* Shows: name, targets, claim, refutableBy
* Strategic, chess-like planning

### 10.2 HIDDEN mode (toggle)

* Counters invisible until triggered
* Surprise element, memory challenge
* Toggle in Settings (applies next puzzle)

---

## 11) Accessibility and device constraints

* One-hand use: all primary taps in bottom half
* Minimum 44px tap targets
* No dragging required
* Long-press for detailed card info
* Offline: all puzzle content pre-generated, voice barks from packs

---

## 12) Acceptance criteria (v1)

1. Core loop is playable start-to-finish offline after caching puzzle.
2. Mechanical feedback is always instant; voice never blocks resolution.
3. Player can understand outcomes via "WHY?" panel without reading external docs.
4. UX vocabulary supports "jailbreak/outsmart" fantasy, not courtroom cosplay.
5. Session fits 5–10 minutes for Daily puzzle.
6. No draft screen — player is dealt 6 cards immediately.
7. Contradiction warnings appear BEFORE submission (MINOR yellow, MAJOR red).
8. Corroboration bonus has clear visual feedback when triggered.
9. KOA mood states (8) provide intuitive scrutiny/state feedback.
10. SCAN/Reserve/Audit terminology absent from Daily mode.
