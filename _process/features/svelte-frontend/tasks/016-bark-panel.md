# Task 016: BarkPanel Component (Tabbed Bark/Logs)

**Status:** backlog
**Complexity:** S
**Depends On:** 002, 015
**Implements:** R6.1, R6.2

---

## Objective

Create the BarkPanel component - a tabbed panel that shows either KOA's current bark (SYS_MSG tab) or the scenario facts (LOGS tab). Bark text uses typewriter effect.

---

## Context

### Relevant Files
- `mockups/KoaMiniPage2.tsx` — Reference implementation (Zone 1, right side)
- `src/lib/components/Typewriter.svelte` - Typewriter component (Task 015)
- `src/lib/stores/game.ts` - Game state store

### Embedded Context

```typescript
// Panel modes
type MsgMode = 'BARK' | 'LOGS';

// Scenario type
interface Scenario {
    header: string;      // e.g., "FRIDGE LOCK ENGAGED: Dietary Restriction Violation."
    facts: string[];     // 3-5 bullet points
}
```

**BarkPanel behavior:**
- Two tabs: SYS_MSG (bark) and LOGS (facts)
- SYS_MSG shows current bark with typewriter effect
- LOGS shows scenario header + numbered facts
- Auto-switches to SYS_MSG when new bark arrives
- Decorative corner element (brutalist style)

### Source Docs
- `_process/context/koa-mini-spec.md` - Mini mode spec (barks section)

---

## Acceptance Criteria

### AC-1: Tab Switching ← R6.1
- **Given:** BarkPanel rendered
- **When:** Player taps SYS_MSG or LOGS tab
- **Then:** Panel content switches to selected mode
- **And:** Active tab is visually highlighted
- **Test Type:** component

### AC-2: Bark Display with Typewriter ← R6.1
- **Given:** msgMode is 'BARK', new bark text
- **When:** Bark updates
- **Then:** Text reveals character-by-character via Typewriter
- **And:** onStart/onComplete callbacks fire for avatar sync
- **Test Type:** component

### AC-3: Logs Display ← R6.2
- **Given:** msgMode is 'LOGS'
- **When:** Panel renders
- **Then:** Shows scenario header with Lock icon
- **And:** Shows numbered facts (01, 02, 03...)
- **Test Type:** component

### AC-4: Auto-switch to Bark ← R6.1
- **Given:** msgMode is 'LOGS'
- **When:** New bark arrives (currentBark changes)
- **Then:** Panel auto-switches to 'BARK' mode
- **Test Type:** integration

### AC-5: Styling ← R6.1
- **Given:** BarkPanel rendered
- **When:** Visible
- **Then:** Has white background, border, shadow, decorative corner
- **And:** Tabs have proper active/inactive states
- **Test Type:** visual

---

## Edge Cases

### EC-1: Long Bark Text
- **Scenario:** Bark text is very long
- **Expected:** Text wraps, panel scrolls if needed

### EC-2: Many Facts
- **Scenario:** Scenario has 5 facts
- **Expected:** All facts render, panel scrolls if needed

---

## Error Cases

(None - display-only component)

---

## Scope

**In Scope:**
- BarkPanel container with tabs
- SYS_MSG mode (bark + typewriter)
- LOGS mode (scenario header + facts)
- Tab switching logic
- Auto-switch on bark change

**Out of Scope:**
- Typewriter component (Task 015)
- Avatar sync (parent handles isSpeaking state)
- Scenario data fetching (comes from store)

---

## Implementation Hints

From mockup `KoaMiniPage2.tsx`:

```svelte
<script lang="ts">
    import { Typewriter } from './Typewriter.svelte';
    import { Lock, MessageSquare, FileText } from 'lucide-svelte';

    export let currentBark: string;
    export let scenario: { header: string; facts: string[] };
    export let onSpeechStart: () => void;
    export let onSpeechComplete: () => void;

    let msgMode: 'BARK' | 'LOGS' = 'BARK';

    // Auto-switch to BARK when bark changes
    $: currentBark, msgMode = 'BARK';
</script>

<div class="bg-white border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] rounded-[2px] rounded-bl-none relative flex flex-col">
    <!-- Decorative Corner -->
    <div class="absolute w-2 h-2 border-t border-l border-foreground/20 top-1 left-1"></div>

    <!-- Header: Tabs -->
    <div class="shrink-0 px-1 py-0 border-b bg-muted/5 border-foreground/20 flex items-stretch h-7">
        <button
            on:click={() => msgMode = 'BARK'}
            class="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold uppercase transition-colors
                {msgMode === 'BARK' ? 'bg-white text-primary' : 'text-muted-foreground hover:bg-foreground/5'}">
            <MessageSquare size={10} /> SYS_MSG
        </button>
        <div class="w-[1px] bg-foreground/10"></div>
        <button
            on:click={() => msgMode = 'LOGS'}
            class="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-mono font-bold uppercase transition-colors
                {msgMode === 'LOGS' ? 'bg-white text-primary' : 'text-muted-foreground hover:bg-foreground/5'}">
            <FileText size={10} /> LOGS
        </button>
    </div>

    <!-- Content Body -->
    <div class="flex-1 px-3 py-3 text-sm leading-relaxed text-foreground font-sans overflow-y-auto min-h-[4rem]">
        {#if msgMode === 'BARK'}
            <Typewriter
                text={currentBark}
                speed={30}
                onStart={onSpeechStart}
                onComplete={onSpeechComplete}
            />
        {:else}
            <div class="flex items-center gap-2 mb-3 text-red-500 border-b border-red-100 pb-2">
                <Lock size={12} />
                <span class="text-[10px] font-bold font-mono uppercase">{scenario.header}</span>
            </div>
            <ul class="space-y-2.5">
                {#each scenario.facts as fact, i}
                    <li class="flex gap-2.5 text-[10px] text-foreground/90 leading-snug">
                        <span class="font-mono font-bold text-muted-foreground opacity-50">0{i+1}</span>
                        <span>{fact}</span>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
```

---

## Definition of Done

- [ ] Tab switching works (SYS_MSG ↔ LOGS)
- [ ] Bark displays with typewriter effect
- [ ] Logs show scenario header + numbered facts
- [ ] Auto-switches to BARK on bark update
- [ ] Styling matches mockup (white bg, shadow, corner deco)
- [ ] All tests pass

---

## Log

### Planning Notes
**Context:** BarkPanel replaces ChatHistory from the chat-based layout. Instead of scrolling chat, we show current bark OR facts in a tabbed interface.
**Decisions:** Tabs use SYS_MSG/LOGS terminology for smart home panel theming. Auto-switch ensures player sees new barks.

### Change Log
- 2026-01-29 [Planner] Created for panel layout (KoaMiniPage2)

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-29 | - | backlog | Planner | Created |
