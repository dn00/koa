# V4 Context File — Resume After Compaction

## What Is This Project

"Home Smart Home" (codename: Aura) — a daily deduction puzzle game. The player has evidence cards, some are lies. Play cards to build an alibi, reach a target score. KOA is the AI adversary who evaluates your statement.

**Design Identity:** Card battler without combat. KOA is the opponent with telegraphed patterns (stance), stateful attacks (pressure), and a turning point (The Objection).

## Current State: V4 Pair Play — POST PT5, PRESSURE + OBJECTION IMPLEMENTED

### What's Done
- V4 validator: 23/23 invariant checks pass (`scripts/prototype-v4.ts`)
- Play engine: interactive mode + turn-by-turn `--state`/`--pick`/`--objection` mode
- **Pressure System** (3 rules that make ORDER matter):
  - HIGH STRENGTH: -1 if previous pair > 10 combined strength
  - TYPE ECHO: -1 per card if type was played in previous turns
  - LOCATION CHAIN: -1 if continuing a location cluster (requires 3+ cards per location to trigger)
- **The Objection** (turning point after T2):
  - KOA challenges highest-strength played card
  - Player chooses: Stand By (+2 if truth, -3 if lie) or Withdraw (-2)
- **Stance System** (daily combo value shifts):
  - SKEPTIC: coverage(4), reinforcement(1), corroboration(3), timeline(2)
  - TRADITIONALIST: reinforcement(4), coverage(0), corroboration(4), timeline(2)
  - NEUTRAL: reinforcement(3), coverage(2), corroboration(3), timeline(2)
- **Training Mode** flags for learning curve:
  - `--training` — disable pressure + objection
  - `--no-pressure` — disable pressure only
  - `--no-objection` — disable objection only
- Puzzle 1: "The Midnight Print Job" — all 28 pair narrations, 28 reactive hints, 8 verdict quips, 4 closing lines
- Claim rewrites to prevent style-based lie detection (removed "proactive denial" pattern)
- Piped-input support working for automated testing

### Balance Stats (Full Mode)
- Win rate: 16.7% (FLAWLESS + CLEARED)
- FLAWLESS rate: 7.1%
- Order matters: 91.4% of sequences
- Avg pressure penalty: -2.36 per game
- Best score: 35, Worst score: -6

### Balance Stats (Training Mode)
- Win rate: 19.3%
- FLAWLESS rate: 7.4%
- Order matters: 0% (pressure disabled)
- Best score: 34

### Design Decisions Made This Session
1. **Pressure over hints** — Instead of helpful hints that agents exploit, use pressure penalties that create strategic order decisions
2. **Stance rotation** — Daily combo values shift, preventing memorized optimal pairings
3. **The Objection** — A turning point that adds risk/reward after T2, not just additive scoring
4. **Training mode** — New players can learn core mechanics before advanced systems
5. **No economy (yet)** — Pressure + Objection provides enough "teeth" for now; economy layer deferred pending playtest results

### Open Questions
- Should LOCATION CHAIN require puzzle redesign (3+ cards per location)?
- Is current win rate (16.7%) too low for casual players?
- Does The Objection feel like a meaningful decision or a math problem?

### NEXT STEP: Playtest with Pressure + Objection

**Engine-driven playtest** (NOT simulation). Each agent:
1. Calls `npx tsx scripts/play-v4.ts --state <path> --pick <card1,card2>` for T1, T2
2. After T2, responds to The Objection with `--objection stand` or `--objection withdraw`
3. Calls `--pick` for T3
4. Reads real engine output (narrations, scores, pressure penalties, reactive hints)
5. Fills out survey after game

**State file paths:** Use unique paths per agent, e.g., `/tmp/claude/.../scratchpad/kai-game.json`

**Training mode for onboarding:** New players/agents can use `--training` to disable pressure and objection

## V4 Core Design (VALIDATED)

### Base Mechanics
- **8 cards**, strengths [1,2,3,4,5,6,7,8], all unique
- **3 lies** (player doesn't know which)
- **Play 3 pairs of 2** (6 of 8 played, 2 left unplayed)
- **Must play at least 1 lie** (3 lies, can only dodge 2) — THIS is the key constraint
- **Scoring**: truth = +strength, lie = -(strength-1)
- **Evidence types**: DIGITAL, PHYSICAL, TESTIMONY, SENSOR (2 of each)
- **Tiers**: FLAWLESS (>=target+5), CLEARED (>=target), CLOSE (>=target-3), BUSTED

### Combo System (stance-dependent values)
Combos only fire if BOTH cards in pair are truths:
- **Corroboration**: same location
- **Timeline**: adjacent time (within 90 min)
- **Coverage**: different evidence types
- **Reinforcement**: same evidence type

Default (NEUTRAL): Corroboration(+3), Timeline(+2), Coverage(+2), Reinforcement(+3)

### Pressure System (makes ORDER matter)
Penalties based on play patterns:
- **HIGH STRENGTH**: -1 if previous pair had combined strength > 10
- **TYPE ECHO**: -1 per card if that evidence type was played in a previous turn
- **LOCATION CHAIN**: -1 if continuing a clustered location from previous turn

### The Objection (after T2)
KOA challenges your highest-strength played card:
- **Stand By**: +2 if truth, -3 if lie (double-down risk)
- **Withdraw**: -2 regardless (safe but costly)

### Reactive Tells (after T1 and T2)
Pattern commentary that's "helpful AND dangerous" — comments on play patterns without revealing lies

### Best Attribute Config: `paired-both`

| Str | Type | Location |
|-----|------|----------|
| 1 | D | Loc A |
| 2 | D | Loc A |
| 3 | P | Loc B |
| 4 | P | Loc B |
| 5 | T | Loc C |
| 6 | T | Loc C |
| 7 | S | Loc D |
| 8 | S | Loc D |

Same-type pairs share locations → pairing str 1+2 gives corroboration(+3) AND reinforcement(+3).

### Balance: 54/56 lie triples viable (96.4%)

## Key Files

### Design Docs (`_process/v4-design/`)
- `9-pair-play-design.md` — THE definitive V4 spec
- `7-puzzle-archetype-spec.md` — V4 puzzle authoring rules, card slots, hint/trap archetypes, backward generation, S1-S16
- `1-principles-and-depth-audit.md` — 7 principles of great puzzle design (reference, pre-V4)
- `open-questions.md` — Deckbuilding hybrid model, freemium, multi-act
- `playtest-readiness-checklist.md` — V4 checklist (7 sections)

### Playtest Materials (`_process/v4-design/playtest-1/`)
- `briefing.md` — V4 rules for players
- `puzzles-player-view.md` — The Midnight Print Job (NO isLie data)
- `survey.md` — 9-part survey (68+ questions)
- `protocol.md` — PT5 objectives, pass criteria
- `playtest-prompt-template.md` — OLD template (simulation-based, needs update for engine-driven)
- `persona-kai.md`, `persona-marcus.md`, `persona-rio.md`, `persona-david.md`, `persona-aisha.md`
- `logs/` — Output directory

### V4 Code
- `scripts/v4-types.ts` — Type definitions
- `scripts/v4-puzzles.ts` — Puzzle 1: "The Midnight Print Job" (28 pair narrations, 28 reactive hints, 8 verdict quips)
- `scripts/play-v4.ts` — Interactive CLI + turn-by-turn state mode (`--state <path> --pick <card1,card2>`)
- `scripts/prototype-v4.ts` — Validator (22 invariant checks, all passing)

### Sweep Scripts
- `scripts/v4-pair-sweep.ts`, `v4-pair-sweep-v2.ts`, `v4-canonical-sweep.ts`, `v4-context-sweep.ts`

### V3 Code (STABLE)
- `scripts/v3-types.ts`, `scripts/v3-puzzles.ts`, `scripts/prototype-v3.ts`, `scripts/play-v3.ts`

## The Prototype Puzzle: "The Midnight Print Job"

- Scenario: Confidential document printed at 3 AM, suspect claims to have been asleep
- Lies: email_log (str 2, DIGITAL, OFFICE), toolbox (str 4, PHYSICAL, GARAGE), motion_yard (str 7, SENSOR, BACKYARD)
- Truths: browser_history (1), workbench (3), partner_testimony (5), neighbor_testimony (6), floodlight (8)
- Behavioral hint: "Claims that explain an absence unprompted" — matches 5/8 cards (3 lies + 2 red herrings)
- Target: 20
- Optimal play: dodge toolbox+motion_yard, pair partner+neighbor (17), workbench+floodlight (13), browser+email_log (0) = 30

## Engine Turn-by-Turn Mode

```bash
# Turn 1 (creates state file, shows opening + hand + result + reactive tell)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick partner_testimony,neighbor_testimony

# Turn 2 (shows result + reactive tell + THE OBJECTION prompt)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick workbench,floodlight

# Objection response (resolve the challenge before T3)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --objection stand
# OR: --objection withdraw

# Turn 3 (shows result + outcome + lie reveal, deletes state file)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick browser_history,email_log
```

**Training mode** (disable advanced mechanics):
```bash
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --training
# Disables pressure penalties and The Objection
```

State file contains NO isLie data — just IDs, scores, turns played, pressure state. Cards reconstructed from puzzle definition.

## Key Design Decisions Made

### Core Mechanics
- Pairs, not singles (composition > selection)
- 3 lies, not 2 (forces playing at least 1 lie)
- 3 turns, not 2 or 4 (math + narrative balance)
- Combos only on double-truth pairs (core risk/reward)

### Depth Systems (Card Battler Identity)
- **Pressure** over hints — penalties for patterns, not tips that agents exploit
- **Stance rotation** — daily combo values shift, preventing memorized optimal pairings
- **The Objection** — turning point after T2, not just additive scoring
- **Reactive tells** — pattern commentary that's helpful AND dangerous (no lie leakage)

### Anti-Solvability
- Order matters (pressure penalties depend on sequence)
- Claim styles don't leak truth/lie status (rewritten to remove "proactive denial" patterns)
- No hints that identify specific cards or actions
- Stance announced but combo values must be internalized

### Learning Curve
- Training mode disables pressure + objection
- Core game learnable in minutes
- Full depth unlocks over multiple plays

### Playtest Approach
- Engine-driven (NOT agent simulation)
- Agents play the real engine, see real output
- NO lie assignments, NO simulation tables in prompts

### Deferred Decisions
- Economy system (scrutiny/credibility) — deferred pending playtest results
- LOCATION CHAIN may need puzzle redesign (currently 2 cards per location)

## User Preferences

- Wants a "cleanly and solid designed game" — no workarounds or shortcuts
- Wants it scalable: daily puzzle → board game → collectible cards → competitive
- Casual-friendly (learn in minutes) but with depth that scales to expert
- Follows the 7 principles in doc 1
- Prefers mathematical validation before implementation
- Uses opus 4.5 agents for playtesting, 3 agents per batch
- Flagged that previous playtests were "agents pretending to play" — engine-driven is the proper approach
- KOA quips should be "top tier" — personality, wit, specificity
