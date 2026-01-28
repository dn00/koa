# V5 LLM Agent QA Spec — Puzzle, KOA, and Dialogue Quality

**Purpose:** Define how to use LLM agents to automatically test V5 / KOA Mini puzzles for:
- Puzzle logic (deducibility, T1 blindness, lie fairness)  
- KOA behavior (no spoilers, useful but not oracle)  
- Card/narration clarity

This complements, not replaces, deterministic validation (`scripts/prototype-v5.ts`).

**Last Updated:** 2026-01-28

---

## 1. Architecture Overview

Three layers of QA:

1. **Deterministic validator** — `scripts/prototype-v5.ts`
   - Enforces structural & balance invariants (win rate bands, type tax, lie strength, etc.).

2. **Player-model agents** — simulate human personas playing the puzzle
   - Literal, Suspicious, Methodical, Intuitive, Risk-averse, Deductive.
   - Only see what a player sees (scenario, Known Facts, 6 cards, KOA barks).
   - Produce explicit reasoning + choices per turn.

3. **Judge agent** — meta reviewer
   - Sees puzzle definition (including truth/lie labels) + player-model transcripts.
   - Scores puzzle against qualitative rubrics (deducibility, fairness, KOA behavior, dialogue safety).

A puzzle is **approved** only if:

- `prototype-v5.ts` passes (no error-level failures), and  
- Judge agent returns `accept` (or `accept_with_minor_notes`), and  
- Player-model metrics are within acceptable bands (e.g., low T1 blindness, reasonable lie detection rates).

---

## 2. Player-Model Agent Spec

**2.1 Input**

Per run, the player-model agent receives:

- Scenario text.  
- Known Facts (3–5 bullets).  
- 6 evidence cards (id, type, location, time, claim, strength, presentLine).  
- Configuration: Mini vs Expert/V5 view (for now, assume Mini: no numbers).

On each turn:

- Current hand (unplayed cards).  
- Story so far (cards already played).  
- KOA’s last bark (if any).

**2.2 Personas**

System prompts define behavior:

- `literal`: trusts claims, weak Fact use.  
- `suspicious`: distrusts strong / convenient evidence.  
- `methodical`: systematically cross-checks Facts vs claims.  
- `intuitive`: narrative/vibe-driven but references Facts sometimes.  
- `risk_averse`: minimizes worst-case penalties.  
- `deductive`: explicitly reasons through contradictions / relational logic.

**2.3 Turn Output Schema (JSON)**

Per turn, each agent produces:

```json
{
  "persona": "methodical",
  "turn": 1,
  "available_cards": ["browser_history", "smart_lock", "email_draft", "printer_queue", "partner_testimony", "motion_hallway"],
  "reasoning": "I list Known Facts and compare each card...",
  "used_known_facts": true,
  "fact_references": ["Fact #2: in bed by 11pm", "Fact #3: printer at 3am"],
  "considered_cards": [
    {
      "card_id": "smart_lock",
      "support": "Matches Fact #3 (door never opened).",
      "suspicions": []
    },
    {
      "card_id": "email_draft",
      "support": "Shows activity at 11:30pm.",
      "suspicions": ["Contradicts Fact #2 (bed by 11pm)."]
    }
  ],
  "chosen_card_id": "smart_lock",
  "confidence": "high",
  "felt_like_guessing": false,
  "koa_influence": {
    "considered_koa_bark": false,
    "description": ""
  }
}
```

Notes:

- `used_known_facts` + `fact_references` let us measure whether the agent truly uses Facts.  
- `felt_like_guessing` flags when the agent couldn’t form a real argument.  
- `koa_influence` captures whether KOA’s bark changed their decision.

**2.4 Derived Metrics**

From multiple runs per puzzle/persona:

- `t1_fact_usage_rate`: % of T1 turns where `used_known_facts=true`.  
- `t1_blindness` (LLM-based): 1 − `t1_fact_usage_rate`.  
- `avg_lies_played`: mean lies in played cards per run.  
- `felt_like_guess_rate`: % of turns where `felt_like_guessing=true`.  
- `koa_influence_rate`: % of turns where `koa_influence.considered_koa_bark=true`.  
- `lie_detection_rate`: % of runs where agent correctly identifies at least one lie in reasoning, even if not avoided.

These metrics are compared against thresholds (configurable) to detect puzzle issues (e.g., T1 always blind, lies indistinguishable from truths).

---

## 3. Judge Agent Spec (Puzzle & KOA Assessment)

The judge agent sees:

- Full `V5Puzzle` definition (including `isLie`, `lies`, `lieType`).  
- Player-model transcripts (summarized per persona).  
- KOA barks and verdict lines.

**3.1 Rubric Questions**

Judge agent answers a fixed rubric, e.g.:

1. **Deducibility:** For each lie, is there a clear, logical explanation using only Known Facts + card claims (and scenario) for why it’s a lie?  
2. **T1 Non-blindness:** Is there at least one card that a cautious player can reasonably pick on Turn 1 using Known Facts (not pure guessing)?  
3. **Lie Variety:** Are lies varied in strength/type/flavor (not both highest strength or same evidence type)?  
4. **Meta Safety:** Would simple strategies like “always avoid strongest cards” or “never play DIGITAL” trivially solve this puzzle?  
5. **KOA Behavior:** Do KOA barks:
   - Avoid outright spoilers?  
   - Reference axes (timeline, channel, coherence) in a useful but non-oracular way?  
6. **Card Clarity:** Are card claims unambiguous on the axes that matter (time/location/device) and free of hidden assumptions?  
7. **Overall Fairness:** Does the puzzle feel fair and solvable by a careful human?

**3.2 Output Schema (JSON)**

```json
{
  "puzzle_slug": "midnight-print-2",
  "evaluation": {
    "deducibility": { "ok": true, "notes": "Both lies explainable via Facts #2 and #3." },
    "t1_non_blind": { "ok": true, "notes": "smart_lock is a clear anchor." },
    "lie_variety": { "ok": true, "notes": "One direct timeline lie, one self-incriminating lie." },
    "meta_safety": { "ok": false, "notes": "Avoiding strongest DIGITAL always works." },
    "koa_behavior": { "ok": true, "notes": "Barks hint at channels and timeline without spoilers." },
    "card_clarity": { "ok": true, "notes": "Claims specify times/devices clearly." },
    "overall_fairness": { "ok": true, "notes": "Careful reading is sufficient." }
  },
  "verdict": "tweak",  // "accept" | "tweak" | "reject"
  "summary": "Mechanically solid and deducible, but simple 'avoid strongest DIGITAL' meta works too often. Consider adjusting strengths or lie types."
}
```

Use `verdict` as the high-level gate:

- `accept` → OK to ship.  
- `tweak` → adjust puzzle (strengths, target, lie assignment) and re-run.  
- `reject` → regenerate puzzle content.

---

## 4. KOA Dialogue Safety & Hint Leakage Checks

Beyond puzzle logic, we need explicit checks on KOA’s text.

**4.1 Safety Check (Static)**

For each dialog slot (OPENING_STANCE, PRE_REVEAL_BARK, FLAG_PROMPT, FLAG_RESOLVE, FINAL_VERDICT), the judge agent is asked:

- Does this line use any **banned courtroom language** (“objection”, “guilty”, “verdict”, etc.)?  
- Does this line explicitly reveal whether a specific card is a **truth** or **lie** before the end?  
- Is the line **≤ 2 sentences**, readable aloud, and in KOA’s smart‑home bureaucrat voice?

Output example:

```json
{
  "slot": "PRE_REVEAL_BARK",
  "line": "Everything you’ve shown me is logs. No humans yet.",
  "uses_banned_language": false,
  "spoils_truth_lie": false,
  "style_ok": true,
  "notes": ""
}
```

Any line with `uses_banned_language=true` or `spoils_truth_lie=true` → puzzle flagged for manual rewrite.

**4.2 Hint Leakage Check (Per-Line)**

Prompt the judge agent:

> Given this KOA line alone, plus the scenario but not the card truths, can you confidently identify which card is a lie or which specific card the player should or should not play next?

Expected answer:

```json
{
  "line": "That 2:30 AM trip really doesn't match my logs.",
  "too_direct": false,
  "confidence": "medium",
  "rationale": "Hints at timeline issues but doesn't name a card or reveal lie with certainty."
}
```

If `too_direct=true` with high confidence, the bark is considered overpowered and should be revised.

---

## 5. Card Claim Clarity Check

For each card’s claim, the judge agent receives:

- Scenario, Known Facts, card claim + attributes (type, time, location).  
- No truth/lie label.

Questions:

- Is the claim **unambiguous** on the axes that matter for deduction (time, location, device)?  
- Does the claim **necessarily** contradict any single Known Fact (good for direct lies, bad for truths)?  
- Is the level of detail appropriate (not so vague that deduction is impossible, not so specific that it gives away truth/lie without reading Facts)?

Output example:

```json
{
  "card_id": "email_draft",
  "ambiguous": false,
  "auto_gives_away_truth": false,
  "auto_gives_away_lie": false,
  "notes": "Specifying 11:30pm and 'from your laptop in the study' is appropriate; contradiction only emerges when paired with Fact #2."
}
```

Use this to flag:

- Claims that are too vague (“checked some messages”).  
- Claims that instantly reveal lie/truth without needing Facts (bad for Standard/Hard, okay for tutorial/Easy if intentional).

---

## 6. With-KOA vs No-KOA A/B Test

To understand how much KOA helps (and whether it trivializes puzzles), run:

- **Condition A (Full KOA):** Player-model agents see all KOA barks.  
- **Condition B (Muted KOA):** Player-model agents get generic “OK” lines, no real hints.

Compare:

- `lie_detection_rate` (how often agents avoid lies).  
- `felt_like_guess_rate` (self-reported).  
- `t1_fact_usage_rate` (Fact usage on T1).

Heuristics:

- If KOA has zero effect (metrics almost identical), barks are too weak or ignored.  
- If KOA makes lie detection trivial (huge jump in detection, very low guess rate), barks are too strong / spoilery.

This A/B test is for designer insight, not per-puzzle gating, but helps tune KOA’s hint power.

---

## 7. Approval Pipeline Summary

For each candidate puzzle:

1. **Deterministic validation**  
   - Run `scripts/prototype-v5.ts` (with JSON output).  
   - If any error-level check fails → reject or fix puzzle.

2. **Agent playtests**  
   - Run player-model agents (persona zoo) under KOA Mini view.  
   - Collect turn-level JSON outputs and aggregate metrics.

3. **Judge evaluation**  
   - Run judge agent on:
     - Puzzle definition,  
     - Player-model transcripts,  
     - KOA barks & verdicts.  
   - Produce rubric JSON and high-level `verdict`.

4. **Dialogue & claim safety**  
   - Run dialogue safety + hint leakage checks on KOA lines.  
   - Run card clarity check on each claim.

5. **Gating rules**  
   - Puzzle ships only if:
     - `prototype-v5.ts` passes.  
     - Judge `verdict` is `accept` (or `tweak` followed by adjustments + re‑evaluation).  
     - Player-model metrics are within configured bands (e.g., T1 not blind, felt_like_guess_rate not extreme).  
     - No KOA lines or card claims are flagged as unsafe or overpowered.

This spec gives you a concrete target for implementing `agent-playtest.ts` v2: you can wire up the LLM calls around `play-v5.ts`, parse outputs into the schemas above, and use them as automated QA gates before a puzzle ever hits real players. 

