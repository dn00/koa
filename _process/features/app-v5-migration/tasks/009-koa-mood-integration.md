# Task 009: KoA Mood Integration

**Status:** backlog
**Assignee:** -
**Blocked By:** 002
**Phase:** Phase 3: Cleanup
**Complexity:** S
**Depends On:** 002 (Migrate Game Store)
**Implements:** Banter system mood derivation

---

## Objective

Export `KoaMood` type from engine-core and integrate mood derivation with V5 game state. This enables the portable KoA Avatar component to work with both React and future Svelte frontends.

---

## Context

### Current State

- `KoaMood` is defined locally in:
  - `docs/KoaAvatarPortable.tsx` (15 moods, full expression system)
  - `packages/app/src/components/KOAAvatar/KOAAvatar.tsx` (8 moods, subset)
  - `packages/engine-core/src/types/enums.ts` (8 moods, NOT exported)

- V5 banter system (`_process/v5-design/banter-system.md`) requires mood to reflect:
  - Game state (belief vs target)
  - Turn events (big gains/losses)
  - Objection status

### Goal

Single source of truth for `KoaMood` in engine-core, with a pure function to derive mood from `GameState`.

---

## Acceptance Criteria

### AC-1: Export KoaMood from engine-core
- Add all 15 moods from portable component to `enums.ts`
- Export from `types/v5/index.ts`
- **Test:** `import { KoaMood } from '@hsh/engine-core'` works

### AC-2: Define deriveKoaMood pure function
- Input: `GameState`, `V5Puzzle` (for target)
- Output: `KoaMood`
- Location: `packages/engine-core/src/resolver/mood.ts`
- **Test:** Returns correct mood for various game states

### AC-3: Mood derivation rules
```typescript
function deriveKoaMood(state: GameState, target: number): KoaMood {
  // Objection pending → SUSPICIOUS
  if (state.objection && !state.objection.resolved) return 'SUSPICIOUS';

  // Game over states
  if (isGameOver(state)) {
    const delta = state.belief - target;
    if (delta >= 10) return 'IMPRESSED';
    if (delta >= 5) return 'ACCEPTING';
    if (delta >= 0) return 'GRUDGING';
    if (delta >= -5) return 'DISAPPOINTED';
    return 'RESIGNED';
  }

  // Mid-game based on last turn
  const lastTurn = state.turnResults[state.turnResults.length - 1];
  if (lastTurn) {
    if (lastTurn.wasLie && lastTurn.beliefChange < -3) return 'SMUG';
    if (lastTurn.beliefChange >= 4) return 'CURIOUS';
    if (lastTurn.beliefChange <= -4) return 'SUSPICIOUS';
  }

  // Default progression
  if (state.turnsPlayed === 0) return 'NEUTRAL';
  return 'WATCHING';
}
```
- **Test:** Each branch covered

### AC-4: Update app KOAAvatar to use engine-core type
- Remove local `KoaMood` definition from `KOAAvatar.tsx`
- Import from `@hsh/engine-core`
- **Test:** Component still renders all moods

### AC-5: Update KOAAvatar tests
- Fix import to use engine-core `KoaMood`
- **Test:** All existing tests pass

---

## Edge Cases

### EC-1: Empty game state
- `turnsPlayed === 0` → NEUTRAL
- **Test:** Fresh game shows neutral KoA

---

## Implementation Notes

### Mood Enum (full set from portable)

```typescript
// packages/engine-core/src/types/v5/enums.ts
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
  SMUG: 'SMUG',
} as const;

export type KoaMood = (typeof KoaMood)[keyof typeof KoaMood];
```

### Export Path

```typescript
// packages/engine-core/src/types/v5/index.ts
export { KoaMood } from './enums.js';
export type { KoaMood } from './enums.js';
```

### Resolver Export

```typescript
// packages/engine-core/src/resolver/index.ts
export { deriveKoaMood } from './mood.js';
```

---

## Test Count Estimate

| Type | Count |
|------|-------|
| AC tests | 5 |
| EC tests | 1 |
| **Total** | 6 |

---

## References

- `docs/KoaAvatarPortable.tsx` - Full mood enum and expression mapping
- `_process/v5-design/banter-system.md` - Mood/dialogue integration
- `packages/engine-core/src/types/enums.ts` - Current (unexported) KoaMood
