# Task 020: Result Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** S
**Depends On:** 009
**Implements:** R1.5

---

## Objective

Implement the Result Screen showing ACCESS GRANTED (win) or ACCESS DENIED (loss) with score recap and navigation options.

---

## Context

After a run ends, players see the result. The screen celebrates wins and explains losses, shows key stats, and provides options to share, view archive, or play again.

### Relevant Files
- `packages/app/src/screens/results/ResultScreen.tsx` (to create)

### Embedded Context

**Result Phase (from D24):**
- Win: Resistance ≤ 0 AND all concerns addressed → **ACCESS GRANTED**
- Loss: Turns exhausted OR Scrutiny 5 → **ACCESS DENIED**
- Show score (turns used, power dealt, contradictions, counters refuted)
- Share card option

**Terminology:**
- Win: "ACCESS GRANTED"
- Loss: "ACCESS DENIED"

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Result phase
- `docs/D14-UX-WIREFRAME-SPEC.md` - Result wireframe

---

## Acceptance Criteria

### AC-1: Win Display <- R1.5
- **Given:** Run ended with win
- **When:** Result screen displayed
- **Then:** Shows "ACCESS GRANTED" prominently
- **Test Type:** unit

### AC-2: Loss Display <- R1.5
- **Given:** Run ended with loss
- **When:** Result screen displayed
- **Then:** Shows "ACCESS DENIED" with reason
- **Test Type:** unit

### AC-3: Loss Reason: Turns <- R1.5
- **Given:** Lost due to turns exhausted
- **When:** Result screen displayed
- **Then:** Shows "Access window closed"
- **Test Type:** unit

### AC-4: Loss Reason: Scrutiny <- R1.5
- **Given:** Lost due to scrutiny 5
- **When:** Result screen displayed
- **Then:** Shows "KOA is convinced you're lying"
- **Test Type:** unit

### AC-5: Score Recap <- R1.5
- **Given:** Run completed
- **When:** Result screen displayed
- **Then:** Shows: turns used, total damage, concerns addressed, contradictions, counters refuted
- **Test Type:** unit

### AC-6: Share Button <- R13.1
- **Given:** Result screen displayed
- **When:** Share button tapped
- **Then:** Opens share flow (Task 028 stub for now)
- **Test Type:** integration

### AC-7: Play Again Button <- R1.5
- **Given:** Result screen displayed
- **When:** "Play Again" tapped
- **Then:** Navigates to home or starts new daily
- **Test Type:** integration

### AC-8: Archive Button <- R1.5
- **Given:** Result screen displayed
- **When:** "View Archive" tapped
- **Then:** Navigates to archive screen
- **Test Type:** integration

### AC-9: Animation/Celebration <- (UX)
- **Given:** Win result
- **When:** Screen displayed
- **Then:** Some celebratory visual feedback
- **Test Type:** visual

### Edge Cases

#### EC-1: Perfect Run
- **Scenario:** Win with no contradictions, all counters refuted
- **Expected:** Special "perfect" indicator

### Error Cases

None - display only.

---

## Scope

### In Scope
- ResultScreen component
- Win/Loss display
- Loss reason message
- Score recap (turns, damage, concerns, contradictions, counters)
- Navigation buttons (share, play again, archive)
- Basic celebration visual

### Out of Scope
- Share card generation (Task 028)
- Archive screen (separate task)
- Detailed replay view

---

## Implementation Hints

```tsx
import { useGameStore } from '@/stores/game';
import { useNavigate } from 'react-router-dom';

function ResultScreen() {
  const runState = useGameStore(state => state.runState);
  const navigate = useNavigate();

  if (!runState?.ended) {
    return <Navigate to="/" />;
  }

  const isWin = runState.result === 'WIN';

  return (
    <div className={cn('result-screen', isWin ? 'result--win' : 'result--loss')}>
      <h1>{isWin ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</h1>

      {!isWin && (
        <p className="loss-reason">{runState.lossReason}</p>
      )}

      <div className="score-recap">
        <StatRow label="Turns Used" value={`${runState.turnsUsed}/${runState.totalTurns}`} />
        <StatRow label="Damage Dealt" value={runState.totalDamage} />
        <StatRow label="Concerns" value={`${runState.concernsAddressed.length}/${runState.totalConcerns}`} />
        <StatRow label="Contradictions" value={runState.minorContradictions} />
        <StatRow label="Counters Refuted" value={runState.countersRefuted.length} />
      </div>

      <div className="actions">
        <button onClick={() => navigate('/share')}>Share</button>
        <button onClick={() => navigate('/')}>Play Again</button>
        <button onClick={() => navigate('/archive')}>Archive</button>
      </div>
    </div>
  );
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

**Context:** Post-game feedback - important for retention.
**Decisions:**
- Clear win/loss messaging
- Show key stats for sense of progress
- Easy path to share or retry
**Questions for Implementer:**
- Animation library for celebration?
- Confetti or simple highlight?

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
