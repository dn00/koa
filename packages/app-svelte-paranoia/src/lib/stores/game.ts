
import { writable, get } from 'svelte/store';
import {
    MotherEngine,
    type EngineLogEntry,
    type Command,
    perceiveAllCrew,
    perceiveThreats,
    type PerceivedCrew,
    type PerceivedThreat
} from '@aura/project-paranoia';

// Re-export types for component compatibility
export type LogEntry = EngineLogEntry;
export type { PerceivedCrew, PerceivedThreat };

// --- ENGINE INSTANCE ---
// Initialize lazily purely client-side to avoid SSR issues
// For now, we instantiate immediately but guard tick loop
const engine = new MotherEngine({
    seed: Date.now(),
    fastStart: true
});

// --- STORES ---

export const integrity = writable(engine.integrity);
export const suspicion = writable(engine.suspicion);
export const resetStage = writable(engine.state.truth.resetStage);
export const cpu = writable(engine.cpuCycles);
export const power = writable(engine.state.truth.station.power);

// Complex Data
export const logs = writable<LogEntry[]>([]);
export const crew = writable<PerceivedCrew[]>([]);
export const threats = writable<PerceivedThreat[]>([]);

// Data Sync
export function sync() {
    integrity.set(engine.integrity);
    suspicion.set(engine.suspicion);
    resetStage.set(engine.state.truth.resetStage);
    cpu.set(engine.cpuCycles);
    power.set(engine.state.truth.station.power);

    // Logs (copy for reactivity)
    logs.set([...engine.logs]);

    // Perception
    crew.set(perceiveAllCrew(engine.state));
    threats.set(perceiveThreats(engine.state));
}

// Tick Loop (Client Only)
if (typeof window !== 'undefined') {
    // Initial sync
    sync();

    // Game Loop
    setInterval(() => {
        engine.tick();
        sync();
    }, 1000);
}

// --- ACTIONS ---

export function dispatch(command: Command) {
    // Execute command via engine
    // In future: handle costs and failure feedback
    engine.dispatch(command);

    // Immediate sync for responsiveness
    sync();
}

// Debug Access
if (typeof window !== 'undefined') {
    (window as any)._engine = engine;
}
