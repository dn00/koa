# Task 901: Wire Complete v1 Lite Game Flow

**Status:** backlog
**Complexity:** L
**Depends On:** 501, 502, 701, 702, 703, 301, 302
**Implements:** R9.1

---

## Objective

Wire together all v1 Lite components into the complete game flow: T1 -> T2 -> Suspicion -> T3 -> Final Audit -> Result. Ensure state flows correctly and animations sequence properly.

---

## Context

### Relevant Files
- `packages/app-svelte/src/lib/stores/game.ts` — game store with concern state
- `packages/app-svelte/src/lib/components/GameScreen.svelte` — main game screen
- `packages/app-svelte/src/lib/components/BarkPanel.svelte` — bark display
- `packages/app-svelte/src/lib/components/FinalAuditPanel.svelte` — Final Audit (Task 702)
- `packages/app-svelte/src/lib/components/ResultScreen.svelte` — Result (Task 703)

### Embedded Context

**Complete game flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│  GAME START                                                     │
│    ↓                                                            │
│  T1: Player selects card                                        │
│    → submitCard(card)                                           │
│    → Sequence bark plays                                        │
│    ↓                                                            │
│  T2: Player selects card                                        │
│    → submitCard(card)                                           │
│    → computeConcern([card1, card2])                             │
│    → Sequence bark plays                                        │
│    → triggerSuspicion(concern)                                  │
│    → Suspicion line + subtitle display                          │
│    ↓                                                            │
│  T3: Player selects card                                        │
│    → submitCard(card)                                           │
│    → computeConcernResult(concern, [card1, card2, card3])       │
│    → Closing bark plays (storyCompletions)                      │
│    ↓                                                            │
│  FINAL AUDIT                                                    │
│    → axisResults already computed in store (Task 501)           │
│    → Show FinalAuditPanel                                       │
│    → Animate coverage, independence, concern lines              │
│    ↓                                                            │
│  RESULT                                                         │
│    → getMiniLiteTier(input) for outcome (Task 302)              │
│    → Show ResultScreen                                          │
│    → Show ceiling explanation if CLEARED (use store.ceilingBlocker) │
└─────────────────────────────────────────────────────────────────┘
```

**State machine transitions:**

**IMPORTANT:** These internal phases are SEPARATE from the high-level `GamePhase` enum in `game.ts`.
- **High-level GamePhase:** 'READING' | 'PICKING' | 'RESULT' | 'SHARE' (store-level, user-facing)
- **Internal animation phases:** Used for sequencing animations within PICKING/RESULT (component-level)

```typescript
// Internal animation phase (component-local, not in store)
type AnimationPhase =
  | 'selecting'      // Player choosing a card
  | 'submitting'     // Card submission in progress
  | 'bark_playing'   // Sequence/suspicion bark animating
  | 'audit'          // Final Audit panel showing
  | 'transitioning'; // Moving to Result

interface GameState {
  phase: GamePhase;
  turn: 1 | 2 | 3;
  selectedCards: Card[];
  concern: Concern | null;
  concernResult: 'hit' | 'avoided' | null;
  suspicionText: SuspicionText | null;
  axisResults: AxisResults | null;
  outcome: Outcome | null;
}
```

**Coordination points:**
1. After T2 bark completes → show suspicion
2. After suspicion shown → enable T3 selection
3. After T3 bark completes → show Final Audit
4. After Final Audit animation → show Result

**Animation timing (approximate):**
- Sequence bark: ~1.5s
- Suspicion reveal: ~0.8s
- Final Audit line reveal: ~0.3s each, ~1.5s total
- Transition to Result: ~0.5s

---

## Acceptance Criteria

### AC-1: T2 triggers concern computation <- R9.1
- **Given:** Player submits T2 card
- **When:** submitCard completes
- **Then:** concern is computed and stored

### AC-2: Suspicion appears after T2 bark <- R9.1
- **Given:** T2 sequence bark playing
- **When:** Bark animation completes
- **Then:** Suspicion line and subtitle appear

### AC-3: T3 triggers concern result <- R9.1
- **Given:** Player submits T3 card
- **When:** submitCard completes
- **Then:** concernResult is 'hit' or 'avoided'

### AC-4: Final Audit appears after T3 <- R9.1
- **Given:** T3 closing bark playing
- **When:** Bark animation completes
- **Then:** FinalAuditPanel appears

### AC-5: Result appears after Final Audit <- R9.1
- **Given:** Final Audit animation playing
- **When:** All three lines revealed
- **Then:** ResultScreen appears

### AC-6: Ceiling explanation shown when applicable <- R9.1
- **Given:** Outcome is CLEARED, ceilingBlocker exists
- **When:** ResultScreen renders
- **Then:** Ceiling explanation displayed

---

## Edge Cases

### EC-1: Fast player skipping
- **Scenario:** Player taps rapidly
- **Expected:** Animations still play, can't skip critical displays

### EC-2: no_concern flow
- **Scenario:** No concern triggered on T2
- **Expected:** Still shows "mixing sources" suspicion, flow continues

### EC-3: FLAWLESS outcome
- **Scenario:** Player gets everything right
- **Expected:** No ceiling explanation on Result

### EC-4: BUSTED outcome
- **Scenario:** Player told 2+ lies
- **Expected:** Final Audit still shows, Result shows BUSTED

### EC-5: Objection/Flag mechanics (N/A)
- **Scenario:** Engine has objection/flag logic from Advanced mode
- **Expected:** Skip entirely OR auto-resolve silently. Never surface to player.
- **Rationale:** See spec §1.5 — Concern bark is sole T2 tension in Mini Lite

---

## Error Cases

### ERR-1: State desync
- **When:** Phase doesn't match expected turn
- **Then:** Log warning, attempt recovery
- **Error Message:** "Unexpected phase {phase} at turn {turn}"

### ERR-2: Missing concern at T3
- **When:** concernResult computed but concern is null
- **Then:** Error state
- **Error Message:** "Cannot compute concernResult without concern"

---

## Scope

**In Scope:**
- Wire state machine transitions
- Coordinate animation timing
- Connect store to UI components
- Handle all phase transitions
- Error recovery for edge cases

**Out of Scope:**
- Individual component implementation (Tasks 701, 702, 703)
- Store state implementation (Tasks 501, 502)
- Tiering logic (Tasks 301, 302)

---

## Implementation Hints

1. Use Svelte reactive statements to trigger phase transitions
2. Use event dispatching for animation completion
3. Consider using stores for animation state
4. Test each transition point individually
5. Add logging for debugging state transitions
6. Consider a debug mode that shows current phase
7. **No objection/flag in Mini Lite** — if engine has these mechanics, either:
   - Skip the objection check entirely for Mini mode
   - OR auto-resolve silently (never show UI, never block flow)
   - The Concern bark (suspicion line) provides all P4 tension needed

---

## Log

### Planning Notes
**Context:** Integration of all v1 Lite components
**Decisions:** State machine approach for clarity
