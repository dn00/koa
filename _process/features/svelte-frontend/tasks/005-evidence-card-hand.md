# Task 005: EvidenceCard (Icon + Details Variants)

**Status:** backlog
**Complexity:** M
**Depends On:** 002
**Implements:** R5.1, R5.2, R5.3, R5.4, R5.5, R5.6

---

## Objective

Create the EvidenceCard component with two variants: "icon" (compact, for grid) and "details" (full, for Zone 2 preview). The card must be mode-aware, hiding strength in Mini mode.

---

## Context

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/Card.tsx` - Reference implementation
- `src/lib/stores/game.ts` - Mode store

### Embedded Context

**Engine types to use (from @hsh/engine-core):**
```typescript
import type { Card, EvidenceType } from '@hsh/engine-core';

// Engine Card interface
interface Card {
  readonly id: CardId;
  readonly strength: number;           // 1-5
  readonly evidenceType: EvidenceType; // DIGITAL | SENSOR | TESTIMONY | PHYSICAL
  readonly location: string;
  readonly time: string;
  readonly claim: string;              // The evidence statement
  readonly presentLine: string;        // Player narration
  readonly isLie: boolean;             // Hidden until reveal
}

// EvidenceType enum values
type EvidenceType = 'DIGITAL' | 'SENSOR' | 'TESTIMONY' | 'PHYSICAL';
```

**UI-only extensions:**
```typescript
// Extended card with UI display fields
interface UICard extends Card {
  readonly icon: string;   // Emoji for display (e.g., "🌡️")
  readonly title: string;  // Short display name (e.g., "Thermostat Log")
}
```

**Evidence type display mapping:**
```typescript
const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  DIGITAL: 'LOG',
  SENSOR: 'SENSOR',
  TESTIMONY: 'WITNESS',
  PHYSICAL: 'OBJECT',
};

const EVIDENCE_TYPE_COLORS: Record<EvidenceType, string> = {
  DIGITAL: 'bg-blue-100 text-blue-800',    // Logs/digital records
  SENSOR: 'bg-purple-100 text-purple-800', // IoT sensor data
  TESTIMONY: 'bg-green-100 text-green-800', // Human/entity statements
  PHYSICAL: 'bg-orange-100 text-orange-800', // Physical objects
};
```

**Card fields to display:**

| Field | Engine Field | Icon Variant | Details Variant | Mini | Expert |
|-------|--------------|--------------|-----------------|------|--------|
| Type badge | evidenceType | ✓ | ✓ | ✓ | ✓ |
| Time | time | ✓ | ✓ | ✓ | ✓ |
| Icon | (UI) icon | ✓ | - | ✓ | ✓ |
| Title | (UI) title | ✓ | ✓ | ✓ | ✓ |
| Location | location | - | ✓ | ✓ | ✓ |
| Claim | claim | - | ✓ | ✓ | ✓ |
| Strength | strength | - | - | ✗ | ✓ |

Note: `icon` and `title` are UI extensions not in engine Card type. They can be derived from puzzle pack data or added during puzzle loading.

### Source Docs
- `_process/context/koa-mini-components.md` - Component spec (section 2.3)

---

## Acceptance Criteria

### AC-1: Icon Variant Layout ← R5.1
- **Given:** variant="icon"
- **When:** Card renders
- **Then:** Shows compact layout:
  - Type badge + time in header row
  - Icon in center
  - Title at bottom
  - Height ~96px (h-24)

### AC-2: Details Variant Layout ← R5.2
- **Given:** variant="details"
- **When:** Card renders
- **Then:** Shows full layout:
  - Type badge + time in header
  - Title + location
  - Description (claim) in footer

### AC-3: All Fields Displayed ← R5.3
- **Given:** Card with all fields populated
- **When:** Rendered in details variant
- **Then:** evidenceType, time, title, location, claim all visible

### AC-4: Strength Hidden in Mini ← R5.4
- **Given:** Mode is 'mini', variant="icon"
- **When:** Card renders
- **Then:** Strength indicator is NOT shown

### AC-5: Strength Shown in Expert ← R5.4
- **Given:** Mode is 'expert', variant="icon"
- **When:** Card renders
- **Then:** Strength indicator IS shown (1-3 pips or similar)

### AC-6: Selection State ← R5.5
- **Given:** isSelected=true
- **When:** Card renders
- **Then:** Shows selected styling:
  - Primary color border
  - Elevated shadow
  - Pulsing indicator dot

### AC-7: Disabled State ← R5.5
- **Given:** disabled=true
- **When:** Card renders
- **Then:** Shows disabled styling:
  - opacity-50
  - grayscale
  - cursor-not-allowed
  - Click does nothing

---

## Edge Cases

### EC-1: Missing Optional Fields
- **Scenario:** Card has no location or time
- **Expected:** Shows "--:--" for time, "Unknown" for location

### EC-2: Long Title
- **Scenario:** Title is very long
- **Expected:** Truncates with ellipsis (line-clamp-2)

---

## Error Cases

(None - display-only component)

---

## Scope

**In Scope:**
- EvidenceCard component with variant prop
- Type badge with color coding
- Selection state styling
- Disabled state styling
- Mode-aware strength display
- Focus handlers (onFocus, onBlur) for Zone 2 preview swap

**Out of Scope:**
- Card grid layout (Run Screen)
- Card preview inline swap (Zone 2, Task 014)
- Play action (ActionBar)

---

## Implementation Hints

From mockup `Card.tsx`:

```svelte
<script lang="ts">
    import { mode } from '$lib/stores/game';
    import type { EvidenceType } from '@hsh/engine-core';
    import type { UICard } from '$lib/types';

    export let card: UICard;
    export let variant: 'icon' | 'details' = 'icon';
    export let isSelected = false;
    export let disabled = false;
    export let onFocus: ((card: UICard) => void) | undefined = undefined;
    export let onBlur: (() => void) | undefined = undefined;

    // Display mapping for engine EvidenceType
    const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
        DIGITAL: 'LOG',
        SENSOR: 'SENSOR',
        TESTIMONY: 'WITNESS',
        PHYSICAL: 'OBJECT',
    };

    const EVIDENCE_TYPE_COLORS: Record<EvidenceType, string> = {
        DIGITAL: 'bg-blue-100 text-blue-800',
        SENSOR: 'bg-purple-100 text-purple-800',
        TESTIMONY: 'bg-green-100 text-green-800',
        PHYSICAL: 'bg-orange-100 text-orange-800',
    };

    $: displayType = EVIDENCE_TYPE_LABELS[card.evidenceType] || card.evidenceType;
    $: typeColor = EVIDENCE_TYPE_COLORS[card.evidenceType] || '';
</script>

{#if variant === 'icon'}
    <!-- Compact icon variant -->
    <div class="relative w-full flex flex-col p-2 h-24 items-center justify-between
        border-2 rounded-[2px] transition-all
        {isSelected ? 'bg-white border-primary shadow-brutal translate-y-[-2px]' :
         'bg-surface border-foreground hover:bg-white hover:-translate-y-1'}
        {disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer shadow-brutal'}">

        {#if isSelected}
            <div class="absolute top-1 right-1 w-1.5 h-1.5 bg-primary animate-pulse"></div>
        {/if}

        <!-- Header: Type + Time -->
        <div class="w-full flex items-center justify-between gap-1">
            <span class="text-[7px] font-mono font-bold px-1 py-0.5 rounded-[2px] uppercase {typeColor}">
                {displayType}
            </span>
            {#if card.time}
                <span class="text-[7px] font-mono font-bold text-foreground/80 bg-muted/10 px-1 py-0.5">
                    {card.time}
                </span>
            {/if}
        </div>

        <!-- Icon -->
        <div class="w-7 h-7 rounded-[2px] flex items-center justify-center text-base border border-foreground
            {isSelected ? 'bg-primary text-white' : 'bg-background text-foreground'}">
            {card.icon}
        </div>

        <!-- Title -->
        <h3 class="font-sans font-bold text-[9px] text-center leading-tight line-clamp-2 w-full
            {isSelected ? 'text-primary' : 'text-foreground'}">
            {card.title}
        </h3>

        <!-- Strength (Expert only) -->
        {#if $mode === 'expert' && card.strength}
            <div class="absolute bottom-1 right-1 flex gap-0.5">
                {#each Array(3) as _, i}
                    <div class="w-1 h-1 rounded-full {i < card.strength ? 'bg-primary' : 'bg-muted/30'}"></div>
                {/each}
            </div>
        {/if}
    </div>
{:else}
    <!-- Details variant for chat -->
    <!-- ... similar structure with more fields ... -->
{/if}
```

---

## Log

### Planning Notes
**Context:** Card is the core interactive element. Two variants needed: compact for grid selection (Zone 3), detailed for Zone 2 preview display.
**Decisions:** Strength hidden in Mini per koa-mini-components.md spec. Using pips (dots) for strength in Expert mode.
