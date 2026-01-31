# KOA Mini — Simple Orchestrator

You generate complete puzzles directly, then validate and audit them. No sub-agents.

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

## Step 1: Read the Prompt

Read the full puzzle generation prompt first:
```
_process/context/koa-mini-puzzle-prompt.md
```

This contains all rules for:
- Difficulty levels and lie type distribution
- Scenario archetypes with examples
- Fact design (atomicity, non-redundancy)
- Card structure and v1 Lite fields
- KOA voice and bark requirements
- Quality checklist

## Step 2: Design the Puzzle

Before writing any code, plan:

### 2a. Pick Archetype & Theme
- Choose archetype (or use provided one)
- Choose smart home device/scenario
- Write a creative, funny scenario (NO FORMULA)

### 2b. Design Lies FIRST (work backward)
Based on difficulty:
| Difficulty | Inferential | Relational |
|------------|-------------|------------|
| EASY | 2-3 | 0-1 |
| MEDIUM | 1-2 | 1-2 |
| HARD | 0-1 | 2-3 |

For each lie:
- What does it claim?
- What fact(s) will catch it?
- Is it inferential (1 fact) or relational (2+ facts)?

### 2c. Design Facts to Catch Lies
Write exactly 3 facts that:
- Are **ATOMIC** (one piece of info each — NO semicolons bundling multiple facts)
- Are **NON-REDUNDANT** (no two facts convey same info)
- Are **COMPLEMENTARY** (relational lies genuinely need 2+ facts)

**Verify relational lies:**
For each "relational" lie, confirm:
- Fact 1 alone catches it? Must be NO
- Fact 2 alone catches it? Must be NO
- Fact 3 alone catches it? Must be NO
- Need 2+ facts? Must be YES

### 2d. Design Truths
- 3 truths with strengths 3, 3, 4
- Each touches one fact (partition {1, 2, 3})
- Include one clear T1 anchor (safe from facts alone)
- For MEDIUM/HARD: 0-2 red herrings (truths that sound suspicious)

## Step 3: Write Complete Puzzle File

Write to: `packages/engine-core/src/packs/[slug]-puzzle.ts`

Include ALL sections complete:
- Scenario and facts
- All 6 cards with v1 Lite fields
- All lie metadata (lieType, inferenceDepth, trapAxis, baitReason)
- Opening line, verdicts, epilogue
- All barks: cardPlayed (6), sequences (30), storyCompletions (10)
- All objection barks and liesRevealed (5)

### Card Template
```typescript
card({
  id: 'snake_case_id',
  strength: 3, // truths: 3,3,4 | lies: 3,4,5
  evidenceType: 'SENSOR', // DIGITAL | SENSOR | TESTIMONY | PHYSICAL
  location: 'BEDROOM', // BEDROOM | KITCHEN | GARAGE | LIVING_ROOM | etc.
  time: '',
  claim: 'Short punchy claim under 15 words.',
  presentLine: "First person weak excuse energy...",
  isLie: false, // or true
  source: 'Sleep Tracker', // Short scannable title
  factTouch: 1, // 1, 2, or 3
  signalRoot: 'wearable_health', // See enum in prompt
  controlPath: 'automation', // manual | automation | remote
  claimShape: 'positive', // absence | positive | attribution
  subsystem: 'climate', // What system this relates to
}),
```

### Lie Metadata Template
```typescript
{
  cardId: 'lie_card_id',
  lieType: 'relational', // inferential | relational
  inferenceDepth: 2, // 1, 2, or 3
  reason: 'Why this is a lie - which facts catch it.',
  trapAxis: 'independence', // coverage | independence | control_path | claim_shape
  baitReason: 'Why players will pick this lie.',
},
```

### KOA Voice Rules
- Sarcastic but not mean
- Pre-reveal barks: suspicious but NON-COMMITTAL (never reveal lies)
- Sequence barks: reference BOTH cards, order matters
- No banned words: "lie", "false", "verdict", "guilty", "card", "play", "game"

## Step 4: Validate

Run the validator:
```bash
cd packages/engine-core && npx tsx scripts/validate-puzzle.ts src/packs/[slug]-puzzle.ts
```

**If validation fails:** Fix the issues and re-validate.

## Step 5: Audit

Use the Task tool to run the audit judge:
```
Task: "Audit puzzle quality"
subagent_type: general-purpose
Prompt: "Follow audit prompt at _process/context/koa-mini-puzzle-audit.md
        Puzzle file: packages/engine-core/src/packs/[slug]-puzzle.ts
        Difficulty: [EASY/MEDIUM/HARD]"
```

## Step 6: Fix Loop

If audit verdict is TWEAK or REJECT:
1. Read the specific feedback
2. Fix the issues (you have full context)
3. Re-validate
4. Re-audit if major changes
5. Max 3 iterations, then ship best version

## Quality Gates

Before shipping, verify:
- [ ] Validation passes (all V1-V25 checks)
- [ ] Audit score ≥ 80/100
- [ ] Lie types match claimed difficulty
- [ ] Facts are atomic and non-redundant
- [ ] Relational lies genuinely require 2+ facts
- [ ] All 30 sequence barks present and reference both cards
- [ ] No banned words in dialogue

## Naming Rules

**BAD:** "The 3 AM Sprinkler", "The Thermostat Incident"
**GOOD:** "Frozen Lawn", "Coffee Crimes", "Who Fed the Fridge?"

## Common Mistakes to Avoid

1. **Bundled facts** — "Phone in airplane mode; tablet dead; laptop at office" is THREE facts
2. **Redundant facts** — Both facts mentioning "3 devices" makes relational lies inferential
3. **Fake relational lies** — If one fact alone catches it, it's inferential
4. **Generic barks** — "Interesting." says nothing. Reference the specific cards.
5. **Revealing barks** — Never say "that's a lie" before liesRevealed phase
