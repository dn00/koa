import { describe, test, expect } from 'vitest';
import type {
  World,
  Place,
  Device,
  NPC,
  CaseConfig,
  SimEvent,
  EvidenceItem,
  DeviceLogEvidence,
} from '../src/types.js';
import { WINDOWS } from '../src/types.js';
import { injectMinimalSignal } from '../src/sim.js';
import { createRng } from '../src/kernel/rng.js';
import { deriveEvidence } from '../src/evidence.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeWorld(opts: {
  places?: Place[];
  devices?: Device[];
  npcs?: NPC[];
} = {}): World {
  const defaultPlaces: Place[] = [
    { id: 'kitchen', name: 'Kitchen', adjacent: ['living', 'bedroom'] },
    { id: 'living', name: 'Living Room', adjacent: ['kitchen', 'bedroom', 'office'] },
    { id: 'bedroom', name: 'Bedroom', adjacent: ['kitchen', 'living'] },
    { id: 'office', name: 'Office', adjacent: ['living'] },
  ];
  const defaultDevices: Device[] = [
    { id: 'door_kitchen_living', type: 'door_sensor', place: 'kitchen', connectsTo: 'living' },
    { id: 'door_kitchen_bedroom', type: 'door_sensor', place: 'kitchen', connectsTo: 'bedroom' },
    { id: 'door_living_bedroom', type: 'door_sensor', place: 'living', connectsTo: 'bedroom' },
    { id: 'door_living_office', type: 'door_sensor', place: 'living', connectsTo: 'office' },
  ];
  return {
    places: opts.places ?? defaultPlaces,
    devices: opts.devices ?? defaultDevices,
    items: [],
    npcs: opts.npcs ?? [],
    relationships: [],
  };
}

function makeConfig(overrides: Partial<CaseConfig> = {}): CaseConfig {
  return {
    seed: 1,
    suspects: ['npc_culprit', 'npc_red1', 'npc_red2'],
    culpritId: 'npc_culprit',
    crimeType: 'theft',
    crimeMethod: {
      type: 'theft',
      methodId: 'grabbed',
      description: 'stole the sourdough',
      funnyMethod: 'while everyone argued about thermostats',
    },
    targetItem: 'item_sourdough',
    crimeWindow: 'W3',
    crimePlace: 'kitchen',
    hiddenPlace: 'office',
    motive: { type: 'envy', description: 'jealous', funnyReason: 'likes' },
    suspiciousActs: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AC-1: Injects door event catching culprit
// ---------------------------------------------------------------------------

describe('AC-1: Injects door event catching culprit', () => {
  test('creates DOOR_OPENED event with actor=culpritId targeting door adjacent to crime scene', () => {
    const world = makeWorld();
    const config = makeConfig();
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('DOOR_OPENED');
    expect(result!.actor).toBe('npc_culprit');
    // Event targets a door adjacent to the crime scene (kitchen)
    const door = world.devices.find(d => d.id === result!.target);
    expect(door).toBeDefined();
    expect(door!.type).toBe('door_sensor');
  });

  test('event is added to the events array', () => {
    const world = makeWorld();
    const config = makeConfig();
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(events.length).toBe(1);
    expect(events[0]).toBe(result);
  });
});

// ---------------------------------------------------------------------------
// AC-2: Uses seeded RNG for determinism
// ---------------------------------------------------------------------------

describe('AC-2: Determinism via seeded RNG', () => {
  test('same seed + world + config produces identical event', () => {
    const world = makeWorld();
    const config = makeConfig();

    const events1: SimEvent[] = [];
    const rng1 = createRng(42);
    const result1 = injectMinimalSignal(world, events1, config, rng1);

    const events2: SimEvent[] = [];
    const rng2 = createRng(42);
    const result2 = injectMinimalSignal(world, events2, config, rng2);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1!.id).toBe(result2!.id);
    expect(result1!.tick).toBe(result2!.tick);
    expect(result1!.target).toBe(result2!.target);
    expect(result1!.place).toBe(result2!.place);
  });
});

// ---------------------------------------------------------------------------
// AC-3: Targets existing door sensor
// ---------------------------------------------------------------------------

describe('AC-3: Targets existing door sensor', () => {
  test('injected event target matches a real device ID from world.devices', () => {
    const world = makeWorld();
    const config = makeConfig();
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(result).not.toBeNull();
    const deviceIds = world.devices.map(d => d.id);
    expect(deviceIds).toContain(result!.target);
  });
});

// ---------------------------------------------------------------------------
// AC-4: Event occurs during crime window
// ---------------------------------------------------------------------------

describe('AC-4: Event in crime window', () => {
  test('event window matches config.crimeWindow and tick is within W3 range', () => {
    const world = makeWorld();
    const config = makeConfig({ crimeWindow: 'W3' });
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(result).not.toBeNull();
    expect(result!.window).toBe('W3');
    const w3 = WINDOWS.find(w => w.id === 'W3')!;
    expect(result!.tick).toBeGreaterThanOrEqual(w3.startTick);
    expect(result!.tick).toBeLessThanOrEqual(w3.endTick);
  });
});

// ---------------------------------------------------------------------------
// AC-5: Evidence derivation picks up injected event
// ---------------------------------------------------------------------------

describe('AC-5: Evidence derivation picks up injected event', () => {
  test('deriveEvidence produces DeviceLogEvidence citing injected event ID', () => {
    // Build a world with NPCs so deriveEvidence works
    const npcs: NPC[] = [
      {
        id: 'npc_culprit',
        name: 'Carol',
        role: 'roommate',
        schedule: [
          { window: 'W1', place: 'bedroom', activity: 'sleeping' },
          { window: 'W2', place: 'bedroom', activity: 'reading' },
          { window: 'W3', place: 'bedroom', activity: 'reading' },
          { window: 'W4', place: 'living', activity: 'watching tv' },
          { window: 'W5', place: 'living', activity: 'watching tv' },
          { window: 'W6', place: 'bedroom', activity: 'sleeping' },
        ],
      },
      {
        id: 'npc_red1',
        name: 'Bob',
        role: 'roommate',
        schedule: [
          { window: 'W1', place: 'kitchen', activity: 'cooking' },
          { window: 'W2', place: 'living', activity: 'relaxing' },
          { window: 'W3', place: 'living', activity: 'relaxing' },
          { window: 'W4', place: 'bedroom', activity: 'reading' },
          { window: 'W5', place: 'bedroom', activity: 'reading' },
          { window: 'W6', place: 'bedroom', activity: 'sleeping' },
        ],
      },
    ];
    const world = makeWorld({ npcs });
    const config = makeConfig();
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const injected = injectMinimalSignal(world, events, config, rng);
    expect(injected).not.toBeNull();

    const evidence = deriveEvidence(world, events, config);
    const deviceLogs = evidence.filter(e => e.kind === 'device_log') as DeviceLogEvidence[];

    // At least one device log cites the injected event
    const citingLog = deviceLogs.find(d => d.cites.includes(injected!.id));
    expect(citingLog).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// EC-1: No door at crime scene (1-hop fallback)
// ---------------------------------------------------------------------------

describe('EC-1: No door at crime scene', () => {
  test('finds door sensor 1 hop away when crime scene has no adjacent doors', () => {
    // Crime at basement. Basement→garage has NO door. Garage→office HAS door.
    const places: Place[] = [
      { id: 'basement', name: 'Basement', adjacent: ['garage'] },
      { id: 'garage', name: 'Garage', adjacent: ['basement', 'office'] },
      { id: 'office', name: 'Office', adjacent: ['garage'] },
    ];
    const devices: Device[] = [
      // NO door between basement and garage
      // Door between garage and office
      { id: 'door_garage_office', type: 'door_sensor', place: 'garage', connectsTo: 'office' },
    ];
    const world = makeWorld({ places, devices });
    const config = makeConfig({ crimePlace: 'basement' });
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(result).not.toBeNull();
    expect(result!.target).toBe('door_garage_office');
  });
});

// ---------------------------------------------------------------------------
// EC-2: Crime scene is isolated
// ---------------------------------------------------------------------------

describe('EC-2: Crime scene is isolated', () => {
  test('returns null when no reachable door sensors exist', () => {
    const places: Place[] = [
      { id: 'island', name: 'Island', adjacent: ['bridge'] },
      { id: 'bridge', name: 'Bridge', adjacent: ['island'] },
    ];
    // No door sensors at all
    const devices: Device[] = [];
    const world = makeWorld({ places, devices });
    const config = makeConfig({ crimePlace: 'island' });
    const events: SimEvent[] = [];
    const rng = createRng(42);

    const result = injectMinimalSignal(world, events, config, rng);

    expect(result).toBeNull();
    expect(events.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// EC-3: Multiple valid doors
// ---------------------------------------------------------------------------

describe('EC-3: Multiple valid doors', () => {
  test('uses RNG to pick among multiple doors deterministically', () => {
    // Kitchen has doors to living AND bedroom
    const world = makeWorld();
    const config = makeConfig({ crimePlace: 'kitchen' });

    // Run with same seed multiple times → same door chosen
    const results: string[] = [];
    for (let i = 0; i < 5; i++) {
      const events: SimEvent[] = [];
      const rng = createRng(42);
      const result = injectMinimalSignal(world, events, config, rng);
      results.push(result!.target as string);
    }

    // All should pick the same door (deterministic)
    expect(new Set(results).size).toBe(1);

    // Different seed → might pick different door
    const events2: SimEvent[] = [];
    const rng2 = createRng(999);
    const result2 = injectMinimalSignal(world, events2, config, rng2);
    // At minimum, it should still pick a valid door
    const doorIds = world.devices.filter(d => d.type === 'door_sensor').map(d => d.id);
    expect(doorIds).toContain(result2!.target);
  });
});

// ---------------------------------------------------------------------------
// ERR-1: Events array is frozen/immutable
// ---------------------------------------------------------------------------

describe('ERR-1: Frozen events array', () => {
  test('throws error when events array is frozen', () => {
    const world = makeWorld();
    const config = makeConfig();
    const events: SimEvent[] = Object.freeze([]) as SimEvent[];
    const rng = createRng(42);

    expect(() => injectMinimalSignal(world, events, config, rng)).toThrow(
      'Events array must be mutable for injection',
    );
  });
});

// ---------------------------------------------------------------------------
// ERR-2: Config missing required fields
// ---------------------------------------------------------------------------

describe('ERR-2: Config missing required fields', () => {
  test('throws when culpritId is missing', () => {
    const world = makeWorld();
    const config = makeConfig();
    // @ts-expect-error - intentionally removing culpritId
    delete config.culpritId;
    const events: SimEvent[] = [];
    const rng = createRng(42);

    expect(() => injectMinimalSignal(world, events, config, rng)).toThrow(
      'injectMinimalSignal requires culpritId and crimePlace',
    );
  });

  test('throws when crimePlace is missing', () => {
    const world = makeWorld();
    const config = makeConfig();
    // @ts-expect-error - intentionally removing crimePlace
    delete config.crimePlace;
    const events: SimEvent[] = [];
    const rng = createRng(42);

    expect(() => injectMinimalSignal(world, events, config, rng)).toThrow(
      'injectMinimalSignal requires culpritId and crimePlace',
    );
  });
});
