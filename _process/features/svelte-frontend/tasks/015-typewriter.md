# Task 015: Typewriter Component

**Status:** backlog
**Complexity:** S
**Depends On:** 001
**Implements:** R12.1, R12.2, R12.3

---

## Objective

Create a Typewriter component that reveals text character-by-character with configurable speed and callbacks for syncing with KOA avatar state.

---

## Context

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/Typewriter.tsx` - Reference implementation

### Embedded Context

```typescript
// Props interface
interface TypewriterProps {
    text: string;
    speed?: number;        // ms per character (default: 20)
    onStart?: () => void;  // Called when typing starts
    onComplete?: () => void; // Called when typing finishes
}
```

**Integration with BarkPanel (Task 016):**
- BarkPanel shows current bark with Typewriter in SYS_MSG tab
- onStart sets avatar to "speaking" state
- onComplete clears "speaking" state

### Source Docs
- `_process/context/koa-mini-components.md` - Component spec

---

## Acceptance Criteria

### AC-1: Character Reveal ← R12.1
- **Given:** text="Hello World", speed=50
- **When:** Typewriter mounts
- **Then:** Characters appear one at a time, 50ms apart
- **And:** Full text visible after (11 chars × 50ms) = 550ms

### AC-2: onStart Callback ← R12.2
- **Given:** onStart callback provided
- **When:** Typewriter starts revealing
- **Then:** onStart is called once at the beginning

### AC-3: onComplete Callback ← R12.2
- **Given:** onComplete callback provided
- **When:** All characters are revealed
- **Then:** onComplete is called once

### AC-4: Configurable Speed ← R12.3
- **Given:** speed=100
- **When:** Typewriter reveals text
- **Then:** Each character appears 100ms after previous

---

## Edge Cases

### EC-1: Empty Text
- **Scenario:** text=""
- **Expected:** onStart and onComplete still fire, nothing renders

### EC-2: Text Changes Mid-Typing
- **Scenario:** text prop changes before typing completes
- **Expected:** Restart with new text (clear interval, reset index)

---

## Error Cases

(None - display-only component)

---

## Scope

**In Scope:**
- Typewriter component
- Speed configuration
- onStart/onComplete callbacks
- Cleanup on unmount

**Out of Scope:**
- Cursor animation (optional enhancement)
- Sound effects (Task 009 if needed)

---

## Implementation Hints

From mockup `Typewriter.tsx`:

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    export let text: string;
    export let speed: number = 20;
    export let onStart: (() => void) | undefined = undefined;
    export let onComplete: (() => void) | undefined = undefined;

    let displayedText = '';
    let index = 0;
    let interval: ReturnType<typeof setInterval> | null = null;

    function startTyping() {
        onStart?.();
        interval = setInterval(() => {
            if (index < text.length) {
                displayedText = text.slice(0, index + 1);
                index++;
            } else {
                clearInterval(interval!);
                interval = null;
                onComplete?.();
            }
        }, speed);
    }

    onMount(() => {
        startTyping();
    });

    onDestroy(() => {
        if (interval) clearInterval(interval);
    });

    // Handle text changes
    $: if (text) {
        if (interval) clearInterval(interval);
        displayedText = '';
        index = 0;
        startTyping();
    }
</script>

<span>{displayedText}</span>
```

**Performance note:** Use `setInterval` for simplicity. For very long texts, could batch characters, but KOA barks are short (1-2 sentences).

---

## Log

### Planning Notes
**Context:** Typewriter effect creates the "KOA is speaking" beat that makes the chat feel alive. Critical for the conversation rhythm.
**Decisions:** Simple implementation with callbacks. No cursor for now - can add later if desired.
