# Discovery: Svelte + GSAP Frontend (V5)

**Date:** 2026-01-28 (Updated for V5)
**Status:** approved
**Author:** Discovery Agent

---

## Overview

### Problem Statement

Build a game-feel-first frontend in Svelte + GSAP for the V5 game engine. This is not a webapp with animations — it's a **game** that happens to run in a browser.

### V5 Game Mechanics (Key Context)

**Gameplay Loop:**
1. Start with hand of cards, belief at 50
2. Each turn: select 1 card → play → beliefChange applied
3. After turn 2: Objection prompt (stand by or withdraw)
4. After turn 3: Game ends, verdict based on belief vs target

**V5 State Model:**
```typescript
interface GameState {
  belief: number;           // Current score (starts ~50)
  hand: Card[];             // Cards not yet played
  played: Card[];           // Cards already played
  turnResults: TurnResult[]; // History of plays
  turnsPlayed: number;      // 0-3
  objection: ObjectionState | null;
}

interface Card {
  id: CardId;
  strength: number;         // 1-5
  evidenceType: EvidenceType; // DIGITAL | PHYSICAL | TESTIMONY | SENSOR
  location: string;
  time: string;
  claim: string;
  presentLine: string;      // What player says
  isLie: boolean;
}
```

**Key V5 Rules:**
- **Belief bar**: Starts at 50, target varies per puzzle (e.g., 65)
- **Single card per turn**: Select and play 1 card (not multiple)
- **3 turns total**: Game ends after turn 3
- **Type tax**: -2 penalty for playing same evidenceType consecutively
- **Objection**: After turn 2, KOA challenges → Stand By (+2 truth/-4 lie) or Withdraw (-2)
- **No scrutiny**: Removed in V5
- **No concern chips**: Removed in V5
- **No counter panel**: Removed in V5

### Proposed Solution

Create `packages/app-svelte` (SvelteKit + GSAP) with V5 mechanics:

- **Keep 100%** of engine-core (V5 resolver, types, packs)
- **Rewrite** UI layer in Svelte with V5-specific components
- **Add** GSAP for game-feel animations per D16 timing budgets

### Success Criteria

1. V5 game mechanics work correctly (belief, objection, type tax)
2. Bundle size < 100KB gzipped (excluding assets)
3. Card interactions feel "juicy" - spring physics, satisfying feedback
4. Animations run at 60fps on Pixel 4a / iPhone SE 2
5. PWA works offline (I2 invariant)
6. Event-sourced state (I4 invariant)

---

## Requirements

### Must Have (P0)

**R1: SvelteKit Project Setup**
- TypeScript strict mode
- GSAP core + Flip plugin
- engine-core imports work
- Vitest for component tests
- CSS custom properties for D27 color tokens

**R2: Svelte Stores (V5 Event Sourcing)**
- Game store with V5Event[] as source of truth
- deriveV5State() for reactive state
- Feel store for animation state
- Settings store

**R3: Core Screens**
- R3.1: Home Screen - start game, select puzzle
- R3.2: Run Screen - V5 gameplay (3 turns + objection)
- R3.3: Result Screen - verdict display (tier, belief vs target)

**R4: HUD Components (V5)**
- R4.1: BeliefBar - current belief vs target with progress indicator
- R4.2: TurnsDisplay - "Turn X/3" indicator
- R4.3: ~~Scrutiny~~ **REMOVED IN V5**
- R4.4: ~~Concern chips~~ **REMOVED IN V5**

**R5: Card System (V5)**
- R5.1: Evidence card showing V5 fields (strength, evidenceType, claim, location, time)
- R5.2: Hand display (single selection only, not multiple)
- R5.3: Card selection with visual feedback
- R5.4: Type tax warning when selecting same evidenceType as last played

**R6: Objection Flow (V5 NEW)**
- R6.1: ObjectionPrompt after turn 2
- R6.2: Stand By / Withdraw choice UI
- R6.3: KOA challenge dialogue display
- R6.4: Result feedback (+2/-4 for stand by, -2 for withdraw)

**R7: GSAP Animation System**
- R7.1: Card deal animation (spring into hand)
- R7.2: Card select/deselect feedback (scale, glow)
- R7.3: Card play animation (single card to played area)
- R7.4: BeliefBar animation (smooth fill change)
- R7.5: Objection modal entrance/exit
- R7.6: Win/loss celebration effects

**R8: Service Integration**
- R8.1: Persistence service (V5Event[] storage)
- R8.2: Pack loader service
- R8.3: Telemetry service

**R9: PWA Support**
- R9.1: Service worker registration
- R9.2: Offline gameplay
- R9.3: App manifest

### Should Have (P1)

**R10: KOA Avatar**
- 15 mood states (from portable component)
- Mood derived from game state
- Glitch effects on key moments

**R11: Banter System Integration**
- presentLine display when card played
- KOA pre-reveal bark (from library)
- KOA post-reveal quip (from card data)
- Objection challenge dialogue

**R12: Haptic Feedback**
- Vibration API on mobile for key moments

### Won't Have (this scope)

- ~~Counter panel~~ (removed in V5)
- ~~Scrutiny indicator~~ (removed in V5)
- ~~Concern chips~~ (removed in V5)
- ~~Multiple card selection~~ (V5 is 1 card per turn)
- Canvas/WebGL rendering
- 3D effects beyond CSS transforms

---

## Technical Analysis

### V5 Engine Exports (What Svelte Uses)

```typescript
// Types
import type {
  Card, GameState, V5Puzzle, GameConfig,
  TurnResult, ObjectionState, Tier, VerdictData
} from '@hsh/engine-core';

// Functions
import {
  createGameState, playCard, resolveObjectionState,
  isGameOver, getVerdict, autoResolveObjection
} from '@hsh/engine-core';

// Config
import { DEFAULT_CONFIG, BUILTIN_PACK } from '@hsh/engine-core';
```

### Svelte Store Architecture

```typescript
// gameStore.ts (V5 Event Sourcing)
export type V5Event =
  | { type: 'GAME_STARTED'; puzzleSlug: string; seed: number }
  | { type: 'CARD_PLAYED'; cardId: string }
  | { type: 'OBJECTION_RESOLVED'; choice: 'stood_by' | 'withdrawn' };

export const events = writable<V5Event[]>([]);
export const gameState = derived(events, deriveV5State);

// Actions
export function startGame(puzzle: V5Puzzle, seed: number) { ... }
export function playCard(cardId: string) { ... }
export function resolveObjection(choice: 'stood_by' | 'withdrawn') { ... }
```

### Component Hierarchy

```
App
├── HomeScreen
│   └── PuzzleSelector
├── RunScreen
│   ├── HUD
│   │   ├── BeliefBar
│   │   └── TurnsDisplay
│   ├── KOAAvatar
│   ├── DialogueBox (banter)
│   ├── HandDisplay
│   │   └── EvidenceCard (×N)
│   ├── PlayedCards
│   └── ObjectionPrompt (conditional)
└── ResultScreen
    ├── VerdictDisplay
    ├── BeliefSummary
    └── PlayedCardsSummary
```

### Animation Timing (D16 Budgets)

| Interaction | Duration | GSAP Ease |
|-------------|----------|-----------|
| Card deal | 300ms stagger 80ms | back.out(1.7) |
| Card select | 160ms | power2.out |
| Card play | 250ms | power3.out |
| Belief change | 220ms + 90ms bounce | power2.out |
| Objection appear | 200ms | back.out(1.2) |
| Win celebration | 800ms | elastic.out |

---

## Constraints

### Technical Constraints

| Constraint | Rationale |
|------------|-----------|
| Must use V5 engine-core | Proven logic, 192 tests |
| GSAP for animations | Industry standard |
| No Canvas/WebGL | Overkill for this game |
| PWA required | I2 offline-first invariant |
| Event sourcing | I4 invariant |

### V5 Game Constraints

| Rule | Implementation |
|------|----------------|
| 1 card per turn | Hand shows cards, single select only |
| 3 turns max | TurnsDisplay shows progress |
| Objection after T2 | ObjectionPrompt component |
| Type tax | Visual warning on card selection |
| Belief not resistance | BeliefBar, not ResistanceBar |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GSAP SSR issues | Medium | Medium | SPA mode, disable SSR |
| 60fps on low-end | Medium | Medium | Test on Pixel 4a early |
| Objection UX clarity | Medium | Low | Clear UI with +/- indicators |
| Banter pacing | Low | Low | Follow banter-system.md cadence |

---

## References

- `packages/engine-core/src/types/v5/` - V5 type definitions
- `packages/engine-core/src/resolver/v5/` - V5 game logic
- `_process/v5-design/banter-system.md` - Dialogue system
- `docs/KoaAvatarPortable.tsx` - Reference KOA implementation
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` - Animation timing
- `docs/D27-VISUAL-STYLE-SPEC.md` - Visual design

---

## Next Steps

1. [x] Update discovery for V5
2. [ ] Update plan with V5 tasks
3. [ ] Update/create task files
4. [ ] Begin implementation
