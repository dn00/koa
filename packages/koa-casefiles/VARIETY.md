# KOA Casefiles - Variety & Anti-Staleness System

**Status:** Design doc (not yet implemented)

**Related:** See `HANDOFF.md` Priority 4-5 for existing shape/blueprint work.

---

## The Problem

Once players learn the difficulty ladder, they converge to a solved routine:
1. Localize window (scan logs)
2. Find keystone contradiction
3. Fill remaining axes
4. Accuse

The optimal opener becomes identical across runs. The game becomes Sudoku.

---

## Design Principles

1. **Difficulty = rates, not guarantees.** Players shouldn't infer case shape from difficulty.
2. **Vary the question, not just the answers.** Different shapes require different openers.
3. **One twist max.** Keeps cases fair and legible.
4. **Fairness contract.** Every case has at least one clean solve path.

---

## The Four Variety Axes

### 1. Case Shape (what question are you answering?)

> **Overlaps with:** HANDOFF Priority 4 (Shape Detection) and Priority 5 (Reasoning Variety)

| Shape | Win Condition | Optimal Opener | KOA Tell |
|-------|---------------|----------------|----------|
| `classic` | Find who/when/where/how/why | Gossip → Search → Logs | "Someone wanted {item}. Practically tradition." |
| `frame_job` | Identify planted evidence | Search anomalies, check "too clean" | "This evidence is too clean." |
| `false_alarm` | Prove no crime / KOA wrong | Verify item location, check assumptions | "Unless I'm missing something..." |
| `two_step` | Find setup phase before crime | Check earlier windows | "Start earlier. First domino is never loudest." |
| `reverse` | We know who, find how/where | Interview culprit, search their path | "We know who. Now prove it." |
| `constraint` | Physics/logic eliminates suspects | Map distances, check timing | "This will be solved by math, not vibes." |
| `collusion` | Two people worked together | Find coordination evidence | "One person couldn't do this. Two could." |
| `inside_job` | Victim staged it | Follow motive to reporter | "Who benefits from the chaos?" |

**Implementation:** Map from blueprint type + evidence patterns. See HANDOFF for existing blueprint→shape mapping.

### 2. Liar Model (how do suspects behave?)

| Model | Behavior | COMPARE Signal | Confidence |
|-------|----------|----------------|------------|
| `confident_lie` | False statement, high confidence | Direct contradiction | 0.7-0.9 |
| `omission` | Vague, avoids specifics | No claim to contradict | 0.3-0.4 |
| `misremember` | Wrong but uncertain | Contradiction + low confidence | 0.2-0.4 |
| `misleading_truth` | True statement that points wrong | No contradiction, but suspicious | 0.6-0.8 |

**Rule:** Culprit has ONE liar model per case. Innocents default to truthful.

### 3. Coverage Profile (what evidence exists?)

| Profile | Door Logs | Motion | Testimony | Physical |
|---------|-----------|--------|-----------|----------|
| `full` | All windows | All rooms | Everyone talks | Crime scene + hidden |
| `partial` | 1 gap (non-crime window) | Most rooms | 1 reluctant witness | Crime scene only |
| `sparse` | 2 gaps | Key rooms only | Multiple reluctant | Requires search |

**Rule:** Crime window logs are NEVER offline. Always solvable.

### 4. Twist Slot (one modifier per case)

| Twist | Effect | Counterplay |
|-------|--------|-------------|
| `device_gap` | One device offline in specific window | Use testimony to fill gap |
| `false_positive` | Motion sensor triggered by pet/wind | Check for non-human causes |
| `reluctant_witness` | Won't talk until you ask gossip first | Gossip unlocks testimony |
| `item_handoff` | Item moved twice (A→B→C) | Find intermediate location |
| `time_confusion` | Witness off by one window | Cross-reference with logs |
| `locked_room` | Door log shows no entry | Check alternate entry (window?) |

**Rule:** Maximum ONE twist per case. Twist is always hinted.

---

## Difficulty as Distribution

Don't make difficulty a recipe. Make it a probability distribution.

### Easy
```
shape:    70% classic, 20% reverse, 10% constraint
liar:     80% confident_lie, 20% omission
coverage: 90% full, 10% partial
twist:    80% none, 20% device_gap
```

### Medium
```
shape:    40% classic, 25% two_step, 20% frame_job, 15% constraint
liar:     50% confident_lie, 30% omission, 20% misremember
coverage: 30% full, 60% partial, 10% sparse
twist:    50% none, 30% device_gap, 20% reluctant_witness
```

### Hard
```
shape:    20% classic, 25% frame_job, 20% two_step, 15% collusion, 10% inside_job, 10% false_alarm
liar:     30% confident_lie, 30% omission, 25% misremember, 15% misleading_truth
coverage: 10% full, 40% partial, 50% sparse
twist:    30% none, 70% any
```

---

## Anti-Predictability Policy

### Rotation Rules
- In any 7 consecutive cases: ≥4 distinct shapes
- No shape repeats more than 2x in a row
- At least one non-classic shape per 5 cases

### Opener Variance
If experienced players' first 3 actions become identical in most runs → add shape variety.

Different shapes should have different optimal openers:
- `classic`: Gossip → Search crime scene
- `frame_job`: Search → Compare evidence quality
- `two_step`: Logs → Check earlier windows
- `constraint`: Whereabouts → Map distances

---

## Weekly Themes (Content Scaling)

Cheap variety through rule modifiers, not new art.

| Theme | Modifier |
|-------|----------|
| Pet Week | Cat triggers motion sensors, muddy paw prints |
| Delivery Week | Porch/door events dominate, package evidence |
| Party Night | Crowded windows, more witnesses, more misremembers |
| Renovation | Tools as evidence, noise covers sounds |
| Power Outage | Device gaps in specific window, flashlight needed |
| Guest Weekend | Extra NPC, alibi complexity |

---

## Implementation Roadmap

### Phase 1: Shape System (Priority 4 in HANDOFF)
- [ ] Add `shape` to CaseConfig
- [ ] Map existing blueprints → shapes
- [ ] Wire shape → bark system (KOA tells)
- [ ] Validate with solver

### Phase 2: Liar Models
- [ ] Add `liarModel` to CaseConfig
- [ ] Update `deriveCulpritAlibiClaim()` to use model
- [ ] Add confidence variance per model
- [ ] Test solver handles all models

### Phase 3: Probabilistic Difficulty
- [ ] Replace fixed rules with weighted random
- [ ] Add rotation tracking (no repeats)
- [ ] Validate distribution over 100+ cases

### Phase 4: Twist Slots
- [ ] Add `twist` slot to case generation
- [ ] Implement each twist type
- [ ] Ensure hints exist for each twist
- [ ] Validate fairness

### Phase 5: Themes (Optional)
- [ ] Theme modifier system
- [ ] 3-4 starter themes
- [ ] Weekly rotation logic

---

## Validation Checklist

Before shipping any phase:
- [ ] Solver achieves ≥95% on all difficulties
- [ ] No shape has <80% solve rate
- [ ] Opener variance: first 3 actions differ in ≥40% of cases
- [ ] Playtest: 5 cases feel distinct

---

## Open Questions

1. Should shape be visible to player? (Probably not - let them discover)
2. How does KOA's tell timing work? (After first evidence? After gossip?)
3. Do themes affect difficulty calculation?
4. Should collusion require 2 accusations?
