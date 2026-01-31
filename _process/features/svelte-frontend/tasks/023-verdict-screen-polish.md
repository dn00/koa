# Task 023: Verdict Screen Polish

**Status:** backlog
**Assignee:** -
**Phase:** Polish
**Complexity:** S
**Depends On:** 007 (Result Screen), 017 (Lies Revealed Bark)

---

## Objective

Fix verdict screen issues: content cropping, abrupt appearance, missing elements.

---

## Current Problems

1. **Content cropped** - Verdict screen doesn't show completely on some viewports
2. **Abrupt transition** - Jumps from card play to verdict with no buildup
3. **Missing elements** - Share button, retry option, etc.

---

## Desired Verdict Screen

```
┌─────────────────────────────────┐
│           CLEARED               │
│         🟢 🟢 🟢                │
├─────────────────────────────────┤
│                                 │
│  [KOA Avatar - GRUDGING]        │
│                                 │
│  "Your cat has more initiative  │
│   than your career.             │
│   Access granted."              │
│                                 │
├─────────────────────────────────┤
│  YOUR CARDS                     │
│  ┌─────┐ ┌─────┐ ┌─────┐       │
│  │ ✓   │ │ ✓   │ │ ✗   │       │
│  │Card1│ │Card2│ │Card3│       │
│  └─────┘ └─────┘ └─────┘       │
│                                 │
│  Card3 was a lie:               │
│  "USB transfer contradicts      │
│   cloud relay delivery"         │
│                                 │
├─────────────────────────────────┤
│  [ SHARE ]    [ PLAY AGAIN ]    │
└─────────────────────────────────┘
```

---

## Elements

1. **Verdict Tier** - FLAWLESS/CLEARED/CLOSE/BUSTED with color
2. **Card Result Icons** - ✓ for truths, ✗ for lies
3. **KOA Avatar** - Mood based on result (SMUG/GRUDGING/etc)
4. **Verdict Bark** - From liesRevealed or verdicts
5. **Played Cards** - Show which cards were played
6. **Lie Explanation** - Why the lie was a lie (if any)
7. **Share Button** - Generate shareable artifact
8. **Play Again** - Return to home or replay (if card pools)

---

## Acceptance Criteria

### AC-1: No Content Cropping
- **Given:** Any mobile viewport
- **When:** Verdict screen shown
- **Then:** All content visible (scrollable if needed)

### AC-2: Smooth Entry Transition
- **Given:** Final card processed
- **When:** Transitioning to verdict
- **Then:** Fade or slide transition (not instant cut)

### AC-3: Verdict Tier Display
- **Given:** Verdict computed
- **When:** Screen renders
- **Then:** Tier shown with appropriate color

### AC-4: Card Results Display
- **Given:** Cards were played
- **When:** Verdict screen
- **Then:** Shows played cards with truth/lie markers

### AC-5: Lie Explanation
- **Given:** Player played lies
- **When:** Verdict screen
- **Then:** Shows why the lie contradicted facts

### AC-6: Share Button
- **Given:** Verdict screen
- **When:** Player taps SHARE
- **Then:** Generates spoiler-free share artifact

### AC-7: Play Again
- **Given:** Verdict screen
- **When:** Player taps PLAY AGAIN
- **Then:** Returns to appropriate screen

---

## Definition of Done

- [ ] No content cropping on mobile
- [ ] Smooth transition from card play
- [ ] Verdict tier displayed with color
- [ ] Played cards shown with markers
- [ ] Lie explanation visible
- [ ] Share button works
- [ ] Play again button works

---

## Log

### Change Log
- 2026-01-30 [Design] Created task based on UX feedback

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | backlog | Design | Created |
