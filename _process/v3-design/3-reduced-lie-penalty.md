# Design Decision: Reduced Lie Penalty + Transparent Probe

**Date:** 2026-01-27
**Triggered by:** Playtest 3 findings

---

## Playtest 3 Findings

5/5 FLAWLESS, 0 losses. Safe-play dominance persists despite conditional hints working correctly. The scoring math prevents probing:

- P2 target 7, eat weakest lie (str 3): `-3 + 5 + 4 = 6 < 7`. Can't CLEAR.
- No rational agent will probe when hitting a lie means automatic failure.
- H1 (loss rate) and S1 (difficulty curve) still failing.

The conditional hint system (see `2-conditional-hints.md`) solved the *information* problem — risky T1 plays now yield better hints. But the *penalty* problem remains: the information is worthless if the penalty for a bad probe kills your run.

## Fix A: Reduced Lie Penalty — `-(strength - 1)` instead of `-strength`

Lies still hurt, but recovery is possible. "Partial credit" — even a lie has some truth in it.

### Math comparison

| Puzzle | Target | Weak Lie T1 (old) | Weak Lie T1 (new) | Strong Lie T1 (new) |
|--------|--------|-------------------|-------------------|---------------------|
| P1 (target 5) | 5 | -3+4+4=5 CLEARED | -(3-1)+4+4=**6 CLEARED** | -(5-1)+4+4=**4 CLOSE** |
| P2 (target 7) | 7 | -3+5+4=6 CLOSE | -(3-1)+5+4=**7 CLEARED** | -(4-1)+5+4=**6 CLOSE** |
| P3 (target 8) | 8 | -3+5+4=6 CLOSE | -(3-1)+5+4=**7 CLOSE** | -(5-1)+5+4=**5 BUSTED** |

Key result: Eating the weak lie on T1 now leads to CLEARED on P1/P2, CLOSE on P3. Probing becomes a viable gamble on easy/medium puzzles. Eating the strong lie is still punishing.

FLAWLESS is unchanged — still requires 0 lies played.

## Fix B: Transparent Probe Mechanic

Added to game rules/briefing: **"Your Turn 1 choice determines what KOA reveals. Play a card KOA is watching — she'll tell you more."**

This is a rules text change only. The conditional hint system already works mechanically. Players need to *know it exists* to make an informed decision. Without this, the probe-vs-protect tradeoff is invisible and players default to safe play.

## Implementation

### Scoring change
```typescript
// Before:
const delta = isLie ? -card.strength : +card.strength;

// After:
const delta = isLie ? -(card.strength - 1) : +card.strength;
```

Applied in:
- `scripts/prototype-v3.ts` — validator engine + invariant calculations (I7a/b, I10, I11)
- `scripts/play-v3.ts` — interactive CLI engine + play summary display

### Invariant adjustments
- **I10/I11**: Recovery calculations use `-(str-1)` instead of `-str`
- **I13**: Win rate upper bound widened from 70% to 80% (recovery is easier with reduced penalty)
- **I7a/I7b**: Group score calculations use `-(str-1)` for lies

### Design doc updates
- `design.md` section 3.3: Scoring rule updated
- `design.md` section 3.5: Transparent probe note added
- `design.md` section 8: Skill gradient updated for reduced penalty
- `design.md` appendix B: I13 bound updated

## Expected Impact

- Probing becomes viable on P1/P2 (weak lie T1 → CLEARED)
- P3 remains hard (weak lie T1 → CLOSE, strong lie → BUSTED)
- Safe-play is no longer strictly dominant: probing has positive expected value when it yields specific hints
- Win rates increase slightly overall but stay within bounds
- FLAWLESS rate unchanged (still requires 0 lies)
- Probe-safe gap should become positive (probing now has better EV than safe play on easy/medium)
