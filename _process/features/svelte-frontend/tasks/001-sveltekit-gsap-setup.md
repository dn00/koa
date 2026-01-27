# Task 001: SvelteKit + GSAP Project Setup

**Status:** ready
**Assignee:** -
**Blocked By:** -
**Phase:** Foundation
**Complexity:** M
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R1.5

---

## Objective

Create `packages/app-svelte` SvelteKit project with GSAP, TypeScript strict mode, Vitest, and D27 color tokens.

---

## Context

Foundation task. We're building a Svelte frontend alongside the existing React app. Engine-core (pure TypeScript) must be importable.

### Relevant Files
- `packages/engine-core/` — Must be importable
- `docs/D27-VISUAL-STYLE-SPEC.md` — Color token definitions

### Embedded Context

**Package Structure:**
```
packages/app-svelte/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── services/
│   │   └── styles/
│   │       └── tokens.css
│   ├── routes/
│   │   └── +page.svelte
│   └── app.html
├── static/
├── tests/
├── svelte.config.js
├── vite.config.ts
└── package.json
```

**D27 Color Tokens:**
```css
--bg-base, --bg-panel, --bg-card
--text-primary, --text-secondary, --text-muted
--accent-calm    /* verified, success */
--accent-warn    /* sketchy, risk */
--accent-danger  /* audit, high scrutiny */
--accent-info    /* routine info */
--border-default, --border-strong, --border-dashed
--shadow-soft, --shadow-raised
```

**GSAP Plugins:** `gsap`, `@gsap/flip`

**Monorepo Import:**
```typescript
import type { EvidenceCard } from '@hsh/engine-core';
import { deriveState } from '@hsh/engine-core';
```

---

## Acceptance Criteria

### AC-1: SvelteKit Project ← R1.1
- **Given:** Empty directory
- **When:** Project scaffolded
- **Then:** `svelte.config.js` exists, TypeScript strict mode enabled
- **Test Type:** build

### AC-2: GSAP Working ← R1.2
- **Given:** GSAP installed
- **When:** Importing gsap and Flip in a component
- **Then:** Can create tween that animates element
- **Test Type:** unit

### AC-3: Engine-Core Imports ← R1.3
- **Given:** Workspace configured
- **When:** Importing from `@hsh/engine-core`
- **Then:** Types resolve, no build errors
- **Test Type:** unit

### AC-4: Vitest Configured ← R1.4
- **Given:** Vitest + @testing-library/svelte installed
- **When:** Running `npm test`
- **Then:** Tests run in jsdom, can test Svelte components
- **Test Type:** integration

### AC-5: CSS Tokens ← R1.5
- **Given:** `tokens.css` with D27 tokens
- **When:** Imported in app
- **Then:** All semantic tokens available as CSS variables
- **Test Type:** unit

### AC-6: SPA Mode ← R1.1
- **Given:** SvelteKit configured with adapter-static
- **When:** Building
- **Then:** SSR disabled, runs as SPA
- **Test Type:** build

### Edge Cases

#### EC-1: GSAP SSR
- **Scenario:** GSAP accessed during build
- **Expected:** No error (SPA mode, no SSR)

---

## Scope

### In Scope
- SvelteKit scaffold with TypeScript strict
- GSAP core + Flip plugin
- Vitest + testing-library/svelte
- CSS custom properties (placeholder values OK)
- Workspace config for engine-core
- Smoke test component

### Out of Scope
- Actual game components
- Services, stores (later tasks)

---

## Implementation Hints

1. Use `adapter-static` for SPA
2. Add `ssr: false` in `+layout.ts`
3. Use `onMount` for GSAP (DOM must be ready)
4. Vitest needs `environment: 'jsdom'`

---

## Definition of Done

- [ ] `npm run dev` starts
- [ ] `npm run build` completes
- [ ] `npm run check` passes
- [ ] `npm test` passes
- [ ] GSAP tween works in browser
- [ ] Engine-core types importable

---

## Log

### Planning Notes
**Context:** Foundation enabling all subsequent work.
**Decisions:** adapter-static for SPA (GSAP SSR issues). Vitest over Jest (Vite compat).

### Change Log
- 2026-01-26 [Planner] Task created

---

## Status History

| Date | From | To | By | Notes |
|------|------|----|----|-------|
| 2026-01-26 | - | ready | Planner | Created |
