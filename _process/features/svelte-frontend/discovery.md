# Discovery: Svelte + GSAP Frontend

**Date:** 2026-01-26
**Status:** approved
**Author:** Discovery Agent

---

## Overview

### Problem Statement

The current React frontend is functional but lacks "game feel." For a mobile-first daily puzzle game, we need:

1. **Juicy interactions** - Card physics, satisfying feedback, spring animations
2. **Small bundle** - Fast load for daily players on mobile
3. **Game-like UX** - Feels like a game, not a web app
4. **Performance** - Smooth 60fps animations on mid-tier phones

React + CSS Modules can achieve this with Framer Motion, but Svelte + GSAP offers:
- Smaller bundle (no React runtime)
- Simpler animation code (GSAP is industry standard for games)
- Cleaner component syntax (less boilerplate)
- Built-in transitions for simple cases

### Proposed Solution

Replace `packages/app` (React) with `packages/app-svelte` (SvelteKit + GSAP):

- **Keep 100%** of engine-core (pure TypeScript logic, 260+ tests)
- **Keep most** of services (db, persistence, pack-loader, telemetry)
- **Rewrite** UI layer in Svelte
- **Add** GSAP for game-feel animations

### Success Criteria

1. All existing game mechanics work identically (engine-core unchanged)
2. Bundle size < 100KB gzipped (excluding assets)
3. Card interactions feel "juicy" - spring physics, satisfying feedback
4. Animations run at 60fps on Pixel 4a / iPhone SE 2
5. PWA works offline (same as React version)
6. All acceptance criteria from original tasks still pass

---

## Requirements

### Must Have (P0)

**R1: SvelteKit Project Setup**
- Rationale: Foundation for all Svelte work
- Verification: `npm run dev` starts, imports engine-core

**R2: Svelte Stores (replacing Zustand)**
- Rationale: Svelte has native stores, don't need external library
- Verification: Game state management works, event sourcing preserved

**R3: Core Screens**
- R3.1: Home Screen - navigation hub
- R3.2: Run Screen - main gameplay
- R3.3: Result Screen - win/loss display
- Verification: All screens render, navigation works

**R4: HUD Components**
- R4.1: Resistance bar with animated fill
- R4.2: Scrutiny indicator with warning state
- R4.3: Concern chips with addressed state
- R4.4: Turns display
- Verification: HUD updates reactively on state change

**R5: Card System**
- R5.1: Evidence card component
- R5.2: Hand carousel with touch scroll
- R5.3: Card selection with visual feedback
- R5.4: Story timeline showing committed cards
- Verification: Cards selectable, carousel scrolls, timeline updates

**R6: GSAP Animation System**
- R6.1: Card deal animation (spring into hand)
- R6.2: Card select/deselect feedback (scale, glow)
- R6.3: Submit animation (cards fly to timeline)
- R6.4: Damage numbers (count up animation)
- R6.5: Win celebration (confetti, screen effects)
- R6.6: Screen shake on critical moments
- Verification: Animations feel satisfying, 60fps

**R7: Counter Panel**
- Visibility modes: always, hover, never
- Verification: Respects settings store

**R8: Service Integration**
- R8.1: Persistence service (IndexedDB)
- R8.2: Pack loader service
- R8.3: Telemetry service
- Verification: Data persists, packs load, events track

**R9: PWA Support**
- R9.1: Service worker registration
- R9.2: Offline gameplay
- R9.3: App manifest
- Verification: Works in airplane mode after cache

### Should Have (P1)

**R10: KOA Avatar**
- 8 mood states with smooth transitions
- Optional: Rive animation for expressions

**R11: Advanced Animations**
- R11.1: Card flip animation (refutation reveal)
- R11.2: Particle effects (subtle, performant)
- R11.3: Layout animations (GSAP Flip)

**R12: Haptic Feedback**
- Vibration API on mobile for key moments

### Won't Have (this scope)

- Redesign of game mechanics (engine-core unchanged)
- New screens beyond existing 3
- Canvas/WebGL rendering (DOM + GSAP is sufficient)
- 3D effects (CSS 3D transforms only)

---

## Technical Analysis

### Existing Code to Keep

**engine-core (100% reuse):**
```
packages/engine-core/
├── src/types/        # All domain types
├── src/resolver/     # All game logic (260+ tests)
├── src/validation/   # Pack validation
└── index.ts
```

**Services (90% reuse, minor adapter changes):**
```
packages/app/src/services/
├── db.ts           # Dexie - no changes
├── persistence.ts  # CRUD - no changes
├── pack-loader.ts  # Fetch/cache - no changes
└── telemetry.ts    # Analytics - minor store reference update
```

### New Package Structure

```
packages/app-svelte/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   │   ├── hud/
│   │   │   ├── cards/
│   │   │   ├── counter/
│   │   │   └── koa/
│   │   ├── stores/         # Svelte stores
│   │   ├── services/       # Copied from app, adapted
│   │   └── animations/     # GSAP utilities
│   ├── routes/             # SvelteKit pages
│   │   ├── +page.svelte    # Home
│   │   ├── run/
│   │   └── results/
│   └── app.html
├── static/
│   └── sw.js               # Service worker
├── svelte.config.js
├── vite.config.ts
└── package.json
```

### Key Technical Decisions

**Svelte Stores vs Zustand:**
```typescript
// Zustand (React)
const useGameStore = create((set) => ({
  events: [],
  submitCards: (cards) => set(...)
}));

// Svelte (native)
export const events = writable<GameEvent[]>([]);
export function submitCards(cards: EvidenceCard[]) {
  events.update(e => [...e, newEvent]);
}
```

**GSAP Integration:**
```svelte
<script>
  import { gsap } from 'gsap';
  import { onMount } from 'svelte';

  let cardEl;

  onMount(() => {
    gsap.from(cardEl, {
      y: 100,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    });
  });
</script>

<div bind:this={cardEl} class="card">...</div>
```

### Dependencies

**New:**
- SvelteKit
- GSAP (gsap, @gsap/shockingly if needed)
- Dexie (same as React version)

**Removed:**
- React, ReactDOM
- React Router
- Zustand
- Framer Motion (not needed)

### Migration Strategy

1. Create `packages/app-svelte` alongside `packages/app`
2. Copy and adapt services
3. Build screens and components
4. Test against same engine-core
5. When complete, delete `packages/app`

---

## Constraints

### Technical Constraints

| Constraint | Rationale |
|------------|-----------|
| Must use engine-core unchanged | 260+ tests, proven logic |
| GSAP for animations | Industry standard, I know it well |
| No Canvas/WebGL | Overkill for this game |
| PWA required | Offline-first invariant |
| Bundle < 100KB gzipped | Mobile performance |

### Game Feel Requirements

| Interaction | Animation |
|-------------|-----------|
| Card enter hand | Spring in from bottom, slight rotation |
| Card hover | Scale 1.05, subtle glow |
| Card select | Scale 0.95 → 1.02, color shift |
| Card submit | Fly to timeline, trail effect |
| Damage dealt | Number counts up, shake on big hit |
| Concern addressed | Check mark pops, green flash |
| Scrutiny increase | Bar fills, warning pulse at 4+ |
| Win | Confetti burst, title animation |
| Loss | Screen desaturate, subtle shake |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GSAP learning curve | Low | Low | Well-documented, I know it |
| SvelteKit SSR complexity | Medium | Medium | Use SPA mode, disable SSR |
| Service worker differences | Low | Low | Same sw.js approach |
| Store migration issues | Medium | Medium | Careful testing |

---

## Open Questions

- [ ] Keep both packages during development or replace? → Keep both
- [ ] Rive for KOA or pure GSAP? → Start GSAP, consider Rive later
- [ ] Shared styles approach? → CSS custom properties + Svelte scoped

---

## References

- Original MVP discovery: `_process/features/mvp/discovery.md`
- Architecture: `_process/project/ARCHITECTURE.md`
- Invariants: `_process/project/INVARIANTS.md`

---

## Next Steps

1. [x] Get discovery approved
2. [ ] Hand off to Planner for task breakdown
3. [ ] Create tasks with acceptance criteria
4. [ ] Begin implementation

---

## Handoff

```
Discovery complete for Svelte + GSAP Frontend.

Ready for Planner phase.

Discovery file: _process/features/svelte-frontend/discovery.md
```
