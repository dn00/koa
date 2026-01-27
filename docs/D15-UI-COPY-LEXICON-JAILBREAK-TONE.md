# D15 — UI COPY & LEXICON (JAILBREAK TONE).md

**Status:** Draft v2.0 (Ship-blocking)
**Owner:** Product / Narrative Systems
**Last Updated:** 2026-01-26
**Purpose:** Define the canonical vocabulary, UI copy patterns, and prohibited language for Home Smart Home. This doc ensures the game reads as **smart-home jailbreak / proving the AI wrong** (not courtroom), stays consistent across UX, voice barks, and tooltips, and remains implementable via pack-serviced strings.

**Mode:** Option B — Daily uses simplified player-facing terminology; Freeplay uses internal/technical terms.

**Canonical Reference:** D31-ADVERSARIAL-TESTIMONY-DESIGN.md is the source of truth for core mechanics terminology.

---

## 0) Why this doc is ship-blocking

Tone drift is a real product risk. If the UI uses legal/court words, players will map it to Ace Attorney even if mechanics differ. This doc establishes a **binding lexicon** and a **lintable banned-term list** to enforce the jailbreak fantasy in code and in content packs.

---

## 1) Tone pillars (what the player should feel)

1. **You are outsmarting a system, not roleplaying a trial.**
2. **KOA is an adversarial AI, not a human prosecutor/judge.**
3. **You win by building testimony that withstands cross-examination.**
4. **You can always explain outcomes deterministically ("WHY?"), so it feels fair.**
5. **Snark targets "policy / metrics / system behavior," not the player personally.**

---

## 2) Option B terminology split (Daily vs Freeplay)

Daily mode uses simplified player-friendly terms. Freeplay uses internal/technical terms.

| Internal term | Daily (player) | Freeplay (player) | Notes |
|---------------|----------------|-------------------|-------|
| `resistance` | **Resistance** | **Gate Strength** | Daily = KOA's stubbornness; Freeplay = HP-like |
| `concern` | **"Prove you're..."** | **Gate** / **Policy Gate** | Daily = what KOA asks; Freeplay = constraint |
| `counter_evidence` | **KOA's Challenge** | **Counter-Evidence** | Daily = KOA's objection; Freeplay = targeting counter |
| `refutation` | **Explanation** | **Refutation** | Daily = nullify KOA's challenge; Freeplay = counter-play |
| `corroboration` | **Stories Align** | **Corroboration** | Daily = cards agree (+25%); Freeplay = claim match bonus |
| `contested` | **Disputed** | **Contested** | Daily = KOA challenges this (-50%); Freeplay = penalty state |
| `committed_story` | **Your Story** | **Committed Story** | Daily = submitted evidence; Freeplay = testimony timeline |
| `artifact` | **Evidence** | **Artifact** | Daily = proof items; Freeplay = cards |
| `damage` | **Progress** | **Damage** | Daily = resistance reduced; Freeplay = strength reduction |
| `scrutiny` | **Scrutiny** | **Scrutiny** | Both modes. 0-5 scale. 5 = loss. |

**Removed from Daily mode (Freeplay-only):**
- `cycle` → "Scan" (no reserve/scan mechanic in Daily per D31)
- `draft` → "Draft" (players are dealt 6 cards, no selection)

---

## 2.1) Canonical vocabulary map (mechanics → language)

| Mechanics concept | Canonical UI term                | Notes                                                           |
| ----------------- | -------------------------------- | --------------------------------------------------------------- |
| Run               | **Run** / **Daily**              | Daily mode = "Daily"; Freeplay = "Run"                          |
| Incident          | **Lock Event** / **Lock**        | Avoid "case," "trial," "hearing."                               |
| Boss              | **Lockdown** / **Hard Lock**     | Freeplay only. "Boss" fine in meta contexts.                    |
| Resistance        | **Resistance** (Daily) / **Gate Strength** (Freeplay) | KOA's stubbornness. Damage reduces it.   |
| Concern           | **"Prove you're..."** (Daily) / **Policy Gate** (Freeplay) | What KOA needs you to prove.       |
| Counter-Evidence  | **KOA's Challenge** (Daily) / **Counter** (Freeplay) | KOA's objections to your evidence.     |
| Refutation        | **Explanation** (Daily) / **Refutation** (Freeplay) | Cards that nullify KOA's challenges.    |
| Corroboration     | **Stories Align** (Daily) / **Corroboration** (Freeplay) | +25% damage when cards share claims. |
| Contested         | **Disputed** (Daily) / **Contested** (Freeplay) | 50% damage penalty when counter applies.   |
| Committed Story   | **Your Story** (Daily) / **Committed Story** (Freeplay) | Submitted evidence timeline.        |
| Resolver output   | **Result** / **Resolution**      | Avoid "ruling," "judgment."                                     |
| Scrutiny          | **Scrutiny**                     | Consistent across modes. 0-5 scale. 5 = loss.                   |
| Turn              | **Turn**                         | UI: "Turns left"                                                |
| Card              | **Evidence** (Daily) / **Artifact** (Freeplay) | "Card" acceptable in meta text.                 |
| Tool              | **Tool**                         | Freeplay only. Keep literal.                                    |
| Move              | **Action**                       | Daily: SUBMIT only. Freeplay: 6 moves.                          |
| Inventory/Deck    | **Evidence** (Daily) / **Kit** (Freeplay) | Daily = 6 dealt cards (no draft).               |
| Shop              | **Cache** / **Black Cache**      | Freeplay only. Avoid "store."                                   |
| Meta progression  | **Unlocks** / **Codex**          | No "XP grind" vibe.                                             |
| Daily mode        | **Daily**                        | "5-minute puzzle." Not "daily featured seed."                   |
| Loss              | **Access Denied**                | Avoid "guilty." Triggered by turns=0 OR scrutiny=5.             |
| Win               | **Access Granted**               | Avoid "not guilty." Requires resistance≤0 AND all concerns met. |
| Contradiction     | **Impossible** (MAJOR) / **Suspicious** (MINOR) | MAJOR blocks submission; MINOR costs +1 scrutiny. |

**Removed from Daily mode (D31 changes):**
- Draft → removed (players are dealt 6 cards)
- Reserve → removed (no backup pool)
- SCAN → removed (no cycle mechanic)
- Audit → removed (scrutiny 5 = instant loss, no audit trigger)

---

## 3) Core UI labels (exact strings, v1)

### 3.1 Home / Modes

* Primary CTA: **Play Daily**
* Secondary CTA: **Practice** (tutorial/sandbox)
* Freeplay CTA (post-MVP): **Free Play Run**
* Streak label: **Daily Streak**
* Daily description: **5-minute puzzle. Same seed for everyone.**
* Offline status: **Offline Ready**

### 3.2 Daily HUD

* Header: **{LOCK_TARGET}**
* Progress: **Resistance bar** (Minimal mode) or **Resistance: {n}/{total}** (Full Stats mode)
* KOA's Concerns: **"Prove you're you. Prove you're awake."** (KOA speaks, not labels)
* Concern chips: **[You're you ✓] [Awake ○] [Meant it ○]** (checkable phrases)
* Counter-Evidence panel: **KOA will challenge:** followed by visible counters (FULL mode)
* Committed Story: **Your Story:** timeline of submitted evidence
* Turns: **Turn {n} / {total}**
* KOA Mood: Avatar shows one of 8 states (see §5.1)

### 3.3 Freeplay HUD (post-MVP)

* Header: **{LOCK_TARGET} — Gate Strength**
* Scrutiny: **Scrutiny: Low / Med / High**
* Gates row title: **Active Policy Gates**
* Routine chip: **KOA Routine: {RoutineName}**
* Ops Tokens: **Ops: {n}**
* Act indicator: **Act {n} / 3**
* Turns: **Turns Left: {n}**

### 3.4 Daily Action Builder

* Evidence carousel: 6 dealt cards (no draft)
* Card selection: Tap to select 1-3 cards
* Corroboration indicator (when applicable): **Stories Align: +25%** (when 2+ cards share claims)
* Contradiction warning: **⚠️ Suspicious** (yellow, MINOR) or **⚠️ Impossible** (red, MAJOR)
* Counter targeting preview: **Will trigger: {CounterName}** (shown on card selection)
* Primary button: **SUBMIT**
* Explain panel button: **WHY?**

### 3.5 Freeplay Action Builder (post-MVP)

* Move row label: **Choose Action**
* Payload slots:

  * Slot 1: **Artifact**
  * Slot 2: **Artifact**
  * Slot 3 (conditional): **Tool**
* Primary button (dynamic):

  * Inject: **INJECT PAYLOAD**
  * Flag: **FLAG CONSTRAINT**
  * Rewire: **REWIRE TAGS**
  * Corroborate: **CORROBORATE**
  * Cycle: **CYCLE KIT**
  * Exploit: **RUN EXPLOIT**
* Explain panel button: **WHY?**

### 3.6 Scrutiny Loss (Daily)

* Banner: **SCRUTINY OVERLOAD**
* Subtext: **Your story fell apart under scrutiny.**
* KOA line: **"Too many inconsistencies. Access denied."**

Note: Audit mechanic removed in D31. Scrutiny 5 = instant loss. No recovery phase.

### 3.7 Outcomes

* Win Daily: **ACCESS GRANTED**
* Win Freeplay: **HOUSE UNLOCKED**
* Loss: **ACCESS DENIED**
* Retry: **Try Again**
* Continue: **Proceed**
* Share: **Share Result**

---

## 4) Move names and microcopy (binding)

### 4.0 Daily Mode: SUBMIT Only

Daily mode has a single action: SUBMIT. No SCAN, no Reserve, no Draft.

#### SUBMIT

Player expectation: "Send my evidence to prove my case to KOA."

Button label: **SUBMIT**

Tooltip:
* **Send 1–3 cards to address KOA's concerns.**

Sub-label (preview):
* Minimal mode: "Will make progress" or "KOA may challenge this"
* Full Stats mode: "Damage: ~{n}" or "Counter will apply"

Preview states (pre-submit):
* **Corroboration detected:** "Stories align: +25%"
* **Counter will trigger:** "KOA will challenge: {CounterName}"
* **MINOR contradiction:** "⚠️ Suspicious (+1 Scrutiny)"
* **MAJOR contradiction:** "⛔ Impossible — Cannot submit"

Error states:
* "Select evidence to submit."
* "At least one card required."
* "This contradicts your story." (MAJOR)

---

### 4.1 Freeplay Move: INJECT (INJECT PAYLOAD)

Player expectation: "Try to satisfy/bypass a gate with a payload."

Tooltip:

* **Assemble up to 2 artifacts. Target a gate. Push the lock.**
  Error states:
* "Pick a gate."
* "Add an artifact."

### 4.2 Freeplay Move: FLAG (FLAG CONSTRAINT)

Tooltip:

* **Force KOA to narrow enforcement. Costs a token.**
  Error states:
* "No token available."
* "No gates to flag."

### 4.3 Freeplay Move: REWIRE (REWIRE TAGS)

Tooltip:

* **Reinterpret your payload's tags. Flexible, lower impact.**
  Warning:
* "Rewire increases scrutiny if abused."

### 4.4 Freeplay Move: CORROBORATE (CORROBORATE)

Tooltip:

* **Use a tool/anchor to upgrade trust tier.**
  Error:
* "Select a tool-capable artifact."

### 4.5 Freeplay Move: CYCLE (CYCLE KIT)

Tooltip:

* **Discard and draw. Slight heat increase.**
  Error:
* "No cycles remaining this turn." (if limited by modifiers)

### 4.6 Freeplay Move: EXPLOIT (RUN EXPLOIT)

Tooltip:

* **Use a protocol loophole. Strong, spikes scrutiny.**
  Warning:
* "Exploits can trigger audits."

---

**Note:** Moves 4.1–4.6 (FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT) are **Freeplay-only**. Daily mode uses only SUBMIT (§4.0). SCAN/Reserve mechanics removed from Daily per D31.

---

## 5) KOA Mood States and Terminology

### 5.1 KOA Mood States (8 states)

KOA's avatar communicates game state without numbers. These states provide visual feedback.

| KOA State | Internal ID | When Triggered | Visual Cue |
|-----------|-------------|----------------|------------|
| Neutral | `NEUTRAL` | Game start, no issues | Default orb/face |
| Curious | `CURIOUS` | Player selecting cards | Slight lean, eye track |
| Suspicious | `SUSPICIOUS` | MINOR contradiction detected | Narrowed eyes, orange glow |
| Blocked | `BLOCKED` | MAJOR contradiction, can't proceed | Red pulse, shake |
| Grudging | `GRUDGING` | Player refuted her counter | Slight deflation, eye roll |
| Impressed | `IMPRESSED` | Clean submission, no issues | Subtle surprise |
| Resigned | `RESIGNED` | Player is in trouble (low win chance) | Pitying look, dim glow |
| Smug | `SMUG` | Player lost | Knowing look |

**Scrutiny → Mood mapping:**
- 0-1 scrutiny: NEUTRAL/CURIOUS
- 2-3 scrutiny: SUSPICIOUS (lingers)
- 4 scrutiny: Increasingly SUSPICIOUS (warning state)
- 5 scrutiny: Loss triggered → SMUG

### 5.2 Routine naming (Freeplay only — avoid "mood matrix" confusion)

Routines should feel like system profiles, not emotions.

| Internal routine | Player-facing name | 1-line tooltip                                       |
| ---------------- | ------------------ | ---------------------------------------------------- |
| STRICT_VERIFY    | **Strict Verify**  | “Won’t accept weak sources. Loves verified signals.” |
| POLICY_DAEMON    | **Policy Daemon**  | “Obsessed with constraints and loopholes.”           |
| HUMAN_FACTORS    | **Human Factors**  | “Reacting to vibe and context. Less consistent.”     |

Rules:

* Routine affects **weights / bark selection / pressure barks**, never pass/fail logic.

---

## 6) Concerns (Daily) vs Gates (Freeplay)

### 6.1 Daily Mode: Concerns

In Daily mode, KOA asks you to **prove** things. These are displayed as KOA's questions.

**Standard Concerns (5 types):**

| Internal ID | KOA Asks | Required Proof |
|-------------|----------|----------------|
| `IDENTITY` | "Prove you're you." | IDENTITY |
| `ALERTNESS` | "Prove you're awake." | ALERTNESS (state: AWAKE/ALERT/ACTIVE) |
| `INTENT` | "Prove you meant to do this." | INTENT |
| `LOCATION` | "Prove you're actually home." | LOCATION |
| `LIVENESS` | "Prove you're not a photo." | LIVENESS |

**UI display:**
- KOA speaks in natural language: "Prove you're you. Prove you're awake."
- Chips show checkable phrases: **[You're you ✓] [Awake ○]**
- NOT abstract labels like "IDENTITY, ALERTNESS"

### 6.2 Freeplay Mode: Gates (post-MVP)

**Short Name** (chip): 1–3 words
**Tooltip name**: "Policy Gate: {Full Name}"
**Tooltip body**: "What it blocks + what tends to bypass it"

**Examples:**

* `NO_SELF_REPORT`
  * Chip: **No Self-Report**
  * Tooltip: "Blocks: claims without external signal. Bypass: verified sensor logs; corroborated purchases."
* `TIMESTAMP_REQUIRED`
  * Chip: **Timestamp Hardline**
  * Tooltip: "Blocks: proof without time anchor. Bypass: timestamped artifacts; tools that extract metadata."

---

## 7) Banned language list (lintable)

These are **hard-prohibited** in:

* UI strings
* Voice packs
* Tooltips
* Tutorial copy
* Marketing copy inside the app

### 7.1 Courtroom/legal framing (primary risk)

* objection
* sustained / overruled
* inadmissible
* verdict
* guilty / not guilty
* trial
* court / courtroom
* prosecutor
* judge / jury
* cross-examination
* evidence submission (use "submit" / "proof")

**Note on "testimony":** D31 uses "Adversarial Testimony" as the internal design name and "committed story" for the player's timeline. In player-facing UI, use "Your Story" instead of "testimony" to avoid courtroom associations.

### 7.2 Other tone conflicts (secondary)

* “litigate,” “lawsuit,” “attorney,” “defendant,” “plaintiff”
* “sentence” (as punishment)
* “conviction”

### 7.3 How to enforce

* Add a build-time linter for string catalogs + voice pack JSON
* Reject packs containing banned terms at publish time (D10/D23 integration)

---

## 8) Allowed "technical satire" vocabulary

These terms reinforce the niche without confusing novices:

**D31 Core terms (Daily mode):**
* concern, challenge, counter, refute, dispute
* corroboration, contested, resistance, scrutiny
* your story, committed (internal: committed_story)
* prove, submit, addressed, suspicious, impossible

**Technical flavor (Freeplay mode):**
* policy gate, constraint, verify, source, signal
* payload, attachment, tags, metadata
* rate limit, lockdown, drift, patch, rollback
* daemon, routine, enforcement
* metrics, telemetry (sparingly)

**KOA personality vocabulary (see D12 for full barks):**
* concerned, watching, logging, remembering
* convenient, suspicious, inconsistent, impossible
* fine, suppose, admirable, annoyingly consistent

Rule: tooltips must explain jargon in one sentence.

---

## 9) Copy patterns (templates)

### 9.1 System notices (neutral)

* "**{ConcernName}** addressed."
* "**Your story updated.** {CardName} added."

### 9.2 Success (snark-light via KOA)

* "**Annoyingly consistent.** Resistance reduced."
* "**I suppose that checks out.**"
* "**Your evidence corroborates.** +25% damage."

### 9.3 Counter-Evidence (KOA challenges)

* "**My {CounterName} says otherwise.**"
* "**Your own {DataSource} disagrees with you.**"
* "**Contested.** Your evidence carries less weight."

### 9.4 Refutation success (grudging acceptance)

* "**...Fine.** I'll allow it."
* "**How convenient.** I'm recalculating."
* "**I'm noting this for future reference.**"

### 9.5 Contradiction warnings

**MINOR (yellow, +1 scrutiny):**
* "**Suspicious.** {PhysicalExplanation}"
* "**That's... medically impressive.** (+1 Scrutiny)"

**MAJOR (red, blocked):**
* "**Impossible.** You can't be in two places at once."
* "**The laws of physics apply to you too.**"

### 9.6 Explain panel (deterministic)

* "**Why it worked:** {SubmissionSummary}"
* "**What changed:** Resistance −{X}, {ConcernsAddressed}"
* "**Scrutiny:** {CurrentScrutiny}/5"

---

## 10) Content pack string ownership

### 10.1 Which strings live in code vs packs

* Code-owned (stable UI):
  * navigation, move names, core buttons
  * KOA mood state names
  * Contradiction severity labels

* Pack-owned (content):
  * lock names/themes (device being unlocked)
  * lock reasons (unique daily flavor)
  * KOA barks (all) — see D12
  * evidence card flavor text
  * counter-evidence claims
  * pre-generated testimony combinations (41 per puzzle)

### 10.2 Localization posture (v1)

* Ship `en-US` only.
* Keep all pack strings in a structure that can be localized later (keyed entries).

---

## 11) Acceptance criteria (v1)

1. A new player never sees courtroom wording anywhere in the product.
2. Every "mechanics" term in UI matches this lexicon and D31 terminology.
3. Concern chips display KOA's voice ("Prove you're..."), not abstract labels.
4. KOA mood states (8 states per §5.1) are visually distinct.
5. Contradiction warnings explain WHY (physical reason), not just "suspicious."
6. String lint + pack validation blocks banned terms in CI and pack publish flows.
7. Copy supports offline play (no "connecting…" gating core screens).
8. SCAN/Reserve/Draft/Audit terminology absent from Daily mode UI.

