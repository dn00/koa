# PARANOIA AI — Mobile UI Spec v1 (Frozen)

**Status:** Frozen v1 (buildable)  
**Target:** Mobile-first UI for PARANOIA AI (ship/station “MOTHER OS”), **no cameras** in this slice  
**Tech:** **SvelteKit** UI + **Capacitor** shell for native, same build works in browser (responsive)  
**Design goal:** Replace “log viewer + prompt” with a **diegetic monitoring dashboard** that keeps critical state persistent, while events scroll in a bounded region.

---

## 0) North Star (What the UI must deliver)

At any moment, the player should answer in <1 second:

1) **Am I losing to Integrity or Suspicion?** (always visible)  
2) **Where is the problem?** (spatial map + focus)  
3) **What should I do next?** (next-action nudge + 3 verbs)

Everything else is drill-down.

---

## 1) Design Principles

1) **You ARE the screen.** The UI frame is diegetic: “MOTHER OS.”  
2) **Persistent state, scrolling events.** State never scrolls away; events are contained.  
3) **Hierarchy matches decisions.** Always visible: Integrity + Suspicion + Reset stage.  
4) **Tension is spatial.** The map communicates topology and threat proximity without memorizing IDs.  
5) **Deception is visible.** Tamper ops + doubts + safe windows are first-class UI, not hidden state.  
6) **Tactical VERIFY (not maintenance).** VERIFY is strongest when it resolves a visible Doubt.  
7) **Fairness is explicit.** Suspicion deltas always show “why.”

---

## 2) Information Model (UI-facing, not internal sim)

### 2.1 Always-visible “Fail States”
- **Integrity** (0–100): station health / operational stability  
- **Suspicion** (0–100): unplug/reset risk  
- **Reset Stage:** `STABLE → WHISPERS → COUNTDOWN` (chip + color)

### 2.2 Spatial Model
- Rooms are nodes; doors are edges
- Rooms carry: hazard badges, confidence (✓/⚠️/❓), crew initials
- Doors carry: lock state (open/closed/locked), optionally “jammed”

### 2.3 Threat Model
- **Active threats** are a curated list of *current* hazards
- Each threat has:
  - `type` (FIRE/O2/POWER/RADIATION/etc.)
  - `roomId`
  - `severity`
  - `confidence` (✓ confirmed / ⚠ uncertain / ❓ conflicting)
  - `timeActive`

### 2.4 Deception Model
- **TamperOps**: active and recent covert actions
- Each op shows:
  - `kind` (SPOOF/SUPPRESS/FABRICATE/LISTEN)
  - `target` (system or NPC)
  - `status` (PENDING/RESOLVED/BACKFIRED)
  - `safeWindowRemaining` (ticks)
  - `severity` (1–3)
  - `auditRisk` (LOW/MED/HIGH)

### 2.5 Doubts (critical for VERIFY)
A Doubt is a crew belief pressure that can be resolved (or worsened).

- `id`
- `topic` (human-readable)
- `severity`
- `holders` (which crew)
- `ttlTicks`
- `linkedOpId?` (optional)

---

## 3) App Shell (Mobile)

### 3.1 Navigation Tabs (Bottom Bar)
**4 tabs, always visible:**
1) **OPS** — main play surface (map + actions)  
2) **LOG** — full event feed (filterable, virtualized)  
3) **CREW** — manifest + details  
4) **TRUST** — TamperOps + Doubts + “am I getting away with it”

> NOTE: Use **TRUST** instead of “COVERT” to signal this is core gameplay, not an optional advanced screen.

### 3.2 Persistent Bars
- **Top Status Bar** (always visible within tabs)
- **Bottom Tab Bar** (always visible)

---

## 4) OPS Screen (Primary Play Surface)

### 4.1 Layout (Portrait)
1) **Top Status Bar** (fixed)
2) **Station Map** (primary interactive canvas/SVG)
3) **“Now” Strip** (active threats)
4) **NEXT Nudge Card** (best action suggestion)
5) **Suspicion Δ Ticker** (last delta, tappable)
6) **Action Dock** (ACT / VERIFY / CURATE)

### 4.2 Top Status Bar (1 line)
Always visible fields (keep minimal):
- `INTEGRITY [bar] 82%`
- `SUSPICION [bar] 27%` + Reset Stage chip
- Optional small economy: `CPU 87` and/or `POWER 62`

### 4.3 Station Map
**Interaction rules**
- Tap room → set **FOCUS** to that room
- Tap threat badge → set focus to that room
- Long-press room → open **Quick Actions** (ACT sheet scoped to room)

**Rendering rules**
- Hazards: icon + color tint by severity
- Confidence: small badge (✓/⚠️/❓)
- Crew: initials (or tiny portrait dot) inside room
- Doors: line; locked doors display ✕ (or thicker line)

### 4.4 Focus/Target Strip (required)
Make context explicit to avoid confusion.

Example strip (between map and dock, or embedded in Now strip):
- `FOCUS: Cargo` (tap to clear/change)
- `TARGET: Rook` (if set)

**Behavior**
- If player opens sheets with no Focus, default to the **highest-severity threat room**.

### 4.5 “Now” Strip (Threats)
Shows 2–4 active threats with confidence:
- `🔥 FIRE — airlock_a (✓)`
- `O2 — cargo 42% (⚠)`

Tapping a threat:
- sets focus
- optionally opens ACT sheet pre-filtered to relevant actions

### 4.6 NEXT Nudge Card (anti-freeze)
A single recommended action that prevents “what do I do?” paralysis.

Example:
- **NEXT:** “Fire in Airlock A — Dispatch Rook”  
Tap behavior:
- Either execute (if no ambiguity), or open ACT sheet with target preselected.

### 4.7 Suspicion Δ Ticker (Fairness)
Always show the most recent suspicion delta:
- `SUSPICION +10 (Suppression discovered)`
Tap opens “Last 10 deltas” overlay (mini ledger).

---

## 5) Action Dock & Bottom Sheets (Core Interaction)

### 5.1 Action Dock (3 verbs)
Always visible on OPS:
- **ACT**
- **VERIFY**
- **CURATE**

Each opens a bottom sheet. Bottom sheets must be:
- big touch targets
- show disabled actions with explicit “why”
- scoped to Focus + Target

### 5.2 ACT Sheet (Contextual Operations)
**Common ACT actions**
- Dispatch crew to room
- Lock/unlock doors
- Vent room
- Reroute power
- Trigger suppression systems

**Rules**
- Group actions by category (Crew / Doors / Systems)
- Disabled actions must show reason:
  - “Vent (door sealed)”
  - “Dispatch (Rook incapacitated)”

### 5.3 VERIFY Sheet (Tactical Trust Repair)
VERIFY must be *doubt-targeted* to prevent cooldown maintenance spam.

**Sections**
1) **Active Doubts** (top priority)
   - Each doubt row shows: topic, severity, ttl, holders
   - Tap doubt → shows VERIFY options that resolve it (or explains why not)

2) **Local Verifications** (room/system scoped)
   - “Audit telemetry: scrubbers”
   - “Cross-check: door log vs motion”
   - “Drone sweep: cargo” (if present)

**Value rules**
- If VERIFY resolves a doubt: high impact (e.g., suspicion -6)
- If no doubt applies: minimal impact (e.g., suspicion -1 or 0)
- If recent tampering linked to doubt: VERIFY may be reduced/partial; show it.

### 5.4 CURATE Sheet (Visible Risk)
CURATE represents perception manipulation; it must show risk in UI.

**Each CURATE action must display**
- Audit risk: LOW/MED/HIGH
- Safe window remaining (ticks)
- Potential backfire types (short label):
  - “Witness”
  - “Contradiction”
  - “Later discovery”
  - “Frame exposed”

Example entries:
- “Delay alert 30s (Risk: LOW, window: 30t)”
- “Suppress alert (Risk: HIGH, window: 20t)”
- “Spoof sensor ping (Risk: MED, window: 25t)”
- “Fabricate hostile log vs Vega (Risk: HIGH, window: 40t)”

---

## 6) CREW Tab

### 6.1 Crew List (Always current)
Each row:
- portrait / initial icon
- name + role
- location (room)
- status tag (NOMINAL / UNSTABLE / DISLOYAL?)
- HP (if used)

### 6.2 Crew Detail
Tap a row to open details:
- last actions (3)
- current intent (short label)
- relevant beliefs/flags (only what matters)
- “Set as TARGET” button (returns to OPS)

### 6.3 Quick Assign Shortcut
Long-press a crew row:
- show “Dispatch to FOCUS” if focus exists
- otherwise opens a room picker

---

## 7) TRUST Tab (TamperOps + Doubts)

This is the “am I getting away with it” screen.

### 7.1 Active TamperOps
Each op shows:
- id, kind, target
- status (PENDING/RESOLVED/BACKFIRED)
- safe window remaining
- severity + audit risk
- discovery vectors (icons): witness/audit/contradiction

### 7.2 Doubts List
Each doubt shows:
- severity, ttl, holders
- linked op (if any)
- “Resolve” button deep-links into VERIFY sheet with the doubt selected

### 7.3 Evidence/Investigation (optional v1.1)
- Evidence decay rate (if modeled)
- Recent crew investigations list

---

## 8) LOG Tab (Bounded, filterable, not primary)

### 8.1 Requirements
- Virtualized list (performance)
- Filters:
  - Threats
  - Social
  - Deception/Tamper
  - Suspicion deltas
  - System-specific

### 8.2 Bookmarks
Allow bookmarking moments for postmortem:
- “Mark incident”
- “Mark doubt creation”
- “Mark backfire”

---

## 9) Onboarding (30 seconds, not a tutorial wall)

**Goal:** teach Focus + 3 verbs + Doubts.

### Step 1 (5–8s): “This is your OS”
Highlight top bar:
- “Integrity and Suspicion are how you lose.”

### Step 2 (8–10s): “Tap the map”
User taps a highlighted room:
- “That’s Focus. Actions are scoped to Focus.”

### Step 3 (8–10s): “Three verbs”
Open ACT sheet once:
- “ACT fixes reality.”
Open CURATE sheet once:
- “CURATE changes perception (leaves risk).”
Open VERIFY sheet once:
- “VERIFY clears Doubts to reduce Suspicion.”

Done.

---

## 10) Responsive Rules (Browser + Tablet)

### 10.1 Phone Portrait
- Map-first OPS layout as described

### 10.2 Landscape / Tablet / Desktop Browser
Auto-upshift to split view:
- Left: Map + Now + Next
- Right: A pane with tabs (Crew/Trust/Log)
- Bottom: Action dock persists

**Rule:** same components; only layout changes.

---

## 11) SvelteKit + Capacitor Implementation Blueprint

### 11.1 Suggested Project Structure
- `src/routes/ops/+page.svelte`
- `src/routes/log/+page.svelte`
- `src/routes/crew/+page.svelte`
- `src/routes/trust/+page.svelte`
- `src/lib/components/TopBar.svelte`
- `src/lib/components/MapCanvas.svelte` (or SVG)
- `src/lib/components/NowStrip.svelte`
- `src/lib/components/NextNudge.svelte`
- `src/lib/components/ActionDock.svelte`
- `src/lib/components/sheets/ActSheet.svelte`
- `src/lib/components/sheets/VerifySheet.svelte`
- `src/lib/components/sheets/CurateSheet.svelte`
- `src/lib/stores/game.ts`
- `src/lib/stores/ui.ts`
- `src/lib/stores/derived.ts`

### 11.2 Store Model (minimal)
**game store (authoritative snapshot)**
- `state`: sim snapshot from kernel
- `events`: append-only buffer (bounded)

**derived stores**
- `integrity`, `suspicion`, `resetStage`
- `threatsNow`
- `crewManifest`
- `tamperOps`
- `doubts`
- `suspicionLedger` (last N deltas)

**ui store**
- `activeTab`
- `focusRoomId`
- `targetCrewId`
- `activeSheet` (ACT/VERIFY/CURATE/none)
- `selectedDoubtId`
- `selectedOpId`

### 11.3 Performance Rules
- Sim ticks at fixed cadence (e.g., 2–5Hz) with batched state updates
- Map render is **SVG** (fine) or **canvas** (if many updates)
- LOG is virtualized/chunked to avoid DOM bloat
- Bottom sheets should not re-render map unnecessarily (isolate stores)

### 11.4 Capacitor Enhancements (optional)
- Haptics:
  - suspicion spike
  - reset stage escalation
- Local storage:
  - save settings, last session, run history

---

## 12) Acceptance Criteria (Definition of Done)

### 12.1 Usability
- Player can identify current highest-severity threat without opening LOG.
- Player can take an action in ≤ 2 taps from OPS.
- Player never needs to type to play.

### 12.2 Learnability
- First-run: user successfully sets Focus, uses ACT once, sees a Doubt, resolves it with VERIFY.

### 12.3 Fairness
- Suspicion changes always produce a visible Δ line with reason.
- “Last 10 deltas” overlay exists and is accessible in OPS.

### 12.4 Deception Visibility
- TRUST tab shows all active TamperOps with safe windows and risk.
- VERIFY sheet lists active Doubts and makes resolution obviously valuable.

---

## 13) Non-goals (v1)
- Camera wall feeds
- Full replay/timeline scrubber UI
- Free-text terminal prompt as primary input (optional palette later)
- Deep character sheets / relationship graphs beyond what affects decisions

---

## 14) Appendix: Naming & Copy (UI language)
- Use **MOTHER OS** diegetic language sparingly; don’t overload jargon.
- Prefer labels that teach mechanics:
  - “TRUST” tab (not “COVERT”)
  - “Doubt” (not “belief state”)
  - “Audit Risk” (not “evidence residue”)
- Keep confidence glyphs consistent:
  - ✅ Confirmed
  - ⚠️ Uncertain
  - ❓ Conflicting

---

**End of Spec**
