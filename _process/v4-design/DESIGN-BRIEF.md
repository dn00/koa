# V4 Design Brief — Home Smart Home

Load this file into a fresh session to become an expert on the game design. Read referenced files as needed.

---

## The Game

**Pitch:** "You have 8 evidence cards. Three are lies. Play them in 3 pairs to build your alibi — but pairs that tell a strong story also carry the most risk."

**Genre:** Daily deduction puzzle (Wordle-like cadence). Mobile-first. 5-10 min session.

**Core loop:** Read scenario → examine 8 cards → use KOA's hint to suspect lies → play 3 pairs → score → KOA delivers verdict.

**What makes it work:** You MUST play at least 1 lie (3 lies, can only dodge 2). The question isn't "can I avoid all lies?" — it's "which lies do I dodge, and how do I minimize the damage from the one I must play?"

---

## Mechanics Summary

| Element | Value |
|---------|-------|
| Cards | 8, strengths [1-8], all unique |
| Lies | 3 (unknown to player) |
| Turns | 3 (play 1 pair of 2 per turn) |
| Unplayed | 2 cards (player's deduction) |
| Truth score | +strength |
| Lie penalty | -(strength - 1) |
| Combos | Only if BOTH cards in pair are truths |
| Combo types | Corroboration(+3, same loc), Reinforcement(+3, same type), Coverage(+2, diff type), Timeline(+2, adjacent time) |
| Tiers | FLAWLESS(≥target+5), CLEARED(≥target), CLOSE(≥target-3), BUSTED |
| Reactive hints | After Turn 1 and Turn 2 |
| Evidence types | DIGITAL, PHYSICAL, TESTIMONY, SENSOR (2 each) |

**Full spec:** `_process/v4-design/9-pair-play-design.md`

---

## Design Decisions (with rationale)

| Decision | Why | Rejected alternatives |
|----------|-----|-----------------------|
| Pairs, not singles | Composition > selection. "Which pair?" is richer than "which card?" | V3 single-card play (shallow — "pick highest non-lie") |
| 3 lies, not 2 | Forces playing ≥1 lie. With 2 lies you can dodge both → no tension | 2 lies + 3 pairs (0/28 viable — safe play always works) |
| 3 turns, not 2 | Narrative arc. T1=brave guess, T2=adjusted plan, T3=tension peak | 2 pairs (too thin), 4 pairs (too many cards) |
| Strengths [1-8] | Max design range. Str-1 = damage sponge for forced lie. 54/56 viable | [3-10] only 39/56 viable; [0-7] 56/56 but str-0 lie gives +1 (breaks design) |
| Combos only on double-truth | Core risk/reward. Chasing +6 on a natural pair is tempting but devastating if one is a lie | Always-on combos (removes risk dimension) |
| `paired-both` config | Same-type pairs share location → natural +6 pairs that lies disrupt | interleaved (52/56), paired-locs (48/56) — fewer viable |
| Engine-driven playtest | Agents play real engine, see real output. No lie leakage, no simulation errors | Simulation (agents knew lies, faked the game) |
| KOA reacts to argument quality | Pair narrations don't leak truth/lie. Strong lie pair gets respect, weak truth pair gets dismissed | Reacting to truth/lie status (spoils the game) |
| No tuning recipe needed | Fixed [1-8] + pre-validated lie triples eliminates V3's iterative tuning | V3 needed manual tuning per puzzle |
| `lieContainment` is soft | Only 2/56 fail. Game works without containment strategy | Making it hard (would reject viable triples) |

---

## Mathematical Validation

**Sweep results (paired-both config):**

| Strength range | Viable triples | Rate | Notes |
|----------------|---------------|------|-------|
| [1-8] | 54/56 | 96.4% | CURRENT DESIGN |
| [3-10] | 39/56 | 69.6% | Higher penalty floor kills lieContainment |
| [0-7] | 56/56 | 100% | str-0 lie = +1 (helps player, breaks design) |

**Validator:** `scripts/prototype-v4.ts` — 22 invariant checks (I1-I22), all passing.

**Key checks:** win rate 10-50% (I12), FLAWLESS rate 5-30% (I13), pairing matters (I9), strength-first fails (I16), lies are combo-eligible (I15).

**Full sweep scripts:** `scripts/v4-pair-sweep-v2.ts`, `scripts/v4-canonical-sweep.ts`

---

## 7 Principles

The game is designed against 7 principles of depth. Summary:

| # | Principle | How V4 meets it |
|---|-----------|-----------------|
| 1 | Transparent space, opaque solution | 8 cards visible, combo rules visible, 3 lies hidden |
| 2 | Irreversible + information | Each pair committed permanently, reveals score + hint |
| 3 | Optimal is non-obvious | Highest-str pair ≠ highest-scoring pair (combos shift the math) |
| 4 | Info helpful AND dangerous | Hint narrows lies but might create false confidence |
| 5 | Depth without punishing breadth | Casual: pair by gut. Expert: plan all 3 turns |
| 6 | Shareable artifact | 3 pairs + 2 left out + verdict = compact result |
| 7 | Constraint is the engine | Must play ≥1 lie. Pairing forces composition |

**Full doc:** `_process/v4-design/1-principles-and-depth-audit.md`

---

## Puzzle Authoring

**Process:** Backward generation — choose lie triple → define experience → assign lies to card slots → write hint backward → write reactive hints → design cards → write pair narrations → write scenario last → validate.

**Card slots:** ANCHOR, SUPPORT, RED HERRING, BAIT, LURKER, STEALTH, FILLER — each with strength/lie/hint profiles.

**Hint archetypes:** DIRECT, COMPOUND, BEHAVIORAL, NEGATION, RELATIONAL, OBLIQUE — rotate across consecutive puzzles.

**Trap archetypes:** COMBO TRAP, STRENGTH TRAP, CONTAINMENT TRAP, PROBE TRAP, RED HERRING TRAP, SPLIT TRAP.

**Semantic invariants:** S1-S16 (S14-S16 are V4-specific: pair narrations don't leak, each lie disrupts a natural pair, combo bait is genuine).

**Full spec:** `_process/v4-design/7-puzzle-archetype-spec.md`
**Puzzle gen invariants:** `_process/v3-design/puzzle-gen-invariants.md`

---

## The Prototype: "The Midnight Print Job"

- **Scenario:** Confidential doc printed at 3 AM, suspect claims asleep since 11
- **Lies:** email_log(str 2), toolbox(str 4), motion_yard(str 7)
- **Truths:** browser_history(1), workbench(3), partner_testimony(5), neighbor_testimony(6), floodlight(8)
- **Hint:** "Claims that explain an absence unprompted" — matches 5/8 (3 lies + 2 red herrings)
- **Target:** 20
- **Optimal:** dodge toolbox+motion_yard → score 30 (FLAWLESS)
- **Content:** 28 pair narrations, 28 reactive hints, 8 verdict quips (truth+lie), 4 closing lines

**Full puzzle:** `scripts/v4-puzzles.ts`

---

## KOA (the investigator)

**Voice:** Dry, precise, slightly amused. Never cruel. Grudging respect when beaten. Specific evidence when catching lies ("fresh scratches around the latch — and pry marks on the office door that match a flathead from YOUR kit").

**Quip design:**
- Truth verdicts: backhanded ("The toolbox is exactly as dull as you claimed")
- Lie verdicts: devastating with specific evidence ("Then who sent 16 pages to the printer at 3 AM — the ghost of emails past?")
- Reactive hints (specific): actionable direction without naming cards
- Reactive hints (vague): meta-commentary on player strategy ("You're giving me the safe stuff first. That means you know which cards are dangerous.")
- Pair narrations: KOA reacts to argument quality, NOT truth/lie status

---

## Playtesting

### Philosophy

Agents play the REAL engine — they don't simulate. They never see lie assignments. They see exactly what a human player would see. This was a deliberate correction from V3 playtests where agents "pretended to play" (simulated the game in their heads with full knowledge of lies).

### How to Launch a Playtest Agent

Each agent is a Task subagent (opus 4.5) that:
1. Receives a persona + briefing + instructions
2. Calls the game engine 3 times (once per turn)
3. Thinks aloud between turns (in character)
4. Fills out the survey after the game

**Agent prompt structure:**
```
You are {PERSONA_NAME}, playing HOME SMART HOME for the first time.

## WHO YOU ARE
{contents of persona-{name}.md}

## GAME RULES
{contents of briefing.md}

## INSTRUCTIONS
You will play "The Midnight Print Job" using the game engine.

For each turn (3 total):
1. Think aloud about what you see — the cards, the hint, combo potential, lie suspicions
2. Decide which 2 cards to pair
3. Run the engine command (see below)
4. Read the output — narration, KOA's reaction, truth/lie reveals, combos, score, reactive hint
5. React to what you learned. Adjust your strategy for the next turn.

ENGINE COMMANDS:
- Turn 1: npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state {STATE_PATH} --pick {card1},{card2}
- Turn 2: Same command, different --pick
- Turn 3: Same command, different --pick

The state file tracks the game between turns. You DON'T need to track score manually.

Turn 1 output includes: opening scenario, hint, all 8 cards, then your pair result + reactive hint.
Turn 2 output includes: remaining 6 cards, your pair result + reactive hint.
Turn 3 output includes: remaining 4 cards, your pair result + final outcome (tier, closing line, lie reveal, share card).

After the game, write a brief reaction (2-3 sentences), then fill out the COMPLETE survey below.

## SURVEY
{contents of survey.md}

## IMPORTANT
- You are a FIRST-TIME player. No meta-knowledge.
- Play authentically to your persona.
- The engine handles all scoring and reveals. Trust its output.
- Think aloud BEFORE each pick. Show your reasoning.
- You are forced to play at least 1 lie (3 lies, can only leave out 2).
- Write your complete output to: {OUTPUT_PATH}
```

**State file paths:** Use unique paths per agent, e.g., `/tmp/claude/.../scratchpad/{name}-game.json`
**Output paths:** `_process/v4-design/playtest-1/logs/{name}-pt5.md`

### Engine Turn-by-Turn Mode

```bash
# Turn 1 (creates state, shows opening + all 8 cards + pair result + reactive hint)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick partner_testimony,neighbor_testimony

# Turn 2 (loads state, shows 6 remaining cards + pair result + reactive hint)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick workbench,floodlight

# Turn 3 (loads state, shows 4 remaining cards + pair result + full outcome + lie reveal)
npx tsx scripts/play-v4.ts --puzzle midnight-print-job --state /tmp/game.json --pick browser_history,email_log
```

State file contains NO isLie — just card IDs, score, turns played. Cards reconstructed from puzzle definition. State file auto-deletes after turn 3.

### What the Agent Sees (Turn 1 example output)

```
╔═══════════════════════════════════════════════════════════════╗
║  HOME SMART HOME — "The Midnight Print Job"                 ║
╚═══════════════════════════════════════════════════════════════╝

  [scenario text]
  KOA: [opening hint]
  Target score: 20

  YOUR HAND:
  ──────────
  [browser_history]  str:1  type:DIGITAL    loc:OFFICE     time:10:45 PM
  [email_log]        str:2  type:DIGITAL    loc:OFFICE     time:11:30 PM
  ... (all 8 cards with id, strength, type, location, time, claim)

  ── Turn 1: Pair Played ──
  YOU: "[combined pair narration]"
  KOA: "[KOA's reaction]"
  [card1] → TRUTH (+5)
  [card2] → TRUTH (+6)
  COMBOS: Corroboration +3, Timeline +2, Reinforcement +3
  Pair total: +19
  KOA on card1: "[verdict quip]"
  KOA on card2: "[verdict quip]"

  ┌─ KOA's Observation ─┐
  │ "[reactive hint text]"
  └─────────────────────┘
```

### Batching

- **Batch 1** (3 parallel agents): Kai, Marcus, Rio
- **Batch 2** (2 parallel agents): David, Aisha
- Model: opus 4.5 for all

### Materials

| File | Purpose |
|------|---------|
| `_process/v4-design/playtest-1/briefing.md` | Game rules for players |
| `_process/v4-design/playtest-1/puzzles-player-view.md` | Card data (NO isLie) |
| `_process/v4-design/playtest-1/survey.md` | 9-part survey (68+ questions) |
| `_process/v4-design/playtest-1/protocol.md` | PT5 objectives, pass criteria |
| `_process/v4-design/playtest-1/persona-{name}.md` | 5 personas |
| `_process/v4-design/playtest-readiness-checklist.md` | Pre-launch checklist |

### Leakage Prevention

- Agents NEVER see `isLie` values, lie assignments, or simulation tables
- Agents NEVER see validator output, optimal paths, or invariant data
- The engine output reveals truth/lie ONLY after the pair is committed
- State file contains only card IDs and scores, no `isLie`

---

## Freemium Model

| Mode | Cards | Lies | Play | Combos | Win rate |
|------|-------|------|------|--------|----------|
| Daily (free) | 8 | 2 | 4 singles | No | ~33% |
| Premium (paid) | 8 | 3 | 3 pairs | Yes | ~19% |

Same puzzle data, two game modes. Premium = subscription (puzzles are large: 28 narrations, 28 hints).

---

## Open Questions

1. **Deckbuilding model** — Daily gives everyone same cards (Wordle-like). Archive/challenge puzzles use owned cards. Hybrid model likely winner. → `_process/v4-design/open-questions.md`
2. **Card narrative ↔ strength** — str-1 = weak evidence, str-8 = strong. Formalize as authoring guideline.
3. **Scoring contexts as weekly themes** — Type multipliers, corroboration bonuses as modifiers. Post-validation.
4. **Multi-act structure** — Multiple rounds, same deck, different scoring per act. Post-validation.
5. **Combo bonuses with lies?** — No (current, recommended). Combos = reward for correct deduction.
6. **Shareable artifact format** — Blocked cards, check/cross per card, score. Designed but not finalized.

---

## Codebase

| File | Purpose |
|------|---------|
| `scripts/v4-types.ts` | Type definitions (Card, ComboResult, PairResult, V4Puzzle, GameState) |
| `scripts/v4-puzzles.ts` | Puzzle 1 data (cards, 28 narrations, 28 hints, quips, dialogue) |
| `scripts/play-v4.ts` | Game engine (interactive + `--state`/`--pick` turn-by-turn mode) |
| `scripts/prototype-v4.ts` | Validator (22 invariant checks) |
| `scripts/v4-pair-sweep-v2.ts` | Balance sweep (all lie triples × all configs) |
| `_process/v4-design/` | All design docs, playtest materials |
| `_process/v3-design/` | V3 docs (historical, principles doc still referenced) |

---

## Gotchas

1. **Double-quote bug pattern:** Dialogue strings in `v4-puzzles.ts` include their own quotes (`'"Sixteen pages...'`). Display code must NOT wrap them in additional quotes or you get `""text""`. Fixed in `printOutcome`, watch for recurrence.

2. **Timeline combo mismatch:** Engine uses real time parsing (diff ≤ 90 minutes). Sweep script uses adjacent indices (`Math.abs(a.time - b.time) === 1`). Results match for current puzzle but could diverge with non-standard time gaps.

3. **Stale playtest template:** `playtest-1/playtest-prompt-template.md` was built for simulation mode (has `{{LIE_ASSIGNMENTS}}`, `{{PAIR_NARRATIONS_TABLE}}`). Use the engine-driven approach in this brief instead. Template needs rewrite or deletion.

4. **V3 still in repo:** All V3 scripts and docs are intact in `_process/v3-design/` and `scripts/v3-*.ts`. Not deprecated, just superseded. Principles doc exists in both v3 and v4 folders.

5. **Git status:** Lots of uncommitted changes across v3-design docs, scripts, and new v4-design files. No commits have been made during V4 work.

---

## Creator Preferences

- "Cleanly and solid designed game" — no workarounds or shortcuts
- Scalable: daily puzzle → board game → collectible cards → competitive
- Casual-friendly but with expert depth
- Mathematical validation before implementation
- KOA quips must be "top tier"
- Engine-driven playtesting (not simulation — "agents were pretending to play")
- Opus 4.5 for playtest agents, 3 per batch
