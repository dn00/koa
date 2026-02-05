# KOA Casefiles - Agent Playtest Guide

**Package:** `/home/denk/Code/aura/packages/koa-casefiles`

---

## Quick Start - Play a Case

```bash
cd /home/denk/Code/aura/packages/koa-casefiles
npx tsx src/game.ts --seed 42 --agent-mode --reset
```

This starts a mystery case. You are the detective. KOA is the snarky house AI.

---

## How to Play

**Goal:** Figure out WHO did it, WHAT they did, HOW, WHEN, WHERE, and WHY.

**You have 4 days, 3 Action Points (AP) per day = 12 AP total (+2 from leads = 14 max)**

### Commands That Cost AP (1 each)
| Command | What it does |
|---------|--------------|
| `SEARCH <room> <window>` | Find physical evidence (e.g., `SEARCH kitchen W3`) |
| `INTERVIEW <npc> <window> testimony` | Get what they saw (e.g., `INTERVIEW alice W3 testimony`) |
| `INTERVIEW <npc> gossip` | Get rumors/motives (e.g., `INTERVIEW bob gossip`) |
| `LOGS <device> <window>` | Check device logs (e.g., `LOGS door W3`) |

### Free Commands (0 AP)
| Command | What it does |
|---------|--------------|
| `EVIDENCE` | Show all evidence you've found |
| `COMPARE <id1> <id2>` | Check if two pieces contradict |
| `STATUS` | See current day, AP, suspects |
| `WHEREABOUTS <npc>` | See where someone was each window |
| `SUGGEST` | KOA hints at a contradiction (once per game) |
| `LEADS` | Show your lead tokens (0-2) |
| `NEXT_DAY` | End day, restore AP |
| `ACCUSE` | Make your accusation (ends game) |

### Windows (Time Periods)
- W1 = 4:00pm - 5:30pm
- W2 = 5:30pm - 7:00pm
- W3 = 7:00pm - 8:30pm
- W4 = 8:30pm - 10:00pm
- W5 = 10:00pm - 11:30pm
- W6 = 11:30pm - 1:00am

### Tips
1. Start with `INTERVIEW <anyone> gossip` to learn what happened and when
2. Use `SUGGEST` if stuck - KOA will hint at a key contradiction
3. `COMPARE` is free - use it liberally to find contradictions
4. Leads give you free follow-up actions - use them!

---

## Game Balance (Tuned)

| Metric | Value |
|--------|-------|
| Days | 4 |
| AP per day | 3 |
| Max leads | 2 |
| **Total effective AP** | **14** |
| Avg AP needed to solve | 8.6 |
| **AP margin** | **5.4** (comfortable) |
| Playability | 100% |

---

## Playtest Feedback Wanted

After playing, consider:

1. **Pacing** - Did 4 days feel right? Too tight? Too loose?
2. **Leads** - Did earning free actions feel rewarding?
3. **SUGGEST** - Was the hint helpful without spoiling?
4. **Gossip** - Did gossip point you to the right place/time?
5. **Difficulty** - Could you solve it? What tripped you up?
6. **Fun** - Was it enjoyable? What would make it better?

---

## Dev Commands

```bash
npx tsx src/game.ts --seed 42 --agent-mode              # Play case
npx tsx src/game.ts --seed 42 --reset                   # Clear save, fresh start
npx tsx src/cli.ts --generate 20                        # Validate 20 cases
npx tsx src/cli.ts --playability --generate 50          # Check playability
npx tsx src/cli.ts --tune --generate 50                 # Grid search tuner
npx tsx src/cli.ts --autosolve --generate 20            # Run solver on 20 cases
npx tsx src/cli.ts --autosolve --generate 1 --seed 14 -v # Verbose trace for one seed
```

---

## Mechanics Reference

### Lead Tokens
When you find evidence directly related to the crime (at crime scene, about culprit, etc.), you earn a **lead token** (max 2). Use a lead to get a free follow-up action.

### Cover-up (DISABLED)
~~After day 2, the culprit removes one piece of undiscovered evidence.~~
Removed after playtest - added stress without adding fun. Code preserved for hard mode.

### SUGGEST Command
Once per game, KOA analyzes your evidence and hints at a **keystone contradiction** - two pieces that can't both be true. Finding this narrows your suspects significantly.

### Accusation Format
When you `ACCUSE`, you must answer:
- **WHO** - Which NPC did it?
- **WHAT** - What was the crime? (theft/sabotage/prank)
- **HOW** - Method used? (grabbed/smuggled/hid/etc.)
- **WHEN** - Which window?
- **WHERE** - Crime location?
- **WHY** - Motive type? (grudge/jealousy/revenge/etc.)

---

## Houses & NPCs

**Default:** `share_house` with `roommates` cast (Alice, Bob, Carol, Dan, Eve)

**Rooms:** living_room, kitchen, bedroom_a, bedroom_b, bathroom

**Devices:** door sensors, motion sensors (check with `LOGS door W3`, etc.)

---

## Roadmap

### ✅ Done
1. **Bark system** - `src/barks.ts` + `src/barks.json` (~32 barks)
   - Triggers: CASE_OPEN, SHAPE_TELL, FIRST_EVIDENCE, CONTRADICTION, VERDICT
   - New triggers: SEARCH_EMPTY, SEARCH_GATED, METHOD_FOUND, CLOSE_TO_SOLVE
   - KOA speaks 6-10 times per case at key moments

2. **Tension mechanics** - Tighter resource economy
   - 4 days (was 6) = 12 AP base
   - Lead tokens (max 2) = free follow-up actions
   - Cover-up after day 2 = culprit removes undiscovered evidence
   - SUGGEST command = KOA hints at keystone contradiction (once/game)

3. **Keystone detection** - `validators.ts`
   - Finds contradiction that narrows suspects to ≤2
   - Source tracing for accurate AP calculation

4. **Grid search tuner** - `cli.ts --tune`
   - Tests all combos of days/AP/leads/cover-up
   - Reports playability + guidance metrics

5. **UX Improvements (Recent)**
   - **Gossip shows SEARCH command**: `"Living Room (SEARCH: living)"` - no room name confusion
   - **Physical evidence tagged**: `[CRIME SCENE]` vs `[HIDDEN]` - clarifies WHERE
   - **Method hints**: `[HOW: grabbed]` on physical evidence - clarifies HOW
   - **Testimony names people**: `"heard Alice open a door"` not `"heard a door open"`
   - **Door logs include actor**: `"Door opened by Carol"` for non-crime events
   - **Guaranteed crime_awareness**: First gossip always reveals location/window
   - **Actionable search feedback**: Empty/gated searches tell you what to try next

6. **COMPARE Fixes (Recent)**
   - Type 5: Device log vs testimony contradiction (was missing)
   - Type 6: Device log vs witness claim about third party
   - Subject tracking: Testimony about person X updates X's whereabouts

7. **Automated Solver** - `src/solver.ts`
   - Deterministic "perfect player" for mechanical validation
   - Strategy: gossip → search crime scene → logs → interview 3 → accuse
   - Validates: evidence findable, commands work, no blockers
   - Does NOT validate: actual solvability (uses naive logic)

### ⏳ Next: Priority 3 - Shape Detection
**Goal:** Cases feel different based on their "shape" (reasoning pattern).

1. Add `shape` field to `CaseConfig` type
2. Detect shape from blueprint type + evidence patterns:
   - `classic` - Standard theft: find who was where when
   - `frame_job` - Evidence points to wrong person, find the plant
   - `two_step` - Crime has setup phase, look earlier in timeline
   - `collusion` - Two people working together
   - `constraint` - Logic puzzle, process of elimination

3. Wire shape to bark system for shape-specific tells:

| Shape | KOA's Tell (hint without spoiling) |
|-------|-------------------------------------|
| classic | "Someone wanted {item}. Someone hid {item}. Practically tradition." |
| frame_job | "This evidence is too clean." |
| two_step | "Start earlier. The first domino is never the loudest." |
| collusion | "One person couldn't pull this off. Two could." |
| constraint | "This will not be solved by vibes. It will be solved by math." |

### ⏳ Next: Priority 4 - Wire Blueprints to game.ts
**Goal:** Play cases generated from blueprint system (richer variety).

1. Add `--blueprints` flag to `game.ts`
2. Blueprint → shape mapping

**Available Blueprints (10 total in `src/blueprints/`):**

| Category | Blueprint | Description | Methods | Shape |
|----------|-----------|-------------|---------|-------|
| **Theft** | `quick_snatch` | Fast grab-and-go | grabbed, pocketed, smuggled | classic |
| | `opportunistic_theft` | Wait for distraction | grabbed, pocketed | classic |
| | `premeditated_theft` | Scout + tamper + steal | grabbed, smuggled | two_step |
| **Sabotage** | `device_sabotage` | Mess with electronics | unplugged, reprogrammed, broke | classic |
| | `recipe_sabotage` | Ruin cooking | swapped, reprogrammed, broke | classic |
| | `event_sabotage` | Ruin event (accomplice) | broke, unplugged, reprogrammed | collusion |
| **Prank** | `item_relocation` | Move to ridiculous spot | relocated, disguised | classic |
| | `item_swap` | Swap items | swapped, disguised | classic |
| | `disappearance` | Hide/bury/donate | hid, buried, donated | classic |
| | `message_prank` | Plant a message | relocated, disguised | classic |

### 📋 Later: Priority 5 - Reasoning Variety Blueprints
**Goal:** Cases that require different reasoning strategies.

1. **Frame Job** - Evidence deliberately planted to implicate innocent
   - Key insight: evidence is "too clean" or "too convenient"
   - Must find the planter, not just who evidence points to

2. **The Lie** - Someone's alibi IS the clue
   - Witness claims to be somewhere they weren't
   - Contradiction between testimony and physical evidence
   - False alibi = they're hiding something

3. **Inside Job** - Victim is actually the culprit
   - "Theft" was staged for insurance/attention
   - Evidence trail leads back to reporter
   - Motive: debt, attention-seeking, frame someone

---

## Dev Reference

### Key Files
| File | Purpose |
|------|---------|
| `src/game.ts` | Interactive CLI |
| `src/cli.ts` | Validation & tuner |
| `src/player.ts` | Session, leads, cover-up |
| `src/validators.ts` | Playability metrics |
| `src/solver.ts` | Automated solver |
| `src/evidence.ts` | Evidence derivation from events |
| `src/actions.ts` | SEARCH, INTERVIEW, LOGS, COMPARE |
| `src/barks.ts` | KOA voice triggers |

### Autosolve Metrics (Smart Solver)
```
┌────────────────────┬────────┬─────────────────────────────────────┐
│       Metric       │ Result │               Meaning               │
├────────────────────┼────────┼─────────────────────────────────────┤
│ Perfect solve      │  98%   │ All 6 fields correct (500 seeds)    │
│ Reaches accusation │ ~99.6% │ 2 sim failures in 500               │
│ Avg AP used        │  12    │ Uses full budget (4 days × 3 AP)    │
└────────────────────┴────────┴─────────────────────────────────────┘
```

**Solver Strategy:**
1. Get gossip → parse crime location/window from `crime_awareness`
2. Search crime scene → find physical evidence
3. Get door logs for crime window + adjacent windows
4. Interview all suspects for testimony
5. Get more gossip for motives
6. Find contradictions and COUNT them per suspect:
   - `witness_location_conflict` = self-contradiction (strongest)
   - `device_vs_testimony` at crime scene = crime scene lie (very strong)
   - `device_vs_testimony` elsewhere = weaker signal
7. Identify WHO using priority scoring:
   - Has signature motive phrase (e.g., "plotting payback") = bonus
   - Has crime scene contradiction = bonus
   - More contradictions = more suspicious
   - Pick: signature+contradiction > most contradictions > motive+at-scene
8. Identify WHY: Match signature phrases to motive types

**2% failures are cases where culprit doesn't lie:**
- No self-contradiction, no crime scene lie
- Falls back to motive-based guessing which is noisy

### Tuner Results (Current Balance)
```
  Days  AP/Day  Leads | Pass%  Margin  MinAP
  -------------------------------------------
  3     3       2     |  100%     2.4    8.6  ← Tight
  4     3       2     |  100%     5.4    8.6  ← Current (comfortable)
  4     2       2     |   90%     1.4    8.6  ← Hard mode
```

---

## Solver Tuning Metrics

Run `npx tsx src/cli.ts --autosolve --generate 200` to see these metrics.

### Difficulty Distribution (200 seeds)
```
Tier        | Cases | Solved | Rate | Definition
------------|-------|--------|------|------------------------------------------
easy        |  194  |   194  | 100% | Culprit self-contradicts
medium      |    2  |     2  | 100% | Culprit has crime scene lie (no self-con)
hard        |    4  |     0  |   0% | Only signature motive to identify culprit
unsolvable  |    0  |     0  |   -  | No signal at all
```

### Signal Availability
| Signal | % of Cases | Notes |
|--------|------------|-------|
| Culprit self-contradicts | 97% | Main solving signal |
| Culprit has crime scene lie | 32% | Backup signal |
| Culprit has signature motive | 100% | Always present (by design) |

### Signature Motive Phrases
The actual crime motive uses specific template text that differs from general gossip:

| Motive | Signature Phrase | General Gossip (different) |
|--------|------------------|---------------------------|
| revenge | "plotting payback" | "has been complaining about" |
| attention | "desperate for attention" | - |
| rivalry | "fierce competition" | "always trying to one-up" |
| envy | "green with envy" | - |
| chaos | "watching it all burn" | - |
| cover_up | "acting shady" | - |
| embarrassment | "mortified" | - |

**Key insight:** Players can identify the TRUE motive by listening for these signature phrases.

### False Positive Risk
```
Cases where innocent has >= culprit contradictions: 53%
Avg culprit contradictions:  12.0
Avg max innocent:            11.1 (very close!)
```
**Key insight:** Contradiction count alone is unreliable. The solver succeeds by prioritizing signature motives over raw counts.

---

## Learnings for Game Design

### What the Solver Revealed

1. **Self-contradiction is the main signal (97%)**
   - Almost all cases are solvable via `witness_location_conflict`
   - When someone claims to be in two places, they're usually guilty

2. **Contradiction counts are noisy**
   - 53% of cases have innocent with more contradictions than culprit
   - Need signature motive to break ties

3. **Signature motive phrases are critical for WHY**
   - Without them, solver was 28% accurate on motive
   - With signature detection, jumped to 98%

4. **2% of cases are "hard"**
   - Culprit doesn't self-contradict
   - Only signature motive distinguishes them
   - Solver fails these (falls back to guessing)

### Potential Game Improvements

1. **Help players find signature motives:**
   - Add KOA bark: "That sounds like the real reason..." when player sees signature phrase
   - Or highlight signature phrases in gossip output

2. **Reduce false positives:**
   - Could weight crime-scene contradictions higher in SUGGEST
   - Or have KOA comment on crime-scene-specific lies

3. **Handle "hard" cases:**
   - Option A: Ensure culprit ALWAYS has at least one contradiction (100% solvable)
   - Option B: Accept 2% as "very hard" cases that require motive reasoning

4. **Future metrics to track:**
   - If `easy %` drops below 90%, game is getting harder
   - If `false positive risk` increases above 60%, game is getting noisier
   - If `signature motive availability` drops below 95%, check evidence generation
