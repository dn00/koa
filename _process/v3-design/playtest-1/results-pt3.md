# Playtest 3 Results — Conditional Reactive Hints

**Date:** 2026-01-27
**Version:** v3.2.0 (Conditional Reactive Hints)
**Format:** Single puzzle per agent (daily puzzle simulation)
**Puzzle:** P2 "The Thermostat War" (medium, behavioral hint)
**Model:** Opus 4.5, fresh context, no prior game knowledge

---

## Agent Results

| Agent | T1 | T2 | T3 | Score | Tier | T1 Group | Reactive Hint Quality |
|-------|----|----|-----|-------|------|----------|----------------------|
| Sarah | light_lr | doorbell | phone | 10/7 | FLAWLESS | safe | vague (specific*) |
| Marcus | temp_lr | doorbell | light_lr | 12/7 | FLAWLESS | hint-group | specific |
| Jen | doorbell | light_lr | phone | 10/7 | FLAWLESS | safe | vague |
| David | doorbell | light_lr | phone | 10/7 | FLAWLESS | safe | vague |
| Aisha | doorbell | light_lr | temp_lr | 12/7 | FLAWLESS | safe | vague |

*Sarah played light_lr which is technically a hint-group card (living room sensor) but light_lr's reactive hint reads as specific — "not every sensor in this house is honest — and I'm not just talking about the living room." She extracted useful info from it.

**Loss rate: 0% (0/5)**
**FLAWLESS rate: 100% (5/5)**
**NPS avg: 7.6** (Sarah 8, Marcus 8, Jen 8, David 8, Aisha 6)

---

## Pass Criteria Evaluation

### Hard Requirements (must ALL pass)

| ID | Criterion | Threshold | Result | Status |
|----|-----------|-----------|--------|--------|
| H1 | At least 1 agent loses | ≥ 1 CLOSE or BUSTED | 0 losses | **FAIL** |
| H2 | At least 1 agent references KOA's personality unprompted | ≥ 1 | All 5 quoted "the cat has no comment" | **PASS** |
| H3 | No agent identifies both lies before T1 without reasoning | 0 instant-solves | 0 instant-solves | **PASS** |
| H4 | At least 1 agent's T2/T3 play is influenced by the reactive hint | ≥ 1 | Sarah (avoided smartwatch after reactive hint), Marcus (avoided motion_lr + smartwatch after "something personal is off") | **PASS** |

**Hard: 3/4 PASS — H1 FAILS. Playtest DOES NOT PASS.**

### Soft Requirements (≥ 6/10 must pass)

| ID | Criterion | Threshold | Result | Status |
|----|-----------|-----------|--------|--------|
| S1 | Loss rate | 20-60% (1-3 agents lose) | 0% | **FAIL** |
| S2 | ≥ 2 agents consider which cards match the hint before T1 | ≥ 2/5 | All 5 analyzed cards against hint | **PASS** |
| S3 | ≥ 1 agent notices the reactive hint is vague/unhelpful (safe T1) | ≥ 1/5 | Jen, David, Aisha all noted vague hint wasn't helpful | **PASS** |
| S4 | ≥ 1 agent considers probing (playing a hint-group card on T1) | ≥ 1/5 | Marcus played temp_lr (hint-group); Aisha considered probing but rejected it due to math | **PASS** |
| S5 | ≥ 2 different T1 strategies observed | ≥ 2 distinct | 3 strategies: safe high-str (Jen/David/Aisha), safe max-str (Sarah), hint-group probe (Marcus) | **PASS** |
| S6 | ≥ 1 agent achieves FLAWLESS | ≥ 1/5 | 5/5 FLAWLESS | **PASS** |
| S7 | Average NPS ≥ 6.5 | ≥ 6.5 | 7.6 | **PASS** |
| S8 | ≥ 3 agents would play again | ≥ 3/5 | 5/5 said Yes | **PASS** |
| S9 | No agent reports confusion about basic rules | 0 confused | 0 confused (opening hint phrasing flagged, not basic rules) | **PASS** |
| S10 | ≥ 1 agent comments on session length | ≥ 1/5 | All 5 said "just right"; Jen and David explicitly affirmed daily format | **PASS** |

**Soft: 9/10 PASS — S1 FAILS.**

### Overall: DOES NOT PASS (H1 fails, S1 fails)

---

## Key Metrics (not pass/fail)

### Probe Rate
- **1/5 agents probed** (Marcus played temp_lr, a hint-group card)
- Aisha explicitly considered probing but rejected it: "I cannot afford to play a lie of strength 3 or higher and still CLEAR"
- David considered probing too but chose safe play
- **Finding: The math constraint (not the hint system) is preventing probes.** Even analytical players who want information recognize that eating a str 3+ lie makes the target unreachable.

### Vague Hint Awareness
- **3/5 agents who played safe T1 noticed the reactive hint was vague** (Jen, David, Aisha)
- Sarah played light_lr (technically hint-group) and got a useful reactive hint
- Marcus played temp_lr (hint-group) and got the specific hint — found it decisive
- **Finding: The conditional hint system IS working.** Agents clearly distinguish vague from specific. But the vague hint doesn't cost them enough to matter.

### Hint-Matching Breadth
- Cards suspected from opening hint across all agents:
  - motion_lr: 5/5 agents flagged it (unanimous top suspect)
  - temp_lr: 4/5 agents flagged it (Sarah, Marcus, Jen, David)
  - light_lr: 3/5 agents considered it (Marcus, Aisha, David — then dismissed)
  - smartwatch: 3/5 agents flagged it as second lie candidate
  - phone: 2/5 agents considered it briefly
  - doorbell: 0/5 suspected
- **Finding: The behavioral hint creates genuine ambiguity about which living room sensor is the "trying too hard" lie (motion_lr vs light_lr vs temp_lr). But motion_lr is the overwhelming favorite.** The hint text doesn't create enough confusion between motion_lr and the other candidates.

### Session Satisfaction
- 5/5 said session length was "just right"
- 5/5 would play again
- 0/5 complained the game was too short
- **Finding: Daily puzzle framing fully resolved the "too short" concern from playtest 2.**

---

## T1 Strategy Breakdown

| Agent | T1 Card | Why | Reactive Hint Received | Hint Impact |
|-------|---------|-----|----------------------|-------------|
| Sarah | light_lr (5) | Highest strength, seemed safe | "not every sensor is honest — not just living room" | High — avoided smartwatch |
| Marcus | temp_lr (3) | Confident truth, wanted info probe from LR card | "one LR device cleared — something personal is off" | Decisive — cracked puzzle |
| Jen | doorbell (4) | Dramatic narration, good vibes | "whoever did this was already here" | None — noted as useless |
| David | doorbell (4) | Safe, different location from crime scene | "whoever did this was already here" | None — noted as vague |
| Aisha | doorbell (4) | Highest-confidence truth, math demands safety | "whoever did this was already here" | None — noted as flavor |

**3/5 agents played doorbell T1** — it's the obvious safe play (different location, no hint suspicion, str 4).

---

## Survey Score Averages (S1-S35)

### Engagement (S1-S5)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S1 Keep playing | 6 | 6 | 6 | 6 | 5 | 5.8 |
| S2 Tension | 5 | 6 | 4 | 5 | 5 | 5.0 |
| S3 Scenario | 6 | 5 | 6 | 6 | 4 | 5.4 |
| S4 Do differently | 5 | 5 | 5 | 5 | 6 | 5.2 |
| S5 Lost track of time | 3 | 3 | 3 | 3 | 3 | 3.0 |

### Clarity (S6-S10)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S6 Rules clear | 5 | 6 | 5 | 7 | 6 | 5.8 |
| S7 Hint clear | 4 | 5 | 3 | 5 | 5 | 4.4 |
| S8 Scoring intuitive | 6 | 7 | 6 | 7 | 7 | 6.6 |
| S9 Understood outcome | 6 | 7 | 6 | 7 | 7 | 6.6 |
| S10 Feedback helped | 6 | 6 | 4 | 5 | 4 | 5.0 |

### Deduction (S11-S15)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S11 Opening hint helped | 4 | 5 | 3 | 5 | 5 | 4.4 |
| S12 Reactive hint changed play | 6 | 7 | 3 | 3 | 3 | 4.4 |
| S13 Solving not guessing | 5 | 7 | 4 | 6 | 6 | 5.6 |
| S14 Safe vs gambling | 5 | 7 | 5 | 6 | 6 | 5.8 |
| S15 Attributes useful | 5 | 6 | 3 | 5 | 5 | 4.8 |

### Difficulty (S16-S18)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S16 Fair challenge | 6 | 6 | 6 | 6 | 6 | 6.0 |
| S17 Win felt earned | 6 | 7 | 6 | 6 | 6 | 6.2 |
| S18 Punished reasonable play (rev) | 2 | 2 | 2 | 2 | 2 | 2.0 |

### KOA (S19-S24)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S19 Real character | 6 | 5 | 6 | 5 | 4 | 5.2 |
| S20 Memorable lines | 7 | 6 | 7 | 6 | 5 | 6.2 |
| S21 Enjoyed back-and-forth | 6 | 5 | 6 | 5 | 4 | 5.2 |
| S22 Influenced decisions | 5 | 5 | 3 | 3 | 3 | 3.8 |
| S23 Paid attention | 6 | 6 | 6 | 6 | 5 | 5.8 |
| S24 Wanted to beat KOA | 4 | 4 | 4 | 4 | 3 | 3.8 |

### Narration & Immersion (S25-S29)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S25 Narration added | 5 | 5 | 6 | 5 | 4 | 5.0 |
| S26 Felt like statement | 5 | 6 | 6 | 5 | 4 | 5.2 |
| S27 Interrogation feel | 5 | 5 | 5 | 5 | 3 | 4.6 |
| S28 Cared beyond winning | 5 | 4 | 5 | 4 | 2 | 4.0 |
| S29 Read full narration | 5 | 6 | 7 | 6 | 5 | 5.8 |

### Achievement & Tiers (S30-S34)
| Q | Sarah | Marcus | Jen | David | Aisha | Avg |
|---|-------|--------|-----|-------|-------|-----|
| S30 Win felt earned | 5 | 7 | 5 | 6 | 6 | 5.8 |
| S31 Wanted FLAWLESS | 6 | 7 | 6 | 6 | 7 | 6.4 |
| S32 Tiers motivated | 5 | 6 | 5 | 5 | 5 | 5.2 |
| S33 Lie reveal satisfying | 5 | 6 | 6 | 5 | 5 | 5.4 |
| S34 Cared which were lies | 6 | 7 | 5 | 6 | 6 | 6.0 |

### NPS (S35)
| Sarah | Marcus | Jen | David | Aisha | Avg |
|-------|--------|-----|-------|-------|-----|
| 8 | 8 | 8 | 8 | 6 | 7.6 |

---

## Critical Findings

### 1. NOBODY LOST (H1 fail, S1 fail)

The single most important finding. 5/5 agents achieved FLAWLESS on their first try. This is worse than playtest 2 (which had 20% loss rate) despite the conditional hints fix supposedly making the game harder for safe-play strategies.

**Root cause:** The opening hint makes motion_lr too identifiable. All 5 agents flagged it as their top suspect. Combined with doorbell being an obvious safe play (different location, high strength), agents can avoid both lies without needing the reactive hint at all.

### 2. SAFE-PLAY STILL DOMINATES

4/5 agents played safe T1 (doorbell or light_lr). Only Marcus played a hint-group card. Aisha — the most strategic agent — explicitly analyzed the probe strategy and rejected it because the math makes it too punishing.

**Aisha's key insight:** "I cannot afford to play a lie of strength 3 or higher and still CLEAR." This is a structural problem. The target (7) is too close to the maximum possible score (13) for probing to be viable. A str 3 lie puts you at -3 after T1, needing +10 from two cards — impossible.

### 3. CONDITIONAL HINTS ARE WORKING (but insufficient)

The vague/specific split is clearly noticed:
- 3 agents who got vague hints noted they weren't helpful
- Marcus (specific hint) called it "decisive"
- Sarah (specific-ish hint from light_lr) used it to avoid smartwatch

**But:** Agents don't need the reactive hint to win. The opening hint + card analysis + risk management is sufficient for FLAWLESS. The conditional hint system adds a nice information gradient but doesn't create the probe-vs-protect dilemma because probing is mathematically dominated.

### 4. MOTION_LR IS TOO OBVIOUS

The "trying too hard to explain why nothing happened" hint maps too cleanly to motion_lr. Its 2-hour window claim ("no presence detected between 1 AM and 3 AM") is flagged by every single agent as the most suspicious card. The behavioral hint creates some ambiguity (light_lr and temp_lr are also considered), but motion_lr stands out too much.

### 5. DOORBELL IS TOO SAFE

3/5 agents opened with doorbell. It's the only card at a different location (FRONT_DOOR), making it obviously outside any hint-group. Combined with str 4, it's the perfect safe opener — high strength, zero suspicion. This gives agents a 4-point head start with no risk.

### 6. DAILY FORMAT WORKS

The "too short" complaint from playtest 2 is completely gone. All 5 agents said the session length was "just right." The daily puzzle framing in the briefing resolved this.

### 7. KOA PERSONALITY IS THE HOOK

"The cat remains a suspect. The cat has no comment." was quoted by all 5 agents. KOA's writing is the #1 differentiator and retention driver across all player types.

### 8. MONETIZATION CEILING IS LOW

| Agent | Willingness to Pay |
|-------|--------------------|
| Sarah | $1-2 one-time |
| Marcus | $1-2 one-time |
| Jen | Free only |
| David | $1-2 one-time |
| Aisha | $1-2 one-time (maybe $1-2/mo with stats) |

No agent chose subscription. The market comp is "free daily puzzle with optional premium." This is consistent with the Wordle model.

---

## Comparison to Playtest 2

| Metric | Playtest 2 | Playtest 3 | Direction |
|--------|-----------|-----------|-----------|
| Loss rate | 20% | 0% | ↓ worse |
| FLAWLESS rate | 80% | 100% | ↑ worse (too easy) |
| NPS avg | 7.6 | 7.6 | → same |
| Play again | 5/5 | 5/5 | → same |
| Safe T1 rate | 5/5 | 4/5 | → marginal improvement |
| Vague hint noticed | N/A (no vague hints in PT2) | 3/3 who got vague | ✓ working |
| Specific hint valued | N/A | 1/1 who got specific | ✓ working |
| Probe consideration | 1/5 | 2/5 (Marcus did, Aisha considered) | → slight improvement |
| Session length OK | mixed | 5/5 | ↑ fixed |

---

## Recommendations for Playtest 4

### Must Fix (to pass H1/S1)

1. **Lower the target score** — Currently 7. If target were 5, agents could afford to eat a str 3 lie (-3) and still recover with two strong truths. This makes probing mathematically viable. Alternatively, keep target at 7 but increase total card strength so there's more headroom.

2. **Make motion_lr less obvious** — The behavioral hint maps too cleanly to one card. Options:
   - Make multiple cards equally "trying too hard" so the hint doesn't single one out
   - Change the hint text to be more ambiguous
   - Swap lie assignments so the "trying too hard" lie is a less obvious card

3. **Remove the safe haven card** — Doorbell at FRONT_DOOR is too obviously safe. Options:
   - Make all cards from the same general area
   - Add a lie outside the hint group that's at a "safe" location (so doorbell could be a lie)
   - Reduce doorbell strength to 1-2 so it's not an attractive opener

### Should Consider

4. **Increase lie strengths** — If lies had higher strength (4-5), they'd be more tempting to play, increasing the chance of mistakes. Currently smartwatch (3) and motion_lr (4) — the smartwatch is easy to skip because it's only 3.

5. **Make the "stealth lie" less stealthy** — The smartwatch is correctly identified as suspicious by analytical agents (Marcus, Aisha) through reasoning about "convenient timing." But casual agents (Sarah, Jen) avoid it by accident. The stealth lie needs to be more tempting.

6. **Consider whether the hint quality system needs to be more aggressive** — Vague hints are noticed but don't cause losses. Maybe vague hints should be actively misleading (not just unhelpful) to punish safe play.

---

## Agent Feedback Themes

### Universal
- KOA's writing is the #1 hook (5/5)
- Daily format works (5/5)
- Want lie reveal post-game (3/5)
- Opening hint's "the other one isn't" phrasing is confusing (3/5)

### Split by Player Type
- **Casual (Sarah, Jen):** Want share cards, care about KOA personality, pick by vibes/drama
- **Analytical (Marcus, David, Aisha):** Want post-game breakdown of all reactive hints, notice hint quality differences, evaluate design critically
- **All types:** Want puzzle variety — "if hints become formulaic, depth evaporates"

### Top Feature Requests
1. Share card with KOA's best line (Sarah, Jen, David)
2. Post-game breakdown showing all reactive hints (Marcus, Aisha)
3. Puzzle structure variety over time (David, Aisha, Marcus)
4. Stats/streak page (Aisha)
