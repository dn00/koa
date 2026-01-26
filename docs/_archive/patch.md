
# CONTEXT (NOT PATCH INSTRUCTIONS)

Yes: if you keep the Python kernel in the repo, the **intent should be “reference/oracle + tooling”**, and the **runtime engine still needs a TypeScript port** for the PWA.

### 1) What happens to the Python source?

You can (and should) include it, but typically in one of two roles:

**A. Reference/oracle (recommended even if TS is authoritative)**

* Python is not shipped to players.
* Used in CI to validate determinism:

  * same seed + same action script → identical event stream/state hash
* Used for fast batch sims (balancing) if you like.

**B. Tooling-only**

* Pack generation / validation scripts.
* Produces JSON packs consumed by the TS engine.

In both cases, Python lives in the repo, but **does not run in the browser**.

### 2) Does it “need to be ported to TypeScript”?

If your shipped client is a web PWA: **yes**, the kernel (or at minimum, the resolver/event-log/RNG/hashing core) must exist in TypeScript to run locally offline.

If you instead choose “server-authoritative gameplay” (not recommended for your offline-first goals), you could avoid porting by running Python on the server—at the cost of latency, always-online dependence, and higher ops burden.

Given your stated goals (offline, instant feel, deterministic, solo-dev-friendly): **port the engine to TS**.

### 3) Where does the TS code run: SSR or client-side?

**Client-side.**

Specifically:

* **Game UI + engine** runs **in the browser** (PWA).

  * This is how you get offline play and instant mechanics.
* A simple server (or static host) only serves:

  * the app bundle
  * pack manifests / pack JSON files (CDN-style)

**SSR is optional** and only useful for:

* marketing site pages
* SEO landing pages
* account pages (if any)

But SSR is not the right execution model for the core game loop. If SSR is involved in gameplay, you’ve implicitly made it online and latency-bound.

### 4) The clean architecture (what runs where)

**Browser (PWA)**

* `engine-core` (deterministic TS library)
* `ui` (React/TS)
* IndexedDB persistence (event log + snapshots)
* pack loader (fetch + cache packs; fail-closed)

**Node (build/dev/CI)**

* pack compiler (weekly/monthly pack build)
* pack validator + solvability checks
* golden fixtures + regression runs
* optional sim tooling

**Python (optional, in repo)**

* oracle implementation to cross-check TS during port
* exploratory balancing scripts if you prefer

### 5) Practical repo layout (minimal and sane)

* `/packages/engine-core` (pure TS, deterministic, no DOM/Node APIs)
* `/apps/pwa` (UI + storage + pack loading)
* `/tools/pack-cli` (Node scripts using `engine-core`)
* `/tools/py-kernel` (your existing Python kernel + fixture runner)

### 6) Auditability/replay in the TS client

Yes—unchanged conceptually:

* Persist canonical events (plus optional hash chain)
* Derive state by replay
* Optionally store periodic state snapshots for fast resume
* Export “run bundle” for sharing: `{manifest_binding, events}`

That is client-side, offline-safe, and debuggable.

---

**Recommendation:** Build the PWA as a fully client-side app with a deterministic TS `engine-core`. Keep Python in the repo as an oracle/tooling aid during the port, not as a runtime dependency.

If you want, I can outline the exact TS module equivalents for your current Python files (`events`, `state`, `tick`, `effects`, `hash`, `rng`) and the “golden fixture” format so the port is provably consistent.


# PATCH

### What is already covered (based on what you pasted here)

* **Client-side, offline-first, replayable event-sourcing** is clearly specified in your **D04 — Game State & Event Model** (event envelope, append-only log, replay rules, IndexedDB storage, snapshots, voice as non-authoritative). That’s the core of auditability/replay.
* **Web-first PWA direction + pack-serviced content + optional backend** is stated in **Blueprint v0.2** (PWA + CDN-served packs; optional enhanced voice).

### What is *not* clearly outlined (or is typically missing)

The specific architectural decisions you just asked about are usually in **D17/D18/D21**, and you previously flagged **D17 as empty**. The missing pieces are:

1. **Authoritative runtime location**

* Explicit statement that the **engine runs client-side in the browser** (PWA), not SSR.
* SSR is optional and only for marketing/account pages, not gameplay.

2. **Single-language TS engine used in two environments**

* Same TS `engine-core` runs:

  * **browser** (gameplay)
  * **Node** (pack compilation, validation, simulations, fixtures)

3. **Python kernel role**

* Whether Python is:

  * (a) **reference/oracle + optional tooling** (recommended), or
  * (b) actually part of runtime (not recommended)
* Clear statement: **Python is not shipped to players**; it’s used for CI parity tests and/or pack tooling.

4. **Porting + parity plan**

* “Golden fixtures” and cross-checking strategy (Python vs TS) for deterministic equivalence.
* Determinism hazards (BigInt RNG, canonical JSON) and how you prevent drift.

### Where it *should* live in the docset

* **D17 — CLIENT ARCHITECTURE (PWA) v1**: should explicitly answer:

  * “Where does TS code run?” (client-side)
  * app/module layout (monorepo, engine-core)
  * pack loading, IndexedDB persistence
* **D18 — BACKEND MINIMUM (Packs + Telemetry)**: should explicitly answer:

  * “What backend exists?” (static hosting/CDN + optional telemetry)
  * “No gameplay SSR required”
* **D21 — TEST PLAN & FIXTURES**: should explicitly answer:

  * determinism tests, golden fixtures, replay verification
  * optional Python oracle integration in CI

---

## Patch instructions for your agent (recommended)

If you want your agent to update docs, instruct it to add the following blocks:

### Patch D17 (Client Architecture)

Add a new section: **“Execution Model: Client-authoritative Engine”**

* “The game engine (`engine-core`) executes entirely **in the browser** for offline play and instant feedback.”
* “SSR is not used for gameplay.”

Add a new section: **“Monorepo Structure”**

* `/packages/engine-core` (pure deterministic TS)
* `/apps/pwa` (React UI + IndexedDB + pack cache)
* `/tools/pack-cli` (Node tooling using engine-core)
* `/tools/py-kernel` (Python reference/oracle, optional)

Add a new section: **“Determinism Requirements”**

* BigInt RNG only, no floating math in core
* canonical JSON encoder required for hashing/events/packs
* event log is source of truth; UI never mutates state directly

### Patch D18 (Backend Minimum)

Add a section: **“Backend is distribution, not adjudication”**

* serve pack manifest + packs via CDN/static hosting
* optional telemetry endpoint
* optional auth/account later
* explicitly: “No SSR gameplay service; all resolution is client-side.”

### Patch D21 (Test Plan)

Add a section: **“Determinism & Replay Fixtures”**

* golden run fixture format: `{manifest_binding, seed, action_script, expected_event_chain_hash, expected_final_state_hash}`
* replay idempotence tests
* optional CI job: run Python kernel oracle vs TS engine on same fixtures until port is stable (then Python can be retired or kept as regression oracle)

---

Yes: if you keep the Python kernel in the repo, the **intent should be “reference/oracle + tooling”**, and the **runtime engine still needs a TypeScript port** for the PWA.

### 1) What happens to the Python source?

You can (and should) include it, but typically in one of two roles:

**A. Reference/oracle (recommended even if TS is authoritative)**

* Python is not shipped to players.
* Used in CI to validate determinism:

  * same seed + same action script → identical event stream/state hash
* Used for fast batch sims (balancing) if you like.

**B. Tooling-only**

* Pack generation / validation scripts.
* Produces JSON packs consumed by the TS engine.

In both cases, Python lives in the repo, but **does not run in the browser**.

### 2) Does it “need to be ported to TypeScript”?

If your shipped client is a web PWA: **yes**, the kernel (or at minimum, the resolver/event-log/RNG/hashing core) must exist in TypeScript to run locally offline.

If you instead choose “server-authoritative gameplay” (not recommended for your offline-first goals), you could avoid porting by running Python on the server—at the cost of latency, always-online dependence, and higher ops burden.

Given your stated goals (offline, instant feel, deterministic, solo-dev-friendly): **port the engine to TS**.

### 3) Where does the TS code run: SSR or client-side?

**Client-side.**

Specifically:

* **Game UI + engine** runs **in the browser** (PWA).

  * This is how you get offline play and instant mechanics.
* A simple server (or static host) only serves:

  * the app bundle
  * pack manifests / pack JSON files (CDN-style)

**SSR is optional** and only useful for:

* marketing site pages
* SEO landing pages
* account pages (if any)

But SSR is not the right execution model for the core game loop. If SSR is involved in gameplay, you’ve implicitly made it online and latency-bound.

### 4) The clean architecture (what runs where)

**Browser (PWA)**

* `engine-core` (deterministic TS library)
* `ui` (React/TS)
* IndexedDB persistence (event log + snapshots)
* pack loader (fetch + cache packs; fail-closed)

**Node (build/dev/CI)**

* pack compiler (weekly/monthly pack build)
* pack validator + solvability checks
* golden fixtures + regression runs
* optional sim tooling

**Python (optional, in repo)**

* oracle implementation to cross-check TS during port
* exploratory balancing scripts if you prefer

### 5) Practical repo layout (minimal and sane)

* `/packages/engine-core` (pure TS, deterministic, no DOM/Node APIs)
* `/apps/pwa` (UI + storage + pack loading)
* `/tools/pack-cli` (Node scripts using `engine-core`)
* `/tools/py-kernel` (your existing Python kernel + fixture runner)

### 6) Auditability/replay in the TS client

Yes—unchanged conceptually:

* Persist canonical events (plus optional hash chain)
* Derive state by replay
* Optionally store periodic state snapshots for fast resume
* Export “run bundle” for sharing: `{manifest_binding, events}`

That is client-side, offline-safe, and debuggable.

---

**Recommendation:** Build the PWA as a fully client-side app with a deterministic TS `engine-core`. Keep Python in the repo as an oracle/tooling aid during the port, not as a runtime dependency.

If you want, I can outline the exact TS module equivalents for your current Python files (`events`, `state`, `tick`, `effects`, `hash`, `rng`) and the “golden fixture” format so the port is provably consistent.
