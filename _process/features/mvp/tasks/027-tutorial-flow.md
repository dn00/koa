# Task 027: Tutorial Flow

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content and Polish
**Complexity:** M
**Depends On:** 017, 025
**Implements:** (onboarding from D24)

---

## Objective

Implement tutorial flow that teaches new players the core mechanics through the first few days of Daily puzzles. Players should understand Resistance, Concerns, Counters, Contradictions, and Corroboration after the tutorial week.

---

## Context

New players need to learn the game without overwhelming them. The tutorial uses the first 5-7 dailies to introduce concepts progressively. Each day adds one new concept.

### Relevant Files
- `packages/app/src/screens/tutorial/` (to create)
- `packages/app/src/components/tutorial/` (to create)

### Embedded Context

**Onboarding (from D24):**
- Tutorial week (5-7 days of graduated complexity)
- Practice mode (sandbox with hints)

**Concept Introduction Order:**
1. Day 1: Submit cards, reduce Resistance
2. Day 2: Address Concerns
3. Day 3: Counter-evidence and contested penalty
4. Day 4: Refutation
5. Day 5: Contradictions and Scrutiny
6. Day 6: Corroboration
7. Day 7: Full complexity

**Clarity Bar (from D24):**
In usability test, 3/5 players can explain:
- What Resistance is
- What Concerns are
- How Counter-Evidence works
- How Refutation works
- What Contradictions do
- What Corroboration does

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Onboarding
- `docs/D06-CORE-GAME-LOOP-UX.md` - UX flow

---

## Acceptance Criteria

### AC-1: Tutorial Detection <- (onboarding)
- **Given:** New player
- **When:** First daily attempted
- **Then:** Tutorial mode activates
- **Test Type:** integration

### AC-2: Day 1 Tutorial <- (onboarding)
- **Given:** Tutorial day 1
- **When:** Run starts
- **Then:** Explains Resistance and Submit
- **Test Type:** integration

### AC-3: Day 2 Tutorial <- (onboarding)
- **Given:** Tutorial day 2
- **When:** Run starts
- **Then:** Explains Concerns
- **Test Type:** integration

### AC-4: Day 3 Tutorial <- (onboarding)
- **Given:** Tutorial day 3
- **When:** Counter plays
- **Then:** Explains Counter-evidence
- **Test Type:** integration

### AC-5: Day 4 Tutorial <- (onboarding)
- **Given:** Tutorial day 4
- **When:** Refutation possible
- **Then:** Explains Refutation
- **Test Type:** integration

### AC-6: Day 5 Tutorial <- (onboarding)
- **Given:** Tutorial day 5
- **When:** Contradiction detected
- **Then:** Explains Scrutiny
- **Test Type:** integration

### AC-7: Tooltip Hints <- (onboarding)
- **Given:** Tutorial active
- **When:** Relevant element shown
- **Then:** Tooltip explains element
- **Test Type:** unit

### AC-8: Skip Tutorial <- (onboarding)
- **Given:** Tutorial active
- **When:** Player wants to skip
- **Then:** Option to skip, tutorial marked complete
- **Test Type:** integration

### AC-9: Tutorial Complete <- (onboarding)
- **Given:** Day 7 completed
- **When:** Run ends
- **Then:** Tutorial marked complete, no more prompts
- **Test Type:** integration

### Edge Cases

#### EC-1: Return Player
- **Scenario:** Player completed tutorial before
- **Expected:** No tutorial prompts

#### EC-2: Skip Mid-Tutorial
- **Scenario:** Skip on day 3
- **Expected:** All remaining days are regular, no incomplete tutorial

### Error Cases

None for UI flow.

---

## Scope

### In Scope
- Tutorial state tracking (which day, completed)
- Tooltip/overlay system for hints
- Progressive concept introduction
- Skip option
- Tutorial complete detection

### Out of Scope
- Practice mode (sandbox)
- Advanced tutorials (Freeplay concepts)

---

## Implementation Hints

```typescript
interface TutorialState {
  currentDay: number;  // 1-7
  completed: boolean;
  skipped: boolean;
}

const TUTORIAL_CONCEPTS = {
  1: ['resistance', 'submit'],
  2: ['concerns'],
  3: ['counters', 'contested'],
  4: ['refutation'],
  5: ['contradiction', 'scrutiny'],
  6: ['corroboration'],
  7: [], // Full complexity, no new concepts
};

function useTutorial() {
  const [tutorialState, setTutorialState] = usePersistentState<TutorialState>(
    'tutorial',
    { currentDay: 1, completed: false, skipped: false }
  );

  const conceptsToTeach = TUTORIAL_CONCEPTS[tutorialState.currentDay] ?? [];

  const advanceDay = useCallback(() => {
    setTutorialState(prev => ({
      ...prev,
      currentDay: Math.min(prev.currentDay + 1, 7),
      completed: prev.currentDay >= 7,
    }));
  }, []);

  return { tutorialState, conceptsToTeach, advanceDay };
}
```

```tsx
function TutorialOverlay({ concept }: { concept: string }) {
  const content = TUTORIAL_CONTENT[concept];

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-card">
        <h3>{content.title}</h3>
        <p>{content.description}</p>
        <button onClick={dismiss}>Got it!</button>
      </div>
    </div>
  );
}

const TUTORIAL_CONTENT = {
  resistance: {
    title: 'Resistance',
    description: 'This is how convinced KOA is that you don\'t belong. Reduce it to 0 to win!'
  },
  concerns: {
    title: 'Concerns',
    description: 'KOA wants proof. Address all concerns by playing cards that match.'
  },
  // ...
};
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

**Context:** Critical for new player retention.
**Decisions:**
- Progressive introduction over 7 days
- Non-blocking tooltips
- Skip option for experienced players
**Questions for Implementer:**
- How intrusive should tooltips be?
- Persist tutorial state across devices?

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
