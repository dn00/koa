# Task 701: Implement T2 Suspicion Display

**Status:** backlog
**Complexity:** M
**Depends On:** 502, 601
**Implements:** R7.1, R7.2

---

## Objective

Create the UI component and animation for displaying T2 suspicion bark after sequence bark completes. The suspicion appears as KOA speaking, not as a UI element.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/components/BarkPanel.svelte` — existing bark display
- `packages/app-svelte/src/lib/stores/game.ts` — suspicionText state (Task 502)
- NEW or modify: Suspicion display in BarkPanel or separate component

### Embedded Context

**Display sequence after T2:**
1. Player submits T2 card
2. Sequence bark plays (existing, e.g., "Two cards down, one to go")
3. Brief pause (300-500ms)
4. Suspicion line fades in (e.g., "Lot of automation doing the work for you.")
5. Subtitle fades in below (e.g., "(Double-checking automation tonight.)")
6. Both persist until player starts T3 selection

**Visual treatment:**
```css
/* Suspicion line - same style as sequence bark */
.suspicion-line {
  /* Matches existing bark styling */
}

/* Subtitle - smaller, parenthetical */
.suspicion-subtitle {
  font-size: 0.85em;
  opacity: 0.8;
  font-style: italic;
  margin-top: 0.25rem;
}
```

**Animation with GSAP (if available) or CSS:**
```typescript
// After sequence bark completes
async function showSuspicion(text: SuspicionText) {
  await delay(400);  // Pause after sequence bark

  // Fade in line
  gsap.fromTo('.suspicion-line',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.3 }
  );

  if (text.subtitle) {
    await delay(200);
    gsap.fromTo('.suspicion-subtitle',
      { opacity: 0 },
      { opacity: 0.8, duration: 0.3 }
    );
  }

  markSuspicionShown();
}
```

**No suspicion for no_concern:**
- When concern.key === 'no_concern', line is "At least you're mixing your sources."
- subtitle is null, so no subtitle displayed
- Still shows the line (positive feedback)

---

## Acceptance Criteria

### AC-1: Suspicion line displays after T2 <- R7.1
- **Given:** Player submits T2 card
- **When:** Sequence bark completes
- **Then:** Suspicion line appears with fade animation

### AC-2: Subtitle displays below line <- R7.2
- **Given:** Concern has subtitle (not no_concern)
- **When:** Suspicion line finishes animating
- **Then:** Subtitle appears below in smaller text

### AC-3: No subtitle for no_concern <- R7.2
- **Given:** Concern is no_concern
- **When:** Suspicion displays
- **Then:** Only line shown, no subtitle

### AC-4: Suspicion persists until T3 <- R7.1
- **Given:** Suspicion is displayed
- **When:** Player hasn't started T3
- **Then:** Suspicion remains visible

### AC-5: Suspicion clears on T3 selection <- R7.1
- **Given:** Player starts selecting T3 card
- **When:** Card selection begins
- **Then:** Suspicion fades out or is replaced

---

## Edge Cases

### EC-1: Fast player
- **Scenario:** Player taps immediately after T2
- **Expected:** Suspicion still shows briefly, not skipped

### EC-2: Long suspicion line
- **Scenario:** Suspicion line is near character limit
- **Expected:** Text wraps gracefully, doesn't overflow

### EC-3: Animation library missing
- **Scenario:** GSAP not available
- **Expected:** Falls back to CSS transitions

---

## Error Cases

### ERR-1: suspicionText is null
- **When:** Component renders before T2 complete
- **Then:** Nothing displayed
- **Error Message:** N/A (conditional render)

---

## Scope

**In Scope:**
- Display suspicion line after sequence bark
- Display subtitle with styling
- Animate entrance
- Handle no_concern case
- Clear on T3 start

**Out of Scope:**
- Suspicion logic (Task 502)
- Suspicion templates (Task 601)
- Final Audit panel (Task 702)

---

## Implementation Hints

1. Subscribe to suspicionText from store
2. Use reactive statement to trigger animation when suspicionText changes
3. Coordinate with existing bark timing
4. Test with different concern types
5. Consider adding to BarkPanel or creating SuspicionOverlay component

---

## Log

### Planning Notes
**Context:** Natural Focus via KOA bark, not UI chip
**Decisions:** Suspicion feels like KOA speaking, integrated into bark flow
