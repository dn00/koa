# Task 004: HUD Components (OverrideSequence, ExpertOverlay, ActionBar)

**Status:** backlog
**Complexity:** S
**Depends On:** 002
**Implements:** R4.1, R4.2, R4.3

---

## Objective

Create the HUD components that appear during gameplay: OverrideSequence (3 large card slots), ExpertViewOverlay (belief bar for Advanced mode), and ActionBar (TRANSMIT button).

---

## Context

### Relevant Files
- `mockups/KoaMiniPage2.tsx` — Reference implementation (Zone 2: Override Sequence)
- `src/lib/stores/game.ts` - Game state store

### Embedded Context

```typescript
// From stores
interface MiniCard {
    id: string;
    icon: string;
    type: string;
    title: string;
    // ... other fields
}

// Mode determines visibility
type Mode = 'mini' | 'expert';
```

**OverrideSequence behavior (Zone 2 from mockup):**
- 3 large slots showing played cards
- Empty slot: shows "+" icon and "SLOT_01", "SLOT_02", "SLOT_03"
- Filled slot: shows card type badge, icon, and title
- Entire zone can be swapped with CardPreview when hovering a card

**ExpertViewOverlay:**
- Only shown in 'expert' mode
- Shows "UNLOCK PROBABILITY" as percentage
- Progress bar (red to green gradient)

**ActionBar:**
- Shows "AVAILABLE VARIABLES" label
- TRANSMIT button (replaces PLAY)
- Disabled when no card selected

### Source Docs
- `_process/context/koa-mini-spec.md` - Mini mode spec

---

## Acceptance Criteria

### AC-1: OverrideSequence Empty State ← R4.1
- **Given:** No cards played
- **When:** OverrideSequence renders
- **Then:** Shows 3 empty slots with "+" icon and "SLOT_01/02/03"
- **Test Type:** component

### AC-2: OverrideSequence With Cards ← R4.1
- **Given:** 2 cards played
- **When:** OverrideSequence renders
- **Then:** Slots 1-2 show card (type badge, icon, title)
- **And:** Slot 3 shows empty placeholder
- **Test Type:** component

### AC-3: OverrideSequence Card Display ← R4.1
- **Given:** Card in slot
- **When:** Slot renders
- **Then:** Shows type badge (e.g., "TIMELINE"), icon emoji, card title
- **Test Type:** component

### AC-4: ExpertViewOverlay Hidden in Mini ← R4.2
- **Given:** Mode is 'mini'
- **When:** ExpertViewOverlay renders
- **Then:** Component is not visible
- **Test Type:** component

### AC-5: ExpertViewOverlay Visible in Expert ← R4.2
- **Given:** Mode is 'expert', belief is 65
- **When:** ExpertViewOverlay renders
- **Then:** Shows "UNLOCK PROBABILITY" with 35% (100-65)
- **And:** Progress bar at 35% width
- **Test Type:** component

### AC-6: ActionBar TRANSMIT Button ← R4.3
- **Given:** A card is selected
- **When:** TRANSMIT button is enabled
- **Then:** Button has active styling (bg-primary)
- **And:** Clicking triggers playSelectedCard
- **Test Type:** component

### AC-7: ActionBar TRANSMIT Disabled ← R4.3
- **Given:** No card is selected
- **When:** TRANSMIT button renders
- **Then:** Button is disabled (muted styling, cursor-not-allowed)
- **And:** Clicking does nothing
- **Test Type:** component

---

## Edge Cases

### EC-1: All Cards Played
- **Scenario:** 3 cards played (game complete)
- **Expected:** All 3 slots filled with cards

### EC-2: Belief at Boundaries
- **Scenario:** Belief is 0 or 100
- **Expected:** Progress bar at 100% or 0% respectively, clamped

---

## Error Cases

(None - display-only components)

---

## Scope

**In Scope:**
- OverrideSequence component (3 large slots)
- ExpertViewOverlay component
- ActionBar component (TRANSMIT button)
- Mode-aware visibility

**Out of Scope:**
- Card selection logic (Run Screen)
- CardPreview swap logic (Run Screen manages focusedCard state)

---

## Implementation Hints

From mockup `KoaMiniPage2.tsx` (Zone 2):

```svelte
<!-- OverrideSequence -->
<div class="flex gap-3">
    {#each [0, 1, 2] as i}
        {@const card = playedCards[i]}
        <div class="flex-1 border-2 rounded-[2px] relative transition-all duration-300 flex items-center justify-center overflow-hidden
            {card ? 'bg-surface border-foreground shadow-sm' : 'bg-transparent border-dashed border-foreground/20'}">
            {#if card}
                <div class="flex flex-col items-center justify-center w-full h-full p-1 gap-0.5">
                    <span class="text-[8px] font-mono font-bold bg-foreground text-surface px-1.5 py-0.5 rounded-[1px]">
                        {card.type}
                    </span>
                    <div class="text-2xl">{card.icon}</div>
                    <div class="text-[9px] font-bold text-center leading-none line-clamp-1">
                        {card.title}
                    </div>
                </div>
            {:else}
                <div class="flex flex-col items-center justify-center opacity-30 gap-1">
                    <span class="text-xl">+</span>
                    <span class="text-[9px] font-mono font-bold">SLOT_0{i + 1}</span>
                </div>
            {/if}
        </div>
    {/each}
</div>
```

```svelte
<!-- ActionBar -->
<div class="h-12 border-b border-foreground/10 flex items-center justify-between px-4 bg-muted/5">
    <span class="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
        AVAILABLE VARIABLES
    </span>
    <button
        on:click={playSelectedCard}
        disabled={!selectedCardId}
        class="h-8 px-4 text-xs font-mono font-bold uppercase rounded-[2px] border transition-all flex items-center gap-2
            {selectedCardId
                ? 'bg-primary text-white border-primary shadow-brutal hover:-translate-y-0.5'
                : 'bg-transparent text-muted-foreground border-foreground/20 cursor-not-allowed'}">
        TRANSMIT <ChevronRight size={14} />
    </button>
</div>
```

---

## Log

### Planning Notes
**Context:** HUD provides progress feedback during gameplay. OverrideSequence replaces StoryStrip with larger, more prominent card slots.
**Decisions:** Slots show full card info (type, icon, title) not just icons. ActionBar uses "TRANSMIT" instead of "PLAY" for smart home panel theming.

### Change Log
- 2026-01-29 [Planner] Updated for panel layout (KoaMiniPage2) - StoryStrip → OverrideSequence
- 2026-01-28 [Planner] Created for V5
