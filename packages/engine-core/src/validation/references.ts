/**
 * Reference validation for puzzle packs.
 * Task 012: Pack Reference Validation
 *
 * Validates that all ID references in a pack resolve correctly.
 */

import type { CardId, CounterId, Result } from '../types/index.js';
import { ok, err } from '../types/index.js';
import { validatePuzzlePack, type PuzzlePackSchema, type ValidationError } from './schemas.js';

/**
 * Validate all ID references in a puzzle pack.
 *
 * AC-1: dealtHand CardIds must exist in cards array
 * AC-2: counter targets must be valid CardIds
 * AC-3: card.refutes must be valid CounterIds
 * EC-1: Empty pack is valid (no puzzles/cards → ok)
 * EC-2: Multiple errors are collected (reports all issues)
 *
 * @param pack - A schema-validated puzzle pack
 * @returns Result with pack or validation errors
 */
export function validateReferences(
  pack: PuzzlePackSchema
): Result<PuzzlePackSchema, ValidationError[]> {
  const errors: ValidationError[] = [];

  // Build indexes of all valid IDs
  const cardIds = new Set<CardId>();
  const counterIds = new Set<CounterId>();

  // Index all cards
  for (const card of pack.cards) {
    cardIds.add(card.id);
  }

  // Index all counters (from pack-level counters array)
  for (const counter of pack.counters) {
    counterIds.add(counter.id);
  }

  // Also index puzzle-level counters
  for (const puzzle of pack.puzzles) {
    for (const counter of puzzle.counters) {
      counterIds.add(counter.id);
    }
  }

  // Validate each puzzle's references
  for (let i = 0; i < pack.puzzles.length; i++) {
    const puzzle = pack.puzzles[i]!;
    const puzzlePath = `puzzles[${i}]`;

    // AC-1: Validate dealtHand references
    for (let j = 0; j < puzzle.dealtHand.length; j++) {
      const cardId = puzzle.dealtHand[j]!;
      if (!cardIds.has(cardId)) {
        errors.push({
          path: `${puzzlePath}.dealtHand[${j}]`,
          message: `references non-existent card: ${cardId}`,
        });
      }
    }

    // Validate puzzle-level counter references
    for (let j = 0; j < puzzle.counters.length; j++) {
      const counter = puzzle.counters[j]!;
      const counterPath = `${puzzlePath}.counters[${j}]`;

      // AC-2: Validate counter targets reference existing cards
      for (let k = 0; k < counter.targets.length; k++) {
        const targetId = counter.targets[k]!;
        if (!cardIds.has(targetId)) {
          errors.push({
            path: `${counterPath}.targets[${k}]`,
            message: `references non-existent card: ${targetId}`,
          });
        }
      }

      // Validate counter.refutedBy if present
      if (counter.refutedBy !== undefined && !cardIds.has(counter.refutedBy)) {
        errors.push({
          path: `${counterPath}.refutedBy`,
          message: `references non-existent card: ${counter.refutedBy}`,
        });
      }
    }
  }

  // Validate pack-level counter references
  for (let i = 0; i < pack.counters.length; i++) {
    const counter = pack.counters[i]!;
    const counterPath = `counters[${i}]`;

    // AC-2: Validate counter targets reference existing cards
    for (let j = 0; j < counter.targets.length; j++) {
      const targetId = counter.targets[j]!;
      if (!cardIds.has(targetId)) {
        errors.push({
          path: `${counterPath}.targets[${j}]`,
          message: `references non-existent card: ${targetId}`,
        });
      }
    }

    // Validate counter.refutedBy if present
    if (counter.refutedBy !== undefined && !cardIds.has(counter.refutedBy)) {
      errors.push({
        path: `${counterPath}.refutedBy`,
        message: `references non-existent card: ${counter.refutedBy}`,
      });
    }
  }

  // AC-3: Validate card.refutes references existing counters
  for (let i = 0; i < pack.cards.length; i++) {
    const card = pack.cards[i]!;
    if (card.refutes !== undefined && !counterIds.has(card.refutes)) {
      errors.push({
        path: `cards[${i}].refutes`,
        message: `references non-existent counter: ${card.refutes}`,
      });
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(pack);
}

/**
 * Full validation: schema + references.
 *
 * Combines schema validation (Task 011) with reference validation.
 *
 * @param data - Unknown data to validate
 * @returns Result with validated pack or all validation errors
 */
export function validatePuzzlePackFull(
  data: unknown
): Result<PuzzlePackSchema, ValidationError[]> {
  // First, validate the schema
  const schemaResult = validatePuzzlePack(data);
  if (!schemaResult.ok) {
    return schemaResult;
  }

  // Then, validate references
  return validateReferences(schemaResult.value);
}
