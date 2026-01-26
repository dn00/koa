Below is the **minimum set of doc outputs / patch artifacts** you should generate so your agent can bring the repository back to a single, consistent “source of truth” aligned with **Option B (Daily Draft, single-incident)**.

## A) One patch doc to rule them all

Generate a single **PATCHPLAN_v1.md** (or `patch-3.md`) that contains, in this order:

1. **Canonical Mode Decision (MVP)**

* MVP = **Daily, single-incident** (Draft 6 of 12, Submit 1–2 cards, Scan, Scrutiny→Audit→Quarantine).
* Anything else (3 acts, Ops protocols, shops, etc.) explicitly marked **post-MVP**.

2. **Terminology Canon**
   A small table locking player-facing vs internal terms, e.g.:

* Resistance (player) ↔ lock_strength (internal)
* Protocol (player) ↔ gate (internal)
* Submit (player) ↔ inject (internal)
* Scan (player) ↔ cycle/refresh (internal)
  …and mandate “use one term everywhere” (fixes SYNC/SEND/INJECT drift).

3. **File operations list**
   Exact rename/move/create/delete instructions (see section C below).

4. **Cross-reference fixes**
   A list of “search/replace” targets (broken “Next doc” links, references to D04/D05/D07 that are currently wrong).

5. **Contract insertion points**
   Where the Daily Contract lives (recommend: **D02** as canonical “physics for MVP”, plus **D29** as player-facing rules).

This patch doc is what your agent should execute first.

---

## B) Documents you must (re)generate or rewrite

These are the “blocking” missing/incorrect pieces your audit identified.

### 1) **D04 — GATES & COUNTER-SETS LIBRARY v1** (must exist)

Generate the actual **10 protocols** with:

* Protocol ID
* 2–4 valid paths each (AND/OR rules)
* Example payloads
* Notes on what tags are allowlisted for resonance (if relevant)

Right now the repo references “10 gates” but doesn’t define them. That’s the biggest gameplay-gap blocker.

### 2) **D05 — MOVES / ACTIONS (Daily) v1** (rewrite to match Option B)

For Option B, D05 should **not** be “6 moves” unless you’re explicitly keeping them for a different mode.

For MVP Daily, D05 should define only:

* **SUBMIT** (payload 1–2, protocol check, compliance math, resonance, scrutiny effects)
* **SCAN** (swap 1–2 from loadout with reserve, costs, constraints)
* Any automatic transitions (Audit trigger at Scrutiny 5, Quarantine rules)

If you want to preserve the old 6-move design, keep it as **post-MVP** in a separate doc (e.g., `D05B-ROGUELITE-OPS-MOVES.md`) so MVP doesn’t stay ambiguous.

### 3) **D07 — MODIFIERS (Daily Mutators) v1** (rewrite)

For Daily, D07 should be “Daily Mutators / Weather,” not economy/progression.

Minimum content:

* Mutator schema
* 8–12 mutators with deterministic effects (e.g., resonance multiplier change, hidden tags, higher baseline scrutiny, stricter protocol queue visibility rules)
* Validation rules to prevent unwinnable dailies

### 4) **D17 — CLIENT ARCHITECTURE PWA v1** (it’s empty; must be filled)

This should clearly answer:

* Where game logic runs (client-side PWA; no SSR requirement for gameplay)
* Replay/audit: event log + deterministic resolver
* Pack loading, version binding, and validation
* If Python kernel is “reference only” vs “actually used” (see section D)

---

## C) File mismatch remediation you should encode in the patch doc

Based on your audit, these are the concrete moves:

1. Preserve the current “event model” content:

* `D04-GATES-COUNTER-SETS-LIBRARY-v1.md` (currently Event Model) → **rename** to `D04A-GAME-STATE-EVENT-MODEL.md`

2. Restore the missing physics docs:

* Create a new **real** `D04-GATES-COUNTER-SETS-LIBRARY-v1.md`
* Create a new **real** `D05-MOVES-TOKENS-SPEC-v1.md` but rewritten as **Daily Actions** (or rename it to avoid the “tokens” baggage if tokens are not in MVP)

3. Fix D07 mismatch:

* Current `D07-BOSSES-MODIFIERS-LIBRARY-v1.md` (contains economy/progression) → merge into D25 (or archive)
* Then create new **real** `D07-BOSSES-MODIFIERS-LIBRARY-v1.md` as **Daily Mutators**

4. D05/D11 duplication:

* If current D05 is incident gen and D11 is incident pipeline: **merge into D11**, then archive old D05 content.

5. Update `index.md` to match reality after the moves.

---

## D) Kernel / implementation alignment (must be decided + documented)

Because you uploaded the Python kernel, you need a clear doc statement:

### You should generate a short “Implementation Contract” section (recommended inside D17)

It must answer:

* Is Python kernel **authoritative reference** only (used to validate TS port)?
* Or will Python run in production (Pyodide/WASM) inside the PWA?

For consistency and deployment simplicity, the clean MVP path is:

* **TypeScript engine runs client-side** (PWA)
* Python kernel is used as a **golden reference test suite** (fixtures + replay equivalence), not runtime code

If you adopt that, you must add patch instructions to:

* Make **event replay equivalence tests** mandatory (TS must reproduce Python outcomes for the same seed + event log)

---

## E) What you do *not* need to generate right now

To keep patchwork tight, don’t regenerate everything. Defer:

* 3-act ladder rules (keep as “future mode”)
* Shops, long-run progression, complex ops protocols
* Any new content packs beyond what’s needed to validate solvability

---

## The shortest “done” checklist

If you generate only these 5 items, patching becomes straightforward:

1. `PATCHPLAN_v1.md` (file ops + terminology + crossref fixes + MVP mode lock)
2. New `D04` Gates & Counter-sets library (10 protocols fully defined)
3. New `D05` Daily actions (Submit/Scan/Audit/Quarantine + math)
4. New `D07` Daily mutators library (and validation rules)
5. `D17` filled in (PWA architecture + where logic runs + how Python kernel is used)
