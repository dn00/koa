# Patterns

**Last Updated:** 2026-01-26
**Status:** Active

---

## File Structure

### Monorepo Layout

```
packages/
├── engine-core/
│   ├── src/
│   │   ├── types/           # Domain types
│   │   │   ├── evidence.ts
│   │   │   ├── concern.ts
│   │   │   ├── counter.ts
│   │   │   ├── puzzle.ts
│   │   │   ├── events.ts
│   │   │   └── index.ts     # Barrel export
│   │   ├── resolver/        # Game logic
│   │   │   ├── damage.ts
│   │   │   ├── contradiction.ts
│   │   │   ├── concern.ts
│   │   │   ├── corroboration.ts
│   │   │   └── index.ts
│   │   ├── validation/      # Validators
│   │   │   ├── pack.ts
│   │   │   ├── state.ts
│   │   │   └── index.ts
│   │   └── index.ts         # Package entry
│   └── tests/
│       ├── resolver/
│       └── fixtures/
│
└── app/
    ├── src/
    │   ├── screens/         # Page components
    │   │   ├── home/
    │   │   ├── run/
    │   │   └── results/
    │   ├── components/      # Reusable UI
    │   │   ├── hud/
    │   │   ├── cards/
    │   │   └── koa/
    │   ├── stores/          # Zustand stores
    │   │   ├── game.ts
    │   │   └── settings.ts
    │   ├── services/        # Side effects
    │   │   ├── pack-loader.ts
    │   │   └── persistence.ts
    │   └── main.tsx
    └── tests/
```

---

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `pack-loader/`, `engine-core/` |
| TypeScript files | kebab-case | `evidence-card.ts`, `damage.ts` |
| React components | kebab-case file, PascalCase export | `evidence-card.tsx` → `EvidenceCard` |
| Test files | `*.test.ts` | `damage.test.ts` |
| Index files | `index.ts` | Barrel exports |

### Code

| Type | Convention | Example |
|------|------------|---------|
| Functions | camelCase | `calculateDamage()`, `validatePack()` |
| Types/Interfaces | PascalCase | `EvidenceCard`, `RunState` |
| Enums | PascalCase, UPPER_SNAKE values | `ProofType.IDENTITY` |
| Constants | UPPER_SNAKE_CASE | `MAX_SCRUTINY`, `DEFAULT_TURNS` |
| Type parameters | Single uppercase | `T`, `E` |

---

## TypeScript Patterns

### Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### No `any`

```typescript
// BAD
function process(data: any) { ... }

// GOOD
function process(data: unknown) { ... }
function process<T extends BaseType>(data: T) { ... }
```

### Discriminated Unions

```typescript
// Event types use discriminated unions
type GameEvent =
  | { type: 'RUN_STARTED'; payload: RunStartedPayload }
  | { type: 'MOVE_RESOLVED'; payload: MoveResolvedPayload }
  | { type: 'RUN_ENDED'; payload: RunEndedPayload };

// Exhaustive switch
function handleEvent(event: GameEvent) {
  switch (event.type) {
    case 'RUN_STARTED':
      return handleRunStarted(event.payload);
    case 'MOVE_RESOLVED':
      return handleMoveResolved(event.payload);
    case 'RUN_ENDED':
      return handleRunEnded(event.payload);
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustive: never = event;
      throw new Error(`Unhandled event: ${_exhaustive}`);
  }
}
```

---

## Error Handling

### Result Types

```typescript
// Use Result type for operations that can fail
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Usage
function validatePack(pack: unknown): Result<Pack, ValidationError> {
  // ...
  if (valid) {
    return { ok: true, value: pack };
  } else {
    return { ok: false, error: new ValidationError(message) };
  }
}

// Consuming
const result = validatePack(data);
if (!result.ok) {
  console.error(result.error.message);
  return;
}
// result.value is now typed as Pack
```

### Fail-Closed

```typescript
// Invalid state → clear error, don't proceed
function loadPack(packId: string): Result<Pack, PackError> {
  const cached = cache.get(packId);
  if (!cached) {
    return { ok: false, error: new PackError('Pack not cached') };
  }

  const validated = validatePack(cached);
  if (!validated.ok) {
    // Don't use invalid pack, return error
    return { ok: false, error: validated.error };
  }

  return { ok: true, value: validated.value };
}
```

### No Silent Failures

```typescript
// BAD - silent failure
function getCard(id: string): Card | undefined {
  return cards.find(c => c.id === id);
}

// GOOD - explicit handling required
function getCard(id: string): Result<Card, NotFoundError> {
  const card = cards.find(c => c.id === id);
  if (!card) {
    return { ok: false, error: new NotFoundError(`Card ${id} not found`) };
  }
  return { ok: true, value: card };
}
```

---

## Testing Patterns

### Given/When/Then Structure

```typescript
describe('calculateDamage', () => {
  it('applies 50% contested penalty when counter targets card', () => {
    // Given
    const card: EvidenceCard = {
      id: 'card1',
      power: 10,
      proves: ['IDENTITY'],
      claims: { location: 'HOME' }
    };
    const counter: CounterEvidence = {
      id: 'counter1',
      targets: ['IDENTITY'],
      refuted: false
    };

    // When
    const damage = calculateDamage([card], counter);

    // Then
    expect(damage).toBe(5); // 10 * 0.5 = 5
  });
});
```

### Deterministic Fixtures

```typescript
// tests/fixtures/contradiction.ts
export const contradictionFixtures = [
  {
    name: 'ASLEEP to AWAKE in <3min is MAJOR',
    card1: { claims: { state: 'ASLEEP', timeRange: ['2:00am', '2:05am'] } },
    card2: { claims: { state: 'AWAKE', timeRange: ['2:02am', '2:10am'] } },
    expectedSeverity: 'MAJOR'
  },
  // ...more fixtures
];

// tests/resolver/contradiction.test.ts
describe('contradiction detection', () => {
  contradictionFixtures.forEach(fixture => {
    it(fixture.name, () => {
      const severity = detectContradiction(fixture.card1, fixture.card2);
      expect(severity).toBe(fixture.expectedSeverity);
    });
  });
});
```

### No Mocks for Core Logic

```typescript
// BAD - mocking resolver internals
jest.mock('../resolver/damage');

// GOOD - test through public interface with real implementation
const result = resolver.resolve(state, action);
expect(result.damage).toBe(expectedDamage);
```

---

## State Patterns

### Zustand Store Structure

```typescript
// stores/game.ts
import { create } from 'zustand';
import { deriveState } from '@aura/engine-core';

interface GameStore {
  // Event log (source of truth)
  events: GameEvent[];

  // Derived state (computed from events)
  runState: RunState | null;

  // Actions
  appendEvent: (event: GameEvent) => void;
  startRun: (dailyId: string) => Promise<void>;
  submitCards: (cardIds: string[]) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  events: [],
  runState: null,

  appendEvent: (event) => {
    set(state => {
      const events = [...state.events, event];
      return {
        events,
        runState: deriveState(events)
      };
    });
  },

  // ...actions
}));
```

### Derived Selectors

```typescript
// Derived values as selectors, not stored state
const selectResistance = (state: GameStore) =>
  state.runState?.puzzle.resistance ?? 0;

const selectConcernsAddressed = (state: GameStore) =>
  state.runState?.puzzle.concerns.filter(c => c.addressed) ?? [];

// Usage in component
function HUD() {
  const resistance = useGameStore(selectResistance);
  const addressed = useGameStore(selectConcernsAddressed);
  // ...
}
```

---

## Import Conventions

### Barrel Exports

```typescript
// packages/engine-core/src/types/index.ts
export * from './evidence';
export * from './concern';
export * from './counter';
export * from './puzzle';
export * from './events';

// Consumer
import { EvidenceCard, Concern, CounterEvidence } from '@aura/engine-core';
```

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@aura/engine-core": ["./packages/engine-core/src"],
      "@/components/*": ["./packages/app/src/components/*"],
      "@/stores/*": ["./packages/app/src/stores/*"],
      "@/services/*": ["./packages/app/src/services/*"]
    }
  }
}
```

### Import Order

```typescript
// 1. External packages
import { create } from 'zustand';
import React from 'react';

// 2. Internal packages
import { calculateDamage, EvidenceCard } from '@aura/engine-core';

// 3. Relative imports
import { HUD } from './components/hud';
import { useGameStore } from '../stores/game';

// 4. Types (if separate)
import type { RunState } from '@aura/engine-core';
```

---

## Component Patterns

### Functional Components Only

```typescript
// Always use function declarations for components
function EvidenceCard({ card, onSelect }: Props) {
  return (
    <div className="evidence-card">
      {/* ... */}
    </div>
  );
}
```

### Props Interface

```typescript
// Explicit Props interface above component
interface EvidenceCardProps {
  card: EvidenceCard;
  selected: boolean;
  onSelect: (id: string) => void;
}

function EvidenceCard({ card, selected, onSelect }: EvidenceCardProps) {
  // ...
}
```

### Event Handlers

```typescript
// Prefix with "handle", use useCallback for passed handlers
function EvidenceCard({ card, onSelect }: Props) {
  const handleClick = useCallback(() => {
    onSelect(card.id);
  }, [card.id, onSelect]);

  return <button onClick={handleClick}>...</button>;
}
```

---

## Python Kernel Reference Patterns

The Python kernel (`docs/source-files/kernel/`) provides patterns to follow:

### NewType for ID Safety (from `types.py`)

```python
# Python
RunId = NewType("RunId", str)
```

```typescript
// TypeScript equivalent
type RunId = string & { readonly __brand: 'RunId' };
// Or use template literal types
type CardId = `card_${string}`;
```

### Frozen Dataclasses → Readonly Types (from `types.py`)

```python
# Python
@dataclass(frozen=True, slots=True)
class Action:
    action_type: ActionType
    actor_id: EntityId
```

```typescript
// TypeScript equivalent
interface Action {
  readonly actionType: ActionType;
  readonly actorId: EntityId;
}
```

### Pure Tick Function (from `tick.py`)

```python
# Python
def process_tick(state, actions, run_id, event_log) -> TickResult:
    new_state = deepcopy(state)
    # ... pure logic ...
    return TickResult(state=new_state, events=events)
```

```typescript
// TypeScript equivalent
function resolve(state: RunState, submission: Submission): ResolveResult {
  // Return new state, don't mutate
  return { state: newState, events };
}
```

### Canonical JSON Hashing (from `hash.py`)

```python
# Python
def canonical_json(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()
```

```typescript
// TypeScript equivalent
function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
```

---

## References

- `docs/D17-CLIENT-ARCHITECTURE.md` - Full architecture patterns
- `docs/D21-TEST-PLAN-FIXTURES.md` - Testing requirements
- `docs/source-files/kernel/` - Python reference patterns
