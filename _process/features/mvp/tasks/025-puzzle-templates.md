# Task 025: Puzzle Templates (7+)

**Status:** backlog
**Assignee:** -
**Blocked By:** -
**Phase:** Content and Polish
**Complexity:** M
**Depends On:** 012
**Implements:** (content requirement from D24)

---

## Objective

Create 7+ puzzle templates for the Daily MVP. Each puzzle must be solvable, balanced, and validated against the pack schema and solvability rules.

---

## Context

Content is critical for gameplay. Each puzzle defines a scenario with resistance, concerns, counters, and a dealt hand of 6 cards. All puzzles must have 2+ winning paths and no forced contradictions.

### Relevant Files
- `packages/app/public/packs/puzzles/` (to create)
- Pack schema from Task 011

### Embedded Context

**Puzzle Requirements (from D24):**
- 7 minimum, 12 target templates
- Each puzzle: 2-4 concerns, 2-3 counters, 6 dealt cards
- At least 3 distinct lock targets (Fridge, Front Door, Thermostat)
- At least 2 distinct viable strategies per puzzle

**Fairness Rules (Invariant I7):**
- Total power ≥ resistance + 10 (comfortable margin)
- All concerns addressable with dealt hand
- No forced MAJOR contradictions in winning paths
- Refutation cards exist for all counters (or bruteforce viable)

**Difficulty Banding:**
- Tutorial (Day 1-2): Easy intro
- Easy (Day 3-4): Gentle learning
- Normal (Day 5-6): Standard challenge
- Hard (Day 7): Weekly challenge

**Source Docs:**
- `docs/D24-VERTICAL-SLICE-DOD-MVP.md` - Content requirements
- `docs/D31-ADVERSARIAL-TESTIMONY-DESIGN.md` - Puzzle mechanics

---

## Acceptance Criteria

### AC-1: 7 Puzzle Templates <- D24
- **Given:** Content creation complete
- **When:** Puzzle pack checked
- **Then:** Contains 7+ distinct puzzles
- **Test Type:** unit

### AC-2: Schema Valid <- R10.3
- **Given:** Puzzle JSON
- **When:** Validated against schema
- **Then:** All puzzles pass validation
- **Test Type:** unit

### AC-3: Concerns Addressable <- I7
- **Given:** Each puzzle
- **When:** Solver checks
- **Then:** All concerns can be addressed with dealt hand
- **Test Type:** unit

### AC-4: Total Power Sufficient <- I7
- **Given:** Each puzzle
- **When:** Total hand power calculated
- **Then:** power ≥ resistance + 10
- **Test Type:** unit

### AC-5: No Forced MAJOR <- I7
- **Given:** Each puzzle
- **When:** Winning paths analyzed
- **Then:** No path requires MAJOR contradiction
- **Test Type:** unit

### AC-6: Multiple Winning Paths <- I7
- **Given:** Each puzzle
- **When:** Solver explores
- **Then:** At least 2 distinct winning paths exist
- **Test Type:** unit

### AC-7: Variety of Targets <- D24
- **Given:** All puzzles
- **When:** Lock targets listed
- **Then:** At least 3 distinct targets (Fridge, Front Door, Thermostat, etc.)
- **Test Type:** unit

### AC-8: Difficulty Spread <- D24
- **Given:** 7 puzzles
- **When:** Difficulty analyzed
- **Then:** Mix of Tutorial, Easy, Normal, Hard
- **Test Type:** unit

### Edge Cases

#### EC-1: Trap Card Limit
- **Scenario:** Puzzle has trap cards
- **Expected:** At most 1 trap card per puzzle

### Error Cases

#### ERR-1: Unsolvable Puzzle
- **When:** Puzzle has no winning path
- **Then:** Validation fails before deployment
- **Error Message:** "Puzzle {id} has no winning path"

---

## Scope

### In Scope
- 7+ puzzle JSON templates
- Variety of lock targets
- Variety of concerns
- Balanced card selection
- Difficulty progression
- Validation against I7 rules

### Out of Scope
- Puzzle generation tooling (manual creation for MVP)
- Solver implementation (simple checker sufficient)
- Voice content (Task 026)

---

## Implementation Hints

```json
// Example puzzle template
{
  "id": "puzzle_tutorial_fridge",
  "targetName": "Fridge",
  "resistance": 25,
  "turns": 6,
  "difficulty": "tutorial",
  "concerns": [
    { "id": "concern_identity", "type": "IDENTITY", "requiredProof": ["IDENTITY"], "label": "Prove you're you" }
  ],
  "counters": [
    { "id": "counter_face_scan", "name": "Facial Recognition", "targets": ["IDENTITY"], "refutableBy": ["card_selfie_timestamp"] }
  ],
  "dealtHand": [
    "card_drivers_license",
    "card_selfie_timestamp",
    "card_fingerprint_log",
    "card_voice_memo",
    "card_calendar_entry",
    "card_wifi_connection"
  ]
}
```

**Checklist per puzzle:**
1. Total power of 6 cards?
2. All concerns addressable?
3. Counters have refutation options?
4. Claims don't force MAJOR contradiction?
5. At least 2 viable strategies?

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

**Context:** Content makes or breaks the game.
**Decisions:**
- Manual creation for MVP (7 puzzles)
- Must pass fairness validation
- Variety in targets and difficulty
**Questions for Implementer:**
- Who is writing puzzle content?
- Need card/counter content first?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
| AC-7 | | |
| AC-8 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
