# Task 008: Objection Flow

**Status:** backlog
**Assignee:** -
**Blocked By:** 006
**Phase:** Gameplay
**Complexity:** M
**Depends On:** 006
**Implements:** R10.1, R10.2, R10.3

---

## Objective

Create Objection prompt and resolution flow that appears after turn 2.

---

## Context

After turn 2, KOA challenges the last played card. In Mini mode, this auto-resolves optimally. In Advanced mode, player chooses Stand By or Withdraw.

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage.tsx` — Mini auto-resolves (no modal)
- `packages/engine-core/src/resolver/v5/objection.ts` — shouldTriggerObjection, autoResolveObjection, resolveObjectionState
- `_process/context/koa-mini-components.md` — Component spec

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

### AC-1: System Check Bark ← R10.1
- **Given:** Turn 2 just completed
- **When:** KOA responds to card play
- **Then:** Displays "System Check" bark in BarkPanel (both modes)
- **Test Type:** integration

### AC-2: Mini Auto-Resolve ← R10.2
- **Given:** Mode = 'mini', turn 2 complete
- **When:** Objection would trigger
- **Then:** Auto-resolves optimally (stand by truth, withdraw lie), no prompt shown
- **And:** Result appears as KOA bark in BarkPanel
- **Test Type:** integration

### AC-3: Advanced Shows Prompt ← R10.3
- **Given:** Mode = 'advanced', turn 2 complete
- **When:** Objection triggers
- **Then:** Objection prompt overlay appears with Stand By / Withdraw buttons
- **Test Type:** integration

### AC-4: Stand By Choice ← R10.3
- **Given:** Objection prompt visible (Advanced)
- **When:** Player taps "Stand By"
- **Then:** Belief changes by +2 (truth) or -4 (lie), KOA response in BarkPanel
- **Test Type:** integration

### AC-5: Withdraw Choice ← R10.3
- **Given:** Objection prompt visible (Advanced)
- **When:** Player taps "Withdraw"
- **Then:** Belief changes by -2, KOA response in BarkPanel
- **Test Type:** integration

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

1. ObjectionPrompt overlay (Advanced mode only, distinct from Zone 2 inline swap)
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
