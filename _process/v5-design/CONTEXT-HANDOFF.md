# V5 Context Handoff

## What V5 Is

A **micro-daily puzzle** game where you convince KOA (a passive-aggressive smart home AI) that you didn't do something suspicious. Think Wordle meets smart home interrogation.

**Core loop:**
- 6 cards in hand (4 truths, 2 lies — hidden from player)
- Play 1 card per turn, 3 turns total
- Known Facts help you deduce which cards are lies
- Type Tax: repeat evidence type = -2 on next play
- KOA Flag after T2: KOA flags your last card for review (keep on record +2/-4, roll back -2)
- Reach target Belief to win (FLAWLESS/CLEARED/CLOSE/BUSTED tiers)

**Design philosophy:**
- Learnable in 45-90 seconds
- 5 "in-head" rules max
- Hidden truthiness (no visible risk pips)
- KOA is Home AI, NOT a courtroom judge
- Deduction via Known Facts, not guessing

## Files

### Core Engine
- `scripts/v5-types.ts` — Types, GameConfig, DEFAULT/EASY/HARD configs
- `scripts/v5-rules.ts` — Scoring, type tax, objection, tier calculation
- `scripts/v5-dialogue.ts` — KOA banter (Home AI voice), link phrases, axis detection
- `scripts/v5-puzzles.ts` — Two puzzles: midnight-print, garage-door
- `scripts/play-v5.ts` — Game engine (interactive + headless agent mode)
- `scripts/prototype-v5.ts` — Validator with diagnostic metrics

### Playtest Infrastructure
- `_process/v5-design/playtest-1/README.md` — Instructions
- `_process/v5-design/playtest-1/survey.md` — Human playtest survey (adapted for V5)
- `_process/v5-design/playtest-1/agent-playtest.ts` — Automated testing with strategy agents
- `_process/v5-design/playtest-1/logs/` — Results

### Design Docs
- `_process/v5-design/micro-daily.md` — Core rules spec
- `_process/v5-design/daily-ver.md` — Full spec (includes stuff we cut)
- `_process/v5-design/banter-system.md` — KOA dialogue design
- `_process/v5-design/micro-tactics.md` — Tactics/Moves proposal (pending)
- `_process/v5-design/agent-playtest-tips.md` — Tips for agent testing

## Current State

### Done
- [x] V5 types with configurable GameConfig
- [x] Scoring: truth +str, lie -(str-1)
- [x] Type tax: repeat evidence type = -2 next play
- [x] KOA Flag after T2: keep on record / roll back
- [x] play-v5.ts with --json, --state, --pick, --objection, --seed flags
- [x] prototype-v5.ts validator (all checks pass)
- [x] Two puzzles with full KOA barks
- [x] Basic agent-playtest.ts with 5 strategies (random, greedy, cautious, type_diverse, high_risk)
- [x] Playtest survey adapted for V5

### Pending
- [ ] **REWRITE agent-playtest.ts** — Current version is GARBAGE. Uses hardcoded heuristics instead of LLM reasoning. Cannot fill out surveys. DELETE IT and build proper Claude-based agents that reason about Known Facts and fill out survey.md.
- [ ] **Moves/Tactics** — If adding, need to redesign Probe for V5 (no "axis tags" exist). Proposed 3 moves: Probe, Buffer, Reframe.
- [ ] **More puzzles** — Only 2 exist. Need variety for real playtesting.

## Key Design Decisions

1. **1 card per turn** — Rejected 2-card option as too complex for daily
2. **No tactics in v1** — Ship without, add after playtest feedback
3. **Type tax on NEXT play** — Not same turn. Creates sequencing decisions.
4. **Hidden truthiness** — No risk pips. Players deduce via Known Facts.
5. **Home AI theme** — KOA is passive-aggressive smart home, not courtroom judge
6. **KOA Flag targets last T2 card** — Not highest-strength (simpler)

## How to Run

```bash
# Interactive play
npx tsx scripts/play-v5.ts --puzzle midnight-print

# Headless agent mode
npx tsx scripts/play-v5.ts --puzzle midnight-print --json --seed 12345 --state /tmp/game.json --pick browser_history

# Validate puzzles
npx tsx scripts/prototype-v5.ts --verbose

# Run agent playtest
npx tsx _process/v5-design/playtest-1/agent-playtest.ts --puzzle midnight-print --agents 5
```

## Validation Results (both puzzles pass)

- Win rate: 20%
- FLAWLESS rate: 11-13%
- Type tax trigger: 48%
- Order matters: 85%
- T1 blindness: 0.07 (low = good)
- Near-optimal lines: 22-24

## Next Steps

1. **DELETE and REWRITE agent-playtest.ts** — The hardcoded version is useless. Build LLM agents that reason about Known Facts, play the game, and fill out survey.md. This is the CRITICAL blocker.
2. **Run LLM agent playtests** — Get filled surveys from different agent personas
3. **Analyze survey responses** — Do agents identify lies through deduction? Where does reasoning break down?
4. **Decide on Moves** based on feedback — if T1 feels blind, add Probe/Buffer/Reframe
5. **Create more puzzles** following the design constraints

## Agent Persona Tool (CRITICAL - NOT DONE)

**The current agent-playtest.ts is USELESS.** It uses hardcoded strategies like "pick highest strength" which cannot:
- Test if deduction actually works
- Fill out survey.md with reasoning
- Answer "what was your aha moment?"
- Validate the puzzle design

### What Needs to Be Built

An LLM-based agent system that:

1. **Receives game context** — scenario, Known Facts, cards in hand (id, strength, type, location, time, claim)
2. **Reasons explicitly** — "Known Fact says X, card Y claims Z, this contradicts because..."
3. **Makes decisions** — picks card with reasoning, not heuristics
4. **Handles KOA Flag** — reasons about whether to keep on record / roll back based on confidence
5. **Fills out survey.md** — answers questions like:
   - "How did you use Known Facts?"
   - "What was your Turn 1 strategy?"
   - "Did you ever feel like guessing?"
   - "What was your aha moment?"

### Architecture

```
agent-playtest.ts
├── Load puzzle (scenario, Known Facts, cards)
├── For each agent persona:
│   ├── Create system prompt with persona
│   ├── Play game via play-v5.ts --json
│   │   ├── T1: Send state to Claude, get pick + reasoning
│   │   ├── T2: Send state to Claude, get pick + reasoning
│   │   ├── KOA Flag: Send state to Claude, get keep/roll-back + reasoning
│   │   └── T3: Send state to Claude, get pick + reasoning
│   ├── Collect all reasoning into transcript
│   └── Send transcript + survey.md to Claude, get filled survey
├── Save results to logs/
└── Aggregate insights
```

### Agent Personas (from agent-playtest-tips.md)

Need 4-6 different reasoning styles:
- **Literal** — takes claims at face value, misses contradictions
- **Suspicious** — assumes high-strength cards are lies
- **Methodical** — systematically checks each claim against Known Facts
- **Risk-averse** — plays safe, avoids anything uncertain
- **Deductive** — explicitly reasons about contradictions
- **Intuitive** — goes with gut feeling, explains why

### The Point

If **Methodical** and **Deductive** agents win by identifying lies through Known Facts, the puzzle design works.

If they win by accident or lose despite good reasoning, the puzzle has information flow problems.

The filled surveys reveal WHERE deduction breaks down.

### DELETE agent-playtest.ts AND REWRITE IT

The current implementation is worthless. Start fresh with Claude API calls.

## Config Flags

 play-v5.ts supports:
- `--puzzle [slug]` — Select puzzle
- `--difficulty easy|standard|hard` — Config preset
- `--no-objection` — Disable objection
- `--no-type-tax` — Disable type tax
- `--json` — JSON output for agents
- `--seed [n]` — Reproducible randomness
- `--state [path]` — Turn-by-turn state file
- `--pick [card_id]` — Play this card
- `--objection stand|withdraw` — KOA flag choice (CLI flag name unchanged for now)
