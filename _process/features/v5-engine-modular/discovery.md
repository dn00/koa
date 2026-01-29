# Discovery: V5 Engine Modularization

**Date:** 2026-01-28
**Status:** draft
**Author:** Discovery Agent

---

## Overview

### Problem Statement

The current V5 play engine (`scripts/play-v5.ts`) mixes game logic, state management, I/O, and presentation in a single 788-line file. This makes it difficult to:
1. Support different play modes (KOA Mini vs Advanced)
2. Plug in different puzzle packs
3. Reuse the engine for different frontends (CLI, Web, tests)
4. Eventually migrate to the proper `packages/engine-core` architecture

### Proposed Solution

Extract the V5 game engine into a modular structure with:
- Pure game logic functions (scoring, tiers, objection)
- Mode configuration (Mini vs Advanced presentation)
- Pluggable puzzle pack loading
- Thin CLI that delegates to the engine

### Success Criteria

1. Existing `play-v5.ts` commands work unchanged (backward compatible)
2. New `--mode mini` flag enables simplified KOA Mini presentation
3. Puzzles can be loaded from different sources (builtin, file, etc.)
4. Engine logic is testable in isolation

---

## Requirements

### Must Have (P0)

- **R1:** Mode System (Mini vs Advanced)
  - Rationale: KOA Mini spec requires hiding numeric mechanics while using same engine
  - Verification: Same card picks produce same tier in both modes (with scoring adjustment for no-objection in Mini)

- **R2:** Engine/Presentation Separation
  - Rationale: CLI should be thin adapter, engine should be reusable
  - Verification: Engine functions are pure (no I/O), presenter handles display

- **R3:** Pluggable Puzzle Packs
  - Rationale: Support multiple puzzle sources (builtin, file-based, remote)
  - Verification: Can load puzzles from builtin pack and from JSON file

- **R4:** Backward Compatibility
  - Rationale: Existing CLI usage must not break
  - Verification: All existing CLI flags work unchanged

### Should Have (P1)

- **R5:** Mini-Safe Dialogue Filtering
  - Rationale: Mini mode should not mention "score", "penalty", "type tax" etc.
  - Verification: Barks in Mini mode contain no mechanic-revealing terms

- **R6:** Narrative System Check (Mini)
  - Rationale: Mini still needs dramatic beat after card 2, just no scoring
  - Verification: Mini shows KOA bark after T2 but no stand/withdraw prompt

### Won't Have (this scope)

- Full integration into `packages/engine-core` (future work)
- Web UI implementation (this is CLI refactor only)
- New puzzle content creation
- Analytics or telemetry
- Tactic cards / deckbuilding (future: KOA Trials)
- KOA counter cards (future: KOA Trials)
- 5+ hearing runs (future: KOA Trials)
- Between-hearing drafting (future: KOA Trials)

### Future Extensibility (KOA Trials)

The full v5-design.md vision includes a roguelite deckbuilder with:
- **Tactic cards** - Player's deck (Signal/Control/Protect abilities)
- **KOA Counters** - Enemy cards played based on patterns
- **5 Hearings** per run (vs current 3 turns)
- **Drafting** between hearings
- **Standard vs Personal** modes (fixed vs custom deck)

**Design constraint:** Types and interfaces in this scope should be designed to accommodate these future additions without breaking changes. Specifically:
- GameConfig should support variable `turnsPerGame` (3, 5, 7)
- Turn processing should be extensible to include tactic card plays
- State should have room for player deck and KOA counter deck

### Future Feature: Banter System v2 (separate feature)

The banter-system.md spec describes a more sophisticated two-layer dialogue system:
- **Layer A (Library):** Slot/tag-driven structural lines (opening, pre-reveal bark, pattern callout, flag prompt, verdict)
- **Layer B (Card-specific):** LLM-generated `presentLine`, `koaQuipTruth`, `koaQuipLie`, `callbackNoun`
- **Statement Stitcher:** Maintains 2-3 "beats" that KOA can quote/callback
- **Safety rules:** Banlist for pre-reveal lines, fail-closed validation

**Current scope alignment:** Task 005 (dialogue tagging) lays groundwork by:
- Using slot/axis/valence/intensity tags (aligns with Layer A)
- Adding mini-safe filtering (needed for both Mini and full banter)
- Keeping puzzle-specific barks in `koaBarks` (aligns with Layer B pattern)

**Separate feature needed for:**
- CardDialogue schema with `koaQuipTruth`/`koaQuipLie` per card
- Statement stitcher with beats/callbacks
- Pre-reveal vs post-reveal dialogue separation
- Safety validation (banlist, no unplayed card references)

---

## Technical Analysis

### Existing Code

| File | Purpose | Relevance |
|------|---------|-----------|
| `scripts/play-v5.ts` | Main CLI (788 lines) | Primary refactor target |
| `scripts/v5-types.ts` | Types, GameConfig, presets | Extend with ModeConfig |
| `scripts/v5-rules.ts` | Scoring, tiers, objection | Already pure functions, reuse |
| `scripts/v5-dialogue.ts` | KOA barks, narration | Add mini-safe tags |
| `scripts/v5-puzzles.ts` | Hardcoded puzzles | Wrap as builtin pack |
| `scripts/prototype-v5.ts` | Validator | Use for testing Mini config |

### Components Affected

- `play-v5.ts` - Major refactor: extract engine, make thin
- `v5-types.ts` - Add ModeConfig, extend types
- `v5-dialogue.ts` - Add mini-safe tags to bark lines

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `v5-engine/engine.ts` | Core game flow orchestration |
| `v5-engine/types.ts` | ModeConfig, Result types, extended interfaces |
| `v5-engine/state.ts` | State creation, updates, derivation |
| `v5-engine/presentation.ts` | Mode-aware output formatting |
| `v5-engine/dialogue-filter.ts` | Mini-safe bark filtering |
| `v5-engine/puzzle-loader.ts` | Pluggable pack loading interface |
| `v5-packs/builtin-pack.ts` | Current puzzles wrapped as pack |
| `v5-packs/pack-schema.ts` | Pack validation |

### Dependencies

- No new external dependencies
- Internal: new modules depend on existing `v5-types.ts`, `v5-rules.ts`, `v5-dialogue.ts`

---

## Constraints

### Technical Constraints

- **Pure Functions:** Engine functions must have no side effects (I/O, randomness)
- **Result Types:** Adopt `Result<T, E>` pattern from engine-core for error handling
- **No Breaking Changes:** Existing CLI interface must work unchanged

### Design Constraints

- **Mini Per-Turn Feedback:** NO truth/lie indication per turn. KOA barks are **axis/pattern-level only** ("everything so far lives in logs", "your whole story is crammed into 5 minutes"). Player doesn't know if they picked a lie until verdict.
- **Mini Objection:** In Mini mode, objection is **auto-resolved internally** (KOA makes optimal risk-neutral choice). Player doesn't choose stand/withdraw, but +2/-4/-2 scoring still applies under the hood.
- **Mini System Check:** KOA delivers narrative "system check" bark after T2 for drama, but no player choice.
- **Bark Safety (from V3 lessons):** Mid-run barks must never identify specific cards as lies/safe. Stay at axis level to avoid dominant-strategy collapse.
- **Bark Families (from koa-mini-spec.md §6.1.4):** Barks should form T1→T2→T3 sequences per axis (channel reliance, timeline clustering, fact tension). Engine derives pattern keys from story so far, KOA picks most relevant family.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing CLI usage | Medium | High | Extensive backward compat testing |
| Mini dialogue filtering removes too many barks | Low | Medium | Audit all barks before filtering |
| Mode differences cause confusion | Low | Low | Clear documentation of mode differences |

---

## Open Questions

- [x] How should Mini handle objection? **Answer:** Auto-resolved (KOA makes optimal choice), scoring (+2/-4/-2) still applies, player doesn't choose
- [ ] Should Mini targets be auto-adjusted or manually tuned per puzzle?
- [ ] Should pack loader support remote URLs in this scope?

---

## References

- `_process/v5-design/impo/koa-mini-spec.md` - KOA Mini requirements
- `_process/v5-design/v5-design.md` - Full V5 design
- `_process/project/ARCHITECTURE.md` - Engine-core patterns to follow
- `packages/engine-core/src/types/` - Result types to adopt

---

## Next Steps

1. [x] Get discovery approved
2. [ ] Hand off to Planner for task breakdown
