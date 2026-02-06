# Feature: Structured Interview Questions

**Status:** idea
**Priority:** P1
**Spec Reference:** Section 6.2.A

---

## Goal

Replace generic `INTERVIEW <npc> <window> testimony` with structured question types that feel more like actual interrogation.

---

## Current State

```
> INTERVIEW alice W3 testimony
Alice says: "I heard Bob open a door during W3"

> INTERVIEW alice gossip
Alice says: "Carol's been acting jealous lately..."
```

Two modes: testimony (what they saw/heard) and gossip (relationships/motives).

---

## Spec: 4 Question Types

### 1. Whereabouts
"Where were you during [Window]?"
```
> INTERVIEW alice whereabouts W3
Alice: "I was in the kitchen during W3"
```
Returns: Their claimed location (may be a lie if culprit)

### 2. Observations
"What did you notice during [Window]?"
```
> INTERVIEW alice observations W3
Alice: "I heard someone open the back door. Saw Bob walk through."
```
Returns: What they witnessed (current testimony behavior)

### 3. Relationships
"What do you think of [Person]?"
```
> INTERVIEW alice relationships bob
Alice: "Bob? He still owes me for the pizza incident. We're not exactly friends."
```
Returns: Relationship info (currently in gossip)

### 4. Suspicions
"Who do you think did it?"
```
> INTERVIEW alice suspicions
Alice: "If you ask me, Carol's been acting weird. She had that look in her eye."
```
Returns: NPC's theory (red herring potential, misdirection)

---

## Design Questions

### Should each question type cost AP?
**Current:** 1 AP for testimony, 1 AP for gossip (2 total per NPC)
**Option A:** 1 AP per question type (4 AP to fully interview one NPC) - too expensive
**Option B:** 1 AP gets you one question of your choice
**Option C:** 1 AP unlocks all questions for that NPC+window

Recommend **Option B** - forces strategic questioning

### How does this change evidence model?
- `whereabouts` → PresenceEvidence (self-reported)
- `observations` → TestimonyEvidence (current)
- `relationships` → MotiveEvidence (current gossip)
- `suspicions` → New type? Or just flavor text?

### Do NPCs have opinions on each other?
Need to generate NPC theories about who did it:
```typescript
interface NPCSuspicion {
  npc: NPCId;
  suspects: NPCId;     // Who they think did it
  confidence: number;  // How sure they are
  reason: string;      // "They were acting weird"
}
```

---

## Command Changes

```
# Current
INTERVIEW <npc> <window> testimony
INTERVIEW <npc> gossip

# Proposed
INTERVIEW <npc> whereabouts <window>    # 1 AP
INTERVIEW <npc> observations <window>   # 1 AP
INTERVIEW <npc> relationships <person>  # 1 AP
INTERVIEW <npc> suspicions              # 1 AP
```

Or shorthand:
```
ASK <npc> WHERE <window>
ASK <npc> WHAT <window>
ASK <npc> ABOUT <person>
ASK <npc> WHO
```

---

## Evidence Implications

### Whereabouts creates self-reported presence
```typescript
// When Alice says "I was in kitchen during W3"
evidence.push({
  kind: 'presence',
  npc: 'alice',
  window: 'W3',
  place: 'kitchen',
  cites: [],  // Self-reported, no backing event
  selfReported: true,  // NEW FIELD
});
```

This is how false alibis get into evidence - culprit's whereabouts claim.

### Suspicions as red herrings
NPCs pointing fingers at each other:
- Creates noise
- Can mislead player
- But also: if 3/4 NPCs suspect Carol, that's a signal

---

## TODO

1. [ ] Design command syntax (ASK vs INTERVIEW)
2. [ ] Add `selfReported` field to PresenceEvidence
3. [ ] Generate NPC suspicions during simulation
4. [ ] Update CLI command parser
5. [ ] Update help text
6. [ ] Balance AP cost (playtest needed)

---

## Dependencies

- [ ] Solvability guarantee (Feature 001) - whereabouts affects contradiction detection
- [ ] Need to ensure false alibis still work with new system

---

## Notes

- This is mostly UX polish - current system works
- Could ship v1 without this, add later
- "Suspicions" is the most novel addition - NPCs as unreliable narrators
