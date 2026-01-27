# Task 016: Feel System

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Feel System
**Complexity:** M
**Depends On:** 002
**Implements:** R13.1-R13.4, R14.1-R14.4, R16.2-R16.3

---

## Objective

Build the feel system: haptic patterns, sound ID constants, timing utilities, and Page Visibility API integration.

---

## Context

This is the infrastructure that makes the game feel good. Other components use this system.

### Relevant Files
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` §4-5 — Sound and haptics specs

### Embedded Context

**D16 Sound IDs (§4.1):**
```typescript
export const SFX = {
  UI_TAP_LIGHT: 'ui.tap_light',
  UI_TAP_MEDIUM: 'ui.tap_medium',
  UI_DENY_SOFT: 'ui.deny_soft',
  UI_CONFIRM: 'ui.confirm',
  LOCK_HIT_DOWN: 'lock.hit_down',
  LOCK_HIT_UP: 'lock.hit_up',
  LOCK_RELEASE: 'lock.release',
  SCRUTINY_UP: 'scrutiny.up',
  SCRUTINY_DOWN: 'scrutiny.down',
  SLOT_SNAP_IN: 'slot.snap_in',
  SLOT_SNAP_OUT: 'slot.snap_out',
  RUN_WIN_TICKET: 'run.win_ticket',
  RUN_LOSS_THUD: 'run.loss_thud'
} as const;
```

**D16 Haptic Patterns (§5.1):**
```typescript
export const HAPTICS = {
  TICK_LIGHT: [10],           // Selection, chip select
  TICK_MEDIUM: [20],          // Scrutiny up, penalties
  PULSE_SUCCESS: [10, 50, 10], // Lock clear, cache pick
  PULSE_WARNING: [30, 30, 30]  // Audit trigger
} as const;
```

**D16 Timing Constants:**
```typescript
export const TIMING = {
  MICRO: { min: 80, max: 150 },   // Selection, chip pulse
  MESO: { min: 180, max: 280 },   // Bar change, card slam
  MACRO: { min: 600, max: 1200 }, // Win/loss sequences
  TAP_RESPONSE: 50,               // Max latency
  COMMIT_MECHANICS: 120           // Max latency for bars to move
} as const;
```

**D16 SFX Rules:**
- Min 150ms between identical SFX (avoid spam)
- Separate volume channels: Voice, SFX, Ambient
- Sound references by ID, never hardcoded paths

---

## Acceptance Criteria

### AC-1: Sound ID Constants ← R13.1
- **Given:** Sound system
- **When:** Importing SFX constants
- **Then:** All D16 IDs available as stable references
- **Test Type:** unit

### AC-2: Volume Channels ← R13.2
- **Given:** Settings store
- **When:** Adjusting volumes
- **Then:** Voice, SFX, Ambient channels separate
- **Test Type:** unit

### AC-3: SFX Throttling ← R13.3
- **Given:** Same SFX played twice rapidly
- **When:** Within 150ms
- **Then:** Second play skipped
- **Test Type:** unit

### AC-4: Haptic Patterns ← R14.1
- **Given:** Haptic system
- **When:** Calling haptic(HAPTICS.TICK_LIGHT)
- **Then:** navigator.vibrate called with pattern
- **Test Type:** unit

### AC-5: Haptics Togglable ← R14.2
- **Given:** hapticsEnabled = false in settings
- **When:** Calling haptic()
- **Then:** No vibration fires
- **Test Type:** unit

### AC-6: OS Haptic Respect ← R14.3
- **Given:** OS haptics disabled
- **When:** Calling haptic()
- **Then:** Graceful no-op (feature detection)
- **Test Type:** unit

### AC-7: Page Visibility Pause ← R16.2
- **Given:** Tab hidden
- **When:** visibilitychange fires
- **Then:** GSAP global timeline paused
- **Test Type:** integration

### AC-8: Page Visibility Resume ← R16.2
- **Given:** Tab becomes visible
- **When:** visibilitychange fires
- **Then:** GSAP global timeline resumed
- **Test Type:** integration

### AC-9: Reduced Motion Detection ← R16.3
- **Given:** prefers-reduced-motion: reduce
- **When:** Feel system initializes
- **Then:** feelStore.reducedMotion = true
- **Test Type:** unit

### AC-10: Play Sound Function
- **Given:** Sound ID
- **When:** Calling playSound(SFX.UI_TAP_LIGHT)
- **Then:** Stub logs sound (actual audio later)
- **Test Type:** unit

### Edge Cases

#### EC-1: No Vibration API
- **Scenario:** Browser doesn't support navigator.vibrate
- **Expected:** Graceful fallback, no error

#### EC-2: Rapid Page Visibility Changes
- **Scenario:** Tab toggled rapidly
- **Expected:** No race conditions, timeline state correct

---

## Scope

### In Scope
- SFX ID constants
- Haptic pattern constants
- Timing constants
- playSound() function (stub for now)
- haptic() function with throttling
- Page Visibility API integration
- Reduced motion detection
- Volume channel settings

### Out of Scope
- Actual audio file loading/playback
- Audio sprite sheets
- Music system

---

## Implementation Hints

1. Sound playback is a stub — just log for now
2. Haptic: check `'vibrate' in navigator` before calling
3. SFX throttle: Map<string, number> tracking last play time
4. Page Visibility: `document.addEventListener('visibilitychange', ...)`
5. Reduced motion: `window.matchMedia('(prefers-reduced-motion: reduce)')`

---

## Definition of Done

- [ ] All SFX constants defined
- [ ] All haptic patterns defined
- [ ] All timing constants defined
- [ ] playSound() stub works
- [ ] haptic() with throttling works
- [ ] Page Visibility pauses/resumes GSAP
- [ ] Reduced motion detected
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** Infrastructure for game feel. Components depend on this.
**Decisions:** Sound is stub for MVP, focus on haptics and animation control.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
