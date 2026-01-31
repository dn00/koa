#!/usr/bin/env npx tsx
/**
 * CLI for validating V1 Lite puzzles
 *
 * Usage: npx tsx scripts/validate-puzzle.ts <puzzle-file.ts>
 * Example: npx tsx scripts/validate-puzzle.ts src/packs/mower-puzzle.ts
 */

import path from 'path';
import { validateV1Lite, calculatePuzzleStats, formatPuzzleStats } from '../src/packs/v1-lite-validator.js';
import type { V1LiteCardWithEvidence } from '../src/packs/v1-lite-validator.js';

async function main() {
  const puzzlePath = process.argv[2];
  if (!puzzlePath) {
    console.error('Usage: npx tsx scripts/validate-puzzle.ts <puzzle-file.ts>');
    console.error('Example: npx tsx scripts/validate-puzzle.ts src/packs/mower-puzzle.ts');
    process.exit(1);
  }

  // Import the puzzle dynamically - resolve relative to cwd
  const resolvedPath = path.resolve(process.cwd(), puzzlePath);
  const puzzleModule = await import(resolvedPath);
  const puzzle = puzzleModule.default || Object.values(puzzleModule).find((v: unknown) => v && typeof v === 'object' && 'cards' in (v as object));

  if (!puzzle || !puzzle.cards) {
    console.error('Could not find puzzle export in', puzzlePath);
    process.exit(1);
  }

  console.log(`\n=== Validating: ${puzzle.name || puzzlePath} ===\n`);

  // Run validation
  const result = validateV1Lite(puzzle.cards, puzzle.lies || [], {
    isMini: true,
    koaBarks: puzzle.koaBarks,
    dialogue: {
      openingLine: puzzle.openingLine,
      verdicts: puzzle.verdicts,
    },
  });

  // Print results
  console.log(result.passed ? '✅ PASSED' : '❌ FAILED');
  console.log('');

  for (const check of result.checks) {
    const icon = check.passed ? '✓' : '✗';
    const color = check.passed ? '' : '❌ ';
    console.log(`${color}${icon} ${check.id}: ${check.detail}`);
  }

  // Print stats
  console.log('\n=== STATS ===\n');
  const stats = calculatePuzzleStats(puzzle.cards as readonly V1LiteCardWithEvidence[], puzzle.target);
  console.log(formatPuzzleStats(stats, puzzle.target));

  process.exit(result.passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
