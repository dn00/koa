# KOA Casefiles - Invariants

Rules that must NEVER be broken. Check these before any PR.

---

## Solvability Invariants

### INV-1: ≥95% of cases must be solvable (SPEC REQUIREMENT)
- **Spec Section 13.1:** "≥ 95% of published cases pass all hard validators and are solvable"
- A keystone contradiction must exist in discoverable evidence
- At least one evidence path leads to correct WHO, WHAT, WHEN
- Solver test: `npx tsx src/cli.ts --autosolve --generate 500` must pass ≥95%
- **Current:** 94% - BELOW SPEC TARGET

### INV-1.1: Culprit must have catchable contradiction
- Every culprit must have at least ONE of:
  - Self-contradiction (false alibi about location)
  - Crime scene lie (testimony contradicts device log at scene)
  - Device log placing them at scene during crime window
- Signature motive alone is NOT sufficient for solvability

### INV-2: Crime window device logs are NEVER offline
- Difficulty can make other windows sparse
- Crime window must have full device coverage
- Contradiction must be catchable

### INV-3: Culprit motive is always discoverable
- At least one NPC knows gossip about culprit's actual motive
- `crime_awareness` gossip reveals WHAT/WHERE/WHEN
- WHY evidence exists via signature motive phrases

---

## Anti-Anticlimax Invariants

### INV-4: Evidence never directly identifies culprit at crime scene
- No "saw Carol steal the cactus" testimony
- Camera snapshots use vague descriptions ("a figure")
- Device logs at crime time don't include actor name

### INV-5: Witnesses report observables, not conclusions
- "Heard footsteps" not "Someone was sneaking"
- "Saw someone tall" not "It was Bob"
- Let player make the connection

### INV-6: Physical evidence shows state, not attribution
- "Item missing from kitchen" not "Carol took it"
- "Found stashed in garage" not "Hidden by Carol"
- Method hints are allowed (grabbed, smuggled, etc.)

---

## Determinism Invariants

### INV-7: Same seed produces identical case
- RNG seeded from input seed
- Event ordinal reset at simulation start
- Evidence counter reset at derivation start

### INV-8: Event IDs are content-based hashes
- Computed from tick + ordinal + type + fields
- Enables stable references across runs
- `kernel/canonical.ts` handles ID generation

### INV-9: No external state affects generation
- No `Date.now()`, `Math.random()`, or system calls
- All randomness through seeded RNG
- World config is deterministic from seed

---

## Type Safety Invariants

### INV-10: Evidence always cites source events
- `cites: EventId[]` field must be populated
- Empty cites allowed only for lies/inferred data
- Traceability is critical for debugging

### INV-11: WindowId values are validated
- Only W1-W6 are valid
- No undefined windows in evidence
- Type system enforces this

### INV-12: NPCId references must exist in world
- Suspects array matches world.npcs
- No phantom NPC references
- Config validation catches this

---

## Game Balance Invariants

### INV-13: Cases completable within AP budget
- 4 days * 3 AP = 12 base + 2 leads = 14 max
- Average solve requires ~8.6 AP
- At least 5 AP margin for exploration

### INV-14: Lead tokens reward crime-related discovery
- Finding crime scene evidence grants lead
- Max 2 leads prevents runaway advantage
- Leads scope to place/window/npc

### INV-15: Difficulty affects discoverability, not solvability
- Easy/Medium/Hard all have solutions
- Harder modes require more deduction steps
- Fair play contract maintained

---

## Testing Commands

```bash
# Full validation suite (SPEC REQUIREMENT: ≥95% pass)
npx tsx src/cli.ts --autosolve --generate 500

# Check specific seed
npx tsx src/cli.ts --autosolve --generate 1 --seed 42 -v

# Batch seed validation
npx tsx src/validate-seeds.ts --count 100

# Playability check
npx tsx src/cli.ts --playability --generate 50

# Find failing seeds for debugging
npx tsx src/cli.ts --autosolve --generate 100 2>&1 | grep FAILED
```

---

## Before Merging Checklist

- [ ] `npm test` passes (validates 100 seeds)
- [ ] No new TypeScript errors
- [ ] **Solver pass rate >= 95%** (SPEC REQUIREMENT)
- [ ] Playability rate >= 90%
- [ ] New features documented in HANDOFF.md
- [ ] Spec deviations documented in SPEC_ALIGNMENT.md
