# Task 001: Monorepo Setup

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation
**Complexity:** M
**Depends On:** none
**Implements:** (foundation task, enables all other tasks)

---

## Objective

Set up the monorepo structure with engine-core and app packages, TypeScript configuration, Vite, and Vitest so all subsequent tasks have a working development environment.

---

## Context

This is the first task. We're building a mobile-first PWA with a pure TypeScript game engine. The monorepo separates concerns: engine-core (pure logic, no DOM) and app (React UI).

### Relevant Files
- None yet (greenfield)
- Reference: `docs/source-files/kernel/` (Python patterns)

### Embedded Context

**Monorepo Structure (from ARCHITECTURE.md):**
```
packages/
├── engine-core/          # Pure TypeScript, no DOM
│   ├── src/
│   │   ├── types/
│   │   ├── resolver/
│   │   ├── validation/
│   │   └── index.ts
│   ├── tests/
│   └── package.json
│
└── app/                  # React PWA
    ├── src/
    │   ├── screens/
    │   ├── components/
    │   ├── stores/
    │   ├── services/
    │   └── main.tsx
    ├── public/
    └── package.json
```

**TypeScript Strict Mode (from PATTERNS.md):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Key Invariant (I1):**
- engine-core must have zero DOM dependencies
- No `any` types allowed

**Source Docs:**
- `_process/project/ARCHITECTURE.md` - Full structure
- `_process/project/PATTERNS.md` - Naming conventions

---

## Acceptance Criteria

### AC-1: Monorepo Root Configuration <- R1.1
- **Given:** Empty project directory
- **When:** Monorepo is initialized
- **Then:** Root package.json has workspaces: ["packages/*"]
- **Test Type:** unit (config validation)

### AC-2: engine-core Package <- (foundation)
- **Given:** Monorepo root exists
- **When:** engine-core package is created
- **Then:** packages/engine-core/ has package.json, tsconfig.json, src/index.ts, tests/
- **Test Type:** unit (build succeeds)

### AC-3: app Package <- (foundation)
- **Given:** Monorepo root exists
- **When:** app package is created
- **Then:** packages/app/ has package.json, vite.config.ts, src/main.tsx, public/
- **Test Type:** unit (dev server starts)

### AC-4: TypeScript Strict Mode <- (I1)
- **Given:** Both packages exist
- **When:** TypeScript compiles
- **Then:** Strict mode is enabled, no `any` types accepted
- **Test Type:** unit (compile with strict type error test)

### AC-5: Vitest Configured <- (foundation)
- **Given:** Both packages exist
- **When:** `npm test` runs
- **Then:** Tests execute for both packages
- **Test Type:** integration

### AC-6: Cross-Package Import <- (foundation)
- **Given:** engine-core exports a type
- **When:** app imports from @aura/engine-core
- **Then:** Import resolves correctly, type-checked
- **Test Type:** unit

### Edge Cases

#### EC-1: Path Alias Resolution
- **Scenario:** Import @aura/engine-core from app
- **Expected:** TypeScript and Vite both resolve correctly

### Error Cases

#### ERR-1: Invalid Import from engine-core
- **When:** engine-core tries to import React or DOM
- **Then:** Build fails with clear error
- **Error Message:** Cannot import browser APIs in engine-core

---

## Scope

### In Scope
- Root package.json with workspaces
- engine-core package skeleton (package.json, tsconfig, empty src/index.ts)
- app package skeleton (Vite, React, empty main.tsx)
- Shared tsconfig.base.json
- Vitest configuration (shared or per-package)
- Path aliases (@aura/engine-core, @/components, etc.)
- Basic .gitignore

### Out of Scope
- Actual domain types (Task 002)
- React components (later tasks)
- CI/CD configuration
- Deployment configuration

---

## Implementation Hints

- Use `npm init -w packages/engine-core` for workspace setup
- Vite with React plugin: `@vitejs/plugin-react`
- Consider pnpm or npm workspaces (implementer choice)
- engine-core tsconfig should exclude DOM libs
- Reference Python kernel structure for engine-core layout

---

## Definition of Done

- [ ] All acceptance criteria have passing tests
- [ ] Code follows project patterns
- [ ] No project doc violations
- [ ] Types are correct (no `any`)
- [ ] Self-review completed
- [ ] Ready for review

---

## Log

### Planning Notes
> Written by Planner

**Context:** This is the first task, blocking all others. Must be solid foundation.
**Decisions:**
- Chose workspaces over lerna/nx for simplicity
- Vitest over Jest for Vite integration
- engine-core must compile without DOM types
**Questions for Implementer:**
- Package manager preference? (npm, pnpm, bun)
- Any existing .gitignore preferences?

### Implementation Notes
> Written by Implementer

**Approach:**
**Decisions:**
**Deviations:**
**Files Changed:**
**Gotchas:**

### Review Notes
> Written by Reviewer

**Verdict:**
**AC Verification:**
| AC | Test | Pass |
|----|------|------|
| AC-1 | | |
| AC-2 | | |
| AC-3 | | |
| AC-4 | | |
| AC-5 | | |
| AC-6 | | |
**Issues:**
**Suggestions:**

### Change Log
> Append-only, chronological

- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | backlog | Planner | Created |
| 2026-01-26 | backlog | ready | Planner | No dependencies, ready for implementation |
