# Task 017: Run Screen (HUD, Hand, Story)

**Status:** done
**Assignee:** -
**Blocked By:** -
**Phase:** UI Layer
**Complexity:** M
**Depends On:** 015, 018
**Implements:** R1.3, R1.4, R2.1, R2.2, R3.4, R4.4, R5.4, R9.5

---

## Objective

Implement the main Run Screen with HUD (Resistance, Scrutiny, Concerns, Turns), evidence hand carousel, committed story timeline, and KOA/counter area. This is where gameplay happens.

---

## Context

The Run Screen is the core gameplay UI. Players see their hand, the puzzle state, and make submissions. It must be responsive, clear, and support the <120ms resolution requirement.

### Relevant Files
- `packages/app/src/screens/run/RunScreen.tsx` (to create)
- `packages/app/src/components/hud/` (to create)

### Embedded Context

**Daily Run UI Components (from D24):**
- Top HUD: lock name, Resistance bar, Concerns chips, Scrutiny (0-5), Turn counter
- KOA area: KOA presence (orb/lens), mood indicator, bark display
- Counter area: KOA's counter-evidence (in FULL mode)
- Story area: Committed story timeline
- Bottom: Evidence carousel (6 cards), SUBMIT button
- Expandable "WHY?" panel per turn outcome

**Terminology (from D15):**
| Element | Label |
|---------|-------|
| Lock strength | **Resistance: {n}** |
| Proof requirement | **Concern: {type}** |
| Primary action | **SUBMIT** |

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - UI components
- `docs/D14-UX-WIREFRAME-SPEC.md` - Wireframes
- `docs/D06-CORE-GAME-LOOP-UX.md` - UX flow

---

## Acceptance Criteria

### AC-1: Run Screen Layout <- R1.3
- **Given:** Run in progress
- **When:** Run screen displayed
- **Then:** Shows HUD, hand, story area, submit button
- **Test Type:** integration

### AC-2: HUD Displays Resistance <- R1.3
- **Given:** Puzzle with resistance 35
- **When:** Run screen displayed
- **Then:** Shows "Resistance: 35" with progress bar
- **Test Type:** unit

### AC-3: HUD Displays Scrutiny <- R9.5
- **Given:** Current scrutiny = 2
- **When:** Run screen displayed
- **Then:** Shows scrutiny indicator (2/5)
- **Test Type:** unit

### AC-4: HUD Displays Concerns <- R4.4
- **Given:** 3 concerns (1 addressed, 2 not)
- **When:** Run screen displayed
- **Then:** Shows concern chips with visual distinction for addressed
- **Test Type:** unit

### AC-5: HUD Displays Turns <- R1.3
- **Given:** 4 turns remaining
- **When:** Run screen displayed
- **Then:** Shows "Turns: 4"
- **Test Type:** unit

### AC-6: Hand Displays 6 Cards <- R2.1
- **Given:** Dealt hand of 6 cards
- **When:** Run screen displayed
- **Then:** Shows 6 evidence cards in carousel
- **Test Type:** integration

### AC-7: Committed Story Timeline <- R3.4
- **Given:** 2 cards submitted previously
- **When:** Run screen displayed
- **Then:** Shows timeline with submitted cards
- **Test Type:** integration

### AC-8: Counter Panel (FULL Mode) <- R5.4
- **Given:** Counter visibility = FULL
- **When:** Run screen displayed
- **Then:** Shows KOA's counter-evidence cards
- **Test Type:** integration

### AC-9: Counter Panel Hidden <- R5.4
- **Given:** Counter visibility = HIDDEN
- **When:** Run screen displayed
- **Then:** Counter area shows "?" or is hidden
- **Test Type:** integration

### AC-10: Submit Button <- R3.3
- **Given:** Cards selected
- **When:** Run screen displayed
- **Then:** Submit button visible and enabled
- **Test Type:** unit

### AC-11: Mobile Touch Carousel <- (UX)
- **Given:** Mobile device
- **When:** Hand area displayed
- **Then:** Cards are swipeable/scrollable
- **Test Type:** visual

### Edge Cases

#### EC-1: No Cards Selected
- **Scenario:** Player hasn't selected any cards
- **Expected:** Submit button disabled

#### EC-2: All Concerns Addressed
- **Scenario:** All concerns filled
- **Expected:** All concern chips show filled state

#### EC-3: Scrutiny at 4
- **Scenario:** One more MINOR = loss
- **Expected:** Scrutiny indicator shows warning state

### Error Cases

#### ERR-1: No Active Run
- **When:** Run screen accessed without active run
- **Then:** Redirect to home
- **Error Message:** N/A (redirect)

---

## Scope

### In Scope
- RunScreen layout component
- HUD component (Resistance, Scrutiny, Concerns, Turns)
- Evidence hand carousel (uses EvidenceCard component)
- Committed story timeline
- Counter panel (visibility toggle)
- Submit button (disabled state)
- Responsive/mobile layout

### Out of Scope
- EvidenceCard component (Task 018)
- Submit flow logic (Task 019)
- KOA avatar/moods (Task 023)
- WHY panel (Task 019)

---

## Implementation Hints

```tsx
import { useGameStore, selectResistance, selectScrutiny } from '@/stores/game';
import { EvidenceCard } from '@/components/cards/EvidenceCard';
import { ConcernChip } from '@/components/hud/ConcernChip';

function RunScreen() {
  const runState = useGameStore(state => state.runState);
  const puzzle = useGameStore(state => state.currentPuzzle);
  const settings = useSettingsStore();

  if (!runState || !puzzle) {
    return <Navigate to="/" />;
  }

  return (
    <div className="run-screen">
      {/* HUD */}
      <header className="hud">
        <div className="target-name">{puzzle.targetName}</div>
        <ResistanceBar current={runState.resistance} max={puzzle.resistance} />
        <div className="concerns">
          {puzzle.concerns.map(concern => (
            <ConcernChip
              key={concern.id}
              concern={concern}
              addressed={runState.concernsAddressed.includes(concern.id)}
            />
          ))}
        </div>
        <ScrutinyIndicator value={runState.scrutiny} />
        <div className="turns">Turns: {runState.turnsRemaining}</div>
      </header>

      {/* Counter Area */}
      {settings.counterVisibility === 'full' && (
        <CounterPanel counters={puzzle.counters} />
      )}

      {/* Story Timeline */}
      <StoryTimeline cards={runState.committedStory} />

      {/* Hand */}
      <HandCarousel
        cards={puzzle.dealtHand.filter(id =>
          !runState.committedStory.some(c => c.id === id)
        )}
      />

      {/* Submit */}
      <SubmitButton />
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

**Context:** The main gameplay screen - must be clear and responsive.
**Decisions:**
- Split into subcomponents (HUD, Hand, Story, etc.)
- Counter visibility respects settings
- Mobile-first layout
**Questions for Implementer:**
- CSS framework preference for layout?
- Animation library for card selection?

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
| AC | Test | Pass |
|----|------|------|
| AC-1 | "Layout shows all areas" | ✓ |
| AC-2 | "Resistance with progress bar" | ✓ |
| AC-3 | "Scrutiny indicator" | ✓ |
| AC-4 | "Concerns with addressed state" | ✓ |
| AC-5 | "Turns remaining" | ✓ |
| AC-6 | "Hand displays 6 cards" | ✓ |
| AC-7 | "Committed story timeline" | ✓ |
| AC-8 | "Counter panel visible (FULL)" | ✓ |
| AC-9 | "Counter panel hidden (HIDDEN)" | ✓ |
| AC-10 | "Submit button visible/enabled" | ✓ |
| AC-11 | "Mobile touch carousel" | ✓ |
| EC-1 | "No cards selected (button disabled)" | ✓ |
| EC-2 | "All concerns addressed" | ✓ |
| EC-3 | "Scrutiny at 4 (warning)" | ✓ |
| ERR-1 | "No active run (redirect)" | ✓ |

**Tests:** 19 passed
**Implementation Notes:**
- All HUD components created: ResistanceBar, ScrutinyIndicator, ConcernChip, TurnsDisplay
- HandCarousel with card selection (max 3)
- StoryTimeline shows committed cards
- CounterPanel with visibility modes
- Redirect to home when no active run
**Issues:** None
**Suggestions:** Full resolver integration in Task 019

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created
- 2026-01-26 [Implementer] Implemented RunScreen with HUD, Hand, Story, Counter components
- 2026-01-26 [Reviewer] Review PASS - all ACs/ECs/ERR verified

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | done | Implementer | Implemented |
| 2026-01-26 | done | done | Reviewer | Review PASS |
