# Plan: Svelte + GSAP Frontend

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-26
**Status:** planning

---

## Overview

Replace the React frontend with Svelte + GSAP for better game feel, smaller bundles, and cleaner animation code. Engine-core remains unchanged.

---

## Requirements Expansion

### From R1: SvelteKit Project Setup

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | SvelteKit project initializes with TypeScript | `npm run dev` starts without errors | 001 |
| R1.2 | engine-core imports work | Can import types and resolver functions | 001 |
| R1.3 | Vite config supports monorepo | Resolves `@hsh/engine-core` | 001 |
| R1.4 | Vitest configured for Svelte | Tests run with jsdom | 001 |

### From R2: Svelte Stores

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Game store manages event log | Events append and persist | 002 |
| R2.2 | State derived from events | `deriveState()` called on event changes | 002 |
| R2.3 | Settings store manages preferences | Counter visibility, telemetry opt-out | 002 |
| R2.4 | Stores integrate with persistence | IndexedDB read/write on store changes | 002, 003 |

### From R3: Core Screens

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Home screen shows navigation options | Play Daily, Practice, Settings, Archive buttons | 004 |
| R3.2 | Run screen displays all gameplay areas | HUD, hand, timeline, counter panel, submit | 005 |
| R3.3 | Result screen shows win/loss state | Correct title, reason, stats | 006 |
| R3.4 | SvelteKit routing works | Navigation between screens | 004, 005, 006 |

### From R4: HUD Components

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Resistance bar shows current/max | Progress bar with percentage | 007 |
| R4.2 | Resistance bar animates on change | GSAP tween on value update | 007 |
| R4.3 | Scrutiny shows X/5 format | Displays current scrutiny level | 007 |
| R4.4 | Scrutiny warning at 4+ | Visual warning state | 007 |
| R4.5 | Concern chips show type | Chip per concern with type label | 007 |
| R4.6 | Concern chips show addressed state | Check mark when addressed | 007 |
| R4.7 | Turns display shows remaining | Number with label | 007 |

### From R5: Card System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Evidence card shows all data | Source, power, proves, claims | 008 |
| R5.2 | Card shows selected state | Visual highlight when selected | 008 |
| R5.3 | Card shows disabled state | Grayed out, not clickable | 008 |
| R5.4 | Card shows refutes badge | Badge when card can refute | 008 |
| R5.5 | Hand carousel scrolls horizontally | Touch scroll, snap to card | 009 |
| R5.6 | Hand limits selection to 3 | 4th card cannot be selected | 009 |
| R5.7 | Story timeline shows committed cards | Ordered list with power | 010 |
| R5.8 | Timeline empty state | Message when no cards committed | 010 |

### From R6: GSAP Animation System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Card deal animation | Spring in from bottom | 011 |
| R6.2 | Card hover effect | Scale up slightly | 011 |
| R6.3 | Card select feedback | Scale down then up, glow | 011 |
| R6.4 | Card deselect feedback | Subtle scale back | 011 |
| R6.5 | Submit animation | Cards fly to timeline | 012 |
| R6.6 | Damage number animation | Count up effect | 012 |
| R6.7 | Win celebration | Confetti, title animation | 012 |
| R6.8 | Loss effect | Desaturate, subtle shake | 012 |
| R6.9 | Screen shake utility | Reusable shake function | 011 |
| R6.10 | All animations 60fps | No jank on Pixel 4a | 011, 012 |

### From R7: Counter Panel

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Counter panel shows active counters | List of non-refuted counters | 013 |
| R7.2 | Visibility mode: always | Always visible | 013 |
| R7.3 | Visibility mode: hover | Faded until hover | 013 |
| R7.4 | Visibility mode: never | Hidden | 013 |

### From R8: Service Integration

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | Persistence service works | Runs save/load from IndexedDB | 003 |
| R8.2 | Pack loader service works | Packs fetch and cache | 003 |
| R8.3 | Telemetry service works | Events queue and send | 003 |
| R8.4 | Services use Svelte stores | Store references updated | 003 |

### From R9: PWA Support

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | Service worker registers | SW controls page | 014 |
| R9.2 | App shell cached | Works offline after first load | 014 |
| R9.3 | App manifest present | Installable PWA | 014 |
| R9.4 | Offline gameplay works | Full game in airplane mode | 014 |

### From R10: KOA Avatar

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R10.1 | Avatar displays 8 moods | Color and label per mood | 015 |
| R10.2 | Avatar transitions smoothly | GSAP between states | 015 |
| R10.3 | Avatar sizes: small, medium, large | Prop controls size | 015 |

---

## Phases

### Phase 1: Foundation
**Goal:** Project setup, stores, services

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 001 | SvelteKit Project Setup | ready | - | M |
| 002 | Svelte Stores | ready | 001 | M |
| 003 | Service Adapters | ready | 001 | S |

### Phase 2: Core UI
**Goal:** Screens and basic components

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 004 | Home Screen | backlog | 002 | S |
| 005 | Run Screen (layout) | backlog | 002, 007, 009, 010, 013 | M |
| 006 | Result Screen | backlog | 002, 012 | M |
| 007 | HUD Components | backlog | 002 | M |
| 008 | Evidence Card Component | backlog | 002 | M |
| 009 | Hand Carousel | backlog | 008 | M |
| 010 | Story Timeline | backlog | 002 | S |
| 013 | Counter Panel | backlog | 002 | S |

### Phase 3: Animations
**Goal:** Game feel with GSAP

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 011 | Card Animations | backlog | 008 | M |
| 012 | Submit & Celebration Animations | backlog | 010, 011 | M |

### Phase 4: Integration
**Goal:** PWA, avatar, polish

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 014 | PWA Support | backlog | 003 | M |
| 015 | KOA Avatar | backlog | 002, 011 | S |

---

## Dependency Graph

```
001 (Setup)
 ├── 002 (Stores) ──┬── 004 (Home)
 │                  ├── 007 (HUD) ─────────────────┐
 │                  ├── 008 (Card) ── 009 (Hand) ──┼── 005 (Run)
 │                  ├── 010 (Timeline) ────────────┤
 │                  ├── 013 (Counter) ─────────────┘
 │                  └── 015 (KOA) ── 011 (Anims)
 │
 └── 003 (Services) ── 014 (PWA)

011 (Card Anims) ┬── 012 (Submit Anims) ── 006 (Result)
                 └── 015 (KOA)
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001 | - | Foundation setup, start immediately |
| 2 | 002, 003 | Batch 1 | Stores and services, parallel |
| 3 | 004, 007, 008, 010, 013 | Batch 2 | Core components, all parallel |
| 4 | 009, 011 | Batch 3 (008) | Hand carousel needs card, animations need card |
| 5 | 005, 012, 014, 015 | Batch 4 | Run screen, submit anims, PWA, KOA |
| 6 | 006 | Batch 5 (012) | Result screen needs celebration anims |

**Batch 1:** Foundation (1 task)
**Batch 2:** Core infrastructure (2 tasks)
**Batch 3:** Independent components (5 tasks)
**Batch 4:** Dependent components (2 tasks)
**Batch 5:** Integration (4 tasks)
**Batch 6:** Final screen (1 task)

---

## Task Summary

| ID | Name | Complexity | Status | Batch |
|----|------|------------|--------|-------|
| 001 | SvelteKit Project Setup | M | ready | 1 |
| 002 | Svelte Stores | M | ready | 2 |
| 003 | Service Adapters | S | ready | 2 |
| 004 | Home Screen | S | backlog | 3 |
| 005 | Run Screen | M | backlog | 5 |
| 006 | Result Screen | M | backlog | 6 |
| 007 | HUD Components | M | backlog | 3 |
| 008 | Evidence Card Component | M | backlog | 3 |
| 009 | Hand Carousel | M | backlog | 4 |
| 010 | Story Timeline | S | backlog | 3 |
| 011 | Card Animations | M | backlog | 4 |
| 012 | Submit & Celebration Anims | M | backlog | 5 |
| 013 | Counter Panel | S | backlog | 3 |
| 014 | PWA Support | M | backlog | 5 |
| 015 | KOA Avatar | S | backlog | 5 |

**Total:** 15 tasks (6 batches)
**Estimated Tests:** ~80-100 tests

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GSAP SSR issues | Disable SSR, SPA mode only |
| Store migration bugs | Test against engine-core extensively |
| Service worker conflicts | Different scope from React version |

---

## Open Questions

- [ ] Delete React package after Svelte complete, or keep for comparison?
- [ ] Shared test utilities between packages?
