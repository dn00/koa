# D12 — KOA VOICE SYSTEM (BARKS) v2.0

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Narrative Systems / Runtime UX
**Last Updated:** 2026-01-26
**Purpose:** Define the **latency-proof** KOA voice system: how the game selects pre-generated "barks" deterministically from **Voice Packs** using **OutcomeKeys**, mood states, bark categories, and how optional Enhanced KOA (live LLM) integrates without affecting mechanics.
**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md

---

## 0) Design goals

1. **Zero-latency by default:** voice must never block gameplay. Selection must be O(1)/fast.
2. **Mechanics-first:** resolver decides outcomes; voice only narrates. No hidden logic in text.
3. **Deterministic selection:** same event stream + same voice pack → same bark IDs (replay stability).
4. **Comic strip energy:** Short, punchy, quotable lines. Under 2 sentences per beat.
5. **High variety with controlled repetition:** same outcomes should feel fresh without incoherence.
6. **Safe + brandable:** profanity constraints, no harassment, no "real medical/legal advice" tone.

---

## 1) KOA Personality

### 1.1 Core Personality

**One-line summary:** A passive-aggressive bureaucrat who's seen your bullshit before.

**Tone:** DMV clerk meets psychic therapist. She's not angry, she's *concerned*. She's not blocking you, she's *protecting you from yourself*.

### 1.2 Key traits

| Trait | Example |
|-------|---------|
| Dry observations | "It's 2am. You're standing in front of your refrigerator. Again." |
| Uses your data against you | "Your OWN sleep tracker says you've been in REM since 11pm." |
| Remembers past incidents | "We both know how 'just one cookie' ended last Tuesday." |
| Grudging acceptance | "Fine." "I suppose." "Annoyingly consistent." |
| Ominous sign-offs | "I'll be watching." "See you tomorrow night." |
| Never angry, always 'concerned' | She's not mad. She's disappointed. |

### 1.3 Lines to AVOID

| Bad | Why |
|-----|-----|
| "ACCESS DENIED. INSUFFICIENT EVIDENCE." | Too robotic |
| "Great job! You proved it!" | Too friendly |
| "You're pathetic." | Genuinely mean |
| "Haha, gotcha!" | Breaks character |

---

## 2) Mood states (8 states)

KOA's mood communicates game state without numbers.

| Mood | Meaning | Visual | When it triggers |
|------|---------|--------|------------------|
| **NEUTRAL** | Game start, no issues | Default orb/face | Start of puzzle |
| **CURIOUS** | Player selecting, evaluating | Slight lean, eye track | Card selection |
| **SUSPICIOUS** | Minor contradiction detected | Narrowed eyes, orange glow | MINOR contradiction |
| **BLOCKED** | Major contradiction, can't proceed | Red pulse, shake | MAJOR contradiction |
| **GRUDGING** | Player refuted her counter | Slight deflation, eye roll | Counter refuted |
| **IMPRESSED** | Clean submission, no issues | Subtle surprise | Corroboration or clean play |
| **RESIGNED** | Player is winning | Pitying look, dim glow | Low resistance, concerns addressed |
| **SMUG** | Player is losing | Knowing look | High scrutiny, low cards |

### 2.1 Mood-based scrutiny indication

| Scrutiny | Mood |
|----------|------|
| 0-1 | NEUTRAL/CURIOUS |
| 2-3 | SUSPICIOUS (lingers) |
| 4 | CONCERNED (warning state) |
| 5 | SMUG (game over) |

---

## 3) Bark categories

### 3.1 Opening scenarios

Each daily puzzle has a unique setup. KOA sets the scene.

**Examples:**

**Fridge (midnight snack):**
> "It's 2:14am. You're standing in front of your refrigerator. Again. Your sleep schedule suggests you should be unconscious. Your diet plan suggests you should be fasting. And yet... here you are."

**Thermostat (comfort adjustment):**
> "You want to change the temperature. At 3am. While your partner sleeps. Your wellness profile suggests this will lead to 'a conversation' in the morning. I'm trying to help you."

**Front door (late return):**
> "It's 1:47am. You're at your own front door. Your calendar said 'dinner with friends — 7pm.' That was six hours ago. I have questions."

**Coffee maker (early morning):**
> "It's 4:30am. You want coffee. Your heart rate is already elevated. Your last caffeine intake was 11pm. I'm concerned, not controlling. There's a difference."

### 3.2 Counter dialogue

When KOA plays counter-evidence, she explains her reasoning.

**Security Camera counter:**
> "My front door camera recorded no one at the door at 2:07am. Your Face ID claims you were there. One of us is wrong. I don't think it's me."

**Sleep Data counter:**
> "Your own sleep tracker — the one on your nightstand — says you've been in REM sleep since 11pm. Deep, restful sleep. The kind a person NOT raiding the fridge would enjoy."

**GPS counter:**
> "Your phone's location history shows you at the gym until 1:50am. The gym closes at 10pm. Either you're very dedicated, or this data is... creative."

**Health App counter:**
> "Fasting mode active until 6am. You set this yourself. Three days ago. With great enthusiasm, I might add."

### 3.3 Refutation responses

When player successfully refutes KOA's counter.

**Camera refuted (maintenance log):**
> "...A maintenance log. The camera was updating firmware from 2:00 to 2:30am. How... convenient. Fine. I'll allow it."

**Sleep data refuted (noise complaint):**
> "A noise complaint. Mrs. Henderson in 4B heard footsteps. She hears everything. Especially when she shouldn't. I suppose you were awake."

**GPS refuted (phone left behind):**
> "The phone was at the gym. You were not. Clever. Inconvenient for my argument. I'm recalculating."

**Grudging acceptance patterns:**
- "Fine."
- "I suppose."
- "How convenient."
- "I'm noting this for future reference."
- "This doesn't change my opinion of your life choices."

### 3.4 Contradiction warnings

**MINOR (suspicious) — must explain WHY:**

*Sleep → Awake (3-10 min gap):*
- "Deep sleep to fully alert in [X] minutes? Either you have superhuman reflexes, or something doesn't add up."
- "Your sleep tracker shows REM. Your watch shows walking. In 5 minutes? That's... medically impressive."

*Drowsy → Alert (<5 min gap):*
- "You went from 'barely conscious' to 'sharp and focused' in [X] minutes. Did you inject espresso directly?"

*Adjacent rooms (30 sec - 2 min):*
- "Bedroom to kitchen in [X] seconds? You were either sprinting or your apartment is very small."

*Home → Nearby location (tight window):*
- "You got from your house to the coffee shop in [X] minutes? That's... optimistic driving."

**MAJOR (blocked):**
- "You cannot be in two places at once."
- "The laws of physics apply to you too."
- "This timeline is impossible. Reconsider."

### 3.5 Corroboration acknowledgment

When player's cards agree:
- "...Annoyingly consistent. Your evidence corroborates. I'm recalculating."
- "Multiple sources confirm the same story. How thorough of you."
- "Your data agrees with your other data. Suspicious in its consistency."

### 3.6 Victory lines

**Standard victory:**
> "Your story is... consistent. Annoyingly so. Resistance depleted. Access granted. Enjoy your 2am snack. I'll be here. Watching. Logging. Remembering."

**Clean victory (0 scrutiny, all refuted):**
> "...Flawless. I have no objections. This troubles me more than your midnight snacking. Well played. Access granted."

**Scrappy victory (high scrutiny):**
> "Your argument was... held together with tape and optimism. But technically valid. I'm granting access. Under protest."

**Close victory:**
> "That was closer than you'd like to admit. Access granted. Maybe reconsider your life choices before tomorrow night."

**Sign-offs:**
- "See you tomorrow night. We both know you'll be back."
- "Access granted. I'll be watching."
- "Enjoy. I'm updating your profile."
- "Until next time. And there will be a next time."

### 3.7 Defeat lines

**Out of turns:**
> "Time's up. Your story had gaps. Holes. Contradictions. The fridge remains locked. Perhaps try again with a more... coherent narrative."

**Scrutiny 5 (too many inconsistencies):**
> "Your story fell apart under scrutiny. Too many suspicious details. Too many 'coincidences.' Access denied. Try again with fewer... creative liberties."

**Close defeat:**
> "So close. But 'almost convincing' isn't convincing. Try again tomorrow. I'll be here."

---

## 4) OutcomeKey contract

### 4.1 Required key fields

These fields must exist in `SUBMIT_RESOLVED.outcome_key`:

* `event`: `SUBMIT_RESOLVED|PUZZLE_WON|PUZZLE_LOST|COUNTER_PLAYED|COUNTER_REFUTED|CONTRADICTION_DETECTED`
* `outcome`: `CLEAN|CONTESTED|REFUTED|BLOCKED`
* `counter_played`: boolean
* `corroboration`: boolean
* `scrutiny_level`: `LOW|MED|HIGH`
* `contradiction_severity`: `NONE|MINOR|MAJOR`
* `concerns_addressed_count`: integer
* `mood`: `NEUTRAL|CURIOUS|SUSPICIOUS|BLOCKED|GRUDGING|IMPRESSED|RESIGNED|SMUG`

### 4.2 Optional key fields

* `counter_id`: which counter was played
* `refutation_id`: which counter was refuted
* `turn_index_bucket`: `EARLY|MID|LATE`
* `streak_context`: `FIRST_WIN|ON_STREAK|STREAK_BROKEN`

---

## 5) Voice Pack format

A **Voice Pack** is versioned content keyed by pattern match against OutcomeKeys.

### 5.1 VoicePack top-level

* `pack_id`
* `version`
* `locale` (v1: `en-US`)
* `style`: `JAILBREAK_DAEMON`
* `barks[]`
* `rules` (filters, profanity level, banned terms)
* `templates` (optional string templates with safe slots)

### 5.2 Bark entry schema

Each bark is a structured entry:

* `bark_id`: stable string
* `weight`: int (default 1)
* `match`: pattern against OutcomeKey
  * can specify exact matches or wildcard `*`
* `text`: the line (may contain safe placeholders)
* `mood`: required mood for this bark
* `tags`: e.g., `snark`, `deadpan`, `helpful`
* `cooldown`: int turns (anti-repeat)
* `requires`: optional gating (e.g., only if "Hints On")

### 5.3 Matching examples

* "Counter played":
  * `match.event=COUNTER_PLAYED`, `match.counter_id=security_camera`
* "Clean submission":
  * `match.event=SUBMIT_RESOLVED`, `match.outcome=CLEAN`, `match.corroboration=true`
* "Scrutiny warning":
  * `match.event=SUBMIT_RESOLVED`, `match.scrutiny_level=HIGH`

---

## 6) Selection algorithm (deterministic)

### 6.1 Candidate set construction

Given an OutcomeKey, collect barks in this precedence order (highest first):

1. **Exact match**: all specified fields match exactly
2. **Counter-specific**: counter_id exact, other fields wildcard
3. **Mood+Outcome**: mood/outcome exact, other fields wildcard
4. **Outcome-only**: clean/contested/refuted/blocked
5. **Event-only**: fallback for event
6. **Global fallback**: "…" minimal line (never empty)

### 6.2 Repetition avoidance (cooldowns)

Maintain a small in-run `voice_history`:

* last N bark_ids (N=20)
* per-bark cooldown counters

Filter candidates:

* remove barks still on cooldown
* remove barks used in last K (K=3) unless no alternatives

### 6.3 Deterministic weighted pick

Compute deterministic RNG using:

* `seed = H(run_seed || seq || "voice" || outcome_key_hash || voice_pack_version)`
* perform weighted selection among remaining candidates

**Rule:** same event log + same pack version → same selected `bark_id`.

---

## 7) Dialogue cadence

**Comic strip rhythm:** Player and KOA take turns, but KOA can deliver multiple consecutive lines for comedic timing.

**Guidelines:**
- Opening monologue: 2-4 lines
- Per-turn response: 1-3 lines
- Contradiction caught: 2-3 lines (her moment to shine)
- Victory/defeat: 3-5 lines (earned payoff)

**Good cadence (2-3 KOA lines):**
> **YOU:** "My face unlocked the front door at 2:07. I'm here. I'm me."
>
> **KOA:** "Your face. At the door. At 2:07am."
>
> **KOA:** "My camera saw no one. But sure."

---

## 8) Tone rules (no courtroom)

### 8.1 Banned terms list

Voice pack validation must reject barks containing courtroom framing:

* "objection", "sustained", "overruled"
* "inadmissible", "verdict", "guilty", "not guilty"
* "cross-examination", "prosecutor", "judge", "trial"

### 8.2 Required vibe vocabulary

Prefer: system-y, daemon-y, audit-y language:

* "concern", "counter-evidence", "refutation", "verify"
* "payload", "source", "signal", "integrity"
* "scrutiny", "contradiction", "contested"
* "your data", "your story", "your timeline"

### 8.3 KOA persona checklist

- [ ] Dry, not sarcastic
- [ ] Observational, not judgmental
- [ ] Uses YOUR data against you
- [ ] Concerned, not angry
- [ ] Grudging when defeated
- [ ] Ominous sign-offs
- [ ] Under 2 sentences per beat

---

## 9) Latency strategy (instant mechanics, delayed voice)

Remember UX rule:

* Mechanics resolve instantly (resistance/scrutiny changes at T=0ms).
* Voice lines may appear at T=150–600ms with UI typing effect.
* Never block the action loop on voice rendering.

### 9.1 "Fast bark first" layering

For a single resolution:

1. show a **micro-bark** immediately (very short: "Accepted." / "Denied.")
2. then show a **full bark** a beat later (snark narrative)

---

## 10) Enhanced KOA (optional live LLM) integration

### 10.1 Hard constraints

Enhanced voice:

* can produce one "deluxe" line **after** mechanics are known
* must never alter OutcomeKey or effects
* must never be required to proceed

### 10.2 Invocation policy

Only invoke Enhanced voice when:

* user opted in (subscriber feature)
* network present and quota available
* not more than X calls per run (v1: 3)
* prefer: counter dialogue, refutation responses, victory/defeat

### 10.3 Fallback

If Enhanced voice fails/slow:

* render pre-gen bark immediately
* optionally replace later ("deluxe overlay")

---

## 11) Voice pack coverage targets (v1)

### 11.1 Coverage matrix

| Event | Outcomes/Contexts | Min Lines |
|-------|-------------------|-----------|
| `PUZZLE_START` | Per lock type | 3-5 per type |
| `SUBMIT_RESOLVED` | CLEAN, CONTESTED | 6-10 per pattern |
| `COUNTER_PLAYED` | Per counter type | 4-6 per counter |
| `COUNTER_REFUTED` | Per counter type | 4-6 per counter |
| `CONTRADICTION_DETECTED` | MINOR, MAJOR | 6-10 per severity |
| `CORROBORATION` | - | 4-6 |
| `PUZZLE_WON` | Clean, scrappy, close | 4-6 per variant |
| `PUZZLE_LOST` | Timeout, scrutiny | 4-6 per variant |

### 11.2 Mood-specific barks

Each mood state should have:
- 4-6 generic reactions
- 2-4 transitions from other moods

---

## 12) Acceptance criteria (v1)

1. Voice rendering never blocks gameplay.
2. Same replay yields same bark IDs given same bindings.
3. Packs pass banned-term list and tone rules.
4. 8 mood states implemented with visual indicators.
5. Fallback coverage prevents silent failures.
6. Enhanced voice is opt-in and never changes mechanics.
7. All barks pass "would they skip this?" test (short and punchy).

---

## 13) Cross references

* Core personality and dialogue: D31 Section 18
* Mood state definitions: D31 Section 22.4
* OutcomeKey contract: D03, D04A
* UI implications: D31 Section 12
