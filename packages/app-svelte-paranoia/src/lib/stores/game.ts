import { writable } from 'svelte/store';
import type { EngineLogEntry, Command } from '@aura/project-paranoia';

export type LogEntry = EngineLogEntry;

export type CrewVM = {
  id: string;
  name: string;
  room: string | null;
  roomStale: boolean;
  alive: boolean | null;
  hp: number | null;
  intent: string;
};

export type ThreatVM = {
  type: string;
  room: string | null;
  message: string;
  severity: 'HIGH' | 'MED';
  confidence: 'CONFIRMED' | 'UNCERTAIN' | 'CONFLICTING';
};

type Snapshot = {
  integrity: number;
  suspicion: number;
  resetStage: string;
  cpu: number;
  power: number;
  logs: LogEntry[];
  crew: CrewVM[];
  threats: ThreatVM[];
};

type OutMsg =
  | { type: 'READY' }
  | { type: 'SNAPSHOT'; snapshot: Snapshot }
  | { type: 'ERROR'; message: string; stack?: string };

type InMsg =
  | { type: 'INIT'; seed?: number; fastStart?: boolean; tickMs?: number }
  | { type: 'START'; tickMs?: number }
  | { type: 'STOP' }
  | { type: 'DISPATCH'; command: Command }
  | { type: 'SNAPSHOT' };

// --- STORES ---
export const integrity = writable(0);
export const suspicion = writable(0);
export const resetStage = writable('unknown');
export const cpu = writable(0);
export const power = writable(0);

export const logs = writable<LogEntry[]>([]);
export const crew = writable<CrewVM[]>([]);
export const threats = writable<ThreatVM[]>([]);

export const workerStatus = writable<'stopped' | 'starting' | 'ready' | 'error'>('stopped');
export const workerError = writable<string | null>(null);

let worker: Worker | null = null;
let started = false;

function applySnapshot(s: Snapshot) {
  integrity.set(s.integrity);
  suspicion.set(s.suspicion);
  resetStage.set(s.resetStage);
  cpu.set(s.cpu);
  power.set(s.power);
  logs.set(s.logs);
  crew.set(s.crew);
  threats.set(s.threats);
}

function post(msg: InMsg) {
  if (!worker) return;
  worker.postMessage(msg);
}

export function start(options?: { seed?: number; tickMs?: number; fastStart?: boolean }) {
  if (typeof window === 'undefined') return;
  if (started) return;
  started = true;

  workerStatus.set('starting');
  workerError.set(null);

  worker = new Worker(new URL('../workers/mother.worker.ts', import.meta.url), {
    type: 'module'
  });

  worker.onmessage = (e: MessageEvent<OutMsg>) => {
    const msg = e.data;
    if (msg.type === 'READY') {
      workerStatus.set('ready');
      return;
    }
    if (msg.type === 'SNAPSHOT') {
      applySnapshot(msg.snapshot);
      return;
    }
    if (msg.type === 'ERROR') {
      workerStatus.set('error');
      workerError.set(msg.message + (msg.stack ? `\n${msg.stack}` : ''));
      return;
    }
  };

  worker.onerror = (err) => {
    workerStatus.set('error');
    workerError.set(String((err as any)?.message ?? err));
  };

  post({
    type: 'INIT',
    seed: options?.seed ?? Date.now(),
    fastStart: options?.fastStart ?? true,
    tickMs: options?.tickMs ?? 1000
  });

  // Prevent orphan workers during HMR
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      stop();
    });
  }
}

export function stop() {
  if (!worker) {
    started = false;
    workerStatus.set('stopped');
    return;
  }

  try {
    post({ type: 'STOP' });
    worker.terminate();
  } finally {
    worker = null;
    started = false;
    workerStatus.set('stopped');
  }
}

export function requestSnapshot() {
  post({ type: 'SNAPSHOT' });
}

export function dispatch(command: Command) {
  post({ type: 'DISPATCH', command });
}

// Handy for debugging in DevTools
if (typeof window !== 'undefined') {
  (window as any)._pp = {
    start,
    stop,
    dispatch,
    requestSnapshot
  };
}
