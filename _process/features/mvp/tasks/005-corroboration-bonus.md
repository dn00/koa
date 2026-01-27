# Task 005: Corroboration Bonus

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Engine
**Complexity:** S
**Depends On:** 003
**Implements:** R8.1, R8.2

---

## Objective

Implement the corroboration bonus: when 2+ cards in a submission share a claim (location, state, or activity), apply a 25% damage bonus.

---

## Context

Corroboration rewards players for building a coherent story. If multiple cards agree on the same fact, the alibi is more convincing and deals more damage.

### Relevant Files
- `packages/engine-core/src/resolver/corroboration.ts` (to create)
- Depends on: `packages/engine-core/src/types/`, `resolver/damage.ts`

### Embedded Context

**Corroboration Rule (from D24, D31):**
```
if 2+ cards share claim (location/state/activity):
    total = ceil(total * 1.25)  # 25% bonus
```

**Claims to Check (R8.2):**
- `location` - e.g., "HOME", "GYM"
- `state` - e.g., "ASLEEP", "AWAKE"
- `activity` - e.g., "COOKING", "EXERCISING"

**Invariant I1 - Determinism:**
- Use `Math.ceil()` for rounding (consistent across platforms)
- Integer result

**Source Docs:**
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Corroboration rules

---

## Acceptance Criteria

### AC-1: Detect Shared Location <- R8.2
- **Given:** Two cards both claiming location "HOME"
- **When:** detectCorroboration(cards) is called
- **Then:** Returns true (corroboration detected)
- **Test Type:** unit

### AC-2: Detect Shared State <- R8.2
- **Given:** Two cards both claiming state "AWAKE"
- **When:** detectCorroboration(cards) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-3: Detect Shared Activity <- R8.2
- **Given:** Two cards both claiming activity "COOKING"
- **When:** detectCorroboration(cards) is called
- **Then:** Returns true
- **Test Type:** unit

### AC-4: No Corroboration <- R8.2
- **Given:** Three cards with no shared claims
- **When:** detectCorroboration(cards) is called
- **Then:** Returns false
- **Test Type:** unit

### AC-5: Apply 25% Bonus <- R8.1
- **Given:** Base damage of 20, corroboration detected
- **When:** applyCorroborationBonus(20, true) is called
- **Then:** Returns 25 (ceil(20 * 1.25))
- **Test Type:** unit

### AC-6: No Bonus Without Corroboration <- R8.1
- **Given:** Base damage of 20, no corroboration
- **When:** applyCorroborationBonus(20, false) is called
- **Then:** Returns 20 (unchanged)
- **Test Type:** unit

### AC-7: Ceil Rounding <- R8.1, I1
- **Given:** Base damage of 17, corroboration detected
- **When:** applyCorroborationBonus(17, true) is called
- **Then:** Returns 22 (ceil(17 * 1.25) = ceil(21.25) = 22)
- **Test Type:** unit

### Edge Cases

#### EC-1: Single Card
- **Scenario:** Only one card in submission
- **Expected:** No corroboration possible, returns false

#### EC-2: Three Cards All Match
- **Scenario:** All three cards share "HOME" location
- **Expected:** Still just 25% bonus (not 50%)

#### EC-3: Cards With No Claims
- **Scenario:** Cards have empty claims objects
- **Expected:** No corroboration detected

### Error Cases

None - invalid input should be caught by type system.

---

## Scope

### In Scope
- `detectCorroboration(cards: EvidenceCard[]): boolean`
- `applyCorroborationBonus(baseDamage: number, hasCorroboration: boolean): number`
- Check location, state, and activity claims

### Out of Scope
- Contested penalty interaction (combined in full resolver)
- UI indicator (Task 019)

---

## Implementation Hints

```typescript
const CORROBORATION_MULTIPLIER = 1.25;

export function detectCorroboration(cards: readonly EvidenceCard[]): boolean {
  if (cards.length < 2) return false;

  // Check if any claim type has 2+ matching values
  const locations = cards.map(c => c.claims.location).filter(Boolean);
  const states = cards.map(c => c.claims.state).filter(Boolean);
  const activities = cards.map(c => c.claims.activity).filter(Boolean);

  return (
    hasMatch(locations) ||
    hasMatch(states) ||
    hasMatch(activities)
  );
}

function hasMatch(values: (string | undefined)[]): boolean {
  const seen = new Set<string>();
  for (const v of values) {
    if (v && seen.has(v)) return true;
    if (v) seen.add(v);
  }
  return false;
}

export function applyCorroborationBonus(damage: number, hasCorroboration: boolean): number {
  if (!hasCorroboration) return damage;
  return Math.ceil(damage * CORROBORATION_MULTIPLIER);
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** Positive feedback loop - rewards coherent storytelling.
**Decisions:**
- Single 25% bonus regardless of how many claims match
- Any matching claim type triggers bonus (OR, not AND)
**Questions for Implementer:**
- Should we track which claims matched for UI feedback?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
