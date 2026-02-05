Do **both**, but the *player* should consume a **generated CaseBundle artifact**, not “generate the whole case live.”

The clean pattern for KOA Casefiles is:

**Pack = rules + content library**
**Seed = selector**
**Generator = sim + validators**
**CaseBundle = the published artifact the client plays**

### Why this is the best bet (for a daily/shared deduction game)

#### Option 1 — “Seed-only: client generates the case”

**Pros:** offline-first, tiny payload
**Cons:**

* harder to guarantee solvability/quality (no pre-validation gate)
* easier to spoil/cheat (client can introspect truth)
* version drift is painful (“why is today’s case different on my phone?”)
* harder to curate “funny” (comedy needs tight control)

This is great for **practice mode** or sandbox, not for the “official daily”.

#### Option 2 — “Player consumes a generated pack/bundle” ✅ (recommended)

Server (or build pipeline) does:

1. pick template/twist from **Pack**
2. run deterministic sim using **DailySeed**
3. derive evidence + barks + red herrings
4. run validators (solvable / anti-anticlimax / difficulty bands)
5. publish **CaseBundle**

Client does:

* KOA interview UI reveals bounded slices from the bundle
* replay/inspect is deterministic
* solution can be withheld/encrypted until solve

This gives you **quality control + fairness + consistency**.

#### Option 3 — Hybrid “Ship Pack + Seed, but verify”

Works if you want **UGC** (community packs) + offline, but you still need:

* signed packs
* strict sandboxing
* and/or server verification for leaderboards

### The practical recommendation

* **Daily mode:** **Publish CaseBundles** generated from `(PackDigest + DailySeed)`.
* **Practice / endless mode:** client can generate from `(Pack + seed)` because cheating doesn’t matter.
* **Live-ops variety:** rotate/stack packs (Season Pack, Holiday Pack, “Weird Devices” Pack) so patterns don’t show up in a week.

### What goes in the Pack vs the Bundle?

**Pack (versioned content/rules):**

* scenario templates + twist rules
* bark catalog templates/slots + voice style per archetype
* device profiles + log vocabulary
* evidence-derivation rules + contradiction rules
* difficulty curves + “funness lint” thresholds

**CaseBundle (one instance):**

* cast, map, devices, windows
* canonical event log (truth)
* derived evidence index (what KOA can reveal)
* per-case BarkPool (pruned variants)
* validator report + difficulty estimate
* encrypted/withheld solution vector

If you tell me whether you want “daily shared” to be *fully offline playable* from publish time, I’ll suggest the exact “solution encryption / unlock” strategy too.
