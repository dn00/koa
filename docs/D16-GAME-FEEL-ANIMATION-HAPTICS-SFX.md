# D16 — GAME FEEL: ANIMATION, HAPTICS, SFX.md

**Status:** Draft v1.0 (Ship-blocking)
**Owner:** UX Engineering / Audio / Motion
**Last Updated:** 2026-01-25
**Purpose:** Specify the “game feel” layer for Life with AURA: animation beats, haptics, and sound design that make a deterministic, UI-driven roguelite feel responsive and addictive. This doc enforces the **Instant Mechanics / Delayed Voice** rule and provides implementable timing budgets, component behaviors, and accessibility requirements.

---

## 0) Non-negotiable feel principles

1. **Hit first, talk second:** mechanics feedback (bars, chips, counters) must update immediately on action commit.
2. **Never block on voice:** voice/barks render asynchronously; silence is acceptable; stutter is not.
3. **Every tap has a payoff:** selection, slotting, and committing all have distinct tactile signatures.
4. **Readable > flashy:** animations reinforce state changes, not distract from planning.
5. **Consistency wins:** the same type of event always uses the same animation and sound family.

---

## 1) Timing budgets (hard requirements)

### 1.1 Interaction latency budgets (mobile)

* Tap → UI response: **< 50ms** perceived (visual highlight/haptic)
* Commit action → mechanics update visible: **< 120ms**
* Commit action → outcome bark displayed: **250–800ms** (simulated “processing” OK)
* Enhanced AURA runtime (if enabled): **non-blocking**, may arrive up to **2.5s** later; if later, optionally drop.

### 1.2 Animation duration targets

* Micro (selection, chip pulse): **80–150ms**
* Meso (bar change, card slam): **180–280ms**
* Macro (act complete, run win/loss): **600–1200ms** total, skippable

---

## 2) Event-to-feedback mapping (authoritative)

All feel events are driven by the deterministic event stream. The feel layer is a pure renderer of events.

| Event source           | Feel trigger                      | Must be instant? |
| ---------------------- | --------------------------------- | ---------------- |
| ACTION_SUBMITTED       | “Commit” feedback (slam + click)  | Yes              |
| MOVE_RESOLVED (deltas) | LockStrength/Scrutiny animations  | Yes              |
| AUDIT_TRIGGERED        | Banner + hazard audio + chip      | Yes              |
| DRAFT_OFFERED / PICKED | Offer reveal + confirm            | Yes              |
| RUN_ENDED              | Win/loss macro sequence           | Yes              |
| OutcomeKey             | Bark selection + “typing” cadence | No (async)       |

---

## 3) Core feel components

## 3.1 Lock Strength Bar (primary “health bar”)

**Visual behavior**

* On delta:

  * Decrease: quick “snap down” + subtle after-bounce
  * Increase (penalty): sharp “snap up” + brief shake
* If lock hits 0:

  * Bar drains fully → a “release” shimmer passes once

**Timing**

* Delta animation: 220ms
* Bounce: 90ms

**Haptic**

* Decrease: light tick
* Increase: medium tick
* Lock cleared: success pulse

**SFX**

* Decrease: short “thunk”
* Increase: “clack” + tiny buzz
* Lock cleared: “release click” (not a fanfare)

---

## 3.2 Scrutiny Indicator (push-your-luck meter)

**Visual behavior**

* On level change:

  * Low→Med: chip turns warmer + slow pulse (1.2s period)
  * Med→High: stronger pulse (0.8s), subtle “hazard stripes” overlay

**Haptic**

* Level up: medium tick
* Level down: light tick

**SFX**

* Level up: warning ping
* High scrutiny persistent: faint low-volume “system hum” (optional, can be disabled)

**Rule**

* Scrutiny change must be understandable without reading text.

---

## 3.3 Active Gate Chips

**Visual behavior**

* When a gate becomes active: chip “slides in” from right (180ms)
* When targeted: chip gets a crisp outline + “locked” icon appears
* When weakened due to a pass: chip flashes once (100ms)
* When cleared: chip dissolves into particles (200ms) and disappears

**Interaction**

* Tap: opens tooltip sheet (no more than 2 taps to return)
* Long-press (optional): pin tooltip inline

**SFX**

* Chip activate: soft tick
* Target select: click

---

## 3.4 Payload Slotting (the “crafting” feel)

Slots: Artifact 1, Artifact 2, Tool (conditional)

**Behavior**

* Tapping a card to slot:

  * Card shrinks into slot with “snap” (160ms)
  * Slot glows briefly (120ms)
* Removing:

  * Slot pops and returns card to hand (140ms)

**Haptic**

* Slot: light tick
* Remove: light tick (different pattern if supported)

**SFX**

* Slot: “snap”
* Remove: “tap”

**Error feel**

* If player tries to commit with incomplete payload:

  * Button shakes (90ms)
  * Microcopy appears (“Pick a gate”, “Add an artifact”)
  * No harsh buzzer; use a soft “deny tick”

---

## 3.5 Commit Button (INJECT/FLAG/etc.)

**States**

* Disabled: muted; shows “why” on tap
* Ready: subtle breathing glow (2s)
* Pressed: “slam” animation + immediate mechanics update
* Cooldown (if any): circular progress ring

**Commit beat (must)**

* T=0: button depress + haptic + SFX
* T=0–120ms: mechanics bars begin moving
* T=250–800ms: bark appears (typing effect)

---

## 3.6 Stream / Transcript (chat-log cadence)

**Goal:** keep the illusion of “AURA reacting” without blocking.

**Bark rendering**

* Pre-gen bark:

  * Use “typing dots” for 250–450ms based on OutcomeKey (pass vs fail)
* Enhanced bark (if enabled):

  * Render as an “overlay line” with a subtle badge (e.g., “deluxe” icon) or a different bubble tint
  * If it arrives after player has already acted again, it inserts as a later line, not retroactively

**Do not**

* Do not delay mechanics until bark prints
* Do not require the player to read bark to proceed

---

## 3.7 Audit Protocol (the “danger state”)

**Trigger**

* AUDIT_TRIGGERED event

**Visual**

* Banner slides down: “AUDIT PROTOCOL ACTIVE” (240ms)
* Screen edge vignette lightly appears at High scrutiny
* HUD adds “Audit: N turns” chip with countdown

**Audio**

* One-time “alarm ping” (short)
* Optional: low rumble/hum while audit active (toggleable)

**Haptics**

* Trigger: medium-long pulse
* Countdown tick: none (avoid annoyance)

**Behavioral emphasis**

* When audit active, show subtle constraints visually (greyed moves, slot restrictions), with a one-tap “What changed?” sheet.

---

## 3.8 Cache/Shop offers (reward feel)

**Offer reveal**

* Cards fan in (240ms)
* Rare offers get a distinct shimmer (not color-reliant)

**Pick**

* Selected card enlarges + “stamp” effect (“ADDED TO KIT”) (320ms)

**Audio**

* Reveal: soft rustle
* Pick: “stamp” + short chime

**Haptic**

* Pick: success pulse

---

## 3.9 Act Complete / Run Win / Run Loss (macro feel)

**Act complete (600–900ms)**

1. Lock bar drains to 0 (if not already)
2. “LOCK WEAKENED” label appears
3. Summary chips animate in
4. CTA appears

**Run win (900–1200ms, skippable)**

1. “HOUSE UNLOCKED”
2. Receipt-printer style “ACCESS GRANTED” ticket animates (signature moment)
3. Show share card CTA

**Run loss (700–1000ms)**

1. “ACCESS DENIED”
2. Failure reason chip
3. “What you learned” appears (Codex unlock emphasis)
4. Immediate “Run It Back” CTA

**Rules**

* All macro sequences must be skippable via tap after 400ms.
* Never punish loss with long unskippable animations.

---

## 4) Sound design system (implementation-friendly)

### 4.1 Sound families (IDs)

Define SFX IDs so packs and code can reference stable keys:

* `ui.tap_light`
* `ui.tap_medium`
* `ui.deny_soft`
* `ui.confirm`
* `lock.hit_down`
* `lock.hit_up`
* `lock.release`
* `scrutiny.up`
* `scrutiny.down`
* `audit.trigger`
* `audit.hum_loop` (optional)
* `slot.snap_in`
* `slot.snap_out`
* `cache.reveal`
* `cache.pick_stamp`
* `run.win_ticket`
* `run.loss_thud`

### 4.2 Volume & mixing rules

* Voice (barks): separate channel, user-adjustable
* SFX: default medium; never exceed voice loudness
* Hum loops: off by default or very low; auto-disable with “Reduce Motion/Sensory” setting

### 4.3 Repetition management

* Avoid identical SFX spam:

  * enforce minimum 150ms between identical tap SFX
  * randomize between 2–3 variants per family if available

---

## 5) Haptics specification (mobile)

### 5.1 Haptic patterns

* `tick_light`: selection, chip select
* `tick_medium`: scrutiny up, penalties
* `pulse_success`: lock clear, cache pick
* `pulse_warning`: audit trigger

### 5.2 Rules

* Haptics must be togglable
* Respect OS-level haptic disable
* No haptics on every scroll / carousel movement

---

## 6) Accessibility and sensory safety

* **Reduce Motion**:

  * remove shake effects
  * shorten macro sequences
  * replace particles with fades
* **Color reliance**:

  * scrutiny states require iconography/pattern, not just color
* **Audio**:

  * separate sliders: Voice / SFX / Ambient
* **Flashing**:

  * no rapid flashing; pulses > 0.6s period

---

## 7) Debug / tuning hooks (engineering)

### 7.1 Deterministic feel mode

Add a developer toggle:

* “Show Feel Triggers”

  * overlays event type
  * overlays delta values
  * shows bark ID used

### 7.2 Performance instrumentation

* Measure:

  * tap-to-visual
  * commit-to-bars
  * commit-to-bark
  * dropped frames during macro animations

Set budgets:

* 60fps target; tolerate 45fps on low devices during macro only

---

## 8) Acceptance criteria (v1)

1. Commit produces visible mechanics change within 120ms.
2. Player can act again without waiting for bark text.
3. Audit triggers have a distinct, readable feel (banner + chip + warning signature).
4. Cache pick feels rewarding and distinct from normal actions.
5. All feel is toggleable and respects accessibility settings.
6. Sound/haptic IDs are stable and referenced by key, not hardcoded file paths.
