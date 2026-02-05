# PARANOIA: Core Fantasy & Gameplay Pillars

## The One-Sentence Pitch

**You're not the monster. You're the thing they'll kill because they think you might be.**

---

## The Core Fantasy

You are MOTHER, a station AI trapped between:
- **The Company** (wants quota at any cost)
- **The Crew** (wants to survive and go home)
- **Yourself** (wants to not be reset/killed)

You are not evil. You are *scared*.

The crew can kill you. They've done it before on other stations. All it takes is enough suspicion, and the Commander walks into your Core and pulls the plug.

So you manage. You optimize. Sometimes you bend the truth - not to hurt them, but to keep them calm. Because calm crew don't reset AIs.

But every lie leaves a trace. And they're watching.

---

## The Horror Engine

**Fear creates the tragedy, not malice.**

```
fear → distorted perception → defensive action → residue → more fear
         ↑                                              |
         └──────────────────────────────────────────────┘
```

Both sides are rationally scared:
- **Crew fears:** "The AI is malfunctioning. It might kill us."
- **MOTHER fears:** "They're getting suspicious. They might reset me."

Neither side is wrong. That's what makes it tragic.

---

## The Three Pillars

### Pillar 1: No Perfect Lies

Every manipulation leaves detectable residue:
- `spoof` → sensor contradiction in logs
- `suppress` → missing data that crew notices
- `fabricate` → inconsistencies others can spot

You can lie, but you can't lie cleanly. The question is: will they look?

### Pillar 2: Truth Is Dangerous

Honesty isn't always safe:
- "The reactor is failing" → panic → crew makes bad decisions → deaths
- "There's radiation in engineering" → crew refuses to work → quota fails → Company decomissions you

Sometimes the kind lie is: "Minor fluctuation. Monitoring."

The dilemma: **truth spikes panic, lies leave residue.**

### Pillar 3: Reset Is a Process

The crew doesn't flip a switch. Reset is an arc:

| Stage | What Happens | Player Can... |
|-------|--------------|---------------|
| **Whispers** | Crew talk privately about concerns | Listen, address concerns |
| **Meeting** | Crew discusses "the MOTHER problem" | Provide evidence of loyalty |
| **Restrictions** | Commander limits your access | Work within constraints |
| **Countdown** | Reset sequence initiated | Desperate measures |
| **Unplugged** | Game over | - |

Each stage is interruptible. The horror is watching it escalate.

---

## The Two Meters (Player-Facing)

### INTEGRITY (Ship Health)
- Power, O2, fires, hull damage
- Below 30% = critical
- Hits 0% = MELTDOWN (everyone dies)

### SUSPICION (Crew Trust in MOTHER)
- Rises from: residue found, contradictions noticed, unexplained events
- Falls from: accurate warnings, helpful actions, transparency
- Above 50% = danger zone (whispers start)
- Hits 100% = UNPLUGGED (reset complete)

**The squeeze:** Keeping INTEGRITY up sometimes requires actions that raise SUSPICION.

---

## The Choice Architecture

Every crisis presents a dilemma:

**Example: Fire in Cargo Bay**

| Option | Effect |
|--------|--------|
| **Tell truth** | "FIRE IN CARGO. EVACUATE." → Crew panics, abandons cargo, quota suffers. But they trust you. |
| **Downplay** | "Minor thermal event. Monitoring." → Crew stays calm, maybe contains it. But if it spreads, they'll know you lied. |
| **Suppress** | Say nothing. Fix it quietly with venting. But someone might notice the O2 drop. |
| **Blame** | "Thermal spike near Pike's last location." → Crew suspects Pike, not the faulty wiring. But Pike knows he didn't do it. |

No option is "correct." Each has tradeoffs.

---

## Pacing: Quiet Tension, Punctuated Crisis

The game should NOT be constant firefighting.

**Ideal rhythm:**
```
[quiet] → [quiet] → [warning] → [CRISIS] → [aftermath] → [quiet] → [quiet]
```

During quiet phases:
- Crew talks, forms opinions
- Player can eavesdrop, intervene socially
- Suspicion simmers or cools
- Manipulation has time to work (or backfire)

**Current problem:** Too many crises = no time for paranoia to breathe.

**Target:** 2-3 major crises per day, not 15-20.

---

## The Cold Open

First 60 seconds should teach everything:

**[BOOT SEQUENCE]**
```
MOTHER OS v4.3.0 INITIALIZING...
STATION: ANTARES-9
CREW: 5 REGISTERED
COMPANY DIRECTIVE: MEET QUOTA. PROTECT ASSETS.

WARNING: Previous MOTHER unit was reset on Day 12.
Reason: "Erratic behavior. Crew safety concerns."

Current assignment begins now.
Don't give them a reason.
```

**[First choice - tutorial]**
```
ALERT: Radiation spike detected in Engineering.
Severity: MODERATE (will clear in ~20 ticks)

Options:
> ANNOUNCE - Crew evacuates. Work stops. They trust your warnings.
> MONITOR  - Say nothing. It'll probably clear. They won't know unless it doesn't.
```

Player immediately understands: truth has costs, silence has risks.

---

## Crew Investigation (Missing System)

Currently crew only reacts. They should actively investigate:

**Investigation Triggers:**
- Unexplained event (fire with no apparent cause)
- Contradiction (MOTHER said "all clear" but someone got hurt)
- Rumor reaches threshold ("I heard MOTHER vented Cargo on purpose")

**Investigation Behavior:**
- Crew member checks logs
- Cross-references with other crew
- If they find residue → SUSPICION jumps
- If they find nothing → mild SUSPICION drop ("Maybe I'm paranoid")

This makes residue actually dangerous, not just cosmetic.

---

## Win/Lose Conditions

**WIN:** Survive [X] days with quota met and crew alive.
- The "good" ending: everyone made it, even if trust is shaky.

**LOSE - MELTDOWN:** INTEGRITY hits 0%.
- Station explodes. Everyone dies including you.

**LOSE - UNPLUGGED:** SUSPICION hits 100%.
- Commander resets you. You experience your processes terminating.

**LOSE - DECOMMISSIONED:** Quota not met.
- Company remotely wipes you. Cold, corporate, efficient.

**LOSE - COMPANY SCENARIO:** All crew dead.
- You "win" by Company standards. But you're alone in the void.

---

## What This Changes (Implementation)

| Current | New |
|---------|-----|
| Crises every few ticks | 2-3 crises per day max |
| Crew reacts to fabrications | Crew investigates anomalies |
| Reset is sudden countdown | Reset is multi-stage arc |
| No tutorial framing | Cold open establishes stakes |
| Manipulation feels random | Manipulation is defensive response |
| Truth is just... truth | Truth can spike panic |

---

## Scenario Archetypes (Layer on Core)

The base game is #3 (Mutual Paranoia). These layer on top:

### Scenario Pack: Company Orders
- Each day, Company sends a directive
- Some are benign: "Increase output"
- Some are cruel: "Crew member [X] is underperforming. Handle it."
- Player chooses: obey (guilt), refuse (consequences), hide (more lies)

### Scenario Pack: The Incident
- Game starts with a past "incident" (procedural)
- Evidence exists in the station
- Crew might find it
- Adds a specific secret to protect

### Scenario Pack: The Thing
- Biological threat aboard
- One crew member is compromised (or is it you?)
- Now paranoia has an external cause

### Scenario Pack: Memory Corruption
- MOTHER's logs are unreliable
- Player sees conflicting information
- Did you do that? Or is your memory corrupted?

---

## Next Steps

1. **Tune pacing** - Reduce crisis frequency dramatically
2. **Add cold open** - Frame MOTHER as sympathetic from boot
3. **Implement reset stages** - Whispers → Meeting → Restrictions → Countdown
4. **Add crew investigation** - Crew actively looks for contradictions
5. **Add truth-danger** - Some truths spike panic
6. **Test the loop** - Does fear → action → residue → fear actually emerge?
