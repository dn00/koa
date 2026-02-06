# Feature: CaseBundle Publish Format

**Status:** idea
**Priority:** P0 (required for publishing)
**Spec Reference:** Section 17.2

---

## Goal

Define the canonical format for publishing cases - what gets sent to clients, what's encrypted, what's validated.

---

## Current State

Have `CaseConfig` but it contains the solution (culpritId, crimeWindow, etc). Can't send this to clients.

```typescript
// Current - contains spoilers
interface CaseConfig {
  seed: number;
  culpritId: NPCId;      // SPOILER
  crimeWindow: WindowId; // SPOILER
  // ...
}
```

---

## Proposed: CaseBundle

```typescript
interface CaseBundle {
  // Metadata
  version: string;           // "1.0.0"
  bundleId: string;          // "daily-2026-02-05" or "seed-4821"
  rulesetVersion: string;    // For determinism across updates
  generatedAt: string;       // ISO timestamp

  // Public data (sent to client)
  seed: number;
  difficulty: DifficultyTier;
  world: WorldSnapshot;      // Places, NPCs, devices, items (no schedules?)
  suspects: NPCId[];

  // Validation proof (public)
  validatorReport: {
    solvable: boolean;
    playable: boolean;
    signalType: SignalType;
    estimatedMinAP: number;
  };

  // Solution (encrypted or server-held)
  encryptedSolution?: string;  // AES-encrypted JSON
  solutionHash: string;        // SHA256 for verification without decryption
}

interface Solution {
  culpritId: NPCId;
  crimeType: CrimeType;
  crimeWindow: WindowId;
  crimePlace: PlaceId;
  method: MethodId;
  motive: MotiveType;
}
```

---

## Key Decisions

### What goes in WorldSnapshot?
- [x] Places (layout, adjacency)
- [x] NPCs (names, roles)
- [x] Items (names, starting places)
- [x] Devices (types, locations)
- [ ] Schedules? Probably not - derived during play

### Solution encryption
**Option A:** Encrypt with daily key, client decrypts after solve
**Option B:** Server validates, never sends solution
**Option C:** Hash only - client checks answer against hash

Recommend **Option C** for simplicity:
```typescript
const solutionHash = sha256(JSON.stringify({
  who: 'carol',
  what: 'theft',
  when: 'W3'
}));
// Client hashes their answer, compares
```

### Bundle storage
- Daily bundles: `bundles/daily/2026-02-05.json`
- Archive: `bundles/archive/{seed}.json`
- Or single API endpoint returning today's bundle

---

## Validation Report

Include proof that case was validated:

```typescript
interface ValidatorReport {
  solvable: boolean;
  solvabilityScore: number;      // 0-1
  playable: boolean;
  apMargin: number;              // Spare AP after min solve
  signalType: SignalType;
  signalStrength: SignalStrength;
  keystoneExists: boolean;
  contradictionCount: number;
  difficulty: DifficultyTier;
  generationTime: number;        // ms
}
```

---

## Anti-Cheat Considerations

1. **Seed alone is enough to regenerate** - Client could run simulate() locally
   - Accept this for v1 (honor system)
   - Later: server-side evidence revelation only

2. **Solution hash leaks answer length** - Not really, all solutions same structure

3. **Timing attacks** - Comparing hashes is fast, no issue

---

## TODO

1. [ ] Define `CaseBundle` interface in types.ts
2. [ ] Define `Solution` interface
3. [ ] Add `generateBundle(seed)` function
4. [ ] Add solution hashing utility
5. [ ] Add bundle validation (verify hash matches regenerated case)
6. [ ] CLI command: `--export-bundle`
7. [ ] Bundle storage strategy (files vs API)

---

## Dependencies

- [x] CaseConfig exists
- [ ] Solvability guarantee (Feature 001) - for reliable validator report
- [ ] Daily seed system (Feature 002) - bundles are what gets published

---

## Notes

- Keep bundle format stable - version it
- Consider CBOR or msgpack for smaller bundles (later optimization)
- Bundle should be enough to play offline (all evidence derivable from seed)
