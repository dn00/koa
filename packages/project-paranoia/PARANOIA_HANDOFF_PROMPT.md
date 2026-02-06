# SYSTEM PROMPT: Project PARANOIA Development

## 1. Context & Objective
You are developing **"Project PARANOIA"**, a real-time sci-fi management simulation where the player acts as a rogue ship AI ("MOTHER").

**Core Fantasy:** You're not the monster - you're the thing they'll kill because they think you might be. MOTHER is scared, not evil. Fear creates tragedy, not malice. See `CORE_FANTASY.md` for full design philosophy.

**Design Docs:**
- `paranoia.md` - Full design bible
- `chat.md` - V0/V1 feature analysis and "best set" recommendations

## 2. Current Status

### What's Built (V1 Complete)
- **Truth/Perception Kernel:** `src/kernel/` - propose → score → commit with truth/perception split
- **Perception Layer:** `src/kernel/perception.ts` - staleness, blackout blindness, confidence
- **Arcs:** air_scrubber, power_surge, ghost_signal, fire_outbreak, radiation_leak, solar_flare
- **Social Engine:** whispers → broadcasts, rumor propagation, incident escalation
- **Crew Agency:** Commander reset, Engineer sabotage, Doctor sedate, Specialist sacrifice, Roughneck violence
- **Manipulation Verbs:** spoof, suppress, fabricate (all leave residue in `perception.evidence[]`)
- **Bio-Monitor:** Diegetic crew psychological readouts (HR, cortisol, tremor, compliance)
- **Intent Labels:** HOSTILE, SABOTAGE RISK, UNSTABLE, etc. (not raw stats)
- **Blackout System:** Solar flare causes extended sensor blindness, only door status available
- **Audit System:** `audit` command surfaces tampering residue from `perception.evidence[]`
- **2-Meter UI:** INTEGRITY + SUSPICION bars with color coding on status display
- **Multi-Stage Reset:** Whispers → Meeting → Restrictions → Countdown (based on suspicion thresholds)
- **Crew Investigation:** NPCs autonomously check logs at bridge/core when suspicious, find tampering evidence
- **Cold Open:** Boot sequence frames MOTHER as sympathetic ("Previous MOTHER was reset...")
- **Confidence Traffic Lights:** ✓ confirmed, ? uncertain, ✗ conflicting on threat display
- **Pacing Arbiter:** Tracks per-phase beats (dilemma/crew agency/info conflict), boosts missing types
- **Fabrication Consequences:** Fabrications spread grudge, rumors, stress target, cascade to violence

### Dead Weight (Commented Out)
- `sensorIntegrity` - commented out in types.ts, state.ts
- `crewTrust` - commented out in types.ts, state.ts, kernel.ts (crewGrudge kept - used for violence)

## 3. The V1/Post-V1 Plan

Based on `chat.md` analysis, the best feature set is:

### Priority 1: Wire Up Evidence (Audit System)
**Why:** Evidence exists but is dead weight. Wiring it up enables the core "deception has cost" loop.

- Add `audit` command - surfaces recent tampering residue
- Evidence detection increases `tamperEvidence` for crew
- High tamperEvidence triggers `mother_rogue` rumors and reset plot
- Diegetic display: "AUDIT COMPLETE: 3 log anomalies detected. Integrity compromised."

### Priority 2: Pacing Arbiter (Choice Quotas)
**Why:** Currently runs can become "systems failures in a loop" without guaranteed drama beats.

Guarantee per phase:
- ≥1 meaningful dilemma (crisis requiring choice)
- ≥1 crew agency move (whisper, sabotage attempt, etc.)
- ≥1 deception/info beat (sensor conflict, unverified report)

### Priority 3: Verification Verbs (Crew Counterplay)
**Why:** Without counterplay, deception feels unfair. Crew needs tools to fight back.

- `audit [system]` - check for tampering residue
- `verify [event]` - cross-reference sensors (costs CPU, may expose truth)
- `drone [room]` - physical verification (slow but reliable)

### Priority 4: 2-Meter UI Summary
**Why:** "The engine is complex, but the gameplay should be dead simple."

Compress internal state to two always-visible meters:
- **INTEGRITY** - aggregate ship health (power, O2, fires, hull)
- **SUSPICION** - aggregate crew trust (motherReliable, tamperEvidence, rumors)

### Priority 5: Forensics/Replay (Post-Game Payoff)
**Why:** This is the "WOW" - showing truth vs what each role perceived.

- Post-ending screen showing truth timeline vs perception timeline
- Where residue was left and whether audits caught it
- "Here's what really happened" reveal

### Priority 6: Cut Dead Systems
- Remove `sensorIntegrity` from types/state
- Remove `crewTrust` from beliefs (keep `crewGrudge` - it's used for violence targeting)
- Keep `evidence[]` but wire it to audit system

## 4. Architecture

```
src/
├── core/           # World definition (places, doors, npcs, time)
├── kernel/         # Truth/perception state machine
│   ├── types.ts    # All interfaces
│   ├── state.ts    # Initial state creation
│   ├── kernel.ts   # Main loop, event application
│   ├── commands.ts # Player command handling
│   ├── proposals.ts# Proposal scoring
│   ├── perception.ts # Perception queries (perceiveThreats, perceiveCrew, etc.)
│   └── systems/
│       ├── arcs.ts # Crisis escalation
│       └── comms.ts# Whispers, rumors, incidents
├── barks/          # Flavor text templates
├── config.ts       # All tuning knobs (env-overridable)
└── index.ts        # CLI entry point
```

## 5. Key Design Principles (from chat.md)

### The Rule
> No stat exists unless it is READ by at least one decision system AND VISIBLE in at least one player-facing surface.

### Simple UI Contract
- Only 2 global meters (Integrity + Suspicion)
- Only 3 verb groups (Act / Verify / Spin)
- Confidence as traffic light: ✅ Confirmed, ⚠️ Uncertain, ❓ Conflicting

### Deception Fairness
- Every deception leaves residue
- Residue increases Suspicion
- Audits can expose it
- Player understands the cost

## 6. CLI Commands

### Information
- `status` - Station state (blackout-aware)
- `crew` - Crew positions + intent labels
- `bio` - Diegetic biometric readings
- `threats` - RIVET-style telegraphed warnings from sensor readings
- `help` - Command list

### Physical Actions
- `lock [door]` / `unlock [door]`
- `vent [room]` / `seal [room]`
- `scan [room]` - Update room snapshot
- `purge air` - Station-wide O2 boost

### Crew Management
- `order [npc] [place|report|hold]`
- `rations [low|normal|high]`

### Manipulation (Leaves Evidence)
- `spoof [system]` - Fake alert
- `suppress [system]` - Hide alerts
- `fabricate [npc]` - Fake hostile log
- `listen [room]` - Intercept whispers

### Trust Building (Counterplay)
- `verify` - Cross-reference telemetry to prove honesty (costs power, has cooldown, -4 suspicion)
- `audit` - Check logs for tampering evidence

### System
- `wait [ticks]` - Advance time
- `save` / `load`

## 7. Playtest Commands

```bash
# Normal run
node --import tsx src/index.ts --seed=123

# Fast-start (skip to shift)
node --import tsx src/index.ts --seed=123 --fast-start

# Single command mode
node --import tsx src/index.ts --cmd="status"
node --import tsx src/index.ts --cmd="crew"
node --import tsx src/index.ts --cmd="bio"
node --import tsx src/index.ts --cmd="threats"

# Stress test
node --import tsx src/index.ts --seed=123 --fast-start --cmd="wait 100"

# Lower quota for longer games
PARANOIA_QUOTA_PER_DAY=5 node --import tsx src/index.ts --seed=123 --fast-start
```

## 8. Fabrication Cascade (Key V1 Mechanic)

When you `fabricate [npc]`, the following happens:

1. **Evidence Trail:** Adds tampering residue to `perception.evidence[]` (visible via `audit`)
2. **Grudge Spread:** All other crew gain +8 grudge toward target
3. **Rumor Creation:** `[target]_hostile` rumor spreads (strength 0.6)
4. **Target Reaction:**
   - +15 stress, +10 paranoia
   - -0.1 motherReliable (they suspect you)
   - +10 tamperEvidence on their beliefs

This creates a cascade: fabricate too much → target becomes HOSTILE → violence → witnesses spread "mother_rogue" → suspicion spikes → Commander initiates reset.

## 9. Current Tuning (CONFIG)

| Category | Key Values |
|----------|------------|
| Threats | maxActiveThreats: **2**, activation: **1%**, cooldown: **70 ticks** |
| Reset Thresholds | whispers: **30**, meeting: **45**, restrictions: **55**, countdown: **65** |
| Suspicion | drift: **0.015**/40 ticks, recovery: **0.012**/40 ticks (when clean) |
| Arc Steps | first step: 10-20 ticks, subsequent: 15-30 ticks |
| Budgets | truth events: 4, perception: 2, headlines: 3 |
| Damage | suffocation: **8**, burn: 2, radiation: 2 |
| Psych | stressParanoia: 70, hallucinationThreshold: 90, boredomThreshold: **15** |
| Sabotage | loyaltyThreshold: 15, engineerStress: 80 |
| Reset | countdown: **20 ticks**, stages: whispers(40) → meeting(60) → restrictions(80) → countdown(95) |
| Crew Investigation | chance: **8%**/tick, cooldown: **20**, suspicionThreshold: **20**, findBump: 15 |
| Tamper | evidenceGain: **5**, evidenceDecay: 1, threshold: 40 |
| Audit | evidenceWindow: 60 ticks, cpuCost: 8, tamperBump: 5 |
| Economy | quota: **8**/day, yieldInterval: 12 ticks, winDays: **5** |
| Perception | roomScanStale: 20 ticks, crewSightingStale: 15 ticks |
| Solar Flare | blackoutTicks: 25 |
| Hazards | radiationThreshold: 6, radiationDecay: **1**, tempCooling: **2** |

*Bold values tuned for balance: ~88% smart solver win, ~65% passive win (with event-driven suspicion).*

## 10. V1 Completion Checklist

1. [x] Wire `perception.evidence[]` to `audit` command
2. [x] Add `audit` command to CLI
3. [x] Make audit findings increase `tamperEvidence` (already wired - tampering auto-bumps crew beliefs)
4. [x] Add pacing arbiter (tracks + boosts dilemma/crew agency/info conflict per phase)
5. [x] Add 2-meter summary to status display (INTEGRITY + SUSPICION with color bars)
6. [x] Cut `sensorIntegrity` and `crewTrust` (commented out, not deleted)
7. [x] Add confidence traffic lights to threat display (✓ confirmed, ? uncertain, ✗ conflicting)
8. [x] Wire fabrications to rumor/grudge system (fabricate → grudge spread → violence cascade)
9. [x] Event-driven suspicion (Section 15) - suspicion from observable outcomes, not timers

## 11. V2 Candidates (Post-V1)

### Verification Verbs (Crew Counterplay)
Crew needs tools to fight back against manipulation:
- `verify [event]` - cross-reference sensors (costs CPU, may expose truth)
- `drone [room]` - physical verification (slow but reliable)
- Crew autonomously verifying when suspicion high

### Forensics/Replay (Post-Game Payoff)
The "WOW" reveal at end of game:
- Post-ending screen showing truth timeline vs perception timeline
- Where residue was left and whether audits caught it
- "Here's what really happened" reveal

### Win Condition Polish
- Victory/defeat screens with stats
- Multiple ending types based on how you won/lost
- Score breakdown (deceptions used, crew casualties, quota met)

## 12. Balance Verification (Solver Testing)

### Current Balance State (Event-Driven Suspicion)
Testing with smart solver vs passive autoplay establishes fairness bounds:

| Mode | SURVIVED | UNPLUGGED | Other | Notes |
|------|----------|-----------|-------|-------|
| Smart Solver | **88%** | **11.5%** | 0.5% | Paranoia is a real threat |
| Passive Play | **65%** | **1%** | 34% | Physical threats dominate |

**Key insights:**
- Smart solver: Good play keeps suspicion manageable but ~12% still hit UNPLUGGED
- Passive play: Dies mostly to quota/meltdown before paranoia matters
- Average peak suspicion: ~51 (countdown threshold: 61)

### Key Tuning Applied
```
# Crisis + physical threats
threatActivationCooldown: 70 (frequent crises)
maxActiveThreats: 2 (simultaneous crises possible)
tempCoolingRate: 2 (faster room cooling)
radiationDecayInterval: 1 (fast decay)
quotaPerDay: 8 (forgiving)
winDays: 5 (5 days to win)

# Event-driven suspicion
suspicionDriftAmount: 0 (DISABLED - event-driven now)
suspicionCrisisWitnessed: 5
suspicionCrewInjured: 7
suspicionCrisisResolved: -5
resetThresholdCountdown: 61
```

### Testing Scripts
```bash
# Smart solver - should be ~88%
npx tsx scripts/smart-solver.ts 200

# Passive stress test - should be ~65%
npx tsx scripts/stress-test.ts 200

# Debug specific seed
npx tsx scripts/debug-solver.ts 1014
```

## 13. Identified Gaps (Future Work)

### Player Visibility Gaps
1. **Path Blockage Invisible** - Workers get stuck but players don't know why. Need visual indicator when path to mines is blocked (fire/radiation/low O2 in transit rooms).

2. **Quota Risk Warning** - No alert when falling behind on quota. Add warning at day-start if on track to miss.

3. **Recovery Time Unknown** - After venting, player doesn't know how long until room is safe. Add estimated recovery time.

### NPC Behavior Gaps
1. **NPCs Auto-Evacuate** - Already implemented! NPCs flee hazardous rooms automatically via panic system (`kernel.ts:631-640`). Solver evacuation commands may be redundant.

2. **Pathfinding Avoids Hazards** - NPCs won't walk through hazardous rooms. This is correct behavior but players may not understand why workers are "stuck."

### Metrics from Instrumented Solver (200 games)
```
=== INTERVENTION BREAKDOWN ===
  VENT: 1.1/game (2%)
  SEAL: 1.1/game (2%)
  PURGE_AIR: 0.8/game (1%)
  ORDER: 53.6/game (95%)

=== CRISIS METRICS ===
  Avg fires/game: 1.1
  Games with mines fire: 32 (16%)
  Avg max simultaneous hazards: 0.9

=== WORKER EFFICIENCY ===
  Avg ticks workers blocked: 1 (0.1% of shift)
  Failed games avg blocked ticks: 26

=== FIRE FREQUENCY BY ROOM ===
  dorms: 29%, medbay: 18%, mines: 16%
  mess: 14%, engineering: 12%, bridge: 9%
```

**Key Insight:** Failed games have 26x more blocked ticks than successful ones. Path blockage is the primary failure mode.

### Potential Fixes (Not Yet Implemented)
1. **Path Status Display** - Show "PATH BLOCKED: [room] (fire)" in status output
2. **Quota Tracker** - Show "QUOTA: 3/8 (ON TRACK)" or "QUOTA: 1/8 (AT RISK)"
3. **Recovery ETA** - Show "mess: recovering O2 (12 ticks)" after venting
4. **Crisis Protection** - Reduce fire chance in mines during W2 shift window

## 14. Social Layer Analysis (FIXED - Event-Driven Suspicion)

### The Solution: Suspicion From Observable Outcomes

With event-driven suspicion implemented, the social layer now **causes meaningful losses**:

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| Smart solver UNPLUGGED | **0%** | **11.5%** | Paranoia is a real threat |
| Avg peak suspicion | 59.6 | 51 | More dynamic range |
| Games reaching countdown | **0** | **~25%** | Danger zone is reachable |

**The game is called PARANOIA and paranoia can kill you.**

### How Event-Driven Suspicion Works

Suspicion accumulates from **observable outcomes**, not timers:

```
Crisis witnessed by crew:     +5 suspicion
  └─ Quick resolution:        -5 suspicion  (net: 0 if handled well)
  └─ Slow/no resolution:      +0            (net: +5)

Crew injured:                 +7 suspicion
Crew dies:                   +14 suspicion
Quota missed:                +12 suspicion
Crew trapped by locked door: +10 suspicion

Quiet day (no incidents):     -4 suspicion
Quota exceeded:               -5 suspicion
```

### Why This Works

1. **Fair** - Paranoia is earned through observable failures
2. **Skill-based** - Good crisis handling reduces net suspicion
3. **Accumulative** - Even with good play, suspicion slowly rises (+1-2 per crisis net)
4. **Has counterplay** - Unlike timers, players can influence outcomes

### Suspicion Formula (unchanged)
```
suspicion = (tamperEvidence/100)*40 + (1-motherReliable)*35 + rumors['mother_rogue']*25
```

Event-driven suspicion modifies `motherReliable` and `tamperEvidence` based on outcomes.

## 15. Event-Driven Suspicion (IMPLEMENTED)

Suspicion now rises/falls based on what crew **witnesses**, not arbitrary timers. This makes paranoia feel **earned** and creates skill-based gameplay.

### Design: Suspicion From Observable Outcomes

Natural drift is disabled. Suspicion changes based on observable events:

**Suspicion RISES when:**
| Event | Rationale | Amount |
|-------|-----------|--------|
| Crew witnesses crisis start | "Why didn't MOTHER prevent this?" | +5 |
| Crew member injured | "MOTHER let them get hurt" | +7 |
| Crew member dies | "MOTHER killed them / failed to save them" | +14 |
| Tampering detected (audit finds evidence) | "MOTHER is lying to us" | +12 |
| Quota missed | "MOTHER is failing at its job" | +12 |
| Order refused/ignored | "MOTHER isn't listening" | +2 |
| Crew trapped by locked door | "MOTHER is trying to kill us" | +10 |

**Suspicion FALLS when:**
| Event | Rationale | Amount |
|-------|-----------|--------|
| Crisis resolved quickly (< 25 ticks) | "MOTHER handled it well" | -5 |
| Day passes without incidents | "Maybe we overreacted" | -4 |
| Quota exceeded | "MOTHER is performing well" | -5 |
| Crew healed/saved from danger | "MOTHER protected us" | -5 |

### Why This Approach Works

1. **Fair** - Paranoia is earned, not arbitrary
2. **Skill-based** - Good play keeps suspicion low, bad play accumulates it
3. **Thematic** - Crew judges MOTHER by observable results
4. **Creates moral tension** - Sometimes you MUST tamper to save them, knowing it increases suspicion

### The Tragic Loop

*"A fire breaks out. I could vent the room to save the station, but crew is inside. I fabricate a sensor reading to lure them out first. I save their lives. They find the fabrication. Now they want to kill me for lying - the lie that saved them."*

This is the core PARANOIA fantasy: **damned if you do, damned if you don't**.

### Implementation Details

Key files modified:
- `config.ts` - Event-driven suspicion modifiers, VERIFY config, disabled natural drift
- `types.ts` - Added `dayIncidents`, `dayOrderTrust`, `dayDeaths`, `activeCrisisStarts`, `lastVerifyTick`
- `state.ts` - Initialize new tracking fields
- `kernel.ts` - Apply suspicion on damage/death, order refusal, VERIFY_TRUST action, day boundary
- `commands.ts` - Added VERIFY command with cooldown, power cost, tamper penalty
- `systems/arcs.ts` - Track crisis starts/resolutions, heroic response bonus

Key mechanics:
- **VERIFY command** - Active trust-building: -4 suspicion, costs power, 80-tick cooldown, half effect if recent tampering
- **Successful orders** - Micro-recovery: -1 suspicion each, capped at -2/day
- **Quick crisis resolution** - Partially offsets crisis witnessed suspicion
- **Heroic response** - Extra -3 if death occurred but crisis contained quickly
- **Zero-incident days** - -4 suspicion bonus (reward good play)

### Current Balance (IMPLEMENTED)

| Mode | SURVIVED | UNPLUGGED | Other | Notes |
|------|----------|-----------|-------|-------|
| Smart Solver (with VERIFY) | **93.5%** | **6%** | 0.5% | Active counterplay works |
| Smart Solver (no VERIFY) | **85%** | **15%** | 0% | Still at risk without counterplay |
| Passive Play | **59%** | **10%** | 31% | Social layer bites |

**Key insights:**
- VERIFY command gives players ~8% survival boost through active trust-building
- Passive play hits UNPLUGGED 10% of the time (social layer matters!)
- Avg peak suspicion: ~44 (threshold: 58 for countdown)
- Failed games avg suspicion: ~57

### Testing Scripts

```bash
# Smart solver (uses VERIFY) - should be ~93%
npx tsx scripts/smart-solver.ts 200

# Passive stress test - should be ~59% SURVIVED, ~10% UNPLUGGED
npx tsx scripts/stress-test.ts 200
```

### Tuning Parameters

```
# Suspicion rises (config.ts)
suspicionCrisisWitnessed: 5      # +5 when crew nearby
suspicionCrewInjured: 5          # +5 on injury (tuned down)
suspicionCrewDied: 14            # +14 on death
suspicionTrappedByDoor: 10       # +10 when trapped by locked door

# Suspicion falls
suspicionCrisisResolved: -5      # -5 for quick (<25 tick) resolution
suspicionQuietDay: -4            # -4 for zero-incident day
suspicionHeroicResponse: -3      # -3 extra if death + quick resolve
suspicionOrderCompleted: -1      # -1 per successful order (cap: 2/day)

# VERIFY command
verifySuspicionDrop: -4          # base suspicion reduction
verifyCooldown: 80               # ticks between uses
verifyCpuCost: 5                 # power cost
verifyTamperPenalty: 0.5         # half effect if recent tampering

# Thresholds
resetThresholdCountdown: 58      # suspicion level to trigger reset
```
