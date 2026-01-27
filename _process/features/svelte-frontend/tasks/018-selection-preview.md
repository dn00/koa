# Task 018: Selection Preview

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** S
**Depends On:** 002
**Implements:** R9 (feedback before action)

---

## Objective

Build the selection preview panel showing damage estimate, corroboration bonus, contradiction warnings, and triggered counters before submit.

---

## Context

Players need to know what will happen before committing. This panel shows consequences of current selection.

### Relevant Files
- `svelte-frontend.plan.md` — UI Layout section
- `docs/D28-END-GAME-UI-SPEC.md` §1.D2 — Selection Preview

### Embedded Context

**Preview Panel:**
```
╔═══════════════════════════╗
║ ~12 dmg  ✨ Stories Align ║  ← damage + corroboration
║ ⚠️ SUSPICIOUS +1 scrutiny ║  ← contradiction warning
║ Triggers: Camera          ║  ← counter that will challenge
╚═══════════════════════════╝
```

**States:**

1. **No Selection:**
   - Hidden or shows "Select cards"

2. **Clean Selection:**
   - Damage estimate
   - Concerns addressed
   - Counters triggered (if any)

3. **Corroboration:**
   - "✨ Stories Align +25%" when 2+ cards share claims

4. **Minor Contradiction (SUSPICIOUS):**
   - ⚠️ Yellow warning
   - "+1 Scrutiny" penalty shown
   - Can still submit

5. **Major Contradiction (BLOCKED):**
   - ⛔ Red warning
   - "Cannot submit" message
   - Submit button disabled

---

## Acceptance Criteria

### AC-1: Hidden When No Selection
- **Given:** No cards selected
- **When:** Preview renders
- **Then:** Hidden or minimal "Select cards" prompt
- **Test Type:** unit

### AC-2: Damage Estimate
- **Given:** Cards selected
- **When:** Preview renders
- **Then:** Shows "~X dmg" estimate
- **Test Type:** unit

### AC-3: Concerns Addressed
- **Given:** Cards that prove concerns
- **When:** Preview renders
- **Then:** Shows which concerns will be addressed
- **Test Type:** unit

### AC-4: Counter Trigger Warning
- **Given:** Cards that trigger counter
- **When:** Preview renders
- **Then:** Shows "Triggers: [Counter Name]"
- **Test Type:** unit

### AC-5: Corroboration Bonus
- **Given:** 2+ cards share claims (e.g., both claim KITCHEN)
- **When:** Preview renders
- **Then:** Shows "✨ Stories Align +25%"
- **Test Type:** unit

### AC-6: Minor Contradiction Warning
- **Given:** Cards with minor time/claim conflict
- **When:** Preview renders
- **Then:** Shows ⚠️ SUSPICIOUS, +1 scrutiny warning
- **Test Type:** unit

### AC-7: Major Contradiction Block
- **Given:** Cards with impossible conflict
- **When:** Preview renders
- **Then:** Shows ⛔ BLOCKED, submit disabled
- **Test Type:** unit

### AC-8: Real-time Update
- **Given:** Selection changes
- **When:** Card added/removed
- **Then:** Preview updates immediately (<50ms)
- **Test Type:** integration

### Edge Cases

#### EC-1: Multiple Corroborations
- **Scenario:** Cards align on 2 different claims
- **Expected:** Shows combined bonus

#### EC-2: Contradiction + Corroboration
- **Scenario:** Some cards align, others conflict
- **Expected:** Shows both warnings

---

## Scope

### In Scope
- SelectionPreview component
- Damage calculation display
- Corroboration indicator
- Contradiction warnings (MINOR/MAJOR)
- Counter trigger display

### Out of Scope
- Actual damage calculation (engine-core)
- Contradiction detection logic (engine-core)

---

## Implementation Hints

1. Subscribe to selected cards from parent/store
2. Use engine-core's preview functions for calculations
3. Animate state changes (fade between states)
4. Color coding: green (good), yellow (warning), red (blocked)

---

## Definition of Done

- [ ] All preview states display correctly
- [ ] Corroboration shows when applicable
- [ ] Contradiction warnings accurate
- [ ] Updates in real-time
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** Critical for player decision-making. Shows consequences before commit.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
