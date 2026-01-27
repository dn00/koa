# Plan: Svelte + GSAP Frontend

**Discovery:** [discovery.md](./discovery.md)
**Date:** 2026-01-26
**Status:** in-progress
**Reference Docs:** D16-GAME-FEEL, D27-VISUAL-STYLE

---

## Overview

Build a game-feel-first frontend in Svelte + GSAP. This is not a webapp with animations — it's a **game** that happens to run in a browser. Every interaction must feel satisfying.

### Core Principle from D16

> **Hit first, talk second.** Mechanics feedback must update immediately on action commit. Voice/barks render asynchronously. Every tap has a payoff.

---

## UI Layout (Mobile Portrait)

Balatro-inspired, KOA-centered, terminal aesthetic:

```
┌─────────────────────────────┐
│ ⚙ 🧊 FRIDGE  ▓▓░░ 25/40 T3/6 ●●○○○│  ← header: settings, target, resistance, turn, scrutiny
├─────────────────────────────┤
│            ┌───┐            │
│            │ ◉ │            │  ← KOA avatar (small, centered, 60-80px)
│            └───┘            │
│   [✓ You] [○ Awake] [○ Intent]    │  ← concerns (KOA's doubts)
│                             │
│  ┌─ CHALLENGES ────────────┐│
│  │ 📷 Camera → Identity    ││  ← counter preview (collapsible)
│  └─────────────────────────┘│
├─────────────────────────────┤
│ > KOA: It's 2am. Fridge.    │
│ > INPUT: Face ID            │  ← terminal log (monospace, scrollable)
│ > CHALLENGE: Camera         │
│ > _                         │
├─────────────────────────────┤
│  ╔═══════════════════════╗  │
│  ║ ~12 dmg ✨Stories Align║  │  ← selection preview
│  ║ ⚠️ SUSPICIOUS +1 scrut ║  │     (damage, corroboration, contradiction)
│  ╚═══════════════════════╝  │
│  ┌──┐┌──┐┌▓▓┐┌▓▓┐┌──┐┌──┐  │  ← card hand (▓▓ = selected)
│  └──┘└──┘└──┘└──┘└──┘└──┘  │
│    [ SUBMIT (2) ]   [?]     │  ← submit + why button
│            Daily #42        │  ← fairness seed
└─────────────────────────────┘
```

### Layout Regions

| Region | Height | Contents |
|--------|--------|----------|
| Header | ~5% | Settings, target, resistance bar, turn, scrutiny pips |
| KOA Zone | ~15% | Avatar (centered), concern chips below |
| Challenges | ~10% | Counter preview panel (collapsible) |
| Terminal | ~30% | Monospace log, scrollable, game narration |
| Selection | ~10% | Damage preview, corroboration, contradiction warning |
| Hand | ~25% | 6 cards, horizontal scroll/fan |
| Actions | ~5% | Submit button, why button, daily ID |

### Design Principles

1. **KOA watches from above** — Small but present, mood via glow/color
2. **Terminal is the narrative** — Dialogue-heavy, monospace aesthetic
3. **Cards are your input** — Present evidence to convince KOA
4. **Feedback before action** — Selection preview shows consequences
5. **Never hide critical info** — Resistance, scrutiny, turn always visible

---

## Requirements Expansion

### From R1: Project Foundation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R1.1 | SvelteKit project with TypeScript strict mode | Compiles without errors | 001 |
| R1.2 | GSAP core + Flip plugin installed | Can animate elements | 001 |
| R1.3 | engine-core imports work in Svelte | Types and resolver available | 001 |
| R1.4 | Vitest configured for Svelte components | Tests run in jsdom | 001 |
| R1.5 | CSS custom properties for D27 color tokens | Theme tokens defined | 001 |

### From R2: Game State (Svelte Stores)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R2.1 | Game store with event sourcing | Events append, state derives | 002 |
| R2.2 | Feel store for animation state | Tracks pending animations | 002 |
| R2.3 | Settings store | Counter visibility, haptics, sound | 002 |
| R2.4 | Store subscriptions trigger animations | State change → GSAP timeline | 002 |

### From R3: Timing Budgets (D16 Hard Requirements)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R3.1 | Tap → visual response < 50ms | Highlight/haptic immediate | ALL UI |
| R3.2 | Commit → mechanics update < 120ms | Bars/chips begin animating | 005, 011 |
| R3.3 | Micro animations 80-150ms | Selection, chip pulse | 011 |
| R3.4 | Meso animations 180-280ms | Bar change, card slam | 011, 012 |
| R3.5 | Macro animations 600-1200ms, skippable | Win/loss sequences | 012 |

### From R4: Resistance Bar (Lock Strength)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R4.1 | Decrease: quick snap down + after-bounce | 220ms + 90ms bounce | 007 |
| R4.2 | Increase (penalty): sharp snap up + brief shake | Distinct from decrease | 007 |
| R4.3 | Lock cleared: drain + release shimmer | Visible "break" moment | 007 |
| R4.4 | Haptic: light tick on decrease, medium on increase | Via navigator.vibrate | 007 |

### From R5: Scrutiny Indicator

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R5.1 | Low→Med: warmer color + slow pulse (1.2s) | Visual escalation | 007 |
| R5.2 | Med→High: stronger pulse (0.8s) + hazard overlay | Danger feel | 007 |
| R5.3 | Level change: haptic tick | Distinct from bars | 007 |
| R5.4 | Understandable without reading text | Icon/color sufficient | 007 |

### From R6: Concern Chips (Gates)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R6.1 | Chip slide in from right (180ms) | Entry animation | 007 |
| R6.2 | When addressed: dissolve into particles (200ms) | Satisfying clear | 007 |
| R6.3 | Tap: opens tooltip sheet | Max 2 taps to return | 007 |

### From R7: Card System (Payload Slotting Feel)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R7.1 | Card shows: title, power, proves, claims | All D27 card anatomy | 008 |
| R7.2 | Trust tier badge (Verified/Plausible/Sketchy) | Visual distinction | 008 |
| R7.3 | Tap to select: shrink + snap (160ms) | Slot feel per D16 | 008, 011 |
| R7.4 | Slot glow briefly (120ms) | Feedback on selection | 011 |
| R7.5 | Deselect: pop and return (140ms) | Reversible feel | 011 |
| R7.6 | Haptic: light tick on slot/remove | Tactile confirmation | 011 |
| R7.7 | Refutes badge visible | Shows counter it can refute | 008 |
| R7.8 | **Hover tilt**: Card tilts toward touch/mouse position | Perspective depth | 011 |
| R7.9 | **Hover scale**: 1.05x on hover, lerp 0.25 | Balatro hover | 011 |

### From R8: Hand Carousel

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R8.1 | Horizontal scroll with snap | Touch-friendly | 009 |
| R8.2 | Card deal animation: spring from bottom | Entry feel | 011 |
| R8.3 | Slight random rotation on deal (±5°) | Natural feel | 011 |
| R8.4 | Max 3 cards selectable | 4th attempt denied softly | 009 |
| R8.5 | **Staggered deal**: 80ms delay between cards | Balatro cascade | 011 |
| R8.6 | **Deal ease**: back.out(1.7) overshoot | Spring feel | 011 |
| R8.7 | **Fan arrangement**: Cards overlap, spread on focus | Hand-like display | 009 |

### From R9: Submit Button (Commit Feel)

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R9.1 | Disabled: muted, shows "why" on tap | Clear affordance | 010 |
| R9.2 | Ready: subtle breathing glow (2s cycle) | Invites action | 010 |
| R9.3 | Press: slam animation + immediate mechanics | T=0 response | 010, 012 |
| R9.4 | Error: button shake (90ms) + soft deny tick | Not harsh buzzer | 010 |

### From R10: Submit & Resolve Animation Sequence

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R10.1 | T=0: button depress + haptic + SFX | Immediate feedback | 012 |
| R10.2 | T=0-120ms: mechanics bars begin moving | D16 timing budget | 012 |
| R10.3 | Cards fly to timeline | GSAP Flip plugin | 012 |
| R10.4 | Damage numbers count up | Counter animation | 012 |
| R10.5 | Concern chips react (flash/dissolve) | State change visible | 012 |
| R10.6 | **Count-up suspense**: Don't show final damage instantly | Balatro anticipation | 012 |
| R10.7 | **Threshold break**: Visual "fire"/glow when resistance hits 0 | Balatro score threshold | 012 |
| R10.8 | **Card-by-card resolve**: Each card contributes visibly in sequence | Balatro hand scoring | 012 |

### From R11: Win/Loss Macro Sequences

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R11.1 | Win (900-1200ms): "ACCESS GRANTED" ticket | Receipt-printer animation | 006, 012 |
| R11.2 | Loss (700-1000ms): "ACCESS DENIED" + reason | Failure chip visible | 006, 012 |
| R11.3 | Skippable after 400ms | Tap to skip | 012 |
| R11.4 | Never punish with long unskippable animation | Respect player time | 012 |

### From R12: KOA Avatar (AURA) — Only Continuous Animation

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R12.1 | Abstract orb/waveform, not human face | D27 avatar spec | 015 |
| R12.2 | 3 states: calm, annoyed, hostile | Mood mapping | 015 |
| R12.3 | Glitch on: audit, critical hit, scrutiny threshold | Brief chromatic aberration | 015 |
| R12.4 | Glitch never impedes readability | Spice not meal | 015 |
| R12.5 | **Idle breathing/pulse**: Continuous subtle animation | Only element always moving | 015 |
| R12.6 | **Pause when hidden**: Respect Page Visibility API | Battery-friendly | 015 |

### From R13: Sound System

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R13.1 | SFX IDs as constants (D16 §4.1) | Stable references | 016 |
| R13.2 | Separate volume channels: Voice, SFX, Ambient | User adjustable | 016 |
| R13.3 | Min 150ms between identical SFX | Avoid spam | 016 |
| R13.4 | Key sounds: tap, slot, deny, confirm, hit_down, hit_up, release | Core set | 016 |

### From R14: Haptics

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R14.1 | Patterns: tick_light, tick_medium, pulse_success, pulse_warning | D16 §5.1 | 016 |
| R14.2 | Togglable in settings | User preference | 016 |
| R14.3 | Respect OS-level haptic disable | navigator.vibrate check | 016 |
| R14.4 | No haptics on scroll/carousel movement | Avoid annoyance | 009 |

### From R16: Performance & Battery

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R16.1 | Only animate transform + opacity | No layout thrashing | ALL |
| R16.2 | Page Visibility API pauses animations | CPU idle when tab hidden | 016, 015 |
| R16.3 | prefers-reduced-motion respected | KOA static, interactions simplified | 015, 016 |
| R16.4 | will-change removed after animation | GPU memory freed | 011, 012 |
| R16.5 | Time-based animation (not frame-based) | Works at 30/60/120Hz | ALL |
| R16.6 | < 8ms JS per frame budget | No jank on Pixel 4a | ALL |

### From R15: Accessibility

| ID | Requirement | Verification | Tasks |
|----|-------------|--------------|-------|
| R15.1 | Reduce Motion: shorten/remove shake, particles→fades | prefers-reduced-motion | ALL |
| R15.2 | Color never sole indicator | Icons/patterns for states | 007, 008 |
| R15.3 | No rapid flashing (pulses > 0.6s) | Photosensitivity safe | ALL |

---

## Phases

### Phase 1: Foundation
**Goal:** Project scaffold, stores, theme tokens

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 001 | SvelteKit + GSAP Project Setup | ready | - | M |
| 002 | Svelte Stores (game, feel, settings) | ready | 001 | M |
| 003 | Service Adapters (persistence, pack-loader) | ready | 001 | S |

### Phase 2: Feel System
**Goal:** Animation utilities, haptics, sound stubs

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 016 | Feel System (haptics, sound IDs, timing) | backlog | 002 | M |

### Phase 3: Game Components
**Goal:** All UI components with full game feel

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 007 | HUD: Resistance + Scrutiny + Concerns + Turns | backlog | 002, 016 | M |
| 008 | Evidence Card (D27 anatomy + selection states) | backlog | 002, 016 | M |
| 009 | Hand Carousel (scroll, snap, max selection) | backlog | 008 | M |
| 010 | Submit Button (states, glow, deny) | backlog | 002, 016 | S |
| 011 | Card Animations (deal, select, slot, deselect) | backlog | 008, 016 | M |
| 013 | Counter Panel (visibility modes) | backlog | 002 | S |

### Phase 4: Screens & Flows
**Goal:** Playable game with full animation

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 004 | Home Screen | backlog | 002 | S |
| 005 | Run Screen (layout, orchestration) | backlog | 007, 009, 010, 013 | M |
| 012 | Submit & Resolve Sequence | backlog | 011, 016 | M |
| 006 | Result Screen (win/loss macro) | backlog | 012 | M |

### Phase 5: Polish
**Goal:** PWA, avatar, final touches

| Task | Name | Status | Depends On | Complexity |
|------|------|--------|------------|------------|
| 014 | PWA Support | backlog | 003 | M |
| 015 | KOA Avatar (orb, 3 states, glitch) | backlog | 016 | M |

---

## Dependency Graph

```
001 (Setup)
 ├── 002 (Stores)
 │    ├── 016 (Feel System) ──┬── 007 (HUD) ────────────────────┐
 │    │                       ├── 008 (Card) ── 009 (Hand) ─────┤
 │    │                       ├── 010 (Submit) ─────────────────┼── 005 (Run)
 │    │                       ├── 011 (Card Anims) ── 012 (Submit Seq)
 │    │                       └── 015 (KOA)                     │
 │    ├── 004 (Home)                                            │
 │    └── 013 (Counter) ────────────────────────────────────────┘
 │
 └── 003 (Services) ── 014 (PWA)

012 (Submit Sequence) ── 006 (Result)
```

---

## Batch Analysis

| Batch | Tasks | Blocked By | Notes |
|-------|-------|------------|-------|
| 1 | 001 | - | Foundation, start immediately |
| 2 | 002, 003 | Batch 1 | Stores + services, parallel |
| 3 | 016 | Batch 2 | Feel system before components |
| 4 | 004, 007, 008, 010, 013, 017, 018 | Batch 3 | Components with feel integration |
| 5 | 009, 011 | Batch 4 | Hand + card animations |
| 6 | 005, 012, 014, 015 | Batch 5 | Screens + submit sequence |
| 7 | 006 | Batch 6 | Result screen (needs submit seq) |

---

## Task Summary

| ID | Name | Complexity | Status | Batch |
|----|------|------------|--------|-------|
| 001 | SvelteKit + GSAP Project Setup | M | ready | 1 |
| 002 | Svelte Stores | M | ready | 2 |
| 003 | Service Adapters | S | ready | 2 |
| 004 | Home Screen | S | backlog | 4 |
| 005 | Run Screen | M | done | 6 |
| 006 | Result Screen | M | backlog | 7 |
| 007 | HUD Components | M | backlog | 4 |
| 008 | Evidence Card | M | backlog | 4 |
| 009 | Hand Carousel | M | backlog | 5 |
| 010 | Submit Button | S | backlog | 4 |
| 011 | Card Animations | M | backlog | 5 |
| 012 | Submit & Resolve Sequence | M | done | 6 |
| 013 | Counter Panel | S | backlog | 4 |
| 014 | PWA Support | M | done | 6 |
| 015 | KOA Avatar | M | done | 6 |
| 016 | Feel System | M | backlog | 3 |
| 017 | Terminal Log | M | backlog | 4 |
| 018 | Selection Preview | S | backlog | 4 |

**Total:** 18 tasks in 7 batches
**Estimated Tests:** ~100+ tests

---

## Performance & Battery Optimization

### The Reality

Balatro-style "always animating" cards look amazing but have battery implications on mobile. Key insight from research:

> **What you animate matters more than how you animate it.**

Battery drain comes from:
1. Animating layout properties (top, left, width, height) → triggers reflow
2. Too many GPU layers → memory overhead
3. Continuous animations preventing CPU low-power mode
4. Running animations in background tabs

### Mandatory Rules

| Rule | Why | Implementation |
|------|-----|----------------|
| **Only transform + opacity** | GPU-accelerated, no reflow | All GSAP tweens target these only |
| **Time-based, not frame-based** | Handles 30/60/120Hz displays | Use GSAP's built-in delta time |
| **Page Visibility API** | Stop animations when tab hidden | Pause GSAP global timeline |
| **will-change sparingly** | GPU layers cost memory | Only on actively animating elements |
| **Remove will-change after** | Free GPU resources | Reset to `auto` when animation completes |

### Continuous Animation Budget

Only **KOA avatar** has continuous animation (breathing/pulse). Everything else is interaction-driven:

| Element | Animation Type | Battery Impact |
|---------|---------------|----------------|
| KOA orb | Continuous pulse | Low (single element, transform only) |
| Cards | On hover/select only | Zero when idle |
| Bars | On state change only | Zero when idle |
| Chips | On state change only | Zero when idle |

### Implementation

```typescript
// feelStore.ts
interface FeelState {
  reducedMotion: boolean;  // prefers-reduced-motion
  isBackgrounded: boolean; // Page Visibility API
}

// Page Visibility — pause KOA and any active animations
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});

// Reduced motion — KOA still visible but static
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  feelStore.set({ reducedMotion: true });
}
```

### iOS Considerations

iOS throttles requestAnimationFrame to 30fps in:
- Low Power Mode
- Cross-origin iframes
- Background tabs

GSAP handles this gracefully (time-based), but animations will feel slower. Test on actual iOS devices with Low Power Mode enabled.

### Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| JS execution per frame | < 8ms | Chrome DevTools Performance |
| GPU memory | < 50MB layers | `about:gpu` / Safari Layers |
| Idle CPU when paused | < 1% | Task Manager |
| Battery per 10min play | < 3% | Real device testing |

### Testing Protocol

1. **Chrome DevTools Performance** — Record gameplay, check for long frames
2. **Safari Web Inspector Layers** — Verify not too many composite layers
3. **Pixel 4a + Low Power Mode** — Worst-case Android
4. **iPhone SE 2 + Low Power Mode** — Worst-case iOS
5. **15-minute play session** — Monitor battery drain and heat

### References

- [CSS GPU Animation: Doing It Right](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
- [When Browsers Throttle requestAnimationFrame](https://motion.dev/blog/when-browsers-throttle-requestanimationframe)
- [MDN CSS/JS Animation Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GSAP SSR issues | SPA mode, disable SSR |
| 60fps on low-end devices | Performance testing on Pixel 4a early |
| Haptic API inconsistency | Feature detection, graceful fallback |
| Sound loading latency | Preload critical sounds, SFX sprite sheet |
| iOS 30fps throttling | Time-based animations, test in Low Power Mode |
| GPU memory from too many layers | Limit will-change, audit composite layers |

---

## Game Feel Checklist (from D16)

Before shipping each component:
- [ ] Tap → response < 50ms?
- [ ] State change → animation < 120ms?
- [ ] Animation timing matches D16 spec?
- [ ] Haptic pattern correct?
- [ ] Sound ID referenced (not hardcoded)?
- [ ] Reduced motion fallback exists?
- [ ] No flashing faster than 0.6s?

---

## Balatro-Inspired Game Feel

Balatro is widely praised for its "juice" — the satisfying animations that make you want to play even without the gameplay. Key techniques to adopt:

### Card Hover/Selection Feel

From [Balatro Card Hover shader](https://godotshaders.com/shader/balatro-card-hover/):

```
// Continuous idle animation (cards are never static)
rotation_oscillation = sin(TIME) * 0.003625  // Subtle wobble
horizontal_drift = cos(TIME + 180) * 0.875   // Gentle sway
vertical_drift = sin(TIME + 360) * 0.875

// Hover state
hover_scale = Vector2(1.05, 1.05)  // 5% scale up
lerp_speed = 0.25                   // Smooth interpolation
rotation_damping = 0.8              // Responsive but not twitchy

// Mouse tracking (perspective tilt)
max_tilt_velocity = ±0.3 horizontal, ±0.25 vertical
```

### Score Display Magic

> "The game cleverly doesn't tell the player the final point value... leaving the player to watch with bated breath as the score rapidly grows. When a single hand surpasses the total, the score display lights on fire."

Apply to resistance bar: Don't instantly show final damage. Count up with acceleration, then "break" effect when threshold crossed.

### Menus & Transitions

> "The menus of Balatro are snappy, and small animations are present throughout to give its simple art style weight and impact."

Every state change needs a micro-animation. Nothing pops in/out instantly.

### Easing Principles

From [game juice research](https://jasont.co/juice-techniques/):

- **Never use linear easing** — Nothing in reality moves linearly
- **Exponential for snappy** — `ease: "power3.out"` for quick responses
- **Back for overshoot** — `ease: "back.out(1.7)"` for spring/bounce
- **Elastic sparingly** — `ease: "elastic.out"` only for celebrations

### GSAP Implementation Targets

| Interaction | GSAP Timeline | Reference |
|-------------|---------------|-----------|
| Card hover | scale 1.05, subtle rotateY from mouse | Balatro tilt |
| Card select | scale 0.92 → 1.02, ease back.out | D16 slot feel |
| Card deal | y: 100 → 0, rotation random ±5°, stagger 0.08s | Balatro deal |
| Damage number | textContent countup, scale pulse on hit | Balatro score |
| Bar decrease | width snap, overshoot bounce | D16 spec |
| Win state | scale 1 → 1.1 → 1, particle burst, "fire" effect | Balatro threshold |
| KOA idle | Infinite pulse, subtle scale/glow oscillation | Only continuous anim |

### Implementation Notes

1. **Cards are static until interacted** — No idle wobble (battery-friendly)
2. **Mouse/touch affects perspective** — Cards tilt toward interaction point on hover
3. **Anticipation before action** — Brief scale down before scale up
4. **Overshoot on arrival** — Spring past target, settle back
5. **Stagger everything** — Cards deal one by one, chips animate sequentially
6. **KOA is the only continuous animation** — Orb/waveform breathes/pulses always

### Additional References

- [Mix and Jam Balatro-Feel](https://github.com/mixandjam/Balatro-Feel) — Unity recreation with DOTween
- [80.lv Balatro breakdown](https://80.lv/articles/balatro-s-card-movements-shaders-recreated-in-unity) — Technical analysis
- [Game Juice Techniques](https://jasont.co/juice-techniques/) — Easing, particles, screen shake
- [CSS Animations for Game Juice](https://mccormick.cx/news/entries/css-animations-for-game-juice) — Browser-specific techniques

---

## References

- `docs/D16-GAME-FEEL-ANIMATION-HAPTICS-SFX.md` — Timing budgets, feel specs
- `docs/D27-VISUAL-STYLE-SPEC.md` — Color tokens, card anatomy, AURA avatar
- `docs/D14-UX-WIREFRAME-SPEC-MOBILE-FIRST.md` — Screen layouts
- `_process/project/INVARIANTS.md` — Non-negotiable rules
