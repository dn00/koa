import type { ArcKind } from './types.js';

// =============================================================================
// RunManifest: deterministic "season bible" that parameterizes a game run
// =============================================================================

export interface RunManifest {
    templateId: string;

    // Arc kind weights (0-100 each, normalized at runtime for weighted selection)
    // Missing kinds get a default base weight of 10
    arcWeights: Partial<Record<ArcKind, number>>;

    // Crew starting parameter overrides (applied to ALL crew uniformly)
    crewStarting?: {
        stress?: number;        // default 10
        loyalty?: number;       // default 60
        motherReliable?: number; // default 0.55
    };

    // Pressure channel weight overrides per suspicion band
    // Each band's weights are normalized at runtime
    pressureWeights?: {
        low?: { physical?: number; social?: number; epistemic?: number };
        mid?: { physical?: number; social?: number; epistemic?: number };
        high?: { physical?: number; social?: number; epistemic?: number };
    };

    // Director tuning overrides
    directorOverrides?: {
        maxActiveThreats?: number;
        threatActivationChance?: number;
        threatActivationCooldown?: number;
    };

    // Economy overrides
    economyOverrides?: {
        quotaPerDay?: number;
    };

    // Station starting condition overrides
    stationOverrides?: {
        power?: number;   // default 100
        comms?: number;   // default 100
    };
}

// =============================================================================
// Scenario Templates: named presets that create RunManifests
// =============================================================================

export interface ScenarioTemplate {
    id: string;
    name: string;
    tagline: string;
    manifest: Omit<RunManifest, 'templateId'>;
}

/**
 * SIEGE: System failure cascade. Physical crises overwhelm the station.
 * VERIFY is a luxury — power is too precious for trust theater.
 * Optimal strategy: triage, REROUTE, ORDER crew away from danger, PURGE.
 */
export const TEMPLATE_SIEGE: ScenarioTemplate = {
    id: 'siege',
    name: 'SIEGE',
    tagline: 'System failure cascade — everything is breaking',
    manifest: {
        arcWeights: {
            fire_outbreak: 40,
            power_surge: 40,
            radiation_leak: 30,
            air_scrubber: 25,
            ghost_signal: 5,
            solar_flare: 15,
        },
        crewStarting: {
            stress: 20,
            loyalty: 60,
            motherReliable: 0.55,
        },
        pressureWeights: {
            low: { physical: 70, social: 15, epistemic: 15 },
            mid: { physical: 60, social: 20, epistemic: 20 },
            high: { physical: 50, social: 25, epistemic: 25 },
        },
        directorOverrides: {
            maxActiveThreats: 4,
            threatActivationChance: 25,
        },
        stationOverrides: {
            power: 80,
            comms: 80,
        },
    },
};

/**
 * DISTRUST: Information warfare. Few physical threats but the crew
 * already doesn't trust MOTHER. Ghost signals and social pressure dominate.
 * Optimal strategy: aggressive VERIFY, zero tampering, transparency.
 */
export const TEMPLATE_DISTRUST: ScenarioTemplate = {
    id: 'distrust',
    name: 'DISTRUST',
    tagline: 'The crew already suspects you — prove them wrong',
    manifest: {
        arcWeights: {
            ghost_signal: 50,
            solar_flare: 20,
            fire_outbreak: 10,
            power_surge: 10,
            radiation_leak: 10,
            air_scrubber: 10,
        },
        crewStarting: {
            stress: 15,
            loyalty: 50,
            motherReliable: 0.30,
        },
        pressureWeights: {
            low: { physical: 15, social: 35, epistemic: 50 },
            mid: { physical: 10, social: 40, epistemic: 50 },
            high: { physical: 5, social: 45, epistemic: 50 },
        },
        directorOverrides: {
            maxActiveThreats: 2,
            threatActivationChance: 22,
            threatActivationCooldown: 20,
        },
    },
};

/**
 * CRUNCH: Quota pressure. The Company demands more than the station can safely
 * deliver. Crew is already stressed about output. Crises near the mines are
 * existential because every lost mining tick threatens the quota.
 * Optimal strategy: keep miners mining, ORDER for productivity, triage near mines.
 */
export const TEMPLATE_CRUNCH: ScenarioTemplate = {
    id: 'crunch',
    name: 'CRUNCH',
    tagline: 'The Company wants 120% output — every lost mining tick hurts',
    manifest: {
        arcWeights: {
            air_scrubber: 20,
            power_surge: 20,
            ghost_signal: 15,
            fire_outbreak: 20,
            radiation_leak: 25,
            solar_flare: 10,
        },
        crewStarting: {
            stress: 25,
            loyalty: 50,
            motherReliable: 0.50,
        },
        pressureWeights: {
            low: { physical: 40, social: 40, epistemic: 20 },
            mid: { physical: 35, social: 40, epistemic: 25 },
            high: { physical: 25, social: 45, epistemic: 30 },
        },
        economyOverrides: {
            quotaPerDay: 12,
        },
    },
};

export const SCENARIO_TEMPLATES: Record<string, ScenarioTemplate> = {
    siege: TEMPLATE_SIEGE,
    distrust: TEMPLATE_DISTRUST,
    crunch: TEMPLATE_CRUNCH,
};

/**
 * Create a RunManifest from a scenario template.
 */
export function createManifest(template: ScenarioTemplate): RunManifest {
    return {
        templateId: template.id,
        ...template.manifest,
    };
}

/**
 * Get weighted arc kind selection weights, with defaults for missing kinds.
 * Returns a list of [kind, weight] pairs with weights > 0.
 */
export function getArcWeights(
    manifest: RunManifest | undefined,
    defaultWeight = 10,
): Array<[ArcKind, number]> {
    const ALL_KINDS: ArcKind[] = [
        'air_scrubber', 'power_surge', 'ghost_signal',
        'fire_outbreak', 'radiation_leak', 'solar_flare',
    ];
    if (!manifest?.arcWeights) {
        return ALL_KINDS.map(k => [k, defaultWeight]);
    }
    return ALL_KINDS.map(k => [k, manifest.arcWeights[k] ?? defaultWeight]);
}
