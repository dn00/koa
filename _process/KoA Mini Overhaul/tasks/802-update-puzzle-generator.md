# Task 802: Update Puzzle Generator Prompt for v1 Lite

**Status:** backlog
**Complexity:** M
**Depends On:** 101, 102, 401, 402, 403, 404, 405
**Implements:** R8.3

---

## Objective

Update the puzzle generator prompt/script to include v1 Lite field requirements and constraints so that new puzzles are generated with proper axis tagging and pass validator checks.

---

## Context

### Relevant Files
- `scripts/v5-puzzles.ts` or similar puzzle generation script
- Any LLM prompt templates for puzzle generation
- `scripts/prototype-v5.ts` — validator (Tasks 401-405)

### Embedded Context

**New prompt additions for card generation:**
```markdown
## Card Fields (v1 Lite)

Each card MUST include these fields:

- `factTouch`: Which fact (1, 2, or 3) this card addresses. Each truth card addresses exactly one fact.
- `signalRoot`: Where the signal originates. Options: 'koa_cloud', 'phone_os', 'router_net', 'device_firmware', 'camera_storage', 'wearable_health', 'human_partner', 'human_neighbor', 'human_self', 'receipt_photo', 'unknown'
- `controlPath`: How the action was controlled. Options: 'manual', 'automation', 'remote', 'unknown'
- `claimShape`: The shape of the claim. Options: 'absence' (what didn't happen), 'positive' (what did happen), 'attribution' (blaming something), 'integrity' (system was working correctly)
- `evidenceType`: Type of evidence source. Options: 'DIGITAL' (device logs), 'SENSOR' (environmental data), 'TESTIMONY' (human statement), 'PHYSICAL' (tangible evidence)
```

**New prompt additions for lie generation:**
```markdown
## Lie Fields (v1 Lite)

Each lie MUST include these fields:

- `lieType`: Must be 'inferential' or 'relational' (never 'direct_contradiction')
- `trapAxis`: Why this lie is tempting. Options: 'coverage' (patches a gap), 'independence' (adds diversity), 'control_path' (convenient alibi), 'claim_shape' (seductive claim type)
- `baitReason`: One sentence explaining why players will pick this lie

## Trap Diversity Requirement

Lies MUST use at least 2 different trapAxis values. Don't make all lies tempting for the same reason.
```

**New prompt additions for constraints:**
```markdown
## Puzzle Constraints (v1 Lite)

1. **Coverage**: Truth cards MUST cover all 3 facts. Check that facts 1, 2, and 3 each have at least one truth card.

2. **Independence diversity**: Truth cards SHOULD have at least 2 different signalRoots. Avoid all truths from same source.

3. **P4+ constraint**: Dodging a concern (diversifying on T3) MUST expose player to at least one lie. If a concern triggers, at least one lie should be tempting for independence reasons.

4. **No direct_contradiction**: All lies require inference to detect. Player must think, not just remember.

5. **storyCompletions**: Use closing-energy barks only. No axis commentary, no evaluation.
```

**Validator integration:**
- After generation, run validator (Tasks 401-405)
- If validator fails, regenerate or manually fix
- Document which checks are automated vs manual

---

## Acceptance Criteria

### AC-1: Prompt includes card field requirements <- R8.3
- **Given:** Puzzle generator prompt
- **When:** Reading prompt
- **Then:** All card fields (factTouch, signalRoot, controlPath, claimShape, evidenceType) documented

### AC-2: Prompt includes lie field requirements <- R8.3
- **Given:** Puzzle generator prompt
- **When:** Reading prompt
- **Then:** trapAxis and baitReason requirements documented

### AC-3: Prompt includes constraints <- R8.3
- **Given:** Puzzle generator prompt
- **When:** Reading prompt
- **Then:** Coverage, independence, P4+, no direct_contradiction constraints documented

### AC-4: Generated puzzles pass validator <- R8.3
- **Given:** Newly generated puzzle
- **When:** Running validator
- **Then:** All checks pass (or clear guidance on what to fix)

### AC-5: storyCompletions guidance included <- R8.3
- **Given:** Puzzle generator prompt
- **When:** Reading prompt
- **Then:** Closing-energy bark requirement documented

---

## Edge Cases

### EC-1: LLM ignores constraints
- **Scenario:** Generated puzzle violates a constraint
- **Expected:** Validator catches it, prompt includes remediation guidance

### EC-2: Creative signalRoot needed
- **Scenario:** Puzzle scenario doesn't fit existing signalRoots
- **Expected:** Use 'unknown' or document need for new signalRoot

### EC-3: Hard to satisfy P4+
- **Scenario:** Difficult to make diversifying expose to lie
- **Expected:** Document this as design constraint, may need multiple generation attempts

---

## Error Cases

### ERR-1: Missing field in generated puzzle
- **When:** LLM omits required field
- **Then:** TypeScript error on import
- **Error Message:** Property 'factTouch' is missing

### ERR-2: Invalid enum value
- **When:** LLM uses invalid signalRoot etc.
- **Then:** TypeScript error
- **Error Message:** Type '"invalid_root"' is not assignable

---

## Scope

**In Scope:**
- Update puzzle generation prompt/instructions
- Document all new field requirements
- Document constraints and their rationale
- Integrate with validator

**Out of Scope:**
- Validator implementation (Tasks 401-405)
- Type definitions (Tasks 101, 102)
- Running the generator (future puzzle creation)

---

## Implementation Hints

1. Find existing prompt/template for puzzle generation
2. Add sections for new fields with examples
3. Add constraints section with rationale
4. Include example of fully-tagged card and lie
5. Add note about validator integration
6. Consider adding a checklist for manual review

---

## Log

### Planning Notes
**Context:** Generator must produce v1 Lite compatible puzzles
**Decisions:** Document requirements in prompt, validate after
