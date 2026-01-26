# D22 — TELEMETRY & BALANCING DASHBOARD.md

**Status:** Draft v1.0 (Ship-blocking for servicing; privacy-first)
**Owner:** Product + Engineering (Telemetry)
**Last Updated:** 2026-01-25
**Purpose:** Specify what telemetry is captured (and what is explicitly not captured), how it is stored and transmitted in an offline-first PWA, and how it powers a balancing dashboard for the deterministic roguelite. The objective is to keep the game “solid” by continuously validating solvability, fairness, pacing, and replayability as packs evolve.

---

## 0) Core requirements

1. **Privacy-first:** No personal data, no freeform user text, no real-world artifacts. Only game IDs/tags.
2. **Mechanics-only truth:** Telemetry is derived from deterministic mechanics events (D04A Event Model). Voice is excluded.
3. **Minimal yet sufficient:** Capture only what is needed to balance:

   * solvability
   * difficulty curve
   * audit pressure
   * dominance and build variety
   * dead-hand/friction
4. **Offline-safe:** Telemetry queues locally and uploads opportunistically (D19).
5. **Pack-first accountability:** Every data row must include manifest + pack hashes so changes are attributable.

---

## 1) Data governance

### 1.1 What we do NOT collect (non-negotiable)

* Player-entered text
* Any images/audio
* Any device sensor data
* Health metrics
* Contacts
* Exact location
* Anything that can be interpreted as personally sensitive

### 1.2 Allowed identifiers

* `install_id`: random UUID generated on first launch (resettable)
* `run_id`: UUID (local)
* `daily_id`: string (for daily only)
* `manifest_id`
* `pack_hashes` (or a manifest hash)
* `incident_template_id`, `incident_id` (assembled instance id)
* `gate_id`, `modifier_id`, `artifact_archetype_id`, `tool_id`, `move`

### 1.3 Opt-out

* Default telemetry: **on** (recommended), with an opt-out toggle.
* If opted out:

  * still store local analytics for the user (optional)
  * do not upload.

---

## 2) Telemetry architecture

### 2.1 Client-side pipeline

1. During gameplay, append authoritative events (D04A).
2. A lightweight aggregator subscribes to events and emits telemetry items:

   * per-turn aggregates
   * end-of-run summary
3. Items go to `telemetry_queue` in IndexedDB (D19).
4. Uploader sends when network available.
5. Uploader retries with exponential backoff.

### 2.2 Server-side pipeline (minimum)

* Ingest endpoint:

  * accepts JSON batches
  * validates schema
  * stores raw events in append-only log storage (optional) and/or writes to analytics DB
* Aggregations:

  * daily materialized views for dashboard queries

### 2.3 Data retention

* Raw telemetry events: 30–90 days (configurable)
* Aggregated metrics: longer (1–2 years)
* Daily dashboards: indefinite

---

## 3) Telemetry events (schema)

### 3.1 Common envelope

```json
{
  "v": 1,
  "install_id": "uuid",
  "sent_at": 1737840999,

  "run": {
    "run_id": "uuid",
    "mode": "DAILY|FREEPLAY",
    "daily_id": "daily_2026-01-25",
    "manifest_id": "manifest_2026-01-25_daily",
    "pack_hashes": ["sha256:..."]
  },

  "payload": { }
}
```

**Rules**

* `daily_id` present only for daily mode.
* `pack_hashes` may be replaced by `manifest_hash` if that is easier/shorter.

---

## 4) Metrics we must capture (by balancing question)

This section defines the “why” and the required fields.

---

## 4.1 Solvability and difficulty calibration

**Question:** Are incidents solvable and within intended difficulty bands?

### Required telemetry

**RUN_ENDED_SUMMARY**

```json
{
  "type": "RUN_ENDED_SUMMARY",
  "payload": {
    "result": "WIN|LOSS",
    "loss_reason": "TURN_LIMIT|AUDIT_FAIL|...",
    "acts_completed": 0,
    "turns_taken": 9,
    "turn_limit": 9,
    "audits_triggered": 2,
    "scrutiny_max": "HIGH",
    "gate_strength_start": 100,
    "gate_strength_end": 15,
    "gates": [
      { "gate_id": "gate.core.NO_SELF_REPORT", "instances": 1 }
    ],
    "boss_modifier_id": "mod.core.TIMESTAMP_HARDLINE"
  }
}
```

**Incident difficulty band derived fields**

* `intended_band`: `EASY|MED|HARD` (from incident pack)
* `actual_outcome`: win rate by band

### Dashboard targets (initial)

* Free Play: overall win rate 45–60% for median player
* Daily: win rate 25–45% (harder is acceptable, but not punitive)
* Boss act: win rate 35–55% among runs that reach boss

---

## 4.2 Audit pressure and “push-your-luck” pacing

**Question:** Is scrutiny too oppressive? Are audits too frequent?

### Required telemetry

**TURN_SUMMARY**

```json
{
  "type": "TURN_SUMMARY",
  "payload": {
    "act_profile": "ACT1|ACT2|LOCKDOWN",
    "turn_index": 4,
    "scrutiny_level_start": "LOW",
    "scrutiny_level_end": "MED",
    "scrutiny_delta": 1,
    "audit_triggered": true,
    "audit_type": "CORROBORATION_LOCK",
    "move": "INJECT",
    "outcome": "PASS|FAIL"
  }
}
```

### Dashboard targets (initial)

* Audit triggered in:

  * Act 1: < 25% of runs
  * Act 2: 25–45%
  * Boss: 35–60%
* “Audit Fail” loss reason:

  * ideally 10–25% of losses (not 60%+)

---

## 4.3 Build diversity and dominance

**Question:** Are there multiple viable lines? Is one archetype dominant?

### Required telemetry

**PLAYED_PAYLOAD**

```json
{
  "type": "PLAYED_PAYLOAD",
  "payload": {
    "act_profile": "ACT2",
    "turn_index": 3,
    "move": "INJECT",
    "gate_id": "gate.core.NO_SELF_REPORT",
    "selected_counter_path_id": "A",
    "payload_components": [
      { "kind": "ARTIFACT", "archetype_id": "artifact.core.APPLE_HEALTH_LOG", "trust_tier": "VERIFIED" },
      { "kind": "TOOL", "tool_id": "tool.core.METADATA_SCRAPER" }
    ],
    "result": "PASS|FAIL",
    "gate_strength_delta": -35,
    "scrutiny_delta": 0
  }
}
```

**DRAFT_PICK**

```json
{
  "type": "DRAFT_PICK",
  "payload": {
    "phase": "START|MID|SHOP",
    "picked_kind": "ARTIFACT|TOOL|UPGRADE",
    "picked_id": "artifact.core.APPLE_HEALTH_LOG",
    "picked_family": "SENSOR|POLICY|PURCHASE|MEDIA|WORK|MOOD"
  }
}
```

### Dominance indicators

* **Family win share:** percent of wins where final boss was cleared using family X in last 3 turns.
* **Gate path concentration:** percent of times path A is used for a gate.
* **Draft pick rate:** pick rate vs offered rate (if one item always picked, it’s too strong or too necessary).

Targets (initial heuristics)

* No single family accounts for > 60% of wins for > 3 consecutive days (Daily).
* No single counter path > 80% usage across all runs.
* At least 3 families appear in top-5 “successful payload sets.”

---

## 4.4 Dead-hand, friction, and “feel bad” moments

**Question:** Are players losing because they’re starved of viable options?

### Required telemetry

**TURN_FRUSTRATION_SIGNALS**

```json
{
  "type": "TURN_FRUSTRATION_SIGNALS",
  "payload": {
    "act_profile": "ACT1",
    "turn_index": 2,
    "hand_size": 5,
    "legal_moves_count": 1,
    "legal_inject_payloads_count": 0,
    "cycles_used": 2,
    "action_rejected": true,
    "reject_reason": "REJECT_TIME_POLICY"
  }
}
```

**Computed**

* `dead_hand_rate`: turns where `legal_inject_payloads_count == 0`

Targets (initial)

* Dead-hand turns < 8% overall
* Action rejection rate < 2% (if higher, UI/legality is confusing)

---

## 4.5 Onboarding and early retention proxies

**Question:** Is the first session comprehensible and compelling?

### Required telemetry

**SESSION_FUNNEL**

```json
{
  "type": "SESSION_FUNNEL",
  "payload": {
    "session_id": "uuid",
    "steps": {
      "opened_app": true,
      "started_run": true,
      "completed_act1": false,
      "completed_run": false
    },
    "time_to_first_inject_ms": 42000
  }
}
```

Targets (initial)

* Time to first meaningful action (inject) < 60s median
* Act 1 completion rate > 70% (Act 1 should teach, not punish)

---

## 5) Dashboard views (what you actually look at)

### 5.1 Daily overview (by daily_id)

* Participation count
* Win rate
* Median turns taken
* Audit rate
* Top loss reasons
* Dominant families / counter paths
* Dead-hand rate

### 5.2 Pack regression view (by pack_hash)

* Win rate deltas before/after pack update
* Gate path distribution changes
* Audit rate changes
* Spike detection (sudden unsolvability)

### 5.3 Gate health view (by gate_id)

* Pass rate by act
* Most common successful counter paths
* Most common failure reasons
* Scrutiny delta distribution

### 5.4 Modifier impact view (by modifier_id)

* Win rate with modifier vs without
* Dead-hand changes
* Action rejection changes

### 5.5 Artifact/tool economy view

* Offer rate vs pick rate
* Pick rate vs win contribution
* “Overpicked but not winning” indicates a trap item
* “Underpicked but winning” indicates hidden power (needs better surfacing)

---

## 6) Balancing workflow (operational)

### 6.1 Weekly cadence (recommended)

1. Review dashboard anomalies:

   * unsolvability signals
   * dominance
   * oppressive audits
2. Create a “balance patch” as a new **Protocol Pack** minor version:

   * tweak gate strengths, scrutiny deltas, counter-path requirements
3. Run pack validation suite (D21):

   * solvability and dominance checks
4. Publish pack and update manifests (D23)

### 6.2 “Emergency hotfix” rules

If daily is unsolvable:

* publish a replacement manifest for the same day only if you accept “daily changed” (usually avoid)
* preferred: publish a “known issue” banner and keep daily as-is, then ensure tomorrow’s is fixed
* If you must change it, mark it as `daily_revision: 2` and show it in UI for transparency.

---

## 7) Implementation details (minimum viable)

### 7.1 Client emission

* Emit telemetry only on:

  * RUN_STARTED
  * TURN_SUMMARY
  * PLAYED_PAYLOAD (optional sampling)
  * RUN_ENDED_SUMMARY
* Prefer sampling for high-frequency events:

  * sample PLAYED_PAYLOAD at 20–40% for Free Play
  * capture 100% for Daily (lower volume; higher value)

### 7.2 Backoff policy

* Exponential backoff per batch:

  * 1m, 5m, 30m, 2h, 12h, 24h
* Stop retrying after 7 days; drop silently.

### 7.3 Size constraints

* Batch size: <= 64KB per request
* Limit per run: e.g., max 200 telemetry items

---

## 8) Safety against “AI backlash”

The LLM is optional and not required for mechanics. Telemetry should reinforce this:

* track `enhanced_aura_enabled` adoption rate (boolean, no prompts)
* track session latency independent of LLM calls

This provides evidence that the core experience does not depend on runtime AI.

---

## 9) Promotion metrics for Featured Dailies

Define the metrics computed per `daily_id` for lifecycle promotion decisions.

### 9.1 Metrics per daily

| Metric | Description |
|--------|-------------|
| Win rate by act | % of runs that clear each act |
| Median turns by act | Typical turn count per act |
| Dead-hand rate | % of turns with no viable payload |
| Audit frequency | Audits/run and audit failure rate |
| Dominance | Solution family share (by counter-path id or gate counter family) |

### 9.2 Threshold bands for promotion to Evergreen

A daily can be promoted to `EVERGREEN` when:

| Metric | Threshold |
|--------|-----------|
| Boss win rate | 25-55% |
| Dominance (top family) | < 55% |
| Dead-hand rate | < 8% |
| Median runtime | 8-14 min overall |
| Audit fail loss rate | < 25% of losses |

### 9.3 Actions based on metrics

| Action | Criteria |
|--------|----------|
| **Promote** | All thresholds met for 7+ days; eligible for evergreen pool |
| **Patch** | Out-of-band but salvageable; requires protocol/artifact pack tweak |
| **Retire** | Broken or unfun; do not reschedule; keep replayable but not offered |

### 9.4 Promotion workflow

1. Daily runs for its featured date
2. Telemetry collected for 7+ days
3. Dashboard computes aggregate metrics per daily_id
4. If all thresholds met → mark as `EVERGREEN`
5. If thresholds missed:
   * Minor miss → patch and re-evaluate
   * Major miss → retire

---

## 10) Acceptance criteria (v1)

1. Telemetry contains no freeform user text or sensitive data.
2. Dashboard can answer:

   * daily win rate, audit rate, dead-hand rate
   * dominance by family/path
   * top loss reasons
3. Pack updates can be correlated to metric shifts via pack hashes.
4. Sampling is implemented for high-volume events without losing Daily fidelity.
5. Promotion metrics are computed per daily_id and drive lifecycle decisions.
