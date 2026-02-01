/**
 * KOA Avatar Skins
 * Moved from mockups/brutalist-demo/constants.ts
 */

import type { KoaSkin } from '$lib/components/KoaAvatar.svelte';

export const KOA_SKINS: KoaSkin[] = [
	{
		id: 'brutalist-v2',
		name: 'SYS.V2.0',
		bodyFill: '#F9FAFB',
		bodyStroke: '#2D3142',
		faceplateFill: '#2D3142',
		faceplateStroke: '#E07A5F',
		texture: 'technical',
		borderStyle: 'tech'
	},
	{
		id: 'default',
		name: 'Day Shift',
		bodyFill: '#e2e8f0',
		bodyStroke: '#94a3b8',
		faceplateFill: '#0f172a',
		faceplateStroke: '#64748b',
		texture: 'none',
		borderStyle: 'simple'
	},
	{
		id: 'prime',
		name: 'Prime Edition',
		bodyFill: '#0f172a',
		bodyStroke: '#334155',
		faceplateFill: '#000000',
		faceplateStroke: '#1e293b',
		texture: 'none',
		borderStyle: 'tech'
	},
	{
		id: 'iOwl',
		name: 'Ceramic White',
		bodyFill: '#f8fafc',
		bodyStroke: '#94a3b8',
		faceplateFill: '#000000',
		faceplateStroke: '#cbd5e1',
		texture: 'none',
		borderStyle: 'simple'
	},
	{
		id: 'retro',
		name: 'Retro 86',
		bodyFill: '#e7e5e4',
		bodyStroke: '#78716c',
		faceplateFill: '#1c1917',
		faceplateStroke: '#57534e',
		texture: 'dots',
		borderStyle: 'offset'
	},
	{
		id: 'stealth',
		name: 'Stealth Ops',
		bodyFill: '#171717',
		bodyStroke: '#000000',
		faceplateFill: '#0a0a0a',
		faceplateStroke: '#262626',
		texture: 'carbon',
		borderStyle: 'tech',
		lensColor: '#dc2626',
		pupilColor: '#fecaca'
	},
	{
		id: 'industrial',
		name: 'Heavy Industry',
		bodyFill: '#f59e0b',
		bodyStroke: '#78350f',
		faceplateFill: '#292524',
		faceplateStroke: '#451a03',
		texture: 'lines',
		borderStyle: 'tech',
		lensColor: '#fb923c',
		pupilColor: '#ffedd5'
	},
	{
		id: 'neon',
		name: 'Neon Tokyo',
		bodyFill: '#2e1065',
		bodyStroke: '#d8b4fe',
		faceplateFill: '#1e1b4b',
		faceplateStroke: '#c026d3',
		texture: 'grid',
		borderStyle: 'glow',
		lensColor: '#e879f9',
		pupilColor: '#fdf4ff'
	},
	{
		id: 'gold',
		name: 'Executive Gold',
		bodyFill: '#eab308',
		bodyStroke: '#854d0e',
		faceplateFill: '#0f172a',
		faceplateStroke: '#a16207',
		texture: 'none',
		borderStyle: 'double',
		lensColor: '#fbbf24',
		pupilColor: '#fef3c7'
	},
	{
		id: 'forest',
		name: 'Ranger Green',
		bodyFill: '#3f6212',
		bodyStroke: '#1a2e05',
		faceplateFill: '#052e16',
		faceplateStroke: '#65a30d',
		texture: 'carbon',
		borderStyle: 'thick',
		lensColor: '#84cc16',
		pupilColor: '#ecfccb'
	},
	{
		id: 'pop',
		name: 'Bubblegum',
		bodyFill: '#f472b6',
		bodyStroke: '#be185d',
		faceplateFill: '#4a044e',
		faceplateStroke: '#831843',
		texture: 'dots',
		borderStyle: 'offset'
	},
	{
		id: 'blueprint',
		name: 'Blue Print',
		bodyFill: '#1e3a8a',
		bodyStroke: '#60a5fa',
		faceplateFill: '#172554',
		faceplateStroke: '#ffffff',
		texture: 'grid',
		borderStyle: 'dashed',
		lensColor: '#60a5fa',
		pupilColor: '#dbeafe'
	},
	{
		id: 'melon',
		name: 'Summer Melon',
		bodyFill: '#15803d',
		bodyStroke: '#052e16',
		faceplateFill: '#f43f5e',
		faceplateStroke: '#86efac',
		texture: 'dots',
		borderStyle: 'double',
		lensColor: '#4ade80',
		pupilColor: '#dcfce7'
	},
	{
		id: 'vampire',
		name: 'Night Wing',
		bodyFill: '#450a0a',
		bodyStroke: '#991b1b',
		faceplateFill: '#000000',
		faceplateStroke: '#ef4444',
		texture: 'carbon',
		borderStyle: 'thick',
		lensColor: '#ef4444',
		pupilColor: '#fecaca'
	},
	{
		id: 'glacial',
		name: 'Glacial Zero',
		bodyFill: '#e0f2fe',
		bodyStroke: '#7dd3fc',
		faceplateFill: '#0c4a6e',
		faceplateStroke: '#38bdf8',
		texture: 'grid',
		borderStyle: 'glow',
		lensColor: '#38bdf8',
		pupilColor: '#e0f2fe'
	},
	{
		id: 'rust',
		name: 'Scrap Heap',
		bodyFill: '#78350f',
		bodyStroke: '#451a03',
		faceplateFill: '#292524',
		faceplateStroke: '#d97706',
		texture: 'dots',
		borderStyle: 'dashed',
		lensColor: '#f59e0b',
		pupilColor: '#fef3c7'
	},
	{
		id: 'matrix',
		name: 'System Root',
		bodyFill: '#020617',
		bodyStroke: '#22c55e',
		faceplateFill: '#052e16',
		faceplateStroke: '#4ade80',
		texture: 'lines',
		borderStyle: 'tech',
		lensColor: '#4ade80',
		pupilColor: '#dcfce7'
	},
	{
		id: 'royal',
		name: 'Royal Decree',
		bodyFill: '#581c87',
		bodyStroke: '#facc15',
		faceplateFill: '#3b0764',
		faceplateStroke: '#fde047',
		texture: 'none',
		borderStyle: 'double',
		lensColor: '#facc15',
		pupilColor: '#fef9c3'
	},
	{
		id: 'ghost',
		name: 'Ectoplasm',
		bodyFill: '#134e4a',
		bodyStroke: '#2dd4bf',
		faceplateFill: '#042f2e',
		faceplateStroke: '#5eead4',
		texture: 'dots',
		borderStyle: 'glow',
		lensColor: '#5eead4',
		pupilColor: '#ccfbf1'
	},
	{
		id: 'durian',
		name: 'King Durian',
		bodyFill: '#65a30d',
		bodyStroke: '#365314',
		faceplateFill: '#fef08a',
		faceplateStroke: '#ca8a04',
		texture: 'spikes',
		borderStyle: 'serrated',
		lensColor: '#ca8a04',
		pupilColor: '#fef9c3'
	},
	{
		id: 'starberry',
		name: 'Starberry',
		bodyFill: '#ec4899',
		bodyStroke: '#facc15',
		faceplateFill: '#831843',
		faceplateStroke: '#fdf4ff',
		texture: 'dots',
		borderStyle: 'glow',
		lensColor: '#f472b6',
		pupilColor: '#fdf4ff'
	},
	{
		id: 'dragon',
		name: 'Dragon Snap',
		bodyFill: '#db2777',
		bodyStroke: '#166534',
		faceplateFill: '#f1f5f9',
		faceplateStroke: '#334155',
		texture: 'dots',
		borderStyle: 'offset',
		lensColor: '#db2777',
		pupilColor: '#fce7f3'
	}
];

/** Default skin ID */
export const DEFAULT_SKIN_ID = 'pop';

/** Get skin by ID, fallback to default */
export function getSkinById(id: string): KoaSkin {
	return KOA_SKINS.find((s) => s.id === id) || KOA_SKINS.find((s) => s.id === DEFAULT_SKIN_ID)!;
}
