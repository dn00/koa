# Plan: V5 Docs Update

**Date:** 2026-01-28
**Status:** active
**Complexity:** Simple (no discovery needed)

---

## Overview

Update project documentation to reflect V5 domain model. The MVP model (EvidenceCard, Concern, Scrutiny, resistance) is replaced by V5 (Card, belief, objection, Tier).

**Scope:** Documentation only. No code changes.

---

## What Changed (MVP → V5)

| Concept | MVP | V5 |
|---------|-----|-----|
| Cards | `EvidenceCard` with power, proves, claims | `Card` with strength, evidenceType, claim, isLie |
| Health | `resistance` (damage reduces it) | `belief` (evidence increases it toward target) |
| Risk | `scrutiny` (escalates on mistakes) | Built into lie penalty (-5 belief) |
| Goals | `concerns` (must address) | None (just reach belief target) |
| Enemy | `counters` (must refute) | `objection` (stand by or withdraw) |
| Outcome | `RunStatus` (WON/LOST) | `Tier` (FLAWLESS/CLEARED/CLOSE/BUSTED) |
| State | Event-sourced via `deriveState()` | Event-sourced via `deriveV5State()` (I4 preserved) |
| Turns | 1-3 cards per turn | 1 card per turn, 3 turns total |

---

## Requirements

| ID | Requirement | Doc | Tasks |
|----|-------------|-----|-------|
| R1 | Update ARCHITECTURE.md for V5 domain model | ARCHITECTURE.md | 001 |
| R2 | Update ARCHITECTURE.md data flow diagram | ARCHITECTURE.md | 001 |
| R3 | Update INVARIANTS.md examples for V5 | INVARIANTS.md | 002 |
| R4 | Confirm I4 (event sourcing) still applies | INVARIANTS.md | 002 |
| R5 | Update PATTERNS.md for V5 patterns | PATTERNS.md | 003 |
| R6 | Remove/update MVP-specific patterns | PATTERNS.md | 003 |

---

## Tasks

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Update ARCHITECTURE.md | S | backlog |
| 002 | Update INVARIANTS.md | S | backlog |
| 003 | Update PATTERNS.md | S | backlog |

---

## Dependency Graph

```
001 ─┐
002 ─┼─→ (all independent, can run in parallel)
003 ─┘
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001, 002, 003 | - | All independent, run together |

---

## Test Count

N/A - documentation only, no tests required.

---

## Blocked By

This feature should run AFTER `app-v5-migration` is complete, so docs reflect final implementation.
