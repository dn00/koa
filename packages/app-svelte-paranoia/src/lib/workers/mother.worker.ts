/// <reference lib="webworker" />

import {
  MotherEngine,
  perceiveAllCrew,
  perceiveThreats,
  getAllBiometrics,
} from '@aura/project-paranoia';
import type { CrewVM, ThreatVM, DoubtVM, BioVM, Snapshot, InMsg, OutMsg } from '$lib/types/worker-protocol';

let engine: MotherEngine | null = null;
let interval: number | null = null;
let tickMs = 1000;

function toThreatVM(t: ReturnType<typeof perceiveThreats>[number]): ThreatVM {
  const sev = t.severity === 'CRITICAL' ? 'HIGH' : 'MED';

  let confidence: ThreatVM['confidence'] = 'CONFIRMED';
  if (t.confidence === 'uncertain') confidence = 'UNCERTAIN';
  if (t.confidence === 'conflicting') confidence = 'CONFLICTING';

  return {
    type: t.system,
    room: t.place ?? null,
    message: t.message,
    severity: sev,
    confidence
  };
}

function makeSnapshot(): Snapshot {
  if (!engine) {
    return {
      integrity: 0,
      suspicion: 0,
      resetStage: 'unknown',
      cpu: 0,
      power: 0,
      day: 0,
      phase: 'unknown',
      logs: [],
      crew: [],
      threats: [],
      doubts: [],
      bios: []
    };
  }

  const crewVM: CrewVM[] = perceiveAllCrew(engine.state).map((c) => ({
    id: c.id,
    name: c.name,
    room: c.place ?? null,
    roomStale: c.placeStale,
    alive: c.alive,
    hp: c.hp,
    intent: c.intent
  }));

  const threatsVM: ThreatVM[] = perceiveThreats(engine.state).map(toThreatVM);

  const doubtsVM: DoubtVM[] = engine.state.perception.activeDoubts
    .filter((d: any) => !d.resolved)
    .map((d: any) => ({
      id: d.id,
      topic: d.topic,
      severity: d.severity
    }));

  const biosVM: BioVM[] = getAllBiometrics(engine.state).map((b) => ({
    id: b.id,
    heartRate: b.heartRate,
    cortisol: b.cortisol,
    tremor: b.tremor,
    sleepDebt: b.sleepDebt,
    socialIndex: b.socialIndex,
    assessment: b.assessment,
  }));

  return {
    integrity: engine.integrity,
    suspicion: engine.suspicion,
    resetStage: engine.state.truth.resetStage,
    cpu: engine.cpuCycles,
    power: engine.state.truth.station.power,
    day: engine.state.truth.day,
    phase: engine.state.truth.phase,
    logs: [...engine.logs],
    crew: crewVM,
    threats: threatsVM,
    doubts: doubtsVM,
    bios: biosVM
  };
}

function post(msg: OutMsg) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);
}

function startLoop() {
  if (!engine) return;
  stopLoop();
  interval = self.setInterval(() => {
    try {
      engine!.tick();
      post({ type: 'SNAPSHOT', snapshot: makeSnapshot() });
    } catch (err: any) {
      post({ type: 'ERROR', message: String(err?.message ?? err), stack: err?.stack });
    }
  }, tickMs) as unknown as number;
}

function stopLoop() {
  if (interval !== null) {
    self.clearInterval(interval);
    interval = null;
  }
}

self.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data;

  try {
    if (msg.type === 'INIT') {
      tickMs = msg.tickMs ?? tickMs;
      engine = new MotherEngine({
        seed: msg.seed ?? Date.now(),
        fastStart: msg.fastStart ?? true
      });

      post({ type: 'READY' });
      post({ type: 'SNAPSHOT', snapshot: makeSnapshot() });
      startLoop();
      return;
    }

    if (msg.type === 'START') {
      tickMs = msg.tickMs ?? tickMs;
      startLoop();
      return;
    }

    if (msg.type === 'STOP') {
      stopLoop();
      return;
    }

    if (msg.type === 'DISPATCH') {
      if (!engine) return;
      engine.dispatch(msg.command);
      post({ type: 'SNAPSHOT', snapshot: makeSnapshot() });
      return;
    }

    if (msg.type === 'SNAPSHOT') {
      post({ type: 'SNAPSHOT', snapshot: makeSnapshot() });
      return;
    }
  } catch (err: any) {
    post({ type: 'ERROR', message: String(err?.message ?? err), stack: err?.stack });
  }
};
