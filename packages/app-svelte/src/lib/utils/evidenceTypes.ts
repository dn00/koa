/**
 * Task 005: Evidence Type Display Utilities
 *
 * Mappings from engine EvidenceType to UI display values.
 */

import type { EvidenceType } from '@hsh/engine-core';

/**
 * Display labels for evidence types.
 * Maps engine types to user-facing labels.
 */
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
	DIGITAL: 'LOG',
	SENSOR: 'SENSOR',
	TESTIMONY: 'WITNESS',
	PHYSICAL: 'OBJECT'
};

/**
 * Color classes for evidence types.
 * Used for type badges on cards.
 */
export const EVIDENCE_TYPE_COLORS: Record<EvidenceType, string> = {
	DIGITAL: 'bg-blue-100 text-blue-800',
	SENSOR: 'bg-purple-100 text-purple-800',
	TESTIMONY: 'bg-green-100 text-green-800',
	PHYSICAL: 'bg-orange-100 text-orange-800'
};

/**
 * Hex colors for evidence types.
 * Used for canvas/JS animations.
 */
export const EVIDENCE_TYPE_HEX: Record<EvidenceType, string> = {
	DIGITAL: '#3b82f6', // blue-500
	SENSOR: '#a855f7', // purple-500
	TESTIMONY: '#22c55e', // green-500
	PHYSICAL: '#f97316' // orange-500
};

/**
 * Get display label for evidence type.
 */
export function getEvidenceTypeLabel(type: EvidenceType): string {
	return EVIDENCE_TYPE_LABELS[type] || type;
}

/**
 * Get color classes for evidence type.
 */
export function getEvidenceTypeColor(type: EvidenceType): string {
	return EVIDENCE_TYPE_COLORS[type] || '';
}
