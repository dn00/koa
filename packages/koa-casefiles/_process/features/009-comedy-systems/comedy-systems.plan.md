# Plan: Comedy Systems (Feature 009)

**Discovery:** Inline (INCIDENT_SYSTEM_PLAN.md + codebase exploration)
**Status:** done

---

## Task Summary

| ID | Name | Complexity | Status |
|----|------|------------|--------|
| 001 | NPC archetypeId threading | S | done |
| 002 | KOA personality modes | M | done |
| 003 | Archetype-driven testimony | M | done |
| 004 | Comedy validation gate | S | done |
| 005 | Petty escalation events | M | done |

---

## Task 001: NPC archetypeId Threading

**Implementation Notes:**
- Added optional `archetypeId?: string` to NPC interface in types.ts
- Added archetypeId to NPC_TEMPLATES in world.ts (legacy path)
- Added `archetypeId: cast.archetypes[template.id]` in createWorldFromConfig
- createWorld and createWorldWithTopology get it via template spread
- 5 tests in tests/comedy-foundation.test.ts

## Task 002: KOA Personality Modes

**Implementation Notes:**
- Added `koaMode?: string` to Bark and BarkContext interfaces in barks.ts
- Soft mode filter in selectBark: prefer mode-specific, fall back to universal
- Exported loadBarkPack for test access
- Added KOA_MODE_SNARK pools + setKoaMode/getKoaMode/resetKoaMode to koa-voice.ts
- Replaced all pick(KOA_SNARK.x) with pickFromPool('x') for mode-awareness
- Added 20 mode-specific barks to barks.json (5 per mode)
- 8 tests in tests/comedy-koa-modes.test.ts

## Task 003: Archetype-Driven Testimony

**Implementation Notes:**
- Added getArchetypeForNPC(), modulateConfidence(), isDistracted() helpers to evidence.ts
- Confidence modulation: factor = 0.4 + (reliability / 100) * 1.2, bounded [0.2, 0.9]
- Distractibility gating: skip testimony when NPC in peakDistractedWindows and hash check passes
- Comedy flavor observables: ~30% deterministic chance adds trait-based prefix to observable text
- Embarrassment vagueness: low-threshold NPCs doing embarrassing activities → "was... busy. Don't ask."
- Anti-anticlimax cap still applied AFTER modulation (crime window culprit ≤ 0.5)
- Applied to both event-driven and presence-sighting testimony loops
- 9 tests in tests/comedy-testimony.test.ts

## Task 004: Comedy Validation Gate

**Implementation Notes:**
- Added validateComedy() to validators.ts: checks suspiciousActs >= 1, funnyReason populated, evidence modalities >= 2
- Added comedy?: ValidationResult to CaseValidation interface
- Wired into validateCase return
- Added hard gate in daily/finder.ts after funness gate
- 8 tests in tests/comedy-validation.test.ts

## Task 005: Petty Escalation Events

**Implementation Notes:**
- Added 3 escalation activity types to activities.ts: rearranging_stuff, passive_aggressive_note, petty_theft
- Added simulateEscalations() to sim.ts: finds NPCs with grudge/rivalry intensity >= 6, generates ACTIVITY_STARTED events in aftermath windows
- Culprit excluded from retaliator pool
- Rate limited: max 1 on tier 1-2, max 2 on tier 3-4
- Wired into both legacy simulate() and simulateWithBlueprints() paths
- Updated suspicious acts harvest to also check ESCALATION_ACTIVITIES
- Updated evidence.ts deriveTestimony to recognize escalation activity types
- 11 tests in tests/comedy-escalation.test.ts
