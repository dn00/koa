# KOA Mini — Vocabulary Guide

**Purpose:** Maintain consistent language that fits the smart home framing, NOT courtroom drama.

**Last Updated:** 2026-01-30

---

## The Framing

KOA is your smart home AI. When something suspicious happens, KOA locks/disables things until you explain yourself. You're not on trial—you're just trying to get your printer back.

---

## BANNED Vocabulary (Courtroom)

These words break immersion by making it feel like a legal proceeding:

| Banned | Why |
|--------|-----|
| defense | Implies you're a defendant |
| evidence | Too formal/legal (except as internal game term) |
| testimony | Formal legal term |
| verdict | Implies judge/jury (use "result" or "outcome" in UI) |
| trial | Legal proceeding |
| guilty / innocent | Crime framing |
| objection | Courtroom procedure |
| prosecution | Legal adversary |
| cross-examination | Legal procedure |
| witness stand | Courtroom furniture |

**Note:** Some terms like "evidence" and "verdict" exist in code/types for clarity. The rule applies to player-facing text and KOA dialogue.

---

## APPROVED Vocabulary (Smart Home)

| Instead of... | Use... |
|---------------|--------|
| evidence | receipts, logs, data, sources, proof |
| defense | explanation, story, account, case (informal) |
| testimony | someone vouching for you, witness, human source |
| verdict | result, outcome, decision |
| guilty | busted, caught |
| innocent | cleared, off the hook |
| present evidence | show receipts, share logs, pull up data |
| play a card | (avoid "play" - KOA sees data, not cards) transmit, share, present |

---

## KOA's Voice

KOA should sound like:
- A slightly paranoid smart home AI
- Passive-aggressive IT support
- Your building's security system with opinions
- A tired parent who's "not mad, just disappointed"

KOA should NOT sound like:
- A judge
- A prosecutor
- A cop interrogating you
- A game show host

---

## Examples

**BAD (courtroom):**
> "Your defense lacks credibility. The evidence contradicts your testimony."

**GOOD (smart home):**
> "Your story has holes. The logs don't match what you're telling me."

**BAD:**
> "Present your evidence to prove your innocence."

**GOOD:**
> "Show me the receipts. Help me understand what happened."

**BAD:**
> "The verdict is GUILTY."

**GOOD:**
> "Yeah, I'm not buying it. System stays locked."

---

## Card Types

The internal type `TESTIMONY` is kept for code clarity, but in player-facing text:

| Type | Player-facing |
|------|---------------|
| DIGITAL | logs, data, digital trail |
| SENSOR | sensor data, readings, what the house saw |
| TESTIMONY | witness, someone vouching, human source |
| PHYSICAL | physical proof, something tangible |

---

## Meta/Game Language (Also Banned)

KOA sees data and sources, not game mechanics:

| Banned | Why |
|--------|-----|
| card / cards | KOA sees logs/receipts, not cards |
| play / played | KOA sees you presenting data |
| deck | Game mechanic |
| turn | Game mechanic |
| game / puzzle | Breaking fourth wall |

---

## When In Doubt

Ask: "Would a smart home AI say this, or a lawyer?"

If it sounds like Law & Order, rewrite it.
