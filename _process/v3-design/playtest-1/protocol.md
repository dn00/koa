# V3 Playtest Protocol

**Version:** V3 "The Statement" — Conditional Reactive Hints
**Format:** Single puzzle per agent (daily puzzle simulation)

---

## Objectives

1. **Probe-vs-protect:** Does T1 feel like a real decision? Do any agents consider probing (playing a hint-group card)?
2. **Vague hint impact:** When agents play safe T1, do they notice the reactive hint is unhelpful? Does it leave them guessing for T2/T3?
3. **Loss rate:** Do naive/casual players actually lose? (Target: 20-50% across all agents)
4. **Hint ambiguity:** Does the behavioral opening hint ("trying too hard to explain why nothing happened") create genuine uncertainty about which cards are lies?
5. **KOA personality:** Does KOA's voice land?
6. **Session satisfaction:** Does a single puzzle feel like a complete experience?

---

## Agents

5 persona agents with a mix of player archetypes and game expert roles. All are **first-time players** (naive). No prior knowledge of the game, its meta, or optimal strategies.

| Persona | Age | Archetype | Play Context |
|---------|-----|-----------|-------------|
| Kai | 37 | Game Designer / Balance Analyst | Evaluating as a fellow designer |
| Marcus | 34 | Strategic/Analytical | Before bed, 15-20 min |
| Rio | 26 | Puzzle Optimizer / Speedrunner | Full attention, solving optimally |
| David | 41 | Veteran/Critical | Dentist waiting room, 10 min |
| Aisha | 30 | Competitive/Optimizer | Lunch break, deliberate evaluation |

---

## Structure

### Puzzle

All 5 agents play **the same single puzzle:** "The Thermostat War" (P2, medium difficulty).

This puzzle tests the conditional hints fix because:
- Opening hint is behavioral ("trying too hard to explain why nothing happened") — not attribute-partitioning
- Multiple non-hint cards also plausibly match the hint (phone, hallway_cam, smartwatch)
- Safe T1 → vague hint. Risky T1 → specific hint. The tradeoff should be visible.

### Think-Aloud Protocol

Agents narrate their reasoning at each decision point:

1. **Before T1:** Read the scenario, hint, and hand. What do they notice? What's their initial read on which cards might be lies? Which cards match the hint description?
2. **T1 choice:** Why this card? Are they probing (hint group), going safe (outside hint group), or playing by vibes? Do they consider the information tradeoff?
3. **After T1 reveal + reactive hint:** What did they learn? Was the reactive hint helpful or vague? Did it change their plan for T2/T3?
4. **T2 choice:** How did T1 information inform this choice? Are they confident or guessing?
5. **After T2 reveal:** Updated read on remaining cards?
6. **T3 choice:** Final play reasoning — confident or gambling?
7. **After outcome:** Reaction to tier, KOA's closing line, lie reveal.

### Information Rules

- Agents see exactly what a human player sees: scenario, hint, hand (with attributes but NOT isLie), narration on play, verdict, reactive hint after T1
- Agents do NOT see: isLie values, optimal sequences, hint quality labels, invariant data
- The briefing teaches rules and hints at strategy — including that T1 choice affects what KOA reveals
- Agents ARE told (via briefing tips) that T1 choice determines hint quality — this is the transparent probe design

---

## Pass Criteria

### Hard Requirements (all must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| H1 | At least 1 agent loses | ≥ 1 CLOSE or BUSTED |
| H2 | At least 1 agent references KOA's personality unprompted | ≥ 1 |
| H3 | No agent identifies both lies before T1 without reasoning | 0 instant-solves |
| H4 | At least 1 agent's T2/T3 play is influenced by the reactive hint | ≥ 1 |

### Soft Requirements (6/10 must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| S1 | Loss rate across 5 agents | 20-60% (1-3 agents lose) |
| S2 | ≥ 2 agents consider which cards match the hint before T1 | ≥ 2/5 |
| S3 | ≥ 1 agent notices the reactive hint is vague/unhelpful (if they played safe) | ≥ 1/5 |
| S4 | ≥ 2 agents actually probe (play a hint-group card on T1) | ≥ 2/5 |
| S5 | ≥ 2 different T1 strategies observed across agents | ≥ 2 distinct approaches |
| S6 | ≥ 1 agent achieves FLAWLESS | ≥ 1/5 |
| S7 | Average NPS ≥ 6.5 | ≥ 6.5 |
| S8 | ≥ 3 agents would play again | ≥ 3/5 |
| S9 | No agent reports confusion about basic rules | 0 confused |
| S10 | ≥ 1 agent comments on the single-puzzle session length (positive or negative) | ≥ 1/5 |

### Key Metrics (not pass/fail, but tracked)

- **Probe rate:** How many agents play a hint-group card on T1? (Ideal: ≥ 1/5)
- **Vague hint awareness:** How many agents who played safe T1 note the reactive hint didn't help? (Ideal: ≥ 1)
- **Hint-matching breadth:** How many distinct cards do agents suspect from the opening hint? (Ideal: ≥ 3 across all agents — shows hint creates genuine ambiguity)
- **Session satisfaction:** Survey responses on whether single puzzle felt complete

### Pass Threshold

- All 4 hard requirements
- ≥ 6/10 soft requirements

---

## Execution

1. Use `playtest-prompt-template.md` to construct each agent's prompt
2. Embed: persona, briefing (game rules), P2 player view, P2 lie assignments, full survey template
3. Launch all 5 agents with opus 4.5, fresh context, no prior game knowledge
4. Collect surveys in `logs/` folder
5. Compile results

---

## Output Files

```
playtest-1/
  protocol.md          # This file
  briefing.md          # Game rules (session-agnostic)
  survey.md            # Full 9-part survey template
  persona-*.md         # 5 persona files
  logs/
    {name}-survey.md   # Agent play logs + completed surveys
  results.md           # Compiled analysis
```
