# Playtest State — Current

## Status: READY FOR PLAYTEST 4

---

## Playtest 1 — PASSED (4/4 hard, 11/12 soft)

5 agents played P1→P2→P3 with original puzzles.

| Agent | P1 | P2 | P3 | Pattern |
|-------|----|----|-----|---------|
| Sarah | BUSTED (1/5) | FLAWLESS (10/7) | FLAWLESS (12/8) | Chased big number, learned |
| Marcus | CLOSE (3/5) | CLOSE (6/7) | FLAWLESS (12/8) | Probed lies, punished, stopped |
| Jen | FLAWLESS (9/5) | CLOSE (5/7) | FLAWLESS (12/8) | Lucky vibes, punished, learned |
| David | FLAWLESS (10/5) | FLAWLESS (12/7) | FLAWLESS (11/8) | Safe-first, never lost |
| Aisha | CLEARED (5/5) | CLOSE (6/7) | FLAWLESS (12/8) | Probed, punished, stopped |

NPS avg: 7.6. Loss rate: 33%.

**Issues found:**
1. P3 too easy (S2 FAIL) — spa_pump trivially identifiable. Fixed by softening scenario.
2. Safe-play dominance — accepted as-is.
3. Validator gaps — added I21, I22, C8.
4. Created semantic invariants doc (S1-S11).

---

## Playtest 2 — PASSED (4/4 hard, 10/12 soft)

5 agents played P1→P2→P3 with P3-fixed puzzles. Opus 4.5 model.

| Agent | P1 | P2 | P3 | Pattern |
|-------|----|----|-----|---------|
| Sarah | FLAWLESS (9/5) | FLAWLESS (10/7) | FLAWLESS (11/8) | Safe-first every time |
| Marcus | FLAWLESS (11/5) | FLAWLESS (12/7) | FLAWLESS (12/8) | Identified meta-pattern |
| Jen | CLOSE (3/5) | CLOSE (6/7) | FLAWLESS (12/8) | Only agent with multiple losses |
| David | FLAWLESS (9/5) | FLAWLESS (12/7) | FLAWLESS (12/8) | Methodical safe-first |
| Aisha | BUSTED (2/5) | FLAWLESS (10/7) | FLAWLESS (12/8) | Probed P1, learned, never probed again |

NPS avg: 7.6. Loss rate: 20% (at S1 floor).

**Pass criteria:** 4/4 hard PASS. 10/12 soft (S2 FAIL — P3 still easiest; S1 barely passing at 20%).

**Critical findings:**
1. **Safe-play dominant.** All 5 agents converged on same strategy: safe T1, read hint, avoid lies. No agent ever benefited from probing.
2. **Hints too informative for free.** Safe T1 gave specific reactive hints — no information cost to playing safe.
3. **Principle 3 failing.** Optimal move always obvious (play safe).
4. **Principle 4 half-failing.** Hints only helpful, never dangerous.
5. **Meta-pattern visible.** Marcus identified "loud denial + quiet cover-up" structure in one session.
6. **Loss rate trending to 0.** Safe-play convergence pushing losses down.

Full results: `results.md`

---

## Design Fix: Conditional Reactive Hints (post-playtest 2)

**Decision doc:** `_process/v3-design/2-conditional-hints.md`

### Changes made:

**A. Conditional reactive hint quality:**
- Risky T1 (card in hint group) → specific hint (narrows stealth lie)
- Safe T1 (card NOT in hint group) → vague hint (atmosphere only, no card identification)
- Lie plays → always specific (penalty already paid)
- Creates probe-vs-protect tradeoff: safe = cheap but blind, risky = might lose points but get actionable info

**B. Non-partitioning opening hints (medium/hard):**
- P1: kept "after 11 PM" (easy = direct attribute, fine)
- P2: changed from "sensor in the living room" to "trying too hard to explain why nothing happened" (behavioral, requires reading claims)
- P3: kept "protests too much" (already behavioral)

**C. Backward generation process:**
- Added to `puzzle-gen-invariants.md`
- Puzzles authored backward: desired experience → lies → hint → reactive hints → cards → scenario
- Ensures genuine ambiguity by construction

### Files modified:

| File | Changes |
|------|---------|
| `scripts/v3-types.ts` | Added `quality: 'specific' \| 'vague'` to `ReactiveHint` |
| `scripts/v3-puzzles.ts` | Rewrote reactive hints with quality tiers, rewrote P2 hint, updated P2 hintDimension |
| `scripts/prototype-v3.ts` | Added I23 (quality matches group), I24 (vague = no implicates), I25 (specific = ≥1 implicate). Updated I18 (vague exempt). Added probe win rate metric. |
| `_process/v3-design/design.md` | Updated 3.5 (hint system), 3.6 (deduction loop), 3.7 (target range 5-13), 8 (skill gradient), Appendix A (schemas), Appendix B (invariants). Added note on pre-split-lie examples. |
| `_process/v3-design/puzzle-gen-invariants.md` | Added S12 (vague hints), S13 (non-partitioning hints), backward generation process. Updated S10 (hint text vs matchFn for medium/hard). |
| `_process/v3-design/2-conditional-hints.md` | New — design decision doc |
| `_process/v3-design/playtest-prompt-template.md` | New — standardized agent prompt template |
| `_process/v3-design/playtest-1/puzzles-player-view.md` | Synced with current puzzle data |

---

## Playtest 3 — DID NOT PASS (3/4 hard, 9/10 soft)

5 agents played P2 "The Thermostat War" (single puzzle, daily format). Conditional reactive hints applied.

| Agent | T1 | T2 | T3 | Score | Tier | T1 Group |
|-------|----|----|-----|-------|------|----------|
| Sarah | light_lr | doorbell | phone | 10/7 | FLAWLESS | hint-group |
| Marcus | temp_lr | doorbell | light_lr | 12/7 | FLAWLESS | hint-group |
| Jen | doorbell | light_lr | phone | 10/7 | FLAWLESS | safe |
| David | doorbell | light_lr | phone | 10/7 | FLAWLESS | safe |
| Aisha | doorbell | light_lr | temp_lr | 12/7 | FLAWLESS | safe |

NPS avg: 7.6. Loss rate: 0%. **H1 FAIL (nobody lost), S1 FAIL (0% loss rate).**

**Critical findings:**
1. **5/5 FLAWLESS, 0 losses** — worse than PT2 (20% loss rate)
2. **motion_lr too obvious** — 5/5 agents flagged it as top suspect (2-hour denial window)
3. **doorbell too safe** — 3/5 played it T1 (unique FRONT_DOOR location, str 4, zero suspicion)
4. **smartwatch (stealth lie) not tempting** — str 3, easy to skip
5. **Conditional hints working** — vague/specific split noticed by 3/3 safe-T1 agents
6. **Probing still math-blocked** — Aisha: "I cannot afford a str 3 lie and still CLEAR"
7. **Daily format works** — 5/5 said "just right"

Full results: `results-pt3.md`

---

## Design Fixes (post-playtest 3)

### Fix A: Reduced Lie Penalty — `-(strength - 1)` instead of `-strength`

**Decision doc:** `_process/v3-design/3-reduced-lie-penalty.md`

Makes probing mathematically viable. Eating the weak lie on T1 now leads to CLEARED on P1/P2, CLOSE on P3.

**Files modified:**
| File | Changes |
|------|---------|
| `scripts/prototype-v3.ts` | Scoring delta, recovery calcs (I10/I11), group scores (I7a/b), I13 upper bound 70→80% |
| `scripts/play-v3.ts` | Scoring delta in playCard + printOutcome |
| `scripts/v3-types.ts` | Doc comment updated |
| `scripts/v3-puzzles.ts` | Balance comments updated for all 3 puzzles |
| `_process/v3-design/design.md` | Scoring rules + appendix updated |
| `_process/v3-design/2-conditional-hints.md` | Follow-up note added |
| `_process/v3-design/3-reduced-lie-penalty.md` | New — design decision doc |

### Fix B: P2 Puzzle-Specific Fixes

Three targeted changes to P2 card content:

1. **Strength swap: smartwatch 3→4, motion_lr 4→3** — stealth lie is now tempting (ties for 2nd highest), hint lie is less attractive
2. **doorbell→hallway_cam** — moved from FRONT_DOOR/DOORBELL to HALLWAY/SECURITY_CAM. Claim "no one walked toward the living room" sounds like it could match "trying too hard." No longer an obvious safe haven.
3. **Hint-group claims rewritten** — all three living room sensor claims now equally "protesting." motion_lr no longer uniquely aggressive.

**Files modified:**
| File | Changes |
|------|---------|
| `scripts/v3-puzzles.ts` | P2 cards, reactive hints, verdict quips, balance comments |

### Fix C: New Validator Invariants (I26-I28)

Added three new checks to catch the problems found in PT3:

| Check | Type | What it catches |
|-------|------|-----------------|
| I26 | FAIL | Stealth lie strength < median card strength (not tempting enough) |
| I27 | FAIL | Hint-group strength spread > 2 (one card dominates by strength) |
| I28 | WARN | Non-hint truth at a location shared by zero other cards (safe haven) |

**Files modified:**
| File | Changes |
|------|---------|
| `scripts/prototype-v3.ts` | Added I26, I27, I28 |

### Fix D: Persona Swap

Replaced Sarah (casual/social) and Jen (vibes/personality) with game expert roles:
- **Kai** (37, indie game designer) — evaluates design intent, identifies dominant strategies, critiques puzzle structure
- **Rio** (26, puzzle optimizer/speedrunner) — calculates EV, tests probe strategy, maps decision space

Sarah and Jen persona files preserved. New files added.

**Files modified:**
| File | Changes |
|------|---------|
| `_process/v3-design/playtest-1/protocol.md` | Agent table updated, doorbell→hallway_cam reference |
| `_process/v3-design/playtest-1/persona-kai.md` | New |
| `_process/v3-design/playtest-1/persona-rio.md` | New |

---

## Current Validator State

### Per-puzzle (26 pass/fail checks + 3 WARNs)
I1-I3: Structure (2 lies, 6 cards, 120 sequences)
I4-I6: Option C structure (hint group, stealth lie, red herrings)
I7a-I7b: Neither group safe
I8-I9: Winnable, lies tempting
I10-I11: T1 recovery (uses reduced penalty)
I12: Lie strengths differ
I13-I14: Win rate 15-80% / flawless rate 5-35%
I15-I16: Reactive hint + verdict quip coverage
I17: hintDimension.matchFn matches hintMatchingIds
I18: Specific hints implicate correct lies (vague exempt)
I19: Implicates ≤3 cards
I20: No card IDs in closing dialogue
I21: (WARN) Hint lie shares attribute with red herring
I22: (WARN) Hint lie strength ≤ max red herring strength
I23: Hint quality matches card group (hint-group = specific, non-hint = vague)
I24: Vague hints have empty implicates
I25: Specific non-lie hints implicate ≥1 card
I26: Stealth lie strength ≥ median card strength (tempting)
I27: Hint-group strength spread ≤ 2
I28: (WARN) No non-hint truth at isolated location

### Cross-puzzle (7 checks + 1 WARN)
C1: Win rate non-increasing
C2: (WARN) No strength always a lie
C3: Lie pairs vary
C4: Target non-decreasing
C5: Safe complements < target
C6: Weak-lie T1 recovery
C7: (WARN) Worst-lie T1 recovery
C8: Informed win rate non-increasing

### Current results
- P1: 25/26 (I26 FAIL: wifi_log str=3 < median 3.5) + I22 WARN, I28 WARN
- P2: 26/26 PASS + I28 WARN
- P3: 25/26 (I26 FAIL: water_meter str=3 < median 3.5) + I21 WARN, I28 WARN
- Cross-puzzle: 6/7 (C2 WARN: str-3 always a lie)

Probe-safe gap: +13.3pp, +11.7pp, +10.0pp — probing has positive EV on all puzzles.

---

## Files

### Source of truth
- `scripts/v3-types.ts` — types (includes ReactiveHint with quality)
- `scripts/v3-puzzles.ts` — puzzle data (reduced penalty + P2 fixes applied)
- `scripts/prototype-v3.ts` — validator (26 per-puzzle + 3 WARNs, 8 cross-puzzle)
- `scripts/play-v3.ts` — interactive CLI engine (reduced penalty applied)

### Design docs
- `_process/v3-design/design.md` — full game design (updated post-PT3)
- `_process/v3-design/1-principles-and-depth-audit.md` — 7 principles, depth audit
- `_process/v3-design/2-conditional-hints.md` — conditional hints decision doc
- `_process/v3-design/3-reduced-lie-penalty.md` — reduced penalty decision doc
- `_process/v3-design/puzzle-gen-invariants.md` — 13 semantic invariants + backward generation
- `_process/v3-design/playtest-prompt-template.md` — agent prompt template
- `_process/v3-design/playtest-readiness-checklist.md` — pre-launch checklist (reusable)

### Playtest files
- `_process/v3-design/playtest-1/briefing.md` — game rules
- `_process/v3-design/playtest-1/puzzles-player-view.md` — card data (synced with current puzzles)
- `_process/v3-design/playtest-1/survey.md` — 9-part survey template (single-puzzle format)
- `_process/v3-design/playtest-1/persona-{kai,marcus,rio,david,aisha}.md` — active personas
- `_process/v3-design/playtest-1/persona-{sarah,jen}.md` — retired personas (preserved)
- `_process/v3-design/playtest-1/protocol.md` — pass criteria (H1-H4, S1-S10)
- `_process/v3-design/playtest-1/results.md` — playtest 2 compiled results
- `_process/v3-design/playtest-1/results-pt3.md` — playtest 3 compiled results
- `_process/v3-design/playtest-1/logs/` — agent surveys
- `_process/v3-design/playtest-1/_archive/` — older playtest logs

## PT4 Readiness Audit

Ran full checklist (`playtest-readiness-checklist.md`) + adversarial audit. Issues found and fixed:

| Issue | Severity | Fix |
|-------|----------|-----|
| Survey assumed 3-puzzle sessions | CRITICAL | Rewrote survey.md for single-puzzle |
| Protocol said agents NOT told about probe; briefing tells them | CRITICAL | Updated protocol information rules |
| Stale TODOs in "What's Next" (sync + probe text) | CRITICAL | Removed (both done) |
| design.md examples used old `-strength` penalty | MODERATE | Added to disclaimer note |
| design.md pitch said "subtract it" (ambiguous) | MODERATE | Changed to "subtract (strength - 1)" |
| Protocol S4 threshold trivially easy with transparent probe | MODERATE | Raised to ≥2 agents actually probe |
| Prompt template referenced retired persona "sarah" | MODERATE | Updated to "kai" |
| Prompt template had stale multi-puzzle survey note | MODERATE | Simplified for single-puzzle |

**Result: All issues resolved. Ready to launch.**

---

## What's Next

**Playtest 4** — test reduced lie penalty + P2 puzzle fixes + new personas:
- Single puzzle per agent (P2, daily format)
- 5 agents: Kai, Marcus, Rio, David, Aisha (fresh memory, opus 4.5)
- Key questions:
  1. Does anyone lose? (H1 — must have ≥1 loss)
  2. Does anyone probe T1? (reduced penalty makes it viable)
  3. Is motion_lr still unanimously flagged? (claim rewrite should spread suspicion)
  4. Is hallway_cam still the obvious safe opener? (HALLWAY location should add ambiguity)
  5. Does anyone play smartwatch? (str 4 makes it tempting — the trap)
  6. Do Kai/Rio give structural design feedback? (new persona value)
