import { writable } from 'svelte/store';

export type Tab = 'OPS' | 'LOG' | 'CREW' | 'TRUST' | 'STATION';
export type Sheet = 'ACT' | 'VERIFY' | 'CURATE' | 'CREW' | null;

export const activeTab = writable<Tab>('OPS');
export const activeSheet = writable<Sheet>(null);

// Selection state
export const focusRoomId = writable<string | null>(null);
export const targetCrewId = writable<string | null>(null);
