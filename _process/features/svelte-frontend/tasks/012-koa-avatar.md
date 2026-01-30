# Task 012: KOA Avatar

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Polish
**Complexity:** M
**Depends On:** 002
**Implements:** R8.1, R8.2, R8.3

---

## Objective

Create the Hero KOA Avatar component for Svelte with mood states derived from V5 game state and `isSpeaking` animation state that syncs with Typewriter.

---

## Context

KOA Avatar sits in Zone 1 (KOA Hero row) on the LEFT side, next to the BarkPanel on the right. It's large enough to show mood via eyelid expressions, and syncs with Typewriter via `isSpeaking` prop.

**Layout (from KoaMiniPage2.tsx):**
```
┌────────┐  ┌─────────────────────────┐
│        │  │ [SYS_MSG] | [LOGS]      │
│ AVATAR │  │                         │
│        │  │ "Current bark text..."  │
└────────┘  └─────────────────────────┘
   LEFT              RIGHT (BarkPanel)
```

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/KoaAvatarPortable.tsx` — Reference mockup implementation
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage2.tsx` — Panel layout reference
- `_process/context/koa-mini-components.md` — Component spec (section 8)
- `_process/v5-design/banter-system.md` — Mood derivation rules

### Embedded Context

**Component Props:**
```typescript
interface KoaAvatarProps {
    mood: KOAMood;
    isSpeaking?: boolean;  // Syncs with Typewriter onStart/onComplete
    size?: 'hero' | 'small';  // 'hero' for Run Screen, 'small' for chat bubbles
}
```

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

### AC-4: Glitch Effects ← R8.2
- **Given:** mood='glitch_minor'
- **When:** Renders
- **Then:** Shows glitch visual effect
- **Test Type:** component

### AC-5: isSpeaking Animation State ← R8.3
- **Given:** isSpeaking=true
- **When:** Avatar renders
- **Then:** Eyes/mouth animate subtly (pulse or blink pattern)
- **Test Type:** component

### AC-6: Zone 1 Layout ← R8.1
- **Given:** Avatar component used in Zone 1 of Run Screen
- **When:** Renders
- **Then:** Large size, LEFT aligned, next to BarkPanel
- **Test Type:** visual

### Edge Cases

#### EC-1: Rapid Mood Changes
- **Scenario:** Mood changes quickly
- **Expected:** Smooth transition between states

---

## Scope

### In Scope
- Svelte KOAAvatar component
- All 15 mood states
- isSpeaking animation state
- Hero size variant (large, Zone 1 left-aligned)
- deriveKoaMood() function
- CSS for expressions
- Glitch effects

### Out of Scope
- Banter text selection (uses banter-system.md)
- Sound effects
- Small avatar variant for chat (if needed, can extend later)

---

## Implementation Hints

1. Port CSS from mockup `KoaAvatarPortable.tsx`
2. Use Svelte transitions for mood changes
3. deriveKoaMood can be shared with engine-core
4. isSpeaking triggers subtle animation:
   ```svelte
   <div class="avatar" class:speaking={isSpeaking}>
       <!-- eyes pulse when speaking -->
   </div>
   ```
5. Parent (Run Screen) wires Typewriter callbacks to avatar in Zone 1:
   ```svelte
   <!-- Zone 1: KOA Hero Row -->
   <div class="flex gap-4">
       <KoaAvatar mood={$koaMood} isSpeaking={$isSpeaking} />
       <BarkPanel>
           <Typewriter
               text={currentBark}
               onStart={() => isSpeaking.set(true)}
               onComplete={() => isSpeaking.set(false)}
           />
       </BarkPanel>
   </div>
   ```

---

## Definition of Done

- [ ] Avatar renders all 15 moods
- [ ] isSpeaking prop triggers animation
- [ ] Zone 1 layout: large, left-aligned next to BarkPanel
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
