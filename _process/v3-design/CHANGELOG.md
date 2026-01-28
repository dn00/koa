# V3 "The Statement" — Changelog

---

## v3.0.0 — Initial Prototype (2026-01-27)

**Source:** New game design — complete departure from V2.5.

### Design: "The Statement"
- 6 alibi cards, exactly 2 are hidden Lies
- Play 1 card per turn for 3 turns
- Truths add strength, Lies subtract it
- KOA reveals Truth/Lie verdict after each play
- Reach target score (8-12) in 3 plays to be CLEARED
- KOA gives opening hint about what the lies share
- Reactive hint after Turn 1 changes based on which card you played

### Key Differences from V2.5
- **No scrutiny/resistance/concerns/counters** — replaced by simple score vs target
- **Hidden information is binary** — each card is Truth or Lie, revealed after play
- **Deduction from attributes** — cards have location, time, source; hints reference these
- **Reactive hints** — Turn 2 hint depends on Turn 1 play, creating strategic T1 choice
- **Simpler rules** — 3 sentences vs V2.5's 13-step processor

### Validation Invariants
- Sum of top 3 Truth strengths >= target (always winnable)
- Average Lie strength > average Truth strength (lies are tempting)
- At least 1 Truth partially matches the hint (red herring exists)
- Random play win rate ~40-70%
- FLAWLESS rate ~15-35%

### Files Created
- `_process/v3-design/design.md` — Full design document
- `_process/v3-design/CHANGELOG.md` — This file
- `scripts/prototype-v3.ts` — Brute-force checker / validator
- `scripts/play-v3.ts` — Interactive CLI game

### 3 Example Puzzles
1. **The Midnight Snack** — direct hint (names an attribute)
2. **The Broken Window** — compound hint (two attributes intersect)
3. **The Missing Package** — oblique hint (abstract/metaphorical)
