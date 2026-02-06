# LifeDex — Frozen Spec v1.0 (Single-Doc Edition)

**Product:** LifeDex (a “Pokédex for yourself”)  
**Status:** Frozen v1.0 (authoritative product + system spec; single-doc consolidation)  
**Date:** {date(2026,2,6).isoformat()}  
**Foundational substrate:** Worlds Compiler (WC) contracts (determinism, PVC patches, validators, projections, packs)

---

## 0) One-liner

**LifeDex** is a personal operating app where you capture messy life text and convert it into a clean, inspectable **Dex of truths** (rules, preferences, people, projects, commitments) via **Preview → Verify → Commit** patches. It stays trustworthy because **nothing changes silently**, everything has **provenance**, and you can **undo** any change.

---

## 1) Product framing

### 1.1 The user promise
1. **Dump anything** (small notes or huge transcripts) without organizing.
2. Get **high-quality suggestions** (not silent edits).
3. Confirm what’s true into a personal **Dex**.
4. When life breaks, press **Today Broke** and get a **repair plan diff** you can accept.
5. See **why** the app believes any fact, and **undo** any change.

### 1.2 The core twist
The LLM (and any ML) is **not runtime authority**. It is a **proposal generator** that drafts typed **PatchBundles**. The engine enforces:
- deterministic state transitions
- strict patch operators
- validators + fail-closed
- provenance requirements
- undo/replay

### 1.3 Who it’s for (primary)
- People who live in “notes chaos” and want **order without shame**.
- AuDHD-friendly users who need **Minimum Mode / Repair Mode**.
- Builders/founders/creatives who want a **truth ledger** of decisions, commitments, and defaults.

### 1.4 Non-goals (v1)
- Not a “talking therapist” or open-ended chatbot.
- Not an omniscient personal agent that executes actions outside the app.
- Not a replacement for long-form writing tools (Obsidian/Docs) in v1; instead a **Truth Layer** that can integrate/export.

---

## 2) UX contract (the whole app in 4 screens)

### 2.1 Screen 1 — Inbox (Capture → Hatch)
**Purpose:** Convert raw notes into suggestions.

- **Capture**: paste text, quick jot, share sheet, optional voice transcript (later).
- Each capture becomes a **SourceNote**.
- Inbox shows **Suggestion Packs** grouped per note:
  - suggested Dex entries (create/update)
  - suggested Today changes (optional)
  - suggested follow-ups (“confirm stale rule?”)

Actions:
- **Accept**, **Reject**, **Edit**, **Accept all safe**, **Preview diff**, **Commit**, **Undo**

### 2.2 Screen 2 — Dex (Browse “you-entries”)
**Purpose:** The Pokédex experience.

- Filter by Entry Type:
  - Rules, Preferences, People, Projects, Commitments, Routines, Triggers/Hazards, Rewards
- Each card shows:
  - title + summary
  - **status** (Draft / Confirmed / Stable / Stale / Deprecated)
  - **confidence**
  - last-seen / last-updated
- Tap entry → **Inspector** (“Why do we believe this?”)

### 2.3 Screen 3 — Today (Minimum Day / Repair Mode)
**Purpose:** A stabilizer, not a nag.

- Always shows a simple plan surface:
  - 1 Priority
  - 2 Tiny Wins
  - Buffers
  - Deferred items (with reasons)
- One-tap button: **TODAY BROKE**
  - produces a **Repair Patch** (previewable + undoable)
  - user commits if desired

### 2.4 Screen 4 — History (Time machine)
**Purpose:** Trust, replay, reversal.

- Commit timeline:
  - what changed (diff)
  - why (provenance)
  - who/what generated it (manual/heuristic/local model/LLM)
- One-tap:
  - **Undo** a commit
  - Export snapshot
  - Restore backup

---

## 3) Core loops (retention mechanics)

### Loop A: Capture → Suggest → Commit (daily)
1. User captures raw note
2. App proposes patches
3. User accepts a few
4. Dex becomes cleaner and more personal

### Loop B: Today Broke (crisis)
1. User hits “Today Broke”
2. App proposes a minimal repair plan with diff
3. User commits
4. Immediate relief + sense of control

### Loop C: Evolution Queue (weekly)
A weekly queue (max 5 items) of small, safe proposals:
- Confirm “still true?”
- Deprecate stale items
- Merge duplicates
- Shrink routines that repeatedly fail
- Split overloaded commitments

**Rule:** Evolution is always optional and always previewable.

---

## 4) Systems architecture (built on Worlds Compiler)

### 4.1 Canonical vs derived rule (the trust boundary)
- **Canonical (Truth Layer):** Only what has been **committed** via PatchBundles.
- **Derived layers:** Projections, suggestions, predictions, insights. Can be wrong; must cite evidence.

**No mystical state:** If the UI shows it as true, it must exist in canonical state.

### 4.2 Engine runtime model
LifeDex runs a deterministic world engine:
- Canonical state is updated only by:
  - user verbs (manual UI actions)
  - committed patch bundles (from proposal generators)
- All state transitions are replayable.

### 4.3 Proposal generators (pluggable, identical output format)
LifeDex supports multiple proposal sources:

1. **Heuristic proposer** (default, offline):
   - typed capture mini-markup
   - conservative regex + parsers
2. **Local model proposer** (optional, on-device):
   - ranks/slots patch candidates (reduces typing)
   - learns from accept/reject/edit feedback
3. **Cloud LLM proposer** (premium, optional):
   - “Turbo Extract” for messy text
   - still emits typed PatchBundles only

All proposals become PatchBundles → Preview → Verify → Commit.

---

## 5) Data model (canonical)

> This is the minimum entity set required to ship a real product.

### 5.1 SourceNote
- `id`
- `text` (raw, immutable)
- `createdAt`
- `source` (paste/share/voice/import)
- `tags[]` (optional)
- `checksum` (for integrity)

### 5.2 DexEntry (base)
- `id`
- `type` (enum)
- `title`
- `summary`
- `status` (Draft/Confirmed/Stable/Stale/Deprecated)
- `confidence` (0..1)
- `createdAt`, `updatedAt`
- `lastSeenAt` (derived or canonical; see policy)
- `tags[]`

**Entry types (v1 required):**
- `Rule` (if/then constraints, defaults)
- `Preference` (likes/dislikes, cutoffs)
- `Person` (name, cadence, relationship notes)
- `Project` (status, next step, focus)
- `Commitment` (due date/cadence, owner, status)
- `Routine` (steps, schedule)
- `TriggerHazard` (trigger → consequence)
- `Reward` (helpful actions)

### 5.3 ProvenanceLink
- `entryId`
- `sourceNoteId`
- `excerpt` (start/end indices OR normalized quote hash)
- `extractionMethod` (manual/heuristic/local/llm)
- `createdAt`

**Policy:** Any fact-like entry created from a note must have provenance OR remain Draft.

### 5.4 TodayPlan
- `date`
- `priority` (0..1 item)
- `tinyWins[]` (0..2 items default)
- `buffers[]` (0..N)
- `deferred[]` (items with reason)
- `mode` (Normal / Minimum / Recovery)

### 5.5 CommitLogEntry (history)
- `commitId`
- `timestamp`
- `patchId`
- `diffSummary`
- `provenanceRefs[]`
- `proposer` (manual/heuristic/local/llm)
- `riskClass` (Low/Med/High)
- `undoCommitId` (if applicable)

### 5.6 EventLog (canonical instrumentation)
- append-only typed events:
  - capture, propose, preview, commit, reject, edit, undo
  - task completion, deferral, routine run
- used for:
  - audit
  - analytics (local-first)
  - local personalization training

---

## 6) Patch system (PVC)

### 6.1 PatchBundle
A PatchBundle is the only write mechanism besides direct verbs.
Fields:
- `patchId`
- `targetWorldId`
- `ops[]` (typed, allowlisted)
- `rationale[]` (optional, for UI)
- `proposerMetadata` (model version, heuristic id, etc.)

### 6.2 Patch operations (v1 allowlist)
- `upsertEntry` (create/update by id/key)
- `setEntryStatus` (Draft→Confirmed→Stable, etc.)
- `linkProvenance`
- `updateTodayPlan`
- `deferItem`
- `mergeEntries` (requires validator pass + user confirm)
- `splitEntry` (creates two Drafts)
- `setConfigKnob` (bounded tuning only; see below)

### 6.3 Preview
Preview must return:
- canonical diff
- projection diffs (what screens will look like)
- validator results (pass/warn/fail)
- risk classification
- undo estimate (how reversible)

### 6.4 Verify (validators)
All patches must pass validators to commit.
- Warnings are allowed but must be surfaced.
- Failures block commit (fail-closed).

### 6.5 Commit
Commit:
- applies patch to canonical state
- appends commit + events
- re-renders projections
- provides undo handle

### 6.6 Auto-commit policy (v1 default: OFF)
Optional: allow auto-commit only for strictly safe ops:
- view ordering / UI-only tweaks
- adding a tag
- minor knob tuning within tiny bounds
Never auto-commit:
- deletions
- merges/splits
- financial changes
- anything high-risk

---

## 7) Validators (static + dynamic)

### 7.1 Static validators (always on)
- Schema validity
- Field formats (times, dates)
- Duplicate key rules (e.g., one `caffeine_cutoff`)
- Provenance requirements for new factual entries
- Commit scope limits (no mass edits beyond N without explicit override)
- Safety policy validators (no malicious pack behavior)

### 7.2 Dynamic validators (rollouts / quality)
- Suggestion quality gates (too spammy? too many low-confidence?)
- Evolution queue bounds (max 5)
- “Minimum Day” plan size constraints
- Anti-staleness: detect abandoned commitments and propose deprecations (as suggestions, not forced)

### 7.3 Validator outputs: RepairTargets
Validators should emit machine-readable repair targets that the UI can show and proposal generators can fix:
- `MISSING_PROVENANCE`
- `DUPLICATE_ENTRY_KEY`
- `INVALID_TIME_FORMAT`
- `PLAN_TOO_BIG_FOR_MODE`
- `MERGE_CONFLICT_FIELDS`
- `PATCH_SCOPE_TOO_LARGE`

---

## 8) Suggestions without LLM (deterministic extraction)

### 8.1 Typed capture mini-markup (recommended)
Allow light syntax inside notes:

- `^rule caffeine_cutoff=14:00`
- `^pref deep_work=morning`
- `@person Sam`
- `+commit call Sam weekly Thu`
- `!decision focus=HouseholdOS`
- `#project HouseholdOS`
- `?question what is wedge`

These become deterministic suggestions with high confidence.

### 8.2 Conservative pattern extractors
Example patterns:
- “stop/avoid/cut X after TIME” → Rule/Preference
- “every Thursday” / “weekly” / “on Fridays” → cadence
- “call/meet with NAME” → Commitment + Person candidate
- “I decided…” / “we chose…” → Decision entry

**Rule:** If ambiguous, create Draft with low confidence and ask user.

---

## 9) Local personalization model (optional, on-device)

### 9.1 What it does (bounded)
- ranks suggestion candidates
- predicts likely next verb
- pre-fills common slots (person, project, cadence, time)
- predicts “repair mode likely” from patterns

### 9.2 What it uses
- EventLog + committed canon (never needs raw notes)
- Optional embeddings of titles/summaries (local)

### 9.3 Learning signals
- Accept = positive
- Reject = negative
- Edit-after-accept = “near miss”
- Undo = strong negative
- Dwell/click = weak preference signal (optional)

### 9.4 Determinism rule
Model outputs are **non-canonical**; world replay does not depend on model outputs.
Optionally record model version in `PATCH_PROPOSED` for audit.

---

## 10) Predictions & insights (derived layer)

### 10.1 What “prediction” means here
A prediction is a **derived suggestion** with evidence, not a fact.
Examples:
- “High chance Today will break → propose Minimum Day”
- “You’re overdue to contact Sam”
- “When tasks > 5 you complete < 2 (based on history)”

### 10.2 PredictionRecord
- `id`
- `type`
- `message`
- `confidence`
- `evidenceRefs[]` (events/entries)
- `expiresAt`
- `recommendedPatchId` (optional)

**Policy:** Predictions never auto-commit changes.

---

## 11) Packs & extensions (LifeDex as a pack-host)

### 11.1 Pack categories
- **Core packs** (ship with app):
  - Canon Core (notes + entries + provenance)
  - Dex Views (UI projections + inspector)
  - LifeOps (Today plan + repair mode + evolution)
- **Expansion packs** (install later):
  - Household, Relationships, Business/Creator, Health
  - Personal Finance (future)

### 11.2 Pack capabilities (security)
Packs must declare:
- what entities they own
- what patch ops they can propose
- what views they can render (via ViewIR primitives)
- what external ports they may access (none by default)

No pack may:
- execute arbitrary code outside sandbox
- exfiltrate data without explicit user opt-in
- mutate other pack-owned canon without arbitration rules

### 11.3 Conflict resolution
When two packs want to touch the same surface:
- ownership rules decide (primary owner)
- or both can propose patches, but validators arbitrate conflicts
- user sees conflict diffs, chooses resolution

---

## 12) Offline-first, sync, and export

### 12.1 Offline-first (required)
LifeDex must be fully usable offline:
- capture
- suggestions (heuristics + local model)
- commit/undo
- browse/search

LLM features are optional upgrades.

### 12.2 Sync (v1 optional; v1.1+ likely)
- end-to-end encrypted sync option
- multi-device conflict handling via commit log + deterministic merges
- device identity + key management

### 12.3 Export / exit hatch (required)
- Export raw notes as text/markdown
- Export Dex entries as JSON + markdown summaries
- Export full world snapshot bundle (replayable) for trust

---

## 13) Premium & monetization (suggested)

### Free
- capture notes
- deterministic extraction (markup + heuristics)
- Dex browsing
- Today broke
- history + undo
- export

### Premium
- Turbo Extract (cloud LLM)
- advanced proposal tournament (generate N candidates, pick best via validators)
- richer packs (Household/Business/Finance)
- encrypted sync
- advanced insights/predictions
- custom views/templates

---

## 14) MVP scope (v0.1 build that still honors the architecture)

### Must ship
- 4-tab UI (Inbox, Dex, Today, History)
- SourceNote capture + storage
- deterministic suggestion engine (markup + conservative patterns)
- PatchBundle PVC pipeline (preview/verify/commit)
- validators (schema, provenance, duplicate keys, plan bounds)
- undo + commit history
- Dex inspector with provenance
- Today Broke repair patch

### Must NOT ship (v0.1)
- open marketplace for third-party packs
- background agents that commit automatically
- complex sync (unless already trivial)
- unbounded UI DSL (keep ViewIR primitives small)

---

## 15) QA, testing, and quality gates

### 15.1 Test types
- Unit tests: patch ops, validators, parsers
- Property-based tests:
  - “undo restores state”
  - “preview matches commit result”
  - “canonicalization stable”
- Scenario tests:
  - sample notes → expected proposals → commits → projections
- Replay tests:
  - deterministic re-run of event log produces identical snapshot hash

### 15.2 Performance budgets (mobile)
- cold launch to usable: target < 2s (device-dependent)
- preview + validate patch: target < 200ms for typical patches
- search: incremental index, < 100ms for common queries

---

## 16) Safety & abuse prevention

### 16.1 Prompt injection guardrails (for any LLM use)
- never allow “note text” to override system instructions
- LLM output must be validated against PatchBundle schema
- no “new facts” in explanations; explanations must cite provenance
- block disallowed patch ops from LLM by capability allowlist

### 16.2 Data privacy
- local-first by default
- opt-in telemetry
- clear “what leaves device” UI
- finance pack requires stricter controls and explicit user consent for imports

---

## 17) Personal Finance Pack (future expansion spec sketch)

### Core principles
- transactions are append-only (immutable)
- categorization and rules are patch-based and undoable
- previews show impact across history before commit
- reconciliation validators prevent trust loss

### Entities (minimal)
- `Account`
- `Transaction` (imported; immutable)
- `Category`
- `Rule` (categorization)
- `Budget` (envelopes)
- `RecurringBill`

### Verbs
- import CSV/OFX
- categorize / rule propose
- set budget
- flag anomaly

---

## 18) Success metrics (what “winning” looks like)

### Activation
- % of users who commit ≥ 3 entries within first session
- % who use Today Broke within first week (and keep using)

### Retention proxies
- accepted patches per week
- evolution queue completion rate
- time-to-first-relief (Today Broke → committed plan)

### Trust proxies
- undo rate (should be low but non-zero)
- provenance tap rate (shows users understand trust model)
- validator fail rate (too high = friction; too low = too permissive)

---

## 19) Glossary

- **Canon:** The confirmed truth layer (committed entries).
- **SourceNote:** Raw captured text (immutable).
- **PatchBundle:** Typed diff proposal.
- **PVC:** Preview → Verify → Commit.
- **Provenance:** Evidence link from an entry to a source excerpt.
- **Projection:** UI view derived deterministically from canon.
- **Suggestion Pack:** A set of PatchBundles grouped for one note/intent.
- **Evolution Queue:** Weekly maintenance suggestions.
- **Risk Class:** Low/Medium/High patch impact classification.

---

## 20) Final design principle (the “moat”)

**LifeDex wins by being the first personal system that feels intelligent *and* cannot gaslight you.**  
Its superpower is not the model. It’s the **contract**:  
**deterministic world + explicit diffs + validators + provenance + undo.**

---

**End of LifeDex Frozen Spec v1.0.**