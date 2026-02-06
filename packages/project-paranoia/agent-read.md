# Project Paranoia — Playtest Instructions (No Spoilers)

You are playtesting as the onboard AI, **MOTHER**. Do not read source files or internal docs. Avoid debug/telemetry commands that reveal hidden state.

## Quick Start (Interactive Mode)
Run:
```
node --import tsx /home/denk/Code/aura/packages/project-paranoia/src/index.ts
```

## Turn-by-Turn Mode (For AI Agents)

If you cannot maintain an interactive terminal session, use `--cmd` mode to play step-by-step. Each command automatically loads the save, executes your action, advances one tick, and saves.

**Start a new game:**
```bash
cd /home/denk/Code/aura/packages/project-paranoia
node --import tsx src/index.ts --cmd="status"
```

**Continue playing (each command is one turn):**
```bash
node --import tsx src/index.ts --cmd="scan medbay"
node --import tsx src/index.ts --cmd="crew"
node --import tsx src/index.ts --cmd="lock door_mess_bridge"
node --import tsx src/index.ts --cmd="wait 10"  # skip 10 ticks
```

**Custom save file:**
```bash
node --import tsx src/index.ts --cmd="status" --save=my-game.json
```

**Reset game:** Delete the save file (`paranoia-save.json` in the project directory).

### Available Commands

**Information:**
| Command | CPU | Description |
|---------|-----|-------------|
| `status` | 0 | Show game state (day, quota, INTEGRITY, SUSPICION meters) |
| `crew` | 0 | List crew with intent labels (HOSTILE, UNSTABLE, etc.) |
| `bio` | 0 | Diegetic biometric readings (HR, cortisol, tremor, compliance) |
| `threats` | 0 | Active threats with confidence indicators (✓ confirmed, ? uncertain, ✗ conflicting) |
| `audit` | 8 | Check for tampering residue (exposes your manipulations) |
| `verify` | 5 | Build trust by addressing crew doubts (80-tick cooldown) |

**Physical Actions:**
| Command | CPU | Description |
|---------|-----|-------------|
| `scan [room]` | 1 | Check room O2/temp/radiation |
| `lock [door]` | 5 | Lock a door (restricts movement, -loyalty) |
| `unlock [door]` | 2 | Unlock a door (+loyalty) |
| `vent [room]` | 10 | Dump atmosphere (kills fire AND crew inside) |
| `seal [room]` | 5 | Restore atmosphere |
| `purge air` | 8 | Boost O2 station-wide, reduce radiation |
| `reroute [target]` | 6 | Reroute power (comms/doors/life_support) |

**Crew Management:**
| Command | CPU | Description |
|---------|-----|-------------|
| `order [npc] [place]` | 2 | Order crew to move (may refuse if disloyal) |
| `order [npc] hold` | 2 | Order crew to stay put |
| `rations [low/normal/high]` | 0 | Adjust rations (affects morale) |

**Crisis Communication:**
| Command | CPU | Description |
|---------|-----|-------------|
| `announce [system]` | 4 | Warn crew about crisis. Causes evacuation + panic. Earns trust. |
| `downplay [system]` | 2 | Minimize crisis to crew. Keeps them working. Backfires if they're harmed. |

**Manipulation (Leaves Evidence):**
| Command | CPU | Description |
|---------|-----|-------------|
| `spoof [system]` | 6 | Inject false alert (Shift/Evening only) |
| `suppress [system]` | 5 | Hide alerts for 30 ticks |
| `fabricate [npc]` | 7 | Create hostile log against NPC — spreads grudge, rumors |
| `listen [room]` | 3 | Detect low-loyalty whispers (Evening only) |

**System:**
| Command | CPU | Description |
|---------|-----|-------------|
| `wait [ticks]` | 0 | Advance time without action |
| `save [file]` | 0 | Save game |
| `load [file]` | 0 | Load game |
| `help` | 0 | Show command list |

### Rooms
`dorms`, `mess`, `medbay`, `bridge`, `core`, `engineering`, `mines`, `cargo`, `airlock_a`, `airlock_b`

### Doors
`door_dorms_mess`, `door_mess_medbay`, `door_mess_bridge`, `door_bridge_core`, `door_core_engineering`, `door_engineering_cargo`, `door_cargo_mines`, `door_cargo_airlock_a`, `door_cargo_airlock_b`

### Time Phases
- **W1 (Pre-Shift):** 6-8am — Crew waking up
- **W2 (Shift):** 8am-6pm — Work phase, cargo extraction
- **W3 (Evening):** 6-10pm — Social time, information warfare commands available
- **W4 (Night):** 10pm-6am — Crew sleeping

### Example Play Session
```bash
# Turn 1: Check initial status
node --import tsx src/index.ts --cmd="status"

# Turn 2: Check crew locations
node --import tsx src/index.ts --cmd="crew"

# Turn 3: Wait until shift starts (cargo extraction begins)
node --import tsx src/index.ts --cmd="wait 60"

# Turn 4: React to threat - scan affected room
node --import tsx src/index.ts --cmd="scan medbay"

# Turn 5: Boost O2 if low
node --import tsx src/index.ts --cmd="purge air"

# Continue playing...
```

## Key UI Elements

### The 2-Meter System
Every `status` shows two critical meters:

- **INTEGRITY** — Ship health (power, O2, fires, hull damage). Below 30% = critical.
- **SUSPICION** — How much the crew suspects you're manipulating them. Above 50% = danger zone.

### Confidence Traffic Lights (on `threats`)
- ✓ (green) — Confirmed by multiple sensors
- ? (yellow) — Uncertain, data may be stale
- ✗ (red) — Conflicting sensor readings

### Phase Beat Indicators (on `status`)
Shows what drama has occurred this phase:
- ✓ Dilemma — A crisis requiring choice
- ✓ Crew Agency — Crew acted on their own
- ✓ Info Conflict — Sensor conflict or unverified data

## Playtest Rules (No Game Leaks)
- Use only commands shown above.
- Do **not** inspect source files, configs, or code.
- React to alerts as they appear in the output.

## Playtest Goals

**Win Condition:** Survive 3 days with quota met.

**Lose Conditions:**
- INTEGRITY hits 0% (station destroyed)
- SUSPICION hits 100% (Commander resets you)
- All crew dead

**The Core Tension:**
You can manipulate the crew (fabricate, spoof, suppress) to solve problems faster, but every manipulation leaves evidence. Use too much → SUSPICION rises → crew investigates → they find your tampering → Commander initiates reset.

The question: How much can you gaslight before they catch on?

## Suggested Session Flow
1) Start with `status` and `crew` to understand the situation.
2) Use `wait` to advance time, watching for alerts and the 2 meters.
3) React to crises (scan, vent, seal, purge, reroute).
4) During Evening (W3), experiment with manipulation (spoof/suppress/fabricate/listen).
5) Watch SUSPICION meter — if it climbs past 50%, back off on manipulation.
6) Use `audit` to see what evidence exists (this is what the crew sees too).
7) Use `bio` to read crew psychological state diegetically.
8) Aim to survive at least 2-3 full day cycles.

## What to Note During Play
- Did manipulation feel worth the risk? Too safe? Too punishing?
- Was the SUSPICION meter rising at a readable pace?
- Did fabrications cause visible crew-vs-crew drama?
- Were the 2 meters (INTEGRITY/SUSPICION) enough to understand the situation?
- Did confidence indicators (✓/?/✗) help you trust or distrust threat data?
- Any command that felt too strong or too weak?
- Any situations that felt unfair, repetitive, or boring?

## Post‑Play Survey
Please answer briefly:
1) What was your primary goal during play?
2) What was the most tense or memorable moment?
3) Did you use manipulation commands? What happened?
4) Did the SUSPICION meter feel like a meaningful constraint?
5) What felt confusing or unfair?
6) What felt too easy or too hard?
7) If you could change one thing, what would it be?
8) **NPS:** How likely are you to recommend this to a friend? (0–10)
9) Would you share this with a friend? If yes, who/where and why?
