# V2.5 Playtest 2 — Protocol

Post v2.5.1 mechanics update. Builds on playtest-1 findings.

---

## Changes from Playtest 1

1. **Realistic personas** instead of archetypes. Each player has an age, job, gaming background, and real-world context (playing on a bus, before bed, etc.)
2. **Think-aloud protocol** — agents narrate their reasoning as they play
3. **Expanded survey** — Likert scales for quantitative analysis, game comparisons, emotional journey mapping, NPS
4. **v2.5.1 mechanics** — min-concerns gate, new badge tiers (WIN/CLEAN/THOROUGH/FLAWLESS)
5. **5 players × 3 runs** = 15 playthroughs (more player variety, same run depth)

---

## Why 5 Players Instead of 9

Playtest 1 used a 3×3 matrix (persona × knowledge tier). Key insight: the knowledge tier axis was less informative than the persona axis. T2 and T3 players converged on similar strategies. The real variance came from personality, not knowledge.

For playtest 2, all players start at **T2 (casual)** — they know rules + "cards can conflict." This mirrors a realistic onboarding: the tutorial tells you basics, you figure out the rest. The persona axis is expanded to 5 realistic profiles with more behavioral variance.

---

## Player Profiles

Each profile includes gaming background and a real-world play context, which affects attention, patience, and engagement style.

| # | Name | Age | Background | Context | Expected Behavior |
|---|------|-----|------------|---------|-------------------|
| P1 | Sarah | 28 | Wordle daily, Candy Crush | Morning commute, 5-min window | Plays quickly, wants to feel smart, shares results |
| P2 | Marcus | 34 | Board gamer, plays Wingspan/Gloomhaven | Winding down before bed | Reads everything, optimizes, enjoys systems |
| P3 | Jen | 22 | Mostly TikTok/YouTube, occasionally Among Us | Bored in lecture | Low attention, needs instant hook, skims text |
| P4 | David | 41 | Used to game (Zelda, FFX), now just phone games | Waiting room, killing time | Nostalgic for depth, impatient with tutorials |
| P5 | Aisha | 30 | Competitive (chess.com, Hearthstone) | Deliberate play session | Min-maxes, wants to master, finds the meta |

---

## Run Structure

Conditional replay — measures intrinsic motivation, not forced repetition.

| Run | Trigger | Purpose |
|-----|---------|---------|
| 1 | Mandatory | First contact. Does the game hook them? |
| 2 | Loss → auto-retry. Win → ask "Would you play again for a better badge?" Log answer, then play regardless. | Learning + voluntary replay signal. |
| 3 | Same ask. If player said "no" to replay twice, STOP — log the refusal as retention data. Otherwise play. | Mastery + natural quit point. |

**Key:** The quit/continue decision IS the retention data. A player who stops at 2 runs is telling us something. Log every "would you replay?" answer.

**Think-aloud protocol.** Between each card selection, the player narrates what they're thinking. This gets logged. Format:

```
[THINKING] I see phone_gps has power 5 but risk 2... that feels risky.
           But it's the strongest card. Hmm...
[PLAY] fitbit, security_cam
[RESULT] ...game output...
[REACTION] Oh nice, corroboration bonus! The tag matching thing works.
```

---

## Survey Design

Three parts:
1. **Quick reactions** (right after Run 3, before deep reflection)
2. **Detailed assessment** (structured questions with Likert scales)
3. **Comparisons and open-ended** (game comparisons, memorable moments)

See `survey.md` for full survey.

---

## Pass Criteria (updated from playtest 1)

Same 10 criteria + 3 new ones from v2.5.1 changes:

| # | Criterion | Source |
|---|-----------|--------|
| 1 | At least 1 player loses Run 1 | MI-2 |
| 2 | At least 1 player wins Run 3 | P5 |
| 3 | Best Run 3 scrutiny ≤ 3 | Skill ceiling |
| 4 | Different outcomes on Run 1 across players | P3 |
| 5 | KOA dialogue differs across runs | Replayability |
| 6 | At least 1 graduated contradiction triggered | Rule B |
| 7 | At least 1 repetition risk triggered | Rule A |
| 8 | At least 1 player changes strategy between runs | P2 |
| 9 | At least 1 think-aloud shows genuine uncertainty | Decision depth |
| 10 | KOA tone varies within a single run | Emotional arc |
| 11 | At least 1 player achieves THOROUGH or FLAWLESS | v2.5.1 badge tiers |
| 12 | At least 1 player fails the min-concerns gate | v2.5.1 concerns gate |
| 13 | NPS ≥ 7 average across players | Product-market fit signal |

**Pass threshold:** 10/13 minimum. Criteria 1, 2, 6, 7 are hard requirements.

---

## Execution

1. Create persona files (persona-p1.md through persona-p5.md)
2. All players use same briefing (T2 level)
3. Each agent plays 3 runs via CLI, think-aloud narrated
4. After Run 3, agent completes the survey
5. Logs: `playtest-2/logs/{name}-run{1,2,3}.log` + `{name}-survey.md`
6. Compile results into `playtest-2/results.md`
