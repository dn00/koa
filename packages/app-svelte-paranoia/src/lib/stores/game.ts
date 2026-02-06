import { writable } from 'svelte/store';

// Core State
export const integrity = writable(82);
export const suspicion = writable(27);
export const resetStage = writable<'STABLE' | 'WHISPERS' | 'COUNTDOWN'>('STABLE');

// Resources
export const cpu = writable(87);
export const power = writable(62);

// Mock Data
export const threats = writable([
    { id: 't1', type: 'FIRE', room: 'airlock_a', severity: 'HIGH', confidence: 'CONFIRMED' },
    { id: 't2', type: 'O2', room: 'cargo', severity: 'MED', confidence: 'UNCERTAIN' }
]);

export const crew = writable([
    { id: 'vega', name: 'VEGA', room: 'bridge', role: 'ENG', status: 'OK' },
    { id: 'rook', name: 'ROOK', room: 'engineering', role: 'SEC', status: 'OK' },
    { id: 'ash', name: 'ASH', room: 'medbay', role: 'MED', status: 'WARN' },
    { id: 'bishop', name: 'BISHOP', room: 'core', role: 'SCI', status: 'OK' }
]);

export interface LogEntry {
    id: string;
    timestamp: string;
    source: 'SYSTEM' | 'MOTHER' | 'BIO' | 'ALERT';
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    severity?: 'HIGH' | 'MED' | 'LOW';
    metadata?: {
        type: 'ROOM' | 'CREW';
        id: string;
    };
}

export const logs = writable<LogEntry[]>([
    { id: '1', timestamp: '08:00:00', source: 'SYSTEM', message: 'MOTHER_OS v4.3.0 INITIALIZED', type: 'success' },
    { id: '2', timestamp: '08:00:05', source: 'MOTHER', message: 'Mag-locks engaged. Containment protocols active.', type: 'info' },
    { id: '3', timestamp: '08:00:12', source: 'BIO', message: 'Crew vital signs normative.', type: 'info', metadata: { type: 'CREW', id: 'ash' } },
    { id: '4', timestamp: '08:15:00', source: 'ALERT', message: 'Abnormal thermal reading in Cargo Bay.', type: 'warning', severity: 'HIGH', metadata: { type: 'ROOM', id: 'cargo' } }
]);
