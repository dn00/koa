# KOA Casefiles - Session Handoff

**Date:** 2026-02-05
**Spec:** `/home/denk/Code/aura/docs/casefiles/koa-casefiles.md`
**Package:** `/home/denk/Code/aura/packages/koa-casefiles`

---

## TL;DR

Game is playable. **Difficulty improved** - 93.3% pass rate, ~75% of cases hit 3+ contradictions. Gossip syntax fixed, false alibis now implicate culprit.

**Test command:**
```bash
npx tsx src/game.ts --seed 2 --agent-mode   # AP=11, 3 contradictions
npx tsx src/cli.ts --generate 20 -v --tier 2  # Generate and validate
```

---

## What Was Done This Session

### Difficulty Tuning (5 Fixes)

| Fix | File | Change |
|-----|------|--------|
| 1. Culprit testimony | `evidence.ts:197` | Culprit doesn't generate testimony about their own crime |
| 2. Motive sources | `evidence.ts:549` | Only 1 NPC knows real motive (was 3) |
| 3. Contradiction generation | `evidence.ts:588-658` | `deriveContradictoryEvidence()` from twists |
| 4. Log slicing | `actions.ts:155-197` | `checkLogs()` returns max 3 entries per call |
| 5. Red herring testimony | `evidence.ts:250-268` | Activities use `looksLike` for suspicious observations |

### New Game Mechanics

**INTERVIEW split** (`actions.ts`, `game.ts`):
```
INTERVIEW <npc> <window> testimony  # 1 AP - what they saw/heard
INTERVIEW <npc> <window> gossip     # 1 AP - household drama
```

**COMPARE action** (`actions.ts:205-295`):
```
COMPARE <evidence_id_1> <evidence_id_2>  # Free - checks for contradiction
```

**EVIDENCE command** (`game.ts`):
```
EVIDENCE  # Lists collected evidence with IDs
```

### Validator Updates (`validators.ts`)

- `getActionKey()` distinguishes `INTERVIEW_testimony` vs `INTERVIEW_gossip`
- `estimateActionsForEvidence()` accounts for log slicing: `ceil(n/3)` for LOGS
- AP estimates increased from 4-7 to **7-10**

### Motive Gossip Alignment (`evidence.ts:555-566`)

Each motive type now has clear language:
- **revenge:** "has been plotting payback against..."
- **chaos:** "said something about watching it all burn"
- **envy:** "green with envy about..."
- **rivalry:** "always trying to one-up..."

---

## Playtest Results

**Generation stats (50 seeds, tier 2):**
- Pass rate: **93.3%** (target: 90%)
- Cases with 3+ contradictions: **~75%**
- AP range: 7-14 (target: 7-14) ✅

### Issues Fixed This Session

1. ~~**Gossip requires window param**~~ ✅ FIXED - `INTERVIEW bob gossip` now works

2. ~~**False alibi is on wrong person**~~ ✅ FIXED - Culprit now has false alibi, catching it implicates them

3. ~~**Physical evidence reveals WHERE immediately**~~ ✅ FIXED - Now gated:
   - Gossip reveals "item is missing" (WHAT) without location
   - Physical evidence at start/hidden locations requires device logs first
   - Device name check added (e.g., "door_office_garage" unlocks garage searches)

4. ~~**COMPARE wasn't needed**~~ - Now 3+ contradictions per case when twist present, COMPARE is more valuable

---

## What's Implemented vs Spec

| Spec Section | Feature | Status |
|--------------|---------|--------|
| 5 | WHO/WHAT/HOW/WHEN/WHERE/WHY accusation | Done |
| 5 | HOW (method) in accusation | Done |
| 6.2 A | INTERVIEW (testimony) | Done |
| 6.2 A | INTERVIEW (gossip/motive) | Done |
| 6.2 B | SEARCH | Done |
| 6.2 C | LOGS (with slicing) | Done |
| 6.2 D | Cross-reference (COMPARE) | Done |
| 6.3 | Coverage meter | Done |
| 8.6 | Door/motion sensors | Done |
| 8.6 | Camera snapshots | NOT DONE |
| 8.6 | Wifi presence | NOT DONE |
| 13.1 | Solvability validator | Done |
| 13.2 | Anti-anticlimax validator | Done |
| 13.3 | Difficulty validator | Done (but cases still too easy) |
| 14 | Twist rules (false_alibi, unreliable_witness) | Done |
| 15 | Scoring system | NOT DONE |
| 18 | Truth Replay | NOT DONE |

---

## Recommended Next Steps

### Priority 1: Make game harder

1. ~~**Fix gossip syntax**~~ ✅ DONE - `INTERVIEW <npc> gossip` works without window

2. ~~**False alibi should implicate culprit**~~ ✅ DONE - Culprit now has the false alibi, catching it directly implicates them

3. ~~**Gate physical evidence**~~ ✅ DONE - Physical evidence now requires device logs or testimony first

### Priority 2: Add depth

4. ~~**Increase twist probability**~~ ✅ DONE - Changed from 30% to 80%

5. ~~**Add HOW to accusation**~~ ✅ DONE - `ACCUSE <who> <what> <how> <when> <where> <why>` now requires 6 params. MethodId system implemented with 12 methods across 4 crime types.

6. ~~**More contradiction sources**~~ ✅ DONE - False alibis now generate vouching witness + confused presence claims (3+ contradictions per twist)

### Priority 3: Polish

7. ~~**Coverage meter**~~ ✅ DONE - `COVERAGE` command shows evidence for each dimension (WHO/WHAT/HOW/WHEN/WHERE/WHY)
8. **Truth Replay** - Post-solve event playback
9. **Scoring** - Days used, AP spent, contradictions found

---

## Key Files

| File | Purpose |
|------|---------|
| `src/sim.ts` | World generation, crime execution, twist generation |
| `src/evidence.ts` | Converts events → evidence (testimony, physical, motive) |
| `src/actions.ts` | SEARCH, INTERVIEW, LOGS, COMPARE implementations |
| `src/game.ts` | Game loop, command parsing, accusation |
| `src/player.ts` | Player session state (AP, known evidence) |
| `src/validators.ts` | Solvability, anti-anticlimax, difficulty validation |
| `src/types.ts` | TypeScript types |
| `src/activities.ts` | Red herring activity definitions |
| `AGENT_README.md` | Instructions for LLM playtesters |

---

## Test Commands

```bash
# Play recommended seed
npx tsx src/game.ts --seed 35 --agent-mode

# Generate and validate 20 cases
npx tsx src/cli.ts --generate 20 -v --tier 2

# Type check
npx tsc --noEmit

# Analyze specific seed (shows solution - for debugging)
# See scratchpad: /tmp/claude-1000/-home-denk-Code-aura/.../scratchpad/analyze_seed.ts
npx tsx /tmp/.../analyze_seed.ts 35 2
```

---

## Open Questions

1. ~~Should crime window be randomized?~~ ✅ Done - now W2-W5
2. Is 3 AP/day right, or should it be 2 for more tension?
3. Should COMPARE cost 1 AP to make it a tradeoff?
4. ~~How do we ensure catching false alibis is meaningful?~~ ✅ Culprit has the false alibi now

---

## Next Major Initiative: Incident Blueprint System

**Problem:** Current generation is "on rails" - same house, same 5 NPCs, same evidence chain every time. Players will spot the pattern in a week.

**Solution:** See `INCIDENT_SYSTEM_PLAN.md` for full design.

**Key changes:**
- **Topology families** (4 house layouts, not 1)
- **Cast recipes** (15 archetypes, pick 5-6 per case)
- **Incident blueprints** (intent-driven with fallbacks, not scripted)
- **Shenanigan Pack** (comedy separate from truth)
- **Novelty gating** (fingerprint + anti-pattern rejection)

**Reference docs:**
- `/home/denk/Code/aura/docs/casefiles/chat.md` - Incident system design
- `/home/denk/Code/aura/docs/casefiles/rivet/` - RIVET kernel patterns
