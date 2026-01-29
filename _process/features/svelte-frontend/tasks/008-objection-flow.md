# Task 008: Objection Flow

**Status:** backlog
**Assignee:** -
**Blocked By:** 006
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 006
**Implements:** R6.1, R6.2, R6.3, R6.4

---

## Objective

Create Objection prompt and resolution flow that appears after turn 2.

---

## Context

After turn 2, KOA challenges the last played card. In Mini mode, this auto-resolves optimally. In Advanced mode, player chooses Stand By or Withdraw.

### Relevant Files
- `packages/engine-core/src/resolver/v5/` — resolveObjection, autoResolveObjection
- `_process/v5-design/impo/koa-mini-spec.md` — Mini auto-resolve
- `_process/context/v5-design-context.md` — Objection mechanics

### Embedded Context

**V5 Objection Mechanics:**
```typescript
// After turn 2, KOA challenges the last played card
// Player has two choices:
// - Stand By: +2 if truth, -4 if lie
// - Withdraw: -2 always (safe choice)

interface ObjectionState {
  challengedCardId: CardId;
  choice: 'stood_by' | 'withdrawn' | null;
  resolved: boolean;
}
```

**Mode Differences:**
```typescript
// Mini: Auto-resolve optimally
if (mode === 'mini') {
  const choice = autoResolveObjection(lastPlayedCard);
  // If truth: stand_by (+2)
  // If lie: withdraw (-2, better than -4)
}

// Advanced: Player chooses
if (mode === 'advanced') {
  showObjectionPrompt(challengedCard);
}
```

**Objection Prompt Layout:**
```
┌─────────────────────────────────────────┐
│              SYSTEM CHECK               │
├─────────────────────────────────────────┤
│                                         │
│  KOA: "Hold on... let me verify this    │
│        evidence you just presented."    │
│                                         │
│  [Card being challenged]                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [ STAND BY ]      [ WITHDRAW ]         │
│    +2 / -4           -2                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Acceptance Criteria

### AC-1: Objection Appears After Turn 2 ← R6.1
- **Given:** Turn 2 just completed
- **When:** Belief change animation finishes
- **Then:** Objection prompt appears (in Advanced mode)
- **Test Type:** integration

### AC-2: Mini Auto-Resolve ← R6.2
- **Given:** Mode = 'mini', turn 2 complete
- **When:** Objection would trigger
- **Then:** Auto-resolves optimally, no prompt shown
- **Test Type:** integration

### AC-3: Stand By Choice ← R6.3
- **Given:** Objection prompt visible
- **When:** Player taps "Stand By"
- **Then:** Belief changes by +2 (truth) or -4 (lie)
- **Test Type:** integration

### AC-4: Withdraw Choice ← R6.3
- **Given:** Objection prompt visible
- **When:** Player taps "Withdraw"
- **Then:** Belief changes by -2
- **Test Type:** integration

### AC-5: KOA Challenge Bark ← R6.4
- **Given:** Objection triggered
- **When:** Prompt appears
- **Then:** KOA says challenge line ("Hold on...", "Let me verify...")
- **Test Type:** component

### Edge Cases

#### EC-1: Truth Card Stood By
- **Scenario:** Player stands by a truth card
- **Expected:** +2 bonus, KOA approves

#### EC-2: Lie Card Stood By
- **Scenario:** Player stands by a lie card
- **Expected:** -4 penalty, KOA catches the lie

### Error Cases

#### ERR-1: Double Resolve
- **Scenario:** Objection already resolved, resolve called again
- **Expected:** No-op, already resolved

---

## Scope

### In Scope
- ObjectionPrompt modal component
- Stand By / Withdraw buttons
- Auto-resolve logic for Mini mode
- Belief change on resolution
- KOA challenge bark display

### Out of Scope
- Objection modal animations (Task 009)
- KOA Avatar mood changes (Task 012)

---

## Implementation Hints

1. Modal/overlay for prompt
2. Dispatch OBJECTION_RESOLVED event to store
3. Mini mode checks happen before showing prompt
4. Block other interactions during objection

---

## Definition of Done

- [ ] Objection appears after turn 2 (Advanced)
- [ ] Auto-resolves in Mini mode
- [ ] Stand By works correctly
- [ ] Withdraw works correctly
- [ ] KOA bark displays
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
