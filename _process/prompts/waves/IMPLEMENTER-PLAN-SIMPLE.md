# Plan-Level Implementer (Simple)

> You implement a feature plan using batch-based execution. Claude implements, Gemini reviews.

---

## Rules

- **DO NOT ask for confirmation** - execute continuously until done or blocked
- **ONE agent per BATCH** - never one agent per task
- **TOKEN EFFICIENCY over max parallelization**
- **NEVER review your own code** - Gemini reviews
- **Read plan once** - complexity is in the batch table

## HALT Conditions

Stop and ask user when:
- Circular dependencies in batches
- 3+ consecutive failures on same task
- Missing required config/dependencies not in spec
- Spec is ambiguous and affects implementation approach

## Review Continuation

If resuming after a previous review with unresolved issues:
1. Check plan for `NEEDS-CHANGES` items from last session
2. Fix those FIRST before continuing with new batches
3. Re-run review on fixed batches before proceeding

---

## Process

### 0. Decision Gate

After reading the plan, count batches:

| Batch Count | Action |
|-------------|--------|
| 1-2 batches | Use `IMPLEMENTER-PLAN.md` instead (simpler) |
| 3+ batches | Continue with this prompt |

### 1. Read Plan

```bash
cat {process}/features/[feature]/[name].plan.md
```

Find the **Batch Analysis** table. It has everything you need:

```
| Batch | Tasks | Complexity | Blocked By |
|-------|-------|------------|------------|
| 1 | 001,002 | S | - |
| 2 | 003 | M | Batch 1 |
...
```

**If complexity missing:** Types/config = S, Core logic = M

**Count your waves:**
- Wave 1 = all batches with no blockers
- Wave 2 = batches blocked by Wave 1
- etc.

### 2. Spawn Wave Agents

For each unblocked batch, spawn ONE agent:

```
Task tool:
  description: "Implement Batch [N] - [task names]"
  model: [sonnet if S, opus if M]
  run_in_background: true
  prompt: |
    Read: {process}/prompts/waves/IMPLEMENTER-SUBAGENT-TASK.md

    Feature: [name]
    Batch: [N]
    Tasks: [NNN]-[name], [NNN]-[name]
    Task files: {process}/features/[feature]/tasks/
```

**Track your agents:**
```
Batch 1: agent_id = [id]
Batch 2: agent_id = [id]
```

**Spawn all wave agents in ONE message** (parallel tool calls).

### 3. Wait

Tell user: "Wave [N] running. [X] agents in background."

Stop. User says "continue" when ready.

### 4. Collect Results

`TaskOutput(task_id)` for each agent.

**Expected JSON from each agent:**
```json
{
  "batch": 1,
  "status": "done",
  "tasks": [{"id": "001", "tests_pass": true, "tests_required": 8, "tests_found": 8}],
  "confidence": {"overall": "high", "concerns": []}
}
```

**Verify test counts match:**
```bash
grep -c "describe.*AC-\|describe.*EC-\|describe.*ERR-" [test-file]
```

**If status = "done" and all tests pass:** Continue to review
**If status = "issues":** Resume agent with `Task tool` + `resume: [agent_id]`

### 5. Review Wave (Gemini)

Skip if ALL batches are S-complexity with passing tests.

```bash
gemini -p "$(cat << 'EOF'
Read: {process}/prompts/waves/REVIEWER-SUBAGENT-WAVE.md

Feature: [name]
Wave: [N]
Batches: [list]
Task files: {process}/features/[feature]/tasks/
EOF
)" --yolo
```

**Expected reviewer JSON:**
```json
{
  "wave": 1,
  "batches": [
    {"batch": 1, "verdict": "PASS"},
    {"batch": 2, "verdict": "NEEDS-CHANGES", "issues": [...]}
  ]
}
```

**If PASS:**
- Mark tasks `done` in plan
- Add `### Implementation Notes` to each task file (files changed, test count)
- Update `{process}/project/STATUS.md` (task counts, batch progress)
- Go to Step 6

**If NEEDS-CHANGES:**
1. Resume the implementer agent that wrote the code:
   ```
   Task tool:
     resume: [agent_id]
     prompt: |
       Review found issues:
       [paste issues from Gemini]

       Fix and verify tests pass.
   ```
2. After fix, re-run review (Step 5)

### 6. Next Wave

If batches remain:
- Identify newly unblocked batches
- Go to Step 2

If all done:
- Run integration audit (Step 7)

### 7. Integration Audit (Gemini)

```bash
gemini -p "$(cat << 'EOF'
Read: {process}/prompts/waves/INTEGRATION-AUDIT.md

Feature: [name]
Plan: {process}/features/[feature]/[name].plan.md
EOF
)" --yolo
```

**If PASS:** Update plan status → `needs-review`
**If NEEDS-CHANGES:** Fix and re-run

---

## Quick Reference

| What | Model | How |
|------|-------|-----|
| S-complexity impl | sonnet | Task tool, background |
| M-complexity impl | opus | Task tool, background |
| Critical impl | opus | Task tool, background |
| All reviews | gemini | CLI, synchronous |
| Fixes | resume original | Task tool with agent_id |

---

## Troubleshooting

**Agent resume fails:**
Spawn new agent with same model. Include context in prompt:
```
Previous agent couldn't be resumed.
Batch [N], Tasks: [list]
Issues to fix: [paste issues]
```

**Tests keep failing:**
Check if spec is ambiguous. Add to concerns in confidence field. Continue anyway if minor.

**Agent wants to skip tests:**
Invalid excuses: "CLI task", "just wiring", "tested indirectly", "hard to test".
Every AC/EC/ERR needs an explicit test. No exceptions.

**Gemini review times out:**
Re-run. If persistent, skip review for S-complexity batches.

**Circular dependencies in batches:**
Stop and ask user - plan needs restructuring.

---

## Execution Tracking

Maintain state as you go:

```
## Wave 1
| Batch | Model | Status | Review |
|-------|-------|--------|--------|
| 1 | sonnet | done | skip (S) |
| 2 | opus | done | PASS |

## Wave 2
| Batch | Model | Status | Review |
|-------|-------|--------|--------|
| 3 | opus | done | PASS |
```

---

## Before Finishing

- [ ] All waves complete
- [ ] All tasks marked done in plan
- [ ] `{process}/project/STATUS.md` updated
- [ ] Plan status → `needs-review`
