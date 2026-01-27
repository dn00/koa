# AI-Driven Development Process

> A semi-automated development process where AI agents hand off work to each other via documentation.

---

## Philosophy

**Agents communicate through files, not chat.** Each agent reads context from docs, does its work, writes notes, and hands off to the next agent. The human oversees and intervenes only when needed.

---

## Structure

```
_process/
├── README.md           # This file (process overview)
├── WORKFLOW.md         # Task states, transitions, communication
│
├── prompts/            # Agent prompts (paste to start a session)
│   ├── MASTER-PROMPT.md    # Orchestrator
│   ├── DISCOVERY.md        # Requirements gathering
│   ├── PLANNER.md          # Task breakdown
│   ├── IMPLEMENTER.md      # Code & tests
│   ├── REVIEWER.md         # Code review
│   └── GIT-MAINTAINER.md   # Commit organization (utility)
│
├── project/            # Project-specific knowledge (created by Discovery)
│   ├── ARCHITECTURE.md     # System structure (required)
│   ├── INVARIANTS.md       # Rules that must never break (required)
│   ├── STATUS.md           # Project dashboard (required)
│   ├── PATTERNS.md         # Coding conventions (optional)
│   └── [DOMAIN].md         # Domain-specific docs (optional)
│
└── features/           # Feature work
    └── [feature-name]/
        ├── discovery.md
        ├── plan.md
        └── tasks/
            └── NNN-name.md
```

---

## Workflow

```
Discovery → Planner → Implementer → Reviewer → Done
                          ↑             ↓
                          ←── needs-changes
```

### Task States

```
backlog → ready → in-progress → review → done
                       ↓           ↓
                    blocked    needs-changes
```

### Who Does What

| Agent | Transitions | Outputs |
|-------|-------------|---------|
| Discovery | (creates features) | `discovery.md` |
| Planner | backlog→ready | `plan.md`, task files |
| Implementer | ready→in-progress→review | Code, tests |
| Reviewer | review→done/needs-changes | Verdict |

---

## Starting a Session

### Use Master Prompt (recommended)
```
Paste: _process/prompts/MASTER-PROMPT.md
Say: "Continue work" or "Start feature X"
```

### Or go direct to an agent
```
Paste: _process/prompts/IMPLEMENTER.md
Say: "Implement task 001 from mvp"
```

---

## Agent Communication

Agents leave notes in task files:

- **Planning Notes** — Planner → Implementer
- **Implementation Notes** — Implementer → Reviewer
- **Review Notes** — Reviewer → Implementer (if needs-changes)
- **Change Log** — Append-only history
- **Status History** — Track state transitions

See `WORKFLOW.md` for full details.

---

## Utility Agents

These agents are **not part of the state machine** — invoke them anytime:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **Git Maintainer** | Organize commits | When you have mixed uncommitted changes |

```
Paste: _process/prompts/GIT-MAINTAINER.md
Say: "Organize my commits"
```

The Git Maintainer reads plan docs and git status (not code files) to group changes into logical commits.

---

## Human Intervention

Agents flag for human by:
1. Setting status to `blocked`
2. Adding `NEEDS HUMAN: [question]` to Change Log

Human resolves by adding decision to Change Log and unblocking.

---

## Setting Up for a New Project

1. Copy this `_process/` folder to your project
2. Run Discovery agent to create project docs:

**Required docs (Discovery creates these):**
- `project/ARCHITECTURE.md` — System structure
- `project/INVARIANTS.md` — Rules that must never break
- `project/STATUS.md` — Project dashboard

**Optional docs (create if relevant):**
- `project/PATTERNS.md` — Coding conventions
- `project/[DOMAIN].md` — Domain-specific (e.g., DETERMINISM.md, SECURITY.md)

---

## Quick Commands

```bash
bun test                    # Run tests
bun run typecheck           # Type check
```
