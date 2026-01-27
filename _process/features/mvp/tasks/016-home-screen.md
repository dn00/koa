# Task 016: Home Screen

**Status:** done
**Assignee:** Implementer
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** S
**Depends On:** 001
**Implements:** R1.3 (part of)

---

## Objective

Implement the Home Screen with navigation to Play Daily, Practice, Settings, and Archive. This is the app's entry point.

---

## Context

The Home Screen is the first thing players see. It provides access to the daily puzzle, practice mode (stub for MVP), settings, and run archive.

### Relevant Files
- `packages/app/src/screens/home/HomeScreen.tsx` (to create)
- `packages/app/src/screens/home/index.ts` (to create)

### Embedded Context

**Screens (from D24, ARCHITECTURE.md):**
1. Home (Play Daily / Practice / Settings / Archive)
2. Daily Start (lock target + concerns + counters + start)
3. Run Screen (HUD + evidence carousel + SUBMIT)
4. Outcome screen (ACCESS GRANTED / ACCESS DENIED) + recap
5. Archive view (recent Dailies)

**Home Screen Elements:**
- App title/logo
- "Play Daily" button (primary CTA)
- "Practice" button (secondary, stub for MVP)
- "Settings" button
- "Archive" button
- Daily streak indicator (optional for MVP)

**Source Docs:**
- `docs/D14-UX-WIREFRAME-SPEC.md` - Wireframes
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - UX requirements

---

## Acceptance Criteria

### AC-1: Home Screen Renders <- R1.3
- **Given:** App loads
- **When:** Home route accessed
- **Then:** Home screen displays with title and navigation buttons
- **Test Type:** integration

### AC-2: Play Daily Button <- R1.3
- **Given:** Home screen displayed
- **When:** "Play Daily" tapped
- **Then:** Navigates to daily brief/start screen
- **Test Type:** integration

### AC-3: Practice Button (Stub) <- (P1)
- **Given:** Home screen displayed
- **When:** "Practice" tapped
- **Then:** Shows "Coming soon" or navigates to practice (stub)
- **Test Type:** integration

### AC-4: Settings Button <- R12.1
- **Given:** Home screen displayed
- **When:** "Settings" tapped
- **Then:** Navigates to settings screen
- **Test Type:** integration

### AC-5: Archive Button <- R1.3
- **Given:** Home screen displayed
- **When:** "Archive" tapped
- **Then:** Navigates to archive screen
- **Test Type:** integration

### AC-6: Mobile-First Layout <- (UX)
- **Given:** Mobile viewport
- **When:** Home screen displayed
- **Then:** Layout is mobile-optimized (full-width buttons, touch-friendly)
- **Test Type:** visual

### AC-7: Resume Prompt <- R12.3
- **Given:** Unfinished run exists
- **When:** Home screen displayed
- **Then:** Shows "Resume" option prominently
- **Test Type:** integration

### Edge Cases

#### EC-1: No Network
- **Scenario:** App offline, daily not cached
- **Expected:** "Play Daily" disabled or shows cached daily

#### EC-2: First Launch
- **Scenario:** Brand new user
- **Expected:** Home screen shows, no streak/archive

### Error Cases

None for this screen.

---

## Scope

### In Scope
- HomeScreen component
- Navigation to Daily, Practice (stub), Settings, Archive
- Resume prompt for unfinished runs
- Mobile-first responsive layout

### Out of Scope
- Daily brief screen (part of run flow)
- Settings screen content
- Archive screen content

---

## Implementation Hints

```tsx
import { Link } from 'react-router-dom';
import { useGameStore } from '@/stores/game';

function HomeScreen() {
  const hasUnfinishedRun = useGameStore(state =>
    state.runState?.status === 'in_progress'
  );

  return (
    <div className="home-screen">
      <header>
        <h1>Home Smart Home</h1>
      </header>

      <main>
        {hasUnfinishedRun && (
          <Link to="/run" className="btn btn-resume">
            Resume Run
          </Link>
        )}

        <Link to="/daily" className="btn btn-primary">
          Play Daily
        </Link>

        <Link to="/practice" className="btn btn-secondary">
          Practice
        </Link>
      </main>

      <footer>
        <Link to="/settings">Settings</Link>
        <Link to="/archive">Archive</Link>
      </footer>
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

**Context:** Entry point - should be simple and focused.
**Decisions:**
- Keep minimal for MVP
- Practice is stub (shows coming soon)
- Resume prompt if unfinished run exists
**Questions for Implementer:**
- Router preference? (react-router, tanstack-router, etc.)
- Styling approach? (Tailwind, CSS modules, etc.)

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:** PASS
**Date:** 2026-01-26

**AC Verification:**
| AC | Test | Pass | Notes |
|----|------|------|-------|
| AC-1 | 2 tests | ✓ | HomeScreen.tsx:55-97 |
| AC-2 | 1 test | ✓ | Navigates to /daily |
| AC-3 | 1 test | ✓ | Navigates to /practice (stub) |
| AC-4 | 1 test | ✓ | Navigates to /settings |
| AC-5 | 1 test | ✓ | Navigates to /archive |
| AC-6 | 1 test | ✓ | Mobile-first CSS, 48px touch targets |
| AC-7 | 3 tests | ✓ | Resume prompt conditional render |
| EC-1 | 2 tests | ✓ | Play Daily disabled when offline |
| EC-2 | 2 tests | ✓ | First launch via default props |

**Test Results:** 14/14 passing

**Issues:**
- None

**Suggestions:**
- None

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implementation complete |
| 2026-01-26 | done | done | Reviewer | Review PASS - all ACs verified |
