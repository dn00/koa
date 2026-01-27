# Task 019: Submit Flow with Preview

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** M
**Depends On:** 003, 004, 005, 006, 017
**Implements:** R3.2, R3.3, R7.6, R8.3

---

## Objective

Implement the full submit flow: card selection (1-3 cards), preview panel showing expected damage/concerns/contradictions, confirmation, and resolution with WHY panel explanation.

---

## Context

Before submitting, players see a preview of what will happen. This includes damage dealt, concerns addressed, any contradictions detected, and KOA's counter response. After confirming, the move resolves and the WHY panel explains the outcome.

### Relevant Files
- `packages/app/src/components/submit/SubmitButton.tsx` (to create)
- `packages/app/src/components/submit/PreviewPanel.tsx` (to create)
- `packages/app/src/components/submit/WhyPanel.tsx` (to create)

### Embedded Context

**Submit Flow (from D24):**
1. Player selects 1-3 cards
2. Preview shows: damage, concerns addressed, contradictions, KOA's response
3. Player confirms SUBMIT
4. Resolution: cards checked, counter applied, damage calculated, cards added to story
5. "WHY?" panel shows move result breakdown

**Preview Information:**
- Expected damage (with contested penalty, corroboration bonus)
- Which concerns will be addressed
- Contradiction severity (MINOR: warning, MAJOR: blocked)
- Counters that apply

**Invariant I6 - Instant Mechanics:**
- Resolution < 120ms
- WHY panel is educational, not blocking

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Submit flow
- `docs/D06-CORE-GAME-LOOP-UX.md` - UX flow

---

## Acceptance Criteria

### AC-1: Card Selection State <- R3.1
- **Given:** Run screen displayed
- **When:** Player taps cards
- **Then:** Selection state tracks 1-3 selected cards
- **Test Type:** integration

### AC-2: Max 3 Cards <- R3.1
- **Given:** 3 cards selected
- **When:** Player taps 4th card
- **Then:** Either: deselects oldest, or selection disabled, or warning shown
- **Test Type:** unit

### AC-3: Preview Damage <- R3.2
- **Given:** 2 cards selected (power 8, 5)
- **When:** Preview displayed
- **Then:** Shows expected damage (13, or modified if contested/corroborated)
- **Test Type:** integration

### AC-4: Preview Concerns <- R3.2
- **Given:** Selected cards prove IDENTITY
- **When:** Preview displayed
- **Then:** Shows "Addresses: IDENTITY"
- **Test Type:** integration

### AC-5: Preview Contradictions <- R3.2, R7.6
- **Given:** Selected cards create MINOR contradiction with story
- **When:** Preview displayed
- **Then:** Shows yellow warning: "MINOR contradiction: +1 scrutiny"
- **Test Type:** integration

### AC-6: MAJOR Blocks Submit <- R7.6
- **Given:** Selected cards create MAJOR contradiction
- **When:** Preview displayed
- **Then:** Submit button disabled, red warning shown
- **Test Type:** integration

### AC-7: Preview Counter Response <- R3.2
- **Given:** Counter targets IDENTITY, selected card proves IDENTITY
- **When:** Preview displayed
- **Then:** Shows "Contested by: Security Camera (-50%)"
- **Test Type:** integration

### AC-8: Corroboration Indicator <- R8.3
- **Given:** 2 selected cards share HOME location
- **When:** Preview displayed
- **Then:** Shows corroboration indicator (+25%)
- **Test Type:** integration

### AC-9: Confirm Submit <- R3.3
- **Given:** Valid selection, preview shown
- **When:** Submit button tapped
- **Then:** Calls store.submitCards(), UI updates
- **Test Type:** integration

### AC-10: WHY Panel <- R3.2
- **Given:** Move just resolved
- **When:** Resolution complete
- **Then:** Expandable WHY panel shows breakdown
- **Test Type:** integration

### AC-11: Resolution Time <- I6
- **Given:** Submit tapped
- **When:** Resolution runs
- **Then:** UI updates in <120ms
- **Test Type:** performance

### Edge Cases

#### EC-1: No Cards Selected
- **Scenario:** Submit tapped with 0 cards
- **Expected:** Submit button disabled

#### EC-2: All Cards Disabled
- **Scenario:** All hand cards already in story
- **Expected:** Cannot select any, show "No moves left"

### Error Cases

#### ERR-1: Resolution Fails
- **When:** Resolver throws error
- **Then:** Show error message, don't update state
- **Error Message:** "Something went wrong. Please try again."

---

## Scope

### In Scope
- Card selection management (1-3 cards)
- Preview panel component
- Damage preview calculation
- Concern preview
- Contradiction warning (MINOR yellow, MAJOR red/blocked)
- Counter response preview
- Corroboration indicator
- Submit button (enabled/disabled states)
- WHY panel (expandable)
- Integration with Zustand store

### Out of Scope
- Voice bark on submit (Task 024)
- Animation (nice-to-have)

---

## Implementation Hints

```tsx
import { useGameStore } from '@/stores/game';
import { calculatePreview } from '@aura/engine-core';

function SubmitFlow() {
  const [selectedIds, setSelectedIds] = useState<CardId[]>([]);
  const runState = useGameStore(state => state.runState);
  const puzzle = useGameStore(state => state.currentPuzzle);
  const submitCards = useGameStore(state => state.submitCards);

  const preview = useMemo(() => {
    if (selectedIds.length === 0) return null;
    return calculatePreview(runState, puzzle, selectedIds);
  }, [selectedIds, runState, puzzle]);

  const canSubmit = preview && preview.contradictionSeverity !== 'MAJOR';

  const handleSubmit = useCallback(() => {
    if (canSubmit) {
      submitCards(selectedIds);
      setSelectedIds([]);
    }
  }, [canSubmit, selectedIds, submitCards]);

  return (
    <div className="submit-flow">
      <PreviewPanel preview={preview} />

      {preview?.contradictionSeverity === 'MINOR' && (
        <Warning severity="minor">
          MINOR contradiction: +1 scrutiny
        </Warning>
      )}

      {preview?.contradictionSeverity === 'MAJOR' && (
        <Warning severity="major">
          MAJOR contradiction: Cannot submit
        </Warning>
      )}

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        SUBMIT
      </button>
    </div>
  );
}

interface Preview {
  damage: number;
  concernsAddressed: ConcernId[];
  contradictionSeverity: ContradictionSeverity;
  contestedBy: CounterId[];
  hasCorroboration: boolean;
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

**Context:** Critical flow - must be clear and prevent accidental bad moves.
**Decisions:**
- Preview shown before confirm
- MAJOR contradictions block submit
- WHY panel is educational debrief
**Questions for Implementer:**
- How to handle preview calculation performance?
- Animation for WHY panel expand?

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
| AC-8 | | |
| AC-9 | | |
| AC-10 | | |
| AC-11 | | |
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
