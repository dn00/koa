# V4 Context File — Resume After Compaction

## What Is This Project

"Home Smart Home" (codename: Aura) — a daily deduction puzzle game. The player has evidence cards, some are lies. Play cards to build an alibi, reach a target score. KOA is the AI adversary who evaluates your statement.

## Current State: V4 Pair Play — READY TO LAUNCH PT5

### What's Done
- V4 validator: 22/22 invariant checks pass (`scripts/prototype-v4.ts`)
- Play engine: interactive mode + turn-by-turn `--state`/`--pick` mode
- Puzzle 1: "The Midnight Print Job" — all 28 pair narrations, 28 reactive hints, 8 verdict quips, 4 closing lines
- KOA quips upgraded to "top tier" — personality, wit, specificity in all verdict quips, dialogue, and reactive hints
- Playtest materials: briefing, player view, survey, protocol, 5 personas (Kai, Marcus, Rio, David, Aisha)
- Puzzle archetype spec: `_process/v4-design/7-puzzle-archetype-spec.md`
- Double-quote bug fixed in `printOutcome` (dialogue strings already contain quotes)
- Piped-input support working for automated testing
- Freemium model validated: daily (free) = 8 cards, 2 lies, 4 singles; paid = pairs with combos

### IMMEDIATE NEXT STEP: Launch PT5 Agents

**Batch 1** (3 agents): Kai, Marcus, Rio — using opus 4.5
**Batch 2** (2 agents): David, Aisha

**Engine-driven playtest** (NOT simulation). Each agent:
1. Calls `npx tsx scripts/play-v4.ts --state <path> --pick <card1,card2>` three times
2. Reads real engine output between turns (narrations, scores, reactive hints)
3. Makes informed decisions based on what it sees
4. Fills out survey after game

The old approach (agents simulating the game in their heads with lookup tables) is retired. Agents should NOT see lie assignments or simulation tables. They play the real engine.

**Prompt structure for each agent:**
- Persona (from `_process/v4-design/playtest-1/persona-{name}.md`)
- Briefing (from `_process/v4-design/playtest-1/briefing.md`)
- Instructions: "Run the engine 3 times via --state/--pick, read output, make decisions, fill out survey"
- Survey (from `_process/v4-design/playtest-1/survey.md`)
- NO lie assignments, NO simulation tables, NO pair narration lookups

**State file paths:** Use unique paths per agent, e.g., `/tmp/claude/.../scratchpad/kai-game.json`

## V4 Core Design (VALIDATED)

- **8 cards**, strengths [1,2,3,4,5,6,7,8], all unique
- **3 lies** (player doesn't know which)
- **Play 3 pairs of 2** (6 of 8 played, 2 left unplayed)
- **Must play at least 1 lie** (3 lies, can only dodge 2) — THIS is the key constraint
- **Combo bonuses** only fire if BOTH cards in pair are truths:
  - Corroboration: same location = +3
  - Timeline: adjacent time = +2
  - Coverage: different evidence types = +2
  - Reinforcement: same evidence type = +3
- **Scoring**: truth = +strength, lie = -(strength-1)
- **Reactive hints** after Turn 1 and Turn 2
- **Evidence types**: DIGITAL, PHYSICAL, TESTIMONY, SENSOR (2 of each)
- **Tiers**: FLAWLESS (>=target+5), CLEARED (>=target), CLOSE (>=target-3), BUSTED

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
# Turn 1 (creates state file, shows opening + hand + result + reactive hint)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick partner_testimony,neighbor_testimony

# Turn 2 (loads state, shows hand + result + reactive hint, saves state)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick workbench,floodlight

# Turn 3 (loads state, shows hand + result + outcome + lie reveal, deletes state file)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick browser_history,email_log
```

State file contains NO isLie data — just IDs, scores, turns played. Cards reconstructed from puzzle definition.

## Key Design Decisions Made

- Pairs, not singles (composition > selection)
- 3 lies, not 2 (forces playing at least 1 lie)
- 3 turns, not 2 or 4 (math + narrative balance)
- Combos only on double-truth pairs (core risk/reward)
- Engine-driven playtest (NOT agent simulation) — agents play the real engine, see real output
- Pair narrations are a separate narrative layer authored by LLM (28 per puzzle)
- KOA reacts to argument quality, not truth/lie status (no leakage in narrations)
- `lieContainment` is a soft check, not a hard requirement
- No tuning recipe needed for V4 (fixed [1-8] strengths + pre-validated lie triples)

## User Preferences

- Wants a "cleanly and solid designed game" — no workarounds or shortcuts
- Wants it scalable: daily puzzle → board game → collectible cards → competitive
- Casual-friendly (learn in minutes) but with depth that scales to expert
- Follows the 7 principles in doc 1
- Prefers mathematical validation before implementation
- Uses opus 4.5 agents for playtesting, 3 agents per batch
- Flagged that previous playtests were "agents pretending to play" — engine-driven is the proper approach
- KOA quips should be "top tier" — personality, wit, specificity
