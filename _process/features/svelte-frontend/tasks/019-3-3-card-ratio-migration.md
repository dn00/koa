# Task 019: 3/3 Card Ratio Migration

**Status:** in-progress
**Assignee:** -
**Phase:** Core
**Complexity:** M

---

## Objective

Migrate KOA Mini from 4 truths / 2 lies to **3 truths / 3 lies** to reduce random win rate from ~50% to ~5%.

---

## Rationale

With 4/2 ratio, a player randomly picking 3 cards has ~50% chance of winning (picking at least 2 truths). With 3/3, they must pick exactly the 3 truths — only ~5% chance.

This makes the game harder and rewards careful deduction over guessing.

---

## Changes Made

### Specs Updated ✅
- `koa-mini-spec.md` — Changed "2 lies" to "3 lies"
- `koa-mini-puzzle-prompt.md` — Updated to 3/3 ratio, new balance math, `liesRevealed` keys (`multiple`, `all`)
- `task-017` — Updated for `multiple`/`all` keys

### Puzzles Updated ✅
- `builtin.ts` — PrintGate converted to 3/3 (added `router_session` lie)
- `v5-puzzles.ts` — PrintGate converted to 3/3

---

## Remaining Work

### 1. Update Validator
The `prototype-v5.ts` validator needs updating for 3/3:

| Check | Current | New |
|-------|---------|-----|
| S2 (lie count) | expects 2 | expects 3 |
| S3 (truth count) | expects 4 | expects 3 |
| B5 (win rate) | 15-50% | 3-15% |
| B6 (FLAWLESS rate) | 5-25% | 1-10% |

### 2. Fix PrintGate Balance Issues
Current validation failures:
- [ ] C1: 2 direct contradictions (max 1) — change `router_session` to inferential
- [ ] L1: Two lies same strength (4, 4) — vary strengths
- [ ] B4: Spread too wide (26) — adjust card strengths

### 3. Update Other Puzzles (Optional)
Other puzzles in v5-puzzles.ts still use 4/2:
- `midnight-print`
- `garage-door`
- `drone-order`
- `midnight-drive`
- `cactus-calamity`

Decision: Keep as legacy or update all?

### 4. Validate Generated Puzzle
The generated puzzle `scripts/generated-puzzle.ts` (Thermostat War) still uses 4/2. Either:
- Update to 3/3
- Or regenerate using updated prompt

---

## Validation Checklist

After changes:
- [ ] PrintGate passes all validator checks
- [ ] Win rate ~5% for random play
- [ ] FLAWLESS rate ~3-5% (requires perfect play)
- [ ] At least 1 inferential lie per puzzle
- [ ] Max 1 direct contradiction lie
- [ ] Lie strengths differ

---

## Definition of Done

- [ ] Validator updated for 3/3 expectations
- [ ] PrintGate passes validation
- [ ] At least one puzzle fully converted and validated
- [ ] Decision made on legacy 4/2 puzzles

---

## Log

### Change Log
- 2026-01-30 [Dev] Created task, specs and PrintGate already updated

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | in-progress | Dev | Created |
