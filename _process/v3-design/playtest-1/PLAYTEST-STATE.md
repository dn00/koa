# Playtest 1 — State After Execution

## Status: COMPLETE — PASSED (4/4 hard, 11/12 soft)

## What Happened

### Playtest Results
5 agents played P1→P2→P3. Full results at `_process/v3-design/playtest-1/results.md`.

| Agent | P1 | P2 | P3 | Pattern |
|-------|----|----|-----|---------|
| Sarah | BUSTED (1/5) | FLAWLESS (10/7) | FLAWLESS (12/8) | Chased big number, learned |
| Marcus | CLOSE (3/5) | CLOSE (6/7) | FLAWLESS (12/8) | Probed lies, punished, stopped |
| Jen | FLAWLESS (9/5) | CLOSE (5/7) | FLAWLESS (12/8) | Lucky vibes, punished, learned |
| David | FLAWLESS (10/5) | FLAWLESS (12/7) | FLAWLESS (11/8) | Safe-first, never lost |
| Aisha | CLEARED (5/5) | CLOSE (6/7) | FLAWLESS (12/8) | Probed, punished, stopped |

NPS avg: 7.6. Loss rate: 33%. All 5 would play again.

### Issues Found & Fixed
1. **P3 too easy (S2 FAIL)** — spa_pump trivially identifiable because scenario said "jets on full" and card said "jets OFF." Fixed by softening scenario (removed "jets on full") and making spa_pump claim vaguer ("no pump activation after scheduled shutdown at 10 PM").
2. **Probe trap** — Marcus/Aisha both found safe-play dominates probing. Accepted as-is (safe-play still produces good deduction).
3. **Validator gaps** — Added I21 (hint-group plausibility WARN), I22 (hint lie strength WARN), C8 (informed win rate ordering).
4. **Semantic invariants doc** — Created `_process/v3-design/puzzle-gen-invariants.md` with 11 semantic checks (S1-S11) for LLM puzzle generation that the validator can't machine-check.

## Current Validator Checks

### Per-puzzle (21 hard + 2 WARNs)
I1-I3: Structure (2 lies, 6 cards, 120 sequences)
I4-I6: Option C structure (hint group, stealth lie, red herrings)
I7a-I7b: Neither group safe
I8-I9: Winnable, lies tempting
I10-I11: T1 recovery
I12: Lie strengths differ
I13-I14: Win rate / flawless rate ranges
I15-I16: Reactive hint + verdict quip coverage
I17: hintDimension.matchFn matches hintMatchingIds
I18: Reactive hints implicate correct lies
I19: Implicates ≤3 cards
I20: No card IDs in closing dialogue
I21: (WARN) Hint lie shares attribute with red herring
I22: (WARN) Hint lie strength ≤ max red herring strength

### Cross-puzzle (7 checks)
C1: Win rate non-increasing
C2: (WARN) No strength always a lie
C3: Lie pairs vary
C4: Target non-decreasing
C5: Safe complements < target
C6: Weak-lie T1 recovery
C7: (WARN) Worst-lie T1 recovery
C8: Informed win rate non-increasing

### Current results: All 3 puzzles 21/21 PASS. Cross-puzzle 6/7 (C2 WARN: str-3 always a lie).

## Files

### Source of truth
- `scripts/v3-types.ts` — types
- `scripts/v3-puzzles.ts` — puzzle data (P3 updated post-playtest)
- `scripts/prototype-v3.ts` — validator (21+2 per-puzzle, 7 cross-puzzle)
- `scripts/play-v3.ts` — interactive CLI engine

### Design docs
- `_process/v3-design/puzzle-gen-invariants.md` — 11 semantic invariants for LLM puzzle gen
- `_process/v3-design/playtest-1/results.md` — full playtest results + survey data

### Playtest files
- `_process/v3-design/playtest-1/briefing.md` — game rules
- `_process/v3-design/playtest-1/puzzles-player-view.md` — card data (P3 updated)
- `_process/v3-design/playtest-1/survey.md` — survey template
- `_process/v3-design/playtest-1/persona-{sarah,marcus,jen,david,aisha}.md` — personas
- `_process/v3-design/playtest-1/protocol.md` — pass criteria
- `_process/v3-design/playtest-1/logs/{sarah,marcus,jen,david,aisha}-survey.md` — agent logs

## What's Next
- Playtest 1 is complete and passed
- P3 content fixed, validator updated, semantic invariants documented
- Ready for: next design iteration, more puzzles, or production work
