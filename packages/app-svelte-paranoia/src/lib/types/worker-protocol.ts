import type { EngineLogEntry, Command } from '@aura/project-paranoia';

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

export type DoubtVM = {
  id: string;
  topic: string;
  severity: number;
};

export type BioVM = {
  id: string;
  heartRate: string;
  cortisol: string;
  tremor: boolean;
  sleepDebt: string;
  socialIndex: string;
  assessment: string;
};

export type Snapshot = {
  integrity: number;
  suspicion: number;
  resetStage: string;
  cpu: number;
  power: number;
  day: number;
  phase: string;
  logs: EngineLogEntry[];
  crew: CrewVM[];
  threats: ThreatVM[];
  doubts: DoubtVM[];
  bios: BioVM[];
};

export type InMsg =
  | { type: 'INIT'; seed?: number; fastStart?: boolean; tickMs?: number }
  | { type: 'START'; tickMs?: number }
  | { type: 'STOP' }
  | { type: 'DISPATCH'; command: Command }
  | { type: 'SNAPSHOT' };

export type OutMsg =
  | { type: 'READY' }
  | { type: 'SNAPSHOT'; snapshot: Snapshot }
  | { type: 'ERROR'; message: string; stack?: string };
