# RIVET Kernel - Gaps & Future Improvements

This document tracks known limitations and potential improvements to the kernel. Use this when deciding whether to extend the kernel for your game.

---

## Major Gaps

### 1. No Scheduled Events

**Problem:** No first-class "fire event at tick N" mechanism. Games hack this with components tracking `triggerAtTick`.

**Current workaround:**
```typescript
// In component
interface TimedTrap {
  triggerAtTick: number;
  effect: 'explode' | 'close_door';
}

// In system - must check every tick
if (trap.triggerAtTick === state.tick) {
  ctx.proposeEvent('TRAP_TRIGGERED', { trapId });
}
```

**Better solution:** A `SchedulerRegistry` that systems can schedule into:
```typescript
// Proposed API
ctx.scheduleEvent(atTick: 1250, type: 'TRAP_TRIGGERED', payload: { trapId });

// Kernel automatically fires when tick reached
```

---

### 2. No Entity Queries

**Problem:** Only `getEntitiesByType()` exists. No spatial queries, no component queries. Large simulations suffer.

**Current workaround:**
```typescript
// Find all entities within range - O(n) every time
const nearby = ctx.getEntitiesByType('npc').filter(npc => {
  const pos = npc.components.position as Vec2;
  return manhattanDistance(pos, target) <= range;
});
```

**Better solution:** Spatial indexing and component queries:
```typescript
// Proposed API
ctx.getEntitiesInRadius(center: Vec2, radius: number): Entity[]
ctx.getEntitiesWithComponents(['VisionComponent', 'AIComponent']): Entity[]
ctx.getEntitiesInRect(topLeft: Vec2, bottomRight: Vec2): Entity[]
```

**Implementation notes:**
- Spatial hash grid for position queries
- Component bitmap index for component queries
- Rebuild indexes at start of tick (after reducers mutate)

---

### 3. No Snapshot/Rewind

**Problem:** Hash chain enables verification, but rewinding to tick N requires full replay from tick 0. Expensive for long games.

**Current workaround:**
```typescript
// Replay from beginning
let state = initialState;
for (const event of eventLog) {
  state = applyEvent(state, event);
  if (state.tick === targetTick) break;
}
```

**Better solution:** Periodic snapshots:
```typescript
// Proposed API
interface Snapshot {
  tick: number;
  state: WorldState;
  hash: string;
}

kernel.createSnapshot(): Snapshot
kernel.restoreFromSnapshot(snapshot: Snapshot): void
kernel.rewindToTick(tick: number): void  // Uses nearest snapshot + replay
```

**Implementation notes:**
- Snapshot every N ticks (configurable, e.g., every 100)
- Store snapshots in memory or persist to disk
- Trade-off: memory vs replay speed

---

### 4. Flat FSMs Only

**Problem:** The state machine pattern doesn't support hierarchical states. Complex behaviors need nesting.

**Example need:**
```
GUARD
├── PATROL
│   ├── WALKING
│   ├── WAITING (at waypoint)
│   └── TURNING
├── INVESTIGATE
│   ├── TRAVELING
│   └── SEARCHING
└── PURSUE
    ├── CHASING
    └── ATTACKING
```

**Current workaround:** Flatten into many states (`PATROL_WALKING`, `PATROL_WAITING`, etc.) or use multiple FSM components.

**Better solution:** Hierarchical state machine (HSM/Statechart):
```typescript
// Proposed API
interface HSMState {
  id: string;
  parent?: string;
  children?: HSMState[];
  onEnter?: () => void;
  onExit?: () => void;
  onTick?: () => void;
}

// Transitions can target any level
// Exiting a parent exits all children
// Entering a parent enters default child
```

---

### 5. No "What-If" Forking

**Problem:** Can't cheaply branch state to explore hypotheticals. Useful for AI planning or player foresight preview.

**Current workaround:**
```typescript
// Deep clone entire state (expensive)
const hypothetical = structuredClone(state);
// Run simulation on clone
// Discard when done
```

**Better solution:** Copy-on-write state or explicit fork API:
```typescript
// Proposed API
const fork = kernel.fork();  // Cheap snapshot
fork.step(playerAction);     // Simulate
fork.step(playerAction);     // Continue
const preview = fork.getState();
fork.discard();              // Clean up
// Original kernel unchanged
```

**Implementation notes:**
- Structural sharing (immutable state) makes this cheap
- Or: checkpoint + replay (use snapshot system)

---

### 6. No Event Subscriptions

**Problem:** Systems/reducers see all events. No way to filter. Inefficient for large event volumes.

**Current workaround:**
```typescript
// Every reducer checks event type
function movementReducer(state, event) {
  if (event.type !== 'ENTITY_MOVED') return state;
  // ... handle
}
```

**Better solution:** Declare subscriptions at registration:
```typescript
// Proposed API
reducerRegistry.register({
  reducerId: 'movement',
  subscribesTo: ['ENTITY_MOVED', 'ENTITY_TELEPORTED'],
  reduce: (state, event) => { /* only receives subscribed events */ }
});
```

**Implementation notes:**
- Build event-type -> reducer[] map at registration
- Dispatch only to interested reducers
- Reduces iteration for large reducer counts

---

### 7. No Relationship Graph

**Problem:** Entity relationships (knows, owns, guards, trusts) are ad-hoc in components. No graph queries.

**Current workaround:**
```typescript
// Stored in components
interface SocialComponent {
  relationships: Record<EntityId, {
    type: 'knows' | 'trusts' | 'hates';
    strength: number;
  }>;
}

// Query requires manual traversal
function getFriends(entityId: EntityId, state: WorldState): EntityId[] {
  const entity = state.entities.get(entityId);
  const social = entity.components.social as SocialComponent;
  return Object.entries(social.relationships)
    .filter(([_, rel]) => rel.type === 'trusts' && rel.strength > 50)
    .map(([id, _]) => id);
}
```

**Better solution:** First-class relationship graph:
```typescript
// Proposed API
interface RelationshipGraph {
  addEdge(from: EntityId, to: EntityId, type: string, data?: object): void;
  removeEdge(from: EntityId, to: EntityId, type: string): void;
  getEdges(from: EntityId, type?: string): Edge[];
  getIncoming(to: EntityId, type?: string): Edge[];
  query(pattern: GraphPattern): Edge[];  // e.g., "A trusts B, B knows C"
}

// Stored in state, mutated by reducers
state.relationships.addEdge(npc1, npc2, 'trusts', { strength: 75 });
```

---

## Minor Gaps

### No Built-in Save/Load Format

**Problem:** State is JSON-serializable but no formal save format with versioning, compression, or validation.

**Suggestion:**
```typescript
interface SaveFile {
  version: string;
  gameId: string;
  timestamp: number;
  state: WorldState;
  eventLog?: SimEvent[];  // Optional, for replay
  checksum: string;
}
```

### No Undo for Player Commands

**Problem:** Event sourcing enables undo, but it's not implemented.

**Suggestion:**
```typescript
// Track command boundaries
kernel.beginCommand();
kernel.step(action);
kernel.step(action);
kernel.endCommand();

// Undo reverts to state before beginCommand()
kernel.undo();
```

### Sequential System Execution Only

**Problem:** Systems run sequentially. Large simulations could benefit from parallel execution.

**Considerations:**
- Systems that read-only could run in parallel
- Systems that propose events need ordering
- Determinism requires consistent ordering across runs
- Likely not worth complexity for most games

---

## Implementation Priority

If extending the kernel, suggested order:

1. **Scheduled events** - High value, moderate effort
2. **Spatial queries** - High value for grid games, moderate effort
3. **Snapshots** - High value for long games, moderate effort
4. **Event subscriptions** - Low effort, minor optimization
5. **What-if forking** - High value for AI/preview, depends on state architecture
6. **Relationship graph** - High value for social games, moderate effort
7. **Hierarchical FSM** - Moderate value, can workaround with flat FSMs

---

## Contributing

If you implement any of these improvements, consider contributing back to RIVET. Keep implementations:
- Deterministic (no Date.now(), no Math.random())
- Serializable (no functions in state, no circular refs)
- Tested (same seed = same result)
