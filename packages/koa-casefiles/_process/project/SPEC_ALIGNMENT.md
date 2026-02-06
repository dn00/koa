# KOA Casefiles - Spec Alignment

**Spec Document:** `/home/denk/Code/aura/docs/casefiles/koa-casefiles.md`
**Spec Version:** Frozen Spec v1.0
**Last Reviewed:** 2026-02-05

---

## Summary

The core game loop is **well-aligned** with the spec. Key deviations are intentional (playtest-driven). Main gaps are in publishing infrastructure and some UI features.

| Category | Alignment |
|----------|-----------|
| Core mechanics | 95% |
| Data model | 90% |
| Validators | 85% |
| Publishing | 20% |
| UI features | 60% |

---

## Fully Aligned

### Design Pillars (Section 2)

| Pillar | Spec | Implementation | Status |
|--------|------|----------------|--------|
| P1 Deterministic truth | Same seed → same case | `createRng(seed)`, content-based event IDs | ✅ |
| P2 Bounded discovery | AP-gated actions | 3 AP/day, commands cost AP | ✅ |
| P3 Inference over exposition | No single clue solves | Evidence requires synthesis | ✅ |
| P4 Anti-anticlimax | Observables only | `deriveTestimony()` guards | ✅ |
| P5 Shareable completion | Non-spoiler share | `generateShareArtifact()` | ✅ |

### Answer Format (Section 5)

| Field | Spec | Implementation | Status |
|-------|------|----------------|--------|
| WHO | culprit ID | Required | ✅ |
| WHAT | crime type | Required | ✅ |
| HOW | method | Optional bonus | ✅ |
| WHY | motive | Optional bonus | ✅ |
| WHEN | time window | Required | ✅ |
| WHERE | location | Optional bonus | ✅ |

### Actions (Section 6)

| Action | Spec | Implementation | Status |
|--------|------|----------------|--------|
| Interview | 1 AP, structured questions | `INTERVIEW <npc> <window> testimony` | ✅ (simplified) |
| Search | 1 AP, location + window | `SEARCH <place> <window>` | ✅ |
| Device Logs | 1 AP, device + window | `LOGS <device> <window>` | ✅ |
| Cross-Reference | 1 AP | `COMPARE` (free) | ⚠️ Deviated |
| Deduction Board | free | Not implemented | ❌ |
| Accuse | ends run | `ACCUSE` command | ✅ |

### Crime Types (Section 7)

| Type | Spec | Implementation | Status |
|------|------|----------------|--------|
| Theft | ✓ | `theft` + blueprints | ✅ |
| Sabotage | ✓ | `sabotage` + blueprints | ✅ |
| Disappearance | ✓ | `disappearance` | ✅ |
| Prank | (implied) | `prank` + blueprints | ✅ |
| Fraud/Impersonation | ✓ | Not implemented | ❌ |
| Mild Assault | optional | Not implemented | ❌ |

### Emergent Systems (Section 8)

| System | Spec | Implementation | Status |
|--------|------|----------------|--------|
| Space + access | Discrete nodes, doors | `world.places`, `world.devices` | ✅ |
| Time + schedules | Windows, NPC routines | `WINDOWS`, `npc.schedule` | ✅ |
| Perception | Observables, uncertainty | `TestimonyEvidence.confidence` | ✅ |
| Objects | Pick up, hide, swap | `ITEM_TAKEN`, `ITEM_HIDDEN` | ✅ |
| Motive | Relationships, needs | `gossip/`, emergent motives | ✅ |
| Devices | Door, motion, camera | `door_sensor`, `motion_sensor` | ✅ (partial) |

### Validators (Section 13)

| Validator | Spec | Implementation | Status |
|-----------|------|----------------|--------|
| Solvability | ≥2 chains for WHO | `findKeystonePair()` | ✅ |
| Anti-anticlimax | No high-confidence ID | Guards in `deriveTestimony()` | ✅ |
| Difficulty band | AP within target | `DifficultyValidation` | ✅ |

### Data Model (Section 17)

| Schema | Spec | Implementation | Status |
|--------|------|----------------|--------|
| EventRecord | tick, window, type, actor, target | `SimEvent` | ✅ |
| EvidenceItem | kind, cites EventIds | `EvidenceItem` union type | ✅ |
| CaseConfig | culprit, method, motive, window | `CaseConfig` | ✅ |
| CaseBundle | Full publish format | Not implemented | ❌ |

---

## Intentional Deviations

Changes made after playtesting, with rationale:

### Max Days: 6 → 4

**Spec:** 6 days max, 18 AP total
**Implementation:** 4 days max, 12 AP base + 2 leads = 14 AP

**Rationale:**
- 6 days felt too loose; players solved by day 3-4 anyway
- Tighter budget creates tension
- Lead tokens add tactical reward for good investigation

### Cross-Reference: 1 AP → Free

**Spec:** Cross-Reference costs 1 AP
**Implementation:** COMPARE is free

**Rationale:**
- Players weren't using COMPARE when it cost AP
- Free COMPARE encourages contradiction hunting (core fun)
- Spec's coverage meter replaces AP-gating as feedback

### Added: Lead Tokens

**Spec:** Not specified
**Implementation:** Max 2 lead tokens, each grants 1 free action

**Rationale:**
- Rewards finding crime-related evidence
- Extends effective AP without removing tension
- Creates "hot pursuit" moments

### Added: SUGGEST Command

**Spec:** Optional hint (once/run) mentions conflict count
**Implementation:** SUGGEST points to specific keystone pair

**Rationale:**
- More actionable than "you have 2 conflicts"
- Still requires player to execute COMPARE
- One-time use preserves challenge

### Added Then Removed: Cover-Up

**Spec:** Not specified
**Implementation:** Culprit removes evidence after day 2 (DISABLED)

**Rationale for removal:**
- Added stress without adding fun
- Players felt punished for exploring
- Tuner showed 0 effect on playability

---

## Not Yet Implemented

### Priority 1 (Required for v1)

| Feature | Spec Section | Gap |
|---------|--------------|-----|
| **95% solvability** | 13.1 | Currently 94%, need to fix 2% "hard" cases |
| **Daily seed publishing** | 11.1 | No server-side HMAC seed generation |
| **CaseBundle format** | 17.2 | Has CaseConfig but not full bundle |

### Priority 2 (Should Have)

| Feature | Spec Section | Gap |
|---------|--------------|-----|
| **Structured interview questions** | 6.2.A | Only testimony/gossip, not 4 question types |
| **4-tier difficulty system** | 14 | Has easy/medium/hard, not 4 tiers |
| **Archive/replay system** | 11.2 | Can replay by seed, no archive UI |
| **Wifi presence device** | 8.6 | Not implemented |

### Priority 3 (Nice to Have)

| Feature | Spec Section | Gap |
|---------|--------------|-----|
| **Deduction Board** | 6.2.E | No pin/link UI |
| **Location Grid/Map** | 10.2 | CLI-only |
| **Evidence decay** | 6.2.B | Older windows not less precise |
| **Camera visual evidence** | 8.6 | Just text snapshots |
| **Fraud/Impersonation crime** | 7 | Not in blueprints |

### Priority 4 (Future)

| Feature | Spec Section | Gap |
|---------|--------------|-----|
| **Coffee Boost** | 6.1 | +1 AP once/run |
| **Speaker/thermostat devices** | 8.6 | Misdirection devices |
| **Mild Assault crime** | 7 | Optional violence |
| **Telemetry** | 21 | No tracking infrastructure |
| **Monetization** | 20 | No payment integration |

---

## Spec Metrics Comparison

| Metric | Spec Target | Actual | Status |
|--------|-------------|--------|--------|
| Solvable cases | ≥95% | 94% | ⚠️ Below target |
| Suspects | 4-7 (default 5) | 5 | ✅ |
| Windows | 4-8 (default 6) | 6 | ✅ |
| AP/day | 2-4 (default 3) | 3 | ✅ |
| Max days | 4-7 (default 6) | 4 | ⚠️ Deviated |
| Session length | 6-12 min | ~8-12 min | ✅ |
| Contradiction count | 3-7 | 4-8 | ✅ |

---

## Action Items

### Must Fix Before v1

1. **Raise solvability to ≥95%**
   - Guarantee culprit always has catchable contradiction
   - Option: Force `false_alibi` twist on all cases
   - Test: `npx tsx src/cli.ts --autosolve --generate 500`

2. **Implement CaseBundle format**
   - Add `version`, `dailyId`, `rulesetVersion` fields
   - Add `ValidatorReport` to bundle
   - Add encrypted `solution` field

3. **Daily seed generation**
   - Server-side: `dailySeed = HMAC(secret, dailyId + rulesetVersion)`
   - Client receives seed, not secret

### Should Fix Before Launch

4. **Structured interview questions**
   - Add: "Where were you during [Window]?"
   - Add: "What did you notice about [Person]?"
   - Add: "Who did you speak with?"

5. **4-tier difficulty system**
   - Map easy/medium/hard to tiers 1-3
   - Add tier 4 (expert) with full twist rules

---

## References

- **Spec:** `/home/denk/Code/aura/docs/casefiles/koa-casefiles.md`
- **HANDOFF:** `/home/denk/Code/aura/packages/koa-casefiles/HANDOFF.md`
- **VARIETY design:** `/home/denk/Code/aura/packages/koa-casefiles/VARIETY.md`
