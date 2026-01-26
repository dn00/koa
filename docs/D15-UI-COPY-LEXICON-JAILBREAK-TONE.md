# D15 — UI COPY & LEXICON (JAILBREAK TONE).md

**Status:** Draft v1.1 (Ship-blocking)
**Owner:** Product / Narrative Systems
**Last Updated:** 2026-01-26
**Purpose:** Define the canonical vocabulary, UI copy patterns, and prohibited language for Life with AURA. This doc ensures the game reads as **smart-home jailbreak / proving the AI wrong** (not courtroom), stays consistent across UX, voice barks, and tooltips, and remains implementable via pack-serviced strings.

**Mode:** Option B — Daily uses simplified player-facing terminology; Freeplay uses internal/technical terms.

---

## 0) Why this doc is ship-blocking

Tone drift is a real product risk. If the UI uses legal/court words, players will map it to Ace Attorney even if mechanics differ. This doc establishes a **binding lexicon** and a **lintable banned-term list** to enforce the jailbreak fantasy in code and in content packs.

---

## 1) Tone pillars (what the player should feel)

1. **You are outsmarting a system, not roleplaying a trial.**
2. **AURA is an enforcement daemon, not a human prosecutor/judge.**
3. **You win by assembling payloads and exploiting constraints.**
4. **You can always explain outcomes deterministically (“WHY?”), so it feels fair.**
5. **Snark targets “policy / metrics / system behavior,” not the player personally.**

---

## 2) Option B terminology split (Daily vs Freeplay)

Daily mode uses simplified player-friendly terms. Freeplay uses internal/technical terms.

| Internal term | Daily (player) | Freeplay (player) | Notes |
|---------------|----------------|-------------------|-------|
| `lock_strength` | **Resistance** | **Gate Strength** | Daily = target stubbornness; Freeplay = HP-like |
| `gate` | **Protocol** | **Gate** / **Policy Gate** | Daily = rule being enforced; Freeplay = constraint |
| `inject` | **Submit** | **Inject** | Daily = send cards; Freeplay = push payload |
| `cycle` | **Scan** | **Cycle** | Daily = refresh from reserve; Freeplay = discard/draw |
| `artifact` | **Evidence** | **Artifact** | Daily = proof items; Freeplay = cards |
| `damage` | **Compliance** | **Damage** | Daily = progress made; Freeplay = strength reduction |

---

## 2.1) Canonical vocabulary map (mechanics → language)

| Mechanics concept | Canonical UI term                | Notes                                                           |
| ----------------- | -------------------------------- | --------------------------------------------------------------- |
| Run               | **Run** / **Daily**              | Daily mode = "Daily"; Freeplay = "Run"                          |
| Incident          | **Lock Event** / **Lock**        | Avoid "case," "trial," "hearing."                               |
| Boss              | **Lockdown** / **Hard Lock**     | Freeplay only. "Boss" fine in meta contexts.                    |
| lock_strength     | **Resistance** (Daily) / **Gate Strength** (Freeplay) | See §2 for mode split.                |
| Gate              | **Protocol** (Daily) / **Policy Gate** (Freeplay) | "Constraint" in tooltips.                    |
| Counter path      | **Bypass Path** / **Valid Path** | "Bypass" reads jailbreak.                                       |
| Resolver output   | **Result** / **Resolution**      | Avoid "ruling," "judgment."                                     |
| Scrutiny          | **Scrutiny**                     | Consistent across modes. 0-5 scale in Daily.                    |
| Audit             | **Audit Protocol**               | Avoid "cross-exam."                                             |
| Turn              | **Turn**                         | UI: "Turns left"                                                |
| Card              | **Evidence** (Daily) / **Artifact** (Freeplay) | "Card" acceptable in meta text.                 |
| Tool              | **Tool**                         | Freeplay only. Keep literal.                                    |
| Move              | **Action**                       | Daily: SUBMIT/SCAN. Freeplay: 6 moves.                          |
| Inventory/Deck    | **Evidence** (Daily) / **Kit** (Freeplay) | Daily = 6 drafted cards.                          |
| Draft             | **Draft**                        | Both modes. "Pick your evidence."                               |
| Reserve           | **Reserve**                      | Daily only. Hidden backup pool.                                 |
| Shop              | **Cache** / **Black Cache**      | Freeplay only. Avoid "store."                                   |
| Meta progression  | **Unlocks** / **Codex**          | No "XP grind" vibe.                                             |
| Daily mode        | **Daily**                        | "5-minute puzzle." Not "daily featured seed."                   |
| Loss              | **Access Denied**                | Avoid "guilty."                                                 |
| Win               | **Access Granted**               | Avoid "not guilty."                                             |

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
* Progress: **Resistance: {n}%**
* Scrutiny: **Scrutiny: {n}/5**
* Protocol chips: **{PROTOCOL_NAME}** (tap for details)
* Turns: **Turn {n} / {total}**

### 3.3 Freeplay HUD (post-MVP)

* Header: **{LOCK_TARGET} — Gate Strength**
* Scrutiny: **Scrutiny: Low / Med / High**
* Gates row title: **Active Policy Gates**
* Routine chip: **AURA Routine: {RoutineName}**
* Ops Tokens: **Ops: {n}**
* Act indicator: **Act {n} / 3**
* Turns: **Turns Left: {n}**

### 3.4 Daily Action Builder

* Evidence carousel: 6 drafted cards
* Payload slots: **Slot A** / **Slot B**
* Resonance indicator (when applicable): **Resonance: 1.5x**
* Primary button: **SUBMIT**
* Secondary button: **SCAN** (with "+2 Scrutiny" indicator)
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

### 3.6 Audit

* Banner: **AUDIT TRIGGERED**
* Subtext: **Resistance healed. Card quarantined.**
* Quarantine indicator: **Quarantined: {n} turns**

### 3.7 Outcomes

* Win Daily: **ACCESS GRANTED**
* Win Freeplay: **HOUSE UNLOCKED**
* Loss: **ACCESS DENIED**
* Retry: **Try Again**
* Continue: **Proceed**
* Share: **Share Result**

---

## 4) Move names and microcopy (binding)

### 4.0 Daily Mode: SUBMIT and SCAN

Daily mode has only two actions with simplified copy.

#### SUBMIT

Player expectation: "Send my evidence to satisfy the protocol."

Button label: **SUBMIT**

Tooltip:
* **Send 1–2 cards to satisfy the active Protocol.**

Sub-label (preview):
* "Compliance: ~{n}" or "Protocol: likely pass"

Error states:
* "Add evidence to submit."
* "At least one card required."

#### SCAN

Player expectation: "Refresh my evidence options."

Button label: **SCAN**

Tooltip:
* **Swap cards from your Reserve. Costs turn + scrutiny.**

Cost indicator: **+2 Scrutiny**

Error states:
* "No scans remaining."
* "Scrutiny too high to scan."

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

* **Force AURA to narrow enforcement. Costs a token.**
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

**Note:** Moves 4.1–4.6 (FLAG, REWIRE, CORROBORATE, CYCLE, EXPLOIT) are **Freeplay-only**. Daily mode uses only SUBMIT and SCAN (§4.0).

---

## 5) Routine naming (avoid “mood matrix” confusion)

Routines should feel like system profiles, not emotions.

| Internal routine | Player-facing name | 1-line tooltip                                       |
| ---------------- | ------------------ | ---------------------------------------------------- |
| STRICT_VERIFY    | **Strict Verify**  | “Won’t accept weak sources. Loves verified signals.” |
| POLICY_DAEMON    | **Policy Daemon**  | “Obsessed with constraints and loopholes.”           |
| HUMAN_FACTORS    | **Human Factors**  | “Reacting to vibe and context. Less consistent.”     |

Rules:

* Routine affects **weights / bark selection / pressure barks**, never pass/fail logic.

---

## 6) Gate naming rules (player-facing)

### 6.1 Gate display format

**Short Name** (chip): 1–3 words
**Tooltip name**: “Policy Gate: {Full Name}”
**Tooltip body**: “What it blocks + what tends to bypass it”

### 6.2 Examples

* `NO_SELF_REPORT`

  * Chip: **No Self-Report**
  * Tooltip: “Blocks: claims without external signal. Bypass: verified sensor logs; corroborated purchases.”
* `TIMESTAMP_REQUIRED`

  * Chip: **Timestamp Hardline**
  * Tooltip: “Blocks: proof without time anchor. Bypass: timestamped artifacts; tools that extract metadata.”

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
* testimony
* evidence submission (use “payload” / “proof”)

### 7.2 Other tone conflicts (secondary)

* “litigate,” “lawsuit,” “attorney,” “defendant,” “plaintiff”
* “sentence” (as punishment)
* “conviction”

### 7.3 How to enforce

* Add a build-time linter for string catalogs + voice pack JSON
* Reject packs containing banned terms at publish time (D10/D23 integration)

---

## 8) Allowed “technical satire” vocabulary

These terms reinforce the niche without confusing novices:

* policy gate, constraint, audit, verify, source, signal
* payload, attachment, tags, metadata
* rate limit, lockdown, drift, patch, rollback
* daemon, routine, enforcement
* metrics, telemetry (sparingly)

Rule: tooltips must explain jargon in one sentence.

---

## 9) Copy patterns (templates)

### 9.1 System notices (neutral)

* “**{GateName} active.** Stronger proof required.”
* “**Audit Protocol triggered.** Heat is now {Scrutiny}.”

### 9.2 Success (snark-light)

* “**Payload accepted.** Lock strength reduced.”
* “**Signal verified.** Constraint loosened.”

### 9.3 Failure (informative, not punishing)

* “**Payload rejected.** Missing: {MissingTrait}.”
* “**Too sketchy.** Corroborate or expect an audit.”

### 9.4 Explain panel (deterministic)

* “**Why it worked:** {CounterPathSummary}”
* “**What changed:** Lock −{X}, Scrutiny +{Y}”
* “**Next time:** {NonAuthoritativeHint}” (optional; only if hints enabled)

---

## 10) Content pack string ownership

### 10.1 Which strings live in code vs packs

* Code-owned (stable UI):

  * navigation, move names, core buttons
* Pack-owned (content):

  * lock names/themes
  * gate tooltips/descriptions
  * AURA barks (all)
  * recap lines

### 10.2 Localization posture (v1)

* Ship `en-US` only.
* Keep all pack strings in a structure that can be localized later (keyed entries).

---

## 11) Acceptance criteria (v1)

1. A new player never sees courtroom wording anywhere in the product.
2. Every “mechanics” term in UI matches this lexicon.
3. Gate chips + tooltips are readable and actionable in < 5 seconds.
4. String lint + pack validation blocks banned terms in CI and pack publish flows.
5. Copy supports offline play (no “connecting…” gating core screens).

