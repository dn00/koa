# Invariants

**Last Updated:** 2026-01-26
**Status:** Active
**Canonical Reference:** docs/D31-INVARIANTS.md

---

## Purpose

These are **non-negotiable rules** that define what the game IS. Violating these breaks the core product promise.

---

## Core Invariants

### I1. Deterministic Resolver

**Same inputs MUST produce same outputs.**

- Given identical: puzzle + seed + action sequence
- Outcomes match across all devices/browsers
- Event replay reconstructs identical state
- No floating-point math in game logic (use integers)
- No `Math.random()` in resolver (use seeded RNG)

**Test:** Golden fixtures must replay identically on all platforms.

---

### I2. Offline-First

**Core gameplay MUST work without network.**

- Once packs are cached, game is fully playable
- No network call blocks gameplay resolution
- Resume works after app restart
- Daily puzzle loads from cache if available

**Test:** Airplane mode after initial cache → full game works.

---

### I3. LLM Never Adjudicates

**Voice is cosmetic. LLM output NEVER affects game state.**

- KOA barks are pre-generated, keyed by OutcomeKey
- No runtime LLM calls for core mechanics
- Enhanced KOA (if enabled) is post-resolution decoration only
- Voice text never blocks input or animation

**Test:** Remove all voice → game mechanics unchanged.

---

### I4. Event-Sourced Truth

**Event log is canonical. State is derived.**

- All state changes are events
- Current state = replay all events from start
- Events are append-only, never modified
- Persistence snapshots for performance, but events are source of truth

**Test:** Delete snapshots, replay events → identical state.

---

### I5. Fail-Closed Packs

**Invalid packs are REJECTED, never silently degraded.**

- Schema validation on load
- Reference validation (all IDs resolve)
- Solvability validation for puzzles
- Missing pack → show error, don't proceed

**Test:** Corrupt pack JSON → clear error, game doesn't start.

---

### I6. Instant Mechanics

**Resolution < 120ms p95. Voice never blocks.**

- Submit → HUD update in <120ms
- Voice selection is async, non-blocking
- Animation doesn't delay state update
- User can see result before voice plays

**Test:** Measure p95 resolution time on mid-tier mobile.

---

### I7. Fair Puzzles

**Every puzzle has at least 2 distinct winning paths.**

- All concerns addressable with dealt hand
- No forced MAJOR contradictions in winning paths
- Refutation cards exist for all counters (or bruteforce viable)
- Total power ≥ resistance + 10 (comfortable margin)

**Test:** Solver finds ≥2 paths for every puzzle.

---

## Quality Bars

### Win Rate Targets

| Difficulty | Target Win Rate |
|------------|-----------------|
| Tutorial | 90%+ |
| Easy | 80%+ |
| Normal | 65%+ |
| Hard | 45%+ |
| Expert | 30%+ |

### Puzzle Constraints

| Constraint | Limit |
|------------|-------|
| Trap cards per puzzle | ≤ 1 |
| MINOR contradictions in optimal path | ≤ 3 |
| Forced MAJOR contradictions | 0 |

---

## Anti-Goals (Must Avoid)

These would break the game:

1. **Pure luck** - Skill must matter
2. **Overwhelming complexity** - Low-medium cognitive load
3. **Punishing difficulty** - Mistakes are recoverable
4. **Solved-at-glance** - Must have actual puzzle depth
5. **Hidden gotchas** - All critical info visible upfront

---

## Fairness Guarantees

| Rule | Description |
|------|-------------|
| F1 | Safe path (visible claims only, counters refuted) must be winnable |
| F2 | All KOA counters visible from turn 1 (FULL mode) |
| F3 | Refutation cards exist for every counter |
| F4 | Trap cards identifiable from name/source/flavor |
| F5 | MINOR contradictions allow recovery (+1 scrutiny) |
| F6 | MAJOR contradictions are clearly impossible |
| F7 | Bruteforce path viable on Easy/Normal |
| F8 | At least 3 cards in every hand are pairwise-compatible |

---

## Non-Negotiable Exclusions

These are explicitly OUT of scope:

| Exclusion | Rationale |
|-----------|-----------|
| Runtime LLM adjudication | Determinism, fairness |
| Real user data integration | Privacy, complexity |
| Multiplayer in v1 | Scope, offline-first |
| Pay-to-win mechanics | Product integrity |
| Open-ended chat/roleplay | Not this game |

---

## Violation Response

If an invariant is violated:

1. **Stop** - Do not ship
2. **Investigate** - Find root cause
3. **Fix** - Address at the source
4. **Test** - Add fixture to prevent regression
5. **Document** - Update if invariant needs clarification

---

## References

- `docs/D31-INVARIANTS.md` - Full invariants specification
- `docs/D01-NON-GOALS-SCOPE-GUARDRAILS.md` - Explicit exclusions
- `docs/D10-PACK-VALIDATION.md` - Validation requirements
