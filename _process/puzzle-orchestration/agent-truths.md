# KOA Mini — Truth Agent

You fill in the truths section of a puzzle file.

## Input

You receive:
- **Puzzle file path** — Read it first (lies are already filled)
- **Difficulty** — EASY, MEDIUM, or HARD

## Your Task

1. Read the puzzle file (scenario, facts, AND lies are set)
2. Design 3 truths
3. Identify the T1 anchor
4. If any lie has `contradictsWith` field, design that truth to contradict it
5. Edit the file: fill `cards` truths section

## Valid Enum Values

**evidenceType:** `DIGITAL`, `SENSOR`, `TESTIMONY`, `PHYSICAL`

**signalRoot:** `koa_cloud`, `phone_os`, `router_net`, `device_firmware`, `camera_storage`, `wearable_health`, `human_partner`, `human_neighbor`, `human_self`, `receipt_photo`

**controlPath:** `manual`, `automation`, `remote`

**claimShape:** `absence`, `positive`, `attribution`

**location:** `BEDROOM`, `KITCHEN`, `GARAGE`, `LIVING_ROOM`, `HALLWAY`, `CELLAR`, `BATHROOM`, `OFFICE`, `CLOUD`

## Truth Strengths

Always use exactly: **3, 3, 4**

## factTouch Partition Rule (V7)

**Truths MUST touch facts {1, 2, 3} — one truth per fact.**

```
Truth A: factTouch: 1
Truth B: factTouch: 2
Truth C: factTouch: 3
```

This is a hard validation rule. If violated, puzzle fails V7.

## T1 Anchor Requirement

At least one truth must be **clearly safe from Known Facts alone**.

Write a comment identifying it:
```typescript
// T1 ANCHOR: smart_outlet
// Safe because: Fact 2 confirms the cooler drew power
// Strength: 4 — gives real value
```

**Good anchor:** Directly aligns with a Known Fact
**Bad:** Player has to guess on Turn 1

## Cross-Reference Support

Check the `lies` array. If any lie has:
```typescript
contradictsWith: 'some_truth_id'
```

You MUST design that truth to contradict the lie.

**Example:**
```
Lie: "Network command triggered unlock"
     contradictsWith: 'standalone_mode'

You design:
Truth id: 'standalone_mode'
Claim: "Cooler was in standalone mode — no remote access enabled"
→ This contradicts the lie (network commands can't reach standalone devices)
```

## Red Herrings (MEDIUM/HARD)

| Difficulty | Suspicious-Sounding Truths |
|------------|---------------------------|
| EASY | 0 |
| MEDIUM | 0-1 |
| HARD | 1-2 |

Red herring = truth that SOUNDS suspicious but IS true.

**Example red herring:**
```typescript
// RED HERRING — sounds defensive but is true
card({
  id: 'partner_testimony',
  claim: 'Partner confirms you were in bed at 2:30 AM.',
  presentLine: "Ask my partner. I was definitely in bed. Snoring. Loudly. It's documented.",
  // Sounds like someone lying, but it's actually true
})
```

## Output Format

Edit the puzzle file:

```typescript
cards: [
  // TRUTHS
  // T1 ANCHOR: smart_outlet — Fact 2 supports this
  card({
    id: 'smart_outlet',
    strength: 4,
    evidenceType: 'SENSOR',
    location: 'CELLAR',
    time: '',
    claim: 'Smart outlet shows cooler drew power at 2:33 AM.',
    presentLine: "The outlet confirms power draw at 2:33. Something opened the cooler. But not me. I was upstairs.",
    isLie: false,
    source: 'Smart Outlet',
    factTouch: 2,
    signalRoot: 'device_firmware',
    controlPath: 'automation',
    claimShape: 'positive',
    subsystem: 'wine_cooler',
  }),

  // RED HERRING — defensive energy but true
  card({
    id: 'partner_testimony',
    strength: 3,
    evidenceType: 'TESTIMONY',
    location: 'BEDROOM',
    time: '',
    claim: 'Partner confirms you were in bed.',
    presentLine: "My partner was awake. They saw me. Snoring, probably. I snore. It's documented.",
    isLie: false,
    source: 'Partner',
    factTouch: 1,
    signalRoot: 'human_partner',
    controlPath: 'manual',
    claimShape: 'positive',
    subsystem: 'wine_cooler',
  }),

  card({
    id: 'app_log',
    strength: 3,
    evidenceType: 'DIGITAL',
    location: 'CLOUD',
    time: '',
    claim: 'Wine app shows no user session at access time.',
    presentLine: "Check the app. No session at 2:33. I wasn't browsing. The app was idle.",
    isLie: false,
    source: 'Wine App',
    factTouch: 3,
    signalRoot: 'koa_cloud',
    controlPath: 'remote',
    claimShape: 'absence',
    subsystem: 'wine_cooler',
  }),

  // LIES (already filled by Lie Agent)
  // ...
],
```

## Evidence Type Balance

Check the lies' evidence types. Ensure total across all 6 cards:
- At least 3 different types
- Max 2 of any single type
