# Task 502: Add T2 Suspicion Logic to Store

**Status:** backlog
**Complexity:** S
**Depends On:** 501, 601
**Implements:** R5.2

---

## Objective

Add logic to the game store that determines when to show T2 suspicion bark and what text to display. This connects the concern computation (501) to the suspicion templates (601).

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/stores/game.ts` — game store
- `packages/engine-core/src/narration/suspicion-barks.ts` — templates (Task 601)

### Embedded Context

**New store state fields:**
```typescript
interface GameState {
  // ... existing fields including concern ...

  /** T2 suspicion text to display. null if no suspicion or not T2 yet. */
  suspicionText: { line: string; subtitle: string | null } | null;

  /** Whether T2 suspicion has been shown (for animation control). */
  suspicionShown: boolean;
}
```

**Suspicion trigger logic:**
```typescript
// After T2 submission, before T3 starts
function triggerSuspicion(concern: Concern): void {
  if (concern.key === 'no_concern') {
    // Still show the "mixing sources" line
    suspicionText = getSuspicionText('no_concern');
  } else {
    suspicionText = getSuspicionText(concern.key);
  }
  suspicionShown = false;  // Ready for animation
}

// After suspicion animation completes
function markSuspicionShown(): void {
  suspicionShown = true;
}
```

**Store action flow:**
1. Player submits T2 card
2. `submitCard` computes concern (Task 501)
3. `submitCard` calls `triggerSuspicion(concern)`
4. UI observes `suspicionText` and displays (Task 701)
5. UI calls `markSuspicionShown()` after animation

---

## Acceptance Criteria

### AC-1: suspicionText field exists <- R5.2
- **Given:** Game store state
- **When:** Checking fields
- **Then:** `suspicionText: { line: string; subtitle: string | null } | null` exists

### AC-2: suspicionShown field exists <- R5.2
- **Given:** Game store state
- **When:** Checking fields
- **Then:** `suspicionShown: boolean` field exists

### AC-3: suspicion triggered after T2 <- R5.2
- **Given:** Player submits T2 card
- **When:** Store updates
- **Then:** `suspicionText` is populated from getSuspicionText

### AC-4: no_concern still shows text <- R5.2
- **Given:** Concern is { key: 'no_concern' }
- **When:** triggerSuspicion called
- **Then:** suspicionText has the "mixing sources" line, subtitle is null

### AC-5: markSuspicionShown action exists <- R5.2
- **Given:** Store actions
- **When:** Checking available actions
- **Then:** markSuspicionShown action sets suspicionShown = true

---

## Edge Cases

### EC-1: T2 suspicion persists until T3
- **Scenario:** Player hasn't played T3 yet
- **Expected:** suspicionText remains available for re-render

### EC-2: Game reset clears suspicion
- **Scenario:** Player restarts puzzle
- **Expected:** suspicionText and suspicionShown reset to null/false

---

## Error Cases

### ERR-1: getSuspicionText import missing
- **When:** Templates not exported correctly
- **Then:** TypeScript import error
- **Error Message:** Cannot find module 'suspicion-barks'

---

## Scope

**In Scope:**
- Add suspicionText and suspicionShown to store
- Add triggerSuspicion internal function
- Add markSuspicionShown action
- Wire into submitCard flow

**Out of Scope:**
- Suspicion UI display (Task 701)
- Suspicion templates (Task 601)
- Animation timing

---

## Implementation Hints

1. Import getSuspicionText from engine-core
2. Initialize suspicionText as null, suspicionShown as false
3. Call triggerSuspicion inside submitCard when turn === 2
4. Export markSuspicionShown for UI to call

---

## Log

### Planning Notes
**Context:** Bridge between concern computation and UI display
**Decisions:** Track suspicionShown for animation state
