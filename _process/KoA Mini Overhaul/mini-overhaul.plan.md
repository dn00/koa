# Plan: KOA Mini Axis Overhaul v1 Lite

**Discovery:** `mini-overhaul.md` (this IS the discovery — comprehensive spec)
**Status:** planning

---

## Overview

Add composition-level depth to Mini through 3 axes (Coverage, Independence, Concern) + Natural Focus via KOA barks, achieving 7/7 puzzle principles while keeping Mini simple and fair.

**Key deliverables:**
- New card tags: `factTouch`, `signalRoot`, `controlPath`, `claimShape`, `subsystem`
- New lie tags: `trapAxis`, `baitReason`
- Concern computation with 3-of-3 hit semantics
- T2 suspicion line + subtitle (Natural Focus)
- Final Audit panel (Coverage / Independence / Concern)
- Ceiling explanation for CLEARED-not-FLAWLESS
- Updated validator with P4+ constraint
- Mini Lite tiering (separate from V5 Belief)

---

## Requirements Expansion

### From Spec §0: Definition of Done

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R0.1 | Mini feels like "Pick 3, KOA reacts, outcome" | Manual playtest | All |
| R0.2 | Turn 3 flow: Commit → Processing → Final Audit → Reveal | E2E test | 701, 702, 703 |
| R0.3 | No mid-run bark reveals truth/lie | Bark content audit | 601, 602 |
| R0.4 | All 3 truths ⇒ ≥ CLEARED (fairness clamp) | Validator simulation | 401, 501 |
| R0.5 | Concern affects FLAWLESS only, never CLEARED | Unit test tiering | 301, 302 |

### From Spec §1: Phase 0 Cleanups

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Replace "Verdict" → "Outcome" in UI | Grep for "verdict" returns 0 | 001 |
| R1.2 | Replace "VerdictScreen" → "ResultScreen" | File renamed, imports updated | 001 |
| R1.3 | No timestamps in Mini cards (`time: ''` or omitted) | Validator check V6 | 401 |

### From Spec §2: Data Model

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Card has `factTouch: 1 | 2 | 3` (scalar) | TypeScript compile | 101 |
| R2.2 | Card has `signalRoot: SignalRoot` enum | TypeScript compile | 101 |
| R2.3 | Card has `controlPath: ControlPath` enum | TypeScript compile | 101 |
| R2.4 | Card has `claimShape: ClaimShape` enum | TypeScript compile | 101 |
| R2.5 | Card has `subsystem: string` | TypeScript compile | 101 |
| R2.6 | Lie has `trapAxis: TrapAxis` enum | TypeScript compile | 102 |
| R2.7 | Lie has `baitReason: string` | TypeScript compile | 102 |
| R2.8 | `SignalRootGroup` derivation table exists | Unit test | 103 |

### From Spec §3: Axes

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | `computeCoverage(cards)` returns complete/gap | Unit test | 201 |
| R3.2 | `computeIndependence(cards)` returns diverse/correlated_strong/correlated_weak | Unit test | 202 |
| R3.3 | `computeConcern(card1, card2)` returns Concern with correct priority | Unit test | 203 |
| R3.4 | `matchesConcern(card, concern)` returns boolean | Unit test | 203 |
| R3.5 | Concern payload stores `root` for `same_system` | Unit test | 203 |
| R3.6 | Concern hit = 3-of-3 (all cards match dimension) | Unit test | 204 |
| R3.7 | Concern avoided = 2-of-3 (T3 diversified) | Unit test | 204 |
| R3.8 | `no_concern` ⇒ concernHit=false, concernAvoided=true | Unit test | 204 |

### From Spec §5: Tiering

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Mini uses Lite mapping, not V5 Belief | Config check | 301 |
| R5.2 | 2 truths + 1 lie ⇒ CLOSE | Unit test | 302 |
| R5.3 | 1 truth + 2 lies ⇒ BUSTED | Unit test | 302 |
| R5.4 | All truths + concernHit ⇒ CLEARED | Unit test | 302 |
| R5.5 | All truths + correlated (non-same_system) ⇒ CLEARED | Unit test | 302 |
| R5.6 | All truths + diverse + diversified ⇒ FLAWLESS | Unit test | 302 |
| R5.7 | Overlap rule: same_system ⇒ Independence display-only | Unit test | 302 |

### From Spec §7: Validator

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Validate all cards have required tags | Validator output | 401 |
| R7.2 | Validate `signalRoot` is from enum | Validator output | 401 |
| R7.3 | Validate `factTouch` is scalar 1/2/3 | Validator output | 401 |
| R7.4 | Validate 3 truths form perfect partition | Validator output | 402 |
| R7.5 | Validate each fact touched by ≥2 cards | Validator output | 402 |
| R7.6 | Validate each lie has `trapAxis` + `baitReason` | Validator output | 403 |
| R7.7 | Validate ≥2 distinct `trapAxis` across lies | Validator output | 403 |
| R7.8 | Validate P4 constraint (concern matches truth) | Validator output | 404 |
| R7.9 | Validate P4+ constraint (dangerous info dilemma) | Validator output | 404 |
| R7.10 | Simulate all 20 selections, confirm 1 all-truths | Validator output | 405 |
| R7.11 | Simulate all-truths in all 6 orders ⇒ ≥ CLEARED | Validator output | 405 |

### From Spec §4+§6: Barks & Natural Focus

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | T2 suspicion line templates exist (12 concernKeys) | File exists | 601 |
| R6.2 | T2 subtitle templates exist (12 concernKeys) | File exists | 601 |
| R6.3 | Final Audit templates exist | File exists | 602 |
| R6.4 | Ceiling explanation templates exist | File exists | 602 |
| R6.5 | T3 barks are closing-energy only | Content audit | 603 |
| R6.6 | Suspicion barks reference only dimension labels | Content audit | 601 |

### From Spec §5: UI

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | T2 displays suspicion line + subtitle after sequence bark | E2E test | 701 |
| R8.2 | T3 shows "Processing..." beat | E2E test | 702 |
| R8.3 | Final Audit panel displays 3 lines | E2E test | 702 |
| R8.4 | Result screen shows ceiling explanation when applicable | E2E test | 703 |
| R8.5 | Final Audit visible 2-4 seconds | E2E test | 702 |

### From Spec §10: Content

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | Thermostat puzzle has all new tags | Validator passes | 801 |
| R9.2 | Thermostat puzzle satisfies P4+ constraint | Validator passes | 801 |
| R9.3 | Puzzle generator prompt updated | Doc review | 802 |

---

## Dependency Graph

```
Phase 0 (Cleanup):
  001 (Rename VerdictScreen) ──→ [no deps]

Phase 1 (Types):
  101 (Card types) ──→ [no deps]
  102 (Lie types) ──→ [no deps]
  103 (SignalRootGroup) ──→ 101

Phase 2 (Axis Logic):
  201 (Coverage) ──→ 101
  202 (Independence) ──→ 103
  203 (Concern compute) ──→ 101
  204 (Concern hit test) ──→ 203

Phase 3 (Tiering):
  301 (Mini Lite config) ──→ 201, 202, 204
  302 (Tiering logic) ──→ 301

Phase 4 (Validator):
  401 (Tag checks) ──→ 101, 102
  402 (Partition checks) ──→ 401
  403 (Lie trap checks) ──→ 401
  404 (P4+ checks) ──→ 203, 402
  405 (Fairness simulation) ──→ 302, 404

Phase 5 (Store):
  501 (Concern state + axis + outcome) ──→ 201, 202, 203, 204, 302
  502 (T2 suspicion logic) ──→ 501, 601

Phase 6 (Bark Templates):
  601 (Suspicion templates) ──→ [no deps]
  602 (Audit templates) ──→ [no deps]
  603 (T3 bark audit) ──→ [no deps]

Phase 7 (UI):
  701 (T2 suspicion display) ──→ 502, 601
  702 (Final Audit panel) ──→ 501, 602
  703 (Result screen update) ──→ 001, 302, 501, 602, 702

Phase 8 (Content):
  801 (Update thermostat puzzle) ──→ 401, 402, 403, 404
  802 (Update puzzle prompt) ──→ 401

Phase 9 (Integration):
  901 (Wire game flow) ──→ 701, 702, 703
  902 (E2E test) ──→ 901
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001, 101, 102, 601, 602, 603 | M | - | Foundation: cleanup, types, templates |
| 2 | 103, 201, 202, 203 | M | Batch 1 | Core axis logic |
| 3 | 204, 301 | M | Batch 2 | Concern hit test, Mini config |
| 4 | 302, 401, 402, 403 | M | Batch 3 | Tiering, validator basics |
| 5 | 404, 405, 501 | M | Batch 4 | P4+ validation, store |
| 6 | 502, 701, 702, 703 | M | Batch 5 | UI components |
| 7 | 801, 802 | S | Batch 4 | Content updates |
| 8 | 901, 902 | M | Batch 6, 7 | Integration |

---

## Task Summary

| ID | Name | Complexity | Status | Phase |
|----|------|------------|--------|-------|
| 001 | Rename VerdictScreen + vocabulary cleanup | S | backlog | 0 |
| 101 | Add Card v1 Lite fields | M | backlog | 1 |
| 102 | Add Lie v1 Lite fields | S | backlog | 1 |
| 103 | Add SignalRootGroup derivation | S | backlog | 1 |
| 201 | Implement computeCoverage | S | backlog | 2 |
| 202 | Implement computeIndependence | S | backlog | 2 |
| 203 | Implement computeConcern | M | backlog | 2 |
| 204 | Implement concern hit test | S | backlog | 2 |
| 301 | Add Mini Lite mode config | S | backlog | 3 |
| 302 | Implement Mini Lite tiering | M | backlog | 3 |
| 401 | Validator: tag presence checks | M | backlog | 4 |
| 402 | Validator: factTouch partition checks | S | backlog | 4 |
| 403 | Validator: lie trap checks | S | backlog | 4 |
| 404 | Validator: P4+ constraint | M | backlog | 4 |
| 405 | Validator: fairness simulation | M | backlog | 4 |
| 501 | Add concern state + axis + outcome to game store | M | backlog | 5 |
| 502 | Implement T2 suspicion logic in store | M | backlog | 5 |
| 601 | Create suspicion bark templates | S | backlog | 6 |
| 602 | Create Final Audit + ceiling templates | S | backlog | 6 |
| 603 | Audit T3 barks for closing-energy | S | backlog | 6 |
| 701 | Implement T2 suspicion display | M | backlog | 7 |
| 702 | Implement Final Audit panel | M | backlog | 7 |
| 703 | Update Result screen with ceiling | M | backlog | 7 |
| 801 | Update thermostat puzzle with new tags | M | backlog | 8 |
| 802 | Update puzzle generator prompt | M | backlog | 8 |
| 901 | Wire complete game flow | M | backlog | 9 |
| 902 | End-to-end integration test | M | backlog | 9 |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| P4+ constraint too restrictive | Medium | High | Tune validator, allow puzzle regeneration |
| T2 bark gets too long | Low | Medium | Keep suspicion line ≤15 words |
| Final Audit feels like loading screen | Medium | Medium | Add micro-animation, keep to 2s |
| Existing puzzles break | High | High | Update thermostat puzzle first as template |

---

## Open Questions

None — spec is comprehensive.

---

## Files Touched (Summary)

### engine-core
- `packages/engine-core/src/types/v5/card.ts` — add fields
- `packages/engine-core/src/types/v5/enums.ts` — add enums
- `packages/engine-core/src/types/v5/index.ts` — export new types
- NEW: `packages/engine-core/src/resolver/v5/coverage.ts`
- NEW: `packages/engine-core/src/resolver/v5/independence.ts`
- NEW: `packages/engine-core/src/resolver/v5/concern.ts`
- `packages/engine-core/src/resolver/v5/tier.ts` — Mini Lite tiering
- `packages/engine-core/src/packs/generated-puzzle.ts` — add tags

### app-svelte
- RENAME: `VerdictScreen.svelte` → `ResultScreen.svelte`
- `packages/app-svelte/src/lib/stores/game.ts` — concern state
- `packages/app-svelte/src/lib/components/BarkPanel.svelte` — T2 suspicion
- NEW: `packages/app-svelte/src/lib/components/FinalAuditPanel.svelte`
- `packages/app-svelte/src/lib/components/RunScreen.svelte` — wire audit

### scripts
- `scripts/prototype-v5.ts` — all new validator checks
- `scripts/v5-types.ts` — type updates

### docs
- `_process/context/koa-mini-puzzle-prompt.md` — update
