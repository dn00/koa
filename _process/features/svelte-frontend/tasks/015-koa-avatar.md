# Task 015: KOA Avatar

**Status:** backlog
**Assignee:** -
**Blocked By:** 016
**Phase:** Phase 5: Polish
**Complexity:** M
**Depends On:** 016 (Feel System)
**Implements:** R12.1, R12.2, R12.3, R12.4, R12.5, R12.6

---

## Objective

Build a Svelte KOA Avatar component with mood-driven expressions, idle animations, and glitch effects. This is the only continuously animating element in the UI.

---

## Context

### Reference Implementation

A portable React implementation exists at `docs/KoaAvatarPortable.tsx` with:
- Full mood expression system (15 moods with lid positions, pupil scale, angles)
- SVG-based rendering with CSS animations
- Blink loop, iris rotation, inner ring rotation
- Skin system for customization
- Speaking state with pulse animation

### V5 Banter System Integration

Per `_process/v5-design/banter-system.md`, KOA's mood should reflect:
- Game state (belief level, objection pending)
- Player actions (big gains/losses, repeat type tax)
- Dialogue cadence (pre-reveal suspicious, post-reveal specific)

### Relevant Files
- `docs/KoaAvatarPortable.tsx` - Reference React implementation
- `docs/D27-VISUAL-STYLE-SPEC.md` - AURA avatar spec
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` - Animation timing

---

## Embedded Context

### KoaMood Enum (from portable component)

```typescript
export const KoaMood = {
  NEUTRAL: 'NEUTRAL',
  SUSPICIOUS: 'SUSPICIOUS',
  DISAPPOINTED: 'DISAPPOINTED',
  AMUSED: 'AMUSED',
  WATCHING: 'WATCHING',
  PROCESSING: 'PROCESSING',
  GLITCH: 'GLITCH',
  SLEEPY: 'SLEEPY',
  ANGRY: 'ANGRY',
  ACCEPTING: 'ACCEPTING',
  CURIOUS: 'CURIOUS',
  GRUDGING: 'GRUDGING',
  IMPRESSED: 'IMPRESSED',
  RESIGNED: 'RESIGNED',
  SMUG: 'SMUG'
} as const;
```

### Expression Parameters

Each mood maps to:
- `lidTop` / `lidBottom` - Eyelid positions (0-100)
- `lidAngle` - Tilt angle for expressions like ANGRY
- `pupilScale` - Pupil size (0.5-1.3)
- `lidCurveTop` / `lidCurveBottom` - Bezier curve for lid shape

### Mood Colors

Each mood has:
- `main` - Primary glow/ring color
- `pupil` - Pupil fill color

---

## Acceptance Criteria

### AC-1: Abstract orb design (R12.1)
- SVG-based eye/orb design (not human face)
- Body with faceplate and lens layers
- Segmented ring around lens
- **Test:** Visual inspection matches D27 spec

### AC-2: Mood states (R12.2)
- Support all 15 KoaMood values
- Smooth transitions between moods (0.3s bezier)
- Color changes for ring, pupil, glow
- **Test:** Each mood renders with distinct expression

### AC-3: Glitch effect (R12.3)
- Triggered imperatively via `triggerGlitch()`
- Brief chromatic aberration / jitter
- Used for: objection, big score changes, scrutiny threshold
- **Test:** Glitch plays and completes callback

### AC-4: Glitch readability (R12.4)
- Glitch duration < 300ms
- Never obscures critical UI
- **Test:** UI remains readable during glitch

### AC-5: Idle breathing animation (R12.5)
- Continuous subtle pulse/scale oscillation
- Blink loop (random 2-6s interval)
- Iris rotation (random direction changes)
- **Test:** Avatar animates when idle

### AC-6: Page Visibility pause (R12.6)
- Pause all animations when tab hidden
- Resume when tab visible
- **Test:** CPU idle when tab backgrounded

---

## Edge Cases

### EC-1: Rapid mood changes
- Queue or interrupt gracefully
- No flickering or stuck states
- **Test:** Rapid mood toggles don't break animation

### EC-2: Reduced motion preference
- Static avatar with mood colors only
- No pulse, blink, or rotation
- **Test:** `prefers-reduced-motion` respected

---

## Implementation Notes

### Svelte Adaptation

The React reference uses:
- `useState` for blink/rotation state → Use Svelte stores or `$state`
- `useEffect` for animation loops → Use `onMount`/`onDestroy`
- `useId` for unique IDs → Use `crypto.randomUUID()` or counter
- Inline `<style>` for keyframes → Use Svelte `<style>` block

### GSAP vs CSS Animations

The reference uses CSS `@keyframes`. For consistency with the feel system:
- Consider GSAP for imperative effects (glitch, mood transitions)
- Keep CSS for continuous idle animations (breathing, spin)
- Pause GSAP global timeline on visibility change

### Component API

```svelte
<KoaAvatar
  mood={$gameStore.koaMood}
  isSpeaking={$feelStore.koaSpeaking}
  bind:this={avatarRef}
/>

<!-- Imperative -->
avatarRef.triggerGlitch()
avatarRef.pause()
avatarRef.resume()
```

### Mood Mapping from Game State

```typescript
function deriveKoaMood(state: GameState): KoaMood {
  if (state.objection?.resolved === false) return 'SUSPICIOUS';
  if (state.belief >= state.target + 10) return 'IMPRESSED';
  if (state.belief <= state.target - 10) return 'DISAPPOINTED';
  if (state.turnsPlayed === 0) return 'NEUTRAL';
  return 'WATCHING';
}
```

---

## Test Count Estimate

| Type | Count |
|------|-------|
| AC tests | 6 |
| EC tests | 2 |
| **Total** | 8 |

---

## References

- `docs/KoaAvatarPortable.tsx` - Full React reference implementation
- `docs/D27-VISUAL-STYLE-SPEC.md` - Visual design spec
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` - Animation timing budgets
- `_process/v5-design/banter-system.md` - Dialogue/mood integration
