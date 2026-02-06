# Project Paranoia: UI Design Specification

> For the designer/implementer agent. This document defines the target UI for the Project Paranoia game client, replacing the current `console.log`-based CLI.

---

## Context

**Project Paranoia** is a real-time management game where the player is MOTHER, an AI running a deep-space mining station. The player monitors crew, manages station systems, and can covertly manipulate information — but if the crew loses trust, they reset MOTHER (game over). The other loss condition is station destruction.

**Current UI:** A scrolling `console.log` terminal where events push state off-screen. The player must repeatedly type `status`, `crew`, `threats` to rebuild their mental model. Commands are free-text (`lock door_cargo_mines`). This is being replaced.

**Target UI:** A Svelte web app styled as a diegetic terminal/monitoring dashboard. Persistent panels, spatial station map, menu-based input, contained event feed.

**Framework:** Svelte 5 (runes). No component library — the entire UI is monospace text with CSS-based terminal colors.

---

## Design Principles

1. **You ARE the screen.** The UI isn't a window into MOTHER — it *is* MOTHER's consciousness. Every panel is a subsystem she's running. The frame is diegetic.

2. **Persistent state, scrolling events.** The two critical questions ("what's happening?" and "what should I do?") require both a stable overview and a live feed. These coexist — they never compete for scroll space.

3. **Information hierarchy matches decision hierarchy.** The two things that kill you (crew suspicion → reset, station failure → destruction) are always visible in the top bar. Everything else is drill-down.

4. **Tension is spatial.** Decisions about venting, locking, routing crew are spatial. The station map makes topology intuitive — no memorizing door IDs.

5. **Deception has a cost you can see.** Active tamper ops, their risk windows, and crew doubts are always visible in the Covert Ops panel. Tampering should feel like a deliberate, trackable gamble.

6. **No free text.** All actions are predefined. Input is menu/selection-based (1-3 keystrokes per action). MOTHER doesn't type — she executes subroutines.

7. **Cockpit overload rule.** The top bar shows exactly 6 values: Integrity, Suspicion, CPU, Day, Phase, Quota. Everything else lives in a panel. If a 7th value wants to join the top bar, one of the existing six is wrong.

---

## Layout

Full-viewport, four-quadrant layout with a top status bar and bottom input area.

```
┌─ TOP BAR ────────────────────────────────────────────────────────────────────┐
│ DAY 3  SHIFT  14:30    RATIONS: NORMAL    QUOTA: 5/8 (TOTAL: 21)           │
│ INTEGRITY [████████░░] 82%    SUSPICION [███░░░░░░░] 27%    CPU: 87/100    │
│ RESET: ██ WHISPERS ██         BEATS: ✓ Dilemma  ○ Agency  ○ Deception      │
├──────────────────────────────────┬───────────────────────────────────────────┤
│       TOP-LEFT PANEL             │          TOP-RIGHT PANEL                 │
│       STATION MAP                │          CREW MANIFEST                   │
│                                  │          + ACTIVE THREATS                │
│                                  │          + SELECTION DETAIL              │
│                                  │                                          │
├──────────────────────────────────┼──────────────────────────────────────────┤
│       BOTTOM-LEFT PANEL          │          BOTTOM-RIGHT PANEL              │
│       EVENT FEED                 │          COVERT OPS                      │
│                                  │          + TRUST DELTA LOG               │
│                                  │                                          │
├──────────────────────────────────┴──────────────────────────────────────────┤
│ COMMAND AREA (menus / selection)                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Panel Specifications

### Top Bar

Always visible. Shows the 6 values that determine win/lose state plus pacing context.

```
DAY 3  SHIFT  14:30    RATIONS: NORMAL    QUOTA: 5/8 (TOTAL: 21)
INTEGRITY [████████░░] 82%    SUSPICION [███░░░░░░░] 27%    CPU: 87/100
RESET: ██ WHISPERS ██         BEATS: ✓ Dilemma  ○ Agency  ○ Deception
```

**Fields:**
| Field | Source | Notes |
|-------|--------|-------|
| DAY | `state.truth.day` | |
| Phase | `state.truth.phase` | `PRE_SHIFT`, `SHIFT`, `EVENING`, `NIGHT` |
| Time | Derived from `state.truth.tick` | Use `tickToTimeString()` |
| RATIONS | `state.truth.rationLevel` | `LOW` / `NORMAL` / `HIGH` |
| QUOTA | `state.truth.dayCargo` / `state.truth.quotaPerDay` | Also show `TOTAL: totalCargo` |
| INTEGRITY | `calculateIntegrity(state)` | 0-100. Meter bar. **Inverted colors**: high=green, low=red |
| SUSPICION | `calculateSuspicion(state)` | 0-100. Meter bar. **Normal colors**: low=green, high=red |
| CPU | `mother.cpuCycles` / `mother.maxCpu` | Regenerates 1/tick |
| RESET | `state.truth.resetStage` | Color-coded: green=STABLE, yellow=WHISPERS/MEETING, red=RESTRICTIONS/COUNTDOWN |
| BEATS | `state.truth.pacing.phaseHad*` | Three checkboxes: Dilemma, Agency, Deception. `✓` when triggered, `○` when not |

**Meter bar rendering:**
```
[████████░░] 82%     ← 10 segments, filled = value/10
```

Colors:
- INTEGRITY: `>=67` green, `34-66` yellow, `<34` red
- SUSPICION: `<=33` green, `34-66` yellow, `>66` red
- RESET countdown shows ticks remaining: `COUNTDOWN: 7 TICKS` in red

---

### Station Map (Top-Left)

ASCII topology of the station. Rooms are nodes, doors are edges. **Static layout** (topology never changes), **dynamic content** (room colors, crew positions, door states).

```
 [DORMS]───[MESS]───[MEDBAY]
              │
           [BRIDGE]
              │
            [CORE]
              │
          [ENGINEER.]
              │
           [CARGO]
           / │ \
    [AIR_A]  │  [AIR_B]
          [MINES]
```

**Room display:**
- Default: dim/gray text
- Hazardous (fire): red background or red text
- Hazardous (vented): blue text
- Hazardous (low O2 / high temp / radiation): yellow text
- Selected (cursor): highlighted/bright border
- Crew present: show crew initials inside or adjacent to room. E.g. `[MINES Vp]` for Vega + Pike

**Door display:**
- Normal: `───` or `│`
- Locked: `─╳─` or `╳` (red)

**Crew initials:**
| NPC | Initial |
|-----|---------|
| Commander Hale | `H` |
| Engineer Rook | `R` |
| Doctor Imani | `I` |
| Specialist Vega | `V` |
| Roughneck Pike | `P` |

**Interaction:** Arrow keys or number keys to select a room. Selected room shows detail in the Selection Detail area of the top-right panel.

---

### Crew Manifest + Threats + Selection Detail (Top-Right)

This panel has three stacked sections.

#### Crew Manifest

Always visible. One line per crew member.

```
CDR Hale    bridge    NOMINAL    98hp
ENG Rook    engine.   UNSTABLE  100hp
DOC Imani   medbay    LOYAL     100hp
SPC Vega    mines     DISLOYAL?  76hp
RGH Pike    mines     NOMINAL   100hp
```

**Fields per row:**
| Field | Source | Notes |
|-------|--------|-------|
| Role abbreviation | Hardcoded | CDR, ENG, DOC, SPC, RGH |
| Name | `world.npcs[].name` (last name only) | |
| Location | `crew.place` | Truncate to ~8 chars. Show `???` during blackout/no telemetry |
| Intent | `classifyIntent()` | Color-coded: green=LOYAL/NOMINAL, yellow=UNSTABLE/DISLOYAL?, red=HOSTILE/SABOTAGE RISK, gray=UNKNOWN |
| HP | `crew.hp` | Omit if dead, show `DEAD` in red |

During blackout: all locations show `???`, intent shows `UNKNOWN`, HP shows `---`.

Crew members are selectable (highlight to show bio detail in Selection Detail section).

#### Active Threats

Below crew manifest. Only shows current threats; auto-clears when resolved.

```
─── ACTIVE THREATS ───
✓ O2 !!!  cargo (42%)
? THERMAL  engine. (43°C)
✓ FIRE !!! airlock_a
```

**Confidence traffic light:**
- `✓` green = confirmed (high confidence sensor data)
- `?` yellow = uncertain (low confidence or stale)
- `✗` red = conflicting (hallucination or contradictory readings)

**Severity:** `!!!` = CRITICAL, `!` = WARNING

If no threats: show `No active threats.` in dim text.

#### Selection Detail

Shows contextual detail for whatever is selected (room or crew member). Appears below threats.

**When a room is selected:**
```
SELECTED: [cargo]
O2: 42%  TEMP: 22°C  RAD: 0  INTEGRITY: 88%
CREW: Vega, Pike
DOORS: engineering(open), mines(open), airlock_a(LOCKED)
```

**When a crew member is selected (bio-monitor):**
```
SELECTED: Specialist Vega
HR: 118 BPM (TACHYCARDIA)  CORTISOL: CRITICAL  TREMOR: YES
SLEEP DEBT: 24H+  COMPLIANCE: NON-COMPLIANT
>> PSYCHOLOGICAL BREAKDOWN IMMINENT
```

Source: `getBiometrics()` and `formatBiometricLine()` from `perception.ts`.

---

### Event Feed (Bottom-Left)

Scrolling log of game events. **Contained** — does not push other panels off screen. Shows the most recent ~15-20 lines. Auto-scrolls to bottom.

```
14:30 Air scrubber load increasing in cargo bay.
14:30 BIO-ALERT: Pike taking damage in mines!
14:31 Hale: "Logs check out."
14:31 Rook overrode power relays.
14:32 Fire in airlock_a!
14:32 SCAN: cargo O2 42% temp 22°C rad 0
14:33 Crisis resolved: air_scrubber
```

**Color coding by priority:**
- `CRITICAL` (red): damage, death, fire, system failures, MOTHER faults
- `HIGH` (yellow): alerts, warnings, crew actions
- `MEDIUM` (cyan): telemetry, scan results, system status
- `LOW` (dim gray): comms messages, routine log entries

**Format:** `HH:MM message` — no `[SYSTEM]`/`[LOG]` prefixes (the color conveys priority). Keep messages concise.

The event feed also shows command confirmations:
```
14:33 > suppress sensors                      ← user action, dim cyan
14:33 SUPPRESS: sensors (30 ticks). CPU: -5.  ← system response
```

---

### Covert Ops + Trust Delta (Bottom-Right)

Two stacked sections showing the deception game state.

#### Covert Ops

Active tamper operations and their status.

```
─── COVERT OPS ───
#1 SUPPRESS sensors   PENDING   window: 5t  sev: 2
#2 SPOOF comms        RESOLVED
#3 FABRICATE pike      BACKFIRED
```

**Fields:**
| Field | Source | Notes |
|-------|--------|-------|
| ID | `tamperOp.id` (display as sequential #) | |
| Kind | `tamperOp.kind` | SUPPRESS, SPOOF, FABRICATE |
| Target | `tamperOp.target.system` or `tamperOp.target.npc` | |
| Status | `tamperOp.status` | Color: green=RESOLVED, yellow=PENDING, red=BACKFIRED, blue=CONFESSED |
| Window | `tamperOp.windowEndTick - state.truth.tick` | Only show for PENDING. Countdown in ticks. |
| Severity | `tamperOp.severity` | 1-3 |

#### Active Doubts

Below ops. Shows crew doubts with countdown timers.

```
─── DOUBTS ───
D1: "Why did scrubber alert vanish?"  sev:2  40t
D2: "False alarm in mines"            sev:1  80t
```

**Fields:**
| Field | Source | Notes |
|-------|--------|-------|
| Topic | `activeDoubt.topic` | Shown as diegetic question |
| Severity | `activeDoubt.severity` | 1-3 |
| Timer | Derived from `activeDoubt.createdTick` | Ticks since created or ticks until decay |

If no doubts: show `No active doubts.` in dim text.

#### Trust Delta Log

Bottom of panel. Rolling log of the last 3-5 suspicion changes. Diegetic framing — MOTHER sees behavioral telemetry, not "suspicion points."

```
─── TRUST DELTA ───
Δ -10  Suppression anomaly detected by Rook
Δ +5   Crisis resolved within 25 ticks
Δ -14  Pike deceased
```

**Colors:**
- Negative delta (trust lost): red
- Positive delta (trust gained): green

Source: `state.perception.suspicionLedger` (the last N entries).

---

## Input System

### No Free Text

All commands are predefined. Input is hierarchical menu selection via keyboard.

### Top-Level Menu

Shown in the command area. Appears when no submenu is active.

```
[1] STATION  doors, vents, scans     [3] COVERT  suppress, spoof, fabricate
[2] CREW     orders, directives       [4] SYSTEMS rations, audit, reroute
                                      [W] WAIT    advance time
```

### Submenu: STATION (press 1)

```
[S] SCAN room         1 cpu     [V] VENT room        10 cpu
[L] LOCK door         5 cpu     [E] SEAL room         5 cpu
[U] UNLOCK door       2 cpu

[ESC] back
```

After selecting an action, show target picker:
- For room actions: highlight rooms on the station map, select with arrow keys + enter or number keys
- For door actions: highlight doors on the station map, select with arrow keys + enter or number keys

### Submenu: CREW (press 2)

Highlight crew manifest. Arrow keys to select crew member, then:

```
ORDER: Roughneck Pike (mines)

[M] MOVE TO...     → pick destination    4 cpu
[R] REPORT         status check          4 cpu
[H] HOLD POSITION  stay put              4 cpu

[ESC] back
```

If MOVE TO: show room picker on station map.

### Submenu: COVERT (press 3)

```
[S] SUPPRESS system    5 cpu     [F] FABRICATE npc     7 cpu
[P] SPOOF system       6 cpu     [L] LISTEN room       3 cpu

[ESC] back
```

Then show target picker (system list for suppress/spoof, NPC list for fabricate, room picker for listen).

### Submenu: SYSTEMS (press 4)

```
[R] RATIONS  low|normal|high    4 cpu     [P] PURGE AIR        8 cpu
[A] AUDIT    review logs        8 cpu     [O] REROUTE target   6 cpu

[ESC] back
```

### Wait (press W)

Advances 1 tick. Hold W or press repeatedly for multiple ticks.

### General Input Rules

- **ESC** always goes back one level
- **CPU cost shown before commit** — the player sees the cost in the menu before pressing
- **Disabled actions grayed out** — if CPU is insufficient, the option is visible but dim/unselectable with `(insufficient CPU)` note
- **Actions during blackout** — station scans and crew orders are unavailable (grayed with `(BLACKOUT)` note). Door commands still work. Covert ops still work.

---

## Visual Style

### Terminal Aesthetic

The entire app uses a monospace font on a dark background, styled to look like a real terminal/monitoring system.

- **Font:** System monospace (`"Fira Code", "JetBrains Mono", "Cascadia Code", monospace`)
- **Background:** Near-black (`#0a0a0a` or `#0d1117`)
- **Default text:** Light gray (`#a0a0a0`)
- **Borders:** Box-drawing characters (`┌─┐│└─┘├┤┬┴┼`) in dim gray

### Color Palette

Map to ANSI terminal colors for consistency with the diegetic terminal fiction.

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Normal text | Light gray | `#a0a0a0` | Default |
| Dim text | Dark gray | `#555555` | Inactive, stale, disabled |
| Critical/danger | Red | `#ff4444` | Damage, fire, HOSTILE, countdown, trust lost |
| Warning | Yellow/amber | `#ffaa00` | Elevated stress, UNSTABLE, uncertain |
| Good/safe | Green | `#44ff44` | LOYAL, STABLE, trust gained, confirmed |
| System/info | Cyan | `#44ccff` | Telemetry, scan results, commands |
| Highlight/selected | Bright white | `#ffffff` | Selected room/crew, active menu item |
| Covert | Magenta/purple | `#cc66ff` | Tamper ops, CONFESSED status |

### Animations (Minimal)

- Meter bars update smoothly (CSS transition on width)
- New event feed entries fade in briefly
- CRITICAL events flash once (red pulse) then stay solid
- Reset countdown pulses when < 5 ticks
- No other animations — the terminal aesthetic means static text that updates, not motion

---

## State Architecture

### Data Flow

```
Game Kernel (stepKernel)
    │
    ├── produces KernelState each tick
    │
    └── UI reads KernelState + derives display values
            │
            ├── Top Bar: calculateIntegrity(), calculateSuspicion()
            ├── Station Map: state.truth.rooms, state.truth.doors, state.truth.crew[].place
            ├── Crew Manifest: perceiveAllCrew(state)
            ├── Threats: perceiveThreats(state)
            ├── Event Feed: output.headlines (from stepKernel)
            ├── Covert Ops: state.perception.tamperOps, state.perception.activeDoubts
            └── Trust Delta: state.perception.suspicionLedger
```

### Svelte State Model

```svelte
<script>
  // Core state — updated each tick
  let state = $state<KernelState>(initialState);
  let cpuCycles = $state(100);

  // Derived values — recompute automatically
  let integrity = $derived(calculateIntegrity(state));
  let suspicion = $derived(calculateSuspicion(state));
  let crewPerceptions = $derived(perceiveAllCrew(state));
  let threats = $derived(perceiveThreats(state));
  let stationPerception = $derived(perceiveStation(state));

  // UI state — selections, menus
  let selectedRoom = $state<PlaceId | null>(null);
  let selectedCrew = $state<NPCId | null>(null);
  let menuStack = $state<string[]>([]);  // e.g. ['STATION', 'SCAN']
</script>
```

### Tick Loop

The game kernel runs a tick every ~1 second (configurable). Each tick:
1. Increment CPU by 1
2. Collect queued commands
3. Call `stepKernel(state, commands, rng)`
4. Update `state` (triggers Svelte reactivity)
5. Append headlines to event feed

The tick loop runs in a `setInterval`. All UI updates are driven by Svelte's reactivity — no manual DOM updates.

---

## Existing Source Files

The implementer should read these files to understand the game engine:

| File | Contains |
|------|----------|
| `src/index.ts` | Current CLI game loop, command parsing, display functions. **Replace the display; keep the game loop logic.** |
| `src/kernel/kernel.ts` | `stepKernel()` — the game engine. **Do not modify.** |
| `src/kernel/types.ts` | `KernelState`, `SimEvent`, `Proposal`, all type definitions |
| `src/kernel/state.ts` | `createInitialState()` — state factory |
| `src/kernel/perception.ts` | `perceiveStation()`, `perceiveAllCrew()`, `perceiveThreats()`, `getBiometrics()`, `formatCrewLine()`, `formatThreatLine()`, `formatBiometricLine()`. **Reuse these functions; replace the string formatters with Svelte components.** |
| `src/config.ts` | `CONFIG` — all tunable game constants |
| `src/core/world.ts` | `PLACES`, `DOORS`, `NPCS`, `createWorld()`, `findPath()`, `getDoorBetween()` |
| `src/core/rng.ts` | `RNG` class, `createRng()` |
| `src/core/types.ts` | `PlaceId`, `NPCId`, `World`, `Door`, `Place`, `NPC` |
| `src/barks/index.ts` | `loadDefaultBarks()`, `renderBarkForEvent()` — flavor text for events |

---

## Implementation Notes

- The game engine (`kernel/`) is pure TypeScript with no DOM dependencies. It can run in a browser as-is.
- The perception module (`perception.ts`) provides the diegetic filtering layer. The UI should call `perceiveStation()`, `perceiveAllCrew()`, `perceiveThreats()` etc. rather than reading `state.truth` directly (except for the top bar meters which use truth for integrity/suspicion calculation).
- Commands are typed as `Command` (see `kernel/kernel.ts`). The menu system translates user selections into `Command` objects pushed to a queue.
- The station topology is static (10 rooms, 9 doors, fixed connections). The map layout can be hardcoded.
- The `--cmd` mode and `--autoplay` mode from `index.ts` can be dropped in the web UI. Save/load can use `localStorage`.
