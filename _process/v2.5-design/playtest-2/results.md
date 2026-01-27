# Playtest 2 — Results

v2.5.1 mechanics. 5 personas, conditional replay (up to 3 runs). Single puzzle ("The Last Slice").

---

## Run Outcomes

| Player | Run 1 | Run 2 | Run 3 | Best Badge | Would Replay? |
|--------|-------|-------|-------|------------|---------------|
| Sarah | WIN, 2/3 concerns, 1 scrut | WIN THOROUGH, 3/3, 3 scrut | WIN basic, 2/3, 1 scrut (regression) | THOROUGH | No — wants new puzzle |
| Marcus | WIN, 2/3, 0 scrut | WIN THOROUGH, 3/3, 3 scrut | WIN CLEAN, 3/3, 4 scrut | CLEAN | No — wants new puzzle |
| Jen | WIN, 2/3, 1 scrut | WIN THOROUGH, 3/3, 3 scrut | WIN FLAWLESS, 3/3, 2 scrut | **FLAWLESS** | No — satisfied |
| David | WIN, 2/3, 0 scrut | WIN CLEAN, 3/3, 4 scrut | WIN basic, 2/3, 1 scrut (regression) | CLEAN | No — wants new puzzle |
| Aisha | WIN THOROUGH, 3/3, 3 scrut | WIN CLEAN, 3/3, 4 scrut | WIN CLEAN, 3/3, ? scrut | CLEAN | No — mapped the system |

**All 5 players played all 3 runs.** All chose to replay voluntarily (badge chase). All said they'd stop after 3 runs on the same puzzle.

---

## Pass Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | At least 1 player loses Run 1 | **FAIL** | All 5 won. Puzzle too easy to survive. |
| 2 | At least 1 player wins Run 3 | PASS | All 5 won all runs. |
| 3 | Best Run 3 scrutiny ≤ 3 | PASS | Jen: 2 scrutiny (FLAWLESS). |
| 4 | Different outcomes Run 1 across players | **FAIL** | All won with 2/3 concerns. |
| 5 | KOA dialogue differs across runs | PASS | |
| 6 | Graduated contradiction triggered | PASS | Multiple players hit tag conflicts. |
| 7 | Repetition risk triggered | PASS | Marcus Run 3 (redundant LOCATION proof). |
| 8 | Strategy change between runs | PASS | All 5 changed approach. |
| 9 | Genuine uncertainty in think-aloud | PASS | |
| 10 | KOA tone varies within run | PASS | |
| 11 | THOROUGH or FLAWLESS achieved | PASS | Jen: FLAWLESS. 4/5 hit THOROUGH. |
| 12 | Min-concerns gate failure | PASS | Sarah, David, Marcus all got 2/3 on Run 1. |
| 13 | NPS >= 7 average | PASS | 7.0 (all five gave 7). |

**Score: 11/13. Failed: #1 (nobody lost), #4 (identical Run 1 outcomes).**

Hard requirements: #1 FAIL, #2 pass, #6 pass, #7 pass. **1 hard fail.**

---

## Critical Finding: Abrupt Resistance Break

**5/5 players flagged this.** When resistance hits 0, the game ends immediately — even if the player has turns remaining and unaddressed concerns. This caused:

- Sarah regressed in Run 3 (repeated Run 1's mistake because she couldn't sequence concerns in time)
- David couldn't address INTENT in Run 3 despite having a turn left
- Marcus said it "feels like a bug, not a feature"
- Jen said "the game cut me off"
- Aisha accepted it but found it counterintuitive

**Recommendation:** Don't end the game on resistance break. Let the player keep playing remaining turns if concerns are unaddressed. The game already has the min-concerns gate — the abrupt ending is redundant and frustrating.

---

## Key Discoveries by Players

1. **AWAKE/ASLEEP tag fork** — all 5 identified this as the core strategic tension. Speaker (only INTENT card) is AWAKE, which conflicts with the powerful ASLEEP cards (fitbit, security_cam).

2. **Corroboration bonus** — 4/5 discovered matching tags give bonus damage (HOME+HOME, ASLEEP+ASLEEP). Jen discovered it in Run 2, used it strategically in Run 3.

3. **Repetition risk** — Marcus discovered redundant concern proofs add scrutiny (phone_gps proving LOCATION when thermostat already covered it).

4. **Tag conflict persistence** — Multiple players learned that tag conflicts track across turns, not just within a single submission.

5. **Badge names are opaque** — Marcus flagged that CLEAN/THOROUGH don't communicate what they reward.

---

## Strategy Convergence

Most players converged on doorbell+thermostat as Turn 1 (HOME corroboration, addresses IDENTITY+LOCATION, low risk). The main strategic variance was Turn 2+3 sequencing around the AWAKE/ASLEEP fork.

Jen's FLAWLESS path: doorbell+thermostat (T1) → speaker alone (T2) → fitbit alone (T3). Spreading conflicting tags across separate turns minimized scrutiny.

---

## Market & Product Survey

### Format Preference
- **5/5 chose "Both" (daily puzzles + story mode)**
- 5/5 would finish a multi-act story "if the story hooked me"
- Retention estimate: Jen/Sarah say 1-2 weeks, Marcus/David/Aisha say "as long as puzzles stay fresh"

### Monetization
| Question | Sarah | Marcus | Jen | David | Aisha |
|----------|-------|--------|-----|-------|-------|
| Would pay | $1-2 one-time | $3-5 one-time | $1-2 one-time | $3-5 one-time | $3-5 one-time |
| Sub value drivers | Daily puzzles, new characters | Daily puzzles, characters, campaigns | Daily puzzles, characters, campaigns | Daily puzzles, campaigns | Daily puzzles, leaderboards, hard modes |
| Ads | Tolerable if short | Would ruin it | Tolerable if short | Would pay to remove | Would ruin it |

**Takeaway:** 3/5 would pay $3-5 one-time. Nobody chose subscription. Ads polarize — hardcore players (Marcus, Aisha) say ads would ruin the experience. Premium unlock ($3-5, no ads, daily puzzles) is the cleanest model.

### Distribution
- **Platform:** 3/5 phone app, 2/5 browser (Aisha, Marcus)
- **Sharing:** 5/5 would share results (only if good badge). 4/5 prefer friend-only leaderboard, not global.
- **Retention triggers:** New content (4/5), friend sharing results (3/5), push notifications (2/5), streaks (1/5)

### Perceived Session Length
- 3/5 said under 2 minutes per run
- 2/5 said 2-5 minutes
- 3/5 said "too short — wanted more"
- 2/5 said "just right"

### How Players Describe the Game (M17)
- Sarah: "quick puzzle game where you pick evidence cards to convince an AI investigator you're innocent"
- Marcus: "daily deduction puzzle where you build an alibi from evidence cards while keeping your story consistent"
- Jen: "puzzle game where you convince a sassy AI you didn't eat the pizza by showing it your smart home data"
- David: "quick deduction puzzle where you build a consistent alibi from smart home evidence"
- Aisha: "short deduction puzzle where you optimize evidence submission against a suspicious AI investigator"

**Common language:** "puzzle," "alibi," "evidence cards," "AI investigator," "consistent/convince." Nobody said "card game." They see it as a deduction/logic puzzle with a character.

### What Would Make It Great (M18)
**5/5 said the same thing: more puzzles.** "One puzzle isn't a game — it's a demo." (Jen/Marcus). The engine and mechanics are validated. Content volume is the gap.

---

## Recommended Actions (Priority Order)

### P0: Fix abrupt resistance break
Don't end the game when resistance hits 0 if the player has turns remaining and unaddressed concerns. Let them keep playing. This was flagged by 100% of players.

### P1: Make Run 1 losses possible
Increase resistance from 14 to 16-18, or reduce card power. Currently 0% loss rate. The game needs a fail state on first contact. Criteria #1 and #4 both fail because of this.

### P2: Clarify badge names
Add descriptions: CLEAN = "all concerns, low scrutiny", THOROUGH = "all concerns", FLAWLESS = "all concerns, minimal scrutiny". Show badge requirements somewhere accessible.

### P3: Build puzzle variety
Every player's #1 request. The mechanics are validated. Content is the bottleneck.

### P4: Consider session length
3/5 players said it felt too short. Options: more turns per puzzle, larger hand, or just lean into "daily micro-puzzle" framing where short is the feature.

---

## Comparison to Playtest 1

| Metric | Playtest 1 (invalid) | Playtest 2 |
|--------|---------------------|------------|
| Players | 3 archetypes × 3 tiers | 5 realistic personas |
| Knowledge control | Agents read source code | Briefing only |
| Loss rate | Had losses | 0% (too easy) |
| FLAWLESS | Impossible | Jen achieved it |
| Top finding | Strategy convergence by Run 3 | Abrupt resistance break (unanimous) |
| NPS | Not measured | 7.0 |
| Replay motivation | Forced | Voluntary (badge chase) |
