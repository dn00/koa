# D31 Mockup Review & Fix List

**Date:** 2026-01-26
**Mockup:** `d31_-adversarial-testimony.zip`
**Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md v1.7

---

## Summary

The AI-generated mockup correctly implements ~80% of D31's design. The core structure is sound, but several key mechanics are missing or incorrect. This document lists what works, what's broken, and how to fix it.

---

## What Works ✅

| Feature | Implementation |
|---------|----------------|
| No draft phase | Cards dealt directly to hand |
| Concerns system | AURA asks "Prove you're you" etc. |
| Visible counters | Shown from game start |
| Claims on cards | timeRange, location, state |
| Contradiction detection | MINOR (+1 scrutiny) vs MAJOR (blocked) |
| Refutation cards | Can nullify counters |
| Corroboration bonus | +25% for matching claims |
| Scrutiny 5 = loss | No audit penalty loop |
| Progressive disclosure | Stats toggle (Minimal/Full) |
| AURA mood states | All 8 states defined |
| Pre-submission warnings | Badge on conflicting cards |
| Per-card contested damage | Correct formula with Math.ceil |
| Committed story | Tracks submitted cards |

---

## Critical Fixes Required 🔴

### 1. Retroactive Refutation Damage Restore

**D31 Rule:** "When you refute AURA's counter-evidence, all previously-contested evidence affected by that counter deals its missing damage immediately."

**Current Bug:** Mockup only handles same-turn refutation. If you submit Face ID (contested at 50%), then later submit Maintenance Log (refutes Camera), the missing 6 damage from Face ID is NOT restored.

**Fix Required:**

```typescript
// Track contested damage per card
interface ContestedRecord {
  cardId: string;
  counterId: string;
  lostDamage: number; // The 50% that was lost
}

const [contestedRecords, setContestedRecords] = useState<ContestedRecord[]>([]);

// When refuting a counter:
const handleRefutation = (refutedCounterId: string) => {
  // Find all cards contested by this counter
  const restoredDamage = contestedRecords
    .filter(r => r.counterId === refutedCounterId)
    .reduce((sum, r) => sum + r.lostDamage, 0);

  // Apply restored damage
  setResistance(prev => Math.max(0, prev - restoredDamage));

  // Clear records for this counter
  setContestedRecords(prev => prev.filter(r => r.counterId !== refutedCounterId));
};
```

### 2. Win Condition Order

**D31 Rule:** "Win condition is checked after damage resolution. If player wins on same turn they hit scrutiny 5, they win."

**Current Bug:** Scrutiny loss is checked BEFORE win condition.

**Fix Required:**

```typescript
// In handleSubmit():

// WRONG ORDER:
if (newScrutiny >= 5) { /* lose */ return; }
// ... damage applied ...
if (newResistance <= 0 && allConcernsAddressed) { /* win */ }

// CORRECT ORDER:
// 1. Apply damage
const newResistance = Math.max(0, resistance - finalDamage);
setResistance(newResistance);

// 2. Update concerns
const newConcerns = /* ... */;

// 3. Check WIN first
if (newResistance <= 0 && newConcerns.every(c => c.addressed)) {
  setPhase('RESULT'); // WIN
  return;
}

// 4. THEN check scrutiny loss
if (newScrutiny >= 5) {
  setPhase('RESULT'); // LOSE
  return;
}
```

### 3. MINOR Contradiction Explanations

**D31 Rule:** MINOR warnings must explain WHY it's suspicious (physical implausibility), not just say "suspicious."

**Current Bug:** Generic message "That's suspicious."

**Fix Required:**

```typescript
// In checkContradiction():

// For ASLEEP → AWAKE conflict:
if ((s1 === 'ASLEEP' && s2 === 'AWAKE') || (s1 === 'AWAKE' && s2 === 'ASLEEP')) {
  return {
    severity: 'MINOR',
    message: `Deep sleep to fully alert in minutes? Either you have superhuman reflexes, or something doesn't add up.`,
    cards: [newCard.id, committed.id]
  };
}

// For DROWSY → ALERT:
if ((s1 === 'DROWSY' && s2 === 'ALERT') || (s1 === 'ALERT' && s2 === 'DROWSY')) {
  return {
    severity: 'MINOR',
    message: `"Barely conscious" to "sharp and focused" that fast? Did you inject espresso directly?`,
    cards: [newCard.id, committed.id]
  };
}
```

---

## Medium Priority Fixes 🟡

### 4. Counter "Spent" Tracking

**D31 Rule:** Each counter triggers once total per game, then is "spent."

**Current Issue:** Code only tracks `refuted` boolean, not whether counter has triggered.

**Fix:**

```typescript
interface CounterEvidence {
  // ... existing fields ...
  triggered: boolean; // NEW: Has this counter been used?
  refuted: boolean;   // Has this counter been nullified?
}

// When counter triggers:
setCounters(prev => prev.map(c =>
  c.id === activeCounter.id
    ? { ...c, triggered: true }
    : c
));

// Counter selection should check:
const activeCounter = counters.find(c =>
  !c.triggered && // Not yet used
  !c.refuted &&   // Not nullified
  c.targets.some(t => selectedCards.some(card => card.proves.includes(t)))
);
```

### 5. Pre-emptive Refutation

**D31 Rule:** Refutation can be played BEFORE counter triggers, pre-emptively disabling it.

**Current Issue:** Not clearly handled.

**Fix:** When a refutation card is submitted:
1. Check if it refutes any counter (triggered or not)
2. Mark that counter as refuted
3. If counter hasn't triggered yet, it can never trigger

```typescript
// Refutation works regardless of trigger state:
if (refutationCard) {
  setCounters(prev => prev.map(counter =>
    counter.id === refutationCard.refutes
      ? { ...counter, refuted: true }
      : counter
  ));
}
```

### 6. RESIGNED Mood Trigger

**D31 Rule:** AURA shifts to RESIGNED when player is mathematically struggling.

**Current Issue:** RESIGNED mood exists but is never triggered.

**Fix:**

```typescript
// After each turn, check if player can still win:
const canStillWin = () => {
  const remainingPower = hand.reduce((sum, c) => sum + c.power, 0);
  const concernsLeft = concerns.filter(c => !c.addressed);

  // Can't win if not enough damage OR can't address remaining concerns
  if (remainingPower < resistance) return false;

  for (const concern of concernsLeft) {
    const canAddress = hand.some(card =>
      card.proves.some(p => concern.requiredProof.includes(p))
    );
    if (!canAddress) return false;
  }

  return true;
};

// In handleSubmit, after updating state:
if (!canStillWin()) {
  setAuraMood('RESIGNED');
  setAuraMessage("You're still trying? ...Admirable.");
}
```

---

## UI Improvements 🟢

### 7. Time Range Display

**D31 Rule:** Time ranges should be visible on cards.

**Fix:** Add to EvidenceCard component:

```tsx
{/* Time Range */}
<div className="text-[9px] text-gray-500 font-mono">
  {card.claims.timeRange[0]} - {card.claims.timeRange[1]}
</div>
```

### 8. Corroboration Visual Connection

**D31 Rule:** Show connecting line/glow between corroborating cards.

**Fix:** When corroboration detected, highlight matching claim icons:

```tsx
{corroboration.has && (
  <div className="absolute inset-0 pointer-events-none">
    {/* Draw SVG line between matching cards */}
    <svg className="w-full h-full">
      <line x1="..." y1="..." x2="..." y2="..."
        stroke="rgb(16, 185, 129)" strokeWidth="2" strokeDasharray="4" />
    </svg>
  </div>
)}
```

Or simpler: add glow to matching claim badges:

```tsx
{card.claims.location && (
  <span className={`... ${isCorroborating ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
    📍 {card.claims.location}
  </span>
)}
```

### 9. Flavor Text Display

**D31 Rule:** Cards have flavor text that should be visible.

**Fix:** Add to EvidenceCard, visible on long-press or in stats mode:

```tsx
{showStats && (
  <p className="text-[9px] text-gray-400 italic mt-2 leading-tight">
    "{card.flavor}"
  </p>
)}
```

### 10. AURA Dialogue Variety

**D31 Section 18** has extensive dialogue for:
- Opening scenarios
- Counter dialogue
- Refutation responses
- Victory/defeat lines

**Fix:** Import dialogue from D31 and randomize:

```typescript
const COUNTER_DIALOGUE: Record<string, string[]> = {
  'counter-camera': [
    "My front door camera recorded no one at the door at 2:07am. Your Face ID claims you were there. One of us is wrong.",
    "The camera sees all. Well, almost all. It didn't see you."
  ],
  'counter-sleep': [
    "Your own sleep tracker says you've been in REM since 11pm. Deep, restful sleep. The kind someone NOT raiding the fridge would enjoy.",
  ]
};
```

---

## Test Scenarios

After fixes, verify these scenarios work correctly:

### Scenario A: Retroactive Refutation
1. Turn 1: Submit Face ID → contested by Camera → 6 damage (should track 6 lost)
2. Turn 2: Submit Maintenance Log → refutes Camera → 5 damage + 6 restored = 11 total
3. **Expected:** Resistance drops by 17 total (6 + 11)

### Scenario B: Win on Scrutiny 5 Turn
1. Player at scrutiny 4, resistance 5
2. Submit card causing MINOR contradiction (+1 scrutiny → 5) but deals 10 damage
3. **Expected:** WIN (resistance 0), not LOSS (scrutiny 5)

### Scenario C: Pre-emptive Refutation
1. Turn 1: Submit Maintenance Log (refutes Camera) before playing Face ID
2. Turn 2: Submit Face ID
3. **Expected:** Face ID NOT contested (Camera was pre-emptively refuted)

### Scenario D: RESIGNED Mood
1. Play Gym Wristband first (commits GYM location)
2. Only IDENTITY card is Face ID (KITCHEN location)
3. **Expected:** AURA shifts to RESIGNED after Gym Wristband committed

---

## Implementation Priority

| Priority | Fix | Effort |
|----------|-----|--------|
| 🔴 P0 | Retroactive refutation | Medium |
| 🔴 P0 | Win condition order | Low |
| 🔴 P0 | MINOR explanations | Low |
| 🟡 P1 | Counter spent tracking | Medium |
| 🟡 P1 | Pre-emptive refutation | Low |
| 🟡 P1 | RESIGNED mood trigger | Medium |
| 🟢 P2 | Time range display | Low |
| 🟢 P2 | Corroboration visual | Medium |
| 🟢 P2 | Flavor text | Low |
| 🟢 P2 | AURA dialogue variety | Medium |

---

## Files to Modify

1. **utils.ts** — Fix MINOR contradiction messages
2. **GameInterface.tsx** — Fix win order, add retroactive refutation, RESIGNED trigger
3. **types.ts** — Add `triggered` to CounterEvidence, add ContestedRecord
4. **EvidenceCard.tsx** — Add time range, flavor text
5. **constants.ts** — Add AURA dialogue variants

---

## Acceptance Criteria

Mockup is complete when:
- [ ] Retroactive refutation restores contested damage
- [ ] Win resolves before scrutiny loss
- [ ] MINOR contradictions explain physical implausibility
- [ ] Counters track triggered vs refuted
- [ ] Pre-emptive refutation works
- [ ] RESIGNED mood triggers when mathematically struggling
- [ ] Time ranges visible on cards
- [ ] Corroboration shows visual connection
- [ ] All 4 test scenarios pass
