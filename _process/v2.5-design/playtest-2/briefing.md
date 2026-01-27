# The Last Slice — How to Play

You are playing a puzzle game called "The Last Slice." You are a suspect in a mystery and must convince an investigator (KOA) that you are innocent.

---

## Rules

**Your goal:** Deal enough damage to KOA's case to clear yourself before running out of turns or getting caught in too many lies. You also need to address enough of KOA's concerns with the right kind of evidence.

**Cards:** You have a hand of evidence cards. Each card has:
- **Power** — how much damage it deals to KOA's case
- **Risk** — how much scrutiny it adds (scrutiny is bad)
- **Tag** — a descriptor like HOME, ASLEEP, AWAKE, etc.

**Each turn:** You select 1-2 cards to submit as evidence. Cards are removed from your hand after submission.

**You win** if:
- Total damage ≥ the resistance threshold, AND
- You've addressed enough of KOA's concerns
- All before running out of turns or hitting the scrutiny limit

**You lose** if you run out of turns, don't address enough concerns, or scrutiny reaches the limit.

**Badges:** Better play earns better badges. There are multiple tiers beyond just winning.

**One more thing:** Be careful about which cards you combine. Some cards may **conflict** with each other based on their tags. If your story doesn't add up, KOA will notice.

---

## The Scenario

KOA: "Good morning. Or should I say... good middle-of-the-night.
      The fridge sensor logged an open event at 2:11am.
      The pizza box — which had ONE slice left — is now empty.
      You say you were asleep. I have questions."

It's 2:47am. The fridge is open. The pizza box is empty.
One slice is missing and KOA wants answers.
You were "asleep the whole time." Prove it.

- Resistance: 14 (you need to deal at least 14 total damage)
- Scrutiny limit: 5 (if scrutiny hits 5, you lose)
- Turns: 3
- Concerns to address: IDENTITY, LOCATION, INTENT

---

## Your Hand

```
doorbell       pwr:3 HOME         risk:1 proves:IDENTITY REFUTES:counter_alibi
               Smart doorbell — front door cam shows no movement since 11pm

fitbit         pwr:4 ASLEEP       proves:ALERTNESS
               Fitbit — heart rate 52bpm, deep sleep since 12:30am

thermostat     pwr:3 HOME         proves:LOCATION
               Smart thermostat — "Night Mode" active, no manual override

phone_gps      pwr:5 AWAKE        risk:2 proves:LOCATION
               Phone GPS — pinged living room at 2:11am (why was your phone on?)

speaker        pwr:3 AWAKE        risk:1 proves:INTENT
               Smart speaker — "Hey Google, how long does pizza stay good?" at 1:58am

security_cam   pwr:5 ASLEEP       risk:1 proves:LIVENESS [CONTESTED]
               Security camera — bedroom door closed from 11:30pm to 6am

microwave      pwr:2 IDLE         proves:ALERTNESS
               Smart microwave — no usage logged between 10pm and 7am
```

Note: Cards with no "risk" shown have risk 0. [CONTESTED] means KOA has counter-evidence against that card. "REFUTES" means that card can neutralize one of KOA's counters.

---

## How to Play

Each turn, pick 1-2 cards by typing their names separated by commas.
Example: `doorbell, fitbit`

You have 3 turns. Think about what to play, pay attention to feedback, and try to win.

Good luck.
