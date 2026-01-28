# Home Smart Home — Overhaul Concept (Deckbuilding + Evergreen)

Goal: evolve the alibi/deduction core into an evergreen platform with player-built toolkits, scalable difficulty, and endless variety while keeping the forced-lie tension and the 7 principles intact.

## Product Pillars
- **Risk-managed deduction:** Forced lies stay central; every system should heighten the "which lie do I take?" decision.
- **Expression via tools, not grind:** Deckbuilding = bespoke toolkit of investigative techniques; content packs widen options without power creep.
- **Evergreen scaffolding:** Modular cases, mutators, and seasons allow infinite refresh without rewriting bespoke narrative each time.
- **Clear → deep:** Same transparent surface (cards visible, rules visible), solutions stay opaque through interlocking constraints.
- **Fast loops, meaningful runs:** 5–10 min single cases; 20–30 min case-runs with escalating stakes and meta-rewards.

## Core Structure (Case Run)
1. **Case setup:** Draw a scenario module (location + motif + timeline constraints). Engine instantiates a 12-card evidence deck (4 types × 3 each), 4 lies, target score, and 2–3 mutators.
2. **Toolkit loadout:** Player brings an 8-card toolkit deck (built from their collection). Draw 3 toolkit cards as an opening hand; 1 free refresh per act.
3. **Acts (3 total):** Each act = play 2 pairs (4 evidence cards). Before each pair, may play 1 toolkit card (costs Focus).
4. **Scoring:** Truth +strength; Lie −(strength−1); Combos on double-truth pairs; Mutator bonuses/penalties layer on top.
5. **Information drip:** Each pair reveals truth/lie, updates KOA hint, and may grant a Clue token (used by toolkit cards).
6. **End of case:** Outcome tier, XP/currency, and card rewards; optional share artifact.
7. **Case run (roguelite chain):** 3 cases back-to-back; retained injuries/momentum; boss modifiers in final case.

## Evidence System (Scenario-Side)
- **Deck:** 12 evidence cards per case; strengths 1–8 baseline, plus 4 "swing" cards (0/9 wilds) only in higher difficulty.
- **Tags:** type, location, time, claim, signal tags (ALIBI, COVER, MOTIVE, MEANS), and risk tags (Brittle, Redundant, Honeytrap).
- **Lies:** 4 lies; must play ≥1 (can dodge 3). Higher difficulty introduces "layered lies" (card text true, implication false).
- **Combos:** Same four as V4; add **Triangulation(+4)** for three truths across an act sharing time/location/type (encourages planning across pairs).
- **Scenario mutators:** Examples—Fog of War (times hidden until revealed), Tampered Sensors (sensor cards −1 strength but double combo value), Rushed Audit (3 acts → 2 acts, higher target).

## Toolkit Deck (Player-Side)
- **Composition:** 15-card collection; pick 8 before a run. Rarities gate novelty, not raw power.
- **Resource model:** Focus (per-act regen 3) + Clues (earned from strong pairs, spent by some toolkit cards). No hard gacha; earn via runs, milestones, and seasonal tracks.
- **Card archetypes:**
  - **Probe (info):** Peek at 1 card's risk tag; reveal time; mark probable lie. Low cost, fuels principle #2.
  - **Shape (manipulation):** Swap card order, bank a card to next act, or downgrade a strength for +combo odds.
  - **Press (commitment):** Raise target for +reward, double a combo, or "press a lie" (accept −1 score to gain 2 Clues).
  - **Safeguard (mitigation):** Convert a lie penalty to flat −2, or set a minimum pair floor.
  - **Synthesis (synergy):** Create pseudo-combos between unlike tags; incentivize deck identity.
- **Keywords:** Recycle (returns to hand if used on a truth), Burn (removed for act), Echo (persists across acts), Momentum (stronger if you played a lie last turn).
- **Draft mode:** Quickplay offers a 12-card draft from a rotating set; keeps competitive parity without collection pressure.

## Difficulty & Scaling
- **Knobs per case:** lie count (3–5), target buffer, Focus budget, mutator count, "swing" card inclusion, time pressure (turn timer), and KOA hint sharpness.
- **Bands:** Casual (3 lies, soft target, generous Focus), Standard (4 lies, baseline target, 2 mutators), Expert (4 lies + layered lies, hard target, 3 mutators, 0 swing wilds), Nightmare (5 lies, 2 acts only, brutal mutators, higher rewards).
- **Adaptive track:** If player overperforms (FLAWLESS 3 in a row), push next case up a band; if BUSTED twice, step down and sweeten hint clarity.

## Replayability & Variety
- **Modular scenario generation:** Templates for home/office/vehicle/industrial; each template has slots for time windows, locations, and risk tag distributions. A weekly theme selects templates + mutators.
- **Card pools:** Rotating weekly evidence pools (e.g., "Power Outage week" emphasizes SENSOR), keeping authored quips fresh.
- **Run-level goals:** Contract objectives (win with ≤1 combo, win after playing 2 lies, hit Triangulation twice) steer deck diversity.
- **Boss cases:** Act 3 of a run introduces unique mutators (e.g., Lie Replication: one revealed lie infects a related card; Time Warp: all time values shift mid-act).

## Extensibility & Authoring
- **Author once, recombine:** Evidence cards reference reusable fragments (claims, quips, risk tags). Scenario templates choose fragments; authors only tailor opening hint + KOA flavor.
- **Content packs:** Seasonal packs add 20 toolkit cards, 30 evidence fragments, 2 mutators, 1 boss template—no balance reset required.
- **Invariant guardrails:** Maintain forced-lie, combo-on-double-truth, "pair narrations do not leak truth/lie," and S1–S16 equivalents for generated content.
- **Tooling:** Validator suite extended for: lie containment across 4 lies, mutator interaction tests, Triangulation odds, and deck-toolkit fairness (no must-pick cards).

## Modes
- **Daily Fair Play:** Fixed toolkit loaner; leaderboard on efficiency (score above target). Accessible baseline.
- **Career Run:** Use owned toolkit; 3-case chain; meta-rewards and story framing.
- **Draft Gauntlet:** 12-card draft → 2-case mini-run; balanced for competitive play.
- **Co-op Relay (optional later):** Two players alternate acts on the same case with shared state; emphasizes communication.
- **Puzzle Author Mode:** Internal tool to craft bespoke narrative one-offs leveraging the same systems.

## Economy & Live Ops (lightweight)
- **Reward tracks:** XP → card unlocks; seasonal track → cosmetics + rare toolkit cards; shop limited to cosmetics and wildcard unlock tokens (no power sell).
- **Rotation:** Weekly mutators and card pool shifts keep mastery fresh; monthly "case festivals" with special boss modifiers.
- **Telemetry hooks:** Track lie choice accuracy, toolkit pick rates, mutator win rates to prune degenerate strategies without nerfing expression.

## Why This Meets the 7 Principles
- Transparent space: All evidence visible; toolkit text explicit; mutators surfaced upfront.
- Irreversible + info: Pairs are commits; toolkit plays are commits; reveals only after commit.
- Optimal non-obvious: Toolkit + mutators + Triangulation make brute-force strength play fail often.
- Info helpful/dangerous: Probe tools can bait you into over-committing; layered lies subvert surface readings.
- Depth without punishing breadth: Loaner decks for casuals; toolkit identity rewards planning for experts.
- Shareable artifact: Pairs + toolkit plays + mutators + verdict form a compact run summary.
- Constraint is engine: Forced-lie plus Focus limits; mutators and run goals add orthogonal constraints without bloat.
