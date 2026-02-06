import { describe, test, expect } from 'vitest';
import type { CaseConfig, EvidenceItem } from '../src/types.js';
import { findContradictions } from '../src/validators.js';

describe('smoke test', () => {
  test('can import from src', () => {
    const evidence: EvidenceItem[] = [];
    const config = { culpritId: 'npc_1' } as CaseConfig;
    const contradictions = findContradictions(evidence, config);
    expect(contradictions).toEqual([]);
  });

  test('findContradictions finds correct pair when multiple items exist', () => {
    const config = { suspects: ['npc_1'], culpritId: 'npc_1' } as any;
    const evidence: any[] = [
      { id: 'e1', kind: 'presence', npc: 'npc_1', window: 'W1', place: 'P1', cites: [] },
      { id: 'e2', kind: 'presence', npc: 'npc_1', window: 'W1', place: 'P1', cites: [] },
      { id: 'e3', kind: 'presence', npc: 'npc_1', window: 'W1', place: 'P2', cites: [] },
    ];
    const contradictions = findContradictions(evidence, config);
    expect(contradictions.length).toBe(1);
    expect(contradictions[0].evidenceA).toBe('e1');
    expect(contradictions[0].evidenceB).toBe('e3');
  });
});
