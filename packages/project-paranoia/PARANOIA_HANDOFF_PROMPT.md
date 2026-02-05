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

*Bold values tuned for balance: ~99.5% smart solver win, ~60% passive win.*

## 10. V1 Completion Checklist

1. [x] Wire `perception.evidence[]` to `audit` command
2. [x] Add `audit` command to CLI
3. [x] Make audit findings increase `tamperEvidence` (already wired - tampering auto-bumps crew beliefs)
4. [x] Add pacing arbiter (tracks + boosts dilemma/crew agency/info conflict per phase)
5. [x] Add 2-meter summary to status display (INTEGRITY + SUSPICION with color bars)
6. [x] Cut `sensorIntegrity` and `crewTrust` (commented out, not deleted)
7. [x] Add confidence traffic lights to threat display (✓ confirmed, ? uncertain, ✗ conflicting)
8. [x] Wire fabrications to rumor/grudge system (fabricate → grudge spread → violence cascade)

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

### Current Balance State
Testing with smart solver vs passive autoplay establishes fairness bounds:

| Mode | Win Rate | Notes |
|------|----------|-------|
| Smart Solver | **99.5%** (199/200) | Game is provably fair |
| Passive Play | **61.5%** (123/200) | Challenging but achievable |

**The One Failure (Seed 1014):** Fire in mines at T1113 during final day extraction (7/8 cargo). Extreme timing edge case - not a balance problem.

### Key Tuning Applied
```
threatActivationCooldown: 100 → 70 (more frequent crises)
maxActiveThreats: 1 → 2 (simultaneous crises possible)
tempCoolingRate: 2 (new - faster room cooling after fire)
radiationDecayInterval: 1 (fast decay = fair game)
quotaPerDay: 8 (forgiving - social layer is the challenge)
winDays: 5 (survive 5 days to win)
```

### Testing Scripts
```bash
# Smart solver - should be ~100%
npx tsx scripts/solver.ts 100

# Passive stress test - should be ~50-60%
npx tsx scripts/stress-test.ts 100

# Debug specific seed
npx tsx scripts/debug-solver.ts 1014

# Instrumented metrics collection
npx tsx scripts/solver-metrics.ts 200
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
