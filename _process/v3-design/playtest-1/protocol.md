# V3 Playtest 1 — Protocol

**Date:** 2026-01-27
**Version:** V3 "The Statement"
**Purpose:** Validate that the deduction mechanic produces genuine wins AND losses, that KOA's personality lands, and that hint interpretation creates meaningful strategy.

---

## Objectives

1. **Loss rate:** Do naive/casual players actually lose? (Target: 20-50% loss rate across all runs)
2. **Deduction signal:** Do players use the hint and reactive hints to inform T2/T3 choices?
3. **KOA personality:** Does KOA's voice land — do agents reference KOA's lines, find them funny/annoying/memorable?
4. **Narration immersion:** Does the player narration ("YOU: ...") add to the experience or feel like clutter?
5. **Difficulty curve:** Is P1 noticeably easier than P3?
6. **Replay motivation:** After losing, do players want to retry? After winning, do they want FLAWLESS?

---

## Agents

5 persona agents, each with a distinct play style and context. All are **first-time players** (naive). No one has seen V3 before.

| Persona | Age | Archetype | Play Context |
|---------|-----|-----------|-------------|
| Sarah | 28 | Casual/Social | Morning commute, 5 min |
| Marcus | 34 | Strategic/Analytical | Before bed, 15-20 min |
| Jen | 22 | Vibes/Personality | Boring lecture, half-attention |
| David | 41 | Veteran/Critical | Dentist waiting room, 10 min |
| Aisha | 30 | Competitive/Optimizer | Lunch break, deliberate evaluation |

---

## Structure

### Runs Per Agent

Each agent plays **all 3 puzzles in order** (P1 → P2 → P3), one run each. This tests:
- Learning curve across puzzles
- Whether P1 teaches the mechanic
- Whether P3 requires skills learned in P1/P2

### Think-Aloud Protocol

Agents narrate their reasoning at each decision point:

1. **Before T1:** Read the scenario, hint, and hand. What do they notice? What's their initial read on which cards might be lies?
2. **T1 choice:** Why this card? Are they probing, going safe, or playing by vibes?
3. **After T1 reveal + reactive hint:** What did they learn? Did the reactive hint change their plan?
4. **T2 choice:** How did T1 information inform this choice?
5. **After T2 reveal:** Updated read on remaining cards?
6. **T3 choice:** Final play reasoning — confident or gambling?
7. **After outcome:** Reaction to tier, KOA's closing line, lie reveal.

### Information Rules

- Agents see exactly what a human player sees: scenario, hint, hand (with attributes but NOT isLie), narration on play, verdict, reactive hint after T1
- Agents do NOT see: isLie values, optimal sequences, archetype labels, invariant data
- The briefing teaches rules only — not strategy

---

## Pass Criteria

### Hard Requirements (all must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| H1 | At least 1 agent loses P1 | ≥ 1 loss |
| H2 | At least 2 agents lose across all runs | ≥ 2 agents with ≥ 1 loss |
| H3 | At least 1 agent references KOA's personality unprompted | ≥ 1 |
| H4 | No agent solves P3 on first read without reasoning | 0 instant-solves |

### Soft Requirements (8/12 must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| S1 | Average loss rate across all 15 runs | 20-50% |
| S2 | P1 win rate > P3 win rate | Strict inequality |
| S3 | ≥ 3 agents change T2/T3 plan after reactive hint | ≥ 3/5 |
| S4 | ≥ 2 agents mention the hint in their reasoning | ≥ 2/5 |
| S5 | ≥ 1 agent achieves FLAWLESS on any puzzle | ≥ 1 |
| S6 | ≥ 1 agent gets BUSTED on any puzzle | ≥ 1 |
| S7 | Average NPS ≥ 7 | ≥ 7.0 |
| S8 | ≥ 3 agents would play again | ≥ 3/5 |
| S9 | ≥ 2 agents mention narration positively | ≥ 2/5 |
| S10 | ≥ 2 different strategies observed across agents | ≥ 2 distinct approaches |
| S11 | No agent reports confusion about basic rules | 0 confused |
| S12 | ≥ 1 agent explicitly tries to identify lies using hint | ≥ 1/5 |

### Pass Threshold

- All 4 hard requirements
- ≥ 8/12 soft requirements

---

## Execution

1. Create persona files (1 per agent)
2. Create briefing (game rules, NO strategy guidance)
3. Run each agent through P1 → P2 → P3 sequentially with think-aloud
4. After all 3 puzzles, agent fills out survey
5. Collect results in `logs/` folder
6. Compile results summary

---

## Output Files

```
playtest-1/
  protocol.md          # This file
  briefing.md          # Game rules briefing for agents
  survey.md            # Post-play survey template
  persona-sarah.md
  persona-marcus.md
  persona-jen.md
  persona-david.md
  persona-aisha.md
  logs/
    sarah-survey.md
    marcus-survey.md
    jen-survey.md
    david-survey.md
    aisha-survey.md
  results.md           # Compiled analysis
```
