# Task Workflow

> How tasks move through the development pipeline

---

## Philosophy

**This is a semi-automated system.** Agents hand off to each other via documentation. The human oversees but only intervenes when necessary.

### Agent Responsibilities
- **Leave breadcrumbs** — Write notes so the next agent understands context
- **Update status** — Always update task status and history
- **Document decisions** — Explain WHY, not just what
- **Flag for human** — When stuck or unsure, mark blocked and explain

### Human Responsibilities
- **Review when flagged** — Agents mark `blocked` with questions
- **Approve proposals** — When agents need a judgment call
- **Kick off sessions** — Paste the right prompt, point at the right task
- **Spot check** — Periodically review done tasks

### The Paper Trail
Everything is recorded in task files. Any agent can read the history and understand:
- What was done
- Why decisions were made
- What problems were encountered
- What's left to do

---

## State Machine

```
                         ┌──────────────────────────────────────────────┐
                         │                                              │
backlog ───→ ready ───→ in-progress ───→ review ───→ reviewing ───→ done
   │           │              │             │             │             │
   │           │              │             │             ↓             │
   │           │              ←─────────────┴──── needs-changes         │
   │           │                                                        │
   └───────────┴─────────────→ blocked ←────────────────────────────────┘
```

**Note:** `reviewing` prevents duplicate reviews when multiple agents check for work.

---

## States

| State | Meaning | Who Owns |
|-------|---------|----------|
| `backlog` | Defined but missing deps or AC | Planner |
| `ready` | Has AC, deps met, waiting for dev | - |
| `in-progress` | Actively being worked on | Implementer |
| `review` | Code done, awaiting review | - |
| `reviewing` | Review in progress (claimed) | Reviewer |
| `needs-changes` | Review found issues | Implementer |
| `done` | Approved and complete | - |
| `blocked` | Cannot proceed | Anyone |

---

## Transitions

### Planner Transitions

| From | To | When |
|------|----|------|
| `backlog` | `ready` | Dependencies met AND acceptance criteria written |
| `blocked` | `ready` | Blocker resolved |

**Planner checklist before → ready:**
- [ ] All dependent tasks are `done`
- [ ] Acceptance criteria are written (Given/When/Then)
- [ ] Edge cases documented
- [ ] Error cases documented
- [ ] Relevant files identified

---

### Implementer Transitions

| From | To | When |
|------|----|------|
| `ready` | `in-progress` | Starting work |
| `in-progress` | `review` | Implementation complete |
| `in-progress` | `blocked` | Cannot proceed |
| `needs-changes` | `review` | Issues fixed |

**Implementer checklist before → review:**
- [ ] All acceptance criteria have tests
- [ ] All tests pass (`bun test`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] Code follows patterns
- [ ] Implementation notes written
- [ ] No TODO comments (or tracked)

---

### Reviewer Transitions

| From | To | When |
|------|----|------|
| `review` | `reviewing` | Starting review (claim task) |
| `reviewing` | `done` | All checks pass |
| `reviewing` | `needs-changes` | Issues found |

**Reviewer checklist for → done:**
- [ ] Every AC has a corresponding test
- [ ] All tests pass
- [ ] Type check passes
- [ ] No invariant violations
- [ ] **No "Critical" or "Should fix" action items**
- [ ] Review notes written

**For → needs-changes:**
- Any "Critical" or "Should fix" items exist
- List action items with `file:line` references
- Prioritize: Critical → Should fix → Consider

---

## Task File Status Section

Every task file has a status section at the top:

```markdown
**Status:** ready
**Assignee:** -
**Blocked By:** -
```

And a status history at the bottom:

```markdown
## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2025-01-20 | backlog | ready | Planner | AC complete |
```

---

## Blocked Tasks

When blocking a task:

1. Set status to `blocked`
2. Fill in `Blocked By:` field with:
   - Task ID if blocked by another task
   - Description if blocked by external factor
3. Add entry to Status History with reason

When unblocking:
1. Resolve the blocker
2. Set status back to previous state (usually `ready`)
3. Clear `Blocked By:` field
4. Add entry to Status History

---

## Parallel Work

Multiple tasks can be worked simultaneously IF:
- They have no dependencies on each other
- Different people/agents work on them

**Good:**
```
Task 001 (ready) → Agent A starts
Task 003 (ready) → Agent B starts    // No dependency
```

**Bad:**
```
Task 001 (ready) → Agent A starts
Task 002 (ready) → Agent B starts    // Depends on 001!
```

---

## Handoff Messages

### Planner → Implementer

```
Task [XXX] is ready for implementation.

Start a new session and paste:
_process/prompts/IMPLEMENTER.md

Then say:
"Implement task XXX from MVP"

Task file: _process/features/mvp/tasks/XXX-name.md
```

### Implementer → Reviewer

```
Task [XXX] is ready for review.

Start a new session and paste:
_process/prompts/REVIEWER.md

Then say:
"Review task XXX from MVP"

Task file: _process/features/mvp/tasks/XXX-name.md
Files changed:
- path/to/file1.ts
- path/to/file2.ts
```

### Reviewer → Implementer (needs-changes)

```
Task [XXX] needs changes.

Issues found:
1. [Issue summary]
2. [Issue summary]

Start a new session and paste:
_process/prompts/IMPLEMENTER.md

Then say:
"Fix issues in task XXX from MVP"

Task file: _process/features/mvp/tasks/XXX-name.md
See Review Notes section for details.
```

### Reviewer → Next Task (done)

```
Task [XXX] is DONE.

Next ready tasks:
- Task YYY: [name]
- Task ZZZ: [name]

To continue, start a new session and paste:
_process/prompts/IMPLEMENTER.md

Then say:
"Implement task YYY from MVP"
```

---

## Status Dashboard

The plan.md file should have a dashboard at the top:

```markdown
## Status Dashboard

| Status | Count | Tasks |
|--------|-------|-------|
| done | 2 | 001, 003 |
| reviewing | 1 | 005 |
| in-progress | 1 | 004 |
| ready | 3 | 006, 007, 008 |
| blocked | 0 | - |
| backlog | 17 | ... |

**Next up:** Task 006 - Artifact Store
```

Update this dashboard when phases complete (not every task).

---

## Agent Communication

Agents communicate through **task file sections**. This creates a permanent record.

### Task File Sections for Communication

```markdown
---

## Log

### Planning Notes
> Written by Planner when creating/updating task

**Context:** Why this task exists, what problem it solves
**Decisions:** Any scope decisions made during planning
**Questions for Implementer:** Things to consider
**Deferred:** Things explicitly NOT in this task

### Implementation Notes
> Written by Implementer during/after implementation

**Approach:** How the solution works
**Decisions:** Technical choices and rationale
**Deviations:** Anything different from the spec (and why)
**Files Changed:**
- `path/to/file.ts` — what changed
**Gotchas:** Things the reviewer should pay attention to
**Questions for Reviewer:** Anything uncertain

### Review Notes
> Written by Reviewer during review

**Verdict:** PASS | NEEDS-CHANGES | PASS WITH COMMENTS
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | test name | ✓ |
**Issues:** (if needs-changes)
1. [file:line] Issue description — how to fix
**Suggestions:** (if pass with comments)
**What's Good:** Positive feedback

### Change Log
> Append-only log of significant events

- 2025-01-20 14:30 [Planner] Created task, ready for implementation
- 2025-01-20 16:00 [Implementer] Started work
- 2025-01-20 18:30 [Implementer] Hit issue with X, see Implementation Notes
- 2025-01-21 10:00 [Implementer] Resolved, submitting for review
- 2025-01-21 11:00 [Reviewer] Found 2 issues, needs changes
- 2025-01-21 14:00 [Implementer] Fixed issues
- 2025-01-21 15:00 [Reviewer] Approved

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2025-01-20 | backlog | ready | Planner | AC complete |
| 2025-01-20 | ready | in-progress | Implementer | Starting |
```

### What to Write

**Planner writes:**
- Why the task exists
- Scope boundaries (in/out)
- Hints for the implementer
- Questions that came up during planning

**Implementer writes:**
- Technical approach taken
- Why certain decisions were made
- Anything that deviated from spec
- List of files changed
- Warnings for reviewer

**Reviewer writes:**
- AC verification table
- Specific issues with file:line references
- How to fix issues
- Positive feedback (what was done well)

### Flagging for Human

When an agent needs human input:

1. Set status to `blocked`
2. In Change Log: `[Agent] NEEDS HUMAN: <question>`
3. In Blocked By: `Human decision needed: <summary>`

Example:
```markdown
**Status:** blocked
**Blocked By:** Human decision needed: Should we use library X or Y?

### Change Log
- 2025-01-20 [Implementer] NEEDS HUMAN: Found two libraries that could work.
  Option A: faster but less maintained
  Option B: slower but official
  Need guidance on which to use.
```

Human resolves by:
1. Adding decision to Change Log
2. Updating status back to previous state
3. Optionally adding to Planning Notes for context

---

## Quick Reference

```
backlog ──[AC written, deps met]──→ ready
ready ──[claimed]──→ in-progress
in-progress ──[code done]──→ review
review ──[claimed]──→ reviewing
reviewing ──[approved]──→ done
reviewing ──[issues]──→ needs-changes
needs-changes ──[fixed]──→ review
any ──[stuck]──→ blocked
blocked ──[resolved]──→ previous state
```
