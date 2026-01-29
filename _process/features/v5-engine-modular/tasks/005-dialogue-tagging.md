# Task 005: Dialogue Tagging & Filter

**Status:** done
**Assignee:** -
**Blocked By:** 001
**Phase:** Core Engine
**Complexity:** S
**Depends On:** 001
**Implements:** R5.1, R5.2, R5.3

---

## Objective

Add tags to KOA bark lines to classify them as mini-safe or mechanic-revealing, and create a filter function for mode-aware dialogue selection.

---

## Context

Mini mode should not expose game mechanics in KOA's dialogue. Lines that mention "score", "penalty", "type tax", "discount" etc. should be filtered out in Mini mode.

### Relevant Files
- `scripts/v5-dialogue.ts` - KOA_LINES array to modify
- `scripts/v5-types.ts` - DialogueLine type to extend

### Embedded Context

**Mini-Safe Barks (from koa-mini-spec.md §6.1.2):**
- Must talk about **axes and patterns**, not card IDs or types
- Point back to **Known Facts** or tensions without declaring a lie
- Suggest a *kind* of missing evidence without instructing which card to play
- NO mentions of: score, penalty, discount, tax, points, truth, lie

**Safe bark examples (axis-level):**
- Channel reliance: "Everything so far lives in logs. If one is wrong, your story tips over."
- Timeline clustering: "All your cards are crammed between 2:50 and 3:05am. Convenient."
- Fact tension: "This is a very confident claim for someone who told me they were in bed by 11."

**NOT Mini-Safe (examples):**
- "I'm discounting this." (implies scoring)
- "Same channel again? I'm discounting this." (type tax reference)
- Any bark that identifies specific cards as truth/lie

**Bark Families (from koa-mini-spec.md §6.1.4):**
The spec describes bark families - T1→T2→T3 sequences per axis that create reactive buildup:
- Engine derives pattern keys (channel_mix, timeline_clustered, fact2_tension)
- KOA picks the most relevant axis family based on current patterns
- Barks build across turns ("Starting with logs" → "Everything so far lives in logs" → "Still only logs")

This task tags lines to support bark families; the family selection logic itself is implementation detail for Task 003/006.

**Future: Banter System v2 (banter-system.md)**
This task lays groundwork for the full two-layer banter system:
- **Layer A (Library):** Current KOA_LINES with slot/axis/valence/intensity - this is it
- **Layer B (Card-specific):** Current `koaBarks` in puzzles - will grow to include `koaQuipTruth`/`koaQuipLie`

Current slots map to banter-system slots:
- `AFTER_PLAY` → `PRE_REVEAL_BARK` (rename later)
- `OBJECTION_PROMPT` → `FLAG_PROMPT`
- `FINAL_VERDICT` → `FINAL_VERDICT`

**Safety principle from banter-system.md:** Pre-reveal barks must be non-committal. Never say "lie", "false", "fabricated" before reveal. Always explainable by multiple hypotheses (weak axis fit, overused type, etc.).

---

## Acceptance Criteria

### AC-1: DialogueTag Type ← R5.1
- **Given:** Need to classify barks
- **When:** DialogueTag type defined
- **Then:** Has values: 'mini-safe', 'mentions-score', 'mentions-tax', 'mentions-flag'
- **Test Type:** unit (type compiles)

### AC-2: TaggedDialogueLine Interface ← R5.1
- **Given:** DialogueLine type exists
- **When:** TaggedDialogueLine defined
- **Then:** Extends DialogueLine with tags: DialogueTag[]
- **Test Type:** unit

### AC-3: KOA_LINES Tagged ← R5.2
- **Given:** Existing KOA_LINES array
- **When:** Lines converted to TaggedDialogueLine[]
- **Then:** Each line has appropriate tags (at least 'mini-safe' or a mechanic tag)
- **Test Type:** unit

### AC-4: filterBarksForMode Mini ← R5.3
- **Given:** Tagged lines array
- **When:** filterBarksForMode(lines, 'mini-safe') called
- **Then:** Returns only lines with 'mini-safe' tag
- **Test Type:** unit

### AC-5: filterBarksForMode All ← R5.3
- **Given:** Tagged lines array with mixed tags
- **When:** filterBarksForMode(lines, 'all') called
- **Then:** Returns all lines unchanged
- **Test Type:** unit

### AC-6: pickKoaLine Uses Filter ← R5.3
- **Given:** ModeConfig with barkFilter='mini-safe'
- **When:** pickKoaLine with barkFilter parameter called
- **Then:** Only considers mini-safe lines
- **Test Type:** unit

### AC-7: Turn Position Tag ← R6.1
- **Given:** Bark families need T1/T2/T3 awareness
- **When:** TaggedDialogueLine defined
- **Then:** Has optional turnPosition field ('T1' | 'T2' | 'T3' | 'any')
- **Test Type:** unit

### Edge Cases

#### EC-1: No Mini-Safe Lines for Slot
- **Scenario:** filterBarksForMode returns empty for a slot/axis combo
- **Expected:** Fallback to generic line or return "..."

---

## Scope

### In Scope
- DialogueTag type
- TaggedDialogueLine interface with turnPosition for bark families
- Add tags to all KOA_LINES entries
- filterBarksForMode(lines, filter) function
- Update pickKoaLine to accept barkFilter parameter

### Out of Scope
- Puzzle-specific barks (koaBarks in V5Puzzle) - those are authored per-puzzle
- Creating new bark content
- CardDialogue schema with koaQuipTruth/koaQuipLie (future: banter system v2)
- Statement stitcher with beats/callbacks (future: banter system v2)
- Pre-reveal safety validation / banlist (future: banter system v2)

---

## Implementation Hints

Modify `scripts/v5-dialogue.ts`:
```typescript
export type DialogueTag = 'mini-safe' | 'mentions-score' | 'mentions-tax' | 'mentions-flag';
export type TurnPosition = 'T1' | 'T2' | 'T3' | 'any';

export interface TaggedDialogueLine extends DialogueLine {
  tags: DialogueTag[];
  turnPosition?: TurnPosition;  // For bark families (T1→T2→T3 sequences)
}

const KOA_LINES: TaggedDialogueLine[] = [
  // Mini-safe examples
  {
    slot: 'AFTER_PLAY', axis: 'coherence', valence: 'neutral', intensity: 1,
    text: "Noted. Adding that to your file.",
    tags: ['mini-safe']
  },

  // NOT mini-safe
  {
    slot: 'AFTER_PLAY', axis: 'channel_reliance', valence: 'warning', intensity: 3,
    text: "Same channel again? I'm discounting this.",
    tags: ['mentions-tax', 'mentions-score']
  },
];
```

Create `scripts/v5-engine/dialogue-filter.ts`:
```typescript
export function filterBarksForMode(
  lines: TaggedDialogueLine[],
  filter: BarkFilter
): TaggedDialogueLine[] {
  if (filter === 'all') return lines;
  return lines.filter(l => l.tags.includes('mini-safe'));
}
```

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] All KOA_LINES have tags
- [ ] Filter correctly excludes mechanic barks
- [ ] pickKoaLine respects filter
- [ ] No `any` types
- [ ] Self-review completed

---

## Log

### Planning Notes
> Written by Planner

**Context:** Dialogue tagging is what makes Mini feel "clean" without mechanic references.
**Decisions:** Conservative tagging - when in doubt, mark as NOT mini-safe.
**Questions for Implementer:** Review each bark carefully for implicit mechanic references.

### Implementation Notes
> Written by Implementer

**Files created:**
- `scripts/v5-engine/dialogue-filter.ts` - Tags and filter functions
- `scripts/v5-engine/dialogue-filter.test.ts` - Unit tests

**Test count:** 18 tests (7 AC + 1 EC)
- AC-1: 4 tests (DialogueTag values)
- AC-2: 2 tests (TaggedDialogueLine interface)
- AC-3: 3 tests (KOA_LINES tagged)
- AC-4: 2 tests (filterBarksForMode mini-safe)
- AC-5: 1 test (filterBarksForMode all)
- AC-6: 2 tests (pickKoaLineFiltered)
- AC-7: 3 tests (TurnPosition tag)
- EC-1: 1 test (no mini-safe fallback)

**Design decisions:**
- Conservative tagging: when in doubt, NOT mini-safe
- TAGGED_KOA_LINES duplicates KOA_LINES with tags (v5-dialogue.ts unchanged)
- pickKoaLineFiltered wraps filtering + selection

### Review Notes
> Written by Reviewer

### Change Log
- 2026-01-28 Planner: Task created, blocked by 001

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
