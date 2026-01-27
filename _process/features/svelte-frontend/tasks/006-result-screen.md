# Task 006: Result Screen

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Screens & Flows
**Complexity:** M
**Depends On:** 012
**Implements:** R11.1-R11.4

---

## Objective

Build the Result screen with win/loss states, score recap, macro animations, and share card generation.

---

## Context

The payoff moment. Win must feel triumphant, loss must be clear but not punishing.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §3.9 — Win/loss macro feel
- `docs/D28-END-GAME-UI-SPEC.md` §6 — Result screen

### Embedded Context

**D16 Win Sequence (900-1200ms, skippable):**
1. "ACCESS GRANTED" appears
2. Receipt-printer style ticket animation (signature moment)
3. Show share card CTA

**D16 Loss Sequence (700-1000ms):**
1. "ACCESS DENIED" appears
2. Failure reason chip
3. "What you learned" (Codex emphasis)
4. Immediate "Run It Back" CTA

**D28 Win Screen:**
```
ACCESS GRANTED

KOA: "Your story is... consistent. Annoyingly so."

Stats:
- Turns used: 4/6
- Damage dealt: 52
- Contradictions: 0 (Perfect!)
- Counters refuted: 2/2
- Scrutiny: 0/5

[SHARE] [PLAY AGAIN] [ARCHIVE]
```

**D28 Loss Reasons:**
- Turns exhausted: "Time's up. Your story had gaps."
- Scrutiny 5: "Your story fell apart under scrutiny."

**D28 Share Card Format:**
```
HOME SMART HOME — Daily #42
🧊 SMART FRIDGE

[You're you ✓] [Awake ✓] [Meant it ✓]

Resistance: ████░░░░░░ → ░░░░░░░░░░
Scrutiny: ⚪⚪⚪⚪⚪ (0/5)
Turns: 4/6

ACCESS GRANTED ✅
```

**D16 Rules:**
- Skippable after 400ms
- Never punish loss with long unskippable animation

---

## Acceptance Criteria

### AC-1: Win Display ← R11.1
- **Given:** Run won
- **When:** Result screen renders
- **Then:** Shows "ACCESS GRANTED" with ticket animation
- **Test Type:** visual

### AC-2: Loss Display ← R11.2
- **Given:** Run lost
- **When:** Result screen renders
- **Then:** Shows "ACCESS DENIED" with reason
- **Test Type:** unit

### AC-3: Turns Exhausted Reason
- **Given:** Lost due to turns
- **When:** Result screen renders
- **Then:** Shows "Time's up. Your story had gaps."
- **Test Type:** unit

### AC-4: Scrutiny Loss Reason
- **Given:** Lost due to scrutiny 5
- **When:** Result screen renders
- **Then:** Shows "Your story fell apart under scrutiny."
- **Test Type:** unit

### AC-5: Score Recap
- **Given:** Run complete
- **When:** Result screen renders
- **Then:** Shows turns, damage, contradictions, counters, scrutiny
- **Test Type:** unit

### AC-6: Share Button
- **Given:** Result screen
- **When:** User taps Share
- **Then:** Generates share card, triggers share API
- **Test Type:** integration

### AC-7: Play Again Button
- **Given:** Result screen
- **When:** User taps Play Again
- **Then:** Resets game, navigates to home
- **Test Type:** integration

### AC-8: Skippable After 400ms ← R11.3
- **Given:** Win/loss animation playing
- **When:** User taps after 400ms
- **Then:** Animation skips to end state
- **Test Type:** visual

### AC-9: Not Punishing ← R11.4
- **Given:** Loss animation
- **When:** Playing
- **Then:** Duration ≤ 1000ms, skippable
- **Test Type:** visual

### AC-10: Perfect Run Indicator
- **Given:** Won with 0 contradictions, 0 scrutiny
- **When:** Result screen renders
- **Then:** Shows "Perfect!" indicator
- **Test Type:** unit

### Edge Cases

#### EC-1: Share API Unavailable
- **Scenario:** navigator.share not supported
- **Expected:** Copy to clipboard fallback

#### EC-2: Offline
- **Scenario:** Network unavailable on result
- **Expected:** Result still displays, share works locally

---

## Scope

### In Scope
- ResultScreen component
- Win state with ticket animation
- Loss state with reason
- Score recap
- Share card generation
- Navigation (Play Again, Archive)
- Skip functionality

### Out of Scope
- Archive screen
- Codex integration

---

## Implementation Hints

1. Ticket animation: GSAP sequence, CSS printer-paper texture
2. Share card: Canvas or HTML-to-image for generation
3. Skip: Track animation start time, tap handler checks 400ms threshold
4. Loss animation should be shorter and simpler than win
5. Use navigator.share with clipboard fallback

---

## Definition of Done

- [ ] Win screen with ticket animation
- [ ] Loss screen with reasons
- [ ] Score recap accurate
- [ ] Share generates card
- [ ] Skippable after 400ms
- [ ] Loss not punishing
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** The payoff moment. Win must feel earned, loss must be educational.
**Decisions:** Ticket animation is signature moment, invest in that.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
