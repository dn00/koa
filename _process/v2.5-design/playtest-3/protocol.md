# V2.5 Playtest 3 — Protocol

Post v2.5.2. Tests puzzle variety, difficulty increase, and session arc across 3 different puzzles.

---

## Changes from Playtest 2

1. **3 different puzzles per player** instead of 3 runs of the same puzzle
2. **v2.5.2 mechanics** — resistance-break continuation, raised Last Slice resistance to 17
3. **Session arc measurement** — "Would you come back tomorrow?" asked between puzzles
4. **Same 5 personas** from playtest 2 for direct comparison

---

## Puzzle Sequence

All players play the same 3 puzzles in the same order:

| # | Puzzle | Archetype | Resistance | Why This Order |
|---|--------|-----------|------------|----------------|
| 1 | The Last Slice | Corroboration | 17 | Familiar scenario, higher difficulty. Tests if raised resistance creates losses. |
| 2 | The Thermostat War | Trap | 14 | New scenario. Highest-power card is the trap (AWAY contradicts HOME). Tests learning transfer. |
| 3 | The Shampoo Thief | Counter-Heavy | 16 | 3 counters, must sequence refutations. Hardest puzzle. Tests mastery. |

---

## Run Structure

Each puzzle is played ONCE. No replays of the same puzzle.

| Puzzle | Trigger | After Playing |
|--------|---------|---------------|
| 1 (Last Slice) | Mandatory | Ask: "Would you come back tomorrow for Puzzle 2?" Log answer. |
| 2 (Thermostat War) | Immediate | Ask: "Was this worth coming back for?" + "Would you come back for Puzzle 3?" Log answers. |
| 3 (Shampoo Thief) | Immediate | Full survey. |

**Think-aloud protocol** same as playtest 2.

---

## Player Profiles

Same 5 personas from playtest 2. They retain memory of playtest 2's mechanics (tag conflicts, corroboration, badges) but NOT specific card knowledge from the old puzzle.

| # | Name | Playtest 2 Best Badge | Key Insight They Carry |
|---|------|-----------------------|------------------------|
| P1 | Sarah | THOROUGH | Knows speaker must be played early for INTENT |
| P2 | Marcus | CLEAN | Knows corroboration bonus and tag contradiction system |
| P3 | Jen | FLAWLESS | Knows to spread conflicting tags across turns |
| P4 | David | CLEAN | Knows game continues after resistance breaks now (v2.5.2) |
| P5 | Aisha | CLEAN | Mapped full system, will optimize from turn 1 |

---

## Pass Criteria

| # | Criterion | Source |
|---|-----------|--------|
| 1 | At least 1 player loses Puzzle 1 | Difficulty fix (resistance 17) |
| 2 | At least 1 player wins Puzzle 3 | Skill ceiling reachable |
| 3 | Different outcomes on Puzzle 1 across players | Player variance |
| 4 | At least 1 player improves across puzzles (better badge on P3 than P1) | Learning transfer |
| 5 | At least 1 player says "yes" to "would you come back tomorrow?" | Retention signal |
| 6 | At least 1 player says "no" to "would you come back tomorrow?" | Honest variance |
| 7 | Graduated contradiction triggered at least once | Rule B active |
| 8 | Repetition risk triggered at least once | Rule A active |
| 9 | Resistance-break continuation used (player keeps playing after breaking resistance) | v2.5.2 fix validated |
| 10 | KOA "still have concerns" message shown at least once | New dialogue works |
| 11 | At least 1 player achieves THOROUGH or FLAWLESS on any puzzle | Badge depth |
| 12 | NPS >= 8 average | Improvement over playtest 2's 7.0 |
| 13 | At least 3/5 players say the 3-puzzle session was "just right" or "too short" | Session length |

**Pass threshold:** 10/13 minimum. Criteria 1, 2, 5 are hard requirements.

---

## Execution

1. Same persona files from playtest 2 (personas carry forward)
2. Each agent plays 3 puzzles via CLI, think-aloud narrated
3. Between puzzles: retention question logged
4. After Puzzle 3: full survey
5. Logs: `playtest-3/logs/{name}-puzzle{1,2,3}.log` + `{name}-survey.md`
6. Compile results into `playtest-3/results.md`
