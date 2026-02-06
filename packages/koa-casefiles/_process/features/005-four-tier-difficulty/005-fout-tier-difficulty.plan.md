 Plan: Four-Tier Difficulty System (Feature 005)        

 Discovery: ../../packages/koa-casefiles/_process/features/005-four-tier-difficulty/notes.md
 Status: ready

 ---
 Retrospective from Feature 001

 Lessons learned from solvability guarantee implementation and the two bugs we just fixed:

 1. Validator vs derivation mismatch — validateAntiAnticlimax() checked window + actor but
 deriveDeviceLogs() stripped actor based on window + actor + place. The validator was stricter
 than derivation, causing 83% false failures. Lesson: when two layers enforce the same rule,
 their conditions must match exactly. In feature 005, the new DifficultyProfile will be the
 single source of truth for ALL difficulty-related behavior, eliminating the dual-parameter
 (difficultyTier + options.difficulty) mismatch that exists today.
 2. Narrow alibi check — findExculpatingEvidence() only checked presence evidence, missing
 device_log evidence that also proves alibis. Lesson: when adding new evidence types (or making
 existing ones carry more information via signal injection), audit ALL consumers of that
 evidence. In feature 005, Task 006 (regression) includes explicit cross-tier validation that
 alibis work at every tier.
 3. Anti-anticlimax place constraint — Signal injection places events at ADJACENT rooms to
 preserve actor identity. The new tier system must not break this — higher tiers with more
 device gaps must still leave the crime-adjacent windows online. Lesson: getOfflineWindows must
 never offline windows adjacent to the crime window. This is already enforced by the
 protectedWindows set in evidence.ts:225-228, but Task 002 must preserve this when refactoring
 to deviceGaps.

 ---
 Overview

 Unify the two parallel difficulty systems into a single 4-tier DifficultyProfile that controls
 everything: puzzle behavior, device coverage, twist rules, signal preferences, and validation
 targets.

 Current state (broken):
 - difficulty: 'easy' | 'medium' | 'hard' — controls culprit behavior, device gaps, twist
 selection
 - difficultyTier: 1 | 2 | 3 | 4 — controls twist rules, red herring strength, validation
 targets
 - These are passed as SEPARATE parameters to simulate(seed, difficultyTier, options.difficulty)
 - CaseDirector uses 3 string tiers (dead code — never instantiated), DIFFICULTY_PRESETS uses 4 numeric tiers
 - parseDifficulty('2') returns 'medium', --tier 2 means something different

 Goal: Single DifficultyProfile per tier that maps to all behaviors.

 ---
 Requirements Expansion

 From R1: Unified difficulty type
 ID: R1.1
 Requirement: DifficultyProfile interface with all tier settings
 Verification: Type compiles, all fields present
 Tasks: 001
 ────────────────────────────────────────
 ID: R1.2
 Requirement: DIFFICULTY_PROFILES constant covers tiers 1-4
 Verification: Unit test: each tier has correct values
 Tasks: 001
 ────────────────────────────────────────
 ID: R1.3
 Requirement: DIFFICULTY_TIER_TARGETS derived from profiles (backward compat)
 Verification: Existing tests pass unchanged
 Tasks: 001
 ────────────────────────────────────────
 ID: R1.4
 Requirement: profileToDifficultyConfig() helper for legacy consumers
 Verification: Unit test: returns valid DifficultyConfig
 Tasks: 001
 From R2: Pipeline wiring
 ID: R2.1
 Requirement: simulate() derives puzzle behavior from tier profile
 Verification: Tier 3 → medium puzzle, 1 device gap
 Tasks: 002
 ────────────────────────────────────────
 ID: R2.2
 Requirement: SimulationOptions.difficulty removed
 Verification: TypeScript compile error if used
 Tasks: 002
 ────────────────────────────────────────
 ID: R2.3
 Requirement: CaseConfig stores tier instead of difficulty
 Verification: config.tier returns 1-4
 Tasks: 002
 ────────────────────────────────────────
 ID: R2.4
 Requirement: getOfflineWindows uses deviceGaps from profile
 Verification: Tier 1=0 gaps, 3=1 gap, 4=2 gaps
 Tasks: 002
 ────────────────────────────────────────
 ID: R2.5
 Requirement: DIFFICULTY_PRESETS removed from sim.ts
 Verification: Not importable
 Tasks: 002
 ~~From R3: Director migration~~ (DROPPED — CaseDirector is dead code; tier selection is editorial config, not runtime rotation. See Feature 002 notes.)
 ID: ~~R3.1~~ — dropped
 ID: ~~R3.2~~ — dropped
 ID: ~~R3.3~~ — dropped
 ID: R3.4
 Requirement: Fix pre-existing Twist import error
 Verification: TypeScript compiles
 Tasks: 001 (moved from dropped Task 003)
 From R4: CLI/game unification
 ID: R4.1
 Requirement: --tier 3 uses Challenging profile
 Verification: CLI output shows tier 3 behavior
 Tasks: 004
 ────────────────────────────────────────
 ID: R4.2
 Requirement: --difficulty hard maps to tier 4
 Verification: Same as --tier 4
 Tasks: 004
 ────────────────────────────────────────
 ID: R4.3
 Requirement: Named aliases work (tutorial, standard, challenging, expert)
 Verification: CLI accepts all
 Tasks: 004
 From R5: Signal preference wiring
 ID: R5.1
 Requirement: generateValidatedCase() auto-derives SignalConfig from tier
 Verification: Tier 1 → self_contradiction preferred
 Tasks: 005
 ────────────────────────────────────────
 ID: R5.2
 Requirement: Explicit signalConfig overrides auto-derivation
 Verification: Caller's preference wins
 Tasks: 005
 From R6: Regression validation
 ID: R6.1
 Requirement: All 60 existing tests pass
 Verification: vitest run green
 Tasks: 006
 ────────────────────────────────────────
 ID: R6.2
 Requirement: Each tier achieves >=95% solvability over 200 seeds
 Verification: Batch test
 Tasks: 006
 ────────────────────────────────────────
 ID: R6.3
 Requirement: Tier 1 signal distribution: >=80% self_contradiction
 Verification: Batch test
 Tasks: 006
 ────────────────────────────────────────
 ID: R6.4
 Requirement: Device gaps match tier profile
 Verification: Tier 3 = exactly 1 offline window
 Tasks: 006
 ---
 Dependency Graph

 001 ──┬──→ 002 ──→ 004 ──→ 006
       │                       ↑
       ├──→ 005 ───────────────┘
       │
       └──────────────────────────

 ---
 Batch Analysis
 ┌───────┬──────────────┬────────────┬───────────┬─────────────────────────────────────────────┐
 │ Batch │    Tasks     │ Complexity │ Blocked   │                    Notes                    │
 │       │              │            │    By     │                                             │
 ├───────┼──────────────┼────────────┼───────────┼─────────────────────────────────────────────┤
 │ 1     │ 001          │ S          │ -         │ Foundation: types + profiles + Twist alias   │
 ├───────┼──────────────┼────────────┼───────────┼─────────────────────────────────────────────┤
 │ 2     │ 002, 005     │ M          │ Batch 1   │ Core wiring (parallelizable)                │
 ├───────┼──────────────┼────────────┼───────────┼─────────────────────────────────────────────┤
 │ 3     │ 004          │ S          │ Batch 2   │ CLI depends on simulate() changes            │
 ├───────┼──────────────┼────────────┼───────────┼─────────────────────────────────────────────┤
 │ 4     │ 006          │ M          │ Batch 3   │ Regression across all tiers                 │
 └───────┴──────────────┴────────────┴───────────┴─────────────────────────────────────────────┘
 ---
 Task Summary
 ┌─────┬───────────────────────────────────────────────────┬────────────┬─────────┐
 │ ID  │                       Name                        │ Complexity │ Status  │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 001 │ DifficultyProfile type & mapping table            │ S          │ ready   │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 002 │ Wire profiles into simulate() pipeline            │ M          │ backlog │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 003 │ ~~Migrate CaseDirector to 4-tier numeric~~        │ ~~M~~      │ dropped │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 004 │ Update CLI and game.ts parsers                    │ S          │ backlog │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 005 │ Wire signal preference into generateValidatedCase │ S          │ backlog │
 ├─────┼───────────────────────────────────────────────────┼────────────┼─────────┤
 │ 006 │ Regression & batch validation                     │ M          │ backlog │
 └─────┴───────────────────────────────────────────────────┴────────────┴─────────┘
 ---
 Task Details

 Task 001: DifficultyProfile type & mapping table

 Complexity: S
 Depends On: none
 Implements: R1.1, R1.2, R1.3, R1.4, R3.4

 Objective: Add DifficultyProfile interface and DIFFICULTY_PROFILES constant to types.ts.
 Also add `export type Twist = TwistRule;` alias (R3.4, moved from dropped Task 003).

 Files:
 - src/types.ts — Add DifficultyTier, DifficultyProfile, DIFFICULTY_PROFILES; derive
 DIFFICULTY_TIER_TARGETS
 - tests/difficulty-profiles.test.ts — New

 Embedded Context:

 export type DifficultyTier = 1 | 2 | 3 | 4;

 export interface DifficultyProfile {
     tier: DifficultyTier;
     name: string;                                  // 'Tutorial' | 'Standard' | 'Challenging' |
  'Expert'
     puzzleDifficulty: 'easy' | 'medium' | 'hard';  // Legacy mapping for evidence.ts
     deviceGaps: 0 | 1 | 2;                         // Number of offline windows
     twistRules: TwistType[];
     redHerringStrength: number;                     // 1-10
     preferredSignalType: SignalType;
     targets: {
         minAP: number; maxAP: number;
         minContradictions: number; maxContradictions: number;
         minBranching: number;
     };
 }

 export const DIFFICULTY_PROFILES: Record<DifficultyTier, DifficultyProfile> = {
     1: {
         tier: 1, name: 'Tutorial',
         puzzleDifficulty: 'easy', deviceGaps: 0,
         twistRules: [],
         redHerringStrength: 3,
         preferredSignalType: 'self_contradiction',
         targets: { minAP: 4, maxAP: 8, minContradictions: 1, maxContradictions: 3,
 minBranching: 2 },
     },
     2: {
         tier: 2, name: 'Standard',
         puzzleDifficulty: 'easy', deviceGaps: 0,
         twistRules: ['false_alibi', 'unreliable_witness'],
         redHerringStrength: 5,
         preferredSignalType: 'self_contradiction',
         targets: { minAP: 7, maxAP: 14, minContradictions: 3, maxContradictions: 5,
 minBranching: 2 },
     },
     3: {
         tier: 3, name: 'Challenging',
         puzzleDifficulty: 'medium', deviceGaps: 1,
         twistRules: ['false_alibi', 'unreliable_witness', 'planted_evidence'],
         redHerringStrength: 7,
         preferredSignalType: 'device_contradiction',
         targets: { minAP: 10, maxAP: 16, minContradictions: 4, maxContradictions: 7,
 minBranching: 3 },
     },
     4: {
         tier: 4, name: 'Expert',
         puzzleDifficulty: 'hard', deviceGaps: 2,
         twistRules: ['false_alibi', 'unreliable_witness', 'tampered_device',
 'planted_evidence', 'accomplice'],
         redHerringStrength: 9,
         preferredSignalType: 'scene_presence',
         targets: { minAP: 12, maxAP: 18, minContradictions: 5, maxContradictions: 8,
 minBranching: 3 },
     },
 };

 // Backward-compat: derive old DifficultyConfig from profile
 export function profileToDifficultyConfig(profile: DifficultyProfile): DifficultyConfig {
     return {
         tier: profile.tier,
         suspectCount: 5,
         windowCount: 6,
         twistRules: profile.twistRules,
         redHerringStrength: profile.redHerringStrength,
     };
 }

 Derive DIFFICULTY_TIER_TARGETS from profiles instead of duplicating values.

 AC-1: DIFFICULTY_PROFILES has all 4 tiers with correct names, puzzleDifficulty, deviceGaps,
 twistRules, preferredSignalType, and targets.
 AC-2: DIFFICULTY_TIER_TARGETS still returns same values as before (computed from profiles).
 AC-3: profileToDifficultyConfig() maps profile → valid DifficultyConfig.
 EC-1: Accessing non-existent tier (e.g. 5) returns undefined.

 ---
 Task 002: Wire profiles into simulate() pipeline

 Complexity: M
 Depends On: 001
 Implements: R2.1, R2.2, R2.3, R2.4, R2.5

 Objective: Replace DIFFICULTY_PRESETS + options.difficulty with single
 DIFFICULTY_PROFILES[tier] lookup.

 Files:
 - src/sim.ts — Remove DIFFICULTY_PRESETS; simulate() reads profile; pass puzzleDifficulty
 internally
 - src/evidence.ts — getOfflineWindows() accepts deviceGaps: number instead of difficulty
 string; deriveCulpritAlibiClaim() reads from profile
 - src/types.ts — CaseConfig: add tier?: DifficultyTier, keep difficulty as deprecated
 - Existing test files — Update any fixtures using difficulty: 'easy'

 Key changes:

 // sim.ts — simulate() now uses profile
 export function simulate(seed: number, tier: DifficultyTier = 2, options: SimulationOptions =
 {}): SimulationResult | null {
     const profile = DIFFICULTY_PROFILES[tier];
     // profile.puzzleDifficulty → maybeGenerateTwist(), deriveCulpritAlibiClaim()
     // profile.twistRules → maybeGenerateTwist() allowedTwists
     // profile.deviceGaps → getOfflineWindows()
     // Store tier on config: config.tier = tier
 }

 // evidence.ts — getOfflineWindows refactored
 function getOfflineWindowsByGaps(crimeWindow: WindowId | undefined, gaps: number):
 Set<WindowId> {
     // gaps=0 → empty set; gaps=1 → 1 offline; gaps=2 → 2 offline
     // MUST preserve: crime window and adjacent windows always protected (retro lesson #3)
 }

 AC-1: simulate(seed, 3) produces cases with medium puzzle behavior, 1 device gap,
 planted_evidence in twist pool.
 AC-2: SimulationOptions.difficulty is removed (TypeScript compile error if used).
 AC-3: config.tier returns 1-4 on generated cases.
 AC-4: DIFFICULTY_PRESETS no longer exists in sim.ts.
 AC-5: Tier 1 has 0 device gaps, tier 3 has 1, tier 4 has 2.
 EC-1: Crime window and adjacent windows are NEVER offline at any tier (retro lesson #3).
 EC-2: simulateWithBlueprints() path uses the same profile logic.

 ---
 ~~Task 003: Migrate CaseDirector to 4-tier numeric~~ — DROPPED

 CaseDirector is dead code (imported in sim.ts but never instantiated). Tier selection is
 editorial data via static schedule config, not runtime rotation logic. See Feature 002 notes
 for the offline generation architecture. The Twist type alias fix (R3.4) has been moved to
 Task 001.

 ---
 Task 004: Update CLI and game.ts parsers

 Complexity: S
 Depends On: 002
 Implements: R4.1, R4.2, R4.3

 Objective: Unify --tier and --difficulty flags into single tier system.

 Files:
 - src/cli.ts — Replace parseDifficulty() with parseTier(), update simulate() calls
 - src/game.ts — Same parser update, remove difficulty from game args

 Key change — new parser:

 function parseTier(str: string): DifficultyTier | undefined {
     const lower = str.toLowerCase();
     // Numeric
     if (lower === '1') return 1;  if (lower === '2') return 2;
     if (lower === '3') return 3;  if (lower === '4') return 4;
     // Named
     if (lower === 'tutorial' || lower === 'tut') return 1;
     if (lower === 'standard' || lower === 'std') return 2;
     if (lower === 'challenging' || lower === 'chal') return 3;
     if (lower === 'expert' || lower === 'exp') return 4;
     // Legacy aliases
     if (lower === 'easy' || lower === 'e') return 1;
     if (lower === 'medium' || lower === 'med' || lower === 'm') return 2;
     if (lower === 'hard' || lower === 'h') return 4;  // hard → expert (not challenging)
     return undefined;
 }

 AC-1: --tier 3 generates tier 3 cases.
 AC-2: --difficulty hard maps to tier 4.
 AC-3: --difficulty challenging maps to tier 3.
 EC-1: --tier 5 warns and falls back to tier 2.

 ---
 Task 005: Wire signal preference into generateValidatedCase

 Complexity: S
 Depends On: 001
 Implements: R5.1, R5.2

 Objective: Auto-derive SignalConfig from tier profile when caller doesn't provide one.

 Files:
 - src/sim.ts — Update generateValidatedCase() to auto-populate signalConfig
 - tests/difficulty-signal.test.ts — New

 Key change:

 export function generateValidatedCase(seed: number, tier: DifficultyTier = 2, options:
 SimulationOptions = {}) {
     if (!options.signalConfig) {
         const profile = DIFFICULTY_PROFILES[tier];
         options = { ...options, signalConfig: { preferredType: profile.preferredSignalType } };
     }
     // ... rest unchanged
 }

 AC-1: generateValidatedCase(1, 1) → config.signalConfig.preferredType === 'self_contradiction'.
 AC-2: generateValidatedCase(1, 4) → config.signalConfig.preferredType === 'scene_presence'.
 AC-3: Explicit signalConfig in options is NOT overridden.

 ---
 Task 006: Regression & batch validation

 Complexity: M
 Depends On: 002, 004, 005
 Implements: R6.1, R6.2, R6.3, R6.4

 Objective: Verify all tiers work correctly and nothing regressed.

 Files:
 - tests/four-tier-regression.test.ts — New batch validation tests

 AC-1: All existing tests pass (vitest run).
 AC-2: Each tier achieves >=95% solvability over 200 seeds via generateValidatedCase().
 AC-3: Tier 1: >=80% of cases have self_contradiction signal.
 AC-4: Device gaps match profile: tier 1=0, tier 3=1, tier 4=2.
 AC-5: Anti-anticlimax passes at >=95% per tier (retro lesson #1).
 AC-6: Red herring alibi check passes at >=95% per tier (retro lesson #2).

 ---
 Legacy Mapping

 'easy'   (old) → Tier 1 (Tutorial)
 'medium' (old) → Tier 2 (Standard)
   [new]        → Tier 3 (Challenging)
 'hard'   (old) → Tier 4 (Expert)

 ---
 Breaking Changes

 - SimulationOptions.difficulty removed — use tier parameter instead
 - CaseConfig.difficulty deprecated → use CaseConfig.tier
 - ~~CaseDirector.getCurrentDifficulty() → getCurrentTier()~~ (director is dead code, not migrated)
 - parseDifficulty('3') returns tier 3 (was 'hard')
 - DIFFICULTY_PRESETS removed from sim.ts

 Backward-Compatible

 - DIFFICULTY_TIER_TARGETS still works (derived from profiles)
 - DifficultyConfig type still exists (via profileToDifficultyConfig())
 - --difficulty easy/medium/hard still works as tier aliases
 - signalConfig in SimulationOptions still accepted (overrides auto-derivation)

 ---
 Risks & Mitigations
 Risk: RNG sequence changes for tier 2
 Likelihood: High
 Impact: Low
 Mitigation: Tier 2 now uses puzzleDifficulty: 'easy' instead of undefined (legacy random).
   Intentional improvement — documented.
 ────────────────────────────────────────
 Risk: Existing tests use difficulty field
 Likelihood: Medium
 Impact: Medium
 Mitigation: Task 002 updates test fixtures. Run existing suite first.
 ────────────────────────────────────────
 Risk: Tier 3 balance wrong
 Likelihood: Medium
 Impact: Medium
 Mitigation: Tier 3 is NEW (no old equivalent). Task 006 batch validation surfaces issues. May
   need post-ship tuning.
 ────────────────────────────────────────
 Risk: Anti-anticlimax regression
 Likelihood: Low
 Impact: High
 Mitigation: Explicit EC in Task 002 + AC in Task 006 (retro lesson #1).
 ────────────────────────────────────────
 Risk: Red herring alibi regression
 Likelihood: Low
 Impact: High
 Mitigation: Explicit AC in Task 006 (retro lesson #2).
 ---
 Verification

 # Run all tests
 npx vitest run

 # Generate 100 cases at each tier
 npx tsx src/cli.ts --tier 1 --generate 100
 npx tsx src/cli.ts --tier 2 --generate 100
 npx tsx src/cli.ts --tier 3 --generate 100
 npx tsx src/cli.ts --tier 4 --generate 100

 # Verbose single case at new Tier 3
 npx tsx src/cli.ts --tier 3 --seed 42 -v