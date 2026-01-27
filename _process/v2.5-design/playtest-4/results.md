# Playtest 4 — Results

v2.5.3 mechanics. 5 personas × 3 puzzles each = 15 games. Tests 6-card hand lossability, post-game scrutiny breakdown, KOA personality, and session arc with harder P3 (Missing Remote).

---

## Outcomes

| Player | P1: Last Slice (17) | P2: Thermostat War (14) | P3: Missing Remote (16) | Arc |
|--------|---------------------|-------------------------|-------------------------|-----|
| Sarah | WIN THOROUGH, 3 scrut | WIN **FLAWLESS**, 2 scrut | WIN THOROUGH, 3 scrut | THOROUGH → FLAWLESS → THOROUGH |
| Marcus | WIN THOROUGH, 3 scrut | WIN THOROUGH, 3 scrut | WIN CLEAN, 4 scrut | THOROUGH → THOROUGH → CLEAN |
| Jen | WIN THOROUGH, 3 scrut | WIN CLEAN, 4 scrut | WIN THOROUGH, 3 scrut | THOROUGH → CLEAN → THOROUGH |
| David | WIN THOROUGH, 3 scrut | WIN **FLAWLESS**, 2 scrut | WIN THOROUGH, 3 scrut | THOROUGH → FLAWLESS → THOROUGH |
| Aisha | WIN THOROUGH, 3 scrut | WIN **FLAWLESS**, 2 scrut | WIN THOROUGH, 3 scrut | THOROUGH → FLAWLESS → THOROUGH |

**Loss rate:** 0/15 games (0%). **Hard fail: still no first-contact losses.**

**FLAWLESS rate:** 3/5 achieved FLAWLESS on Puzzle 2 (Thermostat War). 0/5 on Puzzles 1 or 3.

---

## Pass Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | At least 1 player loses Puzzle 1 | **FAIL** | 0 losses across all 15 games. 6-card hand still not enough. |
| 2 | At least 1 player wins Puzzle 3 | PASS | 5/5 won P3. |
| 3 | Different outcomes on Puzzle 1 across players | **FAIL** | All 5 got identical results: THOROUGH, 3 scrutiny. |
| 4 | At least 1 player improves across puzzles | PASS | Sarah, David, Aisha: THOROUGH → FLAWLESS (on P2). |
| 5 | At least 1 "yes" to "would you come back?" | PASS | 5/5 yes after every puzzle. |
| 6 | At least 1 "no" to "would you come back?" | **FAIL** | 0/5 said no. (LLM acquiescence bias.) |
| 7 | Graduated contradiction triggered | PASS | Multiple players across puzzles (speaker AWAKE after ASLEEP). |
| 8 | Repetition risk triggered | PASS | Fired in 10/15 games. |
| 9 | Post-game breakdown referenced in survey | PASS | 5/5 mentioned it. S17 average: 6.6/7. |
| 10 | KOA personality non-uniform responses | PASS | K5: 3× (a) fun character, 2× (b) neutral system. |
| 11 | At least 1 THOROUGH or FLAWLESS | PASS | 3 FLAWLESS, 9 THOROUGH, 2 CLEAN, 1 CLEAN. |
| 12 | NPS >= 8 average | **FAIL** | 7.2 average (6, 7, 7, 8, 8). Down from 7.6 in PT3. |
| 13 | 3/5 say session length "just right" or "too short" | PASS | 3 "just right", 2 "too short". |

**Score: 9/13.** 4 fails: #1 (no losses), #3 (no P1 variance), #6 (nobody said no), #12 (NPS 7.2).

**Hard requirements:** #1 FAIL, #2 pass, #5 pass. **1 hard fail — same persistent issue: no first-contact losses.**

---

## Key Findings

### 1. Zero Losses Across 4 Playtests

The 6-card hand change (removing microwave) did NOT produce losses. Despite:
- Safe-path margin of -7 (impossible to win risk-free)
- Win rate of 40.7% in the brute-force checker

All 5 experienced players won every puzzle. **The problem is player knowledge, not puzzle difficulty.** By PT4, all personas have 3 sessions of system knowledge. They know to:
- Pair matching tags for corroboration
- Use REFUTES cards to cancel risk
- Avoid known trap cards (phone_gps AWAY)
- Accept exactly one contradiction (speaker AWAKE) on the forced-conflict turn

The checker's 40.7% win rate assumes random play. Experienced players play near-optimally.

### 2. Every Player Hit Identical P1 Results

All 5: THOROUGH, 3/5 scrutiny, 3/3 concerns. The "optimal" line on Last Slice is now so legible that every player type converges to the same strategy:
- T1: doorbell + thermostat (HOME corroboration, refute fires)
- T2: fitbit + security_cam (ASLEEP corroboration, uncontested)
- T3: speaker (forced AWAKE conflict for INTENT)

**This is a solved puzzle.** It needs either new cards or retirement from session play.

### 3. NPS Dropped (7.2 vs 7.6 in PT3)

| Player | PT3 NPS | PT4 NPS | Change | Lost a game? |
|--------|---------|---------|--------|-------------|
| Sarah | 8 | 8 | = | PT3: yes, PT4: no |
| Marcus | 7 | 7 | = | Never |
| Jen | 8 | 7 | -1 | Never |
| David | 8 | 8 | = | PT3: yes, PT4: no |
| Aisha | 7 | 6 | -1 | Never |

**Pattern:** Aisha's NPS dropped because she finds the game too solvable. Jen's dropped because the repeated-proof mechanic frustrated her and KOA's lines repeated. Players who never lose don't increase NPS — they either hold or decline.

**The loss-then-win arc remains the NPS driver.** PT3 had 2 losses → those players gave 8. PT4 had 0 losses → NPS dropped.

### 4. Scrutiny Breakdown Is Unanimously Valued

S17 scores: Sarah 7, Marcus 7, Jen 5, David 7, Aisha 7. **Average: 6.6/7.**

Every player mentioned it positively. Key quotes:
- Marcus: "The single best addition since I started playtesting"
- David: "Bring that same transparency to ALL failure states"
- Aisha: "The most valuable feedback mechanism in the game"
- Sarah: "I learned more from it than from KOA's dialogue"

**The scrutiny breakdown is validated. Ship it.**

### 5. KOA Personality Data

**K5 — Character vs System:**
| Response | Count |
|----------|-------|
| (a) Fun character | Sarah, Jen, David (3/5) |
| (b) Neutral system | Marcus, Aisha (2/5) |

**K6 — Average ratings (1-7):**
| Dimension | Average | Range |
|-----------|---------|-------|
| Funny | 4.6 | 4-5 |
| Intimidating | 2.6 | 2-3 |
| Memorable | 4.4 | 3-5 |
| Fair | 5.2 | 4-6 |

**K7 — Reactive KOA:**
| Response | Count |
|----------|-------|
| (a) Yes, significantly | Sarah, Jen, David, Marcus (4/5) |
| (b) Somewhat | Aisha (1/5) |

**K9 — Read dialogue:**
| Response | Count |
|----------|-------|
| (a) Read every word | Marcus, David (2/5) |
| (b) Read most | Sarah, Jen (2/5) |
| (c) Skimmed | Aisha (1/5) |

**K10 — Most memorable quote:**
- "Two different devices agreeing? That's... annoyingly consistent." — cited by 4/5 players
- "Innocent people don't need to say it twice." — Jen
- "Your alibi is... frustratingly solid." — Sarah

**K1 — Made you laugh:**
- 4/5 cited specific KOA lines. Only Aisha didn't laugh (but acknowledged "annoyingly consistent" landed).

**Key insight:** KOA works as a character for casual/mid players (Sarah, Jen, David) but is invisible to optimizers (Aisha, partially Marcus). **Reactive KOA is the #1 requested feature** — 4/5 want it.

### 6. Repeated KOA Lines Break Immersion

3/5 players (Sarah, Jen, David) flagged the "leftover pad thai" win line repeating across puzzles. KOA needs per-puzzle win/loss dialogue, not global templates.

### 7. David's Block Bug

David reports doorbell_cam + tv_log was blocked as "directly contradicts" in Puzzle 3. Both cards are IDLE tag. This shouldn't happen — IDLE doesn't conflict with itself. Likely a bug where a prior ACTIVE card (smartwatch) set up the contradiction, and one of the IDLE cards triggered it. Need to investigate whether the graduated contradiction system correctly tracks which specific tag axis was violated.

### 8. Subscription Drivers

**M3 — What would make you pay monthly:**
| Feature | Count |
|---------|-------|
| (a) New puzzles every day | 5/5 |
| (b) Longer story cases | Marcus, David, Sarah (3/5) |
| (c) Leaderboards / rankings | Aisha, Sarah (2/5) |
| (d) KOA voice packs | Jen (1/5) |
| (e) Cosmetic badges | Sarah (1/5) |
| (f) Nothing — wouldn't subscribe | 0/5 |

**Daily puzzles are the universal subscription driver.** Story cases are second. Nobody categorically refused subscription.

### 9. Competitive Comparisons

| Player | Game Comparison |
|--------|----------------|
| Sarah | "Wordle for people who watch true crime" |
| Marcus | "Slay the Spire meets Wordle" |
| Jen | "Wordle mixed with Phoenix Wright" |
| David | "Wordle + Phoenix Wright + Slay the Spire decisions" |
| Aisha | "Marvel Snap deck-building × Opus Magnum optimization" |

**Wordle is the universal anchor.** Phoenix Wright is the thematic anchor. Slay the Spire is the mechanics anchor for strategic players.

### 10. Play Frequency

| Frequency | Count |
|-----------|-------|
| Every day | Sarah (1/5) |
| A few times a week | Marcus, Jen, David, Aisha (4/5) |

---

## Recurring Feedback (Across PT2, PT3, PT4)

| Issue | Times Flagged | Playtests | Status |
|-------|---------------|-----------|--------|
| Scrutiny penalties are opaque | 3/5 (PT2+PT3) | PT2, PT3 | **FIXED in PT4** (breakdown added) |
| Badge criteria should be explicit | 2/5 (PT3+PT4) | PT2, PT3, PT4 | Open |
| CONTESTED mechanic is invisible | 1/5 (PT3) | PT3 | Open |
| Want more puzzles | 5/5 | PT2, PT3, PT4 | Open (core roadmap) |
| KOA lines repeat across puzzles | 3/5 (PT4) | PT4 | **NEW** |
| Block/rejection feedback is opaque | 2/5 (PT4) | PT4 | **NEW** |
| Want reactive KOA | 4/5 (PT4) | PT4 | **NEW** (measured for first time) |
| Repeated-proof mechanic confusing | 2/5 (PT4) | PT4 | **NEW** |
| Want mechanics reference card | 2/5 (PT4) | PT4 | **NEW** |
| Need difficulty that produces losses | — | PT2, PT3, PT4 | **PERSISTENT HARD FAIL** |

---

## NPS Analysis

| Player | PT2 | PT3 | PT4 | Trend | Key Factor |
|--------|-----|-----|-----|-------|------------|
| Sarah | 7 | 8 | 8 | ↑ stable | Loss-recovery arc (PT3) cemented loyalty |
| Marcus | 7 | 7 | 7 | flat | Wants documented rules + more depth |
| Jen | 7 | 8 | 7 | ↑↓ | KOA repetition + repeated-proof frustration |
| David | 7 | 8 | 8 | ↑ stable | Loss-recovery arc (PT3) cemented loyalty |
| Aisha | 7 | 7 | 6 | ↓ | Depth ceiling reached. Game is "solved." |

**NPS trajectory:** 7.0 → 7.6 → 7.2. The improvement from PT2→PT3 came from losses creating emotional arcs. The decline from PT3→PT4 came from zero losses + Aisha's declining engagement.

---

## Comparison: PT2 vs PT3 vs PT4

| Metric | PT2 | PT3 | PT4 |
|--------|-----|-----|-----|
| Loss rate | 0% | 13% | 0% |
| FLAWLESS achieved | 1/5 | 5/5 | 3/5 |
| NPS average | 7.0 | 7.6 | 7.2 |
| Highest NPS | 7 | 8 | 8 |
| Lowest NPS | 7 | 7 | 6 |
| #1 complaint | Abrupt endings | Scrutiny opacity | No losses / KOA repetition |
| #1 fix applied | Resistance cont. | Scrutiny breakdown | — |
| Scrutiny breakdown S17 | N/A | N/A | 6.6/7 |
| KOA as "fun character" | N/A | N/A | 3/5 |

---

## Recommended Actions

### P0: Produce First-Contact Losses (PERSISTENT HARD FAIL)

The 6-card hand didn't work because experienced players converge on the optimal line. Options:
1. **Test with naive agents** — the checker says 40.7% win rate. Real first-time players WILL lose. The issue is LLM agents with 3 sessions of knowledge. Consider: is this a real problem or a testing artifact?
2. **Raise Last Slice resistance to 19-20** — forces tighter margins even for experienced players.
3. **Add a second counter** — contest fitbit or thermostat so the corroboration pair isn't free.
4. **Accept it** — if real humans lose on first contact (likely), this isn't a design problem. It's a testing limitation.

### P1: Per-Puzzle KOA Dialogue

Win/loss lines must be puzzle-specific. "Leftover pad thai" on a missing remote puzzle breaks immersion. Each puzzle needs 2-3 win lines and 2-3 loss lines.

### P2: Block Feedback Transparency

When a card pair is blocked, show which tag conflict triggered it: "IDLE conflicts with ACTIVE (committed Turn 1)." Same transparency model as post-game breakdown, applied to mid-game blocks.

### P3: Badge Criteria Hint

After winning, show: "Badge: FLAWLESS — all concerns + scrutiny ≤ 2." Don't explain the formula in advance, but confirm what the player achieved and why.

### P4: Reactive KOA (Season 2 — now validated)

4/5 want reactive KOA. This is no longer speculative. But it's still a Season 2 feature — current KOA works well enough for casual players (3/5 see it as a character).

### P5: Depth Expansion (Aisha's Concern)

Aisha's NPS dropped to 6 because the game is solvable. Every puzzle has the same skeleton: refute T1, corroborate, manage penalties. Need puzzles where:
- The refuter is NOT the right T1 play
- You MUST take a contradiction to win
- Playing all cards is wrong (hand management / sacrifice)
- Multiple contradiction axes are active simultaneously

This is the archetype spec's SEQUENCE TRAP expanded. Priority for puzzle library, not engine changes.
