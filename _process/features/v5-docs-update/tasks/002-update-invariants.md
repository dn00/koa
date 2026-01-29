# Task 002: Update INVARIANTS.md

**Status:** backlog
**Complexity:** S
**Depends On:** none (but run after app-v5-migration complete)
**Implements:** R3, R4

---

## Objective

Update INVARIANTS.md examples and references for V5. Core invariants still apply - just update terminology.

---

## Invariants Status

| Invariant | Status | Notes |
|-----------|--------|-------|
| I1: Deterministic Resolver | ✓ Keep | V5 uses seed for determinism |
| I2: Offline-First | ✓ Keep | Unchanged |
| I3: LLM Never Adjudicates | ✓ Keep | KOA barks still pre-generated |
| I4: Event-Sourced Truth | ✓ Keep | V5Event replaces GameEvent |
| I5: Fail-Closed Packs | ✓ Keep | V5 pack validation |
| I6: Instant Mechanics | ✓ Keep | <120ms still applies |
| I7: Fair Puzzles | ⚠ Update | Criteria changed for V5 |

---

## Sections to Update

### I7: Fair Puzzles (around line 96-106)

**Current (MVP):**
```markdown
**Every puzzle has at least 2 distinct winning paths.**
- All concerns addressable with dealt hand
- No forced MAJOR contradictions in winning paths
- Refutation cards exist for all counters (or bruteforce viable)
- Total power ≥ resistance + 10 (comfortable margin)
```

**Update to (V5):**
```markdown
**Every puzzle is winnable without playing lies.**
- At least 3 truth cards in every hand
- Total truth strength ≥ target belief
- Lie cards are tempting but avoidable
- Objection is survivable (stand by truth = safe)
```

### Quality Bars - Puzzle Constraints (around line 121-128)

**Current (MVP):**
```markdown
| Constraint | Limit |
|------------|-------|
| Trap cards per puzzle | ≤ 1 |
| MINOR contradictions in optimal path | ≤ 3 |
| Forced MAJOR contradictions | 0 |
```

**Update to (V5):**
```markdown
| Constraint | Limit |
|------------|-------|
| Lies per puzzle | ≤ 3 |
| Lies in optimal path | 0 |
| Truth cards must reach target | Yes |
```

### Fairness Guarantees (around line 143-155)

**Current has MVP-specific rules (F1-F8). Update for V5:**
```markdown
| Rule | Description |
|------|-------------|
| F1 | Truth-only path must reach target belief |
| F2 | Lies are identifiable with careful reading |
| F3 | Objection stand-by on truth = +2, safe |
| F4 | Objection withdraw = -2, always safe fallback |
| F5 | Type tax is predictable (same type = -2) |
| F6 | All evidence types viable |
```

---

## Do NOT Change

- I4 wording about event sourcing (still applies)
- Core invariant definitions (just examples)
- Violation Response section

---

## Definition of Done

- [ ] I7 updated for V5 puzzle fairness
- [ ] Quality bars updated for V5
- [ ] Fairness guarantees updated for V5
- [ ] No mentions of: Concern, Scrutiny, Counter, resistance, MAJOR/MINOR contradictions
- [ ] I4 still references event sourcing (preserved)

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
