# Task 021: Game Intro Screen

**Status:** backlog
**Assignee:** -
**Phase:** Polish
**Complexity:** S

---

## Objective

Add an intro screen before card selection that shows the scenario, Known Facts, and quick instructions. This exists in mockups but not in the current Svelte frontend.

---

## Problem

Currently the game jumps straight to card selection. Players need context:
- What happened? (scenario)
- What does KOA know? (Known Facts)
- What do I do? (instructions)

---

## Screen Flow

```
Home → [Intro Screen] → Card Selection → Result
              ↑
         NEW SCREEN
```

---

## Intro Screen Layout

```
┌─────────────────────────────────┐
│  KOA MINI                       │
│  Day 37: PrintGate              │
├─────────────────────────────────┤
│                                 │
│  [KOA Avatar - NEUTRAL]         │
│                                 │
│  "Sixteen pages. 3 AM. Merger   │
│   documents. I'm not angry.     │
│   I'm documenting."             │
│                                 │
├─────────────────────────────────┤
│  KNOWN FACTS                    │
│  ─────────────                  │
│  • Print job arrived via cloud  │
│  • Motion sensor: pet-height    │
│  • Router: zero device sessions │
│                                 │
├─────────────────────────────────┤
│  Pick 3 cards that fit the      │
│  facts. Avoid the lies.         │
│                                 │
│  [ START ]                      │
└─────────────────────────────────┘
```

---

## Components

1. **Header** - Day number, puzzle name
2. **KOA Avatar** - Neutral mood, sets tone
3. **Opening Bark** - KOA's intro line (from `puzzle.openingLine`)
4. **Known Facts** - Bulleted list (from `puzzle.knownFacts`)
5. **Instructions** - Brief "how to play" (static text)
6. **Start Button** - Proceeds to card selection

---

## Acceptance Criteria

### AC-1: Route Exists
- **Given:** Player starts puzzle
- **When:** Navigating to puzzle
- **Then:** Intro screen shown before card selection

### AC-2: Scenario Display
- **Given:** Intro screen
- **When:** Rendered
- **Then:** Shows puzzle name and KOA's opening line

### AC-3: Known Facts Display
- **Given:** Intro screen
- **When:** Rendered
- **Then:** Shows all Known Facts as bullet list

### AC-4: Instructions Display
- **Given:** First-time player
- **When:** Viewing intro
- **Then:** Brief instructions visible

### AC-5: Start Button
- **Given:** Player ready
- **When:** Taps START
- **Then:** Navigates to card selection

---

## Definition of Done

- [ ] Intro screen route exists
- [ ] Shows puzzle name and opening line
- [ ] Shows Known Facts
- [ ] Shows brief instructions
- [ ] START button navigates to card selection
- [ ] Works on mobile viewport

---

## Log

### Change Log
- 2026-01-30 [Design] Created task

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | backlog | Design | Created |
