# D25 — PROGRESSION & COMPLETION SYSTEM v1 (AURA)

**Status:** Draft v0.9
**Owner:** Game Design / Meta Systems
**Last Updated:** 2026-01-25
**Purpose:** Define long-term motivation and “completion fantasy” for Life with AURA without introducing pay-to-win or undermining Daily fairness. This doc specifies progression layers, starter kits (Balatro-like “decks”), codex/registry completion, mastery challenges, difficulty ladder (“Firmware Levels”), unlock rules, and how everything interacts with modes (Free Play vs Daily).

---

## 0) Design constraints (non-negotiable)

1. **No permanent power creep** that trivializes content.
2. **Daily Featured** must be **fair and comparable** between players:

   * either meta progression disabled, or
   * standardized/rotated loadout, or
   * meta only affects cosmetics/voice/codex visibility.
3. Progression must support both:

   * **habit play** (3–7 min daily)
   * **binge play** (8–16 min runs)
4. Progression rewards must be:

   * **variety** (new options, new lines)
   * **mastery** (knowledge, codex)
   * **expression** (cosmetics/voice)
   * *not* raw numeric advantage.

---

## 1) Player motivation model

AURA’s long-term “reason to return” comes from three orthogonal loops:

### 1.1 Collection loop (completion)

* Unlock Starter Kits (“decks”)
* Collect Daemons
* Discover Synergy Hooks
* Complete Gate Codex counter-paths
* Clear Incident Archive badges

### 1.2 Mastery loop (skill growth)

* Difficulty ladder (Firmware Levels)
* Mastery Challenges (contracts)
* “Explainability-first” learning (why each move worked)

### 1.3 Servicing loop (freshness)

* Daily Featured Seed
* Weekly content drops via packs
* Seasonal firmware (later) that adds gates/daemons/modifiers without invalidating skill

---

## 2) Session length targets by mode

### 2.1 Free Play (core roguelite)

* **Default run:** 3 incidents (Act1 → Act2 → Boss)
* **Target time:** 8–16 minutes (median 11–13)
* **Attempts:** unlimited

### 2.2 Daily Featured (habit overlay)

Two configurations; ship one in MVP+V1 and keep the other as a later switch:

**Option A (recommended for habit): Daily Single Incident**

* **1 incident** (Act profile varies by day)
* **Target time:** 3–7 minutes
* **Attempts:** 3 (or 1 + “practice” in Free Play)

**Option B (later): Daily Mini-Run**

* **3 incidents** (short ladder)
* **Target time:** 8–14 minutes
* **Attempts:** 1–2

Daily must remain “snackable.” Free Play is where binge happens.

---

## 3) Starter Kits (Balatro-style “decks”)

### 3.1 Definition

A **Starter Kit** is a named starting configuration that changes:

* initial draft bias (what shows up more)
* starting hand composition (archetype mix)
* starting daemon (optional)
* one small, explicit rules twist (optional)

Kits must not directly add unconditional “power.” They reshape *options and constraints*.

### 3.2 Kit schema (conceptual)

```json
{
  "kit_id": "kit.v1.SPOOFER",
  "name": "Spoofer Kit",
  "starting_daemon_id": "protocol.v1.DAEMON_SENSOR_SPOOFER",
  "draft_bias": { "SENSOR": 1.3, "PURCHASE": 0.9, "POLICY": 0.9 },
  "starter_pool": ["artifact.core.WEARABLE_LOG", "tool.core.METADATA_SCRAPER", "..."],
  "rules_twist": { "id": "TWIST_SENSOR_CONFIDENCE", "effect": "SENSOR_COUNTS_UP_1_TIER_UNDER_LOW_SCRUTINY" },
  "daily_eligibility": "ROTATE|DISABLE|STANDARDIZE"
}
```

### 3.3 V1 Starter Kit set (ship 6)

Ship 6 kits to create early variety and “completion” targets.

1. **Spoofer Kit**

   * Bias: Sensor / Device
   * Identity: “fake the metrics”
   * Tradeoff pressure: Sensor Drift appears more often

2. **Legalist Kit**

   * Bias: Policy / Authority
   * Identity: “weaponize terms + compliance”
   * Tradeoff pressure: Timestamp Hardline more frequent

3. **Receipt Runner Kit**

   * Bias: Purchase / Timestamp
   * Identity: “paper trail beats algorithms”
   * Tradeoff pressure: Provenance gate shows more often (if shipped)

4. **Human Factors Kit**

   * Bias: Mood / Context / Work-life
   * Identity: “explain, reframe, de-escalate”
   * Tradeoff pressure: No Self Report more frequent

5. **Forensics Kit**

   * Bias: Location / Metadata / Tools
   * Identity: “verify and corroborate everything”
   * Tradeoff pressure: Narrow Channel appears more

6. **Chaos Kit**

   * Bias: mixed; higher Sketchy density
   * Identity: “push-your-luck jailbreak”
   * Tradeoff pressure: audits more frequent, higher rewards

### 3.4 Unlock rules for kits

Kits unlock via **achievements**, not grind:

* Spoofer: win a run using ≥3 Sensor artifacts
* Legalist: clear a gate via Policy/Authority counter-path 3 times
* Receipt Runner: clear Timestamp Hardline boss
* Human Factors: win without using Exploit in a run
* Forensics: pass 2 audits in a single run
* Chaos: win after hitting HIGH scrutiny at least once

Unlock feedback should be immediate and celebratory.

---

## 4) Codex & Registries (completion fantasy)

### 4.1 Gate Codex

For each Gate `G`, track:

* description and constraints (static)
* **counter paths discovered** (dynamic)
* “first clear” date and total clears
* “cleared under modifier” stamps

**Completion:** discover all counter paths for all gates in the current protocol pack.

### 4.2 Synergy Codex

Track each synergy hook:

* trigger condition
* effect
* times triggered
* “first discovered” stamp
* linked recommended kits (optional)

**Completion:** discover all hooks in active protocol pack.

### 4.3 Daemon Registry

Track daemons:

* acquired count
* win-with-daemon stamp
* favorite rate (equipped frequency)
* synergy notes (from explain panel)

**Completion:** collect all daemons and win at least once with each (optional “master completion”).

### 4.4 Incident Archive (Locks)

For each incident template (or lock type):

* first clear
* best turn count
* best max scrutiny (LOW/MED/HIGH)
* badges:

  * **Clean Clear:** never exceeded MED scrutiny
  * **Audit Survivor:** passed at least one audit
  * **No Exploit:** cleared without Exploit
  * **Clutch:** cleared on final turn

**Completion:** clear all incident templates at least once; badge completion is “100% mastery.”

### 4.5 “Book of Jailbreaks” (optional but recommended)

A curated log of:

* your top 10 funniest/cleverest clears
* a short deterministic explanation + chosen AURA bark
* shareable seed + build summary

This becomes social proof without multiplayer.

---

## 5) Mastery Challenges (Contracts)

### 5.1 Definition

Contracts are optional goals that:

* encourage build diversity
* teach mechanics
* generate reasons to replay specific gates/modifiers

Contracts are deterministic and verifiable from run log.

### 5.2 Contract categories (V1)

* **Discipline:** win without Cycle / without Exploit / without Rewire
* **Risk:** reach HIGH scrutiny and still win / win with 2 audits triggered
* **Speed:** clear boss in ≤N turns
* **Variety:** clear 3 different gates in one incident (when boss has 3)
* **Constraint:** win under Narrow Channel / Timestamp Hardline

### 5.3 Rewards

Contracts grant:

* cosmetics (themes, icons, AURA skins)
* voice pack unlocks
* kit unlock progress
* “Codex hint tokens” (see §6.3)

No raw power.

---

## 6) Difficulty ladder (Firmware Levels)

### 6.1 Purpose

A “stakes” ladder provides long-term mastery progression and clear goals, similar to Balatro’s stake levels, without invalidating fairness.

### 6.2 Firmware Levels (0–8)

Each level modifies run parameters:

* **F0 (Default):** baseline
* **F1:** +1 gate weight in Act2
* **F2:** boss modifier always active (no “easy boss” days)
* **F3:** scrutiny rises faster (e.g., +1 on Sketchy plays)
* **F4:** turn budgets -1 each incident
* **F5:** Rate Limit common
* **F6:** audits more demanding (extra corroboration step)
* **F7:** counter paths stricter (Plausible stops passing on Act2)
* **F8:** “Lockdown Mode” (2–3 gates always; narrow channel chance high)

### 6.3 Unlocking firmware levels

Unlock next level by beating the boss at current level with any kit.

**Daily mode**: firmware level is locked/standardized for fairness (e.g., Daily always F0 or rotates).

---

## 7) Fairness rules by mode

### 7.1 Free Play

* Kits enabled
* Daemons enabled
* Codex hints enabled
* Firmware ladder enabled

### 7.2 Daily Featured

Choose one of these policies (recommend ship Policy A):

**Policy A (recommended): Standardized Daily Loadout**

* Daily specifies:

  * kit (or none)
  * starting daemon (or none)
  * draft pool constraints
* Everyone plays identical starting conditions.
* Codex completion still accrues, but **no kit advantage**.

**Policy B: Daily disables kits/daemons**

* Pure baseline run
* Simplest fairness story
* Slightly less interesting

Daily should always log:

* daily_id + manifest binding
* standardized loadout info (if Policy A)

---

## 8) Meta currency (minimal and non-toxic)

### 8.1 Currency purpose

Currency exists only to:

* buy run-limited offers (shop)
* unlock cosmetics/voice packs
* unlock kit variants (cosmetic variations)

### 8.2 Avoid

* buying retries in Daily
* buying raw power
* buying exclusive daemons that dominate

### 8.3 “Hint Tokens” (optional)

Hints are a UX feature, not power:

* reveal one valid counter-path for an active gate (if not yet discovered)
* never guarantees success; just reduces confusion

Earned by:

* completing contracts
* losing streak protection (see §9.2)

---

## 9) Retention design (come-back reasons)

### 9.1 Short-term reasons (daily habit)

* daily seed
* daily streak
* daily share card (“my build + why it worked”)

### 9.2 Mid-term reasons (weekly)

* weekly pack drop (incidents + daemons + hooks)
* rotating “featured kit” week (encourages kit exploration)
* seasonal challenge board (contracts)

### 9.3 Long-term reasons (completion)

* 100% Gate Codex
* 100% Daemon Registry (collect + win)
* Firmware ladder completion
* Incident Archive badge completion
* “Book of Jailbreaks” collection

---

## 10) Anti-burnout + player-friendly design

1. **Fail forward rewards:** losing still unlocks:

   * codex knowledge (if new gate/hook encountered)
   * archive entries (seen incidents)
   * contract progress (partial)
2. **Pity systems:** after N losses, offer:

   * 1 free “Rollback Switch” (run-limited)
   * or 1 hint token
3. **No daily punishment:** missing a day resets streak softly (e.g., streak freezes with one token).

---

## 11) Telemetry requirements for progression tuning

Instrument:

* kit pick rate and win rate
* daemon pick rate and win rate
* hook discovery rates
* codex completion curves
* firmware progression curves
* daily participation and streak retention
* “quit moments” (drop-off events) to identify friction

Hard alerts:

* kit >60% win rate vs others (dominance)
* daemon >45% appearance in wins (dominance)
* daily completion time >20 min median (too long)

---

## 12) Acceptance criteria (V1 progression)

1. Players can articulate goals beyond “win a run” (kits, codex, firmware).
2. Daily remains fair and comparable.
3. Progression does not create permanent power advantage.
4. Players report “one more run” motivation driven by:

   * trying a different kit
   * chasing a missing codex entry
   * climbing firmware level
   * collecting a daemon/hook

---

## Appendix A — Minimal UI surfaces for meta

* **Meta Hub tabs:**

  * Kits
  * Codex (Gates / Hooks)
  * Registry (Daemons)
  * Archive (Incidents)
  * Contracts
  * Firmware Ladder

* **Run end screen:**

  * what you discovered (new codex entries)
  * contract progress
  * archive badges earned
  * next unlock progress (kit / firmware)

---

## Appendix B — Meta Currencies (from D07 consolidation)

### B.1 Credits (meta currency)

Earned from:
* completing Act1/Act2 (even if you later lose)
* daily win bonus
* first-time Codex unlocks

Spent on:
* cosmetic themes (UI skins, AURA orb skins)
* voice packs (optional)
* "Loadout Slots" (tiny power; constrained)
* reroll tokens (limited)

**Guardrail:** Credits must not purchase raw power that breaks Daily.

### B.2 Cache Tokens (run-limited)

* In-run currency spent in upgrade screen/shop between acts
* Reset each run; ensures roguelite feel
* Distinct from Ops Tokens (see D05) which govern move costs

---

## Appendix C — Build Archetypes (design targets)

Ensure each has support in artifacts/tools/gates:

1. **Sensor Purist:** VERIFIED data, low scrutiny, consistent progress
2. **Policy Lawyer:** policy/authority tags, gate reclassification/flagging
3. **Toolsmith:** transform/corroborate to upgrade mid-trust to verified
4. **Chaos Hacker:** high power, high scrutiny, survives audits with counters

**Balance rule:** No archetype should dominate across multiple weeks (validated in D10).

---

## Appendix D — Monetization Surfaces

### D.1 Safe surfaces (non-P2W)

* Cosmetics (themes, orb skins, UI sounds)
* Premium voice packs (additional barks)
* "Archive" access: play past dailies as a premium feature
* Optional "Creator Packs" (additional incident packs)
* Convenience: extra codex sorting, additional loadout presets (still bounded)

### D.2 Red lines

* Buying VERIFIED artifacts that trivialize gates
* Buying extra turns for Daily
* Buying immunity to audits
