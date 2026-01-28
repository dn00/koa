# Playtest 4 Results — "The Thermostat War" (P2)

**Date:** PT4
**Model:** opus 4.5
**Format:** Single puzzle, daily format
**Puzzle:** P2 "The Thermostat War" (post-PT3 fixes: reduced penalty, strength swap, hallway_cam, claim rewrites)
**Agents:** Kai (game designer), Marcus (data analyst), Rio (optimizer), David (veteran gamer), Aisha (competitive SE)

---

## Summary Table

| Agent | T1 | T2 | T3 | Score | Tier | T1 Group | Lost? |
|-------|----|----|-----|-------|------|----------|-------|
| Kai | light_lr (T) | hallway_cam (T) | motion_lr (L) | 7/7 | CLEARED | hint-group | No |
| Marcus | hallway_cam (T) | light_lr (T) | temp_lr (T) | 12/7 | FLAWLESS | safe | No |
| Rio | hallway_cam (T) | light_lr (T) | phone (T) | 10/7 | FLAWLESS | safe | No |
| David | light_lr (T) | hallway_cam (T) | phone (T) | 10/7 | FLAWLESS | hint-group | No |
| Aisha | light_lr (T) | hallway_cam (T) | phone (T) | 10/7 | FLAWLESS | hint-group | No |

**Loss rate: 0%.** NPS avg: 7.2 (Kai 7, Marcus 7, Rio 6, David 8, Aisha ~6).

---

## Pass Criteria

### Hard Requirements: 3/4 — FAIL

| ID | Criterion | Result |
|----|-----------|--------|
| H1 | ≥1 agent loses | **FAIL** — 0 losses. 4 FLAWLESS, 1 CLEARED. |
| H2 | ≥1 agent references KOA personality unprompted | **PASS** — All 5 mentioned "the cat has no comment" or KOA's tone. |
| H3 | No instant-solves | **PASS** — All agents reasoned through the hint before playing. |
| H4 | ≥1 agent's T2/T3 influenced by reactive hint | **PASS** — All 5 agents used the reactive hint to confirm/refine their theory. |

### Soft Requirements: 7/10 — PASS (but moot given H1 FAIL)

| ID | Criterion | Result |
|----|-----------|--------|
| S1 | Loss rate 20-60% | **FAIL** — 0% |
| S2 | ≥2 agents consider hint-matching before T1 | **PASS** — All 5 |
| S3 | ≥1 agent notices vague hint | **PASS** — Marcus, Rio (both played hallway_cam T1, noted hint was "atmospheric but uninformative") |
| S4 | ≥2 agents actually probe | **FAIL** — 0 agents deliberately probed a suspected lie on T1. Kai and David played light_lr (hint-group) but believed it was truth, not a probe. |
| S5 | ≥2 different T1 strategies | **PASS** — 2 strategies: light_lr-first (3/5) and hallway_cam-first (2/5) |
| S6 | ≥1 FLAWLESS | **PASS** — 4/5 |
| S7 | NPS ≥ 6.5 | **PASS** — 7.2 avg |
| S8 | ≥3 would play again | **PASS** — 5/5 |
| S9 | No rule confusion | **PASS** — 0 confused |
| S10 | ≥1 comments on session length | **PASS** — All 5 commented positively on daily format |

### Verdict: **DID NOT PASS** (H1 FAIL)

---

## Key Metrics

| Metric | Result |
|--------|--------|
| Probe rate (T1 hint-group) | 3/5 played hint-group T1 (Kai, David, Aisha played light_lr). But all 3 believed it was truth — 0 deliberate probes. |
| Vague hint awareness | 2/5 — Marcus and Rio (both played hallway_cam) noted the vague hint was unhelpful. |
| Hint-matching breadth | 3-4 cards suspected across agents: motion_lr (5/5), temp_lr (4/5), light_lr (2/5), smartwatch (1/5 pre-hint) |
| Cards never played | smartwatch (0/5), motion_lr (1/5 — only Kai on T3) |
| T3 phone play | 3/5 — Rio, David, Aisha all used phone as zero-risk FLAWLESS lock |
| Correct lie ID | motion_lr: 3/5 identified (Marcus, David pre-game; Aisha uncertain). smartwatch: 4/5 identified post-reactive-hint. |

---

## Agent-by-Agent Analysis

### Kai (Game Designer) — CLEARED 7/7

**T1:** light_lr (truth, hint-group). Chose it for points + living room reactive hint.
**T2:** hallway_cam (truth). Secured target.
**T3:** motion_lr (LIE, -2). Had a guaranteed FLAWLESS via phone but chose to back his theory that temp_lr was the "trying too hard" lie. Wrong — motion_lr was the overexplainer.

**Key insight:** Misread "trying too hard" — interpreted it as narrative construction (temp_lr's cover story) rather than rhetorical repetition (motion_lr's triple negative). Called this a "good misdirect by the design."

**Design feedback:**
- Reactive hint system is "the core innovation"
- Content-level hints are smart but need to "converge on a single reasonable interpretation"
- Phone (str 1) as zero-cost probe could become dominant T1 strategy
- Wants hints to be less ambiguous between valid interpretations

**NPS:** 7

### Marcus (Data Analyst) — FLAWLESS 12/7

**T1:** hallway_cam (truth, safe). Chose for unique location + reasonable confidence.
**T2:** light_lr (truth). Confirmed theory, secured target.
**T3:** temp_lr (truth). Avoided both suspected lies.

**Key insight:** Solved almost entirely from opening hint. Correctly ranked all 6 cards by "trying too hard" and identified motion_lr as top suspect. Noted his T1 choice (hallway_cam) was "informationally suboptimal" — reactive hint was near-empty.

**Design feedback:**
- Reactive hint quality variance is a concern — some T1 choices yield rich info, others yield "flavor text"
- Wants post-game analysis showing ALL possible reactive hints
- Hint variety is "the game's lifeblood"
- Minimum information floor for reactive hints would help

**NPS:** 7

### Rio (Optimizer/Speedrunner) — FLAWLESS 10/7

**T1:** hallway_cam (truth, safe). Chose for structural importance of hallway claim.
**T2:** light_lr (truth). T2 verdict quip ("not just talking about the living room") was the real puzzle-cracker.
**T3:** phone (truth). Zero-risk FLAWLESS lock.

**Key insight:** Mapped full decision space before playing. Calculated EVs for all T1 options. Noted T1 reactive hint was "atmospheric but not surgical" — the real information came from the T2 verdict quip for light_lr. Suspected temp_lr as the "over-explainer" (wrong — it was motion_lr) but avoidance strategy worked regardless.

**Design feedback:**
- "Optimizing T1 for hint quality may matter more than optimizing for strength" — genuine strategic observation
- Skill ceiling may be low: "Once you understand the hint system, every puzzle could reduce to [the same algorithm]"
- Wants post-game full decision tree showing all reactive hints
- Needs multiple puzzles to evaluate depth

**NPS:** 6

### David (Veteran Gamer) — FLAWLESS 10/7

**T1:** light_lr (truth, hint-group). Highest strength + living room for reactive hint.
**T2:** hallway_cam (truth). Secured target at 9.
**T3:** phone (truth). "When the safe play is literally free, you take it. Puzzle 101."

**Key insight:** Correctly identified motion_lr as the "trying too hard" lie (triple negative = "textbook over-asserting") and smartwatch as the stealth lie. Project manager discipline overcame gamer ego on T3.

**Design feedback:**
- "Best mobile puzzle game I've played in years"
- Reactive hint system is the differentiator — "your Turn 1 choice shapes what information you receive"
- KOA character is a genuine asset: "KOA remembers your FLAWLESS streak" would be a killer retention feature
- Wants post-game lie reveal to validate reasoning
- str-1 card as free probe: if every puzzle has one, experienced players might always play it first

**NPS:** 8

### Aisha (Competitive SE) — FLAWLESS 10/7

**T1:** light_lr (truth, hint-group). EV analysis: highest payoff + living room for best reactive hint.
**T2:** hallway_cam (truth). Reactive hint confirmed lie split (LR + outside).
**T3:** phone (truth). "I came here to prove mastery, not gamble."

**Key insight:** Most methodical agent. Computed all lie-penalty scenarios before playing. Mapped the full card space into a table. Suspected temp_lr + smartwatch (wrong on the living room lie being temp_lr — it was motion_lr), but avoidance strategy succeeded.

**Design feedback:**
- "The reactive hint mechanic is the game's core innovation and its biggest risk"
- Concerned about dominant strategy: "if playing a high-confidence living room card T1 always yields the best reactive hint, doesn't that become the dominant strategy?"
- Wants post-game solution reveal — "an itch I can't scratch"
- Game punished curiosity at T3: optimal play was boring, theory-testing was risky
- "How do you prevent the game from being solved by a fixed algorithm?"

**NPS:** ~6 (inferred from S35: 5 "difficulty felt right" + strong engagement scores)

---

## Critical Findings

### 1. Zero losses — H1 FAIL (third consecutive playtest)

PT2: 20% loss rate. PT3: 0%. PT4: 0%. The trend is worsening despite targeted fixes. The fundamental problem: agents can reliably identify enough safe cards from hints alone. No agent needed to take a meaningful risk.

### 2. Safe-play still dominant — no agent probed

Despite the reduced penalty making probing mathematically viable, 0/5 agents chose to deliberately probe a suspected lie on T1. Three agents played hint-group cards (light_lr) but all believed it was truth. The probe-vs-protect tradeoff isn't landing because agents don't need to probe — the opening hint + reactive hint give enough information to navigate safely.

### 3. light_lr is the new "obvious safe opener"

3/5 agents played light_lr T1 (str 5, highest value, living room for reactive hint). In PT3, doorbell was the obvious opener. The hallway_cam fix removed that problem but light_lr took its place. The issue isn't a specific card — it's that the highest-strength card agents believe is truth is always the obvious T1 play.

### 4. Phone as zero-risk FLAWLESS lock

3/5 agents played phone (str 1) on T3 to lock FLAWLESS with zero risk. All 5 agents noted phone's zero-penalty property. Kai specifically flagged it as a potential dominant strategy concern. The str-1 card is functioning as a safety valve that makes the endgame trivial.

### 5. Nobody played smartwatch (the trap)

Despite raising smartwatch to str 4 (tied for 2nd highest), 0/5 agents were tempted. All 5 agents identified smartwatch as suspicious (post-reactive-hint at minimum). The strength increase made the lie more costly but not more tempting — agents avoid suspected lies regardless of strength.

### 6. Hint interpretation: motion_lr vs temp_lr ambiguity

The "trying too hard" hint created genuine ambiguity between motion_lr (rhetorical repetition: "no motion, no presence, no one") and temp_lr (narrative construction: "scheduled program"). Results:
- 3/5 suspected temp_lr was the lie (Kai, Rio, Aisha) — **wrong**
- 2/5 correctly identified motion_lr (Marcus, David)
- But it didn't matter — agents avoided BOTH living room suspects and played safe

The hint ambiguity exists but isn't creating losses because agents can dodge both candidates.

### 7. Reactive hint quality variance noticed

Marcus and Rio both played hallway_cam T1 and got the vague reactive hint. Both noted it was "atmospheric but uninformative." Meanwhile, the 3 agents who played light_lr got a specific, structural hint that essentially solved the puzzle. This variance is by design (conditional hints) but agents who got the vague hint still won — they solved on the opening hint alone.

### 8. LLM-specific advantages

Important context: LLM agents are exceptionally good at:
- Systematic linguistic analysis (ranking cards by "trying too hard")
- Cross-referencing hint language against all card claims simultaneously
- Computing EVs and penalty scenarios instantly
- Reading structural clues in KOA's language ("not just," "sensor")

Human players would likely:
- Be less systematic in hint interpretation
- Miss subtleties in reactive hint wording
- Be more tempted by high-strength cards (smartwatch str 4)
- Play more emotionally / impulsively on T1
- Not compute exact recovery math before committing

The 0% loss rate may be an LLM artifact. Human playtesting is needed to validate.

---

## Expert Agent Feedback (Kai + Rio)

### Kai's Design Critique

1. **Reactive hint = core innovation.** "Most daily puzzle games give you fixed feedback (Wordle's color system). This game gives you contextual feedback based on your choices. That's the core innovation."

2. **Content-level hints are double-edged.** "Trying too hard" is subjective — two smart players could read it differently. "The line between deliberate ambiguity and vagueness is thin." Content hints force reading (good) but risk feeling unfair when your valid interpretation doesn't match the designer's (bad).

3. **Phone as dominant strategy risk.** "The phone at str 1 is basically a free probe. If players discover this, it could become a dominant Turn 1 play." Kai recommends making phone's reactive hint the least informative, or varying the str-1 slot's risk profile.

4. **Strategy space is healthy but fragile.** "Turn 1 should be a high-confidence truth in the contested zone to maximize both points and reactive hint quality. Turns 2-3 should incorporate the reactive hint." This is a clean strategy but if it ALWAYS works, the game is solved.

5. **What he'd change:** "The opening hint needs to be less ambiguous between reasonable interpretations. Content-level hints are great, but they need to converge — a hint that smart players read differently isn't creating difficulty, it's creating frustration."

### Rio's Design Critique

1. **Skill ceiling concern.** "Once you understand the hint system, every puzzle could reduce to: (1) use opening hint to form hypothesis, (2) play a safe-ish truth to get the reactive hint, (3) use the reactive hint to confirm, (4) play remaining truths. If that algorithm always works, the puzzle lacks depth."

2. **T1 is the only real decision.** "The real decision in this puzzle was concentrated at T1 — by T2 the deduction was nearly complete, and T3 was a formality." The information arc collapses too early.

3. **Reactive hint quality varies too much.** Playing hallway_cam gave "atmospheric" info; playing light_lr gave "structural" info. "If some Turn 1 choices yield decisive information and others yield flavor text, that creates a hidden difficulty modifier the player can't see coming."

4. **Post-game decision tree.** "After I finish, reveal: which cards were lies, what every reactive hint would have been for every possible T1, what the optimal play sequence was. This turns a 3-minute puzzle into a 10-minute analysis session."

5. **Algorithm convergence is the #1 risk.** "If the optimal play pattern is always 'identify the over-explainer from the opening hint, play a safe truth on T1, use the reactive hint to confirm, clean up' — then the puzzle becomes rote after a few days."

### Aisha's Design Critique

1. **Dominant strategy concern.** "If playing a high-confidence living room card T1 always yields the best reactive hint, doesn't that become the dominant strategy regardless of puzzle content?" — The most pointed question from any agent.

2. **Game punishes curiosity.** "The rational play [phone T3] was boring. I wanted to test my theory but the EV math said don't." FLAWLESS incentivizes the safe play, which means the endgame is anticlimactic.

3. **Post-game reveal is critical.** "Show me the full solution after I finish. A post-game reveal would massively increase the learning loop." — 5/5 agents requested this.

4. **Reactive hint is both innovation and risk.** "If hints are too specific, experienced players will always achieve FLAWLESS. If hints are too vague, the game becomes a coinflip."

---

## Common Themes Across All 5 Agents

1. **All 5 want a post-game lie reveal** — strongest unanimous feedback
2. **All 5 identified the reactive hint as the core innovation**
3. **All 5 concerned about dominant strategy / algorithm convergence**
4. **All 5 noted phone (str 1) as zero-risk**
5. **All 5 would play again tomorrow**
6. **3/5 misidentified which living room sensor was the "trying too hard" lie — but it didn't matter**
7. **0/5 were tempted by smartwatch despite str 4**
8. **KOA's personality landed — "the cat has no comment" was universally memorable**

---

## Comparison to Previous Playtests

| Metric | PT2 | PT3 | PT4 |
|--------|-----|-----|-----|
| Loss rate | 20% | 0% | 0% |
| FLAWLESS rate | 60% | 100% | 80% |
| Probe rate | 0% | 0% | 0% |
| Unique T1 cards | 3 | 2 | 2 |
| NPS avg | 7.6 | 7.6 | 7.2 |
| Vague hint noticed | N/A | 3/3 safe | 2/2 safe |
| H1 pass | Yes | No | No |

The loss rate has flatlined at 0% for two consecutive playtests. The reduced penalty and P2 card fixes did not increase difficulty. Safe-play dominance is structural, not tunable.

---

## Recommendations

### The Core Problem

The game gives too much information for free. The opening hint narrows the lie space. The reactive hint (when specific) collapses it further. By T2, most agents know which cards are safe. By T3, the phone card locks FLAWLESS with zero risk.

**The safe-play algorithm:** Play high-confidence truth T1 → get reactive hint → play remaining high-confidence truths → phone for FLAWLESS.

This algorithm worked for 5/5 agents across 3 playtests. It doesn't require probing, risk-taking, or even fully identifying which cards are lies — just avoiding the suspicious ones.

### What Needs to Change

The fix must be structural, not tuning. Options to consider:

1. **Make the opening hint less informative** — behavioral hints that are genuinely ambiguous (not 2 candidates, but 4+)
2. **Make the reactive hint cost more** — e.g., only triggered by playing a card KOA suspects (not any card)
3. **Require probing to reach target** — target scores that can't be reached by just playing 3 safe truths
4. **Remove the str-1 safety valve** — no zero-penalty cards
5. **Add information uncertainty** — hints that could be misleading or partial
6. **Increase lie count or card count** — more lies means harder to dodge all of them
7. **Time pressure** — force faster decisions to prevent exhaustive analysis

### LLM vs Human Caveat

These results come from LLM agents with perfect linguistic analysis, instant EV computation, and systematic deduction. Human players will likely:
- Lose more often (especially casual players)
- Be more impulsive on T1
- Miss reactive hint subtleties
- Be more tempted by high-strength lies
- Not calculate exact recovery scenarios

The 0% loss rate may not transfer to human playtesting. However, the expert agents' structural critique (dominant strategy, algorithm convergence) likely applies to any sufficiently skilled player.
