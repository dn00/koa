const num = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (raw === undefined) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
};

export const CONFIG = {
    // Director pacing
    maxActiveThreats: num('PARANOIA_MAX_ACTIVE_THREATS', 1),
    maxThreatAdvancesPerTick: num('PARANOIA_MAX_THREAT_ADVANCES', 1),
    maxHeadlinesPerTick: num('PARANOIA_MAX_HEADLINES', 3),
    threatActivationChance: num('PARANOIA_THREAT_ACTIVATION_CHANCE', 2), // %
    threatActivationCooldown: num('PARANOIA_THREAT_COOLDOWN', 15), // ticks

    // Damage + failure
    damageSuffocation: num('PARANOIA_DAMAGE_SUFFOCATION', 4),
    damageBurn: num('PARANOIA_DAMAGE_BURN', 6),
    damageRadiation: num('PARANOIA_DAMAGE_RADIATION', 3),
    meltdownTemp: num('PARANOIA_MELTDOWN_TEMP', 200),
    meltdownTicks: num('PARANOIA_MELTDOWN_TICKS', 16),

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

    // Work + economy
    yieldInterval: num('PARANOIA_YIELD_INTERVAL', 8),
    quotaPerDay: num('PARANOIA_QUOTA_PER_DAY', 6),
};
