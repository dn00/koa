import { writable } from 'svelte/store';
import type { EngineLogEntry, Command } from '@aura/project-paranoia';
// @ts-ignore — Vite ?worker import returns a Worker constructor
import MotherWorker from '$lib/workers/mother.worker.ts?worker';
import type { CrewVM, ThreatVM, DoubtVM, BioVM } from '$lib/types/worker-protocol';

export type { CrewVM, ThreatVM, DoubtVM, BioVM } from '$lib/types/worker-protocol';
export type LogEntry = EngineLogEntry;

type Snapshot = {
  integrity: number;
  suspicion: number;
  resetStage: string;
  cpu: number;
  power: number;
  logs: EngineLogEntry[];
  crew: CrewVM[];
  threats: ThreatVM[];
  doubts: DoubtVM[];
  bios: BioVM[];
  day: number;
  phase: string;
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
export const day = writable(0);
export const phase = writable('unknown');

export const logs = writable<LogEntry[]>([]);
export const crew = writable<CrewVM[]>([]);
export const threats = writable<ThreatVM[]>([]);
export const doubts = writable<DoubtVM[]>([]);
export const bios = writable<BioVM[]>([]);

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
  day.set(s.day);
  phase.set(s.phase);
  logs.set(s.logs);
  crew.set(s.crew);
  threats.set(s.threats);
  doubts.set(s.doubts);
  bios.set(s.bios);
}

function post(msg: InMsg) {
  if (!worker) return;
  worker.postMessage(msg);
}

export function start(options?: { seed?: number; tickMs?: number; fastStart?: boolean }) {
  if (typeof window === 'undefined') return;
  if (worker) return;

  workerStatus.set('starting');
  workerError.set(null);

  worker = new MotherWorker();

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

  worker.postMessage({
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
    workerStatus.set('stopped');
    return;
  }

  try {
    worker.postMessage({ type: 'STOP' });
    worker.terminate();
  } finally {
    worker = null;
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
