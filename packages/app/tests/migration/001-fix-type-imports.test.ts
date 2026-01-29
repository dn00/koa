/**
 * Test 001: Fix Type Imports
 *
 * Verifies that all TypeScript imports from @hsh/engine-core are correct
 * and that the app compiles without "Module has no exported member" errors.
 */

import { describe, test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const APP_SRC_DIR = path.resolve(__dirname, '../../src');

/**
 * Helper to read a file and check its imports
 */
function getImportsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const importRegex = /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]@hsh\/engine-core['"]/g;
  const imports: string[] = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const namedImports = match[1]
      .split(',')
      .map(i => i.trim().replace(/^type\s+/, ''))
      .filter(i => i.length > 0);
    imports.push(...namedImports);
  }

  return imports;
}

/**
 * Helper to find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('AC-1: All import statements compile', () => {
  test('no TypeScript compilation errors from missing exports', () => {
    // This will be validated by the build process
    // We check that no files import non-existent types
    const invalidTypes = ['EvidenceCard', 'Puzzle', 'RunState', 'RunStatus',
                         'GameEvent', 'Concern', 'Scrutiny', 'CounterEvidence',
                         'KOAMood', 'deriveState', 'runStarted', 'cardsSubmitted',
                         'concernAddressed', 'scrutinyIncreased', 'runEnded'];

    const allFiles = findTsFiles(APP_SRC_DIR);
    const filesWithInvalidImports: Array<{file: string, imports: string[]}> = [];

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      const invalid = imports.filter(i => invalidTypes.includes(i));
      if (invalid.length > 0) {
        filesWithInvalidImports.push({ file: path.relative(APP_SRC_DIR, file), imports: invalid });
      }
    }

    expect(filesWithInvalidImports).toEqual([]);
  });
});

describe('AC-2: Card type replaces EvidenceCard', () => {
  test('all files use Card instead of EvidenceCard', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import EvidenceCard`).not.toContain('EvidenceCard');
    }
  });

  test('Card is imported where needed', () => {
    // Check specific files that should have Card
    const filesToCheck = [
      'components/EvidenceCard/EvidenceCard.tsx',
      'components/hand/HandCarousel.tsx',
      'components/story/StoryTimeline.tsx',
      'hooks/useSubmitSequence.ts',
      'animations/submitSequence.ts'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(APP_SRC_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        const imports = getImportsFromFile(fullPath);
        // Either imports Card or doesn't import anything from engine-core
        if (imports.length > 0) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          // If file uses card-related functionality, it should import Card
          if (content.includes('Card') || content.includes('card')) {
            expect(imports.some(i => i === 'Card' || i.includes('Card')),
                   `${relPath} should import Card if it uses cards`).toBeTruthy();
          }
        }
      }
    }
  });
});

describe('AC-3: V5Puzzle type replaces Puzzle', () => {
  test('all files use V5Puzzle instead of Puzzle', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import Puzzle`).not.toContain('Puzzle');
    }
  });

  test('V5Puzzle is imported in gameStore', () => {
    const gameStorePath = path.join(APP_SRC_DIR, 'stores/gameStore.ts');
    if (fs.existsSync(gameStorePath)) {
      const content = fs.readFileSync(gameStorePath, 'utf-8');
      // Either imports V5Puzzle or has been migrated to not need it
      if (content.includes('puzzle') || content.includes('Puzzle')) {
        const imports = getImportsFromFile(gameStorePath);
        expect(imports.some(i => i === 'V5Puzzle'),
               'gameStore should import V5Puzzle if it uses puzzles').toBeTruthy();
      }
    }
  });
});

describe('AC-4: Tier type replaces RunStatus', () => {
  test('all files use Tier instead of RunStatus', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import RunStatus`).not.toContain('RunStatus');
    }
  });

  test('Tier is imported where status is needed', () => {
    const resultScreenPath = path.join(APP_SRC_DIR, 'screens/results/ResultScreen.tsx');
    if (fs.existsSync(resultScreenPath)) {
      const content = fs.readFileSync(resultScreenPath, 'utf-8');
      // If file uses tier/status functionality, should import Tier
      if (content.includes('tier') || content.includes('status')) {
        const imports = getImportsFromFile(resultScreenPath);
        expect(imports.some(i => i === 'Tier'),
               'ResultScreen should import Tier if it uses tier/status').toBeTruthy();
      }
    }
  });
});

describe('AC-5: Event-related imports removed', () => {
  test('no files import GameEvent', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import GameEvent`).not.toContain('GameEvent');
    }
  });

  test('no files import event creators', () => {
    const eventCreators = ['deriveState', 'runStarted', 'cardsSubmitted',
                          'concernAddressed', 'scrutinyIncreased', 'runEnded'];
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      for (const creator of eventCreators) {
        expect(imports, `${file} should not import ${creator}`).not.toContain(creator);
      }
    }
  });
});

describe('EC-1: Files with multiple MVP imports', () => {
  test('gameStore.ts has all imports replaced or removed', () => {
    const gameStorePath = path.join(APP_SRC_DIR, 'stores/gameStore.ts');
    if (!fs.existsSync(gameStorePath)) {
      return; // Skip if file doesn't exist
    }

    const imports = getImportsFromFile(gameStorePath);
    const invalidTypes = ['EvidenceCard', 'Puzzle', 'RunState', 'RunStatus',
                         'GameEvent', 'deriveState', 'runStarted', 'cardsSubmitted',
                         'concernAddressed', 'scrutinyIncreased', 'runEnded'];

    const invalidImports = imports.filter(i => invalidTypes.includes(i));
    expect(invalidImports, 'gameStore should have no invalid MVP imports').toEqual([]);
  });
});

describe('ERR-1: Import of completely removed type (Scrutiny, Concern)', () => {
  test('Scrutiny imports are removed', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import Scrutiny`).not.toContain('Scrutiny');
    }
  });

  test('Concern imports are removed', () => {
    const allFiles = findTsFiles(APP_SRC_DIR);

    for (const file of allFiles) {
      const imports = getImportsFromFile(file);
      expect(imports, `${file} should not import Concern`).not.toContain('Concern');
    }
  });

  test('files with removed types have TODO comments', () => {
    const filesToCheck = [
      'components/hud/ConcernChip.tsx',
      'components/hud/ScrutinyIndicator.tsx',
      'screens/run/RunScreen.tsx'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(APP_SRC_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Should have either TODO comment or be completely migrated
        const hasTodo = content.includes('TODO') || content.includes('@ts-expect-error');
        const hasNoInvalidImports = !getImportsFromFile(fullPath).some(i =>
          ['Concern', 'Scrutiny'].includes(i)
        );

        expect(hasNoInvalidImports, `${relPath} should not import Concern/Scrutiny`).toBeTruthy();
        // If file still references these concepts, it should have TODOs
        if (content.includes('concern') || content.includes('scrutiny')) {
          expect(hasTodo, `${relPath} should have TODO markers for V5 migration`).toBeTruthy();
        }
      }
    }
  });
});
