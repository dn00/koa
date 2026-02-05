# KOA Casefiles: Cozy Mystery Detective

A procedurally generated detective game where you investigate household shenanigans. Someone has committed a minor crime - theft, prank, or sabotage. Your job is to figure out **WHO** did it, **WHAT** they did, **HOW**, **WHEN**, **WHERE**, and **WHY**.

## QUICK START

```bash
cd /home/denk/Code/aura/packages/koa-casefiles
npx tsx src/game.ts --seed 42 --agent-mode --reset
```

---

## HOW TO PLAY

### Game State
- **4 days** to solve the case
- **3 Action Points (AP)** per day = 12 AP base
- **Lead tokens** (max 2) give free follow-up actions = up to 14 AP total

### Investigation Commands (cost 1 AP each)

| Command | What You Learn |
|---------|----------------|
| `SEARCH <room> <window>` | Physical evidence (e.g., `SEARCH living W3`) |
| `INTERVIEW <npc> <window> testimony` | What they saw/heard (e.g., `INTERVIEW alice W3 testimony`) |
| `INTERVIEW <npc> gossip` | Rumors, motives, what happened (e.g., `INTERVIEW bob gossip`) |
| `LOGS <device> <window>` | Device activity (e.g., `LOGS door W3`) |

### Free Commands (0 AP)

| Command | What It Does |
|---------|--------------|
| `EVIDENCE` | List all collected evidence with IDs |
| `COMPARE <id1> <id2>` | Check if two pieces contradict |
| `STATUS` | Current day, AP, suspects |
| `WHEREABOUTS <npc>` | Where someone was each window |
| `SUGGEST` | KOA hints at a key contradiction (once per game) |
| `LEADS` | Show your lead tokens (0-2) |
| `NEXT_DAY` | Rest and restore AP |
| `HELP` | Command reference |

### Windows (Time Periods)

| Window | Time |
|--------|------|
| W1 | 4:00pm - 5:30pm |
| W2 | 5:30pm - 7:00pm |
| W3 | 7:00pm - 8:30pm |
| W4 | 8:30pm - 10:00pm |
| W5 | 10:00pm - 11:30pm |
| W6 | 11:30pm - 1:00am |

### Valid Parameters

- **Rooms:** `living`, `kitchen`, `bedroom`, `office`, `garage`
- **Devices:** `door`, `motion`
- **NPCs:** `alice`, `bob`, `carol`, `dan`, `eve`

---

## THE ACCUSATION

When ready, run `ACCUSE` and answer all 6 parts:

| Part | What to Answer | How to Discover |
|------|----------------|-----------------|
| **WHO** | Which NPC | Eliminate via alibis, contradictions |
| **WHAT** | theft / sabotage / prank | Physical evidence descriptions |
| **HOW** | grabbed / smuggled / hid / etc. | Physical evidence details |
| **WHEN** | W1-W6 | Device logs, testimony |
| **WHERE** | Which room | Physical evidence location |
| **WHY** | grudge / jealousy / revenge / etc. | Gossip interviews |

---

## INVESTIGATION STRATEGY

### Step 1: Get Gossip First
```
INTERVIEW alice gossip
```
Gossip reveals **what happened** and often **when**. This tells you which window to focus on.

### Step 2: Check Device Logs
```
LOGS door W3
LOGS motion W3
```
See who was moving during the crime window. Logs return max 3 entries - call again if more available.

### Step 3: Search the Crime Scene
```
SEARCH living W3
```
Find physical evidence. Gossip hints include the exact room ID (e.g., `SEARCH: living`). Use it!

### Step 4: Get Testimony
```
INTERVIEW bob W3 testimony
```
Learn what people saw/heard. Compare with other evidence to catch lies.

### Step 5: Use COMPARE to Catch Lies
```
EVIDENCE                    # List evidence IDs
COMPARE presence_15 testimony_200
```
If someone has a false alibi, COMPARE will find "CONTRADICTION!"

### Step 6: Use SUGGEST if Stuck
```
SUGGEST
```
KOA will hint at a key contradiction you should investigate. One-time use.

### Step 7: Accuse
```
ACCUSE
```
Answer all 6 questions based on your evidence.

---

## TIPS FOR LLM AGENTS

1. **Start with gossip** - it reveals WHAT happened, WHERE, and roughly WHEN
2. **Gossip includes exact SEARCH syntax** - look for `(SEARCH: living)` hints and use them verbatim
3. **Use EVIDENCE frequently** - track what you've collected
4. **COMPARE is free** - use it liberally to find contradictions
5. **Use SUGGEST if stuck** - KOA will point you toward a key contradiction
6. **Leads give free actions** - finding crime-related evidence earns lead tokens

---

## POST-GAME SURVEY

After playing, report:

### Core Questions

**1. Was the case solvable with the evidence provided?**
- [ ] Yes - I could deduce all 6 parts from evidence
- [ ] Mostly - Some parts required guessing
- [ ] No - Key information was missing

**2. How many AP did you spend before solving?**
- [ ] 3-6 (very easy)
- [ ] 7-9 (about right)
- [ ] 10-12 (challenging)
- [ ] 13+ (too hard)

**3. Did you use COMPARE?**
- [ ] Yes, caught a contradiction
- [ ] Yes, but no contradictions found
- [ ] No

**4. Did you use SUGGEST?**
- [ ] Yes, it helped
- [ ] Yes, but didn't help
- [ ] No, didn't need it

**5. Did leads feel rewarding?**
- [ ] Yes - free actions felt earned
- [ ] Neutral
- [ ] No - didn't notice them

**6. Did 4 days feel right?**
- [ ] Too tight
- [ ] About right
- [ ] Too loose

### Open Feedback

**What evidence cracked the case?**
```
[Your answer]
```

**Any bugs or confusing moments?**
```
[Your answer]
```

**Suggestions?**
```
[Your answer]
```

---

## STARTING A GAME

```bash
# Fresh game with specific seed
npx tsx src/game.ts --seed 42 --agent-mode --reset

# Random seed
npx tsx src/game.ts --agent-mode --reset

# Continue saved game
npx tsx src/game.ts --seed 42 --agent-mode
```

Good luck, detective!
