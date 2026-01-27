# V2.5 Playtest 5 — Protocol

Post v2.5.4. Two-track test: first-contact lossability (naive agents × 3 puzzles) and depth ceiling (experienced agents × skeleton-breaker).

---

## Changes from Playtest 4

1. **Per-puzzle KOA dialogue** — unique win/loss lines per puzzle
2. **Block feedback transparency** — shows which tag conflict triggered a block
3. **Badge criteria hints** — post-game shows badge explanation
4. **New puzzle: The Loud Music** — skeleton-breaker archetype (pwr-1 refuter, dual contradiction axes, highest card proves nothing)

---

## Track A: First-Contact Lossability (NAIVE)

**Question:** Do players who know NOTHING about the system lose on first contact? And do they learn and recover across a 3-puzzle session?

5 fresh agents × 3 puzzles (Last Slice → Thermostat War → Missing Remote). Zero system knowledge — they know only what the briefing tells them. No information about tags, corroboration, contradictions, or optimal strategies.

| # | Name | Play Style |
|---|------|------------|
| N1 | Naive-Power | Gravitates toward high-power cards |
| N2 | Naive-Story | Picks thematically relevant evidence |
| N3 | Naive-Safe | Risk-averse, picks low-risk cards |
| N4 | Naive-Random | No consistent strategy, gut picks |
| N5 | Naive-Aggressive | Plays 2 cards every turn, rushes damage |

### Puzzle Sequence (Track A)

| # | Puzzle | Resistance | Cards | Why |
|---|--------|-----------|-------|-----|
| 1 | The Last Slice | 17 | 6 | First contact. Tests lossability. |
| 2 | The Thermostat War | 14 | 6 | Tests learning transfer from P1. |
| 3 | The Missing Remote | 16 | 6 | Tests accumulated learning. Hardest puzzle. |

### Pass Criteria (Track A)

| # | Criterion | Source |
|---|-----------|--------|
| A1 | **At least 2/5 naive agents lose Puzzle 1** | First-contact loss (hard req) |
| A2 | At least 1 naive agent wins Puzzle 1 | Winnable on first try |
| A3 | Different outcomes across agents | Player variance |
| A4 | At least 1 loss due to scrutiny | Scrutiny matters |
| A5 | At least 1 loss due to unaddressed concerns | Concerns matter |
| A6 | At least 1 agent improves P1 → P3 | Learning arc exists |
| A7 | At least 1 agent experiences loss → win arc | Emotional arc (NPS driver) |
| A8 | At least 1 "yes" to "would you come back?" | Retention |
| A9 | NPS variance across agents | Different play styles → different experience |

---

## Track B: Depth Ceiling (EXPERIENCED)

**Question:** Can experienced players who know the standard skeleton still win a puzzle designed to break that skeleton?

5 experienced agents × 1 puzzle (The Loud Music). Full system knowledge from PT2-PT4. They know tags, corroboration, contradictions, counter-refutation, badge tiers, and the standard skeleton (refute T1 → corroborate → manage penalties).

| # | Name | Key Knowledge |
|---|------|---------------|
| E1 | Sarah | Tag conflicts cause scrutiny. Lost to AWAY trap in PT3. Recovery arc. |
| E2 | Marcus | Full system model. Knows corroboration, repetition risk, badges. |
| E3 | Jen | Strong sequencer. Spreads conflicting tags across turns. |
| E4 | David | Knows resistance-break continuation. Flagged block opacity. |
| E5 | Aisha | Mapped full system. Concerned about depth ceiling. Will try to optimize. |

### Pass Criteria (Track B)

| # | Criterion | Source |
|---|-----------|--------|
| B1 | **At least 1/5 experienced agents loses The Loud Music** | Skeleton broken (hard req) |
| B2 | At least 1 experienced agent wins The Loud Music | Winnable with skill |
| B3 | No agent plays the standard skeleton (refute T1) | Skeleton doesn't work |
| B4 | At least 1 agent comments that this puzzle "felt different" | Variety perceived |
| B5 | Different strategies across agents | Multiple viable paths |

---

## Run Structure

### Track A (Naive)
Each puzzle played ONCE, sequentially. No replays.

| Puzzle | After Playing |
|--------|---------------|
| 1 (Last Slice) | Ask: "Would you come back tomorrow for Puzzle 2?" Log answer. |
| 2 (Thermostat War) | Ask: "Was this worth coming back for?" + "Would you come back for Puzzle 3?" |
| 3 (Missing Remote) | Full survey. |

Think-aloud protocol: narrate every decision.

### Track B (Experienced)
Single puzzle. Full survey after.

---

## Survey

Both tracks use the same full survey from PT4 (`playtest-4/survey.md`, Parts 1-6). Experienced agents answer Part 2 for 1 puzzle only.

---

## Execution

1. Track A: 5 naive agents play 3 puzzles via CLI with zero-knowledge briefing
2. Track B: 5 experienced agents play The Loud Music via CLI with full system knowledge
3. All agents narrate think-aloud
4. Logs: `playtest-5/logs/{name}-puzzle{1,2,3}.log` or `{name}-loudmusic.log`
5. Surveys: `playtest-5/logs/{name}-survey.md`
6. Compile results: `playtest-5/results.md`
