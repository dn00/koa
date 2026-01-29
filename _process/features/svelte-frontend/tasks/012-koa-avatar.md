# Task 012: KOA Avatar

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Polish
**Complexity:** M
**Depends On:** 002
**Implements:** R10.1, R10.2

---

## Objective

Port KOA Avatar to Svelte with mood states derived from V5 game state.

---

## Context

KOA Avatar displays mood based on game state. Reference implementation exists in React (`docs/KoaAvatarPortable.tsx`). This task ports it to Svelte.

### Relevant Files
- `docs/KoaAvatarPortable.tsx` — Reference React implementation
- `packages/app/src/components/KOAAvatar/` — Current React implementation
- `_process/v5-design/banter-system.md` — Mood derivation rules

### Embedded Context

**KOA Mood States (15 total):**
```typescript
type KOAMood =
  | 'neutral' | 'curious' | 'interested'
  | 'impressed' | 'suspicious' | 'skeptical'
  | 'concerned' | 'worried' | 'alarmed'
  | 'amused' | 'satisfied' | 'disappointed'
  | 'glitch_minor' | 'glitch_major' | 'system_error';
```

**Mood Derivation (V5):**
```typescript
function deriveKoaMood(state: GameState): KOAMood {
  const { belief, turnsPlayed, lastTurnResult } = state;

  // Early game
  if (turnsPlayed === 0) return 'neutral';

  // Based on belief trajectory
  if (belief >= 70) return 'impressed';
  if (belief >= 55) return 'interested';
  if (belief >= 40) return 'curious';
  if (belief >= 25) return 'suspicious';
  return 'skeptical';

  // Override for special moments
  // - Objection: 'concerned'
  // - Lie caught: 'disappointed'
  // - Win: 'satisfied'
}
```

**Avatar Visual:**
```
     ┌─────────┐
     │  ◉   ◉  │  ← Eyes change with mood
     │    ▽    │  ← Mouth changes
     │  ╭───╮  │
     └──┤ ╰ ├──┘
        └───┘
```

---

## Acceptance Criteria

### AC-1: Svelte Component ← R10.1
- **Given:** KoaAvatarPortable.tsx reference
- **When:** Ported to Svelte
- **Then:** Component renders correctly with props
- **Test Type:** component

### AC-2: Mood State Display ← R10.1
- **Given:** Avatar with mood='impressed'
- **When:** Renders
- **Then:** Eyes/mouth show impressed expression
- **Test Type:** component

### AC-3: Mood Derivation ← R10.2
- **Given:** Game state with belief=75
- **When:** deriveKoaMood() called
- **Then:** Returns 'impressed'
- **Test Type:** unit

### AC-4: Glitch Effects ← R10.1
- **Given:** mood='glitch_minor'
- **When:** Renders
- **Then:** Shows glitch visual effect
- **Test Type:** component

### Edge Cases

#### EC-1: Rapid Mood Changes
- **Scenario:** Mood changes quickly
- **Expected:** Smooth transition between states

---

## Scope

### In Scope
- Svelte KOAAvatar component
- All 15 mood states
- deriveKoaMood() function
- CSS for expressions
- Glitch effects

### Out of Scope
- Banter text selection (uses banter-system.md)
- Sound effects

---

## Implementation Hints

1. Port CSS from KoaAvatarPortable.tsx
2. Use Svelte transitions for mood changes
3. deriveKoaMood can be shared with engine-core

---

## Definition of Done

- [ ] Avatar renders all 15 moods
- [ ] Mood derived from game state
- [ ] Glitch effects work
- [ ] Transitions between moods smooth
- [ ] All tests pass

---

## Log

### Change Log
- 2026-01-28 [Planner] Created for V5

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
