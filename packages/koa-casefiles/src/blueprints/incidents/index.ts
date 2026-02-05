/**
 * KOA Casefiles - Incident Blueprints
 *
 * All incident blueprint definitions and registry.
 */

import type { IncidentBlueprint, IncidentType } from '../types.js';
import { THEFT_BLUEPRINTS, getTheftBlueprint } from './theft.js';
import { SABOTAGE_BLUEPRINTS, getSabotageBlueprint } from './sabotage.js';
import { PRANK_BLUEPRINTS, getPrankBlueprint } from './prank.js';

// Re-export individual modules
export * from './theft.js';
export * from './sabotage.js';
export * from './prank.js';

// ============================================================================
// Combined Registry
// ============================================================================

export const ALL_BLUEPRINTS: IncidentBlueprint[] = [
    ...THEFT_BLUEPRINTS,
    ...SABOTAGE_BLUEPRINTS,
    ...PRANK_BLUEPRINTS,
];

export function getBlueprint(id: string): IncidentBlueprint | undefined {
    return ALL_BLUEPRINTS.find(b => b.id === id);
}

export function getBlueprintsByType(type: IncidentType): IncidentBlueprint[] {
    return ALL_BLUEPRINTS.filter(b => b.incidentType === type);
}

export function getAllBlueprintIds(): string[] {
    return ALL_BLUEPRINTS.map(b => b.id);
}

/**
 * Summary of available blueprints
 */
export function getBlueprintSummary(): Record<IncidentType, string[]> {
    return {
        theft: THEFT_BLUEPRINTS.map(b => b.id),
        sabotage: SABOTAGE_BLUEPRINTS.map(b => b.id),
        prank: PRANK_BLUEPRINTS.filter(b => b.incidentType === 'prank').map(b => b.id),
        swap: PRANK_BLUEPRINTS.filter(b => b.incidentType === 'swap').map(b => b.id),
        disappearance: PRANK_BLUEPRINTS.filter(b => b.incidentType === 'disappearance').map(b => b.id),
    };
}
