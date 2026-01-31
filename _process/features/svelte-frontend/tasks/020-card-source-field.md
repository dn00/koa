# Task 020: Card Source Field for Scannable Display

**Status:** backlog
**Assignee:** -
**Phase:** Polish
**Complexity:** S
**Depends On:** -

---

## Objective

Add a `source` field to evidence cards for scannable display. Show source + time on card face instead of truncated claim. Full claim visible on tap/expand.

---

## Problem

Current cards show truncated claim text (first 5 words) as the title. This is:
- Hard to scan quickly
- Inconsistent across cards
- Too much cognitive load on mobile

---

## Design Decision: Source Field vs Canonical Types

We considered canonical card types (fixed set of ~12 types) but rejected it because:

1. **Evidence cards are generated per case** - The full game vision (v5-design.md) explicitly states evidence is "case content," not a fixed deck
2. **LLM generation needs flexibility** - Puzzles may need "Fish Tank Sensor" or "Delivery Receipt" that don't fit canonical types
3. **Canonical types reserved for Tactic cards** - When we add deckbuilding, Tactic cards become the collectible set

Instead, we use a **flexible `source` field** that puzzle authors define per card.

---

## Solution

Add `source` field to Card interface:

```typescript
interface Card {
  id: string;
  source: string;         // NEW: "Sleep Tracker", "Router Log", etc.
  strength: number;
  evidenceType: EvidenceType;  // Provides visual consistency via color
  time: string;
  claim: string;
  presentLine: string;
  isLie: boolean;
}
```

Evidence type provides the consistent visual language (color-coded badges). Source provides the scannable title.

---

## Card Display

### Card Face (selection view)
```
┌─────────────────┐
│ 📡 SENSOR       │  ← type badge (consistent)
│ Sleep Tracker   │  ← source (author-defined)
│ 3:12 AM         │
└─────────────────┘
```

### Card Expanded (on tap/focus)
```
┌─────────────────────────────────┐
│  📡 SENSOR • Sleep Tracker      │
│  3:12 AM                        │
├─────────────────────────────────┤
│  Sleep tracker shows deep REM   │
│  phase from 2:30 AM to 4:15 AM  │
└─────────────────────────────────┘
```

---

## Implementation

### 1. Update Card Type (engine-core)

Add `source` field to Card interface in `packages/engine-core/src/types.ts`

### 2. Update EvidenceCard Component

Change title display from:
```typescript
title: card.claim.split(' ').slice(0, 5).join(' ')
```

To:
```typescript
title: card.source
```

### 3. Update Puzzle Data

Add `source` field to PrintGate cards:
```typescript
card({
  id: 'sleep_tracker',
  source: 'Sleep Tracker',  // NEW
  strength: 5,
  evidenceType: 'SENSOR',
  // ...
}),
```

### 4. Update Puzzle Generation Prompt

Add `source` to required card fields in `koa-mini-puzzle-prompt.md`

---

## Acceptance Criteria

### AC-1: Source Field Exists
- **Given:** Card interface
- **When:** Defining a card
- **Then:** `source` field is available and required

### AC-2: Card Face Shows Source
- **Given:** Card in selection view
- **When:** Rendered
- **Then:** Shows evidence type badge + source + time (no claim)

### AC-3: Card Expansion Shows Claim
- **Given:** Player taps/focuses card
- **When:** Preview/expansion appears
- **Then:** Full claim text visible

### AC-4: PrintGate Migration
- **Given:** PrintGate puzzle
- **When:** Updated
- **Then:** All cards have `source` field

---

## Definition of Done

- [ ] `source` field added to Card interface
- [ ] EvidenceCard shows source instead of truncated claim
- [ ] Zone2Display (preview) shows full claim
- [ ] PrintGate puzzle updated with source fields
- [ ] Puzzle generation prompt updated

---

## Future: Tactic Cards

When we implement the full game (KOA TRIALS), Tactic cards will be the canonical collectible set:
- Fixed ~20-30 card types
- Recognizable icons and effects
- Deckbuilding and unlocks

Evidence cards remain flexible/generated. This task only addresses evidence card display.

---

## Log

### Change Log
- 2026-01-30 [Design] Created task with canonical types approach
- 2026-01-30 [Design] Revised to flexible source field approach per v5-design.md

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-30 | - | backlog | Design | Created |
| 2026-01-30 | backlog | backlog | Design | Revised approach |
