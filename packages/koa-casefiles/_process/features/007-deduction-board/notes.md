# Feature: Deduction Board

**Status:** idea
**Priority:** P2
**Spec Reference:** Section 6.2.E

---

## Goal

Visual workspace where players organize evidence, pin clues, and draw connections. The "detective's corkboard" experience.

---

## Current State

- Evidence is a flat list
- COMPARE command finds contradictions
- No spatial organization
- No way to "pin" or annotate

---

## Spec Description

> Players can pin evidence to a board, draw connections between items, and annotate their theories.

---

## Core Interactions

### 1. Pin Evidence
Drag evidence card to board, or click "Pin" button.
```
┌─────────────────────────────────────────┐
│  🔖 Pinned Evidence                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Alice   │──│ Door    │  │ Carol   │ │
│  │ W3 kit  │  │ W3 log  │  │ motive  │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│       │            │                    │
│       └────────────┘                    │
│         "CONFLICT"                      │
└─────────────────────────────────────────┘
```

### 2. Draw Connections
Click two pinned items to link them.
- Solid line: "These are related"
- Red line: "These contradict"
- Dashed line: "I'm not sure"

### 3. Annotate
Click pinned item to add note.
```typescript
interface PinnedEvidence {
  evidenceId: string;
  position: { x: number; y: number };
  note?: string;
  color?: 'red' | 'yellow' | 'green';
}
```

### 4. Group/Cluster
Drag items together to form groups.
- "Alice's timeline"
- "Suspicious activity"
- "Confirmed alibis"

---

## Data Model

```typescript
interface DeductionBoard {
  pins: PinnedEvidence[];
  connections: Connection[];
  groups: Group[];
}

interface PinnedEvidence {
  id: string;
  evidenceId: string;
  position: { x: number; y: number };
  note?: string;
  color?: string;
}

interface Connection {
  from: string;  // pin ID
  to: string;    // pin ID
  type: 'related' | 'contradicts' | 'uncertain';
  note?: string;
}

interface Group {
  id: string;
  name: string;
  pinIds: string[];
  color: string;
}
```

---

## UI Components

### Desktop
- Large canvas area
- Drag-and-drop pins
- Click-to-connect
- Zoom/pan for large boards

### Mobile
- Simplified list view with connection indicators
- Or: horizontal scroll board
- Tap-to-select, tap-again-to-connect

---

## Integration with COMPARE

When player draws "contradicts" line:
```
1. Highlight the two evidence items
2. Run findContradictions() to verify
3. If actual contradiction: "Yes! These conflict."
4. If not contradiction: "Hmm, these don't seem to conflict directly."
```

This teaches players what contradictions look like.

---

## Auto-Suggestions

Board could suggest connections:
```
💡 "Alice claims kitchen in W3, but door log shows her in garage. COMPARE these?"
```

Only show after player has collected both pieces. Don't spoil discovery.

---

## Persistence

Board state should persist:
- Per-session storage (localStorage)
- Optional: save to account if logged in
- Export board as image for sharing

---

## Visual Design

### Style A: Corkboard
- Brown cork texture background
- Pins with pushpin icons
- Red string between connected items
- Sticky note annotations

### Style B: Minimal
- Clean white/gray background
- Cards with subtle shadows
- Colored lines for connections
- Chip-style annotations

### Style C: Detective Noir
- Dark background
- Yellow evidence cards
- Chalk-style connections
- Typewriter font notes

**Recommend Style B for accessibility**, with Style A as optional theme.

---

## TODO

1. [ ] Design data model (above)
2. [ ] Build canvas component (or use library)
3. [ ] Implement pin drag-and-drop
4. [ ] Implement connection drawing
5. [ ] Integrate with evidence panel
6. [ ] Add annotation input
7. [ ] Persist to localStorage
8. [ ] Mobile-friendly alternative

---

## Dependencies

- [ ] Web UI (Feature 006) - need frontend first
- [ ] Evidence panel implemented

---

## Libraries to Consider

- **react-flow** / **svelte-flow** - Node-based canvas
- **fabric.js** - General canvas manipulation
- **excalidraw** - Whiteboard-style (might be overkill)
- **Custom SVG** - Simpler, more control

---

## Notes

- This is nice-to-have, not critical for v1
- Text-based COMPARE works fine without visual board
- But visual board is very satisfying when it works
- Could be a "pro" feature if monetizing
- Consider: auto-generate board from COMPARE history?
