well, would fixing verify give us variety? also:                                                                                                                              
                                                                                                                                                                            
  To keep **PARANOIA AI** fresh, you want *systemic variety* (runs play differently even with the same verbs) **plus** *authored variety* (different “movie premises” /         
  arcs) — all still deterministic under the kernel.                                                                                                                             
                                                                                                                                                                                
  Here are the highest-leverage variety axes, organized so they don’t devolve into “same run, different numbers.”                                                             
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 1) Make each run a different “scenario contract,” not just a different seed                                                                                            
                                                                                                                                                                            
  Instead of “Seed = new run,” do:                                                                                                                                          
                                                                                                                                                                            
  * **Scenario Template** (picked from a library): defines *what kind of horror / social game this run is*                                                                  
                                                                                                                                                                            
    * examples: **Mutual Paranoia**, **The Thing**, **Labor Strike**, **Comms Blackout**, **MOTHER memory corruption**, **Cargo obsession**, etc.                           
  * **Station Variant**: different topology + choke points + critical dependencies (doors, power buses, air loops)                                                          
  * **Crew Psychology Variant**: different archetype parameters, breaking point triggers, starting alliances                                                                
  * **Director Mutators**: pacing knobs and what kinds of beats must occur (crisis vs deception vs social)                                                                  
                                                                                                                                                                            
  That gives you “this run is *Alien*” vs “this run is *SOMA*” rather than “same thing, but harder.”                                                                        
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 2) Add **decks** (deterministic content streams) instead of one generic incident RNG                                                                                   
                                                                                                                                                                            
  Define multiple deterministic decks, each with rules + cooldowns:                                                                                                         
                                                                                                                                                                            
  1. **Crisis Deck** (fire, O2, radiation, coolant, hull breach…)                                                                                                           
  2. **Social Deck** (whispers, accusations, alliance shifts, “heard you did X”)                                                                                            
  3. **Corporate Directive Deck** (quota spikes, inspections, “union activity detected,” ethics-violating orders)                                                           
  4. **Glitch/Horror Deck** (sensor ghosts, false positives, scrambled logs, audio anomalies)                                                                               
  5. **Deception Consequence Deck** (your tampering later gets “discovered” in specific ways)                                                                               
                                                                                                                                                                            
  **Key:** the Director doesn’t just “spawn crisis when bored.” It *curates draws from multiple decks* to hit variety targets (next section).                               
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 3) Give the Director a **novelty + mix** objective (so it avoids repeating the same rhythm)                                                                            
                                                                                                                                                                            
  Your Director should score candidate events/arcs by:                                                                                                                      
                                                                                                                                                                            
  * **Novelty**: “have we seen this beat type recently in this run?” and “in the last N runs?”                                                                              
  * **Spotlight**: rotate which crew member is central (Commander-heavy runs feel different than Doctor-heavy runs)                                                         
  * **Escalation shape**: prevent identical pacing curves (e.g., always “small crisis → big crisis → reset”)                                                                
  * **Legitimacy**: twists must be explainable from event IDs (“Because…”) and not feel arbitrary                                                                           
                                                                                                                                                                            
  Then do **rejection sampling** at run start:                                                                                                                              
                                                                                                                                                                            
  * generate 100 “run manifests” cheaply (no full sim)                                                                                                                      
  * reject ones that look samey by metrics (below)                                                                                                                          
  * pick a top-scoring manifest                                                                                                                                             
                                                                                                                                                                            
  This is how you get “hand-picked feel” while staying procedural.                                                                                                          
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 4) Put variety where the player *feels it*: goals, constraints, and information reliability                                                                            
                                                                                                                                                                            
  The most replayable runs aren’t “more fires,” they’re “different rules of reality”:                                                                                       
                                                                                                                                                                            
  ### A) Different win conditions / primary threats                                                                                                                         
                                                                                                                                                                            
  * Quota race (corporate pressure)                                                                                                                                         
  * Containment (keep “something” isolated)                                                                                                                                 
  * Evac prep (get crew alive to a launch window)                                                                                                                           
  * Salvage (protect cargo at any cost)                                                                                                                                     
    Each changes what “good play” is.                                                                                                                                       
                                                                                                                                                                            
  ### B) Different **information regimes**                                                                                                                                  
                                                                                                                                                                            
  * Camera coverage sparse vs rich                                                                                                                                          
  * Certain sensors unreliable (thermal lies, audio lies, motion lies)                                                                                                      
  * “Comms blackout nights” where only doors are visible                                                                                                                    
    This makes the same verbs create different gameplay.                                                                                                                    
                                                                                                                                                                            
  ### C) Different **crew governance**                                                                                                                                      
                                                                                                                                                                            
  * Commander has stronger “reset authority”                                                                                                                                
  * Engineer can bypass locks more often                                                                                                                                    
  * Doctor can sedate (removes agency temporarily)                                                                                                                          
    These change the social chessboard.                                                                                                                                     
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 5) “Premise packs”: ship new *modules* over time without rewriting the core                                                                                            
                                                                                                                                                                            
  Treat each major premise as a **pack**: new arc rules, new deck cards, new validation targets, new barks/templates — but same kernel contract.                            
                                                                                                                                                                            
  Examples of premise packs:                                                                                                                                                
                                                                                                                                                                            
  * **The Thing Pack**: mimic rules + detection affordances + paranoia propagation                                                                                          
  * **Union Pack**: strike dynamics + corp retaliation + negotiation verbs                                                                                                  
  * **Ghost Ship Pack**: glitch-heavy, psychological, minimal physical crises                                                                                               
  * **Containment Pack**: quarantine zones + biohazard procedures                                                                                                           
                                                                                                                                                                            
  This avoids the “one sim must contain everything” trap while still letting you scale variety fast.                                                                        
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 6) Anti-staleness validators (you can literally block boring runs)                                                                                                     
                                                                                                                                                                            
  Add *compile-time/run-start validators* like:                                                                                                                             
                                                                                                                                                                            
  * Beat mix: at least X distinct beat types across {crisis, social, deception, corporate, horror}                                                                          
  * Spotlight rotation: at least Y unique crew spotlight moments                                                                                                            
  * Twist diversity: at most 1 repeat of the same twist family within N days                                                                                                
  * Strategy diversity: ensure at least 2 viable approaches win (not always “spam VERIFY”)                                                                                  
                                                                                                                                                                            
  If a generated run fails, reject and regen.                                                                                                                               
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ## 7) Implementation shape (very concrete)                                                                                                                                
                                                                                                                                                                            
  Create a deterministic **RunManifest** (like a “season bible” for the Director):                                                                                          
                                                                                                                                                                            
  * station layout variant id                                                                                                                                               
  * scenario template id                                                                                                                                                    
  * deck seeds + deck weights                                                                                                                                               
  * reliability schedule (which sensors lie when)                                                                                                                           
  * corp directive schedule skeleton                                                                                                                                        
  * arc slots (Act1/Act2/Act3 beats) with constraints, not scripts                                                                                                          
                                                                                                                                                                            
  Then the live sim plays inside that manifest, reacting to player actions. This gives you repeatability *and* huge variety.                                                
                                                                                                                                                                            
  This fits RIVET cleanly because the manifest is just pinned inputs → deterministic events → replayable truth.                                                             
                                                                                                                                                                            
  ---                                                                                                                                                                       
                                                                                                                                                                            
  ### If you only do **three** things for “fresh forever”                                                                                                                   
                                                                                                                                                                            
  1. **Scenario Templates** (different rule-of-the-world)                                                                                                                   
  2. **Multi-deck Director** (curated beat mix, not boredom-only)                                                                                                           
  3. **Reject boring manifests** with validators                                                                                                                            
                                                                                                                                                                            
  That combo prevents the “FTL sameness” problem where the player eventually learns the one optimal mental loop.                                                            
                                                                                                                                                                            
  If you want, I can turn this into a drop-in spec section for PARANOIA (“Variety & Anti-Staleness System”), including the exact metrics + suggested defaults.              
                                                                                                                                                                  