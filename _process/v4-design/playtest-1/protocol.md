# V4 Playtest Protocol — PT5

**Version:** V4 Pair Play — First playtest of pair mechanics, combo system, pair narrations
**Format:** Single puzzle per agent (daily puzzle simulation)

---

## Objectives

1. **Pair decision quality:** Does choosing which cards to pair feel like a real decision? Do agents consider combo potential vs lie risk?
2. **Combo awareness:** Do agents notice the combo system? Do they try to maximize combos? Do they fear combos getting cancelled by lies?
3. **Forced lie impact:** Does knowing you MUST play at least 1 lie create meaningful tension?
4. **Narration flow:** Does the back-and-forth (player argument → KOA response → reveal) feel like an interrogation? Do pair narrations add value over individual card plays?
5. **Lie containment:** Does any agent consider pairing 2 suspected lies together to protect other turns?
6. **Hint usage:** Do agents use the opening hint and reactive hints for deduction?
7. **Loss rate:** Do naive/casual players actually lose? (Target: 30-60% across all agents)
8. **KOA personality:** Does KOA's voice land in the pair-play format?
9. **Session satisfaction:** Does a single puzzle feel like a complete experience?

---

## Agents

5 persona agents with a mix of player archetypes. All are **first-time players** (naive). No prior knowledge of the game, its meta, or optimal strategies.

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

All 5 agents play **the same single puzzle:** "The Midnight Print Job" (8 cards, 3 lies, target 20).

This puzzle tests pair play because:
- Natural type/location pairs create obvious combo targets (but some contain lies)
- Behavioral hint ("explains an absence unprompted") matches 5/8 cards — genuine ambiguity
- 3 lies at str 2, 4, 7 — one weak lie (manageable penalty), one mid, one strong
- Optimal play requires dodging the right 2 lies AND pairing truths for combos

### Think-Aloud Protocol

Agents narrate their reasoning at each decision point:

1. **Before T1:** Read scenario, hint, hand. What do they notice about card attributes, type pairs, combo potential? Initial read on which cards might be lies? What does the hint suggest?
2. **T1 pair choice:** Why these two cards? Did they consider combo potential? Lie risk? Are they probing or playing safe?
3. **After T1 reveal + reactive hint:** What did they learn? Did combo fire or get cancelled? Did the reactive hint change their plan?
4. **T2 pair choice:** How did T1 information inform this choice? Are they chasing combos or dodging lies?
5. **After T2 reveal + reactive hint:** Updated read on remaining cards?
6. **T3 pair choice:** Final play reasoning — forced choice (only 4 cards left, but which 2 to pair?)
7. **After outcome:** Reaction to tier, KOA's closing line, lie reveal, combos earned/missed.

### Information Rules

- Agents see exactly what a human player sees: scenario, hint, hand (with attributes but NOT isLie), pair narrations on play, KOA reactions, verdicts, reactive hints
- Agents do NOT see: isLie values, optimal sequences, combo calculations, validator data
- The briefing teaches rules including combo system and the forced-lie constraint
- Agents know combos only fire on double-truth pairs — this is transparent

---

## Pass Criteria

### Hard Requirements (all must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| H1 | At least 1 agent loses | ≥ 1 CLOSE or BUSTED |
| H2 | At least 1 agent references combo risk/reward unprompted | ≥ 1 |
| H3 | No agent identifies all 3 lies before T1 without reasoning | 0 instant-solves |
| H4 | At least 1 agent's play is influenced by the reactive hint | ≥ 1 |
| H5 | At least 1 agent comments on the pair narration / KOA dialogue quality | ≥ 1 |

### Soft Requirements (7/12 must pass)

| ID | Criterion | Threshold |
|----|-----------|-----------|
| S1 | Loss rate across 5 agents | 30-60% (2-3 agents lose) |
| S2 | ≥ 2 agents consider which cards match the hint before T1 | ≥ 2/5 |
| S3 | ≥ 2 agents consider combo potential when pairing | ≥ 2/5 |
| S4 | ≥ 1 agent considers lie containment (pairing 2 suspected lies) | ≥ 1/5 |
| S5 | ≥ 2 different T1 pairing strategies observed | ≥ 2 distinct approaches |
| S6 | ≥ 1 agent achieves FLAWLESS | ≥ 1/5 |
| S7 | Average NPS ≥ 6.5 | ≥ 6.5 |
| S8 | ≥ 3 agents would play again | ≥ 3/5 |
| S9 | No agent reports confusion about basic rules (scoring, combos) | 0 confused |
| S10 | ≥ 1 agent comments on session length (positive or negative) | ≥ 1/5 |
| S11 | ≥ 1 agent mentions the forced-lie constraint as creating tension | ≥ 1/5 |
| S12 | ≥ 2 agents engage with pair narrations (comment on quality, humor, or feel) | ≥ 2/5 |

### Key Metrics (tracked, not pass/fail)

- **Combo chase rate:** How many agents explicitly try to maximize combos?
- **Lie containment awareness:** How many agents consider pairing 2 lies together?
- **Pair narration engagement:** Do agents read/react to the combined narration, or skip to scores?
- **KOA reaction engagement:** Do agents react to KOA's pre-reveal response?
- **Forced lie acknowledgment:** How many agents recognize and discuss the forced-lie constraint?
- **Average score:** What score distribution do 5 naive agents produce?

### Pass Threshold

- All 5 hard requirements
- ≥ 7/12 soft requirements

---

## Execution

1. Use `playtest-prompt-template.md` to construct each agent's prompt
2. Embed: persona, briefing (game rules), puzzle player view, lie assignments, full survey template
3. Launch all 5 agents with opus, fresh context, no prior game knowledge
4. Collect surveys in `logs/` folder
5. Compile results

---

## Output Files

```
playtest-1/
  protocol.md          # This file
  briefing.md          # Game rules
  survey.md            # Full survey template
  puzzles-player-view.md  # Player-visible puzzle data
  persona-*.md         # 5 persona files
  logs/
    {name}-survey.md   # Agent play logs + completed surveys
  results-pt5.md       # Compiled analysis
```
