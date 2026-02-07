# Plan: Keystone Variety — CaseManifest + Liar Models + Gossip Slicing + WC18 Metrics

**Status:** planning
**Discovery:** Inline (gameplay + diagnostics analysis)
**North Star:** WC18 — Mystery-Specific Proofs (Solvability / Uniqueness)

---

## Overview

Every case currently solves identically: culprit STAY claim vs device log → COMPARE → win.
`deriveCulpritAlibiClaim()` runs unconditionally and always generates the same keystone shape.
Twists are additive noise, not structural alternatives. `DIFFICULTY_PROFILES` is a flat config
with 4 knobs (tier, puzzleDifficulty, deviceGaps, twistRules) consumed by hardcoded switches.

This plan introduces a **CaseManifest** (modeled on project-paranoia's RunManifest) as a
declarative "case bible" that parameterizes all variety axes. The manifest replaces
`DIFFICULTY_PROFILES` and centralizes liar model weights, twist weights, coverage profiles,
gossip slicing, and twist-liar constraints into one data structure.

Additionally, this plan adds **WC18-derived solvability metrics** to the diagnostics and finder
scoring, including: collision diversity (Cdiv), collision timing (CT), orthogonality (OR),
paperwork score (PS), and axis uniqueness for WHO (AU). These metrics validate that variety
improvements actually produce better-feeling cases, and serve as finder scoring inputs to
**schedule diversity across consecutive daily puzzles**.

WHY becomes a real deduction axis — motive is no longer free information from a single gossip
call. The player must cross-reference gossip with evidence to confirm motive, creating a second
"aha moment" per case.

Phase 1 ships: manifest + 3 liar models + gossip slicing + WC18 metrics.
Future phases plug in: case shapes, technique tiers, new settings — all as manifest templates.

---

## Architecture: CaseManifest

```typescript
export type LiarModel = 'confident_lie' | 'omission' | 'misremember';
export type KeystoneKind = 'contradiction' | 'testimony_gap' | 'timeline_mismatch';
export type CoverageProfile = 'full' | 'partial' | 'sparse';

export interface CaseManifest {
    templateId: string;

    // Solve path weights (normalized at runtime for weighted RNG selection)
    liarWeights: Partial<Record<LiarModel, number>>;

    // Twist weights ('none' = no twist)
    twistWeights: Partial<Record<TwistType | 'none', number>>;

    // Twist → allowed liar models (forbidden = omitted from array)
    twistLiarConstraints: Partial<Record<TwistType, LiarModel[]>>;

    // Evidence information regime
    evidenceOverrides?: {
        gossipSliceSize?: number;        // items per gossip interview (default: Infinity = all)
        coverageProfile?: CoverageProfile;
        deviceGaps?: number;             // non-crime-window sensor gaps
    };

    // Difficulty band (for validators)
    difficultyTargets?: {
        minAP?: number;
        maxAP?: number;
        minContradictions?: number;
        maxContradictions?: number;
        minBranching?: number;
    };
}
```

### Scenario Templates (replace DIFFICULTY_PROFILES)

```typescript
TEMPLATE_TUTORIAL:  // Tier 1 — no twists, no liar model, full coverage, all gossip
TEMPLATE_STANDARD:  // Tier 2 — confident_lie only, false_alibi twist, full coverage, all gossip
TEMPLATE_VARIED:    // Tier 3 — mixed liar models, mixed twists, partial coverage, gossip sliced to 4
TEMPLATE_EXPERT:    // Tier 4 — full liar variety, all twists, sparse coverage, gossip sliced to 3
```

### Manifest Threading

Manifest selected by tier in `simulate()`. Stored in `CaseConfig.manifest`.
Consumed by: `maybeGenerateTwist()`, `deriveCulpritAlibiClaim()`, `deriveGossip()`,
`analyzeSignal()`, `scoreDailyCandidate()`.

---

## Requirements Expansion

### From R1: CaseManifest as foundation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | `CaseManifest` interface with all fields above | Type exists, compiles | 001 |
| R1.2 | `LiarModel`, `KeystoneKind`, `CoverageProfile` types | Types exist | 001 |
| R1.3 | 4 scenario templates replacing `DIFFICULTY_PROFILES` | Templates defined, backward-compatible tier mapping | 001 |
| R1.4 | `CaseConfig` extended with `liarModel`, `keystoneKind`, `manifest` | Fields present, optional | 001 |
| R1.5 | `SignalType` extended with `testimony_gap`, `timeline_mismatch` | Types exist | 001 |
| R1.6 | `ClaimType` extended with `GAP` | Type exists | 001 |
| R1.7 | `DIFFICULTY_PROFILES` deprecated, templates used instead | sim.ts reads from manifest | 001 |

### From R2: Conditional alibi derivation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | `confident_lie` → current behavior (false STAY claim) | Existing tests pass | 002 |
| R2.2 | `omission` → no STAY claim; generates `GAP` testimony | No STAY in evidence, GAP present | 002 |
| R2.3 | `misremember` → STAY claim with shifted window or adjacent room | STAY window/place differs from crime | 002 |
| R2.4 | Liar model selected via weighted RNG from manifest | Deterministic per seed (INV-7) | 002 |
| R2.5 | Twist-liar constraints respected | tampered_device → no confident_lie | 002 |

### From R3: Signal analyzer handles new keystones

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | `analyzeSignal` detects omission gaps | Returns `testimony_gap` for omission cases | 003 |
| R3.2 | `analyzeSignal` detects timeline mismatches | Returns `timeline_mismatch` for misremember cases | 003 |
| R3.3 | `keystoneKind` hint guides analyzer preference | Prefers matching keystone family | 003 |
| R3.4 | COMPARE handles GAP claim type | Returns SOFT_TENSION for GAP vs testimony | 003 |
| R3.5 | Finder scores new signal types | deductionQuality nonzero for all keystone kinds | 003 |

### From R4: Gossip slicing

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Gossip returns at most `manifest.gossipSliceSize` items per interview | Tier 3: max 4, Tier 4: max 3 | 004 |
| R4.2 | Slice is deterministic per (seed, npc) | Same NPC gives same slice for same seed | 004 |
| R4.3 | At least one NPC's slice contains `crime_awareness` | Crime localizable from gossip | 004 |
| R4.4 | Atoms tagged by axis: `why_hint`, `relationship`, `crime_awareness`, `red_herring` | Tags exist for future selector use | 004 |
| R4.5 | Tier 2 gossip unchanged (sliceSize = Infinity) | Backward compatible | 004 |

### From R5: Solver + validator

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Solver solves omission cases (gap analysis) | ≥95% on omission-forced seeds | 005 |
| R5.2 | Solver solves misremember cases (timeline) | ≥95% on misremember-forced seeds | 005 |
| R5.3 | Solver handles gossip slicing (multiple gossip interviews) | Still finds crime_awareness | 005 |
| R5.4 | Overall solve rate ≥95% all tiers (INV-1) | Diagnostics pass | 005 |
| R5.5 | No single keystoneKind > 60% on tier 3-4 | Variety validator | 005 |
| R5.6 | Tier 2 backward compatible | 100% confident_lie, same solve rate | 005 |

### From R6: WC18 solvability metrics (diagnostics + finder)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Collision diversity (Cdiv): classify keystone collision type per case, report distribution | diagnostics.ts shows Cdiv across N seeds, target ≥2 distinct classes | 006 |
| R6.2 | Collision timing (CT_early): measure which solver action # yields first contradiction | diagnostics.ts reports median + P80 timing | 006 |
| R6.3 | Orthogonality (OR): count distinct evidence channels contributing to solution | diagnostics.ts reports OR per seed, target ≥3 for easy/med | 006 |
| R6.4 | Paperwork score (PS): `actions_taken - collisions - axis_reductions`, flag grindy cases | diagnostics.ts reports mean PS, flags cases above threshold | 006 |
| R6.5 | Axis uniqueness AU(WHO): count plausible suspects after high-trust evidence only | diagnostics.ts reports AU(WHO), target ≤2 for easy/med | 006 |
| R6.6 | Finder uses Cdiv + CT as daily scheduling constraints | No repeat collision class within 3 consecutive days | 006 |
| R6.7 | Finder incorporates PS into deductionQuality subscore | High PS → lower deductionQuality | 006 |

### From R7: WHY axis as deduction target

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Motive not fully revealed by single gossip interview (tier 3+) | First gossip slice includes ≤1 motive hint per suspect | 004 |
| R7.2 | WHY requires cross-referencing gossip with evidence | Solver must do ≥2 gossip calls OR gossip + evidence correlation to confirm motive | 005 |
| R7.3 | Motive confirmation is a distinct "aha" from keystone contradiction | Collision classifier tags motive reveals as separate class `motive_reveal` | 006 |
| R7.4 | Accusation without correct WHY gets partial credit (not full fail) | Solver tracks whether WHY was deduced vs guessed | 005 |

---

## Dependency Graph

```
001 (manifest + types) ──> 002 (conditional derivation) ──> 003 (analyzer)
                       ──> 004 (gossip slicing + WHY axis)         │
                                                                   v
                                                            005 (solver + validator + tests)
                                                                   │
                                                                   v
                                                            006 (WC18 metrics + finder scheduling)
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001 | S | - | Types + manifest + templates. Foundation only. |
| 2 | 002, 004 | M | Batch 1 | Parallel: liar model derivation + gossip slicing (incl. WHY axis) |
| 3 | 003 | M | Batch 2 (needs 002) | Analyzer for new keystone families |
| 4 | 005 | M | Batch 3 | Solver adaptation + variety validator + all tests |
| 5 | 006 | M | Batch 4 | WC18 metrics in diagnostics + finder scheduling constraints |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | CaseManifest types, templates, CaseConfig extension | S | backlog |
| 002 | Conditional alibi derivation + manifest-driven liar model selection | M | backlog |
| 003 | Extend analyzeSignal + COMPARE for new keystone families | M | backlog |
| 004 | Gossip slicing via manifest + WHY axis gating | M | backlog |
| 005 | Solver adaptation + variety validator + regression tests | M | backlog |
| 006 | WC18 solvability metrics + finder scheduling | M | backlog |

---

## Task Details (Inline)

### Task 001: CaseManifest types, templates, CaseConfig extension

**Complexity:** S
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R1.7

#### Objective
Define the CaseManifest data structure and 4 scenario templates that replace DIFFICULTY_PROFILES.
Extend CaseConfig, SignalType, and ClaimType for new variety axes.

#### Context
**Relevant Files:**
- `src/types.ts` — CaseConfig (line 269), SignalType (line 583), ClaimType (line 299), DIFFICULTY_PROFILES (line 508)

**Embedded Context:**
```typescript
// Current DIFFICULTY_PROFILES (types.ts:508-541)
export const DIFFICULTY_PROFILES: Record<DifficultyTier, DifficultyProfile> = {
    1: { tier: 1, name: 'Tutorial', puzzleDifficulty: 'easy', deviceGaps: 0,
         twistRules: [] },
    2: { tier: 2, name: 'Standard', puzzleDifficulty: 'easy', deviceGaps: 0,
         twistRules: ['false_alibi', 'unreliable_witness'] },
    3: { tier: 3, name: 'Challenging', puzzleDifficulty: 'medium', deviceGaps: 1,
         twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'] },
    4: { tier: 4, name: 'Expert', puzzleDifficulty: 'hard', deviceGaps: 2,
         twistRules: ['false_alibi', 'unreliable_witness', 'tampered_device', 'planted_evidence', 'accomplice'] },
};
```

**Key invariant:** DIFFICULTY_PROFILES is consumed across sim.ts, evidence.ts, validators.ts, finder.ts, cli.ts.
Manifest must provide backward-compatible access so existing code doesn't break during migration.

#### Entry Points / Wiring
- `src/types.ts` — new types, manifest interface, templates
- `src/types.ts` — `CASE_TEMPLATES` constant + `getManifestForTier()` helper
- `src/types.ts` — keep `DIFFICULTY_PROFILES` but derive from manifests (backward compat shim)

#### Files Touched
- `src/types.ts` — modify (add ~80 lines of types + templates)

#### Acceptance Criteria

##### AC-1: CaseManifest interface compiles <- R1.1
- Given: types.ts
- When: imported
- Then: `CaseManifest` has all fields from architecture section above

##### AC-2: LiarModel, KeystoneKind, CoverageProfile types <- R1.2
- Given: types.ts
- When: imported
- Then: `LiarModel = 'confident_lie' | 'omission' | 'misremember'`
- And: `KeystoneKind = 'contradiction' | 'testimony_gap' | 'timeline_mismatch'`
- And: `CoverageProfile = 'full' | 'partial' | 'sparse'`

##### AC-3: 4 scenario templates <- R1.3
- Given: `CASE_TEMPLATES` constant
- When: accessed by tier
- Then: tier 1 = TUTORIAL, tier 2 = STANDARD, tier 3 = VARIED, tier 4 = EXPERT
- And: each template is a valid CaseManifest

##### AC-4: Template content matches design
- Given: TEMPLATE_STANDARD (tier 2)
- Then: `liarWeights = { confident_lie: 100 }`
- And: `twistWeights = { false_alibi: 100 }`
- And: `gossipSliceSize` absent or Infinity
- Given: TEMPLATE_VARIED (tier 3)
- Then: `liarWeights = { confident_lie: 50, omission: 30, misremember: 20 }`
- And: `gossipSliceSize = 4`

##### AC-5: CaseConfig extended <- R1.4
- Given: CaseConfig
- Then: has optional fields: `liarModel?: LiarModel`, `keystoneKind?: KeystoneKind`

##### AC-6: SignalType extended <- R1.5
- Then: includes `'testimony_gap' | 'timeline_mismatch'`

##### AC-7: ClaimType extended <- R1.6
- Then: includes `'GAP'`

##### AC-8: DIFFICULTY_PROFILES still works <- R1.7
- Given: existing code using `DIFFICULTY_PROFILES[tier]`
- Then: still compiles and returns same values
- And: `getManifestForTier(tier)` returns the corresponding CaseManifest

##### AC-9: Twist-liar constraint table
- Given: `TWIST_LIAR_CONSTRAINTS` constant
- Then: `false_alibi → [confident_lie]`
- And: `tampered_device → [omission, misremember]`
- And: `unreliable_witness → [omission, misremember]`
- And: `planted_evidence → [confident_lie, misremember]`
- And: `accomplice → [confident_lie, omission, misremember]`

#### Edge Cases

##### EC-1: Backward compatibility
- Scenario: Code using `DIFFICULTY_PROFILES[2].twistRules`
- Expected: Still works, returns `['false_alibi', 'unreliable_witness']`

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1..9 | Type + template compilation + value checks | `tests/keystone-variety.test.ts` |

---

### Task 002: Conditional alibi derivation + manifest-driven liar model selection

**Complexity:** M
**Depends On:** 001
**Implements:** R2.1, R2.2, R2.3, R2.4, R2.5

#### Objective
Make `deriveCulpritAlibiClaim()` branch on liar model. Add liar model selection to sim.ts
using weighted RNG from manifest, constrained by twist-liar table.

#### Context
**Relevant Files:**
- `src/evidence.ts:1342-1421` — `deriveCulpritAlibiClaim()` always generates STAY
- `src/sim.ts:1131-1170` — `maybeGenerateTwist()` selects twist
- `src/sim.ts:1395-1580` — case generation where config is built

**Liar model behaviors:**
- `confident_lie`: current behavior — false STAY claim at alibi location (HARD contradiction vs device)
- `omission`: no STAY claim. Generate `GAP` testimony: "I wasn't paying attention..." (low confidence 0.2-0.3). No self-reported presence.
- `misremember`: STAY claim at adjacent window (off-by-1) or adjacent room. Uncertainty markers in text. Medium confidence (0.4-0.5).

**Selection flow:**
1. `maybeGenerateTwist()` picks twist (existing logic, uses manifest.twistWeights)
2. New: `selectLiarModel()` picks from `manifest.liarWeights`, filtered by `TWIST_LIAR_CONSTRAINTS[twist.type]`
3. `config.liarModel` and `config.keystoneKind` set before evidence derivation
4. `deriveCulpritAlibiClaim()` branches on `config.liarModel`

#### Entry Points / Wiring
- `src/sim.ts` — add `selectLiarModel()`, call after twist selection, populate config
- `src/evidence.ts` — modify `deriveCulpritAlibiClaim()` to branch on liarModel
- `src/sim.ts` — `maybeGenerateTwist()` reads from `manifest.twistWeights` instead of hardcoded switch

#### Files Touched
- `src/sim.ts` — modify (add selectLiarModel, update maybeGenerateTwist to use manifest)
- `src/evidence.ts` — modify deriveCulpritAlibiClaim (add omission + misremember branches)

#### Acceptance Criteria

##### AC-1: confident_lie identical to current <- R2.1
- Given: config with `liarModel = 'confident_lie'`
- When: `deriveCulpritAlibiClaim()` runs
- Then: output identical to current (STAY testimony + self-reported presence)
- And: all existing tests pass

##### AC-2: omission generates GAP, no STAY <- R2.2
- Given: config with `liarModel = 'omission'`
- When: `deriveCulpritAlibiClaim()` runs
- Then: no testimony with `claimType = 'STAY'` for crime window
- And: generates testimony with `claimType = 'GAP'`, `witness = culpritId`, `window = crimeWindow`
- And: observable text is vague (e.g., "Wasn't really paying attention during that time")
- And: confidence = 0.2-0.3

##### AC-3: misremember generates shifted STAY <- R2.3
- Given: config with `liarModel = 'misremember'`
- When: `deriveCulpritAlibiClaim()` runs
- Then: STAY testimony with either adjacent window (off-by-1) or adjacent room
- And: text includes uncertainty ("I think...", "pretty sure...")
- And: confidence = 0.4-0.5

##### AC-4: Liar model deterministic <- R2.4
- Given: seed 42, tier 3
- When: generated twice
- Then: identical `config.liarModel`

##### AC-5: Twist constraints respected <- R2.5
- Given: twist = tampered_device
- When: liar model selected
- Then: never confident_lie (per constraint table)

##### AC-6: Tier 2 always confident_lie
- Given: 200 seeds at tier 2
- Then: 100% confident_lie

##### AC-7: Tier 3 distribution matches manifest weights
- Given: 200 seeds at tier 3
- Then: approximately 50/30/20 (±10%) confident_lie/omission/misremember

##### AC-8: maybeGenerateTwist uses manifest weights
- Given: tier 4 manifest with all twist weights
- When: 200 seeds generated
- Then: twist distribution roughly matches weights (not hardcoded switch)

#### Edge Cases

##### EC-1: misremember window overflow (W1 or W6)
- Expected: shift to only valid adjacent

##### EC-2: Tier 1 (no twists, no manifest liar weights)
- Expected: defaults to confident_lie

##### EC-3: All liar models forbidden by twist constraint
- Expected: fallback to first allowed model

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | confident_lie backward compat | `tests/keystone-variety.test.ts` |
| AC-2 | omission GAP claim | `tests/keystone-variety.test.ts` |
| AC-3 | misremember shifted STAY | `tests/keystone-variety.test.ts` |
| AC-4 | determinism | `tests/keystone-variety.test.ts` |
| AC-5 | twist constraints | `tests/keystone-variety.test.ts` |
| AC-6 | tier 2 compat | `tests/keystone-variety.test.ts` |
| AC-7 | tier 3 distribution | `tests/keystone-variety.test.ts` |

---

### Task 003: Extend analyzeSignal + COMPARE for new keystone families

**Complexity:** M
**Depends On:** 002
**Implements:** R3.1, R3.2, R3.3, R3.4, R3.5

#### Objective
Teach `analyzeSignal` to detect GAP-based and timeline-mismatch keystones.
Extend COMPARE to handle GAP claims. Update finder scoring for new signal types.

#### Context
**Relevant Files:**
- `src/validators.ts:50-206` — `analyzeSignal()` checks STAY vs device, presence vs presence, etc.
- `src/actions.ts` — `compareEvidence()` handles STAY claims via `evidenceNpc()`
- `src/daily/finder.ts` — `scoreDailyCandidate()` scores deductionQuality by signal type

**New analyzeSignal priority:**
1. Check `keystoneKind` hint — skip to relevant check if present
2. STAY claim contradiction (existing — `confident_lie`)
3. GAP detection: culprit has GAP claim + ≥2 innocents have crime-window testimony → `testimony_gap`
4. Mislocalization: culprit STAY at adjacent window/room vs device at crime scene → `timeline_mismatch`
5. Existing fallbacks (scene_presence, opportunity_only)

#### Entry Points / Wiring
- `src/validators.ts` — `analyzeSignal()` extended with GAP + mismatch detection
- `src/actions.ts` — `compareEvidence()` extended for GAP claim type
- `src/daily/finder.ts` — `scoreDailyCandidate()` scores new signal types

#### Files Touched
- `src/validators.ts` — modify analyzeSignal
- `src/actions.ts` — modify compareEvidence (GAP handling)
- `src/daily/finder.ts` — modify scoreDailyCandidate

#### Acceptance Criteria

##### AC-1: GAP signal detection <- R3.1
- Given: evidence with culprit GAP claim + ≥2 innocents with crime-window testimony
- When: analyzeSignal runs
- Then: `signalType = 'testimony_gap'`, `signalStrength = 'strong'`
- And: keystonePair references GAP testimony and one innocent's testimony

##### AC-2: Timeline mismatch detection <- R3.2
- Given: culprit STAY at adjacent window + device log at crime scene during crime window
- When: analyzeSignal runs
- Then: `signalType = 'timeline_mismatch'`, `signalStrength = 'strong'`

##### AC-3: keystoneKind hint respected <- R3.3
- Given: config with `keystoneKind = 'testimony_gap'` and both GAP and device contradiction present
- When: analyzeSignal runs
- Then: prefers testimony_gap keystone

##### AC-4: COMPARE GAP claim <- R3.4
- Given: GAP claim from culprit + detailed testimony from innocent, same window
- When: `compareEvidence(gapId, testimonyId)` called
- Then: `contradiction = true`, `level = 'SOFT_TENSION'`, `rule = 'testimony_gap'`

##### AC-5: confident_lie unchanged
- Given: confident_lie evidence
- Then: analyzeSignal returns device_contradiction as before

##### AC-6: Finder scores new signals <- R3.5
- Given: testimony_gap or timeline_mismatch signal
- Then: deductionQuality > 0

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1..6 | Signal detection + COMPARE + finder | `tests/keystone-variety.test.ts` |

---

### Task 004: Gossip slicing via manifest + WHY axis gating

**Complexity:** M
**Depends On:** 001
**Implements:** R4.1, R4.2, R4.3, R4.4, R4.5, R7.1

#### Objective
Cap gossip output per interview using `manifest.evidenceOverrides.gossipSliceSize`.
Tag gossip atoms by axis for deterministic selection. Guarantee crime_awareness is discoverable.
Gate motive information so WHY is a real deduction target — first gossip slice contains at most
1 motive hint per suspect, forcing cross-referencing with evidence or multiple interviews.

#### Context
**Relevant Files:**
- `src/evidence.ts` — gossip derivation (search for `deriveGossip` or `motive` evidence generation)
- `src/actions.ts` — `performInterview()` with mode='gossip' returns all gossip currently
- `src/player.ts` — PlayerSession manages knownEvidence

**Current behavior:** `performInterview(session, npc, '', 'gossip')` returns ALL motive evidence.
Player gets every relationship hint, every motive hint, AND crime_awareness in one 1-AP action.

**Target behavior:** Returns at most `gossipSliceSize` items, selected deterministically by
`(seed, npc)` pair. `crime_awareness` is guaranteed to appear in at least one NPC's first slice.

#### Entry Points / Wiring
- `src/actions.ts` — `performInterview()` gossip mode reads manifest.gossipSliceSize
- `src/evidence.ts` — tag gossip atoms with axis category

#### Files Touched
- `src/actions.ts` — modify performInterview gossip mode (add slicing logic)
- `src/evidence.ts` — modify gossip derivation (add axis tags to motive evidence)
- `src/types.ts` — add `gossipAxis` field to MotiveEvidence (optional)

#### Acceptance Criteria

##### AC-1: Gossip capped at sliceSize <- R4.1
- Given: tier 3 (gossipSliceSize = 4)
- When: `performInterview(session, npc, '', 'gossip')` called
- Then: returns at most 4 motive evidence items

##### AC-2: Deterministic slice <- R4.2
- Given: seed 42, npc = 'bob', tier 3
- When: gossip interview called twice (different sessions, same seed)
- Then: identical evidence items returned

##### AC-3: crime_awareness discoverable <- R4.3
- Given: any seed, tier 3
- When: all 5 NPCs gossip-interviewed
- Then: at least one NPC's slice contains crime_awareness
- And: it appears in the first NPC's slice for ≥80% of seeds (usually first ask works)

##### AC-4: Tier 2 unchanged <- R4.5
- Given: tier 2 (gossipSliceSize = Infinity or absent)
- When: gossip interview called
- Then: returns ALL motive evidence (current behavior)

##### AC-5: Second gossip interview returns new items
- Given: tier 3, same NPC gossip-interviewed twice
- When: second interview
- Then: returns next slice of items (not duplicates of first slice)
- And: second slice is also capped at gossipSliceSize

##### AC-6: WHY gated — first slice limits motive hints <- R7.1
- Given: tier 3 (gossipSliceSize = 4), 5 suspects
- When: first gossip interview with any NPC
- Then: slice contains at most 1 `why_hint` tagged item per suspect
- And: culprit's motive hint is NOT in every NPC's first slice (distributed across NPCs)
- And: confirming WHY requires either: (a) 2+ gossip interviews, or (b) cross-referencing gossip with evidence

#### Edge Cases

##### EC-1: NPC has fewer gossip items than sliceSize
- Expected: returns all items (no padding)

##### EC-2: All gossip exhausted
- Expected: interview returns empty + message "nothing new to share"

##### EC-3: Tier 2 WHY still free
- Expected: tier 2 gossip unchanged — all motive info in one call

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1..6 | Gossip slicing + WHY gating | `tests/keystone-variety.test.ts` |

---

### Task 005: Solver adaptation + variety validator + regression tests

**Complexity:** M
**Depends On:** 003, 004
**Implements:** R5.1, R5.2, R5.3, R5.4, R5.5, R5.6, R7.2, R7.4

#### Objective
Update solver for omission (gap analysis), misremember (timeline), and gossip slicing.
Add variety validator to diagnostics. Write regression tests for all new behavior.

#### Context
**Relevant Files:**
- `src/solver.ts:408-527` — `solve()` fixed strategy
- `scripts/diagnostics.ts` — metrics script
- `tests/` — existing test files

**Solver changes needed:**
- Phase 1: If gossip sliced, do 2+ gossip interviews (budget 2 AP instead of 1)
- Phase 1.5 (WHY deduction): Cross-reference motive hints from gossip with evidence. Track whether WHY was deduced vs guessed.
- Phase 5 (contradictions): If no HARD contradictions, check for GAP claims (omission detection)
- Phase 5: If no HARD and no GAP, check adjacent-window logs for timeline mismatch
- `buildSmartAccusation()`: New fallback — suspect with GAP claim + scene device presence = likely culprit
- `buildSmartAccusation()`: Include WHY confidence — deduced motive vs best-guess motive

#### Entry Points / Wiring
- `src/solver.ts` — modify solve() and buildSmartAccusation()
- `scripts/diagnostics.ts` — add keystone + liar model distribution sections
- `tests/keystone-variety.test.ts` — comprehensive test file

#### Files Touched
- `src/solver.ts` — modify
- `scripts/diagnostics.ts` — modify
- `tests/keystone-variety.test.ts` — create (all tests for Tasks 001-005)

#### Acceptance Criteria

##### AC-1: Solver solves omission ≥95% <- R5.1
- Given: 100 tier 3 seeds with omission forced
- Then: ≥95% solve rate

##### AC-2: Solver solves misremember ≥95% <- R5.2
- Given: 100 tier 3 seeds with misremember forced
- Then: ≥95% solve rate

##### AC-3: Solver handles gossip slicing <- R5.3
- Given: tier 3 with gossipSliceSize = 4
- Then: solver does multiple gossip interviews and still finds crime_awareness

##### AC-4: Overall ≥95% all tiers <- R5.4
- Given: 200 seeds per tier (2, 3, 4)
- Then: ≥95% solve rate each tier

##### AC-5: Keystone diversity on tier 3-4 <- R5.5
- Given: 200 seeds tier 3
- Then: no keystoneKind > 60%

##### AC-6: Tier 2 backward compat <- R5.6
- Given: 200 seeds tier 2
- Then: 100% confident_lie, solve rate unchanged

##### AC-7: Diagnostics shows new metrics
- Given: `npx tsx scripts/diagnostics.ts 200 --tier 3`
- Then: shows KEYSTONE DIVERSITY + LIAR MODEL DISTRIBUTION sections

##### AC-8: All existing 297 tests still pass
- Given: `npx vitest run`
- Then: no regressions

##### AC-9: Solver deduces WHY via cross-reference <- R7.2
- Given: tier 3 with gossip slicing
- When: solver runs
- Then: solver does ≥2 gossip interviews OR correlates gossip hint with evidence
- And: solver tracks `motiveDeduced: boolean` in solve result

##### AC-10: Partial credit for correct WHO + wrong WHY <- R7.4
- Given: solver identifies correct culprit but wrong motive
- Then: solve result includes `motiveCorrect: boolean`
- And: case still counts as "solved" for WHO (solve rate metric unchanged)
- And: diagnostics reports separate `motiveAccuracy` metric

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1..10 | Variety regression suite | `tests/keystone-variety.test.ts` |

---

### Task 006: WC18 solvability metrics + finder scheduling

**Complexity:** M
**Depends On:** 005
**Implements:** R6.1, R6.2, R6.3, R6.4, R6.5, R6.6, R6.7, R7.3

#### Objective
Add WC18-derived solvability metrics to diagnostics.ts and finder scoring. These metrics
validate that variety improvements produce better cases AND serve as scheduling constraints
for daily puzzle selection (no repeat collision class within 3 consecutive days).

#### Context
**Relevant Files:**
- `scripts/diagnostics.ts` — existing metrics script, add new sections
- `src/daily/finder.ts` — `scoreDailyCandidate()` + daily selection pipeline
- `src/validators.ts` — `analyzeSignal()` returns keystone info needed for classification
- `src/solver.ts` — solve traces contain action sequence for timing metrics

**WC18 metrics mapped to koa-casefiles:**

| WC18 Metric | Koa Implementation | Source |
|---|---|---|
| Cdiv (collision diversity) | Classify keystone: `presence_contradiction`, `device_contradiction`, `testimony_gap`, `timeline_mismatch`, `motive_reveal` | analyzeSignal output + motive tracking |
| CT_early (collision timing) | Action index of first contradiction in solver trace | solver trace |
| OR (orthogonality) | Count of {testimony, device_log, physical, motive} channels in solution path | evidence analysis |
| PS (paperwork score) | `total_actions - (2 * contradictions_found) - (3 * axis_reductions)` | solver trace |
| AU(WHO) | Suspects remaining after filtering by device evidence only | evidence analysis |

**Finder scheduling:**
- Track last N daily puzzle collision classes in a rolling window
- Penalize candidates whose collision class matches any of the last 3 days
- This is a selection-time constraint, not a generation constraint

#### Entry Points / Wiring
- `scripts/diagnostics.ts` — new report sections for each metric
- `src/daily/finder.ts` — `scoreDailyCandidate()` incorporates PS + Cdiv
- `src/daily/finder.ts` — daily selection applies collision-class diversity window
- `src/validators.ts` — export helper `classifyCollision(signal, evidence)` for reuse

#### Files Touched
- `scripts/diagnostics.ts` — modify (add ~100 lines: 5 new metric sections)
- `src/daily/finder.ts` — modify (PS in deductionQuality, collision scheduling)
- `src/validators.ts` — modify (add classifyCollision helper, ~20 lines)
- `src/types.ts` — add `CollisionClass` type

#### Acceptance Criteria

##### AC-1: Collision diversity reported <- R6.1
- Given: `npx tsx scripts/diagnostics.ts 200 --tier 3`
- Then: output includes COLLISION DIVERSITY section
- And: reports distribution of collision classes across 200 seeds
- And: reports Cdiv (number of distinct classes seen)
- And: target: Cdiv ≥ 2 for tier 3, ≥ 3 for tier 4

##### AC-2: Collision timing reported <- R6.2
- Given: diagnostics run
- Then: output includes COLLISION TIMING section
- And: reports median and P80 action index of first contradiction
- And: target: CT_early ≥ 0.70 by action 4 for medium difficulty

##### AC-3: Orthogonality reported <- R6.3
- Given: diagnostics run
- Then: output includes EVIDENCE ORTHOGONALITY section
- And: reports mean OR across seeds
- And: target: OR ≥ 2 (currently ~2, should improve with liar models)

##### AC-4: Paperwork score reported <- R6.4
- Given: diagnostics run
- Then: output includes PAPERWORK SCORE section
- And: reports mean PS and flags cases where PS > threshold (e.g., PS > 8)
- And: lists seed IDs of "grindy" cases

##### AC-5: Axis uniqueness AU(WHO) reported <- R6.5
- Given: diagnostics run
- Then: output includes AXIS UNIQUENESS section
- And: reports mean AU(WHO) — suspects remaining after device evidence only
- And: target: AU(WHO) ≤ 2 for easy/med

##### AC-6: Finder penalizes repeat collision class <- R6.6
- Given: last 3 daily puzzles all had `device_contradiction`
- When: finder scores next batch of candidates
- Then: candidates with `device_contradiction` get penalty (e.g., -5 points)
- And: candidates with different collision class get no penalty
- And: scheduling state stored in finder context (not global)

##### AC-7: Finder incorporates PS <- R6.7
- Given: case with PS = 10 (grindy) vs case with PS = 3 (crisp)
- Then: PS = 3 case scores higher on deductionQuality
- And: PS contribution is ~25% of deductionQuality subscore

##### AC-8: Motive reveal classified as distinct collision <- R7.3
- Given: case where motive deduction is a cross-reference aha
- Then: `classifyCollision` includes `motive_reveal` in collision classes
- And: Cdiv counts it as a distinct class from the keystone collision

#### Edge Cases

##### EC-1: Solver trace unavailable (solver times out)
- Expected: metrics default to worst-case values, case not flagged as error

##### EC-2: Only 1 collision class across all seeds
- Expected: Cdiv = 1, diagnostics warns "MONOCULTURE" (same as current state, validates the metric)

##### EC-3: Finder has no scheduling history (first run)
- Expected: no collision penalty applied, all candidates scored equally

#### Error Cases

##### ERR-1: Invalid collision class
- When: analyzeSignal returns unknown signal type
- Then: classifyCollision returns 'unknown', diagnostics counts it separately

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1..5 | Diagnostics metric output | `tests/keystone-variety.test.ts` |
| AC-6..7 | Finder scheduling + PS scoring | `tests/keystone-variety.test.ts` |
| AC-8 | Collision classification | `tests/keystone-variety.test.ts` |

#### Notes
**Implementation Notes:** [filled by implementer]
**Review Notes:** [filled by reviewer]

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Omission too hard for human players | Can't figure out gap analysis | SUGGEST guides them; COMPARE GAP gives SOFT_TENSION hint |
| Gossip slicing makes crime unfindable | Player can't locate crime | AC-3 in Task 004: crime_awareness guaranteed in first slice for ≥80% |
| WHY gating makes game too hard | Player can't determine motive | Partial credit (R7.4); SUGGEST can hint at motive cross-reference |
| Solver rate drops | INV-1 violation | AC-4 in Task 005 gates merge |
| Tier 2 regression | Breaks daily puzzle | AC-6 in Task 005 ensures unchanged |
| DIFFICULTY_PROFILES removal breaks imports | Compile errors across codebase | Backward compat shim in Task 001 (AC-8) |
| Manifest adds complexity without clear benefit | Over-engineering | Manifest IS the benefit: every future feature (shapes, techniques, settings) plugs in as a template knob |
| WC18 metrics are aspirational overkill | Measurement without value | Metrics are cheap (solver trace already exists). They validate variety investment and prevent regressions. |
| Finder scheduling over-constrains seed selection | Too few candidates pass | Penalty is soft (-5), not hard rejection. Finder still picks best available. |

---

## Open Questions

1. Should SUGGEST tell the player what kind of keystone to look for? ("Look for who's vague" vs "Look for contradictions")
2. Should GAP COMPARE be SOFT_TENSION or a new level?
3. Should misremember shift window or room? (Plan: either, RNG per case)
4. Should gossip slice selection be random or axis-balanced? (Plan: deterministic from seed, ensure axis coverage)

---

## Future Phases (not in scope, but manifest-ready)

- **Case shapes** (frame_job, reverse, two_step, inside_job, false_alarm) — new template knob + evidence generation
- **Technique tiers** (alibi chains, planted evidence detection, collusion) — new liar models + evidence types
- **Coverage profiles** (partial, sparse) — manifest.coverageProfile drives device gap generation
- **Settings** (office, dorm, spaceship) — new world.ts variants + evidence types
- **Weekly themes** — manifest modifiers applied to daily template
- **Full WC18 compliance** — ClueGraph, uniqueness enumerator, RepairTargets feedback loop
- **WHEN/WHERE as scored axes** — player must deduce crime window and location, not just WHO+WHY

---

## Verification

1. `npx vitest run` — all existing + new tests pass
2. `npx tsx scripts/smart-solver.ts 50 --tier 2` — solve rate stays >= 80%
3. `npx tsx scripts/find-seed.ts` (or equivalent) — selected seeds have higher deductionQuality
4. `npx tsx scripts/diagnostics.ts 200 --tier 3` — Cdiv ≥ 2, PS mean < 8, OR ≥ 2, motive accuracy tracked
5. `npx tsx scripts/diagnostics.ts 200 --tier 3 --json` — machine-parseable WC18 metrics for CI
6. Manual playtest: play a top-scored seed, verify SUGGEST works, motive isn't obvious, two distinct aha moments
