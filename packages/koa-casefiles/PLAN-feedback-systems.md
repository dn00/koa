# Plan: Feedback Systems Implementation

**Goal:** Make deduction feel guided, not random. Implement spec §6.3, §10.3, §10.5.

---

## Priority 1: Coverage Meter (High Impact, Low Effort)

**Problem:** Player doesn't know which parts of the answer they have evidence for.

**Spec §6.3:**
> "coverage meter (how many of WHO/HOW/WHY/WHEN have at least one evidence chain)"

**Implementation:**

1. Add `CoverageState` to PlayerSession:
```ts
type CoverageState = {
  who: { covered: boolean; suspects: Set<NPCId> };    // NPCs with evidence against them
  what: { covered: boolean; types: Set<CrimeType> };  // Crime types suggested by evidence
  how: { covered: boolean; methods: Set<MethodId> };  // Methods suggested
  when: { covered: boolean; windows: Set<WindowId> }; // Windows with anomalies
  where: { covered: boolean; places: Set<PlaceId> };  // Crime scene candidates
  why: { covered: boolean; motives: Set<MotiveType> }; // Motives discovered
};
```

2. Update coverage after each action in `actions.ts`:
   - Device logs mentioning an NPC → covers WHO candidate
   - Physical evidence → covers WHERE, WHAT
   - Gossip → covers WHY
   - Testimony with time → covers WHEN

3. Add `STATUS` command (free, 0 AP):
```
STATUS output:
┌─────────────────────────────────┐
│ COVERAGE                        │
├─────────────────────────────────┤
│ WHO:   ██████░░ 3/5 suspects    │
│ WHAT:  ████████ theft confirmed │
│ HOW:   ░░░░░░░░ no evidence     │
│ WHEN:  ████░░░░ W2 or W3        │
│ WHERE: ████████ office          │
│ WHY:   ██░░░░░░ 1 motive found  │
└─────────────────────────────────┘
```

**Files:** `src/player.ts`, `src/actions.ts`, `src/game.ts`

**Effort:** ~2 hours

---

## Priority 2: Known Whereabouts Tracking (High Impact, Medium Effort)

**Problem:** Player can't see where NPCs were without manually tracking testimony.

**Spec §10.3:**
> "Known whereabouts" per window (derived)

**Implementation:**

1. Add `WhereaboutsState` to PlayerSession:
```ts
type WhereaboutsState = {
  [npc: NPCId]: {
    [window: WindowId]: {
      place: PlaceId | 'unknown';
      confidence: 'confirmed' | 'claimed' | 'inferred';
      source: EvidenceId[];
    }
  }
};
```

2. Update whereabouts when evidence is collected:
   - Testimony with place → 'claimed' (NPC says they were there)
   - Device log showing NPC → 'confirmed' (device saw them)
   - Motion sensor + process of elimination → 'inferred'

3. Add `WHEREABOUTS` command (free, 0 AP):
```
WHEREABOUTS output:
┌───────┬────────┬────────┬────────┬────────┐
│       │   W1   │   W2   │   W3   │   W4   │
├───────┼────────┼────────┼────────┼────────┤
│ alice │ kitchen│ living │ office*│   ?    │
│ bob   │ living │ living │ living │ garage │
│ carol │ kitchen│ kitchen│ kitchen│ bedroom│
│ dan   │   ?    │ kitchen│ kitchen│   ?    │
│ eve   │ bedroom│ living │ garage*│ garage │
└───────┴────────┴────────┴────────┴────────┘
* = claimed only (not confirmed by device)
? = unknown
```

**Files:** `src/player.ts`, `src/actions.ts`, `src/game.ts`

**Effort:** ~3 hours

---

## Priority 3: Contradiction Cards with Named Rules (High Impact, Medium Effort)

**Problem:** COMPARE says "CONTRADICTION!" but doesn't explain why.

**Spec §10.5:**
> "A contradiction is a named rule: 'Can't be in two places in same window'"

**Implementation:**

1. Define contradiction rule types:
```ts
type ContradictionRule =
  | { type: 'location_conflict'; npc: NPCId; window: WindowId; placeA: PlaceId; placeB: PlaceId }
  | { type: 'timeline_impossible'; event: string; claimed: WindowId; actual: WindowId }
  | { type: 'access_violation'; npc: NPCId; place: PlaceId; reason: string }
  | { type: 'device_mismatch'; device: DeviceId; claimed: string; logged: string }
  | { type: 'testimony_conflict'; witnessA: NPCId; witnessB: NPCId; about: string };
```

2. Improve COMPARE output:
```
COMPARE testimony_200 device_51:
┌─────────────────────────────────────────────────┐
│ ⚡ CONTRADICTION: Location Conflict             │
├─────────────────────────────────────────────────┤
│ carol claims: "I was in bedroom during W3"     │
│ door sensor:  "carol entered living room W3"   │
│                                                 │
│ Rule: Can't be in two places in same window    │
└─────────────────────────────────────────────────┘
```

3. Store found contradictions with their rules for scoring.

**Files:** `src/actions.ts` (COMPARE logic), `src/types.ts`

**Effort:** ~3 hours

---

## Priority 4: Hint System (Medium Impact, Low Effort)

**Problem:** Player can get stuck with no direction.

**Spec §6.3:**
> "Optional hint (once/run): 'Your current theory conflicts with 2 evidence items'"

**Implementation:**

1. Add `HINT` command (free, but tracked for scoring penalty):
```ts
// In PlayerSession
hintsUsed: number;
```

2. Hint checks player's current theory (tracked via coverage):
```
HINT output:
┌─────────────────────────────────────────────────┐
│ 💡 KOA HINT (1/1 used)                          │
├─────────────────────────────────────────────────┤
│ Your current evidence points to:                │
│   WHO: bob or dan                               │
│   WHEN: W2 or W3                                │
│                                                 │
│ Suggestion: You have no WHY evidence yet.       │
│ Try: INTERVIEW <npc> gossip                     │
└─────────────────────────────────────────────────┘
```

3. Score penalty already exists (-150 per hint).

**Files:** `src/actions.ts`, `src/player.ts`, `src/game.ts`

**Effort:** ~1 hour

---

## Priority 5: Supports Detection in COMPARE (Medium Impact, Low Effort)

**Problem:** COMPARE only finds conflicts, never says "these reinforce each other."

**Spec §6.2 D:**
> "Produces contradictions (can't both be true) **or supports** (reinforces)"

**Implementation:**

1. Add support detection to COMPARE:
```ts
type CompareResult =
  | { type: 'contradiction'; rule: ContradictionRule }
  | { type: 'supports'; reason: string }
  | { type: 'unrelated' };
```

2. Support rules:
   - Same NPC, same place, same window → "Confirms presence"
   - Device log + testimony agree → "Corroborates testimony"
   - Two witnesses report same observation → "Independent confirmation"

```
COMPARE testimony_200 device_51:
┌─────────────────────────────────────────────────┐
│ ✓ SUPPORTS: Corroborates Testimony             │
├─────────────────────────────────────────────────┤
│ alice says: "heard door open in living W3"     │
│ door sensor: "living room door opened W3"      │
│                                                 │
│ These evidence items reinforce each other.      │
└─────────────────────────────────────────────────┘
```

**Files:** `src/actions.ts`

**Effort:** ~1 hour

---

## Priority 6: Structured Interview Questions (Medium Impact, High Effort)

**Problem:** INTERVIEW is too broad - "testimony" vs "gossip" isn't targeted enough.

**Spec §6.2 A:**
> - "Where were you between [Window A]?"
> - "What did you notice about [Person/Object]?"

**Implementation:**

1. Change INTERVIEW syntax:
```
INTERVIEW <npc> whereabouts <window>     → "Where were you during W3?"
INTERVIEW <npc> observations <window>    → "What did you notice during W3?"
INTERVIEW <npc> about <other_npc>        → "What do you know about bob?"
INTERVIEW <npc> gossip                   → "Any drama lately?" (unchanged)
```

2. Different question types yield different evidence:
   - `whereabouts` → Location claims (for WHEREABOUTS tracking)
   - `observations` → What they saw/heard (current testimony)
   - `about` → Relationship info + potential motive hints
   - `gossip` → Motive hints (unchanged)

**This is a bigger change** - affects evidence generation, not just display.

**Files:** `src/actions.ts`, `src/evidence.ts`, `src/game.ts`

**Effort:** ~5 hours

---

## Implementation Order

| Phase | Feature | Effort | Impact |
|-------|---------|--------|--------|
| 1 | Coverage Meter | 2h | High - Shows what's missing |
| 1 | Hint System | 1h | Medium - Unsticks players |
| 2 | Known Whereabouts | 3h | High - Visual NPC tracking |
| 2 | Contradiction Cards | 3h | High - Explains WHY |
| 3 | Supports Detection | 1h | Medium - Reinforcement feedback |
| 4 | Structured Interview | 5h | Medium - More control |

**Total: ~15 hours**

---

## Quick Wins (Can Do Now)

1. **STATUS command** - Even without full coverage tracking, can show evidence counts
2. **Better COMPARE output** - Add explanation text to existing contradiction detection
3. **HINT command** - Simple version that suggests underexplored areas

---

## Validation Changes

After implementing, update validators to **hard-reject** cases that don't meet:
- Contradiction count ≥ 3
- At least 2 independent WHO chains
- Each red herring has exculpating evidence

Currently these are warnings; should be failures.
