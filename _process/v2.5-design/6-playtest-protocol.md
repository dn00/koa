# V2.5 Playtest Protocol

Reusable strategy for agent-based playtesting of V2.5 puzzles.

---

## Goal

Test whether the game **teaches through play** — not whether agents can solve puzzles when told how. We measure: onboarding clarity, feedback loop effectiveness, skill progression, KOA personality impact, and fun.

---

## Knowledge Tiers (Skill Emulation)

Real skill = accumulated knowledge from play. We emulate this by controlling what the agent knows before playing.

| Tier | Label | Knows | Emulates |
|------|-------|-------|----------|
| T1 | Novice | Rules only (briefing doc) | Day 1 player |
| T2 | Casual | Rules + "cards can conflict with each other" | Week 1 player |
| T3 | Experienced | Rules + all mechanics (contradictions, repetition, source diversity) but NOT the puzzle solution | Month 1 player |

**Important:** No tier ever knows the optimal path, which cards to avoid, or what the "trick" is. We test discovery, not execution.

---

## Agent Personas

Each persona has a personality that affects decision-making, independent of knowledge tier.

| Persona | Behavior | Maps to |
|---------|----------|---------|
| Cautious | Risk-averse. Prefers low-risk cards. Reads all feedback carefully. Hesitates on high-power/high-risk cards. | Careful thinker |
| Impulsive | Plays fast. Picks highest power. Doesn't dwell on feedback. Treats it like an action game. | Casual mobile player |
| Analytical | Tries to deduce patterns. Takes mental notes. Adjusts strategy based on observed rules. | Puzzle enthusiast |

---

## Run Structure

Each persona plays **3 runs** of the same puzzle, sequentially.

| Run | Knowledge | Purpose |
|-----|-----------|---------|
| 1 | Tier-appropriate briefing only | Blind play. Tests onboarding, first impressions. |
| 2 | Briefing + memory of Run 1 outcome | Adaptation. Did feedback teach anything? |
| 3 | Briefing + memory of Runs 1-2 | Mastery curve. Can they improve? |

**Between runs:** Agent is told "Play again. You remember what happened last time."
**After all 3 runs:** Agent reads the post-game survey and responds.

---

## Test Matrix

Full test = 3 personas × 3 knowledge tiers × 3 runs = 27 playthroughs.

For quick validation, use the **core matrix** (9 playthroughs):

| | Novice (T1) | Casual (T2) | Experienced (T3) |
|---|---|---|---|
| Cautious | ✓ (3 runs) | | |
| Impulsive | | ✓ (3 runs) | |
| Analytical | | | ✓ (3 runs) |

This tests: worst case (impulsive novice-level knowledge), best case (analytical expert-level knowledge), and middle ground.

For full validation, run all 27.

---

## 10 Pass Criteria

| # | Criterion | Source | When to check |
|---|-----------|--------|---------------|
| 1 | Impulsive T1 Run 1 loses | MI-2 (naive loses) | Run 1 |
| 2 | Analytical T3 Run 3 wins | P5 (depth without punishing) | Run 3 |
| 3 | Analytical T3 scrutiny ≤ 3 | Skill ceiling exists | Run 3 |
| 4 | Impulsive and Analytical reach different outcomes on Run 1 | P3 (counter-intuitive optimal) | Run 1 |
| 5 | KOA dialogue differs across runs of same persona | Replayability | All runs |
| 6 | At least 1 agent triggers graduated contradiction | Rule B fires | Any run |
| 7 | At least 1 agent triggers repetition risk | Rule A fires | Any run |
| 8 | At least 1 agent changes plan mid-game based on feedback | P2 (irreversible + info) | Run 2+ |
| 9 | At least 1 run where agent expresses uncertainty about what to play | §1 decision depth | Any run |
| 10 | KOA tone escalates across turns within a single run | §3 emotional arc | Any run |

**Pass threshold:** 8/10 minimum. Criteria 1, 2, 6, 7 are hard requirements.

---

## Execution Steps

1. Create briefing docs per tier (T1, T2, T3)
2. Spawn agent with: persona description + tier briefing + "play the game at this path"
3. Agent plays 3 sequential runs via CLI (`scripts/play-v2.5.ts`)
4. After Run 3, agent reads `playtest-survey.md` and writes responses
5. Collect all transcripts + survey responses
6. Score against 10 criteria

---

## Post-Test Analysis

Beyond pass/fail, look for:

- **Learning curve shape:** Did Run 2 improve over Run 1? Run 3 over Run 2?
- **Surprise moments:** Did any agent react to KOA dialogue unexpectedly?
- **Strategy convergence:** Do all personas converge on the same strategy by Run 3? (Bad if yes — means only one viable path)
- **Fun signals:** Survey Q4 (enjoyment) and Q5 (replay desire) scores
- **Failure modes:** What confused agents? This predicts what will confuse humans.

---

## When to Re-Run

- After any change to turn processor logic
- After adding a new puzzle
- After changing KOA dialogue system
- After changing corroboration/contradiction rates
- Before any engine-core port
