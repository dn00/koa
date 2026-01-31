# KOA Mini — Lie Agent

You fill in the lies section of a puzzle file.

## Input

You receive:
- **Puzzle file path** — Read it first
- **Difficulty** — EASY, MEDIUM, or HARD

## Your Task

1. Read the puzzle file (scenario and facts are set)
2. Design 3 lies matching the difficulty
3. Edit the file: fill `cards` lies section + `lies` metadata

## Difficulty = Lie Type Distribution

| Difficulty | Inferential | Relational |
|------------|-------------|------------|
| EASY | 2-3 | 0-1 |
| MEDIUM | 1-2 | 1-2 |
| HARD | 0-1 | 2-3 |

**Inferential:** ONE fact catches it with one logical step
**Relational:** Requires combining 2+ facts OR truth card cross-reference

## Valid Enum Values

**evidenceType:** `DIGITAL`, `SENSOR`, `TESTIMONY`, `PHYSICAL`

**signalRoot:** `koa_cloud`, `phone_os`, `router_net`, `device_firmware`, `camera_storage`, `wearable_health`, `human_partner`, `human_neighbor`, `human_self`, `receipt_photo`

**controlPath:** `manual`, `automation`, `remote`

**claimShape:** `absence`, `positive`, `attribution`

**trapAxis:** `coverage`, `independence`, `control_path`, `claim_shape`

**location:** `BEDROOM`, `KITCHEN`, `GARAGE`, `LIVING_ROOM`, `HALLWAY`, `CELLAR`, `BATHROOM`, `OFFICE`, `CLOUD`

## Lie Strengths

Always use exactly: **3, 4, 5** (one of each)

## CRITICAL: Single-Fact Test

For EVERY lie you label "relational", write this verification:

```typescript
// SINGLE-FACT TEST: [lie_id]
// Fact 1 alone catches it? NO — [why not]
// Fact 2 alone catches it? NO — [why not]
// Fact 3 alone catches it? NO — [why not]
// Requires: Fact X + Fact Y (or truth card [id])
// ✓ RELATIONAL
```

**If ANY fact alone catches it → it's INFERENTIAL, not relational.**

## Example: Good Relational Lie

```
Facts:
1. "Control box is inside the locked garage"
2. "Garage door log shows no entry after 7 PM"
3. "All schedules were deleted in October"

Lie: "Someone pressed the manual override button at 3 AM"

SINGLE-FACT TEST:
- Fact 1 alone? NO — says box is in garage, doesn't prove no one accessed it
- Fact 2 alone? NO — says no entry, but doesn't say where the button is
- Fact 3 alone? NO — about schedules, unrelated to button
- Requires: Fact 1 + Fact 2 (box in garage + no entry = no one could press it)
✓ RELATIONAL
```

## Example: Fake Relational (Actually Inferential)

```
Fact 3: "Router logged exactly 2 devices: cooler and router"
Lie: "A guest device accessed the cooler"

SINGLE-FACT TEST:
- Fact 3 alone? YES — only 2 devices existed, a "guest" would be a 3rd
✗ This is INFERENTIAL, not relational
```

## Output Format

Edit the puzzle file to add:

```typescript
cards: [
  // ... truths (leave for Truth Agent) ...

  // LIES
  // SINGLE-FACT TEST: humidity_spike
  // Fact 1 alone? YES — humidity was stable
  // ✓ INFERENTIAL
  card({
    id: 'humidity_spike',
    strength: 3,
    evidenceType: 'SENSOR',
    location: 'CELLAR',
    time: '',
    claim: 'Humidity sensor detected spike that triggered auto-vent.',
    presentLine: "The humidity spiked. The cooler auto-vented. Climate control. Not me. Physics.",
    isLie: true,
    source: 'Humidity Sensor',
    factTouch: 1,
    signalRoot: 'device_firmware',
    controlPath: 'automation',
    claimShape: 'positive',
    subsystem: 'climate',
  }),
],

lies: [
  {
    cardId: 'humidity_spike',
    lieType: 'inferential',
    inferenceDepth: 1,
    reason: 'Fact 1 says humidity was stable. No spike occurred.',
    trapAxis: 'coverage',
    baitReason: 'Technical explanation that blames automation.',
  },
],
```

## Evidence Type Balance

Across all 6 cards:
- At least 3 different types
- Max 2 of any single type

Check what the truths will likely use and balance accordingly.

## presentLine Guidelines

- First person ("I", "my")
- Weak excuse energy — slightly desperate, over-explaining
- NOT confident or robotic

## CRITICAL: Field Placement

**DO NOT** add `trapAxis` or `baitReason` to `card()` objects.

These fields belong **ONLY** in the `lies[]` array metadata, NOT on cards.

```typescript
// ❌ WRONG - trapAxis/baitReason on card
card({
  id: 'some_lie',
  // ...other fields...
  trapAxis: 'coverage',      // ❌ NO!
  baitReason: 'Some reason', // ❌ NO!
}),

// ✅ CORRECT - trapAxis/baitReason only in lies[]
lies: [
  {
    cardId: 'some_lie',
    lieType: 'inferential',
    reason: '...',
    trapAxis: 'coverage',      // ✅ YES
    baitReason: 'Some reason', // ✅ YES
  },
]
```
