const num = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
};

export const CONFIG = {
    // Director pacing - balanced for ~50% passive, ~100% smart win rates
    maxActiveThreats: num('PARANOIA_MAX_ACTIVE_THREATS', 3), // overlapping crises create real emergencies
    maxThreatAdvancesPerTick: num('PARANOIA_MAX_THREAT_ADVANCES', 1),
    maxHeadlinesPerTick: num('PARANOIA_MAX_HEADLINES', 3),
    maxTruthEventsPerTick: num('PARANOIA_MAX_TRUTH_EVENTS', 4),
    maxPerceptionEventsPerTick: num('PARANOIA_MAX_PERCEPTION_EVENTS', 2),
    threatActivationChance: num('PARANOIA_THREAT_ACTIVATION_CHANCE', 18), // base 18%, +3% boredom boost = 21% when idle
    threatActivationCooldown: num('PARANOIA_THREAT_COOLDOWN', 25), // ~10 activation windows per day
    arcKindRespawnCooldown: num('PARANOIA_ARC_KIND_RESPAWN_COOLDOWN', 120), // half-day cooldown
    boredomThreshold: num('PARANOIA_BOREDOM_THRESHOLD', 7), // fix: boredom caps at 10, was unreachable at 15
    tensionThreshold: num('PARANOIA_TENSION_THRESHOLD', 8), // stop tension from suppressing spawning during normal play

    // Damage + failure
    damageSuffocation: num('PARANOIA_DAMAGE_SUFFOCATION', 8), // buffed for emergency venting viability
    damageBurn: num('PARANOIA_DAMAGE_BURN', 2),
    damageRadiation: num('PARANOIA_DAMAGE_RADIATION', 2),
    meltdownTemp: num('PARANOIA_MELTDOWN_TEMP', 240),
    meltdownTicks: num('PARANOIA_MELTDOWN_TICKS', 20),

    // Stress + psych
    stressParanoiaThreshold: num('PARANOIA_STRESS_PARANOIA', 70),
    stressLoyaltyDropThreshold: num('PARANOIA_STRESS_LOYALTY_DROP', 60), // lowered from 80 for faster cascade
    stressLoyaltyDropAmount: num('PARANOIA_STRESS_LOYALTY_DROP_AMOUNT', 2), // was 1, now 2 for visible decay
    paranoiaLoyaltyDropThreshold: num('PARANOIA_PARANOIA_LOYALTY_DROP', 40), // paranoia > 40 → additional loyalty drain
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
    maxCommsPerPhase: num('PARANOIA_MAX_COMMS_PER_PHASE', 6), // cap whispers+incidents per evening phase
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
    trustRecoveryAmount: num('PARANOIA_TRUST_RECOVERY', 0.005), // slower recovery (was 0.012)
    trustRecoveryTamperWindow: num('PARANOIA_TRUST_RECOVERY_WINDOW', 100), // no tampering in this many ticks = recovery
    crewInvestigationFindBump: num('PARANOIA_CREW_INVESTIGATION_FIND_BUMP', 12), // suspicion gain on finding evidence
    crewInvestigationClearDrop: num('PARANOIA_CREW_INVESTIGATION_CLEAR_DROP', 0), // finding nothing is neutral (was 2)

    // Event-driven suspicion modifiers (see PARANOIA_HANDOFF_PROMPT.md Section 15)
    // Suspicion RISES when crew witnesses bad outcomes
    suspicionCrisisWitnessed: num('PARANOIA_SUSPICION_CRISIS', 8), // crew witnesses crisis start (was 5)
    suspicionCrewInjured: num('PARANOIA_SUSPICION_INJURED', 8), // crew member injured (was 5)
    suspicionCrewDied: num('PARANOIA_SUSPICION_DIED', 14), // crew member dies
    suspicionQuotaMissed: num('PARANOIA_SUSPICION_QUOTA_MISSED', 12), // quota not met
    suspicionOrderRefused: num('PARANOIA_SUSPICION_ORDER_REFUSED', 2), // order ignored/refused (mild)
    suspicionTrappedByDoor: num('PARANOIA_SUSPICION_TRAPPED', 10), // crew trapped by locked door

    // Suspicion FALLS when crew sees good outcomes
    suspicionCrisisResolved: num('PARANOIA_SUSPICION_CRISIS_RESOLVED', -3), // crisis resolved quickly (was -5)
    suspicionQuietDay: num('PARANOIA_SUSPICION_QUIET_DAY', -1), // minimal relief — doing nothing isn't reassuring
    suspicionQuotaExceeded: num('PARANOIA_SUSPICION_QUOTA_EXCEEDED', -3), // meeting quota is expected, not heroic
    suspicionHeroicResponse: num('PARANOIA_SUSPICION_HEROIC', -3), // death + quick crisis resolve (contained it)
    suspicionOrderCompleted: num('PARANOIA_SUSPICION_ORDER_COMPLETED', -1), // successful order builds trust

    // Crisis resolution timing
    crisisResolveQuickTicks: num('PARANOIA_CRISIS_RESOLVE_QUICK', 25), // ticks to count as "quick" resolution
    quietDayIncidentThreshold: num('PARANOIA_QUIET_DAY_THRESHOLD', 0), // 0 incidents = quiet day (strict)

    // VERIFY command - active trust-building counterplay
    verifySuspicionDrop: num('PARANOIA_VERIFY_SUSPICION_DROP', -4), // suspicion reduction
    verifyTamperDrop: num('PARANOIA_VERIFY_TAMPER_DROP', -5), // tamperEvidence reduction
    verifyCooldown: num('PARANOIA_VERIFY_COOLDOWN', 60), // ticks between verifies (reduced from 70)
    verifyCpuCost: num('PARANOIA_VERIFY_CPU_COST', 12), // power cost (reduced from 15)
    verifyTamperPenalty: num('PARANOIA_VERIFY_TAMPER_PENALTY', 0.5), // multiplier if recent tampering

    // Order completion trust cap (minor bonus, capped tightly)
    orderTrustCapPerDay: num('PARANOIA_ORDER_TRUST_CAP', 2), // max suspicion drop from orders per day

    // Reset stage thresholds (tuned for event-driven suspicion)
    // Goal: ~90-95% smart solver win, ~40-60% passive win
    resetThresholdWhispers: num('PARANOIA_RESET_WHISPERS', 30), // early warning
    resetThresholdMeeting: num('PARANOIA_RESET_MEETING', 45), // tension building (+3)
    resetThresholdRestrictions: num('PARANOIA_RESET_RESTRICTIONS', 58), // serious danger (+6, biggest gap)
    resetThresholdCountdown: num('PARANOIA_RESET_COUNTDOWN_THRESHOLD', 68), // danger zone (+7)
    resetDeescalationThreshold: num('PARANOIA_RESET_DEESCALATION', 28), // easier recovery (+3)

    // Orders / Turing interface
    orderAcceptThreshold: num('PARANOIA_ORDER_ACCEPT_THRESHOLD', 55),
    resetWhispersOrderPenalty: num('PARANOIA_RESET_WHISPERS_ORDER_PENALTY', 5), // graduated: mild penalty at whispers
    resetMeetingOrderPenalty: num('PARANOIA_RESET_MEETING_ORDER_PENALTY', 8), // graduated: moderate at meeting
    resetRestrictionsOrderPenalty: num('PARANOIA_RESET_RESTRICTIONS_ORDER_PENALTY', 12), // graduated: serious at restrictions
    resetCountdownOrderPenalty: num('PARANOIA_RESET_COUNTDOWN_ORDER_PENALTY', 15), // graduated: severe at countdown
    resetRestrictionsCpuMult: num('PARANOIA_RESET_RESTRICTIONS_CPU_MULT', 1.5), // CPU cost multiplier during restrictions/countdown
    meetingDurationTicks: num('PARANOIA_MEETING_DURATION_TICKS', 30), // how long meeting stage lasts
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

    // Work + economy - tight margins so crises threaten quota
    yieldInterval: num('PARANOIA_YIELD_INTERVAL', 16), // 2 miners ≈ 12/day vs quota 10 — gives 2 cargo margin for disruptions
    yieldStressThreshold: num('PARANOIA_YIELD_STRESS_THRESHOLD', 70), // stressed miners can't extract
    quotaPerDay: num('PARANOIA_QUOTA_PER_DAY', 10), // tight margin — disrupted miners threaten quota
    winDays: num('PARANOIA_WIN_DAYS', 3), // survive this many days to win

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

    // ActiveDoubts + targeted VERIFY (Task 010)
    verifyDoubtDrop: num('PARANOIA_VERIFY_DOUBT_DROP', -8), // buffed from -6
    verifyIdleDrop: num('PARANOIA_VERIFY_IDLE_DROP', -2), // buffed from -1
    doubtDecayTicks: num('PARANOIA_DOUBT_DECAY_TICKS', 100),

    // Doubt Engine (Feature 005) - witness doubt generation and burden mechanics
    doubtWitnessVent: num('PARANOIA_DOUBT_WITNESS_VENT', 3),          // severity when crew witnesses VENT
    doubtWitnessLock: num('PARANOIA_DOUBT_WITNESS_LOCK', 2),          // severity when crew witnesses LOCK
    doubtWitnessPurge: num('PARANOIA_DOUBT_WITNESS_PURGE', 2),        // severity when crew witnesses PURGE_AIR
    doubtWitnessOrder: num('PARANOIA_DOUBT_WITNESS_ORDER', 1),        // severity when crew is ordered
    doubtBurdenOrderPenalty: num('PARANOIA_DOUBT_BURDEN_ORDER_PENALTY', 3), // trustScore penalty per burden point
    doubtBurdenMineThreshold: num('PARANOIA_DOUBT_BURDEN_MINE_THRESHOLD', 6), // burden above this = can't mine
    doubtBurdenAgencyThreshold: num('PARANOIA_DOUBT_BURDEN_AGENCY_THRESHOLD', 8), // burden above this = crew acts autonomously
    doubtResetWeight: num('PARANOIA_DOUBT_RESET_WEIGHT', 1.5),        // weight of avg doubt burden in reset calculation
    doubtSpreadInterval: num('PARANOIA_DOUBT_SPREAD_INTERVAL', 10),   // ticks between spread checks
    doubtSpreadChance: num('PARANOIA_DOUBT_SPREAD_CHANCE', 45),       // % chance per eligible doubt per check
    doubtSuspicionDripInterval: num('PARANOIA_DOUBT_SUSPICION_DRIP_INTERVAL', 25), // ticks between suspicion drip (slowed from 20)
    doubtSuspicionDripPerSeverity: num('PARANOIA_DOUBT_SUSPICION_DRIP_PER_SEVERITY', 0.7), // suspicion per unresolved severity point
    doubtSuspicionDripCap: num('PARANOIA_DOUBT_SUSPICION_DRIP_CAP', 3), // max suspicion drip per interval (reduced from 4)
    doubtAgencyCooldown: num('PARANOIA_DOUBT_AGENCY_COOLDOWN', 40),   // ticks between doubt-triggered crew actions

    // ALERT (coming clean) tuning
    alertEarlyWindow: num('PARANOIA_ALERT_EARLY_WINDOW', 15),
    alertEarlySuspicion: num('PARANOIA_ALERT_EARLY_SUSPICION', 2),
    alertLateSuspicion: num('PARANOIA_ALERT_LATE_SUSPICION', 6),

    // Pressure channel system (suspicion-weighted activation routing)
    suspicionBandLow: num('PARANOIA_SUSPICION_BAND_LOW', 25),
    suspicionBandHigh: num('PARANOIA_SUSPICION_BAND_HIGH', 45),

    // Channel weights per band (integers 0-100, normalized at runtime)
    pressureLowPhysical: num('PARANOIA_PRESSURE_LOW_PHYSICAL', 55),
    pressureLowSocial: num('PARANOIA_PRESSURE_LOW_SOCIAL', 20),
    pressureLowEpistemic: num('PARANOIA_PRESSURE_LOW_EPISTEMIC', 25),

    pressureMidPhysical: num('PARANOIA_PRESSURE_MID_PHYSICAL', 40),
    pressureMidSocial: num('PARANOIA_PRESSURE_MID_SOCIAL', 30),
    pressureMidEpistemic: num('PARANOIA_PRESSURE_MID_EPISTEMIC', 30),

    pressureHighPhysical: num('PARANOIA_PRESSURE_HIGH_PHYSICAL', 20),
    pressureHighSocial: num('PARANOIA_PRESSURE_HIGH_SOCIAL', 40),
    pressureHighEpistemic: num('PARANOIA_PRESSURE_HIGH_EPISTEMIC', 40),

    // Announce/Downplay crisis communication
    announceStressSpike: num('PARANOIA_ANNOUNCE_STRESS_SPIKE', 12),
    announceEvacTicks: num('PARANOIA_ANNOUNCE_EVAC_TICKS', 15),
    suspicionAnnounce: num('PARANOIA_SUSPICION_ANNOUNCE', -3), // honest warning (was -7, too powerful)
    suspicionAnnounceVindicated: num('PARANOIA_SUSPICION_ANNOUNCE_VINDICATED', -1), // resolved after warning (was -3)
    downplayStressBump: num('PARANOIA_DOWNPLAY_STRESS_BUMP', 4),
    suspicionDownplay: num('PARANOIA_SUSPICION_DOWNPLAY', -2),
    suspicionDownplayBackfire: num('PARANOIA_SUSPICION_DOWNPLAY_BACKFIRE', 10),
    downplayBackfireWindow: num('PARANOIA_DOWNPLAY_BACKFIRE_WINDOW', 60),
    downplayBackfireBase: num('PARANOIA_DOWNPLAY_BACKFIRE_BASE', 8),
    downplayBackfireInjuryBonus: num('PARANOIA_DOWNPLAY_BACKFIRE_INJURY_BONUS', 3),
    downplayBackfireDeathBonus: num('PARANOIA_DOWNPLAY_BACKFIRE_DEATH_BONUS', 8),
    downplayBackfireCap: num('PARANOIA_DOWNPLAY_BACKFIRE_CAP', 25),

    // Fabrication consequences
    grudgeWhisperThreshold: num('PARANOIA_GRUDGE_WHISPER_THRESHOLD', 15), // crewGrudge level to trigger visible whisper

    // Hazard thresholds (for path blocking)
    radiationHazardThreshold: num('PARANOIA_RADIATION_HAZARD', 6),
    radiationDecayInterval: num('PARANOIA_RADIATION_DECAY_INTERVAL', 1), // fast decay = fair game (tuned)
    o2RecoveryInterval: num('PARANOIA_O2_RECOVERY_INTERVAL', 3), // ticks between +1 O2 (slower = unmanaged crises hurt more)
    fireO2Drain: num('PARANOIA_FIRE_O2_DRAIN', 1), // O2 drain per tick from active fire (low = burns longer unmanaged)
    fireIntegrityDrain: num('PARANOIA_FIRE_INTEGRITY_DRAIN', 0.4), // integrity loss per tick from fire (unmanaged fires risk meltdown)
    tempCoolingRate: num('PARANOIA_TEMP_COOLING_RATE', 2), // degrees per tick when above normal (tuned for fairness)
};
