# Task 017: Terminal Log

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** M
**Depends On:** 002, 016
**Implements:** R10 (dialogue display)

---

## Objective

Build the terminal log component — the narrative heart of the game where KOA speaks and actions resolve.

---

## Context

This replaces the "chat" or "story timeline" concept. It's a monospace terminal where the game unfolds.

### Relevant Files
- `svelte-frontend.plan.md` — UI Layout section
- `docs/D28-END-GAME-UI-SPEC.md` §1.C — Transcript concept

### Embedded Context

**Terminal Aesthetic:**
```
> SYSTEM: Access request initiated
> KOA: It's 2am. You're at your fridge. Again.
> INPUT: Face ID [IDENTITY]
> CHALLENGE: Security Camera
  "No presence detected at 2:07am"
> INPUT: Maintenance Log [REFUTE]
> REFUTED: Security Camera
> KOA: ...The camera was updating. How convenient.
> _
```

**Line Types:**
- `SYSTEM:` — Game state messages (turn start, win/loss)
- `KOA:` — KOA dialogue (from puzzle content)
- `INPUT:` — Player's submitted evidence
- `CHALLENGE:` — Counter triggered
- `REFUTED:` — Counter nullified
- `CONTESTED:` — Evidence reduced by counter
- `DAMAGE:` — Damage dealt (optional, verbose mode)

**Styling:**
- Monospace font (JetBrains Mono, SF Mono, or similar)
- Dark background, light text
- KOA lines slightly highlighted
- Challenge lines in warning color
- Refuted lines in success color with strikethrough on counter

**Behavior:**
- Auto-scrolls to bottom on new entries
- Scrollable for history
- New entries animate in (slide/fade, ~100ms)

---

## Acceptance Criteria

### AC-1: Display Log Entries
- **Given:** Array of log entries
- **When:** Terminal renders
- **Then:** All entries displayed in order, monospace
- **Test Type:** unit

### AC-2: Entry Type Styling
- **Given:** Different entry types (KOA, INPUT, CHALLENGE, etc.)
- **When:** Terminal renders
- **Then:** Each type has distinct styling
- **Test Type:** unit

### AC-3: Auto-Scroll
- **Given:** New entry added
- **When:** Entry appends
- **Then:** Terminal scrolls to show new entry
- **Test Type:** integration

### AC-4: Entry Animation
- **Given:** New entry added
- **When:** Entry appears
- **Then:** Slides/fades in (~100ms)
- **Test Type:** visual

### AC-5: Manual Scroll
- **Given:** User scrolls up to read history
- **When:** Scrolling
- **Then:** Auto-scroll pauses until user scrolls to bottom
- **Test Type:** integration

### AC-6: KOA Dialogue Highlight
- **Given:** KOA dialogue entry
- **When:** Displayed
- **Then:** Visually distinct (brighter, accent color)
- **Test Type:** unit

### AC-7: Challenge Warning Style
- **Given:** CHALLENGE entry
- **When:** Displayed
- **Then:** Warning color, counter name prominent
- **Test Type:** unit

### AC-8: Refuted Success Style
- **Given:** REFUTED entry
- **When:** Displayed
- **Then:** Success color, counter name struck through
- **Test Type:** unit

### Edge Cases

#### EC-1: Long Dialogue
- **Scenario:** KOA dialogue is multiple lines
- **Expected:** Wraps properly, maintains indent

#### EC-2: Rapid Entries
- **Scenario:** Multiple entries added quickly (submit resolution)
- **Expected:** Staggered animation, no visual glitches

---

## Scope

### In Scope
- TerminalLog component
- Log entry types and styling
- Auto-scroll behavior
- Entry animation
- Scroll history

### Out of Scope
- Log entry generation (comes from game events)
- Sound effects on entries

---

## Implementation Hints

1. Use `bind:this` and `scrollTo()` for auto-scroll
2. Track `userScrolled` state to pause auto-scroll
3. Entry animation: GSAP or Svelte transition
4. Consider virtualization if log gets very long (probably not needed for MVP)

---

## Definition of Done

- [ ] Terminal displays all entry types
- [ ] Styling matches design
- [ ] Auto-scroll works
- [ ] Entry animation smooth
- [ ] Manual scroll pauses auto-scroll
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** The terminal is where the game narrative unfolds. Critical for game feel.
**Decisions:** Monospace aesthetic, auto-scroll with pause on user scroll.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
