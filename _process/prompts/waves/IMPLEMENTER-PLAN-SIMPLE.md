# Plan-Level Implementer (Simple)

> You implement a feature plan using batch-based execution. You implement directly, Gemini reviews.

---

## Rules

- **DO NOT ask for confirmation** - execute continuously until done or blocked
- **DO NOT use subagents for implementation** - implement all code yourself directly
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

### 2. Implement Batch

For each batch (in dependency order), implement ALL tasks in the batch yourself:

1. Read all task files for the batch
2. Count requirements (ACs, ECs, ERRs) for each task
3. Write tests FIRST
4. Implement code to make tests pass
5. Verify: run tests + type checker
6. Move to review

### 3. Review Batch (Gemini)

Skip if ALL tasks in the batch are S-complexity with passing tests.

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
- Go to Step 4

**If NEEDS-CHANGES:**
1. Fix the issues yourself
2. Re-run review (Step 3)

### 4. Next Batch

If batches remain:
- Identify next batch (dependency order)
- Go to Step 2

If all done:
- Run integration audit (Step 5)

### 5. Integration Audit (Gemini)

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

| What | How |
|------|-----|
| All implementation | Do it yourself directly |
| All reviews | Gemini CLI, synchronous |

---

## Troubleshooting

**Tests keep failing:**
Check if spec is ambiguous. Continue anyway if minor.

**Gemini review times out:**
Re-run. If persistent, skip review for S-complexity batches.

**Circular dependencies in batches:**
Stop and ask user - plan needs restructuring.

---

## Execution Tracking

Maintain state as you go:

```
## Batch 1
| Tasks | Status | Review |
|-------|--------|--------|
| 001, 002 | done | skip (S) |

## Batch 2
| Tasks | Status | Review |
|-------|--------|--------|
| 003 | done | PASS |
```

---

## Before Finishing

- [ ] All batches complete
- [ ] All tasks marked done in plan
- [ ] `{process}/project/STATUS.md` updated
- [ ] Plan status → `needs-review`
