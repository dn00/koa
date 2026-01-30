# Plan: Svelte + GSAP Frontend (V5)

**Discovery:** [discovery.md](./discovery.md)
**Mockup Reference:** `mockups/mockup-brutalist.zip`
**Components Spec:** `_process/context/koa-mini-components.md`
**Date:** 2026-01-29
**Status:** ready

---

## Overview

Build a game-feel-first Svelte frontend for V5, aligned with the React mockup (KoaMiniPage2.tsx). The UI uses a **panel-based layout** with fixed zones for avatar, barks, override sequence, and card selection.

### Core UX Pattern (Panel Layout from KoaMiniPage2)

```
┌─────────────────────────────────────────┐
│ [←]                                     │  ← Nav (back button)
├─────────────────────────────────────────┤
│ ┌────────┐  ┌─────────────────────────┐ │
│ │        │  │ [SYS_MSG] | [LOGS]      │ │  ← Zone 1: KOA Hero
│ │ AVATAR │  │                         │ │  Avatar LEFT
│ │        │  │ "Current bark text..."  │ │  BarkPanel RIGHT (tabbed)
│ └────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────┤
│ SECURITY_OVERRIDE_SEQUENCE              │  ← Zone 2: Override Slots
│ ┌────────┐ ┌────────┐ ┌────────┐       │  OR CardPreview (on hover)
│ │ Card 1 │ │ Card 2 │ │ Slot 3 │       │
│ └────────┘ └────────┘ └────────┘       │
├─────────────────────────────────────────┤
│ AVAILABLE VARIABLES        [TRANSMIT]   │  ← Zone 3: Card Tray
│ [card][card][card]                      │
│ [card][card][card]                      │
└─────────────────────────────────────────┘
```

### Game Phases (from Mockup)

1. **READING** - EvidenceComparisonView shows scenario + facts + instructions
2. **PICKING** - Panel layout + card grid for 3 turns
3. **VERDICT** - Tier badge, played cards with lie markers, contradictions
4. **SHARE** - ShareCard artifact

### Mode Differences

| Feature | Mini (Default) | Advanced |
|---------|----------------|----------|
| Belief numbers | Hidden | Shown |
| Strength on cards | Hidden | Shown |
| Type tax rule | Hidden | Shown |
| Objection choice | Auto (optimal) | Player chooses |

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
| R2.4 | Chat log store (MiniLog[]) | Messages append | 002 |
| R2.5 | Game phase store (READING/PICKING/VERDICT/SHARE) | Phase transitions | 002 |

### From R3: Core Screens (Updated for Mockup)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Home Screen with puzzle start | Navigation works | 003 |
| R3.2 | Reading Phase (EvidenceComparisonView) | Shows scenario + facts | 006 |
| R3.3 | Picking Phase (Chat + Grid) | 3 turns work | 006 |
| R3.4 | Verdict Phase (TierBadge + reveal) | Shows lies | 007 |
| R3.5 | Share Phase (ShareCard) | Generates artifact | 007 |

### From R4: HUD Components (Updated for Mockup)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | OverrideSequence (3 large card slots) | Shows played cards | 004 |
| R4.2 | ExpertViewOverlay (belief bar, Advanced only) | Mode-aware | 004 |
| R4.3 | Action bar (TRANSMIT button) | Triggers actions | 004 |

### From R5: Card System (Updated for Mockup)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | EvidenceCard "icon" variant (grid) | Compact display | 005 |
| R5.2 | EvidenceCard "details" variant (preview) | Full display | 005 |
| R5.3 | Card fields: type, time, location, title, claim | All shown | 005 |
| R5.4 | Strength hidden in Mini, shown in Advanced | Mode-aware | 005 |
| R5.5 | Single card selection + confirm flow | Select then PLAY | 005 |
| R5.6 | Type tax warning on selection | Visual indicator | 005 |

### From R6: BarkPanel System (Updated for Panel Layout)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | BarkPanel component with SYS_MSG/LOGS tabs | Tabs switch | 016 |
| R6.2 | SYS_MSG tab shows current bark with typewriter | Text animates | 016 |
| R6.3 | LOGS tab shows scenario header + facts | Facts listed | 016 |
| R6.4 | Auto-switch to SYS_MSG when new bark arrives | Tab updates | 016 |

### From R7: Data Panels (Updated for Panel Layout)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | CardPreviewPanel (Zone 2 inline swap) | Shows on focus | 014 |
| R7.2 | Zone 2 swap behavior (slots ↔ preview) | Transition works | 014 |
| R7.3 | Scenario logs in BarkPanel LOGS tab | Facts shown | 016 |

### From R8: KOA Avatar (Updated)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | Hero avatar (large, Zone 1 left-aligned) | Prominent display | 012 |
| R8.2 | Mood states from portable component | All moods work | 012 |
| R8.3 | isSpeaking animation state | Syncs with typewriter | 012 |

### From R9: Verdict Components (from Mockup)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | TierBadge (BUSTED/CLOSE/CLEARED/FLAWLESS) | Shows icon + color | 007 |
| R9.2 | VerdictLine (KOA quote) | Displays text | 007 |
| R9.3 | PlayedCardsSummary with lie markers | Shows ✓/✗ | 007 |
| R9.4 | ContradictionBlock (why lies were lies) | Explains | 007 |
| R9.5 | ShareButton + ShareCard | Generates artifact | 007 |

### From R10: Objection Flow (Updated)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R10.1 | System Check bark after turn 2 | Shows in BarkPanel | 008 |
| R10.2 | Mini: auto-resolve (no UI prompt) | Auto-calculated | 008 |
| R10.3 | Advanced: Stand By / Withdraw buttons | Player chooses | 008 |

### From R11: GSAP Animations

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R11.1 | Card deal animation | Spring into grid | 009 |
| R11.2 | Card select feedback | Scale, highlight | 009 |
| R11.3 | Card play (to Override Slot) | Slot fills | 009 |
| R11.4 | Zone 2 content swap | Crossfade | 009 |
| R11.5 | Verdict reveal | Zoom in | 009 |

### From R12: Typewriter Component (NEW)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R12.1 | Typewriter effect for text | Characters appear | 015 |
| R12.2 | onStart / onComplete callbacks | Sync with avatar | 015 |
| R12.3 | Configurable speed | Per-use control | 015 |

### From R13: Services

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R13.1 | Persistence (V5Event[] + ChatLog) | Saves/loads | 010 |
| R13.2 | Pack loader | Puzzles load | 010 |

### From R14: PWA Support

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R14.1 | Service worker | Registers | 011 |
| R14.2 | Offline gameplay | Works offline | 011 |
| R14.3 | App manifest | Installable | 011 |

---

## Phases

### Phase 1: Foundation

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 001 | SvelteKit + GSAP Setup | backlog | - | M |
| 002 | Svelte Stores (V5 + Chat) | backlog | 001 | M |

### Phase 2: Atoms (Leaf Components)

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 005 | EvidenceCard (icon + details) | backlog | 002 | M |
| 012 | KOA Avatar (Hero) | backlog | 002 | M |
| 015 | Typewriter | backlog | 001 | S |

### Phase 3: Molecules (Composite Components)

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 004 | HUD (OverrideSequence, ExpertOverlay, ActionBar) | backlog | 002 | S |
| 016 | BarkPanel | backlog | 002, 015 | M |
| 014 | DataPanels (Log, Modal, Preview) | backlog | 005 | M |

### Phase 4: Screens

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 003 | Home Screen | backlog | 002 | S |
| 006 | Run Screen (Reading + Picking) | backlog | 004, 005, 012, 016, 014 | M |
| 007 | Verdict + Share Screen | backlog | 005, 012 | M |
| 008 | Objection Flow | backlog | 006 | M |

### Phase 5: Polish

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 009 | GSAP Animations | backlog | 005, 006, 016 | M |
| 010 | Services (Persistence, Packs) | backlog | 002 | S |
| 011 | PWA Support | backlog | 010 | M |

---

## Dependency Graph

```
001 (Setup)
 └── 002 (Stores)
      ├── 003 (Home)
      ├── 004 (HUD) ────────────────────┐
      ├── 005 (Card) ──────────────────┼── 006 (Run) ── 008 (Objection)
      │                                 │
      ├── 012 (Avatar) ────────────────┘
      │
      ├── 014 (DataPanels) ── 016 (BarkPanel)
      │
      ├── 007 (Verdict)
      │
      └── 010 (Services) ── 011 (PWA)

001 ── 015 (Typewriter) ── 016 (BarkPanel)

009 (Animations) ← depends on 005, 006, 016
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | M | - | Foundation |
| 2 | 002, 015 | M | Batch 1 | Stores + Typewriter |
| 3 | 003, 004, 005, 012, 014 | M | Batch 2 | All leaf/molecule components |
| 4 | 006, 007, 016 | M | Batch 3 | Screens + BarkPanel |
| 5 | 008, 009, 010 | M | Batch 4 | Objection, Animations, Services |
| 6 | 011 | M | Batch 5 | PWA |

---

## Task Summary

| ID | Name | Complexity | Status | Notes |
|----|------|------------|--------|-------|
| 001 | SvelteKit + GSAP Setup | M | backlog | |
| 002 | Svelte Stores (V5 + Chat) | M | backlog | Updated for chat log |
| 003 | Home Screen | S | backlog | |
| 004 | HUD Components | S | backlog | OverrideSequence, ExpertOverlay |
| 005 | EvidenceCard (icon + details) | M | backlog | Two variants |
| 006 | Run Screen | M | backlog | Reading + Picking phases |
| 007 | Verdict + Share Screen | M | backlog | TierBadge, ShareCard |
| 008 | Objection Flow | M | backlog | System Check bark |
| 009 | GSAP Animations | M | backlog | |
| 010 | Services | S | backlog | |
| 011 | PWA Support | M | backlog | |
| 012 | KOA Avatar (Hero) | M | backlog | Large with moods |
| 013 | ~~ChatHistory~~ | M | obsolete | Superseded by Task 016 (BarkPanel) |
| 016 | BarkPanel | M | backlog | **NEW** - Tabbed SYS_MSG/LOGS panel |
| 014 | DataPanels | M | backlog | **NEW** - Log, Modal, Preview |
| 015 | Typewriter | S | backlog | **NEW** - Text animation |

**Total:** 16 tasks in 6 batches (Task 013 obsolete, Task 016 added)

---

## New Components (Panel Layout from KoaMiniPage2)

### BarkPanel (Task 016)
- Tabbed interface with SYS_MSG and LOGS tabs
- SYS_MSG shows current KOA bark with Typewriter effect
- LOGS shows scenario header + numbered facts
- Auto-switches to SYS_MSG when new bark arrives
- Syncs with KOA avatar isSpeaking state

### CardPreviewPanel (Task 014)
- Shows card details on hover/focus
- Displays INLINE in Zone 2 (swaps with OverrideSequence)
- No popup/overlay - simple zone content swap

### OverrideSequence (Task 004)
- 3 large card slots showing played cards
- Current slot shows empty state until filled
- Entire zone swaps with CardPreview on hover
- Replaces StoryStrip from old chat-based layout

### Typewriter
- Character-by-character text reveal
- Configurable speed (default ~20ms/char)
- onStart/onComplete callbacks for avatar sync

---

## Removed from Plan (vs old plan)

- ~~TurnsDisplay~~ → OverrideSequence (large card slots)
- ~~Hand display~~ → Card grid in Zone 3
- ~~ChatHistory~~ → BarkPanel (tabbed, current bark only)
- ~~Objection modal~~ → System Check bark in BarkPanel (Mini auto-resolves)
- ~~BeliefBar standalone~~ → ExpertViewOverlay (Advanced only)
- ~~Popup/dim layer for CardPreview~~ → Inline Zone 2 swap

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GSAP SSR issues | Medium | Medium | SPA mode, disable SSR |
| Zone 2 swap jank | Low | Low | Use Svelte crossfade transitions |
| Typewriter sync | Low | Low | Use onComplete callback |
| Zone layout complexity | Low | Low | Fixed zones, no z-layer issues |

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
| 007 | 5 | 1 | 0 | 6 |
| 008 | 4 | 2 | 1 | 7 |
| 009 | 5 | 1 | 0 | 6 |
| 010 | 4 | 1 | 1 | 6 |
| 011 | 3 | 1 | 0 | 4 |
| 012 | 4 | 1 | 0 | 5 |
| 013 | 5 | 2 | 0 | 7 |
| 014 | 4 | 2 | 0 | 6 |
| 015 | 3 | 1 | 0 | 4 |
| **Total** | **66** | **22** | **4** | **92** |

---

## References

- `_process/context/koa-mini-spec.md` - Mini mode spec
- `_process/context/koa-mini-components.md` - Component spec
- `mockups/mockup-brutalist.zip` - React mockup (authoritative for UX)
- `packages/engine-core/src/types/v5/` - V5 types
