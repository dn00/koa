import { describe, test, expect } from 'vitest';
import type {
  CaseConfig,
  EvidenceItem,
  PresenceEvidence,
  DeviceLogEvidence,
  MotiveEvidence,
  SignalAnalysis,
} from '../src/types.js';
import { analyzeSignal } from '../src/validators.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<CaseConfig> = {}): CaseConfig {
  return {
    seed: 1,
    suspects: ['npc_culprit', 'npc_red1', 'npc_red2', 'npc_red3'],
    culpritId: 'npc_culprit',
    crimeType: 'theft',
    crimeMethod: {
      type: 'theft',
      methodId: 'grabbed',
      description: 'stole the sourdough',
      funnyMethod: 'while everyone was arguing about thermostats',
    },
    targetItem: 'item_sourdough',
    crimeWindow: 'W3',
    crimePlace: 'kitchen',
    hiddenPlace: 'garage',
    motive: {
      type: 'envy',
      description: 'jealous of the sourdough',
      funnyReason: 'it got more likes',
    },
    suspiciousActs: [],
    ...overrides,
  };
}

function presence(
  id: string,
  npc: string,
  window: string,
  place: string,
): PresenceEvidence {
  return { id, kind: 'presence', cites: [], npc, window, place };
}

function deviceLog(
  id: string,
  opts: {
    device?: string;
    deviceType?: 'door_sensor' | 'motion_sensor' | 'wifi_presence' | 'camera';
    window?: string;
    place?: string;
    detail?: string;
    actor?: string;
  } = {},
): DeviceLogEvidence {
  return {
    id,
    kind: 'device_log',
    cites: [],
    device: opts.device ?? 'dev_1',
    deviceType: opts.deviceType ?? 'door_sensor',
    window: opts.window ?? 'W3',
    place: opts.place ?? 'kitchen',
    detail: opts.detail ?? 'Door opened',
    actor: opts.actor,
  };
}

function motiveEvidence(
  id: string,
  suspect: string,
): MotiveEvidence {
  return {
    id,
    kind: 'motive',
    cites: [],
    suspect,
    gossipSource: 'npc_red1',
    hint: 'seems jealous',
    motiveHint: 'envy',
  };
}

// ---------------------------------------------------------------------------
// AC-1: Self-contradiction detection
// ---------------------------------------------------------------------------

describe('AC-1: Self-contradiction detection', () => {
  test('culprit claims two different places in same window → self_contradiction', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      presence('p2', 'npc_culprit', 'W3', 'kitchen'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.signalType).toBe('self_contradiction');
    expect(result.signalStrength).toBe('strong');
  });
});

// ---------------------------------------------------------------------------
// AC-2: Device contradiction detection
// ---------------------------------------------------------------------------

describe('AC-2: Device contradiction detection', () => {
  test('culprit claims bedroom but door sensor shows kitchen → device_contradiction', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Culprit claims they were in bedroom during W3
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      // But door sensor shows someone opened kitchen door in W3 (actor = culprit)
      deviceLog('d1', {
        window: 'W3',
        place: 'kitchen',
        deviceType: 'door_sensor',
        actor: 'npc_culprit',
      }),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.signalType).toBe('device_contradiction');
    expect(result.signalStrength).toBe('strong');
  });
});

// ---------------------------------------------------------------------------
// AC-3: Scene presence detection
// ---------------------------------------------------------------------------

describe('AC-3: Scene presence detection', () => {
  test('device log places culprit at crime scene during crime window → scene_presence', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Device log at crime scene during crime window, actor is culprit
      deviceLog('d1', {
        window: 'W3',
        place: 'kitchen', // crimePlace
        actor: 'npc_culprit',
      }),
      // No presence contradiction (culprit doesn't claim to be elsewhere)
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.signalType).toBe('scene_presence');
    expect(result.signalStrength).toBe('medium');
    expect(result.keystonePair).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AC-4: Opportunity-only detection
// ---------------------------------------------------------------------------

describe('AC-4: Opportunity-only detection', () => {
  test('only motive evidence → opportunity_only, hasSignal false', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      motiveEvidence('m1', 'npc_culprit'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(false);
    expect(result.signalType).toBe('opportunity_only');
    expect(result.signalStrength).toBe('weak');
  });

  test('culprit has presence but no contradiction → opportunity_only', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Single presence claim, no conflicting evidence, not at crime scene
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(false);
    expect(result.signalType).toBe('opportunity_only');
    expect(result.signalStrength).toBe('weak');
    expect(result.details).toContain('no catchable contradiction');
  });
});

// ---------------------------------------------------------------------------
// AC-5: Returns keystone pair when signal found
// ---------------------------------------------------------------------------

describe('AC-5: Returns keystone pair', () => {
  test('self-contradiction returns keystonePair with both evidence IDs', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      presence('p2', 'npc_culprit', 'W3', 'kitchen'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.keystonePair).toBeDefined();
    expect(result.keystonePair!.evidenceA).toBe('p1');
    expect(result.keystonePair!.evidenceB).toBe('p2');
  });

  test('self-contradiction returns CORRECT keystonePair when multiple items exist', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      presence('p2', 'npc_culprit', 'W3', 'bedroom'), // Same as p1
      presence('p3', 'npc_culprit', 'W3', 'kitchen'), // Different
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.keystonePair).toBeDefined();

    const evA = evidence.find(e => e.id === result.keystonePair!.evidenceA) as PresenceEvidence;
    const evB = evidence.find(e => e.id === result.keystonePair!.evidenceB) as PresenceEvidence;
    expect(evA.place).not.toBe(evB.place);
  });

  test('device contradiction returns keystonePair with presence + device log IDs', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      deviceLog('d1', {
        window: 'W3',
        place: 'kitchen',
        actor: 'npc_culprit',
      }),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.keystonePair).toBeDefined();
    expect(result.keystonePair!.evidenceA).toBe('p1');
    expect(result.keystonePair!.evidenceB).toBe('d1');
  });
});

// ---------------------------------------------------------------------------
// EC-1: Multiple signal types present → returns strongest
// ---------------------------------------------------------------------------

describe('EC-1: Multiple signal types → strongest wins', () => {
  test('self-contradiction + device contradiction → self_contradiction', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Self-contradiction: culprit in bedroom AND kitchen in W3
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      presence('p2', 'npc_culprit', 'W3', 'kitchen'),
      // Device contradiction: door sensor also catches them
      deviceLog('d1', {
        window: 'W3',
        place: 'kitchen',
        actor: 'npc_culprit',
      }),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.signalType).toBe('self_contradiction');
    expect(result.signalStrength).toBe('strong');
  });
});

// ---------------------------------------------------------------------------
// EC-2: Signal in non-crime window still counts
// ---------------------------------------------------------------------------

describe('EC-2: Signal in non-crime window', () => {
  test('culprit lies about W2 (not crime window) → still valid signal', () => {
    const config = makeConfig(); // crimeWindow = W3
    const evidence: EvidenceItem[] = [
      presence('p1', 'npc_culprit', 'W2', 'bedroom'),
      presence('p2', 'npc_culprit', 'W2', 'kitchen'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.signalType).toBe('self_contradiction');
  });
});

// ---------------------------------------------------------------------------
// EC-3: Innocent with more contradictions than culprit
// ---------------------------------------------------------------------------

describe('EC-3: Innocent more contradictions than culprit', () => {
  test('red herring has 3 contradictions, culprit has 1 → still hasSignal for culprit', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Culprit: 1 self-contradiction
      presence('p1', 'npc_culprit', 'W3', 'bedroom'),
      presence('p2', 'npc_culprit', 'W3', 'kitchen'),
      // Red herring: 3 contradictions (W2, W3, W4)
      presence('r1', 'npc_red1', 'W2', 'bedroom'),
      presence('r2', 'npc_red1', 'W2', 'garage'),
      presence('r3', 'npc_red1', 'W3', 'living_room'),
      presence('r4', 'npc_red1', 'W3', 'garden'),
      presence('r5', 'npc_red1', 'W4', 'bedroom'),
      presence('r6', 'npc_red1', 'W4', 'kitchen'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(true);
    expect(result.signalType).toBe('self_contradiction');
  });
});

// ---------------------------------------------------------------------------
// ERR-1: Missing culprit in evidence
// ---------------------------------------------------------------------------

describe('ERR-1: Missing culprit evidence', () => {
  test('no evidence involving culprit → opportunity_only with details', () => {
    const config = makeConfig();
    const evidence: EvidenceItem[] = [
      // Only evidence about red herrings
      presence('p1', 'npc_red1', 'W3', 'bedroom'),
      presence('p2', 'npc_red2', 'W3', 'kitchen'),
    ];

    const result = analyzeSignal(evidence, config);

    expect(result.hasSignal).toBe(false);
    expect(result.signalType).toBe('opportunity_only');
    expect(result.signalStrength).toBe('weak');
    expect(result.details).toContain('No culprit evidence found');
  });
});

// ---------------------------------------------------------------------------
// ERR-2: Invalid config (no culpritId)
// ---------------------------------------------------------------------------

describe('ERR-2: Invalid config', () => {
  test('missing culpritId throws', () => {
    const config = makeConfig();
    // @ts-expect-error - intentionally removing culpritId
    delete config.culpritId;

    expect(() => analyzeSignal([], config)).toThrow(
      'analyzeSignal requires config.culpritId',
    );
  });
});
