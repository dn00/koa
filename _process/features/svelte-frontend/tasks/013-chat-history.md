# Task 013: ChatHistory Component

**Status:** obsolete
**Complexity:** M
**Depends On:** 005, 015
**Implements:** -
**Superseded By:** Task 016 (BarkPanel)

---

## Objective

~~Create the ChatHistory component that displays the conversation between player and KOA as a chat log, with player cards shown as "sent messages" and KOA responses with typewriter effect.~~

**OBSOLETE:** The panel layout (KoaMiniPage2) replaces chat-style UX with a tabbed BarkPanel. See Task 016.

---

## Context

### Relevant Files
- `mockups/mockup-brutalist.zip` → `components/KoaMiniPage.tsx` (lines 342-401) - Reference implementation
- `src/lib/components/Typewriter.svelte` - Typewriter component (Task 015)
- `src/lib/components/EvidenceCard.svelte` - Card component (Task 005)

### Embedded Context

```typescript
// MiniLog type (from stores, Task 002)
interface MiniLog {
    id: string;
    speaker: 'KOA' | 'PLAYER';
    text?: string;           // KOA messages
    card?: MiniCard;         // Player messages (card they played)
    timestamp: Date;
}

// From mockup - chat container styling
// - mask-image: linear-gradient for smooth top scroll
// - scrollbar-hide class
// - auto-scroll with shouldAutoScrollRef pattern
```

**Z-layer pattern from mockup:**
- Chat container: z-10
- Scroll button: z-20
- Dim layer (when popup active): z-40

**Key UX patterns:**
1. Chat is chronological (oldest at top, newest at bottom)
2. Auto-scroll to bottom on new message (if already at bottom)
3. "Scroll to bottom" button appears when scrolled up
4. Typewriter effect only on LATEST KOA message
5. Previous messages render instantly

### Source Docs
- `_process/context/koa-mini-components.md` - Component spec

---

## Acceptance Criteria

### AC-1: KOA Message Bubble ← R6.2
- **Given:** A MiniLog with speaker='KOA' and text
- **When:** Rendered in ChatHistory
- **Then:** Shows left-aligned white bubble with:
  - "KOA" label header
  - Corner decoration (top-left)
  - Text content (typewriter if latest, instant if not)

### AC-2: Player Message Bubble ← R6.3
- **Given:** A MiniLog with speaker='PLAYER' and card
- **When:** Rendered in ChatHistory
- **Then:** Shows right-aligned bubble with:
  - "YOU SENT: {card.id}" header
  - EvidenceCard in "details" variant embedded
  - Shadow styling (shadow-brutal)

### AC-3: Chronological Order ← R6.1
- **Given:** Multiple MiniLog entries
- **When:** Rendered in ChatHistory
- **Then:** Oldest message at top, newest at bottom

### AC-4: Auto-scroll Behavior ← R6.4
- **Given:** User is at bottom of chat
- **When:** New message is added
- **Then:** Chat scrolls to show new message

### AC-5: Scroll Button ← R6.4
- **Given:** User scrolls up (not at bottom)
- **When:** Chat is not at bottom
- **Then:** "Scroll to bottom" button appears
- **And:** Clicking button scrolls to bottom

---

## Edge Cases

### EC-1: Empty Chat
- **Scenario:** No messages in chatLogs
- **Expected:** Empty container, no errors

### EC-2: Only KOA Messages
- **Scenario:** Multiple KOA messages, no player messages
- **Expected:** All render correctly as left-aligned bubbles

---

## Error Cases

(None - display-only component)

---

## Scope

**In Scope:**
- ChatHistory container with scroll behavior
- KOA message bubble styling
- Player message bubble with card embed
- Auto-scroll logic (shouldAutoScroll pattern)
- Scroll-to-bottom button

**Out of Scope:**
- Typewriter component (Task 015)
- EvidenceCard component (Task 005)
- Adding messages to store (handled by Run Screen)
- Avatar sync (handled by parent)

---

## Implementation Hints

From mockup `KoaMiniPage.tsx`:

```typescript
// Auto-scroll pattern
const shouldAutoScrollRef = useRef(true);

const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowScrollButton(!isNearBottom);
    shouldAutoScrollRef.current = isNearBottom;
};

// Only typewriter on latest message
{log === chatLogs[chatLogs.length - 1] ? (
    <Typewriter text={log.text} ... />
) : (
    <span>{log.text}</span>
)}
```

Styling from mockup:
```css
/* Smooth scroll mask at top */
mask-image: linear-gradient(to bottom, transparent 0%, black 32px);

/* KOA bubble */
.koa-bubble {
    max-width: 85%;
    background: white;
    border: 1px solid var(--foreground);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
    border-radius: 2px;
    border-bottom-left-radius: 0;
}

/* Player bubble */
.player-bubble {
    max-width: 85%;
    background: var(--surface);
    border: 1px solid var(--foreground);
    box-shadow: var(--shadow-brutal);
    border-radius: 2px;
    border-bottom-right-radius: 0;
}
```

---

## Log

### Planning Notes
**Context:** Core mockup feature - the chat-style interaction is what makes KOA Mini feel like a conversation with the AI rather than a sterile puzzle game.
**Decisions:** Using chronological order (not reversed) with auto-scroll, per mockup implementation and UX discussion.
