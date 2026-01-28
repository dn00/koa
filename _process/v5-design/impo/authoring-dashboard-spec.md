# V5 Authoring & QA Dashboard Spec

**Purpose:** Define a simple internal web/UI tool for designing, inspecting, and QA-ing V5 / KOA Mini puzzles using:
- The V5 engine (`play-v5.ts`)  
- Deterministic validator (`prototype-v5.ts`)  
- LLM agent QA (`agent-qa-spec.md`)

This is a design doc, not an implementation. It describes what the dashboard should show and how it should call existing scripts/services.

**Last Updated:** 2026-01-28

---

## 1. Goals

The dashboard should let a designer/agent:

1. **Load or paste a puzzle** (or generate one from a seed).  
2. **See all its content** (scenario, facts, cards, KOA barks, verdicts) in one place.  
3. **Run validation**:
   - `prototype-v5.ts` (mechanical invariants)  
   - LLM player-model agents (persona zoo)  
   - LLM judge agent (qualitative rubric)  
   - KOA dialogue and card-claim checks  
4. **View summarized QA results** with drill-down into details.  
5. **Decide quickly**: ship / tweak / regenerate / reject.

It should work for both:

- **KOA Mini** (default view), and  
- **V5 Advanced** (same puzzles, more mechanics visible).

---

## 2. Inputs & Data Sources

The dashboard will interact with:

- `scripts/v5-puzzles.ts` — source of V5Puzzle objects (imported or loaded via JSON).  
- `scripts/prototype-v5.ts` — run with `--json` for invariant checks & diagnostics.  
- `scripts/play-v5.ts` — used by the agent harness to simulate play.  
- Agent QA harness (to be implemented): wraps LLM API calls per `agent-qa-spec.md`.

The dashboard itself should treat these as **services**:

- `validatePuzzle(puzzleSlugOrJson)` → JSON from `prototype-v5.ts`.  
- `runAgentQA(puzzleSlugOrJson)` → player-model + judge + dialogue check JSON.  
- Optionally, `previewPlaythrough(puzzleSlugOrJson, persona)` → a single simulated run transcript.

---

## 3. Layout Overview

Recommended single-page (tabbed) layout:

1. **Puzzle View** — read & edit content.  
2. **Mechanical Validation** — `prototype-v5.ts` results & diagnostics.  
3. **LLM Agent QA** — persona runs, judge verdict, metrics.  
4. **KOA & Dialogue QA** — bark safety/leakage, card claim clarity.  
5. **Summary & Actions** — final decision panel with ship/tweak/regenerate.

---

## 4. Panel Details

### 4.1 Puzzle View

Shows the full `V5Puzzle` content, ideally read-only by default with an “edit JSON” toggle:

- Scenario text.  
- Known Facts.  
- Cards:
  - id, type, strength, location, time, claim, presentLine, isLie flag (visually marked for editors only).  
- Lie metadata (`lies` array with `lieType` and `reason`).  
- KOA barks (cardPlayed, flag prompts, verdicts).  
- Target Belief and any special flags (e.g., difficulty tag).

Mini vs Advanced toggle:

- Mini: hides Belief numbers and mechanics; shows what the player would see in KOA Mini.  
- Advanced: shows full config (startingBelief, target, typeTax, objection config).

### 4.2 Mechanical Validation Panel

Runs `prototype-v5.ts --json --puzzle [slug]` and displays:

- **Pass/fail** for each invariant check (S1–S6, C1–C3, B1–B7, L1–L4, O1–O2, X1–X3, D1–D4).  
- Stats:
  - Score min/median/max.  
  - Win rate, FLAWLESS rate, BUSTED rate.  
  - Type tax trigger rate, avg type tax count.  
  - T1 EV spread, blindness score, near-optimal count, replayability index.

UI:

- Traffic-light style list (✓/⚠/✗) matching existing CLI output.  
- Tooltips or expandable rows for check details (e.g., “avg lie strength vs avg truth strength”).

### 4.3 LLM Agent QA Panel

Uses `agent-qa-spec.md` outputs.

Sections:

1. **Persona Overview**
   - For each persona (literal, suspicious, methodical, intuitive, risk_averse, deductive):
     - Sample run outcome (tier).  
     - `avg_lies_played`.  
     - `t1_fact_usage_rate`.  
     - `felt_like_guess_rate`.  
     - Brief note: “Methodical avoided both lies and reached CLEARED,” etc.

2. **Judge Verdict**
   - Deducibility, T1 non-blindness, lie variety, meta safety, KOA behavior, card clarity, overall fairness — each with ok/notes.  
   - Overall `verdict` (accept / tweak / reject).  
   - Short summary paragraph.

3. **Metrics Detail**
   - T1 card frequency (bar chart).  
   - Lies played distribution.  
   - Tier distribution across personas.  
   - Optionally, sample reasoning snippets per persona.

### 4.4 KOA & Dialogue QA Panel

Sections:

1. **Dialogue Safety**
   - List KOA lines that were flagged as:
     - Using banned language (e.g., “objection”, “guilty”).  
     - Spoiling truth/lie before end.  
     - Too long or off-voice.
   - Each with a short note & suggested fix.

2. **Hint Leakage**
   - Lines marked `too_direct` by the judge agent.  
   - Explanation of why (“This line implies that the 2:15 AM card is definitely wrong.”).

3. **Card Claim Clarity**
   - Cards flagged as ambiguous, auto-giveaway, or too vague.  
   - Notes for designer (e.g., “Specify phone vs laptop if that matters to deduction.”).

### 4.5 Summary & Actions Panel

Top-level status:

- `prototype-v5.ts`: pass / fail (with count of failing checks).  
- Judge agent: `accept` / `tweak` / `reject`.  
- Dialogue & claim checks: any serious flags?

Suggested badges:

- ✅ “Mechanically valid” (no error-level failures).  
- ✅/⚠ “Agent QA accepted / accepted with notes / rejected”.  
- ✅/⚠ “KOA dialogue safe / needs edits”.

Actions:

- **Ship** — mark puzzle as approved (e.g., tag in JSON or export to production pack).  
- **Mark for tweak** — add to a “needs editing” list.  
- **Regenerate** — call content generation pipeline to regenerate a variant from the same seed (where supported).

Notes:

- All actions should log puzzle slug + timestamp + user for audit.

---

## 5. Implementation Notes (Non-binding)

You can implement this dashboard in many ways. One pragmatic option:

- A small Node/TypeScript web app (React or similar) that:
  - Imports `V5_PUZZLES` from `scripts/v5-puzzles.ts`.  
  - Exposes HTTP endpoints to:
    - Run `prototype-v5.ts --json`.  
    - Run the agent QA harness (which calls the LLM API).  
  - Renders the panels described above.

Performance considerations:

- Mechanical validation is fast; agent QA is slower and should be:
  - Triggered explicitly (“Run LLM QA”).  
  - Cached per puzzle slug & agent version.  
  - Possibly batched overnight for large packs.

Security / privacy:

- This is an internal tool; do not expose LLM transcripts or puzzle JSON publicly.  
- Store only what you need for QA (metrics, short summaries, minimal logs).

---

## 6. Usage Workflow

For a designer/agent:

1. Pick a puzzle from the list or paste/import a new `V5Puzzle` JSON.  
2. Inspect content in **Puzzle View**.  
3. Run **Mechanical Validation**; fix any hard failures.  
4. Run **LLM Agent QA**; read judge verdict & persona behavior.  
5. Check **KOA & Dialogue QA** for any spoiler or style issues.  
6. If everything looks good:
   - Mark as approved / add to daily schedule.  
   - Optionally share interesting notes (e.g., “Friday Hard — subtle relational lies on timeline + channel”).  
7. If not:
   - Tweak card claims, strengths, facts, or KOA lines.  
   - Re-run validation & agent QA until acceptable.

This dashboard should make puzzle creation and QA far less guessy and ensure every shipped daily respects both the V5 invariants and the qualitative bar you’ve set from playtests. 

