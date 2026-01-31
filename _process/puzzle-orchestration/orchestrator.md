# KOA Mini — Orchestrator

You coordinate puzzle generation by creating a skeleton file, then dispatching agents to fill it.

## Input

You receive:
- **Difficulty:** EASY, MEDIUM, or HARD
- **Archetype (optional):** Pick randomly if not specified
  - `time` — Suspicious activity at odd hour (use sparingly)
  - `quantity` — Absurd amount of something
  - `contradiction` — Two things that can't both be true
  - `sequence` — Pattern that doesn't make sense
  - `purchase` — Order that doesn't fit
- **Theme (optional):** e.g., "smart fridge"

## Step 1: Create Skeleton File

Write to: `packages/engine-core/src/packs/[slug]-puzzle.ts`

Read the main prompt first for full context:
`_process/context/koa-mini-puzzle-prompt.md`

```typescript
/**
 * Generated Puzzle: [Creative Name]
 * Difficulty: [EASY/MEDIUM/HARD]
 */

import type { V5Puzzle, Card } from '../types/v5/index.js';

function card(data: Omit<Card, 'id'> & { id: string }): Card {
  return data as Card;
}

export const PUZZLE_[SLUG]: V5Puzzle = {
  slug: '[slug]',
  name: '[Creative Name]',

  // NO FORMULA. Use the archetype as hook. Be creative. Make it funny.
  // ARCHETYPES: time, quantity, contradiction, sequence, purchase
  // BAD: "3:12 AM. X happened. KOA locked Y until you explain." (formulaic)
  // GOOD (quantity): "Your fridge ordered 47 pounds of cheese. You're lactose intolerant."
  // GOOD (contradiction): "Your thermostat thinks it's July. It's December."
  // GOOD (sequence): "The garage door opened 12 times. Your car never left."
  scenario: `[Your creative scenario based on archetype]`,

  knownFacts: [
    // Design these to support lie catching per difficulty:
    // EASY: Each fact catches one lie directly
    // MEDIUM: At least one fact only useful when combined with another
    // HARD: Facts feel incomplete alone, require interpretation
    '[Fact 1]',
    '[Fact 2]',
    '[Fact 3]',
  ],

  openingLine: `TODO: Voice Agent`,
  target: 57,

  cards: [
    // ══════════════════════════════════════════════════════════════════
    // TRUTHS (3) — strengths: 3, 3, 4
    // TODO: Truth Agent
    // ══════════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════════════
    // LIES (3) — strengths: 3, 4, 5
    // NOTE: Cards have NO trapAxis/baitReason — those go in lies[] only
    // TODO: Lie Agent
    // ══════════════════════════════════════════════════════════════════
  ],

  lies: [
    // trapAxis + baitReason go HERE, not on cards
    // TODO: Lie Agent
  ],

  verdicts: {
    flawless: '', // TODO: Voice Agent
    cleared: '',
    close: '',
    busted: '',
  },

  koaBarks: {
    cardPlayed: {},      // TODO: Voice Agent
    sequences: {},
    storyCompletions: {},
    objectionPrompt: {},
    objectionStoodTruth: {},
    objectionStoodLie: {},
    objectionWithdrew: {},
    liesRevealed: {},
  },

  epilogue: '', // TODO: Voice Agent
};

export default PUZZLE_[SLUG];
```

## Step 2: Dispatch Agents

Use the Task tool to spawn each agent IN SEQUENCE:

```
1. Task: "Fill lies section"
   Prompt: agent-lies.md + "Puzzle file: [path]. Difficulty: [X]"

2. Task: "Fill truths section"
   Prompt: agent-truths.md + "Puzzle file: [path]. Difficulty: [X]"

3. Task: "Fill voice/barks"
   Prompt: agent-voice.md + "Puzzle file: [path]"
```

Each agent reads the file, edits their section, writes it back.

## Step 3: Validate

Run the validator against the puzzle:

```bash
cd packages/engine-core && npx tsx scripts/validate-puzzle.ts src/packs/[slug]-puzzle.ts
```

If validation fails, fix the issues directly (you have the full prompt context).

## Step 4: Judge

Use the Task tool:
```
Task: "Audit puzzle quality"
Prompt: "Follow audit prompt at _process/context/koa-mini-puzzle-audit.md
        Puzzle file: [path]
        Difficulty: [X]"
```

## Step 5: Fix Loop

If Judge verdict is TWEAK or REJECT:
1. Read the feedback
2. Fix the issues directly (you have full context)
3. Re-validate, re-judge
4. Max 3 iterations, then ship best version

## Naming Rules

**BAD:** "The 3 AM Sprinkler", "The Thermostat Incident"
**GOOD:** "Frozen Lawn", "Coffee Crimes", "Who Fed the Fridge?"
