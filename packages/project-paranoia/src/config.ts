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

    // Natural suspicion drift - crew gets paranoid over time
    suspicionDriftInterval: num('PARANOIA_SUSPICION_DRIFT_INTERVAL', 50), // ticks between drift
    suspicionDriftAmount: num('PARANOIA_SUSPICION_DRIFT', 0.01), // motherReliable drops this much
    crewInvestigationFindBump: num('PARANOIA_CREW_INVESTIGATION_FIND_BUMP', 15), // suspicion gain on finding evidence
    crewInvestigationClearDrop: num('PARANOIA_CREW_INVESTIGATION_CLEAR_DROP', 5), // suspicion drop on finding nothing

    // Orders / Turing interface
    orderAcceptThreshold: num('PARANOIA_ORDER_ACCEPT_THRESHOLD', 55),
    orderHoldTicks: num('PARANOIA_ORDER_HOLD_TICKS', 60), // longer orders so workers stay put

    // Crew agenda actions
    resetCountdownTicks: num('PARANOIA_RESET_COUNTDOWN', 20), // more reaction time for player
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

    // Hazard thresholds (for path blocking)
    radiationHazardThreshold: num('PARANOIA_RADIATION_HAZARD', 6),
    radiationDecayInterval: num('PARANOIA_RADIATION_DECAY_INTERVAL', 1), // fast decay = fair game (tuned)
    tempCoolingRate: num('PARANOIA_TEMP_COOLING_RATE', 2), // degrees per tick when above normal (tuned for fairness)
};
