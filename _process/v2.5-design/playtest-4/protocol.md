# V2.5 Playtest 4 — Protocol

Post v2.5.3. Tests P1 lossability (6-card hand), post-game scrutiny breakdown, KOA personality measurement, and session arc with better P3 difficulty.

---

## Changes from Playtest 3

1. **Last Slice reduced to 6 cards** — microwave removed. Safe-path margin now -7 (can't win without risk). Should produce first-contact losses.
2. **Post-game scrutiny breakdown** — itemized per-turn breakdown shown after every game. Tests if transparency improves learning and satisfaction.
3. **Missing Remote replaces Shampoo Thief as Puzzle 3** — TIGHT MARGINS archetype instead of COUNTER-HEAVY. Punishes the "just pair safe tags" strategy players learn from P1/P2.
4. **KOA-focused survey** — 10 new KOA-specific questions (K1-K10) measuring personality, humor, influence, memorability.
5. **Same 5 personas** from playtest 3 for direct comparison.

---

## Puzzle Sequence

| # | Puzzle | Trap Archetype | Resistance | Cards | Why This Order |
|---|--------|---------------|------------|-------|----------------|
| 1 | The Last Slice | POWER TRAP | 17 | 6 | phone_gps decoy. 6-card hand = tighter margins. Tests first-contact loss. |
| 2 | The Thermostat War | CONVERGENCE TRAP | 14 | 6 | AWAY trap locks out HOME cards. Tests learning transfer from P1's tag conflict lesson. |
| 3 | The Missing Remote | SEQUENCE TRAP | 16 | 6 | ACTIVE/IDLE axis + contested wifi_log. Must sequence refute before high-power play. Hardest puzzle. |

**No two consecutive puzzles share a trap type** (per archetype spec §Session Sequencing Rules).

---

## Run Structure

Each puzzle is played ONCE. No replays.

| Puzzle | Trigger | After Playing |
|--------|---------|---------------|
| 1 (Last Slice) | Mandatory | Ask: "Would you come back tomorrow for Puzzle 2?" Log answer. |
| 2 (Thermostat War) | Immediate | Ask: "Was this worth coming back for?" + "Would you come back for Puzzle 3?" Log answers. |
| 3 (Missing Remote) | Immediate | Full survey (with KOA questions). |

**Think-aloud protocol** same as playtest 3.

---

## Player Profiles

Same 5 personas. They retain mechanics knowledge from PT2+PT3 but NOT specific card knowledge from new puzzles.

| # | Name | PT3 Arc | Key Insight They Carry |
|---|------|---------|------------------------|
| P1 | Sarah | CLEAN → LOSS → FLAWLESS | Knows tag conflicts cause scrutiny spikes. Lost to phone_gps AWAY trap in PT3. |
| P2 | Marcus | CLEAN → THOROUGH → FLAWLESS | Full system model. Knows corroboration, repetition risk, badge criteria. |
| P3 | Jen | THOROUGH → CLEAN → FLAWLESS | Knows to spread conflicting tags across turns. Strong sequencer. |
| P4 | David | CLEAN → LOSS → FLAWLESS | Lost to phone_gps in PT3. Knows about resistance-break continuation. |
| P5 | Aisha | THOROUGH → THOROUGH → FLAWLESS | Mapped full system. Concerned about depth ceiling. Will try to break P3. |

---

## Pass Criteria

| # | Criterion | Source |
|---|-----------|--------|
| 1 | **At least 1 player loses Puzzle 1** | 6-card hand fix (hard req) |
| 2 | At least 1 player wins Puzzle 3 | Skill ceiling reachable (hard req) |
| 3 | Different outcomes on Puzzle 1 across players | Player variance |
| 4 | At least 1 player improves across puzzles | Learning transfer |
| 5 | At least 1 "yes" to "would you come back tomorrow?" | Retention signal (hard req) |
| 6 | At least 1 "no" to "would you come back tomorrow?" | Honest variance |
| 7 | Graduated contradiction triggered at least once | Rule B active |
| 8 | Repetition risk triggered at least once | Rule A active |
| 9 | Post-game breakdown referenced in survey | Players noticed/used the breakdown |
| 10 | KOA personality questions yield non-uniform responses | KOA is perceived as character, not system |
| 11 | At least 1 player achieves THOROUGH or FLAWLESS | Badge depth |
| 12 | NPS >= 8 average | Target: viral territory |
| 13 | At least 3/5 say session length "just right" or "too short" | Session length |

**Pass threshold:** 10/13 minimum. Criteria 1, 2, 5 are hard requirements.

---

## New Measurement: KOA Personality

Survey includes K1-K10 (see `survey.md`). Key metrics:
- **K5 distribution:** Want >=3/5 choosing (a) "fun character" over (b) "neutral system"
- **K6 averages:** Funny >=4, Memorable >=4
- **K9 distribution:** Want >=3/5 reading "every word" or "most of it"
- **K1 hit rate:** At least 2/5 can quote a KOA line that made them smile

---

## Execution

1. Same persona profiles as playtest 3
2. Each agent plays 3 puzzles via CLI, think-aloud narrated
3. Between puzzles: retention question logged
4. After Puzzle 3: full survey (Parts 1-6 including KOA section)
5. Logs: `playtest-4/logs/{name}-puzzle{1,2,3}.log` + `{name}-survey.md`
6. Compile results into `playtest-4/results.md`
