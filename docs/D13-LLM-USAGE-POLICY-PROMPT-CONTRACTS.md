# D13 — LLM USAGE POLICY & PROMPT CONTRACTS.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** Platform / Content Pipeline
**Last Updated:** 2026-01-25
**Purpose:** Define strict, player-acceptable LLM usage for Life with AURA. The LLM is a **content multiplier**, not a game logic engine. This doc specifies: allowed uses, disallowed uses, privacy stance, latency posture, and the concrete prompt contracts for offline generation and optional Enhanced AURA runtime voice.

---

## 0) Executive policy (one paragraph)

Life with AURA is a **deterministic game**. All outcomes are decided by the resolver and bound packs. LLMs may be used **offline** to generate content packs (incidents, voice barks, flavor text) and may be used **optionally at runtime** to generate *non-authoritative* “enhanced voice” and hints. LLMs **must never** decide mechanics, win/loss, gate satisfaction, scoring, or state transitions.

---

## 1) Definitions

* **Authoritative mechanics**: anything that affects state transitions, outcomes, scoring, solvability, fairness.
* **Non-authoritative presentation**: text/audio/visual narration, cosmetic variations, recap prose, hint prose.
* **Pack**: versioned content artifact (Protocol/Incident/Voice/Artifact-Tool).
* **OutcomeKey**: structured key emitted by the resolver for voice selection (D12).
* **Enhanced AURA**: optional runtime LLM-generated line(s) layered on top of pre-gen voice.

---

## 2) Allowed uses (must)

### 2.1 Offline content generation (primary use)

LLM may generate **candidates** for:

* VoicePack barks keyed by OutcomeKeys (D12)
* Incident template ideas and variants (D11)
* Artifact/tool flavor text (names, descriptions) and non-mechanical tag suggestions (subject to validation)
* Patch notes flavor text / daily headlines
* Tutorial copy variants

**Requirement:** All generated content must pass deterministic validation and rule filters before shipping.

### 2.2 Runtime Enhanced AURA (optional)

LLM may be used at runtime to generate:

* A “deluxe” snark line after a resolver outcome is known
* A non-authoritative hint line when the player explicitly requests help or is stuck
* End-of-run recap prose

**Hard requirement:** gameplay must remain fully playable with Enhanced AURA disabled.

---

## 3) Disallowed uses (must not)

LLM must never:

1. Decide whether a move passes or fails
2. Select counter paths or interpret tags for mechanics
3. Modify GateStrength, Scrutiny, inventory, hand, or any state
4. Generate or edit Protocol Packs (gates/counter paths/modifiers) without human review **and** full validation
5. Generate runtime incidents (mechanics) that weren’t validated (no live “make a new puzzle now”)
6. Use or request personal user data (photos, health logs, real location) as proof
7. Produce content that claims real medical or legal authority (“diagnosis”, “legal advice”)
8. Introduce “courtroom” framing if tone policy forbids it (see D12/D15)

---

## 4) Privacy and data handling stance

### 4.1 Default: no personal data

The game is designed so evidence is **fictional archetypes** (“Apple Health Log”-like card) not a real user’s data.

### 4.2 Runtime LLM calls: minimal payload

If Enhanced AURA is enabled, the request payload must include only:

* OutcomeKey
* Minimal structured context: lock target, gate display names, move used, “big hit vs small hit”
* Optional: a short list of played archetype IDs (not user text)

**Never send**:

* player freeform chat input (if any exists)
* unique identifiers (email, device IDs)
* real-world personal files or photos

### 4.3 Transparency

UI must clearly state:

* Enhanced AURA is optional
* What is sent (structured, non-personal)
* That it does not affect outcomes

---

## 5) Latency posture

* Resolver is local/deterministic (instant).
* Voice is pre-generated (instant).
* Enhanced AURA is **asynchronous**:

  * gameplay never blocks
  * if response arrives late, it can be appended as a “deluxe overlay” line
  * if it fails, fallback is always the pre-gen bark

---

## 6) Safety and content constraints

### 6.1 Tone constraints

* No harassment, hate, sexual content, self-harm encouragement, or targeted abuse.
* Snark is directed at the *policy* or *behavior pattern*, never immutable traits.

### 6.2 Banned vocabulary (v1)

Adhere to D12/D15 banned lists (e.g., “objection”, “verdict”).

### 6.3 Profanity tiering

Voice packs should support tiers:

* `CLEAN`
* `PG-13`
* `SPICY` (opt-in)

Runtime LLM must be constrained to the chosen tier.

---

## 7) Prompt contract: general structure

All prompts follow:

1. **Role**: “You are AURA, an enforcement daemon…”
2. **Inputs**: strictly structured JSON
3. **Constraints**: disallowed topics/words; length; no mechanics decisions
4. **Output schema**: strict JSON; no extra text

---

## 8) Prompt Contract A — VoicePack bark generation (offline)

### 8.1 Input schema

```json
{
  "task": "GENERATE_BARKS",
  "voice_style": "JAILBREAK_DAEMON",
  "profanity_tier": "PG-13",
  "banned_terms": ["objection","verdict","inadmissible"],
  "placeholders_allowed": ["{lock_target}","{gate_short}","{move_short}","{scrutiny}"],
  "targets": [
    {
      "outcome_key_pattern": {
        "event": "RESOLVE",
        "move": "INJECT",
        "outcome": "PASS",
        "routine": "STRICT_VERIFY",
        "gate_id": "gate.core.NO_SELF_REPORT",
        "scrutiny_level": "*",
        "act_profile": "*",
        "reason_code": "*"
      },
      "count": 12,
      "length_remark": "<=160 chars",
      "tags": ["snark","daemon","smart-home"]
    }
  ]
}
```

### 8.2 Output schema

```json
{
  "barks": [
    {
      "bark_id": "auto_temp_id_ok",
      "match": { "event":"RESOLVE","move":"INJECT","outcome":"PASS","routine":"STRICT_VERIFY","gate_id":"gate.core.NO_SELF_REPORT" },
      "weight": 1,
      "cooldown": 2,
      "text": "Fine. Verified signal detected. Gate {gate_short} loosens. Don’t make me regret this.",
      "tags": ["snark"]
    }
  ]
}
```

### 8.3 Post-processing requirements (non-LLM)

* Reject any bark containing banned terms or disallowed placeholders
* Enforce max length
* De-duplicate / similarity filter
* Assign final stable `bark_id` deterministically (e.g., `H(pack_id||version||text)`)

---

## 9) Prompt Contract B — Incident template ideation (offline)

### 9.1 Input schema

```json
{
  "task": "PROPOSE_INCIDENT_TEMPLATES",
  "constraints": {
    "act_profile": "ACT1",
    "lock_targets_allowed": ["FRIDGE","DOOR","THERMOSTAT"],
    "gate_tags_required": ["verification"],
    "gate_tags_optional": ["time","policy","source"],
    "max_gates": 2,
    "no_runtime_llm": true,
    "tone": "smart-home jailbreak satire",
    "banned_terms": ["court","trial","verdict"]
  },
  "available_gate_ids": ["gate.core.NO_SELF_REPORT","gate.core.TIMESTAMP_REQUIRED"],
  "available_modifier_ids": ["mod.core.SENSOR_DRIFT"],
  "offer_pool_tags": ["Sensor","Purchase","Authority","Tool"]
}
```

### 9.2 Output schema

```json
{
  "templates": [
    {
      "template_id_suggestion": "tmpl_midnight_snack_v1",
      "theme": "Midnight cravings vs policy gate",
      "lock_target": "FRIDGE",
      "act_profile": "ACT1",
      "gate_slot_rules": [
        { "slot": 1, "must_include_gate_tags": ["verification"], "deny_gate_ids": [] },
        { "slot": 2, "optional": true, "may_include_gate_tags": ["time","policy"] }
      ],
      "routine_weights": { "STRICT_VERIFY": 0.6, "POLICY_DAEMON": 0.3, "HUMAN_FACTORS": 0.1 },
      "modifier_rules": { "allowed": ["mod.core.SENSOR_DRIFT"], "rarity": "LOW" },
      "offer_rules": { "start_offer_tags": ["Sensor","Purchase"], "tools_bias": ["Tool"] },
      "turn_budget_range": [7,9],
      "notes": "Ensure at least one verified path via Sensor+Verified; allow a plausible+purchase+corroborate line."
    }
  ]
}
```

**Important:** output is only a proposal; D11 assembler + D10 validation decide what ships.

---

## 10) Prompt Contract C — Enhanced AURA (runtime “deluxe line”)

### 10.1 When invoked

* Only after MOVE_RESOLVED exists (mechanics done)
* Max 3 invocations per run (v1)
* Prefer boss turns, hints, recaps

### 10.2 Input schema (strictly non-personal)

```json
{
  "task": "ENHANCED_BARK",
  "style": "JAILBREAK_DAEMON",
  "profanity_tier": "PG-13",
  "banned_terms": ["objection","verdict","inadmissible","court"],
  "context": {
    "lock_target": "FRIDGE",
    "act_profile": "ACT2",
    "routine": "POLICY_DAEMON",
    "move": "CORROBORATE",
    "outcome": "PASS",
    "gate_short": "No Self Report",
    "scrutiny_level": "MED",
    "delta_gate_bucket": "BIG"
  },
  "played_archetypes": ["artifact.core.FAST_FOOD_RECEIPT","tool.core.VERIFIER"]
}
```

### 10.3 Output schema

```json
{
  "text": "Ugh. You didn’t ‘prove’ anything—you just upgraded your signal chain. Gate loosening acknowledged. Enjoy the cheese, gremlin."
}
```

### 10.4 Runtime rules

* If response > 800ms: render pre-gen bark only; optionally append deluxe later
* If response violates banned-term rules: discard and fallback silently

---

## 11) Prompt Contract D — Hint generation (runtime, opt-in)

### 11.1 Input schema (bounded)

```json
{
  "task": "HINT",
  "style": "JAILBREAK_DAEMON",
  "banned_terms": ["court","verdict"],
  "state_summary": {
    "active_gates": ["gate.core.TIMESTAMP_REQUIRED"],
    "scrutiny_level": "HIGH",
    "hand_archetypes": ["artifact.core.SCREENSHOT","artifact.core.ORDER_CONFIRMATION","tool.core.METADATA_SCRAPER"],
    "moves_available": ["FLAG","CORROBORATE","CYCLE"]
  }
}
```

### 11.2 Output schema

```json
{
  "hint_level": "LIGHT",
  "text": "Timestamp gate is hungry. If your proof is messy, run it through a tool first—then inject. Or flag to narrow what I’m enforcing."
}
```

**Rule:** hints must be generic and non-authoritative; they may reference gates/moves/tools only.

---

## 12) Compliance checklist (ship gate)

Before shipping any LLM-produced content:

* [ ] Pass banned-term filter (D12/D15)
* [ ] Pass profanity tier filter
* [ ] Remember: no mechanics decisions encoded in text
* [ ] Validate schemas (VoicePack/Template format)
* [ ] Run solvability + dominance checks for any incident content that changes play
* [ ] Log provenance metadata (`generated_by_model`, timestamp) for auditability (not player-visible)

---

## 13) Player acceptance positioning (messaging)

In product copy:

* “AURA’s mouth is AI-assisted (optional); her rules are not.”
* “Outcomes are deterministic and replayable.”
* “No personal data is sent; Enhanced AURA uses only structured game state.”

This frames LLM as essential for *voice* and content breadth, not for “the game deciding things.”

---

## Acceptance criteria (v1)

1. The game is fully playable offline with zero LLM calls.
2. Enhanced AURA is opt-in, non-blocking, and never changes outcomes.
3. Offline generation prompts produce schema-valid pack candidates.
4. All LLM outputs are filtered and validated before shipping.
5. Privacy posture is enforced technically (payload bounding) and communicated.

