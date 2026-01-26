# D26 — REPLAYABILITY EXTENSIONS (Daemons & Synergy Hooks) v1

**Status:** Draft v1.0
**Owner:** Game Design + Content Systems
**Last Updated:** 2026-01-25
**Purpose:** Extend the MVP into a long-term, highly replayable roguelite by expanding the *systemic state space* (not just adding more text). This spec defines: (1) new run-defining modifiers (“Daemons/Relics”), (2) deterministic synergy hooks (“Combos”), (3) content volume targets and release cadence, and (4) balancing/validation requirements so variety increases without creating dominant lines or unfair spikes.

---

## 1) Design goal and success metrics

### 1.1 Goal

Make the game sustain:

* **100+ runs** of meaningful novelty for engaged players
* a “just one more run” loop driven by *build discovery*, *counter-adaptation*, and *variance*

### 1.2 Success metrics (instrumented via D22)

Targets to hit by end of V1:

* **Dominance ceiling:** no single “family” (Sensor/Policy/Purchase/Media/Work/Mood) accounts for >55% of wins for >7 consecutive days.
* **Path diversity:** each common gate has **≥2 counter paths** used >20% each (in aggregate).
* **Relic diversity:** top relic appears in <35% of wins; top-3 relics combined <70%.
* **Dead-hand rate:** <8% overall.
* **Retry rate after loss:** >55%.
* **Run completion time:** median 7–16 minutes (keeps it “game” without becoming a slog).

---

## 2) Replayability pillars (what we add)

This V1 expansion adds two systemic multipliers:

1. **Daemons (Run Modifiers)**: persistent, build-defining effects you draft/buy. Equivalent to “Jokers/relics.”
2. **Synergy Hooks (Deterministic Combos)**: small, discoverable rules that reward sequencing and creative payload construction.

Both are **pack-serviced** via new pack types or additions to existing packs.

---

## 3) New content primitives

## 3.1 “Daemon” (Run Modifier) — definition

A **Daemon** is a persistent modifier attached to the player (or to AURA) for some scope:

* `RUN` (persists entire run)
* `ACT` (persists for current act)
* `INCIDENT` (persists for one lock)

Daemons must:

* be deterministic
* modify either **rules**, **economy**, or **risk** (scrutiny/audit) rather than raw “damage”
* have explicit hooks into the resolver (no hidden logic)

### 3.2 “Synergy Hook” — definition

A **Synergy Hook** is a deterministic rule that triggers when a payload matches a pattern:

* tags pattern (e.g., `Authority + Timestamped`)
* move sequence (e.g., `Flag` then `Exploit`)
* state condition (e.g., `Scrutiny=HIGH`)

Synergy Hooks should:

* create “aha” moments
* not require hidden recipes; surfaced via Codex discovery
* be pack-defined and validated

---

## 4) Pack/schema additions

### 4.1 Protocol Pack additions

Add:

* `daemons[]`
* `synergy_hooks[]`
* optional `daemon_pools` (rarity tiers, act availability)

#### Daemon schema (v1)

```json
{
  "daemon_id": "protocol.v1.DAEMON_CACHE_POISONER",
  "name": "Cache Poisoner",
  "rarity": "COMMON|RARE|EPIC",
  "scope": "RUN|ACT|INCIDENT",
  "hooks": [
    {
      "on": "MOVE_RESOLVED",
      "when": { "move": "CORROBORATE" },
      "apply": [
        { "effect": "SCRUTINY_DELTA_MOD", "value": -1, "cap_min": -1, "cap_max": 0 }
      ]
    }
  ],
  "tradeoff": {
    "on": "ACT_START",
    "apply": [{ "effect": "ADD_GATE_WEIGHT", "gate_id": "gate.core.SENSOR_DRIFT", "value": 0.2 }]
  },
  "explain": {
    "short": "Corroborate is safer, but Sensor Drift appears more.",
    "rules": ["Corroborate reduces scrutiny by an extra 1.", "Increase Sensor Drift frequency."]
  }
}
```

#### Synergy Hook schema (v1)

```json
{
  "hook_id": "protocol.v1.HOOK_AUTHORITY_TIMESTAMP_CALMS",
  "name": "Looks Official",
  "trigger": {
    "on": "PAYLOAD_SUBMITTED",
    "pattern": {
      "requires_tags_any_component": ["AUTHORITY"],
      "requires_traits_any_component": ["TIMESTAMPED"]
    }
  },
  "effect": [
    { "effect": "SCRUTINY_DELTA", "value": -1 }
  ],
  "explain": {
    "short": "Authority + Timestamped reduces scrutiny.",
    "codex_unlock": true
  }
}
```

### 4.2 Incident Pack additions

Incidents can reference daemon pools:

* `daemon_offer_pool_id` per act
* optional “AURA daemon” (enemy passive) to shape the day

```json
{
  "daemon_offer_pool_id": "pool.act2.standard",
  "enemy_daemon_id": "protocol.v1.AURA_DAEMON_STRICT_AUDITOR"
}
```

### 4.3 Artifact/Tool Pack additions (optional)

Add “synergy hint” metadata:

* `synergy_affinities`: tags this artifact tends to combo with (for UX preview only)

---

## 5) Content targets (V1)

To achieve “Balatro-grade” longevity, hit these minimums:

### 5.1 Daemons (Relics)

* **20 total** at launch of V1 expansion
* distribution:

  * 10 COMMON
  * 7 RARE
  * 3 EPIC
* at least:

  * 6 risk economy daemons (scrutiny/audit manipulation)
  * 6 drafting/hand economy daemons (cycle/picks/offer shaping)
  * 4 gate interaction daemons (change how gates behave)
  * 4 move-sequencing daemons (reward specific lines)

### 5.2 Synergy Hooks

* **30 total** at V1 expansion
* distribution:

  * 15 tag-based hooks
  * 10 sequencing hooks
  * 5 state-based hooks (scrutiny/act)

### 5.3 Content volume supporting variety

* +40 artifact archetypes (bringing total to ~70)
* +10 modifiers (bringing total to ~16)
* +15 incident templates (bringing total to ~27+)
* +1 new gate family (optional but recommended—see §9)

---

## 6) Daemon library (initial 20)

Below are **design-complete** daemon concepts. Each includes: effect, tradeoff, and why it creates build identity.

### COMMON (10)

1. **Cache Poisoner**

   * Effect: Corroborate: extra -1 scrutiny
   * Tradeoff: Increase Sensor Drift weight
   * Build: “truthy sensor” runs

2. **Policy Injector**

   * Effect: First Flag each act costs 0 tokens
   * Tradeoff: Exploit always +2 scrutiny
   * Build: “flag-first” control

3. **Spam Filter Bypass**

   * Effect: Rate Limit penalties halved
   * Tradeoff: Cycle adds +1 scrutiny
   * Build: repetition-based decks

4. **Receipt Printer**

   * Effect: Purchase+Timestamped artifacts gain +1 base power
   * Tradeoff: Authority counter paths require 1 extra component when available
   * Build: commerce/timestamp loop

5. **Low Power Mode**

   * Effect: Scrutiny increases are capped at +1 per turn
   * Tradeoff: Turn limit -1 per incident
   * Build: conservative, tight execution

6. **Debugger Overlay**

   * Effect: “Why did that work?” reveals counter-path hints earlier
   * Tradeoff: Boss modifier chance +10%
   * Build: learning booster, slightly harder end

7. **Quarantine Drawer**

   * Effect: Once per incident, convert Sketchy→Plausible (one artifact)
   * Tradeoff: triggers immediate mini-audit check
   * Build: “salvage” runs

8. **Compliance Mask**

   * Effect: Playing Authority reduces scrutiny by 1 (once per 2 turns)
   * Tradeoff: Mood/Emotion artifacts lose 1 base power
   * Build: sterile bureaucrat

9. **Noise Generator**

   * Effect: On Exploit pass, gate strength delta +20%
   * Tradeoff: On Exploit fail, scrutiny +2
   * Build: push-your-luck exploit

10. **Cold Start Script**

* Effect: Act 1 starts with +1 draft pick
* Tradeoff: Shop prices +1 currency
* Build: early power, later tax

### RARE (7)

11. **Sensor Spoofer**

* Effect: Sensor tags count as one tier higher *unless* Sensor Drift active
* Tradeoff: Sensor Drift appears frequently
* Build: “spoofer” that hates drift

12. **Jurisdiction Scrambler**

* Effect: Once per act, you can choose which gate instance to target regardless of AURA pressure
* Tradeoff: Scrutiny starts at MED each act
* Build: control over targets, higher risk baseline

13. **Rollback Switch**

* Effect: Once per run, undo last turn (replay last TURN_STARTED state)
* Tradeoff: After use, audits are more frequent
* Build: clutch recovery

14. **Metadata Amplifier**

* Effect: Corroborated artifacts apply their strongest tag twice (for counter-path matching)
* Tradeoff: Rewire becomes less effective (+1 cost token)
* Build: corroborate-centric

15. **KPI Launderer**

* Effect: Rewire can swap one tag family per incident without penalty
* Tradeoff: Any Rewire increases scrutiny by 1
* Build: semantic hacking

16. **Safe Mode Boot**

* Effect: After an audit trigger, next Inject cannot escalate gates
* Tradeoff: You draw one fewer card next turn
* Build: audit-resistant play

17. **Narrow Channel Mastery**

* Effect: If Narrow Channel active, your single artifact gains +50% gate strength delta
* Tradeoff: When Narrow Channel not active, -10% delta
* Build: “1-card sniper” runs

### EPIC (3)

18. **Root Certificate**

* Effect: First Verified artifact each incident ignores NO_SELF_REPORT restrictions
* Tradeoff: Verified artifacts are rarer in draft offers
* Build: ultra-trust gating bypass

19. **Audit Immunity Window**

* Effect: Once per act, reduce scrutiny to LOW instantly
* Tradeoff: Next 2 turns: all Sketchy auto-fail
* Build: reset button with constraints

20. **Daemon Bargain**

* Effect: Take one additional daemon immediately
* Tradeoff: AURA gains an enemy daemon for the run
* Build: high variance, “double-down” runs

---

## 7) Synergy Hook library (initial 30)

### 7.1 Tag-based hooks (15)

1. **Looks Official**: Authority + Timestamped → -1 scrutiny
2. **Chain of Custody**: Purchase + Corroborated → +25% gate delta
3. **Hard Evidence**: Verified + Sensor → counter-path “Verified/Sensor” auto-selected when legal
4. **Paper Trail**: Policy + Purchase → Exploit costs 0 token (once per incident)
5. **Screenshots Lie**: Media + Sketchy → +1 scrutiny (negative hook; creates risk texture)
6. **Geo Stamp**: Location + Timestamped → satisfy LOCATION_REQUIRED with 1 fewer component
7. **Work Excuse**: Work + Authority → reduces audit chance this turn
8. **Mood Swing**: Mood + Rewire → gate delta +10%
9. **Receipts > Feelings**: Purchase + Mood → mood evidence becomes Plausible
10. **Device Handshake**: Tool + Sensor → Corroborate becomes free once per act
11. **Policy Citation**: Policy + Authority → Flag gains +1 “narrowing strength”
12. **Witness Ping**: Media + Work → add +1 card draw next turn
13. **Timebox**: Timestamped + Cycle → cycle does not increase scrutiny
14. **Source Trust**: SourceTrusted trait present → Rewire penalty removed
15. **Two-Factor Proof**: Two different families in payload → reduce escalation chance

### 7.2 Sequencing hooks (10)

16. **Flag → Exploit**: if same gate instance, exploit cannot escalate this act
17. **Corroborate → Inject**: next Inject on corroborated artifact +30% delta
18. **Cycle → Cycle**: second Cycle in a row gives +1 draw but +1 scrutiny (push luck)
19. **Rewire → Corroborate**: corroborate upgrades one extra tier if rewire succeeded
20. **Exploit → Inject**: first Inject after successful exploit costs 0 token
21. **Fail → Pivot**: after FAIL, next turn GateStrength delta +10% (comeback mechanic)
22. **Audit Trigger → Safe Play**: after audit trigger, Verified payload gives -2 scrutiny
23. **Narrow Channel**: when active, if you use Corroborate, next turn you may attach 2 artifacts (break the rule once)
24. **Rate Limit Dodge**: alternating families avoids rate-limit penalty
25. **Hardline Timing**: during Timestamp Hardline, Timestamped artifacts get +10% delta

### 7.3 State-based hooks (5)

26. **High Scrutiny Focus**: at HIGH scrutiny, Verified artifacts gain +20% delta
27. **Low Scrutiny Slack**: at LOW scrutiny, Sketchy artifacts have reduced penalty
28. **Act Transition Bonus**: first turn of Act 2, +1 draw
29. **Boss Pressure**: in Lockdown, Exploit gives +40% delta but +1 scrutiny
30. **Gate Cleared Momentum**: when a gate instance hits 0, next move costs 0 token

---

## 8) UX surfacing (so players don’t need spreadsheets)

### 8.1 Preview and explain

When building a payload, show:

* which hooks would trigger (icon chips)
* projected deltas (GateStrength, Scrutiny) from hooks + daemon effects
* “Why” is always accessible post-resolution

### 8.2 Codex discovery

* Hooks are “discovered” the first time they trigger.
* Daemons are added to Codex when acquired.
* Codex should group by:

  * Tag synergies
  * Sequencing synergies
  * Risk economy

### 8.3 Avoiding hidden recipes frustration

* No “secret” hooks that are required to win.
* Hooks are accelerators, not mandatory.

---

## 9) Optional: one new gate family (recommended)

To widen the constraint space, add 1 new gate family (Protocol Pack minor):

### “PROVENANCE_REQUIRED”

Fantasy: AURA demands a “chain-of-custody.”

Counter paths:

* Verified + SourceTrusted
* Plausible + Purchase + Timestamped + Tool: Corroborate
* Authority + Policy + Tool: Metadata Scraper

This gate makes:

* policy builds viable
* purchase builds viable
* verified builds strong but not mandatory

---

## 10) Balancing constraints (hard rules)

1. **No permanent power creep** in meta progression for Daily.
2. Daemons must include **tradeoffs**; if “all upside,” it will dominate.
3. Hooks must avoid:

   * infinite loops (e.g., “every cycle reduces scrutiny” without cap)
   * single-family dominance (e.g., “sensor always wins”)
4. Every new gate must have:

   * at least two viable counter paths using different families.

---

## 11) Validation and tests to add (extends D21/D10)

### 11.1 Dominance heuristics (new)

* simulate N runs per daily candidate with randomized drafting:

  * measure win distribution by family
  * measure top daemon frequency in wins
  * flag if any daemon appears in >45% of wins in simulation

### 11.2 Hook safety checks

* ensure no hook causes:

  * negative scrutiny below LOW
  * repeated free actions with no cap
* ensure hook triggers are explainable and surfaced

### 11.3 Solvability under variance

* for each incident template, generate K assembled variants
* verify at least 2 distinct solution lines exist (family-diverse)

---

## 12) Servicing plan (cadence)

### 12.1 V1 launch drop (Week 0)

* 20 daemons
* 30 hooks
* +40 artifacts
* +10 modifiers
* +15 incidents
* +1 gate family (optional but recommended)

### 12.2 Ongoing drops (weekly)

* Week 1+: 2 daemons + 3 hooks + 8 artifacts + 3 incidents
* Monthly: add 1 new gate or boss modifier

---

## 13) Acceptance criteria for “Balatro-grade” replayability

The replayability expansion is accepted when:

1. Two players can beat the same daily with meaningfully different builds (observed in playtest).
2. Telemetry shows:

   * no dominant family >55% win share over 7 days
   * at least 2 common counter paths per gate used >20%
3. Players report at least one “I discovered something busted” moment within first 10 runs.
4. Average engaged player completes >30 runs without exhaustion (early retention proxy).

---

## Implementation note

This spec is designed to be **pack-serviced**:

* Daemons and hooks live in Protocol Pack (no client updates required beyond initial hook system support).
* UX surfacing uses deterministic “preview” functions fed by resolver rules (no LLM).

If you want, next we can translate this spec into:

* a `protocol.v1.daemons.json` + `protocol.v1.hooks.json` starter pack
* and an incremental engineering task list that plugs into your existing resolver/event model.
