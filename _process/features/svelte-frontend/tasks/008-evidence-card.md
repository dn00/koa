# Task 008: Evidence Card

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Game Components
**Complexity:** M
**Depends On:** 002, 016
**Implements:** R7.1, R7.2, R7.7

---

## Objective

Build the Evidence Card component with D27 anatomy, trust tier badges, and selection states.

---

## Context

Cards are the core interaction. Must be readable at a glance and feel satisfying to interact with.

### Relevant Files
- `docs/D27-VISUAL-STYLE-SPEC.md` §5.1 — Card anatomy
- `docs/D28-END-GAME-UI-SPEC.md` §4 — Card UI

### Embedded Context

**D27 Card Anatomy (required elements):**
1. **Title** (human-readable)
2. **Trust Tier Badge** (Verified/Plausible/Sketchy)
3. **Tags** (2-4 chips, overflow allowed)
4. **Power indicator** (stars or number based on mode)
5. **One-line effect summary**
6. Optional: timestamp, source

**D28 Card Modes:**
- **Minimal:** Power as ⭐⭐⭐ stars, claims as icons
- **Full Stats:** Power as number, all details visible

**Trust Tier Styling (D27 §2.3):**
- Verified: calm accent + solid border
- Plausible: neutral + dashed border
- Sketchy: warn accent + "UNVERIFIED" stamp

**Card States:**
- Default: resting in hand
- Hover: scale 1.05, tilt toward touch point
- Selected: elevated, glow, checkmark
- Disabled: muted opacity

**Refutes Badge:**
If card has `refutes` field, show which counter it can nullify.

---

## Acceptance Criteria

### AC-1: Card Anatomy ← R7.1
- **Given:** EvidenceCard data
- **When:** Card renders
- **Then:** Shows title, power, claims/proves, tags
- **Test Type:** unit

### AC-2: Trust Tier Badge ← R7.2
- **Given:** Card with trustTier: "Verified"
- **When:** Card renders
- **Then:** Shows Verified badge with calm accent + solid border
- **Test Type:** unit

### AC-3: Sketchy Card Styling
- **Given:** Card with trustTier: "Sketchy"
- **When:** Card renders
- **Then:** Warn accent, "UNVERIFIED" stamp visible
- **Test Type:** unit

### AC-4: Power Display - Minimal Mode
- **Given:** Card with power 7, statsMode: "minimal"
- **When:** Card renders
- **Then:** Shows ⭐⭐⭐ (3 stars for power 7-9)
- **Test Type:** unit

### AC-5: Power Display - Full Stats Mode
- **Given:** Card with power 7, statsMode: "full"
- **When:** Card renders
- **Then:** Shows "Power: 7"
- **Test Type:** unit

### AC-6: Refutes Badge ← R7.7
- **Given:** Card with refutes: "counter_camera"
- **When:** Card renders
- **Then:** Shows "Refutes: Security Camera" badge
- **Test Type:** unit

### AC-7: Selected State
- **Given:** Card selected by player
- **When:** Card in selected state
- **Then:** Elevated, glow effect, checkmark visible
- **Test Type:** unit

### AC-8: Card Detail Modal
- **Given:** User long-presses card
- **When:** Modal opens
- **Then:** Shows full card details (all claims, time range, counters triggered)
- **Test Type:** integration

### Edge Cases

#### EC-1: Many Tags
- **Scenario:** Card has 6 tags
- **Expected:** Shows 4, "+2 more" overflow indicator

#### EC-2: No Refutes
- **Scenario:** Card has no refutes field
- **Expected:** No refutes badge shown

---

## Scope

### In Scope
- EvidenceCard component
- Trust tier badge variants
- Power display (both modes)
- Refutes badge
- Selected/hover states (visual only)
- Card detail modal

### Out of Scope
- Selection logic (Task 009)
- Animations (Task 011)

---

## Implementation Hints

1. Use CSS custom properties for trust tier colors
2. Card is a single component with state variants
3. Power stars: Math.ceil(power / 3) stars (1-3=⭐, 4-6=⭐⭐, 7-9=⭐⭐⭐, 10=⭐⭐⭐⭐)
4. Long-press detection: 500ms threshold

---

## Definition of Done

- [ ] Card shows all required anatomy
- [ ] Trust tier badges correct
- [ ] Both display modes work
- [ ] Refutes badge when applicable
- [ ] Detail modal works
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** Cards are what players interact with most. Readability is critical.
**Decisions:** CSS custom properties for theming, single component with variants.

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
