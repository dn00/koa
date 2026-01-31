# Task 022: Card Play Juice & Timing

**Status:** backlog
**Assignee:** -
**Phase:** Polish
**Complexity:** M
**Depends On:** 009 (GSAP Animations), 012 (KOA Avatar), 016 (Bark Panel)

---

## Objective

Add "juice" to the card play experience. Currently KOA responds instantly, which feels flat. We need delays, animations, and processing states to build tension.

---

## Problem

Current flow:
```
Player taps card → Card moves → KOA bark appears (instant)
```

This is too abrupt. No tension, no anticipation.

---

## Desired Flow

```
1. Player taps card
2. Card animates to "played" area
3. Card Sequence component shows "uploading" animation
4. KOA avatar shifts to PROCESSING expression
5. Brief delay (0.5-1s)
6. KOA bark appears (typewriter effect)
7. KOA avatar shifts to post-bark expression
```

### For Final Card (Turn 3)
```
1. Player taps card
2. Card animates to "played" area
3. LONGER delay (1-2s)
4. KOA: "Let me check something..."
5. Processing animation
6. Transition to verdict screen
```

---

## Animation Specifications

### Card Upload Animation
- Card slides to played area
- Progress bar or pulse effect on card
- Duration: 300-500ms

### KOA Processing State
- Eyes dart slightly
- Head tilts
- Minimal blink
- Duration: 500-1000ms

### Bark Reveal
- Typewriter effect (already exists in Task 015)
- Reveal after processing completes

### Final Turn Transition
- Screen dims slightly
- KOA expression intensifies
- Dramatic pause before verdict
- Duration: 1500-2000ms total

---

## Timing Constants

```typescript
const CARD_PLAY_TIMING = {
  cardAnimation: 300,      // Card moving to played area
  processingDelay: 800,    // KOA "thinking"
  barkTypewriter: 50,      // Per character
  turnTransition: 500,     // Between turns

  // Final turn
  finalProcessing: 1500,
  verdictTransition: 800,
};
```

---

## Acceptance Criteria

### AC-1: Card Animation
- **Given:** Player taps card
- **When:** Card is selected
- **Then:** Smooth animation to played area (300ms)

### AC-2: Processing Delay
- **Given:** Card animation completes
- **When:** Before bark appears
- **Then:** 500-1000ms delay with KOA processing expression

### AC-3: KOA Expression During Processing
- **Given:** Processing delay active
- **When:** KOA avatar visible
- **Then:** Shows PROCESSING state (eyes darting, thinking)

### AC-4: Bark After Delay
- **Given:** Processing completes
- **When:** Bark appears
- **Then:** Typewriter effect reveals text

### AC-5: Final Turn Dramatic Pause
- **Given:** Player plays third card
- **When:** Processing
- **Then:** Longer delay (1.5s+) before verdict transition

### AC-6: Verdict Transition
- **Given:** Final card processed
- **When:** Transitioning to verdict
- **Then:** Smooth transition (not abrupt cut)

---

## Definition of Done

- [ ] Card play has visible animation
- [ ] Processing delay before bark
- [ ] KOA shows processing expression
- [ ] Bark uses typewriter reveal
- [ ] Final turn has dramatic timing
- [ ] Verdict transition is smooth
- [ ] All timings feel good (playtest)

---

## Log

### Change Log
- 2026-01-30 [Design] Created task based on UX feedback

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | backlog | Design | Created |
