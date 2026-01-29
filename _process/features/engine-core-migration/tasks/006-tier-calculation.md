# Task 006: Tier Calculation

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** 2 - Resolver Migration
**Complexity:** S
**Depends On:** 002
**Implements:** R3.1 (via getTier)

---

## Objective

Migrate the getTier function that determines the game outcome tier (FLAWLESS, CLEARED, CLOSE, BUSTED) based on final belief vs target.

---

## Context

V5 uses four tiers based on how final belief compares to target. The tier thresholds are configurable via GameConfig.tiers functions.

### Relevant Files
- `scripts/v5-rules.ts` - getTier (lines 61-66)
- Task 002 output: GameConfig with tiers functions

### Embedded Context

**Tier Rules (from DEFAULT_CONFIG):**
```typescript
tiers: {
  flawless: (belief, target) => belief >= target + 5,
  cleared: (belief, target) => belief >= target,
  close: (belief, target) => belief >= target - 5,
  // busted: belief < target - 5 (implicit)
}
```

**Tier Order:** FLAWLESS > CLEARED > CLOSE > BUSTED

---

## Acceptance Criteria

### AC-1: getTier Returns FLAWLESS When Above Target+5
- **Given:** belief=60, target=50, default config
- **When:** getTier called
- **Then:** Returns 'FLAWLESS'
- **Test Type:** unit

### AC-2: getTier Returns CLEARED When At/Above Target
- **Given:** belief=50, target=50, default config
- **When:** getTier called
- **Then:** Returns 'CLEARED'
- **Test Type:** unit

### AC-3: getTier Returns CLOSE When Near Target
- **Given:** belief=47, target=50, default config
- **When:** getTier called
- **Then:** Returns 'CLOSE' (47 >= 50-5)
- **Test Type:** unit

### Edge Cases (REQUIRE TESTS)

#### EC-1: Boundary between FLAWLESS and CLEARED
- **Scenario:** belief=54, target=50 (exactly target+4)
- **Expected:** Returns CLEARED (not FLAWLESS, needs target+5)
- **Test Type:** unit

#### EC-2: Boundary between CLOSE and BUSTED
- **Scenario:** belief=44, target=50 (exactly target-6)
- **Expected:** Returns BUSTED (not CLOSE, needs >= target-5)
- **Test Type:** unit

---

## Scope

### In Scope
- `getTier(belief: number, target: number, config: GameConfig): Tier`

### Out of Scope
- Verdict messages (puzzle data, not resolver)
- Tier display (presentation layer)

---

## Implementation Hints

1. Create `packages/engine-core/src/resolver/v5/tier.ts`
2. Check tiers in order: flawless, cleared, close, then default to busted
3. Pure function - just applies config functions to inputs

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Function is pure
- [ ] No `any` types
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Tier determines game outcome and which verdict message to show.
**Decisions:** Keep configurable tier functions for difficulty presets.

### Implementation Notes
> Written by Implementer

### Review Notes
> Written by Reviewer

### Change Log
> Append-only, chronological

- 2026-01-28 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created, blocked by 002 |
