# Task 001: Update ARCHITECTURE.md

**Status:** backlog
**Complexity:** S
**Depends On:** none (but run after app-v5-migration complete)
**Implements:** R1, R2

---

## Objective

Update ARCHITECTURE.md to reflect V5 domain model instead of MVP.

---

## Sections to Update

### Domain Layer Description (around line 111-114)

**Current (MVP):**
```markdown
**Domain (engine-core)** - Pure game logic
- Types: EvidenceCard, Concern, Counter, etc.
- Resolver: damage, contradictions, concerns
- Validators: pack validation, state validation
```

**Update to (V5):**
```markdown
**Domain (engine-core)** - Pure game logic
- Types: Card, V5Puzzle, GameState, Tier
- Resolver: scoring, objection, tier calculation
- Packs: validation, builtin loader
```

### Monorepo Structure (around line 37-63)

**Update the directory tree:**
```
├── engine-core/
│   ├── src/
│   │   ├── types/v5/      # V5 domain types (Card, GameState, etc.)
│   │   ├── resolver/v5/   # V5 game logic (scoring, objection, tier)
│   │   ├── packs/         # Pack system (validation, builtin)
│   │   └── index.ts       # Barrel export
```

### Data Flow - Per-Turn Flow (around line 120-144)

**Update for V5 flow:**
```
1. Player selects 1 card
        ↓
2. UI calls store.playCard(cardId)
        ↓
3. Store appends CARD_PLAYED event
        ↓
4. deriveV5State() replays events using engine.playCard()
        ↓
5. Engine returns TurnResult (belief change, wasLie, narration)
        ↓
6. After turn 2: objection prompt (stand/withdraw)
        ↓
7. After turn 3: getVerdict() returns Tier
        ↓
8. UI renders result (<120ms total)
```

### State Management (around line 179-221)

**Update event types:**
```typescript
// V5 Event types
type V5Event =
  | { type: 'GAME_STARTED'; puzzleSlug: string; seed: number; ... }
  | { type: 'CARD_PLAYED'; cardId: string; timestamp: number }
  | { type: 'OBJECTION_RESOLVED'; choice: 'stood_by' | 'withdrawn'; ... };

// State derived by replaying events through V5 engine
function deriveV5State(events: V5Event[]): GameState {
  // Uses createGameState(), playCard(), resolveObjectionState()
}
```

### Key Modules Table (around line 164-176)

**Update:**
```markdown
| Module | Package | Responsibility |
|--------|---------|----------------|
| `types/v5/` | engine-core | Card, GameState, V5Puzzle, Tier |
| `resolver/v5/` | engine-core | Scoring, objection, tier, engine |
| `packs/` | engine-core | Pack validation, builtin loader |
| `stores/` | app | Zustand with V5Event sourcing |
```

---

## Definition of Done

- [ ] All MVP references replaced with V5 equivalents
- [ ] Data flow diagram reflects V5 mechanics
- [ ] No mentions of: Concern, Scrutiny, Counter, resistance, damage
- [ ] Document is internally consistent

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-28 | - | backlog | Planner | Created |
