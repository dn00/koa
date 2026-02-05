# KOA Casefiles: Cozy Mystery Detective

A procedurally generated detective game where you investigate household shenanigans. Someone has committed a minor crime - theft, prank, sabotage, or made something "disappear". Your job is to figure out **WHO** did it, **WHAT** they did, **WHEN**, **WHERE**, and **WHY**.

## PLAYTEST INFO

**Recommended seed:** `35` (has a false alibi to catch)

```bash
npx tsx src/game.ts --seed 35 --agent-mode
```

**What we're testing:**
1. Does the testimony/gossip split feel right?
2. Is COMPARE useful for catching lies?
3. Is the difficulty appropriate (target: 7-10 actions)?
4. Can you deduce WHY from the gossip?

---

## HOW TO PLAY

### Game State
- You have **3 Action Points (AP)** per day
- When AP reaches 0, run `NEXT_DAY` to rest and refresh AP
- You have **5 days** maximum to solve the case (15 AP total)
- Running out of time = the culprit gets away!

### Investigation Commands (cost AP)

| Command | Cost | What You Learn |
| :--- | :--- | :--- |
| `SEARCH <place> <window>` | 1 AP | Physical evidence (items moved, traces) |
| `INTERVIEW <npc> <window> testimony` | 1 AP | What they saw/heard during that time |
| `INTERVIEW <npc> <window> gossip` | 1 AP | Household drama and grudges (motive hints) |
| `LOGS <device> <window>` | 1 AP | Device activity (max 3 entries per call) |
| `NEXT_DAY` | 0 AP | Rest and restore AP |

**Important:** LOGS returns max 3 entries. If there are more, call again to see the rest.

### Deduction Commands (free)

| Command | Cost | What It Does |
| :--- | :--- | :--- |
| `COMPARE <id1> <id2>` | Free | Check if two evidence items contradict |
| `EVIDENCE` | Free | List all collected evidence with IDs |
| `HELP` | Free | Show command reference |
| `EXIT` | Free | Quit the game |

### The Accusation (Ends Game)

```
ACCUSE <who> <what> <when> <where> <why>
```

You must correctly identify ALL FIVE parts:

| Part | Options | How to Discover |
| :--- | :--- | :--- |
| **who** | alice, bob, carol, dan, eve | Eliminate via alibis, match motive |
| **what** | theft, sabotage, prank, disappearance | Physical evidence descriptions |
| **when** | W1, W2, W3, W4, W5, W6 | Device logs, testimony timestamps |
| **where** | kitchen, living, bedroom, office, garage | Physical evidence location |
| **why** | envy, embarrassment, cover_up, rivalry, attention, revenge, chaos | Gossip interviews |

**Example:** `ACCUSE alice theft W3 office revenge`

### Valid Parameters

- **Windows:** `W1` (4-5:30pm), `W2` (5:30-7pm), `W3` (7-8:30pm), `W4` (8:30-10pm), `W5` (10-11:30pm), `W6` (11:30pm-1am)
- **Places:** `kitchen`, `living`, `bedroom`, `office`, `garage`
- **Devices:** `door`, `motion`
- **Suspects:** `alice`, `bob`, `carol`, `dan`, `eve`

---

## INVESTIGATION STRATEGY

### Step 1: Find the Crime Scene (SEARCH)
Search rooms during the crime window (usually W3) to find physical evidence.

The description hints at the crime type:
- **"taken"** / **"stashed"** → Theft
- **"tampered with"** / **"dumped"** → Sabotage
- **"deliberately relocated"** / **"ridiculous spot"** → Prank
- **"mysteriously vanished"** / **"carefully hidden"** → Disappearance

### Step 2: Check Device Logs (LOGS)
```
LOGS door W3
LOGS motion W3
```
See who was moving around during the crime window. Note: Only 3 entries per call - call again if "(X more available)".

### Step 3: Get Testimony (INTERVIEW testimony)
```
INTERVIEW alice W3 testimony
INTERVIEW bob W3 testimony
```
Learn what each person saw/heard during that time. Look for:
- "heard a door open/close"
- "saw a suspicious figure"
- "heard ominous footsteps"

### Step 4: Get Gossip for Motive (INTERVIEW gossip)
```
INTERVIEW carol gossip
```
Learn about household drama. **Only 1 person knows the real motive** - you may need to interview multiple people.

Motive hints are phrased like:
- **revenge:** "has been plotting payback against..."
- **envy:** "green with envy about..."
- **chaos:** "said something about watching it all burn"
- **rivalry:** "always trying to one-up..."
- **embarrassment:** "was mortified about something..."
- **cover_up:** "has been acting shady, like hiding something"
- **attention:** "desperate for attention lately"

### Step 5: Catch Lies with COMPARE
If someone has a false alibi, their testimony will contradict other evidence.

```
EVIDENCE                           # List evidence IDs
COMPARE presence_15 testimony_200  # Check for contradiction
```

If you find "CONTRADICTION!" - someone is lying about where they were!

### Step 6: Make Your Accusation
Once you know WHO, WHAT, WHEN, WHERE, and WHY:
```
ACCUSE alice theft W3 office revenge
```

---

## TIPS FOR LLM AGENTS

1. **Start with LOGS door W3** - see movement patterns during crime window
2. **Use EVIDENCE frequently** - track what you've collected
3. **Interview for gossip early** - motive (WHY) often requires multiple gossip interviews
4. **Use COMPARE on suspicious testimony** - especially claims like "insists they were here"
5. **The crime window is usually W3** - focus investigation there
6. **Don't guess blindly** - use evidence to narrow down before ACCUSE

---

## POST-GAME SURVEY

Please report after playing:

### Core Questions

**1. Was the case solvable with the evidence provided?**
- [ ] Yes - I could deduce all 5 parts from evidence
- [ ] Mostly - Some parts required educated guessing
- [ ] No - Key information was missing

**2. How many AP did you spend before solving/accusing?**
- [ ] 3-5 (very easy)
- [ ] 6-8 (easy)
- [ ] 9-12 (about right)
- [ ] 13+ (hard/ran out of time)

**3. Did you use the COMPARE command?**
- [ ] Yes, and it helped catch a lie
- [ ] Yes, but found no contradictions
- [ ] No, didn't need it
- [ ] No, forgot about it

**4. Could you identify the motive (WHY) from gossip?**
- [ ] Yes - one gossip clearly stated the motive type
- [ ] Partially - had to infer from vague hints
- [ ] No - couldn't find motive evidence

**5. Did the testimony/gossip split feel right?**
- [ ] Yes - made me think about what to ask
- [ ] Neutral
- [ ] No - annoying to need 2 actions per person

### Open Feedback

**What evidence cracked the case for you?**
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
# Recommended playtest seed
npx tsx src/game.ts --seed 35 --agent-mode

# Random seed
npx tsx src/game.ts --agent-mode

# Human-readable output (no JSON)
npx tsx src/game.ts --seed 35
```

Good luck, detective!
