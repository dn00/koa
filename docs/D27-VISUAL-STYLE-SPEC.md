# D27 — VISUAL STYLE SPEC v1

**Status:** Draft v1.0
**Owner:** UX/UI + Brand
**Last Updated:** 2026-01-25
**Purpose:** Define a shippable, solo-dev-friendly visual system for Life with AURA: **bright premium “Apple-y” UI** with a **hostile compliance daemon** vibe. This spec is designed to be directly usable by an asset-generation agent (Gemini) and to keep all visuals consistent across packs.

---

## 0) One-line vibe

**Calm premium wellness dashboard + adversarial compliance daemon.**
Baseline is serene and minimalist; when the player pressures the system, the mask slips via brief glitch/audit overlays.

---

## 1) Aesthetic pillars

1. **Bright, premium, product-like**
   Looks like Apple Health / iOS Settings / premium SaaS, not cyberpunk.

2. **Hostile compliance, not courtroom drama**
   UI language is OS/compliance (“Flagged”, “Audit”, “Policy exception”), not “verdict”.

3. **Artifacts feel real**
   Cards are “documents”: receipts, logs, policies, screenshots—rendered via templates, not bespoke illustrations.

4. **Glitch is a spice, not a meal**
   Glitch only for: audits, critical hits, boss modifiers, scrutiny spikes, AURA escalation.

5. **Readability over decoration**
   Mechanical clarity (tags, trust tier, effects) is visually primary.

---

## 2) Color system (principles + tokens)

### 2.1 Principles

* **Neutral base** with warm whites and soft grays.
* **One calm accent** (success/verified/primary actions).
* **One danger accent** (audit/scrutiny/high-risk).
* Avoid neon/cyberpunk palettes.

### 2.2 Required semantic tokens (name-only; pick exact values later)

* `bg.base`, `bg.panel`, `bg.card`
* `text.primary`, `text.secondary`, `text.muted`
* `accent.calm` (primary CTA, verified highlights)
* `accent.warn` (sketchy / risk)
* `accent.danger` (audit, high scrutiny)
* `accent.info` (routine chip, minor system info)
* `border.default`, `border.strong`, `border.dashed`
* `shadow.soft`, `shadow.raised`

### 2.3 Semantic mapping (must be consistent)

* **Verified** → calm accent + solid border
* **Plausible** → neutral accent + dashed border
* **Sketchy** → warn accent + jitter micro-anim + stamped “UNVERIFIED”
* **Audit active** → danger accent + redaction overlay
* **Gate cleared** → calm accent, haptic “success”
* **Scrutiny rising** → warn→danger gradient cue

---

## 3) Typography

### 3.1 Fonts (choose equivalents available on web)

* UI Sans: `Inter` / `Geist` / system-ui
* Mono: `SF Mono` / `JetBrains Mono` / `ui-monospace`

### 3.2 Hierarchy (mobile-first)

* Screen title: 20–24px, semibold
* Card title: 16–18px, semibold
* Body: 14–16px
* Meta: 12–13px (tags, chips, timestamps)
* Logs/receipts: mono 12–13px

### 3.3 Content rules

* Prefer short sentences.
* “System” messages can be mono blocks.
* Avoid wall-of-text. Break into chips and one-line summaries.

---

## 4) Iconography (Gemini-ready constraints)

**Default style:** stroke-based SVG, consistent with Lucide-like aesthetics.

### 4.1 SVG constraints (hard requirements)

* 24×24 viewBox
* stroke icons, 2px stroke
* round caps and joins
* monochrome (color via CSS)
* no gradients, filters, or embedded raster
* minimal paths; optimize output (no metadata)

### 4.2 Icon families (minimum v1 set)

**Evidence archetypes**

* receipt, log, policy_doc, screenshot, photo, sensor, message, calendar, location, purchase, authority

**Moves**

* inject, flag, rewire, corroborate, cycle, exploit

**State**

* gate_lock, gate_strength, scrutiny_meter, audit, routine_chip, modifier, token_chip, trust_verified, trust_plausible, trust_sketchy

**Meta**

* pack_box, codex_book, archive, weekly_calendar, settings, help

---

## 5) UI components (visual anatomy)

### 5.1 Card anatomy (all evidence/tool cards)

Every card MUST show (in this order):

1. **Title** (human-readable)
2. **Trust Tier Badge** (Verified/Plausible/Sketchy)
3. **Tags** (2–4 chips max visible; overflow allowed)
4. **One-line effect summary** (deterministic description)
5. Optional meta: timestamp/source

**Card sizes**

* Hand card: compact, thumb-friendly
* Detail view: expanded with full tags and explanation

### 5.2 Chips (tags, gates, routines)

* Rounded rectangles, small type
* Gates: stronger border than tags
* Routine chip is always visible, but secondary emphasis

### 5.3 “Stamp” overlays (for drama)

* `VERIFIED`, `AUDITED`, `REDACTED`, `FLAGGED`, `EXCEPTION APPLIED`
* Stamps are used sparingly and only when mechanics warrant.

---

## 6) Artifact template styles (no illustration required)

You will implement these via HTML/CSS templates (optionally with tiny noise textures).

### 6.1 Receipt template

* thermal-paper look: off-white, subtle noise, slight skew
* mono font block with line items
* optional “merchant” header
* stamp overlays for verification/audit

### 6.2 Log template

* console block with timestamps
* monospace, muted background
* highlight key tokens (gate IDs, reason codes)

### 6.3 Policy template

* clean doc section headers (“Section 4.2”)
* crisp borders, minimal styling
* used for legal/policy exploits without courtroom framing

### 6.4 Sensor template

* small sparkline widget (SVG)
* shows “metric” name + tiny trend arrow
* avoid pseudo-scientific realism; keep it stylized

### 6.5 Screenshot/photo template

* looks “user-provided”: rounded image placeholder frame
* Sketchy by default unless corroborated
* subtle compression artifact overlay optional (cosmetic)

### 6.6 Tool template

* appears as “utility module” with icon + effect list
* visually distinct from evidence (more “chip-like”)

---

## 7) AURA visual system (the daemon)

### 7.1 Avatar

* Abstract: orb/waveform/glyph (no human face)
* 3 emotional modes: calm, annoyed, hostile
* Expressed via: shape distortion, glow intensity, glitch frequency

### 7.2 Glitch rules (trigger-based)

Glitch ONLY occurs on:

* audit start/stop
* critical hit / big gate strength drop
* scrutiny hits threshold (Low→Med→High)
* boss modifier activation

Glitch forms (keep subtle):

* chromatic aberration (brief)
* scanline overlay (brief)
* redaction flicker (brief)
* micro-shake (very short)

---

## 8) Motion + haptics + sound (game feel)

### 8.1 Timing principle

**Mechanics resolve instantly.**
Voice/narration can appear delayed; visuals must never block.

### 8.2 Required animations (v1)

* Card “slam” into payload slots
* Gate Strength bar decreases with easing
* Scrutiny meter ticks up with warning pulse
* Stamp overlay appears on pass/fail
* AURA glitch on significant events
* Reward screen: “Access Granted” ticket print animation

### 8.3 Haptic cues (mobile)

* light: card select / chip tap
* medium: successful counter
* heavy: audit triggered / failure

### 8.4 Sound motifs (minimal set)

* soft UI click (baseline)
* paper/receipt rustle (artifact play)
* printer “brrt-chk” (win)
* system alert ping (scrutiny)
* glitch zap (audit / boss)

---

## 9) Copy tone constraints (so visuals stay on-brand)

### 9.1 Avoid

* courtroom terms: “verdict,” “inadmissible,” “objection,” “cross-examination”
* grim dystopia: “surveillance state,” “citizen,” “regime” (unless a special pack)

### 9.2 Prefer

* system/compliance: “Flagged”, “Audit”, “Policy exception”, “Reason code”, “Sync”, “Telemetry”
* smug assistant tone: concise, passive aggressive, “calmly cruel”

---

## 10) Pack theming rules (weekly packs)

Each content pack MAY define:

* accent variant (within palette constraints)
* stamp variant (shape/type)
* a single **pack poster** image (optional)

**Do not** redefine core UI components per pack. Packs should feel themed, not like a new app.

---

## 11) Gemini Asset Agent Deliverables (request format)

### 11.1 Required outputs (v1)

1. **Icon set**: 60 SVG icons following constraints
2. **Stamp set**: 6 stamp SVGs (`VERIFIED`, `AUDITED`, `REDACTED`, `FLAGGED`, `EXCEPTION`, `ACCESS GRANTED`)
3. **Card templates** (HTML/CSS snippets): receipt, log, policy, sensor, screenshot/photo, tool
4. **AURA avatar SVG**: orb/waveform + 3 states (calm/annoyed/hostile)
5. **Micro-widgets**: sparkline SVG, scrutiny meter SVG, gate strength bar styles

### 11.2 Output packaging

* Provide:

  * `icons.json` → `{icon_id, svg}`
  * `stamps.json` → `{stamp_id, svg}`
  * `templates/` → HTML/CSS blocks with class names
  * `aura_avatar.json` → `{state, svg}`

---

## 12) Acceptance criteria (ship-blocking)

1. Cards are readable at a glance on mobile (title, trust, tags, effect).
2. Players can identify **Verified vs Sketchy** instantly without reading text.
3. Scrutiny and Gate Strength changes are obvious via animation/haptics.
4. Glitch effects never impede readability and appear only on defined triggers.
5. Overall look feels like a premium dashboard, not a terminal/cyberpunk UI.

---

## Appendix A — Gemini prompt (copy/paste)

**Prompt:**
“Create a cohesive UI asset kit for a mobile PWA game called ‘Life with AURA’ with a bright premium Apple-y dashboard aesthetic and a hostile compliance daemon vibe. Follow these strict constraints:

SVG icons:

* 24x24 viewBox, stroke-based, 2px stroke, round caps/joins, monochrome, no gradients/filters, optimized.

Deliver:

1. 60 SVG icons as JSON array [{icon_id, svg}] covering evidence types, moves, state indicators, and meta UI.
2. 6 stamp SVGs (‘VERIFIED’, ‘AUDITED’, ‘REDACTED’, ‘FLAGGED’, ‘EXCEPTION APPLIED’, ‘ACCESS GRANTED’) as JSON array [{stamp_id, svg}].
3. HTML/CSS templates (no external libs) for card styles: receipt, log, policy doc, sensor widget (with sparkline), screenshot/photo, tool module.
4. AURA avatar as abstract orb/waveform SVG with three states: calm, annoyed, hostile, plus a ‘glitch overlay’ SVG layer usable as a mask.

Output files:

* icons.json, stamps.json, aura_avatar.json
* templates/receipt.html+css, log.html+css, policy.html+css, sensor.html+css, screenshot.html+css, tool.html+css.”

