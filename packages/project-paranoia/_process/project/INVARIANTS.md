# Invariants: Project PARANOIA

**Date:** 2026-02-05

Rules that must NEVER be broken. Violations of these invariants are bugs.

---

## Core Design Invariants

### I1: No Stat Without Purpose
> No stat exists unless it is READ by at least one decision system AND VISIBLE in at least one player-facing surface.

Dead stats are noise. If a value isn't read by game logic and displayed somewhere, it must be removed. (`sensorIntegrity` and `crewTrust` were cut for this reason.)

### I2: Every Lie Leaves Residue — And Reality Can Expose It
> Every deception verb (SPOOF, SUPPRESS, FABRICATE) must create an evidence record in `perception.evidence[]`. Lies must also be exposable by contradiction with reality, not only by investigation.

This is the core fairness contract. Residue is discoverable via AUDIT and crew investigation (V1). In V2, lies are also exposed when reality contradicts them — crew walks into the crisis you suppressed, nobody finds the threat you spoofed, the person you framed has an alibi. See `TAMPER_BACKFIRE_DESIGN.md`.

### I3: Suspicion Is Event-Driven
> Suspicion must only change in response to observable crew outcomes, never from arbitrary timers or drift.

Natural drift is disabled (`suspicionDriftAmount: 0`). Suspicion rises from witnessed crises, injuries, deaths, tampering detection, quota failures. Falls from quick resolution, quiet days, quota success, VERIFY.

### I4: Truth/Perception Separation
> TruthState and PerceptionState must remain separate. Player-facing output must come from PerceptionState queries, never raw TruthState.

The player sees what MOTHER sees, not what's true. Blackout, staleness, and confidence are perception-layer concerns.

---

## Gameplay Invariants

### I5: Crew Must Have Agency
> Each NPC's role action must trigger based on their psychological state (stress, loyalty, paranoia), not random chance.

Commander resets on suspicion thresholds. Engineer sabotages on stress/loyalty. Doctor sedates on stress. Pike attacks on stress+paranoia. Vega sacrifices. These are deterministic consequences.

### I6: Reset Is Multi-Stage
> The reset sequence must follow whispers → meeting → restrictions → countdown, triggered by suspicion thresholds. Skipping stages is a bug.

### I7: Win Condition Requires Quota
> Winning requires surviving `winDays` days AND meeting daily cargo quota. Survival alone is insufficient.

### I8: Deterministic Given Seed
> Given the same seed and command sequence, the game must produce identical results. The RNG is seeded LCG.

---

## Technical Invariants

### I9: Config Is Env-Overridable
> Every tuning parameter in `config.ts` must be overridable via `PARANOIA_` prefixed environment variable. Hardcoded magic numbers are bugs.

### I10: Proposals Are Scored, Not Hardcoded
> Event selection goes through the proposal/scoring pipeline. No events should bypass scoring to directly mutate state (except time/systems ticks which are deterministic).

### I11: No External State
> Game state is fully contained in TruthState + PerceptionState. No external files, databases, or network calls during gameplay. Save/load serializes the full state.

---

## Balance Targets

### I12: Smart Solver ~90-95% Win Rate
> The smart solver (optimal play with all commands) should win ~90-95% of games. Significantly higher means the game is too easy; lower means it's unfair.

### I13: Passive Play ~55-65% Win Rate
> Passive autoplay (no commands) should win ~55-65%. Higher means crises don't matter enough; lower means the game is unwinnable without micromanagement.

### I14: UNPLUGGED Must Be Possible
> The social layer (paranoia/suspicion) must cause ~5-15% of losses in smart solver play. If UNPLUGGED never happens, the game's namesake mechanic is broken.

---

## V2 Invariants (Apply After Implementation)

### I15: Betrayal Hurts More Than Incompetence
> A lie exposed by reality (backfire) must cause more suspicion than a crisis that happened due to inaction. Getting caught hiding a fire must be worse than failing to prevent one.

### I16: Truth Has Cost
> Proactive honest communication (announce/warn) must have a mechanical consequence — crew stress, work stoppage, panic evacuation. Truth is not free. The dilemma is: truth spikes panic, lies leave residue.

### I17: Pressure Shifts With Suspicion
> At high suspicion, the director must reduce physical crisis frequency and increase social/epistemic events. The player should never be killed by "RNG crisis spam → suspicion overflow" with no counterplay. See `DIRECTOR_PRESSURE_MIX.md`.

### I18: Every Suspicion Change Is Explained
> The suspicion ledger must record the reason and amount for every suspicion delta. The player must be able to understand *why* crew distrusts them. Opaque suspicion is unfair.
