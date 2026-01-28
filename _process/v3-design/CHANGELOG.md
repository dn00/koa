# V3 "The Statement" — Changelog

---

## v3.2.0 — Conditional Reactive Hints (2026-01-27)

**Triggered by:** Playtest 2 findings (safe-play dominance, Principle 3/4 violations)

### Reactive Hint Quality Tiers
- Risky T1 (card in hint group) → specific hint (narrows stealth lie)
- Safe T1 (card NOT in hint group) → vague hint (atmosphere only)
- Lie plays → always specific (penalty already paid)
- Creates probe-vs-protect tradeoff

### Non-Partitioning Opening Hints
- P2 hint changed from "sensor in the living room" to "trying too hard to explain why nothing happened"
- Medium/hard puzzles use behavioral hints, not attribute-partition hints

### New Validator Checks
- I23: Hint quality matches card group
- I24: Vague hints have empty implicates
- I25: Specific non-lie hints implicate ≥1 card
- Updated I18: vague hints exempt from implication requirements
- New metric: probe win rate vs safe win rate gap

### New Semantic Invariants
- S12: Vague reactive hints must not identify specific cards
- S13: Opening hints should not cleanly partition by single attribute (medium/hard)
- Updated S10: hint text may be broader than matchFn for medium/hard (deliberate ambiguity)

### New Files
- `_process/v3-design/2-conditional-hints.md` — design decision doc
- `_process/v3-design/playtest-prompt-template.md` — standardized agent prompt template

### Backward Generation Process
- Added to `puzzle-gen-invariants.md`
- Puzzles authored backward: desired experience → lies → hint → reactive hints → cards → scenario

---

## v3.1.0 — Option C Split Lies + Playtest Fixes (2026-01-27)

**Triggered by:** Initial puzzle tuning and Playtest 1 findings

### Option C Structure
- 1 hint lie in hint group, 1 stealth lie outside hint group
- Neither group is "safe" — both contain a lie
- Reactive hints help find the stealth lie

### Playtest 1 Fixes
- P3 scenario softened (removed "jets on full")
- P3 spa_pump claim made vaguer ("no pump activation after scheduled shutdown at 10 PM")
- Added I21 (hint-group plausibility WARN), I22 (hint lie strength WARN), C8 (informed win rate)

### Semantic Invariants
- Created `puzzle-gen-invariants.md` with S1-S11

### Validation
- Win rate range adjusted to 15-70% (from 40-70%)
- FLAWLESS rate range adjusted to 5-35% (from 15-35%)
- Target range: 5-13

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
