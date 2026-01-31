# KOA Mini — Puzzle Orchestration

Multi-agent system for generating KOA Mini puzzles using a shared workspace model.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│  - Creates skeleton file with scenario + facts              │
│  - Coordinates agents in sequence                           │
│  - Each agent reads full file, edits their section          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   puzzle.ts (shared)   │
                 └────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │   LIE   │    →     │  TRUTH  │    →     │  VOICE  │
   │  AGENT  │          │  AGENT  │          │  AGENT  │
   └─────────┘          └─────────┘          └─────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │    V1 LITE VALIDATOR   │
                 └────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │         JUDGE          │
                 └────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              [Score >= 90]       [Score < 90]
                    │                   │
                    ▼                   ▼
               ┌────────┐         ┌──────────┐
               │  DONE  │         │  FIXER   │
               └────────┘         └──────────┘
```

## Key Principle: Shared Workspace

The puzzle file IS the context. Every agent:
1. **Reads the full file** before editing
2. **Edits only their section**
3. **Has full context** of what other agents wrote

---

## V1 Lite Validator

**Location:** `packages/engine-core/src/packs/v1-lite-validator.ts`

**Function:** `validateV1Lite(cards, lies, { isMini: true })`

**Checks (V1-V25):**

| Check | What it validates |
|-------|-------------------|
| V1 | `factTouch` present and valid (1, 2, or 3) |
| V2 | `signalRoot` from valid enum |
| V3 | `controlPath` from valid enum |
| V4 | `claimShape` from valid enum |
| V5 | `subsystem` non-empty |
| V6 | Mini has no timestamps (`time: ''`) |
| V7 | Truths form perfect partition {1, 2, 3} |
| V8 | Each fact touched by ≥2 cards |
| V9 | All lies have `trapAxis` |
| V10 | All lies have `baitReason` |
| V11 | At least 2 distinct `trapAxis` values |
| V12 | P4 basic — concern matches a truth |
| V13 | P4+ — dangerous info dilemma exists |
| V14 | Exactly one all-truths selection (3T/3L) |
| V15 | All-truths orderings yield ≥ CLEARED |
| V16 | Strength distribution (truths: 3,3,4 / lies: 3,4,5) |
| V17 | Evidence type distribution (3+ types, max 2 each) |
| V18 | All cards have `source` field |
| V19 | All lies have `lieType` (inferential/relational) |
| V20 | All lies have `inferenceDepth` (1, 2, or 3) |
| V21 | All lies have `reason` field |
| V22 | All 30 sequence barks exist |
| V23 | All 6 cardPlayed barks exist |
| V24 | storyCompletions (10) + liesRevealed (5) exist |
| V25 | No banned words in dialogue |

**Usage:**
```typescript
import { validateV1Lite } from './v1-lite-validator.js';

// Basic validation (cards + lies only)
const result = validateV1Lite(puzzle.cards, puzzle.lies, { isMini: true });

// Full validation including barks and dialogue (V22-V25)
const fullResult = validateV1Lite(puzzle.cards, puzzle.lies, {
  isMini: true,
  koaBarks: puzzle.koaBarks,
  dialogue: {
    openingLine: puzzle.openingLine,
    verdicts: puzzle.verdicts,
  },
});

if (!result.passed) {
  console.log('FAILED CHECKS:');
  result.checks
    .filter(c => !c.passed)
    .forEach(c => console.log(`${c.id}: ${c.detail}`));
}
```

---

## Sequence

1. **Orchestrator** → Creates skeleton with scenario + facts
2. **Lie Agent** → Reads file, writes lies section
3. **Truth Agent** → Reads file (sees lies), writes truths
4. **Voice Agent** → Reads file (sees all cards), writes barks
5. **V1 Lite Validator** → Run `validateV1Lite()`, must pass (structural checks)
6. **Judge Agent** → Run audit prompt, get score + feedback (semantic checks)
7. **Fixer** → If <90, fix issues based on feedback
8. **Loop** → Re-validate, re-judge until 90+ or 3 iterations

### Validator vs Judge

| Layer | What it checks | How |
|-------|----------------|-----|
| **Validator** (code) | Structure: counts, enums, bark keys, banned words | Deterministic rules |
| **Judge** (LLM) | Quality: lie accuracy, voice, deducibility, T1 anchor | Audit prompt + reasoning |

---

## Files

| File | Purpose |
|------|---------|
| `orchestrator.md` | Creates skeleton, coordinates |
| `agent-lies.md` | Fills lies (with single-fact test) |
| `agent-truths.md` | Fills truths (sees lies for cross-ref) |
| `agent-voice.md` | Fills all barks (sees everything) |
| `agent-fixer.md` | Targeted fixes from feedback |

## Dependencies

| Resource | Path |
|----------|------|
| Main prompt | `_process/context/koa-mini-puzzle-prompt.md` |
| Audit prompt | `_process/context/koa-mini-puzzle-audit.md` |
| V1 Lite Validator | `packages/engine-core/src/packs/v1-lite-validator.ts` |
| Pack Validator | `packages/engine-core/src/packs/validation.ts` |

## Quality Thresholds

| Score | Action |
|-------|--------|
| 90-100 | Ship |
| 80-89 | One fix pass |
| 70-79 | Two fix passes max |
| <70 | Regenerate from Orchestrator |
