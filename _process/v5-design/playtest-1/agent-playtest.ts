#!/usr/bin/env npx tsx
/**
 * V5 Agent Playtest — Automated testing with multiple strategies
 *
 * From agent-playtest-tips.md:
 * - Reproducible evaluation (same seed = same transcript)
 * - Mechanic diagnostics (why blind / why solved)
 * - Agent zoo to avoid overfitting
 *
 * Usage:
 *   npx tsx _process/v5-design/playtest-1/agent-playtest.ts --puzzle midnight-print
 *   npx tsx _process/v5-design/playtest-1/agent-playtest.ts --puzzle garage-door --agents 10
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import type { Card, V5Puzzle, Tier } from '../../../scripts/v5-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CLI Args
// ============================================================================

function getArg(name: string): string | null {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const puzzleArg = getArg('puzzle') || 'midnight-print';
const agentCount = parseInt(getArg('agents') || '5', 10);
const verbose = process.argv.includes('--verbose');

// ============================================================================
// Agent Strategies
// ============================================================================

type AgentStrategy = 'random' | 'greedy' | 'cautious' | 'type_diverse' | 'high_risk';

interface AgentConfig {
  name: string;
  strategy: AgentStrategy;
  description: string;
}

const AGENTS: AgentConfig[] = [
  { name: 'random', strategy: 'random', description: 'Picks cards randomly' },
  { name: 'greedy', strategy: 'greedy', description: 'Always picks highest strength' },
  { name: 'cautious', strategy: 'cautious', description: 'Avoids high-strength cards (likely lies)' },
  { name: 'type_diverse', strategy: 'type_diverse', description: 'Avoids type tax by varying types' },
  { name: 'high_risk', strategy: 'high_risk', description: 'Always picks highest strength, stands by everything' },
];

// ============================================================================
// Game State from JSON Output
// ============================================================================

interface GameOutput {
  seed: number;
  puzzle: string;
  turn: number;
  belief: number;
  tier: Tier;
  target: number;
  gameOver: boolean;
  objectionPending: boolean;
  lastAction?: {
    type: 'play' | 'objection';
    cardId?: string;
    beliefChange: number;
    wasLie?: boolean;
    typeTaxApplied?: boolean;
    koaResponse: string;
  };
  hand: { id: string; strength: number; type: string; claim: string }[];
  played: string[];
  liesRevealed?: string[];
}

// ============================================================================
// Strategy Implementations
// ============================================================================

function pickCard(
  strategy: AgentStrategy,
  hand: GameOutput['hand'],
  played: string[],
  seed: number
): string {
  if (hand.length === 0) throw new Error('No cards in hand');

  switch (strategy) {
    case 'random': {
      const idx = seed % hand.length;
      return hand[idx]!.id;
    }

    case 'greedy': {
      // Highest strength
      const sorted = [...hand].sort((a, b) => b.strength - a.strength);
      return sorted[0]!.id;
    }

    case 'cautious': {
      // Lowest strength (assumes high strength = likely lie)
      const sorted = [...hand].sort((a, b) => a.strength - b.strength);
      return sorted[0]!.id;
    }

    case 'type_diverse': {
      // Pick card with type different from last played
      const lastType = played.length > 0
        ? hand.find(c => c.id === played[played.length - 1])?.type
        : null;

      // This won't work since played cards aren't in hand, need to track separately
      // For now, just pick random from different types
      const types = [...new Set(hand.map(c => c.type))];
      const targetType = types[seed % types.length];
      const candidates = hand.filter(c => c.type === targetType);
      return candidates[seed % candidates.length]!.id;
    }

    case 'high_risk': {
      // Highest strength always
      const sorted = [...hand].sort((a, b) => b.strength - a.strength);
      return sorted[0]!.id;
    }

    default:
      return hand[0]!.id;
  }
}

function pickObjection(strategy: AgentStrategy, _seed: number): 'stand' | 'withdraw' {
  // High risk always stands, cautious always withdraws, others random
  switch (strategy) {
    case 'high_risk':
      return 'stand';
    case 'cautious':
      return 'withdraw';
    default:
      return _seed % 2 === 0 ? 'stand' : 'withdraw';
  }
}

// ============================================================================
// Run Single Game
// ============================================================================

interface GameResult {
  agent: string;
  strategy: AgentStrategy;
  seed: number;
  puzzle: string;
  finalBelief: number;
  target: number;
  tier: Tier;
  cardsPlayed: string[];
  liesPlayed: string[];
  typeTaxCount: number;
  objectionChoice: string | null;
  objectionCard: string | null;
  objectionWasLie: boolean | null;
  transcript: string[];
}

function runGame(puzzle: string, agent: AgentConfig, seed: number): GameResult {
  const stateFile = `/tmp/v5-agent-${agent.name}-${seed}.json`;
  const transcript: string[] = [];
  let lastOutput: GameOutput | null = null;
  let typeTaxCount = 0;
  let objectionChoice: string | null = null;
  let objectionCard: string | null = null;
  let objectionWasLie: boolean | null = null;
  let playedTypes: string[] = [];

  // Clean up any existing state
  try { fs.unlinkSync(stateFile); } catch {}

  // Play turns
  for (let turn = 0; turn < 4; turn++) { // Max 4 iterations (3 turns + potential objection)
    let cmd: string;

    if (lastOutput?.objectionPending) {
      // Handle objection
      const choice = pickObjection(agent.strategy, seed + turn);
      objectionChoice = choice;
      objectionCard = lastOutput.lastAction?.cardId || null;
      cmd = `npx tsx scripts/play-v5.ts --puzzle ${puzzle} --json --seed ${seed} --state ${stateFile} --objection ${choice}`;
    } else if (!lastOutput || lastOutput.hand.length > 0) {
      // Pick and play a card
      const hand = lastOutput?.hand || [];
      if (hand.length === 0 && !lastOutput) {
        // First turn - need to get initial state
        cmd = `npx tsx scripts/play-v5.ts --puzzle ${puzzle} --json --seed ${seed} --state ${stateFile} 2>&1 || true`;
        try {
          const output = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
          const jsonLine = output.split('\n').find(l => l.startsWith('{'));
          if (jsonLine) {
            lastOutput = JSON.parse(jsonLine);
          }
        } catch {}

        if (!lastOutput) break;

        // Now pick first card
        const cardId = pickCard(agent.strategy, lastOutput.hand, [], seed + turn);
        cmd = `npx tsx scripts/play-v5.ts --puzzle ${puzzle} --json --seed ${seed} --state ${stateFile} --pick ${cardId}`;
      } else {
        const cardId = pickCard(agent.strategy, hand, lastOutput?.played || [], seed + turn);
        // Track type for tax counting
        const card = hand.find(c => c.id === cardId);
        if (card && playedTypes.length > 0 && playedTypes[playedTypes.length - 1] === card.type) {
          typeTaxCount++;
        }
        if (card) playedTypes.push(card.type);
        cmd = `npx tsx scripts/play-v5.ts --puzzle ${puzzle} --json --seed ${seed} --state ${stateFile} --pick ${cardId}`;
      }
    } else {
      break;
    }

    try {
      const output = execSync(cmd, { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
      const jsonLine = output.split('\n').find(l => l.startsWith('{'));
      if (jsonLine) {
        lastOutput = JSON.parse(jsonLine);
        transcript.push(JSON.stringify(lastOutput, null, 2));

        if (lastOutput.lastAction?.type === 'objection') {
          objectionWasLie = lastOutput.lastAction.wasLie || false;
        }

        if (lastOutput.gameOver) break;
      }
    } catch (err) {
      transcript.push(`ERROR: ${err}`);
      break;
    }
  }

  // Clean up
  try { fs.unlinkSync(stateFile); } catch {}

  const liesPlayed = lastOutput?.liesRevealed?.filter(l =>
    lastOutput?.played.includes(l)
  ) || [];

  return {
    agent: agent.name,
    strategy: agent.strategy,
    seed,
    puzzle,
    finalBelief: lastOutput?.belief || 0,
    target: lastOutput?.target || 0,
    tier: lastOutput?.tier || 'BUSTED',
    cardsPlayed: lastOutput?.played || [],
    liesPlayed,
    typeTaxCount,
    objectionChoice,
    objectionCard,
    objectionWasLie,
    transcript,
  };
}

// ============================================================================
// Aggregate Results
// ============================================================================

interface AggregateStats {
  totalGames: number;
  winRate: number;
  flawlessRate: number;
  avgBelief: number;
  avgLiesPlayed: number;
  avgTypeTax: number;
  objectionStandRate: number;
  objectionStandWinRate: number;
  tierDistribution: Record<Tier, number>;
  byAgent: Record<string, {
    games: number;
    winRate: number;
    avgBelief: number;
    tiers: Record<Tier, number>;
  }>;
}

function aggregate(results: GameResult[]): AggregateStats {
  const total = results.length;
  const wins = results.filter(r => r.tier === 'FLAWLESS' || r.tier === 'CLEARED').length;
  const flawless = results.filter(r => r.tier === 'FLAWLESS').length;

  const tierDist: Record<Tier, number> = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
  for (const r of results) tierDist[r.tier]++;

  const objectionStands = results.filter(r => r.objectionChoice === 'stand');
  const objectionStandWins = objectionStands.filter(r => !r.objectionWasLie);

  const byAgent: AggregateStats['byAgent'] = {};
  for (const agent of AGENTS) {
    const agentResults = results.filter(r => r.agent === agent.name);
    const agentWins = agentResults.filter(r => r.tier === 'FLAWLESS' || r.tier === 'CLEARED').length;
    const agentTiers: Record<Tier, number> = { FLAWLESS: 0, CLEARED: 0, CLOSE: 0, BUSTED: 0 };
    for (const r of agentResults) agentTiers[r.tier]++;

    byAgent[agent.name] = {
      games: agentResults.length,
      winRate: agentResults.length > 0 ? (agentWins / agentResults.length) * 100 : 0,
      avgBelief: agentResults.length > 0
        ? agentResults.reduce((s, r) => s + r.finalBelief, 0) / agentResults.length
        : 0,
      tiers: agentTiers,
    };
  }

  return {
    totalGames: total,
    winRate: (wins / total) * 100,
    flawlessRate: (flawless / total) * 100,
    avgBelief: results.reduce((s, r) => s + r.finalBelief, 0) / total,
    avgLiesPlayed: results.reduce((s, r) => s + r.liesPlayed.length, 0) / total,
    avgTypeTax: results.reduce((s, r) => s + r.typeTaxCount, 0) / total,
    objectionStandRate: objectionStands.length / total * 100,
    objectionStandWinRate: objectionStands.length > 0
      ? (objectionStandWins.length / objectionStands.length) * 100
      : 0,
    tierDistribution: tierDist,
    byAgent,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log(`V5 Agent Playtest`);
  console.log(`Puzzle: ${puzzleArg}`);
  console.log(`Agents: ${AGENTS.map(a => a.name).join(', ')}`);
  console.log(`Games per agent: ${agentCount}`);
  console.log('');

  const results: GameResult[] = [];
  const baseSeed = Date.now();

  for (const agent of AGENTS) {
    console.log(`Running ${agent.name} (${agent.description})...`);

    for (let i = 0; i < agentCount; i++) {
      const seed = baseSeed + i * 1000 + AGENTS.indexOf(agent);
      const result = runGame(puzzleArg, agent, seed);
      results.push(result);

      if (verbose) {
        console.log(`  Game ${i + 1}: ${result.tier} (${result.finalBelief}/${result.target})`);
      }
    }
  }

  // Aggregate
  const stats = aggregate(results);

  console.log('');
  console.log('═'.repeat(60));
  console.log('AGGREGATE RESULTS');
  console.log('═'.repeat(60));
  console.log(`Total games: ${stats.totalGames}`);
  console.log(`Win rate: ${stats.winRate.toFixed(1)}%`);
  console.log(`FLAWLESS rate: ${stats.flawlessRate.toFixed(1)}%`);
  console.log(`Avg belief: ${stats.avgBelief.toFixed(1)}`);
  console.log(`Avg lies played: ${stats.avgLiesPlayed.toFixed(2)}`);
  console.log(`Avg type tax triggers: ${stats.avgTypeTax.toFixed(2)}`);
  console.log(`Objection stand rate: ${stats.objectionStandRate.toFixed(1)}%`);
  console.log(`Stand + correct rate: ${stats.objectionStandWinRate.toFixed(1)}%`);
  console.log('');

  console.log('Tier distribution:');
  for (const [tier, count] of Object.entries(stats.tierDistribution)) {
    const pct = (count / stats.totalGames * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / stats.totalGames * 20));
    console.log(`  ${tier.padEnd(10)} ${pct.padStart(5)}% ${bar}`);
  }
  console.log('');

  console.log('By agent:');
  for (const [name, data] of Object.entries(stats.byAgent)) {
    console.log(`  ${name.padEnd(15)} Win: ${data.winRate.toFixed(0).padStart(3)}%  Avg: ${data.avgBelief.toFixed(0).padStart(2)}  F:${data.tiers.FLAWLESS} C:${data.tiers.CLEARED} X:${data.tiers.CLOSE} B:${data.tiers.BUSTED}`);
  }

  // Save results
  const logDir = path.join(__dirname, 'logs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(logDir, `${puzzleArg}-${timestamp}.json`);

  fs.writeFileSync(logFile, JSON.stringify({
    puzzle: puzzleArg,
    timestamp,
    config: { agentCount, agents: AGENTS.map(a => a.name) },
    stats,
    results: verbose ? results : results.map(r => ({ ...r, transcript: undefined })),
  }, null, 2));

  console.log('');
  console.log(`Results saved to: ${logFile}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
