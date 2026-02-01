#!/usr/bin/env npx tsx
/**
 * CLI for validating V1 Lite puzzles
 *
 * Usage: npx tsx scripts/validate-puzzle.ts <puzzle-file.ts>
 * Example: npx tsx scripts/validate-puzzle.ts src/packs/mower-puzzle.ts
 */

import { execSync } from 'child_process';
import path from 'path';
import { validateV1Lite, calculatePuzzleStats, formatPuzzleStats } from '../src/packs/v1-lite-validator.js';
import type { V1LiteCardWithEvidence } from '../src/packs/v1-lite-validator.js';

/**
 * Check for duplicate object keys using TypeScript compiler.
 * TS1117: "An object literal cannot have multiple properties with the same name."
 */
function checkDuplicateKeysWithTsc(filePath: string): { passed: boolean; errors: string[] } {
  try {
    // Run tsc --noEmit and capture errors
    execSync(`npx tsc --noEmit "${filePath}" 2>&1`, { encoding: 'utf-8' });
    return { passed: true, errors: [] };
  } catch (e: unknown) {
    const output = (e as { stdout?: string }).stdout || '';
    const lines = output.split('\n');

    // Filter for TS1117 (duplicate key) errors
    const duplicateErrors = lines.filter((line: string) => line.includes('TS1117'));

    if (duplicateErrors.length === 0) {
      // Other TS errors, not duplicate keys - ignore for this check
      return { passed: true, errors: [] };
    }

    return {
      passed: false,
      errors: duplicateErrors.map((line: string) => {
        // Extract line number and clean up message
        const match = line.match(/\((\d+),\d+\).*TS1117:(.*)/);
        if (match) {
          return `Line ${match[1]}: ${match[2].trim()}`;
        }
        return line;
      }),
    };
  }
}

async function main() {
  const puzzlePath = process.argv[2];
  if (!puzzlePath) {
    console.error('Usage: npx tsx scripts/validate-puzzle.ts <puzzle-file.ts>');
    console.error('Example: npx tsx scripts/validate-puzzle.ts src/packs/mower-puzzle.ts');
    process.exit(1);
  }

  // Import the puzzle dynamically - resolve relative to cwd
  const resolvedPath = path.resolve(process.cwd(), puzzlePath);

  // First check for duplicate keys using TypeScript compiler
  const dupeCheck = checkDuplicateKeysWithTsc(resolvedPath);
  if (!dupeCheck.passed) {
    console.log('\n=== SOURCE CHECK ===\n');
    console.log('❌ DUPLICATE KEYS DETECTED:');
    for (const err of dupeCheck.errors.slice(0, 10)) {
      console.log(`  ✗ ${err}`);
    }
    if (dupeCheck.errors.length > 10) {
      console.log(`  ... and ${dupeCheck.errors.length - 10} more`);
    }
    console.log('\nFix duplicate keys before continuing.\n');
    process.exit(1);
  }

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
