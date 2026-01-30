# Task 014: Data Panels (Logs Content, Card Preview)

**Status:** backlog
**Complexity:** M
**Depends On:** 005, 016
**Implements:** R7.1, R7.3

---

## Objective

Create the CardPreviewPanel component for Zone 2 inline display (swaps with OverrideSequence on hover). The scenario logs content is now handled by BarkPanel (Task 016) in the LOGS tab.

---

## Context

**Panel Layout (from KoaMiniPage2.tsx):**
```
Zone 1: [Avatar] [BarkPanel with SYS_MSG/LOGS tabs]
Zone 2: [OverrideSequence] ←→ [CardPreview] (swap on hover)
Zone 3: [Card Tray]
```

CardPreviewPanel is NO LONGER a popup overlay. It displays inline in Zone 2, replacing the OverrideSequence when the player hovers/focuses a card in the tray.

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/KoaMiniComponents.tsx` (CardPreviewPanel)
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage2.tsx` — Zone 2 swap behavior
- `src/lib/components/EvidenceCard.svelte` - Card component reference

### Embedded Context

```typescript
// Scenario type (from game state)
interface Scenario {
    id: string;
    header: string;      // e.g., "FRIDGE LOCK ENGAGED: Dietary Restriction Violation."
    facts: string[];     // 3-5 bullet points
    weakness?: string;   // Optional hint
}

// MiniCard type (from stores)
interface MiniCard {
    id: string;
    title: string;
    description: string;  // The "claim"
    type: string;         // ALIBI, DATA, EXCUSE, WITNESS
    icon: string;
    location?: string;
    time?: string;
    strength?: 1 | 2 | 3; // Hidden in Mini mode
}
```

### Source Docs
- `_process/context/koa-mini-components.md` - Component spec

---

## Acceptance Criteria

### AC-1: CardPreviewPanel Inline ← R7.3
- **Given:** A focused card (MiniCard) from hover/focus in Zone 3
- **When:** CardPreviewPanel is rendered in Zone 2
- **Then:** Shows:
  - Card icon, type badge, location, time
  - Card title
  - Card description (claim)
  - Decorative corner element
- **And:** Replaces OverrideSequence (swap, not overlay)

### AC-2: Zone 2 Swap Behavior ← R7.1
- **Given:** No card is focused
- **When:** Zone 2 renders
- **Then:** Shows OverrideSequence (3 card slots)
- **Given:** A card IS focused
- **When:** Zone 2 renders
- **Then:** Shows CardPreviewPanel instead
- **And:** Transition is smooth (crossfade or slide)

### AC-3: Preview Dismissal
- **Given:** CardPreviewPanel is showing
- **When:** Player moves focus away from card (blur)
- **Then:** Zone 2 swaps back to OverrideSequence

---

## Edge Cases

### EC-1: No Facts
- **Scenario:** Scenario has empty facts array
- **Expected:** Facts section renders empty, no error

### EC-2: Long Header Text
- **Scenario:** Scenario header is very long
- **Expected:** Text wraps correctly within container

---

## Error Cases

(None - display-only components)

---

## Scope

**In Scope:**
- CardPreviewPanel component (for Zone 2 inline display)
- Zone 2 swap logic (OverrideSequence ↔ CardPreview)

**Out of Scope:**
- Scenario logs display (moved to BarkPanel LOGS tab, Task 016)
- IncidentLogModal (no longer needed - logs in BarkPanel)
- Dim layer (no longer needed - inline swap, not popup)
- Focus/blur handling (handled by parent Run Screen)
- Card grid integration (Task 006)
- Animation (Task 009)

---

## Implementation Hints

**Zone 2 Swap Pattern (from KoaMiniPage2.tsx):**

```svelte
<!-- Zone 2: Override Sequence OR Card Preview -->
<div class="zone-2">
    {#if focusedCard}
        <div transition:fade={{ duration: 150 }}>
            <CardPreviewPanel card={focusedCard} />
        </div>
    {:else}
        <div transition:fade={{ duration: 150 }}>
            <OverrideSequence slots={playedCards} maxSlots={3} />
        </div>
    {/if}
</div>
```

**CardPreviewPanel Structure:**

```svelte
<script>
    export let card: MiniCard;
</script>

<div class="bg-white border-2 border-foreground shadow-brutal p-4">
    <!-- Header: Type + Time -->
    <div class="flex justify-between mb-2">
        <span class="text-[10px] font-mono font-bold uppercase px-2 py-0.5
                     {card.type === 'ALIBI' ? 'bg-blue-100' : ''}
                     {card.type === 'DATA' ? 'bg-purple-100' : ''}
                     ...">
            {card.type}
        </span>
        <span class="text-[10px] font-mono">{card.time || '--:--'}</span>
    </div>

    <!-- Icon + Title -->
    <div class="flex items-center gap-3 mb-2">
        <span class="text-2xl">{card.icon}</span>
        <h3 class="font-bold text-sm">{card.title}</h3>
    </div>

    <!-- Location -->
    <div class="text-[10px] font-mono text-muted-foreground mb-2">
        LOC: {card.location || 'Unknown'}
    </div>

    <!-- Description (Claim) -->
    <p class="text-xs leading-relaxed border-t pt-2">
        {card.description}
    </p>
</div>
```

---

## Log

### Planning Notes
**Context:** CardPreviewPanel provides context when player hovers/focuses a card in Zone 3. It swaps inline with OverrideSequence in Zone 2 (no popup/overlay).
**Decisions:**
- Moved from popup to inline swap pattern per KoaMiniPage2.tsx
- Scenario logs moved to BarkPanel LOGS tab (Task 016)
- Removed IncidentLogModal (no longer needed)

### Change Log
- 2026-01-29 [Planner] Updated for KoaMiniPage2.tsx panel layout (inline Zone 2 swap)
