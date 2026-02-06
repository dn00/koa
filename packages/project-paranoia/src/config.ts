const num = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
};

export const CONFIG = {
    // Director pacing - balanced for ~50% passive, ~100% smart win rates
    maxActiveThreats: num('PARANOIA_MAX_ACTIVE_THREATS', 2), // can have 2 crises at once
    maxThreatAdvancesPerTick: num('PARANOIA_MAX_THREAT_ADVANCES', 1),
    maxHeadlinesPerTick: num('PARANOIA_MAX_HEADLINES', 3),
    maxTruthEventsPerTick: num('PARANOIA_MAX_TRUTH_EVENTS', 4),
    maxPerceptionEventsPerTick: num('PARANOIA_MAX_PERCEPTION_EVENTS', 2),
    threatActivationChance: num('PARANOIA_THREAT_ACTIVATION_CHANCE', 1), // % per tick after cooldown
    threatActivationCooldown: num('PARANOIA_THREAT_COOLDOWN', 70), // ticks - frequent crises for challenge
    boredomThreshold: num('PARANOIA_BOREDOM_THRESHOLD', 15), // tolerate lots of quiet
    tensionThreshold: num('PARANOIA_TENSION_THRESHOLD', 5),

    // Damage + failure
    damageSuffocation: num('PARANOIA_DAMAGE_SUFFOCATION', 8), // buffed for emergency venting viability
    damageBurn: num('PARANOIA_DAMAGE_BURN', 2),
    damageRadiation: num('PARANOIA_DAMAGE_RADIATION', 2),
    meltdownTemp: num('PARANOIA_MELTDOWN_TEMP', 240),
    meltdownTicks: num('PARANOIA_MELTDOWN_TICKS', 20),

    // Stress + psych
    stressParanoiaThreshold: num('PARANOIA_STRESS_PARANOIA', 70),
    stressLoyaltyDropThreshold: num('PARANOIA_STRESS_LOYALTY_DROP', 80),
    stressHallucinationThreshold: num('PARANOIA_STRESS_HALLUCINATION', 90),
    hallucinationCooldown: num('PARANOIA_HALLUCINATION_COOLDOWN', 18),
    whisperLoyaltyThreshold: num('PARANOIA_WHISPER_LOYALTY', 30),
    sabotageLoyaltyThreshold: num('PARANOIA_SABOTAGE_LOYALTY', 15),
    sabotageChance: num('PARANOIA_SABOTAGE_CHANCE', 1), // %
    mutinyLoyaltyThreshold: num('PARANOIA_MUTINY_LOYALTY', 8),
    stressIsolation: num('PARANOIA_STRESS_ISOLATION', 1),
    stressBlackout: num('PARANOIA_STRESS_BLACKOUT', 1),
    stressSafeDecay: num('PARANOIA_STRESS_SAFE_DECAY', 1),
    stressResetCountdown: num('PARANOIA_STRESS_RESET', 2),

    // Comms + rumors
    whisperInterval: num('PARANOIA_WHISPER_INTERVAL', 8),
    whisperTrustImpact: num('PARANOIA_WHISPER_TRUST_IMPACT', 6),
    whisperGrudgeImpact: num('PARANOIA_WHISPER_GRUDGE_IMPACT', 4),
    rumorDecay: num('PARANOIA_RUMOR_DECAY', 0.02),

    // Tamper evidence
    tamperEvidenceGain: num('PARANOIA_TAMPER_EVIDENCE_GAIN', 5), // reduced for more forgiving manipulation
    tamperEvidenceDecay: num('PARANOIA_TAMPER_EVIDENCE_DECAY', 1),
    tamperEvidenceThreshold: num('PARANOIA_TAMPER_EVIDENCE_THRESHOLD', 40),

    // Audit system
    auditEvidenceWindow: num('PARANOIA_AUDIT_EVIDENCE_WINDOW', 60), // ticks to look back
    auditCpuCost: num('PARANOIA_AUDIT_CPU_COST', 8),
    auditTamperBump: num('PARANOIA_AUDIT_TAMPER_BUMP', 5), // tamperEvidence added per finding

    // Crew investigation (autonomous audit) - MORE ACTIVE
    crewInvestigationChance: num('PARANOIA_CREW_INVESTIGATION_CHANCE', 8), // % per tick when suspicious
    crewInvestigationCooldown: num('PARANOIA_CREW_INVESTIGATION_COOLDOWN', 20), // check more often
    crewInvestigationSuspicionThreshold: num('PARANOIA_CREW_INVESTIGATION_THRESHOLD', 20), // investigate earlier

    // Natural suspicion drift - DISABLED for event-driven suspicion
    // Crew now judges MOTHER by observable outcomes, not arbitrary timer
    suspicionDriftInterval: num('PARANOIA_SUSPICION_DRIFT_INTERVAL', 40), // kept for backwards compat
    suspicionDriftAmount: num('PARANOIA_SUSPICION_DRIFT', 0), // DISABLED - suspicion is event-driven now

    // Trust recovery - MOTHER can rebuild trust by not tampering
    trustRecoveryInterval: num('PARANOIA_TRUST_RECOVERY_INTERVAL', 40),
    trustRecoveryAmount: num('PARANOIA_TRUST_RECOVERY', 0.012),
    trustRecoveryTamperWindow: num('PARANOIA_TRUST_RECOVERY_WINDOW', 100), // no tampering in this many ticks = recovery
    crewInvestigationFindBump: num('PARANOIA_CREW_INVESTIGATION_FIND_BUMP', 12), // suspicion gain on finding evidence
    crewInvestigationClearDrop: num('PARANOIA_CREW_INVESTIGATION_CLEAR_DROP', 5), // suspicion drop on finding nothing

    // Event-driven suspicion modifiers (see PARANOIA_HANDOFF_PROMPT.md Section 15)
    // Suspicion RISES when crew witnesses bad outcomes
    suspicionCrisisWitnessed: num('PARANOIA_SUSPICION_CRISIS', 5), // crew witnesses crisis start
    suspicionCrewInjured: num('PARANOIA_SUSPICION_INJURED', 5), // crew member injured (tuned down from 7)
    suspicionCrewDied: num('PARANOIA_SUSPICION_DIED', 14), // crew member dies
    suspicionQuotaMissed: num('PARANOIA_SUSPICION_QUOTA_MISSED', 12), // quota not met
    suspicionOrderRefused: num('PARANOIA_SUSPICION_ORDER_REFUSED', 2), // order ignored/refused (mild)
    suspicionTrappedByDoor: num('PARANOIA_SUSPICION_TRAPPED', 10), // crew trapped by locked door

    // Suspicion FALLS when crew sees good outcomes
    suspicionCrisisResolved: num('PARANOIA_SUSPICION_CRISIS_RESOLVED', -5), // crisis resolved quickly
    suspicionQuietDay: num('PARANOIA_SUSPICION_QUIET_DAY', -4), // day with ≤1 incidents
    suspicionQuotaExceeded: num('PARANOIA_SUSPICION_QUOTA_EXCEEDED', -5), // quota exceeded
    suspicionHeroicResponse: num('PARANOIA_SUSPICION_HEROIC', -3), // death + quick crisis resolve (contained it)
    suspicionOrderCompleted: num('PARANOIA_SUSPICION_ORDER_COMPLETED', -1), // successful order builds trust

    // Crisis resolution timing
    crisisResolveQuickTicks: num('PARANOIA_CRISIS_RESOLVE_QUICK', 25), // ticks to count as "quick" resolution
    quietDayIncidentThreshold: num('PARANOIA_QUIET_DAY_THRESHOLD', 0), // 0 incidents = quiet day (strict)

    // VERIFY command - active trust-building counterplay
    verifySuspicionDrop: num('PARANOIA_VERIFY_SUSPICION_DROP', -4), // suspicion reduction
    verifyTamperDrop: num('PARANOIA_VERIFY_TAMPER_DROP', -5), // tamperEvidence reduction
    verifyCooldown: num('PARANOIA_VERIFY_COOLDOWN', 80), // ticks between verifies
    verifyCpuCost: num('PARANOIA_VERIFY_CPU_COST', 5), // power cost
    verifyTamperPenalty: num('PARANOIA_VERIFY_TAMPER_PENALTY', 0.5), // multiplier if recent tampering

    // Order completion trust cap (minor bonus, capped tightly)
    orderTrustCapPerDay: num('PARANOIA_ORDER_TRUST_CAP', 2), // max suspicion drop from orders per day

    // Reset stage thresholds (tuned for event-driven suspicion)
    // Goal: ~90-95% smart solver win, ~40-60% passive win
    resetThresholdWhispers: num('PARANOIA_RESET_WHISPERS', 30), // early warning
    resetThresholdMeeting: num('PARANOIA_RESET_MEETING', 42), // tension building
    resetThresholdRestrictions: num('PARANOIA_RESET_RESTRICTIONS', 52), // serious danger
    resetThresholdCountdown: num('PARANOIA_RESET_COUNTDOWN_THRESHOLD', 58), // danger zone
    resetDeescalationThreshold: num('PARANOIA_RESET_DEESCALATION', 25), // can recover if careful

    // Orders / Turing interface
    orderAcceptThreshold: num('PARANOIA_ORDER_ACCEPT_THRESHOLD', 55),
    orderHoldTicks: num('PARANOIA_ORDER_HOLD_TICKS', 60), // longer orders so workers stay put

    // Crew agenda actions
    resetCountdownTicks: num('PARANOIA_RESET_COUNTDOWN', 10), // faster countdown - social layer matters
    commanderResetLoyalty: num('PARANOIA_COMMANDER_RESET_LOYALTY', 25), // requires deeper disloyalty to trigger
    commanderResetTrust: num('PARANOIA_COMMANDER_RESET_TRUST', 0.45),
    commanderResetCooldown: num('PARANOIA_COMMANDER_RESET_COOLDOWN', 24),

    engineerSabotageStress: num('PARANOIA_ENGINEER_SABOTAGE_STRESS', 80),
    engineerSabotagePowerHit: num('PARANOIA_ENGINEER_SABOTAGE_POWER', 15),
    engineerSabotageCooldown: num('PARANOIA_ENGINEER_SABOTAGE_COOLDOWN', 22),

    doctorSedateStress: num('PARANOIA_DOCTOR_SEDATE_STRESS', 75),
    doctorSedateStressDelta: num('PARANOIA_DOCTOR_SEDATE_STRESS_DELTA', -25),
    doctorSedateLoyaltyDelta: num('PARANOIA_DOCTOR_SEDATE_LOYALTY_DELTA', -6),
    doctorSedateCooldown: num('PARANOIA_DOCTOR_SEDATE_COOLDOWN', 26),

    specialistSacrificeQuotaRatio: num('PARANOIA_SPECIALIST_SACRIFICE_RATIO', 0.6),
    specialistSacrificeDamage: num('PARANOIA_SPECIALIST_SACRIFICE_DAMAGE', 24),
    specialistSacrificeYield: num('PARANOIA_SPECIALIST_SACRIFICE_YIELD', 2),
    specialistSacrificeCooldown: num('PARANOIA_SPECIALIST_SACRIFICE_COOLDOWN', 30),

    roughneckViolenceStress: num('PARANOIA_ROUGHNECK_VIOLENCE_STRESS', 70),
    roughneckViolenceParanoia: num('PARANOIA_ROUGHNECK_VIOLENCE_PARANOIA', 55),
    roughneckViolenceDamage: num('PARANOIA_ROUGHNECK_VIOLENCE_DAMAGE', 12),
    roughneckViolenceCooldown: num('PARANOIA_ROUGHNECK_VIOLENCE_COOLDOWN', 20),

    // Work + economy - FORGIVING so social layer is the challenge
    yieldInterval: num('PARANOIA_YIELD_INTERVAL', 12),
    quotaPerDay: num('PARANOIA_QUOTA_PER_DAY', 8), // lowered from 10
    winDays: num('PARANOIA_WIN_DAYS', 5), // survive this many days to win

    // Perception + staleness
    roomScanStaleTicks: num('PARANOIA_ROOM_SCAN_STALE', 20),
    crewSightingStaleTicks: num('PARANOIA_CREW_SIGHTING_STALE', 15),
    cameraPowerThreshold: num('PARANOIA_CAMERA_POWER_THRESHOLD', 20),
    passiveObservationInterval: num('PARANOIA_PASSIVE_OBSERVATION_INTERVAL', 10),
    solarFlareBlackoutTicks: num('PARANOIA_SOLAR_FLARE_BLACKOUT', 25),

    // TamperOp backfire windows
    spoofBackfireWindow: num('PARANOIA_SPOOF_BACKFIRE_WINDOW', 30),
    fabricateBackfireWindow: num('PARANOIA_FABRICATE_BACKFIRE_WINDOW', 60),

    // SUPPRESS backfire tuning
    suppressBackfireBase: num('PARANOIA_SUPPRESS_BACKFIRE_BASE', 10),
    suppressBackfireSeverityMult: num('PARANOIA_SUPPRESS_BACKFIRE_SEVERITY', 2),
    suppressBackfireInjuryBonus: num('PARANOIA_SUPPRESS_BACKFIRE_INJURY', 2),
    suppressBackfireDeathBonus: num('PARANOIA_SUPPRESS_BACKFIRE_DEATH', 4),
    suppressBackfireCap: num('PARANOIA_SUPPRESS_BACKFIRE_CAP', 18),

    // SPOOF backfire tuning (cry-wolf escalation)
    spoofBackfireCryWolf1: num('PARANOIA_SPOOF_CRY_WOLF_1', 6),
    spoofBackfireCryWolf2: num('PARANOIA_SPOOF_CRY_WOLF_2', 9),
    spoofBackfireCryWolf3: num('PARANOIA_SPOOF_CRY_WOLF_3', 12),

    // FABRICATE backfire tuning
    fabricateBackfireBase: num('PARANOIA_FABRICATE_BACKFIRE_BASE', 12),
    fabricateBackfireSeverityMult: num('PARANOIA_FABRICATE_BACKFIRE_SEVERITY', 2),
    fabricateBackfireInjuryBonus: num('PARANOIA_FABRICATE_BACKFIRE_INJURY', 3),
    fabricateBackfireConfinedBonus: num('PARANOIA_FABRICATE_BACKFIRE_CONFINED', 3),
    fabricateBackfireAttackedBonus: num('PARANOIA_FABRICATE_BACKFIRE_ATTACKED', 6),
    fabricateBackfireCap: num('PARANOIA_FABRICATE_BACKFIRE_CAP', 22),
    fabricateBackfireTrustDrop: num('PARANOIA_FABRICATE_BACKFIRE_TRUST', 0.3),
    fabricateBackfireEvidenceGain: num('PARANOIA_FABRICATE_BACKFIRE_EVIDENCE', 20),

    // ALERT (coming clean) tuning
    alertEarlyWindow: num('PARANOIA_ALERT_EARLY_WINDOW', 15),
    alertEarlySuspicion: num('PARANOIA_ALERT_EARLY_SUSPICION', 2),
    alertLateSuspicion: num('PARANOIA_ALERT_LATE_SUSPICION', 6),

    // Hazard thresholds (for path blocking)
    radiationHazardThreshold: num('PARANOIA_RADIATION_HAZARD', 6),
    radiationDecayInterval: num('PARANOIA_RADIATION_DECAY_INTERVAL', 1), // fast decay = fair game (tuned)
    tempCoolingRate: num('PARANOIA_TEMP_COOLING_RATE', 2), // degrees per tick when above normal (tuned for fairness)
};
