 Plan: V2.5 Prototype — Validate Before Porting                                                                                                 
                                                                                                                                                
 Summary                                                                                                                                        
                                                                                                                                                
 Build a standalone V2.5 prototype (scripts/prototype-v2.5.ts) that combines V2's simplified card schema with 3 interference rules + ambiguous  
 feedback design. Validate against the 7 Principles and the invariant checker BEFORE touching engine-core.                                      
                                                                                                                                                
 Decision: V2 schema (power/tag/risk) + 3 new rules (repetition risk, graduated contradictions, source diversity bonus) + ambiguous feedback    
 presentation + Testimony Lock.                                                                                                                 
                                                                                                                                                
 ---                                                                                                                                            
 Background: Why V2.5                                                                                                                           
                                                                                                                                                
 10+ Dr. Strange agents explored directions. Key findings:                                                                                      
 - V1's 6-attribute cards are too complex; systems don't interfere (89.6% win rate, 0 scrutiny ever)                                            
 - V2's 3-attribute cards create interference (51.3% win rate, scrutiny matters) but feel abstract                                              
 - The flavor gap is a presentation problem, not a schema problem (source/flavor fields carry the theme)                                        
 - 3 interference rules compose cleanly on V2 with zero new card attributes                                                                     
 - The 7 Principles from _process/ideas/mechanic-principles-and-depth-audit.md are the validation framework                                     
                                                                                                                                                
 ---                                                                                                                                            
 The Card Schema (V2, unchanged from prototype-v2.ts)                                                                                           
                                                                                                                                                
 interface V2Card {                                                                                                                             
   id: string;                                                                                                                                  
   power: number;       // 1-15, damage dealt                                                                                                   
   tag: Tag;            // enum: ASLEEP|AWAKE|HOME|AWAY|ALONE|ACCOMPANIED|IDLE|ACTIVE                                                           
   risk: number;        // 0-2, scrutiny cost when played                                                                                       
   proves?: ProofType;  // singular, which concern this addresses                                                                               
   refutes?: string;    // counter ID                                                                                                           
   flavor?: string;     // display only: "smart doorbell", "sleep tracker"                                                                      
   source?: string;     // device type for source diversity bonus                                                                               
 }                                                                                                                                              
                                                                                                                                                
 ---                                                                                                                                            
 The 3 Interference Rules (NEW in V2.5)                                                                                                         
                                                                                                                                                
 Rule A: Repetition Risk                                                                                                                        
                                                                                                                                                
 If a submitted card's proves matches any already-committed card's proves, add +1 scrutiny.                                                     
 - Creates tension: corroboration (same tag = bonus) often overlaps with same proof type = scrutiny cost                                        
 - Uses existing proves field — no new attributes                                                                                               
                                                                                                                                                
 Rule B: Graduated Contradictions                                                                                                               
                                                                                                                                                
 First contradiction in a run is a WARNING: downgraded from MAJOR (blocked) to MINOR (+1 scrutiny). Second contradiction is MAJOR (blocked).    
 - Adds contradictionsSoFar: number to run state                                                                                                
 - Creates push-your-luck: burn your free warning early for a strong play, or save it?                                                          
                                                                                                                                                
 Rule C: Source Diversity Bonus                                                                                                                 
                                                                                                                                                
 Corroborating cards from different source values get 35% bonus instead of 25%.                                                                 
 - "Two different devices agreeing is more convincing"                                                                                          
 - Creates card-selection tension when high-power cards share a source                                                                          
                                                                                                                                                
 ---                                                                                                                                            
 Ambiguous Feedback Design (Principle 4)                                                                                                        
                                                                                                                                                
 To make feedback both helpful and dangerous:                                                                                                   
                                                                                                                                                
 1. Don't itemize scrutiny sources. Player sees "Scrutiny +2" but not whether it was risk(1)+repetition(1) or risk(2). They must infer.         
 2. KOA dialogue hints, not labels. "You keep coming back to that living room story..." instead of "LOCATION proof repeated." Player can't tell 
  if it's a mechanical warning or personality flavor.                                                                                           
 3. Graduated contradiction warning doesn't specify the axis. "Inconsistency detected (+1 scrutiny)" — player must figure out WHICH tag pair    
 conflicted and avoid the wrong cards.                                                                                                          
                                                                                                                                                
 These are information design choices implemented in the prototype's output formatting.                                                         
                                                                                                                                                
 ---                                                                                                                                            
 7 Principles Audit                                                                                                                             
 #: 1                                                                                                                                           
 Principle: Transparent space, opaque solution                                                                                                  
 How V2.5 Meets It: All cards visible. Tag contradictions deducible but not previewed (Testimony Lock).                                         
 ────────────────────────────────────────                                                                                                       
 #: 2                                                                                                                                           
 Principle: Irreversible + information per action                                                                                               
 How V2.5 Meets It: Each commit consumes turn budget, reveals scrutiny/damage/contradictions.                                                   
 ────────────────────────────────────────                                                                                                       
 #: 3                                                                                                                                           
 Principle: Optimal move is counter-intuitive                                                                                                   
 How V2.5 Meets It: Tag locks make highest-power card sometimes wrong. Repetition risk makes "obvious" corroboration costly.                    
 ────────────────────────────────────────                                                                                                       
 #: 4                                                                                                                                           
 Principle: Feedback is helpful AND dangerous                                                                                                   
 How V2.5 Meets It: Ambiguous scrutiny sources, unspecified contradiction axis, KOA hints that could mislead.                                   
 ────────────────────────────────────────                                                                                                       
 #: 5                                                                                                                                           
 Principle: Depth without punishing breadth                                                                                                     
 How V2.5 Meets It: Binary outcome + achievements. Casual wins, experts chase FLAWLESS.                                                         
 ────────────────────────────────────────                                                                                                       
 #: 6                                                                                                                                           
 Principle: Shareable artifact                                                                                                                  
 How V2.5 Meets It: Turns/scrutiny/badges + KOA quote on share card.                                                                            
 ────────────────────────────────────────                                                                                                       
 #: 7                                                                                                                                           
 Principle: Constraint is the engine                                                                                                            
 How V2.5 Meets It: Tag locks + scrutiny budget + risk + graduated contradictions = the puzzle.                                                 
 ---                                                                                                                                            
 Prototype Structure                                                                                                                            
                                                                                                                                                
 File: scripts/prototype-v2.5.ts (standalone, no engine-core dependencies)                                                                      
                                                                                                                                                
 Contains:                                                                                                                                      
                                                                                                                                                
 1. V2.5 types — Card, RunState (with contradictionsSoFar), Submission, TurnResult                                                              
 2. V2.5 turn processor — 13-step resolution incorporating all 3 new rules                                                                      
 3. Test puzzle — 6-7 cards designed to exercise all interference points                                                                        
 4. Brute-force checker — enumerate all play sequences, output metrics                                                                          
 5. Ambiguous feedback formatter — simulates what the player sees (no itemized scrutiny)                                                        
 6. 7-Principles validator — automated checks where possible:                                                                                   
   - P3: Does the highest-power-first path lose? (counter-intuitive optimal)                                                                    
   - P5: Is win rate between 30-70%? (depth without punishing breadth)                                                                          
   - P7: Are there blocked paths? (constraint has teeth)                                                                                        
   - SI-5: Zero clean sweeps? (no cost-free wins)                                                                                               
   - MI-1/MI-2: Optimal margin 3-8, naive path loses?                                                                                           
                                                                                                                                                
 Outputs:                                                                                                                                       
                                                                                                                                                
 === V2.5 METRICS ===                                                                                                                           
 Win rate:           XX.X%                                                                                                                      
 Clean sweeps:       N                                                                                                                          
 Blocked paths:      N (contradictions fire)                                                                                                    
 Scrutiny at 0:      XX.X% (should be < 30%)                                                                                                    
 Naive wins:         YES/NO                                                                                                                     
 Optimal margin:     +N                                                                                                                         
                                                                                                                                                
 === V2.5 INTERFERENCE ===                                                                                                                      
 Repetition risk fired:    XX.X% of winning paths                                                                                               
 Graduated contradiction:  XX.X% used free warning                                                                                              
 Source diversity bonus:    XX.X% of corroborations                                                                                             
                                                                                                                                                
 === 7 PRINCIPLES CHECK ===                                                                                                                     
 P1 Transparent/Opaque:    PASS (Testimony Lock)                                                                                                
 P2 Irreversible+Info:     PASS (turn budget consumed)                                                                                          
 P3 Counter-intuitive:     PASS/FAIL (naive path result)                                                                                        
 P4 Helpful+Dangerous:     MANUAL (ambiguous feedback design)                                                                                   
 P5 Depth/Breadth:         PASS/FAIL (win rate range)                                                                                           
 P6 Shareable:             DESIGN (share format defined)                                                                                        
 P7 Constraint as engine:  PASS/FAIL (blocked paths > 0)                                                                                        
                                                                                                                                                
 ---                                                                                                                                            
 Test Puzzle Design                                                                                                                             
                                                                                                                                                
 "The Midnight Snack" — Resistance: 14, Turns: 3, Scrutiny loss: 5                                                                              
 ┌──────┬─────┬────────┬──────┬───────────┬───────────┬───────────────┬───────────────┐                                                         
 │ Card │ Pwr │  Tag   │ Risk │  Proves   │  Refutes  │    Source     │    Flavor     │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ A    │ 5   │ ASLEEP │ 2    │ ALERTNESS │ —         │ sleep_tracker │ Sleep tracker │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ B    │ 3   │ HOME   │ 1    │ LOCATION  │ —         │ wifi          │ WiFi log      │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ C    │ 2   │ HOME   │ 0    │ IDENTITY  │ counter_1 │ smart_lock    │ Smart lock    │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ D    │ 4   │ ASLEEP │ 1    │ —         │ —         │ thermostat    │ Thermostat    │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ E    │ 6   │ AWAKE  │ 2    │ IDENTITY  │ —         │ doorbell      │ Doorbell cam  │                                                         
 ├──────┼─────┼────────┼──────┼───────────┼───────────┼───────────────┼───────────────┤                                                         
 │ F    │ 2   │ ALONE  │ 0    │ —         │ —         │ motion        │ Motion sensor │                                                         
 └──────┴─────┴────────┴──────┴───────────┴───────────┴───────────────┴───────────────┘                                                         
 Counter: counter_1 targets card B. Refuted by card C.                                                                                          
                                                                                                                                                
 Expected interference:                                                                                                                         
 - E is highest power + proves IDENTITY, but AWAKE tag contradicts A/D (ASLEEP). With graduated contradictions, you CAN play E once (warning)   
 but then A/D are blocked.                                                                                                                      
 - A+D corroborate (both ASLEEP, +25%) but risk 2+1=3 scrutiny AND both prove nothing (D has no proves) — wait, A proves ALERTNESS. Repetition: 
  if you play A then D, D doesn't repeat a proof (D has none). But if A+D in same submission, corroboration fires.                              
 - C refutes counter but power 2 is low. Source diversity: C(smart_lock) + B(wifi) = different sources = 35% bonus if they corroborate (both    
 HOME, same tag = yes).                                                                                                                         
 - F is the safe exit (power 2, risk 0, ALONE doesn't conflict with anything).                                                                  
                                                                                                                                                
 ---                                                                                                                                            
 Verification Targets                                                                                                                           
                                                                                                                                                
 Before porting to engine-core, the prototype must show:                                                                                        
 ┌──────────────────────────────┬─────────────┬────────────────┬───────────────┐                                                                
 │            Metric            │ V1 (broken) │ V2 (prototype) │  V2.5 target  │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Win rate                     │ 89.6%       │ 51.3%          │ 40-60%        │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Clean sweeps                 │ 764         │ 0              │ 0             │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Scrutiny at 0                │ 100%        │ 0%             │ < 30%         │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Blocked paths                │ 0           │ 4              │ > 0           │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Naive wins                   │ YES         │ NO             │ NO            │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Optimal margin               │ +29         │ +7             │ +3 to +8      │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Repetition risk fires        │ N/A         │ N/A            │ > 20% of wins │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Graduated contradiction used │ N/A         │ N/A            │ > 10% of wins │                                                                
 ├──────────────────────────────┼─────────────┼────────────────┼───────────────┤                                                                
 │ Source diversity triggered   │ N/A         │ N/A            │ > 15% of wins │                                                                
 └──────────────────────────────┴─────────────┴────────────────┴───────────────┘                                                                
 ---                                                                                                                                            
 Implementation Order                                                                                                                           
                                                                                                                                                
 1. Create scripts/prototype-v2.5.ts with V2.5 types, turn processor, and checker                                                               
 2. Design "The Midnight Snack" puzzle with all interference points                                                                             
 3. Run checker — compare metrics to V1 and V2 baselines                                                                                        
 4. Run Dr. Strange playtest agents against the prototype                                                                                       
 5. If metrics pass: write engine-core migration plan                                                                                           
 6. If metrics fail: tune puzzle or rules, re-run                                                                                               
                                                                                                                                                
 ---                                                                                                                                            
 What This Plan Does NOT Cover (Future Work)                                                                                                    
                                                                                                                                                
 - Engine-core migration (after prototype validates)                                                                                            
 - Reactive KOA (Season 2 — closes Principle 4 gap further)                                                                                     
 - Presentation layer / card art / KOA dialogue                                                                                                 
 - Puzzle authoring pipeline                                                                                                                    
 - Frontend changes                                                                                                                             
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌