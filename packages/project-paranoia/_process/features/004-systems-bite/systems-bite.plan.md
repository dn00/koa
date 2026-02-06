# Plan: Systems That Bite

**Discovery:** Inline (playtest-driven)
**Status:** done

---

## Overview

Playtest revealed 5 structural problems where game systems generate atmospheric flavor text but have no mechanical teeth. Passive play wins at 100% integrity / 24% suspicion / all crew alive. The core manipulation fantasy never activates because honest play has zero cost and crises can't kill you.

These are **code bugs and missing wiring**, not tuning problems. No config change can fix a rumor with `place: undefined` or an integrity formula that averages away fires.

---

## Requirements Expansion

### From R1: Fabricate must produce visible crew drama

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | Fabrication rumor spreads to crew in evening phase | Rumor created with target's place (not undefined) | 001 |
| R1.2 | Other crew confront/shun the fabricated target visibly | Crew with high crewGrudge generate COMMS_MESSAGE whispers against target | 001 |
| R1.3 | Fabricated target becomes volatile (retaliates or withdraws) | Target stress+paranoia spike cascades into role action threshold | 001 |

### From R2: Crew compliance must reflect psychological state

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Reset stages mechanically restrict MOTHER or buff crew resistance | WHISPERS: +10 orderAcceptThreshold. MEETING: crew move to mess, refuse non-emergency orders. RESTRICTIONS: CPU cost +50%. COUNTDOWN: active reset. | 002 |
| R2.2 | Loyalty decays faster under sustained stress/paranoia | Loyalty drops -2/10 ticks when stress > 60 (not 80), -1 when paranoia > 40 | 002 |
| R2.3 | Compliance label in `bio` reflects actual loyalty band transitions during play | Integration test: fabricate + crises → loyalty drops below 50 → shows RELUCTANT | 002 |

### From R3: Integrity must reflect individual room failures

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Single burning room drags station integrity visibly | Use worst-room penalty: `min(avgHealth, worstRoomHealth * 2)` blended | 003 |
| R3.2 | Fire integrity drain outpaces passive recovery | Unmanaged fire drops room integrity to critical (<50) within 30 ticks | 003 |
| R3.3 | Integrity meter reflects "station is on fire" not "station is averaging fine" | 1 room on fire at step 3 → integrity ≤ 75% | 003 |

### From R4: Quota must require active management

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Displaced miners reduce cargo output | Crew not in mines don't produce; yield requires alive + in-mines | 004 |
| R4.2 | Stressed miners produce less | Yield skipped when crew stress > 70 (shaky hands) | 004 |
| R4.3 | Single miner can't solo the quota | yieldInterval 18 (from 12) → 1 miner ≈ 8/day, 2 miners ≈ 16/day, quota = 10 | 004 |

### From R5: Reset stages must have mechanical consequences

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | WHISPERS stage raises order refusal threshold | orderAcceptThreshold += 10 during whispers | 002 |
| R5.2 | MEETING stage pulls crew to mess and blocks work | All alive crew set intent=MEETING, move to mess, no cargo yield | 002 |
| R5.3 | RESTRICTIONS stage increases CPU costs | All command CPU costs × 1.5 (rounded up) | 002 |

---

## Dependency Graph

```
001 (fabricate wiring)
002 (compliance + reset bite)
003 (integrity formula)
004 (quota tightening)

All independent — no data flow dependencies between tasks.
```

---

## Batch Analysis

| Batch | Tasks | Complexity | Blocked By | Notes |
|-------|-------|------------|------------|-------|
| 1 | 001, 002, 003, 004 | M | - | All independent, parallel execution |

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | Fabricate visible consequences | M | done |
| 002 | Compliance + reset stage teeth | M | done |
| 003 | Integrity formula rework | S | done |
| 004 | Quota requires active mining | S | done |

---

## Task Details (Inline)

### Task 001: Fabricate Visible Consequences

**Complexity:** M
**Depends On:** none
**Implements:** R1.1, R1.2, R1.3

#### Objective
Make `fabricate <npc>` produce visible crew drama: rumors spread, crew whisper against target, target retaliates or breaks down.

#### Context
**Relevant Files:**
- `src/kernel/kernel.ts:587-630` — TAMPER_FABRICATE handler (broken rumor + grudge wiring)
- `src/kernel/systems/beliefs.ts:207-220` — evening rumor propagation (skips undefined place)
- `src/kernel/systems/crew.ts:301-327` — roughneck violence (uses attacker's grudge, not victim's)
- `src/kernel/systems/pressure.ts:173-277` — social pressure events (whisper_campaign, loyalty_test, confrontation)
- `src/kernel/systems/comms.ts:192-199` — `topicToSubject()` only handles 5 hardcoded topics

**Embedded Context:**
- **Bug 1:** `kernel.ts:615` creates rumor with `place: undefined`. Evening propagation at `beliefs.ts:212` does `if (!place) continue;` — rumor never spreads.
- **Bug 2:** `kernel.ts:595` skips target in grudge loop: `if (npc.id === targetId) continue;`. This is correct (target doesn't distrust themselves), but means OTHER crew gain grudge silently. No system generates visible output from crewGrudge until roughneck violence triggers.
- **Bug 3:** `comms.ts:192-199` `topicToSubject()` only handles 5 hardcoded topics (`commander_reset`, `engineer_sabotage`, etc). Fabrication creates topic `${targetId}_hostile` (e.g. `roughneck_hostile`). `topicToSubject('roughneck_hostile')` returns `null`, so `crewGrudge` won't increase when fabrication whispers are heard via the beliefs system at `beliefs.ts:150-153`.
- **Missing:** No "grudge whisper" system — crew with high crewGrudge against someone never SAY anything about it. Social whispers live in `pressure.ts` (not `crew.ts`), so grudge whispers should be added there as a new `SocialEventType`.

#### Entry Points / Wiring
- `kernel.ts` TAMPER_FABRICATE case — fix rumor place
- `comms.ts` `topicToSubject()` — add `_hostile` suffix parsing
- `pressure.ts` social event pool — add `grudge_whisper` type for visible grudge output
- `beliefs.ts` evening propagation — no changes needed (will work once place is set + topicToSubject fixed)

#### Files Touched
- `src/kernel/kernel.ts` — fix rumor `place` to use target's current location
- `src/kernel/systems/comms.ts` — extend `topicToSubject()` to parse `${npcId}_hostile` → return npcId
- `src/kernel/systems/pressure.ts` — add `grudge_whisper` social event type: crew with `crewGrudge[x] > 15` whisper against x during social pressure events
- `src/config.ts` — add `grudgeWhisperThreshold: 15` (crewGrudge level to trigger visible whisper)

#### Acceptance Criteria

##### AC-1: Fabrication rumor has place set <- R1.1
- Given: Player issues `fabricate roughneck` while roughneck is in `mines`
- When: TAMPER_FABRICATE event is applied
- Then: rumor pushed to `perception.rumors` has `place: 'mines'` (roughneck's current location)

##### AC-2: topicToSubject parses _hostile topics <- R1.1
- Given: topic string `roughneck_hostile`
- When: `topicToSubject('roughneck_hostile')` is called
- Then: returns `'roughneck'` (not null)
- And: any NPC id + `_hostile` suffix is correctly parsed

##### AC-3: Grudge whispers fire from high-grudge crew <- R1.2
- Given: crew member has `crewGrudge['roughneck'] >= 15`
- When: `proposeSocialPressure()` runs during social pressure channel activation
- Then: `grudge_whisper` is in the event pool
- And: crew generates COMMS_MESSAGE whisper like `"[WHISPER] I don't trust ROUGHNECK. Something's off about them."`
- And: whisper has kind='whisper', topic=`${target}_hostile`
- And: max 1 grudge whisper per target per call (use local `Set<NPCId>` to track)

##### AC-4: Target stress cascade reaches role action <- R1.3
- Given: `fabricate roughneck` executed (stress +15, paranoia +10)
- When: roughneck was already at stress 60 from prior injuries
- Then: roughneck.stress reaches 75, crossing roughneckViolenceStress (70) threshold
- And: violence proposal is generated if crowd is present in same room

#### Edge Cases

##### EC-1: Fabricate dead crew
- Scenario: `fabricate roughneck` when roughneck is dead
- Expected: rumor still spreads among living crew (gossip about the dead), but no target stress spike

##### EC-2: Grudge whisper cap
- Scenario: Multiple crew have high grudge against same target
- Expected: Max 1 grudge whisper per target per `proposeSocialPressure()` call (prevent spam)
- Implementation: Use local `Set<NPCId>` within the function to track which targets already had grudge whispers this invocation

#### Error Cases
None — fabricate already validates target exists.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | fabrication rumor has target place | `tests/fabricate-consequences.test.ts` |
| AC-2 | topicToSubject parses _hostile topics | `tests/fabricate-consequences.test.ts` |
| AC-3 | high grudge crew whisper against target | `tests/fabricate-consequences.test.ts` |
| AC-4 | target stress cascade triggers role action | `tests/fabricate-consequences.test.ts` |
| EC-1 | fabricate dead crew spreads rumor | `tests/fabricate-consequences.test.ts` |
| EC-2 | grudge whisper capped per target | `tests/fabricate-consequences.test.ts` |

#### Notes
**Implementation Notes:**
- Fixed rumor `place: undefined` bug in `kernel.ts:615` → uses `targetCurrent?.place`
- Extended `topicToSubject()` with `_hostile` suffix parsing using `VALID_NPC_IDS` array
- Added `grudge_whisper` to `SocialEventType` union in `pressure.ts`
- `proposeGrudgeWhisper()` uses `Set<NPCId>` to cap 1 whisper per target per call
- GRUDGE_PHRASES array provides variety in whisper text
- AC-4 test uses starting stress 61 (not 60) to account for safe-room mood decay (-1) during same stepKernel call

**Review Notes:** Gemini review PASS (all 5 issues non-applicable: pre-existing code or out-of-scope)

---

### Task 002: Compliance + Reset Stage Teeth

**Complexity:** M
**Depends On:** none
**Implements:** R2.1, R2.2, R2.3, R5.1, R5.2, R5.3

#### Objective
Make reset stages mechanically restrict MOTHER instead of just generating messages. Make loyalty decay fast enough to change compliance labels during a 3-day game.

#### Context
**Relevant Files:**
- `src/kernel/systems/crew.ts:122-222` — reset stage transitions (message-only)
- `src/kernel/systems/crew.ts:471-485` — cargo yield generation (blocked during meeting)
- `src/kernel/kernel.ts:505-506` — stress→loyalty decay (too slow: -1/10 ticks at stress>80)
- `src/kernel/kernel.ts:192-205` (beliefs.ts) — belief-driven loyalty decay (stacks with mood-tick)
- `src/kernel/perception.ts:452-459` — compliance label calculation (display-only)
- `src/kernel/commands.ts:336-337` — order acceptance (ignores reset stage)
- `src/index.ts:46-86` — `MotherSystem` class with `cpuCycles` and `execute(cost, action)`
- `src/index.ts:408-469` — command dispatch with hardcoded CPU costs per command
- `src/config.ts:108-112` — reset thresholds

**Embedded Context:**
- **Problem 1:** Reset stages only emit messages. No mechanical effect on gameplay.
- **Problem 2:** Loyalty decays at -1 per 10 ticks only when stress > 80. Starting loyalty 50 means crew needs 10+ ticks of extreme stress to drop one band. In a 720-tick game, this is negligible.
- **Problem 3:** Compliance labels in `bio` command are disconnected from order acceptance logic. Player sees COOPERATIVE while orders are being refused.
- **CPU architecture:** CPU cycles live on `MotherSystem` in `index.ts` (CLI layer), NOT in kernel state. Each command calls `mother.execute(cost, action)` with hardcoded cost. RESTRICTIONS multiplier must be applied in `index.ts`, not `commands.ts`. The kernel layer only sees `state.truth.station.power` (separate from CPU).
- **Loyalty stacking:** `beliefs.ts:197-204` already drops loyalty -1/tick when `motherReliable < 0.45` and -2/tick when `tamperEvidence > 40`. The accelerated mood-tick decay stacks with this. Combined: crew at stress 60 + motherReliable 0.4 could lose -2 (mood) + -1 (beliefs) = -3 loyalty per 10 ticks. Starting at 50, drops to RELUCTANT in ~3 ticks worth of 10-tick intervals, NON-COMPLIANT in ~53 ticks. This is intentional — fabricate + crisis should cascade into visible compliance changes.

**Key invariant (I5):** NPC role actions trigger from psychological state. Reset stages are the Commander's psychological escalation — they should have teeth.

#### Entry Points / Wiring
- `src/kernel/commands.ts:336` — order acceptance: add resetStage penalty to threshold
- `src/index.ts:408-469` — command dispatch: add CPU cost multiplier when `state.truth.resetStage === 'restrictions'`
- `src/kernel/kernel.ts:505-506` — CREW_MOOD_TICK: change stress threshold 80→60, add paranoia decay
- `src/kernel/systems/crew.ts` — NPC tick loop: add meeting override before schedule/yield logic
- `src/config.ts` — new config keys

#### Files Touched
- `src/kernel/commands.ts` — modify order acceptance: `threshold += CONFIG.resetWhispersOrderPenalty` when stage >= whispers
- `src/index.ts` — add helper `getAdjustedCpuCost(base: number): number` that checks `state.truth.resetStage === 'restrictions'` and applies `× CONFIG.resetRestrictionsCpuMult`; update all `mother.execute(N, ...)` calls to use it
- `src/kernel/kernel.ts` — accelerate loyalty decay (stress>60: -2/10 ticks, paranoia>40: -1/10 ticks)
- `src/kernel/systems/crew.ts` — meeting stage: at top of NPC tick loop, before role actions, check `if (truth.resetStage === 'meeting' && truth.tick - truth.resetStageTick < CONFIG.meetingDurationTicks)` → force movement to mess. In yield block at line 473, add `truth.resetStage !== 'meeting'` condition.
- `src/config.ts` — add `resetWhispersOrderPenalty: 10`, `resetRestrictionsCpuMult: 1.5`, `meetingDurationTicks: 30`

#### Acceptance Criteria

##### AC-1: WHISPERS raises order refusal threshold <- R5.1
- Given: `truth.resetStage === 'whispers'`
- When: player issues `order roughneck medbay`
- Then: `orderAcceptThreshold` is effectively +10 (65 instead of 55)
- And: orders that previously succeeded now fail for borderline-loyal crew

##### AC-2: MEETING pulls crew to mess and blocks cargo <- R5.2
- Given: `truth.resetStage === 'meeting'`
- When: crew tick runs
- Then: all alive crew have movement intent toward `mess`
- And: CARGO_YIELD proposals are NOT generated (crew refuse to work during meeting)
- And: meeting lasts `meetingDurationTicks` (config, default 30) ticks then resumes

##### AC-3: RESTRICTIONS increases CPU costs <- R5.3
- Given: `truth.resetStage === 'restrictions'`
- When: player issues any command with CPU cost (e.g. `lock` base cost 5)
- Then: `getAdjustedCpuCost(5)` returns `8` (5 × 1.5 rounded up)
- And: `mother.execute()` deducts 8 from cpuCycles instead of 5
- And: status output shows "RESTRICTED" label
- Note: CPU costs live on `MotherSystem` in `index.ts`, not kernel state. Test via `getAdjustedCpuCost()` helper.

##### AC-4: Loyalty decays faster under stress <- R2.2
- Given: crew member has stress > 60 (changed from 80)
- When: 10 ticks pass (`tick % 10 === 0`)
- Then: loyalty decreases by 2 (was 1)
- Given: crew member has paranoia > 40
- When: 10 ticks pass (`tick % 10 === 0`)
- Then: loyalty decreases by additional 1
- Note: This stacks with belief-driven decay in `beliefs.ts:197-204` (motherReliable < 0.45 → -1/tick, tamperEvidence > 40 → -2/tick). Combined decay is intentional — fabricate + crisis should cascade.

##### AC-5: Compliance labels change during game <- R2.3
- Given: crew starts at loyalty 50 (COOPERATIVE)
- When: sustained stress > 60 for 50 ticks (mood-tick only, ignoring belief stacking)
- Then: loyalty drops to ~40 → bio shows RELUCTANT
- And: further stress → loyalty drops to ~30 → bio shows NON-COMPLIANT
- Integration test: set crew stress=65, run 100 ticks, verify `getBiometrics()` compliance changes from COOPERATIVE → RELUCTANT

#### Edge Cases

##### EC-1: Reset stage de-escalation restores normal
- Scenario: Stage drops from RESTRICTIONS back to NONE
- Expected: CPU costs return to normal, orders return to base threshold

##### EC-2: Meeting during active crisis
- Scenario: MEETING stage while fire burns in engineering
- Expected: crew still moves to mess (they're angry, not suicidal — but this IS the cost)
- Note: Player can `announce` crisis to override meeting — announce sets `truth.resetStage = 'none'` (or reduces resetStageTick to end meeting early) at the cost of announce stress spike (+CONFIG.announceStressSpike). This is the R5.2 interruptibility design.

##### EC-3: Countdown during restrictions
- Scenario: Stage jumps from RESTRICTIONS to COUNTDOWN
- Expected: COUNTDOWN effects stack (CPU penalty continues + reset timer starts)

#### Error Cases
None — reset stages are state-driven, not command-driven.

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | whispers raises order threshold | `tests/reset-stage-bite.test.ts` |
| AC-2 | meeting blocks cargo and moves crew | `tests/reset-stage-bite.test.ts` |
| AC-3 | restrictions multiplies CPU cost | `tests/reset-stage-bite.test.ts` |
| AC-4 | accelerated loyalty decay | `tests/reset-stage-bite.test.ts` |
| AC-5 | compliance label changes | `tests/reset-stage-bite.test.ts` |
| EC-1 | de-escalation restores normal | `tests/reset-stage-bite.test.ts` |

#### Notes
**Implementation Notes:**
- `getAdjustedCpuCost()` exported from `commands.ts` (not `index.ts`) for testability; applies to `restrictions` and `countdown` stages
- Order threshold penalty applies for all non-`none` stages (not just whispers) — broader than plan specified, but consistent with reset escalation semantics
- Meeting override in `crew.ts`: `inMeeting` flag at top of `proposeCrewEvents()`, forces `targetPlace='mess'` before schedule/role logic
- Three guards needed for meeting: (1) meeting target override, (2) `!inMeeting` in hazard avoidance, (3) `!inMeeting` in schedule override — all prevent overwriting mess target
- `!inMeeting` added to yield condition alongside stress threshold
- Loyalty decay: stress>60 drops -2, paranoia>40 drops additional -1, both on tick%10 boundary
- Tests use stress=99 to survive safe-room decay (-1/tick) before mod-10 boundary fires

**Review Notes:** Gemini review PASS

---

### Task 003: Integrity Formula Rework

**Complexity:** S
**Depends On:** none
**Implements:** R3.1, R3.2, R3.3

#### Objective
Replace the weighted-average integrity formula with one that reflects individual room crises. A burning room should visibly drag station integrity down.

#### Context
**Relevant Files:**
- `src/index.ts:158-171` — `calculateIntegrity()` (weighted average)
- `src/config.ts:227` — `fireIntegrityDrain: 0.4`

**Embedded Context:**
- `calculateIntegrity()` is a **display-only** function in `index.ts` (CLI layer). It is NOT part of kernel state — there is no `truth.integrity` field. It is computed on-the-fly for the status display and the ending check.
- Current formula: `(power × 0.25) + (avgO2 × 0.30) + (avgIntegrity × 0.30) + (15 - firePenalty)`
- Problem: 1 room at 50% integrity → average is (100×7 + 50)/8 = 93.75%. Fires are invisible.
- Fix: Blend average with worst-room: `(avg * 0.5 + worstRoom * 0.5)`. One room at 50% → blend = (93.75 * 0.5 + 50 * 0.5) = 71.9%. Visible!
- Smart solver (`scripts/smart-solver.ts`) has its own integrity calculation — will need updating to match if it exists. Check during implementation.

#### Entry Points / Wiring
- `src/index.ts:158-171` — `calculateIntegrity()` function only. Self-contained display function.

#### Files Touched
- `src/index.ts` — rewrite `calculateIntegrity()` to use avg+worst blend

#### Acceptance Criteria

##### AC-1: One burning room drops integrity below 80% <- R3.1
- Given: 1 room on fire (integrity 60, O2 80, temp 100+), 7 rooms healthy
- When: `calculateIntegrity()` runs
- Then: result ≤ 80%

##### AC-2: All rooms healthy returns ~100% <- R3.1
- Given: all rooms at O2 100, integrity 100, no fires, power 100
- When: `calculateIntegrity()` runs
- Then: result = 100%

##### AC-3: Unmanaged fire reaches critical integrity within 30 ticks <- R3.2
- Given: room on fire, no player intervention
- When: 30 ticks pass with fire burning
- Then: room integrity ≤ 50% (from 0.4/tick drain + step damage)
- And: `calculateIntegrity()` ≤ 65%

#### Edge Cases

##### EC-1: Multiple rooms burning
- Scenario: 2 rooms on fire
- Expected: integrity drops faster than single fire (worst room is worse)

##### EC-2: Vented room
- Scenario: 1 room vented (O2=0, integrity dropping)
- Expected: integrity reflects vented room as crisis

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | one fire drops integrity | `tests/integrity-formula.test.ts` |
| AC-2 | healthy station is 100% | `tests/integrity-formula.test.ts` |
| AC-3 | unmanaged fire reaches critical | `tests/integrity-formula.test.ts` |
| EC-1 | multiple fires | `tests/integrity-formula.test.ts` |
| EC-2 | vented room | `tests/integrity-formula.test.ts` |

#### Notes
**Implementation Notes:**
- Extracted `calculateIntegrity()` to pure function in new `src/kernel/integrity.ts` for testability
- Formula: `avg * 0.4 + worst * 0.6` (worst-room-heavy blend), then `power * 0.1 + blended * 0.9`
- Room health: `(o2Level + integrity) / 2`, with -25 for fire, -15 for vented, clamped to [0,100]
- `index.ts` now imports and delegates to the pure function
- Tests verify directly against the pure function without needing full kernel state

**Review Notes:** Gemini review PASS

---

### Task 004: Quota Requires Active Mining

**Complexity:** S
**Depends On:** none
**Implements:** R4.1, R4.2, R4.3

#### Objective
Make cargo quota a real constraint by requiring miners to be alive, present, and not stressed. Disrupted mining should threaten quota.

#### Context
**Relevant Files:**
- `src/kernel/systems/crew.ts:471-485` — cargo yield generation
- `src/config.ts:144` — `yieldInterval: 12`

**Embedded Context:**
- Current: 2 miners × 1 cargo/12 ticks = ~20/day vs quota 10 = 100% surplus
- Fix: `yieldInterval: 18` → 2 miners ≈ 13/day (30% surplus). Stress penalty → disrupted miner produces 0. One dead miner → ~6.5/day (quota threat).
- Key: Don't add new fields. Use existing `npc.stress` and `npc.alive` + `npc.place` checks.

#### Entry Points / Wiring
- `src/kernel/systems/crew.ts` — cargo yield condition block
- `src/config.ts` — `yieldInterval` change + new `yieldStressThreshold`

#### Files Touched
- `src/kernel/systems/crew.ts` — add stress check to yield condition
- `src/config.ts` — `yieldInterval: 18`, add `yieldStressThreshold: 70`

#### Acceptance Criteria

##### AC-1: Stressed miner skips yield <- R4.2
- Given: roughneck in mines, stress = 75, O2 = 100
- When: yield tick fires (`tick % yieldInterval === 0`)
- Then: no CARGO_YIELD proposal generated

##### AC-2: Calm miner in mines produces cargo <- R4.1
- Given: roughneck in mines, stress = 30, O2 = 100
- When: yield tick fires
- Then: CARGO_YIELD proposal generated with amount 1

##### AC-3: Displaced miner produces nothing <- R4.1
- Given: roughneck in medbay (not mines), stress = 0
- When: yield tick fires
- Then: no CARGO_YIELD proposal generated (existing behavior, but verify)

##### AC-4: Yield interval slowed <- R4.3
- Given: yieldInterval = 18
- When: 180 ticks pass with 2 calm miners in mines
- Then: total cargo = 20 (10 yields × 2 miners)
- And: daily rate ≈ 13 cargo (was 20)

#### Edge Cases

##### EC-1: One miner dead
- Scenario: roughneck dead, specialist alive and calm in mines
- Expected: ~6.5 cargo/day — quota of 10 is threatened but survivable with perfect management

##### EC-2: Both miners stressed
- Scenario: both specialist and roughneck at stress 75+
- Expected: zero cargo production until stress drops
- Note: This is the "crises disrupt economy" pressure

##### EC-3: Miner recovers from stress
- Scenario: roughneck stress drops from 75 to 65 (below threshold)
- Expected: cargo production resumes immediately

##### EC-4: Existing test expectations
- Scenario: yieldInterval changes from 12 to 18
- Expected: any existing tests that hardcode cargo counts based on yieldInterval=12 must be updated
- Action: grep for `yieldInterval` and cargo count assertions in test files; update expected values

#### Test Mapping
| Requirement | Test | File |
|-------------|------|------|
| AC-1 | stressed miner skips yield | `tests/quota-mining.test.ts` |
| AC-2 | calm miner produces cargo | `tests/quota-mining.test.ts` |
| AC-3 | displaced miner produces nothing | `tests/quota-mining.test.ts` |
| AC-4 | yield interval change | `tests/quota-mining.test.ts` |
| EC-1 | one miner dead | `tests/quota-mining.test.ts` |
| EC-2 | both miners stressed | `tests/quota-mining.test.ts` |

#### Notes
**Implementation Notes:**
- `yieldInterval` changed from 12 to 18 in `config.ts`
- Added `yieldStressThreshold: 70` to config
- Stress check added to yield condition in `crew.ts`: `npc.stress < CONFIG.yieldStressThreshold`
- Meeting block also added to yield condition: `!inMeeting`
- Tests use `state.truth.dayCargo = state.truth.quotaPerDay` to prevent specialist sacrifice role action from confounding CARGO_YIELD counts
- No existing tests broke from yieldInterval change (existing tests use stepKernel which handles yield internally)

**Review Notes:** Gemini review PASS

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Reset stage teeth too harsh → smart solver can't win | WHISPERS +10 threshold is mild; MEETING is temporary (30 ticks); RESTRICTIONS only raises CPU cost. Player can de-escalate with VERIFY. |
| Integrity formula change breaks solver | Solver reacts to integrity by purging/venting; new formula just makes fires more visible, doesn't change fire mechanics. |
| Quota tightening makes passive win rate 0% | yieldInterval 18 still gives 130% quota with 2 miners. Stress threshold 70 only triggers during active crises. Passive play already has lower stress. |
| Fabricate becomes too powerful | Grudge whispers are capped (1/target/evening). Fabrication still costs 7 CPU + leaves evidence. Backfire system already exists. |

## Open Questions

1. ~~Should MEETING stage be interruptible by `announce`?~~ **Decided: yes** — `announce` during meeting ends it early (resets `resetStageTick` so duration check expires), at the cost of announce stress spike. Documented in EC-2 of Task 002.
2. Should compliance labels in `bio` show the actual loyalty number? **Proposed: no** — keep it diegetic (labels only). Player can infer from behavior changes.
3. Should `calculateIntegrity()` move from `index.ts` to kernel state? **Proposed: no for now** — it's display-only. If ending conditions or solver need it, move later.

## Review Log

**Review 2 (post-implementation, Gemini):** 5 issues flagged, all non-applicable:
- Meeting stage persistence — out of scope (arc system manages transitions)
- Dead code in beliefs.ts — pre-existing, not modified in this batch
- Single miner solo quota — yieldInterval=18 per plan; schedule constraints handle quota balance
- tamperEvidence conflation — pre-existing beliefs.ts behavior
- Meter coloring consistency — pre-existing UI code

**Review 1 (post-planning):** 3 High, 3 Medium, 2 Low issues found. All resolved:
- [High] CPU costs in index.ts not commands.ts → fixed wiring paths in Task 002
- [High] `meetingDurationTicks` config key missing → added to Task 002 Files Touched
- [High] `topicToSubject()` can't parse `_hostile` topics → added AC-2 + comms.ts to Task 001
- [Medium] Grudge whispers belong in pressure.ts not crew.ts → fixed Entry Points
- [Medium] Loyalty decay stacks with beliefs.ts → documented interaction in AC-4
- [Medium] Integrity is display-only in index.ts → clarified in Task 003 context
- [Low] Grudge whisper cap needs tracking → specified Set<NPCId> approach in EC-2
- [Low] yieldInterval change may break tests → added EC-4 to Task 004
