# KOA Casefile — Frozen Spec v1.0
**Codename:** KOA Casefile  
**Genre:** Daily shared “cozy-comedic” mystery deduction (Wordle-like cadence)  
**Core promise:** The **kernel is truth** (deterministic sim + event log). The player solves by revealing **bounded slices of truth** through a **KOA smart-home AI** interface. Narration is presentation only (LLM optional, offline-capable).

---

## 0) Status, scope, and “frozen” intent
This document is a **frozen design target** for a buildable v1. It specifies:
- The **canonical rules** (what the player can do and what “solve” means)
- The **authoritative data model** (event-sourced case bundle)
- The **generation pipeline + validators** (must produce solvable, interesting cases)
- The **KOA interface contract** (no freeform chat; structured query UI)
- The **daily publishing format** (shared case/day, archive, share artifact)

**Changes after v1 require a versioned spec update** (v1.1, v1.2…) and migration notes.

---

## 1) Product goals
### 1.1 Primary goals
1) **Low-word, high-clarity deduction**: players reason from **UI artifacts** (timelines, maps, logs), not paragraphs.  
2) **Fair + replayable**: ≥ 95% of published cases are solvable; failures caught by validators.  
3) **Shared daily case**: same case for everyone each day → sharing, streaks, community.  
4) **Causal truth**: every clue references an event ID; no “vibes” clues.  
5) **Cozy-comedic tone**: “shenanigans” and light crimes (not grim violence), with optional escalations.

### 1.2 Non-goals
- Free-form NPC chat that can alter truth
- Nondeterministic outcomes
- Runtime LLM dependency for truth, clues, or scoring
- AAA presentation, voice acting, or full cinematic scenes in v1

---

## 2) Design pillars (v1)
**P1 Deterministic truth**  
Same `dailySeed + rulesetVersion` → same case bundle. No hidden runtime randomness.

**P2 Bounded discovery**  
Players **spend actions** to reveal truth slices. No open world exploration.

**P3 Inference over exposition**  
No single clue directly states “X did it”; the fun is reconciling contradictions.

**P4 Anti-anticlimax**  
Witnesses report **observables** (heard/saw/was nearby), not “I saw the murder.”

**P5 Shareable completion**  
The game produces a non-spoilery share card (emoji grid, days used, contradictions found).

---

## 3) Canon terms
- **Case**: one mystery instance (daily shared).
- **Kernel**: deterministic simulator and validators; authoritative.
- **Event Log**: ordered list of canonical events (truth).
- **Evidence**: derived artifacts referencing events (UI surfaces).
- **Action**: player operation that reveals evidence slices (limited per in-game day).
- **KOA**: the smart-home AI “operator” UI; never authoritative; can only reveal derived evidence.
- **Suspects**: limited cast (4–7) with known relationships.
- **Twist Rule**: a controlled complication (false alibi, tampered evidence, unreliable witness, etc.).

---

## 4) Player fantasy and loop
### 4.1 Player fantasy
“You’re interrogating a living system through a smart-home AI. KOA can pull logs, clips, and summaries—but it’s **up to you** to connect the dots.”

### 4.2 Daily loop (Wordle cadence)
- One **daily case** (global) unlocks at fixed time.
- Player investigates across **in-game days** (turns).
- Each day: spend **Action Points** to reveal bounded evidence.
- At any time: submit a **Final Accusation** (ends run).
- After solve/fail: view **Truth Replay** (a deterministic reconstruction) and share.

### 4.3 Session length targets
- Typical: **6–12 minutes**
- Power users: **3–6 minutes** (fast solve)
- Strugglers: **12–20 minutes** (use all turns)
- Hard cap: **6 in-game days** then forced final accusation.

---

## 5) What “solving” means (answer format)
A run ends when the player submits:

1) **WHO**: culprit suspect ID  
2) **WHAT**: crime type (from closed list; some days fixed)  
3) **HOW**: method (closed list per crime type)  
4) **WHY**: motive archetype (closed list)  
5) **WHEN**: time window (choose 1 of N windows)  
6) **WHERE**: location (optional in v1; enabled by case template)

**Win condition:** all required fields correct.  
**Partial correctness:** used only for post-run feedback, not for “almost” wins.

---

## 6) Core mechanics (actions, limits, and feedback)
### 6.1 In-game days and action budget
- The player has **3 Action Points (AP)** per in-game day.
- The player has **max 6 days** (18 total AP).
- Some actions cost 2 AP (high-value).
- Optional: **“Coffee Boost”** (once per run) grants +1 AP (earned, not paid).

### 6.2 Action types (v1)
All actions produce **evidence artifacts** referencing event IDs. No action returns arbitrary text.

#### A) Interview (1 AP)
Choose an NPC + choose a structured question:
- “Where were you between [Window A]?”
- “What did you notice about [Person/Object]?”
- “What did you do after [Event Tag]?”
- “Who did you speak with in [Window B]?”

Returns:
- a **testimonial** (observations + uncertainty flags)
- a **claim graph** linking testimonial nodes to supporting events or lack thereof

#### B) Search Location (1 AP)
Choose a location node (room/zone) + a window:
- Reveals **physical evidence** (objects moved, traces, device status, access logs)
- May reveal **evidence decay** (older windows less precise)

#### C) Pull Device Logs (1 AP)
Choose a device type (door locks, cams, motion sensors, thermostat, speaker, wifi presence):
- Returns **log slice** (bounded time window)
- Always references events (door_opened, motion_detected, device_disabled, etc.)

#### D) Cross-Reference (1 AP)
Pick two evidence items:
- Produces **contradictions** (can’t both be true) or **supports** (reinforces)
- Creates a “Reason Card” with the rule used (timeline, access, presence)

#### E) Deduction Board Mark (free)
UI-only: mark suspects/locations/times, pin evidence, draw links. No kernel impact.

#### F) Accuse (ends run)
Submit the final answer vector.

### 6.3 Feedback rules
- The game never says “correct/incorrect” mid-run.
- The game does show **contradiction count** and “coverage meter” (how many of WHO/HOW/WHY/WHEN have at least one evidence chain).
- Optional hint (once/run): “Your current theory conflicts with 2 evidence items” (no spoilers).

---

## 7) Crime types (cozy/comedic v1)
Default “shenanigans” palette (safe, light, memeable):
- **Theft** (object missing, swapped, counterfeit)
- **Sabotage** (device disabled, recipe ruined, event disrupted)
- **Disappearance** (pet missing, prized plant moved, “vanished” item)
- **Fraud / Impersonation** (fake note, fake delivery, spoofed device)
- **Mild Assault** (optional; cartoony, non-lethal; avoid graphic violence)

Each type has a **method list** and **evidence expectations**.

---

## 8) Minimum emergent systems required (to generate cases)
To avoid “scripted Clue,” the kernel must simulate:

### 8.1 Space + access
- Places are discrete nodes (rooms/zones).
- Doors/locks require access (keys, codes, permissions).
- Paths must exist between nodes.

### 8.2 Time + schedules
- NPC routine schedule (home → work → errands).
- Windowed time slices (e.g., 6–8pm, 8–10pm…).
- Events occur at ticks; evidence uses windows.

### 8.3 Perception (anti-anticlimax)
Witnesses do not perceive “crime,” they perceive:
- sight/hearing observables (scream, footsteps, door click, silhouette)
- device-mediated observations (motion sensor, camera snapshot)
- uncertainty flags: occlusion, darkness, distance, distraction

### 8.4 Objects + inventory + manipulation
- Items can be picked up, dropped, swapped, hidden, destroyed (if allowed).
- Item uniqueness IDs for traceability.

### 8.5 Motive pressure (lightweight)
A motive engine chooses pressures from:
- relationships (envy, rivalry)
- needs (money, attention, embarrassment)
- secrets (cover-up)
- status (impress, sabotage competitor)

Motive does not require deep psychology; it needs **deterministic selection** and **traceable justification**.

### 8.6 Device layer (KOA flavor + low-graphics)
A small set of “smart-home” devices create rich logs:
- door lock / open-close
- motion
- camera snapshots (non-visual in v1; just “seen” records)
- wifi presence (who’s phone is “home”)
- speaker / voice command log
- thermostat / lights (used for misdirection)

---

## 9) Preventing anticlimax explicitly
### 9.1 “No direct witness” rule (v1 default)
For crimes that would end the case instantly, enforce one of:
- **Occlusion**: crime occurs in unobserved location or behind a closed door.
- **Ambiguity**: witness sees a silhouette or hears something, not identity.
- **Timing**: witness sees “before/after,” not the act.
- **Unreliable detail**: witness misremembers the exact window (but not everything).

### 9.2 “Observables-only testimony” contract
Testimony is a tuple:
- `(observableType, confidence, timeWindow, location, subjectHint)`
Examples:
- (“heard_argument”, 0.8, W3, kitchen, “two voices”)
- (“saw_person_leave”, 0.6, W2, hallway, “tall jacket”)

No testimony may encode culprit identity directly unless the case template explicitly allows an “easy day.”

---

## 10) Evidence surfaces (UI-first, low text)
Evidence is presented as compact, scannable artifacts:

### 10.1 Timeline Strip
- Windows W1..WN
- Pins: door, motion, object moved, conversation, anomaly
- Tap pin → shows evidence card referencing event IDs

### 10.2 Location Grid / Map (optional in v1)
- Node list (“Kitchen”, “Hall”, “Workshop”…)
- Each node shows counts: anomalies, searches remaining, notable devices

### 10.3 Suspect Cards
- Face/name/role + stable traits (flavor)
- “Known whereabouts” per window (derived)
- “Contradictions” badges count

### 10.4 Device Logs
- Door: open/close + lock/unlock
- Motion: triggered + zone
- Camera: “snapshot captured” with detected entities (bounded)
- Presence: who’s phone is home

### 10.5 Contradiction Cards
A contradiction is a named rule:
- “Can’t be in two places in the same window”
- “Door was locked; entry requires key”
- “Camera disabled at time of alleged sighting”
- “Object moved after last seen by witness”

Each contradiction references its evidence pair and underlying event IDs.

---

## 11) Daily case publishing and shared seed
### 11.1 Shared daily
All players receive the **same case** for the day:
- `dailyId = YYYY-MM-DD`
- `dailySeed = HMAC(serverSecret, dailyId + rulesetVersion)`
- case generation uses `dailySeed`, not client RNG.

### 11.2 Archive
- “Past cases” view: re-playable offline from published bundles.
- Leaderboard is per day (days used, actions, contradictions, no hints).

### 11.3 Spoiler controls
- Share artifact must not reveal suspects/method/location.
- Post-solve share may optionally include “Truth Replay” but requires spoiler confirm.

---

## 12) Generation pipeline (authoritative)
### 12.1 Inputs
- `RulesetVersion`
- `DailySeed`
- `CrimeTemplate` (authored or offline-generated; non-authoritative flavor + constraints)

### 12.2 Steps
1) **Template selection** (deterministic from daily seed)
2) **Cast selection** (suspects, victim/target, witnesses, red herrings)
3) **World setup** (rooms, doors, devices, object placements)
4) **Pre-crime sim** (ticks establish alibis, routine)
5) **Crime execution** (kernel schedules crime; ensures opportunity and anti-anticlimax)
6) **Aftermath sim** (reactions, cover-up behaviors, evidence decay)
7) **Evidence derivation** (event log → evidence artifacts)
8) **Solvability validation** (hard gate)
9) **Interestingness validation** (soft gate → reject if too boring)
10) **Bundle compile** (publishable artifact)

### 12.3 “Funness lint” (what we can validate)
We cannot prove “fun,” but we can reject common bad cases:
- **Too easy**: single item directly identifies culprit
- **Too hard**: insufficient evidence chains or too much ambiguity
- **Too linear**: only one valid path to discover anything
- **No drama**: contradictions < threshold, no misdirection, no twist, no stakes

---

## 13) Validators (ship-blocking)
### 13.1 Solvability validator (must pass)
- **At least 2 independent chains** that uniquely implicate the culprit for WHO:
  - Chain A: timeline + presence
  - Chain B: access + device anomaly
- **HOW and WHEN each have at least 1 chain** that excludes all but the correct option.
- For each red herring suspect: at least **1 exculpating fact**.
- No evidence item is “author says so.” Everything points to event IDs.

### 13.2 Anti-anticlimax validator (must pass)
- No testimony has `confidence >= 0.95` AND `subjectHint == culpritId` for the crime window.
- If camera sees culprit during crime window, it must be **ambiguous** (e.g., “human-shaped”).
- If any witness is in the same room during the crime tick, the case must include occlusion/distraction justification.

### 13.3 Difficulty validator (target band)
For a given difficulty tier:
- Expected solve AP: within target (e.g., 7–14 AP)
- Contradiction count: within band (e.g., 3–7)
- Branching factor: at least 2 viable investigation openings

### 13.4 Comedy/tone guardrails
- Content filters prevent disallowed content.
- Crime types constrained to cozy palette for daily mode.
- “Edge cases” can be premium optional.

---

## 14) Difficulty knobs (explicit)
Primary knobs:
- **Suspect count**: 4 / 5 / 6 / 7
- **Windows**: 4–8 time windows
- **AP/day**: 2–4 (default 3)
- **Max days**: 4–7 (default 6)
- **Noise level**: witness time drift, device gaps
- **Twist rule**: none / mild / strong

Secondary knobs:
- Evidence decay intensity
- Device coverage density
- Red herring strength (how plausible)
- Motive ambiguity

---

## 15) Scoring, streaks, and sharing
### 15.1 Score components
- **Days used** (lower is better)
- **Total AP spent**
- **Contradictions found** (rewarded)
- **Hints used** (penalty)
- **First-try solve** bonus

### 15.2 Share artifact (non-spoiler)
- Emoji grid with days and action types (e.g., 🗣️🔍📟)
- Contradictions count (⚡)
- Final result badge: ✅ / ❌
- Optional: “KOA Mood” sticker (flavor only)

### 15.3 Streaks
- Daily solve streak (like Wordle)
- Optional “Perfect Week” badge

---

## 16) KOA UI (structured, not chat)
### 16.1 Interaction principles
- Player never types open-ended prompts in v1.
- KOA always answers via:
  - evidence cards
  - log slices
  - “I don’t have data for that” (explicit)

### 16.2 Screens
1) **Daily Case Home**
   - Case title + teaser
   - Suspects row
   - Timeline strip
   - AP + day counter
2) **KOA Console**
   - Action picker (Interview / Search / Logs / Cross-ref)
   - Structured query builder
   - Result panel shows evidence cards + citations
3) **Evidence Locker**
   - Filters by type (timeline/physical/testimony/motive/device)
4) **Deduction Board**
   - Pins + links + suspect tags
5) **Accusation Screen**
   - WHO / WHAT / HOW / WHY / WHEN pickers
6) **Truth Replay**
   - Plays the canonical event chain (see Section 18)

### 16.3 Minimal text targets
- Evidence cards: 1–2 lines max + icons
- Testimony: 1 line + confidence chip
- Explanations: post-solve only

---

## 17) Data model (authoritative schemas)
### 17.1 Core IDs
- `CaseId`, `NPCId`, `PlaceId`, `ItemId`, `DeviceId`, `EventId`

### 17.2 CaseBundle (published)
```ts
type CaseBundle = {
  version: "1.0";
  dailyId: string;            // YYYY-MM-DD
  rulesetVersion: string;
  seed: string;               // opaque, server-derived
  config: CaseConfig;
  world: WorldSlice;          // places, doors, devices, item defs
  cast: CastSlice;            // suspects + roles + traits
  windows: TimeWindow[];      // W1..WN
  eventLog: EventRecord[];    // canonical truth
  evidence: EvidenceIndex;    // derived artifacts referencing event IDs
  solution: SolutionVector;   // encrypted or withheld until solve (server)
  validators: ValidatorReport;
  presentation: PresentationPack; // templates, tone, KOA flavor strings
};
```
### 17.3 CaseConfig (authoritative)
```ts
type CaseConfig = {
  caseId: string;
  crimeType: CrimeType;
  difficultyTier: 1|2|3|4;
  maxDays: number;
  apPerDay: number;
  suspects: NPCId[];
  culpritId: NPCId;
  targetId?: NPCId;           // victim/owner
  witnesses: NPCId[];
  redHerrings: NPCId[];
  twistRule: TwistRule;
  method: MethodId;
  motive: MotiveId;
  crimeWindow: string;        // e.g. "W4"
  crimePlace?: PlaceId;
};
```

### 17.4 EventRecord (canonical)
```ts
type EventRecord = {
  id: EventId;
  tick: number;
  windowId: string;           // Wk
  type: string;               // "MOVE", "DOOR", "DEVICE", "INTERACT", "CRIME"
  actor?: NPCId;
  target?: NPCId | ItemId | DeviceId;
  place?: PlaceId;
  data: Record<string, any>;  // deterministic payload
  causes?: EventId[];         // causal DAG edges
};
```

### 17.5 Evidence artifacts (derived)
All evidence must cite event IDs; no orphan claims.

```ts
type EvidenceItem =
  | { kind:"testimony"; id:string; npc:NPCId; window:string; place?:PlaceId; observable:string; confidence:number; cites:EventId[] }
  | { kind:"deviceLog"; id:string; device:DeviceId; window:string; entries:DeviceEntry[]; cites:EventId[] }
  | { kind:"physical"; id:string; item:ItemId; place:PlaceId; window:string; finding:string; cites:EventId[] }
  | { kind:"motive"; id:string; npc:NPCId; motive:MotiveId; basis:string; cites:EventId[] }
  | { kind:"contradiction"; id:string; rule:string; a:string; b:string; cites:EventId[] };
```

---

## 18) Truth Replay (post-solve)
### 18.1 Purpose
- Provide catharsis: "here's what actually happened."
- Provide learnability: show how evidence linked to truth.

### 18.2 Mechanism
- Replay is driven by `eventLog` only.
- Client renders a deterministic sequence:
  - highlight involved NPCs
  - show window transitions
  - show key evidence overlays
- Optional narration:
  - template-driven barks (LLM optional offline expansion)

---

## 19) Content pipeline (LLM optional, offline-friendly)
### 19.1 What LLMs can do (offline or prepublish)
- Generate CrimeTemplates (twist ideas, comedic hooks)
- Generate alternative phrasing variants for evidence templates
- Generate names/locations/props within allowed taxonomy
- Generate KOA flavor lines (tone pack)

### 19.2 What LLMs cannot do (v1)
- Choose culprit or modify outcomes
- Create evidence not backed by event IDs
- Add new entities at runtime

### 19.3 Publishing workflow
1. Generate many candidate cases for the day.
2. Run validators + difficulty estimators.
3. Human QA spot-check top candidates.
4. Publish one CaseBundle for `dailyId`.
5. Archive bundle for replay.

---

## 20) Monetization (compatible with "shared daily")
### 20.1 Free core
- Daily case access
- Streak + share
- Archives for last N days

### 20.2 Paid value (non-pay-to-win)
- Full archive access
- Cosmetic KOA skins / tone packs / seasonal themes
- "Case Lab" (practice mode) with extra cases (not shared daily)
- Enhanced analytics (breakdown of your path vs optimal)
- Optional "Hard Mode Week" pack

No selling hints for the daily (keeps fairness + sharing clean).

---

## 21) Telemetry (to verify fun)
Track:
- solve rate per day
- median days/AP to solve
- abandonment point (which action causes drop)
- contradiction discovery rate
- which openings players choose first
- hint usage

Use telemetry to tune:
- AP/day, windows, suspect count
- evidence density and branching

---

## 22) Definition of Done (v1 ship)
A v1 build is "done" when:
- Daily CaseBundle generation + publish works end-to-end.
- ≥ 95% of published cases pass all hard validators and are solvable by QA.
- The KOA UI supports all v1 actions with zero freeform chat.
- Players can complete and share results with non-spoiler artifact.
- Truth Replay works deterministically from the event log.

---

## 23) Appendix: recommended v1 defaults
- **suspects**: 5
- **windows**: 6
- **ap/day**: 3
- **max days**: 6
- **device coverage**: door + motion + presence always; camera sometimes
- **twist rule**: mild (false alibi OR witness uncertainty), not both
- **crime palette**: theft/sabotage/disappearance (avoid murder in daily)

---

## 24) Open risks (explicit)
- **Saturated market**: differentiate via KOA device-log interface + deterministic truth + share format.
- **Boring days**: mitigate via interestingness lint + curated templates + seasonal packs.
- **Too wordy creep**: enforce UI character limits; evidence is cardified.
- **Spoilers**: protect daily solution server-side until solve; share artifact non-spoilery.

---

## Appendix B — "Not trivial witness" rule (formal)
Reject case if ∃ witness W such that revealed interview of W at redactionLevel<=1 returns:
- identifies culprit by ID **and**
- observes incident act directly **and**
- time + location match solution

…without requiring any other evidence.
