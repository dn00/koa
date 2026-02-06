# Feature: Web UI

**Status:** idea
**Priority:** P0 (required for launch, but large)
**Spec Reference:** Not explicitly specced, but implied throughout

---

## Goal

Port CLI game to web interface. This is required to actually ship the game to players.

---

## Current State

- Full game logic in TypeScript
- CLI interface (game.ts) using readline
- Agent mode outputs JSON for programmatic use
- No web frontend

---

## Scope Options

### Option A: Minimal Viable Web
- Single page app
- Text-based (styled terminal aesthetic)
- Same commands as CLI, typed input
- Mobile-friendly

### Option B: Full UI
- Point-and-click interface
- Visual map of house
- NPC portraits
- Evidence board with drag-and-drop
- Animations

### Option C: Hybrid
- Text adventure core with visual flourishes
- Map as reference (not primary interaction)
- Evidence list with sort/filter
- Compare UI for contradictions

**Recommend Option C** - keeps cozy text adventure feel, adds polish where it helps.

---

## Tech Stack Options

| Stack | Pros | Cons |
|-------|------|------|
| **Next.js** | SSR, API routes, Vercel deploy | Heavier, React overhead |
| **SvelteKit** | Fast, light, good DX | Smaller ecosystem |
| **Astro + Islands** | Static-first, partial hydration | Less interactive |
| **Vanilla + Vite** | Simple, no framework | More manual work |

**Recommendation:** SvelteKit or Next.js depending on preference. Both deploy easily to Vercel.

---

## Core Screens

### 1. Home
- Daily puzzle card
- Archive access
- How to play

### 2. Game
- Command input (or buttons)
- Output log (scrolling)
- Status bar (Day, AP, Leads)
- Quick actions panel

### 3. Evidence Board
- Collected evidence list
- Filter by type/window/person
- Compare mode
- Pin important items

### 4. Accusation
- Form with dropdowns
- WHO, WHAT, WHEN (required)
- HOW, WHY, WHERE (bonus)
- Submit and reveal

### 5. Results
- Score breakdown
- Solution reveal
- Share button
- Play again / Archive

---

## Component Breakdown

```
src/
  components/
    CommandInput.svelte      # Text input or button grid
    OutputLog.svelte         # Scrolling game output
    StatusBar.svelte         # Day, AP, Leads display
    EvidencePanel.svelte     # Sidebar with evidence
    EvidenceCard.svelte      # Single evidence item
    CompareModal.svelte      # Side-by-side comparison
    AccuseForm.svelte        # Final accusation
    ShareCard.svelte         # Result sharing
  routes/
    /                        # Home
    /play                    # Daily game
    /play/[seed]             # Specific seed
    /archive                 # Past puzzles
    /how-to-play             # Tutorial
  lib/
    game-engine.ts           # Import from koa-casefiles
    session-store.ts         # Svelte store for game state
```

---

## Game State Management

```typescript
// Svelte store approach
import { writable } from 'svelte/store';

interface UIGameState {
  session: PlayerSession;
  outputLog: string[];
  pendingCommand: string;
  showEvidence: boolean;
  showCompare: boolean;
  compareItems: [string, string] | null;
}

export const gameState = writable<UIGameState>(initialState);
```

---

## API Routes (if server-side)

```
GET  /api/daily          → Today's seed + bundle
GET  /api/bundle/[seed]  → Specific case bundle
POST /api/validate       → Check accusation (optional, can be client-side)
GET  /api/archive        → List of past dailies
```

For v1, can be fully client-side (seed is enough to regenerate).

---

## Mobile Considerations

- Command input: buttons vs keyboard
- Swipe between panels
- Collapsible evidence sidebar
- Large tap targets

---

## Accessibility

- Keyboard navigation
- Screen reader support for evidence
- High contrast mode
- Reduce motion option

---

## TODO (Rough Order)

### Phase 1: Skeleton
1. [ ] Set up SvelteKit/Next project
2. [ ] Import game engine
3. [ ] Basic command input → output display
4. [ ] Game works in browser (ugly but functional)

### Phase 2: Polish
5. [ ] Status bar component
6. [ ] Evidence panel
7. [ ] Styled output log
8. [ ] Mobile responsive

### Phase 3: Features
9. [ ] Compare modal
10. [ ] Accusation form
11. [ ] Results/share screen
12. [ ] Daily puzzle integration

### Phase 4: Launch
13. [ ] Deploy to Vercel
14. [ ] Custom domain
15. [ ] Analytics
16. [ ] Error tracking

---

## Dependencies

- [x] Game engine works (it does)
- [ ] Solvability guarantee (Feature 001) - don't ship broken puzzles
- [ ] CaseBundle format (Feature 003) - for daily puzzle API
- [ ] Daily seed system (Feature 002) - for daily puzzle

---

## Design Inspiration

- **Wordle** - Clean, simple, shareable
- **Her Story** - Search-based investigation
- **Return of the Obra Dinn** - Deduction UI (but simpler)
- **A Dark Room** - Text adventure with minimal UI
- **Universal Paperclips** - Incremental reveal

---

## Notes

- Don't over-design - text adventure aesthetic is a feature
- Ship ugly v1, polish later
- Mobile-first (most daily puzzle players are on phone)
- Consider: embed in Discord? Slack app?
