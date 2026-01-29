# Plan: Svelte + GSAP Frontend (V5)

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-28
**Status:** ready

---

## Overview

Build a game-feel-first Svelte frontend for V5. Supports both **KOA Mini** (default, no numbers) and **V5 Advanced** (belief bar, explicit objection choice).

### V5 Game Summary

- **6 cards** (4 truths, 2 lies hidden)
- **3 turns**, 1 card per turn
- **Scoring**: Truth +strength, Lie -(strength-1)
- **Type Tax**: Same evidenceType consecutively → -2 next turn
- **Objection**: After turn 2, KOA challenges last card
- **Tiers**: FLAWLESS / CLEARED / CLOSE / BUSTED

### Mode Differences

| Feature | Mini (Default) | Advanced |
|---------|----------------|----------|
| Belief numbers | Hidden | Shown |
| Type tax rule | Hidden | Shown |
| Objection choice | Auto (optimal) | Player chooses |
| KOA barks | Axis-level hints | Same |

---

## Requirements Expansion

### From R1: SvelteKit Project Setup

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | SvelteKit with TypeScript strict | Compiles | 001 |
| R1.2 | GSAP core installed | Can animate | 001 |
| R1.3 | engine-core imports work | Types available | 001 |
| R1.4 | Vitest for component tests | Tests run | 001 |
| R1.5 | CSS custom properties (D27 tokens) | Theme works | 001 |

### From R2: Svelte Stores (V5 Event Sourcing)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | V5Event[] as source of truth (I4) | Events append | 002 |
| R2.2 | deriveV5State() reactive derivation | State updates | 002 |
| R2.3 | Mode store (mini/advanced toggle) | Mode switches | 002 |
| R2.4 | Settings store (haptics, sound) | Persists | 002 |

### From R3: Core Screens

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Home Screen with puzzle start | Navigation works | 003 |
| R3.2 | Run Screen (3 turns + objection) | Gameplay works | 006 |
| R3.3 | Result Screen (verdict + reveal) | Shows tier | 007 |

### From R4: HUD Components (V5)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | BeliefBar (hidden in Mini, shown in Advanced) | Mode-aware | 004 |
| R4.2 | TurnsDisplay ("Turn X/3") | Shows progress | 004 |
| R4.3 | KOA bark display area | Shows barks | 004 |

### From R5: Card System (V5)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | EvidenceCard with V5 fields | Renders correctly | 005 |
| R5.2 | Single card selection (not multiple) | Only 1 selectable | 005 |
| R5.3 | Type tax warning indicator | Shows when applicable | 005 |
| R5.4 | Card play commits immediately | Triggers turn | 006 |

### From R6: Objection Flow

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | ObjectionPrompt after turn 2 | Appears correctly | 008 |
| R6.2 | Mini: auto-resolve (optimal choice) | No prompt in Mini | 008 |
| R6.3 | Advanced: Stand By / Withdraw choice | Player chooses | 008 |
| R6.4 | KOA "system check" bark | Shows challenge | 008 |

### From R7: GSAP Animations

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Card deal animation | Spring into hand | 009 |
| R7.2 | Card select/play animation | Satisfying feedback | 009 |
| R7.3 | BeliefBar fill animation | Smooth change | 009 |
| R7.4 | Objection modal entrance | Dramatic appear | 009 |
| R7.5 | Win/loss celebration | Appropriate tier feedback | 009 |

### From R8: Service Integration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | Persistence (V5Event[] storage) | Saves/loads | 010 |
| R8.2 | Pack loader | Puzzles load | 010 |

### From R9: PWA Support

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | Service worker | Registers | 011 |
| R9.2 | Offline gameplay | Works offline | 011 |
| R9.3 | App manifest | Installable | 011 |

### From R10: KOA Avatar (P1)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R10.1 | Svelte port of portable component | Renders | 012 |
| R10.2 | Mood derived from game state | Updates correctly | 012 |

---

## Phases

### Phase 1: Foundation

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 001 | SvelteKit + GSAP Setup | backlog | - | M |
| 002 | Svelte Stores (V5) | backlog | 001 | M |

### Phase 2: Components

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 003 | Home Screen | backlog | 002 | S |
| 004 | HUD (BeliefBar, TurnsDisplay, BarkArea) | backlog | 002 | S |
| 005 | EvidenceCard + Hand | backlog | 002 | M |

### Phase 3: Gameplay

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 006 | Run Screen | backlog | 004, 005 | M |
| 007 | Result Screen | backlog | 002 | M |
| 008 | Objection Flow | backlog | 006 | M |

### Phase 4: Polish

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 009 | GSAP Animations | backlog | 005, 006 | M |
| 010 | Services (Persistence, Packs) | backlog | 002 | S |
| 011 | PWA Support | backlog | 010 | M |
| 012 | KOA Avatar | backlog | 002 | M |

---

## Dependency Graph

```
001 (Setup)
 └── 002 (Stores)
      ├── 003 (Home)
      ├── 004 (HUD) ──────────┐
      ├── 005 (Card+Hand) ────┼── 006 (Run) ── 008 (Objection)
      ├── 007 (Result)        │       │
      ├── 010 (Services) ─────┼───────┘
      │    └── 011 (PWA)      │
      └── 012 (Avatar)        │
                              │
      009 (Animations) ───────┘
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | M | - | Foundation |
| 2 | 002 | M | Batch 1 | Stores with V5 event sourcing |
| 3 | 003, 004, 005, 010 | M | Batch 2 | Components + services |
| 4 | 006, 007, 012 | M | Batch 3 | Screens + avatar |
| 5 | 008, 009, 011 | M | Batch 4 | Objection, animations, PWA |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | SvelteKit + GSAP Setup | M | backlog |
| 002 | Svelte Stores (V5) | M | backlog |
| 003 | Home Screen | S | backlog |
| 004 | HUD Components | S | backlog |
| 005 | EvidenceCard + Hand | M | backlog |
| 006 | Run Screen | M | backlog |
| 007 | Result Screen | M | backlog |
| 008 | Objection Flow | M | backlog |
| 009 | GSAP Animations | M | backlog |
| 010 | Services | S | backlog |
| 011 | PWA Support | M | backlog |
| 012 | KOA Avatar | M | backlog |

**Total:** 12 tasks in 5 batches

---

## Removed from MVP Plan (V5 Changes)

These MVP components are **NOT in V5**:
- ~~Resistance bar~~ → BeliefBar
- ~~Scrutiny indicator~~ → Removed
- ~~Concern chips~~ → Removed
- ~~Counter panel~~ → Removed
- ~~Multiple card selection~~ → Single card per turn
- ~~Submit button batch~~ → Card play is immediate

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GSAP SSR issues | Medium | Medium | SPA mode, disable SSR |
| Mode switching complexity | Low | Low | Mode store drives conditional rendering |
| Mini vs Advanced UI drift | Medium | Low | Shared components, mode prop |

---

## Test Count Estimate

| Task | ACs | ECs | ERRs | Total |
|------|-----|-----|------|-------|
| 001 | 5 | 1 | 0 | 6 |
| 002 | 6 | 2 | 1 | 9 |
| 003 | 3 | 1 | 0 | 4 |
| 004 | 4 | 2 | 0 | 6 |
| 005 | 5 | 2 | 0 | 7 |
| 006 | 6 | 2 | 1 | 9 |
| 007 | 4 | 1 | 0 | 5 |
| 008 | 4 | 2 | 1 | 7 |
| 009 | 5 | 1 | 0 | 6 |
| 010 | 4 | 1 | 1 | 6 |
| 011 | 3 | 1 | 0 | 4 |
| 012 | 4 | 1 | 0 | 5 |
| **Total** | **53** | **17** | **4** | **74** |

---

## References

- `_process/v5-design/impo/koa-mini-spec.md` - Mini mode spec (authoritative)
- `_process/context/v5-design-context.md` - V5 invariants (authoritative)
- `packages/engine-core/src/types/v5/` - V5 types
- `docs/KoaAvatarPortable.tsx` - Reference KOA implementation
- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` - Animation timing
